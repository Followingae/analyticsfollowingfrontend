'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User, DashboardStats } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { EnhancedUser, UserRole, PermissionType, FeatureAccess, SessionContext } from '@/types/auth'
import { toast } from 'sonner'

interface EnhancedAuthContextType extends SessionContext {
  user: EnhancedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  dashboardStats: DashboardStats | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  refreshDashboard: () => Promise<void>
  updateProfile: (profileData: any) => Promise<boolean>
  updateUserState: (userData: Partial<EnhancedUser>) => void
  
  // Role and permission checking
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasPermission: (permission: PermissionType) => boolean
  hasAnyPermission: (permissions: PermissionType[]) => boolean
  getUserRoleLevel: () => number
  isHigherRole: (targetLevel: number) => boolean
  
  // Feature access control
  hasFeature: (feature: string) => boolean
  checkFeatureAccess: (feature: string) => Promise<FeatureAccess>
  checkCreditGate: (action: string, cost: number) => Promise<FeatureAccess>
  checkSubscriptionGate: (requiredTier: string) => boolean
  
  // Admin helpers
  isSuperAdmin: boolean
  isAdmin: boolean
  isBrandUser: boolean
  isPremium: boolean
  canAccessAdminPanel: boolean
  
  // Activity tracking
  lastActivity: Date
  sessionTimeout: number
  updateActivity: () => void
}

const ROLE_LEVELS: Record<UserRole, number> = {
  'super_admin': 5,
  'admin': 4,
  'brand_enterprise': 3,
  'brand_premium': 2,
  'brand_standard': 1,
  'brand_free': 0
}

const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  'super_admin': [
    // All permissions
    'can_view_all_users', 'can_create_users', 'can_edit_users', 'can_delete_users', 
    'can_manage_roles', 'can_view_user_activity',
    'can_view_all_transactions', 'can_adjust_credits', 'can_manage_subscriptions',
    'can_view_revenue_reports', 'can_process_refunds', 'can_manage_pricing',
    'can_view_all_profiles', 'can_edit_profiles', 'can_manage_influencer_data',
    'can_approve_content', 'can_manage_categories',
    'can_create_proposals', 'can_view_all_proposals', 'can_approve_proposals',
    'can_manage_templates', 'can_view_proposal_analytics',
    'can_configure_system', 'can_view_system_logs', 'can_manage_integrations',
    'can_access_database', 'can_export_platform_data',
    'can_view_all_campaigns', 'can_edit_campaigns', 'can_view_campaign_analytics',
    'can_manage_campaign_templates'
  ],
  'admin': [
    // Limited admin permissions
    'can_view_all_users', 'can_create_users', 'can_edit_users',
    'can_view_user_activity', 'can_view_all_transactions',
    'can_view_all_profiles', 'can_edit_profiles', 'can_approve_content',
    'can_create_proposals', 'can_view_all_proposals',
    'can_view_all_campaigns', 'can_view_campaign_analytics'
  ],
  'brand_enterprise': [],
  'brand_premium': [],
  'brand_standard': [],
  'brand_free': []
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

interface EnhancedAuthProviderProps {
  children: ReactNode
}

