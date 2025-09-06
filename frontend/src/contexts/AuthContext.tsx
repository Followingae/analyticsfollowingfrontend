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
  

} catch (error) {

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

  
  // HYDRATION FIX: Initialize with null to match server-side render, then hydrate from localStorage
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Debug wrapper for setUser to track all state changes
  const debugSetUser = (newUser: User | null, reason: string = 'unknown') => {
    setUser(newUser)
  }
  
  const [isLoading, setIsLoading] = useState(false) // HOTFIX: Start with false to prevent infinite loading
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  // Hydration effect - restore user state and sync with TokenManager
  useEffect(() => {

    
    try {
      const storedUser = localStorage.getItem('user_data')
      const storedTokens = localStorage.getItem('auth_tokens')
      
      if (storedUser && storedTokens && storedUser !== 'null' && storedTokens !== 'null') {
        try {
          const userData = JSON.parse(storedUser)
          const tokenData = JSON.parse(storedTokens)
          
          // Validate that we have valid data
          if (userData?.email && tokenData?.access_token && tokenData.access_token !== 'null') {

            
            // CRITICAL FIX: Sync TokenManager with stored data during hydration
            if (tokenManager?.setTokenData) {

              tokenManager.setTokenData(tokenData)
              
              // Verify sync worked
              const tokenManagerCheck = tokenManager.isAuthenticated?.()

            }
            
            // Set user state
            debugSetUser(userData, 'hydration-restore')
          } else {
            // Invalid data, skip hydration
          }
        } catch (parseError) {
          // Parse error occurred
        }
      } else {
        // No stored data found
      }
    } catch (error) {

    }
    

    setIsHydrated(true)
  }, [])

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    if (!isHydrated) return
    

    const emergencyTimeout = setTimeout(() => {

      setIsLoading(false)
    }, 3000)
    
    return () => clearTimeout(emergencyTimeout)
  }, [isHydrated])

  // Subscribe to token changes for real-time sync like Instagram - only after hydration
  useEffect(() => {
    if (!isHydrated || !tokenManager) return
    

    const unsubscribe = tokenManager.subscribe((token: string | null) => {

      
      if (!token) {
        // Token was cleared, clear user state

        debugSetUser(null, 'token-cleared')
        setDashboardStats(null)
      } else {
        // Token was updated, verify user state is consistent

        const storedUser = authService?.getStoredUser()
        if (storedUser && (!user || user.email !== storedUser.email)) {

          debugSetUser(storedUser, 'token-sync')
        }
      }
    })
    
    return unsubscribe
  }, [user, isHydrated])

  // Initialize auth state - only after hydration to prevent SSR issues
  useEffect(() => {
    if (!isHydrated) return
    

    
    try {
      // Set a timeout to ensure isLoading is set to false even if initializeAuth hangs
      const timeoutId = setTimeout(() => {

        setIsLoading(false)
      }, 5000) // 5 second timeout
      
      initializeAuth().finally(() => {
        clearTimeout(timeoutId) // Cancel timeout if initializeAuth completes
      })
    } catch (error) {

      setIsLoading(false) // Ensure loading is set to false even if there's an error
    }
  }, [isHydrated])

  const initializeAuth = async () => {

    try {

      
      let storedUser = null
      let isAuthenticated = false
      
      try {
        storedUser = authService.getStoredUser()

      } catch (error) {

      }
      
      try {
        isAuthenticated = authService.isAuthenticated()

      } catch (error) {
        // Error checking authentication
      }
      
      if (storedUser && isAuthenticated) {

        
        // Only update user state if we don't already have it (prevent unnecessary re-renders)
        if (!user || user.email !== storedUser.email) {
          debugSetUser(storedUser, 'init-auth-restore')
        }
        
        const lastUpdated = localStorage.getItem('user_last_updated')
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        const isStale = !lastUpdated || parseInt(lastUpdated) < oneHourAgo
        
        if (isStale) {

          try {
            await refreshUser()
            localStorage.setItem('user_last_updated', Date.now().toString())
          } catch (error) {

          }
        }
        
        // FIXED: Don't load dashboard stats during initialization to prevent duplicate calls
        // Let individual components load their own data when needed
        // await loadDashboardStats() - REMOVED
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

          debugSetUser(null, 'init-auth-clear')
        } else {
          // Other auth states
        }
      }
    } catch (error) {

      // Don't clear user state on errors - could be network issues
    } finally {

      setIsLoading(false)
    }
  }

  const loadDashboardStats = async () => {

    try {

      const result = await authService.getDashboardStats()

      
      if (result.success && result.data) {

        setDashboardStats(result.data)
      } else if (result.error && (result.error.includes('403') || result.error.includes('401') || result.error.includes('authentication'))) {
        // Log the error but don't immediately logout - could be a temporary network issue

        // Only set stats to null, keep user authenticated
        setDashboardStats(null)
      }

    } catch (error) {

      // Don't logout on network errors
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {

    setIsLoading(true)
    
    try {

      const result = await authService.login({ email, password })
      
      if (result.success && result.data && result.data.access_token) {

        
        const userData = result.data.user
        
        // Set user IMMEDIATELY
        setUser(userData)
        localStorage.setItem('user_last_updated', Date.now().toString())
        

        
        // Verify data is actually stored
        setTimeout(() => {
          const storedUser = localStorage.getItem('user_data')
          const storedTokens = localStorage.getItem('auth_tokens')
        }, 100)
        
        // If login doesn't return avatar_config, fetch complete profile
        if (!userData.avatar_config) {

          setTimeout(() => {
            refreshUser() // This will merge settings data with login data
          }, 500)
        }
        
        // FIXED: Don't load dashboard stats in login - let components load their own data
        // This prevents duplicate API calls on login
        // await loadDashboardStats() - REMOVED
        

        
        // Double check that data is still there
        setTimeout(() => {
          const stillThere = authService.isAuthenticated()
          const stillHasUser = authService.getStoredUser()
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

      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMessage)
      return false
    } finally {

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
          // FIXED: Don't load dashboard stats on registration to prevent duplicate calls
          // await loadDashboardStats() - REMOVED
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

          }
        })
      }
    } catch (error) {

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

      
      let result;
      try {
        // Import settingsApiService dynamically to get complete profile data
        const { settingsApiService } = await import('@/services/settingsApi')
        const settingsResult = await settingsApiService.getProfile()
        
        if (settingsResult.success && settingsResult.data) {

          result = settingsResult
        } else {

          result = await authService.getCurrentUser()
        }
      } catch (error) {

        result = await authService.getCurrentUser()
      }
      
      if (result.success && result.data) {
        
        // Preserve local user data if backend returns null/empty values
        const currentUser = authService.getStoredUser()
        const mergedUserData = { ...result.data }
        
        if (currentUser) {
          // Preserve avatar_config if backend doesn't have it
          if (!result.data.avatar_config && currentUser.avatar_config) {

            mergedUserData.avatar_config = currentUser.avatar_config
          }
          
          // Debug avatar handling
          
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
        

        setUser(mergedUserData)
        localStorage.setItem('user_data', JSON.stringify(mergedUserData))
      } else {

      }
    } catch (error) {

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
    
    // During initial hydration, be more lenient to prevent logout
    if (!isHydrated) {
      const result = !!user

      return result
    }
    
    // Multi-layer validation like Instagram/Facebook (only after hydration)
    if (!user) {

      return false
    }
    
    try {
      // Check if TokenManager considers us authenticated
      let tokenManagerAuth = true // Default to true if not available
      if (tokenManager && typeof tokenManager.isAuthenticated === 'function') {
        try {
          tokenManagerAuth = tokenManager.isAuthenticated()

        } catch (error) {

          tokenManagerAuth = true // Default to true on error
        }
      } else {

      }
      
      // Check if authService considers us authenticated  
      let serviceAuth = true // Default to true if not available
      if (authService && typeof authService.isAuthenticated === 'function') {
        try {
          serviceAuth = authService.isAuthenticated()

        } catch (error) {

          serviceAuth = true // Default to true on error
        }
      } else {

      }
      
      // All layers must agree, but be forgiving during initialization
      const result = !!(user && tokenManagerAuth && serviceAuth)
      
      if (!result) {
        const errorDetails = {
          reason: !tokenManagerAuth ? 'TokenManager failed' : !serviceAuth ? 'AuthService failed' : 'Unknown',
          hasUser: !!user,
          tokenManagerAuth,
          serviceAuth,
          tokenManagerReady: !!tokenManager?.isAuthenticated,
          serviceReady: !!authService?.isAuthenticated,
          finalResult: result,
          tokenManagerExists: !!tokenManager,
          authServiceExists: !!authService
        }

      } else {

      }
      
      return result
    } catch (error) {

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