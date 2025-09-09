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

  // Debug when user changes
  useEffect(() => {
    console.log('🔄 UnifiedApp: user object changed', {
      userRole: user?.role,
      userEmail: user?.email,
      isAuthenticated,
      isLoading,
      timestamp: new Date().toLocaleTimeString()
    })
  }, [user, isAuthenticated, isLoading])

  // Handle redirects in useEffect to avoid "setState during render" error
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, user, router])

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

    return <LoadingScreen />
  }

  // Show loading screen for unauthenticated users (redirect handled in useEffect)
  if (!isAuthenticated || !user) {

    return <LoadingScreen />
  }

  // Dynamic interface switching based on user role
  console.log('🔍 ROLE DEBUG:', {
    userRole: user.role,
    userEmail: user.email,
    userRoleType: typeof user.role,
    fullUser: user
  })

  // SUPERADMIN BYPASS: Force superadmin interface for zain@following.ae
  if (user.email === 'zain@following.ae') {
    console.log('🚀 SUPERADMIN BYPASS: Loading SuperAdminInterface for zain@following.ae')
    return <SuperAdminInterface />
  }

  switch (user.role) {
    case 'super_admin':
      console.log('🚀 Loading SuperAdminInterface for super_admin')
      return <SuperAdminInterface />
    
    case 'admin':
      console.log('🔧 Loading AdminInterface for admin')
      return <AdminInterface />
    
    case 'brand_enterprise':
    case 'brand_premium':
    case 'brand_standard':
    case 'brand_free':
      console.log('🏢 Loading BrandUserInterface for brand user')
      return (
        <BrandUserInterface>
          <BrandDashboardContent />
        </BrandUserInterface>
      )
    
    default:
      console.log('❌ Unknown role, showing UnauthorizedAccess. Role was:', user.role)
      return <UnauthorizedAccess />
  }
}

// REMOVED: RoleBasedRedirect function - this was causing competing redirects with AuthGuard