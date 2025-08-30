/**
 * Superadmin Dashboard API Service
 * System management, user administration, analytics, and platform oversight
 */

import { getAuthHeaders, API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// System Management Types
export interface SystemStats {
  total_users: number
  active_users_24h: number
  new_registrations_today: number
  total_campaigns: number
  active_campaigns: number
  total_lists: number
  active_lists: number
  total_proposals: number
  pending_proposals: number
  total_credits_in_circulation: number
  credits_spent_today: number
  system_health_score: number
  last_updated: string
}

export interface UserManagement {
  id: string
  username: string
  email: string
  full_name?: string
  user_type: 'regular' | 'admin' | 'superadmin'
  account_status: 'active' | 'suspended' | 'pending' | 'deactivated'
  subscription_tier: string
  credits_balance: number
  registration_date: string
  last_login: string
  last_activity: string
  total_campaigns: number
  total_lists: number
  total_credits_spent: number
  flags: string[]
  notes?: string
  
  // Activity metrics
  activity_metrics: {
    campaigns_created: number
    lists_created: number
    credits_spent_this_month: number
    login_frequency: number
    feature_usage: Record<string, number>
  }
  
  // Security info
  security_info: {
    failed_login_attempts: number
    last_password_change?: string
    two_factor_enabled: boolean
    suspicious_activity_flags: string[]
  }
}

export interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical'
  components: SystemComponent[]
  performance_metrics: PerformanceMetrics
  resource_usage: ResourceUsage
  error_rates: ErrorRate[]
  uptime_percentage: number
  last_incident?: SystemIncident
  maintenance_windows: MaintenanceWindow[]
}

export interface SystemComponent {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  response_time_ms: number
  error_rate: number
  last_check: string
  incidents_24h: number
}

export interface PerformanceMetrics {
  average_response_time: number
  peak_concurrent_users: number
  database_query_time: number
  cache_hit_rate: number
  cdn_performance: number
  api_throughput: number
}

export interface ResourceUsage {
  cpu_usage_percentage: number
  memory_usage_percentage: number
  disk_usage_percentage: number
  network_bandwidth_usage: number
  database_connections: number
  active_sessions: number
}

export interface ErrorRate {
  endpoint: string
  error_count: number
  total_requests: number
  error_rate_percentage: number
  most_common_errors: string[]
}

export interface SystemIncident {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  created_at: string
  resolved_at?: string
  affected_components: string[]
  user_impact: string
}

export interface MaintenanceWindow {
  id: string
  title: string
  description: string
  scheduled_start: string
  scheduled_end: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  affected_services: string[]
  notification_sent: boolean
}

export interface PlatformAnalytics {
  user_analytics: UserAnalytics
  feature_analytics: FeatureAnalytics
  business_analytics: BusinessAnalytics
  technical_analytics: TechnicalAnalytics
  growth_metrics: GrowthMetrics
}

export interface UserAnalytics {
  total_users: number
  active_users: {
    daily: number
    weekly: number
    monthly: number
  }
  user_retention: {
    day_1: number
    day_7: number
    day_30: number
  }
  user_engagement: {
    average_session_duration: number
    pages_per_session: number
    bounce_rate: number
  }
  user_segmentation: UserSegment[]
  geographical_distribution: GeographicalData[]
  device_distribution: DeviceData[]
}

export interface UserSegment {
  segment_name: string
  user_count: number
  percentage: number
  average_lifetime_value: number
  engagement_score: number
}

export interface GeographicalData {
  country: string
  user_count: number
  percentage: number
  average_session_duration: number
}

export interface DeviceData {
  device_type: string
  user_count: number
  percentage: number
  os_distribution: Record<string, number>
}

export interface FeatureAnalytics {
  feature_usage: FeatureUsage[]
  feature_adoption_rates: FeatureAdoption[]
  feature_performance: FeaturePerformance[]
  a_b_test_results: ABTestResult[]
}

