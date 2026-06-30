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
  
  // PERF FIX: Start hydrated to avoid extra render cycle and flash
  const [isHydrated] = useState(true)

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/welcome']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Use enhanced user role directly (no normalization needed)
  const userRole = user?.role || null
  // Internal staff (role=user + staff_role) are admitted to admin-gated CONSOLE pages
  // but scoped by their modules (SuperAdminSidebar + ModuleRouteGuard + backend).
  // Fall back to the persisted session (login + /me always store staff_role) in case the
  // in-memory enhanced user hasn't synced yet.
  const isStaff = (() => {
    if ((user as { staff_role?: string | null } | null)?.staff_role) return true
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem('user_data')
      return !!(raw && JSON.parse(raw)?.staff_role)
    } catch { return false }
  })()


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
        redirectPath = '/superadmin'
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
      // Check admin requirement (if not already checking superadmin). Staff admitted (scoped).
      else if (requireAdmin) {
        hasPermission = userRole === 'super_admin' || userRole === 'admin' || isStaff
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
        // Handle admin role check to include super_admin
        if (requiredRole === 'admin') {
          hasPermission = userRole === 'admin' || userRole === 'super_admin'
        } else {
          hasPermission = userRole === requiredRole
        }
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
    
    // Check admin requirement (internal staff admitted, scoped by their modules)
    if (requireAdmin && !(userRole === 'super_admin' || userRole === 'admin' || isStaff)) {
      return <UnauthorizedAccess />
    }
    
    // Check premium requirement
    if (requirePremium && !(userRole === 'brand_premium' || userRole === 'brand_enterprise' || userRole === 'super_admin' || userRole === 'admin')) {
      return null // Will redirect to pricing in useEffect
    }
    
    // Check specific role requirement
    if (requiredRole) {
      // Handle admin role check to include super_admin
      if (requiredRole === 'admin') {
        if (!(userRole === 'admin' || userRole === 'super_admin')) {
          return <UnauthorizedAccess />
        }
      } else if (userRole !== requiredRole) {
        return <UnauthorizedAccess />
      }
    }
  }

  return <>{children}</>
}