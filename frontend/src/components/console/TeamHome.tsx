'use client'

/**
 * Today, for the team, in the client home's language (founder, 23 Nov 2026: "we have
 * beautiful client dashboards, i want similar for team"). Whitespace, a cloud, bold numbers,
 * almost no words.
 *
 * The cloud says the one to three things waiting on this person, most urgent first, each with
 * its own button. Nothing waiting is said plainly ("all caught up") with the one action this
 * role came here to do. Under it, the role's four numbers as tiles, every one a door. Then the
 * rest of the queue and what is moving without them, as two quiet lists.
 *
 * It reads the same /admin/today response as the classic Today, so every role (founders,
 * talent, account managers, business development) gets its own content in the same shape.
 * A number the server did not send is a dash, never a zero.
 */
import Link from 'next/link'
import {
  ArrowRight, Banknote, BadgeCheck, ClipboardCheck, Coins, FileText, Handshake, Megaphone,
  PlayCircle, RefreshCw, Sparkles, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tile, LIME, FOREST, greetingWord, compact, DirhamSign } from '@/components/merchant/bits'
import { ShellHeader } from '@/components/merchant/MerchantShell'
import { Shortcuts } from '@/components/console/Shortcuts'

type Row = {
  title: string; reason?: string; href?: string | null; where?: string | null; urgency?: string
  age_days?: number; stage_label?: string | null; tone?: string; kind?: string | null
  flow?: string | null; owner?: string; actions?: { label: string; href: string }[]
}
type Stat = { label: string; value: number | null; hint?: string; tone?: string; format?: string; href?: string | null }
type Hero = { icon: LucideIcon; title: string; line: string; cta: string; href: string }

const DASH = '–'

const ROLE_LABEL: Record<string, string> = {
  leadership: 'Founder', talent: 'Talent', account: 'Account manager',
  business_development: 'Business development',
}

/** The icon says what kind of job it is, so the cloud reads before the words do. */
function iconFor(r: Row): LucideIcon {
  const k = `${r.kind || ''} ${r.flow || ''}`
  if (/deal|sales|brand/.test(k)) return Handshake
  if (/proposal|quote|share/.test(k)) return FileText
  if (/content/.test(k)) return PlayCircle
  if (/price|rate|cost/.test(k)) return Coins
  if (/pay|payable|money|invoice/.test(k)) return Banknote
  if (/clear|approv|signoff/.test(k)) return BadgeCheck
  if (/chase|ladder|late|due/.test(k)) return ClipboardCheck
  if (/campaign|live/.test(k)) return Megaphone
  if (/creator|area|stock|roster/.test(k)) return Users
  return Sparkles
}

const age = (d?: number) => (d && d > 0 ? (d === 1 ? '1 day' : `${d} days`) : '')

function heroFrom(r: Row): Hero {
  const late = r.reason && /overdue|late|no answer/.test(r.reason)
  const line = [r.where, r.reason && (late && r.age_days ? `${r.reason} ${age(r.age_days)}` : r.reason)]
    .filter(Boolean).join(' · ')
  return { icon: iconFor(r), title: r.title, line, cta: r.actions?.[0]?.label && r.actions[0].label !== 'Open'
             ? r.actions[0].label : 'Open', href: r.href || '#' }
}

