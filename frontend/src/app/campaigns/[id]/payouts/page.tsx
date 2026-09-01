'use client'

/**
 * Merchant of Record — the client's status view for one campaign.
 *
 * Who is owed, how much, and where each payout has got to: awaiting funds, approved, in a
 * transfer file, paid, with the date and bank reference once our team marks it. Read-only.
 *
 * There is no cost and no margin on this page and there cannot be: the backend resolves
 * the caller's field_policy scope and scrubs the payload before it leaves. The per-creator
 * amount shown is the client's own money on its way to a named person, which is the
 * entire point of the screen.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Info } from 'lucide-react'
import {
  formatAed,
  morApi,
  PAYOUT_STATE_ORDER,
  PAYOUT_STATE_TITLES,
  type MorCampaignPayouts,
  type PayoutState,
} from '@/services/morApi'

const STATE_STYLES: Record<PayoutState, string> = {
  awaiting_approval: 'bg-muted text-muted-foreground',
  awaiting_funds: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  approved: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  in_transfer_file: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
}

export default function CampaignPayoutsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <PayoutsContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function PayoutsContent() {
  const params = useParams()
  const campaignId = String(params?.id || '')
  const [data, setData] = useState<MorCampaignPayouts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    morApi
      .campaignPayouts(campaignId)
      .then((r) => {
        if (!cancelled) setData(r.data)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return null

  const shortfall = data.totals.shortfall_aed || 0

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/campaigns/${campaignId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {data.campaign_name}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Creator payouts</h1>
        <p className="text-muted-foreground max-w-2xl">
          We pay each creator on your behalf. Nothing is released before your payment for it
          has cleared.
        </p>
      </div>

      {!data.settlement_enabled && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Merchant of Record is not switched on for this campaign, so no payouts are being
            settled through us here.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total payouts" value={formatAed(data.totals.payouts_total_aed)} />
        <Stat label="Paid" value={formatAed(data.totals.paid_aed)} />
        <Stat label="Still to pay" value={formatAed(data.totals.outstanding_aed)} />
        <Stat label="You have funded" value={formatAed(data.totals.funded_aed)} />
      </div>

      {shortfall > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {formatAed(shortfall)} of the payouts below are waiting on your payment to us.
            They are released as soon as it clears.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {PAYOUT_STATE_ORDER.filter((s) => data.by_state[s]).map((s) => (
          <Badge key={s} variant="outline" className="gap-2 py-1">
            <span className={`rounded px-1.5 py-0.5 text-xs ${STATE_STYLES[s]}`}>
              {PAYOUT_STATE_TITLES[s]}
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {data.by_state[s].count} · {formatAed(data.by_state[s].amount_aed)}
            </span>
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Every payout</CardTitle>
        </CardHeader>
        <CardContent>
          {data.payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payouts on this campaign yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Where it is</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payouts.map((p) => (
                  <TableRow key={p.payout_id}>
                    <TableCell className="font-medium">
                      {p.creator_username ? `@${p.creator_username}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.what_for || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAed(p.amount_aed)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${STATE_STYLES[p.state]}`}
                        title={p.state_label}
                      >
                        {PAYOUT_STATE_TITLES[p.state]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : p.expected_value_date
                          ? `Value ${p.expected_value_date}`
                          : p.due_date
                            ? `Due ${p.due_date}`
                            : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.payment_reference || p.transfer_run || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
