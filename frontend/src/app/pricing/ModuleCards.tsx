'use client'

/**
 * What we sell, as four things we do rather than three sizes of subscription.
 *
 * THE OLD PAGE SOLD SHELF SPACE. It opened with the word "Pricing" over "1. Your plan",
 * "2. Add-ons" and "Your basket", which is an order form: it assumes the deciding already
 * happened somewhere else and asks you to configure the result. Nothing on it said what
 * Following does, and three equal columns of allowances asked a stranger to work out which
 * size of a thing they had not seen yet they needed.
 *
 * So the page leads with the four modules, because those are the four sentences a customer
 * would actually use: find creators, run the campaign, pay everyone through one invoice, or
 * hand the whole thing to us. The plan is demoted to what it really is, which is how MUCH
 * Find you get, and it appears inside Find rather than above everything.
 *
 * EXPANDING ON HOVER, PINNED ON CLICK. Hover alone is a desktop-only affordance and reads as
 * broken on a phone, so the detail also opens on tap and on keyboard focus, and a click pins
 * it open so somebody can read it without holding the mouse still. The height animates with
 * a 0fr to 1fr grid row rather than a measured pixel height: no layout thrash, no jump when
 * the content is a different length, and it collapses correctly under reduced motion.
 *
 * TWO RULES INHERITED FROM THE OLD PAGE, BOTH KEPT.
 *
 *  1. Never print a price the server did not name. Plan figures come from the live pricing
 *     response and are rendered in the currency THAT response states. A module whose price is
 *     genuinely a negotiation says "Quoted" rather than inventing a number, because the fee
 *     for Merchant of Record and the percentage for Manage are marked in the backend as
 *     placeholders that are not agreed prices.
 *  2. Never print a limit the server does not enforce. Every allowance comes from
 *     PLAN_LIMITS, which mirrors app/core/plans.py.
 *
 * AND ONE THING FIXED WHILE HERE. The page used to open on Standard no matter which plan the
 * visitor clicked on the marketing site, so somebody who chose Premium was silently moved
 * down a tier and had to notice. It now reads the choice out of the URL.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Rocket, Wallet, Handshake, Check, ArrowRight, ChevronDown, AlertCircle,
} from 'lucide-react'
import { API_CONFIG, ENDPOINTS } from '@/config/api'
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

type SelectableTier = PlanTier
type ModuleKey = 'find' | 'run' | 'mor' | 'manage'

/**
 * The module copy, in the customer's words.
 *
 * Copied from the marketing site's platform.ts, which is itself copied from the backend, so
 * a brand reads the same sentences on following.ae and here. Two descriptions of the same
 * product in two voices is how a customer decides they have misunderstood something.
 */
const MODULES: {
  key: ModuleKey
  name: string
  icon: typeof Search
  summary: string
  contains: string[]
}[] = [
  {
    key: 'find',
    name: 'Find',
    icon: Search,
    summary: 'Who should I work with? Search creators, read their real numbers, build a shortlist.',
    contains: [
      'Browse by category, city and follower band, free',
      'Unlock a creator and get 30 days of their full analytics',
      'Engagement measured against views, not just followers',
      'Post level analytics on any single piece of content',
      'Shortlists you can name, sort and export',
    ],
  },
  {
    key: 'run',
    name: 'Run',
    icon: Rocket,
    summary: 'Make it happen. Post a brief, get priced offers back, award the ones you want, run it to delivery.',
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
    summary: 'One invoice instead of forty. You pay Following once, we pay every creator, you watch each payout move.',
    contains: [
      'Switched on per campaign, at the point of awarding',
      'One invoice from Following for the whole campaign',
      'We pay each creator as their work is approved',
      'Every payout status on the screen you approved the work on',
      'One supplier on your books instead of a list of individuals',
      'Included at no extra charge on Managed',
    ],
  },
  {
    key: 'manage',
    name: 'Manage',
    icon: Handshake,
    summary: 'Do it for me. Our team sources, negotiates, runs and reports, and you watch it happen.',
    contains: [
      'Strategy, sourcing and negotiation handled by your account manager',
      'The campaign screen, read only: who is on it, what is approved, what it cost',
      'Bring your own creators and we will run them',
      'A service charge on payouts, agreed with you and itemised',
      'Find, Run and settlement all included',
    ],
  },
]

