'use client'

import { useEffect, useRef } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useUserStore } from '@/stores/userStore'

/**
 * UserStoreProvider - Bridges existing auth contexts with new Zustand store
 * Loads user data ONCE after authentication is confirmed
 */
export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useEnhancedAuth()
  const { loadUser, clearUser, isLoading: storeLoading, user: storeUser } = useUserStore()
  const hasLoadedRef = useRef(false)
  const lastStoreUserRef = useRef(null)

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return

    if (isAuthenticated && !storeLoading && !hasLoadedRef.current) {
      console.log('🚀 UserStoreProvider: Loading user data (SINGLE CALL)')
      hasLoadedRef.current = true
      loadUser() // Single API call to /api/v1/auth/dashboard
    } else if (!isAuthenticated && hasLoadedRef.current) {
      console.log('🧹 UserStoreProvider: Clearing user data')
      hasLoadedRef.current = false
      clearUser()
    }
  }, [isAuthenticated, authLoading, storeLoading]) // FIXED: Removed function dependencies

  // REMOVED: No longer need to trigger AuthContext refresh
  // AuthContext now uses dashboard API directly and stays in sync

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