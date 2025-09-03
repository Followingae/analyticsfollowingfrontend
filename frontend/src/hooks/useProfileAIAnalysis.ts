// hooks/useProfileAIAnalysis.ts - Hook for Step 2 AI Analysis Data
import { useQuery } from '@tanstack/react-query'
import { creatorApiService } from '@/services/creatorApi'
import type { ProfileAIAnalysisResponse } from '@/services/creatorApi'

interface UseProfileAIAnalysisOptions {
  enabled?: boolean
  staleTime?: number
  retry?: number
}

/**
 * Hook for fetching comprehensive AI analysis data (Step 2)
 * Should be called after basic profile search (Step 1)
 */
export const useProfileAIAnalysis = (
  username: string,
  options: UseProfileAIAnalysisOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes - AI data changes slowly
    retry = 2
  } = options

  return useQuery({
    queryKey: ['profile-ai-analysis', username],
    queryFn: async (): Promise<ProfileAIAnalysisResponse> => {
      const result = await creatorApiService.getProfileAIAnalysis(username)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch AI analysis')
      }
      
      return result.data
    },
    enabled: Boolean(username) && enabled,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

/**
 * Hook that checks if AI analysis should be fetched based on profile status
 * Use this when you want to conditionally fetch AI data only when ready
 */
export const useProfileAIAnalysisConditional = (
  username: string,
  profileStatus?: { analysis_complete?: boolean }
) => {
  return useProfileAIAnalysis(username, {
    enabled: Boolean(username && profileStatus?.analysis_complete)
  })
}