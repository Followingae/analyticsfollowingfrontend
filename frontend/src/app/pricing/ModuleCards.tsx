'use client'

/**
 * Buying Following: one page, from "what is this" to a card, without leaving.
 *
 * WHAT THIS REPLACES. Six clicks and five pages: the marketing site threw the chosen plan
 * away, the platform reset everyone to Standard, a checkout page repeated the same basket a
 * second time, and only THEN was somebody asked to make an account, after they had already
 * been shown the bill. The two most expensive failures in that sequence were both about
 * order, not about screens.
 *
 * THE LEDGER, NOT FOUR CARDS. The first attempt at this page was four equal cards of icon,
 * heading and body text, which is the lazy container: it forces every row to the height of
 * the tallest, it made Run sit in four hundred pixels of nothing while Find was open, and it
 * says "SaaS template" before a word is read. Four full width rows separated by hairlines
 * behave the way the content actually behaves. Opening one pushes the rest down instead of
 * inflating a grid cell, so there is no dead space at any width and no reflow surprise.
 *
 * THE ACCOUNT IS ASKED FOR FIRST, AND ON THIS PAGE. `POST /checkout/create-session` depends
 * on an authenticated team owner, so paying genuinely requires an account. Rather than let a
 * customer discover that after seeing a total, the sign up opens inline the moment they
 * commit, and the card follows immediately. Free is also a lead magnet for the sales team, so
 * an abandoned payment that leaves an account behind is worth more than a clean bounce.
 *
 * RULES INHERITED FROM THE OLD PAGE, BOTH KEPT.
 *  1. Never print a price the server did not name. Figures come from the live pricing
 *     response in the currency that response states, and a module whose fee is genuinely a
 *     negotiation says so rather than inventing a number.
 *  2. Never print a limit the server does not enforce. Allowances come from PLAN_LIMITS,
 *     which mirrors app/core/plans.py.
 *
 * Nothing here claims a customer, a logo or a benchmark, because none are confirmed as usable
 * and an invented one on a pricing page is a lie with a price attached.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Rocket, Wallet, Handshake, Check, ArrowRight, Plus, Minus, Loader2, AlertCircle,
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
  normalizePlanTier,
  unlockGatesForTier,
  unlockSentence,
  type BillingCurrency,
  type PlanTier,
} from '@/config/planPricing'

type ModuleKey = 'find' | 'run' | 'mor' | 'manage'

/**
 * The four jobs, in the customer's words.
 *
 * Copied from the marketing site's platform.ts, which is copied from the backend, so a brand
 * reads the same sentences on following.ae and here. The same product described twice in two
 * voices is how somebody decides they have misunderstood it.
 */
const MODULES: {
  key: ModuleKey
  name: string
  icon: typeof Search
  line: string
  contains: string[]
  /** 'plan' opens the tier chooser. 'addon' is bought here. 'quoted' is a conversation. */
  kind: 'plan' | 'addon' | 'quoted'
}[] = [
  {
    key: 'find',
    name: 'Find',
    icon: Search,
    kind: 'plan',
    line: 'Who should I work with? Search creators, read numbers that are actually measured, build a shortlist.',
    contains: [
      'Browse by category, city and follower band, free',
      'Unlock a creator and get 30 days of their full analytics',
      'Engagement measured against views, not against followers',
      'Post level analytics on any single piece of content',
      'Shortlists you can name, sort and export',
    ],
  },
  {
    key: 'run',
    name: 'Run',
    icon: Rocket,
    kind: 'addon',
    line: 'Make it happen. Post a brief, take priced offers back, award the ones you want, run it to delivery.',
    contains: [
      'Write a brief and send it only to creators you choose',
      'Creators reply with a price, not an application',
      'Compare offers side by side on price, reach and reliability',
      'Awarding locks each price and creates every deliverable with a due date',
      'Approvals, change requests and reminders as a date approaches',
      'Committed, owed and settled on one screen the whole way through',
    ],
  },
  {
    key: 'mor',
    name: 'Merchant of Record',
    icon: Wallet,
    kind: 'quoted',
    line: 'One invoice instead of forty. You pay Following once, we pay every creator, and you watch each payout move.',
    contains: [
      'Switched on per campaign, at the point of awarding',
      'One invoice from Following for the whole campaign',
      'We pay each creator as their work is approved',
      'Every payout status on the screen you approved the work on',
      'One supplier on your books instead of a list of individuals',
    ],
  },
  {
    key: 'manage',
    name: 'Manage',
    icon: Handshake,
    kind: 'quoted',
    line: 'Do it for me. Our team sources, negotiates, runs and reports, and you watch it happen.',
    contains: [
      'Strategy, sourcing and negotiation handled by your account manager',
      'The campaign screen, read only: who is on it, what is approved, what it cost',
      'Bring your own creators and we will run them',
      'A service charge on payouts, agreed with you and itemised',
      'Find, Run and settlement all included',
    ],
  },
]

