/**
 * Role-based authorization utilities
 * Provides centralized role checking and route protection
 */

export type UserRole = 
  | 'superadmin' 
  | 'admin' 
  | 'premium' 
  | 'standard' 
  | 'free'

export type EnhancedUserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'brand_premium' 
  | 'brand_standard' 
  | 'brand_free'

// Role hierarchy levels for comparison
const ROLE_LEVELS: Record<string, number> = {
  'superadmin': 5,
  'super_admin': 5,
  'admin': 4,
  'premium': 3,
  'brand_premium': 3,
  'standard': 2,
  'brand_standard': 2,
  'free': 1,
  'brand_free': 1
}

/**
 * Check if user has permission to access a specific role-protected resource
 * @param userRole - Current user's role
 * @param requiredRole - Minimum required role
 * @returns boolean indicating if user is authorized
 */
export const isAuthorized = (userRole: string, requiredRole: string): boolean => {
  if (!userRole || !requiredRole) {
    console.warn('🔒 Role Auth: Missing role data:', { userRole, requiredRole })
    return false
  }

  const userLevel = ROLE_LEVELS[userRole] || 0
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0
  
  const authorized = userLevel >= requiredLevel
  
  console.log('🔒 Role Auth Check:', {
    userRole,
    requiredRole,
    userLevel,
    requiredLevel,
    authorized
  })

  return authorized
}

/**
 * Check if user can access superadmin features
 * @param userRole - Current user's role
 * @returns boolean
 */
export const canAccessSuperAdmin = (userRole: string): boolean => {
  const allowedRoles = ['superadmin', 'super_admin']
  const canAccess = allowedRoles.includes(userRole)
  
  console.log('🔒 SuperAdmin Access Check:', {
    userRole,
    allowedRoles,
    canAccess
  })
  
  return canAccess
}

/**
 * Check if user can access admin features
 * @param userRole - Current user's role
 * @returns boolean
 */
export const canAccessAdmin = (userRole: string): boolean => {
  const allowedRoles = ['superadmin', 'super_admin', 'admin']
  const canAccess = allowedRoles.includes(userRole)
  
  console.log('🔒 Admin Access Check:', {
    userRole,
    allowedRoles,
    canAccess
  })
  
  return canAccess
}

/**
 * Check if user is a premium user (any premium tier)
 * @param userRole - Current user's role
 * @returns boolean
 */
export const isPremiumUser = (userRole: string): boolean => {
  const premiumRoles = ['premium', 'brand_premium', 'superadmin', 'super_admin', 'admin']
  const isPremium = premiumRoles.includes(userRole)
  
  console.log('🔒 Premium Access Check:', {
    userRole,
    premiumRoles,
    isPremium
  })
  
  return isPremium
}

/**
 * Check if user is a brand user (not admin)
 * @param userRole - Current user's role
 * @returns boolean
 */
export const isBrandUser = (userRole: string): boolean => {
  const brandRoles = ['premium', 'brand_premium', 'standard', 'brand_standard', 'free', 'brand_free']
  const isBrand = brandRoles.includes(userRole)
  
  console.log('🔒 Brand User Check:', {
    userRole,
    brandRoles,
    isBrand
  })
  
  return isBrand
}

/**
 * Get the correct redirect path based on user role
 * @param userRole - Current user's role
 * @returns string - redirect path
 */
export const getRedirectPath = (userRole: string): string => {
  if (canAccessSuperAdmin(userRole)) {
    return '/superadmin'
  }
  
  if (canAccessAdmin(userRole)) {
    return '/admin'
  }
  
  if (isBrandUser(userRole)) {
    return '/dashboard'
  }
  
  return '/auth/login'
}

/**
 * Normalize role from backend to standardized format
 * @param backendRole - Role as received from backend
 * @returns normalized role string
 */
export const normalizeRole = (backendRole: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'superadmin', // Backend 'admin' = Frontend 'superadmin'
    'premium': 'premium',
    'standard': 'standard', 
    'free': 'free'
  }
  
  const normalized = roleMap[backendRole] || backendRole
  
  console.log('🔒 Role Normalization:', {
    backendRole,
    normalized
  })
  
  return normalized
}

/**
 * Role authorization guard - throws error if unauthorized
 * @param userRole - Current user's role
 * @param requiredRole - Required role
 * @param resourceName - Name of protected resource (for logging)
 */
export const requireRole = (userRole: string, requiredRole: string, resourceName = 'resource'): void => {
  if (!isAuthorized(userRole, requiredRole)) {
    const error = `Access denied to ${resourceName}. Required: ${requiredRole}, User has: ${userRole}`
    console.error('🔒 Authorization Error:', error)
    throw new Error(error)
  }
}

/**
 * Get user-friendly role display name
 * @param role - Role string
 * @returns formatted display name
 */
export const getRoleDisplayName = (role: string): string => {
  const displayNames: Record<string, string> = {
    'superadmin': 'Super Administrator',
    'super_admin': 'Super Administrator', 
    'admin': 'Administrator',
    'premium': 'Premium',
    'brand_premium': 'Premium',
    'standard': 'Standard',
    'brand_standard': 'Standard',
    'free': 'Free',
    'brand_free': 'Free'
  }
  
  return displayNames[role] || role
}