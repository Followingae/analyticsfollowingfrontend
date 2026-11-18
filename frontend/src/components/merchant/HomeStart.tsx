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
import { Tile, Money, LIME, greetingWord } from './bits'

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

        {/* Four quiet facts */}
        <div className="grid flex-[2] grid-cols-2 gap-4 lg:grid-cols-4">
          <Fact icon={Users} value={String(perMonth)} label="creators a month" tone="lime" />
          <Fact icon={CalendarDays} value={String(months)} label="months, on us" pills={months} />
          <Fact icon={Gift} value={<Money amount={minimum} />} label="minimum per creator" />
          <Fact icon={ShieldCheck} value="1" label="day to approve" />
        </div>
      </section>
    </>
  )
}

function Fact({
  icon: Icon,
  value,
  label,
  tone,
  pills,
}: {
  icon: typeof Users
  value: React.ReactNode
  label: string
  tone?: 'lime'
  pills?: number
}) {
  const lime = tone === 'lime'
  return (
    <Tile className={cn('min-h-[150px] justify-between gap-5 p-5', lime && cn(LIME, 'border-0'))}>
      <span className={cn('inline-flex size-10 items-center justify-center rounded-full', lime ? 'bg-[oklch(0.2_0.03_140)]/10' : 'bg-muted')}>
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <span className="text-[34px] font-medium leading-none tracking-[-0.03em] tabular-nums">{value}</span>
        <span className={cn('text-[13px]', lime ? 'opacity-75' : 'text-muted-foreground')}>{label}</span>
        {pills ? (
          <span aria-hidden="true" className="mt-1 flex gap-1.5">
            {Array.from({ length: pills }).map((_, i) => (
              <span key={i} className="h-1.5 w-7 rounded-full bg-foreground/15" />
            ))}
          </span>
        ) : null}
      </div>
    </Tile>
  )
}
