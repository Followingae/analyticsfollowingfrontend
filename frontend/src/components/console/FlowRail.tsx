'use client'

/**
 * How the work flows — the whole process, on the screen everybody opens.
 *
 * The problem this exists to solve, in the founder's words: "if I, the creator of the
 * software, cannot know our process clearly, then how can my team?" Every stage below was
 * already built, and every number below was already computed somewhere — on Today, in a
 * sidebar badge, inside a hub nobody visits. What did not exist was a single place where the
 * stages sit next to each other in the order they happen, so the shape of the company is
 * visible without anybody explaining it on a call.
 *
 * Three rules it is built on:
 *
 *   Everyone sees all twelve stops. Not a personalised slice — the point is that a talent
 *   manager can see the founders are sitting on nine prices, and a founder can see the
 *   rosters are thin. Hiding the parts that are not yours is what made the process feel like
 *   twelve unrelated screens.
 *
 *   Only your stops are clickable. The rail teaches whose turn it is by what it lets you do,
 *   which no amount of documentation achieves. The others stay fully legible — dimmed, never
 *   hidden, never blurred.
 *
 *   The names come from `/work/manual`. That deck already narrates this exact process, stop
 *   for stop, and the surest way back to the confusion would be a second vocabulary for the
 *   same twelve things. Rename a stop there and rename it here.
 *
 * A stop whose count failed to compute shows a dash, never a zero. Zero is an answer —
 * "nothing is waiting here" — and a broken query must not be allowed to give it.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Skeleton } from '@/components/ui/skeleton'
import { Panel } from '@/components/console/primitives'

type Stop = {
  id: string
  title: string
  owner: string
  hint: string
  href: string
  count: number | null
  mine: boolean
}

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

  return (
    <Panel
      title="How the work flows"
      description="Every stage, in the order it happens. The ones that are yours to move are the ones you can open."
    >
      {stops === null ? (
        <div className="grid grid-cols-2 gap-ds-2 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, n) => (
            <Skeleton key={n} className="h-[104px] rounded-ds-lg" />
          ))}
        </div>
      ) : (
        <ol className="grid grid-cols-2 gap-ds-2 sm:grid-cols-3 xl:grid-cols-6">
          {stops.map((s, i) => (
            <Stop key={s.id} stop={s} step={i + 1} />
          ))}
        </ol>
      )}
    </Panel>
  )
}

/**
 * One stop.
 *
 * The same markup either way, so the two states differ in weight rather than in shape — a
 * stage you cannot act on is still a stage, and redrawing it as something else would break
 * the sequence the whole component exists to show.
 */
function Stop({ stop, step }: { stop: Stop; step: number }) {
  const n = stop.count == null ? '—' : stop.count.toLocaleString('en-US')

  const body = (
    <>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'grid h-[18px] w-[18px] flex-none place-items-center rounded-full text-[10px] font-semibold tabular-nums',
            stop.mine
              ? 'bg-foreground text-background'
              : 'bg-black/[0.06] text-muted-foreground dark:bg-white/[0.09]',
          )}
        >
          {step}
        </span>
        <span className="truncate text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {stop.owner}
        </span>
        {stop.mine && (
          <ArrowRight
            className="ml-auto h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </div>

      <p
        className={cn(
          'mt-ds-2 text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums',
          stop.mine ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {n}
      </p>

      <p
        className={cn(
          'mt-1.5 text-[12.5px] font-medium leading-snug',
          stop.mine ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {stop.title}
      </p>
    </>
  )

  const shell =
    'group block h-full rounded-ds-lg border p-ds-2 text-left transition-colors'

  if (!stop.mine) {
    return (
      <li>
        <div
          className={cn(shell, 'cursor-default border-black/[0.05] dark:border-white/[0.06]')}
          // Readable, not interactive: it is somebody else's stage, and saying so in the
          // markup is what keeps a screen reader from offering a link that goes nowhere.
          aria-disabled
          title={`${stop.title} — ${stop.hint}. ${stop.owner} moves this one.`}
        >
          {body}
        </div>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={stop.href}
        title={`${stop.title} — ${stop.hint}`}
        className={cn(
          shell,
          'border-black/[0.08] hover:bg-black/[0.035] focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'dark:border-white/[0.10] dark:hover:bg-white/[0.05]',
        )}
      >
        {body}
      </Link>
    </li>
  )
}
