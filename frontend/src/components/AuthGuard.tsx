'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Icons } from '@/components/ui/icons'
import { UnauthorizedAccess } from '@/components/UnauthorizedAccess'
import { 
  isAuthorized, 
  canAccessSuperAdmin, 
  canAccessAdmin, 
  isPremiumUser, 
  normalizeRole,
  getRedirectPath 
} from '@/utils/roleAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requirePremium?: boolean
  requireAdmin?: boolean
  requireSuperAdmin?: boolean
  requiredRole?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = false, 
  requirePremium = false, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requiredRole
}: AuthGuardProps) {
  const { isAuthenticated, user, isLoading } = useEnhancedAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // CRITICAL FIX: Track hydration status to prevent premature redirects
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Use enhanced user role directly (no normalization needed)
  const userRole = user?.role || null


  useEffect(() => {
    
    // CRITICAL FIX: Wait for hydration to complete before making auth decisions
    if (!isHydrated) {

      return
    }
    
    if (isLoading) {

      return
    }

    // Only handle redirects if no auth requirements are specified (prevents competing redirects)
    const hasAuthRequirements = requireAuth || requirePremium || requireAdmin || requireSuperAdmin || requiredRole

    // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
    if (isAuthenticated && isPublicRoute && userRole && !hasAuthRequirements) {
      let redirectPath = '/dashboard'
      if (userRole === 'super_admin' || userRole === 'admin') {
        redirectPath = '/admin/dashboard'
      }

      router.replace(redirectPath)
      return
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    
    // If user is authenticated, check role-based permissions
    if (isAuthenticated && userRole) {
      let hasPermission = true
      let redirectPath = '/dashboard'

      // Check superadmin requirement
      if (requireSuperAdmin) {
        hasPermission = userRole === 'super_admin'
        if (!hasPermission) {
          redirectPath = '/unauthorized'
        }
      }
      // Check admin requirement (if not already checking superadmin)
      else if (requireAdmin) {
        hasPermission = userRole === 'super_admin' || userRole === 'admin'
        if (!hasPermission) {
          redirectPath = '/unauthorized'
        }
      }
      // Check premium requirement
      else if (requirePremium) {
        hasPermission = userRole === 'brand_premium' || userRole === 'brand_enterprise' || userRole === 'super_admin' || userRole === 'admin'
        if (!hasPermission) {
          redirectPath = '/pricing'
        }
      }
      // Check specific role requirement
      else if (requiredRole) {
        hasPermission = userRole === requiredRole
        if (!hasPermission) {
          redirectPath = '/unauthorized'
        }
      }

      // Redirect if permission denied
      if (!hasPermission) {
        if (redirectPath === '/unauthorized') {
          // Don't redirect for unauthorized, show component instead
          return
        } else {
          router.replace(redirectPath)
          return
        }
      }
    }
  }, [isAuthenticated, userRole, isLoading, router, pathname, requireAuth, requirePremium, requireAdmin, requireSuperAdmin, requiredRole, isPublicRoute, isHydrated])

  // Show loading spinner while hydrating or checking auth
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{!isHydrated ? 'Initializing...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // If user is authenticated, check role-based permissions
  if (isAuthenticated && userRole) {
    // Check superadmin requirement
    if (requireSuperAdmin && userRole !== 'super_admin') {
      return <UnauthorizedAccess />
    }
    
    // Check admin requirement
    if (requireAdmin && !(userRole === 'super_admin' || userRole === 'admin')) {
      return <UnauthorizedAccess />
    }
    
    // Check premium requirement
    if (requirePremium && !(userRole === 'brand_premium' || userRole === 'brand_enterprise' || userRole === 'super_admin' || userRole === 'admin')) {
      return null // Will redirect to pricing in useEffect
    }
    
    // Check specific role requirement
    if (requiredRole && userRole !== requiredRole) {
      return <UnauthorizedAccess />
    }
  }

  return <>{children}</>
}