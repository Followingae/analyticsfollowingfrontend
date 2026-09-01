'use client'

/**
 * Today — the dashboard a teammate runs their day from.
 *
 * Two rewrites got us here. The first was six competing regions: four gradient stat cards, a
 * row of action cards, a strip of chips, a queue, and a canvas repeating whatever the queue
 * had auto-selected — you read all six to learn one fact. The second overcorrected into a
 * single vertical scroll and threw the dashboard out with the clutter.
 *
 * So: a grid, not a column, and one job at the centre of it.
 *
 *   ┌──────────────────────────────┬───────────────┐
 *   │  the job card                │  the numbers  │   your work, and the shape of it
 *   │  (goal ring · chart · rows)  │  the places   │
 *   ├──────────────────────────────┼───────────────┤
 *   │  waiting on me               │  in flight    │   what is stopped, and what is not
 *   └──────────────────────────────┴───────────────┘
 *
 * The job card is the simplification that survived: one row per client, the detail folded
 * inside it, so "which brand needs creators today" is answered without reading the screen.
 * Everything else is beside it rather than above it.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ArrowUpRight, CheckCircle2, ChevronDown, RefreshCw, Search, Sparkles,
  Users, Layers, FileText, Banknote, Monitor, ClipboardCheck, Building2, Compass,
} from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import {
  Aed, CARD, GroupLabel, Ring, RoundButton, ScoreDot, StageBar, type Tone,
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

type Item = {
  urgency?: string; title: string; detail?: string; href?: string
  at?: number | null
}

type FocusRow = {
  id: string; label: string; href: string
  stage_label?: string; tone?: Tone; flow?: string | null; at?: number | null
  value?: number | null; of?: number | null; meta?: string
  wants_more?: boolean
  actions?: { label: string; href: string }[]
}

/** The sequences a row can sit in. Named here only to draw them; the server says where. */
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

const flowOf = (href?: string) =>
  !href ? null
  : /influencers\/review|\/areas/.test(href) ? 'areas'
  : /proposals/.test(href) ? 'proposals'
  : /ladder|chasing|campaigns/.test(href) ? 'ladder'
  : /brands|clients/.test(href) ? 'brands'
  : null

const PRIMARY: Record<string, { label: string; href: string }> = {
  leadership: { label: 'Sign-offs', href: '/work/approvals' },
  account: { label: 'Open my clients', href: '/work/clients' },
  business_development: { label: 'Log a brand', href: '/work/brands?new=1' },
}

const SHORTCUTS: {
  key: string; label: string; href: string; icon: any
  module?: AdminModule; scopes?: string[]
}[] = [
  { key: 'areas', label: 'Brand rosters', href: '/work/areas', icon: Layers,
    scopes: ['leadership', 'talent', 'business_development'] },
  { key: 'waiting-room', label: 'Needs a price', href: '/work/influencers/review', icon: Users,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'proposals', label: 'Proposals', href: '/work/proposals', icon: FileText, module: 'proposals' },
  { key: 'campaigns', label: 'Campaigns', href: '/work/campaigns', icon: Sparkles, module: 'campaigns' },
  { key: 'brands', label: 'Brands', href: '/work/brands', icon: Building2, module: 'clients' },
  { key: 'approvals', label: 'Sign-offs', href: '/work/approvals', icon: ClipboardCheck,
    scopes: ['leadership'] },
  { key: 'payables', label: 'Creator payments', href: '/work/payables', icon: Banknote,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'coverage', label: "Where we're thin", href: '/work/coverage', icon: Compass,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'screens', label: 'Office screens', href: '/work/system/displays', icon: Monitor,
    module: 'system', scopes: ['leadership'] },
]

function age(item: Item): { value: string; suffix?: string; tone: Tone; label: string } {
  if (item.urgency === 'high') return { value: '!', tone: 'bad', label: 'Needs attention now' }
  const d = (item.detail || '').toLowerCase()
  const WORDS: Record<string, number> = {
    a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10,
  }
  const m = /(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|week|month)/.exec(d)
  if (!m) return { value: '·', tone: 'neutral', label: 'No age recorded' }
  const count = /^\d+$/.test(m[1]) ? Number(m[1]) : (WORDS[m[1]] ?? 1)
  const days = m[2] === 'week' ? count * 7 : m[2] === 'month' ? count * 30 : count
  if (days === 0) return { value: 'new', tone: 'good', label: 'Arrived today' }
  const tone: Tone = days >= 7 ? 'bad' : days >= 3 ? 'warn' : 'good'
  return { value: String(days), suffix: 'd', tone, label: `Waiting ${days} day${days === 1 ? '' : 's'}` }
}

function IconButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      type="button" onClick={onClick} title={label} aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-black/[0.06] bg-white
                 text-muted-foreground transition-colors hover:text-foreground
                 dark:border-white/[0.08] dark:bg-neutral-900/70"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/* The four tones were spelled out here as hex pairs, again, a third set of slightly
   different greens and ambers. They are now the console tone tokens, defined once in the
   .console-shell block and therefore unreachable from a client page. */
const TONE_BADGE: Record<string, string> = {
  good: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  warn: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  bad: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  neutral: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const TILE_DOT: Record<string, string> = {
  good: 'bg-[var(--tone-good-dot)]',
  warn: 'bg-[var(--tone-warn-dot)]',
  bad: 'bg-[var(--tone-bad-dot)]',
  neutral: 'bg-[var(--tone-info-dot)]',
}

/**
 * One number from the day's headline.
 *
 * It used to be a card: the CARD hairline and shadow, plus a two-stop gradient wash, plus
 * its own padding. Four of them stacked two-by-two in the side column put a grid of edges
 * beside a panel that already has one, and the numbers inside them were 26px — smaller than
 * the borders were wide, in effect.
 *
 * The shell and the gradient come off. Tone survives as the dot beside the label, which is
 * how every other surface in this console marks state, and the figure grows into the room
 * the padding and border were using.
 */
function Tile({ label, value, hint, tone = 'neutral', money, onClick }: {
  label: string; value: React.ReactNode; hint?: string; tone?: string
  money?: boolean; onClick?: () => void
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={!onClick}
      className={cn(
        'rounded-ds-lg px-ds-2 py-ds-2 text-left transition-colors',
        onClick && 'hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2 ' +
                   'focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-white/[0.05]',
      )}
    >
      <span className="flex items-center gap-ds-2">
        <span className={cn('h-1.5 w-1.5 flex-none rounded-full', TILE_DOT[tone] ?? TILE_DOT.neutral)}
              aria-hidden />
        <span className="text-ds-caption font-medium text-muted-foreground">{label}</span>
      </span>
      <p className="mt-ds-2 text-[32px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
        {money ? <Aed>{value}</Aed> : value}
      </p>
      {hint && <p className="mt-ds-2 line-clamp-2 text-ds-caption text-muted-foreground">{hint}</p>}
    </button>
  )
}

export default function Today() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = async (quiet = false) => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
      if (!quiet) setOpen(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load your day')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]
  const headline: any[] = data?.headline || []
  const needs: Item[] = useMemo(() => data?.needs || [], [data])
  const moving: Item[] = useMemo(() => data?.moving || [], [data])
  const focus = data?.focus as { title?: string; kind?: string; rows?: FocusRow[]
                                 target?: { value: number; of: number } | null } | undefined
  const rows: FocusRow[] = focus?.rows || []
  const role: string = data?.role || data?.scope || 'leadership'
  const primary = PRIMARY[role]
  const shortcuts = SHORTCUTS.filter(
    s => (!s.module || can(s.module)) && (!s.scopes || s.scopes.includes(role)))

  // The biggest roster sets the scale, so the bars compare with each other rather than each
  // filling its own row to the brim and saying nothing.
  const widest = useMemo(
    () => Math.max(1, ...rows.map(r => Math.max(r.value ?? 0, r.of ?? 0))), [rows])

  const shown = showAll ? needs : needs.slice(0, 7)
  const money = headline.filter((h: any) => h.format === 'aed')
  const counts = headline.filter((h: any) => h.format !== 'aed')

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-5">
          <Skeleton className="h-12 w-72 rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-12">
            <Skeleton className="h-[380px] rounded-ds-2xl lg:col-span-8" />
            <Skeleton className="h-[380px] rounded-ds-2xl lg:col-span-4" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-5">

        {/* ── who, when, what is waiting ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 data-tour="today-greeting"
                className="text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[36px]">
              {greeting()}{first ? `, ${first}` : ''}
            </h1>
            <p className="text-[15px] text-muted-foreground">
              {dayLabel()} ·{' '}
              {needs.length
                ? <span className="text-foreground">{needs.length} waiting on you</span>
                : 'nothing is waiting on you'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon={Search} label="Search" onClick={() =>
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))} />
            <IconButton icon={RefreshCw} label="Refresh" onClick={() => load(true)} />
            {primary && (
              <button
                type="button"
                data-tour="today-add"
                onClick={() => router.push(primary.href)}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
                           transition-colors hover:bg-neutral-800
                           dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {primary.label}
              </button>
            )}
          </div>
        </div>

        {/* ── the desk ───────────────────────────────────────────────────────────── */}
        <div className="grid items-start gap-5 lg:grid-cols-12">

          {/* the job card — what you do, per client */}
          {rows.length > 0 && (
            <section data-tour="today-focus"
                     className={cn(CARD, 'bg-white lg:col-span-8 dark:bg-neutral-900/70')}>
              <header className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
                <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{focus?.title}</h2>
                {focus?.target && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[12px] text-muted-foreground">Today's goal</p>
                      <p className="text-[15px] font-semibold tabular-nums">
                        {focus.target.value} of {focus.target.of}
                      </p>
                    </div>
                    <Ring
                      size={62}
                      pct={Math.min(100, Math.round((focus.target.value / Math.max(focus.target.of, 1)) * 100))}
                    />
                  </div>
                )}
              </header>

              <Accordion type="single" collapsible className="px-3 pb-3">
                {rows.map(r => (
                  <AccordionItem key={r.id} value={r.id} className="border-b-0">
                    <AccordionTrigger className="rounded-2xl px-3 py-3 hover:bg-black/[0.03] hover:no-underline dark:hover:bg-white/[0.05]">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="min-w-0 flex-1 truncate text-left text-[14.5px] font-medium">
                            {r.label}
                          </span>
                          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                            {typeof r.of === 'number' && r.of > 0
                              ? `${r.value} of ${r.of}`
                              : typeof r.value === 'number' ? `${r.value}` : ''}
                          </span>
                          {r.stage_label && (
                            <Badge className={cn('shrink-0 whitespace-nowrap', TONE_BADGE[r.tone || 'neutral'])}>
                              {r.stage_label}
                            </Badge>
                          )}
                        </div>
                        {/* The row is its own bar. Filled to what we hold, with the gap to
                            target behind it — so five brands read as five lengths, and the
                            chart that used to repeat these same five names is gone. */}
                        {typeof r.value === 'number' && (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.10]">
                            <div
                              className={cn('h-full rounded-full transition-all duration-700',
                                            r.wants_more ? 'bg-[var(--console-lime)]' : 'bg-neutral-800 dark:bg-neutral-200')}
                              style={{ width: `${Math.max(3, ((r.value ?? 0) / widest) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      {r.flow && FLOWS[r.flow] && (
                        <div className="mb-3">
                          <StageBar
                            stages={FLOWS[r.flow]}
                            current={FLOWS[r.flow][
                              typeof r.at === 'number'
                                ? Math.max(0, Math.min(r.at, FLOWS[r.flow].length - 1))
                                : Math.max(0, FLOWS[r.flow].findIndex(
                                    s => s.label.toLowerCase() === (r.stage_label || '').toLowerCase()))
                            ]?.key || FLOWS[r.flow][0].key}
                          />
                        </div>
                      )}
                      {r.meta && <p className="text-[13.5px] text-muted-foreground">{r.meta}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(r.actions || [{ label: 'Open', href: r.href }]).map(a => (
                          <button
                            key={a.label + a.href}
                            type="button"
                            onClick={() => router.push(a.href)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2
                                       text-[13px] font-medium text-white transition-colors hover:bg-neutral-800
                                       dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                          >
                            {a.label}<ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* the side column: the numbers, then the places */}
          <div className={cn('space-y-5', rows.length > 0 ? 'lg:col-span-4' : 'lg:col-span-12')}>
            {/* -mx cancels the tile's own hover padding so the first column still lines up
                with the panel below it. The gap is what now says "these are two separate
                figures", the job the border used to do. */}
            {(money.length > 0 || counts.length > 0) && (
              <div data-tour="today-numbers" className="-mx-ds-2 grid grid-cols-2 gap-x-ds-4 gap-y-ds-4">
                {money.map((h: any) => (
                  /* Was aed(Number(h.value) || 0), so a headline the API did not return
                     rendered as a confident AED 0. A zero that is really an absence is a
                     lie about money, which is the one thing on this screen nobody should
                     have to double-check. */
                  <Tile key={h.label} label={h.label}
                        value={h.value == null ? '—' : aed(Number(h.value) || 0)}
                        money={h.value != null}
                        hint={h.hint} tone={h.tone}
                        onClick={h.href ? () => router.push(h.href) : undefined} />
                ))}
                {counts.map((h: any) => (
                  <Tile key={h.label} label={h.label} value={h.value ?? '—'} hint={h.hint} tone={h.tone}
                        onClick={h.href ? () => router.push(h.href) : undefined} />
                ))}
              </div>
            )}

            <div data-tour="today-shortcuts" className={cn(CARD, 'bg-white p-3 dark:bg-neutral-900/70')}>
              <p className="px-2 pb-2 pt-1 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Go to
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {shortcuts.map(s => (
                  <button
                    key={s.href}
                    type="button"
                    data-tour={`shortcut-${s.key}`}
                    onClick={() => router.push(s.href)}
                    className="group flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-[12.5px]
                               transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.05]
                                     transition-colors group-hover:bg-[var(--tone-info-wash)]
                                     dark:bg-white/[0.08] dark:group-hover:bg-[var(--tone-info-wash)]">
                      <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* what is stopped on you */}
          {needs.length > 0 && (
            <section data-tour="today-queue"
                     className={cn(CARD, 'bg-white lg:col-span-8 dark:bg-neutral-900/70')}>
              <header className="px-6 pb-3 pt-5">
                <h2 className="text-[19px] font-semibold tracking-[-0.015em]">Waiting on me</h2>
              </header>
              <div className="space-y-1 px-3 pb-4">
                {shown.map((n, i) => {
                  const a = age(n)
                  const previous = i > 0 ? age(shown[i - 1]) : null
                  const band = a.value === 'new' ? 'Came in today' : a.value === '!' ? 'Needs you now' : 'Waiting'
                  const prevBand = previous
                    ? (previous.value === 'new' ? 'Came in today' : previous.value === '!' ? 'Needs you now' : 'Waiting')
                    : null
                  const key = `${n.title}-${i}`
                  const flow = flowOf(n.href)
                  return (
                    <div key={key}>
                      {band !== prevBand && <GroupLabel>{band}</GroupLabel>}
                      <Collapsible open={open === key} onOpenChange={o => setOpen(o ? key : null)}>
                        <div className={cn(
                          'flex items-center gap-2 rounded-2xl border pr-2.5 transition-colors',
                          open === key
                            ? 'border-[var(--tone-info-dot)]/50 bg-[var(--tone-info-wash)]'
                            : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
                        )}>
                          <CollapsibleTrigger asChild>
                            <button type="button"
                                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-medium leading-snug">{n.title}</span>
                                {n.detail && (
                                  <span className="block truncate text-[12.5px] text-muted-foreground">{n.detail}</span>
                                )}
                              </span>
                              <ScoreDot value={a.value} suffix={a.suffix} tone={a.tone} title={a.label} />
                            </button>
                          </CollapsibleTrigger>
                          {n.href && (
                            <RoundButton icon={ArrowUpRight} label={`Open ${n.title}`}
                                         onClick={() => router.push(n.href!)} />
                          )}
                        </div>
                        <CollapsibleContent className="px-3 pb-3 pt-2">
                          {flow && FLOWS[flow] && (
                            <StageBar
                              stages={FLOWS[flow]}
                              current={FLOWS[flow][
                                typeof n.at === 'number'
                                  ? Math.max(0, Math.min(n.at, FLOWS[flow].length - 1)) : 0
                              ].key}
                            />
                          )}
                          {n.href && (
                            <button
                              type="button"
                              onClick={() => router.push(n.href!)}
                              className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2
                                         text-[13px] font-medium text-white transition-colors hover:bg-neutral-800
                                         dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                            >
                              Open it <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )
                })}

                {needs.length > 7 && !showAll && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-1 w-full rounded-2xl px-3 py-2.5 text-[13px] text-muted-foreground
                               transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.05]"
                  >
                    Show {needs.length - 7} more
                  </button>
                )}
              </div>
            </section>
          )}

          {/* running without you */}
          {moving.length > 0 && (
            <section className={cn(CARD, 'bg-white lg:col-span-4 dark:bg-neutral-900/70')}>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="group flex w-full items-center gap-2 px-5 pb-2 pt-4 text-left">
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                  <span className="text-[15.5px] font-semibold tracking-[-0.01em]">In flight</span>
                  <span className="text-[13px] text-muted-foreground">· {moving.length}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-0.5 px-2 pb-3">
                    {moving.slice(0, 8).map((m, i) => (
                      <button
                        key={`${m.title}-${i}`}
                        type="button"
                        onClick={m.href ? () => router.push(m.href!) : undefined}
                        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left
                                   transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{m.title}</span>
                          {m.detail && (
                            <span className="block truncate text-[12px] text-muted-foreground">{m.detail}</span>
                          )}
                        </span>
                        {m.href && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </section>
          )}

          {needs.length === 0 && rows.length === 0 && (
            <div className={cn(CARD, 'bg-white py-14 text-center lg:col-span-12 dark:bg-neutral-900/70')}>
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
              <p className="mt-3 text-sm font-medium">Nothing is waiting on you</p>
            </div>
          )}
        </div>
      </div>
    </SuperadminLayout>
  )
}