const TIERS: { key: SelectableTier; name: string; sub: string }[] = [
  { key: 'free', name: 'Free', sub: 'Search before you spend' },
  { key: 'standard', name: 'Standard', sub: 'A brand running its own campaigns' },
  { key: 'premium', name: 'Premium', sub: 'A team at volume' },
]

interface PricingResponse {
  currency?: string
  pricing?: Record<string, {
    pricing?: Record<string, { amount?: number; price_id?: string }>
  }>
}

export function ModuleCards() {
  const router = useRouter()
  const params = useSearchParams()

  // The visitor's choice from the marketing site, honoured. Anything unrecognised falls to
  // Standard, which is what the page used to assume for everybody.
  const [tier, setTier] = useState<SelectableTier>(() => normalizePlanTier(params.get('tier')))
  const [annual, setAnnual] = useState(params.get('interval') === 'annual')
  const [open, setOpen] = useState<ModuleKey | null>('find')
  const [pinned, setPinned] = useState<ModuleKey | null>(null)

  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.pricing}`)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!alive) return
        // Quote in the currency the server charges in, never an assumed one.
        hydrateBillingCurrency(data.currency)
        setPricing(data)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => { alive = false }
  }, [])

  const currency = resolveCurrency(pricing?.currency) as BillingCurrency | null

  const planAmount = (t: SelectableTier): number | null => {
    const node = pricing?.pricing?.[t]?.pricing
    if (!node) return null
    const amount = annual ? node.annual?.amount : node.monthly?.amount
    return typeof amount === 'number' ? amount : null
  }

  /** What a plan costs per month, so the three tiers are comparable at a glance. */
  const perMonth = (t: SelectableTier): string => {
    const amount = planAmount(t)
    if (amount === null || !currency) return NO_PRICE
    return formatPlanPrice(annual ? Math.round(amount / 12) : amount, currency)
  }

  const runAmount = useMemo(
    () => getModuleAmount('run', annual ? 'annual' : 'monthly', currency),
    [annual, currency],
  )

  const priceLine: Record<ModuleKey, string> = {
    find: tier === 'free' ? 'Free, and in every plan' : `From ${perMonth('standard')} a month`,
    run: runAmount !== null && currency
      ? `${formatPlanPrice(annual ? Math.round(runAmount / 12) : runAmount, currency)} a month, on any plan`
      : 'On any plan',
    mor: 'Quoted, per campaign',
    manage: 'Quoted, per client',
  }

  const isOpen = (k: ModuleKey) => pinned === k || (pinned === null && open === k)

  const total = planAmount(tier)
  const totalLabel = total === null || !currency
    ? NO_PRICE
    : formatPlanPrice(annual ? Math.round(total / 12) : total, currency)

  const limits = getPlanLimits(tier)

  if (failed) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">

      {/* Not the word "Pricing" over a form. What the thing does, then what it costs. */}
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Four things Following does.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Take one, or take all four. Find is where everybody starts and it is in every plan,
          including the free one. Everything else switches on when you need it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className={`text-sm font-medium ${annual ? 'text-muted-foreground' : ''}`}>
            Monthly
          </span>
          <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
          <span className={`text-sm font-medium ${annual ? '' : 'text-muted-foreground'}`}>
            Annual
          </span>
          <Badge variant="secondary">
            Save {Math.round(ANNUAL_DISCOUNT * 100)}% paying yearly
          </Badge>
        </div>
      </header>

      {/* The four modules. */}
      <div className="mt-12 grid items-start gap-4 lg:grid-cols-2">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.key}
            module={m}
            price={priceLine[m.key]}
            open={isOpen(m.key)}
            onHover={() => setOpen(m.key)}
            onToggle={() => setPinned((p) => (p === m.key ? null : m.key))}
            loading={!pricing}
          >
            {m.key === 'find' && (
              <PlanChooser
                tier={tier}
                onPick={setTier}
                perMonth={perMonth}
                loading={!pricing}
              />
            )}
            {(m.key === 'mor' || m.key === 'manage') && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild>
                  <a href={`mailto:support@following.ae?subject=${encodeURIComponent(m.name)}`}>
                    Talk to us about {m.name}
                  </a>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Priced against the size of the campaign, so we quote rather than guess.
                </span>
              </div>
            )}
          </ModuleCard>
        ))}
      </div>

      {/* What you are actually buying today, and the one button. */}
      <div className="mt-10 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {tier === 'free' ? 'Starting on' : 'You are taking'}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              <span className="capitalize">{tier}</span>
              <span className="ml-2 align-middle text-base font-normal text-muted-foreground">
                {tier === 'free' ? 'no card needed' : `${totalLabel} a month`}
              </span>
            </p>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {limits.seats} seat{limits.seats === 1 ? '' : 's'}. {unlockSentence(unlockGatesForTier(tier))}
            </p>
            {annual && tier !== 'free' && total !== null && currency && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPlanPrice(total, currency)} billed once a year.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <Button
              size="lg"
              className="rounded-2xl"
              disabled={!pricing}
              onClick={() => {
                if (tier === 'free') {
                  router.push('/auth/register')
                  return
                }
                router.push(`/checkout?tier=${tier}&interval=${annual ? 'annual' : 'monthly'}`)
              }}
            >
              {tier === 'free'
                ? 'Start free'
                : `Continue with ${tier.charAt(0).toUpperCase()}${tier.slice(1)}`}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already with us?{' '}
              <Link href="/billing?tab=plan" className="underline underline-offset-2">
                Change plan in billing
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * One module. Closed it is a name, a sentence and a price; open it is the whole answer.
 *
 * The detail is hidden by default because four modules with six bullets each is thirty lines
 * of list on arrival, which is the thing that made the old page exhausting. Hidden is not the
 * same as missing: it opens on hover, on tap and on focus, and stays open once clicked.
 */
function ModuleCard({
  module: m, price, open, onHover, onToggle, loading, children,
}: {
  module: { key: string; name: string; icon: typeof Search; summary: string; contains: string[] }
  price: string
  open: boolean
  onHover: () => void
  onToggle: () => void
  loading: boolean
  children?: React.ReactNode
}) {
  const Icon = m.icon
  return (
    <div
      onMouseEnter={onHover}
      className={`group rounded-2xl border bg-card p-6 transition-all duration-200
                  motion-safe:hover:-translate-y-0.5 sm:p-7
                  ${open ? 'border-primary/40 shadow-sm' : 'hover:border-primary/25'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 text-left focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4
                   focus-visible:ring-offset-background rounded-xl"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border
                      transition-colors
                      ${open ? 'border-primary/30 bg-primary/10 text-primary'
                             : 'bg-muted/50 text-muted-foreground group-hover:text-foreground'}`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight">{m.name}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200
                          ${open ? 'rotate-180' : ''}`}
            />
          </span>
          <span className="mt-1.5 block text-[15px] leading-relaxed text-muted-foreground">
            {m.summary}
          </span>
          <span className="mt-3 block text-sm font-medium">
            {loading ? <Skeleton className="h-4 w-40" /> : price}
          </span>
        </span>
      </button>

      {/* 0fr to 1fr animates height with no measuring and no jump. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out
                   motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <ul className="mt-5 space-y-2.5 border-t pt-5">
            {m.contains.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * How much Find you want, which is all a plan has ever been.
 *
 * It lives inside Find rather than above the page because a tier is a quantity of one module,
 * not a description of the product. Three columns at the top of a pricing page ask a stranger
 * to size something they have not seen yet.
 */
function PlanChooser({
  tier, onPick, perMonth, loading,
}: {
  tier: SelectableTier
  onPick: (t: SelectableTier) => void
  perMonth: (t: SelectableTier) => string
  loading: boolean
}) {
  return (
    <div className="mt-6 border-t pt-5">
      <p className="text-sm font-medium">How much do you need?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {TIERS.map((t) => {
          const limits = getPlanLimits(t.key)
          const active = tier === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onPick(t.key)}
              aria-pressed={active}
              className={`rounded-xl border p-4 text-left transition-colors
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-ring focus-visible:ring-offset-2
                          ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.name}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="mt-1 text-sm tabular-nums">
                {loading
                  ? <Skeleton className="h-4 w-16" />
                  : t.key === 'free'
                    ? 'No card'
                    : <>{perMonth(t.key)}<span className="text-muted-foreground"> /mo</span></>}
              </div>
              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {limits.includedUnlocks} creator{limits.includedUnlocks === 1 ? '' : 's'} a month
              </div>
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
