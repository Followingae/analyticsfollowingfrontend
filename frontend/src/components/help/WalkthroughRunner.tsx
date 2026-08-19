'use client'

/**
 * Walkthrough runner — intro.js under the hood.
 *
 * intro.js handles the hard parts we should not be writing ourselves: the spotlight cut-out,
 * tooltip placement and flipping, focus handling, keyboard navigation and scrolling. What we
 * add on top is the one thing it does not do — carrying a tour **across pages**.
 *
 * A tour is split into "legs" at each `goto`. We run intro.js over one leg, and when the leg
 * ends we navigate and start the next. The position is parked in sessionStorage so it
 * survives the route change, and is cleared when the tour finishes or is dismissed.
 */
import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import 'intro.js/introjs.css'
import { markDone, type TourStep, type Walkthrough } from './walkthroughs'

// intro.js reaches for `document` the moment it is imported, which breaks prerendering.
// It is only ever needed once someone actually starts a tour, so it loads on demand.
type IntroInstance = { setOptions: (o: any) => any; start: () => void; exit: (f?: boolean) => void
                       oncomplete: (fn: () => void) => any; onexit: (fn: () => void) => any }

const RESUME_KEY = 'following.tour.resume'

interface Leg { goto?: string; steps: TourStep[] }

/**
 * Arm a tour from anywhere — the "Show me how" page, a link, a button on an empty state.
 *
 * The runner itself lives in the header, because it has to survive the route changes a tour
 * makes. So starting a tour is not a function call into the runner; it is parking the same
 * resume record the runner already knows how to pick up, then navigating. Returns the path
 * the caller should push, or null when the tour starts on whatever page you are already on.
 */
export function armTour(tour: Walkthrough): string | null {
  sessionStorage.setItem(RESUME_KEY, JSON.stringify({ id: tour.id, leg: 0 }))
  const goto = legsOf(tour)[0]?.goto
  // Absolute or nothing. A relative value would resolve against whatever page armed the
  // tour and send someone to a URL that does not exist.
  return goto && goto.startsWith('/') ? goto : null
}

/** Split at every `goto`, so each leg lives entirely on one page. */
function legsOf(tour: Walkthrough): Leg[] {
  const legs: Leg[] = []
  let cur: Leg = { steps: [] }
  for (const s of tour.steps) {
    if (s.goto && cur.steps.length) { legs.push(cur); cur = { goto: s.goto, steps: [] } }
    else if (s.goto) { cur.goto = s.goto }
    cur.steps.push(s)
  }
  if (cur.steps.length) legs.push(cur)
  return legs
}

/** A step whose target is missing renders centred rather than breaking the run. */
function toIntroStep(s: TourStep) {
  const el = s.target ? document.querySelector(s.target) : null
  return {
    ...(el ? { element: el as HTMLElement } : {}),
    title: s.title,
    intro: `<p>${s.body}</p>`,
    position: s.place || 'auto',
  }
}

export function WalkthroughRunner({
  tour, startLeg = 0, onClose,
}: { tour: Walkthrough; startLeg?: number; onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const legIndex = useRef(startLeg)
  const instance = useRef<IntroInstance | null>(null)
  // How many times we have tried to reach the current leg's page. A tour can point at a
  // screen the viewer's role cannot open: the guard sends them back, we push again, and the
  // two bounce off each other forever. One attempt, then give up quietly.
  const attempts = useRef<Record<number, number>>({})

  const finish = useCallback((completedTour: boolean) => {
    sessionStorage.removeItem(RESUME_KEY)
    if (completedTour) markDone(tour.id)
    onClose()
  }, [tour.id, onClose])

  const runLeg = useCallback(async (i: number) => {
    const legs = legsOf(tour)
    const leg = legs[i]
    if (!leg) return finish(true)

    // Steps marked `onlyIfPresent` are dropped when their target is not on this screen.
    // That is how one lesson fits every role: the shortcut strip shows a different set of
    // buttons to each person, and nobody is told about a button they do not have.
    const steps = leg.steps
      .filter(s => !s.onlyIfPresent || (s.target && document.querySelector(s.target)))
      .map(toIntroStep)
    if (!steps.length) {
      // Everything on this leg belonged to someone else. Move on rather than showing nothing.
      if (i === legs.length - 1) return finish(true)
      legIndex.current = i + 1
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ id: tour.id, leg: i + 1 }))
      const nxt = legs[i + 1]
      if (nxt.goto && nxt.goto !== pathname) router.push(nxt.goto)
      else runLeg(i + 1)
      return
    }
    const isLast = i === legs.length - 1

    const mod = await import('intro.js')
    const introJs = (mod.default ?? mod) as unknown as () => IntroInstance
    const intro = introJs()
    instance.current = intro
    intro.setOptions({
      steps,
      showBullets: false,
      showProgress: true,
      exitOnOverlayClick: false,
      disableInteraction: false,
      scrollToElement: true,
      scrollTo: 'tooltip',
      overlayOpacity: 0.55,
      nextLabel: 'Next',
      prevLabel: 'Back',
      doneLabel: isLast ? 'Done' : 'Continue',
      tooltipClass: 'following-intro',
      highlightClass: 'following-intro-highlight',
    })

    // "Done" on a middle leg means: go to the next page and carry on.
    intro.oncomplete(() => {
      if (isLast) return finish(true)
      const next = legs[i + 1]
      legIndex.current = i + 1
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ id: tour.id, leg: i + 1 }))
      if (next.goto && next.goto !== pathname) router.push(next.goto)
      else runLeg(i + 1)
    })
    intro.onexit(() => {
      // onexit also fires after oncomplete; only treat a real dismissal as an exit.
      if (!sessionStorage.getItem(RESUME_KEY)) finish(false)
    })

    intro.start()
  }, [tour, pathname, router, finish])

  useEffect(() => {
    const legs = legsOf(tour)
    const leg = legs[legIndex.current]
    if (!leg) return

    // If this leg belongs to another page, go there first; the effect re-runs on arrival.
    if (leg.goto && leg.goto !== pathname) {
      const i = legIndex.current
      attempts.current[i] = (attempts.current[i] || 0) + 1
      if (attempts.current[i] > 1) {
        // We asked once and did not arrive — almost always because the viewer's role cannot
        // open that screen. End the tour rather than fight the route guard.
        finish(false)
        return
      }
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ id: tour.id, leg: i }))
      router.push(leg.goto)
      return
    }

    // Let the page paint before intro.js measures anything.
    const t = setTimeout(() => runLeg(legIndex.current), 380)
    return () => {
      clearTimeout(t)
      try { instance.current?.exit(true) } catch { /* already gone */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}

/**
 * Resume a tour that navigated to another page mid-run.
 *
 * The record has to be *consumed*, not merely read. It used to be left in place, so any
 * re-render that remounted the host — the sidebar settling once permissions loaded was
 * enough — read it again and restarted the tour, which is why the card appeared to reopen
 * over and over. Taking it out of storage the moment it is handed to the runner means one
 * record starts exactly one leg; the runner writes the next one when that leg completes.
 */
export function useTourResume(all: Walkthrough[], open: (t: Walkthrough, leg: number) => void) {
  const pathname = usePathname()
  const consumed = useRef<string | null>(null)
  useEffect(() => {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (!raw || consumed.current === raw) return
    consumed.current = raw
    try {
      const { id, leg } = JSON.parse(raw)
      const tour = all.find(t => t.id === id)
      if (tour) open(tour, leg)
    } catch {
      sessionStorage.removeItem(RESUME_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
