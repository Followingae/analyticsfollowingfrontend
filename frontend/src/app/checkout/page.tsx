'use client'

/**
 * Checkout: the last screen before Stripe.
 *
 * Three things were wrong here and are fixed:
 *
 *  1. The interval was thrown away. /pricing handed this page ?interval=annual
 *     and this page created a monthly session anyway (billingManager pins
 *     billing_interval to 'monthly'). Someone who chose Annual was billed
 *     monthly. This page now posts to /api/v1/checkout/create-session itself
 *     with the interval the customer actually picked. The backend has always
 *     accepted it: CreateCheckoutRequest.billing_interval is
 *     Literal["monthly", "annual"].
 *
 *  2. The price shown was a frontend constant in whatever currency an env var
 *     happened to name. It is now the amount the SERVER returns from
 *     GET /api/v1/checkout/pricing, in the currency that response names. If
 *     that call fails we show the failure and disable the button. We do not
 *     guess at a number someone is about to be charged.
 *
 *  3. A blank Stripe price ID for the active currency used to surface as a 503
 *     after the click. The pricing response carries price_id, so a plan that
 *     cannot be bought today says so before the click.
 *
 * Loading, failed and ready are three different screens, on purpose.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { tokenManager } from '@/utils/tokenManager'
import {
  ANNUAL_DISCOUNT,
  formatPlanPrice,
  getPlanLimits,
  hydrateBillingCurrency,
  postsAllowanceLabel,
  resolveCurrency,
  unlockGatesForTier,
  unlockSentence,
} from '@/config/planPricing'

type PaidTier = 'standard' | 'premium'
type Interval = 'monthly' | 'annual'

interface IntervalPricing {
  /** NET, exclusive of VAT. Never the figure to put above the pay button. */
  amount: number
  interval: string
  currency?: string
  price_id?: string
  savings?: number
  monthly_equivalent?: number
  /** VAT and the VAT-inclusive total, computed server-side from `amount` in
   *  app/core/tax.py. Optional because an older backend does not send them,
   *  and in that case this page shows no VAT line at all rather than one it
   *  worked out itself. A wrong VAT line here is worse than none. */
  vat?: number
  gross?: number
  monthly_equivalent_gross?: number
}

interface PricingResponse {
  pricing: Record<string, { name: string; credits: number; pricing: Record<string, IntervalPricing> }>
  currency: string
  /** "VAT 5%" and the rate behind it, from app/core/tax.py. Optional so an
   *  older backend degrades to no VAT line rather than to a made-up one. */
  vat?: { label: string; percent: string; prices_exclude_vat: boolean; note: string }
}

