'use client'

/**
 * The dashboard.
 *
 * Five rewrites got here, and the fifth was the instructive one: the page grew a band of
 * fourteen "areas you can open" cards, kept the shortcut strip that listed the same
 * destinations, kept the process rail, and deleted nothing. Seven stacked regions and about
 * forty-five clickable things. The founder's word for it was a ship console, and he was
 * right.
 *
 * The lesson is written here because it is the one this screen keeps having to relearn:
 *
 *   A DASHBOARD ANSWERS "WHAT DO I DO NOW". NAVIGATION ANSWERS "WHERE CAN I GO".
 *
 * The sidebar answers the second question on every screen in the product. Answering it again
 * in cards, and a third time in a strip of chips, is not orientation - it is the same list
 * three times, and it buries the one thing this page exists for.
 *
 * So the page is, in order:
 *
 *   who you are and the date
 *   the process, drawn, with your station marked and the pile-up named
 *   the four to six places work is waiting for you, as buttons carrying their counts
 *   the figures this role is judged on, as one line of text
 *   Pending - what is stopped on you, grouped by job, oldest first
 *
 * and one more, collapsed: what is running without you, for when you want it.
 *
 * THE SIXTH REWRITE, and what it corrected. The fifth deleted the cards and the chips and
 * was right to, but it left five equal boxes for the process and four equal boxes for the
 * numbers, so the screen still opened with nine same-sized boxes carrying about twenty
 * figures at one weight. "What the hell do I even have to do" was the founder's reading of
 * it, and equal weight is exactly why: nothing on the page claimed to matter more than
 * anything else. The fix is not fewer facts, it is unequal weight. The process is now drawn
 * rather than boxed, at a size that makes it the first thing you see, and its bands are as
 * thick as the piles they carry, so the bottleneck is visible from across the room. The
 * destinations came back as SHORTCUTS rather than as navigation: not everywhere you may go,
 * but the few places where something is waiting for you, sorted by how much. The numbers
 * kept their content and lost their boxes.
 *
 * Navigation still lives in the sidebar. A shortcut that carries no count and no urgency is
 * navigation wearing a button, and it does not belong here.
 *
 * The age is a number the server sends. It used to be formatted into a sentence there and
 * regexed back out here, which meant any row whose sentence had no age phrase in it - "AED
 * 12,000 approved and waiting" - fell through to a neutral dot. Both halves of that round
 * trip are gone.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { ProcessFlow } from '@/components/console/ProcessFlow'
import { Shortcuts } from '@/components/console/Shortcuts'
import { WaitingOnYou } from '@/components/console/WaitingOnYou'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DataTable, DataTableColumnHeader } from '@/components/ui2/data-table'
import { ArrowUpRight, ChevronDown, GitBranch, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import {
  Aed, MiniBar, PageHead, Ring, RoundButton, ScoreDot, StageBar, Stat,
  StatGrid, type Tone,
} from '@/components/console/primitives'
import { shortName } from '@/lib/destinations'
import { cn } from '@/lib/utils'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const dayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** Big money is read at a glance, so it is shortened; small money is read exactly. */
const aed = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 10_000 ? `${Math.round(n / 1000)}K`
  : Math.round(n).toLocaleString()

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

/**
 * The age badge.
 *
 * Every row has a real age now, so the "no age recorded" dot is gone: there is nothing left
 * for it to mean. Urgency still darkens the badge, because a founder chasing an invoice on
 * day one is not the same as a roster idle for one day.
 */
