'use client'

/**
 * What the plan has actually been used for this cycle, and what is left.
 *
 * Two figures only, because two are what the plan enforces: profile unlocks and
 * post analyses. The credit wallet sits underneath them, since credits are the
 * meter both are spent through.
 *
 * A limit of zero is not a bar at 0%, and it does not mean the same thing for
 * both figures. For unlocks it means the plan includes none. For post analyses
 * it means NOT METERED (app/core/plans.py posts_limit_for_row), which is why
 * Meter takes the sentence rather than assuming one.
 *
 * Unlocks have TWO limits, not one. The bar runs against the count cap, which
 * is the number that refuses an unlock; the caption says what the plan funds,
 * which is credits divided by 25. Topping up moves the second and never the
 * first, so on Free and Standard, where the two are the same number, a top up
 * buys no unlocks at all and this panel says so rather than selling one.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import type { BillingStatus } from '@/services/billingManager'
import {
  CREDITS_PER_UNLOCK,
  formatPlanPrice,
  resolveCurrency,
  unlockGates,
  UNLOCK_ACTION_TYPES,
} from '@/config/planPricing'
import { NO_FIGURE } from './PlanSummaryCard'

interface TopupPackage {
  type: string
  credits: number
  discounted_price: number
  discount_percentage: number
}

interface PricingRule {
  action_type: string
  cost_per_action: number
  is_active?: boolean
}

/**
 * A used-of-limit bar, with a caption under it.
 *
 * `zeroMeans` matters. A zero limit is not one thing. For post analyses it means
 * NOT METERED: app/core/plans.py posts_limit_for_row returns 0 for an account
 * whose row was never given a real number, and app/api/post_analytics_routes.py
 * does not meter those accounts at all, so rendering "not included on this
 * plan" would tell a paying customer they have none of something they have
 * been using freely.
 */
