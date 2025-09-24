// hooks/useProfile.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProfileGetResponse } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useProfile = (username: string) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Prefetch related data when profile loads
  useEffect(() => {
    if (username) {
      // Prefetch AI analysis for this profile
      queryClient.prefetchQuery({
        queryKey: ['profile-ai-analysis', username],
        queryFn: async () => {
          const response = await api.get(`/instagram/profile/${username}/ai-status`)
          return response.ok ? response.json() : null
        },
        staleTime: 5 * 60 * 1000,
      })

      // Prefetch posts for this profile
      queryClient.prefetchQuery({
        queryKey: ['profile-posts', username, 1], // First page
        queryFn: async () => {
          const response = await api.get(`/instagram/profile/${username}/posts?limit=20&offset=0`)
          return response.ok ? response.json() : { posts: [] }
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [username, queryClient])

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
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: 'stale', // Only refetch if stale
    refetchOnReconnect: 'stale', // Only refetch if stale on reconnect
  })
}