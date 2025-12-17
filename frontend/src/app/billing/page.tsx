'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Building2
} from 'lucide-react'
import { billingManager, type Subscription, type Product } from '@/services/billingManager'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { AuthGuard } from '@/components/AuthGuard'

export default function BillingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <BillingContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function BillingContent() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingPortal, setLoadingPortal] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      // Check if user is authenticated first
      if (!user) {
        console.warn('User not authenticated, showing default state')
        setSubscription({ status: 'none', tier: 'free' })
        setProducts([])
        return
      }

      // Get subscription data (from dashboard endpoint as primary source)
      const subData = await billingManager.getSubscription()
      setSubscription(subData)

      // Only fetch Stripe products if user is online_payment type
      // Admin-managed users don't need to see Stripe products
      if (!subData.billing_type || subData.billing_type === 'online_payment') {
        try {
          const productsData = await billingManager.getProducts()
          setProducts(productsData)
        } catch (error) {
          console.warn('Could not fetch Stripe products:', error)
          setProducts([])
        }
      } else {
        // Admin-managed users don't need product listings
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast.error('Failed to load billing information')
      // Set default values on error
      setSubscription({ status: 'none', tier: 'free' })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: string) => {
    // Admin-managed users should contact support
    if (subscription?.billing_type === 'admin_managed') {
      toast.info('Please contact support to change your plan')
      window.location.href = 'mailto:support@following.ae?subject=Plan%20Upgrade%20Request'
      return
    }

    try {
      const checkoutData = await billingManager.createCheckoutSession(tier)
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast.error('Failed to start checkout process')
    }
  }

  const handleManageSubscription = async () => {
    // Admin-managed users can't access portal
    if (subscription?.billing_type === 'admin_managed') {
      toast.error('Portal access is only available for online payment users')
      return
    }

    // Free users need to upgrade first
    if (!subscription || subscription.tier === 'free' || subscription.status === 'none') {
      toast.info('Please upgrade to a paid plan to access the billing portal')
      // Optionally scroll to plans section
      document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    try {
      setLoadingPortal(true)
      await billingManager.openCustomerPortal()
    } catch (error: any) {
      console.error('Error opening portal:', error)
      // Show specific error message if available
      toast.error(error.message || 'Failed to open billing portal')
    } finally {
      setLoadingPortal(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
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
    const tierColors = {
      free: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      enterprise: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
    return <Badge className={tierColors[tier as keyof typeof tierColors] || tierColors.free}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
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
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
        </div>

        {/* Current Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(subscription?.status || 'none')}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tier</p>
                  {getTierBadge(subscription?.tier || 'free')}
                </div>
              </div>

              {subscription?.current_period_end && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Period Ends</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {subscription?.credits_remaining !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Credits Remaining</p>
                  <p className="text-2xl font-bold">{subscription.credits_remaining}</p>
                </div>
              )}

              {/* Billing Type Info */}
              {subscription?.billing_type === 'admin_managed' && (
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

              {subscription?.status === 'past_due' && (
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

              {/* Action Buttons - Different for each user type */}
              <div className="flex gap-3 pt-2">
                {/* Stripe customers with active subscription */}
                {subscription?.status === 'active' && subscription?.tier !== 'free' && subscription?.billing_type !== 'admin_managed' && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                {/* Free users - show upgrade prompt */}
                {(!subscription || subscription.tier === 'free') && subscription?.billing_type !== 'admin_managed' && (
                  <Button
                    onClick={() => document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                )}

                {/* Past due users */}
                {subscription?.status === 'past_due' && (
                  <Button
                    onClick={handleManageSubscription}
                    variant="destructive"
                    disabled={loadingPortal}
                  >
                    Update Payment Method
                  </Button>
                )}

                {/* Admin managed users */}
                {subscription?.billing_type === 'admin_managed' && (
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

        {/* Available Plans - Only show upgrade options for online payment users */}
        {(!subscription?.billing_type || subscription?.billing_type === 'online_payment') && Array.isArray(products) && products.length > 0 && (
          <div id="available-plans">
            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className={subscription?.tier === product.tier ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{product.name}</span>
                      {subscription?.tier === product.tier && (
                        <Badge variant="secondary">Current Plan</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">
                          ${product.price}
                          <span className="text-sm font-normal text-muted-foreground">/month</span>
                        </p>
                      </div>

                      <ul className="space-y-2">
                        {product.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {subscription?.tier !== product.tier && (
                        <Button
                          onClick={() => handleUpgrade(product.tier)}
                          className="w-full"
                          variant={subscription && subscription.tier !== 'free' ? 'outline' : 'default'}
                        >
                          {!subscription || subscription.tier === 'free' ? 'Get Started' : 'Switch Plan'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Admin Managed Users Info */}
        {subscription?.billing_type === 'admin_managed' && (
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
                    <li>• Custom payment terms and invoicing</li>
                    <li>• Dedicated account support</li>
                    <li>• Flexible billing arrangements</li>
                    <li>• Priority customer service</li>
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