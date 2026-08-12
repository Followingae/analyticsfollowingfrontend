'use client'

/**
 * The walkthrough runner: a spotlight over the real UI, and one short card at a time.
 *
 * Deliberately not a modal tour of screenshots — it points at the actual element on the
 * actual screen, so what someone learns is where the thing really is. If a step's target
 * cannot be found (a different screen, a role that hides it), the card falls back to centre
 * rather than breaking the run.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { markDone, type Walkthrough } from './walkthroughs'

const PAD = 8
const CARD_W = 320

type Box = { top: number; left: number; width: number; height: number } | null

/** Poll briefly for the target — a step may navigate, and the DOM needs a moment. */
function useTarget(selector: string | undefined, key: number): Box {
  const [box, setBox] = useState<Box>(null)
  useEffect(() => {
    if (!selector) { setBox(null); return }
    let alive = true
    let tries = 0
    const find = () => {
      if (!alive) return
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        // Let the scroll settle before measuring, or the spotlight lands in the wrong place.
        setTimeout(() => {
          if (!alive) return
          const r = el.getBoundingClientRect()
          setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
        }, 260)
      } else if (tries++ < 24) {
        setTimeout(find, 120)
      } else {
        setBox(null)
      }
    }
    find()
    return () => { alive = false }
  }, [selector, key])

  // Keep the spotlight glued to the element while the page moves.
  useEffect(() => {
    if (!selector) return
    const sync = () => {
      const el = document.querySelector(selector) as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [selector])

  return box
}

export function WalkthroughRunner({
  tour, onClose,
}: { tour: Walkthrough; onClose: () => void }) {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [mounted, setMounted] = useState(false)
  const navigated = useRef<string | null>(null)
  const step = tour.steps[i]

  useEffect(() => setMounted(true), [])

  // A step may live on another screen; navigate once per step.
  useEffect(() => {
    if (step?.goto && navigated.current !== `${i}:${step.goto}`) {
      navigated.current = `${i}:${step.goto}`
      router.push(step.goto)
    }
  }, [i, step, router])

  const box = useTarget(step?.target, i)

  const next = useCallback(() => {
    if (i < tour.steps.length - 1) setI(i + 1)
    else { markDone(tour.id); onClose() }
  }, [i, tour, onClose])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft' && i > 0) setI(i - 1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, onClose, i])

  if (!mounted || !step) return null

  // Place the card beside the target, clamped to the viewport.
  let cardStyle: React.CSSProperties = {
    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  }
  if (box) {
    const below = box.top + box.height + 14
    const wantsAbove = below + 190 > window.innerHeight
    const top = wantsAbove ? Math.max(12, box.top - 190) : below
    const left = Math.min(
      Math.max(12, box.left + box.width / 2 - CARD_W / 2),
      window.innerWidth - CARD_W - 12,
    )
    cardStyle = { top, left }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-label={`${tour.title} walkthrough`}>
      {/* Dimmer with a hole punched over the target */}
      <div className="absolute inset-0 bg-black/55 transition-opacity"
           style={box ? {
             clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0,
               ${box.left - PAD}px ${box.top - PAD}px,
               ${box.left - PAD}px ${box.top + box.height + PAD}px,
               ${box.left + box.width + PAD}px ${box.top + box.height + PAD}px,
               ${box.left + box.width + PAD}px ${box.top - PAD}px,
               ${box.left - PAD}px ${box.top - PAD}px)`,
           } : undefined}
           onClick={onClose} />

      {box && (
        <div className="pointer-events-none absolute rounded-lg ring-2 ring-primary transition-all duration-200"
             style={{ top: box.top - PAD, left: box.left - PAD,
                      width: box.width + PAD * 2, height: box.height + PAD * 2 }} />
      )}

      <div className="absolute w-[320px] rounded-xl border bg-popover p-4 shadow-2xl transition-all duration-200"
           style={cardStyle}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {tour.title} · {i + 1} of {tour.steps.length}
          </span>
          <button onClick={onClose} aria-label="Close walkthrough"
                  className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h4 className="text-[15px] font-semibold leading-snug">{step.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            {tour.steps.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${
                n === i ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/25'}`} />
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            {i > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setI(i - 1)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {i === tour.steps.length - 1
                ? <><Check className="mr-1 h-3.5 w-3.5" />Done</>
                : <>Next<ArrowRight className="ml-1 h-3.5 w-3.5" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
