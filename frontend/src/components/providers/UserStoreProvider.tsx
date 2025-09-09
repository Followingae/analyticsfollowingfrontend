'use client'

import { useEffect } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useUserStore } from '@/stores/userStore'

/**
 * UserStoreProvider - Bridges existing auth contexts with new Zustand store
 * Loads user data ONCE after authentication is confirmed
 */
export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useEnhancedAuth()
  const { loadUser, clearUser, isLoading: storeLoading } = useUserStore()

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return

    if (isAuthenticated && !storeLoading) {
      console.log('🚀 UserStoreProvider: Loading user data (SINGLE CALL)')
      loadUser() // Single API call to /api/v1/auth/dashboard
    } else if (!isAuthenticated) {
      console.log('🧹 UserStoreProvider: Clearing user data')
      clearUser()
    }
  }, [isAuthenticated, authLoading, storeLoading]) // FIXED: Removed function dependencies

  return <>{children}</>
}

/**
 * Hook to use the new user store with backward compatibility
 * This allows gradual migration from old auth contexts to new store
 */
export function useUserV2() {
  const store = useUserStore()
  const legacyAuth = useEnhancedAuth()

  return {
    // New store data (preferred)
    user: store.user,
    subscription: store.subscription,
    team: store.team,
    stats: store.stats,
    subscriptionTier: store.subscription?.tier || 'free',
    profilesRemaining: store.subscription 
      ? Math.max(0, store.subscription.limits.profiles - store.subscription.usage.profiles)
      : 0,
    
    // State
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading || legacyAuth.isLoading,
    error: store.error,
    
    // Actions
    loadUser: store.loadUser,
    clearUser: store.clearUser,
    updateUser: store.updateUser,
    
    // Legacy auth methods (for backward compatibility during migration)
    legacyAuth
  }
}