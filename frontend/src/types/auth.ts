export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'brand_enterprise'
  | 'brand_premium' 
  | 'brand_standard' 
  | 'brand_free'

export type PermissionType = 
  // User Management
  | 'can_view_all_users'
  | 'can_create_users'
  | 'can_edit_users'
  | 'can_delete_users'
  | 'can_manage_roles'
  | 'can_view_user_activity'
  // Financial Management
  | 'can_view_all_transactions'
  | 'can_adjust_credits'
  | 'can_manage_subscriptions'
  | 'can_view_revenue_reports'
  | 'can_process_refunds'
  | 'can_manage_pricing'
  // Content Management
  | 'can_view_all_profiles'
  | 'can_edit_profiles'
  | 'can_manage_influencer_data'
  | 'can_approve_content'
  | 'can_manage_categories'
  // Proposal Management
  | 'can_create_proposals'
  | 'can_view_all_proposals'
  | 'can_approve_proposals'
  | 'can_manage_templates'
  | 'can_view_proposal_analytics'
  // System Management
  | 'can_configure_system'
  | 'can_view_system_logs'
  | 'can_manage_integrations'
  | 'can_access_database'
  | 'can_export_platform_data'
  // Campaign Oversight
  | 'can_view_all_campaigns'
  | 'can_edit_campaigns'
  | 'can_view_campaign_analytics'
  | 'can_manage_campaign_templates'

export interface EnhancedUser {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  role: UserRole
  role_level: number
  status: 'active' | 'suspended' | 'pending' | 'archived'
  created_at: string
  last_login?: string
  profile_picture_url?: string
  timezone?: string
  language?: string
  avatar_config?: {
    variant: string
    colorScheme: string
    colors: string[]
    seed?: string
  }
  permissions?: PermissionType[]
  subscription_tier?: string
  subscription_expires_at?: string
  subscription_auto_renew?: boolean
  monthly_search_limit?: number
  monthly_export_limit?: number
  api_rate_limit?: number
  custom_permissions?: Record<string, any>
  admin_notes?: string
  created_by?: string
  managed_by?: string
  account_status?: string
  suspension_reason?: string
  suspension_until?: string
  last_login_ip?: string
  failed_login_attempts?: number
  account_locked_until?: string
}

export interface FeatureAccess {
  allowed: boolean
  remaining_usage?: number
  upgrade_required?: string
  credit_cost?: number
  reason?: string
}

export interface CreditWallet {
  id: number
  user_id: string
  balance: number
  total_purchased: number
  total_spent: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  permission_name: string
  permission_category: string
  description: string
}

export interface SessionContext {
  user: EnhancedUser | null
  permissions: PermissionType[]
  sessionTimeout: number
  lastActivity: Date
  securityLevel: 'standard' | 'enhanced' | 'maximum'
  refreshSession(): Promise<void>
  logout(): Promise<void>
  checkPermission(permission: PermissionType): boolean
  updateActivity(): void
}