// hooks/useCDNMedia.ts - Exact implementation from Backend Guide
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CDNMediaResponse } from '@/types/api'

export const useCDNMedia = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['cdn-media', profileId],
    queryFn: async (): Promise<CDNMediaResponse> => {
      if (!profileId) throw new Error('Profile ID required')
      
      const response = await api.get(`/creators/ig/${profileId}/media`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CDN media: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: Boolean(profileId),
    staleTime: 2 * 60 * 1000, // 2 minutes for images
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}