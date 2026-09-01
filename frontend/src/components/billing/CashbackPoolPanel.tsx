'use client'

/**
 * The cashback pool, lifted out of /billing/page.tsx unchanged in behaviour.
 *
 * Two things were fixed on the way across:
 *
 *   Money was printed as a bare Dirham glyph and a number, in a page where
 *   every other amount goes through the shared `money()` renderer. It now uses
 *   that one, so a pool balance and an invoice total are written the same way.
 *
 *   A failed load rendered as an empty pool: four zeros and "No transactions
 *   yet. Top up your pool to get started." to a client whose pool may hold
 *   thousands. Failure is now its own state and says so.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Lock,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { PremiumFeatureGate } from '@/components/ui/premium-feature-gate'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { brandPoolApi } from '@/services/faAdminApi'
import { money } from './useAccountInvoices'
import { NO_FIGURE } from './PlanSummaryCard'

type Load = 'loading' | 'loaded' | 'failed'

const aed = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? NO_FIGURE : money(cents / 100, 'AED')

export function CashbackPoolPanel() {
  const { hasRole } = useEnhancedAuth()
  const isFreeTier = hasRole('brand_free')

  const [load, setLoad] = useState<Load>('loading')
  const [balance, setBalance] = useState<Record<string, number> | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    if (isFreeTier) {
      setLoad('loaded')
      return
    }
    let cancelled = false

    const run = async () => {
      try {
        const [b, t, c] = await Promise.all([
          brandPoolApi.balance(),
          brandPoolApi.transactions(10, 0),
          brandPoolApi.campaigns(),
        ])
        if (cancelled) return
        const balancePayload = b?.data ?? b
        const txPayload = t?.data ?? t
        const campaignsPayload = c?.data ?? c
        if (balancePayload && typeof balancePayload === 'object') setBalance(balancePayload)
        setTransactions(Array.isArray(txPayload) ? txPayload : (txPayload?.transactions ?? []))
        setCampaigns(
          Array.isArray(campaignsPayload) ? campaignsPayload : (campaignsPayload?.campaigns ?? [])
        )
        setLoad('loaded')
      } catch {
        if (!cancelled) setLoad('failed')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isFreeTier])

  if (isFreeTier) {
    return (
      <PremiumFeatureGate
        featureName="Cashback Pool"
        headline="Influencer Cashback Pool"
        description="Fund a cashback pool to power influencer campaigns. Influencers earn commission on every purchase they drive through your brand."
        requiredTier="Standard"
        highlights={[
          {
            icon: Wallet,
            title: 'AED cashback wallet',
            description:
              'Top up your pool in AED and allocate funds across multiple influencer campaigns simultaneously.',
          },
          {
            icon: TrendingUp,
            title: 'Real time tracking',
            description:
              'Monitor available balance, reserved funds, and distributed payouts with live transaction history.',
          },
          {
            icon: PiggyBank,
            title: 'Campaign funding',
            description:
              'Automatically reserve and distribute funds as influencers complete deliverables and drive conversions.',
          },
        ]}
      />
    )
  }

  if (load === 'loading') {
    return (
      <div className="space-y-ds-3">
        <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (load === 'failed') {
    return (
      <Card>
        <CardContent className="space-y-ds-2 py-ds-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-ds-body font-medium">We could not load your pool</p>
          <p className="text-ds-body-sm text-muted-foreground">
            Your balance is unchanged. We would rather show you nothing than a figure we have not
            confirmed.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const stats: Array<[string, number | null | undefined, React.ElementType]> = [
    ['Available', balance?.available_cents, Wallet],
    ['Reserved', balance?.reserved_cents, Lock],
    ['Distributed', balance?.distributed_cents, TrendingUp],
    ['Total funded', balance?.total_funded_cents, PiggyBank],
  ]

  return (
    <div className="space-y-ds-3">
      <div className="flex flex-wrap items-center justify-between gap-ds-2">
        <p className="text-ds-body-sm text-muted-foreground">
          Your AED pool for influencer campaigns.
        </p>
        <div className="flex gap-ds-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cashback-pool/transactions">
              <History className="mr-ds-1 h-4 w-4" />
              All transactions
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/cashback-pool/topup">
              <Plus className="mr-ds-1 h-4 w-4" />
              Top up
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label}>
            <CardContent className="space-y-ds-1 p-ds-3">
              <div className="flex items-center justify-between">
                <p className="text-ds-overline uppercase text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-ds-heading tabular-nums">{aed(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-ds-subheading">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between gap-ds-3 py-ds-2">
                <div className="flex min-w-0 items-center gap-ds-2">
                  {t.amount_cents > 0 ? (
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-ds-body-sm">{t.description || t.type}</p>
                    <p className="text-ds-caption text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-ds-body-sm font-medium tabular-nums">
                  {t.amount_cents > 0 ? '+' : ''}
                  {aed(t.amount_cents)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {campaigns.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-ds-subheading">Funded campaigns</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {campaigns.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-ds-3 py-ds-2">
                <p className="truncate text-ds-body-sm">{c.name}</p>
                <Badge variant="outline">{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
