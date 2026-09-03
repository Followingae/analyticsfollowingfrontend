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
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { Aed, Panel } from '@/components/console/primitives'
import { useAdminAccess } from '@/hooks/useAdminAccess'
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
  /**
   * Defence in depth. The server refuses this data outright (creator_ladder_routes.py asks
   * for SCOPE_LEADERSHIP on both the read and the write), and until now that 403 was the
   * ONLY thing standing between an account manager and a table of costs, sell prices and
   * margins. One relaxed dependency on the backend and this component starts rendering the
   * number its own docstring says talent must never be able to read a sell price off.
   *
   * So the gate is stated here too. `canSeeMargin` is the frontend's name for the same
   * leadership scope, and it is NOT an admin check: the co-founder is role='user' with
   * staff_role='cofounder', and an admin check has locked her out of her own numbers before.
   */
  const { canSeeMargin, loading: gateLoading } = useAdminAccess()
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

  // Out of scope means the request is never made, so a cost never reaches this browser at
  // all. Waiting on `gateLoading` first, because "we do not know yet" must not read as yes.
  useEffect(() => {
    if (gateLoading) return
    if (!canSeeMargin) { setLoading(false); return }
    load()
  }, [load, gateLoading, canSeeMargin])

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

  // Absent, not blank: out of scope the panel does not exist, rather than existing empty and
  // telling an account manager that a margin is being kept from them.
  if (gateLoading || !canSeeMargin) return null
  if (denied) return null
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />
  if (!data || !data.creators.length) return null

  return (
    <Panel
      title="Confirmed costs"
      description="The margin is provisional until every row is confirmed."
      action={
        data.settled ? (
          <Badge variant="outline" className="rounded-full border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
            <Check className="mr-1 h-3.5 w-3.5" />All settled
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]">
            <AlertCircle className="mr-1 h-3.5 w-3.5" />{data.pending} still open
          </Badge>
        )
      }
    >
      <div className="space-y-ds-4">
        {/* The table sat inside a rounded, bordered well, inside a card that already had an
            edge. The well is gone; the header rule and the row rules carry the same
            structure with two fewer edges to cross before reaching a figure. */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[12px] uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
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
                  <tr key={r.id} className="border-b last:border-0">
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
                            <div className="text-[11.5px] text-[var(--tone-good-ink)]">Confirmed</div>
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
                                      !r.confirmed && !draft[r.id]
                                        && 'border-[var(--tone-warn-dot)]')}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <Aed>{money(r.sell_aed)}</Aed>
                    </td>
                    <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums',
                                      margin < 0 && 'text-[var(--tone-bad-ink)]')}>
                      <Aed>{money(margin)}</Aed>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Three figures in a tinted well, inside a card that already has an edge. The tint
            was the only thing grouping them and the gap does that for free, so the totals
            take the room the padding was using. The sentence that used to sit underneath
            said what the panel description now says once. */}
        <div className="flex flex-wrap items-center justify-between gap-ds-4 border-t pt-ds-4">
          <div className="flex flex-wrap gap-x-ds-5 gap-y-ds-2">
            <div>
              <p className="text-ds-caption font-medium text-muted-foreground">We charge</p>
              <p className="mt-ds-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                <Aed>{money(live?.sell)}</Aed>
              </p>
            </div>
            <div>
              <p className="text-ds-caption font-medium text-muted-foreground">We pay</p>
              <p className="mt-ds-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                <Aed>{money(live?.cost)}</Aed>
              </p>
            </div>
            <div>
              <p className="text-ds-caption font-medium text-muted-foreground">Margin</p>
              <p className={cn('mt-ds-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
                               (live?.margin ?? 0) < 0 && 'text-[var(--tone-bad-ink)]')}>
                <Aed>{money(live?.margin)}</Aed>
                {live?.pct != null && (
                  <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                    {live.pct.toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="rounded-ds-control">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Confirm costs
          </Button>
        </div>
      </div>
    </Panel>
  )
}
