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

  // Track user activity with throttled high-frequency events
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity()
      }
    }

    // Throttle high-frequency events (mousemove, scroll) to fire at most once per 2s
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const throttledActivity = () => {
      if (throttleTimer) return
      handleActivity()
      throttleTimer = setTimeout(() => { throttleTimer = null }, 2000)
    }

    // Direct listeners for low-frequency events only
    const directEvents = ['mousedown', 'keypress', 'touchstart']
    directEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Throttled listeners for high-frequency events
    const throttledEvents = ['mousemove', 'scroll']
    throttledEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, true)
    })

    return () => {
      directEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      throttledEvents.forEach(event => {
        document.removeEventListener(event, throttledActivity, true)
      })
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [isAuthenticated, updateActivity])

  // Handle redirects in useEffect to avoid render-time state updates
  // CRITICAL: This useEffect must always be called (before any early returns) to avoid hooks order violation
  useEffect(() => {
    if (!user || !isAuthenticated) return

    // SUPERADMIN BYPASS: Redirect superadmins to dedicated /superadmin page
    if (user.email === 'zain@following.ae' || user.role === 'super_admin') {
      router.replace('/superadmin')
      return
    }
  }, [user, isAuthenticated, router])

  // Authentication redirects are handled by AuthGuard - no need to duplicate here

  // Show loading screen while auth is being determined
  if (isLoading) {
    return <LoadingScreen />
  }

  // FIXED: Let AuthGuard handle authentication requirements completely
  // UnifiedApp only renders the appropriate interface once user is authenticated
  if (!isAuthenticated || !user) {
    // Return null to let AuthGuard handle redirects without showing loading screen
    return null
  }

  // Dynamic interface switching based on user role
  // If superadmin, return null while redirect happens
  if (user?.email === 'zain@following.ae' || user?.role === 'super_admin') {
    return <LoadingScreen />
  }

  // Switch based on user role
  switch (user.role) {
    
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
