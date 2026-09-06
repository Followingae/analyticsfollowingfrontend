'use client'

/**
 * Confirm and pay. Not a second shopping trip.
 *
 * THE MISTAKE THIS FIXES. following.ae already sells the plans: a visitor reads them, picks
 * one, and clicks it. Landing on the platform and being made to choose a plan AGAIN, and to
 * browse four modules on top of that, asks somebody who has already decided to decide twice.
 * The marketing site now sends the plan through in the link, and this page confirms it and
 * takes the money.
 *
 * TWO DOORS, TWO JOBS, ONE PAGE.
 *  - Arriving WITH a plan (from following.ae, or back from a cancelled payment) is a
 *    confirmation: the plan, what it costs, what it includes, and the way to pay. Changing it
 *    stays possible and quiet, because somebody who wants Premium instead should not have to
 *    go back to another website to say so.
 *  - Arriving WITHOUT one (the sidebar, billing, or running out of credits) is a choice, so
 *    the three plans are the first thing on the page.
 *
 * MODULES ARE INFORMATION HERE, NOT A SECOND SELECTION. Find is the plan. Run is switched on
 * for an existing account and nothing in this basket can charge for it. Merchant of Record
 * and Manage are quoted per campaign and per client. Presenting all four as things to tick
 * implied a basket that does not exist.
 *
 * THE ACCOUNT IS ASKED FOR BEFORE THE CARD, ON THIS PAGE. `POST /checkout/create-session`
 * depends on an authenticated team owner, so paying genuinely requires an account. The old
 * funnel let people discover that AFTER showing them a total, which is the worst possible
 * moment to ask for anything. Free is also a lead magnet, so an abandoned payment that leaves
 * an account behind is worth more than a clean bounce.
 *
 * Two rules this page must never break: no price appears that the server did not name, and no
 * allowance appears that the backend does not enforce.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check, ArrowRight, Loader2, AlertCircle, Rocket, Wallet, Handshake,
} from 'lucide-react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { tokenManager } from '@/utils/tokenManager'
import {
  ANNUAL_DISCOUNT,
  NO_PRICE,
  formatPlanPrice,
  resolveCurrency,
  hydrateBillingCurrency,
  getModuleAmount,
  getPlanLimits,
  unlockGatesForTier,
  unlockSentence,
  type BillingCurrency,
  type PlanTier,
} from '@/config/planPricing'

const ALL: PlanTier[] = ['free', 'standard', 'premium']

const BLURB: Record<PlanTier, string> = {
  free: 'Search before you spend',
  standard: 'For a brand running its own campaigns',
  premium: 'For a team working at volume',
}

/** What the plan actually buys, in the customer's words. Four lines, not a feature dump. */
const INCLUDES: Record<PlanTier, string[]> = {
  free: [
    'Search every creator in the region, free',
    'Engagement measured against views, not followers',
  ],
  standard: [
    'Engagement measured against views, not followers',
    'Full analytics on any creator you unlock, for 30 days',
    'Post level analytics on any single piece of content',
    'Shortlists you can name, sort and export',
  ],
  premium: [
    'Engagement measured against views, not followers',
    'Full analytics on any creator you unlock, for 30 days',
    'Post level analytics on any single piece of content',
    'The only plan you can buy past its monthly ceiling',
  ],
}

interface PricingResponse {
  currency?: string
  pricing?: Record<string, { pricing?: Record<string, { amount?: number }> }>
}