function Age({ days, urgency }: { days: number; urgency?: string }) {
  const tone: Tone = urgency === 'high' || days >= 7 ? 'bad' : days >= 3 ? 'warn' : 'good'
  return (
    <ScoreDot
      value={days === 0 ? 'new' : days}
      suffix={days === 0 ? undefined : 'd'}
      tone={tone}
      title={days === 0 ? 'Arrived today' : `Waiting ${days} day${days === 1 ? '' : 's'}`}
    />
  )
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

/* The label-to-icon mapping that lived here went with the four number cards. The figures are
   a line of text now, and a line of text does not want eight icon chips in it. */

export default function Today() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  // A failed load used to leave `waiting` at [], which the queue rendered as a green tick and
  // "Nothing is waiting on you". That is the fabricated-zero sin in a new costume: silence
  // reported as good news, on the one screen somebody uses to decide their day.
  const [failed, setFailed] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
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

  // The bubbles on the area cards. Its own request, and its own silence: a missing badge
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

  /**
   * A column appears when at least one row has something to put in it.
   *
   * This screen is the console home for four roles and the shapes genuinely differ: only
   * talent rosters and account clients carry a real fraction, and leadership decisions carry
   * none at all. A column that is blank for three roles out of four is furniture, and a
   * fraction invented so a column can exist is worse than furniture.
   */
  const has = <T,>(rows: T[], f: (r: T) => unknown) => rows.some(r => {
    const v = f(r)
    return v !== null && v !== undefined && v !== ''
  })


  const movingCols = useMemo<ColumnDef<Flight, any>[]>(() => {
    const cols: ColumnDef<Flight, any>[] = [
      {
        id: 'what',
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="What" />,
        cell: ({ row }) => {
          const r = row.original
          return r.href
            ? <Link href={r.href} className="font-medium hover:underline">{r.title}</Link>
            : <span className="font-medium">{r.title}</span>
        },
      },
    ]
    if (has(moving, r => r.of)) cols.push({
      id: 'progress',
      accessorFn: r => r.value ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Done" />,
      cell: ({ row }) => {
        const r = row.original
        return typeof r.of === 'number' && r.of > 0
          ? <MiniBar value={r.value ?? 0} max={r.of} tone="good" />
          : null
      },
    })
    cols.push({
      id: 'why',
      accessorKey: 'reason',
      header: 'Where it stands',
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className="flex flex-wrap items-center gap-ds-2">
            {r.stage_label && (
              <Badge className={cn('whitespace-nowrap', TONE_BADGE.neutral)}>
                {r.stage_label}
              </Badge>
            )}
            <span className="text-muted-foreground">{r.reason}</span>
          </span>
        )
      },
    })
    // The column that stops this reading as a second queue. Three of leadership's rows are
    // chases that are already late; they are the talent team's chases.
    cols.push({
      id: 'owner',
      accessorKey: 'owner',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Who has it" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.owner}</span>
      ),
    })
    cols.push({
      id: 'open',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Detail row={r} />
            {r.href && (
              <RoundButton icon={ArrowUpRight} label={`Open ${r.title}`}
                           onClick={() => router.push(r.href!)} />
            )}
          </div>
        )
      },
    })
    return cols
  }, [moving, router])

  const shownFlight = allFlight ? moving : moving.slice(0, 5)

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
          <Skeleton className="h-[320px] rounded-ds-surface" />
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">

        {/* who, when, and the one action this screen is for */}
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
                {/* The primary action moved down into the shortcut row, where it is the one
                    black button among the outlined ones. It was competing with the greeting
                    up here, and a person looking for "the thing I press" should find every
                    candidate in a single line rather than two corners of the screen. */}
              </>
            }
          />
        </div>

        {/* The fourteen area cards that sat here have gone, and the reasoning is worth
            keeping. The ask they answered was "tell me what I have access to" - but the
            sidebar answers that on every screen in the product, and the shortcut strip at
            the foot of this page answered it a third time. Three lists of the same
            destinations is not orientation, it is the ship console the founder saw.

            A dashboard answers "what do I do now". Navigation answers "where can I go".
            This page does the first one only. */}

        {/* Who holds the work, in the order it changes hands. It belongs here rather than
            in the guide: it carries live counts, so it is the only place in the product that
            says where work is piling up right now. */}
        <ProcessFlow scope={role} />

        {/* Where this person goes next. The count is the argument for pressing it, so a
            shortcut with work behind it sorts to the front and the rest keep their order. */}
        <Shortcuts
          scope={role}
          badges={badges}
          primary={primary ? {
            href: primary.href,
            label: primary.verb
              ? `${primary.verb} ${shortName(primary.href).toLowerCase()}`
              : shortName(primary.href),
          } : null}
        />

        {/* The four number cards that sat here are one line now.
            They were the same size as everything else on the screen, boxed like the queue
            and the process, and two of the four repeated a figure the process drawing had
            already shown - so a reader met the same number twice at the same weight and had
            to work out whether it was the same thing. A dashboard may state a measure
            without dressing it as an event: these are the figures this role is judged on,
            they are readable in one pass, and the ones that lead somewhere are underlined
            on hover like any other link. */}
        {headline.length > 0 && (
          <div data-tour="today-numbers"
               className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-[13px]">
            {headline.map((h: any) => {
              const value = h.value == null ? '—'
                : h.format === 'aed' ? <Aed>{aed(Number(h.value) || 0)}</Aed>
                : h.value
              const body = (
                <>
                  <span className="font-semibold tabular-nums text-foreground">{value}</span>
                  <span className="text-muted-foreground">{h.label.toLowerCase()}</span>
                  {h.hint && (
                    <span className="text-muted-foreground/70">· {h.hint}</span>
                  )}
                </>
              )
              return h.href ? (
                <button key={h.label} type="button" onClick={() => router.push(h.href)}
                        className="inline-flex items-center gap-1.5 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                  {body}
                </button>
              ) : (
                <span key={h.label} className="inline-flex items-center gap-1.5">{body}</span>
              )
            })}
          </div>
        )}

        {/* The reference puts the work on the left and the secondary widgets in a rail on the
            right, and the reason is not decoration: the queue is the only thing on this
            screen anybody acts on, so it gets the width and the eye. The target, what is
            running without you, and the shortcuts are all things you glance at, and a glance
            does not need a full column. */}
        <div className="grid gap-ds-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">

        <section data-tour="today-queue"
                 className="space-y-ds-3 rounded-[var(--radius-card)] border bg-card p-ds-3
                            shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-ds-3">
            <h2 className="flex items-center gap-ds-2 text-ds-heading">
              Pending
              {waiting.length > 0 && (
                <span className="text-ds-caption tabular-nums text-muted-foreground">
                  {waiting.length}
                </span>
              )}
            </h2>
          </div>

          {/* Grouped by the job rather than listed by the row. Eleven rows, seven of them
              saying "Clear N creators" with the same sentence beside each, is one decision
              drawn seven times — and reading seven rows to learn one fact is most of why
              this screen felt like noise. Every original row is still here, inside its
              card. */}
          {failed
            ? <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">Could not load this.</p>
                <Button variant="outline" size="sm" onClick={() => load(true)}>Try again</Button>
              </div>
            : <WaitingOnYou items={waiting} />}
        </section>

        {/* ── the rail ─────────────────────────────────────────────────────────────── */}
        <aside className="space-y-ds-3">

          {/* The target, given its own surface. It used to sit in the queue heading, where a
              ring against a table header read as a decoration on somebody else's list. */}
          {target && (
            <div className="rounded-[var(--radius-card)] border bg-card p-ds-3
                            shadow-[var(--shadow-card)]">
              <p className="text-ds-caption text-muted-foreground">Target</p>
              <div className="mt-ds-2 flex items-center justify-between gap-ds-3">
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
            </div>
          )}

          {/* "Running without you" used to be summarised here as well as listed in full
              lower down, so the same heading appeared twice on one screen. The flow rail at
              the top now answers "what is moving elsewhere" better than a six-row summary
              did — with every stage and a number on each — so the summary goes and the full
              table stays exactly as it was. */}
        </aside>
        </div>

        {/* The full table. The rail above answers "is anything moving"; this answers "show me
            all of it", with every column it always had. Collapsed by default because the same
            information now has a summary, and two full-width tables was the density complaint
            in the first place. Nothing is removed: the toggle is the only new thing. */}
        {moving.length > 0 && (
          <section className="space-y-ds-3">
            <div className="flex flex-wrap items-center justify-between gap-ds-3">
              <button
                type="button"
                onClick={() => setAllFlight(v => !v)}
                aria-expanded={allFlight}
                className="flex items-center gap-ds-2 text-ds-heading hover:underline"
              >
                Elsewhere
                <span className="text-ds-caption tabular-nums text-muted-foreground">
                  {moving.length}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform',
                                           allFlight && 'rotate-180')} />
              </button>
            </div>
            {allFlight && (
              <DataTable
                columns={movingCols}
                data={moving}
                hidePagination
                emptyState="Nothing here."
              />
            )}
          </section>
        )}

      </div>
    </SuperadminLayout>
  )
}
