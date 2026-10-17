'use client'

/**
 * Walkthrough runner — intro.js under the hood.
 *
 * intro.js handles the hard parts we should not be writing ourselves: the spotlight cut-out,
 * tooltip placement and flipping, focus handling, keyboard navigation and scrolling. What we
 * add on top is the one thing it does not do — carrying a tour **across pages**.
 *
 * A tour is split into "legs" at each `goto`. We run intro.js over one leg, and when the leg
 * ends we navigate and start the next.
 *
 * WHY THIS WAS GLITCHY, AND WHAT THE RULES ARE NOW. Three separate faults made a tour
 * reappear after it had been closed, and again on reload:
 *
 *   1. Dismissal was detected by the ABSENCE of the resume record in sessionStorage. The
 *      record was written when the tour was armed and was still sitting there, so closing the
 *      card never counted as a dismissal: `onClose` was never called, the runner stayed
 *      mounted, and the next route change started a leg again. Now a close is a close,
 *      tracked explicitly, and storage is not consulted to decide what the person meant.
 *   2. The resume record was read out of sessionStorage but never consumed, so every reload
 *      read it again and restarted the tour from the top. The hand-off is now a module
 *      variable, which is alive exactly as long as it should be: it survives the remount
 *      that each navigation causes, and dies on reload. A hard refresh therefore ends a
 *      tour, which is what someone pressing F5 is asking for.
 *   3. `runLeg` waits up to eight seconds for its first target to paint, and nothing
 *      cancelled that wait. Navigate during it and the stale leg started intro.js on the new
 *      page while the new leg started its own, so two tours ran at once and closing one left
 *      the other behind. Every run now carries a generation; a stale one stops before it
 *      starts.
 */
import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import 'intro.js/introjs.css'
import { markDone, type TourStep, type Walkthrough } from './walkthroughs'

// intro.js reaches for `document` the moment it is imported, which breaks prerendering.
// It is only ever needed once someone actually starts a tour, so it loads on demand.
type IntroInstance = { setOptions: (o: any) => any; start: () => void; exit: (f?: boolean) => void
                       oncomplete: (fn: () => void) => any; onexit: (fn: () => void) => any }

/**
 * The hand-off channel: a module variable, deliberately NOT storage.
 *
 * It has to survive a remount of the host, because every console page renders the shell
 * itself, so the header and this runner are torn down and rebuilt on each navigation. It
 * must NOT survive a reload, because that is how a closed tour kept coming back. A module
 * variable is exactly that: alive for as long as the tab's JavaScript is, gone on refresh.
 *
 * It is written when a tour is armed and before every cross-page leg, and TAKEN when it is
 * handed over. One record starts exactly one leg.
 */
let pending: { id: string; leg: number } | null = null

/**
 * How many times we have pushed to reach a given leg, surviving the remount that the push
 * itself causes. Without this, a tour pointing at a screen the viewer's role cannot open
 * pushes, is bounced by the guard, remounts with a fresh count, and pushes forever.
 */
let pushes: Record<string, number> = {}

/** The old build parked its position here, where a reload read it again and again. */
const STALE_KEYS = ['following.tour.resume', 'following.tour.arm']
function clearStaleStorage() {
  try { for (const k of STALE_KEYS) sessionStorage.removeItem(k) } catch { /* blocked */ }
}

interface Leg { goto?: string; steps: TourStep[] }

/**
 * Arm a tour from anywhere — the "Show me how" page, a link, a button on an empty state.
 *
 * The runner itself lives in the header, because it has to survive the route changes a tour
 * makes. So starting a tour is not a function call into the runner; it is parking a record
 * the runner already knows how to pick up, then navigating. Returns the path the caller
 * should push, or null when the tour starts on whatever page you are already on.
 */
