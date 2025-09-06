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
      
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams overview: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Unlocked profiles query
  const unlockedProfilesQuery = useQuery({
    queryKey: ['unlocked-profiles-count', user?.id],
    queryFn: async () => {
      const { creatorApiService } = await import('@/services/creatorApi')
      
      const result = await creatorApiService.getUnlockedCreators({
        page: 1,
        page_size: 10
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch unlocked profiles')
      }
      
      return {
        count: result.data?.pagination?.total_items || 0,
        profiles: result.data?.profiles || []
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Active campaigns query
  const activeCampaignsQuery = useQuery({
    queryKey: ['active-campaigns-count', user?.id],
    queryFn: async () => {
      const { fetchWithAuth } = await import('@/utils/apiInterceptor')
      
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/campaigns`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`)
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
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
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