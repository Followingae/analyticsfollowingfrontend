'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { formatPlanLabel, formatMonthlyPlanPrice, getBillingCurrency, hydrateBillingCurrency } from '@/config/planPricing'
import {
  CreditCard,
  Package,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  TrendingUp,
  Wallet,
  Users,
  Mail,
  Image,
  Zap,
  Receipt,
  Download,
  FileText,
  PiggyBank,
  Plus,
  History,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
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
import { billingManager, type BillingStatus } from '@/services/billingManager'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { TrialDailyLimitsCard } from '@/components/billing/TrialDailyLimitsCard'
import { PremiumFeatureGate } from '@/components/ui/premium-feature-gate'
import { brandPoolApi } from '@/services/faAdminApi'
import { PlanScreen } from '@/components/commercial/PlanScreen'
import { SubscriptionLines } from '@/components/commercial/SubscriptionLines'
import { resolveModules, isManagedAccount } from '@/hooks/useCommercialAccount'
import { InvoicesPanel } from '@/components/billing/InvoicesPanel'
import { useAccountInvoices, money } from '@/components/billing/useAccountInvoices'

export default function BillingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        {/* useSearchParams (tab deep-links) requires a Suspense boundary */}
        <Suspense>
          <BillingContent />
        </Suspense>
      </BrandUserInterface>
    </AuthGuard>
  )
}

