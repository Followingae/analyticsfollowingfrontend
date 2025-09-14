// hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'

export const useDashboardData = () => {
  const { user } = useEnhancedAuth()

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
            console.log('⚠️  Teams API: Auth error, returning null data')
            return null
          }
          
          throw new Error(`Failed to fetch teams overview: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('🎯 Teams Overview API Success:', {
          data_structure: Object.keys(data || {}),
          team_info: data.team_info ? Object.keys(data.team_info) : 'no team_info',
          subscription_tier: data.team_info?.subscription_tier,
          raw_data: data
        })
        
        return data
      } catch (error) {
        console.error('🚨 Teams Overview API Exception:', error)
        
        // For auth-related errors, return null instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          console.log('⚠️  Teams API: Auth exception, returning null data')
          return null
        }
        
        throw error
      }
    },
    enabled: !!user,
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

  // Unlocked profiles query
  const unlockedProfilesQuery = useQuery({
    queryKey: ['unlocked-profiles-count', user?.id],
    queryFn: async () => {
      try {
        const { creatorApiService } = await import('@/services/creatorApi')
        
        const result = await creatorApiService.getUnlockedCreators({
          page: 1,
          page_size: 10
        })
        
        if (!result.success) {
          console.error('🚨 Unlocked Profiles API Error:', result.error)
          
          // For auth-related errors, return fallback data
          if (result.error && 
             (result.error.includes('Authentication') || result.error.includes('token'))) {
            console.log('⚠️  Profiles API: Auth error, returning fallback data')
            return { count: 0, profiles: [] }
          }
          
          throw new Error(result.error || 'Failed to fetch unlocked profiles')
        }
        
        console.log('🎯 Unlocked Profiles API Success:', {
          total_items: result.data?.pagination?.total_items,
          profiles_length: result.data?.profiles?.length,
          result_structure: Object.keys(result.data || {})
        })
        
        // Handle different pagination response formats
        const totalItems = result.data?.pagination?.total_items 
          || result.data?.pagination?.total_count 
          || result.data?.profiles?.length 
          || 0
        
        console.log('🔧 Total Items Calculation:', {
          pagination_total_items: result.data?.pagination?.total_items,
          pagination_total_count: result.data?.pagination?.total_count,
          profiles_array_length: result.data?.profiles?.length,
          final_count: totalItems
        })
        
        return {
          count: totalItems,
          profiles: result.data?.profiles || []
        }
      } catch (error) {
        console.error('🚨 Unlocked Profiles API Exception:', error)
        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          console.log('⚠️  Profiles API: Auth exception, returning fallback data')
          return { count: 0, profiles: [] }
        }
        
        throw error
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/campaigns`
        console.log('🚀 Campaigns API: Making request to:', apiUrl)

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
            console.log('⚠️  Campaigns API: Auth error, returning fallback data')
            return { activeCount: 0, campaigns: [] }
          }
          
          throw new Error(`Failed to fetch campaigns: ${response.statusText}`)
        }
        
        const data = await response.json()
        let campaigns = data.campaigns || data.data || data || []

        const activeCount = Array.isArray(campaigns)
          ? campaigns.filter((campaign: any) => campaign.status === 'active').length
          : 0

        console.log('🎯 Campaigns API Success:', { activeCount, campaignsLength: campaigns.length })
        
        return {
          activeCount,
          campaigns: campaigns
        }
      } catch (error) {
        console.error('🚨 Campaigns API Exception:', error)
        
        // For auth-related errors, return fallback data instead of throwing
        if (error instanceof Error && 
           (error.message.includes('Authentication') || error.message.includes('token'))) {
          console.log('⚠️  Campaigns API: Auth exception, returning fallback data')
          return { activeCount: 0, campaigns: [] }
        }
        
        throw error
      }
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
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