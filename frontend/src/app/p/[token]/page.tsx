'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, CheckCircle2, FileText, CreditCard, Sparkles } from 'lucide-react'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

export default function PublicProposalPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch(`${PUBLIC}/${token}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(e.detail || 'Unable to load proposal')
      }
      setData((await res.json()).data)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  const acceptAgreement = async () => {
    setAccepting(true)
    try {
      const res = await fetch(`${PUBLIC}/${token}/accept-agreement`, { method: 'POST' })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed') }
      await load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setAccepting(false) }
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>
  if (err) return <div className="min-h-screen grid place-items-center text-destructive">{err}</div>
  if (!data) return null

  const { proposal, gate, agreement, advance_invoice, influencers } = data

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2"><Sparkles className="mr-1 h-3 w-3" />Proposal</Badge>
          <h1 className="text-3xl font-bold">{proposal.campaign_name || proposal.title}</h1>
          {proposal.description && <p className="text-muted-foreground max-w-2xl mx-auto">{proposal.description}</p>}
          {proposal.total != null && (
            <p className="text-lg font-semibold pt-2">AED {Number(proposal.total).toLocaleString('en-AE')}</p>
          )}
        </div>

        {/* Gate */}
        {!gate.unlocked && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" />Unlock the full influencer list</div>
              <p className="text-sm text-muted-foreground">
                You're previewing {gate.shown} of {gate.total_influencers} influencers. To see the full list, please accept the agreement and clear the advance invoice.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Agreement */}
                <div className="rounded-lg border bg-background p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Agreement</div>
                  {agreement?.file_url && <a href={agreement.file_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View agreement</a>}
                  {gate.agreement_signed ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Signed</Badge>
                  ) : agreement?.accepted_at ? (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Accepted — awaiting countersign</Badge>
                  ) : agreement ? (
                    <Button size="sm" disabled={accepting} onClick={acceptAgreement}>Accept agreement</Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Agreement not yet available</p>
                  )}
                </div>
                {/* Advance invoice */}
                <div className="rounded-lg border bg-background p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4" />Advance invoice</div>
                  {advance_invoice ? (
                    <>
                      {advance_invoice.amount_aed != null && <p className="text-sm">AED {Number(advance_invoice.amount_aed).toLocaleString('en-AE')}{advance_invoice.payment_terms ? ` · ${advance_invoice.payment_terms}` : ''}</p>}
                      {gate.advance_paid ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Paid</Badge>
                      ) : advance_invoice.payment_link_url ? (
                        <a href={advance_invoice.payment_link_url} target="_blank" rel="noreferrer"><Button size="sm">Pay advance</Button></a>
                      ) : (
                        <p className="text-xs text-muted-foreground">Payment link coming soon</p>
                      )}
                    </>
                  ) : <p className="text-xs text-muted-foreground">Invoice not yet available</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gate.unlocked && (
          <div className="text-center"><Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Full list unlocked</Badge></div>
        )}

        {/* Influencers */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf: any) => (
            inf.locked ? (
              <Card key={inf.id} className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="select-none blur-sm pointer-events-none">
                    <div className="h-4 w-32 rounded bg-muted mb-2" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                  <div className="absolute inset-0 grid place-items-center bg-background/40">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={inf.id}>
                <CardContent className="p-5 space-y-1">
                  <div className="font-semibold">@{inf.username || '—'}</div>
                  {inf.full_name && <div className="text-sm text-muted-foreground">{inf.full_name}</div>}
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="text-muted-foreground">{inf.followers_count ? `${Number(inf.followers_count).toLocaleString()} followers` : ''}</span>
                    {inf.sell_price != null && <span className="font-medium">AED {Number(inf.sell_price).toLocaleString('en-AE')}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
