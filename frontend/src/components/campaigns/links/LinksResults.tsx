'use client'

/**
 * The pieces of a tracked-links report that ours and the brand's screens share: the totals,
 * the daily clicks, where the clicks came from, and the per-retailer summary.
 *
 * A BREAKDOWN WITH NOTHING IN IT IS NOT DRAWN. A country list reading "Unknown 0" tells a
 * brand their campaign reached nobody, which is a sentence the data never said.
 */

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { CARD } from '@/components/console/primitives'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import {
  count, money,
  type AppClicks, type CountryClicks, type DailyClicks, type DeviceClicks, type FunnelStep,
  type LinkFunnel, type LinkTotals, type RetailerResult,
} from '@/services/trackedLinksApi'

export async function copyText(text: string, what = 'Copied'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(what)
  } catch {
    toast.error('Could not copy. Select it and copy by hand.')
  }
}

export function CopyButton({ text, label, className }: {
  text: string
  label?: string
  className?: string
}) {
  const [done, setDone] = useState(false)
  return (
    <Button
      type="button" variant="ghost" size="sm"
      className={cn('h-7 gap-1 px-1.5 text-muted-foreground', className)}
      aria-label={label || 'Copy'}
      onClick={async () => {
        await copyText(text, label ? `${label} copied` : 'Copied')
        setDone(true)
        setTimeout(() => setDone(false), 1400)
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span className="text-[12px]">{label}</span>}
    </Button>
  )
}

export function CreatorCell({ username, fullName, pic }: {
  username: string | null
  fullName?: string | null
  pic?: string | null
}) {
  const handle = username || ''
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={cdnAvatar(pic)} alt="" />
        <AvatarFallback className="text-[10px]">
          {(handle || fullName || '?').slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium">{handle ? `@${handle}` : fullName || 'Unnamed'}</p>
        {fullName && handle && (
          <p className="truncate text-[12px] text-muted-foreground">{fullName}</p>
        )}
      </div>
    </div>
  )
}

export function LinksTotals({ totals }: { totals: LinkTotals }) {
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: 'Clicks', value: count(totals.clicks) },
    { label: 'Unique visitors', value: count(totals.unique_clicks) },
    { label: 'Sales', value: count(totals.sales) },
    { label: 'Revenue', value: money(totals.revenue_cents, totals.currency || 'AED') },
  ]
  // Null means nobody has clicked yet. A 0% here would be a claim that people came and did
  // not buy, so the tile is simply left out.
  if (totals.conversion_rate != null) {
    tiles.push({ label: 'Conversion', value: `${totals.conversion_rate}%`, hint: 'sales per visitor' })
  }
  return (
    <div className={cn(CARD, 'grid grid-cols-2 divide-x divide-y bg-card sm:grid-cols-3 lg:divide-y-0',
                       tiles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
      {tiles.map((t) => (
        <div key={t.label} className="px-4 py-3.5">
          <p className="text-ds-overline uppercase text-muted-foreground">{t.label}</p>
          <p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
            {t.value}
          </p>
          {t.hint && <p className="mt-1.5 text-ds-caption text-muted-foreground">{t.hint}</p>}
        </div>
      ))}
    </div>
  )
}

const DAILY: ChartConfig = {
  clicks: { label: 'Clicks', color: 'var(--primary)' },
  unique_clicks: { label: 'Unique', color: 'oklch(0.55 0.02 120)' },
}

const shortDay = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export function DailyClicksChart({ daily }: { daily: DailyClicks[] }) {
  if (!daily.length) return null
  return (
    <div className={cn(CARD, 'bg-card p-4')}>
      <h3 className="text-[14px] font-semibold">Clicks by day</h3>
      <p className="text-ds-caption text-muted-foreground">Dubai time</p>
      <ChartContainer config={DAILY} className="mt-3 aspect-auto h-[200px] w-full">
        <BarChart data={daily} margin={{ left: 0, right: 0, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8}
                 minTickGap={24} tickFormatter={shortDay} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(v: unknown) => shortDay(String(v))} />} />
          <Bar dataKey="clicks" fill="var(--color-clicks)" radius={3} />
          <Bar dataKey="unique_clicks" fill="var(--color-unique_clicks)" radius={3} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

let regionNames: Intl.DisplayNames | null = null
function countryName(code: string): string {
  if (!code) return 'Not known'
  try {
    regionNames = regionNames || new Intl.DisplayNames(['en'], { type: 'region' })
    return regionNames.of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; clicks: number }[] }) {
  const shown = rows.filter((r) => r.clicks > 0)
  if (!shown.length) return null
  const max = Math.max(...shown.map((r) => r.clicks))
  return (
    <div className={cn(CARD, 'bg-card p-4')}>
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {shown.map((r) => (
          <li key={r.label} className="text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">{count(r.clicks)}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted">
              <div className="h-1 rounded-full bg-primary" style={{ width: `${(r.clicks / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ClickBreakdowns({ byCountry, byDevice, byApp }: {
  byCountry: CountryClicks[]
  byDevice: DeviceClicks[]
  byApp: AppClicks[]
}) {
  const country = byCountry.map((r) => ({ label: countryName(r.country), clicks: r.clicks }))
  const device = byDevice.map((r) => ({
    label: r.device ? r.device.charAt(0).toUpperCase() + r.device.slice(1) : 'Not known',
    clicks: r.clicks,
  }))
  const app = byApp.map((r) => ({ label: r.app === 'Other' ? 'A browser or another app' : r.app,
                                   clicks: r.clicks }))
  if (![country, device, app].some((l) => l.some((r) => r.clicks > 0))) return null
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Breakdown title="Where they were" rows={country} />
      <Breakdown title="What they used" rows={device} />
      <Breakdown title="Which app they tapped from" rows={app} />
    </div>
  )
}

const JOURNEY: { key: FunnelStep; label: string }[] = [
  { key: 'landing', label: 'Landed' },
  { key: 'product_view', label: 'Viewed a product' },
  { key: 'add_to_cart', label: 'Added to cart' },
  { key: 'checkout', label: 'Started checkout' },
  { key: 'purchase', label: 'Purchased' },
]

/**
 * From the tap to the purchase, on a store running the Following pixel. Drawn only once the
 * store has sent an event: before that every step would read 0, and 0 there means "the pixel
 * is not on", not "nobody bought".
 */
export function JourneyFunnel({ funnel, uniqueClicks }: {
  funnel: LinkFunnel | null | undefined
  uniqueClicks: number
}) {
  if (!funnel?.installed) return null
  const steps = [
    { key: 'tapped', label: 'People who tapped', n: uniqueClicks },
    ...JOURNEY.map((s) => ({ key: s.key, label: s.label, n: funnel.totals[s.key] || 0 })),
  ]
  const base = Math.max(...steps.map((s) => s.n), 1)
  return (
    <div className={cn(CARD, 'bg-card p-4')}>
      <h3 className="text-[14px] font-semibold">From tap to purchase</h3>
      <p className="text-ds-caption text-muted-foreground">What people did on the store after tapping a link</p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].n : 0
          const pct = i > 0 && prev > 0 ? Math.round((s.n / prev) * 1000) / 10 : null
          return (
            <li key={s.key} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-[13px]">
              <span className="truncate">{s.label}</span>
              <div className="h-2.5 rounded-full bg-muted">
                <div className="h-2.5 rounded-full bg-primary transition-[width]"
                     style={{ width: `${Math.min(100, (s.n / base) * 100)}%` }} />
              </div>
              <span className="min-w-[6.5rem] text-right tabular-nums">
                <span className="font-medium">{count(s.n)}</span>
                {pct != null && <span className="ml-1.5 text-muted-foreground">{pct}%</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-ds-caption text-muted-foreground">Each % is of the step before it.</p>
    </div>
  )
}

export function RetailerCards({ retailers, currency }: { retailers: RetailerResult[]; currency: string }) {
  if (!retailers.length) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {retailers.map((r) => (
        <div key={r.id} className={cn(CARD, 'bg-card p-4')}>
          <h3 className="truncate text-[15px] font-semibold">{r.label}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Clicks</dt>
              <dd className="font-medium tabular-nums">{count(r.clicks)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Unique</dt>
              <dd className="font-medium tabular-nums">{count(r.unique_clicks)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sales</dt>
              <dd className="font-medium tabular-nums">{count(r.sales)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Revenue</dt>
              <dd className="font-medium tabular-nums">{money(r.revenue_cents, currency)}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  )
}
