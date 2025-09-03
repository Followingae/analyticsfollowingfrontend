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
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000 // Auto-refresh every minute
  })
}