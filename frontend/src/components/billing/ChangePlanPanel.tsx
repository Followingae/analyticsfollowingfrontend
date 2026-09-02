'use client'

/**
 * Every plan, side by side, and the control that moves between them.
 *
 * Until this existed there was no way to change plan anywhere in the product.
 * The billing page showed the plan you were on and, if you happened to be on
 * Free, a single "Upgrade to Standard" button. Downgrading was not offered at
 * all, and neither was seeing what the other plans actually give you.
 *
 * Where the numbers come from
 * ---------------------------
 * Prices are live, from GET /api/v1/checkout/pricing, which reads the same
 * single source of truth Stripe is charged from. They are never taken from a
 * constant in this repo, because that is how the page came to say "AED 199"
 * while the card was charged USD 199.
 *
 * Limits are the tier table in src/config/planPricing.ts, which mirrors
 * SUBSCRIPTION_TIER_LIMITS in app/models/teams.py, EXCEPT for the plan the
 * account is actually on: there the live billing status wins, so a client is
 * never quoted a limit their own account disagrees with.
 *
 * Which write runs
 * ----------------
 *   no subscription, paid plan   hosted Stripe checkout, card taken on Stripe
 *   subscription, higher tier    changed now, prorated onto the card on file
 *   subscription, lower paid     changed now, nothing refunded for this cycle
 *   subscription, Free           runs to the renewal date, then does not renew
 *   invoiced account             no control at all, a note to the account manager
 *
 * Every one of those confirms first, and the confirmation says what is charged
 * and when. A plan with no Stripe price object behind it is shown with the
 * button disabled and the reason written out, rather than a button that 503s.
 */

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonGroup } from '@/components/ui2/button-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { BillingStatus } from '@/services/billingManager'
import {
  formatPlanPrice,
  CREDITS_PER_UNLOCK,
  postsAllowanceLabel,
  resolveCurrency,
  unlockGates,
  unlockGatesForTier,
  getPlanLimits,
  normalizePlanTier,
  type PlanTier,
} from '@/config/planPricing'
import {
  downgradePlan,
  endPlanAtPeriodEnd,
  fetchPlanPrices,
  startPlanCheckout,
  upgradePlan,
  type BillingInterval,
  type PlanPrice,
} from '@/services/brandBillingApi'
import { longDate, NO_FIGURE } from './PlanSummaryCard'

const ORDER: PlanTier[] = ['free', 'standard', 'premium']
const RANK: Record<PlanTier, number> = { free: 0, standard: 1, premium: 2 }

type Load = 'loading' | 'loaded' | 'failed'

/** What moving to this plan would do. One of these, never two. */
type Move = 'current' | 'checkout' | 'upgrade' | 'downgrade' | 'end' | 'ask' | 'none'

interface ChangePlanPanelProps {
  status: BillingStatus
  managed: boolean
  /** Re-read the billing status once a change has gone through. */
  onChanged: () => void
}

