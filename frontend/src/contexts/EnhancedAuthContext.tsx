'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User, DashboardStats } from '@/services/authService'
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
  const [user, setUser] = useState<EnhancedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [sessionTimeout] = useState<number>(30 * 60 * 1000) // 30 minutes

  // Initialize auth state
  useEffect(() => {
    initializeAuth()
  }, [])

  // Activity tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      if (user && now.getTime() - lastActivity.getTime() > sessionTimeout) {
        handleSessionTimeout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user, lastActivity, sessionTimeout])

  const handleSessionTimeout = () => {
    toast.warning('Session expired. Please log in again.')
    logout()
  }

  const updateActivity = () => {
    setLastActivity(new Date())
  }

  const initializeAuth = async () => {
    try {
      const storedUser = authService.getStoredUser()
      
      if (storedUser && authService.isAuthenticated()) {
        const enhancedUser = enhanceUserData(storedUser)
        setUser(enhancedUser)
        await loadDashboardStats()
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const enhanceUserData = (basicUser: User): EnhancedUser => {
    // Map basic user roles to enhanced roles
    let role: UserRole
    switch (basicUser.role) {
      case 'admin':
        role = 'super_admin' // Treat existing admin as super_admin
        break
      case 'premium':
        role = 'brand_premium'
        break
      case 'free':
      default:
        role = 'brand_free'
        break
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
      }
    } catch (error) {
      // Silent fail
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    updateActivity()
    
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data && result.data.access_token) {
        const enhancedUser = enhanceUserData(result.data.user)
        setUser(enhancedUser)
        await loadDashboardStats()
        toast.success(`Welcome back, ${result.data.user.full_name}!`)
        return true
      } else {
        const errorMessage = result.error || 'Login failed'
        
        if (errorMessage.includes('email') && errorMessage.includes('confirmation')) {
          toast.error(errorMessage, {
            duration: 8000,
            action: {
              label: 'Resend Email',
              onClick: () => {
                const email = localStorage.getItem('pending_confirmation_email')
                if (email) {
                  toast.info('Please contact support to resend confirmation email')
                }
              }
            }
          })
        } else {
          toast.error(errorMessage)
        }
        
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await authService.register({ email, password, full_name: fullName })
      
      if (result.success && result.data) {
        if (result.data.email_confirmation_required) {
          const message = result.data.message || 'Registration successful! Please check your email to confirm your account.'
          toast.success(message, {
            duration: 10000,
            description: `A confirmation email has been sent to ${result.data.user?.email || email}. Please click the link to activate your account.`
          })
          
          setUser(null)
          return true
        } else if (result.data.access_token) {
          const enhancedUser = enhanceUserData(result.data.user)
          setUser(enhancedUser)
          await loadDashboardStats()
          toast.success(`Welcome to Analytics Following, ${result.data.user.full_name}!`)
          return true
        } else {
          toast.success('Registration successful! You can now log in.')
          return true
        }
      } else {
        toast.error(result.error || 'Registration failed')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setDashboardStats(null)
    authService.logout()
    toast.success('Successfully logged out')
  }

  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser()
      if (result.success && result.data) {
        const currentUser = authService.getStoredUser()
        if (!result.data.avatar_config && currentUser?.avatar_config) {
          result.data.avatar_config = currentUser.avatar_config
        }
        
        const enhancedUser = enhanceUserData(result.data)
        setUser(enhancedUser)
        localStorage.setItem('user_data', JSON.stringify(result.data))
      }
    } catch (error) {
      // Silent fail
    }
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
    try {
      const { settingsService } = await import('@/services/settingsService')
      const result = await settingsService.updateProfile(profileData)
      
      if (result.success && result.data) {
        updateUserState({
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          full_name: result.data.full_name,
          company: result.data.company,
          job_title: result.data.job_title,
          phone_number: result.data.phone_number,
          bio: result.data.bio,
          avatar_config: result.data.avatar_config
        })
        
        toast.success(result.data.message || 'Profile updated successfully')
        return true
      } else {
        toast.error(result.error || 'Failed to update profile')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      toast.error(errorMessage)
      return false
    }
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
    isAuthenticated: !!user,
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