export function ModuleCards() {
  const router = useRouter()
  const params = useSearchParams()
  const accountRef = useRef<HTMLDivElement | null>(null)

  const asked = params.get('tier')
  const preselected = asked === 'standard' || asked === 'premium' ? (asked as PlanTier) : null

  const [tier, setTier] = useState<PlanTier>(preselected ?? 'standard')
  const [annual, setAnnual] = useState(params.get('interval') === 'annual')
  const [choosing, setChoosing] = useState(!preselected)
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [showAccount, setShowAccount] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSignedIn(Boolean(tokenManager.getTokenSync() || localStorage.getItem('auth_tokens')))
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.pricing}`)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!alive) return
        hydrateBillingCurrency(data.currency)
        setPricing(data)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => { alive = false }
  }, [])

  const currency = resolveCurrency(pricing?.currency) as BillingCurrency | null

  const perMonth = (t: PlanTier): number | null => {
    const node = pricing?.pricing?.[t]?.pricing
    if (!node) return null
    const raw = annual ? node.annual?.amount : node.monthly?.amount
    if (typeof raw !== 'number') return null
    return annual ? Math.round(raw / 12) : raw
  }
  const yearTotal = (t: PlanTier): number | null => {
    const raw = pricing?.pricing?.[t]?.pricing?.annual?.amount
    return typeof raw === 'number' ? raw : null
  }
  const money = (n: number | null) =>
    n === null || !currency ? NO_PRICE : formatPlanPrice(n, currency)

  const runMonthly = getModuleAmount('run', 'monthly', currency)
  const limits = getPlanLimits(tier)
  const label = `${tier[0].toUpperCase()}${tier.slice(1)}`

  const startStripe = async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/checkout/create-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tier,
          billing_interval: annual ? 'annual' : 'monthly',
          success_url: `${window.location.origin}/welcome?subscription=success`,
          // Cancelling used to land an existing customer on a signup form. Back to the plan
          // they were looking at, still chosen.
          cancel_url: `${window.location.origin}/pricing?tier=${tier}&interval=${annual ? 'annual' : 'monthly'}`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.checkout_url) {
        setError(
          res.status === 503
            ? 'This plan cannot be bought online right now. Tell us and we will set it up today.'
            : data?.detail || 'We could not open the payment page. Try again in a moment.',
        )
        setBusy(false)
        return
      }
      window.location.href = data.checkout_url
    } catch {
      setError('We could not reach our servers. Check your connection and try again.')
      setBusy(false)
    }
  }

  const go = () => {
    if (tier === 'free') return router.push('/auth/register')
    if (signedIn) return void startStripe()
    setShowAccount(true)
    requestAnimationFrame(() =>
      accountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
  }

  if (failed) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">We could not load our prices</h1>
        <p className="mt-2 text-muted-foreground">
          Rather than show you a number we might not charge, we would rather show you nothing.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="https://following.ae/contact">Ask us</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">

        {/* ── What you are getting ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
            {preselected && !choosing ? <>You picked {label}.</> : <>Pick your plan.</>}
          </h1>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            {preselected && !choosing
              ? 'Everything below is included from the moment you pay, and you can change it later from billing.'
              : 'Every plan includes the whole creator database. The plan decides how many of them you can open.'}
          </p>

          {choosing ? (
            <div className="mt-10 space-y-2">
              {ALL.map((t) => {
                const active = tier === t
                const l = getPlanLimits(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left
                                transition-colors focus-visible:outline-none focus-visible:ring-2
                                focus-visible:ring-ring focus-visible:ring-offset-2
                                ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border
                                      ${active ? 'border-primary bg-primary text-primary-foreground' : ''}`}>
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium capitalize">{t}</span>
                      <span className="block text-sm text-muted-foreground">{BLURB[t]}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold tabular-nums">
                        {!pricing ? <Skeleton className="h-5 w-20" />
                          : t === 'free' ? 'Free' : money(perMonth(t))}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {l.includedUnlocks} creators / mo
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <ul className="mt-10 space-y-3">
                {INCLUDES[tier].map((f) => (
                  <li key={f} className="flex gap-3 text-[15px] leading-relaxed">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="flex gap-3 text-[15px] leading-relaxed">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="font-semibold tabular-nums">{limits.includedUnlocks}</strong>{' '}
                    creators a month, {limits.seats} seat{limits.seats === 1 ? '' : 's'}
                  </span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setChoosing(true)}
                className="mt-6 text-sm text-muted-foreground underline underline-offset-4
                           hover:text-foreground"
              >
                Wanted a different plan?
              </button>
            </>
          )}

          {/* The rest of what Following does. Stated, not sold again: none of it can be added
              to this basket, so offering it as a choice here would be a lie. */}
          <div className="mt-12 border-t pt-8">
            <p className="text-sm font-medium">When you need more than the database</p>
            <div className="mt-4 space-y-3.5">
              <Extra icon={Rocket} name="Run"
                     price={runMonthly !== null ? `${money(runMonthly)} a month` : 'On any plan'}
                     line="Brief creators, take priced offers back, run the campaign to delivery." />
              <Extra icon={Wallet} name="Merchant of Record" price="Quoted"
                     line="One invoice instead of forty. You pay us once, we pay every creator." />
              <Extra icon={Handshake} name="Manage" price="Quoted"
                     line="Our team sources, negotiates and runs it. You watch it happen." />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              These are switched on for an existing account, so they are not in the total.{' '}
              <a href="https://following.ae/contact" className="underline underline-offset-2">
                Talk to us
              </a>
              .
            </p>
          </div>
        </div>

        {/* ── What it costs, and the way to pay ────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium capitalize">{tier}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${annual ? 'text-muted-foreground' : 'font-medium'}`}>
                  Monthly
                </span>
                <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Pay yearly" />
                <span className={`text-xs ${annual ? 'font-medium' : 'text-muted-foreground'}`}>
                  Yearly
                </span>
              </div>
            </div>

            <div className="mt-6">
              {!pricing ? (
                <Skeleton className="h-14 w-44" />
              ) : tier === 'free' ? (
                <p className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em]">Free</p>
              ) : (
                <>
                  <p className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                    {money(perMonth(tier))}
                    <span className="ml-1.5 align-baseline text-base font-normal text-muted-foreground">
                      a month
                    </span>
                  </p>
                  {annual && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {money(yearTotal(tier))} billed once a year, saving{' '}
                      {Math.round(ANNUAL_DISCOUNT * 100)}%.
                    </p>
                  )}
                </>
              )}
            </div>

            <Button size="lg" className="mt-7 w-full" onClick={go} disabled={!pricing || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tier === 'free'
                ? 'Start free'
                : signedIn
                  ? 'Go to payment'
                  : showAccount ? 'Your details, below' : 'Continue'}
              {!busy && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>

            {tier !== 'free' && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Card handled by Stripe. Nothing is charged until you confirm it there.
              </p>
            )}

            {signedIn === false && !showAccount && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already with us?{' '}
                <Link href="/auth/login" className="underline underline-offset-4">Sign in</Link>
              </p>
            )}
            {signedIn && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Changing plan?{' '}
                <Link href="/billing?tab=plan" className="underline underline-offset-4">
                  Manage it in billing
                </Link>
              </p>
            )}

            <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              {unlockSentence(unlockGatesForTier(tier))}
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>

      {showAccount && !signedIn && (
        <div ref={accountRef} className="mt-16">
          <InlineAccount
            label={label}
            total={money(perMonth(tier))}
            onDone={() => { setSignedIn(true); void startStripe() }}
          />
        </div>
      )}
    </div>
  )
}

function Extra({
  icon: Icon, name, price, line,
}: { icon: typeof Rocket; name: string; price: string; line: string }) {
  return (
    <div className="flex gap-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{price}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{line}</p>
      </div>
    </div>
  )
}

/**
 * The account, made here, before the card.
 *
 * Paying needs an account on the server, and discovering that after a total has been shown
 * was the single most expensive moment in the old funnel.
 */
function InlineAccount({
  label, total, onDone,
}: { label: string; total: string; onDone: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<React.ReactNode>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) return setError('Tell us your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('That email does not look right.')
    if (password.length < 8) return setError('Use at least 8 characters.')

    setBusy(true)
    try {
      await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          language: 'en',
        }),
      })
      // Sign in through the normal path: registration can answer 200 with no usable token,
      // and a half written session lands somebody on a dashboard that bounces them out.
      const { authService } = await import('@/services/authService')
      const ok = await authService.login({ email: email.trim(), password })
      if (!ok.success) {
        setError(
          <>
            We could not sign you in. If that email already has an account,{' '}
            <Link href="/auth/login" className="underline underline-offset-2">sign in</Link>{' '}
            and we will bring you straight back.
          </>,
        )
        setBusy(false)
        return
      }
      onDone()
    } catch {
      setError('We could not reach our servers. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-2xl border p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-0.01em]">Make your account</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Then your card, on Stripe. You are taking {label}, at {total} a month.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                 autoComplete="name" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password" placeholder="At least 8 characters" className="mt-1.5" />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue to payment
        {!busy && <ArrowRight className="ml-1.5 h-4 w-4" />}
      </Button>
    </form>
  )
}
