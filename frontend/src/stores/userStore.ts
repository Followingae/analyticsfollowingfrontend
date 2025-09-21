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
  lastLoadTime: number | null

  // Actions
  loadUser: (bustCache?: boolean) => Promise<void>
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
      lastLoadTime: null,

      // Load user data from the new dashboard endpoint
      loadUser: async (bustCache = false) => {
        const { isLoading, lastLoadTime } = get()
        const now = Date.now()

        // Prevent multiple simultaneous calls
        if (isLoading) {
          return
        }

        // Prevent rapid successive calls (less than 1 second apart)
        if (lastLoadTime && (now - lastLoadTime) < 1000) {
          return
        }

        set({ isLoading: true, error: null, lastLoadTime: now })

        try {
          // Import dynamically to avoid circular dependencies
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          
          const dashboardUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/dashboard`
          const url = bustCache ? `${dashboardUrl}?_t=${Date.now()}` : dashboardUrl

          console.log('🔍 UserStore: Dashboard API URL:', url)
          console.log('🔍 UserStore: Base URL env var:', process.env.NEXT_PUBLIC_API_BASE_URL)

          // Add retry logic for database timeout issues
          let response: Response
          const maxRetries = 3

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`🔍 UserStore: Dashboard API attempt ${attempt}/${maxRetries}`)

              response = await fetchWithAuth(
                url,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  // Add timeout to prevent hanging requests
                  signal: AbortSignal.timeout(10000) // 10 second timeout
                }
              )

              if (response.ok) {
                console.log('🔍 UserStore: Dashboard API succeeded')
                break
              } else if (response.status >= 500 && attempt < maxRetries) {
                // Server error - retry with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                console.log(`🔍 UserStore: Server error ${response.status}, retrying in ${delay}ms`)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              } else {
                throw new Error(`Dashboard API failed: ${response.status} ${response.statusText}`)
              }
            } catch (error: any) {
              if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
                if (attempt < maxRetries) {
                  const delay = Math.min(2000 * attempt, 5000)
                  console.log(`🔍 UserStore: Timeout error, retrying in ${delay}ms`)
                  await new Promise(resolve => setTimeout(resolve, delay))
                  continue
                } else {
                  throw new Error(`Dashboard API timeout after ${maxRetries} attempts`)
                }
              }
              throw error
            }
          }

          const data: DashboardData = await response.json()
          


          // CRITICAL FIX: Sync fresh data back to localStorage for AuthContext
          if (data.user && typeof window !== 'undefined') {
            try {
              localStorage.setItem('user_data', JSON.stringify(data.user))
            } catch (error) {
              console.error('Failed to update localStorage:', error)
            }
          }

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
        set({
          user: null,
          subscription: null,
          team: null,
          stats: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastUpdated: null,
          lastLoadTime: null
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