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

  // REMOVED: Debug logging to prevent infinite render loops
  // The excessive console.log calls were causing performance issues

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
    console.log('🔄 UnifiedApp: Showing loading screen - auth loading')
    return <LoadingScreen />
  }

  // FIXED: Let AuthGuard handle authentication requirements completely
  // UnifiedApp only renders the appropriate interface once user is authenticated
  if (!isAuthenticated || !user) {
    // Return null to let AuthGuard handle redirects without showing loading screen
    return null
  }

  // Dynamic interface switching based on user role
  // SUPERADMIN BYPASS: Force superadmin interface for zain@following.ae
  if (user.email === 'zain@following.ae') {
    return <SuperAdminInterface />
  }

  // Switch based on user role
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