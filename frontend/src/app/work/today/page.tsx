'use client'

/**
 * The operations centre — one page a teammate can run their day from.
 *
 * Three panes, the shape of a working CRM rather than a dashboard:
 *
 *   the rail        the app's own sidebar, already there
 *   My work         everything stopped on you, one card each
 *   the canvas      whatever is selected, with the next action on it
 *
 * The point is that nothing throws you somewhere else to think. Selecting a row fills the
 * canvas beside it; the canvas carries where that piece of work sits in its flow, what it is
 * waiting on, and the one button that moves it. Underneath sit the shortcuts, so the places
 * people go ten times a day are one click from here rather than three.
 *
 * Everything on it is real and role-scoped: it comes from the same endpoint the old screen
 * used, and money simply is not sent to a role that may not see it.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight, ArrowUpRight, CheckCircle2, RefreshCw, Search, Sparkles,
  Users, Layers, FileText, Banknote, Monitor, ClipboardCheck, Building2, Compass,
} from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import { Aed, CARD, GroupLabel, Ring, RoundButton, ScoreDot, type Tone } from '@/components/console/primitives'
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

/**
 * The flow a queue item belongs to, so the canvas can show where it sits rather than only
 * repeating its title. Matched on the screen it points at, because that is what actually
 * says which kind of work it is.
 */
const FLOWS: { match: RegExp; label: string; steps: string[]; at: number }[] = [
  { match: /influencers\/review/, label: 'A creator joining the database',
    steps: ['Found', 'Priced', 'Approved', 'On a proposal'], at: 1 },
  { match: /\/areas/, label: 'Building a brand’s roster',
    steps: ['Released', 'Stocked', 'Cleared', 'Sent', 'Picked'], at: 1 },
  { match: /proposals/, label: 'A proposal',
    steps: ['Drafted', 'Internally approved', 'Sent', 'Answered'], at: 1 },
  { match: /ladder/, label: 'Delivering a campaign',
    steps: ['Enrolled', 'Rate agreed', 'Briefed', 'Content in', 'Posted', 'Paid'], at: 1 },
  { match: /brands|clients/, label: 'A brand relationship',
    steps: ['Logged', 'Sourcing', 'Proposal', 'Live'], at: 1 },
  { match: /payables|billing/, label: 'Money out',
    steps: ['Recorded', 'Approved', 'Paid'], at: 1 },
]

const flowFor = (href?: string) => (href ? FLOWS.find(f => f.match.test(href)) : undefined)

/**
 * What the one big button does, per role.
 *
 * It said "Add creators" to everybody, including the two people whose job never touches the
 * creator database — and pointed at a screen their role cannot open.
 */
const PRIMARY: Record<string, { label: string; href: string }> = {
  leadership: { label: 'Add creators', href: '/work/influencers/add' },
  talent: { label: 'Add creators', href: '/work/influencers/add' },
  business_development: { label: 'Log a brand', href: '/work/brands' },
  account: { label: 'Open my clients', href: '/work/clients' },
}

/**
 * The places people go ten times a day.
 *
 * `module` is what their account may open; `scopes` is whose job it is. Both are needed:
 * the talent team hold the campaigns module, which was putting the founders' approvals desk
 * on their strip — a chip that 403s the moment it is pressed.
 */
const SHORTCUTS: {
  key: string; label: string; href: string; icon: any
  module?: AdminModule; scopes?: string[]
}[] = [
  // Areas carry the sample packs business development send to a prospect, so this one is
  // reached through the client side of the house as well as the creator side.
  { key: 'areas', label: 'Areas', href: '/work/areas', icon: Layers,
    scopes: ['leadership', 'talent', 'business_development'] },
  { key: 'waiting-room', label: 'Waiting room', href: '/work/influencers/review', icon: Users,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'proposals', label: 'Proposals', href: '/work/proposals', icon: FileText, module: 'proposals' },
  { key: 'campaigns', label: 'Campaigns', href: '/work/campaigns', icon: Sparkles, module: 'campaigns' },
  { key: 'brands', label: 'Brands', href: '/work/brands', icon: Building2, module: 'clients' },
  // The founders' desk: raising and reading approvals is leadership scope on the server.
  { key: 'approvals', label: 'Approvals', href: '/work/approvals', icon: ClipboardCheck,
    scopes: ['leadership'] },
  // Payables are cost, which the talent team negotiate and therefore may see.
  { key: 'payables', label: 'Payables', href: '/work/payables', icon: Banknote,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'coverage', label: 'Coverage', href: '/work/coverage', icon: Compass,
    module: 'influencers', scopes: ['leadership', 'talent'] },
  { key: 'screens', label: 'Office screens', href: '/work/system/displays', icon: Monitor,
    module: 'system', scopes: ['leadership'] },
]


