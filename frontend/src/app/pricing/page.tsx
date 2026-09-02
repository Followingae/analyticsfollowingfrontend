'use client'

/**
 * Surface 4 - the pricing page, for someone who already knows what they want.
 *
 * Not a brochure. A basket: pick a plan, see one total, one checkout. The
 * annual toggle takes 20% off, and it now survives the trip: /checkout posts
 * the interval it is handed, so someone who picks Annual is billed annually.
 *
 * Both add-ons are shown here, because this is where a plan is chosen. Run
 * carries its agreed price. Merchant of Record says it is quoted, and says so
 * about BOTH halves of its price: the monthly fee in app/core/modules.py is
 * labelled a placeholder by that file itself, and there is a settlement
 * percentage on top of it in run_money/config.py that is equally unagreed.
 * run_money/mor.py fee_structure() returns prices_are_provisional over the
 * pair, so naming only the fee would show a client half the model.
 *
 * MoR is also INCLUDED in Managed at no charge (PLAN_INCLUDED_MODULES), because
 * the management service charge already pays for us settling with the creators,
 * and the card says so: offering it as a paid extra beside Managed would bill
 * the same work twice.
 *
 * Both add-ons are requests rather than checkout lines: there is no Stripe
 * price object for either, and a control that pretends otherwise is worse than
 * an honest one.
 *
 * Every plan price comes from the live /checkout/pricing response, in the
 * currency that response names. Nothing here writes a price literal, and there
 * is no seat price anywhere: seats are a hard cap per tier and the backend has
 * nothing that sells one.
 *
 * Unlocks are one number on a paid plan and two words about buying more. The
 * plan includes an allowance, and above it nothing caps unlocks: credits are
 * the only limit, so a top-up buys unlocks outright. Free is the one capped
 * tier, at 5, and that is said as the reason to upgrade rather than as a
 * refusal. Nothing on this page says what a top-up cannot do. app/core/plans.py.
 *
 * The loading, empty and failed states are three different screens on purpose.
 * A price that did not load is a dash and a disabled button, never a zero and
 * never a stale guess.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Check, ArrowRight, Users, Zap, ShieldCheck, Handshake, AlertCircle, Megaphone, Wallet } from 'lucide-react'
import { API_CONFIG, ENDPOINTS } from '@/config/api'
import {
  ANNUAL_DISCOUNT,
  CREDITS_PER_UNLOCK,
  NO_PRICE,
  formatPlanPrice,
  resolveCurrency,
  getModuleAmount,
  modulePriceLabel,
  getPlanLimits,
  hydrateBillingCurrency,
  unlockGatesForTier,
  unlockSentence,
  type BillingCurrency,
} from '@/config/planPricing'
import { MODULES } from '@/config/modules'

// ──────────────────────────────────────────────
// Live pricing shape (GET /api/v1/checkout/pricing)
// ──────────────────────────────────────────────

interface TierPricing {
  amount: number
  interval: string
  price_id: string
  savings?: number
  monthly_equivalent?: number
}

interface PricingTier {
  name: string
  credits: number
  pricing: { monthly?: TierPricing; annual?: TierPricing }
  topup_discount?: number
}

/** The VAT block the API sends alongside the prices. Every amount in this
 *  response is NET: the card charge is the amount plus 5% UAE VAT, added by
 *  the tax rate on the Stripe checkout session. So a price shown here without
 *  a VAT note is a price that does not match the card form it leads to. */
interface VatInfo {
  label: string
  percent: string
  prices_exclude_vat: boolean
  note: string
}

interface PricingResponse {
  success: boolean
  pricing: Record<string, PricingTier>
  currency: string
  annual_discount: number
  vat?: VatInfo
}

type FetchState = 'loading' | 'loaded' | 'failed'

type SelectableTier = 'free' | 'standard' | 'premium'

const TIER_ORDER: SelectableTier[] = ['free', 'standard', 'premium']

