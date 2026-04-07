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

// New Sequential Bulk Repair Types
export interface BulkRepairCurrentProfile {
  username: string
  stage: 'queued' | 'apify_fetching' | 'apify_completed' | 'cdn_processing' | 'cdn_completed' | 'ai_processing' | 'ai_completed' | 'database_storing' | 'completed' | 'failed'
  stage_message: string
  progress_percent: number
}

export interface BulkRepairLiveStatus {
  operation_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  current_profile_index: number
  total_profiles: number
  profiles_completed: number
  profiles_failed: number
  current_profile?: BulkRepairCurrentProfile
  queue_remaining: number
  last_updated: string
}

export interface BulkRepairProgress {
  operation_id: string
  status: string
  started_at: string
  estimated_completion?: string
  total_profiles: number
  completed_profiles: number
  failed_profiles: number
  current_profile?: BulkRepairCurrentProfile
  queue: Array<{
    username: string
    status: string
  }>
  completed_results: Array<{
    username: string
    status: 'success' | 'failed'
    message?: string
    error?: string
  }>
}

export interface BulkRepairActiveOperations {
  active_operations: Array<{
    operation_id: string
    status: string
    started_at: string
    total_profiles: number
    completed_profiles: number
    current_profile?: string
  }>
  total_active: number
}

export interface BulkRepairCancelResponse {
  success: boolean
  message: string
  operation_id: string
  status: string
}


// Job Tracking Types
export interface JobStatus {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress_percent: number
  queue_position?: number
  estimated_completion?: string
  started_at?: string
  completed_at?: string
  error_message?: string
  result?: any
}

export interface ProfileAnalysisJob {
  job_id: string
  username: string
  status: JobStatus['status']
  progress_percent: number
  stages_completed: string[]
  current_stage?: string
  queue_position?: number
  estimated_completion?: string
}

// ===== SUPERADMIN USER MANAGEMENT API TYPES =====
// Based on SUPERADMIN_USER_MANAGEMENT_API.md documentation

export interface SuperAdminCreateUserRequest {
  email: string
  full_name: string
  subscription_tier: 'free' | 'standard' | 'premium'
  billing_type: 'offline' | 'stripe'
  custom_permissions?: {
    creator_search?: boolean
    profile_analysis?: boolean
    post_analytics?: boolean
    ai_analysis?: boolean
    bulk_export?: boolean
    campaign_management?: boolean
    team_management?: boolean
    discovery?: boolean
    api_access?: boolean
  }
  initial_credits?: number
  admin_notes?: string
  send_welcome_email?: boolean
}

export interface SuperAdminUserResponse {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin' | 'superadmin'
  subscription_tier: 'free' | 'standard' | 'premium'
  billing_type: 'offline' | 'stripe'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  created_at: string
  permissions: {
    creator_search: { enabled: boolean; reason: string }
    profile_analysis: { enabled: boolean; reason: string }
    post_analytics: { enabled: boolean; reason: string }
    ai_analysis: { enabled: boolean; reason: string }
    bulk_export: { enabled: boolean; reason: string }
    campaign_management: { enabled: boolean; reason: string }
    team_management: { enabled: boolean; reason: string }
    discovery: { enabled: boolean; reason: string }
    api_access: { enabled: boolean; reason: string }
  }
  limits: {
    source: 'individual' | 'team'
    subscription_tier: 'free' | 'standard' | 'premium'
    profiles_per_month: number
    emails_per_month: number
    posts_per_month: number
    team_members: number
    api_calls_per_month: number
    ai_analysis_enabled: boolean
    bulk_export_enabled: boolean
    campaign_management_enabled: boolean
    current_balance: number
    credits_spent_this_month: number
  }
  credit_balance: number
  admin_notes?: string
}

