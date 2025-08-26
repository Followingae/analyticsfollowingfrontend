'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User, DashboardStats } from '@/services/authService'
import { toast } from 'sonner'

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  // Initialize auth state
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('🔐 AuthContext: Auth initialization timeout - clearing loading state')
      setIsLoading(false)
      setUser(null)
    }, 5000) // 5 second timeout

    try {
      // Check if user is stored locally
      const storedUser = authService.getStoredUser()
      
      if (storedUser && authService.isAuthenticated()) {
        console.log('🔐 AuthContext: Found stored user, validating against backend:', {
          id: storedUser.id,
          email: storedUser.email,
          company: storedUser.company,
          full_name: storedUser.full_name,
          first_name: storedUser.first_name,
          last_name: storedUser.last_name
        })
        
        // Set stored user immediately for UI responsiveness
        setUser(storedUser)
        
        // Check if stored data is potentially stale (older than 1 hour)
        const lastUpdated = localStorage.getItem('user_last_updated')
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        const isStale = !lastUpdated || parseInt(lastUpdated) < oneHourAgo
        
        if (isStale) {
          console.log('🔄 AuthContext: Stored user data is stale, force refreshing from backend')
        }
        
        // Always validate against backend, but especially if data is stale
        try {
          await refreshUser()
          localStorage.setItem('user_last_updated', Date.now().toString())
          console.log('✅ AuthContext: User data refreshed from backend')
        } catch (error) {
          console.log('⚠️ AuthContext: Backend validation failed, using stored data:', error)
        }
        
        await loadDashboardStats()
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('🔐 AuthContext: Auth initialization error:', error)
      setUser(null)
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const result = await authService.getDashboardStats()
      if (result.success && result.data) {
        setDashboardStats(result.data)
      } else if (result.error && (result.error.includes('403') || result.error.includes('401') || result.error.includes('authentication'))) {
        // Token is invalid, clear auth state
        console.log('🔐 AuthContext: Invalid token detected, clearing auth state')
        authService.logout()
        setUser(null)
        setDashboardStats(null)
      }
    } catch (error) {
      console.error('🔐 AuthContext: Dashboard stats error:', error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data && result.data.access_token) {
        console.log('🔐 AuthContext: Login API user data:', {
          id: result.data.user.id,
          email: result.data.user.email,
          company: result.data.user.company,
          full_name: result.data.user.full_name,
          first_name: result.data.user.first_name,
          last_name: result.data.user.last_name,
          avatar_config: result.data.user.avatar_config
        })
        
        console.log('🎨 AuthContext: Login avatar_config:', result.data.user.avatar_config)
        setUser(result.data.user)
        
        // If login doesn't return avatar_config, fetch complete profile
        if (!result.data.user.avatar_config) {
          console.log('🔄 AuthContext: Login missing avatar, fetching complete profile...')
          setTimeout(() => {
            refreshUser() // This will merge settings data with login data
          }, 500)
        }
        
        await loadDashboardStats()
        toast.success(`Welcome back, ${result.data.user.full_name}!`)
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
          await loadDashboardStats()
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
    setUser(null)
    setDashboardStats(null)
    authService.logout()
    toast.success('Successfully logged out')
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
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