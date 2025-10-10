"use client"

import { useState, useEffect } from "react"
import { ExternalLink, CreditCard, Users, Calendar, TrendingUp, Activity, Crown, Sparkles, Zap, Shield, ArrowUp, ArrowDown, Check } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/AuthGuard"
import { creditsApiService } from "@/services/creditsApi"
import {
  StripeBillingDashboard,
  StripeTopupOptions,
  CreditTransaction,
} from "@/services/creditsApi"
import { formatCredits, formatCreditDate } from "@/utils/creditUtils"
import { toast } from "sonner"

export default function BillingPage() {
  // Stripe billing state
  const [stripeBillingDashboard, setStripeBillingDashboard] = useState<StripeBillingDashboard | null>(null)
  const [stripeTopupOptions, setStripeTopupOptions] = useState<StripeTopupOptions | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  // Load Stripe billing data
  useEffect(() => {
    const loadStripeBillingData = async () => {
      try {
        setLoading(true)

        // Load Stripe billing data
        const [stripeBillingResult, stripeTopupResult, transactionsResult] = await Promise.allSettled([
          creditsApiService.getStripeBillingDashboard(),
          creditsApiService.getStripeTopupOptions(),
          creditsApiService.getRecentTransactions(5)
        ])

        // Handle Stripe billing dashboard
        if (stripeBillingResult.status === 'fulfilled' && stripeBillingResult.value.success) {
          console.log('🔍 Stripe Billing Dashboard Data:', JSON.stringify(stripeBillingResult.value.data, null, 2))
          setStripeBillingDashboard(stripeBillingResult.value.data)
        } else {
          console.error('❌ Stripe Billing Dashboard Error:', stripeBillingResult)
          toast.error('Failed to load subscription data')
        }

        // Handle Stripe topup options
        if (stripeTopupResult.status === 'fulfilled' && stripeTopupResult.value.success) {
          console.log('🔍 Stripe Topup Options Data:', JSON.stringify(stripeTopupResult.value.data, null, 2))
          setStripeTopupOptions(stripeTopupResult.value.data)
        } else {
          console.error('❌ Stripe Topup Options Error:', stripeTopupResult)
        }

        // Handle recent transactions (optional - don't block if it fails)
        if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success) {
          setRecentTransactions(transactionsResult.value.data || [])
        } else {
          console.warn('⚠️ Transactions data not available')
        }

      } catch (error) {
        console.error('Error loading billing data:', error)
        toast.error('Failed to load billing data')
      } finally {
        setLoading(false)
      }
    }

    loadStripeBillingData()
  }, [])

  // Handle subscription changes
  const handleUpgrade = async (tier: 'standard' | 'premium') => {
    try {
      const result = await creditsApiService.upgradeSubscription(tier)
      if (result.success) {
        toast.success(result.data?.message || `Successfully upgraded to ${tier}`)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to upgrade subscription')
      }
    } catch (error) {
      toast.error('Error upgrading subscription')
    }
  }

  const handleDowngrade = async (tier: 'free' | 'standard') => {
    try {
      const result = await creditsApiService.downgradeSubscription(tier)
      if (result.success) {
        toast.success(result.data?.message || `Downgrade scheduled for period end`)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to downgrade subscription')
      }
    } catch (error) {
      toast.error('Error downgrading subscription')
    }
  }

  const handleTopup = async (topupType: 'starter' | 'professional' | 'enterprise') => {
    try {
      const result = await creditsApiService.createStripeTopupPaymentLink(topupType)
      if (result.success && result.data?.payment_link?.url) {
        window.location.href = result.data.payment_link.url
      } else {
        toast.error(result.error || 'Failed to create payment link')
      }
    } catch (error) {
      toast.error('Error creating payment link')
    }
  }

  // Tier configurations
  const getTierConfig = (tier: string) => {
    const configs = {
      free: {
        icon: Shield,
        name: 'Free',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        price: '$0',
        description: 'Perfect for getting started'
      },
      standard: {
        icon: Zap,
        name: 'Standard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        price: '$199',
        description: 'Great for growing teams'
      },
      premium: {
        icon: Crown,
        name: 'Premium',
        color: 'text-primary',
        bgColor: 'bg-primary/5',
        borderColor: 'border-primary/20',
        price: '$499',
        description: 'Enterprise-grade features'
      }
    }
    return configs[tier as keyof typeof configs] || configs.free
  }

  if (loading) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto space-y-8">
                {/* Loading State */}
                <div className="space-y-6">
                  <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({length: 6}).map((_, i) => (
                      <Card key={i} className="h-40">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  // If no Stripe data available, show fallback
  if (!stripeBillingDashboard) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                <Card className="p-8 text-center">
                  <CardContent>
                    <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Billing Data Unavailable</h2>
                    <p className="text-muted-foreground mb-4">
                      We're unable to load your billing information at the moment.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  const tierConfig = getTierConfig(stripeBillingDashboard.subscription.tier)
  const TierIcon = tierConfig.icon

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Billing & Subscription</h1>
                  <p className="text-muted-foreground text-lg mt-2">
                    Manage your subscription and monitor credit usage
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1">
                    {stripeBillingDashboard.subscription.status === 'active' ? '✅ Active' : '⚠️ ' + stripeBillingDashboard.subscription.status}
                  </Badge>
                </div>
              </div>

              {/* Current Plan Hero Card */}
              <Card className={`border-2 ${tierConfig.borderColor} ${tierConfig.bgColor} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <TierIcon className="w-full h-full" />
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${tierConfig.bgColor} border ${tierConfig.borderColor}`}>
                      <TierIcon className={`h-6 w-6 ${tierConfig.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {tierConfig.name} Plan
                        {stripeBillingDashboard.subscription.tier === 'premium' && (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {tierConfig.description} • {tierConfig.price}/month
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Usage Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Credit Usage This Cycle</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatCredits(stripeBillingDashboard.usage.credits_used_this_cycle)} / {formatCredits(stripeBillingDashboard.tier_limits.monthly_credits)}
                      </span>
                    </div>
                    <Progress
                      value={stripeBillingDashboard.usage.percentage_used}
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{stripeBillingDashboard.usage.percentage_used.toFixed(1)}% used</span>
                      <span>Resets: {formatCreditDate(stripeBillingDashboard.subscription.current_period_end)}</span>
                    </div>
                  </div>

                  {/* Plan Features Grid */}
                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatCredits(stripeBillingDashboard.tier_limits.monthly_credits)}</div>
                      <div className="text-sm text-muted-foreground">Monthly Credits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stripeBillingDashboard.tier_limits.max_team_members}</div>
                      <div className="text-sm text-muted-foreground">Team Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stripeBillingDashboard.tier_limits.features.length}</div>
                      <div className="text-sm text-muted-foreground">Features</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Cards Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Subscription Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUp className="h-5 w-5 text-green-600" />
                      Subscription Changes
                    </CardTitle>
                    <CardDescription>
                      Upgrade or downgrade your plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stripeBillingDashboard.subscription.tier === 'free' && (
                      <>
                        <Button onClick={() => handleUpgrade('standard')} className="w-full" size="lg">
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade to Standard ($199/month)
                        </Button>
                        <Button onClick={() => handleUpgrade('premium')} className="w-full" size="lg">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Premium ($499/month)
                        </Button>
                      </>
                    )}

                    {stripeBillingDashboard.subscription.tier === 'standard' && (
                      <>
                        <Button onClick={() => handleUpgrade('premium')} className="w-full" size="lg">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Premium ($499/month)
                        </Button>
                        <Button variant="outline" onClick={() => handleDowngrade('free')} className="w-full">
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Downgrade to Free (at period end)
                        </Button>
                      </>
                    )}

                    {stripeBillingDashboard.subscription.tier === 'premium' && (
                      <>
                        <Button variant="outline" onClick={() => handleDowngrade('standard')} className="w-full">
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Downgrade to Standard (at period end)
                        </Button>
                        <Button variant="outline" onClick={() => handleDowngrade('free')} className="w-full">
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Downgrade to Free (at period end)
                        </Button>
                      </>
                    )}

                    {stripeBillingDashboard.subscription.cancel_at_period_end && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Your subscription will be cancelled at the end of the current period.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current Balance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Current Balance
                    </CardTitle>
                    <CardDescription>
                      Available credits in your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-primary">
                        {formatCredits(stripeBillingDashboard.credit_summary.current_balance)}
                      </div>
                      <div className="text-muted-foreground">Credits Available</div>
                      <div className="text-sm text-muted-foreground">
                        Total spent this cycle: {formatCredits(stripeBillingDashboard.credit_summary.total_spent)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Credit Topup Packages */}
              {stripeTopupOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Buy Additional Credits
                      {stripeTopupOptions.eligible_for_discount && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          20% Premium Discount!
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {stripeTopupOptions.eligible_for_discount
                        ? 'Premium users save 20% on all credit purchases'
                        : 'Purchase additional credits for your account'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      {stripeTopupOptions.packages.map((pkg) => (
                        <Card key={pkg.type} className={`relative border-2 transition-all hover:border-primary/50 hover:shadow-lg ${
                          pkg.type === 'professional' ? 'border-primary/30 bg-primary/5' : 'border-border'
                        }`}>
                          {pkg.type === 'professional' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                            </div>
                          )}
                          <CardContent className="p-6 text-center space-y-4">
                            <div>
                              <h4 className="text-xl font-bold capitalize">{pkg.type}</h4>
                              <div className="text-3xl font-bold text-primary mt-2">
                                {formatCredits(pkg.credits)}
                              </div>
                              <div className="text-sm text-muted-foreground">Credits</div>
                            </div>

                            <div className="space-y-2">
                              {pkg.discount_percentage > 0 ? (
                                <>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg text-gray-500 line-through">
                                      ${pkg.base_price}
                                    </span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                      {pkg.discount_percentage}% off
                                    </Badge>
                                  </div>
                                  <div className="text-2xl font-bold text-green-600">
                                    ${pkg.discounted_price}
                                  </div>
                                </>
                              ) : (
                                <div className="text-2xl font-bold">
                                  ${pkg.base_price}
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => handleTopup(pkg.type)}
                              className="w-full"
                              size="lg"
                              variant={pkg.type === 'professional' ? 'default' : 'outline'}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Buy Credits
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions (if available) */}
              {recentTransactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Recent Transactions
                    </CardTitle>
                    <CardDescription>
                      Your latest credit transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.transaction_type === 'spent' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {transaction.transaction_type === 'spent' ? '-' : '+'}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCreditDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.transaction_type === 'spent' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transaction.transaction_type === 'spent' ? '-' : '+'}
                              {formatCredits(transaction.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Balance: {formatCredits(transaction.balance_after)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}