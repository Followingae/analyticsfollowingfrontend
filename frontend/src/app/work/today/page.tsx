'use client'

/**
 * Today — one screen a teammate can run their day from.
 *
 * It used to be six regions: four gradient stat cards, a row of action cards, a strip of
 * chips, a queue, and a canvas repeating whatever the queue had auto-selected. To learn one
 * fact — which brand needs creators today — you had to read all six, and that fact appeared
 * in three of them. The owner opened it as a talent manager and said it was overwhelming.
 *
 * So the shape is now:
 *
 *   the header      who you are, what is waiting, today's goal
 *   the money       leadership only, one line
 *   the job card    THE thing you do, with one row per client and the detail folded inside
 *   my work         everything stopped on you, one list, six at a time
 *   in flight       collapsed
 *   the numbers     one quiet line of text, below the work — not four cards above it
 *   go to           the shortcut chips, last
 *
 * Three regions above the fold instead of six, and nothing became unreachable: the action
 * cards are the job card's rows, the canvas is the row expand, the stat cards are the
 * numbers line, and every chip is where it was.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
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
  Aed, CARD, GroupLabel, RoundButton, ScoreDot, StageBar, type Tone,
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
  /** Which rung of its flow this sits on, sent by the server, which knows. */
  at?: number | null
}

