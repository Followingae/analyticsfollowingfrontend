import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { loadStripe } from '@stripe/stripe-js'

// Types
export interface BillingType {
  value: string
  label: string
  description: string
  features: string[]
}

export interface Subscription {
  id?: string
  status: 'active' | 'past_due' | 'admin_managed' | 'pending' | 'none' | 'cancelled'
  tier: 'free' | 'standard' | 'premium' | 'enterprise'
  current_period_end?: string
  credits_remaining?: number
  billing_type?: 'online_payment' | 'admin_managed'
}

export interface CheckoutSession {
  client_secret: string
  session_id: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  tier: string
  features: string[]
}

export interface TrialLimitItem {
  current_usage: number
  daily_limit: number
  remaining: number
  display_name: string
}

export interface TrialDailyUsageResponse {
  trial_active: boolean
  message?: string
  limits?: Record<string, TrialLimitItem>
  total_credits_allowed?: number
  daily_credit_limit?: number
}

export interface TrialInfo {
  trial_active: boolean
  limits: Record<string, TrialLimitItem>
  total_credits_allowed: number
  daily_credit_limit: number
  trial_duration_days: number
  trial_end: number | string | null
}

export interface BillingStatus {
  plan: {
    tier: string
    status: string
    price_per_month: number
    currency: string
    features: string[]
    description: string
    max_team_members: number
    monthly_profile_limit: number
    monthly_email_limit: number
    monthly_posts_limit: number
    monthly_credits: number
    topup_discount: number
  }
  stripe: {
    subscription_id: string
    status: string
    cancel_at_period_end: boolean
    current_period_start: number
    current_period_end: number
    billing_interval: string
    payment_method: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  } | null
  credits: {
    current_balance: number
    lifetime_earned: number
    lifetime_spent: number
    total_earned_this_cycle: number
    total_spent_this_cycle: number
  }
  usage: {
    profiles_used: number
    profiles_limit: number
    emails_used: number
    emails_limit: number
    posts_used: number
    posts_limit: number
  }
  portal_url: string | null
  trial_info: TrialInfo | null
  user: {
    email: string
    full_name: string
    has_stripe_customer: boolean
    billing_type: string
  }
}

class BillingManager {
  private stripePromise: Promise<any> | null = null

