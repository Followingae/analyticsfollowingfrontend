'use client'

/**
 * How the work flows — the whole process, on the screen everybody opens.
 *
 * The problem this exists to solve, in the founder's words: "if I, the creator of the
 * software, cannot know our process clearly, then how can my team?" Every stage below was
 * already built and every number below was already computed somewhere — on Today, in a
 * sidebar badge, inside a hub nobody visits. What did not exist was one place where they sit
 * in the order they happen, so the shape of the company is visible without a call.
 *
 * Twelve things in a row is a list, not a process, and the first version proved it: six
 * bordered tiles across, 8px of padding each, no icons, every stop the same weight. Legible
 * only if you already knew the answer.
 *
 * So the twelve are grouped into the four acts the company actually works in — find it,
 * stock it, sell it, deliver it — and the grouping is done with space rather than with more
 * boxes, which is the rule the spacing scale itself sets out: a border round a number is a
 * second edge the eye must cross, and a gap costs nothing. Each act is a column, each stop a
 * row in it, and the eye reads down an act and across the four.
 *
 * Two fields, two different questions, and conflating them was the other bug:
 *
 *   `mine`      whose job this is. Always shown, for everybody, on every stop.
 *   `can_open`  whether this person may go and do it. A founder may open all twelve —
 *               covering somebody's desk is a normal Tuesday, and the first version locked
 *               the owner of the company out of nine of his own screens.
 *
 * The names are `/work/manual`'s, stop for stop. That deck narrates this exact process, and
 * a second vocabulary for the same twelve things is how it stopped being legible before.
 *
 * A stop whose count failed to compute shows a dash, never a zero. Zero is an answer —
 * "nothing is waiting here" — and a broken query must not be allowed to give it.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2, Layers, Users, Tag, ShieldCheck, Send, FileText, CheckCircle2,
  RotateCcw, ClipboardCheck, Megaphone, HandCoins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Skeleton } from '@/components/ui/skeleton'
import { CARD } from '@/components/console/primitives'

type Stop = {
  id: string
  title: string
  owner: string
  hint: string
  href: string
  count: number | null
  mine: boolean
  can_open: boolean
}

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  logged: Building2, area: Layers, stock: Users, price: Tag,
  clear: ShieldCheck, share: Send, proposal: FileText, confirm: CheckCircle2,
  partial: RotateCcw, paper: ClipboardCheck, ladder: Megaphone, pay: HandCoins,
}

/** The four acts, and which stops belong to each. Order is the order work happens in. */
const ACTS: { key: string; label: string; stops: string[] }[] = [
  { key: 'find',    label: 'Find the work',   stops: ['logged', 'area'] },
  { key: 'stock',   label: 'Stock the roster', stops: ['stock', 'price', 'clear'] },
  { key: 'sell',    label: 'Sell it',          stops: ['share', 'proposal', 'confirm', 'partial'] },
  { key: 'deliver', label: 'Deliver and get paid', stops: ['paper', 'ladder', 'pay'] },
]

export function FlowRail() {
  const [stops, setStops] = useState<Stop[] | null>(null)
  const [failed, setFailed] = useState(false)

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

  // No data is not an empty state here. The rail is an explanation of the company; a broken
  // one that draws twelve dashes explains nothing and takes the top of the screen to do it.
  if (failed) return null

  const by = (id: string) => stops?.find(s => s.id === id)

  return (
    <section data-tour="flow-rail" className={cn(CARD, 'bg-card px-ds-4 py-ds-4 sm:px-ds-5')}>
      <div className="flex flex-wrap items-baseline gap-x-ds-3 gap-y-ds-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">How the work flows</h2>
        <p className="text-ds-caption text-muted-foreground">
          Every stage, in the order it happens. Yours are marked.
        </p>
      </div>

      {stops === null ? (
        <div className="mt-ds-4 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, n) => (
            <div key={n} className="space-y-ds-3">
              <Skeleton className="h-3 w-24 rounded-ds-xs" />
              <Skeleton className="h-[52px] rounded-ds-md" />
              <Skeleton className="h-[52px] rounded-ds-md" />
            </div>
          ))}
        </div>
      ) : (
        /* Four columns, gap-ds-5 between them — a step wider than any gap inside an act, so
           the grouping reads without a rule or a border doing it. */
        <div className="mt-ds-4 grid gap-x-ds-5 gap-y-ds-5 sm:grid-cols-2 xl:grid-cols-4">
          {ACTS.map((act, actIndex) => (
            <div key={act.key}>
              <p className="flex items-baseline gap-ds-2 px-ds-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                <span className="tabular-nums text-muted-foreground/45">{actIndex + 1}</span>
                {act.label}
              </p>
              <div className="mt-ds-2 space-y-px">
                {act.stops.map(id => {
                  const s = by(id)
                  return s ? <StopRow key={id} stop={s} /> : null
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * One stop: an icon, its number, what it is and whose it is.
 *
 * The same row either way. A stage somebody else owns is still a stage, and redrawing it as
 * a different sort of object would break the sequence this component exists to show — so the
 * two states differ in weight and in what happens when you click, never in shape.
 */
function StopRow({ stop }: { stop: Stop }) {
  const Icon = ICON[stop.id] ?? Layers
  const n = stop.count == null ? '—' : stop.count.toLocaleString('en-US')
  // Work sitting on a stage that is yours is the one thing here that should catch the eye.
  const attention = stop.mine && (stop.count ?? 0) > 0

  const body = (
    <>
      <span
        className={cn(
          'grid h-9 w-9 flex-none place-items-center rounded-ds-md transition-colors',
          attention
            ? 'bg-[var(--tone-info-wash)] text-foreground'
            : 'bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]',
        )}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
          {stop.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
          {stop.mine ? 'Yours' : stop.owner}
        </span>
      </span>

      <span
        className={cn(
          'flex-none text-[19px] font-semibold leading-none tabular-nums tracking-[-0.02em]',
          attention ? 'text-foreground' : 'text-muted-foreground/70',
        )}
      >
        {n}
      </span>
    </>
  )

  const shell = 'flex w-full items-center gap-ds-3 rounded-ds-md px-ds-2 py-ds-2 text-left'

  if (!stop.can_open) {
    return (
      <div
        className={cn(shell, 'cursor-default')}
        // Readable, not interactive: somebody else's stage. Saying so in the markup is what
        // stops a screen reader offering a link that goes nowhere.
        aria-disabled
        title={`${stop.title} — ${stop.hint}. ${stop.owner} moves this one.`}
      >
        {body}
      </div>
    )
  }

  return (
    <Link
      href={stop.href}
      title={`${stop.title} — ${stop.hint}`}
      className={cn(
        shell,
        'transition-colors hover:bg-black/[0.035] focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'dark:hover:bg-white/[0.05]',
      )}
    >
      {body}
    </Link>
  )
}
