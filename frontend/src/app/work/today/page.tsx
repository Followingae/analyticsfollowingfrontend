'use client'

/**
 * Today — the dashboard a teammate runs their day from.
 *
 * Three rewrites got us here. The first was six competing regions. The second overcorrected
 * into a single scroll. The third put a grid back and, in doing so, drew four cards, five
 * heading sizes, thirteen hardcoded type sizes and three separate treatments for what was
 * always one thing: an item with a name, an age and somewhere to go.
 *
 * This is the fourth, and the rule it follows is the one the token file already stated:
 * whitespace is the grouping mechanism, and a border drawn round a number is a second edge
 * the eye must cross to read it. So there are no cards on this screen at all.
 *
 *   the greeting, the date, and the screen's one action
 *   four numbers, unboxed, gaps doing the work a hairline was doing
 *   Waiting on you        one table
 *   Running without you   the same table, with an owner column
 *   the shortcuts, last, as plain links
 *
 * Two regions became one. The job card and the queue were listing the same decisions, and
 * the server reconciled them by deleting queue items whose titles began with certain English
 * words. They are one list now, so there is nothing to reconcile.
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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DataTable, DataTableColumnHeader } from '@/components/ui2/data-table'
import { ArrowUpRight, CheckCircle2, GitBranch, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import {
  Aed, MiniBar, PageHead, Ring, RoundButton, ScoreDot, StageBar, Stat, StatGrid, type Tone,
} from '@/components/console/primitives'
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

const PRIMARY: Record<string, { label: string; href: string }> = {
  leadership: { label: 'Sign-offs', href: '/work/approvals' },
  // A talent manager had no primary action at all, on the one screen whose whole job for
  // them is finding people. Adding costs nothing, which is exactly why it should be here.
  talent: { label: 'Add a creator', href: '/work/influencers?new=1' },
  // The clients list holds no owner filter, so this opened everybody's book. Until it
  // does, the label says what the destination actually is.
  account: { label: 'Open the client list', href: '/work/clients' },
  business_development: { label: 'Log a brand', href: '/work/brands?new=1' },
}

const SHORTCUTS: {
  key: string; label: string; href: string
  module?: AdminModule; scopes?: string[]
}[] = [
  { key: 'areas', label: 'Brand rosters', href: '/work/areas',
    scopes: ['leadership', 'talent', 'business_development'] },
  { key: 'waiting-room', label: 'Needs a price', href: '/work/influencers/review',
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'proposals', label: 'Proposals', href: '/work/proposals', module: 'proposals' },
  { key: 'campaigns', label: 'Campaigns', href: '/work/campaigns', module: 'campaigns' },
  { key: 'brands', label: 'Brands', href: '/work/brands', module: 'clients' },
  { key: 'approvals', label: 'Sign-offs', href: '/work/approvals', scopes: ['leadership'] },
  { key: 'payables', label: 'Creator payments', href: '/work/payables',
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'coverage', label: "Where we're thin", href: '/work/coverage',
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'screens', label: 'Office screens', href: '/work/system/displays',
    module: 'system', scopes: ['leadership'] },
]

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

export default function Today() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allFlight, setAllFlight] = useState(false)

  const load = async (quiet = false) => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load your day')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]
  const headline: any[] = data?.headline || []
  const waiting: Waiting[] = useMemo(() => data?.waiting || [], [data])
  const moving: Flight[] = useMemo(() => data?.moving || [], [data])
  const target = data?.target as { value: number; of: number } | null | undefined
  const role: string = data?.role || data?.scope || 'leadership'
  const primary = PRIMARY[role]
  const shortcuts = SHORTCUTS.filter(
    s => (!s.module || can(s.module)) && (!s.scopes || s.scopes.includes(role)))

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

  const waitingCols = useMemo<ColumnDef<Waiting, any>[]>(() => {
    const cols: ColumnDef<Waiting, any>[] = [
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
    if (has(waiting, r => r.where)) cols.push({
      id: 'where',
      accessorKey: 'where',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Where" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.where || ''}</span>,
    })
    if (has(waiting, r => r.of)) cols.push({
      id: 'progress',
      accessorFn: r => r.value ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Found" />,
      cell: ({ row }) => {
        const r = row.original
        return typeof r.of === 'number' && r.of > 0
          ? <MiniBar value={r.value ?? 0} max={r.of} tone="info" />
          : null
      },
    })
    cols.push({
      id: 'why',
      accessorKey: 'reason',
      header: 'Why it is stopped',
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className="flex flex-wrap items-center gap-ds-2">
            {r.stage_label && (
              <Badge className={cn('whitespace-nowrap', TONE_BADGE[r.tone || 'neutral'])}>
                {r.stage_label}
              </Badge>
            )}
            <span className="text-muted-foreground">{r.reason}</span>
          </span>
        )
      },
    })
    cols.push({
      id: 'waiting',
      accessorFn: r => r.age_days ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Waiting" />,
      cell: ({ row }) => (
        <Age days={row.original.age_days ?? 0} urgency={row.original.urgency} />
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
  }, [waiting, router])

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
                <RoundButton icon={RefreshCw} label="Refresh" onClick={() => load(true)} />
                {primary && (
                  <Button data-tour="today-add" className="rounded-ds-full"
                          onClick={() => router.push(primary.href)}>
                    {primary.label}
                  </Button>
                )}
              </>
            }
          />
        </div>

        {/* the numbers. No box each: the gap is what says these are separate figures. */}
        {headline.length > 0 && (
          <div data-tour="today-numbers">
            <StatGrid cols={4}>
              {headline.map((h: any) => (
                <Stat
                  key={h.label}
                  label={h.label}
                  /* A headline the API did not return used to render as a confident AED 0.
                     A zero that is really an absence is a lie about money, which is the one
                     thing on this screen nobody should have to double-check. */
                  value={h.value == null ? '—'
                    : h.format === 'aed' ? <Aed>{aed(Number(h.value) || 0)}</Aed>
                    : h.value}
                  hint={h.hint || undefined}
                  tone={(h.tone || 'neutral') as Tone}
                  onClick={h.href ? () => router.push(h.href) : undefined}
                />
              ))}
            </StatGrid>
          </div>
        )}

        {/* everything stopped on this person, in one treatment */}
        <section data-tour="today-queue" className="space-y-ds-3">
          <div className="flex flex-wrap items-center justify-between gap-ds-3">
            <h2 className="flex items-center gap-ds-2 text-ds-heading">
              Waiting on you
              {waiting.length > 0 && (
                <span className="text-ds-caption tabular-nums text-muted-foreground">
                  {waiting.length}
                </span>
              )}
            </h2>
            {target && (
              <div className="flex items-center gap-ds-3">
                <div className="text-right">
                  <p className="text-ds-caption text-muted-foreground">Today's goal</p>
                  <p className="text-ds-label tabular-nums">
                    {target.value} of {target.of}
                  </p>
                </div>
                <Ring
                  size={60}
                  pct={Math.min(100, Math.round((target.value / Math.max(target.of, 1)) * 100))}
                />
              </div>
            )}
          </div>

          {waiting.length > 0 ? (
            <DataTable
              columns={waitingCols}
              data={waiting}
              hidePagination
              emptyState="Nothing is waiting on you."
            />
          ) : (
            <div className="flex flex-col items-center gap-ds-2 py-ds-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-[var(--tone-good-dot)]" />
              <p className="text-ds-label">Nothing is waiting on you</p>
            </div>
          )}
        </section>

        {/* running without them. Same table, and a column saying whose it is. */}
        {moving.length > 0 && (
          <section className="space-y-ds-3">
            <div className="flex flex-wrap items-center justify-between gap-ds-3">
              <h2 className="flex items-center gap-ds-2 text-ds-heading">
                Running without you
                <span className="text-ds-caption tabular-nums text-muted-foreground">
                  {moving.length}
                </span>
              </h2>
              {moving.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => setAllFlight(v => !v)}>
                  {allFlight ? 'Show less' : `Show all ${moving.length}`}
                </Button>
              )}
            </div>
            <DataTable
              columns={movingCols}
              data={shownFlight}
              hidePagination
              emptyState="Nothing is running."
            />
          </section>
        )}

        {/* The shortcuts. They were a card in the right column competing with the work; the
            sidebar and Ctrl+K already reach all nine, so they go last and go quiet. */}
        {shortcuts.length > 0 && (
          <div data-tour="today-shortcuts"
               className="flex flex-wrap items-center gap-x-ds-1 gap-y-ds-2 pt-ds-2">
            {shortcuts.map(s => (
              <Button
                key={s.href}
                data-tour={`shortcut-${s.key}`}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => router.push(s.href)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </SuperadminLayout>
  )
}