export interface SuperAdminUpdateSubscriptionRequest {
  subscription_tier: 'free' | 'standard' | 'premium'
  billing_type?: 'offline' | 'stripe'
  custom_permissions?: {
    creator_search?: boolean
    profile_analysis?: boolean
    post_analytics?: boolean
    ai_analysis?: boolean
    bulk_export?: boolean
    campaign_management?: boolean
    team_management?: boolean
    discovery?: boolean
    api_access?: boolean
  }
  admin_notes?: string
}

export interface SuperAdminCreditTopupRequest {
  user_id: string
  package_type?: 'starter_100' | 'standard_500' | 'premium_1000' | 'enterprise_5000' | 'bonus'
  custom_credits?: number
  reason: string
  expires_in_days?: number
}

export interface SuperAdminCreditTopupResponse {
  success: boolean
  user_id: string
  user_email: string
  credits_added: number
  new_balance: number
  package_info?: {
    package: string
    name: string
    description: string
  }
  reason: string
  admin: string
}

export interface SuperAdminBulkCreditTopupRequest {
  user_ids: string[]
  package_type?: 'starter_100' | 'standard_500' | 'premium_1000' | 'enterprise_5000' | 'bonus'
  custom_credits?: number
  reason: string
  expires_in_days?: number
}

export interface SuperAdminBulkCreditTopupResponse {
  success: number
  failed: number
  results: SuperAdminCreditTopupResponse[]
  errors: Array<{ user_id: string; error: string }>
}

export interface SuperAdminUserListResponse {
  users: SuperAdminUserResponse[]
  total_count: number
  pagination: {
    limit: number
    offset: number
    has_next: boolean
  }
  role_distribution: Record<string, number>
  status_distribution: Record<string, number>
}

export interface SuperAdminUserFilters {
  subscription_tier?: 'free' | 'standard' | 'premium'
  billing_type?: 'offline' | 'stripe'
  status?: 'active' | 'inactive' | 'suspended' | 'pending'
  skip?: number
  limit?: number
}

export interface SuperAdminUpdatePermissionsRequest {
  creator_search?: boolean
  profile_analysis?: boolean
  post_analytics?: boolean
  ai_analysis?: boolean
  bulk_export?: boolean
  campaign_management?: boolean
  team_management?: boolean
  discovery?: boolean
  api_access?: boolean
}

export interface SuperAdminPermissionsResponse {
  success: boolean
  user_id: string
  email: string
  permissions: SuperAdminUserResponse['permissions']
  custom_overrides: Record<string, boolean>
}

export interface SuperAdminGetPermissionsResponse {
  user_id: string
  email: string
  role: 'user' | 'admin' | 'superadmin'
  subscription_tier: 'free' | 'standard' | 'premium'
  billing_type: 'offline' | 'stripe'
  permissions: SuperAdminUserResponse['permissions']
  limits: SuperAdminUserResponse['limits']
  is_super_admin: boolean
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

  // Core Dashboard - Using centralized ENDPOINTS configuration
  async getDashboard(): Promise<ApiResponse<DashboardOverview>> {
    return this.makeRequest<DashboardOverview>(ENDPOINTS.superadmin.dashboard)
  }

