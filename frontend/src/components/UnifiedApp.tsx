'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { LoadingScreen } from '@/components/LoadingScreen'
import { SuperAdminInterface } from '@/components/admin/SuperAdminInterface'
import { AdminInterface } from '@/components/admin/AdminInterface'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { BrandDashboardContent } from '@/components/brand/BrandDashboardContent'
import { UnauthorizedAccess } from '@/components/UnauthorizedAccess'

export function UnifiedApp() {
  const { user, isLoading, isAuthenticated, updateActivity } = useEnhancedAuth()
  const router = useRouter()

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity()
      }
    }

    // Track mouse movements, clicks, keyboard events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [isAuthenticated, updateActivity])

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading screen while auth is being determined
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <LoadingScreen />
  }

  // Dynamic interface switching based on user role
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminInterface />
    
    case 'admin':
      return <AdminInterface />
    
    case 'brand_enterprise':
    case 'brand_premium':
    case 'brand_standard':
    case 'brand_free':
      return (
        <BrandUserInterface>
          <BrandDashboardContent />
        </BrandUserInterface>
      )
    
    default:
      return <UnauthorizedAccess />
  }
}

// Auto-redirect component for role-based routing
export function RoleBasedRedirect() {
  const { user, isLoading, isAuthenticated } = useEnhancedAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Determine redirect path based on role
      switch (user.role) {
        case 'super_admin':
        case 'admin':
          router.replace('/admin/dashboard')
          break
        
        case 'brand_enterprise':
        case 'brand_premium':
        case 'brand_standard':
        case 'brand_free':
        default:
          router.replace('/dashboard')
          break
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  return <LoadingScreen />
}