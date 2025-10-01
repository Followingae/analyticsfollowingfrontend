// hooks/useDashboardData.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useEffect } from 'react'

export const useDashboardData = () => {
  const { user } = useEnhancedAuth()
  const queryClient = useQueryClient()

  // Prefetch likely-needed data when component mounts
  useEffect(() => {
    if (user?.id) {
      // Prefetch system stats that might be needed
      queryClient.prefetchQuery({
        queryKey: ['system-stats'],
        queryFn: async () => {
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.system.stats}`)
          return response.ok ? response.json() : null
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      // Prefetch unlocked profiles that might be accessed
      queryClient.prefetchQuery({
        queryKey: ['unlocked-profiles', user.id],
        queryFn: async () => {
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.unlockedProfiles}`)
          return response.ok ? response.json() : { profiles: [] }
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      })
    }
  }, [user?.id, queryClient])

  // Teams overview query
  const teamsQuery = useQuery({
    queryKey: ['teams-overview', user?.id],
    queryFn: async () => {
      const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
      const { fetchWithAuth } = await import('@/utils/apiInterceptor')
      
      try {
        const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('🚨 Teams Overview API Error:', response.status, response.statusText)

          // Don't throw on auth errors - let API interceptor handle them
          if (response.status === 401 || response.status === 403) {
            return null
          }

          // Handle 404 - team management endpoints might not be implemented yet
          if (response.status === 404) {
            console.warn('⚠️ Team management endpoints not implemented yet, returning default data')
            return {
              team_name: 'Personal Account',
              user_role: 'owner',
              subscription_tier: 'free',
              subscription_status: 'active',
              monthly_limits: { profiles: 5, emails: 0, posts: 0 },
              current_usage: { profiles: 0, emails: 0, posts: 0 },
              remaining_capacity: { profiles: 5, emails: 0, posts: 0 },
              user_permissions: {
                can_analyze_profiles: true,
                can_unlock_emails: false,
                can_analyze_posts: false,
                can_manage_team: false,
                can_invite_members: false,
                can_view_billing: false
              }
            }
          }

          throw new Error(`Failed to fetch teams overview: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        return data
      } catch (error) {
        console.error('🚨 Teams Overview API Exception:', error)
        
        // For auth-related errors, return null instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return null
        }
        
        throw error
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: 'stale', // Only refetch if stale
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && 
         (error.message.includes('Authentication') || error.message.includes('token'))) {
        return false
      }
      return failureCount < 3
    }
  })

  // Unlocked profiles query - use same cache key as creators page to avoid duplicates
  const unlockedProfilesQuery = useQuery({
    queryKey: ['unlocked-creators-page', 1, !!user],
    queryFn: async () => {
      try {
        const { creatorApiService } = await import('@/services/creatorApi')

        const result = await creatorApiService.getUnlockedCreators({
          page: 1,
          page_size: 20
        })
        
        if (!result.success) {
          console.error('🚨 Unlocked Profiles API Error:', result.error)

          // For auth-related errors, return fallback data
          if (result.error &&
             (result.error.includes('Authentication') || result.error.includes('token'))) {
            return { count: 0, profiles: [] }
          }

          // Handle 404 - unlocked profiles endpoint might not be implemented yet
          if (result.error && result.error.includes('Not Found')) {
            console.warn('⚠️ Unlocked profiles endpoint not found, returning empty data')
            return { count: 0, profiles: [] }
          }

          throw new Error(result.error || 'Failed to fetch unlocked profiles')
        }
        
        
        // Handle different pagination response formats
        const totalItems = result.data?.pagination?.total_items 
          || result.data?.pagination?.total_count 
          || result.data?.profiles?.length 
          || 0
        
        
        return {
          count: totalItems,
          profiles: result.data?.profiles || []
        }
      } catch (error) {
        console.error('🚨 Unlocked Profiles API Exception:', error)
        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return { count: 0, profiles: [] }
        }
        
        throw error
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: 'stale', // Only refetch if stale
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && 
         (error.message.includes('Authentication') || error.message.includes('token'))) {
        return false
      }
      return failureCount < 3
    }
  })

  // Active campaigns query
  const activeCampaignsQuery = useQuery({
    queryKey: ['active-campaigns-count', user?.id],
    queryFn: async () => {
      try {
        const { fetchWithAuth } = await import('@/utils/apiInterceptor')
        const { API_CONFIG, ENDPOINTS } = await import('@/config/api')

        const apiUrl = `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.list}`

        const response = await fetchWithAuth(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('🚨 Campaigns API Error:', response.status, response.statusText)
          
          // Don't throw on auth errors - let API interceptor handle them
          if (response.status === 401 || response.status === 403) {
            return { activeCount: 0, campaigns: [] }
          }
          
          throw new Error(`Failed to fetch campaigns: ${response.statusText}`)
        }
        
        const result = await response.json()

        // Handle new backend response structure: { success, data: { campaigns, summary, pagination }, message }
        let campaigns = []
        if (result.data && Array.isArray(result.data.campaigns)) {
          campaigns = result.data.campaigns
        } else if (Array.isArray(result.campaigns)) {
          campaigns = result.campaigns
        } else if (Array.isArray(result.data)) {
          campaigns = result.data
        } else if (Array.isArray(result)) {
          campaigns = result
        }

        const activeCount = campaigns.filter((campaign: any) => campaign.status === 'active').length

        return {
          activeCount,
          campaigns: campaigns
        }
      } catch (error) {
        console.error('🚨 Campaigns API Exception:', error)
        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return { activeCount: 0, campaigns: [] }
        }
        
        throw error
      }
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: 'stale', // Only refetch if stale
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && 
         (error.message.includes('Authentication') || error.message.includes('token'))) {
        return false
      }
      return failureCount < 3
    }
  })

  return {
    // Teams data
    teamsOverview: teamsQuery.data,
    teamsLoading: teamsQuery.isLoading,
    teamsError: teamsQuery.error,
    
    // Unlocked profiles data
    unlockedProfilesCount: unlockedProfilesQuery.data?.count || 0,
    unlockedProfiles: unlockedProfilesQuery.data?.profiles || [],
    profilesLoading: unlockedProfilesQuery.isLoading,
    profilesError: unlockedProfilesQuery.error,
    
    // Active campaigns data
    activeCampaignsCount: activeCampaignsQuery.data?.activeCount || 0,
    campaigns: activeCampaignsQuery.data?.campaigns || [],
    campaignsLoading: activeCampaignsQuery.isLoading,
    campaignsError: activeCampaignsQuery.error,
    
    // Overall loading state
    isLoading: teamsQuery.isLoading || unlockedProfilesQuery.isLoading || activeCampaignsQuery.isLoading,
    
    // Refetch methods
    refetchTeams: teamsQuery.refetch,
    refetchProfiles: unlockedProfilesQuery.refetch,
    refetchCampaigns: activeCampaignsQuery.refetch,
    refetchAll: () => {
      teamsQuery.refetch()
      unlockedProfilesQuery.refetch()
      activeCampaignsQuery.refetch()
    }
  }
}