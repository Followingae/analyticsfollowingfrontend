// hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProfileGetResponse } from '@/types/api'

export const useProfile = (username: string) => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async (): Promise<ProfileGetResponse> => {
      const response = await api.get(`/simple/creator/${username}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: Boolean(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
  })
}