// hooks/useCreatorSearch.ts - React Query based creator search
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProfileSearchResponse } from '@/types/api'

interface UseCreatorSearchOptions {
  onSuccess?: (data: ProfileSearchResponse) => void
  onError?: (error: Error) => void
}

export const useCreatorSearch = (options?: UseCreatorSearchOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string): Promise<ProfileSearchResponse> => {
      const response = await api.post(`/simple/creator/search/${username}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      return response.json()
    },
    onSuccess: (data, username) => {
      // Cache the profile data for GET requests
      queryClient.setQueryData(
        ['profile', username], 
        data.profile
      )
      
      // Cache CDN media separately if profile has ID
      if (data.profile && data.success) {
        queryClient.invalidateQueries({ 
          queryKey: ['cdn-media', data.profile.username] 
        })
      }
      
      options?.onSuccess?.(data)
    },
    onError: options?.onError
  })
}