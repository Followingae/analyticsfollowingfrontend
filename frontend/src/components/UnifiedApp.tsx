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

  // Handle redirects in useEffect to avoid "setState during render" error
  useEffect(() => {
    console.log('🚨 UnifiedApp: useEffect triggered', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role
    })
    
    if (!isLoading && (!isAuthenticated || !user)) {
      console.log('🚨 UnifiedApp: User not authenticated, redirecting to /auth/login', {
        isAuthenticated,
        hasUser: !!user
      })
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, user, router])

  console.log('🚨 UnifiedApp RENDER:', {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role,
    timestamp: new Date().toISOString()
  })

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

  // Authentication redirects are handled by AuthGuard - no need to duplicate here

  // Show loading screen while auth is being determined
  if (isLoading) {
    console.log('🚨 UnifiedApp: Showing loading screen (isLoading=true)')
    return <LoadingScreen />
  }

  // Show loading screen for unauthenticated users (redirect handled in useEffect)
  if (!isAuthenticated || !user) {
    console.log('🚨 UnifiedApp: No auth/user, showing loading screen while redirect happens')
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

// REMOVED: RoleBasedRedirect function - this was causing competing redirects with AuthGuard