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
    console.log('🔄 Initializing authentication state')
    
    try {
      // Check if user is stored locally
      const storedUser = authService.getStoredUser()
      
      if (storedUser && authService.isAuthenticated()) {
        // Verify token with backend
        const result = await authService.getCurrentUser()
        
        if (result.success && result.data) {
          setUser(result.data)
          await loadDashboardStats()
          console.log('✅ User authenticated:', result.data.email)
        } else {
          // Token is invalid, clear auth state
          authService.logout()
          setUser(null)
          console.log('❌ Token invalid, user logged out')
        }
      } else {
        setUser(null)
        console.log('ℹ️ No authenticated user found')
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
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
      console.error('❌ Failed to load dashboard stats:', error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data) {
        setUser(result.data.user)
        await loadDashboardStats()
        toast.success(`Welcome back, ${result.data.user.full_name}!`)
        console.log('✅ User logged in successfully:', result.data.user.email)
        return true
      } else {
        toast.error(result.error || 'Login failed')
        console.log('❌ Login failed:', result.error)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMessage)
      console.error('❌ Login error:', error)
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
        setUser(result.data.user)
        await loadDashboardStats()
        toast.success(`Welcome to Analytics Following, ${result.data.user.full_name}!`)
        console.log('✅ User registered successfully:', result.data.user.email)
        return true
      } else {
        toast.error(result.error || 'Registration failed')
        console.log('❌ Registration failed:', result.error)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      toast.error(errorMessage)
      console.error('❌ Registration error:', error)
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
    console.log('👋 User logged out')
  }

  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser()
      if (result.success && result.data) {
        setUser(result.data)
      }
    } catch (error) {
      console.error('❌ Failed to refresh user:', error)
    }
  }

  const refreshDashboard = async () => {
    await loadDashboardStats()
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