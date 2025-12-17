import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
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
    } catch (error) {
      console.error('Error fetching billing types:', error)
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

  // Get available products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.products}`, {
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
        console.warn('Unexpected products response format:', data)
        return []
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  // Get price ID for a tier
  private getPriceId(tier: string): string {
    const priceIds: Record<string, string> = {
      free: 'price_1SGatNADTNbHc8P6fCY0pBLS',
      standard: 'price_1SGasqADTNbHc8P6v7VNl7sc',
      premium: 'price_1SGatBADTNbHc8P6FlTcQbWI'
    }
    return priceIds[tier.toLowerCase()] || priceIds.free
  }

  // Create pre-registration checkout session (payment before account creation)
  async createPreRegistrationCheckout(
    tier: string,
    email: string,
    fullName: string,
    companyName: string,
    marketingConsent: boolean = false
  ): Promise<{ checkout_url: string; session_id: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/billing/v2/pre-registration-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription_tier: tier,
        email: email,
        full_name: fullName,
        company_name: companyName,
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
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.upgradeSubscription}`, {
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
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.upgradeSubscription}`, {
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

  // Get current subscription
  async getSubscription(): Promise<Subscription> {
    try {
      const headers = getAuthHeaders()
      // Check if user is authenticated
      if (!headers.Authorization) {
        console.warn('No authentication token available')
        return { status: 'none', tier: 'free' }
      }

      // Try billing endpoint first
      console.log('Fetching subscription from billing endpoint...')
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.subscription}`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Subscription data received:', data)
        return data
      }

      // Handle various error cases
      if (response.status === 401) {
        console.warn('User not authenticated')
        return { status: 'none', tier: 'free' }
      }

      if (response.status === 404 || response.status === 500) {
        console.warn(`Billing endpoint not available (${response.status}), trying dashboard endpoint...`)

        // Fallback to dashboard endpoint for subscription data
        try {
          const dashboardResponse = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.dashboard}`, {
            headers
          })

          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json()
            console.log('Dashboard data received, extracting subscription info:', dashboardData)

            // Extract subscription info from dashboard data
            if (dashboardData.subscription) {
              return dashboardData.subscription
            }

            // Build subscription object from user data
            const subscription: Subscription = {
              status: dashboardData.user?.subscription_status || 'none',
              tier: dashboardData.user?.subscription_tier || dashboardData.user?.role || 'free',
              billing_type: dashboardData.user?.billing_type || 'online_payment',
              credits_remaining: dashboardData.credits?.balance || 0
            }

            console.log('Built subscription from dashboard:', subscription)
            return subscription
          }
        } catch (dashboardError) {
          console.error('Dashboard endpoint also failed:', dashboardError)
        }
      }

      console.error(`Failed to fetch subscription: ${response.status}`)
      return { status: 'none', tier: 'free' }
    } catch (error) {
      console.error('Error fetching subscription:', error)
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
  async openCustomerPortal(): Promise<void> {
    try {
      // Use the correct GET endpoint from backend
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.billing.portalUrl}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('You need a paid subscription to access the billing portal. Please upgrade first.')
        }
        throw new Error('Failed to get portal URL')
      }

      const data = await response.json()
      // Backend returns { "portal_url": "https://billing.stripe.com/session/..." }
      const portalUrl = data.portal_url

      if (portalUrl) {
        // Redirect user to Stripe portal
        window.location.href = portalUrl
      } else {
        throw new Error('No portal URL returned from API')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      throw error
    }
  }

  // Admin: Get pending users
  async getPendingUsers() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.adminBilling.pendingUsers}`, {
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
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.adminBilling.approveUser}`, {
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