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
 * The unlock bar runs against what the plan FUNDS, not against a ceiling, because
 * on every paid tier there is no ceiling: the wallet is the only limit. So the
 * bar can pass 100%, and when it does that is a customer buying more rather than
 * a warning, which is why it stays neutral instead of turning destructive and
 * says how many are beyond the allowance instead of how many are left.
 *
 * Free is the one tier with a real cap, and there the bar means what it always
 * meant. The upgrade, not a refusal, is the thing to say.
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
  canRunOut = true,
}: {
  used: number
  limit: number
  label: string
  note?: string
  zeroMeans?: string
  /**
   * False when `limit` is what the plan FUNDS rather than a ceiling. Going past
   * a funded allowance is a normal paid state, so the bar must not shout: no
   * destructive colour, and "of N included" rather than "of N".
   */
  canRunOut?: boolean
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
  // "Nearly out" only means something when running out is a thing that can
  // happen. Where the allowance is a funded figure rather than a ceiling,
  // passing it is a customer spending money with us, not a warning state, so
  // the bar stays neutral and never turns destructive.
  const tight = canRunOut && pct >= 80
  const over = used > limit

  return (
    <div className="space-y-ds-2">
      <div className="flex items-baseline justify-between gap-ds-2">
        <p className="text-ds-body-sm">{label}</p>
        <p className="text-ds-body-sm tabular-nums">
          <span className={tight ? 'font-medium text-foreground' : 'font-medium'}>
            {used.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {' '}of {limit.toLocaleString()}
            {canRunOut ? '' : ' included'}
          </span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-ds-full bg-muted">
        <div
          className={`h-full rounded-ds-full ${tight ? 'bg-destructive' : 'bg-foreground'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Past the included allowance on a plan with no ceiling. Stated as fact,
          in the same weight as everything else: this is a good customer buying
          more, and the UI has no business flagging it. */}
      {over && !canRunOut ? (
        <p className="text-ds-caption text-muted-foreground">
          {(used - limit).toLocaleString()} beyond the included allowance, paid from your credits
        </p>
      ) : null}
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
    includedUnlocks: status.plan?.included_profile_unlocks,
    monthlyCredits: status.plan?.monthly_credits,
    profilesLimit: usage?.profiles_limit,
    profilesUnlimited: usage?.profiles_unlimited,
    creditsPerUnlock: credited,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ds-subheading">This cycle</CardTitle>
        <CardDescription>What the plan has covered so far, and what is left in it.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-ds-4">
        <div className="grid gap-ds-4 sm:grid-cols-2">
          {/* The bar runs against what the plan FUNDS, not against a ceiling.
              On a paid tier there is no ceiling to draw, and the funded figure
              is the number a customer actually wants to track. Going past it is
              allowed and normal, so `canRunOut` is false there and the bar never
              turns red on someone who is simply buying more. */}
          <Meter
            used={usage?.profiles_used ?? 0}
            limit={gates.included ?? 0}
            label="Profile unlocks"
            canRunOut={!gates.unlimited}
            // A null allowance is a request that did not answer, not an
            // allowance of nothing. Saying "not included on this plan" over a
            // failed load would tell a paying customer they have none.
            zeroMeans={
              gates.included === null
                ? 'We could not load your allowance'
                : 'Not included on this plan'
            }
            note={
              gates.unlimited
                ? `Buy more any time, at ${credited} credits each`
                : undefined
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

        {/* What limits an unlock, said once. */}
        <p className="text-ds-body-sm text-muted-foreground max-w-prose">
          {gates.unlimited
            ? `An unlock costs ${credited} credits, and your balance is the only thing that limits how many you take. Past the included allowance they come out of credits you have bought.`
            : `An unlock costs ${credited} credits. Free includes ${gates.included === null ? NO_FIGURE : gates.included.toLocaleString()} a month; a paid plan lifts the limit and lets you buy as many as you need.`}
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
              <p className="text-ds-label">More unlocks, on top of the plan</p>
              {gates.unlimited ? null : (
                <p className="text-ds-caption text-muted-foreground max-w-prose">
                  On Free these cover post analyses, campaign analysis and exports. A paid plan
                  lets them buy unlocks too.
                </p>
              )}
              <div className="grid gap-ds-2 sm:grid-cols-3">
                {packs.map((pack) => {
                  // No clamp. There is no ceiling to clamp against, and
                  // clamping would advertise fewer unlocks than the pack buys.
                  const unlocks = credited > 0 ? Math.floor(pack.credits / credited) : null
                  return (
                    <div key={pack.type} className="rounded-ds-surface border p-ds-3">
                      <p className="text-ds-subheading">
                        {unlocks === null ? NO_FIGURE : `${unlocks.toLocaleString()} unlocks`}
                      </p>
                      <p className="text-ds-caption text-muted-foreground">
                        {pack.credits.toLocaleString()} credits
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
