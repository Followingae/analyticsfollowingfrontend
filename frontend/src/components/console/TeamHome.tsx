'use client'

/**
 * Today, for the team, in the client home's language (founder, 23 Nov 2026: "we have
 * beautiful client dashboards, i want similar for team"). It is the only Today: the old
 * layout was deleted once everything it did was in here ("ensure new is complete per-role").
 *
 * Top to bottom:
 *   1  greeting, role, search, refresh, and the ONE action this role came here to do
 *   2  the cloud: the one to three most urgent things waiting on this person, each a button
 *   3  four bold numbers, every one a door. NO MONEY on Today (founder, 4 Nov 2026: pipeline,
 *      collections and payables are read on their own tabs), so money figures are left out and
 *      the row is filled with counts the server measured, never padded with invented ones
 *   4  the target ring, where leadership set one for this role
 *   5  everything else waiting on them, and what is moving without them, with show all, the
 *      honest "showing N of M", where each row sits in its sequence and its second actions
 *   6  where their work stands (stage bars from the UNCAPPED counts) and, for everyone but
 *      business development, how work moves across the company
 *   7  the role's shortcuts, carrying their counts
 *
 * Reads the unchanged /admin/today response, so every role gets its own content in one shape.
 * A failed load says so; it is never shown as "all caught up". A number the server did not
 * send is a dash, never a zero.
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, ArrowRight, Banknote, BadgeCheck, ClipboardCheck, Coins, FileText, GitBranch,
  Handshake, Megaphone, PlayCircle, RefreshCw, Search, Sparkles, Target, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tile, LIME, FOREST, greetingWord } from '@/components/merchant/bits'
import { ShellHeader } from '@/components/merchant/MerchantShell'
import { Shortcuts } from '@/components/console/Shortcuts'
import { ProcessFlow } from '@/components/console/ProcessFlow'
import { MiniBar, Ring, StageBar } from '@/components/console/primitives'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export type TodayRow = {
  title: string; reason?: string; href?: string | null; where?: string | null; urgency?: string
  age_days?: number; stage_label?: string | null; tone?: string; kind?: string | null
  flow?: string | null; owner?: string; at?: number | null; value?: number | null; of?: number | null
  actions?: { label: string; href: string }[]
}
type Stat = { label: string; value: number | null; hint?: string; tone?: string; format?: string; href?: string | null }
type Hero = { icon: LucideIcon; title: string; line: string; cta: string; href: string }

const DASH = '–'

/** Shortcut badges that read as a count of work, used to fill the number row. */
const BADGE_FACTS: { key: string; label: string; href: string }[] = [
  { key: 'signoffs', label: 'Sign-offs waiting', href: '/work/approvals' },
  { key: 'needs-price', label: 'Creators to price', href: '/work/influencers/review' },
  { key: 'proposals', label: 'Quotes out', href: '/work/proposals' },
]

const ROLE_LABEL: Record<string, string> = {
  leadership: 'Founder', talent: 'Talent', account: 'Account manager',
  business_development: 'Business development',
}

