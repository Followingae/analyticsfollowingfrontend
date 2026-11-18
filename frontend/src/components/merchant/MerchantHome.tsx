'use client'

/**
 * The merchant's home at /dashboard.
 *
 * Three screens for three moments: before the campaign is live, while it is,
 * and after the trial ends. Which one shows is decided from the trial and the
 * campaign status, nothing else. The shell (sidebar and header) is owned here
 * so the merchant never sees the brand sidebar with its locked modules spread
 * across the whole product.
 */
import { MerchantShell } from './MerchantShell'
import { HomeLive } from './HomeLive'
import { HomeInReview } from './HomeInReview'
import { HomeTrialEnded } from './HomeTrialEnded'
import { TileSkeleton } from './bits'
import { Skeleton } from '@/components/ui/skeleton'
import type { MerchantHomeData } from '@/services/merchantApi'

type Screen = 'live' | 'before' | 'ended'

export function screenFor(data: MerchantHomeData): Screen {
  if (data.trial?.status === 'complete') return 'ended'
  const s = data.campaign?.status
  if (s === 'active' || s === 'paused' || s === 'completed') return 'live'
  return 'before'
}

function subtitleFor(data: MerchantHomeData): string {
  if (data.trial?.status === 'complete') return 'Trial complete'
  return 'Free trial'
}

export function MerchantHome({ data }: { data: MerchantHomeData }) {
  const screen = screenFor(data)
  return (
    <MerchantShell
      name={data.merchant.name}
      logoUrl={data.merchant.logo_url}
      subtitle={subtitleFor(data)}
      lockedHeading={screen === 'ended' ? 'Open up' : 'After your trial'}
    >
      {screen === 'live' && <HomeLive data={data} />}
      {screen === 'before' && <HomeInReview data={data} />}
      {screen === 'ended' && <HomeTrialEnded data={data} />}
    </MerchantShell>
  )
}

/** The same shape as the live screen, while /merchant/home is on its way. */
export function MerchantHomeSkeleton() {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <div className="hidden w-[232px] shrink-0 border-r border-border px-5 pt-7 lg:block">
        <Skeleton className="h-5 w-24" />
        <div className="mt-8 flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-[10px]" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-9 lg:py-7">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-9 w-72" />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
          <TileSkeleton className="lg:col-span-4" />
          <TileSkeleton className="lg:col-span-5" />
          <TileSkeleton className="lg:col-span-3" />
          <TileSkeleton className="lg:col-span-4" />
          <TileSkeleton className="lg:col-span-5" />
          <TileSkeleton className="lg:col-span-3" />
        </div>
      </div>
    </div>
  )
}