export function TeamHome({
  data, firstName, primary, badges, refreshing, onRefresh,
}: {
  data: any
  firstName: string
  primary: { label: string; href: string } | null
  badges: Record<string, number>
  refreshing: boolean
  onRefresh: () => void
}) {
  const role: string = data?.role || data?.scope || 'leadership'
  const waiting: Row[] = data?.waiting || []
  const moving: Row[] = data?.moving || []
  const headline: Stat[] = (data?.headline || []).slice(0, 4)
  const waitingTotal: number = Number(data?.waiting_total ?? waiting.length)
  const viewing: string | null = data?.viewing || null

  // The cloud: up to three of the most urgent. The server already sorts urgent first,
  // longest wait first inside each band.
  const urgent = waiting.filter(r => r.urgency === 'high')
  const top = (urgent.length ? urgent : waiting).slice(0, 3)
  const heroes: Hero[] = top.length
    ? top.map(heroFrom)
    : [{ icon: Sparkles, title: "You're all caught up", line: 'Nothing is waiting on you right now.',
         cta: primary?.label || 'Open the console', href: primary?.href || '/work' }]
  const rest = waiting.filter(r => !top.includes(r))

  const tones: (keyof typeof TONE)[] = ['lime', 'mist', 'forest', 'paper']

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col gap-6 p-1 sm:p-2">
      {/* Anchors for the Today walkthrough (help/walkthroughs.ts). */}
      <div data-tour="today-greeting">
      <ShellHeader
        kicker={viewing ? `Viewing ${viewing}'s day` : new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        lead={`${greetingWord()},`}
        accent={(viewing || firstName || 'welcome back').split(/\s/)[0]}
        right={
          <>
            <span className="inline-flex h-9 items-center rounded-full border bg-card px-3.5 text-[13px] font-medium">
              {ROLE_LABEL[role] || role}
            </span>
            <button type="button" onClick={onRefresh} aria-label="Refresh"
                    className="inline-flex size-9 items-center justify-center rounded-full border bg-card transition-colors hover:border-foreground/30">
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} strokeWidth={1.75} />
            </button>
            {primary && !viewing && (
              <Link href={primary.href}
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
          <HeroCard hero={heroes[0]} size="lg" className="min-h-[40dvh] flex-[3]" />
        ) : heroes.length === 2 ? (
          <div className="grid min-h-[40dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-2">
            <HeroCard hero={heroes[0]} size="md" />
            <HeroCard hero={heroes[1]} size="md" />
          </div>
        ) : (
          <div className="grid min-h-[40dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-[1.35fr_1fr] md:grid-rows-2">
            <HeroCard hero={heroes[0]} size="md" className="md:row-span-2" />
            <HeroCard hero={heroes[1]} size="sm" />
            <HeroCard hero={heroes[2]} size="sm" />
          </div>
        )}

        {headline.length > 0 && (
          <div data-tour="today-numbers" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {headline.map((h, i) => (
              <Fact key={h.label} stat={h} tone={tones[i % tones.length]} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ListTile title="Also waiting on you"
                    aside={waitingTotal > top.length ? `${waitingTotal - top.length} more` : undefined}
                    rows={rest.slice(0, 7)} empty="Nothing else. The cloud has it all." />
          <ListTile title="Moving without you" rows={moving.slice(0, 7)} owner
                    empty="Nothing in flight right now." />
        </div>

        <Tile className="gap-4 p-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Go to</span>
          <Shortcuts scope={role} badges={badges} primary={null} />
        </Tile>
      </section>
    </div>
  )
}

function HeroCard({ hero, size, className }: { hero: Hero; size: 'lg' | 'md' | 'sm'; className?: string }) {
  const sm = size === 'sm'
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
        <Link href={hero.href}
              className={cn('inline-flex items-center gap-2 rounded-full bg-foreground font-medium text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-90',
                            sm ? 'h-10 px-5 text-[13px]' : 'h-12 px-6 text-sm')}>
          {hero.cta}<ArrowRight className="size-4" strokeWidth={2} />
        </Link>
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
  const v = stat.value
  const money = stat.format === 'aed' || stat.format === 'money'
  const body = v == null ? DASH : money ? compact(v) : String(v)
  const inner = (
    <Tile as="div" className={cn('h-full min-h-[150px] justify-between gap-5 p-6 transition-transform group-hover:-translate-y-0.5', t.tile)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', t.label)}>{stat.label}</span>
        <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-baseline gap-1 text-[52px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[56px]">
          {money && v != null && <DirhamSign className="text-[0.55em]" />}{body}
        </span>
        {stat.hint ? <span className={cn('text-[13px]', t.label)}>{stat.hint}</span> : <span className="h-[18px]" />}
      </div>
    </Tile>
  )
  return stat.href
    ? <Link href={stat.href} className="group rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link>
    : <div className="group">{inner}</div>
}

const ROW_DOT: Record<string, string> = {
  bad: 'bg-destructive', warn: 'bg-[var(--tone-warn-dot)]', good: 'bg-[var(--tone-good-dot)]',
}

function ListTile({ title, aside, rows, empty, owner }: {
  title: string; aside?: string; rows: Row[]; empty: string; owner?: boolean
}) {
  return (
    <Tile className="gap-1 p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
        {aside && <span className="text-[12px] text-muted-foreground">{aside}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="m-0 py-6 text-center text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((r, i) => {
            const Icon = iconFor(r)
            const inner = (
              <>
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
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {r.stage_label && (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{r.stage_label}</span>
                  )}
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">
                    {owner ? (r.owner ? `${r.owner}` : '') : age(r.age_days)}
                  </span>
                </span>
              </>
            )
            return (
              <li key={`${r.title}-${i}`} className="border-b border-border/60 last:border-0">
                {r.href
                  ? <Link href={r.href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60">{inner}</Link>
                  : <div className="flex items-center gap-3 py-2.5">{inner}</div>}
              </li>
            )
          })}
        </ul>
      )}
    </Tile>
  )
}
