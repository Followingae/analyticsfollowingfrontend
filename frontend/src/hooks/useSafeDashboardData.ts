// hooks/useSafeDashboardData.ts
/**
 * SAFE VERSION - Simple dashboard data hook without memory leaks
 * Use this temporarily while fixing the optimized version
 */

import { useQuery } from '@tanstack/react-query'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'

export const useSafeDashboardData = () => {
  const { user } = useEnhancedAuth()

  // Simple teams query without batching or caching
  const teamsQuery = useQuery({
    queryKey: ['safe-teams', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
      const { fetchWithAuth } = await import('@/utils/apiInterceptor')
      
      const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`)
      return response.ok ? response.json() : null
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds only
    gcTime: 60 * 1000, // 1 minute only
    refetchInterval: false, // No automatic refetching
    refetchOnWindowFocus: false
  })

  // Simple profiles query
  const profilesQuery = useQuery({
    queryKey: ['safe-profiles', user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, profiles: [] }
      
      try {
        const { creatorApiService } = await import('@/services/creatorApi')
        const result = await creatorApiService.getUnlockedCreators({ page: 1, page_size: 10 })
        
        if (result.success && result.data) {
          return {
            count: result.data.pagination?.total_items || 0,
            profiles: result.data.profiles || []
          }
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error)
      }
      
      return { count: 0, profiles: [] }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false
  })

  // Simple campaigns query
  const campaignsQuery = useQuery({
    queryKey: ['safe-campaigns', user?.id],
    queryFn: async () => {
      if (!user) return { activeCount: 0, campaigns: [] }
      
      try {
        const { fetchWithAuth } = await import('@/utils/apiInterceptor')
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/campaigns`)
        
        if (response.ok) {
          const data = await response.json()
          const campaigns = data.campaigns || data.data || data || []
          const activeCount = Array.isArray(campaigns) 
            ? campaigns.filter((campaign: any) => campaign.status === 'active').length
            : 0
            
          return { activeCount, campaigns }
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error)
      }
      
      return { activeCount: 0, campaigns: [] }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false
  })

  return {
    // Teams data
    teamsOverview: teamsQuery.data,
    teamsLoading: teamsQuery.isLoading,
    teamsError: teamsQuery.error,
    
    // Profiles data
    unlockedProfilesCount: profilesQuery.data?.count || 0,
    unlockedProfiles: profilesQuery.data?.profiles || [],
    profilesLoading: profilesQuery.isLoading,
    profilesError: profilesQuery.error,
    
    // Campaigns data
    activeCampaignsCount: campaignsQuery.data?.activeCount || 0,
    campaigns: campaignsQuery.data?.campaigns || [],
    campaignsLoading: campaignsQuery.isLoading,
    campaignsError: campaignsQuery.error,
    
    // Overall state
    isLoading: teamsQuery.isLoading || profilesQuery.isLoading || campaignsQuery.isLoading,
    hasErrors: !!(teamsQuery.error || profilesQuery.error || campaignsQuery.error),
    
    // Simple refetch
    refetch: () => {
      teamsQuery.refetch()
      profilesQuery.refetch()
      campaignsQuery.refetch()
    }
  }
}