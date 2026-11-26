'use client'

/**
 * The campaign as a creator sees it in the app: cover, who, what they get,
 * what they post, where to go. The review step and the campaign page both show
 * this so the merchant signs off on the same card a creator will tap.
 */
import { MapPin, Truck, Package, Users, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignBrief, ProgrammeTier } from '@/services/merchantApi'
import { deliverablesLine, totalValue, visitScheduleLine } from '@/services/merchantApi'
import { Cover, Face, Money } from './bits'

export function CreatorCard({
  brief,
  merchantName,
  logoUrl,
  tier,
  className,
}: {
  brief: CampaignBrief
  merchantName: string
  logoUrl?: string | null
  tier: ProgrammeTier | null
  className?: string
}) {
  const value = totalValue(brief.barter_items)
  const items = brief.barter_items || []
  const guaranteed = tier ? deliverablesLine(tier.guaranteed) : ''
  const attempted = tier && tier.attempted.length ? deliverablesLine(tier.attempted) : ''

  const visit =
    brief.fulfilment_mode === 'delivery'
      ? { icon: Truck, text: 'Delivered to the creator' }
      : brief.fulfilment_mode === 'brand_ships'
        ? { icon: Package, text: 'Shipped to the creator' }
        : { icon: MapPin, text: brief.visit_location || 'Visit in person' }

  return (
    <div className={cn('w-full max-w-[360px] overflow-hidden rounded-[24px] border border-border bg-card text-card-foreground shadow-[0_12px_32px_-20px_rgba(0,0,0,0.25)]', className)}>
      <div className="relative aspect-[4/3] w-full">
        <Cover src={brief.hero_image_url} />
        <div className="absolute left-3 top-3 inline-flex h-7 items-center rounded-full bg-black/45 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          Barter
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Face name={merchantName} src={logoUrl} className="size-10 rounded-xl" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold">{brief.name || 'Your campaign'}</span>
            <span className="truncate text-[13px] text-muted-foreground">{merchantName}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between rounded-2xl bg-muted/60 px-4 py-3">
          <span className="text-[13px] text-muted-foreground">You get</span>
          <span className="text-[20px] font-medium tracking-[-0.02em]">
            <Money amount={value} />
          </span>
        </div>

        {items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]">
            {items.slice(0, 4).map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex justify-between gap-3">
                <span className="truncate text-foreground/80">{item.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  <Money amount={item.value_aed} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">You post</span>
            <span className="text-right font-medium">{guaranteed || 'Set by your offer'}</span>
          </div>
          {attempted ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">If you can</span>
              <span className="text-right">{attempted}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3 text-[13px] text-muted-foreground">
          <visit.icon className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{visit.text}</span>
          {brief.fulfilment_mode === 'dine_in' && brief.guests_allowed ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1">
              <Users className="size-3.5" strokeWidth={1.75} />
              +{brief.guests_allowed}
            </span>
          ) : null}
        </div>

        {brief.fulfilment_mode === 'dine_in' ? (
          <div className="-mt-2 flex items-start gap-2 text-[13px] text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <span className="flex min-w-0 flex-col">
              <span>{visitScheduleLine(brief.visit_schedule)}</span>
              {brief.visit_schedule?.mode === 'slots' && brief.visit_schedule.note?.trim() ? (
                <span className="text-xs">{brief.visit_schedule.note.trim()}</span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