/**
 * How long this has been sitting, pulled from the line the endpoint already writes
 * ("oldest waiting 4 days", "nothing has moved in two weeks"). It is a score in the
 * reference's sense: the number you scan down the column to find what is rotting.
 */
function age(item: Item): { value: string; suffix?: string; tone: Tone; label: string } {
  if (item.urgency === 'high') return { value: '!', tone: 'bad', label: 'Needs attention now' }

  const d = (item.detail || '').toLowerCase()
  const WORDS: Record<string, number> = {
    a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10,
  }
  // "4 days", "two weeks", "a month" — the endpoint writes all three shapes.
  const m = /(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|week|month)/.exec(d)
  if (!m) return { value: '·', tone: 'neutral', label: 'No age recorded' }

  const count = /^\d+$/.test(m[1]) ? Number(m[1]) : (WORDS[m[1]] ?? 1)
  const days = m[2] === 'week' ? count * 7 : m[2] === 'month' ? count * 30 : count

  if (days === 0) return { value: 'new', tone: 'good', label: 'Arrived today' }
  const tone: Tone = days >= 7 ? 'bad' : days >= 3 ? 'warn' : 'good'
  return { value: String(days), suffix: 'd', tone, label: `Waiting ${days} day${days === 1 ? '' : 's'}` }
}

/** A soft circular icon button — the quiet action, as the reference uses it. */
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