/** The sequences a row can sit in, drawn in its detail. The server says which and how far. */
const FLOWS: Record<string, { key: string; label: string }[]> = {
  areas: [
    { key: 'released', label: 'Released' }, { key: 'stocked', label: 'Stocked' },
    { key: 'cleared', label: 'Cleared' }, { key: 'sent', label: 'Sent' }, { key: 'picked', label: 'Picked' },
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
  sales: [
    { key: 'new', label: 'New' }, { key: 'meeting_due', label: 'Meeting to book' },
    { key: 'meeting_done', label: 'Met them' }, { key: 'proposal_due', label: 'Proposal to send' },
    { key: 'proposal_sent', label: 'Proposal sent' }, { key: 'agreement_sent', label: 'Agreement sent' },
    { key: 'agreement_signed', label: 'Agreement signed' }, { key: 'won', label: 'Won' },
  ],
}
const FLOW_LABEL: Record<string, string> = {
  areas: 'Rosters', brands: 'Brands', proposals: 'Quotes', ladder: 'Campaign creators', sales: 'Deals',
}

/** The icon says what kind of job it is, so the cloud reads before the words do. */
function iconFor(r: TodayRow): LucideIcon {
  const k = `${r.kind || ''} ${r.flow || ''}`
  if (/deal|sales|brand/.test(k)) return Handshake
  if (/proposal|quote|share|send/.test(k)) return FileText
  if (/content/.test(k)) return PlayCircle
  if (/price|rate|cost/.test(k)) return Coins
  if (/pay|payable|money|invoice|bank|order/.test(k)) return Banknote
  if (/clear|approv|signoff/.test(k)) return BadgeCheck
  if (/chase|ladder|late|due/.test(k)) return ClipboardCheck
  if (/campaign|live/.test(k)) return Megaphone
  if (/creator|area|stock|roster|picks/.test(k)) return Users
  return Sparkles
}

/** Who holds a row that is moving without this person, said as a phrase. */
const ownerLine = (o?: string) => {
  if (!o) return ''
  if (/^(with|running)/i.test(o)) return o
  if (o === 'You') return 'Yours'
  return `With ${o.toLowerCase() === 'founders' ? 'the founders' : o}`
}

/** Late is amber everywhere this draws, including outside the console shell's tone tokens. */
const AMBER = 'bg-[oklch(0.8_0.15_75)]'

const age = (d?: number) => (d && d > 0 ? (d === 1 ? '1 day' : `${d} days`) : '')

function heroFrom(r: TodayRow): Hero {
  const late = r.reason && /overdue|late|no answer/.test(r.reason)
  const line = [r.where, r.reason && (late && r.age_days ? `${r.reason} ${age(r.age_days)}` : r.reason)]
    .filter(Boolean).join(' · ')
  const first = r.actions?.[0]?.label
  return { icon: iconFor(r), title: r.title, line, cta: first && first !== 'Open' ? first : 'Open', href: r.href || '#' }
}

export function TeamHome({
  data, failed, firstName, primary, badges, refreshing, onRefresh,
}: {
  data: any
  failed: boolean
  firstName: string
  primary: { label: string; href: string } | null
  badges: Record<string, number>
  refreshing: boolean
  onRefresh: () => void
}) {
  const role: string = data?.role || data?.scope || 'leadership'
  const waiting: TodayRow[] = data?.waiting || []
  const moving: TodayRow[] = data?.moving || []
  const waitingTotal: number = Number.isFinite(Number(data?.waiting_total)) ? Number(data.waiting_total) : waiting.length
  const movingTotal: number = Number.isFinite(Number(data?.moving_total)) ? Number(data.moving_total) : moving.length
  const target = data?.target as { value: number; of: number } | null | undefined
  const [allWaiting, setAllWaiting] = useState(false)
  const [allMoving, setAllMoving] = useState(false)

  // The cloud: up to three of the most urgent. The server sorts urgent first, longest wait
  // first inside each band.
  const urgent = waiting.filter(r => r.urgency === 'high')
  const top = (urgent.length ? urgent : waiting).slice(0, 3)
  const heroes: Hero[] = failed
    ? [{ icon: AlertTriangle, title: 'Your day could not be loaded', line: 'Nothing here is a count. Try again in a moment.',
         cta: 'Try again', href: '#retry' }]
    : top.length
      ? top.map(heroFrom)
      : [{ icon: Sparkles, title: "You're all caught up", line: 'Nothing is waiting on you right now.',
           cta: primary?.label || 'Open the console', href: primary?.href || '/work' }]
  const rest = waiting.filter(r => !top.includes(r))

  /* The four numbers. Money is not on Today. What the server measured comes first, then the
     two counts every role has (waiting on you, moving without you), so the row is full of
     real figures rather than padded. */
  const facts: Stat[] = useMemo(() => {
    const own: Stat[] = ((data?.headline || []) as Stat[]).filter(h => h.format !== 'aed' && h.format !== 'money')
    // Counts the server measured for this person (the shortcut badges), for a role whose own
    // figures were money (the founders'). Never a money figure, never a made-up zero.
    const fromBadges: Stat[] = BADGE_FACTS
      .filter(b => typeof badges?.[b.key] === 'number')
      .map(b => ({ label: b.label, value: Number(badges[b.key]), href: b.href }))
    const fill: Stat[] = [
      { label: 'Waiting on you', value: failed ? null : waitingTotal, href: null },
      { label: 'Moving without you', value: failed ? null : movingTotal, href: null },
    ]
    return [...own, ...fromBadges, ...fill].slice(0, 4)
  }, [data, failed, waitingTotal, movingTotal, badges])
  const tones: (keyof typeof TONE)[] = ['lime', 'mist', 'forest', 'paper']

  const shownRest = allWaiting ? rest : rest.slice(0, 7)
  const shownMoving = allMoving ? moving : moving.slice(0, 7)
  // Company-wide counts (what we owe creators, agreements and advances, prices to set) are
  // the founders' view only (founder, 23 Nov 2026). The server refuses everyone else too.
  const showProcess = role === 'leadership'

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col gap-6 p-1 sm:p-2">
      {/* Anchors for the Today walkthrough (help/walkthroughs.ts). */}
      <div data-tour="today-greeting">
        <ShellHeader
          kicker={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          lead={`${greetingWord()},`}
          accent={(firstName || 'welcome back').split(/\s/)[0]}
          right={
            <>
              <span className="inline-flex h-9 items-center rounded-full border bg-card px-3.5 text-[13px] font-medium">
                {ROLE_LABEL[role] || role}
              </span>
              <RoundIcon label="Search" onClick={() =>
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}>
                <Search className="size-4" strokeWidth={1.75} />
              </RoundIcon>
              <RoundIcon label="Refresh" onClick={onRefresh}>
                <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} strokeWidth={1.75} />
              </RoundIcon>
              {primary && (
                <Link href={primary.href} data-tour="today-add"
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90">
                  {primary.label}<ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              )}
            </>
          }
        />
      </div>

      <section aria-label="Right now" data-tour="today-queue" className="flex min-h-0 flex-1 flex-col gap-4">
        {heroes.length === 1 ? (
          <HeroCard hero={heroes[0]} size="lg" className="min-h-[38dvh] flex-[3]" onRetry={onRefresh} />
        ) : heroes.length === 2 ? (
          <div className="grid min-h-[38dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-2">
            <HeroCard hero={heroes[0]} size="md" />
            <HeroCard hero={heroes[1]} size="md" />
          </div>
        ) : (
          <div className="grid min-h-[38dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-[1.35fr_1fr] md:grid-rows-2">
            <HeroCard hero={heroes[0]} size="md" className="md:row-span-2" />
            <HeroCard hero={heroes[1]} size="sm" />
            <HeroCard hero={heroes[2]} size="sm" />
          </div>
        )}

        <div data-tour="today-numbers" className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2',
                                                      target ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
          {facts.map((h, i) => <Fact key={h.label} stat={h} tone={tones[i % tones.length]} />)}
          {target && <TargetTile target={target} />}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ListTile
            title="Also waiting on you"
            note={!failed && waitingTotal > top.length + shownRest.length
              ? `Showing ${top.length + shownRest.length} of ${waitingTotal}, longest wait first`
              : undefined}
            toggle={rest.length > 7 ? { open: allWaiting, onClick: () => setAllWaiting(v => !v), n: rest.length } : undefined}
            rows={shownRest}
            empty={failed ? 'Could not load.' : 'Nothing else. The cloud has it all.'}
          />
          <ListTile
            title="Moving without you"
            note={!failed && movingTotal > shownMoving.length ? `Showing ${shownMoving.length} of ${movingTotal}, and who has each` : undefined}
            toggle={moving.length > 7 ? { open: allMoving, onClick: () => setAllMoving(v => !v), n: moving.length } : undefined}
            rows={shownMoving}
            owner
            empty={failed ? 'Could not load.' : 'Nothing in flight right now.'}
          />
        </div>

        {!failed && <WorkStands waiting={waiting} waitingTotal={waitingTotal}
                                 mineBy={data?.waiting_stage_counts} othersBy={data?.stage_counts} />}

        {showProcess && (
          <Tile className="gap-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="m-0 flex items-center gap-2 text-[15px] font-semibold">
                <GitBranch className="size-4 text-muted-foreground" strokeWidth={1.75} />How the work moves
              </h2>
              <span className="text-[12px] text-muted-foreground">Who holds the work across the company, live</span>
            </div>
            <ProcessFlow scope={role} />
          </Tile>
        )}

        <Tile className="gap-4 p-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Go to</span>
          <Shortcuts scope={role} badges={badges} primary={null} />
        </Tile>
      </section>
    </div>
  )
}

