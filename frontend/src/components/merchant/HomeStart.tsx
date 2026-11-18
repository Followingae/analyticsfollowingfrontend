'use client'

/**
 * The home before there is anything to measure. Almost no words: a cloudy hero
 * with one mark, one line and one button, then four quiet icon tiles that each
 * carry a single number. The wizard explains everything else, one question at
 * a time. The founder's brief for this screen was three words: whitespace,
 * cloudy, icons.
 */
import Link from 'next/link'
import { Megaphone, Users, Gift, ShieldCheck, CalendarDays, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MerchantHomeData } from '@/services/merchantApi'
import { ShellHeader } from './MerchantShell'
import { Tile, Money, LIME, FOREST, greetingWord } from './bits'

export function HomeStart({ data }: { data: MerchantHomeData }) {
  const campaign = data.campaign
  const draft = !!campaign
  const programme = data.trial.programme
  const perMonth = programme.creators_per_month
  const months = programme.months
  const minimum = programme.min_value_per_creator_aed

  return (
    <>
      <ShellHeader lead={`${greetingWord()},`} accent={data.merchant.name} />

      <section aria-label="Get started" className="flex min-h-0 flex-1 flex-col gap-4">
        {/* The cloud */}
        <Tile className="relative min-h-[46dvh] flex-[3] items-center justify-center overflow-hidden border-0 bg-card p-0 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute -left-24 -top-28 size-[28rem] rounded-full bg-[oklch(0.9354_0.2254_121.5)]/35 blur-3xl" />
            <span className="absolute -bottom-32 right-[-6rem] size-[30rem] rounded-full bg-primary/25 blur-3xl" />
            <span className="absolute left-1/2 top-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 blur-2xl" />
          </div>

          <div className="relative flex flex-col items-center gap-7 px-6 text-center">
            <span className="relative inline-flex size-24 items-center justify-center rounded-full bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-border">
              <span className={cn('inline-flex size-16 items-center justify-center rounded-full', LIME)}>
                <Megaphone className="size-7" strokeWidth={1.6} />
              </span>
              <span className="absolute -right-1 -top-1 inline-flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border">
                <Sparkles className="size-3.5" strokeWidth={2} />
              </span>
            </span>

            <div className="flex flex-col items-center gap-2">
              <h2 className="m-0 text-[30px] font-medium leading-none tracking-[-0.03em] sm:text-[36px]">
                {draft ? 'Your draft is waiting' : 'Your first campaign'}
              </h2>
              <p className="m-0 text-sm text-muted-foreground">{draft ? 'A few questions left.' : 'Seven questions. Ten minutes.'}</p>
            </div>

            <Link
              href="/merchant/campaign/new"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-90"
            >
              {draft ? 'Continue' : 'Start'}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </Tile>

        {/* Four bold facts */}
        <div className="grid flex-[2] grid-cols-2 gap-4 lg:grid-cols-4">
          <Fact icon={Users} value={String(perMonth)} label="creators a month" tone="lime">
            <span aria-hidden="true" className="flex -space-x-2">
              {Array.from({ length: perMonth }).map((_, i) => (
                <span key={i} className="size-7 rounded-full border-2 border-[oklch(0.9354_0.2254_121.5)] bg-[oklch(0.2_0.03_140)]/15" />
              ))}
            </span>
          </Fact>
          <Fact icon={CalendarDays} value={String(months)} label="months, on us" tone="mist">
            <span aria-hidden="true" className="flex gap-1.5">
              {Array.from({ length: months }).map((_, i) => (
                <span key={i} className="h-2 flex-1 rounded-full bg-foreground/15" />
              ))}
            </span>
          </Fact>
          <Fact icon={Gift} value={<Money amount={minimum} />} label="minimum per creator" tone="paper">
            <span aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-foreground/10">
              <span className="w-1/3 rounded-full bg-[oklch(0.9354_0.2254_121.5)]" />
            </span>
          </Fact>
          <Fact icon={ShieldCheck} value="1" label="day to approve" tone="forest">
            <span aria-hidden="true" className="relative inline-flex size-8 items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 size-8 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.9354 0.2254 121.5)" strokeWidth="3" strokeDasharray="94" strokeDashoffset="24" strokeLinecap="round" />
              </svg>
            </span>
          </Fact>
        </div>
      </section>
    </>
  )
}

const TONE: Record<'lime' | 'mist' | 'paper' | 'forest', { tile: string; disc: string; label: string }> = {
  lime: { tile: cn(LIME, 'border-0'), disc: 'bg-[oklch(0.2_0.03_140)]/10', label: 'opacity-70' },
  mist: { tile: 'border-0 bg-primary/20 text-foreground', disc: 'bg-card/70', label: 'text-foreground/70' },
  paper: { tile: 'bg-card', disc: 'bg-muted', label: 'text-muted-foreground' },
  forest: { tile: cn(FOREST, 'border-0'), disc: 'bg-white/10', label: 'opacity-70' },
}

function Fact({
  icon: Icon,
  value,
  label,
  tone,
  children,
}: {
  icon: typeof Users
  value: React.ReactNode
  label: string
  tone: 'lime' | 'mist' | 'paper' | 'forest'
  children?: React.ReactNode
}) {
  const t = TONE[tone]
  return (
    <Tile className={cn('min-h-[170px] justify-between gap-6 p-6', t.tile)}>
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex size-11 items-center justify-center rounded-full', t.disc)}>
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[52px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[60px]">{value}</span>
        <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', t.label)}>{label}</span>
      </div>
    </Tile>
  )
}
