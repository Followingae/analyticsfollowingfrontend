// hooks/useOptimizedDashboardData.ts
import { useQuery } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { requestCache } from '@/utils/requestCache'
import { batchManager, createDashboardBatch, BATCH_CONFIGS } from '@/utils/batchManager'
import { withRetry, RETRY_CONFIGS } from '@/utils/retryManager'

/**
 * Optimized dashboard data hook that implements all frontend team recommendations:
 * - Batched initial loading
 * - Request deduplication via React Query
 * - Intelligent caching with 5-minute TTL
 * - Exponential backoff retry logic
 * - Proper session management
 */
export const useOptimizedDashboardData = () => {
  const { user } = useEnhancedAuth()

  // Batched dashboard data fetcher
  const fetchDashboardBatch = useCallback(async () => {
    if (!user) return null

    try {
      // Create batch for all dashboard data
      const fetchFunctions = {
        fetchDashboard: async () => {
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          
          return withRetry(
            async () => {
              const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth.dashboard}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              })
              
              if (!response.ok) {
                throw new Error(`Dashboard fetch failed: ${response.statusText}`)
              }
              
              return response.json()
            },
            RETRY_CONFIGS.CRITICAL
          )
        },

        fetchTeams: async () => {
          const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          
          return withRetry(
            async () => {
              const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              })
              
              if (!response.ok) {
                throw new Error(`Teams fetch failed: ${response.statusText}`)
              }
              
              return response.json()
            },
            RETRY_CONFIGS.STANDARD
          )
        },

        fetchProfiles: async () => {
          const { creatorApiService } = await import('@/services/creatorApi')
          
          return withRetry(
            async () => {
              const result = await creatorApiService.getUnlockedCreators({
                page: 1,
                page_size: 10
              })
              
              if (!result.success) {
                throw new Error(result.error || 'Failed to fetch profiles')
              }
              
              return {
                count: result.data?.pagination?.total_items || 0,
                profiles: result.data?.profiles || []
              }
            },
            RETRY_CONFIGS.STANDARD
          )
        },

        fetchCampaigns: async () => {
          const { fetchWithAuth } = await import('@/utils/apiInterceptor')
          
          return withRetry(
            async () => {
              const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/campaigns`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              })
              
              if (!response.ok) {
                throw new Error(`Campaigns fetch failed: ${response.statusText}`)
              }
              
              const data = await response.json()
              const campaigns = data.campaigns || data.data || data || []
              const activeCount = Array.isArray(campaigns) 
                ? campaigns.filter((campaign: any) => campaign.status === 'active').length
                : 0
              
              return {
                activeCount,
                campaigns: campaigns
              }
            },
            RETRY_CONFIGS.STANDARD
          )
        }
      }

      // Create batch requests
      createDashboardBatch(user, fetchFunctions)

      // Execute batch with intelligent concurrency
      const results = await batchManager.executeBatch('dashboard-init', BATCH_CONFIGS.DASHBOARD_INIT)

      // Process results
      const processedData = {
        dashboard: results.find(r => r.id === 'dashboard-data')?.data,
        teams: results.find(r => r.id === 'teams-data')?.data,
        profiles: results.find(r => r.id === 'profiles-data')?.data,
        campaigns: results.find(r => r.id === 'campaigns-data')?.data,
        batchStats: batchManager.getBatchStats('dashboard-init'),
        errors: results.filter(r => !r.success).map(r => ({ id: r.id, error: r.error }))
      }

      
      return processedData

    } catch (error) {
      console.error('💥 Dashboard batch failed:', error)
      throw error
    }
  }, [user])

  // Main dashboard query with optimizations
  const dashboardQuery = useQuery({
    queryKey: ['optimized-dashboard', user?.id],
    queryFn: () => requestCache.get(
      `dashboard-${user?.id}`,
      fetchDashboardBatch,
      5 * 60 * 1000 // 5-minute TTL
    ),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnMount: 'always', // Always fetch on mount for fresh data
    retry: false, // Retry is handled by our retry manager
  })

  // Force refresh function that bypasses cache
  const forceRefresh = useCallback(() => {
    requestCache.invalidate(`dashboard-${user?.id}`)
    return dashboardQuery.refetch()
  }, [user?.id, dashboardQuery])

  // Invalidate related cache entries when user changes
  useEffect(() => {
    if (user?.id) {
      // Invalidate old user cache if switching users
      requestCache.invalidatePattern('dashboard-*')
    }
  }, [user?.id])

  const data = dashboardQuery.data

  return {
    // Dashboard data
    dashboardData: data?.dashboard,
    dashboardLoading: dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error,
    
    // Teams data
    teamsOverview: data?.teams,
    teamsLoading: false, // Loaded as part of batch
    teamsError: data?.errors?.find(e => e.id === 'teams-data')?.error,
    
    // Profiles data
    unlockedProfilesCount: data?.profiles?.count || 0,
    unlockedProfiles: data?.profiles?.profiles || [],
    profilesLoading: false, // Loaded as part of batch
    profilesError: data?.errors?.find(e => e.id === 'profiles-data')?.error,
    
    // Campaigns data
    activeCampaignsCount: data?.campaigns?.activeCount || 0,
    campaigns: data?.campaigns?.campaigns || [],
    campaignsLoading: false, // Loaded as part of batch
    campaignsError: data?.errors?.find(e => e.id === 'campaigns-data')?.error,
    
    // Overall state
    isLoading: dashboardQuery.isLoading,
    hasErrors: data?.errors?.length > 0,
    batchStats: data?.batchStats,
    
    // Actions
    refetch: forceRefresh,
    invalidateCache: () => requestCache.invalidate(`dashboard-${user?.id}`)
  }
}

// Hook for individual data sections (backwards compatibility)
export const useOptimizedTeamsData = () => {
  const { teamsOverview, teamsLoading, teamsError } = useOptimizedDashboardData()
  return {
    data: teamsOverview,
    isLoading: teamsLoading,
    error: teamsError
  }
}

export const useOptimizedProfilesData = () => {
  const { 
    unlockedProfilesCount, 
    unlockedProfiles, 
    profilesLoading, 
    profilesError 
  } = useOptimizedDashboardData()
  
  return {
    count: unlockedProfilesCount,
    profiles: unlockedProfiles,
    isLoading: profilesLoading,
    error: profilesError
  }
}

export const useOptimizedCampaignsData = () => {
  const { 
    activeCampaignsCount, 
    campaigns, 
    campaignsLoading, 
    campaignsError 
  } = useOptimizedDashboardData()
  
  return {
    activeCount: activeCampaignsCount,
    campaigns,
    isLoading: campaignsLoading,
    error: campaignsError
  }
}