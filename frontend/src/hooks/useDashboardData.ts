// hooks/useDashboardData.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { useEffect } from 'react'

export const useDashboardData = () => {
  const { user } = useEnhancedAuth()
  const queryClient = useQueryClient()

  // REMOVED: Prefetch calls that may cause duplicate requests
  // These queries will be fetched on-demand with proper deduplication

  // Teams overview query with /teams/context fallback
  const teamsQuery = useQuery({
    queryKey: ['teams-overview', user?.id],
    queryFn: async () => {
      const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
      const { fetchWithAuth } = await import('@/utils/apiInterceptor')

      try {
        // Try /teams/overview first
        const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          return data
        }

        // Don't throw on auth errors - let API interceptor handle them
        if (response.status === 401 || response.status === 403) {
          return null
        }

        // On 404, try /teams/context as fallback
        if (response.status === 404) {

          try {
            const { teamApiService } = await import('@/services/teamApi')
            const contextResult = await teamApiService.getTeamContext()
            if (contextResult.success && contextResult.data) {
              // Map TeamContext to the shape the dashboard expects
              const ctx = contextResult.data
              return {
                team_name: ctx.team_name,
                user_role: ctx.user_role,
                subscription_tier: ctx.subscription_tier,
                subscription_status: ctx.subscription_status,
                monthly_limits: ctx.monthly_limits,
                current_usage: ctx.current_usage,
                remaining_capacity: ctx.remaining_capacity,
                user_permissions: ctx.user_permissions
              }
            }
          } catch (ctxError) {
            console.error('Dashboard context fallback failed:', ctxError)
          }

          // Both endpoints failed. This used to invent a Free tier here: 'Personal Account',
          // five profiles, posts switched off. A Premium customer whose team lookup happened
          // to fail was therefore shown, on their own dashboard, as being on the free plan
          // with no way to tell it was a failure rather than the truth. Downgrading someone
          // in the interface because a request failed is the worst of the fabricated-zero
          // family: it is a fabricated fact about what they are paying for.
          //
          // null is already the shape this query returns when it cannot answer (see the
          // 401/403 branch above), so callers handle it: they show unknown rather than a
          // number nobody can stand behind.
          console.error('Teams overview and context both failed; reporting unknown, not free')
          return null
        }

        throw new Error(`Failed to fetch teams overview: ${response.statusText}`)
      } catch (error) {


        // For auth-related errors, return null instead of throwing
        if (error instanceof Error &&
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return null
        }

        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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


          // For auth-related errors, return fallback data
          if (result.error &&
             (result.error.includes('Authentication') || result.error.includes('token'))) {
            return { count: 0, profiles: [] }
          }

          // Handle 404 - unlocked profiles endpoint might not be implemented yet
          if (result.error && result.error.includes('Not Found')) {

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

        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return { count: 0, profiles: [] }
        }
        
        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache for better deduplication
    gcTime: 10 * 60 * 1000, // 10 minutes
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

        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          return { activeCount: 0, campaigns: [] }
        }
        
        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - consistent with other queries
    gcTime: 10 * 60 * 1000, // 10 minutes
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