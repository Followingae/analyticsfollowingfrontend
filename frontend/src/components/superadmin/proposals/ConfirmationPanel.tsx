'use client'

/**
 * Locking a proposal when the client said yes somewhere else.
 *
 * Clients agree over email, on WhatsApp, in a meeting — far more often than they agree by
 * pressing a button in a platform. Until now that yes had nowhere to go: the proposal stayed
 * at "sent", no campaign opened, and everyone downstream carried on believing the work had
 * not started.
 *
 * This does exactly what their own confirmation does, and records how the yes arrived, so
 * the record never implies a click that never happened — the client's copy says "confirmed
 * on your behalf" rather than pretending.
 *
 * Once it is locked the same card becomes the receipt: who, how, when, and a door into the
 * campaign it opened.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, CalendarCheck, Check, Loader2, Mail, MessageCircle, Phone, Users2, Lock,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { Aed } from '@/components/console/primitives'
import { SettleCosts } from '@/components/superadmin/proposals/SettleCosts'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

const VIA = [
  { key: 'email', label: 'By email', icon: Mail },
  { key: 'whatsapp', label: 'On WhatsApp', icon: MessageCircle },
  { key: 'call', label: 'On a call', icon: Phone },
  { key: 'meeting', label: 'In a meeting', icon: Users2 },
] as const

type Inf = {
  id: string
  username?: string | null
  avatar?: string | null
  profile_image_url?: string | null
  followers_count?: number | null
  selected_by_user?: boolean
  cost_price_snapshot?: Record<string, number> | null
  tier_label?: string | null
}

type State = {
  status: string
  confirmed_at?: string | null
  confirmed_via?: string | null
  confirmed_note?: string | null
  confirmed_by_name?: string | null
  confirmed_by_email?: string | null
  costs_confirmed_at?: string | null
  via_label?: string
  on_behalf?: boolean
  campaign_id?: string | null
  campaign_name?: string | null
  rates_pending?: number
  rates_total?: number
  total_sell_amount?: number | null
  contract_value_aed?: number | null
  total_budget?: number | null
  selection_mode?: string | null
}

const topOf = (m?: Record<string, number> | null) => {
  const vals = Object.values(m || {}).map(Number).filter(n => Number.isFinite(n) && n > 0)
  return vals.length ? Math.max(...vals) : 0
}

const money = (n?: number | null) =>
  n == null ? '—' : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function ConfirmationPanel({
  proposalId, influencers, onConfirmed,
}: {
  proposalId: string
  influencers: Inf[]
  onConfirmed?: () => void
}) {
  const router = useRouter()
  const [state, setState] = useState<State | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [via, setVia] = useState<string>('email')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [costs, setCosts] = useState<Record<string, string>>({})
  const [withCosts, setWithCosts] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/confirmation`)
      const j = await res.json().catch(() => ({}))
      if (res.ok) setState(j.data)
    } catch { /* the panel simply does not appear */ }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  // Their own ticks are the starting point — most of the time the email says "yes, all of
  // them" about a list they already went through.
  useEffect(() => {
    setPicked(Object.fromEntries(influencers.map(i => [i.id, !!i.selected_by_user])))
  }, [influencers])

  if (!state) return null

  const locked = state.status === 'approved'
  const canConfirm = ['sent', 'in_review', 'more_requested'].includes(state.status)
  if (!locked && !canConfirm) return null

  const chosen = influencers.filter(i => picked[i.id])

  const confirm = async () => {
    if (!chosen.length) { toast.error('Choose the creators they confirmed'); return }
    setSaving(true)
    try {
      const body: any = {
        via, note: note.trim() || undefined,
        selected_influencer_ids: chosen.map(i => i.id),
      }
      if (withCosts) {
        body.costs = chosen
          .map(i => ({ id: i.id, amount_aed: Number(costs[i.id]) }))
          .filter(c => Number.isFinite(c.amount_aed) && c.amount_aed > 0)
      }
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/confirm-for-client`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not confirm this proposal')
      toast.success(j.message || 'Confirmed')
      setOpen(false)
      await load()
      onConfirmed?.()
      if (j.data?.rates_pending) {
        toast.info(`${j.data.rates_pending} costs still to confirm on the campaign`)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not confirm this proposal')
    } finally {
      setSaving(false)
    }
  }

  // ── the receipt, and the costs it opens ────────────────────────────────────────────────
  if (locked) {
    const agreed = state.contract_value_aed || state.total_sell_amount || state.total_budget
    return (
      <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-[18px] w-[18px] text-emerald-600" />
                Confirmed
              </CardTitle>
              <CardDescription>
                {state.on_behalf
                  ? `Locked ${state.via_label} by ${state.confirmed_by_name || state.confirmed_by_email || 'the team'}`
                  : 'The client confirmed this themselves'}
                {state.confirmed_at ? ` · ${when(state.confirmed_at)}` : ''}
              </CardDescription>
            </div>
            {state.campaign_id && (
              <Button variant="outline" className="rounded-xl"
                      onClick={() => router.push(`/work/campaigns/${state.campaign_id}/ladder`)}>
                Open the campaign <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.confirmed_note && (
            <p className="rounded-xl bg-background/70 px-3.5 py-2.5 text-[13.5px] text-muted-foreground">
              “{state.confirmed_note}”
            </p>
          )}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">Agreed total</div>
              <div className="text-base font-semibold tabular-nums"><Aed>{money(agreed)}</Aed></div>
            </div>
            {!!state.rates_total && (
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">Costs settled</div>
                <div className="text-base font-semibold tabular-nums">
                  {(state.rates_total || 0) - (state.rates_pending || 0)}/{state.rates_total}
                </div>
              </div>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            The client&apos;s copy now shows the roster and this total only — the per-creator
            prices come off once a proposal is locked.
          </p>
        </CardContent>
      </Card>

      {/* And straight into the thing that has to happen next: what we really pay. */}
      {state.campaign_id && <SettleCosts campaignId={state.campaign_id} onSettled={load} />}
      </div>
    )
  }

  // ── locking it ─────────────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-[18px] w-[18px] text-muted-foreground" />
              Confirm for the client
            </CardTitle>
            <CardDescription>
              They said yes by email or on a call? Lock their selection here and the campaign
              opens exactly as their own confirmation would have opened it.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">Confirm on their behalf</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Confirm on the client's behalf</DialogTitle>
                <DialogDescription>
                  This locks the selection and opens the campaign. It is recorded as confirmed
                  by us, with how they agreed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <Label className="text-[13px]">How did they confirm?</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {VIA.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setVia(v.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[13px] transition-colors',
                          via === v.key ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
                        )}
                      >
                        <v.icon className="h-4 w-4" />
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-note" className="text-[13px]">
                    What did they say? <span className="text-muted-foreground">(optional, but worth pasting)</span>
                  </Label>
                  <Textarea
                    id="confirm-note"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="“Approved — go ahead with all four for September.”"
                    className="mt-2 min-h-[70px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px]">Who they confirmed ({chosen.length})</Label>
                    <Button variant="ghost" size="sm"
                            onClick={() => setPicked(Object.fromEntries(influencers.map(i => [i.id, true])))}>
                      Select all
                    </Button>
                  </div>
                  <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
                    {influencers.map(i => (
                      <label key={i.id}
                             className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
                        <Checkbox checked={!!picked[i.id]}
                                  onCheckedChange={(v: boolean | 'indeterminate') => setPicked(p => ({ ...p, [i.id]: !!v }))} />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={cdnAvatar(i.avatar || i.profile_image_url) || undefined} className="object-cover" />
                          <AvatarFallback className="text-[10px]">
                            {(i.username || '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm">@{i.username}</span>
                        {i.tier_label && (
                          <Badge variant="secondary" className="rounded-full font-normal">{i.tier_label}</Badge>
                        )}
                        {withCosts && picked[i.id] && (
                          <Input
                            inputMode="decimal"
                            value={costs[i.id] ?? ''}
                            placeholder={String(topOf(i.cost_price_snapshot) || '')}
                            onClick={e => e.preventDefault()}
                            onChange={e => setCosts(c => ({ ...c, [i.id]: e.target.value.replace(/[^\d.]/g, '') }))}
                            className="h-8 w-28 text-right tabular-nums"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-muted/50 px-3.5 py-3">
                  <Checkbox checked={withCosts} onCheckedChange={(v: boolean | 'indeterminate') => setWithCosts(!!v)} className="mt-0.5" />
                  <span className="text-[13.5px]">
                    <span className="font-medium">Enter the confirmed costs now</span>
                    <span className="block text-muted-foreground">
                      What we actually pay each creator after negotiating. Skip it and the
                      campaign will ask for them straight after.
                    </span>
                  </span>
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={confirm} disabled={saving} className="rounded-xl">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                  Lock it in
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
    </Card>
  )
}
