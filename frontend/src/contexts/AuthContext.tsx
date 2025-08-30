'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
// import { authService, User, DashboardStats } from '@/services/authService'
import { toast } from 'sonner'

// TEMPORARY: Import authService with error handling
let authService: any = null
let User: any = null
let DashboardStats: any = null
let tokenManager: any = null

try {
  const authModule = require('@/services/authService')
  authService = authModule.authService
  User = authModule.User
  DashboardStats = authModule.DashboardStats
  
  const tokenModule = require('@/utils/tokenManager')
  tokenManager = tokenModule.tokenManager
  
  console.log('🔐 AuthContext: authService and tokenManager imported successfully')
} catch (error) {
  console.error('🚨 AuthContext: Failed to import authService or tokenManager:', error)
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  dashboardStats: DashboardStats | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  refreshDashboard: () => Promise<void>
  updateProfile: (profileData: any) => Promise<boolean>
  updateUserState: (userData: Partial<User>) => void
  isPremium: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🔐 AuthProvider: Component rendering/mounting')
  
  // HYDRATION FIX: Initialize with null to match server-side render, then hydrate from localStorage
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Debug wrapper for setUser to track all state changes
  const debugSetUser = (newUser: User | null, reason: string = 'unknown') => {
    console.log('🔐 AuthContext: USER STATE CHANGE:', {
      from: user?.email || 'null',
      to: newUser?.email || 'null',
      reason,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    })
    setUser(newUser)
  }
  
  const [isLoading, setIsLoading] = useState(false) // HOTFIX: Start with false to prevent infinite loading
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  // Hydration effect - restore user state and sync with TokenManager
  useEffect(() => {
    console.log('🔐 AuthProvider: Client-side hydration starting')
    
    try {
      const storedUser = localStorage.getItem('user_data')
      const storedTokens = localStorage.getItem('auth_tokens')
      
      console.log('🔐 AuthProvider: DETAILED Hydration check:', {
        storedUserRaw: storedUser,
        storedTokensRaw: storedTokens,
        hasStoredUser: !!storedUser && storedUser !== 'null',
        hasStoredTokens: !!storedTokens && storedTokens !== 'null',
        authServiceReady: !!authService,
        tokenManagerReady: !!tokenManager,
        currentUserState: !!user,
        userEmail: user?.email,
        localStorageKeys: Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('user'))
      })
      
      if (storedUser && storedTokens && storedUser !== 'null' && storedTokens !== 'null') {
        try {
          const userData = JSON.parse(storedUser)
          const tokenData = JSON.parse(storedTokens)
          
          console.log('🔐 AuthProvider: Parsed data validation:', {
            userDataValid: !!(userData?.email),
            tokenDataValid: !!(tokenData?.access_token && tokenData.access_token !== 'null'),
            userEmail: userData?.email,
            tokenPreview: tokenData?.access_token?.substring(0, 20) + '...',
            tokenExpiry: tokenData?.expires_at ? new Date(tokenData.expires_at).toISOString() : 'no expiry'
          })
          
          // Validate that we have valid data
          if (userData?.email && tokenData?.access_token && tokenData.access_token !== 'null') {
            console.log('🔐 AuthProvider: RESTORING USER after hydration:', userData.email)
            
            // CRITICAL FIX: Sync TokenManager with stored data during hydration
            if (tokenManager?.setTokenData) {
              console.log('🔐 AuthProvider: Syncing TokenManager during hydration')
              tokenManager.setTokenData(tokenData)
              
              // Verify sync worked
              const tokenManagerCheck = tokenManager.isAuthenticated?.()
              console.log('🔐 AuthProvider: TokenManager sync result:', tokenManagerCheck)
            }
            
            // Set user state
            debugSetUser(userData, 'hydration-restore')
            
            console.log('🔐 AuthProvider: ✅ HYDRATION COMPLETE - USER RESTORED:', {
              email: userData.email,
              userStateSet: true,
              timestamp: new Date().toISOString()
            })
          } else {
            console.error('🔐 AuthProvider: ❌ INVALID STORED DATA during hydration:', {
              hasUserEmail: !!userData?.email,
              hasValidToken: !!(tokenData?.access_token && tokenData.access_token !== 'null'),
              userData: userData,
              tokenData: tokenData
            })
          }
        } catch (parseError) {
          console.error('🔐 AuthProvider: ❌ JSON PARSE ERROR during hydration:', parseError)
        }
      } else {
        console.warn('🔐 AuthProvider: ❌ NO STORED AUTH DATA found during hydration:', {
          storedUser: storedUser,
          storedTokens: storedTokens,
          hasUser: !!storedUser,
          hasTokens: !!storedTokens
        })
      }
    } catch (error) {
      console.error('🔐 AuthProvider: ❌ HYDRATION ERROR:', error)
    }
    
    console.log('🔐 AuthProvider: Setting isHydrated = true')
    setIsHydrated(true)
  }, [])

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    if (!isHydrated) return
    
    console.log('🔐 AuthProvider: Setting up emergency timeout after hydration')
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 AuthProvider: EMERGENCY TIMEOUT - setting isLoading to false')
      setIsLoading(false)
    }, 3000)
    
    return () => clearTimeout(emergencyTimeout)
  }, [isHydrated])

  // Subscribe to token changes for real-time sync like Instagram - only after hydration
  useEffect(() => {
    if (!isHydrated || !tokenManager) return
    
    console.log('🔐 AuthContext: Setting up token change listener after hydration')
    const unsubscribe = tokenManager.subscribe((token: string | null) => {
      console.log('🔐 AuthContext: Token change detected:', !!token)
      
      if (!token) {
        // Token was cleared, clear user state
        console.log('🔐 AuthContext: Token cleared, clearing user state')
        debugSetUser(null, 'token-cleared')
        setDashboardStats(null)
      } else {
        // Token was updated, verify user state is consistent
        console.log('🔐 AuthContext: Token updated, verifying user state consistency')
        const storedUser = authService?.getStoredUser()
        if (storedUser && (!user || user.email !== storedUser.email)) {
          console.log('🔐 AuthContext: Syncing user state with token change')
          debugSetUser(storedUser, 'token-sync')
        }
      }
    })
    
    return unsubscribe
  }, [user, isHydrated])

  // Initialize auth state - only after hydration to prevent SSR issues
  useEffect(() => {
    if (!isHydrated) return
    
    console.log('🔐 AuthContext: useEffect triggered after hydration - calling initializeAuth')
    
    try {
      // Set a timeout to ensure isLoading is set to false even if initializeAuth hangs
      const timeoutId = setTimeout(() => {
        console.log('🚨 AuthContext: TIMEOUT - forcefully setting isLoading to false')
        setIsLoading(false)
      }, 5000) // 5 second timeout
      
      initializeAuth().finally(() => {
        clearTimeout(timeoutId) // Cancel timeout if initializeAuth completes
      })
    } catch (error) {
      console.error('🚨 AuthContext: useEffect error:', error)
      setIsLoading(false) // Ensure loading is set to false even if there's an error
    }
  }, [isHydrated])

  const initializeAuth = async () => {
    console.log('🔐 AuthContext: initializeAuth started')
    try {
      console.log('🔐 AuthContext: Checking stored user and auth status')
      
      let storedUser = null
      let isAuthenticated = false
      
      try {
        storedUser = authService.getStoredUser()
        console.log('🔐 AuthContext: getStoredUser successful:', !!storedUser)
      } catch (error) {
        console.error('🚨 AuthContext: getStoredUser failed:', error)
      }
      
      try {
        isAuthenticated = authService.isAuthenticated()
        console.log('🔐 AuthContext: isAuthenticated successful:', isAuthenticated)
      } catch (error) {
        console.error('🚨 AuthContext: isAuthenticated failed:', error)
      }
      
      console.log('🔐 AuthContext: Auth check results:', {
        hasStoredUser: !!storedUser,
        isAuthenticated,
        userEmail: storedUser?.email,
        currentUserState: !!user
      })
      
      if (storedUser && isAuthenticated) {
        console.log('🔐 AuthContext: User authenticated, updating user state')
        
        // Only update user state if we don't already have it (prevent unnecessary re-renders)
        if (!user || user.email !== storedUser.email) {
          debugSetUser(storedUser, 'init-auth-restore')
        }
        
        const lastUpdated = localStorage.getItem('user_last_updated')
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        const isStale = !lastUpdated || parseInt(lastUpdated) < oneHourAgo
        
        if (isStale) {
          console.log('🔐 AuthContext: User data is stale, refreshing...')
          try {
            await refreshUser()
            localStorage.setItem('user_last_updated', Date.now().toString())
          } catch (error) {
            console.log('🔐 AuthContext: Refresh failed, keeping stored user')
          }
        }
        
        try {
          console.log('🔐 AuthContext: Loading dashboard stats...')
          await loadDashboardStats()
        } catch (error) {
          console.log('🔐 AuthContext: Dashboard stats failed, ignoring')
        }
      } else {
        // CRITICAL FIX: Only clear user state if we're definitely not authenticated AND have no valid tokens
        // Also check if we already have user state from hydration
        const hasValidTokens = (() => {
          try {
            const tokens = localStorage.getItem('auth_tokens')
            if (tokens && tokens !== 'null') {
              const tokenData = JSON.parse(tokens)
              return !!(tokenData?.access_token && tokenData.access_token !== 'null')
            }
          } catch (e) {}
          return false
        })()
        
        const currentlyHasUser = !!user
        
        if (!hasValidTokens && !storedUser && !currentlyHasUser) {
          console.log('🔐 AuthContext: No valid authentication found, clearing user state')
          debugSetUser(null, 'init-auth-clear')
        } else {
          console.log('🔐 AuthContext: Preserving authentication state:', {
            hasValidTokens,
            hasStoredUser: !!storedUser,
            currentlyHasUser,
            reason: hasValidTokens ? 'valid tokens' : currentlyHasUser ? 'current user state' : 'stored user data'
          })
        }
      }
    } catch (error) {
      console.error('🔐 AuthContext: initializeAuth error:', error)
      // Don't clear user state on errors - could be network issues
    } finally {
      console.log('🔐 AuthContext: initializeAuth finished, setting isLoading to false')
      setIsLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    console.log('🔐 AuthContext: loadDashboardStats called')
    try {
      console.log('🔐 AuthContext: Calling authService.getDashboardStats()')
      const result = await authService.getDashboardStats()
      console.log('🔐 AuthContext: getDashboardStats result:', { success: result.success, hasData: !!result.data, error: result.error })
      
      if (result.success && result.data) {
        console.log('🔐 AuthContext: Setting dashboard stats')
        setDashboardStats(result.data)
      } else if (result.error && (result.error.includes('403') || result.error.includes('401') || result.error.includes('authentication'))) {
        // Log the error but don't immediately logout - could be a temporary network issue
        console.warn('🔐 AuthContext: Dashboard stats auth error (not logging out immediately):', result.error)
        // Only set stats to null, keep user authenticated
        setDashboardStats(null)
      }
      console.log('🔐 AuthContext: loadDashboardStats completed')
    } catch (error) {
      console.error('🔐 AuthContext: Dashboard stats error:', error)
      // Don't logout on network errors
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthContext: Starting login process for:', email)
    setIsLoading(true)
    
    try {
      console.log('🔐 AuthContext: Calling authService.login...')
      const result = await authService.login({ email, password })
      console.log('🔐 AuthContext: authService.login completed with result:', result)
      
      console.log('🔐 AuthContext: Login API response:', {
        success: result.success,
        hasData: !!result.data,
        hasUser: !!result.data?.user,
        hasToken: !!result.data?.access_token,
        error: result.error
      })
      
      if (result.success && result.data && result.data.access_token) {
        console.log('🔐 AuthContext: Login successful, setting user data')
        
        const userData = result.data.user
        console.log('🔐 AuthContext: Login user data:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name
        })
        
        // Set user IMMEDIATELY
        setUser(userData)
        localStorage.setItem('user_last_updated', Date.now().toString())
        
        console.log('✅ AuthContext: User state set, authentication complete')
        
        // Verify data is actually stored
        setTimeout(() => {
          const storedUser = localStorage.getItem('user_data')
          const storedTokens = localStorage.getItem('auth_tokens')
          console.log('🔍 AuthContext: Post-login verification:', {
            hasStoredUser: !!storedUser,
            hasStoredTokens: !!storedTokens,
            authServiceAuthenticated: authService.isAuthenticated(),
            currentUserState: !!user
          })
        }, 100)
        
        // If login doesn't return avatar_config, fetch complete profile
        if (!userData.avatar_config) {
          console.log('🔄 AuthContext: Login missing avatar, fetching complete profile...')
          setTimeout(() => {
            refreshUser() // This will merge settings data with login data
          }, 500)
        }
        
        // Load dashboard stats (protected by grace period)
        try {
          console.log('🔐 AuthContext: Loading dashboard stats after login...')
          await loadDashboardStats()
          console.log('🔐 AuthContext: Dashboard stats loaded successfully')
        } catch (error) {
          console.warn('⚠️ AuthContext: Dashboard stats loading failed after login:', error)
        }
        
        console.log('🔐 AuthContext: Login process complete, returning true')
        
        // Double check that data is still there
        setTimeout(() => {
          const stillThere = authService.isAuthenticated()
          const stillHasUser = authService.getStoredUser()
          console.log('🔍 AuthContext: Post-login verification (500ms later):', {
            stillAuthenticated: stillThere,
            stillHasUser: !!stillHasUser,
            currentUser: user?.email
          })
        }, 500)
        
        toast.success(`Welcome back, ${userData.full_name}!`)
        return true
      } else {
        // Handle specific login errors (including email confirmation)
        const errorMessage = result.error || 'Login failed'
        
        // Check if this is an email confirmation error
        if (errorMessage.includes('email') && errorMessage.includes('confirmation')) {
          toast.error(errorMessage, {
            duration: 8000,
            action: {
              label: 'Resend Email',
              onClick: () => {
                const email = localStorage.getItem('pending_confirmation_email')
                if (email) {
                  // TODO: Implement resend confirmation email
                  toast.info('Please contact support to resend confirmation email')
                }
              }
            }
          })
        } else {
          toast.error(errorMessage)
        }
        
        return false
      }
    } catch (error) {
      console.error('🚨 AuthContext: Login error caught:', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMessage)
      return false
    } finally {
      console.log('🔐 AuthContext: Setting isLoading to false in finally block')
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await authService.register({ email, password, full_name: fullName })
      
      if (result.success && result.data) {
        // NEW: Handle email confirmation flow
        if (result.data.email_confirmation_required) {
          // Registration successful but email confirmation required
          const message = result.data.message || 'Registration successful! Please check your email to confirm your account.'
          toast.success(message, {
            duration: 10000,
            description: `A confirmation email has been sent to ${result.data.user?.email || email}. Please click the link to activate your account.`
          })
          
          // Store user data but don't set as logged in (no access token)
          setUser(null) // Keep user logged out until email confirmed
          
          return true
        } else if (result.data.access_token) {
          // Registration successful with immediate login (if no email confirmation required)
          setUser(result.data.user)
          // Load dashboard stats but don't fail registration if it errors
          try {
            await loadDashboardStats()
          } catch (error) {
            console.log('⚠️ AuthContext: Dashboard stats loading failed after registration:', error)
          }
          toast.success(`Welcome to Analytics Following, ${result.data.user.full_name}!`)
          return true
        } else {
          // Registration successful but no token and no confirmation flow
          toast.success('Registration successful! You can now log in.')
          return true
        }
      } else {
        toast.error(result.error || 'Registration failed')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('🚨 AuthContext: logout() called!')
    console.trace('AuthContext logout call stack:')
    
    // Clear context state immediately and defensively
    setUser(null)
    setDashboardStats(null)
    setIsLoading(false)
    
    try {
      // Call authService logout (which will handle token cleanup and redirects)
      if (authService?.logout) {
        authService.logout()
      }
      
      // Ensure TokenManager also clears tokens
      if (tokenManager?.clearAllTokens) {
        tokenManager.clearAllTokens()
      }
      
      // Clear any remaining localStorage items defensively
      if (typeof window !== 'undefined') {
        const itemsToClear = ['user_data', 'auth_tokens', 'access_token', 'refresh_token', 'user_last_updated']
        itemsToClear.forEach(item => {
          try {
            localStorage.removeItem(item)
          } catch (e) {
            console.warn(`Failed to clear ${item}:`, e)
          }
        })
      }
    } catch (error) {
      console.error('🚨 AuthContext: Logout error:', error)
    }
    
    // Only show success message if we're not redirecting
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAlreadyOnAuthPage = currentPath.startsWith('/auth/') || currentPath === '/login'
    
    if (isAlreadyOnAuthPage) {
      toast.success('Successfully logged out')
    }
  }

  const refreshUser = async () => {
    try {
      // Try to get complete user profile from settings API first (has avatar data)
      console.log('🔄 AuthContext: Refreshing user - trying settings API first...')
      
      let result;
      try {
        // Import settingsApiService dynamically to get complete profile data
        const { settingsApiService } = await import('@/services/settingsApi')
        const settingsResult = await settingsApiService.getProfile()
        
        if (settingsResult.success && settingsResult.data) {
          console.log('✅ AuthContext: Got complete profile from settings API')
          result = settingsResult
        } else {
          console.log('🔄 AuthContext: Settings API failed, falling back to auth API')
          result = await authService.getCurrentUser()
        }
      } catch (error) {
        console.log('🔄 AuthContext: Settings API not available, using auth API')
        result = await authService.getCurrentUser()
      }
      
      if (result.success && result.data) {
        
        // Preserve local user data if backend returns null/empty values
        const currentUser = authService.getStoredUser()
        const mergedUserData = { ...result.data }
        
        if (currentUser) {
          // Preserve avatar_config if backend doesn't have it
          if (!result.data.avatar_config && currentUser.avatar_config) {
            console.log('🎨 AuthContext: Preserving local avatar_config:', currentUser.avatar_config)
            mergedUserData.avatar_config = currentUser.avatar_config
          }
          
          // Debug avatar handling
          console.log('🎨 AuthContext: Avatar data comparison:', {
            backend_avatar: result.data.avatar_config,
            local_avatar: currentUser.avatar_config,
            will_preserve: !result.data.avatar_config && currentUser.avatar_config
          })
          
          // Preserve other fields if backend returns null/empty
          if (!result.data.company && currentUser.company) {
            mergedUserData.company = currentUser.company
          }
          if (!result.data.full_name && currentUser.full_name) {
            mergedUserData.full_name = currentUser.full_name
          }
          if (!result.data.first_name && currentUser.first_name) {
            mergedUserData.first_name = currentUser.first_name
          }
          if (!result.data.last_name && currentUser.last_name) {
            mergedUserData.last_name = currentUser.last_name
          }
        }
        
        console.log('🔄 AuthContext: Refreshed user data merged:', mergedUserData)
        setUser(mergedUserData)
        localStorage.setItem('user_data', JSON.stringify(mergedUserData))
      } else {
        console.log('🔄 AuthContext: Failed to refresh user:', result.error)
      }
    } catch (error) {
      console.error('🔄 AuthContext: Error refreshing user:', error)
    }
  }

  const updateUserState = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      
      const updatedUser = { ...prev, ...userData }
      
      // Persist all changes to localStorage immediately
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      
      return updatedUser
    })
  }

  const refreshDashboard = async () => {
    await loadDashboardStats()
  }

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const { settingsService } = await import('@/services/settingsService')
      const result = await settingsService.updateProfile(profileData)
      
      if (result.success && result.data) {
        
        // Update the local auth state with the fresh data from API response
        updateUserState({
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          full_name: result.data.full_name,
          company: result.data.company,
          job_title: result.data.job_title,
          phone_number: result.data.phone_number,
          bio: result.data.bio,
          avatar_config: result.data.avatar_config
        })
        
        toast.success(result.data.message || 'Profile updated successfully')
        return true
      } else {
        toast.error(result.error || 'Failed to update profile')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      toast.error(errorMessage)
      return false
    }
  }

  // INDUSTRY STANDARD: Authentication status should be based on valid tokens, not just user state
  const isAuthenticated = useMemo(() => {
    console.log('🔐 AuthContext: isAuthenticated check triggered:', {
      isHydrated,
      hasUser: !!user,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    })
    
    // During initial hydration, be more lenient to prevent logout
    if (!isHydrated) {
      const result = !!user
      console.log('🔐 AuthContext: ⏳ Not yet hydrated, using basic user state check:', result)
      return result
    }
    
    // Multi-layer validation like Instagram/Facebook (only after hydration)
    if (!user) {
      console.log('🔐 AuthContext: ❌ No user state, returning false')
      return false
    }
    
    try {
      // Check if TokenManager considers us authenticated
      const tokenManagerAuth = tokenManager?.isAuthenticated?.() ?? true // Default to true if not available
      
      // Check if authService considers us authenticated  
      const serviceAuth = authService?.isAuthenticated?.() ?? true // Default to true if not available
      
      // All layers must agree, but be forgiving during initialization
      const result = !!(user && tokenManagerAuth && serviceAuth)
      
      console.log('🔐 AuthContext: 🔍 DETAILED Authentication validation:', {
        hasUser: !!user,
        userEmail: user?.email,
        tokenManagerAuth,
        serviceAuth,
        tokenManagerReady: !!tokenManager?.isAuthenticated,
        serviceReady: !!authService?.isAuthenticated,
        finalResult: result,
        timestamp: new Date().toISOString()
      })
      
      if (!result) {
        console.error('🔐 AuthContext: ❌ AUTHENTICATION VALIDATION FAILED:', {
          reason: !tokenManagerAuth ? 'TokenManager failed' : !serviceAuth ? 'AuthService failed' : 'Unknown',
          hasUser: !!user,
          tokenManagerAuth,
          serviceAuth,
          tokenManagerReady: !!tokenManager?.isAuthenticated,
          serviceReady: !!authService?.isAuthenticated,
          finalResult: result
        })
      } else {
        console.log('🔐 AuthContext: ✅ Authentication validation PASSED')
      }
      
      return result
    } catch (error) {
      console.error('🔐 AuthContext: ❌ Authentication validation ERROR:', error)
      return !!user // Fall back to user state if validation fails
    }
  }, [user, isHydrated])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    dashboardStats,
    login,
    register,
    logout,
    refreshUser,
    refreshDashboard,
    updateProfile,
    updateUserState,
    isPremium: authService.isPremiumUser(),
    isAdmin: authService.isAdmin()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }