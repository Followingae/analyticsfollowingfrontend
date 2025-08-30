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
  console.log('🔐 EnhancedAuthProvider: Component rendering/mounting')
  
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
  
  console.log('🔐 EnhancedAuthProvider: Basic auth values:', {
    basicIsLoading,
    basicIsAuthenticated,
    hasBasicUser: !!basicUser
  })
  
  const [user, setUser] = useState<EnhancedUser | null>(null)
  const [isLoading, setIsLoading] = useState(false) // HOTFIX: Start with false due to hydration issues
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [sessionTimeout] = useState<number>(30 * 60 * 1000) // 30 minutes
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(false) // Disable initially

  // Move timeout to useEffect to avoid React warnings

  // Sync with basic auth context
  useEffect(() => {
    console.log('🔐 EnhancedAuthContext: Syncing with BasicAuth:', {
      basicIsLoading,
      basicIsAuthenticated,
      hasBasicUser: !!basicUser,
      basicUserRole: basicUser?.role,
      timestamp: new Date().toISOString()
    })

    if (!basicIsLoading) {
      if (basicIsAuthenticated && basicUser) {
        console.log('🔐 EnhancedAuthContext: BasicAuth is authenticated, enhancing user data')
        const enhancedUser = enhanceUserData(basicUser)
        setUser(enhancedUser)
        setDashboardStats(basicDashboardStats)
        console.log('🔐 EnhancedAuthContext: User data set successfully:', {
          userEmail: enhancedUser.email,
          userRole: enhancedUser.role
        })
      } else {
        console.log('🔐 EnhancedAuthContext: BasicAuth not authenticated, clearing user')
        setUser(null)
        setDashboardStats(null)
      }
      console.log('🔐 EnhancedAuthContext: Setting isLoading to false')
      setIsLoading(false)
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
    console.log('🔧 EnhancedAuth: Raw user data from backend:', basicUser)
    console.log('🔧 EnhancedAuth: Raw user data - Full Object:', JSON.stringify(basicUser, null, 2))
    console.log('🔧 EnhancedAuth: User role field:', basicUser.role)
    console.log('🔧 EnhancedAuth: Looking for subscription fields:')
    console.log('  - basicUser.subscription_tier:', (basicUser as any).subscription_tier)
    console.log('  - basicUser.plan:', (basicUser as any).plan)
    console.log('  - basicUser.tier:', (basicUser as any).tier)
    console.log('  - basicUser.package_name:', (basicUser as any).package_name)
    console.log('  - basicUser.credit_packages:', (basicUser as any).credit_packages)
    console.log('  - basicUser.subscription:', (basicUser as any).subscription)
    console.log('  - basicUser.monthly_credits:', (basicUser as any).monthly_credits)
    
    // Map basic user roles to enhanced roles with strict role separation
    let role: UserRole
    switch (basicUser.role?.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        // CRITICAL: Only actual admins get admin access
        role = 'super_admin' // Treat backend 'admin' as 'super_admin'
        console.log('🔧 EnhancedAuth: ⚠️ ADMIN USER DETECTED - Granting super_admin access')
        break
      case 'premium':
        // FIXED: Premium users are BRAND users, not admin users
        role = 'brand_premium'
        console.log('🔧 EnhancedAuth: ✅ Premium user mapped to brand_premium (NO admin access)')
        break
      case 'standard':
        role = 'brand_standard'
        console.log('🔧 EnhancedAuth: ✅ Standard user mapped to brand_standard')
        break
      case 'enterprise':
        role = 'brand_enterprise'
        console.log('🔧 EnhancedAuth: ✅ Enterprise user mapped to brand_enterprise')
        break
      case 'free':
      default:
        role = 'brand_free'
        console.log('🔧 EnhancedAuth: ✅ Free user mapped to brand_free')
        break
    }
    
    console.log('🔧 EnhancedAuth: ROLE MAPPING RESULT:', {
      original: basicUser.role,
      mapped: role,
      isAdmin: role === 'super_admin' || role === 'admin',
      isBrand: role.startsWith('brand_'),
      warningLevel: role === 'super_admin' ? 'CRITICAL - ADMIN ACCESS' : 'NORMAL'
    })

    // Validate that premium users don't get admin permissions
    if (basicUser.role === 'premium' && (role === 'super_admin' || role === 'admin')) {
      console.error('🚨 SECURITY ALERT: Premium user was about to get admin access! Forcing to brand_premium')
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

  const loadDashboardStats = async () => {
    try {
      const result = await authService.getDashboardStats()
      if (result.success && result.data) {
        setDashboardStats(result.data)
      } else if (result.error && (result.error.includes('403') || result.error.includes('401') || result.error.includes('authentication'))) {
        // Log the error but don't immediately logout - could be a temporary network issue
        console.warn('🔐 EnhancedAuthContext: Dashboard stats auth error (not logging out immediately):', result.error)
        // Only set stats to null, keep user authenticated
        setDashboardStats(null)
      }
    } catch (error) {
      console.error('🔐 EnhancedAuthContext: Dashboard stats error:', error)
      // Don't logout on network errors
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🚨 EnhancedAuthContext: LOGIN CALLED for:', email)
    updateActivity()
    
    try {
      const result = await basicLogin(email, password)
      console.log('🚨 EnhancedAuthContext: basicLogin result:', result)
      return result
    } catch (error) {
      console.error('🚨 EnhancedAuthContext: LOGIN ERROR:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    return await basicRegister(email, password, fullName)
  }

  const logout = () => {
    console.log('🚨 EnhancedAuthContext: logout() called!')
    console.trace('EnhancedAuthContext logout call stack:')
    
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
    await loadDashboardStats()
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