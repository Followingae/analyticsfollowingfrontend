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
import { Card, CardContent } from '@/components/ui/card'
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
  /* No pool yet is its own state, not four zeros: the brand has never funded one. */
  const [noPool, setNoPool] = useState(false)

  useEffect(() => {
    if (isFreeTier) {
      setLoad('loaded')
      return
    }
    let cancelled = false

    const run = async () => {
      try {
        // Balance first: it is the only call that answers for an account with no pool.
        // Transactions and campaigns 404 when there is none, which is not a failure.
        const b = await brandPoolApi.balance()
        if (cancelled) return
        const balancePayload = b?.data ?? b
        if (balancePayload && typeof balancePayload === 'object') setBalance(balancePayload)
        if (!balancePayload?.pool_id) {
          setNoPool(true)
          setLoad('loaded')
          return
        }
        const [t, c] = await Promise.all([
          brandPoolApi.transactions(10, 0).catch(() => null),
          brandPoolApi.campaigns().catch(() => null),
        ])
        if (cancelled) return
        const txPayload = t?.data ?? t
        const campaignsPayload = c?.data ?? c
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

  /* Never funded. Say what the pool is for and how to start, once, with one button. */
  if (noPool) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-black/[0.06] bg-white px-8 py-16 text-center
                      dark:border-white/[0.08] dark:bg-white/[0.03]">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#d3ff02] text-[#111]">
          <PiggyBank className="size-6" strokeWidth={1.75} />
        </span>
        <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.01em]">Fund your cashback pool</h3>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
          Creators earn cashback on what they buy and post about. Top up once and every app
          campaign draws from the same pool.
        </p>
        <Button asChild className="mt-8 gap-1.5 rounded-full">
          <Link href="/cashback-pool/topup"><Plus className="size-4" />Top up</Link>
        </Button>
      </div>
    )
  }

  const stats: Array<[string, number | null | undefined, React.ElementType]> = [
    ['Available', balance?.available_cents, Wallet],
    ['Reserved', balance?.reserved_cents, Lock],
    ['Paid out', balance?.distributed_cents, TrendingUp],
    ['Total funded', balance?.total_funded_cents, PiggyBank],
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Button variant="outline" asChild className="gap-1.5 rounded-full">
          <Link href="/cashback-pool/transactions"><History className="size-4" />All transactions</Link>
        </Button>
        <Button asChild className="gap-1.5 rounded-full">
          <Link href="/cashback-pool/topup"><Plus className="size-4" />Top up</Link>
        </Button>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06]
                      sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.08] dark:bg-white/[0.08]">
        {stats.map(([label, value, Icon]) => (
          <div key={label} className="bg-white px-7 py-6 dark:bg-[#0b0b0d]">
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Icon className="size-4" strokeWidth={1.75} />{label}
            </p>
            <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
              {aed(value)}
            </p>
          </div>
        ))}
      </div>

      {transactions.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[15px] font-medium">Recent movements</h2>
          <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white
                          dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-white/[0.03]">
            {transactions.map((t: any) => {
              const inflow = t.amount_cents > 0
              return (
                <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={inflow
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700'
                      : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'}>
                      {inflow ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px]">{t.description || t.type}</p>
                      <p className="text-[12.5px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[15px] font-medium tabular-nums">
                    {inflow ? '+' : ''}{aed(t.amount_cents)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {campaigns.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[15px] font-medium">Campaigns drawing from it</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06]
                                         bg-white px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <p className="truncate text-[15px] font-medium">{c.name}</p>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[12px] capitalize text-muted-foreground">
                  {String(c.status || '').replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
