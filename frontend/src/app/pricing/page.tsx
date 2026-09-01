'use client'

/**
 * Surface 4 - the pricing page, for someone who already knows what they want.
 *
 * Not a brochure. A basket: pick a plan, tick Run, see one total, one
 * checkout. The annual toggle takes 20% off the whole basket, not off the plan
 * with the add-on quietly left at list price.
 *
 * Every plan price comes from the live /checkout/pricing response, in the
 * currency that response names. Nothing here writes a price literal. Run and
 * seat prices come from src/config/planPricing.ts, the one place the frontend
 * is allowed to know a price.
 *
 * The loading, empty and failed states are three different screens on purpose.
 * A price that did not load is an em-dash and a disabled button - never a zero
 * and never a stale guess.
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
import { Check, ArrowRight, Users, Zap, ShieldCheck, Handshake, AlertCircle, Megaphone } from 'lucide-react'
import { API_CONFIG, ENDPOINTS } from '@/config/api'
import {
  ANNUAL_DISCOUNT,
  formatPlanPrice,
  getModuleAmount,
  getPlanLimits,
  getSeatAmount,
  hydrateBillingCurrency,
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

interface PricingResponse {
  success: boolean
  pricing: Record<string, PricingTier>
  currency: string
  annual_discount: number
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
  const [tier, setTier] = useState<SelectableTier>('standard')
  const [withRun, setWithRun] = useState(false)

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

  const currency = (pricing?.currency?.toUpperCase() as BillingCurrency) || 'USD'
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

  const runMonthly = useMemo(
    () => getModuleAmount('run', annual ? 'annual' : 'monthly', currency) / (annual ? 12 : 1),
    [annual, currency]
  )

  const selectedPlanMonthly = planMonthly(tier)
  const basketKnown = selectedPlanMonthly !== null
  const totalMonthly = basketKnown ? selectedPlanMonthly + (withRun ? runMonthly : 0) : null
  const totalAnnual = totalMonthly !== null ? Math.round(totalMonthly * 12) : null

  const priceCell = (value: number | null) =>
    value === null ? '—' : formatPlanPrice(Math.round(value), currency)

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
            Pick a plan, add Run if you are running campaigns, and check out once. Find is in
            every plan.
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

            {/* ── The one add-on ───────────────────────────────────────── */}
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">2. Add-on</h2>
              <Card className={withRun ? 'border-primary/50 ring-1 ring-primary/20' : ''}>
                <CardContent className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Megaphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{MODULES.run.name}</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {MODULES.run.summary}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {MODULES.run.contains.map((line) => (
                            <li key={line} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-semibold">
                        {formatPlanPrice(Math.round(runMonthly), currency)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <Button
                        variant={withRun ? 'default' : 'outline'}
                        onClick={() => setWithRun((v) => !v)}
                      >
                        {withRun ? 'In your basket' : 'Add Run'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                {withRun && (
                  <div className="flex items-center justify-between">
                    <span>Run</span>
                    <span>{priceCell(runMonthly)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold">
                  {priceCell(totalMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>

              {annual && totalAnnual !== null && (
                <p className="text-xs text-muted-foreground">
                  {formatPlanPrice(totalAnnual, currency)} billed annually, {Math.round(ANNUAL_DISCOUNT * 100)}%
                  off the whole basket.
                </p>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  {getPlanLimits(tier).seats} seat{getPlanLimits(tier).seats === 1 ? '' : 's'} included ·
                  extra seats {formatPlanPrice(getSeatAmount(currency), currency)}/mo each.
                </p>
                <p>
                  {getPlanLimits(tier).monthlyUnlocks.toLocaleString()} profile unlocks a month,
                  metered in credits.
                </p>
              </div>

              {withRun && (
                <p className="text-xs text-muted-foreground">
                  Checkout takes the plan. Run is switched on with it and appears on your first
                  invoice - you are not charged twice.
                </p>
              )}

              <Button
                className="w-full"
                disabled={!basketKnown}
                onClick={() => {
                  if (tier === 'free') {
                    router.push('/auth/register')
                    return
                  }
                  // The checkout contract is unchanged: tier + interval.
                  router.push(
                    `/checkout?tier=${tier}&interval=${interval}${withRun ? '&addons=run' : ''}`
                  )
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
  currency: BillingCurrency
  annual: boolean
  credits?: number
}) {
  const Icon = TIER_ICON[tier]
  const limits = getPlanLimits(tier)

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
            {monthly === null ? '—' : formatPlanPrice(monthly, currency)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        {annual && monthly !== null && monthly > 0 && (
          <p className="text-xs text-muted-foreground mt-1">billed annually</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {typeof credits === 'number'
                ? credits.toLocaleString()
                : limits.monthlyCredits.toLocaleString()}{' '}
              credits a month
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{limits.monthlyUnlocks.toLocaleString()} profile unlocks</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {limits.seats} seat{limits.seats === 1 ? '' : 's'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>Find included</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
