'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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
  Receipt
} from 'lucide-react'
import { billingManager, type BillingStatus } from '@/services/billingManager'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { TrialDailyLimitsCard } from '@/components/billing/TrialDailyLimitsCard'

export default function BillingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <BillingContent />
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

function BillingContent() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

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

  const formatCurrency = (amount: number, currency: string = 'AED') => {
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
              <Button onClick={() => handleUpgrade('standard')}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isAdminManaged = status.user?.billing_type === 'admin_managed'
  const isFreeTier = status.plan?.tier === 'free'
  const hasStripeCustomer = status.user?.has_stripe_customer
  const isTrialing = billingManager.isTrialing(status)
  const trialInfo = status.trial_info

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
        </div>

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
                  <span className="text-muted-foreground">
                    . After your trial, you will be charged د.إ199/month for the Standard plan. You can cancel anytime.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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

                {!isFreeTier && (
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
                      onClick={handleManageSubscription}
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
                      onClick={() => handleUpgrade('standard')}
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Upgrade to Premium
                    </Button>
                  )}

                  {status.plan?.status === 'past_due' && hasStripeCustomer && (
                    <Button
                      onClick={handleManageSubscription}
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

                  <div className="pt-2 border-t">
                    <Link
                      href="/billing/invoices"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                      <Receipt className="h-4 w-4" />
                      View invoice history
                    </Link>
                  </div>
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

        {/* Credits */}
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
                used={status.usage.emails_used}
                limit={status.usage.emails_limit}
                label="Email Lookups"
                icon={Mail}
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
                  <li>Call +971 50 123 4567 during business hours</li>
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
              <p>Phone: +971 50 123 4567</p>
              <p>Available Monday - Friday, 9am - 6pm GST</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