function UsageBar({ used, limit, label, icon: Icon }: { used: number; limit: number; label: string; icon: React.ElementType }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const isHigh = percentage >= 80
  const isFull = percentage >= 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className={`font-medium ${isFull ? 'text-red-600 dark:text-red-400' : isHigh ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-red-500' : isHigh ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// 'plan' is the plan screen: every module as a row, and the ONE place tier
// limits are shown. It lives here rather than at its own /upgrade address,
// because the place you buy a module should be the place you can see what you
// already pay for.
const BILLING_TABS = ['subscription', 'plan', 'invoices', 'cashback-pool'] as const

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useEnhancedAuth()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  // Confirmation gate for money-mutating actions (Stripe checkout / portal).
  const [confirmAction, setConfirmAction] = useState<
    { type: 'upgrade'; tier: string } | { type: 'manage' } | null
  >(null)

  // Both invoice sources, merged, fetched once for the whole page: the "what I
  // owe" figure in the header and the Invoices tab are the same numbers, so
  // they are the same request. Hooks run before the early returns below.
  const invoiceData = useAccountInvoices(!!user)

  // Prices come from the single source of truth (src/config/planPricing.ts),
  // which mirrors the backend. Never hardcode a plan price here.
  const PLAN_LABELS: Record<string, string> = {
    standard: formatPlanLabel('standard'),
    premium: formatPlanLabel('premium'),
  }

  // Deep-linkable tabs: /billing?tab=cashback-pool (the old standalone
  // /cashback-pool page redirects here).
  const tabParam = searchParams.get('tab') ?? 'subscription'
  const activeTab = (BILLING_TABS as readonly string[]).includes(tabParam) ? tabParam : 'subscription'

  // Stripe topup returns land on /billing?tab=cashback-pool&topup=success|cancelled
  useEffect(() => {
    const topup = searchParams.get('topup')
    if (topup === 'success') toast.success('Pool topped up successfully!')
    if (topup === 'cancelled') toast.info('Topup cancelled')
  }, [searchParams])

  useEffect(() => {
    fetchBillingData()

    // Refresh when tab becomes visible (user switches back to billing tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBillingData()
      }
    }

    // Refresh when credits are spent elsewhere (e.g. profile unlock)
    const handleCreditChange = () => {
      fetchBillingData()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('credit-balance-changed', handleCreditChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('credit-balance-changed', handleCreditChange)
    }
  }, [user])

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      if (!user) {
        setStatus(null)
        return
      }

      const billingStatus = await billingManager.getBillingStatus()
      // Adopt the currency the backend actually charges in, so static upsell
      // copy can never quote a different currency than the invoice.
      hydrateBillingCurrency(billingStatus?.plan?.currency)
      setStatus(billingStatus)
    } catch (error) {
      toast.error('Failed to load billing information')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: string) => {
    if (status?.user?.billing_type === 'admin_managed') {
      toast.info('Please contact support to change your plan')
      window.location.href = 'mailto:support@following.ae?subject=Plan%20Upgrade%20Request'
      return
    }

    try {
      await billingManager.createCheckoutSession(tier)
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      toast.error('Failed to start checkout process')
    }
  }

  const handleManageSubscription = async () => {
    if (status?.user?.billing_type === 'admin_managed') {
      toast.error('Portal access is only available for online payment users')
      return
    }

    if (!status || !status.plan || status.plan.tier === 'free' || status.plan.status === 'none') {
      toast.info('Please upgrade to a paid plan to access the billing portal')
      return
    }

    try {
      setLoadingPortal(true)
      await billingManager.openCustomerPortal(status?.portal_url)
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal')
    } finally {
      setLoadingPortal(false)
    }
  }

  // Request wrappers: open a confirmation before any action that leaves for
  // Stripe. Admin-managed / free / no-subscription branches don't hit Stripe,
  // so they run their original (toast-only) behavior directly — no dialog.
  const requestUpgrade = (tier: string) => {
    if (status?.user?.billing_type === 'admin_managed') {
      handleUpgrade(tier)
      return
    }
    setConfirmAction({ type: 'upgrade', tier })
  }

  const requestManageSubscription = () => {
    if (status?.user?.billing_type === 'admin_managed') {
      handleManageSubscription()
      return
    }
    if (!status || !status.plan || status.plan.tier === 'free' || status.plan.status === 'none') {
      handleManageSubscription()
      return
    }
    setConfirmAction({ type: 'manage' })
  }

  const runConfirmedAction = () => {
    if (confirmAction?.type === 'upgrade') handleUpgrade(confirmAction.tier)
    else if (confirmAction?.type === 'manage') handleManageSubscription()
    setConfirmAction(null)
  }

  const confirmDialog = (
    <AlertDialog open={confirmAction !== null} onOpenChange={(open: boolean) => { if (!open) setConfirmAction(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmAction?.type === 'upgrade' ? 'Continue to checkout?' : 'Open billing portal?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmAction?.type === 'upgrade'
              ? `You'll be taken to Stripe to subscribe to the ${PLAN_LABELS[confirmAction.tier] ?? confirmAction.tier} plan. You can review the total before you're charged.`
              : "This opens the Stripe billing portal, where you can update your payment method, change your plan, or cancel your subscription."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={runConfirmedAction}>
            {confirmAction?.type === 'upgrade' ? 'Continue to Stripe' : 'Open portal'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const getStatusBadge = (planStatus: string) => {
    switch (planStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
      case 'trialing':
        return <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200">Trial</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Past Due</Badge>
      case 'admin_managed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Admin Managed</Badge>
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Cancelled</Badge>
      default:
        return <Badge variant="outline">No Subscription</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      enterprise: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
    return <Badge className={tierColors[tier] || tierColors.free}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
  }

  const formatCurrency = (amount: number, currency: string = getBillingCurrency()) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  // No billing data — show a minimal state
  if (!status || !status.plan || !status.credits || !status.usage) {
    return (
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">Get started with a plan to unlock analytics features.</p>
              <Button onClick={() => requestUpgrade('standard')}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
        {confirmDialog}
      </div>
    )
  }

  const isAdminManaged = status.user?.billing_type === 'admin_managed'
  // The new commercial surfaces read managed-ness the wider way (billing_type
  // OR subscription status), because both spellings exist in live data and a
  // managed account must never be shown a card form on either of them.
  const managedAccount = isManagedAccount(status)
  const accountModules = resolveModules(status, {
    isSuperAdmin: user?.role === 'super_admin' || user?.role === 'admin',
  })
  const isFreeTier = status.plan?.tier === 'free'
  const hasStripeCustomer = status.user?.has_stripe_customer
  const isTrialing = billingManager.isTrialing(status)
  const trialInfo = status.trial_info

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-ds-title">Billing</h1>
          <p className="text-ds-body text-muted-foreground mt-ds-2">
            What you pay, what you owe, and what you have.
          </p>
        </div>

        {/* The page is long. This is the answer to the three questions someone
            opens it with, before they have to choose a tab. */}
        <AtAGlance
          payLabel={
            isAdminManaged
              ? `${(status.plan?.tier ?? 'free').charAt(0).toUpperCase()}${(status.plan?.tier ?? 'free').slice(1)} · invoiced`
              : formatPlanLabel(status.plan?.tier ?? 'free', '')
          }
          paySub={isAdminManaged ? 'Billed by arrangement, not by card' : 'Current plan'}
          owe={invoiceData}
          onSeeInvoices={() => router.replace('/billing?tab=invoices', { scroll: false })}
          haveValue={
            status.usage.profiles_limit > 0
              ? `${Math.max(status.usage.profiles_limit - status.usage.profiles_used, 0).toLocaleString()}`
              : '—'
          }
          haveSub="Profile unlocks left this month"
        />

        <Tabs
          value={activeTab}
          onValueChange={(v) => router.replace(v === 'subscription' ? '/billing' : `/billing?tab=${v}`, { scroll: false })}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="plan">Plan &amp; modules</TabsTrigger>
            {/* Invoices is for EVERYONE. It used to be hidden behind
                !isAdminManaged, which meant the only clients we actually
                invoice were the only ones who could not see their invoices.
                A managed account still sees no card form and no checkout
                button — that distinction is made per control, below, not by
                removing the record of what they have been billed. */}
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            {!isAdminManaged && <TabsTrigger value="cashback-pool">Cashback Pool</TabsTrigger>}
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Trial Banner */}
            {isTrialing && trialInfo && (
              <TrialBanner
                trialEnd={trialInfo.trial_end ? String(trialInfo.trial_end) : null}
                trialDurationDays={trialInfo.trial_duration_days}
                dailyUsage={trialInfo.limits}
                dailyCreditLimit={trialInfo.daily_credit_limit}
              />
            )}

            {/* Trial Daily Limits */}
            {isTrialing && trialInfo?.limits && (
              <TrialDailyLimitsCard
                limits={trialInfo.limits}
                totalCreditsAllowed={trialInfo.total_credits_allowed}
                dailyCreditLimit={trialInfo.daily_credit_limit}
              />
            )}

            {/* Trial End Info */}
            {isTrialing && trialInfo?.trial_end && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-violet-500 shrink-0" />
                    <p>
                      <span className="font-medium">Your trial ends on{' '}
                        {new Date(
                          typeof trialInfo.trial_end === 'number'
                            ? trialInfo.trial_end * 1000
                            : trialInfo.trial_end
                        ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      {!isAdminManaged && (
                        <span className="text-muted-foreground">
                          . After your trial, you will be charged {formatMonthlyPlanPrice('standard')} for the Standard plan. You can cancel anytime.
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Every line itemised, each cancellable on its own, with the
                modules this account does not have in the same list. */}
            <SubscriptionLines status={status} managed={managedAccount} owns={accountModules} />

            {/* Plan & Status */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>{status.plan?.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        {getStatusBadge(status.plan?.status ?? 'none')}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tier</p>
                        {getTierBadge(status.plan?.tier ?? 'free')}
                      </div>
                    </div>

                    {!isFreeTier && !isAdminManaged && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(status.plan?.price_per_month ?? 0, status.plan?.currency ?? 'AED')}
                          <span className="text-sm font-normal text-muted-foreground">/month</span>
                        </p>
                      </div>
                    )}

                    {(status.plan?.features?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Features</p>
                        <ul className="space-y-1.5">
                          {status.plan.features?.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                              <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isAdminManaged && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-800 dark:text-blue-200">Admin Managed Billing</p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Your billing is managed by our team. Contact support for changes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {status.plan?.status === 'past_due' && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">Payment Past Due</p>
                            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                              Please update your payment method to continue using all features.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      {hasStripeCustomer && status.plan?.status === 'active' && !isAdminManaged && (
                        <Button
                          onClick={requestManageSubscription}
                          disabled={loadingPortal}
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          {loadingPortal ? 'Opening...' : 'Manage Subscription'}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}

                      {isFreeTier && !isAdminManaged && (
                        <Button
                          onClick={() => requestUpgrade('standard')}
                          className="flex items-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          Upgrade to Standard
                        </Button>
                      )}

                      {status.plan?.status === 'past_due' && hasStripeCustomer && (
                        <Button
                          onClick={requestManageSubscription}
                          variant="destructive"
                          disabled={loadingPortal}
                        >
                          Update Payment Method
                        </Button>
                      )}

                      {isAdminManaged && (
                        <Button
                          onClick={() => window.location.href = 'mailto:support@following.ae?subject=Billing%20Inquiry'}
                          className="flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          Contact Support
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe / Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {status.stripe ? (
                    <div className="space-y-4">
                      {status.stripe.payment_method && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium">
                            {(status.stripe?.payment_method?.brand ?? 'Card').charAt(0).toUpperCase() + (status.stripe?.payment_method?.brand ?? 'card').slice(1)} ending in {status.stripe?.payment_method?.last4 ?? '****'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {status.stripe?.payment_method?.exp_month}/{status.stripe?.payment_method?.exp_year}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Billing Interval</p>
                        <p className="font-medium capitalize">{status.stripe?.billing_interval || 'Monthly'}</p>
                      </div>

                      {status.stripe?.current_period_end && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {status.stripe?.cancel_at_period_end ? 'Cancels On' : 'Next Billing Date'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{formatDate(status.stripe?.current_period_end ?? 0)}</p>
                          </div>
                        </div>
                      )}

                      {status.stripe?.cancel_at_period_end && (
                        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-200">Subscription Cancelling</p>
                              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                                Your subscription will end on {formatDate(status.stripe?.current_period_end ?? 0)}. You can reactivate anytime before then.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      {isAdminManaged ? (
                        <p>Billing is managed by your administrator.</p>
                      ) : isFreeTier ? (
                        <div>
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No payment method on file.</p>
                          <p className="text-sm mt-1">Upgrade to add a payment method.</p>
                        </div>
                      ) : (
                        <p>No payment details available.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Credits — hidden for admin-managed clients (no amounts shown) */}
            {!isAdminManaged && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Credits
                </CardTitle>
                <CardDescription>Your credit balance and usage this billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">{status.credits.current_balance.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Earned This Cycle</p>
                    <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                      +{status.credits.total_earned_this_cycle.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Spent This Cycle</p>
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                      -{status.credits.total_spent_this_cycle.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-6 pt-6 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lifetime Earned</p>
                    <p className="font-medium">{status.credits.lifetime_earned.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lifetime Spent</p>
                    <p className="font-medium">{status.credits.lifetime_spent.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage This Month
                </CardTitle>
                <CardDescription>Your resource usage for the current billing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <UsageBar
                    used={status.usage.profiles_used}
                    limit={status.usage.profiles_limit}
                    label="Profile Unlocks"
                    icon={Users}
                  />
                  <UsageBar
                    used={status.usage.posts_used}
                    limit={status.usage.posts_limit}
                    label="Post Analyses"
                    icon={Image}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Managed Users Info */}
            {isAdminManaged && (
              <Card>
                <CardHeader>
                  <CardTitle>Plan Management</CardTitle>
                  <CardDescription>Your subscription is managed by our admin team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p>To make changes to your subscription plan:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Contact your account manager</li>
                      <li>Email support@following.ae with your request</li>
                    </ul>
                    <div className="bg-muted rounded-lg p-3 mt-4">
                      <p className="font-medium">Benefits of Admin Managed Billing:</p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>Custom payment terms and invoicing</li>
                        <li>Dedicated account support</li>
                        <li>Flexible billing arrangements</li>
                        <li>Priority customer service</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Contact our support team for billing assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Email: support@following.ae</p>
                  <p>Available Monday - Friday, 9am - 6pm GST</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan & modules — the plan screen. Managed accounts get the same
              screen, with Request in place of every price. */}
          <TabsContent value="plan" className="space-y-6">
            <PlanScreen />
          </TabsContent>

          {/* Invoices — one list, both sources, every account type. */}
          <TabsContent value="invoices" className="space-y-6">
            <InvoicesPanel data={invoiceData} />
          </TabsContent>

          {/* Cashback Pool Tab — hidden for admin-managed clients */}
          {!isAdminManaged && (
            <TabsContent value="cashback-pool" className="space-y-6">
              <CashbackPoolTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
      {confirmDialog}
    </div>
  )
}

// ─── At a glance ────────────────────────────────────────────────────────────
//
// Three questions, answered above the tabs, so the page can be read without
// being navigated: what I pay, what I owe, what I have.
//
// "What I owe" is the only one that can fail, and it says so. While the two
// invoice sources are still loading it shows a skeleton; if a source did not
// answer it shows an em dash and the word "unavailable", never 0 — a zero here
// would read as "you owe us nothing", which is a thing we cannot claim on
// behalf of a request that never came back.

function GlanceCell({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="space-y-ds-1 px-ds-4 py-ds-3">
      <p className="text-ds-overline text-muted-foreground">{label}</p>
      <div className="text-ds-heading">{children}</div>
      {sub && <p className="text-ds-caption text-muted-foreground">{sub}</p>}
    </div>
  )
}

function AtAGlance({
  payLabel,
  paySub,
  owe,
  onSeeInvoices,
  haveValue,
  haveSub,
}: {
  payLabel: string
  paySub: string
  owe: ReturnType<typeof useAccountInvoices>
  onSeeInvoices: () => void
  haveValue: string
  haveSub: string
}) {
  const totals = owe.outstandingByCurrency
  const entries = totals ? Object.entries(totals) : []
  const overdueCount = owe.invoices.filter((i) => i.status === 'overdue').length

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <GlanceCell label="What you pay" sub={paySub}>
          {payLabel}
        </GlanceCell>

        <GlanceCell
          label="What you owe"
          sub={
            owe.loading ? undefined
            : totals === null ? 'Some invoices did not load'
            : overdueCount > 0 ? `${overdueCount} overdue`
            : entries.length === 0 ? 'Nothing outstanding'
            : 'Across your open invoices'
          }
        >
          {owe.loading ? (
            <Skeleton className="h-6 w-28" />
          ) : totals === null ? (
            <span className="text-muted-foreground">—</span>
          ) : entries.length === 0 ? (
            <span>{money(0, 'AED')}</span>
          ) : (
            <span className={overdueCount > 0 ? 'text-red-600 dark:text-red-400' : undefined}>
              {entries.map(([ccy, amount]) => money(amount, ccy)).join(' · ')}
            </span>
          )}
        </GlanceCell>

        <GlanceCell label="What you have" sub={haveSub}>
          {haveValue}
        </GlanceCell>
      </CardContent>
      <div className="border-t px-ds-4 py-ds-2">
        <Button variant="link" size="sm" className="h-auto p-0 text-ds-body-sm" onClick={onSeeInvoices}>
          See every invoice
          <ArrowUpRight className="ml-ds-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}

// ─── Cashback Pool Tab ──────────────────────────────────────────────────────


function CashbackPoolTab() {
  const { hasRole } = useEnhancedAuth()
  const isFreeTier = hasRole('brand_free')
  const [balance, setBalance] = useState<any>(null)
  const [poolTransactions, setPoolTransactions] = useState<any[]>([])
  const [poolCampaigns, setPoolCampaigns] = useState<any[]>([])
  const [poolLoading, setPoolLoading] = useState(true)

  useEffect(() => {
    if (isFreeTier) { setPoolLoading(false); return }
    async function load() {
      try {
        const [b, t, c] = await Promise.all([
          brandPoolApi.balance(),
          brandPoolApi.transactions(10, 0),
          brandPoolApi.campaigns(),
        ])
        // Tolerate either { success, data } or a raw payload.
        const balancePayload = b?.data ?? b
        const txPayload = t?.data ?? t
        const campaignsPayload = c?.data ?? c
        if (balancePayload && typeof balancePayload === 'object') setBalance(balancePayload)
        setPoolTransactions(Array.isArray(txPayload) ? txPayload : (txPayload?.transactions ?? []))
        setPoolCampaigns(Array.isArray(campaignsPayload) ? campaignsPayload : (campaignsPayload?.campaigns ?? []))
      } catch (e: any) {
        toast.error(e?.message || e?.detail || 'Failed to load pool data')
      } finally {
        setPoolLoading(false)
      }
    }
    load()
  }, [isFreeTier])

  const fmt = (cents: number) => `⃃ ${(cents / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`

  if (isFreeTier) {
    return (
      <PremiumFeatureGate
        featureName="Cashback Pool"
        headline="Influencer Cashback Pool"
        description="Fund a cashback pool to power influencer campaigns. Influencers earn commission on every purchase they drive through your brand."
        requiredTier="Standard"
        highlights={[
          { icon: Wallet, title: "AED cashback wallet", description: "Top up your pool in AED and allocate funds across multiple influencer campaigns simultaneously." },
          { icon: TrendingUp, title: "Real-time tracking", description: "Monitor available balance, reserved funds, and distributed payouts with live transaction history." },
          { icon: PiggyBank, title: "Campaign funding", description: "Automatically reserve and distribute funds as influencers complete deliverables and drive conversions." },
        ]}
      />
    )
  }

  if (poolLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[110px]" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Manage your AED cashback pool for influencer campaigns</p>
        <div className="flex gap-2">
          <Link href="/cashback-pool/transactions">
            <Button variant="outline" size="sm"><History className="h-4 w-4 mr-2" />All Transactions</Button>
          </Link>
          <Link href="/cashback-pool/topup">
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Top Up</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance ? fmt(balance.available_cents ?? 0) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
            <Lock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance ? fmt(balance.reserved_cents ?? 0) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distributed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance ? fmt(balance.distributed_cents ?? 0) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funded</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance ? fmt(balance.total_funded_cents ?? 0) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {poolTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet. Top up your pool to get started.</p>
          ) : (
            <div className="space-y-3">
              {poolTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {t.amount_cents > 0 ? (
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{t.description || t.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.amount_cents > 0 ? "text-green-500" : "text-red-500"}`}>
                      {t.amount_cents > 0 ? "+" : ""}{fmt(t.amount_cents)}
                    </p>
                    <Badge variant="outline" className="text-xs">{t.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funded Campaigns */}
      {poolCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funded Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poolCampaigns.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <Badge variant="secondary" className="text-xs">{c.campaign_type}</Badge>
                  </div>
                  <Badge>{c.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
