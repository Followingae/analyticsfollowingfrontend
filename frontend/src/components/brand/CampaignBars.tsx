'use client'

/**
 * A display of the client's campaigns. Not a workspace.
 *
 * One thin bar each, longest first, the creator count on the end. That is the whole thing.
 * It answers "what is running and how big is it" at a glance and then gets out of the way —
 * the campaigns page is where you go to actually do something.
 *
 * Plain CSS bars rather than a chart library: at this size a charting runtime buys axes,
 * grids and a tooltip layer nobody asked for, and costs precise control of every pixel.
 *
 * Colour is by campaign TYPE, not by campaign. The label already says which campaign it is,
 * so a hue per row would restate that and leave nothing to say what kind of work it is. One
 * type means one colour and no legend, which is right rather than degraded.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { unifiedCampaignApi } from '@/services/clientManagementApi'
import { cn } from '@/lib/utils'

/* Fixed order, assigned by type — never by rank, so a campaign dropping off the list cannot
   repaint the ones that stay. Validated categorical steps, light and dark chosen separately
   against their own surface. */
const TYPE_ORDER = ['influencer', 'barter', 'ugc', 'cashback', 'paid_deal'] as const
const LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']

const ROWS = 5

type Row = { id: string; name: string; type: string; creators: number }

export function CampaignBars({ className }: { className?: string }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [total, setTotal] = useState(0)
  const [dark, setDark] = useState(false)
  const [failed, setFailed] = useState(false)

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
            /* The unified endpoint aliases this `creator_count`, singular. Reading the
               plural gave every campaign a zero and a chart of empty bars. */
            creators: Number(c.creator_count ?? c.creators_count ?? c.total_creators ?? 0),
          }))
          .sort((a, b) => b.creators - a.creators)
        if (!alive) return
        setRows(all.slice(0, ROWS))
        setTotal(all.length)
      } catch {
        // A failed fetch is NOT an empty campaign list. Rendering nothing here reads to
        // the brand as "you have no campaigns", which is the same lie as a zero, so the
        // failure gets its own state instead.
        if (alive) { setRows([]); setFailed(true) }
      }
    })()
    return () => { alive = false }
  }, [])

  if (rows === null) return <Skeleton className={cn('h-full w-full rounded-xl', className)} />
  if (failed) {
    return (
      <Card className={cn('flex flex-col justify-center gap-1 p-5', className)}>
        <p className="text-[13px] font-medium">Campaigns did not load</p>
        <p className="text-[12px] text-muted-foreground">
          This is a display problem, not a count of zero.
        </p>
      </Card>
    )
  }
  if (rows.length === 0) return null

  const palette = dark ? DARK : LIGHT
  const colourFor = (t: string) => {
    const i = TYPE_ORDER.indexOf(t as typeof TYPE_ORDER[number])
    return palette[i >= 0 ? i : 0]
  }
  /* Scaled to the biggest one, with a floor so a campaign with a single creator is still a
     visible mark rather than a hairline. */
  const max = Math.max(...rows.map(r => r.creators), 1)

  return (
    <Card className={cn('flex flex-col overflow-hidden p-0', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Campaigns
        </span>
        <span className="text-xs font-semibold tabular-nums">{total}</span>
      </div>

      <div className="flex-1 space-y-2 px-4 py-3">
        {rows.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => router.push(`/campaigns/${r.id}`)}
            title={`${r.name} — ${r.creators} creator${r.creators === 1 ? '' : 's'}`}
            className="group block w-full text-left"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11.5px] leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                {r.name}
              </span>
              <span className="shrink-0 text-[11.5px] font-semibold tabular-nums">
                {r.creators}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max((r.creators / max) * 100, r.creators > 0 ? 6 : 0)}%`,
                  background: colourFor(r.type),
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {total > rows.length && (
        <div className="border-t px-4 py-2 text-[10.5px] text-muted-foreground">
          +{total - rows.length} more
        </div>
      )}
    </Card>
  )
}