export function armTour(tour: Walkthrough): string | null {
  pending = { id: tour.id, leg: 0 }
  pushes = {}
  clearStaleStorage()
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

/**
 * Wait for the leg's first target to exist before intro.js measures anything.
 *
 * Screens here fetch their contents, so for the first second they are skeletons and none of
 * the `data-tour` elements exist yet. intro.js was starting into that: every step found no
 * element, so the whole tour played as centred cards with nothing highlighted, and any step
 * marked `onlyIfPresent` was dropped as "not for this role" when it was merely not painted.
 *
 * `alive` lets the caller abandon the wait. Without it, a navigation mid-wait left a second
 * tour queued up behind the first.
 */
async function waitForTarget(
  selector: string | undefined, alive: () => boolean, ms = 8000,
): Promise<void> {
  if (!selector) return
  const until = Date.now() + ms
  while (Date.now() < until) {
    if (!alive()) return
    if (document.querySelector(selector)) return
    await new Promise(r => setTimeout(r, 120))
  }
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

  const legs = useRef<Leg[]>(legsOf(tour))
  const legIndex = useRef(startLeg)
  const intro = useRef<IntroInstance | null>(null)
  /** Bumped by every navigation, teardown and finish. Work from an older generation stops. */
  const gen = useRef(0)
  /** A tour ends once. Nothing restarts a leg after this. */
  const ended = useRef(false)
  /**
   * What we are about to cause ourselves. intro.js fires `onexit` after `oncomplete`, and
   * again when we call `exit()` on teardown; neither of those is somebody closing the card.
   */
  const ours = useRef<'nothing' | 'advancing' | 'teardown'>('nothing')

  const finish = useCallback((completedTour: boolean) => {
    if (ended.current) return
    ended.current = true
    gen.current += 1
    pending = null
    pushes = {}
    ours.current = 'teardown'
    try { intro.current?.exit(true) } catch { /* already gone */ }
    intro.current = null
    if (completedTour) markDone(tour.id)
    onClose()
  }, [tour.id, onClose])

  const runLeg = useCallback(async (i: number, myGen: number) => {
    const alive = () => myGen === gen.current && !ended.current

    const leg = legs.current[i]
    if (!leg) return finish(true)

    /** Move to the next leg, or end the tour if this was the last one. */
    const advance = () => {
      const next = legs.current[i + 1]
      if (!next) return finish(true)
      legIndex.current = i + 1
      ours.current = 'advancing'
      if (next.goto && next.goto !== pathname) {
        // The effect picks the leg up on arrival; bumping the generation stops this one.
        // The record is for the remount the navigation causes, which loses these refs.
        gen.current += 1
        pending = { id: tour.id, leg: i + 1 }
        router.push(next.goto)
      } else {
        runLeg(i + 1, ++gen.current)
      }
    }

    // The page paints its skeleton first; wait for the real thing before measuring.
    await waitForTarget(leg.steps.find(s => s.target)?.target, alive)
    await new Promise(r => setTimeout(r, 120))   // one frame for layout to settle
    if (!alive()) return                          // navigated or closed while we waited

    // Steps marked `onlyIfPresent` are dropped when their target is not on this screen.
    // That is how one lesson fits every role: the shortcut strip shows a different set of
    // buttons to each person, and nobody is told about a button they do not have.
    const steps = leg.steps
      .filter(s => !s.onlyIfPresent || (s.target && document.querySelector(s.target)))
      .map(toIntroStep)
    // Everything on this leg belonged to someone else. Move on rather than showing nothing.
    if (!steps.length) return advance()

    const isLast = i === legs.current.length - 1

    const mod = await import('intro.js')
    if (!alive()) return
    const introJs = (mod.default ?? mod) as unknown as () => IntroInstance
    const inst = introJs()
    intro.current = inst
    inst.setOptions({
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
    inst.oncomplete(() => { if (isLast) finish(true); else advance() })
    inst.onexit(() => {
      // Only an exit we did not cause is a dismissal. Anything else is our own bookkeeping.
      if (ours.current !== 'nothing') { ours.current = 'nothing'; return }
      finish(false)
    })

    ours.current = 'nothing'   // from here on, an exit means the person closed it
    inst.start()
  }, [pathname, router, finish, tour.id])

  useEffect(() => {
    if (ended.current) return

    const i = legIndex.current
    const leg = legs.current[i]
    if (!leg) { finish(true); return }

    // If this leg belongs to another page, go there first; the effect re-runs on arrival.
    if (leg.goto && leg.goto !== pathname) {
      const k = tour.id + ':' + i
      pushes[k] = (pushes[k] || 0) + 1
      if (pushes[k] > 2) {
        // We asked and did not arrive — almost always because the viewer's role cannot open
        // that screen. End the tour rather than fight the route guard. The count is module
        // level because the push remounts us, which would reset a ref every time.
        finish(false)
        return
      }
      pending = { id: tour.id, leg: i }
      router.push(leg.goto)
      return
    }

    // Let the page paint before intro.js measures anything.
    const myGen = ++gen.current
    const t = setTimeout(() => runLeg(i, myGen), 380)
    return () => {
      clearTimeout(t)
      gen.current += 1
      ours.current = 'teardown'
      try { intro.current?.exit(true) } catch { /* already gone */ }
      intro.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}

/**
 * Pick up a tour that was armed elsewhere — from /how, or a link, or a button on a screen.
 *
 * The record is **taken**, not read. Leaving it in place is what made a tour come back: any
 * reload read it again and started from the top, and so did any remount of the host (the
 * sidebar settling once permissions loaded was enough). One record starts exactly one tour.
 */
export function useTourResume(
  all: Walkthrough[], open: (t: Walkthrough, leg: number) => void,
) {
  const pathname = usePathname()
  useEffect(() => {
    // Anything the old build left in storage would restart a tour on every reload.
    clearStaleStorage()
    const record = pending
    if (!record) return
    pending = null
    const tour = all.find(t => t.id === record.id)
    if (tour) open(tour, record.leg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