export interface FeatureUsage {
  feature_name: string
  total_uses: number
  unique_users: number
  usage_frequency: number
  peak_usage_time: string
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface FeatureAdoption {
  feature_name: string
  release_date: string
  adoption_rate: number
  time_to_first_use: number
  user_feedback_score: number
}

export interface FeaturePerformance {
  feature_name: string
  average_load_time: number
  error_rate: number
  success_rate: number
  user_satisfaction: number
}

export interface ABTestResult {
  test_name: string
  status: 'running' | 'completed' | 'paused'
  start_date: string
  end_date?: string
  variants: ABTestVariant[]
  confidence_level: number
  statistical_significance: boolean
  winner?: string
}

export interface ABTestVariant {
  variant_name: string
  traffic_allocation: number
  conversion_rate: number
  sample_size: number
  uplift: number
}

export interface BusinessAnalytics {
  revenue_metrics: RevenueMetrics
  conversion_metrics: ConversionMetrics
  customer_metrics: CustomerMetrics
  operational_metrics: OperationalMetrics
}

export interface RevenueMetrics {
  total_revenue: number
  monthly_recurring_revenue: number
  average_revenue_per_user: number
  customer_lifetime_value: number
  churn_rate: number
  revenue_growth_rate: number
}

export interface ConversionMetrics {
  signup_conversion_rate: number
  trial_to_paid_conversion: number
  feature_adoption_conversion: number
  funnel_conversion_rates: FunnelStep[]
}

export interface FunnelStep {
  step_name: string
  users_entering: number
  users_completing: number
  conversion_rate: number
  drop_off_reasons: string[]
}

export interface CustomerMetrics {
  total_customers: number
  paying_customers: number
  trial_customers: number
  customer_satisfaction_score: number
  net_promoter_score: number
  support_ticket_volume: number
}

export interface OperationalMetrics {
  system_uptime: number
  average_response_time: number
  support_response_time: number
  feature_release_frequency: number
  bug_resolution_time: number
  security_incidents: number
}

export interface TechnicalAnalytics {
  api_analytics: APIAnalytics
  database_analytics: DatabaseAnalytics
  security_analytics: SecurityAnalytics
  infrastructure_analytics: InfrastructureAnalytics
}

export interface APIAnalytics {
  total_api_calls: number
  api_calls_by_endpoint: EndpointUsage[]
  average_response_time: number
  error_rates: Record<string, number>
  rate_limiting_hits: number
  top_consuming_users: APIConsumer[]
}

export interface EndpointUsage {
  endpoint: string
  call_count: number
  average_response_time: number
  error_rate: number
  peak_usage_time: string
}

export interface APIConsumer {
  user_id: string
  username: string
  api_calls: number
  endpoints_used: string[]
  error_rate: number
}

export interface DatabaseAnalytics {
  query_performance: QueryPerformance[]
  connection_pool_usage: number
  storage_usage: StorageMetrics
  backup_status: BackupStatus
  index_efficiency: IndexMetrics[]
}

export interface QueryPerformance {
  query_type: string
  average_execution_time: number
  slowest_queries: SlowQuery[]
  optimization_suggestions: string[]
}

export interface SlowQuery {
  query_pattern: string
  execution_time: number
  frequency: number
  suggested_optimization: string
}

export interface StorageMetrics {
  total_storage_gb: number
  used_storage_gb: number
  growth_rate_gb_per_day: number
  table_sizes: Record<string, number>
}

export interface BackupStatus {
  last_backup: string
  backup_size_gb: number
  backup_duration_minutes: number
  retention_days: number
  backup_health: 'healthy' | 'warning' | 'failed'
}

export interface IndexMetrics {
  table_name: string
  index_name: string
  usage_count: number
  efficiency_score: number
  recommendation: string
}

export interface SecurityAnalytics {
  authentication_events: AuthEvent[]
  failed_login_attempts: number
  suspicious_activities: SuspiciousActivity[]
  security_alerts: SecurityAlert[]
  vulnerability_scans: VulnerabilityReport[]
}

export interface AuthEvent {
  event_type: 'login' | 'logout' | 'password_change' | 'account_lock'
  user_id: string
  ip_address: string
  timestamp: string
  success: boolean
  risk_score: number
}

export interface SuspiciousActivity {
  activity_type: string
  user_id: string
  description: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  detected_at: string
  investigation_status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
}

export interface SecurityAlert {
  alert_id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  description: string
  affected_systems: string[]
  created_at: string
  resolved_at?: string
  response_actions: string[]
}

export interface VulnerabilityReport {
  scan_date: string
  total_vulnerabilities: number
  critical_vulnerabilities: number
  high_vulnerabilities: number
  medium_vulnerabilities: number
  low_vulnerabilities: number
  remediation_status: RemediationStatus[]
}

export interface RemediationStatus {
  vulnerability_id: string
  severity: string
  status: 'open' | 'in_progress' | 'resolved' | 'mitigated'
  estimated_fix_date?: string
}

export interface InfrastructureAnalytics {
  server_performance: ServerMetrics[]
  network_performance: NetworkMetrics
  cdn_performance: CDNMetrics
  third_party_services: ThirdPartyService[]
}

export interface ServerMetrics {
  server_id: string
  cpu_usage: number
  memory_usage: number
  disk_io: number
  network_io: number
  uptime_hours: number
  load_average: number
}

export interface NetworkMetrics {
  bandwidth_usage: number
  latency_ms: number
  packet_loss_percentage: number
  connection_count: number
  geographic_distribution: Record<string, number>
}

export interface CDNMetrics {
  cache_hit_rate: number
  bandwidth_saved: number
  edge_locations_active: number
  average_response_time: number
  total_requests: number
}

export interface ThirdPartyService {
  service_name: string
  status: 'operational' | 'degraded' | 'outage'
  response_time: number
  uptime_percentage: number
  cost_this_month: number
}

export interface GrowthMetrics {
  user_growth: GrowthData[]
  revenue_growth: GrowthData[]
  feature_usage_growth: GrowthData[]
  market_metrics: MarketMetrics
}

export interface GrowthData {
  period: string
  value: number
  growth_rate: number
  trend: 'up' | 'down' | 'stable'
}

export interface MarketMetrics {
  market_share_estimate: number
  competitor_analysis: CompetitorData[]
  customer_acquisition_cost: number
  organic_growth_percentage: number
}

export interface CompetitorData {
  competitor_name: string
  estimated_users: number
  feature_comparison: Record<string, 'better' | 'similar' | 'worse'>
  pricing_comparison: number
}

// Configuration Types
export interface SystemConfiguration {
  feature_flags: FeatureFlag[]
  system_limits: SystemLimits
  maintenance_settings: MaintenanceSettings
  notification_settings: NotificationSettings
  security_settings: SecuritySettings
}

export interface FeatureFlag {
  flag_name: string
  is_enabled: boolean
  description: string
  rollout_percentage: number
  target_users?: string[]
  created_at: string
  updated_at: string
}

export interface SystemLimits {
  max_users_per_account: number
  max_campaigns_per_user: number
  max_lists_per_user: number
  max_api_calls_per_minute: number
  max_file_upload_size_mb: number
  session_timeout_minutes: number
}

export interface MaintenanceSettings {
  maintenance_mode_enabled: boolean
  maintenance_message: string
  allowed_ips: string[]
  scheduled_maintenances: MaintenanceWindow[]
}

export interface NotificationSettings {
  email_notifications_enabled: boolean
  sms_notifications_enabled: boolean
  webhook_notifications_enabled: boolean
  notification_templates: NotificationTemplate[]
}

export interface NotificationTemplate {
  template_id: string
  template_name: string
  template_type: 'email' | 'sms' | 'push' | 'webhook'
  subject: string
  content: string
  variables: string[]
  is_active: boolean
}

export interface SecuritySettings {
  password_policy: PasswordPolicy
  session_security: SessionSecurity
  api_security: APISecurity
  audit_settings: AuditSettings
}

export interface PasswordPolicy {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_numbers: boolean
  require_special_characters: boolean
  max_age_days: number
  prevent_reuse_count: number
}

export interface SessionSecurity {
  session_timeout_minutes: number
  max_concurrent_sessions: number
  require_2fa: boolean
  ip_whitelist_enabled: boolean
}

export interface APISecurity {
  rate_limiting_enabled: boolean
  require_api_key: boolean
  allowed_origins: string[]
  webhook_security_enabled: boolean
}

export interface AuditSettings {
  log_retention_days: number
  log_user_actions: boolean
  log_system_events: boolean
  log_security_events: boolean
  export_logs_enabled: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
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
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // System Overview
  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return this.makeRequest<SystemStats>('/api/superadmin/system/stats')
  }

  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return this.makeRequest<SystemHealth>('/api/superadmin/system/health')
  }

  async getDashboard(): Promise<ApiResponse<{
    system_stats: SystemStats
    system_health: SystemHealth
    recent_activities: any[]
    alerts: SecurityAlert[]
    pending_actions: any[]
  }>> {
    return this.makeRequest('/api/superadmin/dashboard')
  }

  // User Management
  async getUsers(filters?: {
    user_type?: string
    account_status?: string
    subscription_tier?: string
    registration_date_start?: string
    registration_date_end?: string
    search_query?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    users: UserManagement[]
    total_count: number
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
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

  async getUserDetails(userId: string): Promise<ApiResponse<UserManagement>> {
    return this.makeRequest(`/api/superadmin/users/${userId}`)
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'deactivated', reason?: string): Promise<ApiResponse<UserManagement>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason })
    })
  }

  async updateUserCredits(userId: string, credits: number, reason: string): Promise<ApiResponse<{ 
    user_id: string
    new_balance: number
    transaction_id: string
  }>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/credits`, {
      method: 'PUT',
      body: JSON.stringify({ credits, reason })
    })
  }

  async addUserNote(userId: string, note: string): Promise<ApiResponse<UserManagement>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    })
  }

  async impersonateUser(userId: string): Promise<ApiResponse<{
    impersonation_token: string
    expires_at: string
    user_details: UserManagement
  }>> {
    return this.makeRequest(`/api/superadmin/users/${userId}/impersonate`, {
      method: 'POST'
    })
  }

  // Analytics & Reporting
  async getPlatformAnalytics(period?: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<ApiResponse<PlatformAnalytics>> {
    const params = period ? `?period=${period}` : ''
    return this.makeRequest<PlatformAnalytics>(`/api/superadmin/analytics${params}`)
  }

  async getUserAnalytics(period?: string): Promise<ApiResponse<UserAnalytics>> {
    const params = period ? `?period=${period}` : ''
    return this.makeRequest<UserAnalytics>(`/api/superadmin/analytics/users${params}`)
  }

  async getFeatureAnalytics(period?: string): Promise<ApiResponse<FeatureAnalytics>> {
    const params = period ? `?period=${period}` : ''
    return this.makeRequest<FeatureAnalytics>(`/api/superadmin/analytics/features${params}`)
  }

  async getBusinessAnalytics(period?: string): Promise<ApiResponse<BusinessAnalytics>> {
    const params = period ? `?period=${period}` : ''
    return this.makeRequest<BusinessAnalytics>(`/api/superadmin/analytics/business${params}`)
  }

  async getTechnicalAnalytics(period?: string): Promise<ApiResponse<TechnicalAnalytics>> {
    const params = period ? `?period=${period}` : ''
    return this.makeRequest<TechnicalAnalytics>(`/api/superadmin/analytics/technical${params}`)
  }

  async exportAnalytics(reportType: string, period: string, format: 'csv' | 'xlsx' | 'pdf'): Promise<ApiResponse<{
    export_id: string
    download_url: string
    expires_at: string
  }>> {
    return this.makeRequest('/api/superadmin/analytics/export', {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType, period, format })
    })
  }

  // System Configuration
  async getSystemConfiguration(): Promise<ApiResponse<SystemConfiguration>> {
    return this.makeRequest<SystemConfiguration>('/api/superadmin/system/configuration')
  }

  async updateFeatureFlag(flagName: string, updates: {
    is_enabled?: boolean
    rollout_percentage?: number
    target_users?: string[]
    description?: string
  }): Promise<ApiResponse<FeatureFlag>> {
    return this.makeRequest(`/api/superadmin/system/feature-flags/${flagName}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async updateSystemLimits(limits: Partial<SystemLimits>): Promise<ApiResponse<SystemLimits>> {
    return this.makeRequest('/api/superadmin/system/limits', {
      method: 'PUT',
      body: JSON.stringify(limits)
    })
  }

  async scheduleMaintenanceWindow(maintenanceData: {
    title: string
    description: string
    scheduled_start: string
    scheduled_end: string
    affected_services: string[]
    notification_required: boolean
  }): Promise<ApiResponse<MaintenanceWindow>> {
    return this.makeRequest('/api/superadmin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    })
  }

  async updateNotificationTemplate(templateId: string, template: Partial<NotificationTemplate>): Promise<ApiResponse<NotificationTemplate>> {
    return this.makeRequest(`/api/superadmin/system/notification-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    })
  }

  // Security & Monitoring
  async getSecurityAlerts(filters?: {
    severity?: string
    status?: 'open' | 'resolved'
    alert_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    alerts: SecurityAlert[]
    total_count: number
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

  async resolveSecurityAlert(alertId: string, resolution: {
    resolution_notes: string
    response_actions: string[]
  }): Promise<ApiResponse<SecurityAlert>> {
    return this.makeRequest(`/api/superadmin/security/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution)
    })
  }

  async getSuspiciousActivities(filters?: {
    risk_level?: string
    user_id?: string
    activity_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    activities: SuspiciousActivity[]
    total_count: number
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

  async investigateSuspiciousActivity(activityId: string, investigation: {
    investigation_notes: string
    status: 'investigating' | 'resolved' | 'false_positive'
    actions_taken?: string[]
  }): Promise<ApiResponse<SuspiciousActivity>> {
    return this.makeRequest(`/api/superadmin/security/suspicious-activities/${activityId}/investigate`, {
      method: 'POST',
      body: JSON.stringify(investigation)
    })
  }

  async getAuditLogs(filters?: {
    user_id?: string
    action_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    logs: any[]
    total_count: number
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/superadmin/audit/logs?${params.toString()}`)
  }

  // System Actions
  async broadcastSystemMessage(message: {
    title: string
    content: string
    message_type: 'info' | 'warning' | 'maintenance' | 'feature'
    target_users?: string[]
    expires_at?: string
    require_acknowledgment: boolean
  }): Promise<ApiResponse<{
    message_id: string
    broadcast_at: string
    estimated_reach: number
  }>> {
    return this.makeRequest('/api/superadmin/system/broadcast', {
      method: 'POST',
      body: JSON.stringify(message)
    })
  }

  async triggerSystemBackup(backupOptions: {
    backup_type: 'full' | 'incremental' | 'database_only' | 'files_only'
    include_user_data: boolean
    retention_days: number
    description?: string
  }): Promise<ApiResponse<{
    backup_id: string
    estimated_completion: string
    backup_size_estimate_gb: number
  }>> {
    return this.makeRequest('/api/superadmin/system/backup', {
      method: 'POST',
      body: JSON.stringify(backupOptions)
    })
  }

  async getSystemLogs(filters?: {
    log_level?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
    component?: string
    start_date?: string
    end_date?: string
    search_query?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    logs: any[]
    total_count: number
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/superadmin/system/logs?${params.toString()}`)
  }
}

export const superadminApiService = new SuperadminApiService()