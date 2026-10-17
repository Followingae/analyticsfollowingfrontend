'use client'

/**
 * The dashboard.
 *
 * Six rewrites got here. The lesson the fifth one taught is still the governing one and is
 * written here because this screen keeps having to relearn it:
 *
 *   A DASHBOARD ANSWERS "WHAT DO I DO NOW". NAVIGATION ANSWERS "WHERE CAN I GO".
 *
 * The sidebar answers the second question on every screen in the product. Answering it again
 * in cards, and a third time in a strip of chips, is not orientation - it is the same list
 * three times, and it buries the one thing this page exists for. That is why the fourteen
 * "areas you can open" cards are gone and are not coming back.
 *
 * THE SEVENTH REWRITE, and what it corrected. The sixth deleted the cards, drew the process
 * rather than boxing it, and flattened the four number cards into one line of running text.
 * Deleting the boxes was right. Flattening the numbers into a sentence was not: the owner's
 * reading of the result was "NOT SO TEXTY", and he is right, because what was left above the
 * fold was a drawing, a row of pills, one line of small type, and then prose - sentences all
 * the way down. A person cannot see a line of 13px text from across a desk, and the figures
 * their role is judged on were the smallest thing on their home screen.
 *
 * So the figures come back as FIGURES: four of them, at 30px, in a borderless band separated
 * by 40px of air, each carrying the reason underneath it and each a link to the pile it
 * counts. Not four cards - a band of numbers is one object, and four bordered cards put eight
 * edges between the first number and the last with none of those edges saying anything.
 *
 * And the page gains a PICTURE where its dominant element is. Where this person's work stands,
 * as bar columns across the stages of the sequence that holds most of it: lime for the bars
 * they can act on, grey for the ones sitting with somebody else, amber where something is
 * late. A shape you can read without reading.
 *
 * The composition, same six slots for every role, filled differently:
 *
 *   1  who you are, the date, and the ONE action this role came here to press
 *   2  four figures, as a band
 *   3  the dominant picture: the stage columns, or the process drawing where this person's
 *      work carries no sequence to chart
 *   4  beside it, what needs this person, capped at seven with a way to see the rest
 *   5  the process, where slot 3 was the columns
 *   6  elsewhere, and where you go next
 *
 * WHAT IT MUST NEVER DO
 * ---------------------
 * Invent a number. A figure the server did not send renders as `<Dash reason="unmeasured">`,
 * never as a zero and never as "all clear": a failed read reported as good news is the one
 * mistake that costs a dashboard its reader for good. A section with no data is not rendered
 * at all, header included - no placeholder, no pitch.
 *
 * Nor count a capped list. `waiting` and `moving` arrive sliced to fourteen rows, because
 * nobody triages more than that in a sitting, and the first version of the chart counted the
 * arrays: at sixty rows waiting it drew a plausible distribution of fourteen with nothing
 * about it saying so. Every total and every bar now reads `waiting_total`, `moving_total`,
 * `waiting_counts` and `stage_counts`, which the server computes before it slices. The arrays
 * are read only for what a count cannot carry - a key's English name, whether anything in a
 * pile is late, where a column leads - and never for a quantity.
 *
 * The age is a number the server sends. It used to be formatted into a sentence there and
 * regexed back out here, which meant any row whose sentence had no age phrase in it - "AED
 * 12,000 approved and waiting" - fell through to a neutral dot. Both halves of that round
 * trip are gone.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { ProcessFlow } from '@/components/console/ProcessFlow'
import { Shortcuts } from '@/components/console/Shortcuts'
import { WaitingOnYou } from '@/components/console/WaitingOnYou'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowUpRight, Compass, GitBranch, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import {
  Aed, MiniBar, PageHead, Panel, Ring, RoundButton, StageBar, Stat, StatGrid, type Tone,
} from '@/components/console/primitives'
import { Dash, SectionHead, StageRail, type RailSegment } from '@/components/console/surfaces'
import { shortName } from '@/lib/destinations'
import { cn } from '@/lib/utils'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const dayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Money, in full.
 *
 * This used to shorten anything over ten thousand to "48K" and anything over a million to
 * "1.68M". It is a figure somebody is judged on and sometimes a figure somebody has to
 * reconcile, and 48K is four different numbers. Thousands-separated integer, no decimals,
 * tabular figures, which is the house rule everywhere else money is written.
 */