export default function OperationsCentre() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(0)
  const [tab, setTab] = useState<'you' | 'flight'>('you')

  const load = async (quiet = false) => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
      if (!quiet) setSel(0)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load your day')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]
  const headline: any[] = data?.headline || []
  const needs: Item[] = useMemo(() => data?.needs || [], [data])
  const moving: Item[] = useMemo(() => data?.moving || [], [data])
  const queue = tab === 'you' ? needs : moving
  const active = queue[Math.min(sel, Math.max(0, queue.length - 1))]
  const baseFlow = flowFor(active?.href)
  // Where this item sits in that flow. The screen it points at says which flow it is, but
  // not how far along — every creator waiting on a rate was drawn as already priced.
  const flow = baseFlow && {
    ...baseFlow,
    at: typeof active?.at === 'number'
      ? Math.max(0, Math.min(active.at, baseFlow.steps.length - 1))
      : baseFlow.at,
  }
  // The endpoint says which job this person does; business development are their own role
  // even though they share the account money scope.
  const role: string = data?.role || data?.scope || 'leadership'
  const primary = PRIMARY[role] ?? PRIMARY.leadership
  const shortcuts = SHORTCUTS.filter(
    s => (!s.module || can(s.module)) && (!s.scopes || s.scopes.includes(role)))

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-7">
          <Skeleton className="h-12 w-72 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[132px] rounded-[22px]" />)}
          </div>
          <div className="grid gap-5 lg:grid-cols-12">
            <Skeleton className="h-[420px] rounded-[22px] lg:col-span-5" />
            <Skeleton className="h-[420px] rounded-[22px] lg:col-span-7" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* ── who, when, and the one thing you came to do ─────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 data-tour="today-greeting"
                className="text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] lg:text-[38px]">
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
          </div>
        </div>

        {/* ── the company in four numbers ─────────────────────────────────────────── */}
        {headline.length > 0 && (
          <div data-tour="today-numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {headline.map((s: any) => {
              const wash =
                s.tone === 'good' ? 'from-[#EEF7EA] to-[#F8FBF5] dark:from-emerald-950/50 dark:to-emerald-950/15'
                : s.tone === 'warn' ? 'from-[#FDF1E0] to-[#FEF9F2] dark:from-amber-950/50 dark:to-amber-950/15'
                : s.tone === 'bad' ? 'from-[#FCE9E7] to-[#FEF6F5] dark:from-rose-950/50 dark:to-rose-950/15'
                : 'from-[#F1F7DC] to-[#FBFCF2] dark:from-lime-950/40 dark:to-lime-950/10'
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={s.href ? () => router.push(s.href) : undefined}
                  className={cn(CARD, 'bg-gradient-to-br p-5 text-left transition-all', wash,
                                s.href && 'hover:-translate-y-0.5')}
                >
                  <p className="text-[12.5px] font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                    {s.format === 'aed' ? <Aed>{aed(Number(s.value) || 0)}</Aed> : (s.value ?? 0)}
                  </p>
                  {/* A target that exists gets a bar under it. One that does not gets
                      nothing — a full bar under an unmeasured number is a lie. */}
                  {typeof s.progress === 'number' && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.12]">
                      <div
                        className="h-full rounded-full bg-neutral-900 dark:bg-white"
                        style={{
                          width: `${s.progress > 0 ? Math.max(4, Math.round(s.progress * 100)) : 0}%`,
                          transition: 'width 900ms cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </div>
                  )}
                  {s.hint && <p className="mt-2.5 text-xs text-muted-foreground">{s.hint}</p>}
                </button>
              )
            })}
          </div>
        )}

        {/* ── the shortcuts, above the fold ───────────────────────────────────────
            They were under the desk, which meant scrolling past your own work to reach the
            places you go ten times a day. As a strip they cost one row and are always there. */}
        <div data-tour="today-shortcuts" className="flex flex-wrap gap-2">
          {shortcuts.map(s => (
            <button
              key={s.href}
              data-tour={`shortcut-${s.key}`}
              type="button"
              onClick={() => router.push(s.href)}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white',
                'py-2 pl-2 pr-4 text-[13px] font-medium transition-all hover:-translate-y-0.5',
                'dark:border-white/[0.08] dark:bg-neutral-900/70',
              )}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.05] transition-colors
                               group-hover:bg-[#EAF3C8] dark:bg-white/[0.08] dark:group-hover:bg-lime-950/50">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── the desk: queue on the left, canvas on the right ────────────────────── */}
        <div className="grid items-start gap-5 lg:grid-cols-12">
          <section data-tour="today-queue" className={cn(CARD, 'bg-white lg:col-span-5 dark:bg-neutral-900/70')}>
            <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
              <h2 className="text-[15.5px] font-semibold tracking-[-0.01em]">My work</h2>
              <div className="flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
                {([['you', 'Waiting on me'], ['flight', 'In flight']] as const).map(([k, label]) => (
                  <button
                    key={k} type="button"
                    onClick={() => { setTab(k); setSel(0) }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                      tab === k
                        ? 'bg-white text-foreground shadow-sm dark:bg-neutral-800'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    {k === 'you' && needs.length > 0 && (
                      <span className="ml-1.5 tabular-nums text-muted-foreground">{needs.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </header>

            <div className="max-h-[520px] space-y-1.5 overflow-y-auto px-3 pb-4">
              {queue.map((n, i) => {
                const on = i === sel
                const a = age(n)
                const previous = i > 0 ? age(queue[i - 1]) : null
                // The reference breaks its list into "Today" and "3 weeks ago". Ours breaks
                // on the same idea: what arrived today, and what has been sitting.
                const band = a.value === 'new' ? 'Came in today' : a.value === '!' ? 'Needs you now' : 'Waiting'
                const prevBand = previous
                  ? (previous.value === 'new' ? 'Came in today' : previous.value === '!' ? 'Needs you now' : 'Waiting')
                  : null
                return (
                  <div key={`${n.title}-${i}`}>
                    {band !== prevBand && <GroupLabel>{band}</GroupLabel>}
                    {/* The row is a div carrying its own button, because the open control is
                        a button too and a button inside a button is invalid HTML — it breaks
                        hydration, which is what the dev overlay was reporting. */}
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-2xl border pr-2.5 transition-all',
                        on
                          ? 'border-[#C7DE55] bg-[#F4FADF] dark:border-lime-500/40 dark:bg-lime-950/30'
                          : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSel(i)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium leading-snug">{n.title}</span>
                          {n.detail && (
                            <span className="block truncate text-[12.5px] text-muted-foreground">{n.detail}</span>
                          )}
                        </span>
                        <ScoreDot value={a.value} suffix={a.suffix} tone={a.tone} title={a.label} />
                      </button>
                      {n.href && (
                        <RoundButton
                          icon={ArrowUpRight}
                          label={`Open ${n.title}`}
                          onClick={() => router.push(n.href!)}
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              {queue.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
                  <p className="text-sm font-medium">
                    {tab === 'you' ? 'You are clear' : 'Nothing in flight'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tab === 'you'
                      ? 'Nothing is waiting on a decision from you.'
                      : 'No campaign is running right now.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className={cn(CARD, 'overflow-hidden bg-white lg:col-span-7 dark:bg-neutral-900/70')}>
            {active ? (
              <>
                {/* A pane of glass over a soft wash — the reference's detail header. */}
                <div className="relative overflow-hidden border-b border-black/[0.05] dark:border-white/[0.07]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F1F7DC] via-[#FAFBF4] to-[#EFF4FA]
                                  dark:from-lime-950/40 dark:via-neutral-900 dark:to-sky-950/30" />
                  <div className="absolute inset-0 backdrop-blur-2xl" />
                  <div className="relative px-6 py-5">
                    {flow && (
                      <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {flow.label}
                      </p>
                    )}
                    <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.015em]">
                      {active.title}
                    </h3>
                    {active.detail && (
                      <p className="mt-1.5 text-[14px] text-muted-foreground">{active.detail}</p>
                    )}

                    {flow && (
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        {flow.steps.map((s, i) => (
                          <span
                            key={s}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-[11.5px] font-medium',
                              i < flow.at && 'bg-black/[0.06] text-muted-foreground dark:bg-white/[0.08]',
                              i === flow.at && 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                              i > flow.at && 'text-muted-foreground/55',
                            )}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-5">
                  <div className="space-y-4 md:col-span-3">
                    <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.05]">
                      <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        What this is
                      </p>
                      <p className="mt-2 text-[14px] leading-relaxed">
                        {active.detail ? `${active.detail.replace(/[.\s]+$/, '')}. ` : 'This is waiting on you. '}
                        {flow
                          ? `It sits at “${flow.steps[flow.at]}” and moves on when you act.`
                          : 'Opening it takes you to where the decision is made.'}
                      </p>
                    </div>

                    {active.href && (
                      <button
                        type="button"
                        onClick={() => router.push(active.href!)}
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5
                                   text-sm font-medium text-white transition-colors hover:bg-neutral-800
                                   dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        Open it <ArrowUpRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* How far this piece of work has come, not how far you have scrolled.
                      The ring used to read "3 of 7" — your position in a list, drawn as a
                      completion figure, which measured nothing anybody could act on. */}
                  <div className="md:col-span-2">
                    <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.05]">
                      <p className="text-center text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {flow ? 'How far along' : 'Waiting on you'}
                      </p>
                      <div className="mt-3 flex justify-center">
                        <Ring
                          pct={flow
                            /* Counting rungs reached, not gaps crossed — sitting on the
                               first of four is a quarter of the way, not nothing. */
                            ? Math.round(((flow.at + 1) / flow.steps.length) * 100)
                            : needs.length
                              ? Math.round((needs.filter(n => n.urgency !== 'high').length / needs.length) * 100)
                              : 100}
                          size={116}
                          caption={flow
                            ? `${flow.steps[flow.at]} · step ${flow.at + 1} of ${flow.steps.length}`
                            : needs.filter(n => n.urgency === 'high').length
                              ? `${needs.filter(n => n.urgency === 'high').length} need you now`
                              : 'nothing urgent'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/70" />
                <p className="text-base font-medium">Nothing to work through</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  When something stops on you it appears on the left, and opens here.
                </p>
              </div>
            )}
          </section>
        </div>

      </div>
    </SuperadminLayout>
  )
}
