'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Check, ArrowRight, Users, Zap, ShieldCheck, Percent, Sparkles } from 'lucide-react'
import { API_CONFIG, ENDPOINTS } from '@/config/api'

// ──────────────────────────────────────────────
// Types
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
  pricing: {
    monthly?: TierPricing
    annual?: TierPricing
  }
  topup_discount?: number
}

interface PricingResponse {
  success: boolean
  pricing: Record<string, PricingTier>
  currency: string
  annual_discount: number
  notes: Record<string, string>
}

// ──────────────────────────────────────────────
// Static plan metadata (not from API)
// ──────────────────────────────────────────────

const PLAN_META: Record<string, {
  teamSize: number
  profiles: number
  features: string[]
  cta: string
  href: (interval: string) => string
  trialBadge?: boolean
  trialText?: string
}> = {
  free: {
    teamSize: 1,
    profiles: 5,
    features: [
      '125 credits per month',
      '1 team member',
      '5 profile unlocks per month',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Get started',
    href: () => '/auth/register',
  },
  standard: {
    teamSize: 2,
    profiles: 500,
    features: [
      '8,750 credits per month',
      '2 team members',
      '500 profile unlocks per month',
      'Full analytics suite',
      'Priority email support',
      'Bulk exports',
    ],
    cta: 'Start Free Trial',
    href: (interval) => `/checkout?plan=standard&interval=${interval}`,
    trialBadge: true,
    trialText: 'Start with 7 days free. No charge until trial ends.',
  },
  premium: {
    teamSize: 5,
    profiles: 2000,
    features: [
      '25,000 credits per month',
      '5 team members',
      '2,000 profile unlocks per month',
      'Full analytics suite',
      'Dedicated account manager',
      '20% credit top-up discount',
      'API access',
    ],
    cta: 'Start premium',
    href: (interval) => `/checkout?plan=premium&interval=${interval}`,
  },
}

// ──────────────────────────────────────────────
// Feature comparison data
// ──────────────────────────────────────────────

const COMPARISON_ROWS: { label: string; free: string; standard: string; premium: string }[] = [
  { label: 'Monthly credits', free: '125', standard: '8,750', premium: '25,000' },
  { label: 'Team members', free: '1', standard: '2', premium: '5' },
  { label: 'Profile unlocks / month', free: '5', standard: '500', premium: '2,000' },
  { label: 'Post analytics', free: 'Limited', standard: 'Unlimited', premium: 'Unlimited' },
  { label: 'Discovery search', free: 'Basic', standard: 'Advanced', premium: 'Advanced' },
  { label: 'Bulk export', free: '--', standard: 'CSV & JSON', premium: 'CSV & JSON' },
  { label: 'Campaign tracking', free: '--', standard: 'Included', premium: 'Included' },
  { label: 'Credit top-up discount', free: '--', standard: '--', premium: '20%' },
  { label: 'Support', free: 'Community', standard: 'Priority email', premium: 'Dedicated manager' },
]

// ──────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.pricing}`)
      if (res.ok) {
        const data: PricingResponse = await res.json()
        setPricing(data)
      }
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  const displayPrice = (tier: string): string => {
    if (!pricing) return '--'
    const t = pricing.pricing[tier]
    if (!t) return '--'

    if (annual && t.pricing.annual) {
      return `$${t.pricing.annual.monthly_equivalent}`
    }
    return `$${t.pricing.monthly?.amount ?? 0}`
  }

  const annualTotal = (tier: string): string | null => {
    if (!annual || !pricing) return null
    const t = pricing.pricing[tier]
    if (!t?.pricing.annual) return null
    return `$${t.pricing.annual.amount.toLocaleString()} billed annually`
  }

  const savings = (tier: string): number | null => {
    if (!annual || !pricing) return null
    const t = pricing.pricing[tier]
    return t?.pricing.annual?.savings ?? null
  }

  const interval = annual ? 'annual' : 'monthly'

  // ──────────────────────────────────────────
  // Skeleton loading state
  // ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-12">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[420px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 text-muted-foreground text-base max-w-lg">
            Start free. Upgrade when your team needs more profiles, credits, or seats.
          </p>

          {/* ── Billing toggle ── */}
          <div className="mt-8 flex items-center gap-3">
            <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              aria-label="Toggle annual billing"
            />
            <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {annual && (
              <Badge
                variant="secondary"
                className="ml-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0"
              >
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* ─── Free ─── */}
          <PlanCard
            tier="free"
            price={displayPrice('free')}
            annualNote={null}
            savingsAmount={null}
            highlighted={false}
            interval={interval}
            router={router}
          />

          {/* ─── Standard (highlighted) ─── */}
          <PlanCard
            tier="standard"
            price={displayPrice('standard')}
            annualNote={annualTotal('standard')}
            savingsAmount={savings('standard')}
            highlighted
            interval={interval}
            router={router}
          />

          {/* ─── Premium ─── */}
          <PlanCard
            tier="premium"
            price={displayPrice('premium')}
            annualNote={annualTotal('premium')}
            savingsAmount={savings('premium')}
            highlighted={false}
            interval={interval}
            router={router}
          />
        </div>

        {/* ── Feature comparison ── */}
        <section className="mt-20">
          <h2 className="text-xl font-semibold mb-6">Compare plans</h2>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-1/4">Feature</th>
                  <th className="text-left py-3 px-4 font-medium w-1/4">Free</th>
                  <th className="text-left py-3 px-4 font-medium w-1/4">Standard</th>
                  <th className="text-left py-3 px-4 font-medium w-1/4">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                    <td className="py-3 px-4">{formatCell(row.free)}</td>
                    <td className="py-3 px-4">{formatCell(row.standard)}</td>
                    <td className="py-3 px-4">{formatCell(row.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked list */}
          <div className="sm:hidden space-y-4">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="border-b pb-3 last:border-0">
                <p className="text-xs text-muted-foreground mb-1.5">{row.label}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Free</span>
                    {formatCell(row.free)}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Standard</span>
                    {formatCell(row.standard)}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Premium</span>
                    {formatCell(row.premium)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ / bottom note ── */}
        <section className="mt-16 pb-8">
          <p className="text-sm text-muted-foreground">
            All plans include access to the discovery page, creator analytics, and proposal system.
            Credits reset each billing cycle. Need a custom arrangement?{' '}
            <a href="mailto:support@following.ae" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Contact us
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Plan card component
// ──────────────────────────────────────────────

function PlanCard({
  tier,
  price,
  annualNote,
  savingsAmount,
  highlighted,
  interval,
  router,
}: {
  tier: string
  price: string
  annualNote: string | null
  savingsAmount: number | null
  highlighted: boolean
  interval: string
  router: ReturnType<typeof useRouter>
}) {
  const meta = PLAN_META[tier]
  if (!meta) return null

  const icon = tier === 'free' ? Zap : tier === 'standard' ? Users : ShieldCheck
  const Icon = icon

  return (
    <Card
      className={`relative flex flex-col transition-shadow duration-200 ease-out ${
        highlighted
          ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
          : ''
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-6 flex items-center gap-1.5">
          <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5">
            Most popular
          </Badge>
          {meta.trialBadge && (
            <Badge className="bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs px-2.5 py-0.5 border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              7-Day Free Trial
            </Badge>
          )}
        </div>
      )}

      <CardHeader className={`pb-4 ${highlighted ? 'pt-8' : ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{tier}</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{price}</span>
          {tier !== 'free' && (
            <span className="text-sm text-muted-foreground">/mo</span>
          )}
        </div>

        {annualNote && (
          <p className="text-xs text-muted-foreground mt-1">{annualNote}</p>
        )}

        {savingsAmount && (
          <Badge
            variant="secondary"
            className="w-fit mt-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0"
          >
            Save ${savingsAmount.toLocaleString()}/yr
          </Badge>
        )}

        {meta.trialText && (
          <p className="text-xs text-muted-foreground mt-2">{meta.trialText}</p>
        )}

        {tier === 'premium' && (
          <div className="flex items-center gap-1.5 mt-2">
            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">20% off credit top-ups</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <ul className="space-y-2.5">
          {meta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2 pb-6">
        <Button
          className={`w-full min-h-[44px] ${
            meta.trialBadge
              ? 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 shadow-sm'
              : ''
          }`}
          variant={highlighted && !meta.trialBadge ? 'default' : meta.trialBadge ? undefined : 'outline'}
          onClick={() => router.push(meta.href(interval))}
        >
          {meta.trialBadge && <Sparkles className="h-4 w-4 mr-1" />}
          {meta.cta}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatCell(value: string) {
  if (value === '--') {
    return <span className="text-muted-foreground">--</span>
  }
  return <span>{value}</span>
}
