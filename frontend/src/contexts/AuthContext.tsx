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
    
    try {
      // Check if user is stored locally
      const storedUser = authService.getStoredUser()
      
      if (storedUser && authService.isAuthenticated()) {
        // Trust the stored user data without backend verification
        // Token validation will happen on actual API calls
        setUser(storedUser)
        await loadDashboardStats()
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const result = await authService.getDashboardStats()
      if (result.success && result.data) {
        setDashboardStats(result.data)
      }
    } catch (error) {
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data && result.data.access_token) {
        setUser(result.data.user)
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
      const result = await authService.getCurrentUser()
      if (result.success && result.data) {
        
        // If backend returns null but we have a local avatar_config, preserve it locally
        const currentUser = authService.getStoredUser()
        if (!result.data.avatar_config && currentUser?.avatar_config) {
          result.data.avatar_config = currentUser.avatar_config
        }
        
        setUser(result.data)
        localStorage.setItem('user_data', JSON.stringify(result.data))
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