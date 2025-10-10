/**
 * Credits API Service - Updated for New Backend Structure
 * Handles all credit-related API calls including balance, transactions, pricing, and permissions
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'

// Correct Backend API Types
export interface TeamSubscription {
  tier: string
  billing_cycle_start: string
  billing_cycle_end: string
  member_count: number
  member_limit: number
}

export interface CreditBalance {
  balance: number
  is_locked: boolean
  next_reset_date: string
}

export interface WalletSummary {
  current_balance: number
  is_locked: boolean
  subscription_active: boolean
  next_reset_date: string
  total_spent_this_cycle: number
  total_plan_credits: number
  package_credits_balance: number
  purchased_credits_balance: number
  bonus_credits_balance: number
  monthly_allowance: number
  package_name: string
}

export interface SpendingAnalytics {
  months: Array<{
    month: string
    total_spent: number
    credits_in?: number
    credits_out?: number
  }>
}

export interface CreditTransaction {
  id: number
  transaction_type: 'spent' | 'earned' | 'purchased' | 'bonus' | 'refunded'
  action_type: string
  amount: number
  description: string
  balance_after: number
  created_at: string
}

export interface CreditsInOutSummary {
  total_credits_in: number
  credits_earned: number
  credits_purchased: number
  credits_bonus: number
  credits_refunded: number
  total_credits_out: number
  credits_spent: number
  credits_expired: number
  net_credits: number
  current_balance: number
  monthly_breakdown: Array<{
    month: string
    credits_in: number
    credits_out: number
    net: number
  }>
}

export interface MonthlyUsage {
  month_year: string
  total_spent: number
  actions_breakdown: {
    [key: string]: {
      paid_used: number
      credits_spent: number
    }
  }
  top_actions: Array<{
    action_type: string
    credits_spent: number
    total_actions: number
  }>
}

export interface PricingRule {
  action_type: string
  cost_per_action: number
  description: string
}

export interface StripePortal {
  portal_url: string
  expires_at: string
}


export interface PricingRule {
  action_type: string
  credits_per_action: number
  free_allowance_per_month: number
  cost_per_action?: number
  description?: string
  bulk_discounts?: Array<{
    min_quantity: number
    discount_percentage: number
  }>
}

// New Stripe Billing Interfaces
export interface StripeBillingDashboard {
  credit_summary: {
    current_balance: number
    total_spent: number
  }
  subscription: {
    tier: 'free' | 'standard' | 'premium'
    status: 'active' | 'trialing' | 'past_due' | 'cancelled'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    stripe_subscription_id?: string
  }
  tier_limits: {
    monthly_credits: number
    max_team_members: number
    features: string[]
  }
  usage: {
    credits_used_this_cycle: number
    percentage_used: number
  }
}

export interface StripeTopupOptions {
  packages: Array<{
    type: 'starter' | 'professional' | 'enterprise'
    credits: number
    base_price: number
    discounted_price: number
    discount_percentage: number
  }>
  user_tier: 'free' | 'standard' | 'premium'
  eligible_for_discount: boolean
}

export interface StripePaymentLink {
  payment_link: {
    url: string
    expires_at: string
  }
  package_details: {
    credits: number
    price: number
    discount_applied: number
  }
}

export interface StripeSubscriptionUpdate {
  subscription: {
    tier: string
    status: string
    stripe_subscription_id: string
  }
  message: string
  credits_added?: number
  effective_date?: string
  access_until?: string
}

export interface AllowanceInfo {
  [action_type: string]: {
    monthly_allowance: number
    used_this_month: number
    remaining: number
    next_reset: string
  }
}

export interface CanPerformResult {
  can_perform: boolean
  credits_required: number
  current_balance: number
  free_allowance_remaining: number
  reason?: string
}

export interface SystemStats {
  total_users: number
  total_transactions_today: number
  total_credits_spent_today: number
  average_credits_per_action: number
}

export interface CreditsInOutSummary {
  total_credits_in: number
  credits_earned: number        // Monthly allowances
  credits_purchased: number     // Topup purchases
  credits_bonus: number         // Promotional credits
  credits_refunded: number      // Refunded credits

  total_credits_out: number
  credits_spent: number         // Used for actions
  credits_expired: number       // Expired credits

  net_credits: number           // Credits in - Credits out
  current_balance: number       // Current wallet balance

  period_start: string
  period_end: string

  monthly_breakdown: Array<{    // For charts/graphs
    month: string
    credits_in: number
    credits_out: number
    net: number
  }>
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class CreditsApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { tokenManager } = await import('@/utils/tokenManager')
      const tokenResult = await tokenManager.getValidToken()
      
      if (!tokenResult.isValid || !tokenResult.token) {
        return {
          success: false,
          error: 'No valid authentication token available'
        }
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResult.token}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        // Handle 402 Payment Required specifically
        if (response.status === 402) {
          const errorData = await response.json()
          return {
            success: false,
            error: errorData.detail || 'Insufficient credits',
            data: errorData
          }
        }
        
        const errorText = await response.text()
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // Credit Balance & Wallet Management
  async getTotalPlanCredits(): Promise<ApiResponse<{
    total_plan_credits: number
    package_credits: number
    purchased_credits: number
    bonus_credits: number
    monthly_allowance: number
    package_name: string
    current_balance: number
  }>> {
    return this.makeRequest('/api/v1/credits/total-plan-credits')
  }

  async getBalance(): Promise<ApiResponse<CreditBalance>> {
    try {
      const response = await this.makeRequest<any>(ENDPOINTS.credits.balance)
      


      
      if (response.success && response.data) {
        const rawData = response.data


        
        // Log specific fields we're looking for






        
        // Handle potential field mapping - backend might use different field names
        const mappedData: CreditBalance = {
          current_balance: rawData.balance ?? rawData.current_balance ?? rawData.credits ?? 0,
          monthly_allowance: rawData.monthly_allowance ?? rawData.monthly_limit ?? 0,
          package_name: rawData.package_name ?? rawData.subscription_tier ?? rawData.plan ?? rawData.tier ?? 'Free',
          billing_cycle_start: rawData.billing_cycle_start ?? rawData.cycle_start ?? rawData.next_reset_date ?? new Date().toISOString(),
          wallet_status: rawData.is_locked ? 'locked' : 'active'
        }
        

        
        return {
          success: true,
          data: mappedData
        }
      }
      
      return response
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getWalletSummary(): Promise<ApiResponse<CreditWalletSummary>> {
    return this.makeRequest<CreditWalletSummary>(ENDPOINTS.credits.walletSummary)
  }

  async getDashboard(): Promise<ApiResponse<CreditDashboard>> {
    return this.makeRequest<CreditDashboard>(ENDPOINTS.credits.dashboard)
  }

  async createWallet(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/v1/credits/wallet/create', {
      method: 'POST'
    })
  }

  // Transaction History & Analytics
  async getTransactions(
    limit?: number,
    offset?: number,
    action_type?: string,
    start_date?: string,
    end_date?: string
  ): Promise<ApiResponse<{
    transactions: CreditTransaction[]
    total: number
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
  }>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    if (action_type) params.append('action_type', action_type)
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)

    const queryString = params.toString()
    const endpoint = `${ENDPOINTS.credits.transactions}${queryString ? `?${queryString}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  async searchTransactions(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<{
    transactions: CreditTransaction[]
    total: number
  }>> {
    const params = new URLSearchParams({ query })
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    return this.makeRequest(`/api/v1/credits/transactions/search?${params.toString()}`)
  }

  async getMonthlyUsage(
    year?: number,
    month?: number
  ): Promise<ApiResponse<MonthlyUsage>> {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())

    const queryString = params.toString()
    const endpoint = `${ENDPOINTS.credits.usageMonthly}${queryString ? `?${queryString}` : ''}`
    
    return this.makeRequest<MonthlyUsage>(endpoint)
  }

  async getSpendingAnalytics(
    period?: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (period) params.append('period', period)

    const queryString = params.toString()
    const endpoint = `/api/v1/credits/analytics/spending${queryString ? `?${queryString}` : ''}`

    return this.makeRequest(endpoint)
  }

  async getTransactionsSummary(
    start_date?: string,
    end_date?: string,
    include_monthly?: boolean
  ): Promise<ApiResponse<CreditsInOutSummary>> {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)
    if (include_monthly !== undefined) params.append('include_monthly', include_monthly.toString())

    const queryString = params.toString()
    const endpoint = `/api/v1/credits/transactions/summary${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<CreditsInOutSummary>(endpoint)
  }

  // Correct Backend API Methods
  async getTeamSubscription(): Promise<ApiResponse<any>> {
    // Dashboard returns user, subscription, team, and stats data
    // Extract subscription info from the dashboard response
    const result = await this.makeRequest<any>('/api/v1/auth/dashboard')

    if (result.success && result.data) {
      // Extract subscription/team data from dashboard response
      const dashboardData = result.data

      // Create subscription-like object from dashboard data
      const subscriptionData = {
        tier: dashboardData.user?.role || dashboardData.subscription?.tier || 'free',
        billing_cycle_start: dashboardData.subscription?.billing_cycle_start || null,
        billing_cycle_end: dashboardData.subscription?.billing_cycle_end || null,
        member_count: dashboardData.team?.member_count || 1,
        member_limit: dashboardData.team?.member_limit || 1,
        // Include full dashboard data for debugging
        _raw_dashboard_data: dashboardData
      }

      return {
        success: true,
        data: subscriptionData
      }
    }

    return result
  }

  async getCreditBalance(): Promise<ApiResponse<CreditBalance>> {
    return this.makeRequest<CreditBalance>('/api/v1/credits/balance')
  }

  async getWalletSummary(): Promise<ApiResponse<WalletSummary>> {
    return this.makeRequest<WalletSummary>('/api/v1/credits/wallet/summary')
  }

  async getMonthlyUsage(): Promise<ApiResponse<MonthlyUsage>> {
    return this.makeRequest<MonthlyUsage>('/api/v1/credits/usage/monthly')
  }

  async getRecentTransactions(limit: number = 5): Promise<ApiResponse<CreditTransaction[]>> {
    return this.makeRequest<CreditTransaction[]>(`/api/v1/credits/transactions?limit=${limit}`)
  }

  async getSpendingAnalytics(months: number = 3): Promise<ApiResponse<SpendingAnalytics>> {
    return this.makeRequest<SpendingAnalytics>(`/api/v1/credits/analytics/spending?months=${months}`)
  }

  async getAllPricing(): Promise<ApiResponse<PricingRule[]>> {
    return this.makeRequest<PricingRule[]>('/api/v1/credits/pricing')
  }

  // Keep existing method for compatibility
  async getTransactionsSummary(
    start_date?: string,
    end_date?: string,
    include_monthly?: boolean
  ): Promise<ApiResponse<CreditsInOutSummary>> {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)
    if (include_monthly !== undefined) params.append('include_monthly', include_monthly.toString())

    const queryString = params.toString()
    const endpoint = `/api/v1/credits/transactions/summary${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<CreditsInOutSummary>(endpoint)
  }

  async getActionPricing(actionType: string): Promise<ApiResponse<PricingRule>> {
    return this.makeRequest<PricingRule>(`/api/v1/credits/pricing/${actionType}`)
  }

  async calculatePricing(
    actionType: string,
    quantity: number = 1
  ): Promise<ApiResponse<{
    action_type: string
    quantity: number
    total_credits: number
    credits_per_action: number
    discount_applied?: number
    bulk_savings?: number
  }>> {
    return this.makeRequest('/api/v1/credits/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify({
        action_type: actionType,
        quantity
      })
    })
  }

  // Allowances & System Info
  async getAllowances(): Promise<ApiResponse<AllowanceInfo>> {
    return this.makeRequest<AllowanceInfo>(ENDPOINTS.credits.allowances)
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return this.makeRequest<SystemStats>('/api/v1/credits/system/stats')
  }

  // Future Payment Integration
  async estimateTopUp(
    credits: number
  ): Promise<ApiResponse<{
    credits: number
    estimated_cost: number
    currency: string
    payment_methods_available: string[]
  }>> {
    return this.makeRequest('/api/v1/credits/top-up/estimate', {
      method: 'POST',
      body: JSON.stringify({ credits })
    })
  }

  async getTopUpHistory(
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    const queryString = params.toString()
    const endpoint = `/api/v1/credits/top-up/history${queryString ? `?${queryString}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  // Utility methods for common use cases
  async checkAndGetPricing(actionType: string): Promise<{
    canPerform: boolean
    pricing: PricingRule | null
    balance: CreditBalance | null
    error?: string
  }> {
    try {
      const [canPerformResult, pricingResult, balanceResult] = await Promise.all([
        this.canPerform(actionType),
        this.getActionPricing(actionType),
        this.getBalance()
      ])

      return {
        canPerform: canPerformResult.success && canPerformResult.data?.can_perform || false,
        pricing: pricingResult.success ? pricingResult.data || null : null,
        balance: balanceResult.success ? balanceResult.data || null : null,
        error: canPerformResult.error || pricingResult.error || balanceResult.error
      }
    } catch (error) {
      return {
        canPerform: false,
        pricing: null,
        balance: null,
        error: error instanceof Error ? error.message : 'Failed to check permissions'
      }
    }
  }

  // NEW STRIPE BILLING METHODS

  // Get comprehensive billing dashboard with subscription info
  async getStripeBillingDashboard(): Promise<ApiResponse<StripeBillingDashboard>> {
    return this.makeRequest<StripeBillingDashboard>('/api/v1/credits/billing/dashboard')
  }

  // Get available topup packages with Premium discounts
  async getStripeTopupOptions(): Promise<ApiResponse<StripeTopupOptions>> {
    return this.makeRequest<StripeTopupOptions>('/api/v1/credits/topup/options')
  }

  // Create Stripe payment link for topup
  async createStripeTopupPaymentLink(topupType: 'starter' | 'professional' | 'enterprise'): Promise<ApiResponse<StripePaymentLink>> {
    return this.makeRequest<StripePaymentLink>('/api/v1/credits/topup/create-payment-link', {
      method: 'POST',
      body: JSON.stringify({ topup_type: topupType })
    })
  }

  // Upgrade subscription tier
  async upgradeSubscription(newTier: 'standard' | 'premium'): Promise<ApiResponse<StripeSubscriptionUpdate>> {
    return this.makeRequest<StripeSubscriptionUpdate>('/api/v1/credits/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ new_tier: newTier })
    })
  }

  // Downgrade subscription (at period end)
  async downgradeSubscription(newTier: 'free' | 'standard'): Promise<ApiResponse<StripeSubscriptionUpdate>> {
    return this.makeRequest<StripeSubscriptionUpdate>('/api/v1/credits/subscription/downgrade', {
      method: 'POST',
      body: JSON.stringify({ new_tier: newTier })
    })
  }

  // Cancel subscription
  async cancelSubscription(atPeriodEnd: boolean = true): Promise<ApiResponse<StripeSubscriptionUpdate>> {
    return this.makeRequest<StripeSubscriptionUpdate>('/api/v1/credits/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ at_period_end: atPeriodEnd })
    })
  }

  // Update credit balance with enhanced billing cycle info
  async getEnhancedCreditBalance(): Promise<ApiResponse<{
    current_balance: number
    billing_cycle: {
      start: string
      end: string
      days_remaining: number
    }
    subscription: {
      tier: 'free' | 'standard' | 'premium'
      status: 'active' | 'trialing' | 'past_due' | 'cancelled'
      stripe_subscription_id: string
    }
  }>> {
    return this.makeRequest('/api/v1/credits/balance')
  }
}

// Export singleton instance
export const creditsApiService = new CreditsApiService()
export default creditsApiService