  constructor() {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      this.stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    }
  }

  // Get billing types for registration
  async getBillingTypes(): Promise<BillingType[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.billingTypes}`)
      if (!response.ok) {
        throw new Error('Failed to fetch billing types')
      }
      const data = await response.json()
      return data.billing_types || []
    } catch {
      // Return default billing types as fallback
      return [
        {
          value: 'online_payment',
          label: 'Pay Online (Instant Activation)',
          description: 'Instant account activation with credit card. Self-service billing management',
          features: ['Instant activation', 'Self-service portal', 'Automatic renewals']
        },
        {
          value: 'admin_managed',
          label: 'Admin Managed Billing',
          description: 'Account and billing managed by our team',
          features: ['Manual invoicing', 'Custom billing arrangements', 'Account managed by admin']
        }
      ]
    }
  }

  // Get available products (fetches pricing from backend)
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.checkout.pricing}`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && Array.isArray(data.products)) {
        // Handle case where products might be nested
        return data.products
      } else {
        return []
      }
    } catch {
      return []
    }
  }

  // Price ID resolution is handled server-side. The frontend sends the tier name
  // (e.g. "standard", "premium") and the backend maps it to the correct Stripe
  // price ID. DO NOT hardcode price IDs in the frontend.

  // Create pre-registration checkout session (payment before account creation)
  async createPreRegistrationCheckout(
    tier: string,
    email: string,
    fullName: string,
    companyName: string,
    marketingConsent: boolean = false
  ): Promise<{ checkout_url: string; session_id: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/billing/pre-registration-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: tier,
        email: email,
        full_name: fullName,
        company: companyName,
        marketing_consent: marketingConsent
      })
    })

    if (!response.ok) {
      let errorMsg = 'Failed to create checkout session'
      try {
        const errorData = await response.json()
        errorMsg = errorData.detail || errorData.message || errorMsg
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    return {
      checkout_url: data.checkout_url,
      session_id: data.session_id
    }
  }

  // Register free tier account directly
  async registerFreeTier(
    email: string,
    password: string,
    fullName: string,
    company: string,
    jobTitle: string = '',
    phoneNumber: string = '',
    timezone: string = 'UTC',
    language: string = 'en'
  ): Promise<any> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.freeTierRegistration}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        company,
        job_title: jobTitle,
        phone_number: phoneNumber,
        timezone,
        language
      })
    })

    if (!response.ok) {
      let errorMsg = 'Registration failed'
      try {
        const errorData = await response.json()
        errorMsg = errorData.detail || errorData.message || errorMsg
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg)
    }

    return await response.json()
  }

  // Verify session status for payment-first registration
  async verifySession(sessionId: string): Promise<any> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.verifySession(sessionId)}`)

    if (!response.ok) {
      let errorMsg = 'Session verification failed'
      try {
        const errorData = await response.json()
        errorMsg = errorData.detail || errorData.message || errorMsg
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg)
    }

    return await response.json()
  }

  // Upgrade existing user's subscription
  async upgradeSubscription(tier: string): Promise<any> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.upgradeSubscription}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        subscription_tier: tier,
        success_url: `${window.location.origin}/settings/billing?upgraded=true`,
        cancel_url: `${window.location.origin}/settings/billing`
      })
    })

    if (!response.ok) {
      let errorMsg = 'Failed to create upgrade session'
      try {
        const errorData = await response.json()
        errorMsg = errorData.detail || errorData.message || errorMsg
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()

    // Redirect to checkout if URL provided
    if (data.checkout_url) {
      window.location.href = data.checkout_url
    }

    return data
  }

  // Create checkout session (for existing users who want to upgrade)
  async createCheckoutSession(tier: string): Promise<CheckoutSession> {
    // DO NOT use hardcoded price IDs - let backend handle it
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.upgradeSubscription}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        subscription_tier: tier, // Just send the tier, backend maps to price
        success_url: `${window.location.origin}/dashboard?subscription=success`,
        cancel_url: `${window.location.origin}/pricing?subscription=cancelled`
      })
    })

    if (!response.ok) {
      if (response.status === 403) {
        // Try to get error details
        let errorMsg = 'Not authorized to create checkout session'
        try {
          const errorData = await response.json()
          errorMsg = errorData.detail || errorData.message || errorMsg
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(`Access denied: ${errorMsg}. You may need to verify your email or contact support.`)
      }
      throw new Error(`Failed to create checkout session (${response.status})`)
    }

    const data = await response.json()
    // Handle both sessionId and session_id formats
    return {
      client_secret: data.client_secret || data.clientSecret,
      session_id: data.sessionId || data.session_id
    }
  }

  // Initialize embedded checkout
  async initEmbeddedCheckout(clientSecret: string, mountElement: string) {
    if (!this.stripePromise) {
      throw new Error('Stripe not initialized')
    }

    const stripe = await this.stripePromise
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret
    })

    checkout.mount(mountElement)
    return checkout
  }

  // Get trial daily usage (only meaningful when user is trialing)
  async getTrialDailyUsage(): Promise<TrialDailyUsageResponse> {
    try {
      const headers = getAuthHeaders()
      if (!('Authorization' in headers)) {
        return { trial_active: false, message: 'Not authenticated' }
      }

      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.trialDailyUsage}`, {
        headers,
      })

      if (!response.ok) {
        return { trial_active: false, message: 'Failed to fetch trial usage' }
      }

      return await response.json()
    } catch {
      return { trial_active: false, message: 'Network error' }
    }
  }

  // Check if a billing status indicates an active trial
  isTrialing(status: BillingStatus | null): boolean {
    if (!status) return false
    return (
      status.plan.status === 'trialing' ||
      status.stripe?.status === 'trialing' ||
      !!status.trial_info?.trial_active
    )
  }

  // Get comprehensive billing status from the new endpoint
  async getBillingStatus(): Promise<BillingStatus | null> {
    try {
      const headers = getAuthHeaders()
      if (!('Authorization' in headers)) {
        return null
      }

      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.subscriptionStatus}`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        return data as BillingStatus
      }

      if (response.status === 401) {
        return null
      }

      return null
    } catch {
      return null
    }
  }

  // Get current subscription (delegates to getBillingStatus and maps to legacy shape)
  async getSubscription(): Promise<Subscription> {
    try {
      const billingStatus = await this.getBillingStatus()

      if (!billingStatus) {
        return { status: 'none', tier: 'free' }
      }

      // Map BillingStatus to the legacy Subscription interface
      const subscription: Subscription = {
        status: (billingStatus.plan.status as Subscription['status']) || 'none',
        tier: (billingStatus.plan.tier as Subscription['tier']) || 'free',
        billing_type: billingStatus.user.billing_type as Subscription['billing_type'],
        credits_remaining: billingStatus.credits.current_balance,
      }

      // Map period end from stripe data (unix timestamp to ISO string)
      if (billingStatus.stripe?.current_period_end) {
        subscription.current_period_end = new Date(billingStatus.stripe.current_period_end * 1000).toISOString()
      }

      // Map stripe subscription ID
      if (billingStatus.stripe?.subscription_id) {
        subscription.id = billingStatus.stripe.subscription_id
      }

      return subscription
    } catch {
      return { status: 'none', tier: 'free' }
    }
  }

  // Check subscription status and determine access
  async checkSubscriptionStatus(): Promise<{
    hasAccess: boolean
    message?: string
    action?: 'upgrade' | 'payment' | 'pending' | 'expired'
  }> {
    const subscription = await this.getSubscription()

    switch (subscription.status) {
      case 'active':
        return { hasAccess: true }

      case 'past_due':
        return {
          hasAccess: true, // Limited access
          message: 'Your payment is past due. Please update your payment method.',
          action: 'payment'
        }

      case 'admin_managed':
        if (subscription.current_period_end) {
          const expiryDate = new Date(subscription.current_period_end)
          if (expiryDate < new Date()) {
            return {
              hasAccess: false,
              message: 'Your subscription has expired. Please contact our team.',
              action: 'expired'
            }
          }
        }
        return { hasAccess: true }

      case 'pending':
        return {
          hasAccess: false,
          message: 'Your account is pending approval.',
          action: 'pending'
        }

      case 'cancelled':
      case 'none':
      default:
        return {
          hasAccess: false,
          message: 'No active subscription found.',
          action: 'upgrade'
        }
    }
  }

  // Open Stripe Customer Portal
  async openCustomerPortal(cachedPortalUrl?: string | null): Promise<void> {
    try {
      // If a cached portal_url was provided from getBillingStatus, use it directly
      if (cachedPortalUrl) {
        window.location.href = cachedPortalUrl
        return
      }

      // Otherwise, create a fresh portal session via the new POST endpoint
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.portalSession}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ return_url: window.location.href })
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('You need a paid subscription to access the billing portal. Please upgrade first.')
        }
        throw new Error('Failed to create portal session')
      }

      const data = await response.json()
      const portalUrl = data.portal_url || data.url

      if (portalUrl) {
        window.location.href = portalUrl
      } else {
        throw new Error('No portal URL returned from API')
      }
    } catch (error) {
      throw error
    }
  }

  // Admin: Get pending users
  async getPendingUsers() {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.adminBilling.pendingUsers}`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch pending users')
    }

    return await response.json()
  }

  // Admin: Approve user
  async approveUser(
    userId: string,
    tier: string,
    credits: number,
    expiresAt: string,
    sendWelcomeEmail: boolean = true
  ) {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.adminBilling.approveUser}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: userId,
        subscription_tier: tier,
        credits,
        subscription_expires_at: expiresAt,
        send_welcome_email: sendWelcomeEmail
      })
    })

    if (!response.ok) {
      throw new Error('Failed to approve user')
    }

    return await response.json()
  }
}

// Export singleton instance
export const billingManager = new BillingManager()