function Meter({
  used,
  limit,
  label,
  note,
  zeroMeans = 'Not included on this plan',
}: {
  used: number
  limit: number
  label: string
  note?: string
  zeroMeans?: string
}) {
  if (!limit || limit <= 0) {
    return (
      <div className="space-y-ds-1">
        <p className="text-ds-body-sm">{label}</p>
        <p className="text-ds-caption text-muted-foreground">{zeroMeans}</p>
        {note ? <p className="text-ds-caption text-muted-foreground">{note}</p> : null}
      </div>
    )
  }

  const pct = Math.min((used / limit) * 100, 100)
  const tight = pct >= 80

  return (
    <div className="space-y-ds-2">
      <div className="flex items-baseline justify-between gap-ds-2">
        <p className="text-ds-body-sm">{label}</p>
        <p className="text-ds-body-sm tabular-nums">
          <span className={tight ? 'font-medium text-foreground' : 'font-medium'}>
            {used.toLocaleString()}
          </span>
          <span className="text-muted-foreground"> of {limit.toLocaleString()}</span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-ds-full bg-muted">
        <div
          className={`h-full rounded-ds-full ${tight ? 'bg-destructive' : 'bg-foreground'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note ? <p className="text-ds-caption text-muted-foreground">{note}</p> : null}
    </div>
  )
}

export function UsagePanel({ status, managed }: { status: BillingStatus; managed: boolean }) {
  const usage = status.usage
  const credits = status.credits
  const currency = resolveCurrency(status.plan?.currency)

  const [packs, setPacks] = useState<TopupPackage[] | null>(null)
  const [perUnlock, setPerUnlock] = useState<number | null>(null)
  const [packsFailed, setPacksFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [packsRes, rulesRes] = await Promise.all([
          fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.topupOptions}`, {
            headers: getAuthHeaders(),
          }),
          fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.pricing}`, {
            headers: getAuthHeaders(),
          }),
        ])
        if (!packsRes.ok) throw new Error('top up options unavailable')
        const packsBody = await packsRes.json()
        const rulesBody = rulesRes.ok ? await rulesRes.json() : null
        if (cancelled) return

        setPacks(Array.isArray(packsBody?.packages) ? packsBody.packages : [])

        const rules: PricingRule[] = Array.isArray(rulesBody)
          ? rulesBody
          : (rulesBody?.rules ?? [])
        const unlock = rules.find((r) => UNLOCK_ACTION_TYPES.includes(r.action_type))
        setPerUnlock(unlock?.cost_per_action ?? CREDITS_PER_UNLOCK)
      } catch {
        if (!cancelled) setPacksFailed(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const credited = perUnlock ?? CREDITS_PER_UNLOCK

  const gates = unlockGates({
    monthlyCredits: status.plan?.monthly_credits,
    monthlyProfileLimit: status.plan?.monthly_profile_limit,
    creditsPerUnlock: credited,
  })
  const hasHeadroom = (gates.headroom ?? 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ds-subheading">This cycle</CardTitle>
        <CardDescription>What the plan has covered so far, and what is left in it.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-ds-4">
        <div className="grid gap-ds-4 sm:grid-cols-2">
          {/* The bar is against the CAP, because that is the number that
              refuses an unlock. The caption says what the plan funds, because
              that is the number the plan pays for, and they are two different
              limits. app/core/plans.py. */}
          <Meter
            used={usage?.profiles_used ?? 0}
            limit={usage?.profiles_limit ?? 0}
            label="Profile unlocks"
            note={
              gates.included === null
                ? undefined
                : hasHeadroom
                  ? `${gates.included.toLocaleString()} funded by the plan, the rest needs topped up credits`
                  : `${gates.included.toLocaleString()} funded by the plan, and the cap is the same number`
            }
          />
          <Meter
            used={usage?.posts_used ?? 0}
            limit={usage?.posts_limit ?? 0}
            label="Post analyses"
            zeroMeans="No monthly cap on this account"
            note={
              (usage?.posts_limit ?? 0) > 0 ? undefined : 'Metered in credits, like everything else'
            }
          />
        </div>

        {/* The second gate, said once. Both have to pass. */}
        <p className="text-ds-body-sm text-muted-foreground max-w-prose">
          An unlock needs two things: room under your monthly cap, and {credited} credits in the
          wallet.{' '}
          {hasHeadroom
            ? 'Buying credits covers the second one and never raises the first, so the cap is where unlocks stop whatever your balance is.'
            : 'Buying credits covers the second one and never raises the first, so on this plan a top up will not buy you more unlocks.'}
        </p>

        <Separator />

        <div className="grid gap-ds-4 sm:grid-cols-3">
          <div className="space-y-ds-1">
            <p className="text-ds-overline uppercase text-muted-foreground">Credits left</p>
            <p className="text-ds-heading tabular-nums">
              {credits ? credits.current_balance.toLocaleString() : NO_FIGURE}
            </p>
            <p className="text-ds-caption text-muted-foreground">
              {credited} credits unlocks one creator
            </p>
          </div>
          <div className="space-y-ds-1">
            <p className="text-ds-overline uppercase text-muted-foreground">Added this cycle</p>
            <p className="text-ds-heading tabular-nums">
              {credits ? credits.total_earned_this_cycle.toLocaleString() : NO_FIGURE}
            </p>
            <p className="text-ds-caption text-muted-foreground">From your plan allowance</p>
          </div>
          <div className="space-y-ds-1">
            <p className="text-ds-overline uppercase text-muted-foreground">Spent this cycle</p>
            <p className="text-ds-heading tabular-nums">
              {credits ? credits.total_spent_this_cycle.toLocaleString() : NO_FIGURE}
            </p>
            <p className="text-ds-caption text-muted-foreground">
              {credits ? `${credits.lifetime_spent.toLocaleString()} in total` : ' '}
            </p>
          </div>
        </div>

        {/* Top ups. Listed, never sold from here: there is no self serve
            purchase behind them, so there is no button that pretends there is. */}
        {!managed && packs !== null && packs.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-ds-2">
              {/* Only a plan with headroom can turn a top up into unlocks.
                  Credits land in the same pooled balance and the count gate is
                  applied on every unlock regardless, so on Free and Standard a
                  pack buys post analyses and exports, not unlocks. */}
              <p className="text-ds-label">
                {hasHeadroom ? 'More unlocks, on top of the plan' : 'More credits, on top of the plan'}
              </p>
              {hasHeadroom ? null : (
                <p className="text-ds-caption text-muted-foreground max-w-prose">
                  These do not raise your unlock cap. They cover post analyses, campaign analysis
                  and exports once the plan credits are gone.
                </p>
              )}
              <div className="grid gap-ds-2 sm:grid-cols-3">
                {packs.map((pack) => {
                  const unlocks = credited > 0 ? Math.floor(pack.credits / credited) : null
                  // Never more unlocks than the cap actually leaves room for.
                  const usable =
                    unlocks === null || gates.headroom === null
                      ? unlocks
                      : Math.min(unlocks, gates.headroom)
                  return (
                    <div key={pack.type} className="rounded-ds-surface border p-ds-3">
                      <p className="text-ds-subheading">
                        {hasHeadroom
                          ? usable === null
                            ? NO_FIGURE
                            : `${usable.toLocaleString()} unlocks`
                          : `${pack.credits.toLocaleString()} credits`}
                      </p>
                      <p className="text-ds-caption text-muted-foreground">
                        {hasHeadroom
                          ? `${pack.credits.toLocaleString()} credits`
                          : 'Not spendable on unlocks at this tier'}
                      </p>
                      <p className="mt-ds-2 text-ds-body-sm font-medium">
                        {typeof pack.discounted_price === 'number'
                          ? formatPlanPrice(pack.discounted_price, currency)
                          : NO_FIGURE}
                        {pack.discount_percentage > 0
                          ? `, ${pack.discount_percentage}% off`
                          : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="text-ds-caption text-muted-foreground">
                Top ups are arranged with your account manager and appear on your next invoice.
              </p>
            </div>
          </>
        ) : null}

        {!managed && packsFailed ? (
          <>
            <Separator />
            <p className="flex items-start gap-ds-2 text-ds-body-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              We could not load top up prices, and we will not quote one we have not confirmed.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Kept so the skeleton for this panel matches its real height. */
export function UsagePanelSkeleton() {
  return <Skeleton className="h-[260px]" />
}