export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {

  
  const { 
    user: basicUser, 
    isAuthenticated: basicIsAuthenticated, 
    isLoading: basicIsLoading, 
    dashboardStats: basicDashboardStats,
    login: basicLogin,
    register: basicRegister,
    logout: basicLogout,
    refreshUser: basicRefreshUser,
    updateProfile: basicUpdateProfile
  } = useAuth()
  
  const [user, setUser] = useState<EnhancedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true to match basic auth context
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [sessionTimeout] = useState<number>(30 * 60 * 1000) // 30 minutes
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(false) // Disable initially

  // Move timeout to useEffect to avoid React warnings

  // Sync with basic auth context
  useEffect(() => {
    // Always sync loading state first
    setIsLoading(basicIsLoading)

    if (!basicIsLoading) {
      if (basicIsAuthenticated && basicUser) {
        const enhancedUser = enhanceUserData(basicUser)
        setUser(enhancedUser)
        setDashboardStats(basicDashboardStats)
      } else {
        setUser(null)
        setDashboardStats(null)
      }
    }
  }, [basicUser, basicIsAuthenticated, basicIsLoading, basicDashboardStats])

  // Disable session timeout temporarily to fix login redirect loop
  // useEffect(() => {
  //   if (!sessionTimeoutEnabled) return
  //   const interval = setInterval(() => {
  //     const now = new Date()
  //     if (user && now.getTime() - lastActivity.getTime() > sessionTimeout) {
  //       handleSessionTimeout()
  //     }
  //   }, 60000)
  //   return () => clearInterval(interval)
  // }, [user, lastActivity, sessionTimeout, sessionTimeoutEnabled])

  // const handleSessionTimeout = () => {
  //   toast.warning('Session expired. Please log in again.')
  //   logout()
  // }

  const updateActivity = () => {
    setLastActivity(new Date())
  }


  const enhanceUserData = (basicUser: User): EnhancedUser => {











    
    // Map basic user roles to enhanced roles with strict role separation
    let role: UserRole
    
    // CRITICAL: Don't downgrade existing premium users to free
    // If user doesn't have role data, preserve existing enhanced role if available
    if (!basicUser.role && user && user.role !== 'brand_free') {
      role = user.role
    } else {
      switch (basicUser.role?.toLowerCase()) {
      case 'super_admin':
      case 'admin':
      case 'superadmin':
        // CRITICAL: Only actual admins get admin access
        role = 'super_admin' // Treat backend 'admin' and 'super_admin' as 'super_admin'
        break
      case 'premium':
        // FIXED: Premium users are BRAND users, not admin users
        role = 'brand_premium'
        break
      case 'standard':
        role = 'brand_standard'
        break
      case 'enterprise':
        role = 'brand_enterprise'
        break
      case 'free':
        role = 'brand_free'
        break
      default:
        // CRITICAL FIX: Don't default to 'brand_free' if no role data
        // This was causing premium users to appear as free on refresh
        if (user && user.role) {
          role = user.role
        } else {
          role = 'brand_free'
        }
        break
      }
    }

    // Validate that premium users don't get admin permissions
    if (basicUser.role === 'premium' && (role === 'super_admin' || role === 'admin')) {

      role = 'brand_premium'
    }

    return {
      ...basicUser,
      role,
      role_level: ROLE_LEVELS[role],
      status: basicUser.status as any || 'active',
      permissions: ROLE_PERMISSIONS[role] || [],
      subscription_tier: role.startsWith('brand_') ? role : undefined
    }
  }

  // REMOVED: loadDashboardStats function to prevent duplicate calls
  // Dashboard stats are now handled by individual components that need them

  const login = async (email: string, password: string): Promise<boolean> => {

    updateActivity()
    
    try {
      const result = await basicLogin(email, password)

      return result
    } catch (error) {

      throw error
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    return await basicRegister(email, password, fullName)
  }

  const logout = () => {

    
    // Clear enhanced auth state first
    setUser(null)
    setDashboardStats(null)
    
    // Then call basic logout
    basicLogout()
  }

  const refreshUser = async () => {
    await basicRefreshUser()
  }

  const updateUserState = (userData: Partial<EnhancedUser>) => {
    setUser(prev => {
      if (!prev) return prev
      
      const updatedUser = { ...prev, ...userData }
      
      // Convert back to basic user format for storage
      const basicUser: User = {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        company: updatedUser.company,
        job_title: updatedUser.job_title,
        phone_number: updatedUser.phone_number,
        bio: updatedUser.bio,
        role: updatedUser.role === 'super_admin' ? 'admin' : 
              updatedUser.role === 'brand_premium' ? 'premium' : 'free',
        status: updatedUser.status,
        created_at: updatedUser.created_at,
        last_login: updatedUser.last_login,
        profile_picture_url: updatedUser.profile_picture_url,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        avatar_config: updatedUser.avatar_config
      }
      
      localStorage.setItem('user_data', JSON.stringify(basicUser))
      
      return updatedUser
    })
  }

  const refreshDashboard = async () => {
    // FIXED: No longer loading dashboard stats here to prevent duplicates
    // Individual components should handle their own data refreshing
  }

  const updateProfile = async (profileData: any): Promise<boolean> => {
    return await basicUpdateProfile(profileData)
  }

  // Role and permission checking methods
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const hasPermission = (permission: PermissionType): boolean => {
    return user?.permissions?.includes(permission) ?? false
  }

  const hasAnyPermission = (permissions: PermissionType[]): boolean => {
    return user ? permissions.some(p => user.permissions?.includes(p)) : false
  }

  const getUserRoleLevel = (): number => {
    return user?.role_level ?? 0
  }

  const isHigherRole = (targetLevel: number): boolean => {
    return getUserRoleLevel() > targetLevel
  }

  // Feature access control methods
  const hasFeature = (feature: string): boolean => {
    if (!user) return false;

    // Simple feature checking based on role
    const tier = user.subscription_tier || user.role || 'brand_free';

    switch (feature) {
      case 'proposals':
      case 'campaign_management':
        return ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier);
      case 'advanced_analytics':
        return ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier);
      case 'unlimited_searches':
        return ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier);
      case 'api_access':
        return ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier);
      default:
        return true; // Default to allow if feature is not restricted
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<FeatureAccess> => {
    if (!user) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // Implement feature access logic based on subscription tier
    const tier = user.subscription_tier || 'brand_free'
    
    switch (feature) {
      case 'advanced_analytics':
        return {
          allowed: ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier),
          upgrade_required: tier === 'brand_free' || tier === 'brand_standard' ? 'premium' : undefined
        }
      case 'unlimited_searches':
        return {
          allowed: ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier),
          upgrade_required: tier === 'brand_free' || tier === 'brand_standard' ? 'premium' : undefined
        }
      case 'api_access':
        return {
          allowed: ['brand_premium', 'brand_enterprise', 'super_admin', 'admin'].includes(tier),
          upgrade_required: tier === 'brand_free' || tier === 'brand_standard' ? 'premium' : undefined
        }
      default:
        return { allowed: true }
    }
  }

  const checkCreditGate = async (action: string, cost: number): Promise<FeatureAccess> => {
    if (!user) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // TODO: Implement actual credit checking logic
    // For now, allow all actions for admins
    if (user.role === 'super_admin' || user.role === 'admin') {
      return { allowed: true, credit_cost: 0 }
    }

    return { allowed: true, credit_cost: cost }
  }

  const checkSubscriptionGate = (requiredTier: string): boolean => {
    if (!user) return false
    
    const userTierLevel = ROLE_LEVELS[user.role] || 0
    const requiredTierLevel = ROLE_LEVELS[requiredTier as UserRole] || 0
    
    return userTierLevel >= requiredTierLevel
  }

  const refreshSession = async (): Promise<void> => {
    updateActivity()
    await refreshUser()
  }

  // Computed properties
  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isBrandUser = user?.role?.startsWith('brand_') ?? false
  const isPremium = hasAnyRole(['brand_premium', 'brand_enterprise', 'super_admin', 'admin'])
  const canAccessAdminPanel = hasAnyRole(['super_admin', 'admin'])

  const value: EnhancedAuthContextType = {
    user,
    isAuthenticated: basicIsAuthenticated,
    isLoading,
    dashboardStats,
    login,
    register,
    logout,
    refreshUser,
    refreshDashboard,
    updateProfile,
    updateUserState,
    
    // Role and permission methods
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    getUserRoleLevel,
    isHigherRole,
    
    // Feature access methods
    hasFeature,
    checkFeatureAccess,
    checkCreditGate,
    checkSubscriptionGate,
    
    // Computed properties
    isSuperAdmin,
    isAdmin,
    isBrandUser,
    isPremium,
    canAccessAdminPanel,
    
    // Session management
    lastActivity,
    sessionTimeout,
    updateActivity,
    refreshSession,
    
    // Session context methods
    permissions: user?.permissions || [],
    securityLevel: isSuperAdmin ? 'maximum' : isAdmin ? 'enhanced' : 'standard',
    checkPermission: hasPermission
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}

export { EnhancedAuthContext }