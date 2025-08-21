/**
 * Credits API Service
 * Handles all credit-related API calls including balance, transactions, pricing, and permissions
 */

import { API_CONFIG } from '@/config/api'

// Types
export interface CreditBalance {
  current_balance: number
  monthly_allowance: number
  package_name: string
  billing_cycle_start: string
  wallet_status: 'active' | 'locked' | 'suspended'
}

export interface CreditWalletSummary extends CreditBalance {
  total_spent_this_month: number
  total_transactions_this_month: number
  next_billing_date: string
}

export interface CreditTransaction {
  id: string
  amount: number
  action_type: string
  created_at: string
  description: string
  transaction_type: 'debit' | 'credit'
  remaining_balance: number
}

export interface CreditDashboard {
  wallet: CreditBalance
  recent_transactions: CreditTransaction[]
  monthly_usage: {
    total_spent: number
    actions_performed: number
    top_actions: string[]
    free_allowances_used: number
  }
  pricing_rules: Array<{
    action_type: string
    credits_per_action: number
    free_allowance_per_month: number
  }>
  unlocked_influencers_count: number
}

export interface MonthlyUsage {
  period: string
  total_credits_spent: number
  total_actions: number
  free_allowances_used: number
  action_breakdown: Record<string, {
    count: number
    credits: number
  }>
  daily_usage: Array<{
    date: string
    credits: number
    actions: number
  }>
}

export interface PricingRule {
  action_type: string
  credits_per_action: number
  free_allowance_per_month: number
  bulk_discounts?: Array<{
    min_quantity: number
    discount_percentage: number
  }>
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
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
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
  async getBalance(): Promise<ApiResponse<CreditBalance>> {
    return this.makeRequest<CreditBalance>('/api/v1/credits/balance')
  }

  async getWalletSummary(): Promise<ApiResponse<CreditWalletSummary>> {
    return this.makeRequest<CreditWalletSummary>('/api/v1/credits/wallet/summary')
  }

  async getDashboard(): Promise<ApiResponse<CreditDashboard>> {
    return this.makeRequest<CreditDashboard>('/api/v1/credits/dashboard')
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
    const endpoint = `/api/v1/credits/transactions${queryString ? `?${queryString}` : ''}`
    
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
    const endpoint = `/api/v1/credits/usage/monthly${queryString ? `?${queryString}` : ''}`
    
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

  // Action Permissions & Pricing
  async canPerform(actionType: string): Promise<ApiResponse<CanPerformResult>> {
    return this.makeRequest<CanPerformResult>(`/api/v1/credits/can-perform/${actionType}`)
  }

  async getAllPricing(): Promise<ApiResponse<PricingRule[]>> {
    return this.makeRequest<PricingRule[]>('/api/v1/credits/pricing')
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
    return this.makeRequest<AllowanceInfo>('/api/v1/credits/allowances')
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
}

// Export singleton instance
export const creditsApiService = new CreditsApiService()
export default creditsApiService