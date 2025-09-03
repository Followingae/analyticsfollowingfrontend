// hooks/useProfileWithAI.ts - Combined hook for two-step profile loading
import { useCreatorSearch } from './useCreatorSearch'
import { useProfileAIAnalysis } from './useProfileAIAnalysis'
import { useQuery } from '@tanstack/react-query'
import { creatorApiService } from '@/services/creatorApi'

interface UseProfileWithAIOptions {
  autoSearch?: boolean
  enableAIAnalysis?: boolean
}

/**
 * Combined hook that handles the complete two-step profile workflow:
 * Step 1: Basic profile data (immediate)
 * Step 2: AI analysis data (when available)
 */
export const useProfileWithAI = (
  username: string,
  options: UseProfileWithAIOptions = {}
) => {
  const { autoSearch = false, enableAIAnalysis = true } = options

  // Step 1: Basic profile search (mutation for new profiles)
  const profileSearch = useCreatorSearch()

  // Step 1: Get existing profile data (for already searched profiles)
  const existingProfile = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const result = await creatorApiService.getCreator(username)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Profile not found')
      }
      return result.data
    },
    enabled: Boolean(username) && !autoSearch,
    retry: 1
  })

  // Step 2: AI Analysis data
  const aiAnalysis = useProfileAIAnalysis(username, {
    enabled: enableAIAnalysis && Boolean(username)
  })

  // Auto-search if requested and no existing data
  if (autoSearch && username && !existingProfile.data && !profileSearch.isPending) {
    profileSearch.mutate(username)
  }

  // Determine current profile data source
  const profileData = profileSearch.data?.profile || existingProfile.data?.profile
  const isProfileLoading = profileSearch.isPending || existingProfile.isLoading
  const profileError = profileSearch.error || existingProfile.error

  return {
    // Step 1: Basic profile data
    profile: {
      data: profileData,
      isLoading: isProfileLoading,
      error: profileError,
      search: profileSearch.mutate,
      isSearching: profileSearch.isPending
    },

    // Step 2: AI analysis data
    aiAnalysis: {
      data: aiAnalysis.data,
      isLoading: aiAnalysis.isLoading,
      error: aiAnalysis.error,
      refetch: aiAnalysis.refetch
    },

    // Combined status
    isFullyLoaded: Boolean(profileData && aiAnalysis.data),
    hasAnyData: Boolean(profileData || aiAnalysis.data),
    isLoading: isProfileLoading || aiAnalysis.isLoading
  }
}