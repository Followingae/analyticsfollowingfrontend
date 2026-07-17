/**
 * Superadmin Dashboard API Service
 * Cleaned up to only call backend endpoints that actually exist.
 * Phantom methods (no backend implementation) have been removed.
 */

import { getAuthHeaders, API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Core Types based on comprehensive backend API implementation
export interface DashboardOverview {
  system_health: {
    overall_status: 'healthy' | 'warning' | 'critical'
    cpu_usage_percent: number
    memory_usage_percent: number
    disk_usage_percent: number
    uptime_seconds: number
    services: Array<{
      name: string
      status: 'operational' | 'degraded' | 'down'
      response_time_ms: number
      last_check: string
    }>
    dependencies: Array<{
      name: string
      status: string
      version: string
    }>
  }
  user_statistics: {
    total_users: number
    active_users_last_7_days: number
    active_users_last_30_days: number
    new_registrations_today: number
    new_registrations_this_week: number
  }
  revenue_analytics: {
    total_revenue_aed_cents: number
    monthly_revenue_aed_cents: number
    monthly_growth_percent: number
    active_wallets: number
  }
  credit_system: {
    credits_in_circulation: number
    total_credits_distributed: number
    total_credits_spent: number
    average_credit_balance: number
  }
  performance_metrics: {
    avg_api_response_time_ms: number
    requests_per_second: number
    error_rate_percent: number
    cache_hit_rate_percent: number
  }
  security_alerts: SecurityAlert[]
  recent_activities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    user_id?: string
    metadata?: any
  }>
}

// Legacy type kept for components still referencing it. Backend method removed.
export interface RealtimeAnalytics {
  online_users: number
  active_sessions: number
  system_load: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
  recent_activities: any[]
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
      const fullUrl = `${this.baseUrl}${endpoint}`

      const response = await fetchWithAuth(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse superadmin API error response:', parseError)
          const errorText = await response.text().catch(() => '')
          if (errorText) errorMessage = errorText
        }
        return {
          success: false,
          error: errorMessage
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

  // Health check to verify backend connectivity
  async checkBackendHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/health')
  }

  // ===== CORE DASHBOARD =====
  // Backend: GET /api/superadmin/dashboard
  async getDashboard(): Promise<ApiResponse<DashboardOverview>> {
    return this.makeRequest<DashboardOverview>(ENDPOINTS.superadmin.dashboard)
  }

