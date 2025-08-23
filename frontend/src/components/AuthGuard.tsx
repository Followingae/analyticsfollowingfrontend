'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Normalize user role
  const userRole = user?.role ? normalizeRole(user.role) : null

  console.log('🔒 AuthGuard Check:', {
    pathname,
    userRole: user?.role,
    normalizedRole: userRole,
    requireAuth,
    requirePremium,
    requireAdmin,
    requireSuperAdmin,
    requiredRole,
    isAuthenticated,
    isLoading
  })

  useEffect(() => {
    if (isLoading) return

    // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
    if (isAuthenticated && isPublicRoute && userRole) {
      const redirectPath = getRedirectPath(userRole)
      console.log('🔒 AuthGuard: Redirecting authenticated user to:', redirectPath)
      router.replace(redirectPath)
      return
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      console.log('🔒 AuthGuard: Redirecting unauthenticated user to login')
      router.replace('/auth/login')
      return
    }

    // If user is authenticated, check role-based permissions
    if (isAuthenticated && userRole) {
      let hasPermission = true
      let redirectPath = '/dashboard'

      // Check superadmin requirement
      if (requireSuperAdmin) {
        hasPermission = canAccessSuperAdmin(userRole)
        if (!hasPermission) {
          console.log('🔒 AuthGuard: SuperAdmin access denied for user role:', userRole)
          redirectPath = '/unauthorized'
        }
      }
      // Check admin requirement (if not already checking superadmin)
      else if (requireAdmin) {
        hasPermission = canAccessAdmin(userRole)
        if (!hasPermission) {
          console.log('🔒 AuthGuard: Admin access denied for user role:', userRole)
          redirectPath = '/unauthorized'
        }
      }
      // Check premium requirement
      else if (requirePremium) {
        hasPermission = isPremiumUser(userRole)
        if (!hasPermission) {
          console.log('🔒 AuthGuard: Premium access denied for user role:', userRole)
          redirectPath = '/pricing'
        }
      }
      // Check specific role requirement
      else if (requiredRole) {
        hasPermission = isAuthorized(userRole, requiredRole)
        if (!hasPermission) {
          console.log('🔒 AuthGuard: Role access denied. Required:', requiredRole, 'User has:', userRole)
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
  }, [isAuthenticated, userRole, isLoading, router, pathname, requireAuth, requirePremium, requireAdmin, requireSuperAdmin, requiredRole, isPublicRoute])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
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
    if (requireSuperAdmin && !canAccessSuperAdmin(userRole)) {
      return <UnauthorizedAccess />
    }
    
    // Check admin requirement
    if (requireAdmin && !canAccessAdmin(userRole)) {
      return <UnauthorizedAccess />
    }
    
    // Check premium requirement
    if (requirePremium && !isPremiumUser(userRole)) {
      return null // Will redirect to pricing in useEffect
    }
    
    // Check specific role requirement
    if (requiredRole && !isAuthorized(userRole, requiredRole)) {
      return <UnauthorizedAccess />
    }
  }

  return <>{children}</>
}