const TIER_NAME: Record<PaidTier, string> = { standard: 'Standard', premium: 'Premium' }

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawTier = (searchParams.get('tier') || '').toLowerCase()
  const tier: PaidTier | null = rawTier === 'standard' || rawTier === 'premium' ? rawTier : null
  const interval: Interval = searchParams.get('interval') === 'annual' ? 'annual' : 'monthly'

  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setState('ready')
      } catch {
        if (!cancelled) setState('failed')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // The currency this response named, never a literal. A hardcoded 'AED' here
  // would have rendered a USD amount with a Dirham in front of it the moment
  // the server was still charging in USD.
  const currency = resolveCurrency(pricing?.currency)

  /** The words beside the VAT amount, from the server. Null when the server
   *  did not say, in which case the breakdown falls back to a plain "VAT". */
  const vatLabel = pricing?.vat?.label ?? null

  const line = useMemo<IntervalPricing | null>(() => {
    if (!tier || !pricing) return null
    return pricing.pricing?.[tier]?.pricing?.[interval] ?? null
  }, [tier, pricing, interval])

  /** True once Stripe has a price object for this tier, interval and currency. */
  const purchasable = Boolean(line?.price_id)

  const startCheckout = async () => {
    if (!tier || !purchasable) return
    setError(null)

    // Checkout is an authenticated action: the session is created against the
    // signed-in team. Someone arriving cold goes to signup carrying their choice,
    // not to a dead end.
    const token = tokenManager.getTokenSync() || localStorage.getItem('access_token')
    const stored = localStorage.getItem('auth_tokens')
    if (!token && !stored) {
      router.push(`/auth/register?plan=${tier}&interval=${interval}`)
      return
    }

    setRedirecting(true)
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.createSession}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            tier,
            // The whole point of this page: the interval the customer chose.
            billing_interval: interval,
            success_url: `${window.location.origin}/dashboard?subscription=success`,
            cancel_url: `${window.location.origin}/pricing?subscription=cancelled`,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Your session has expired. Please sign in again and we will bring you back here.')
        } else if (response.status === 503) {
          setError('This plan cannot be bought online at the moment. Email support@following.ae and we will set it up for you.')
        } else {
          setError(
            data?.detail ||
              'We could not open the payment page. Please try again, or email support@following.ae.'
          )
        }
        setRedirecting(false)
        return
      }

      if (!data?.checkout_url) {
        setError('We could not open the payment page. Please try again in a moment.')
        setRedirecting(false)
        return
      }

      window.location.href = data.checkout_url
    } catch {
      setError('We could not reach our servers. Check your connection and try again.')
      setRedirecting(false)
    }
  }

  // ── A tier we do not sell here ───────────────────────────────────────────
  if (!tier) {
    return (
      <Shell>
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Nothing to check out</h1>
          <p className="text-muted-foreground">
            Pick a plan first and we will bring you straight back here.
          </p>
          <Button onClick={() => router.push('/pricing')}>See the plans</Button>
        </div>
      </Shell>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <Shell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-[220px] rounded-lg" />
        </div>
      </Shell>
    )
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (state === 'failed' || !line) {
    return (
      <Shell>
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">We could not load your price</h1>
          <p className="text-muted-foreground">
            We would rather show you nothing than a number you have not confirmed. Reload, or ask
            us and we will send it over.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@following.ae?subject=Checkout">Ask us</a>
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  const limits = getPlanLimits(tier)
  const gates = unlockGatesForTier(tier)
  const perMonth =
    interval === 'annual'
      ? line.monthly_equivalent ?? Math.round(line.amount / 12)
      : line.amount
  const billedNow = line.amount

  return (
    <Shell>
      <Button variant="ghost" onClick={() => router.push('/pricing')} className="mb-6 -ml-3">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to plans
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">Confirm your plan</h1>
      <p className="mt-2 text-muted-foreground">
        {TIER_NAME[tier]}, billed {interval === 'annual' ? 'annually' : 'monthly'}.
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-6 py-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{TIER_NAME[tier]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Billing</span>
              <span className="font-medium">{interval === 'annual' ? 'Annual' : 'Monthly'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Profile unlocks</span>
              <span className="font-medium">
                {(gates.included ?? 0).toLocaleString()} a month
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Post analyses</span>
              <span className="font-medium">{postsAllowanceLabel(limits.monthlyPosts)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">
                {limits.seats} seat{limits.seats === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-medium">
                {limits.monthlyCredits.toLocaleString()} a month
              </span>
            </div>
          </div>

          {/* The second gate, said plainly before they pay. An unlock needs a
              count under the cap AND the credits to pay for it, and buying
              credits never raises the cap. app/core/plans.py. */}
          <p className="text-sm text-muted-foreground max-w-prose">
            {unlockSentence(gates)} Seats are fixed by the plan, not bought separately.
          </p>

          <Separator />

          {/* The number above the pay button has to be the number Stripe
              charges. `line.amount` is NET, and the checkout session carries a
              5% VAT rate, so showing the net alone understated every card
              charge. Net, VAT and total are shown separately so the client can
              see where the total came from.

              When the backend sends no `gross` (an older deploy), the single
              net line is shown as before rather than a VAT figure invented on
              the client. */}
          {typeof line.gross === 'number' && typeof line.vat === 'number' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                <span>{interval === 'annual' ? 'Subtotal for the year' : 'Subtotal'}</span>
                <span>{formatPlanPrice(line.amount, currency)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                <span>{vatLabel ?? 'VAT'}</span>
                <span>{formatPlanPrice(line.vat, currency)}</span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="font-medium">
                  {interval === 'annual' ? 'Billed today, for the year' : 'Billed monthly'}
                </span>
                <span className="text-2xl font-semibold">
                  {formatPlanPrice(line.gross, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <span className="font-medium">
                {interval === 'annual' ? 'Billed today, for the year' : 'Billed monthly'}
              </span>
              <span className="text-2xl font-semibold">
                {formatPlanPrice(billedNow, currency)}
              </span>
            </div>
          )}

          {interval === 'annual' && (
            <p className="text-sm text-muted-foreground">
              That is {formatPlanPrice(perMonth, currency)} a month
              {typeof line.savings === 'number' && line.savings > 0
                ? `, saving ${formatPlanPrice(line.savings, currency)} against monthly billing.`
                : `, ${Math.round(ANNUAL_DISCOUNT * 100)}% off the monthly price.`}
            </p>
          )}

          {!purchasable && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p>
                This plan is not set up for online payment in {currency} yet. Email{' '}
                <a href="mailto:support@following.ae" className="underline underline-offset-2">
                  support@following.ae
                </a>{' '}
                and we will invoice you and switch it on the same day.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>{error}</p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!purchasable || redirecting}
            onClick={startCheckout}
          >
            {redirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening secure checkout
              </>
            ) : (
              'Continue to payment'
            )}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Payment is taken by Stripe. You can review the full total before you are charged, and
              cancel or change your plan at any time from Billing.
            </p>
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-xl px-6 py-16">{children}</div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