const TIER_ICON = { free: Zap, standard: Users, premium: ShieldCheck } as const

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [state, setState] = useState<FetchState>('loading')
  const [pricing, setPricing] = useState<PricingResponse | null>(null)

  /** "Excluding VAT 5%", or null when the backend did not tell us the rate.
   *  Never a hardcoded 5: a rate this page made up would be a rate that can
   *  silently disagree with what Stripe actually charges. */
  const vatNote =
    pricing?.vat?.prices_exclude_vat && pricing.vat.label
      ? `Excluding ${pricing.vat.label}`
      : null
  const [tier, setTier] = useState<SelectableTier>('standard')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.pricing}`)
        if (!res.ok) throw new Error('pricing unavailable')
        const data: PricingResponse = await res.json()
        if (cancelled) return
        if (!data?.pricing) {
          setState('failed')
          return
        }
        // Quote in the currency the server charges in, never an assumed one.
        hydrateBillingCurrency(data.currency)
        setPricing(data)
        setState('loaded')
      } catch {
        if (!cancelled) setState('failed')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // The live response is the authority. The fallback is only ever reached before
  // that response lands, and this page renders a skeleton until it does, so no
  // price is ever drawn in a currency the server did not name.
  const currency = resolveCurrency(pricing?.currency)
  const interval = annual ? 'annual' : 'monthly'

  /** Monthly amount for a tier in the selected interval, or null if unknown. */
  const planMonthly = (key: SelectableTier): number | null => {
    const t = pricing?.pricing?.[key]
    if (!t) return null
    if (key === 'free') return 0
    if (annual) {
      const a = t.pricing.annual
      if (typeof a?.monthly_equivalent === 'number') return a.monthly_equivalent
      if (typeof a?.amount === 'number') return Math.round(a.amount / 12)
      return null
    }
    return typeof t.pricing.monthly?.amount === 'number' ? t.pricing.monthly.amount : null
  }

  // Run is the only add-on with an agreed list price. Null until the server has
  // named a currency, and rendered as the one mark for a figure we do not have
  // rather than as a number in a currency we guessed at.
  const runPrice = useMemo(() => {
    const amount = getModuleAmount('run', annual ? 'annual' : 'monthly', currency)
    if (amount === null) return NO_PRICE
    return `${formatPlanPrice(Math.round(amount / (annual ? 12 : 1)), currency)}/mo`
  }, [annual, currency])

  const selectedPlanMonthly = planMonthly(tier)
  const basketKnown = selectedPlanMonthly !== null
  // Run is deliberately NOT in this total. Nothing downstream can sell it:
  // there is no Stripe price object for it (MODULE_STRIPE_PRICE_IDS is empty)
  // and POST /api/v1/checkout/create-session takes a tier and an interval, and
  // no add-on line. A basket that totalled it would be a number nobody could
  // charge, so Run is a request until that path exists.
  const totalMonthly = selectedPlanMonthly
  const totalAnnual = totalMonthly !== null ? Math.round(totalMonthly * 12) : null

  const priceCell = (value: number | null) =>
    value === null ? NO_PRICE : formatPlanPrice(Math.round(value), currency)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[360px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (state === 'failed' || !pricing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-24 sm:px-6 text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">We could not load our prices</h1>
          <p className="text-muted-foreground">
            We would rather show you nothing than a number we have not confirmed. Reload, or ask
            us and we will send them over.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@following.ae?subject=Pricing">Ask us</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Pick a plan, add Run or Merchant of Record if you need them, and check out once. Find
            is in every plan.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className={`text-sm font-medium ${!annual ? '' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
            <span className={`text-sm font-medium ${annual ? '' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge variant="secondary">{Math.round(ANNUAL_DISCOUNT * 100)}% off everything</Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] items-start">
          {/* ── Choose ─────────────────────────────────────────────────── */}
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">1. Your plan</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {TIER_ORDER.map((key) => (
                  <PlanCard
                    key={key}
                    tier={key}
                    selected={tier === key}
                    onSelect={() => setTier(key)}
                    monthly={planMonthly(key)}
                    currency={currency}
                    annual={annual}
                    credits={pricing.pricing[key]?.credits}
                  />
                ))}
              </div>

              <Card className="mt-4">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <Handshake className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Managed</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {MODULES.manage.summary} Quoted against the work, so it starts with a
                        conversation rather than a price.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@following.ae?subject=Managed%20plan">Talk to us</a>
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* ── The add-ons ──────────────────────────────────────────── */}
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">2. Add-ons</h2>
              <div className="flex flex-col gap-ds-3">
                <AddonCard
                  icon={Megaphone}
                  name={MODULES.run.name}
                  summary={MODULES.run.summary}
                  contains={MODULES.run.contains}
                  // AED 1,200 a month, an agreed price:
                  // app/core/modules.py RUN_ADDON_AED_PER_MONTH.
                  price={runPrice}
                  grants="Campaigns, briefs, deliverables and content collection unlock across the app, on top of whatever plan you are on."
                  subject="Adding%20Run%20to%20my%20plan"
                  cta="Ask us to add Run"
                />
                <AddonCard
                  icon={Wallet}
                  name={MODULES.mor.name}
                  summary={MODULES.mor.summary}
                  contains={MODULES.mor.contains}
                  // QUOTED, never a number, and BOTH halves of it are quoted.
                  // app/core/modules.py says MOR_ADDON_AED_PER_MONTH is a
                  // PLACEHOLDER that has not been agreed; there is a settlement
                  // percentage on top of it in run_money/config.py that is also
                  // unagreed; and run_money/mor.py fee_structure() returns
                  // prices_are_provisional: true over the pair. Naming only the
                  // monthly fee would show a client half the commercial model.
                  price={modulePriceLabel('mor', currency)}
                  grants="Payouts and settlement switch on for your campaigns. There is a monthly fee while it is on, and a percentage of every payout we settle, and both are agreed with you in writing first. Included at no charge if you are on Managed, which already covers it."
                  subject="Merchant%20of%20Record"
                  cta="Ask us to quote it"
                />
              </div>
            </section>
          </div>

          {/* ── Basket ───────────────────────────────────────────────────── */}
          <Card className="lg:sticky lg:top-8">
            <CardHeader className="pb-3">
              <p className="font-semibold">Your basket</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="capitalize">{tier} plan</span>
                  <span>{priceCell(selectedPlanMonthly)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold">
                  {priceCell(totalMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>

              {vatNote && (
                <p className="text-xs text-muted-foreground">
                  {vatNote}, which is added at checkout.
                </p>
              )}

              {annual && totalAnnual !== null && (
                <p className="text-xs text-muted-foreground">
                  {formatPlanPrice(totalAnnual, currency)} billed annually, {Math.round(ANNUAL_DISCOUNT * 100)}%
                  off the monthly price.
                </p>
              )}

              <div className="flex flex-col gap-ds-1 text-xs text-muted-foreground">
                {/* No "extra seats at X each" line: max_team_members is a hard
                    cap per tier (app/core/plans.py seat_cap_for_row), there is
                    no seat price anywhere in the backend and no way to buy one.
                    Quoting a seat price would be advertising something nobody
                    can sell, which is what "extra seats AED 180/month" was. */}
                <p>
                  {getPlanLimits(tier).seats} seat{getPlanLimits(tier).seats === 1 ? '' : 's'}. More
                  people means the next plan up, or a word with us.
                </p>
                {/* Both gates. An unlock needs a count under the cap AND 25
                    credits in the wallet, and buying credits only ever moves
                    the second one. app/core/plans.py. */}
                <p>{unlockSentence(unlockGatesForTier(tier))}</p>
              </div>

              <Button
                className="w-full"
                disabled={!basketKnown}
                onClick={() => {
                  // The checkout contract is tier + interval, and /checkout now
                  // sends both. Free goes to signup; someone signed out who picks
                  // a paid plan signs up first and is handed back to checkout with
                  // their choice intact.
                  if (tier === 'free') {
                    router.push('/auth/register')
                    return
                  }
                  router.push(`/checkout?tier=${tier}&interval=${interval}`)
                }}
              >
                {tier === 'free' ? 'Start free' : 'Continue to checkout'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Already a customer?{' '}
                <Link href="/billing?tab=plan" className="underline underline-offset-2">
                  Change your plan in billing
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Add-on card
// ──────────────────────────────────────────────

/**
 * One add-on, with the entitlement it grants said in words rather than implied.
 *
 * `price` is a STRING, already resolved by the caller, because two of the three
 * things this card can show are not numbers: "Quoted" for a module whose price
 * has not been agreed, and the one dash for a price we could not load. A card
 * that took a number would have to invent one for both.
 *
 * Neither add-on is a checkout line. There is no Stripe price object for either
 * (MODULE_STRIPE_PRICE_IDS is empty) and POST /checkout/create-session takes a
 * tier and an interval with no add-on line, so the control is a real request
 * rather than a button that would fail.
 */
function AddonCard({
  icon: Icon,
  name,
  summary,
  contains,
  price,
  grants,
  subject,
  cta,
}: {
  icon: typeof Megaphone
  name: string
  summary: string
  contains: string[]
  price: string
  grants: string
  subject: string
  cta: string
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-ds-3">
          <div className="flex items-start gap-ds-2">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex flex-col gap-ds-2">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground max-w-prose">{summary}</p>
              </div>
              <ul className="flex flex-col gap-ds-2">
                {contains.map((line) => (
                  <li key={line} className="flex items-start gap-ds-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground max-w-prose">
                <span className="font-medium text-foreground">What it switches on: </span>
                {grants}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-ds-2 text-right">
            <p className="font-semibold">{price}</p>
            <Button variant="outline" asChild>
              <a href={`mailto:support@following.ae?subject=${subject}`}>{cta}</a>
            </Button>
            <p className="text-xs text-muted-foreground max-w-[12rem]">
              Added to your account by hand today, and billed on your next invoice.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Plan card
// ──────────────────────────────────────────────

function PlanCard({
  tier,
  selected,
  onSelect,
  monthly,
  currency,
  annual,
  credits,
}: {
  tier: SelectableTier
  selected: boolean
  onSelect: () => void
  monthly: number | null
  currency: BillingCurrency | null
  annual: boolean
  credits?: number
}) {
  const Icon = TIER_ICON[tier]
  const limits = getPlanLimits(tier)
  const gates = unlockGatesForTier(tier)

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`cursor-pointer transition-shadow ${
        selected ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{tier}</span>
          {selected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">
            {monthly === null ? NO_PRICE : formatPlanPrice(monthly, currency)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        {annual && monthly !== null && monthly > 0 && (
          <p className="text-xs text-muted-foreground mt-1">billed annually</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="flex flex-col gap-ds-2 text-sm">
          <li className="flex items-start gap-ds-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {typeof credits === 'number'
                ? credits.toLocaleString()
                : limits.monthlyCredits.toLocaleString()}{' '}
              credits a month
            </span>
          </li>
          <li className="flex items-start gap-ds-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            {/* The INCLUDED figure, with the cap on the line under it where the
                two differ. One number for both gates is the conflation that
                produced 500s and 2,000s on a server enforcing 350 and 1,000. */}
            <span>
              {(gates.included ?? 0).toLocaleString()} profile unlocks
              <span className="block text-muted-foreground">
                {gates.unlimited
                  ? `buy more at ${CREDITS_PER_UNLOCK} credits each, no monthly ceiling`
                  : 'the Free plan monthly limit'}
              </span>
            </span>
          </li>
          <li className="flex items-start gap-ds-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {limits.monthlyPosts > 0
                ? `${limits.monthlyPosts.toLocaleString()} post analyses a month`
                : 'Post analyses metered in credits, with no monthly cap'}
            </span>
          </li>
          <li className="flex items-start gap-ds-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {limits.seats} seat{limits.seats === 1 ? '' : 's'}
            </span>
          </li>
          <li className="flex items-start gap-ds-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>Find included</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
