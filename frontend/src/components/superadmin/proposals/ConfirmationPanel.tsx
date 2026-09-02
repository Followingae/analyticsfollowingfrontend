'use client'

/**
 * Where a proposal stands on the question of whether the client has said yes.
 *
 * Before: a way through to the confirming page, which is where the roster is read line by
 * line and the costs are settled. Clients agree by email, on WhatsApp, in a meeting far more
 * often than they agree by pressing a button, and that yes needs somewhere to go — otherwise
 * the proposal sits at "sent" while the work has already begun.
 *
 * After: the receipt. Who confirmed it, how, when, the agreed total, and the costs behind it.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Aed } from '@/components/console/primitives'
import { SettleCosts } from '@/components/superadmin/proposals/SettleCosts'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

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
  /** What they actually agreed: the roster they took, worked out server-side. */
  agreed_total_aed?: number | null
  selection_mode?: string | null
}

const money = (n?: number | null) =>
  n == null ? '—' : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function ConfirmationPanel({ proposalId }: { proposalId: string }) {
  const router = useRouter()
  const [state, setState] = useState<State | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/proposals/${proposalId}/confirmation`)
      const j = await res.json().catch(() => ({}))
      if (res.ok) setState(j.data)
    } catch { /* the panel simply does not appear */ }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  if (!state) return null

  const locked = state.status === 'approved'
  const canConfirm = ['sent', 'in_review', 'more_requested'].includes(state.status)
  if (!locked && !canConfirm) return null

  // ── the receipt, and the costs it opens ────────────────────────────────────────────────
  if (locked) {
    // Read, not derived. This used to fall back to total_sell_amount — the sum of every
    // creator we quoted — so a proposal where they took 15 of 124 showed half a million
    // dirhams of things nobody bought as the agreed figure.
    const agreed = state.agreed_total_aed
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
              {!!state.rates_total && (
                <div className="text-[12px] text-muted-foreground">
                  {state.rates_total} creator{state.rates_total === 1 ? "" : "s"} confirmed
                </div>
              )}
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
            The client&apos;s copy now shows the roster and this total only. The per-creator
            prices come off once a proposal is locked.
          </p>
        </CardContent>
      </Card>

      {/* And straight into the thing that has to happen next: what we really pay. */}
      {state.campaign_id && <SettleCosts campaignId={state.campaign_id} onSettled={load} />}
      </div>
    )
  }

  // ── locking it ────────────────────────────────────────────────────────────────────────
  // The doing happens on its own page. It is a roster to read line by line and a cost to
  // settle per creator while the negotiation is still fresh — decisions that do not belong
  // in a box floating over the thing they are about.
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-[18px] w-[18px] text-muted-foreground" />
              Confirm for the client
            </CardTitle>
            <CardDescription>
              They said yes by email or on a call? Lock their selection and the campaign opens
              exactly as their own confirmation would have opened it.
            </CardDescription>
          </div>
          <Button className="rounded-xl" onClick={() => router.push(`/superadmin/proposals/${proposalId}/confirm`)}>
            Confirm on their behalf <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