  async getComprehensiveDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest(ENDPOINTS.superadmin.dashboard)
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getRealtimeAnalytics(): Promise<ApiResponse<RealtimeAnalytics>> {
    console.warn('superadminApi.getRealtimeAnalytics: endpoint not implemented');
    return { success: true, data: { online_users: 0, active_sessions: 0, system_load: { cpu_percent: 0, memory_percent: 0, disk_percent: 0 }, recent_activities: [], credit_flows: { spent_last_hour: 0, earned_last_hour: 0, net_flow: 0 }, performance_metrics: { response_time_ms: 0, cache_hit_rate: 0, error_rate: 0 } } as RealtimeAnalytics };
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

  /** Lookup influencer in master database by username. Returns null-like if not found. */
  async getInfluencerByUsername(username: string): Promise<ApiResponse<any>> {
    const raw = await this.makeRequest(ENDPOINTS.influencerDatabase.detail(username))
    return this.unwrapIMD(raw)
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
        story_price_aed_cents?: number
        post_price_aed_cents?: number
        reel_price_aed_cents?: number
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

  // PHANTOM: Backend endpoint does not exist yet
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
    console.warn('superadminApi.getSecurityAlerts: endpoint not implemented');
    return { success: true, data: { alerts: [], alert_counts: {}, suspicious_activities: [], security_score: 100, recommendations: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAnalytics(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAnalytics: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getUserPermissions(userId: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getUserPermissions: endpoint not implemented');
    return { success: true, data: { permissions: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async updateUserPermissions(userId: string, permissions: Record<string, boolean>): Promise<ApiResponse<any>> {
    console.warn('superadminApi.updateUserPermissions: endpoint not implemented');
    return { success: true, data: { permissions } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async manageMFA(userId: string, action: string, method: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.manageMFA: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async manageUserSessions(userId: string, action: string, deviceId?: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.manageUserSessions: endpoint not implemented');
    return { success: true, data: { sessions: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async resetUserPassword(userId: string, options: {
    notify_user?: boolean
    force_change?: boolean
    temporary_password?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.resetUserPassword: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getUserLoginHistory(userId: string, filters?: {
    limit?: number
    date_from?: string
    date_to?: string
    include_failed_attempts?: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getUserLoginHistory: endpoint not implemented');
    return { success: true, data: { login_history: [], total_count: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async impersonateUser(userId: string, options: {
    duration_minutes?: number
    reason?: string
    notify_user?: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.impersonateUser: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  // PHANTOM: Backend endpoint does not exist yet
  async bulkUserOperations(operation: string, userIds: string[], parameters: any): Promise<ApiResponse<any>> {
    console.warn('superadminApi.bulkUserOperations: endpoint not implemented');
    return { success: true, data: { processed: 0, failed: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async advancedUserSearch(filters: {
    role?: string
    status?: string
    last_login_before?: string
    credits_range?: [number, number]
    team_id?: string
    subscription_tier?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.advancedUserSearch: endpoint not implemented');
    return { success: true, data: { users: [], total_count: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getRoles(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getRoles: endpoint not implemented');
    return { success: true, data: { roles: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async createRole(roleData: {
    role_name: string
    permissions: Record<string, any>
    role_level: number
    description: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.createRole: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async updateRolePermissions(roleId: string, permissions: Record<string, any>, applyToExisting = true): Promise<ApiResponse<any>> {
    console.warn('superadminApi.updateRolePermissions: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getPermissionMatrix(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getPermissionMatrix: endpoint not implemented');
    return { success: true, data: { matrix: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getComprehensiveTeams(options?: {
    include_members?: boolean
    include_usage?: boolean
    include_billing?: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getComprehensiveTeams: endpoint not implemented');
    return { success: true, data: { teams: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async bulkTeamMemberOperations(teamId: string, operation: string, userIds: string[], teamRole?: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.bulkTeamMemberOperations: endpoint not implemented');
    return { success: true, data: { processed: 0, failed: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async updateTeamPermissions(teamId: string, permissions: Record<string, any>, overrideIndividual = false): Promise<ApiResponse<any>> {
    console.warn('superadminApi.updateTeamPermissions: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAIModelsStatus(): Promise<ApiResponse<AISystemStatus>> {
    console.warn('superadminApi.getAIModelsStatus: endpoint not implemented');
    return { success: true, data: { model_performance: {}, processing_queue: { total_jobs: 0, pending_jobs: 0, failed_jobs: 0, estimated_completion: '' }, analysis_stats: { total_analyses: 0, success_rate: 0, avg_processing_time: 0, content_categories: {} } } as AISystemStatus };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAIAnalysisQueue(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAIAnalysisQueue: endpoint not implemented');
    return { success: true, data: { queue: [], total: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAIAnalysisStats(filters?: {
    date_from?: string
    date_to?: string
    model_type?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAIAnalysisStats: endpoint not implemented');
    return { success: true, data: { stats: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async retryAIAnalysis(jobIds?: string[], modelTypes?: string[]): Promise<ApiResponse<any>> {
    console.warn('superadminApi.retryAIAnalysis: endpoint not implemented');
    return { success: true, data: { retried: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getContentModerationQueue(): Promise<ApiResponse<ContentModeration>> {
    console.warn('superadminApi.getContentModerationQueue: endpoint not implemented');
    return { success: true, data: { flagged_content: [], moderation_queue_count: 0, category_distribution: {}, auto_moderation_stats: { total_flagged: 0, false_positives: 0, accuracy_rate: 0 } } as ContentModeration };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getContentCategoriesDistribution(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getContentCategoriesDistribution: endpoint not implemented');
    return { success: true, data: { categories: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getCDNPerformance(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getCDNPerformance: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getCDNAssets(filters?: {
    asset_type?: string
    status?: string
    date_range?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getCDNAssets: endpoint not implemented');
    return { success: true, data: { assets: [], total: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getSystemConfigurations(): Promise<ApiResponse<SystemConfiguration>> {
    console.warn('superadminApi.getSystemConfigurations: endpoint not implemented');
    return { success: true, data: { configurations: {}, feature_flags: {} } as SystemConfiguration };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async updateSystemConfiguration(configKey: string, value: any, description?: string, requiresRestart = false): Promise<ApiResponse<any>> {
    console.warn('superadminApi.updateSystemConfiguration: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getFeatureFlags(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getFeatureFlags: endpoint not implemented');
    return { success: true, data: { flags: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async toggleFeatureFlag(flagId: string, enabled: boolean, rolloutPercentage = 100, targetSegments: string[] = []): Promise<ApiResponse<any>> {
    console.warn('superadminApi.toggleFeatureFlag: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getDetailedPlatformUsage(options?: {
    timeframe?: string
    breakdown_by?: string
    include_segments?: boolean
  }): Promise<ApiResponse<PlatformAnalytics>> {
    console.warn('superadminApi.getDetailedPlatformUsage: endpoint not implemented');
    return { success: true, data: { usage_metrics: { api_calls_by_endpoint: {}, user_journey_funnel: [], feature_adoption: {} }, performance_metrics: { response_times: { p50: 0, p95: 0, p99: 0 }, error_rates: {}, cache_performance: { hit_rate: 0, miss_rate: 0 } } } as PlatformAnalytics };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getPlatformPerformanceMetrics(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getPlatformPerformanceMetrics: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAPIUsageAnalytics(filters?: {
    user_id?: string
    endpoint_pattern?: string
    time_range?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAPIUsageAnalytics: endpoint not implemented');
    return { success: true, data: { usage: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getCohortAnalysis(options?: {
    cohort_period?: string
    retention_periods?: string
  }): Promise<ApiResponse<UserIntelligence>> {
    console.warn('superadminApi.getCohortAnalysis: endpoint not implemented');
    return { success: true, data: { cohort_analysis: { cohorts: [] }, user_segmentation: { segments: [] }, business_forecasting: { revenue_forecast: [], user_growth_forecast: [] } } as UserIntelligence };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getUserSegmentation(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getUserSegmentation: endpoint not implemented');
    return { success: true, data: { segments: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getBusinessForecasting(options?: {
    forecast_period?: string
    metrics?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getBusinessForecasting: endpoint not implemented');
    return { success: true, data: { forecasts: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getOperationsHealth(): Promise<ApiResponse<OperationsHealth>> {
    console.warn('superadminApi.getOperationsHealth: endpoint not implemented');
    return { success: true, data: { system_health: { services: {}, dependencies: {} }, audit_logs: [] } as OperationsHealth };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAuditLog(filters?: {
    user_id?: string
    action_type?: string
    date_range?: string
    severity?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAuditLog: endpoint not implemented');
    return { success: true, data: { logs: [], total_count: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async performMaintenance(operation: string, dryRun = true, schedule = 'now'): Promise<ApiResponse<any>> {
    console.warn('superadminApi.performMaintenance: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getBackupStatus(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getBackupStatus: endpoint not implemented');
    return { success: true, data: { backups: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async createDataExport(options: {
    tables: string[]
    date_range?: Record<string, string>
    format?: 'csv' | 'json'
    include_pii?: boolean
  }): Promise<ApiResponse<DataExportJob>> {
    console.warn('superadminApi.createDataExport: endpoint not implemented');
    return { success: true, data: { id: '', status: 'failed', created_at: new Date().toISOString(), tables: options.tables } as DataExportJob };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getDataExportJobs(): Promise<ApiResponse<{ jobs: DataExportJob[] }>> {
    console.warn('superadminApi.getDataExportJobs: endpoint not implemented');
    return { success: true, data: { jobs: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getThirdPartyIntegrations(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getThirdPartyIntegrations: endpoint not implemented');
    return { success: true, data: { integrations: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getSecurityThreats(): Promise<ApiResponse<SecurityThreats>> {
    console.warn('superadminApi.getSecurityThreats: endpoint not implemented');
    return { success: true, data: { threats: [], threat_summary: { high_severity: 0, medium_severity: 0, low_severity: 0, resolved_24h: 0 } } as SecurityThreats };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getSuspiciousActivities(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getSuspiciousActivities: endpoint not implemented');
    return { success: true, data: { activities: [], total_count: 0, severity_distribution: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getComplianceReports(options?: {
    report_type?: string
    date_range?: string
    regulation?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getComplianceReports: endpoint not implemented');
    return { success: true, data: { reports: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async emergencyUserLock(userId: string, action: 'lock' | 'unlock' | 'force_logout', reason: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.emergencyUserLock: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getFeatureAccessGrants(filters?: {
    feature_type?: string
    user_id?: string
    team_id?: string
    status?: string
    expires_soon?: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getFeatureAccessGrants: endpoint not implemented');
    return { success: true, data: { grants: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async bulkFeatureGrant(options: {
    feature: string
    users?: string[]
    teams?: string[]
    access_level: string
    expires_at?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.bulkFeatureGrant: endpoint not implemented');
    return { success: true, data: { granted: 0 } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async grantProposalAccess(userId: string, options: {
    access_level: string
    expires_at?: string
    reason?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.grantProposalAccess: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async revokeProposalAccess(userId: string, options: {
    reason: string
    immediate?: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.revokeProposalAccess: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async setInfluencerPricing(profileId: string, pricingData: any): Promise<ApiResponse<any>> {
    console.warn('superadminApi.setInfluencerPricing: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getInfluencerPricing(profileId: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getInfluencerPricing: endpoint not implemented');
    return { success: false, data: null, error: 'Pricing not available - endpoint not implemented' };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async calculateCampaignPricing(profileId: string, campaignRequirements: any): Promise<ApiResponse<any>> {
    console.warn('superadminApi.calculateCampaignPricing: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async createInviteCampaign(campaignData: any): Promise<ApiResponse<any>> {
    console.warn('superadminApi.createInviteCampaign: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async publishInviteCampaign(campaignId: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.publishInviteCampaign: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getCampaignApplications(campaignId: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getCampaignApplications: endpoint not implemented');
    return { success: true, data: { applications: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async approveApplication(applicationId: string, decision: {
    approved: boolean
    feedback?: string
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.approveApplication: endpoint not implemented');
    return { success: true, data: {} };
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

  async getBrandProposalDetails(proposalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/superadmin/proposals/brand-proposals/${proposalId}`)
  }

  async getProposalsDashboard(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/dashboard')
  }

  async getProposalsHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/superadmin/proposals/health')
  }

  // PHANTOM: Backend endpoint does not exist yet
  async broadcastSystemMessage(message: {
    title: string
    content: string
    message_type: 'info' | 'warning' | 'maintenance' | 'feature'
    require_acknowledgment: boolean
  }): Promise<ApiResponse<any>> {
    console.warn('superadminApi.broadcastSystemMessage: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getSuspiciousActivities(filters?: {
    limit?: number
    severity?: string
    user_id?: string
  }): Promise<ApiResponse<{
    activities: SuspiciousActivity[]
    total_count: number
    severity_distribution: Record<string, number>
  }>> {
    console.warn('superadminApi.getSuspiciousActivities: endpoint not implemented');
    return { success: true, data: { activities: [] as SuspiciousActivity[], total_count: 0, severity_distribution: {} } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getPlatformAnalytics(): Promise<ApiResponse<PlatformAnalytics>> {
    console.warn('superadminApi.getPlatformAnalytics: endpoint not implemented');
    return { success: true, data: { usage_metrics: { api_calls_by_endpoint: {}, user_journey_funnel: [], feature_adoption: {} }, performance_metrics: { response_times: { p50: 0, p95: 0, p99: 0 }, error_rates: {}, cache_performance: { hit_rate: 0, miss_rate: 0 } } } as PlatformAnalytics };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getSystemComponents(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getSystemComponents: endpoint not implemented');
    return { success: true, data: { components: [] } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async restartSystemComponent(componentName: string): Promise<ApiResponse<any>> {
    console.warn('superadminApi.restartSystemComponent: endpoint not implemented');
    return { success: true, data: { status: 'not_implemented' } };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getAIAnalysisOverview(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getAIAnalysisOverview: endpoint not implemented');
    return { success: true, data: {} };
  }

  // PHANTOM: Backend endpoint does not exist yet
  async getContentAnalyticsOverview(): Promise<ApiResponse<any>> {
    console.warn('superadminApi.getContentAnalyticsOverview: endpoint not implemented');
    return { success: true, data: {} };
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

  // New Sequential Bulk Repair Progress Monitoring APIs
  async getOperationLiveStatus(operationId: string): Promise<ApiResponse<BulkRepairLiveStatus>> {
    return this.makeRequest<BulkRepairLiveStatus>(`/api/v1/admin/superadmin/analytics-completeness/operations/${operationId}/live`)
  }

  async getOperationProgress(operationId: string): Promise<ApiResponse<BulkRepairProgress>> {
    return this.makeRequest<BulkRepairProgress>(`/api/v1/admin/superadmin/analytics-completeness/progress/${operationId}`)
  }

  async getActiveOperations(): Promise<ApiResponse<BulkRepairActiveOperations>> {
    return this.makeRequest<BulkRepairActiveOperations>('/api/v1/admin/superadmin/analytics-completeness/operations/active')
  }

  async cancelOperation(operationId: string): Promise<ApiResponse<BulkRepairCancelResponse>> {
    return this.makeRequest<BulkRepairCancelResponse>(`/api/v1/admin/superadmin/analytics-completeness/operations/${operationId}/cancel`, {
      method: 'POST'
    })
  }


  // New Job Tracking APIs
  async createProfileAnalysisJob(username: string): Promise<ApiResponse<{ job_id: string }>> {
    return this.makeRequest<{ job_id: string }>(`/api/v1/analytics/profile/${username}`, {
      method: 'POST'
    })
  }

  async getJobStatus(jobId: string): Promise<ApiResponse<JobStatus>> {
    return this.makeRequest<JobStatus>(`/api/v1/jobs/${jobId}/status`)
  }

  async getProfileAnalysisJob(jobId: string): Promise<ApiResponse<ProfileAnalysisJob>> {
    return this.makeRequest<ProfileAnalysisJob>(`/api/v1/jobs/${jobId}/profile-analysis`)
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

  // ===== SUPERADMIN USER MANAGEMENT API METHODS =====
  // Based on SUPERADMIN_USER_MANAGEMENT_API.md documentation

  async createUserWithPermissions(userData: SuperAdminCreateUserRequest): Promise<ApiResponse<SuperAdminUserResponse>> {
    return this.makeRequest<SuperAdminUserResponse>('/api/v1/admin/superadmin/users/create', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async updateUserSubscription(userId: string, updateData: SuperAdminUpdateSubscriptionRequest): Promise<ApiResponse<SuperAdminUserResponse>> {
    return this.makeRequest<SuperAdminUserResponse>(`/api/v1/admin/superadmin/users/${userId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  }

  async giveCreditTopup(topupData: SuperAdminCreditTopupRequest): Promise<ApiResponse<SuperAdminCreditTopupResponse>> {
    return this.makeRequest<SuperAdminCreditTopupResponse>('/api/v1/admin/superadmin/credits/topup', {
      method: 'POST',
      body: JSON.stringify(topupData)
    })
  }

  async giveBulkCreditTopup(bulkTopupData: SuperAdminBulkCreditTopupRequest): Promise<ApiResponse<SuperAdminBulkCreditTopupResponse>> {
    return this.makeRequest<SuperAdminBulkCreditTopupResponse>('/api/v1/admin/superadmin/credits/bulk-topup', {
      method: 'POST',
      body: JSON.stringify(bulkTopupData)
    })
  }

  async listAllUsers(filters?: SuperAdminUserFilters): Promise<ApiResponse<SuperAdminUserListResponse>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    return this.makeRequest<SuperAdminUserListResponse>(`/api/v1/admin/superadmin/users?${params.toString()}`)
  }

  async updateUserPermissions(userId: string, permissions: SuperAdminUpdatePermissionsRequest): Promise<ApiResponse<SuperAdminPermissionsResponse>> {
    return this.makeRequest<SuperAdminPermissionsResponse>(`/api/v1/admin/superadmin/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissions)
    })
  }

  async getUserPermissions(userId: string): Promise<ApiResponse<SuperAdminGetPermissionsResponse>> {
    return this.makeRequest<SuperAdminGetPermissionsResponse>(`/api/v1/admin/superadmin/users/${userId}/permissions`)
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


  // Discovery Control - Real-time queue status
  async getDiscoveryQueueStatus(): Promise<ApiResponse<DiscoveryQueueStatus>> {
    return this.makeRequest<DiscoveryQueueStatus>('/api/v1/admin/repair/discovery/queue-status')
  }

  // Discovery Control - Process all unprocessed profiles
  // CRITICAL: This endpoint blocks until complete (3-5 min per profile)
  // Uses custom fetch with 1-hour timeout instead of default makeRequest
  // ===== INFLUENCER MASTER DATABASE =====

  // ─── IMD Helpers ────────────────────────────────────────────────────
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
      const { page, page_size, search, status, pricing_tier, tags, categories, followers_min, followers_max, engagement_min, engagement_max, is_verified, has_pricing, sort_by, sort_order } = filters
      if (page) params.append('page', page.toString())
      if (page_size) params.append('page_size', page_size.toString())
      if (search) params.append('search', search)
      if (status && Array.isArray(status) && status.length > 0) params.append('status', status[0])
      if (pricing_tier && Array.isArray(pricing_tier) && pricing_tier.length > 0) params.append('tier', pricing_tier[0])
      if (tags && Array.isArray(tags) && tags.length > 0) params.append('tags', tags.join(','))
      if (categories && Array.isArray(categories) && categories.length > 0) params.append('categories', categories.join(','))
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

  async processAllUnprocessed(limit?: number): Promise<ApiResponse<ProcessAllUnprocessedResponse>> {
    const params = limit ? `?limit=${limit}` : ''
    const endpoint = `/api/v1/admin/repair/discovery/process-all-unprocessed${params}`

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`

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
        data
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout: Operation took longer than 1 hour. The batch processing may still be running on the server.'
        }
      }
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