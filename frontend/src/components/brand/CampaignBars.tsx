'use client'

/**
 * The client's campaigns, as one chart rather than a carousel of panels.
 *
 * The old spotlight showed ONE campaign at a time in a tall two-column card you had to page
 * through. That is a lot of screen for a single row of facts, and a client with four
 * campaigns could not see them together — which is the one thing a home page should answer.
 *
 * Colour encodes campaign TYPE, not campaign identity. Giving every bar its own colour is
 * tempting and wrong: the bar already carries identity in its label, so a per-campaign hue
 * spends the only free channel restating something visible and leaves nothing to say what
 * kind of work each one is. Type is a real category with a handful of values, so the colour
 * earns its place — and when a client only runs one kind, every bar is slot 1 and the legend
 * does not appear, which is correct rather than a degraded case.
 *
 * Palette is the validated categorical set: adjacent CVD Delta E 9.1 in light and 8.4 in dark,
 * both modes stepped separately against their own surface. The light steps sit under 3:1
 * contrast, which obliges visible labels — the creator count is printed on every bar, so the
 * chart never relies on colour alone to be read.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { unifiedCampaignApi } from '@/services/clientManagementApi'
import { cn } from '@/lib/utils'

/* Fixed order, assigned by type — never by rank. A campaign that drops out of the top eight
   must not repaint the ones that remain. */
const TYPE_ORDER = ['influencer', 'barter', 'ugc', 'cashback', 'paid_deal'] as const
const LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']
const TYPE_LABEL: Record<string, string> = {
  influencer: 'Influencer', barter: 'Barter', ugc: 'UGC',
  cashback: 'Cashback', paid_deal: 'Paid deal',
}

/* Eight is where categorical colour stops working and a bar list stops being scannable.
   Past that the tail is summarised rather than drawn. */
const MAX_BARS = 8

type Row = { id: string; name: string; type: string; creators: number; status: string }

export function CampaignBars({ className }: { className?: string }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [more, setMore] = useState(0)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const el = document.documentElement
    const read = () => setDark(el.classList.contains('dark'))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await unifiedCampaignApi.list({ limit: 50 })
        const raw = data?.campaigns || data?.data?.campaigns || data?.data || []
        const all: Row[] = (Array.isArray(raw) ? raw : [])
          .filter((c: any) => !c.is_pre_platform)
          .map((c: any) => ({
            id: String(c.id),
            name: c.name || 'Untitled',
            type: c.campaign_type || 'influencer',
            creators: Number(c.creators_count || 0),
            status: c.status || '',
          }))
          .sort((a: Row, b: Row) => b.creators - a.creators)
        if (!alive) return
        setRows(all.slice(0, MAX_BARS))
        setMore(Math.max(0, all.length - MAX_BARS))
      } catch {
        if (alive) setRows([])
      }
    })()
    return () => { alive = false }
  }, [])

  const palette = dark ? DARK : LIGHT
  const colourFor = (type: string) => {
    const i = TYPE_ORDER.indexOf(type as typeof TYPE_ORDER[number])
    return palette[i >= 0 ? i : 0]
  }

  /* Only the types actually present, in the fixed order — a legend listing kinds this client
     does not run is noise. */
  const legend = useMemo(() => {
    if (!rows) return []
    const present = new Set(rows.map(r => r.type))
    return TYPE_ORDER.filter(t => present.has(t))
  }, [rows])

  if (rows === null) return <Skeleton className={cn('h-[330px] w-full rounded-2xl', className)} />
  if (rows.length === 0) return null

  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your campaigns
          </CardTitle>
          {/* A legend only once there are two things to tell apart; one type is named by the
              title and needs no key. */}
          {legend.length > 1 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {legend.map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2 rounded-[2px]" style={{ background: colourFor(t) }} />
                  {TYPE_LABEL[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 pl-0 pr-4">
        <ChartContainer
          config={{ creators: { label: 'Creators' } }}
          className="h-full min-h-[240px] w-full"
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 34, bottom: 4, left: 4 }}
            barCategoryGap={6}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={132}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11.5, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const r = payload[0].payload as Row
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                    <p className="text-[13px] font-semibold leading-tight">{r.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <span className="size-2 rounded-[2px]" style={{ background: colourFor(r.type) }} />
                      {TYPE_LABEL[r.type] ?? r.type}
                      {r.status ? ` · ${r.status}` : ''}
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium">
                      {r.creators} creator{r.creators === 1 ? '' : 's'}
                    </p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="creators"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              className="cursor-pointer"
              onClick={(d: any) => d?.payload?.id && router.push(`/campaigns/${d.payload.id}`)}
            >
              {rows.map(r => <Cell key={r.id} fill={colourFor(r.type)} />)}
              {/* Printed on every bar: the light steps sit under 3:1 against the surface, so
                  the number must not depend on the fill being legible. */}
              <LabelList
                dataKey="creators"
                position="right"
                offset={8}
                className="fill-foreground"
                style={{ fontSize: 11.5, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      {more > 0 && (
        <div className="border-t px-5 py-2 text-[11px] text-muted-foreground">
          {more} more campaign{more === 1 ? '' : 's'} — see all on Campaigns
        </div>
      )}
    </Card>
  )
}
