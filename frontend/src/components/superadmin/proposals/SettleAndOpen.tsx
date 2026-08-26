'use client'

/**
 * The client said yes. Now we price it and open it.
 *
 * This step used to not exist. Whoever pressed Confirm - the client in their own app, or an
 * operator on their behalf - a live campaign appeared in the same request. When an operator
 * did it that was survivable, because the confirm page collects the real costs at the same
 * moment. When the CLIENT did it, a campaign started with no rate agreed against any of it,
 * on a proposal where they had often taken a fraction of the roster.
 *
 * So the yes and the campaign are two decisions now. This is the second one: what we
 * actually pay each creator against what we charge, the margin falling out of it live, and
 * an Open button that stays shut until every number is real. The alternative - opening first
 * and chasing rates afterwards - means asking a creator to agree a fee they have already
 * started working for.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, PlayCircle, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

type Row = {
  id: string
  username?: string | null
  full_name?: string | null
  profile_image_url?: string | null
  sell: number
  quoted_cost: number
  agreed_cost: number | null
  cost_note?: string | null
  settled: boolean
  margin: number | null
}

type State = {
  status: string
  campaign_name?: string
  creators: Row[]
  sell_total: number
  cost_total: number
  margin_total: number
  margin_pct: number | null
  settled: number
  total: number
  unsettled: string[]
  can_open_campaign: boolean
}

const aed = (n?: number | null) =>
  n == null ? '—' : `AED ${Math.round(n).toLocaleString('en-US')}`

export function SettleAndOpen({ proposalId, onDone }: { proposalId: string; onDone: () => void }) {
  const [state, setState] = useState<State | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [opening, setOpening] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/costs`)
      if (!res.ok) return
      const j = await res.json()
      setState(j.data)
      /* Seeded from what is already agreed - never from the quoted cost. Pre-filling the box
         with an assumption invites somebody to tab past it and call it settled. */
      setDraft(Object.fromEntries(
        (j.data.creators as Row[]).map(c => [c.id, c.agreed_cost != null ? String(c.agreed_cost) : '']),
      ))
    } catch { /* the panel simply does not appear */ }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  /* Margin as typed, not as last saved, so the consequence of a number is visible before
     it is committed. */
  const live = useMemo(() => {
    if (!state) return null
    let cost = 0
    let missing = 0
    for (const c of state.creators) {
      const v = parseFloat(draft[c.id] ?? '')
      if (Number.isFinite(v)) cost += v
      else { missing += 1; cost += c.quoted_cost }
    }
    const sell = state.sell_total
    return { cost, missing, margin: sell - cost, pct: sell ? ((sell - cost) / sell) * 100 : null }
  }, [state, draft])

  if (!state || state.status !== 'client_confirmed') return null

  const save = async () => {
    setSaving(true)
    try {
      const costs = state.creators.map(c => ({
        id: c.id,
        amount_aed: draft[c.id]?.trim() === '' ? null : Number(draft[c.id]),
      }))
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/costs`, {
        method: 'POST', body: JSON.stringify({ costs }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not save those costs')
      toast.success(j.message)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const open = async () => {
    setOpening(true)
    try {
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/open-campaign`, {
        method: 'POST', body: JSON.stringify({}),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not open the campaign')
      toast.success(j.message)
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setOpening(false)
    }
  }

  const allTyped = live?.missing === 0

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="size-4 text-emerald-600" />
          The client has confirmed
        </CardTitle>
        <CardDescription>
          {state.total} creator{state.total === 1 ? ' is' : 's are'} booked. No campaign is open
          yet — record what we are paying each of them, then open it.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_110px_130px_110px] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Creator</span>
            <span className="text-right">We charge</span>
            <span className="text-right">We pay</span>
            <span className="text-right">Margin</span>
          </div>
          {state.creators.map(c => {
            const typed = parseFloat(draft[c.id] ?? '')
            const m = Number.isFinite(typed) ? c.sell - typed : null
            return (
              <div key={c.id} className="grid grid-cols-[1fr_110px_130px_110px] items-center gap-2 border-b px-3 py-2.5 last:border-b-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage src={cdnAvatar(c.profile_image_url || undefined)} alt="" />
                    <AvatarFallback>{(c.username || '?')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.username}</p>
                    <p className="text-[11px] text-muted-foreground">
                      quoted {aed(c.quoted_cost)}
                    </p>
                  </div>
                </div>
                <span className="text-right text-sm font-semibold tabular-nums">{aed(c.sell)}</span>
                <Input
                  value={draft[c.id] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [c.id]: e.target.value }))}
                  inputMode="decimal"
                  placeholder="not agreed"
                  className={cn('h-8 text-right tabular-nums',
                    !Number.isFinite(typed) && 'border-amber-500/60')}
                />
                <span className={cn('text-right text-sm font-semibold tabular-nums',
                  m == null ? 'text-muted-foreground' : m < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {m == null ? '—' : aed(m)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wallet className="size-3.5" />Campaign margin
          </span>
          <span className="text-sm font-bold tabular-nums">
            {aed(state.sell_total)} − {aed(live?.cost)} ={' '}
            <span className={cn(live && live.margin < 0 ? 'text-destructive' : 'text-emerald-600')}>
              {aed(live?.margin)}
            </span>
            {live?.pct != null && (
              <span className="ml-2 font-medium text-muted-foreground">{live.pct.toFixed(1)}%</span>
            )}
          </span>
        </div>

        {!allTyped && (
          <p className="text-xs text-muted-foreground">
            {live?.missing} still without an agreed cost — the margin above uses the quoted
            figure for those, and the campaign will not open until they are real.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save costs
          </Button>
          <Button onClick={open} disabled={opening || !state.can_open_campaign}>
            {opening ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PlayCircle className="mr-2 size-4" />}
            Open the campaign
          </Button>
          {!state.can_open_campaign && state.unsettled.length > 0 && (
            <Badge variant="outline" className="self-center text-xs">
              {state.settled} of {state.total} costs saved
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