function RoundIcon({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
            className="inline-flex size-9 items-center justify-center rounded-full border bg-card transition-colors hover:border-foreground/30">
      {children}
    </button>
  )
}

function HeroCard({ hero, size, className, onRetry }: { hero: Hero; size: 'lg' | 'md' | 'sm'; className?: string; onRetry?: () => void }) {
  const sm = size === 'sm'
  const btn = cn('inline-flex items-center gap-2 rounded-full bg-foreground font-medium text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-90',
                 sm ? 'h-10 px-5 text-[13px]' : 'h-12 px-6 text-sm')
  return (
    <Tile className={cn('relative items-center justify-center overflow-hidden border-0 bg-card p-0 shadow-[0_1px_0_rgba(0,0,0,0.03)]',
                        sm ? 'min-h-[190px]' : 'min-h-[280px]', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className={cn('absolute -left-24 -top-28 rounded-full bg-[oklch(0.9354_0.2254_121.5)]/35 blur-3xl', sm ? 'size-[16rem]' : 'size-[28rem]')} />
        <span className={cn('absolute -bottom-32 right-[-6rem] rounded-full bg-primary/25 blur-3xl', sm ? 'size-[18rem]' : 'size-[30rem]')} />
        <span className="absolute left-1/2 top-1/2 size-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 blur-2xl" />
      </div>
      <div className={cn('relative flex flex-col items-center px-6 text-center', sm ? 'gap-3 py-5' : 'gap-6 py-8')}>
        <span className={cn('relative inline-flex items-center justify-center rounded-full bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-border', sm ? 'size-14' : 'size-24')}>
          <span className={cn('inline-flex items-center justify-center rounded-full', LIME, sm ? 'size-10' : 'size-16')}>
            <hero.icon className={sm ? 'size-5' : 'size-7'} strokeWidth={1.6} />
          </span>
          {!sm && (
            <span className="absolute -right-1 -top-1 inline-flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border">
              <Sparkles className="size-3.5" strokeWidth={2} />
            </span>
          )}
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className={cn('m-0 line-clamp-2 max-w-xl font-medium leading-tight tracking-[-0.03em]',
                            sm ? 'text-[20px]' : size === 'md' ? 'text-[26px]' : 'text-[30px] sm:text-[34px]')}>{hero.title}</h2>
          {hero.line && <p className="m-0 line-clamp-2 max-w-md text-sm text-muted-foreground">{hero.line}</p>}
        </div>
        {hero.href === '#retry'
          ? <button type="button" onClick={onRetry} className={btn}>{hero.cta}<RefreshCw className="size-4" strokeWidth={2} /></button>
          : <Link href={hero.href} className={btn}>{hero.cta}<ArrowRight className="size-4" strokeWidth={2} /></Link>}
      </div>
    </Tile>
  )
}

const TONE: Record<'lime' | 'mist' | 'paper' | 'forest', { tile: string; label: string }> = {
  lime: { tile: cn(LIME, 'border-0'), label: 'opacity-70' },
  mist: { tile: 'border-0 bg-primary/20 text-foreground', label: 'text-foreground/70' },
  paper: { tile: 'bg-card', label: 'text-muted-foreground' },
  forest: { tile: cn(FOREST, 'border-0'), label: 'opacity-70' },
}

function Fact({ stat, tone }: { stat: Stat; tone: keyof typeof TONE }) {
  const t = TONE[tone]
  const inner = (
    <Tile as="div" className={cn('h-full min-h-[150px] justify-between gap-5 p-6 transition-transform group-hover:-translate-y-0.5', t.tile)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', t.label)}>{stat.label}</span>
        <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[52px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[56px]">
          {stat.value == null ? DASH : String(stat.value)}
        </span>
        {stat.hint ? <span className={cn('text-[13px]', t.label)}>{stat.hint}</span> : <span className="h-[18px]" />}
      </div>
    </Tile>
  )
  return stat.href
    ? <Link href={stat.href} className="group rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link>
    : <div className="group">{inner}</div>
}

/** The one measured fraction: what this role has done today against the target set for it. */
function TargetTile({ target }: { target: { value: number; of: number } }) {
  const pct = Math.min(100, Math.round((target.value / Math.max(target.of, 1)) * 100))
  return (
    <Tile as="div" className="h-full min-h-[150px] flex-row items-center justify-between gap-4 p-6">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <Target className="size-3.5" strokeWidth={2} />Today&apos;s target
        </span>
        <span className="mt-3 text-[40px] font-medium leading-none tracking-[-0.04em] tabular-nums">
          {target.value}<span className="ml-1 text-[16px] font-normal text-muted-foreground">of {target.of}</span>
        </span>
        <span className="text-[13px] text-muted-foreground">
          {target.value >= target.of ? 'Done for today' : `${target.of - target.value} to go`}
        </span>
      </div>
      <Ring size={76} pct={pct} />
    </Tile>
  )
}

const ROW_DOT: Record<string, string> = {
  bad: 'bg-destructive', warn: 'bg-[oklch(0.8_0.15_75)]', good: 'bg-[oklch(0.72_0.17_150)]',
}

/** Where a row sits in its sequence, and any second thing you can do to it. */
function Detail({ row }: { row: TodayRow }) {
  const flow = row.flow && FLOWS[row.flow] ? FLOWS[row.flow] : null
  const extra = (row.actions || []).filter(a => a.href && a.href !== row.href)
  if (!flow && extra.length === 0) return null
  const at = typeof row.at === 'number' ? Math.max(0, Math.min(row.at, (flow?.length ?? 1) - 1)) : 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Where this sits" aria-label="Where this sits"
                onClick={e => e.stopPropagation()}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <GitBranch className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-sm space-y-3">
        {flow && <StageBar stages={flow} current={flow[at]?.key || flow[0].key} />}
        {extra.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

function ListTile({ title, note, toggle, rows, empty, owner }: {
  title: string; note?: string; rows: TodayRow[]; empty: string; owner?: boolean
  toggle?: { open: boolean; onClick: () => void; n: number }
}) {
  const router = useRouter()
  return (
    <Tile className="gap-1 p-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
          {note && <span className="text-[12px] text-muted-foreground">{note}</span>}
        </div>
        {toggle && (
          <button type="button" onClick={toggle.onClick} aria-expanded={toggle.open}
                  className="shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors hover:border-foreground/30">
            {toggle.open ? 'Show less' : `Show all ${toggle.n}`}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="m-0 py-6 text-center text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((r, i) => {
            const Icon = iconFor(r)
            return (
              <li key={`${r.title}-${r.href ?? ''}-${i}`} className="border-b border-border/60 last:border-0">
                <div role={r.href ? 'link' : undefined} tabIndex={r.href ? 0 : undefined}
                     onClick={() => r.href && router.push(r.href)}
                     onKeyDown={e => { if (e.key === 'Enter' && r.href) router.push(r.href) }}
                     className={cn('-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5', r.href && 'cursor-pointer transition-colors hover:bg-muted/60')}>
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      {!owner && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', ROW_DOT[r.tone || ''] || 'bg-muted-foreground/40')} />}
                      <span className="truncate text-[14px] font-medium">{r.title}</span>
                    </span>
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      {[r.where && r.where !== r.title ? r.where : null, r.reason].filter(Boolean).join(' · ')}
                    </span>
                    {typeof r.of === 'number' && r.of > 0 && (
                      <span className="mt-1"><MiniBar value={r.value ?? 0} max={r.of} tone="good" /></span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {r.stage_label && (
                      <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{r.stage_label}</span>
                    )}
                    <span className="text-[11.5px] tabular-nums text-muted-foreground">
                      {owner ? ownerLine(r.owner) : age(r.age_days)}
                    </span>
                  </span>
                  <Detail row={r} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Tile>
  )
}

/* Where this person's work stands, from the UNCAPPED counts the server computes before it
   slices the lists (waiting_stage_counts and stage_counts share one key space). The capped
   rows only say what is late and where a stage leads. Hidden when there is no real
   distribution to draw (fewer than two stages, or nothing in flight). */
function WorkStands({ waiting, waitingTotal, mineBy, othersBy }: {
  waiting: TodayRow[]; waitingTotal: number
  mineBy?: Record<string, number> | null; othersBy?: Record<string, number> | null
}) {
  const router = useRouter()
  const cols = useMemo(() => {
    const mine = mineBy && typeof mineBy === 'object' ? mineBy : {}
    const others = othersBy && typeof othersBy === 'object' ? othersBy : {}
    if (Object.keys(others).length === 0) return null
    const late = new Map<string, number>()
    const hrefs = new Map<string, Set<string>>()
    for (const r of waiting) {
      const k = r.stage_label || r.flow
      if (!k) continue
      if (r.urgency === 'high' || (r.age_days ?? 0) >= 7) late.set(k, (late.get(k) ?? 0) + 1)
      if (r.href) { const s = hrefs.get(k) ?? new Set<string>(); s.add(r.href); hrefs.set(k, s) }
    }
    const keys = Array.from(new Set([...Object.keys(others), ...Object.keys(mine)]))
    const out = keys.map(k => {
      const s = hrefs.get(k)
      return { key: k, label: FLOW_LABEL[k] ?? k, mine: Number(mine[k] ?? 0) || 0, others: Number(others[k] ?? 0) || 0,
               late: late.get(k) ?? 0, href: s && s.size === 1 ? Array.from(s)[0] : null }
    }).sort((a, b) => (b.mine + b.others) - (a.mine + a.others) || a.key.localeCompare(b.key))
    if (out.length < 2) return null
    return { out, charted: out.reduce((a, c) => a + c.mine, 0) }
  }, [waiting, mineBy, othersBy])
  if (!cols) return null
  const max = Math.max(1, ...cols.out.map(c => c.mine + c.others))
  return (
    <Tile className="gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold">Where your work stands</h2>
        <span className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <Legend className={LIME}>yours</Legend>
          <Legend className={AMBER}>late</Legend>
          <Legend className="bg-foreground/15">with others</Legend>
        </span>
      </div>
      <div className="flex items-stretch gap-3" style={{ height: 200 }}>
        {cols.out.map(c => {
          const n = c.mine + c.others
          const pct = n === 0 ? 0 : Math.max(6, Math.round((n / max) * 100))
          const minePct = n === 0 ? 0 : Math.round((c.mine / n) * 100)
          const body = (
            <>
              <span className="text-[15px] font-medium tabular-nums">{n}</span>
              <span className="mt-1 flex flex-1 items-end">
                <span className="flex w-full flex-col-reverse overflow-hidden rounded-xl bg-foreground/10" style={{ height: `${pct}%` }}>
                  <span className={c.late > 0 ? AMBER : LIME} style={{ height: `${minePct}%` }} />
                </span>
              </span>
              <span className="mt-2 truncate text-[12px] font-medium">{c.label}</span>
              <span className="text-[11.5px] text-muted-foreground">
                {c.late > 0 ? `${c.late} late` : c.mine > 0 ? `${c.mine} yours` : c.others > 0 ? 'with others' : 'clear'}
              </span>
            </>
          )
          return c.href
            ? <button key={c.key} type="button" onClick={() => router.push(c.href!)}
                      className="flex min-w-0 flex-1 flex-col rounded-xl px-1 text-center transition-colors hover:bg-muted/60">{body}</button>
            : <div key={c.key} className="flex min-w-0 flex-1 flex-col px-1 text-center">{body}</div>
        })}
      </div>
      {waitingTotal > cols.charted && (
        <p className="m-0 text-[12px] text-muted-foreground">
          {waitingTotal - cols.charted} of your {waitingTotal} carry no stage yet and are not on this chart.
        </p>
      )}
    </Tile>
  )
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn('size-2.5 rounded-sm', className)} />{children}</span>
}
