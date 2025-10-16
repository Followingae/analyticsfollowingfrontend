/**
 * Superadmin Dashboard API Service
 * Updated to match the comprehensive backend implementation
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
    total_revenue_usd_cents: number
    monthly_revenue_usd_cents: number
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

// Additional Types for New API Endpoints
export interface AISystemStatus {
  model_performance: Record<string, {
    success_rate: number
    avg_processing_time: number
    queue_depth: number
    last_updated: string
  }>
  processing_queue: {
    total_jobs: number
    pending_jobs: number
    failed_jobs: number
    estimated_completion: string
  }
  analysis_stats: {
    total_analyses: number
    success_rate: number
    avg_processing_time: number
    content_categories: Record<string, number>
  }
}

export interface ContentModeration {
  flagged_content: Array<{
    id: string
    type: string
    content_url: string
    reason: string
    severity: string
    created_at: string
  }>
  moderation_queue_count: number
  category_distribution: Record<string, number>
  auto_moderation_stats: {
    total_flagged: number
    false_positives: number
    accuracy_rate: number
  }
}

export interface SystemConfiguration {
  configurations: Record<string, {
    value: any
    description: string
    last_updated: string
    requires_restart: boolean
  }>
  feature_flags: Record<string, {
    enabled: boolean
    rollout_percentage: number
    target_segments: string[]
    created_at: string
  }>
}

export interface PlatformAnalytics {
  usage_metrics: {
    api_calls_by_endpoint: Record<string, number>
    user_journey_funnel: Array<{
      step: string
      users: number
      conversion_rate: number
    }>
    feature_adoption: Record<string, {
      active_users: number
      adoption_rate: number
    }>
  }
  performance_metrics: {
    response_times: {
      p50: number
      p95: number
      p99: number
    }
    error_rates: Record<string, number>
    cache_performance: {
      hit_rate: number
      miss_rate: number
    }
  }
}

export interface UserIntelligence {
  cohort_analysis: {
    cohorts: Array<{
      cohort_period: string
      initial_users: number
      retention_rates: Record<string, number>
    }>
  }
  user_segmentation: {
    segments: Array<{
      segment_name: string
      user_count: number
      characteristics: Record<string, any>
    }>
  }
  business_forecasting: {
    revenue_forecast: Array<{
      period: string
      predicted_revenue: number
      confidence_interval: [number, number]
    }>
    user_growth_forecast: Array<{
      period: string
      predicted_users: number
    }>
  }
}

export interface OperationsHealth {
  system_health: {
    services: Record<string, {
      status: 'healthy' | 'warning' | 'critical'
      response_time: number
      last_check: string
    }>
    dependencies: Record<string, {
      status: string
      version: string
    }>
  }
  audit_logs: Array<{
    id: string
    user_id: string
    action: string
    details: any
    timestamp: string
    ip_address: string
  }>
}

export interface DataExportJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  file_url?: string
  expires_at?: string
  tables: string[]
  row_count?: number
  file_size?: number
}

export interface SecurityThreats {
  threats: Array<{
    id: string
    type: string
    severity: string
    description: string
    affected_entities: string[]
    detected_at: string
    status: string
  }>
  threat_summary: {
    high_severity: number
    medium_severity: number
    low_severity: number
    resolved_24h: number
  }
}

// Worker Monitoring Types
export interface WorkerOverview {
  timestamp?: string

  // System Overview (from your specification)
  system_overview?: {
    total_workers: number
    active_workers: number        // Based on 24h activity
    overall_health: 'healthy' | 'degraded' | 'critical'
    system_load: number
    total_tasks_processed: number
    avg_system_response_time: number
  }

  // Legacy fields (for backward compatibility)
  total_workers: number
  active_workers: number
  idle_workers?: number
  failed_workers?: number
  total_jobs_processed?: number
  current_queue_size?: number
  avg_processing_time_ms?: number

  system_load?: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }

  workers: WorkerSummary[]
}

export interface WorkerSummary {
  worker_name: string               // Exact API field name
  status: 'active' | 'idle' | 'error'
  current_job: string               // "Creator Analytics", "Profile Discovery", "Idle"
  tasks_processed: number
  avg_processing_time: number       // seconds
  last_activity: string             // ISO timestamp

  // 24h Activity Metrics (exact API field names)
  profiles_created_24h?: number     // Discovery Worker
  posts_processed_24h?: number      // Discovery Worker
  related_profiles_24h?: number     // Similar Profiles Processor
  total_related_profiles?: number   // Similar Profiles Processor
  cdn_jobs_24h?: number            // CDN Processor
  total_cdn_assets?: number        // CDN Processor
}

export interface WorkerDetails {
  name: string
  status: 'active' | 'idle' | 'failed' | 'stopped'
  pid?: number
  started_at: string
  uptime_seconds: number
  current_job?: {
    id: string
    type: string
    started_at: string
    progress?: number
  }
  stats: {
    jobs_processed: number
    jobs_failed: number
    avg_processing_time_ms: number
    last_job_completed_at?: string
  }
  health: {
    cpu_percent: number
    memory_mb: number
    status: 'healthy' | 'warning' | 'critical'
  }
  recent_jobs: Array<{
    id: string
    type: string
    status: 'completed' | 'failed'
    started_at: string
    completed_at: string
    processing_time_ms: number
    error?: string
  }>
}

export interface QueueStatus {
  total_jobs: number
  pending_jobs: number
  processing_jobs: number
  completed_jobs: number
  failed_jobs: number
  queues: Array<{
    name: string
    size: number
    oldest_job_age_seconds?: number
    processing_rate_per_minute: number
  }>
}

export interface WorkerPerformanceMetrics {
  timeframe: string
  metrics: Array<{
    timestamp: string
    total_workers: number
    active_workers: number
    jobs_processed_per_minute: number
    avg_processing_time_ms: number
    error_rate_percent: number
    cpu_usage_percent: number
    memory_usage_percent: number
  }>
}

export interface WorkerControlResponse {
  success: boolean
  message: string
  worker_name: string
  action: string
  previous_status?: string
  new_status?: string
}

// Analytics Completeness Types
export interface AnalyticsCompletenessProfile {
  profile_id: string
  username: string
  is_complete: boolean
  completeness_score: number
  missing_components: string[]
  followers_count: number
  stored_posts_count: number
  ai_analyzed_posts_count: number
  cdn_processed_posts_count: number
  posts_analysis?: {
    total_posts: number
    ai_analyzed_posts: number
    cdn_processed_posts: number
    oldest_post?: string
    newest_post?: string
    avg_likes: number
    avg_comments: number
  }
}

export interface AnalyticsCompletenessScanRequest {
  limit?: number
  username_filter?: string
  include_complete?: boolean
}

export interface AnalyticsCompletenessScanResponse {
  success: boolean
  scan_timestamp: string
  execution_time_seconds: number
  summary: {
    total_profiles: number
    complete_profiles: number
    incomplete_profiles: number
    completeness_percentage: number
    average_completeness_score: number
    needs_posts?: number
    needs_ai_analysis?: number
    needs_cdn_processing?: number
  }
  profiles: AnalyticsCompletenessProfile[]
  incomplete_profiles: AnalyticsCompletenessProfile[]
}

export interface AnalyticsCompletenessRepairRequest {
  profile_ids?: string[]
  max_profiles?: number
  dry_run?: boolean
  force_repair?: boolean
}

export interface AnalyticsCompletenessRepairResult {
  profile_id: string
  username: string
  status: 'success' | 'failed'
  message?: string
  error?: string
}

export interface AnalyticsCompletenessRepairResponse {
  success: boolean
  operation_id: string
  execution_time_seconds?: number
  dry_run?: boolean
  summary?: {
    total_profiles: number
    successful_repairs: number
    failed_repairs: number
    success_rate: number
  }
  repair_results?: AnalyticsCompletenessRepairResult[]
  profiles_to_repair?: number
}

export interface AnalyticsCompletenessDashboard {
  success: boolean
  generated_at: string
  system_stats: {
    total_profiles: number
    complete_profiles: number
    incomplete_profiles: number
    completeness_percentage: number
    avg_followers: number
    last_profile_update: string
    profiles_created_24h: number
    profiles_updated_24h: number
  }
  completeness_distribution: Array<{
    completeness_category: string
    profile_count: number
    avg_followers: number
  }>
  recent_repair_operations: Array<{
    operation_id: string
    started_by: string
    total_profiles: number
    completed_profiles: number
    failed_profiles: number
    status: string
    started_at: string
    completed_at?: string
  }>
  system_health: {
    status: 'healthy' | 'needs_attention'
    recommendations: string[]
  }
}

export interface AnalyticsCompletenessStats {
  total_profiles: number
  complete_profiles: number
  incomplete_profiles: number
  completeness_percentage: number
  profiles_created_24h: number
  profiles_updated_24h: number
}

export interface AnalyticsCompletenessHealth {
  success: boolean
  timestamp: string
  overall_status: 'healthy' | 'degraded' | 'critical'
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'critical'
      description: string
    }
    analytics_service: {
      status: 'healthy' | 'degraded' | 'critical'
      description: string
    }
    bulletproof_search: {
      status: 'healthy' | 'degraded' | 'critical'
      description: string
    }
  }
  metrics: AnalyticsCompletenessStats
  recommendations: string[]
  recent_activity: any
}

export interface AnalyticsCompletenessValidationResponse {
  success: boolean
  username: string
  profile_analysis: AnalyticsCompletenessProfile
  posts_analysis: {
    total_posts: number
    ai_analyzed_posts: number
    cdn_processed_posts: number
    oldest_post?: string
    newest_post?: string
    avg_likes: number
    avg_comments: number
  }
  recommendations: string[]
  validated_at: string
}

// Additional interfaces for comprehensive API
export interface SystemStats {
  total_users: number
  active_campaigns: number
  total_credits_in_circulation: number
  system_health_score: number
  new_registrations_today: number
  credits_spent_today: number
  total_profiles_analyzed: number
  api_calls_today: number
  average_response_time_ms: number
}

export interface SuspiciousActivity {
  id: string
  activity_type: string
  description: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  detected_at: string
  user_id?: string
  ip_address?: string
  metadata?: any
}

export interface ComprehensiveDashboard {
  system_health: DashboardOverview['system_health']
  user_statistics: DashboardOverview['user_statistics']
  revenue_analytics: DashboardOverview['revenue_analytics']
  credit_system: DashboardOverview['credit_system']
  performance_metrics: DashboardOverview['performance_metrics']
  security_overview: {
    active_threats: number
    security_score: number
    recent_incidents: number
  }
  platform_metrics: {
    total_profiles_analyzed: number
    ai_analyses_completed: number
    api_calls_today: number
  }
  recent_activities: DashboardOverview['recent_activities']
}

// Incomplete Profiles Management Types
export interface IncompleteProfile {
  id: string
  username: string
  followers_count: number
  posts_count: number
  ai_posts_count: number
  has_profile_ai: boolean
  completeness_score: number
  issues: string[]
}

export interface IncompleteProfilesResponse {
  profiles: IncompleteProfile[]
  total_count: number
  total_pages: number
}

// Worker Activity Logs Types
export interface WorkerActivityLog {
  timestamp: string
  worker: string
  activity: string
  details: string
  status: 'completed' | 'failed' | 'in_progress'
  metadata?: {
    username?: string
    followers?: number
    has_ai_analysis?: boolean
    [key: string]: any
  }
}

export interface WorkerActivityResponse {
  activity_logs: WorkerActivityLog[]
  summary: {
    discovery_activities: number
    similar_profile_activities: number
    cdn_activities: number
  }
}

// Discovery Control Types
export interface UnprocessedProfile {
  related_username: string
  similarity_score: number
  discovered_at: string
  processing_status: string
  related_followers_count: number
}

export interface DiscoveryQueueStatus {
  processor_running: boolean
  worker_active: boolean
  discovery_stats: {
    total_discovered: number
    unprocessed_count: number
    processed_count: number
  }
  unprocessed_profiles: UnprocessedProfile[]
  action_required: boolean
}

export interface ProcessedProfileResult {
  username: string
  status: 'success' | 'failed' | 'error'
  profile_id?: string
  error?: string
}

export interface ProcessAllUnprocessedResponse {
  success: boolean
  message: string
  summary: {
    total_processed: number
    successful: number
    failed: number
  }
  profiles: ProcessedProfileResult[]
  triggered_by: string
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
      console.log('🌐 SUPERADMIN API CALL:', fullUrl)
      console.log('🔑 Auth Headers:', options.headers || 'Using fetchWithAuth default headers')

      const response = await fetchWithAuth(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      console.log('📡 RESPONSE STATUS:', response.status)
      console.log('📡 RESPONSE OK:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ SUPERADMIN API ERROR:', errorText)
        console.error('❌ STATUS CODE:', response.status)
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      console.log('✅ SUPERADMIN API SUCCESS:', data)
      return {
        success: true,
        data,
        total_count: data.total_count,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('❌ SUPERADMIN NETWORK ERROR:', error)
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

  // Core Dashboard - Using centralized ENDPOINTS configuration
  async getDashboard(): Promise<ApiResponse<DashboardOverview>> {
    return this.makeRequest<DashboardOverview>(ENDPOINTS.superadmin.dashboard)
  }

  async getComprehensiveDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.dashboard)
  }

  async getRealtimeAnalytics(): Promise<ApiResponse<RealtimeAnalytics>> {
    return this.makeRequest<RealtimeAnalytics>(ENDPOINTS.superadmin.realtimeAnalytics)
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return this.makeRequest<SystemHealth>(ENDPOINTS.superadmin.systemHealth)
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.systemStats)
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
    return this.makeRequest(`${ENDPOINTS.superadmin.users}?${params.toString()}`)
  }

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
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/users/create', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async deleteUser(userId: string, permanent = false): Promise<ApiResponse<any>> {
    const params = permanent ? '?permanent=true' : ''
    return this.makeRequest(`${ENDPOINTS.superadmin.deleteUser(userId)}${params}`, {
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
    return this.makeRequest(`${ENDPOINTS.superadmin.editUser(userId)}?${params.toString()}`, {
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
    return this.makeRequest(`${ENDPOINTS.superadmin.userActivities(userId)}?${params.toString()}`)
  }

  // Credits Management
  async getCreditOverview(): Promise<ApiResponse<CreditOverview>> {
    return this.makeRequest<CreditOverview>(ENDPOINTS.superadmin.creditOverview)
  }

  async adjustUserCredits(userId: string, data: {
    operation: 'add' | 'deduct'
    amount: number
    reason: string
    transaction_type: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.adjustUserCredits(userId), {
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
    return this.makeRequest(`${ENDPOINTS.superadmin.transactions}?${params.toString()}`)
  }

  async getRevenueAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<any>> {
    const params = timeRange ? `?time_range=${timeRange}` : ''
    return this.makeRequest(`${ENDPOINTS.superadmin.revenueAnalytics}${params}`)
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
    return this.makeRequest(`${ENDPOINTS.superadmin.influencers}?${params.toString()}`)
  }

  async getInfluencerDetails(influencerId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.influencerDetails(influencerId))
  }

  // Get available influencers for proposal creation
  async getAvailableInfluencers(params?: {
    search?: string
    category?: string
    followers_min?: number
    followers_max?: number
    has_pricing?: boolean
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    influencers: Array<{
      id: string
      username: string
      full_name: string
      followers_count: number
      content_category?: string
      engagement_rate?: number
      has_database_pricing: boolean
      pricing?: {
        story_price_usd_cents?: number
        post_price_usd_cents?: number
        reel_price_usd_cents?: number
      }
    }>
    total_count: number
    limit: number
    offset: number
    has_more: boolean
  }>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
    }

    const url = `${ENDPOINTS.superadmin.availableInfluencers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.makeRequest(url)
  }

  // Proposals Management
  async getProposalsOverview(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.proposalsOverview)
  }

  async getProposals(filters?: {
    limit?: number
    offset?: number
    status?: string
    search?: string
  }): Promise<ApiResponse<Proposal[]>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`${ENDPOINTS.superadmin.brandProposals}?${params.toString()}`)
  }

  async updateProposalStatus(proposalId: string, newStatus: string, adminNotes?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    params.append('new_status', newStatus)
    if (adminNotes) {
      params.append('admin_notes', adminNotes)
    }
    return this.makeRequest(`${ENDPOINTS.superadmin.proposalStatus(proposalId)}?${params.toString()}`, {
      method: 'PUT'
    })
  }

  // Enhanced Security
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
    return this.makeRequest(`${ENDPOINTS.superadmin.securityAlerts}?${params.toString()}`)
  }

  // Advanced Analytics
  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.platformAnalytics)
  }

  // Advanced User Management
  async getUserPermissions(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/permissions`)
  }

  async updateUserPermissions(userId: string, permissions: Record<string, boolean>): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions, override_role: true })
    })
  }

  async manageMFA(userId: string, action: string, method: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/security/mfa`, {
      method: 'POST',
      body: JSON.stringify({ action, method })
    })
  }

  async manageUserSessions(userId: string, action: string, deviceId?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/security/sessions`, {
      method: 'POST',
      body: JSON.stringify({ action, device_id: deviceId })
    })
  }

  async resetUserPassword(userId: string, options: {
    notify_user?: boolean
    force_change?: boolean
    temporary_password?: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/security/password-reset`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async getUserLoginHistory(userId: string, filters?: {
    limit?: number
    date_from?: string
    date_to?: string
    include_failed_attempts?: boolean
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/users/${userId}/login-history?${params.toString()}`)
  }

  async impersonateUser(userId: string, options: {
    duration_minutes?: number
    reason?: string
    notify_user?: boolean
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/impersonate`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  async bulkUserOperations(operation: string, userIds: string[], parameters: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/users/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({ operation, user_ids: userIds, parameters })
    })
  }

  async advancedUserSearch(filters: {
    role?: string
    status?: string
    last_login_before?: string
    credits_range?: [number, number]
    team_id?: string
    subscription_tier?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, value.toString())
        }
      }
    })
    return this.makeRequest(`/api/superadmin/users/advanced-search?${params.toString()}`)
  }

  // Role & Permission Management
  async getRoles(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/roles')
  }

  async createRole(roleData: {
    role_name: string
    permissions: Record<string, any>
    role_level: number
    description: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/roles/create', {
      method: 'POST',
      body: JSON.stringify(roleData)
    })
  }

  async updateRolePermissions(roleId: string, permissions: Record<string, any>, applyToExisting = true): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions, apply_to_existing_users: applyToExisting })
    })
  }

  async getPermissionMatrix(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/permissions/matrix')
  }

  // Team Management
  async getComprehensiveTeams(options?: {
    include_members?: boolean
    include_usage?: boolean
    include_billing?: boolean
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) {
          params.append(key, 'true')
        }
      })
    }
    return this.makeRequest(`/api/superadmin/teams/comprehensive?${params.toString()}`)
  }

  async bulkTeamMemberOperations(teamId: string, operation: string, userIds: string[], teamRole?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/teams/${teamId}/members/bulk`, {
      method: 'POST',
      body: JSON.stringify({ operation, user_ids: userIds, team_role: teamRole })
    })
  }

  async updateTeamPermissions(teamId: string, permissions: Record<string, any>, overrideIndividual = false): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/teams/${teamId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions, override_individual: overrideIndividual })
    })
  }

  // AI System Management
  async getAIModelsStatus(): Promise<ApiResponse<AISystemStatus>> {
    return this.makeRequest<AISystemStatus>('/api/superadmin/ai/models/status')
  }

  async getAIAnalysisQueue(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/ai/analysis/queue')
  }

  async getAIAnalysisStats(filters?: {
    date_from?: string
    date_to?: string
    model_type?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/ai/analysis/stats?${params.toString()}`)
  }

  async retryAIAnalysis(jobIds?: string[], modelTypes?: string[]): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/ai/analysis/retry', {
      method: 'POST',
      body: JSON.stringify({ job_ids: jobIds, model_types: modelTypes })
    })
  }

  // Content & Media Management
  async getContentModerationQueue(): Promise<ApiResponse<ContentModeration>> {
    return this.makeRequest<ContentModeration>('/api/superadmin/content/moderation/queue')
  }

  async getContentCategoriesDistribution(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/content/categories/distribution')
  }

  async getCDNPerformance(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/cdn/performance')
  }

  async getCDNAssets(filters?: {
    asset_type?: string
    status?: string
    date_range?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/cdn/assets?${params.toString()}`)
  }

  // System Configuration
  async getSystemConfigurations(): Promise<ApiResponse<SystemConfiguration>> {
    return this.makeRequest<SystemConfiguration>('/api/superadmin/system/configurations')
  }

  async updateSystemConfiguration(configKey: string, value: any, description?: string, requiresRestart = false): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/system/configurations', {
      method: 'PUT',
      body: JSON.stringify({
        config_key: configKey,
        value,
        description,
        requires_restart: requiresRestart
      })
    })
  }

  async getFeatureFlags(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/system/feature-flags')
  }

  async toggleFeatureFlag(flagId: string, enabled: boolean, rolloutPercentage = 100, targetSegments: string[] = []): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/system/feature-flags/${flagId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({
        enabled,
        rollout_percentage: rolloutPercentage,
        target_segments: targetSegments
      })
    })
  }

  // Advanced Platform Analytics
  async getDetailedPlatformUsage(options?: {
    timeframe?: string
    breakdown_by?: string
    include_segments?: boolean
  }): Promise<ApiResponse<PlatformAnalytics>> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest<PlatformAnalytics>(`/api/superadmin/platform/usage/detailed?${params.toString()}`)
  }

  async getPlatformPerformanceMetrics(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/platform/performance/metrics')
  }

  async getAPIUsageAnalytics(filters?: {
    user_id?: string
    endpoint_pattern?: string
    time_range?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/platform/api/usage?${params.toString()}`)
  }

  // Advanced User Intelligence
  async getCohortAnalysis(options?: {
    cohort_period?: string
    retention_periods?: string
  }): Promise<ApiResponse<UserIntelligence>> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest<UserIntelligence>(`/api/superadmin/users/cohort-analysis?${params.toString()}`)
  }

  async getUserSegmentation(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/users/segmentation')
  }

  async getBusinessForecasting(options?: {
    forecast_period?: string
    metrics?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/business/forecasting?${params.toString()}`)
  }

  // Platform Operations
  async getOperationsHealth(): Promise<ApiResponse<OperationsHealth>> {
    return this.makeRequest<OperationsHealth>('/api/superadmin/operations/health')
  }

  async getAuditLog(filters?: {
    user_id?: string
    action_type?: string
    date_range?: string
    severity?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/operations/audit-log?${params.toString()}`)
  }

  async performMaintenance(operation: string, dryRun = true, schedule = 'now'): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/operations/maintenance', {
      method: 'POST',
      body: JSON.stringify({ operation, dry_run: dryRun, schedule })
    })
  }

  async getBackupStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/operations/backup-status')
  }

  // Data Export & Integration
  async createDataExport(options: {
    tables: string[]
    date_range?: Record<string, string>
    format?: 'csv' | 'json'
    include_pii?: boolean
  }): Promise<ApiResponse<DataExportJob>> {
    return this.makeRequest<DataExportJob>('/api/superadmin/data/export/comprehensive', {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async getDataExportJobs(): Promise<ApiResponse<{ jobs: DataExportJob[] }>> {
    return this.makeRequest<{ jobs: DataExportJob[] }>('/api/superadmin/data/export/jobs')
  }

  async getThirdPartyIntegrations(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/integrations/third-party')
  }

  // Security & Compliance
  async getSecurityThreats(): Promise<ApiResponse<SecurityThreats>> {
    return this.makeRequest<SecurityThreats>('/api/superadmin/security/threats')
  }

  async getSuspiciousActivities(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/security/suspicious-activities')
  }

  async getComplianceReports(options?: {
    report_type?: string
    date_range?: string
    regulation?: string
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/compliance/reports?${params.toString()}`)
  }

  async emergencyUserLock(userId: string, action: 'lock' | 'unlock' | 'force_logout', reason: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/security/user-lock', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, action, reason })
    })
  }

  // Feature Access Management
  async getFeatureAccessGrants(filters?: {
    feature_type?: string
    user_id?: string
    team_id?: string
    status?: string
    expires_soon?: boolean
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/features/access-grants?${params.toString()}`)
  }

  async bulkFeatureGrant(options: {
    feature: string
    users?: string[]
    teams?: string[]
    access_level: string
    expires_at?: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/features/bulk-grant', {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async grantProposalAccess(userId: string, options: {
    access_level: string
    expires_at?: string
    reason?: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/features/proposals/grant`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async revokeProposalAccess(userId: string, options: {
    reason: string
    immediate?: boolean
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/features/proposals/revoke`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Enhanced Proposals Management
  async setInfluencerPricing(profileId: string, pricingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/pricing/influencers', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId, ...pricingData })
    })
  }

  async getInfluencerPricing(profileId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.makeRequest(`/api/superadmin/proposals/pricing/influencers/${profileId}`)
      return response
    } catch (error: any) {
      // Handle 404/500 gracefully - pricing not available is normal for most influencers
      if (error?.status === 404 || error?.status === 500) {
        return {
          success: false,
          data: null,
          error: 'Pricing not available',
          status: error.status
        }
      }
      throw error
    }
  }

  async calculateCampaignPricing(profileId: string, campaignRequirements: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/pricing/calculate/${profileId}`, {
      method: 'POST',
      body: JSON.stringify(campaignRequirements)
    })
  }

  async createInviteCampaign(campaignData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/invite-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    })
  }

  async publishInviteCampaign(campaignId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/invite-campaigns/${campaignId}/publish`, {
      method: 'POST'
    })
  }

  async getCampaignApplications(campaignId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/invite-campaigns/${campaignId}/applications`)
  }

  async approveApplication(applicationId: string, decision: {
    approved: boolean
    feedback?: string
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify(decision)
    })
  }

  // Individual brands for proposal creation
  async getAvailableBrands(params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    brands: Array<{
      id: string
      email: string
      full_name: string
      role: string
      subscription_tier: string
      status: string
      team?: {
        id: string
        name: string
      }
      total_proposals: number
      created_at: string
    }>
    total_count: number
    limit: number
    offset: number
    has_more: boolean
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const url = `/api/superadmin/proposals/brands/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.makeRequest(url)
  }

  // Team-based brand selection endpoints
  async getBrandTeams(): Promise<ApiResponse<{
    teams: Array<{
      team_id: string
      team_name: string
      company_name: string
      subscription_tier: string
      member_count: number
      total_proposals: number
      team_members: Array<{
        user_id: string
        email: string
        full_name: string
        role: string
        team_role: string
      }>
      auto_select_all: boolean
    }>
    instructions: {
      usage: string
      team_member_selection: string
    }
  }>> {
    return this.makeRequest('/api/superadmin/proposals/brands/teams')
  }

  async getTeamMembers(teamId: string): Promise<ApiResponse<{
    team: {
      team_id: string
      team_name: string
      company_name: string
    }
    members: Array<{
      user_id: string
      email: string
      full_name: string
      role: string
      team_role: string
    }>
    all_user_ids: string[]
    auto_selection_ready: boolean
  }>> {
    return this.makeRequest(`/api/superadmin/proposals/brands/teams/${teamId}/members`)
  }


  // Draft proposal management - single draft per user system
  async getBrandProposalLatestDraft(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/brand-proposals/drafts/latest')
  }

  async saveBrandProposalDraft(draftData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/brand-proposals/drafts', {
      method: 'POST',
      body: JSON.stringify(draftData)
    })
  }

  async deleteBrandProposalDraft(draftId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/drafts/${draftId}`, {
      method: 'DELETE'
    })
  }

  async convertDraftToProposal(draftId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/drafts/${draftId}/convert`, {
      method: 'POST'
    })
  }

  async assignInfluencersToProposal(proposalId: string, influencerData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}/influencers`, {
      method: 'POST',
      body: JSON.stringify(influencerData)
    })
  }

  async sendBrandProposal(proposalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}/send`, {
      method: 'POST'
    })
  }

  async getBrandProposals(filters?: {
    status?: string
    brand?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals?${params.toString()}`)
  }

  async createBrandProposal(proposalData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/brand-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData)
    })
  }

  async assignInfluencersToProposal(proposalId: string, influencerData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}/influencers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(influencerData)
    })
  }

  async sendBrandProposal(proposalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}/send`, {
      method: 'POST'
    })
  }

  async getBrandProposalDetails(proposalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}`)
  }

  async getProposalsDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/dashboard')
  }

  async getProposalsHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/health')
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

  // Missing Critical Methods - Added to match comprehensive API
  async getSuspiciousActivities(filters?: {
    limit?: number
    severity?: string
    user_id?: string
  }): Promise<ApiResponse<{
    activities: SuspiciousActivity[]
    total_count: number
    severity_distribution: Record<string, number>
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest(`/api/superadmin/security/suspicious-activities?${params.toString()}`)
  }

  async getPlatformAnalytics(): Promise<ApiResponse<PlatformAnalytics>> {
    return this.makeRequest<PlatformAnalytics>('/api/superadmin/platform/analytics/comprehensive')
  }

  async getSystemComponents(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/system/components')
  }

  async restartSystemComponent(componentName: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/system/components/${componentName}/restart`, {
      method: 'POST'
    })
  }

  async getAIAnalysisOverview(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/ai/analysis/overview')
  }

  async getContentAnalyticsOverview(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/content/analytics/overview')
  }

  // User Management Methods - Using standardized admin endpoints
  async getUserDetails(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.getUser(userId))
  }

  async updateUser(userId: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.updateUser(userId), {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async adjustUserCredits(userId: string, data: { amount: number; reason: string }): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.adjustCredits, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        ...data
      })
    })
  }

  async verifyUserEmail(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.verifyUserEmail(userId), {
      method: 'POST'
    })
  }

  async resetUser2FA(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.resetUser2FA(userId), {
      method: 'POST'
    })
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.deleteUser(userId), {
      method: 'DELETE'
    })
  }

  async getUserActivity(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.admin.getUserActivity(userId))
  }

  async getCreditTransactions(userId?: string): Promise<ApiResponse<any>> {
    const url = userId
      ? `/api/v1/credits/transactions?user_id=${userId}`
      : '/api/v1/credits/transactions'
    return this.makeRequest(url)
  }

  // Worker Monitoring System
  async getWorkerOverview(): Promise<ApiResponse<WorkerOverview>> {
    return this.makeRequest<WorkerOverview>('/api/v1/workers/overview')
  }

  async getWorkerDetails(workerName: string): Promise<ApiResponse<WorkerDetails>> {
    return this.makeRequest<WorkerDetails>(`/api/v1/workers/worker/${workerName}/details`)
  }

  async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
    return this.makeRequest<QueueStatus>('/api/v1/workers/queue/status')
  }

  async getWorkerPerformanceMetrics(timeframe?: string): Promise<ApiResponse<WorkerPerformanceMetrics>> {
    const params = timeframe ? `?timeframe=${timeframe}` : ''
    return this.makeRequest<WorkerPerformanceMetrics>(`/api/v1/workers/performance/metrics${params}`)
  }

  async controlWorker(workerName: string, action: 'start' | 'stop' | 'restart' | 'pause' | 'resume'): Promise<ApiResponse<WorkerControlResponse>> {
    return this.makeRequest<WorkerControlResponse>(`/api/v1/workers/worker/${workerName}/control`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
  }

  // Worker Live Stream (SSE) - returns EventSource for real-time updates
  createWorkerLiveStream(): EventSource {
    const url = `${this.baseUrl}/api/v1/workers/live-stream`
    return new EventSource(url, {
      withCredentials: false // Adjust based on your auth setup
    })
  }

  // Analytics Completeness System
  async getAnalyticsCompletenessDashboard(): Promise<ApiResponse<AnalyticsCompletenessDashboard>> {
    return this.makeRequest<AnalyticsCompletenessDashboard>('/api/v1/admin/superadmin/analytics-completeness/dashboard')
  }

  async getAnalyticsCompletenessStats(): Promise<ApiResponse<AnalyticsCompletenessStats>> {
    return this.makeRequest<AnalyticsCompletenessStats>('/api/v1/admin/superadmin/analytics-completeness/stats')
  }

  async getAnalyticsCompletenessHealth(): Promise<ApiResponse<AnalyticsCompletenessHealth>> {
    return this.makeRequest<AnalyticsCompletenessHealth>('/api/v1/admin/superadmin/analytics-completeness/health')
  }

  async scanAnalyticsCompleteness(params: AnalyticsCompletenessScanRequest = {}): Promise<ApiResponse<AnalyticsCompletenessScanResponse>> {
    return this.makeRequest<AnalyticsCompletenessScanResponse>('/api/v1/admin/superadmin/analytics-completeness/scan', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  async repairAnalyticsCompleteness(params: AnalyticsCompletenessRepairRequest = {}): Promise<ApiResponse<AnalyticsCompletenessRepairResponse>> {
    return this.makeRequest<AnalyticsCompletenessRepairResponse>('/api/v1/admin/superadmin/analytics-completeness/repair', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  async validateAnalyticsCompletenessProfile(username: string): Promise<ApiResponse<AnalyticsCompletenessValidationResponse>> {
    return this.makeRequest<AnalyticsCompletenessValidationResponse>(`/api/v1/admin/superadmin/analytics-completeness/validate/${username}`, {
      method: 'POST'
    })
  }

  async repairSingleAnalyticsCompletenessProfile(username: string, forceRepair: boolean = false): Promise<ApiResponse<AnalyticsCompletenessRepairResponse>> {
    const params = forceRepair ? '?force_repair=true' : ''
    return this.makeRequest<AnalyticsCompletenessRepairResponse>(`/api/v1/admin/superadmin/analytics-completeness/repair-single/${username}${params}`, {
      method: 'POST'
    })
  }

  async bulkScanAnalyticsCompletenessUsernames(usernames: string[]): Promise<ApiResponse<AnalyticsCompletenessScanResponse>> {
    return this.makeRequest<AnalyticsCompletenessScanResponse>('/api/v1/admin/superadmin/analytics-completeness/bulk-scan-usernames', {
      method: 'POST',
      body: JSON.stringify(usernames)
    })
  }

  async optimizeAnalyticsCompletenessDatabase(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/v1/admin/superadmin/analytics-completeness/maintenance/optimize-database', {
      method: 'POST'
    })
  }

  // GOD-MODE ENDPOINTS

  // Incomplete Profiles Management
  async getIncompleteProfiles(page = 1, perPage = 50): Promise<ApiResponse<IncompleteProfilesResponse>> {
    return this.makeRequest<IncompleteProfilesResponse>(`/api/v1/admin/superadmin/analytics-completeness/incomplete-profiles?page=${page}&per_page=${perPage}`)
  }

  async repairSingleProfile(profileId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/api/v1/admin/superadmin/analytics-completeness/repair-single/${profileId}`, {
      method: 'POST'
    })
  }

  // Worker Activity Logs
  async getWorkerActivityLogs(hours = 1, limit = 100): Promise<ApiResponse<WorkerActivityResponse>> {
    return this.makeRequest<WorkerActivityResponse>(`/api/v1/workers/activity-logs?hours=${hours}&limit=${limit}`)
  }

  // Discovery Control - Real-time queue status
  async getDiscoveryQueueStatus(): Promise<ApiResponse<DiscoveryQueueStatus>> {
    return this.makeRequest<DiscoveryQueueStatus>('/api/v1/admin/repair/discovery/queue-status')
  }

  // Discovery Control - Process all unprocessed profiles
  // CRITICAL: This endpoint blocks until complete (3-5 min per profile)
  // Uses custom fetch with 1-hour timeout instead of default makeRequest
  async processAllUnprocessed(limit?: number): Promise<ApiResponse<ProcessAllUnprocessedResponse>> {
    const params = limit ? `?limit=${limit}` : ''
    const endpoint = `/api/v1/admin/repair/discovery/process-all-unprocessed${params}`

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`
      console.log('🌐 DISCOVERY BATCH PROCESS:', fullUrl)
      console.log('⏱️  WARNING: Long-running operation (3-5 min per profile)')

      // Create AbortController with 1-hour timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3600000) // 1 hour = 3,600,000ms

      const response = await fetchWithAuth(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 RESPONSE STATUS:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ DISCOVERY BATCH ERROR:', errorText)
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      console.log('✅ DISCOVERY BATCH SUCCESS:', data)
      return {
        success: true,
        data
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ DISCOVERY BATCH TIMEOUT: Operation took longer than 1 hour')
        return {
          success: false,
          error: 'Request timeout: Operation took longer than 1 hour. The batch processing may still be running on the server.'
        }
      }
      console.error('❌ DISCOVERY BATCH NETWORK ERROR:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

}

export const superadminApiService = new SuperadminApiService()

// Export convenience function for backward compatibility
export const superadminApi = superadminApiService