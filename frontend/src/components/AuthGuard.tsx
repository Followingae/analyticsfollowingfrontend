'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Icons } from '@/components/ui/icons'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requirePremium?: boolean
  requireAdmin?: boolean
}

export function AuthGuard({ 
  children, 
  requireAuth = false, 
  requirePremium = false, 
  requireAdmin = false 
}: AuthGuardProps) {
  const { isAuthenticated, isPremium, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (isLoading) return

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      router.replace('/dashboard')
      return
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    // If premium is required but user is not premium
    if (requirePremium && !isPremium) {
      router.replace('/pricing')
      return
    }

    // If admin is required but user is not admin
    if (requireAdmin && !isAdmin) {
      router.replace('/dashboard')
      return
    }
  }, [isAuthenticated, isPremium, isAdmin, isLoading, router, pathname, requireAuth, requirePremium, requireAdmin, isPublicRoute])

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

  // If premium is required but user is not premium, don't render children
  if (requirePremium && !isPremium) {
    return null
  }

  // If admin is required but user is not admin, don't render children
  if (requireAdmin && !isAdmin) {
    return null
  }

  return <>{children}</>
}