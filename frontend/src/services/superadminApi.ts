/**
 * Superadmin Dashboard API Service
 * Updated to match the comprehensive backend implementation
 */

import { getAuthHeaders, API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Core Types based on actual backend implementation
export interface DashboardOverview {
  system_health: {
    status: string
    cpu_usage: number
    memory_usage: number
    uptime_hours: number
  }
  user_metrics: {
    total_users: number
    active_users: number
    new_today: number
    new_this_week: number
  }
  revenue_metrics: {
    total_revenue: number
    monthly_revenue: number
    active_wallets: number
  }
  activity_metrics: {
    profiles_analyzed: number
    total_accesses: number
    accesses_today: number
  }
  security_alerts: SecurityAlert[]
  recent_activities: RecentActivity[]
}

export interface RealtimeAnalytics {
  online_users: number
  active_sessions: number
  system_load: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
  recent_activities: RecentActivity[]
  credit_flows: {
    spent_last_hour: number
    earned_last_hour: number
    net_flow: number
  }
  performance_metrics: {
    response_time_ms: number
    cache_hit_rate: number
    error_rate: number
  }
}

export interface UserManagement {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin' | 'super_admin' | 'team_member'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  teams: Array<{ name: string; role: string }>
  credits: { balance: number; spent: number }
  recent_activity: number
  created_at: string
  updated_at: string
}

export interface UserActivity {
  id: string
  type: 'profile_access' | 'credit_transaction'
  timestamp: string
  description: string
  details: any
  metadata?: any
}

export interface CreditOverview {
  overview: {
    total_credits_in_system: number
    total_spent_all_time: number
    total_earned_all_time: number
    active_wallets: number
    recent_transactions_24h: number
  }
  top_spenders: Array<{
    email: string
    full_name: string
    total_spent: number
    current_balance: number
  }>
  pricing_rules: Array<{
    action_type: string
    cost_per_action: number
    free_monthly_allowance: number
    is_active: boolean
  }>
  system_health: {
    credit_flow_ratio: number
    average_wallet_balance: number
  }
}

export interface Transaction {
  id: string
  timestamp: string
  user: {
    email: string
    full_name: string
  }
  amount: number
  type: string
  description: string
  current_balance: number
  metadata?: any
  status: string
}

export interface Influencer {
  id: string
  username: string
  full_name: string
  biography: string
  followers_count: number
  following_count: number
  posts_count: number
  profile_image_url: string
  is_verified: boolean
  is_private: boolean
  created_at: string
  updated_at: string
  analytics: {
    total_views: number
    unique_viewers: number
    unlock_count: number
    recent_posts_30d: number
    engagement_rate: number
    ai_analysis: {
      primary_content_type: string
      avg_sentiment_score: number
      content_quality_score: number
      language_distribution: Record<string, number>
      content_distribution: Record<string, number>
    }
  }
  platform_metrics: {
    revenue_generated: number
    popularity_score: number
  }
}

export interface Proposal {
  id: string
  title: string
  brand_name: string
  budget: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
  campaign_type: string
  description: string
  requirements: {
    followers_min: number
    categories: string[]
  }
  timeline: {
    start_date: string
    end_date: string
  }
  created_at: string
  updated_at: string
  brand_contact_email: string
  priority: 'low' | 'medium' | 'high'
}

export interface SecurityAlert {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: string
  affected_user?: string
  action_required: boolean
  suggested_actions: string[]
}

export interface RecentActivity {
  user: string
  action: string
  target?: string
  timestamp: string
}

export interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  checks: {
    cpu: { status: string; value: number }
    memory: { status: string; value: number }
    disk: { status: string; value: number }
    network: { status: string; bytes_sent: number; bytes_recv: number }
  }
  uptime_seconds: number
  load_average: number[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total_count?: number
  pagination?: {
    limit: number
    offset: number
    has_next?: boolean
    has_more?: boolean
  }
}

export class SuperadminApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
        total_count: data.total_count,
        pagination: data.pagination
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // Core Dashboard
  async getDashboard(): Promise<ApiResponse<DashboardOverview>> {
    return this.makeRequest<DashboardOverview>('/api/superadmin/dashboard')
  }

  async getRealtimeAnalytics(): Promise<ApiResponse<RealtimeAnalytics>> {
    return this.makeRequest<RealtimeAnalytics>('/api/superadmin/analytics/realtime')
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return this.makeRequest<SystemHealth>('/api/superadmin/system/health')
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/system/stats')
  }

  // User Management
  async getUsers(filters?: {
    limit?: number
    offset?: number
    role_filter?: string
    status_filter?: string
    search?: string
  }): Promise<ApiResponse<{
    users: UserManagement[]
    total_count: number
    pagination: any
    role_distribution: Record<string, number>
    status_distribution: Record<string, number>
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/users?${params.toString()}`)
  }

  async createUser(userData: {
    email: string
    full_name: string
    role: string
    status: string
    initial_credits: number
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/users/create', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async deleteUser(userId: string, permanent = false): Promise<ApiResponse<any>> {
    const params = permanent ? '?permanent=true' : ''
    return this.makeRequest(`/api/superadmin/users/${userId}${params}`, {
      method: 'DELETE'
    })
  }

  async editUser(userId: string, updates: {
    email?: string
    full_name?: string
    role?: string
    status?: string
    subscription_tier?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value)
      }
    })
    return this.makeRequest(`/api/superadmin/users/${userId}/edit?${params.toString()}`, {
      method: 'PUT'
    })
  }

  async getUserActivities(userId: string, filters?: {
    limit?: number
    offset?: number
    activity_type?: string
    date_from?: string
    date_to?: string
  }): Promise<ApiResponse<{
    activities: UserActivity[]
    activity_summary: any
    user_statistics: any
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/users/${userId}/activities?${params.toString()}`)
  }

  // Credits Management
  async getCreditOverview(): Promise<ApiResponse<CreditOverview>> {
    return this.makeRequest<CreditOverview>('/api/superadmin/credits/overview')
  }

  async adjustUserCredits(userId: string, data: {
    operation: 'add' | 'deduct'
    amount: number
    reason: string
    transaction_type: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/credits/users/${userId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Billing & Transactions
  async getTransactions(filters?: {
    limit?: number
    offset?: number
    user_email?: string
    transaction_type?: string
    date_from?: string
    date_to?: string
    min_amount?: number
    max_amount?: number
  }): Promise<ApiResponse<{
    transactions: Transaction[]
    pagination: any
    summary: any
    filters_applied: any
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/billing/transactions?${params.toString()}`)
  }

  async getRevenueAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<any>> {
    const params = timeRange ? `?time_range=${timeRange}` : ''
    return this.makeRequest(`/api/superadmin/billing/revenue-analytics${params}`)
  }

  // Influencer Database
  async getInfluencers(filters?: {
    limit?: number
    offset?: number
    search?: string
    followers_min?: number
    followers_max?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<ApiResponse<{
    influencers: Influencer[]
    total_count: number
    pagination: any
    statistics: any
    top_performers: Influencer[]
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/influencers/master-database?${params.toString()}`)
  }

  async getInfluencerDetails(influencerId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/influencers/${influencerId}/detailed`)
  }

  // Proposals Management
  async getProposalsOverview(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/overview')
  }

  async getProposals(filters?: {
    limit?: number
    offset?: number
    status_filter?: string
    search?: string
  }): Promise<ApiResponse<{
    proposals: Proposal[]
    pagination: any
    filters_applied: any
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/proposals/manage?${params.toString()}`)
  }

  async updateProposalStatus(proposalId: string, newStatus: string, adminNotes?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    params.append('new_status', newStatus)
    if (adminNotes) {
      params.append('admin_notes', adminNotes)
    }
    return this.makeRequest(`/api/superadmin/proposals/${proposalId}/status?${params.toString()}`, {
      method: 'PUT'
    })
  }

  // Security
  async getSecurityAlerts(filters?: {
    limit?: number
    severity?: string
  }): Promise<ApiResponse<{
    alerts: SecurityAlert[]
    alert_counts: Record<string, number>
    suspicious_activities: any[]
    security_score: number
    recommendations: string[]
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/security/alerts?${params.toString()}`)
  }

  // System Actions
  async broadcastSystemMessage(message: {
    title: string
    content: string
    message_type: 'info' | 'warning' | 'maintenance' | 'feature'
    require_acknowledgment: boolean
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/system/broadcast', {
      method: 'POST',
      body: JSON.stringify(message)
    })
  }
}

export const superadminApiService = new SuperadminApiService()