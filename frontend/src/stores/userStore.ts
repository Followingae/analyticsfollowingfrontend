// stores/userStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types based on the new dashboard API response structure
export interface User {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  role: 'free' | 'standard' | 'premium' | 'enterprise' | 'admin' | 'superadmin'
  status: string
  created_at: string
  last_login?: string
  profile_picture_url?: string
  timezone?: string
  language?: string
  avatar_config?: {
    variant: string
    colorScheme: string
    colors: string[]
    seed?: string
  }
}

export interface Subscription {
  tier: 'free' | 'standard' | 'premium' | 'enterprise'
  limits: {
    profiles: number
    emails: number
    posts: number
  }
  usage: {
    profiles: number
    emails: number
    posts: number
  }
  is_team_subscription: boolean
}

export interface Team {
  subscription_tier: string
  monthly_limits: {
    profiles: number
    emails: number
    posts: number
  }
  monthly_usage: {
    profiles: number
    emails: number
    posts: number
  }
}

export interface DashboardStats {
  total_searches: number
  searches_this_month: number
  // Add other stats as needed
}

export interface DashboardData {
  user: User
  team: Team
  subscription: Subscription
  stats: DashboardStats
}

interface UserStore {
  // State
  user: User | null
  subscription: Subscription | null
  team: Team | null
  stats: DashboardStats | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  lastUpdated: Date | null

  // Actions
  loadUser: () => Promise<void>
  clearUser: () => void
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      subscription: null,
      team: null,
      stats: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      lastUpdated: null,

      // Load user data from the new dashboard endpoint
      loadUser: async () => {
        const { isLoading } = get()
        if (isLoading) return // Prevent multiple simultaneous calls

        set({ isLoading: true, error: null })

        try {
          // Import dynamically to avoid circular dependencies
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          
          const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/dashboard`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          )

          if (!response.ok) {
            throw new Error(`Dashboard API failed: ${response.status} ${response.statusText}`)
          }

          const data: DashboardData = await response.json()
          
          console.log('🎯 Global User Store - Dashboard API Response:', {
            user_role: data.user?.role,
            subscription_tier: data.subscription?.tier,
            subscription_limits: data.subscription?.limits,
            subscription_usage: data.subscription?.usage,
            team_tier: data.team?.subscription_tier,
            is_team_subscription: data.subscription?.is_team_subscription
          })

          // SINGLE SOURCE OF TRUTH: Use the new structured response
          set({
            user: data.user,
            subscription: data.subscription,
            team: data.team,
            stats: data.stats,
            isAuthenticated: !!data.user,
            isLoading: false,
            error: null,
            lastUpdated: new Date()
          })

        } catch (error) {
          console.error('Failed to load user data:', error)
          
          set({
            user: null,
            subscription: null,
            team: null,
            stats: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load user data',
            lastUpdated: null
          })
        }
      },

      // Clear user data on logout
      clearUser: () => {
        console.log('🧹 Clearing user store')
        set({
          user: null,
          subscription: null,
          team: null,
          stats: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastUpdated: null
        })
      },

      // Update user data (for profile changes)
      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          lastUpdated: new Date()
        }))
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error })
    }),
    {
      name: 'user-store', // Name for devtools
    }
  )
)

// Computed selectors for easy access
export const useUserData = () => useUserStore((state) => state.user)
export const useSubscriptionData = () => useUserStore((state) => state.subscription)
export const useTeamData = () => useUserStore((state) => state.team)
export const useStatsData = () => useUserStore((state) => state.stats)
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated)
export const useIsLoading = () => useUserStore((state) => state.isLoading)
export const useUserError = () => useUserStore((state) => state.error)

// Computed subscription helpers
export const useSubscriptionTier = () => useUserStore((state) => state.subscription?.tier || 'free')
export const useProfilesRemaining = () => useUserStore((state) => {
  if (!state.subscription) return 0
  return Math.max(0, state.subscription.limits.profiles - state.subscription.usage.profiles)
})
export const useEmailsRemaining = () => useUserStore((state) => {
  if (!state.subscription) return 0
  return Math.max(0, state.subscription.limits.emails - state.subscription.usage.emails)
})
export const usePostsRemaining = () => useUserStore((state) => {
  if (!state.subscription) return 0
  return Math.max(0, state.subscription.limits.posts - state.subscription.usage.posts)
})