const money = (n: number) => Math.round(n).toLocaleString('en-GB')

/** A thing stopped until this person does something. One row, one decision. */
type Waiting = {
  urgency?: string
  title: string
  reason?: string
  href?: string | null
  at?: number | null
  age_days?: number
  where?: string | null
  flow?: string | null
  value?: number | null
  of?: number | null
  stage_label?: string | null
  tone?: Tone
  kind?: string | null
  actions?: { label: string; href: string }[]
}

/** A thing running without them. Identical but for `owner`, which is the whole point of it. */
type Flight = {
  title: string
  reason?: string
  href?: string | null
  owner: string
  where?: string | null
  value?: number | null
  of?: number | null
  stage_label?: string | null
  flow?: string | null
  at?: number | null
}

/** The sequences a row can sit in. Named here only to draw them; the server says which. */
const FLOWS: Record<string, { key: string; label: string }[]> = {
  areas: [
    { key: 'released', label: 'Released' }, { key: 'stocked', label: 'Stocked' },
    { key: 'cleared', label: 'Cleared' }, { key: 'sent', label: 'Sent' },
    { key: 'picked', label: 'Picked' },
  ],
  brands: [
    { key: 'logged', label: 'Logged' }, { key: 'sourcing', label: 'Sourcing' },
    { key: 'quoted', label: 'Quoted' }, { key: 'live', label: 'Live' },
  ],
  proposals: [
    { key: 'drafted', label: 'Drafted' }, { key: 'internal', label: 'Approved inside' },
    { key: 'sent', label: 'Sent' }, { key: 'answered', label: 'Answered' },
  ],
  ladder: [
    { key: 'enrolled', label: 'Booked' }, { key: 'rate', label: 'Rate agreed' },
    { key: 'briefed', label: 'Briefed' }, { key: 'content', label: 'Content in' },
    { key: 'posted', label: 'Posted' }, { key: 'paid', label: 'Paid' },
  ],
}

/**
 * The one action each role came here to do.
 *
 * `verb` only. The NOUN is never written here: it comes from `destinations.ts`, which is the
 * single register of what each screen is called. This file used to carry its own names, and
 * that is how one screen ended up with three: the sidebar said "Coverage" because it reads
 * the register, while this page still said "Where we're thin" because it did not.
 */
const PRIMARY: Record<string, { verb?: string; href: string }> = {
  leadership: { href: '/work/approvals' },
  // A talent manager had no primary action at all, on the one screen whose whole job for
  // them is finding people. Adding costs nothing, which is exactly why it should be here.
  talent: { verb: 'Add', href: '/work/influencers?new=1' },
  // The clients list holds no owner filter, so this opens everybody's book.
  account: { href: '/work/clients' },
  business_development: { verb: 'Add', href: '/work/brands?new=1' },
}

/* The tone tokens are defined once in the .console-shell block in globals.css, so amber is
   a single decision rather than the same guess written out in twenty places. */
