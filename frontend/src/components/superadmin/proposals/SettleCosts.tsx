'use client'

/**
 * What we are actually paying, once the client has said yes.
 *
 * The price on a proposal is a quote. Between the quote and the confirmation somebody nearly
 * always negotiates — a creator comes down for a bigger package, another goes up because the
 * usage changed — and until the real number is written against each name, the margin on the
 * campaign is a guess dressed up as a figure.
 *
 * So this is the screen that gets cleared the moment a proposal is confirmed. Quoted on the
 * left, confirmed in the middle, margin on the right, and a total that stops being
 * provisional when the last row is filled.
 *
 * Leadership only, and the server enforces it too: this is the number the whole profit
 * calculation rests on, and it is the number talent must never be able to read a sell price
 * off the back of.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { Aed } from '@/components/console/primitives'
import { cn } from '@/lib/utils'

type Row = {
  id: string
  username?: string | null
  full_name?: string | null
  avatar?: string | null
  followers_count?: number | null
  quoted_cost_aed: number
  sell_aed: number
  confirmed_cost_aed: number | null
  margin_aed: number
  confirmed: boolean
  rate_note?: string | null
}

type Payload = {
  creators: Row[]
  sell_total_aed: number
  cost_total_aed: number
  margin_aed: number
  margin_pct: number | null
  pending: number
  settled: boolean
}

const money = (n?: number | null) =>
  n == null ? '—' : n.toLocaleString('en-AE', { maximumFractionDigits: 0 })

export function SettleCosts({ campaignId, onSettled }: { campaignId: string; onSettled?: () => void }) {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [denied, setDenied] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/campaigns/${campaignId}/costs`)
      if (res.status === 403) { setDenied(true); return }
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not load the costs')
      setData(j.data)
      // Rows that are already confirmed start filled in, so an edit is an edit and a blank
      // row is genuinely outstanding.
      setDraft(Object.fromEntries((j.data.creators as Row[])
        .filter(r => r.confirmed_cost_aed != null)
        .map(r => [r.id, String(r.confirmed_cost_aed)])))
    } catch (e: any) {
      toast.error(e?.message || 'Could not load the costs')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { load() }, [load])

  /** The running margin as typed, so the effect of a negotiation is visible before saving. */
  const live = useMemo(() => {
    if (!data) return null
    let cost = 0
    for (const r of data.creators) {
      const typed = Number(draft[r.id])
      cost += Number.isFinite(typed) && draft[r.id] !== '' ? typed
            : (r.confirmed_cost_aed ?? r.quoted_cost_aed)
    }
    const sell = data.sell_total_aed
    return { cost, sell, margin: sell - cost, pct: sell ? ((sell - cost) / sell) * 100 : null }
  }, [data, draft])

  const save = async () => {
    if (!data) return
    const rates = data.creators
      .map(r => ({ id: r.id, amount_aed: Number(draft[r.id]) }))
      .filter(r => draft[r.id] !== undefined && draft[r.id] !== '' && Number.isFinite(r.amount_aed))
    if (!rates.length) { toast.error('Type at least one confirmed cost'); return }
    setSaving(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/campaigns/${campaignId}/confirm-costs`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates }) },
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not save')
      toast.success(j.message || 'Costs confirmed')
      await load()
      onSettled?.()
    } catch (e: any) {
      toast.error(e?.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (denied) return null
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />
  if (!data || !data.creators.length) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-[18px] w-[18px] text-muted-foreground" />
              Confirmed costs
            </CardTitle>
            <CardDescription>
              What we actually pay each creator after negotiating. The margin below is only
              real once every row is confirmed.
            </CardDescription>
          </div>
          {data.settled ? (
            <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
              <Check className="mr-1 h-3.5 w-3.5" />All settled
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-amber-300 text-amber-700 dark:text-amber-400">
              <AlertCircle className="mr-1 h-3.5 w-3.5" />{data.pending} still open
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[12px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Creator</th>
                <th className="px-4 py-2.5 text-right font-medium">Quoted cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Confirmed cost</th>
                <th className="px-4 py-2.5 text-right font-medium">We charge</th>
                <th className="px-4 py-2.5 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.map(r => {
                const typed = draft[r.id] === '' || draft[r.id] === undefined ? null : Number(draft[r.id])
                const effective = typed ?? r.confirmed_cost_aed ?? r.quoted_cost_aed
                const margin = r.sell_aed - effective
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={cdnAvatar(r.avatar) || undefined} className="object-cover" />
                          <AvatarFallback className="text-[10px]">
                            {(r.username || '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">@{r.username}</div>
                          {r.confirmed && (
                            <div className="text-[11.5px] text-emerald-600 dark:text-emerald-400">Confirmed</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      <Aed>{money(r.quoted_cost_aed)}</Aed>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        inputMode="decimal"
                        value={draft[r.id] ?? ''}
                        placeholder={String(r.quoted_cost_aed || '')}
                        onChange={e => setDraft(d => ({ ...d, [r.id]: e.target.value.replace(/[^\d.]/g, '') }))}
                        className={cn('ml-auto h-9 w-32 text-right tabular-nums',
                                      !r.confirmed && !draft[r.id] && 'border-amber-300')}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <Aed>{money(r.sell_aed)}</Aed>
                    </td>
                    <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums',
                                      margin < 0 ? 'text-rose-600 dark:text-rose-400' : '')}>
                      <Aed>{money(margin)}</Aed>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3.5">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">We charge</div>
              <div className="text-base font-semibold tabular-nums"><Aed>{money(live?.sell)}</Aed></div>
            </div>
            <div>
              <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">We pay</div>
              <div className="text-base font-semibold tabular-nums"><Aed>{money(live?.cost)}</Aed></div>
            </div>
            <div>
              <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">Margin</div>
              <div className={cn('text-base font-semibold tabular-nums',
                                 (live?.margin ?? 0) < 0 && 'text-rose-600 dark:text-rose-400')}>
                <Aed>{money(live?.margin)}</Aed>
                {live?.pct != null && (
                  <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                    {live.pct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Confirm costs
          </Button>
        </div>

        {!data.settled && (
          <p className="text-[13px] text-muted-foreground">
            Rows without a confirmed cost fall back to the quote for the running total, so the
            margin above is provisional until the last one is in.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
