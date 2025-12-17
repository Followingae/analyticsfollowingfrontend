// hooks/useOptimizedQueries.ts
import { useQuery } from '@tanstack/react-query'
import { useUserV2 } from '@/components/providers/UserStoreProvider'
import { dedicatedApiCall } from '@/utils/apiDeduplication'

// Centralized query keys to prevent typos and ensure consistency
export const QUERY_KEYS = {
  DASHBOARD: ['dashboard-data'],
  CAMPAIGNS_OVERVIEW: ['campaigns-overview'],
  CAMPAIGNS_LIST: (status?: string, limit?: number) => ['campaigns-list', { status, limit }],
  TEAMS_OVERVIEW: ['teams-overview'],
  UNLOCKED_PROFILES: (page: number, pageSize: number) => ['unlocked-profiles', { page, pageSize }],
} as const

// Optimized dashboard queries with proper deduplication
export const useOptimizedDashboard = () => {
  const { isAuthenticated, user } = useUserV2()

  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: dedicatedApiCall.dashboard,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Optimized campaigns queries
export const useOptimizedCampaigns = (status?: string, limit = 100) => {
  const { isAuthenticated, user } = useUserV2()

  return useQuery({
    queryKey: QUERY_KEYS.CAMPAIGNS_LIST(status, limit),
    queryFn: () => dedicatedApiCall.campaignsList({ status, limit }),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
  })
}

// Optimized campaigns overview
export const useOptimizedCampaignsOverview = () => {
  const { isAuthenticated, user } = useUserV2()

  return useQuery({
    queryKey: QUERY_KEYS.CAMPAIGNS_OVERVIEW,
    queryFn: dedicatedApiCall.campaignsOverview,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Optimized teams overview
export const useOptimizedTeams = () => {
  const { isAuthenticated, user } = useUserV2()

  return useQuery({
    queryKey: QUERY_KEYS.TEAMS_OVERVIEW,
    queryFn: dedicatedApiCall.teamsOverview,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Optimized unlocked profiles
export const useOptimizedUnlockedProfiles = (page = 1, pageSize = 20) => {
  const { isAuthenticated, user } = useUserV2()

  return useQuery({
    queryKey: QUERY_KEYS.UNLOCKED_PROFILES(page, pageSize),
    queryFn: () => dedicatedApiCall.unlockedProfiles(page, pageSize),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Combined hook for dashboard data (replacement for useDashboardData)
export const useOptimizedDashboardData = () => {
  const dashboardQuery = useOptimizedDashboard()
  const teamsQuery = useOptimizedTeams()
  const unlockedProfilesQuery = useOptimizedUnlockedProfiles()
  const activeCampaignsQuery = useOptimizedCampaigns('active')

  return {
    // Dashboard data
    dashboardData: dashboardQuery.data,
    dashboardLoading: dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error,

    // Teams data (if needed for fallback)
    teamsOverview: teamsQuery.data,
    teamsLoading: teamsQuery.isLoading,
    teamsError: teamsQuery.error,

    // Unlocked profiles data
    unlockedProfilesCount: unlockedProfilesQuery.data?.count || 0,
    unlockedProfiles: unlockedProfilesQuery.data?.profiles || [],
    profilesLoading: unlockedProfilesQuery.isLoading,
    profilesError: unlockedProfilesQuery.error,

    // Active campaigns data
    activeCampaignsData: activeCampaignsQuery.data,
    activeCampaignsCount: activeCampaignsQuery.data?.campaigns?.length || 0,
    campaigns: activeCampaignsQuery.data?.campaigns || [],
    campaignsLoading: activeCampaignsQuery.isLoading,
    campaignsError: activeCampaignsQuery.error,

    // Overall loading state
    isLoading:
      dashboardQuery.isLoading ||
      teamsQuery.isLoading ||
      unlockedProfilesQuery.isLoading ||
      activeCampaignsQuery.isLoading,

    // Refetch methods
    refetchAll: () => {
      dashboardQuery.refetch()
      teamsQuery.refetch()
      unlockedProfilesQuery.refetch()
      activeCampaignsQuery.refetch()
    }
  }
}