const TIERS: PlanTier[] = ['free', 'standard', 'premium']

interface PricingResponse {
  currency?: string
  pricing?: Record<string, { pricing?: Record<string, { amount?: number; price_id?: string }> }>
}

export function ModuleCards() {
  const router = useRouter()
  const params = useSearchParams()
  const accountRef = useRef<HTMLDivElement | null>(null)

  // The visitor's choice from the marketing site, honoured. The page used to hardcode
  // Standard, so anybody who clicked Premium was quietly moved down a tier.
  const [tier, setTier] = useState<PlanTier>(() => normalizePlanTier(params.get('tier')))
  const [annual, setAnnual] = useState(params.get('interval') === 'annual')
  const [open, setOpen] = useState<ModuleKey | null>('find')

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

  const planMonthly = (t: PlanTier): number | null => {
    const node = pricing?.pricing?.[t]?.pricing
    if (!node) return null
    const raw = annual ? node.annual?.amount : node.monthly?.amount
    if (typeof raw !== 'number') return null
    return annual ? Math.round(raw / 12) : raw
  }

  const runMonthly = useMemo(() => {
    const amount = getModuleAmount('run', annual ? 'annual' : 'monthly', currency)
    if (amount === null) return null
    return annual ? Math.round(amount / 12) : amount
  }, [annual, currency])

  const money = (n: number | null) =>
    n === null || !currency ? NO_PRICE : formatPlanPrice(n, currency)

  // Only the plan. `POST /checkout/create-session` accepts a tier and an interval and
  // nothing else, so adding a module to this figure would quote a number nobody is charged.
  const totalMonthly = planMonthly(tier)

  const priceOf = (m: (typeof MODULES)[number]): string => {
    if (m.key === 'find') {
      return tier === 'free' ? 'Free' : `${money(planMonthly(tier))} a month`
    }
    if (m.key === 'run') return `${money(runMonthly)} a month`
    return 'Quoted'
  }

  /** Everything the person is buying, in one sentence, for the commitment bar. */
  const summary = tier === 'free'
    ? 'Free'
    : `${tier[0].toUpperCase()}${tier.slice(1)}`

  const startStripe = async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/checkout/create-session`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            tier,
            billing_interval: annual ? 'annual' : 'monthly',
            success_url: `${window.location.origin}/welcome?subscription=success`,
            // Cancelling used to land an existing customer on a signup form. Back to
            // where they were, with their choice still made.
            cancel_url: `${window.location.origin}/pricing?tier=${tier}&interval=${annual ? 'annual' : 'monthly'}`,
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.checkout_url) {
        setError(
          res.status === 503
            ? 'This plan cannot be bought online right now. Email support@following.ae and we will set it up today.'
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

  const commit = () => {
    if (tier === 'free') {
      router.push('/auth/register')
      return
    }
    if (signedIn) {
      void startStripe()
      return
    }
    // The account is asked for here, before a total is ever presented as a demand.
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
            <a href="mailto:support@following.ae?subject=Pricing">Ask us</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-40 pt-20 sm:pt-28">

      <h1 className="max-w-[20ch] text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
        Four things Following does.
      </h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
        Take one, take all four. Find is where everybody starts and it is in every plan,
        including the free one. The rest switch on when you need them.
      </p>

      <div className="mt-10 flex items-center gap-3">
        <span className={`text-sm ${annual ? 'text-muted-foreground' : 'font-medium'}`}>Monthly</span>
        <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Pay yearly" />
        <span className={`text-sm ${annual ? 'font-medium' : 'text-muted-foreground'}`}>Yearly</span>
        <span className="text-sm text-muted-foreground">
          {Math.round(ANNUAL_DISCOUNT * 100)}% less, paid yearly
        </span>
      </div>

      {/* The ledger. Rows, not cards: opening one pushes the rest down rather than
          inflating a grid cell, so there is no dead space at any width. */}
      <div className="mt-14 border-t">
        {MODULES.map((m) => {
          const isOpen = open === m.key
          return (
            <div key={m.key} className="border-b">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : m.key)}
                aria-expanded={isOpen}
                className="group flex w-full items-baseline gap-5 py-7 text-left
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-ring focus-visible:ring-offset-4
                           focus-visible:ring-offset-background"
              >
                <m.icon
                  className={`mt-1 h-5 w-5 shrink-0 transition-colors
                              ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
                    {m.name}
                  </span>
                  <span className="mt-2 block max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
                    {m.line}
                  </span>
                  <span aria-hidden className="mt-2 block text-sm font-medium tabular-nums sm:hidden">
                    {pricing ? priceOf(m) : <Skeleton className="h-4 w-24" />}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4">
                  <span className="hidden text-right text-sm font-medium tabular-nums sm:block">
                    {pricing ? priceOf(m) : <Skeleton className="h-4 w-24" />}
                  </span>
                  {/* On a phone the row is too narrow for a right hand column, and hiding
                      the price there hid the one fact the visitor came for. */}
                  <span className="sr-only sm:hidden">{pricing ? priceOf(m) : ''}</span>
                  {isOpen
                    ? <Minus className="h-4 w-4 text-muted-foreground" />
                    : <Plus className="h-4 w-4 text-muted-foreground" />}
                </span>
              </button>

              {/* The one authored motion on the page. Exponential ease-out, from a
                  resting state that is already legible. */}
              <div
                className="grid transition-[grid-template-rows] duration-500
                           [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                           motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="pb-8 pl-10">
                    <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-8">
                      {m.contains.map((c) => (
                        <li key={c} className="flex gap-2.5 text-[15px] leading-relaxed text-muted-foreground">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>

                    {m.kind === 'plan' && (
                      <PlanChooser
                        tier={tier}
                        onPick={setTier}
                        money={money}
                        planMonthly={planMonthly}
                        loading={!pricing}
                      />
                    )}

                    {m.kind === 'addon' && (
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Button variant="outline" asChild>
                          <a href="mailto:support@following.ae?subject=Adding%20Run">
                            Add Run to your account
                          </a>
                        </Button>
                        <span className="max-w-[42ch] text-xs leading-relaxed text-muted-foreground">
                          Run is switched on for an existing account rather than bought in this
                          basket, so it is not in the total below.
                        </span>
                      </div>
                    )}

                    {m.kind === 'quoted' && (
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Button variant="outline" asChild>
                          <a href={`mailto:support@following.ae?subject=${encodeURIComponent(m.name)}`}>
                            Talk to us about {m.name}
                          </a>
                        </Button>
                        <span className="max-w-[40ch] text-xs leading-relaxed text-muted-foreground">
                          Priced against the size of the campaign, so we quote it rather than
                          guess at it.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Making the account, here, before any total is presented as a demand. */}
      {showAccount && !signedIn && (
        <div ref={accountRef} className="mt-12">
          <InlineAccount
            summary={summary}
            total={money(totalMonthly)}
            onDone={() => { setSignedIn(true); void startStripe() }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <p className="mt-12 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
        {getPlanLimits(tier).seats} seat{getPlanLimits(tier).seats === 1 ? '' : 's'}.{' '}
        {unlockSentence(unlockGatesForTier(tier))} More people means the next plan up, or a
        word with us.
      </p>

      {/* What they have chosen and the one thing to do about it. A bar with a rule,
          not another card floating over the page. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur
                      supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{summary}</p>
            <p className="text-xl font-semibold tabular-nums">
              {!pricing
                ? <Skeleton className="h-6 w-28" />
                : tier === 'free'
                  ? 'No card needed'
                  : <>{money(totalMonthly)}<span className="text-sm font-normal text-muted-foreground"> a month</span></>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {signedIn === false && tier !== 'free' && !showAccount && (
              <Link href="/auth/login" className="text-sm text-muted-foreground underline underline-offset-4">
                Sign in
              </Link>
            )}
            <Button size="lg" onClick={commit} disabled={!pricing || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tier === 'free'
                ? 'Start free'
                : signedIn
                  ? 'Go to payment'
                  : showAccount ? 'Your details, below' : 'Continue'}
              {!busy && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * How much Find you want, which is all a plan has ever been.
 *
 * It lives inside Find rather than above the page: three columns of allowances at the top
 * asks a stranger to size something they have not seen yet.
 */
function PlanChooser({
  tier, onPick, money, planMonthly, loading,
}: {
  tier: PlanTier
  onPick: (t: PlanTier) => void
  money: (n: number | null) => string
  planMonthly: (t: PlanTier) => number | null
  loading: boolean
}) {
  return (
    <div className="mt-7">
      <p className="text-sm font-medium">How much do you need?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {TIERS.map((t) => {
          const limits = getPlanLimits(t)
          const active = tier === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => onPick(t)}
              aria-pressed={active}
              className={`rounded-xl border p-4 text-left transition-colors
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-ring focus-visible:ring-offset-2
                          ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">{t}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </span>
              <span className="mt-1 block text-sm tabular-nums">
                {loading
                  ? <Skeleton className="h-4 w-16" />
                  : t === 'free'
                    ? 'No card'
                    : <>{money(planMonthly(t))}<span className="text-muted-foreground"> /mo</span></>}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {limits.includedUnlocks} creators a month
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Managed accounts are set in your agreement rather than bought here.{' '}
        <a href="mailto:support@following.ae?subject=Managed" className="underline underline-offset-2">
          Talk to us
        </a>
        .
      </p>
    </div>
  )
}

/**
 * The account, made in place.
 *
 * Three fields, because paying needs an account on the server and discovering that after a
 * total has been shown is the single most expensive moment in the old funnel. It says what
 * happens next, so nobody wonders whether this button charges them.
 */
function InlineAccount({
  summary, total, onDone,
}: {
  summary: string
  total: string
  onDone: () => void
}) {
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
      const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
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
      await res.json().catch(() => ({}))

      // Sign in through the normal path rather than hand-writing tokens: registration can
      // answer 200 with no usable token, and a half written session lands somebody on a
      // dashboard that bounces them straight back out.
      const { authService } = await import('@/services/authService')
      const signedIn = await authService.login({ email: email.trim(), password })
      if (!signedIn.success) {
        setError(
          <>
            We could not sign you in. If you already have an account on that email,{' '}
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
    <form onSubmit={submit} className="rounded-2xl border p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-0.01em]">Make your account</h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
        Your card comes next, on Stripe. Nothing is charged until you confirm it there. You are
        taking {summary}, at {total} a month.
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

      <Button type="submit" size="lg" className="mt-6" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue to payment
        {!busy && <ArrowRight className="ml-1.5 h-4 w-4" />}
      </Button>
    </form>
  )
}
