// hooks/useCreatorSearch.ts - React Query based creator search
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { pollJobToCompletion } from '@/hooks/useJobPolling'
import type { ProfileSearchResponse } from '@/types/api'

interface UseCreatorSearchOptions {
  onSuccess?: (data: ProfileSearchResponse) => void
  onError?: (error: Error) => void
}

/**
 * Emit real backend progress so ProcessingCreatorCard / ProcessingToastContext
 * can render actual progress instead of fake clock-based animation.
 *
 * Listeners read `event.detail.{username, status}` where status has
 * progress_percent (0-100), progress_message, current_stage, etc.
 */
function emitCreatorSearchProgress(username: string, status: any): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('creator-search-progress', {
      detail: { username, status },
    }),
  )
}

export const useCreatorSearch = (options?: UseCreatorSearchOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string): Promise<ProfileSearchResponse> => {
      const response = await api.get(`/search/creator/${username}`)

      if (!response.ok && response.status !== 202) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      // Handle 202 async job - poll for completion + stream progress
      if (response.status === 202) {
        const jobData = await response.json()
        if (jobData.job_id) {
          // Increased to 60 attempts × 4s = 240s (4 min) — accommodates
          // worker queue lag without prematurely surfacing an error.
          // F6: timeout no longer immediately reports failure — useJobPolling
          // emits a job-failed event but the UI stays in "still processing"
          // until the toast/card receives a definitive completed/failed event.
          const finalResult = await pollJobToCompletion(jobData.job_id, {
            pollInterval: 4000,
            maxAttempts: 60,
            onProgress: (statusData) => {
              emitCreatorSearchProgress(username, statusData)
            },
          })
          return finalResult as ProfileSearchResponse
        }
      }

      return response.json()
    },
    onMutate: async (username) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['profile', username] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['profile', username])

      // Optimistically update with loading state
      queryClient.setQueryData(['profile', username], (old: any) => ({
        ...old,
        isLoading: true,
        lastSearched: new Date().toISOString()
      }))

      return { previousData, username }
    },
    onSuccess: (data, username) => {
      // Update with real data
      queryClient.setQueryData(
        ['profile', username],
        {
          ...data.profile,
          isLoading: false,
          lastSearched: new Date().toISOString(),
          isCached: false
        }
      )

      // Prefetch related AI analysis
      if (data.profile && data.success) {
        queryClient.prefetchQuery({
          queryKey: ['profile-ai-analysis', username],
          queryFn: async () => {
            const response = await api.get(`/instagram/profile/${username}/ai-status`)
            return response.ok ? response.json() : null
          },
          staleTime: 5 * 60 * 1000,
        })

        // Invalidate and refetch CDN media
        queryClient.invalidateQueries({
          queryKey: ['cdn-media', data.profile.username]
        })
      }

      options?.onSuccess?.(data)
    },
    onError: (error, username, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['profile', username], context.previousData)
      }
      options?.onError?.(error as Error)
    },
    // Optimistic updates with faster perceived performance
    meta: {
      optimisticUpdate: true
    }
  })
}