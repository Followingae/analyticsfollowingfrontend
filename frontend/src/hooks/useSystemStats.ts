// hooks/useSystemStats.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SystemStatsResponse } from '@/types/api'

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStatsResponse> => {
      const response = await api.get('/simple/creator/system/stats')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch system stats: ${response.statusText}`)
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // FIXED: 5 minutes (was 30 seconds)
    gcTime: 15 * 60 * 1000, // FIXED: 15 minutes (was 1 minute)
    refetchInterval: false, // FIXED: Disable auto-refresh to prevent excessive calls
    refetchOnWindowFocus: false, // FIXED: Prevent refetch on window focus
    retry: 1, // FIXED: Only retry once on failure
  })
}