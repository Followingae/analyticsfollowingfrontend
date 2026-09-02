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
 *  3. The usage meter and top-ups.
 *
 * Unlocks. On a paid tier the plan includes a number and the wallet is the only
 * thing that limits the rest: there is no ceiling to run into, so a top-up buys
 * unlocks outright. Free keeps a real cap of 5 and this screen says so as the
 * reason to upgrade rather than as a refusal.
 *
 * Read the fields carefully. plan.monthly_profile_limit is the INCLUDED
 * allowance now, not the cap; the ceiling is usage.profiles_limit, where null
 * means there is none, with usage.profiles_unlimited to tell that apart from a
 * value that failed to load. See app/core/plans.py.
 *
 * There is no seat price anywhere on this screen. teams.max_team_members is a
 * hard cap and the backend has no seat product, no price and no endpoint that
 * sells one. The old copy quoted extra seats at AED 180 a month.
 *
 * Every number on this screen either came from a request or from
 * src/config/planPricing.ts. A request that did not answer renders a dash.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui2/item'
import { AlertCircle, Users, Unlock, Coins, Building2, Image } from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { MODULE_ORDER } from '@/config/modules'
import {
  CREDITS_PER_UNLOCK,
  NO_PRICE,
  UNLOCK_ACTION_TYPES,
  formatPlanPrice,
  postsAllowanceLabel,
  resolveCurrency,
  unlockAllowanceNote,
  unlockGates,
  unlockSentence,
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
      <div className="flex flex-col gap-ds-4">
        <Skeleton className="h-[160px]" />
        <Skeleton className="h-[320px]" />
      </div>
    )
  }

  if (account.state === 'failed') {
    return (
      <Card>
        <CardContent className="py-10 text-center flex flex-col items-center gap-ds-2">
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
  const currency = resolveCurrency(plan?.currency)
  const managed = account.isManaged

  // What this account may unlock. The included figure comes from the plan block;
  // the ceiling, and whether there is one at all, comes from the USAGE block,
  // because plan.monthly_profile_limit is the included allowance now and not a
  // cap. See the note on unlockGates.
  const gates = unlockGates({
    includedUnlocks: plan?.included_profile_unlocks,
    monthlyCredits: plan?.monthly_credits,
    profilesLimit: usage?.profiles_limit,
    profilesUnlimited: usage?.profiles_unlimited,
    creditsPerUnlock,
  })

  return (
    <div className="flex flex-col gap-ds-4">
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
        <CardContent className="flex flex-col gap-ds-4">
          <div className="flex flex-wrap items-baseline gap-ds-3">
            <span className="text-ds-title capitalize">{plan?.tier ?? NO_PRICE}</span>
            {!managed && (
              <span className="text-ds-body text-muted-foreground">
                {typeof plan?.price_per_month === 'number'
                  ? `${formatPlanPrice(plan.price_per_month, currency)}/month`
                  : NO_PRICE}
              </span>
            )}
          </div>

          <Separator />

          {/* The one place tier limits are shown. */}
          <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
            <LimitStat
              icon={Users}
              label="Seats"
              value={fmtCount(plan?.max_team_members)}
              // No seat price. `teams.max_team_members` is a hard cap resolved
              // by app/core/plans.py seat_cap_for_row, and there is no seat
              // product, no Stripe price and no endpoint that sells one
              // anywhere in the backend.
              note={
                managed
                  ? 'Extra seats are on your quote'
                  : 'Fixed by the plan, not bought separately'
              }
            />
            <LimitStat
              icon={Unlock}
              label="Profile unlocks / month"
              // The INCLUDED figure leads, because it is the one the plan pays
              // for. The cap is the sentence underneath.
              value={fmtCount(gates.included)}
              note={unlockAllowanceNote(gates, creditsPerUnlock) || 'Included with your plan'}
            />
            <LimitStat
              icon={Image}
              label="Post analyses / month"
              value={postsAllowanceLabel(plan?.monthly_posts_limit)}
              note={
                usage
                  ? `${fmtCount(usage.posts_used)} used this cycle`
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

          {/* What actually limits an unlock. On a paid tier that is the wallet
              and nothing else, so this is one sentence rather than two gates. */}
          <p className="text-ds-body-sm text-muted-foreground max-w-prose">
            {unlockSentence(gates, creditsPerUnlock)}
            {gates.unlimited
              ? ' Your credit balance is the only thing that limits it.'
              : ''}
            {usage ? ` ${fmtCount(usage.profiles_used)} used this cycle.` : ''}
          </p>
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
          <ItemGroup className="gap-ds-3">
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
            <p className="text-ds-body-sm text-muted-foreground flex items-start gap-ds-2 max-w-prose">
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
              {/* On a paid tier a top-up buys unlocks outright: there is no
                  ceiling to run into. On Free there is one, and the honest
                  answer is the upgrade rather than a pack. */}
              {gates.unlimited
                ? `Bought as unlocks, not credits: one unlock is ${fmtCount(creditsPerUnlock)} credits, and there is no monthly ceiling on how many you can add.`
                : `One unlock is ${fmtCount(creditsPerUnlock)} credits. Free includes ${fmtCount(gates.included)} a month; a paid plan lifts the limit and lets you buy as many as you need.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topupState === 'loading' && <Skeleton className="h-24" />}

            {topupState === 'failed' && (
              <p className="text-ds-body-sm text-muted-foreground flex items-start gap-ds-2 max-w-prose">
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
              <div className="grid gap-ds-3 sm:grid-cols-3">
                {topups.map((pack) => {
                  // No clamp. There is no ceiling to clamp against on a paid
                  // tier, and clamping would advertise fewer unlocks than the
                  // pack actually buys, which is the same lie the old cap copy
                  // told in the other direction.
                  const unlocks = creditsPerUnlock > 0 ? Math.floor(pack.credits / creditsPerUnlock) : null
                  return (
                    <div key={pack.type} className="rounded-ds-surface border p-ds-3">
                      <p className="text-ds-heading">
                        {unlocks === null ? NO_PRICE : `${fmtCount(unlocks)} more unlocks`}
                      </p>
                      <p className="text-ds-caption text-muted-foreground mt-0.5">
                        {fmtCount(pack.credits)} credits
                      </p>
                      <p className="text-ds-body-sm font-medium mt-ds-3">
                        {typeof pack.discounted_price === 'number'
                          ? formatPlanPrice(pack.discounted_price, currency)
                          : NO_PRICE}
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
    <div className="flex flex-col gap-ds-1">
      <div className="flex items-center gap-ds-1 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-ds-label">{label}</span>
      </div>
      <p className="text-ds-heading">{value}</p>
      <p className="text-ds-caption text-muted-foreground">{note}</p>
    </div>
  )
}
