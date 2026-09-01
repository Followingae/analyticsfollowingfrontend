'use client'

/**
 * Surface 1 - the plan screen.
 *
 * Three jobs, and it is the only place in the product that does any of them:
 *
 *  1. Every module as a row that is on or off, with what it contains spelled
 *     out and a price on the ones that are off.
 *  2. The single place tier limits are shown. They come from the billing API,
 *     which is what the server actually enforces - not from a static table in
 *     the frontend, because those tables disagreed with the server (one said
 *     350 profile unlocks on Standard, the pricing page said 500).
 *  3. The usage meter and top-ups. Top-ups are sold as unlocks, with the
 *     credit figure underneath.
 *
 * Every number on this screen either came from a request or from
 * src/config/planPricing.ts. A request that did not answer renders an em-dash.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui2/item'
import { AlertCircle, Users, Unlock, Coins, Building2 } from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { MODULE_ORDER } from '@/config/modules'
import {
  CREDITS_PER_UNLOCK,
  UNLOCK_ACTION_TYPES,
  formatPlanPrice,
  getSeatAmount,
  getBillingCurrency,
} from '@/config/planPricing'
import { useCommercialAccount, fmtCount } from '@/hooks/useCommercialAccount'
import { ModuleRow } from './ModuleRow'

// ── Live shapes ──────────────────────────────────────────────────────────────

interface PricingRule {
  action_type: string
  display_name: string
  cost_per_action: number
  is_active?: boolean
}

interface TopupPackage {
  type: string
  credits: number
  base_price: number
  discounted_price: number
  discount_percentage: number
}

type FetchState = 'loading' | 'loaded' | 'failed'

// ── Screen ───────────────────────────────────────────────────────────────────

export function PlanScreen() {
  const account = useCommercialAccount()

  const [rulesState, setRulesState] = useState<FetchState>('loading')
  const [rules, setRules] = useState<PricingRule[]>([])
  const [topupState, setTopupState] = useState<FetchState>('loading')
  const [topups, setTopups] = useState<TopupPackage[]>([])

  useEffect(() => {
    let cancelled = false

    const loadRules = async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.pricing}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('pricing rules unavailable')
        const data = await res.json()
        if (cancelled) return
        const list: PricingRule[] = Array.isArray(data) ? data : data?.rules ?? []
        setRules(list.filter((r) => r.is_active !== false))
        setRulesState('loaded')
      } catch {
        if (!cancelled) setRulesState('failed')
      }
    }

    const loadTopups = async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.topupOptions}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('topup options unavailable')
        const data = await res.json()
        if (cancelled) return
        setTopups(Array.isArray(data?.packages) ? data.packages : [])
        setTopupState('loaded')
      } catch {
        if (!cancelled) setTopupState('failed')
      }
    }

    loadRules()
    loadTopups()
    return () => {
      cancelled = true
    }
  }, [])

  // Credits per unlock: live if the server told us, otherwise the decided
  // figure from the pricing config. Never invented here.
  const unlockRule = rules.find((r) => UNLOCK_ACTION_TYPES.includes(r.action_type))
  const creditsPerUnlock = unlockRule?.cost_per_action ?? CREDITS_PER_UNLOCK

  if (account.state === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[160px]" />
        <Skeleton className="h-[320px]" />
      </div>
    )
  }

  if (account.state === 'failed') {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">We could not load your plan</p>
          <p className="text-ds-body-sm text-muted-foreground">
            Nothing here is guessed at, so we would rather show you nothing than the wrong plan.
          </p>
          <Button variant="outline" onClick={account.refresh}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const plan = account.status?.plan
  const usage = account.status?.usage
  const credits = account.status?.credits
  const currency = plan?.currency || getBillingCurrency()
  const managed = account.isManaged

  return (
    <div className="space-y-6">
      {/* ── Your plan ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your plan
            {managed && (
              <Badge variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                Managed
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {managed
              ? 'We bill this account directly. Nothing on this screen takes a card.'
              : 'What you pay for, and the limits that come with it.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-ds-title capitalize">{plan?.tier ?? '—'}</span>
            {!managed && (
              <span className="text-ds-body text-muted-foreground">
                {typeof plan?.price_per_month === 'number'
                  ? `${formatPlanPrice(plan.price_per_month, currency)}/month`
                  : '—'}
              </span>
            )}
          </div>

          <Separator />

          {/* The one place tier limits are shown. */}
          <div className="grid gap-6 sm:grid-cols-3">
            <LimitStat
              icon={Users}
              label="Seats"
              value={fmtCount(plan?.max_team_members)}
              note={
                managed
                  ? 'Extra seats are on your quote'
                  : `Extra seats ${formatPlanPrice(getSeatAmount(), currency)}/month each`
              }
            />
            <LimitStat
              icon={Unlock}
              label="Profile unlocks / month"
              value={fmtCount(plan?.monthly_profile_limit)}
              note={
                usage
                  ? `${fmtCount(usage.profiles_used)} used this cycle`
                  : 'Usage unavailable right now'
              }
            />
            <LimitStat
              icon={Coins}
              label="Credits / month"
              value={fmtCount(plan?.monthly_credits)}
              note={
                credits
                  ? `${fmtCount(credits.current_balance)} in your wallet`
                  : 'Balance unavailable right now'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Modules ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            {managed
              ? 'Ask your account manager for anything that is off.'
              : 'On or off. Buy one when you need it, cancel it on its own.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-3">
            {MODULE_ORDER.map((key) => (
              <ModuleRow
                key={key}
                module={key}
                owned={account.owns[key]}
                managed={managed}
                accountEmail={account.status?.user?.email}
              />
            ))}
          </ItemGroup>
        </CardContent>
      </Card>

      {/* ── The meter ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>What things cost</CardTitle>
          <CardDescription>Credits are the only usage meter.</CardDescription>
        </CardHeader>
        <CardContent>
          {rulesState === 'loading' && <Skeleton className="h-24" />}

          {rulesState === 'failed' && (
            <p className="text-ds-body-sm text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              We could not load the credit costs. Rather than show you a number the server did
              not confirm, they are left blank - reload to try again.
            </p>
          )}

          {rulesState === 'loaded' && rules.length === 0 && (
            <p className="text-ds-body-sm text-muted-foreground">
              No credit costs are configured on this account.
            </p>
          )}

          {rulesState === 'loaded' && rules.length > 0 && (
            <ul className="divide-y">
              {rules.map((rule) => (
                <li key={rule.action_type} className="flex items-center justify-between py-2.5">
                  <span className="text-ds-body-sm">{rule.display_name}</span>
                  <span className="text-ds-body-sm font-medium">
                    {fmtCount(rule.cost_per_action)} credits
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Top-ups, sold as unlocks ──────────────────────────────────── */}
      {!managed && (
        <Card>
          <CardHeader>
            <CardTitle>Need more unlocks</CardTitle>
            <CardDescription>
              Bought as unlocks, not credits - one unlock is {fmtCount(creditsPerUnlock)} credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topupState === 'loading' && <Skeleton className="h-24" />}

            {topupState === 'failed' && (
              <p className="text-ds-body-sm text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                We could not load top-up prices, and we are not going to quote one we have not
                confirmed.
              </p>
            )}

            {topupState === 'loaded' && topups.length === 0 && (
              <p className="text-ds-body-sm text-muted-foreground">
                No top-up packs are available on this account.
              </p>
            )}

            {topupState === 'loaded' && topups.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {topups.map((pack) => {
                  const unlocks = creditsPerUnlock > 0 ? Math.floor(pack.credits / creditsPerUnlock) : null
                  return (
                    <div key={pack.type} className="rounded-ds-surface border p-4">
                      <p className="text-ds-heading">
                        {unlocks === null ? '—' : `${fmtCount(unlocks)} more unlocks`}
                      </p>
                      <p className="text-ds-caption text-muted-foreground mt-0.5">
                        {fmtCount(pack.credits)} credits
                      </p>
                      <p className="text-ds-body-sm font-medium mt-3">
                        {typeof pack.discounted_price === 'number'
                          ? formatPlanPrice(pack.discounted_price, currency)
                          : '—'}
                      </p>
                      {pack.discount_percentage > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {pack.discount_percentage}% off
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LimitStat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ElementType
  label: string
  value: string
  note: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-ds-label">{label}</span>
      </div>
      <p className="text-ds-heading">{value}</p>
      <p className="text-ds-caption text-muted-foreground">{note}</p>
    </div>
  )
}
