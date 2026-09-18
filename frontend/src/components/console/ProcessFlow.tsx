'use client'

/**
 * The process, drawn.
 *
 * The founder's words are the specification and they have not changed: "BUSINESS DEVELOPMENT
 * -> TALENT -> WITH APPROVALS -> WITH CLIENT (and then back to wherever in case of more
 * rounds requested)". Five hands, one direction, one loop back.
 *
 * WHY THIS REPLACED THE RAIL
 * --------------------------
 * The rail said the same true thing in five equal boxes, each carrying a headline number and
 * up to three sub-numbers. Twenty figures, all the same size, all the same weight: a reader
 * could not tell from across the desk where the work was stuck, which is the only question a
 * process picture exists to answer. Equal boxes cannot answer it, because equal boxes say
 * every stage is the same size.
 *
 * So the picture carries the volume itself. The band between two stations is as thick as the
 * pile waiting to move, the station you own is marked, and the fattest band is named out
 * loud. Nothing is hidden: the twelve stops are still here, one stage at a time, under the
 * station you are looking at. That is the trade - twelve numbers at once told nobody
 * anything, twelve numbers one stage at a time is a thing you can read.
 *
 * WHAT IT MUST NEVER DO
 * ---------------------
 * Invent a number. A stop whose count the server did not send reads as "-", never as 0. A
 * zero here means "nothing is waiting", which is the opposite of "we could not count it",
 * and a dashboard that confuses the two is worse than no dashboard.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Skeleton } from '@/components/ui/skeleton'
import { CARD } from '@/components/console/primitives'

export type Stop = {
  id: string
  title: string
  owner: string
  hint: string
  href: string
  count: number | null
  mine: boolean
  can_open: boolean
}

/** The five hands, and which of the twelve stops sit in each. */
const STAGES: {
  key: string
  title: string
  who: string
  scope: string | null
  stops: string[]
}[] = [
  { key: 'bd', title: 'Business development', who: 'Brands in the door',
    scope: 'business_development', stops: ['logged'] },
  { key: 'talent', title: 'Talent', who: 'Finding and pricing creators',
    scope: 'talent', stops: ['area', 'stock'] },
  { key: 'approvals', title: 'Approvals', who: 'Only a founder clears these',
    scope: 'leadership', stops: ['price', 'clear', 'proposal'] },
  { key: 'client', title: 'With the client', who: 'Waiting on them, not on us',
    scope: null, stops: ['share', 'confirm', 'partial'] },
  { key: 'deliver', title: 'Delivering', who: 'Live work, and paying people',
    scope: null, stops: ['paper', 'ladder', 'pay'] },
]

const H = 150            // the drawing's height in px
const SPINE = 86         // y of the spine: numbers above it, the loop back below it
const MIN_BAND = 6       // a band for an empty stage is still a band, not a gap
const MAX_BAND = 56      // the fattest pile, at a weight you can read from across a desk

/** Volume to thickness. Square root, because a pile ten times bigger is not ten times
 *  more interesting - it is just bigger, and a linear scale would flatten everything else
 *  into a hairline the moment one stage ran away. */
function band(count: number, max: number) {
  if (max <= 0) return MIN_BAND
  return MIN_BAND + (MAX_BAND - MIN_BAND) * Math.sqrt(Math.max(0, count) / max)
}