  async getComprehensiveDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.dashboard)
  }

  // Backend: GET /api/superadmin/system/health
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return this.makeRequest<SystemHealth>(ENDPOINTS.superadmin.systemHealth)
  }

  // Backend: GET /api/superadmin/system/stats
  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.systemStats)
  }

  // ===== USER MANAGEMENT =====
  // Backend: GET /api/superadmin/users
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
    return this.makeRequest(`${ENDPOINTS.superadmin.users}?${params.toString()}`)
  }

  // Backend: POST /api/superadmin/users/create
  async createUser(userData: {
    email: string
    password: string
    full_name: string
    company?: string
    phone_number?: string
    role?: string
    status?: string
    subscription_tier?: string
    initial_credits?: number
    credit_package_id?: number
    create_team?: boolean
    team_name?: string
    max_team_members?: number
    monthly_profile_limit?: number
    monthly_email_limit?: number
    monthly_posts_limit?: number
    admin_modules?: string[]
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/users/create', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  // Backend: POST /api/superadmin/users/{user_id}/status
  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  // ===== INFLUENCER DATABASE (READ) =====
  // Backend: GET /api/v1/admin/influencers/database
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
    return this.makeRequest(`${ENDPOINTS.superadmin.influencers}?${params.toString()}`)
  }

  // Backend: GET /api/v1/admin/influencers/{influencer_id}/detailed
  async getInfluencerDetails(influencerId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.influencerDetails(influencerId))
  }

  /** Lookup influencer in master database by username. Returns null-like if not found. */
  async getInfluencerByUsername(username: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.detail(username))
    return this.unwrapIMD(raw)
  }

  // ===== ADMIN USER MANAGEMENT (/api/v1/admin/...) =====
  // Backend: GET /api/v1/admin/users/{user_id}
  async getUserDetails(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.getUser(userId))
  }

  // Backend: PUT /api/v1/admin/users/{user_id}
  async updateUser(userId: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.updateUser(userId), {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Backend: POST /api/v1/admin/users/{user_id}/reset-password
  // Sets the password in Supabase Auth. The body is a bare JSON string — the endpoint
  // declares `new_password: str = Body(...)` with no embed, so it expects the value
  // itself, not {"new_password": ...}.
  async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(newPassword)
    })
  }

  // Backend: POST /api/v1/admin/credits/adjust
  async adjustUserCredits(userId: string, data: { amount: number; reason: string }): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.adjustCredits, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        ...data
      })
    })
  }

  // Backend: DELETE /api/v1/admin/users/{user_id}
  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.deleteUser(userId), {
      method: 'DELETE'
    })
  }

  // Backend: GET /api/v1/admin/users/{user_id}/activities
  async getUserActivity(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.getUserActivity(userId))
  }

  // Backend: GET /api/v1/credits/transactions
  async getCreditTransactions(userId?: string): Promise<ApiResponse<any>> {
    const url = userId
      ? `/api/v1/credits/transactions?user_id=${userId}`
      : '/api/v1/credits/transactions'
    return this.makeRequest(url)
  }

  // ===== INFLUENCER MASTER DATABASE =====
  // Backend IMD routes wrap responses in {"success":true,"data":{...}}.
  // makeRequest already sets success from HTTP status and puts the full
  // JSON body as `data`, so we unwrap the inner `.data` to avoid double-nesting.
  private unwrapIMD<T>(raw: ApiResponse<any>): ApiResponse<T> {
    if (raw.success && raw.data?.data !== undefined) {
      return { ...raw, data: raw.data.data }
    }
    return raw
  }

  async getInfluencerDatabase(filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      const { page, page_size, search, status, pricing_tier, tags, categories, countries, followers_min, followers_max, engagement_min, engagement_max, is_verified, has_pricing, sort_by, sort_order } = filters
      if (page) params.append('page', page.toString())
      if (page_size) params.append('page_size', page_size.toString())
      if (search) params.append('search', search)
      if (status && Array.isArray(status) && status.length > 0) params.append('status', status[0])
      if (pricing_tier && Array.isArray(pricing_tier) && pricing_tier.length > 0) params.append('tier', pricing_tier[0])
      if (tags && Array.isArray(tags) && tags.length > 0) params.append('tags', tags.join(','))
      if (categories && Array.isArray(categories) && categories.length > 0) params.append('categories', categories.join(','))
      // Multi-value, unlike status/tier above which only ever send the first selection.
      if (countries && Array.isArray(countries) && countries.length > 0) params.append('countries', countries.join(','))
      if (followers_min !== undefined && followers_min !== null) params.append('min_followers', followers_min.toString())
      if (followers_max !== undefined && followers_max !== null) params.append('max_followers', followers_max.toString())
      if (engagement_min !== undefined && engagement_min !== null) params.append('engagement_min', engagement_min.toString())
      if (engagement_max !== undefined && engagement_max !== null) params.append('engagement_max', engagement_max.toString())
      if (is_verified !== undefined && is_verified !== null) params.append('is_verified', is_verified.toString())
      if (has_pricing !== undefined && has_pricing !== null) params.append('has_pricing', has_pricing.toString())
      if (sort_by) params.append('sort_by', sort_by)
      if (sort_order) params.append('sort_order', sort_order)
    }
    const raw = await this.makeRequest(`${ENDPOINTS.influencerDatabase.database}?${params.toString()}`)
    return this.unwrapIMD(raw)
  }

  async addInfluencerToDatabase(username: string, metadata?: any): Promise<ApiResponse<any>> {
    const payload: any = { username }
    if (metadata) {
      if (metadata.categories) payload.categories = metadata.categories
      if (metadata.tags) payload.tags = metadata.tags
      if (metadata.internal_notes !== undefined) payload.notes = metadata.internal_notes
      else if (metadata.notes !== undefined) payload.notes = metadata.notes
      if (metadata.status) payload.status = metadata.status
      if (metadata.tier) payload.tier = metadata.tier
      if (metadata.cost_pricing) payload.cost_pricing = metadata.cost_pricing
      if (metadata.sell_pricing) payload.sell_pricing = metadata.sell_pricing
    }
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.add, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return this.unwrapIMD(raw)
  }

  async bulkImportInfluencers(usernames: string[]): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.bulkImport, {
      method: 'POST',
      body: JSON.stringify({ usernames })
    })
    return this.unwrapIMD(raw)
  }

  async updateInfluencerMetadata(id: string, data: any): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.update(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return this.unwrapIMD(raw)
  }

  async removeInfluencerFromDatabase(id: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.delete(id), {
      method: 'DELETE'
    })
    return this.unwrapIMD(raw)
  }

  async refreshInfluencerAnalytics(id: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.refresh(id), {
      method: 'POST'
    })
    return this.unwrapIMD(raw)
  }

  async bulkTagInfluencers(ids: string[], tags: string[], action: 'add' | 'remove'): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.bulkTag, {
      method: 'POST',
      body: JSON.stringify({ influencer_ids: ids, tags, action })
    })
    return this.unwrapIMD(raw)
  }

  async bulkUpdateInfluencerPricing(updates: any[]): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.bulkPricing, {
      method: 'POST',
      body: JSON.stringify({ updates })
    })
    return this.unwrapIMD(raw)
  }

  async exportInfluencers(params: any): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.export, {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return this.unwrapIMD(raw)
  }

  async getAvailableTags(): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.tags)
    return this.unwrapIMD(raw)
  }

  async getAnalyticsStatus(ids: string[]): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(`/api/v1/admin/influencer-database/analytics-status?ids=${ids.join(',')}`)
    return raw
  }

  async triggerInfluencerAnalytics(id: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(`/api/v1/admin/influencer-database/${id}/trigger-analytics`, {
      method: 'POST'
    })
    return raw
  }

  async getInfluencerShares(): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.shares)
    return this.unwrapIMD(raw)
  }

  async createInfluencerShare(data: any): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.shares, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return this.unwrapIMD(raw)
  }

  async updateInfluencerShare(id: string, data: any): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.shareDetail(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return this.unwrapIMD(raw)
  }

  async revokeInfluencerShare(id: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.shareRevoke(id), {
      method: 'POST'
    })
    return this.unwrapIMD(raw)
  }

  async extendInfluencerShare(id: string, expiresAt: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.shareExtend(id), {
      method: 'POST',
      body: JSON.stringify({ expires_at: expiresAt })
    })
    return this.unwrapIMD(raw)
  }

  async getSharedInfluencersForUser(): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.sharedForUser)
    return this.unwrapIMD(raw)
  }

  async getSharedListsForUser(): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.sharedListsForUser)
    return this.unwrapIMD(raw)
  }
}

export const superadminApiService = new SuperadminApiService()

// Export convenience function for backward compatibility
export const superadminApi = superadminApiService
