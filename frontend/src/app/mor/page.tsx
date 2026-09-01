'use client'

/**
 * Merchant of Record — the plan screen for it.
 *
 * The whole price is on this page before anyone commits: the monthly fee AND the
 * percentage of payouts, in the same words the invoice will use. A Manage client sees why
 * they are not charged for it rather than a buy button they should not press.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { ArrowRight, BadgeCheck, Banknote, Info, Landmark, ShieldCheck } from 'lucide-react'
import { morApi, type MorOffer } from '@/services/morApi'

export default function MorPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <MorContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function MorContent() {
  const [offer, setOffer] = useState<MorOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    let cancelled = false
    morApi
      .offer()
      .then((r) => {
        if (!cancelled) setOffer(r.data)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const buy = async () => {
    setBuying(true)
    try {
      const origin = window.location.origin
      const r = await morApi.subscribe(`${origin}/mor?welcome=1`, `${origin}/mor`)
      window.location.href = r.data.checkout_url
    } catch (e: any) {
      toast.error(e.message)
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!offer) return null

  const { fees } = offer

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{offer.label}</h1>
          {offer.active && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5" /> On
            </Badge>
          )}
          {fees.included_in_manage && <Badge variant="outline">Included in Manage</Badge>}
        </div>
        <p className="text-muted-foreground max-w-2xl">{offer.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {offer.how_it_works.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What it costs</CardTitle>
          <CardDescription>{fees.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Banknote className="h-3.5 w-3.5" /> Monthly module fee
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {fees.included_in_manage
                  ? 'Included'
                  : `AED ${Number(fees.monthly_fee_aed).toLocaleString('en-AE')}`}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Charged while the module is switched on, whether or not a payout runs.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Of every payout we settle
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {fees.included_in_manage ? 'Included' : `${fees.settlement_fee_pct}%`}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Fixed onto each campaign when it is awarded, so a later change to our rate
                never reprices work that is already running.
              </p>
            </div>
          </div>

          {fees.included_in_manage && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are on Manage, and the {fees.management_service_charge_pct}% management
                service charge already covers us paying your creators. You are not charged
                for this a second time.
              </AlertDescription>
            </Alert>
          )}

          {fees.prices_are_provisional && !fees.included_in_manage && (
            <p className="text-xs text-muted-foreground">
              These rates are indicative until confirmed on your agreement.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap items-center gap-3">
        {offer.can_buy && (
          <Button onClick={buy} disabled={buying}>
            {buying ? 'Opening checkout…' : 'Switch it on'}
          </Button>
        )}
        <Button variant={offer.can_buy ? 'outline' : 'default'} asChild>
          <Link href="/mor/payees">
            <Landmark className="mr-2 h-4 w-4" />
            Payee bank details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