export function ProcessFlow({ scope }: { scope?: string | null }) {
  const [stops, setStops] = useState<Stop[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const wrap = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/flow`)
        const json = await res.json()
        if (!live) return
        const list = json?.data?.stops
        if (Array.isArray(list) && list.length) setStops(list)
        else setFailed(true)
      } catch {
        if (live) setFailed(true)
      }
    })()
    return () => { live = false }
  }, [])

  // Real pixels, not a stretched viewBox: a band drawn in a squashed coordinate system
  // tapers at the wrong angle and the loop arc turns into an ellipse.
  //
  // A callback ref rather than an effect, and the reason is worth keeping: the canvas does
  // not exist on first render, because the component is showing a skeleton until the counts
  // land. An effect with an empty dependency list therefore ran against a null ref, never
  // observed anything, and the width stayed 0 forever - the drawing simply never appeared.
  // A callback ref fires when the node actually attaches, which is the only moment there is
  // anything to measure.
  const observer = useRef<ResizeObserver | null>(null)
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect()
    wrap.current = el
    if (!el) return
    setW(el.clientWidth)
    observer.current = new ResizeObserver(() => setW(el.clientWidth))
    observer.current.observe(el)
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])

  const by = (id: string) => stops?.find(s => s.id === id)

  const stages = useMemo(() => STAGES.map(s => {
    const rows = s.stops.map(by).filter(Boolean) as Stop[]
    const counted = rows.filter(r => typeof r.count === 'number')
    return {
      ...s,
      rows,
      // null, not 0, when the server sent us nothing to add up.
      total: counted.length ? counted.reduce((a, r) => a + (r.count || 0), 0) : null,
      mine: !!s.scope && s.scope === scope,
    }
  }), [stops, scope])

  const max = Math.max(1, ...stages.map(s => s.total ?? 0))
  const mineKey = stages.find(s => s.mine)?.key ?? null
  const busiest = stages.reduce((a, b) => ((b.total ?? 0) > (a.total ?? 0) ? b : a), stages[0])
  const selected = open ?? mineKey ?? busiest?.key ?? 'talent'
  const shown = stages.find(s => s.key === selected) ?? stages[0]

  const cx = (i: number) => (w / 5) * (i + 0.5)

  if (!stops && !failed) {
    return (
      <section className={cn(CARD, 'bg-card p-5 sm:p-6')}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-5 h-[150px] w-full rounded-xl" />
        <Skeleton className="mt-4 h-9 w-2/3" />
      </section>
    )
  }

  return (
    <section data-tour="flow-rail" className={cn(CARD, 'overflow-hidden bg-card')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">How work moves</h2>
        {failed ? (
          <p className="text-xs text-muted-foreground">The stages are below. The counts could not be loaded.</p>
        ) : busiest && (busiest.total ?? 0) > 0 ? (
          <p className="text-xs text-muted-foreground">
            Piling up at <span className="font-medium text-foreground">{busiest.title}</span>
          </p>
        ) : null}
      </div>

      {/* The drawing and the labels share one padded box, so the five columns underneath sit
          exactly beneath the five stations above them. They used to carry different padding,
          which put every station a few pixels off its own name. */}
      {/* On a phone, five columns of two-line names collapse into overlapping stacks of
          single words. The drawing and its labels scroll together instead, keeping a floor
          width where the names stay on one or two sensible lines - a process picture that
          has to be decoded is not one. */}
      <div className="overflow-x-auto px-5 sm:px-6">
      <div className="min-w-[580px]">
      <div ref={wrapRef} className="relative mt-4 h-[150px] w-full">
        {w > 0 && (
          <svg
            width={w} height={H} viewBox={`0 0 ${w} ${H}`}
            className="absolute inset-x-0 top-0 text-foreground"
            aria-hidden="true"
          >
            <defs>
              <marker id="pf-arrow" viewBox="0 0 8 8" refX="6" refY="4"
                      markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" fillOpacity={0.35} />
              </marker>
              {/* A band is a volume of work, not a flat shape. The gradient gives it a lit
                  top edge and a settled bottom, which is what stops five wedges of the same
                  colour reading as a chart nobody drew on purpose. */}
              <linearGradient id="pf-ink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.75} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="pf-lime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--console-lime)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--console-lime)" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            {/* The loop back, drawn UNDER the spine: the client asks for more and it returns
                to Talent. It ran above the spine first, straight through the five figures,
                which made the one line on the drawing that is not a pile look like one. */}
            <path
              d={`M ${cx(3)} ${SPINE + 24} C ${cx(3)} ${SPINE + 56}, ${cx(1)} ${SPINE + 56}, ${cx(1)} ${SPINE + 24}`}
              fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.25}
              strokeDasharray="4 4" markerEnd="url(#pf-arrow)"
            />

            {/* the bands: thickness is the pile waiting to move on */}
            {stages.slice(0, -1).map((s, i) => {
              const h1 = band(s.total ?? 0, max)
              const h2 = band(stages[i + 1].total ?? 0, max)
              const x1 = cx(i), x2 = cx(i + 1)
              // The bands are never tinted for ownership. Lime ran across every band either
              // side of your station, which put a lime slope rising into the pile at
              // Approvals and made 306 founder-held items look like yours. Lime now says one
              // thing on this drawing and one only: you are standing here.
              const warm = false
              // The band arriving at the biggest pile is darker than the rest. One stage is
              // always the bottleneck and naming it in the corner is not enough - the eye
              // should land on it before it reads a word.
              const jam = stages[i + 1].key === busiest?.key && (busiest?.total ?? 0) > 0
              return (
                <g key={`band-${s.key}`}>
                  {/* Volume grows UP from the line, it is not centred on it. Centred, the
                      five piles drew a single lens shape down the middle of the card - a
                      form that says nothing about accumulation, because a pile that has
                      grown does not also grow downwards. On a baseline it reads the way a
                      pile reads: the work stands on the floor of the process. */}
                  <path
                    d={`M ${x1} ${SPINE} L ${x1} ${SPINE - h1} L ${x2} ${SPINE - h2} L ${x2} ${SPINE} Z`}
                    fill={warm ? 'url(#pf-lime)' : 'url(#pf-ink)'}
                    fillOpacity={warm ? 1 : jam ? 0.26 : 0.13}
                  />
                  {/* direction of travel, one authored moment on the whole screen */}
                  <line
                    x1={x1 + 10} y1={SPINE + 7} x2={x2 - 10} y2={SPINE + 7}
                    stroke="currentColor" strokeOpacity={0.3} strokeWidth={1}
                    strokeDasharray="2 10" strokeLinecap="round"
                    className="pf-drift motion-reduce:[animation:none]"
                  />
                </g>
              )
            })}

            {/* the floor the work stands on */}
            <line
              x1={cx(0)} y1={SPINE} x2={cx(4)} y2={SPINE}
              stroke="currentColor" strokeOpacity={0.25} strokeWidth={1}
            />

            {/* the stations */}
            {stages.map((s, i) => {
              const on = s.key === selected
              return (
                <g key={`node-${s.key}`}>
                  {s.mine && (
                    <circle cx={cx(i)} cy={SPINE} r={14} fill="var(--console-lime)" fillOpacity={0.35} />
                  )}
                  <circle
                    cx={cx(i)} cy={SPINE} r={on ? 7.5 : 5.5}
                    fill={s.mine ? 'var(--console-lime)' : 'var(--card)'}
                    stroke="currentColor" strokeOpacity={on ? 0.85 : 0.3}
                    strokeWidth={on ? 2 : 1.25}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {/* the count sits above its own station, the only figures in the drawing */}
        <div className="relative grid h-full grid-cols-5">
          {stages.map((s) => (
            <div key={`n-${s.key}`} className="flex flex-col items-center pt-1">
              <span className={cn(
                'text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em]',
                s.mine ? 'text-foreground' : 'text-foreground/75',
              )}>
                {s.total == null ? '—' : s.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* who each station is, and the one you are looking at */}
      <div className="grid grid-cols-5 gap-px pb-3">
        {stages.map((s) => {
          const on = s.key === selected
          return (
            <button
              key={`lab-${s.key}`}
              type="button"
              onClick={() => setOpen(s.key)}
              aria-pressed={on}
              className={cn(
                'group rounded-xl px-2 py-3 text-center transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                on ? 'bg-black/[0.04] dark:bg-white/[0.06]' : 'hover:bg-black/[0.025] dark:hover:bg-white/[0.04]',
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="text-[13px] font-medium leading-tight">{s.title}</span>
                {s.mine && (
                  <span className="rounded-full bg-[var(--console-lime)] px-1.5 py-px text-[10px] font-semibold text-[oklch(0.22_0.012_140)]">
                    You
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">{s.who}</span>
            </button>
          )
        })}
      </div>
      </div>
      </div>

      {/* the stops inside the station you are looking at */}
      <div className="border-t border-black/[0.06] bg-black/[0.015] px-5 py-4 dark:border-white/[0.07] dark:bg-white/[0.02] sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {shown?.title}
          </span>
          {(shown?.rows ?? []).map((r) => {
            const body = (
              <>
                <span className="text-[13px]">{r.title}</span>
                <span className="text-[13px] font-semibold tabular-nums">
                  {r.count == null ? '—' : r.count}
                </span>
                {r.can_open && <ArrowRight className="h-3.5 w-3.5 opacity-50" />}
              </>
            )
            const shell = 'inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-card px-3 py-1.5 dark:border-white/[0.08]'
            return r.can_open ? (
              <Link key={r.id} href={r.href} title={r.hint}
                    className={cn(shell, 'transition-colors duration-150 hover:border-black/20 dark:hover:border-white/25')}>
                {body}
              </Link>
            ) : (
              <span key={r.id} title={r.hint} className={cn(shell, 'opacity-60')}>{body}</span>
            )
          })}
          {shown?.rows?.length === 0 && (
            <span className="text-[13px] text-muted-foreground">No stops in this stage.</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            More requested sends it back to Talent
          </span>
        </div>
      </div>
    </section>
  )
}