type FocusRow = {
  id: string; label: string; href: string
  stage_label?: string; tone?: Tone; flow?: string | null; at?: number | null
  value?: number | null; of?: number | null; meta?: string
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

/** Which sequence a queue row belongs to, from the screen it opens. */
const flowOf = (href?: string) =>
  !href ? null
  : /influencers\/review/.test(href) ? 'areas'
  : /\/areas/.test(href) ? 'areas'
  : /proposals/.test(href) ? 'proposals'
  : /ladder|chasing|campaigns/.test(href) ? 'ladder'
  : /brands|clients/.test(href) ? 'brands'
  : null

/** What the one corner button does. Talent no longer has one — their job card is the button. */
const PRIMARY: Record<string, { label: string; href: string }> = {
  leadership: { label: 'Sign-offs', href: '/work/approvals' },
  account: { label: 'Open my clients', href: '/work/clients' },
  business_development: { label: 'Log a brand', href: '/work/brands?new=1' },
}

/** The places people go ten times a day. Below the work, not above it. */
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

/** How long this has been sitting, read off the line the endpoint already writes. */
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

const TONE_BADGE: Record<string, string> = {
  good: 'border-transparent bg-[#E9F5E5] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warn: 'border-transparent bg-[#FCEFDC] text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  bad: 'border-transparent bg-[#FBE4E1] text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  neutral: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

export default function Today() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)   // which queue row is expanded
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
  const isLeadership = data?.scope === 'leadership'
  const shortcuts = SHORTCUTS.filter(
    s => (!s.module || can(s.module)) && (!s.scopes || s.scopes.includes(role)))

  // The one chart: what is filling up, and how full. Never drawn for a single row — a bar
  // chart of one bar is a bar.
  const chart = useMemo(
    () => rows.filter(r => typeof r.of === 'number' && r.of! > 0)
              .map(r => ({ name: r.label, done: r.value ?? 0, left: Math.max((r.of || 0) - (r.value ?? 0), 0) })),
    [rows])

  const shown = showAll ? needs : needs.slice(0, 6)

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-72 rounded-2xl" />
          <Skeleton className="h-[280px] rounded-[22px]" />
          <Skeleton className="h-[320px] rounded-[22px]" />
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="mx-auto max-w-5xl space-y-6">

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

        {/* ── the money, for the people whose morning starts with it ─────────────── */}
        {isLeadership && headline.some((h: any) => h.format === 'aed' && Number(h.value) > 0) && (
          <div className={cn(CARD, 'flex flex-wrap items-center gap-x-8 gap-y-3 bg-white px-6 py-4 dark:bg-neutral-900/70')}>
            {headline.filter((h: any) => h.format === 'aed').map((h: any) => (
              <button
                key={h.label} type="button"
                onClick={h.href ? () => router.push(h.href) : undefined}
                className="text-left"
              >
                <p className="text-[12px] text-muted-foreground">{h.label}</p>
                <p className={cn('mt-0.5 text-[20px] font-semibold tabular-nums',
                                 h.tone === 'bad' && 'text-rose-600 dark:text-rose-400')}>
                  <Aed>{aed(Number(h.value) || 0)}</Aed>
                </p>
              </button>
            ))}
          </div>
        )}

        {/* ── the job card: THE thing you do, clients folded inside ──────────────── */}
        {rows.length > 0 && (
          <section data-tour="today-focus" className={cn(CARD, 'bg-white dark:bg-neutral-900/70')}>
            <header className="flex flex-wrap items-end justify-between gap-3 px-6 pb-4 pt-5">
              <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{focus?.title}</h2>
              {focus?.target && (
                <div className="min-w-[190px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-muted-foreground">Today's goal</span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {focus.target.value} of {focus.target.of}
                    </span>
                  </div>
                  <Progress className="mt-1.5 h-1.5"
                            value={Math.min(100, (focus.target.value / Math.max(focus.target.of, 1)) * 100)} />
                </div>
              )}
            </header>

            {/* how full each one is — the whole roster in one shape */}
            {chart.length >= 2 && (
              <div className="px-4 pb-2">
                <ChartContainer
                  config={{ done: { label: 'Found', color: '#A6C520' },
                            left: { label: 'Still to find', color: 'rgba(0,0,0,0.07)' } }}
                  className="h-[var(--chart-h)] w-full"
                  style={{ ['--chart-h' as any]: `${Math.min(chart.length, 6) * 34 + 16}px` }}
                >
                  <BarChart data={chart.slice(0, 6)} layout="vertical"
                            margin={{ left: 4, right: 8, top: 4, bottom: 4 }} barSize={14}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={130} axisLine={false}
                           tickLine={false} tick={{ fontSize: 12.5 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="done" stackId="a" fill="var(--color-done)" radius={[6, 0, 0, 6]} />
                    <Bar dataKey="left" stackId="a" fill="var(--color-left)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}

            {/* one row per client or decision; open one to see where it sits */}
            <Accordion type="single" collapsible className="px-3 pb-3">
              {rows.map(r => (
                <AccordionItem key={r.id} value={r.id} className="border-b-0">
                  <AccordionTrigger className="rounded-2xl px-3 py-3 hover:bg-black/[0.03] hover:no-underline dark:hover:bg-white/[0.05]">
                    <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
                      <span className="min-w-0 flex-1 truncate text-left text-[14.5px] font-medium">
                        {r.label}
                      </span>
                      {typeof r.of === 'number' && r.of > 0 && (
                        <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                          {r.value} of {r.of}
                        </span>
                      )}
                      {r.stage_label && (
                        <Badge className={cn('shrink-0 whitespace-nowrap', TONE_BADGE[r.tone || 'neutral'])}>
                          {r.stage_label}
                        </Badge>
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

        {/* ── my work: one list, six at a time ───────────────────────────────────── */}
        {needs.length > 0 && (
          <section data-tour="today-queue" className={cn(CARD, 'bg-white dark:bg-neutral-900/70')}>
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
                          ? 'border-[#C7DE55] bg-[#F4FADF] dark:border-lime-500/40 dark:bg-lime-950/30'
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

              {needs.length > 6 && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 text-[13px] text-muted-foreground
                             transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.05]"
                >
                  Show {needs.length - 6} more
                </button>
              )}
            </div>
          </section>
        )}

        {needs.length === 0 && rows.length === 0 && (
          <div className={cn(CARD, 'bg-white py-14 text-center dark:bg-neutral-900/70')}>
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
            <p className="mt-3 text-sm font-medium">Nothing is waiting on you</p>
          </div>
        )}

        {/* ── in flight: running, needs nobody ───────────────────────────────────── */}
        {moving.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-2xl px-2 py-2
                                           text-[13.5px] text-muted-foreground transition-colors
                                           hover:text-foreground">
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              In flight · {moving.length}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn(CARD, 'mt-1 space-y-1 bg-white px-3 py-3 dark:bg-neutral-900/70')}>
                {moving.map((m, i) => (
                  <button
                    key={`${m.title}-${i}`}
                    type="button"
                    onClick={m.href ? () => router.push(m.href!) : undefined}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left
                               transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{m.title}</span>
                      {m.detail && (
                        <span className="block truncate text-[12.5px] text-muted-foreground">{m.detail}</span>
                      )}
                    </span>
                    {m.href && <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* ── the numbers, as a line rather than four cards ──────────────────────── */}
        {headline.filter((h: any) => h.format !== 'aed').length > 0 && (
          <div data-tour="today-numbers"
               className="flex flex-wrap items-center gap-x-6 gap-y-2 px-2 text-[13.5px]">
            {headline.filter((h: any) => h.format !== 'aed').map((h: any) => (
              <button
                key={h.label} type="button"
                onClick={h.href ? () => router.push(h.href) : undefined}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {h.label} <span className="font-semibold tabular-nums text-foreground">{h.value ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── go to ──────────────────────────────────────────────────────────────── */}
        <div data-tour="today-shortcuts" className="flex flex-wrap gap-2 pb-2">
          {shortcuts.map(s => (
            <button
              key={s.href}
              type="button"
              data-tour={`shortcut-${s.key}`}
              onClick={() => router.push(s.href)}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white',
                'py-1.5 pl-1.5 pr-3.5 text-[12.5px] text-muted-foreground transition-all',
                'hover:-translate-y-0.5 hover:text-foreground',
                'dark:border-white/[0.08] dark:bg-neutral-900/70',
              )}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-black/[0.05] transition-colors
                               group-hover:bg-[#EAF3C8] dark:bg-white/[0.08] dark:group-hover:bg-lime-950/50">
                <s.icon className="h-3 w-3" />
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </SuperadminLayout>
  )
}