export function ChangePlanPanel({ status, managed, onChanged }: ChangePlanPanelProps) {
  const [load, setLoad] = useState<Load>('loading')
  const [prices, setPrices] = useState<PlanPrice[]>([])
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [pending, setPending] = useState<PlanTier | null>(null)
  const [confirm, setConfirm] = useState<{ tier: PlanTier; move: Move } | null>(null)

  const currentTier = normalizePlanTier(status.plan?.tier)
  const hasSubscription = Boolean(status.stripe?.subscription_id)
  const renews = longDate(status.stripe?.current_period_end)
  const card = status.stripe?.payment_method
  const currency = resolveCurrency(status.plan?.currency)

  // The interval choice only exists where it can be honoured. Checkout takes
  // either; changing a subscription that already exists runs on the monthly
  // price, so offering annual there would be a control that does not do what
  // it says.
  const canChooseInterval = !managed && !hasSubscription

  const reload = () => {
    setLoad('loading')
    fetchPlanPrices()
      .then(({ plans }) => {
        setPrices(plans)
        setLoad('loaded')
      })
      .catch(() => setLoad('failed'))
  }

  useEffect(reload, [])

  const byTier = useMemo(() => {
    const map = new Map<string, PlanPrice>()
    prices.forEach((p) => map.set(normalizePlanTier(p.tier), p))
    return map
  }, [prices])

  const moveFor = (tier: PlanTier): Move => {
    if (tier === currentTier) return 'current'
    if (managed) return 'ask'
    // On a paid tier with no Stripe subscription behind it, the account's
    // records disagree with each other. Sending them to checkout would open a
    // SECOND subscription against a plan they are already on, so this one goes
    // to a person instead.
    if (!hasSubscription && currentTier !== 'free') return 'ask'
    if (!hasSubscription) return tier === 'free' ? 'none' : 'checkout'
    if (tier === 'free') return 'end'
    return RANK[tier] > RANK[currentTier] ? 'upgrade' : 'downgrade'
  }

  const run = async (tier: PlanTier, move: Move) => {
    setPending(tier)
    try {
      if (move === 'checkout') {
        const url = await startPlanCheckout(tier, canChooseInterval ? interval : 'monthly')
        window.location.href = url
        return
      }
      if (move === 'upgrade') {
        await upgradePlan(tier)
        toast.success(`You are on the ${tier} plan.`)
      } else if (move === 'downgrade') {
        await downgradePlan(tier)
        toast.success(`You are on the ${tier} plan.`)
      } else if (move === 'end') {
        await endPlanAtPeriodEnd()
        toast.success(
          renews ? `Your plan runs to ${renews} and does not renew.` : 'Your plan will not renew.'
        )
      }
      onChanged()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'That change did not go through')
    } finally {
      setPending(null)
    }
  }

  if (load === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-ds-subheading">Plans</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-ds-3 sm:grid-cols-3">
          {ORDER.map((t) => (
            <Skeleton key={t} className="h-[280px]" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (load === 'failed') {
    return (
      <Card>
        <CardContent className="space-y-ds-2 py-ds-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-ds-body font-medium">We could not load the price list</p>
          <p className="text-ds-body-sm text-muted-foreground">
            Rather than quote you a price the server has not confirmed, the plans are left off.
          </p>
          <Button variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-ds-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-ds-1">
            <CardTitle className="text-ds-subheading">Plans</CardTitle>
            <CardDescription>
              {managed
                ? 'Your plan is set by your agreement with us. Here is what each one includes.'
                : 'Move up or down whenever you like. Every change is confirmed before anything is charged.'}
            </CardDescription>
          </div>
          {canChooseInterval ? (
            <ButtonGroup>
              <Button
                variant={interval === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterval('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={interval === 'annual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterval('annual')}
              >
                Annual, 20% off
              </Button>
            </ButtonGroup>
          ) : null}
        </CardHeader>

        <CardContent className="grid gap-ds-3 sm:grid-cols-3">
          {ORDER.map((tier) => (
            <PlanColumn
              key={tier}
              tier={tier}
              price={byTier.get(tier)}
              interval={canChooseInterval ? interval : 'monthly'}
              currency={currency}
              move={moveFor(tier)}
              busy={pending === tier}
              anyBusy={pending !== null}
              live={tier === currentTier ? status : null}
              onPick={(move) => setConfirm({ tier, move })}
            />
          ))}
        </CardContent>

        {!managed && hasSubscription ? (
          <CardContent className="pt-0">
            <p className="text-ds-caption text-muted-foreground">
              Annual billing, and anything else about the card itself, is handled in the billing
              portal from the panel above.
            </p>
          </CardContent>
        ) : null}
      </Card>

      <ConfirmMove
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        tier={confirm?.tier ?? null}
        move={confirm?.move ?? null}
        price={confirm ? byTier.get(confirm.tier) : undefined}
        interval={canChooseInterval ? interval : 'monthly'}
        currency={currency}
        renews={renews}
        cardLast4={card?.last4 ?? null}
        onConfirm={() => {
          if (confirm) void run(confirm.tier, confirm.move)
          setConfirm(null)
        }}
      />
    </>
  )
}

// ─── One plan ────────────────────────────────────────────────────────────────

function PlanColumn({
  tier,
  price,
  interval,
  currency,
  move,
  busy,
  anyBusy,
  live,
  onPick,
}: {
  tier: PlanTier
  price: PlanPrice | undefined
  interval: BillingInterval
  currency: string | null
  move: Move
  busy: boolean
  anyBusy: boolean
  /** Set only for the plan the account is on: its limits come from the server. */
  live: BillingStatus | null
  onPick: (move: Move) => void
}) {
  const table = getPlanLimits(tier)
  const point = interval === 'annual' ? (price?.annual ?? price?.monthly) : price?.monthly
  const isAnnual = interval === 'annual' && Boolean(price?.annual)
  const noPriceObject = move === 'checkout' && !point?.priceId

  const headline =
    point === undefined || point === null
      ? NO_FIGURE
      : isAnnual && point.monthlyEquivalent !== null
        ? formatPlanPrice(point.monthlyEquivalent, point.currency || currency)
        : formatPlanPrice(point.amount, point.currency || currency)

  // What this plan includes, and whether anything caps it. The static table is
  // the source for the plans the account is NOT on, since the billing status
  // only describes the current one. There is no "ceiling" row any more: on
  // every paid tier there is no ceiling, and a row reading "Ceiling: 350" was
  // the comparison table's version of the sentence that stopped people buying.
  const gates = live
    ? unlockGates({
        includedUnlocks: live.plan?.included_profile_unlocks,
        monthlyCredits: live.plan?.monthly_credits,
        profilesLimit: live.usage?.profiles_limit,
        profilesUnlimited: live.usage?.profiles_unlimited,
      })
    : unlockGatesForTier(tier)

  const rows: Array<[string, string]> = [
    ['Seats', String(live?.plan?.max_team_members ?? table.seats)],
    ['Profile unlocks a month', (gates.included ?? 0).toLocaleString()],
    [
      'More unlocks',
      gates.unlimited
        ? `Buy any number, ${CREDITS_PER_UNLOCK} credits each`
        : 'On a paid plan',
    ],
    [
      'Post analyses a month',
      postsAllowanceLabel(live?.plan?.monthly_posts_limit ?? table.monthlyPosts),
    ],
    ['Credits a month', (live?.plan?.monthly_credits ?? table.monthlyCredits).toLocaleString()],
  ]
  const topup = live?.plan?.topup_discount ?? table.topupDiscount
  if (topup > 0) rows.push(['Off every top up', `${Math.round(topup * 100)}%`])

  const label: Record<Move, string> = {
    current: 'Your plan',
    checkout: `Choose ${price?.name ?? tier}`,
    upgrade: `Move up to ${price?.name ?? tier}`,
    downgrade: `Move to ${price?.name ?? tier}`,
    end: 'Move to Free',
    ask: 'Ask your account manager',
    none: '',
  }

  return (
    <div
      className={`rounded-ds-surface border p-ds-3 ${
        move === 'current' ? 'border-foreground/25 bg-muted/40' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-ds-2">
        <p className="text-ds-subheading">{price?.name ?? tier}</p>
        {move === 'current' ? <Badge variant="secondary">Current</Badge> : null}
      </div>

      <p className="mt-ds-2 text-ds-title">{headline}</p>
      <p className="text-ds-caption text-muted-foreground">
        {tier === 'free'
          ? 'No charge'
          : isAnnual && point
            ? `a month, billed ${formatPlanPrice(point.amount, point.currency || currency)} a year`
            : 'a month'}
      </p>

      <ul className="mt-ds-3 space-y-ds-2">
        {rows.map(([name, value]) => (
          <li key={name} className="flex items-start justify-between gap-ds-2 text-ds-body-sm">
            <span className="text-muted-foreground">{name}</span>
            <span className="font-medium tabular-nums">{value}</span>
          </li>
        ))}
      </ul>

      <div className="mt-ds-3">
        {move === 'current' ? (
          <p className="flex items-center gap-ds-1 text-ds-body-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            You are on this plan
          </p>
        ) : move === 'none' ? (
          <p className="text-ds-body-sm text-muted-foreground">Nothing to do here</p>
        ) : move === 'ask' ? (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={`mailto:support@following.ae?subject=Plan%20change%3A%20${tier}`}>
              {label.ask}
            </a>
          </Button>
        ) : noPriceObject ? (
          <p className="text-ds-body-sm text-muted-foreground">
            This plan is not on self serve checkout yet. Your account manager can set it up.
          </p>
        ) : (
          <Button
            variant={move === 'upgrade' || move === 'checkout' ? 'default' : 'outline'}
            size="sm"
            className="w-full"
            disabled={anyBusy}
            onClick={() => onPick(move)}
          >
            {busy ? 'Working' : label[move]}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── The confirmation ────────────────────────────────────────────────────────
//
// Every branch says the amount and the moment. None of them says "at period
// end" for the downgrade path, because the endpoint behind it swaps the price
// immediately with proration switched off, whatever its response message says.

function ConfirmMove({
  open,
  onOpenChange,
  tier,
  move,
  price,
  interval,
  currency,
  renews,
  cardLast4,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier: PlanTier | null
  move: Move | null
  price: PlanPrice | undefined
  interval: BillingInterval
  currency: string | null
  renews: string | null
  cardLast4: string | null
  onConfirm: () => void
}) {
  if (!tier || !move) return null

  const name = price?.name ?? tier
  const point = interval === 'annual' ? (price?.annual ?? price?.monthly) : price?.monthly
  const amount = point ? formatPlanPrice(point.amount, point.currency || currency) : NO_FIGURE
  const per = interval === 'annual' && price?.annual ? 'a year' : 'a month'
  const onCard = cardLast4 ? `the card ending ${cardLast4}` : 'the card on file'

  const copy: Record<string, { title: string; body: string; go: string }> = {
    checkout: {
      title: `Start the ${name} plan?`,
      body: `We will take you to Stripe to set up ${amount} ${per}. You review the total there, and nothing is charged until you confirm it on Stripe's page.`,
      go: 'Continue to Stripe',
    },
    upgrade: {
      title: `Move up to ${name}?`,
      body: `This takes effect straight away. Stripe charges ${onCard} today for the difference over the rest of this billing period, and from then on you pay ${amount} ${per}${renews ? `, next on ${renews}` : ''}.`,
      go: `Upgrade to ${name}`,
    },
    downgrade: {
      title: `Move to ${name}?`,
      body: `Your plan changes to ${name} straight away, along with its limits. The part of this billing period you have already paid for is not refunded, and your next invoice${renews ? ` on ${renews}` : ''} is ${amount} ${per}.`,
      go: `Move to ${name}`,
    },
    end: {
      title: 'Move to the Free plan?',
      body: `Nothing changes today and nothing more is charged. Your current plan runs${renews ? ` to ${renews}` : ' to the end of the period you have paid for'} and then does not renew, after which you are on Free. Every creator you have already unlocked stays unlocked.`,
      go: 'Move to Free',
    },
  }

  const said = copy[move]
  if (!said) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{said.title}</AlertDialogTitle>
          <AlertDialogDescription>{said.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{said.go}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
