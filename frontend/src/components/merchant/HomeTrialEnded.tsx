'use client'

/**
 * The home after the third month: what the trial did, and how to keep going.
 *
 * No prices here (founder decision, 18 Nov 2026). The keep-going tile is a short
 * quote request: what they want next, three questions, where to send the quote.
 * A person writes back within two business days.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { MerchantHomeData } from '@/services/merchantApi'
import { ShellHeader } from './MerchantShell'
import { Tile, Eyebrow, StatusPill, Face, Money, FOREST, Quiet, compact, longDate } from './bits'
import { Thumb } from './tiles'
import { QuoteRequestCard } from './QuoteRequestCard'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen']
const word = (n: number) => NUMBER_WORDS[n] ?? String(n)

export function HomeTrialEnded({ data }: { data: MerchantHomeData }) {
  const { trial, content, creators } = data
  const pieces = (content?.reels || 0) + (content?.stories || 0) + (content?.posts || 0)
  const best = [...(content?.latest || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3)
  const back = creators.filter((c) => c.would_return)
  const visited = creators.filter((c) => c.state === 'done' || c.state === 'posting').length
  const views = content?.views || 0
  const perCreator = data.campaign?.value_per_creator_aed ?? null

  // Weekly views are not in the contract, so the forest panel draws no chart. A line
  // with no data behind it would be a picture of nothing.

  return (
    <>
      <ShellHeader
        kicker={longDate(trial.ends_at) || undefined}
        lead={`${word(trial.months).charAt(0).toUpperCase()}${word(trial.months).slice(1)} months,`}
        accent={`${word(trial.used_total)} creators`}
        right={<StatusPill tone="done">Trial complete</StatusPill>}
      />

      <section
        aria-label="Overview"
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:[&>*]:min-h-0"
      >
        {/* Results */}
        <Tile className={cn(FOREST, 'justify-between border-0 p-6 sm:p-7 md:col-span-2 lg:col-span-7')}>
          <Eyebrow className="text-current opacity-70">What your trial did</Eyebrow>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big value={visited} label="creators visited" lime />
            <Big value={pieces} label="pieces of content" />
            <Big value={compact(views)} label="views" />
            {perCreator != null ? <Big value={<Money amount={trial.used_total * perCreator} />} label="in product, no fees" /> : null}
          </div>
          <span className="text-xs opacity-70">
            {trial.used_total} creators over {trial.months} months, counted from their check-ins and posts.
          </span>
        </Tile>

        {/* Keep going */}
        <Tile className="gap-4 p-6 md:col-span-2 lg:col-span-5 lg:row-span-2">
          <QuoteRequestCard businessName={data.merchant?.name} />
        </Tile>

        {/* Best content */}
        <Tile className="lg:col-span-4">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 text-[15px] font-semibold">Your best content</h2>
            <Link href="/merchant/campaign#content" className="text-[13px] text-muted-foreground hover:text-foreground">
              See all
            </Link>
          </div>
          {best.length === 0 ? (
            <Quiet className="my-auto">No content was posted during the trial.</Quiet>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
              {best.map((item) => (
                <Thumb key={item.id} item={item} className="min-h-[80px]" badge={item.views ? compact(item.views) : undefined} />
              ))}
            </div>
          )}
          {pieces > 0 ? <span className="text-xs text-muted-foreground">Usage rights on all {pieces} pieces run for 30 days after each post.</span> : null}
        </Tile>

        {/* Would come back */}
        <Tile className="lg:col-span-3">
          <h2 className="m-0 text-[15px] font-semibold">Would come back</h2>
          {back.length === 0 ? (
            <Quiet className="flex-1">We ask every creator after their visit whether they would return. Answers show here.</Quiet>
          ) : (
            <>
              <div className="flex items-center">
                {back.slice(0, 4).map((c, i) => (
                  <Face key={c.id} name={c.name} src={c.avatar_url} className={cn('size-[34px] border-2 border-card', i > 0 && '-ml-2.5')} />
                ))}
                {back.length > 4 ? (
                  <span className="-ml-2.5 inline-flex size-[34px] items-center justify-center rounded-full border-2 border-card bg-muted text-[11px] font-semibold">
                    +{back.length - 4}
                  </span>
                ) : null}
              </div>
              <p className="m-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {back.length} of your {creators.length} creators said yes to a second visit. They are first in line when you continue.
              </p>
            </>
          )}
          <Link href="/merchant/campaign#creators" className="text-[13px] font-medium hover:underline">
            See who
          </Link>
        </Tile>
      </section>
    </>
  )
}

function Big({ value, label, lime }: { value: React.ReactNode; label: string; lime?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn('text-[32px] font-medium leading-none tracking-[-0.03em] sm:text-[40px]', lime && 'text-[oklch(0.9354_0.2254_121.5)]')}>{value}</span>
      <span className="text-[13px] opacity-80">{label}</span>
    </div>
  )
}
