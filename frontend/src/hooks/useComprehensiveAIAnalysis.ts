/**
 * Hook for fetching comprehensive AI analysis data
 * Integrates with the new 10-model AI analysis system
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { creatorApiService } from '@/services/creatorApi'
import type { ComprehensiveAIAnalysisResponse } from '@/types/creator'

interface UseComprehensiveAIAnalysisOptions {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

export const useComprehensiveAIAnalysis = (
  username: string,
  options: UseComprehensiveAIAnalysisOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false
  } = options

  const [error, setError] = useState<string | null>(null)

  const fetchComprehensiveAnalysis = useCallback(async (): Promise<ComprehensiveAIAnalysisResponse> => {
    setError(null)
    
    try {
      const result = await creatorApiService.getComprehensiveAIAnalysis(username)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch comprehensive AI analysis')
      }
      
      if (!result.data) {
        throw new Error('No analysis data received')
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    }
  }, [username])

  const query = useQuery({
    queryKey: ['comprehensive-ai-analysis', username],
    queryFn: fetchComprehensiveAnalysis,
    enabled: enabled && !!username,
    staleTime,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found) or 403 (no access)
      if (error instanceof Error && 
          (error.message.includes('404') || error.message.includes('403'))) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  return {
    // Data
    data: query.data,
    analysis: query.data,
    
    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    
    // Error states
    isError: query.isError || !!error,
    error: error || (query.error instanceof Error ? query.error.message : 'Unknown error'),
    
    // Success state
    isSuccess: query.isSuccess && !error,
    
    // Data status
    hasData: !!query.data,
    hasAnalysis: !!query.data?.advanced_ai_analysis,
    hasInsights: !!query.data?.comprehensive_insights,
    
    // Actions
    refetch: query.refetch,
    invalidate: () => {
      // This would need to be implemented with query client
    },
    
    // Metadata
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,
    failureCount: query.failureCount,
    
    // Analysis quality indicators
    analysisQuality: query.data?.analysis_metadata ? {
      modelsSuccessRate: query.data.analysis_metadata.models_success_rate,
      completionRate: query.data.analysis_metadata.ai_completion_rate,
      version: query.data.analysis_metadata.comprehensive_analysis_version
    } : null
  }
}

export default useComprehensiveAIAnalysis