const TONE_BADGE: Record<string, string> = {
  good: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  warn: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  bad: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  info: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  neutral: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

/** The ink a reason line takes when it is bad news. Amber and rose only; nothing else. */
const REASON_INK: Record<string, string> = {
  warn: 'font-medium text-[color:var(--tone-warn-ink)]',
  bad: 'font-medium text-[color:var(--tone-bad-ink)]',
}

/** Where a row sits in its sequence, and any second thing you can do to it. One click away,
 *  so the row stays on one line and the detail is still there for anyone who wants it. */
function Detail({ row }: { row: Waiting | Flight }) {
  const flow = row.flow && FLOWS[row.flow] ? FLOWS[row.flow] : null
  const extra = ('actions' in row ? row.actions || [] : [])
    .filter(a => a.href && a.href !== row.href)
  if (!flow && extra.length === 0) return null
  const at = typeof row.at === 'number' ? Math.max(0, Math.min(row.at, (flow?.length ?? 1) - 1)) : 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Where this sits"
          aria-label="Where this sits"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground
                     transition-colors hover:bg-black/[0.05] hover:text-foreground
                     dark:hover:bg-white/[0.08]"
        >
          <GitBranch className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-sm space-y-ds-3">
        {flow && <StageBar stages={flow} current={flow[at]?.key || flow[0].key} />}
        {extra.length > 0 && (
          <div className="flex flex-wrap gap-ds-2">
            {extra.map(a => (
              <Button key={a.label + a.href} size="sm" variant="outline" asChild>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ══ The picture ══════════════════════════════════════════════════════════════════════════
   WHERE THIS PERSON'S WORK STANDS, as bar columns.

   This is the dominant element and it is deliberately a shape rather than a list: the owner's
   complaint about the console was that it is "NOT SO TEXTY", and a picture is the only answer
   to that which is not decoration. Bars rather than a line, which is the standing visual
   direction here and also the right form - these are counts at a handful of discrete stages,
   and a line between them would draw a trend that does not exist.

   ONE SEQUENCE PER CHART. Every row the server sends names the sequence it sits in and its
   index along it, so the stages are real and so is the order. What the chart must not do is
   pool them: "Drafted" belongs to a quote and "Stocked" belongs to a roster, and standing
   them next to each other on one axis draws a progression nobody runs. So the chart picks the
   sequence holding most of this person's work and says in its own header which one that is.
   Where no sequence holds at least two rows there is nothing honest to draw, and the slot is
   given to the process drawing instead.

   COLOUR IS STATUS AND TRAVELS WITH A WORD. Lime where the pile is this person's to move,
   grey where it is sitting with somebody else, amber where something in it is late - and the
   word is printed under every column, so the colour is never the only carrier.               */

type Col = {
  key: string
  label: string
  /** Rows waiting on this person. */
  mine: number
  /** Rows at this stage that somebody else is holding. */
  others: number
  /** Of `mine`, how many are chased or a week old. */
  late: number
  /** Where the column leads, when every row in it leads to the same place. */
  href: string | null
}

const BAR: Record<'mine' | 'others' | 'late', string> = {
  late: 'bg-[var(--tone-warn-dot)]',
  mine: 'bg-[var(--console-lime)]',
  others: 'bg-black/[0.10] dark:bg-white/[0.16]',
}

/** A key the server did not give an English name, written out as one. */
const humanise = (k: string) =>
  /[A-Z\s]/.test(k) ? k : (s => s.charAt(0).toUpperCase() + s.slice(1))(k.replace(/_/g, ' '))

/**
 * The columns, counted from the UNCAPPED totals.
 *
 * This used to count the `waiting` and `moving` arrays themselves, and that was wrong in the
 * most convincing way available: both lists are capped at fourteen rows server-side, so at
 * sixty rows waiting the chart drew a tidy distribution of fourteen and looked entirely
 * plausible. A chart that is the shape of its own cap is worse than no chart, because nothing
 * about it says so.
 *
 * So the counts come from `waiting_counts` and `stage_counts`, which the server computes
 * before it slices. The capped arrays are still read, but only for things a count cannot
 * carry: the English name of a key, whether anything in that pile is late, and where a column
 * leads. Never for a quantity.
 *
 * ONE KEY SPACE. `waiting_counts` is keyed by `kind` and `stage_counts` by a flight's stage
 * falling back to its `kind`, which is the server's own decision and the reason these two can
 * share an axis at all. `mine` and `others` are read from the two objects by the same key, and
 * a key present in only one of them simply has a zero in the other - a counted zero, not a
 * guess.
 */
function useStageColumns(
  waiting: Waiting[],
  waitingCounts: Record<string, number> | null | undefined,
  stageCounts: Record<string, number> | null | undefined,
) {
  return useMemo(() => {
    const mineBy = waitingCounts && typeof waitingCounts === 'object' ? waitingCounts : {}
    const othersBy = stageCounts && typeof stageCounts === 'object' ? stageCounts : {}

    // The gate. With no in-flight distribution there is nothing to draw the grey half of
    // this chart from, and drawing the lime half alone would be a picture that silently
    // omits a whole series. The slot goes to the process drawing instead.
    if (Object.keys(othersBy).length === 0) return null

    /* What each key is called, and what is late in it, learned from the rows we do have.
       A late flag read from a capped list can only under-report, never over-report: the
       server sorts `waiting` by urgency and then by longest wait, so anything chased or old
       is at the top of the list and inside the cap by construction. */
    const label = new Map<string, string>()
    const late = new Map<string, number>()
    const hrefs = new Map<string, Set<string>>()
    for (const r of waiting) {
      const k = r.kind
      if (!k) continue
      if (!label.has(k)) {
        const seq = r.flow && FLOWS[r.flow] ? FLOWS[r.flow] : null
        const at = seq && typeof r.at === 'number'
          ? Math.max(0, Math.min(r.at, seq.length - 1))
          : null
        label.set(k, r.stage_label || (seq && at !== null ? seq[at].label : humanise(k)))
      }
      if (r.urgency === 'high' || (r.age_days ?? 0) >= 7) late.set(k, (late.get(k) ?? 0) + 1)
      if (r.href) {
        const set = hrefs.get(k) ?? new Set<string>()
        set.add(r.href)
        hrefs.set(k, set)
      }
    }

    const keys = Array.from(new Set([...Object.keys(othersBy), ...Object.keys(mineBy)]))
    const cols: Col[] = keys.map(k => {
      const set = hrefs.get(k)
      return {
        key: k,
        label: label.get(k) || humanise(k),
        mine: Number(mineBy[k] ?? 0) || 0,
        others: Number(othersBy[k] ?? 0) || 0,
        late: late.get(k) ?? 0,
        // A column is a link only where every row in it leads to the same screen. Picking
        // one of several would send somebody to a place holding part of what they pressed.
        href: set && set.size === 1 ? Array.from(set)[0] : null,
      }
    })
    // Biggest pile leading, which is the order every other list on this screen uses. These
    // keys are jobs and stages from several different sequences, so there is no one
    // progression to lay them along and pretending otherwise would draw an order that does
    // not exist.
    cols.sort((a, b) => (b.mine + b.others) - (a.mine + a.others) || a.key.localeCompare(b.key))

    // One column is a fact, not a distribution.
    if (cols.length < 2) return null
    return { cols }
  }, [waiting, waitingCounts, stageCounts])
}

function StageColumns({ cols }: { cols: Col[] }) {
  const router = useRouter()
  const max = Math.max(1, ...cols.map(c => c.mine + c.others))

  const segments: RailSegment[] = cols.map(c => ({
    key: c.key,
    label: c.label,
    n: c.mine + c.others,
    tone: c.late > 0 ? 'warn' : c.mine > 0 ? 'current' : 'neutral',
  }))

  return (
    <div className="space-y-ds-4">
      {/* The same distribution as one bar, which is also the screen reader's summary of the
          columns: StageRail names every stage and its count in its own accessible label. */}
      <StageRail segments={segments} />

      <div className="flex items-stretch gap-ds-2" style={{ height: 232 }}>
        {cols.map(c => {
          const n = c.mine + c.others
          const kind = c.late > 0 ? 'late' : c.mine > 0 ? 'mine' : 'others'
          // A counted zero is a real answer and keeps the stage on the axis, so it draws a
          // hairline rather than vanishing. It is never read as 6% of anything.
          const pct = n === 0 ? 0 : Math.max(6, Math.round((n / max) * 100))
          const word = c.late > 0
            ? `${c.late} late`
            : c.mine > 0 ? `${c.mine} yours`
            : c.others > 0 ? 'with others'
            : 'clear'

          const body = (
            <>
              <span className={cn('text-ds-label font-semibold tabular-nums',
                                  n === 0 && 'text-muted-foreground/60')}>
                {n}
              </span>
              <span className="mt-ds-1 flex flex-1 items-end">
                <span
                  className={cn('block w-full rounded-t-md transition-[height] duration-500',
                                n === 0 ? 'h-[3px] bg-border' : BAR[kind])}
                  style={n === 0 ? undefined : { height: `${pct}%` }}
                />
              </span>
              <span className="mt-ds-2 truncate text-ds-caption font-medium text-foreground">
                {c.label}
              </span>
              <span className={cn('text-ds-caption',
                                  c.late > 0
                                    ? REASON_INK.warn
                                    : 'text-muted-foreground')}>
                {word}
              </span>
            </>
          )

          return c.href ? (
            <button
              key={c.key}
              type="button"
              onClick={() => router.push(c.href!)}
              title={`Open ${c.label.toLowerCase()}`}
              className="flex flex-1 flex-col rounded-ds-lg px-ds-1 text-center transition-colors
                         hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-white/[0.05]"
            >
              {body}
            </button>
          ) : (
            <div key={c.key} className="flex flex-1 flex-col px-ds-1 text-center">{body}</div>
          )
        })}
      </div>
    </div>
  )
}

/* ══ Running without you ══════════════════════════════════════════════════════════════════
   The in-flight list used to be a five column data table, full width, collapsed behind a
   chevron at the foot of the page. It carried what, how far along, where it stands, and who
   has it. Every one of those facts is still here - as a row, which fits the half-width panel
   this now lives in and does not need a horizontal scrollbar to show four facts about a
   roster. Sorting went with the table; the server already sends these in the order that
   matters, longest-standing first.                                                          */

function ElsewhereRow({ row }: { row: Flight }) {
  const router = useRouter()
  return (
    <li className="flex items-start gap-ds-3 border-b border-border/60 py-ds-2 last:border-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-ds-2">
          {row.href
            ? <Link href={row.href} className="text-ds-label font-medium hover:underline">
                {row.title}
              </Link>
            : <span className="text-ds-label font-medium">{row.title}</span>}
          {row.stage_label && (
            <Badge className={cn('whitespace-nowrap', TONE_BADGE.neutral)}>{row.stage_label}</Badge>
          )}
        </div>
        {row.reason && (
          <p className="text-ds-caption text-muted-foreground">{row.reason}</p>
        )}
        <div className="flex flex-wrap items-center gap-ds-3">
          <span className="text-ds-caption text-muted-foreground">{row.owner} has it</span>
          {typeof row.of === 'number' && row.of > 0 && (
            <MiniBar value={row.value ?? 0} max={row.of} tone="good" />
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Detail row={row} />
        {row.href && (
          <RoundButton icon={ArrowUpRight} label={`Open ${row.title}`}
                       onClick={() => router.push(row.href!)} />
        )}
      </div>
    </li>
  )
}

export default function Today() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  // A failed load used to leave `waiting` at [], which the queue rendered as a green tick and
  // "Nothing is waiting on you". That is the fabricated-zero sin in a new costume: silence
  // reported as good news, on the one screen somebody uses to decide their day.
  const [failed, setFailed] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [allWaiting, setAllWaiting] = useState(false)
  const [allFlight, setAllFlight] = useState(false)

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not load your day')
    } finally { setLoading(false); setRefreshing(false) }
  }

  // The bubbles on the shortcuts. Its own request, and its own silence: a missing badge
  // means no bubble, which is the same thing the server means when it drops a zero.
  const loadBadges = async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/badges`)
      const json = await res.json()
      setBadges(json?.data && typeof json.data === 'object' ? json.data : {})
    } catch { /* no bubbles rather than wrong bubbles */ }
  }

  useEffect(() => { load(); loadBadges() }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]
  const headline: any[] = data?.headline || []
  const waiting: Waiting[] = useMemo(() => data?.waiting || [], [data])
  const moving: Flight[] = useMemo(() => data?.moving || [], [data])
  const target = data?.target as { value: number; of: number } | null | undefined
  const role: string = data?.role || data?.scope || 'leadership'
  const primary = PRIMARY[role]

  /* The uncapped truth. `waiting` and `moving` are sliced to fourteen rows server-side, so
     anything that states a total or draws a distribution reads these instead of the arrays.
     An older server that does not send them falls back to the array length, which is correct
     for that server: there was no cap to be wrong about before the cap existed. */
  const waitingTotal: number = Number.isFinite(Number(data?.waiting_total))
    ? Number(data.waiting_total) : waiting.length
  const movingTotal: number = Number.isFinite(Number(data?.moving_total))
    ? Number(data.moving_total) : moving.length

  /* Slot 2. Four figures, never five: the fifth means the band has two subjects. The server
     sends three for some roles, and three figures at a third of the width each is a band
     too, so the count follows the data rather than being padded out to four. */
  const figures = headline.slice(0, 4)

  /* Slot 3. The picture, drawn from the uncapped counts and never from the capped lists. */
  const chart = useStageColumns(waiting, data?.waiting_counts, data?.stage_counts)

  const shownWaiting = allWaiting ? waiting : waiting.slice(0, 7)
  const shownFlight = allFlight ? moving : moving.slice(0, 7)

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-5">
          <Skeleton className="h-12 w-72 rounded-ds-lg" />
          {/* The loaded band draws no box per figure, so the skeleton does not promise one. */}
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-10 w-24 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-ds-4">
            <Skeleton className="col-span-12 h-[340px] rounded-ds-surface xl:col-span-8" />
            <Skeleton className="col-span-12 h-[340px] rounded-ds-surface xl:col-span-4" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">

        {/* ── slot 1: who, when, and the ONE action this screen is for ───────────────────
            The primary action spent a rewrite inside the shortcut strip, as the single black
            pill among outlined ones. It reads better up here and the rule is cleaner for it:
            one primary action per screen, in the place every other screen in the console puts
            it. Search and refresh stay quiet round buttons, because neither is why anybody
            opened this page. */}
        <div data-tour="today-greeting">
          <PageHead
            title={`${greeting()}${first ? `, ${first}` : ''}`}
            sub={dayLabel()}
            action={
              <>
                <RoundButton icon={Search} label="Search" onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))} />
                <RoundButton icon={RefreshCw} label="Refresh"
                             className={refreshing ? 'animate-spin' : undefined}
                             onClick={() => { load(true); loadBadges() }} />
                {primary && (
                  <Button
                    type="button"
                    size="lg"
                    className="h-11 rounded-full px-5 font-semibold"
                    onClick={() => router.push(primary.href)}
                  >
                    {primary.verb
                      ? `${primary.verb} ${shortName(primary.href).toLowerCase()}`
                      : shortName(primary.href)}
                  </Button>
                )}
              </>
            }
          />
        </div>

        {/* ── slot 2: the figures, as figures ───────────────────────────────────────────
            Four numbers at 30px with 40px of air between them and no borders at all. The
            reason sits under each one and turns amber when it is bad news, which is the only
            thing colour is allowed to mean here. Every figure that leads somewhere is a
            button: a number you cannot open is a number you cannot act on. */}
        {figures.length > 0 && (
          <StatGrid cols={figures.length === 3 ? 3 : 4}>
            {figures.map((h: any) => {
              const n = Number(h.value)
              const measured = h.value !== null && h.value !== undefined
              const value = !measured
                ? <Dash reason="unmeasured" what={String(h.label).toLowerCase()} />
                : h.format === 'aed'
                  ? (Number.isFinite(n)
                      ? <Aed>{money(n)}</Aed>
                      : <Dash reason="unmeasured" what={String(h.label).toLowerCase()} />)
                  : h.value
              return (
                <Stat
                  key={h.label}
                  label={h.label}
                  value={value}
                  tone={(h.tone as Tone) || 'neutral'}
                  hint={h.hint
                    ? <span className={REASON_INK[h.tone as string]}>{h.hint}</span>
                    : undefined}
                  onClick={h.href ? () => router.push(h.href) : undefined}
                />
              )
            })}
          </StatGrid>
        )}

        {/* ── slots 3 and 4: the picture, and what needs this person beside it ──────────
            Eight columns and four. The picture is the only thing on the page allowed to be
            this tall, and the queue is the only thing anybody acts on, which is why they sit
            together above the fold and everything else is a scroll. */}
        <section className="grid grid-cols-12 gap-ds-4">

          <div className="col-span-12 xl:col-span-8">
            {chart ? (
              <Panel
                title="Where your work stands"
                description="Every piece, not just the ones listed below. Lime is yours to move, grey is sitting with somebody else, amber is late."
              >
                <StageColumns cols={chart.cols} />
              </Panel>
            ) : (
              /* No sequence holds enough of this person's work to draw honestly, so the slot
                 goes to the drawing that is always true: who holds the work company-wide, in
                 the order it changes hands, at live counts. */
              <ProcessFlow scope={role} />
            )}
          </div>

          <div className="col-span-12 space-y-ds-4 xl:col-span-4">

            {/* The target, where leadership has set one for this role. It is the one
                measured fraction on this screen, which is why it is the only ring. */}
            {target && (
              <Panel title="Today's target">
                <div className="flex items-center justify-between gap-ds-3">
                  <div>
                    <p className="text-[1.75rem] font-semibold leading-none tabular-nums">
                      {target.value}
                      <span className="ml-1 align-baseline text-ds-label font-normal text-muted-foreground">
                        of {target.of}
                      </span>
                    </p>
                    <p className="mt-ds-1 text-ds-caption text-muted-foreground">
                      {target.value >= target.of
                        ? 'Done for today'
                        : `${target.of - target.value} to go`}
                    </p>
                  </div>
                  <Ring
                    size={72}
                    pct={Math.min(100, Math.round((target.value / Math.max(target.of, 1)) * 100))}
                  />
                </div>
              </Panel>
            )}

            {/* Grouped by the job rather than listed by the row. Eleven rows, seven of them
                saying "Clear N creators" with the same sentence beside each, is one decision
                drawn seven times. Capped at seven, because seven is where a list stops being
                scannable; the rest are one press away and the press says how many. */}
            <Panel
              title={failed ? 'Needs you' : `Needs you · ${waitingTotal}`}
              /* The count on the title is the REAL one. What the panel can show is at most
                 fourteen, because that is what the server sends, so the line underneath says
                 so rather than letting fourteen stand in for sixty. */
              description={!failed && waitingTotal > shownWaiting.length
                ? `Showing ${shownWaiting.length} of ${waitingTotal}, longest wait first.`
                : undefined}
              action={!failed && waiting.length > 7 ? (
                <Button variant="ghost" size="sm" onClick={() => setAllWaiting(v => !v)}
                        aria-expanded={allWaiting}>
                  {/* Labelled for what it does. This button reveals the rows this screen
                      holds; it cannot conjure the ones the server did not send, so it does
                      not offer to. */}
                  {allWaiting ? 'Show less' : `Show all ${waiting.length} here`}
                </Button>
              ) : undefined}
            >
              <WaitingOnYou items={shownWaiting} failed={failed} onRetry={() => load(true)} />
            </Panel>
          </div>
        </section>

        {/* ── slot 5: the process ───────────────────────────────────────────────────────
            Its own section and its own header, because it is its own subject: not what is on
            this person's desk but who holds the work across the company, in the order it
            changes hands, with the pile-up named. It renders here only when slot 3 took the
            columns, so the drawing appears exactly once on the page. */}
        {chart && (
          <section>
            <SectionHead
              icon={GitBranch}
              title="The process"
              note="Who holds the work, in the order it changes hands. Live counts."
            />
            <ProcessFlow scope={role} />
          </section>
        )}

        {/* ── slot 6: elsewhere, and where you go next ──────────────────────────────────
            Two panels, half the width each. One says what is moving without this person and
            who has it; the other is the handful of places where work is waiting for them
            right now, carrying the count that makes each worth pressing.

            The staff row the design calls for at the foot of a leadership dashboard - faces
            with a ring each against their own daily target - is not drawn, because this
            screen is told nothing about anybody but the viewer. Drawing it would mean
            inventing per-person numbers, so the section removes itself instead. */}
        <section>
          <SectionHead icon={Compass} title="Elsewhere, and where you go next" />
          <div className="grid grid-cols-12 gap-ds-4">
              {moving.length > 0 && (
                <div className="col-span-12 xl:col-span-6">
                  <Panel
                    title={`Running without you · ${movingTotal}`}
                    description={movingTotal > shownFlight.length
                      ? `Showing ${shownFlight.length} of ${movingTotal}, and who has each one.`
                      : 'Moving, and who has it.'}
                    action={moving.length > 7 ? (
                      <Button variant="ghost" size="sm" onClick={() => setAllFlight(v => !v)}
                              aria-expanded={allFlight}>
                        {allFlight ? 'Show less' : `Show all ${moving.length} here`}
                      </Button>
                    ) : undefined}
                  >
                    <ul className="-mt-ds-2">
                      {shownFlight.map(r => (
                        <ElsewhereRow key={`${r.title}-${r.href ?? ''}`} row={r} />
                      ))}
                    </ul>
                  </Panel>
                </div>
              )}

              <div className={cn('col-span-12',
                                 moving.length > 0 ? 'xl:col-span-6' : 'xl:col-span-12')}>
                <Panel
                  title="Where you go next"
                  description="The places with work waiting for you, biggest pile first."
                >
                  <Shortcuts scope={role} badges={badges} primary={null} />
                </Panel>
            </div>
          </div>
        </section>

      </div>
    </SuperadminLayout>
  )
}
