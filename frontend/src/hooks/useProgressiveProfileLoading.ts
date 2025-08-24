import { useState, useCallback } from 'react'
import { instagramApiService } from '@/services/instagramApi'
import type { ProfileResponse } from '@/services/instagramApi'

export interface ProgressiveLoadingState {
  // Data states
  basicData: ProfileResponse | null
  detailedData: ProfileResponse | null
  
  // Loading states
  isLoadingBasic: boolean
  isLoadingDetailed: boolean
  
  // Status states
  aiStatus: 'pending' | 'processing' | 'completed' | 'error' | null
  aiProgress?: {
    completed: number
    total: number
    percentage: number
  }
  
  // Messages
  message: string
  error: string | null
  
  // Data stage
  dataStage: 'none' | 'basic' | 'detailed'
}

export interface ProgressiveLoadingActions {
  loadProfile: (username: string) => Promise<void>
  pollForDetailedData: (username: string) => Promise<void>
  stopPolling: () => void
  reset: () => void
}

export function useProgressiveProfileLoading(): [ProgressiveLoadingState, ProgressiveLoadingActions] {
  const [state, setState] = useState<ProgressiveLoadingState>({
    basicData: null,
    detailedData: null,
    isLoadingBasic: false,
    isLoadingDetailed: false,
    aiStatus: null,
    message: '',
    error: null,
    dataStage: 'none'
  })

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const updateState = useCallback((updates: Partial<ProgressiveLoadingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const loadProfile = useCallback(async (username: string) => {
    updateState({
      isLoadingBasic: true,
      error: null,
      message: 'Loading profile...',
      dataStage: 'none'
    })

    try {
      // Step 1: Get basic data
      const basicResponse = await instagramApiService.getBasicProfile(username)
      
      if (basicResponse.success && basicResponse.data) {
        updateState({
          basicData: basicResponse.data,
          isLoadingBasic: false,
          dataStage: 'basic',
          message: 'Basic profile data loaded. AI analysis in progress...',
          aiStatus: 'processing'
        })

        // Automatically start polling for detailed data
        pollForDetailedData(username)
      } else {
        updateState({
          isLoadingBasic: false,
          error: basicResponse.error || 'Failed to load basic profile data',
          message: ''
        })
      }
    } catch (error: any) {
      updateState({
        isLoadingBasic: false,
        error: error.message || 'Failed to load profile',
        message: ''
      })
    }
  }, [updateState])

  const pollForDetailedData = useCallback(async (username: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    updateState({
      isLoadingDetailed: true,
      aiStatus: 'processing'
    })

    const poll = async () => {
      try {
        // Check AI processing status
        const statusResponse = await instagramApiService.getProfileStatus(username)
        
        if (statusResponse.success && statusResponse.data) {
          const { analysis_status, progress } = statusResponse.data
          
          updateState({
            aiStatus: analysis_status,
            aiProgress: progress,
            message: analysis_status === 'completed' 
              ? 'Analysis complete! Loading detailed insights...'
              : 'AI analysis in progress...'
          })

          if (analysis_status === 'completed') {
            // Get detailed data
            const detailedResponse = await instagramApiService.getDetailedProfile(username)
            
            if (detailedResponse.success && detailedResponse.data) {
              updateState({
                detailedData: detailedResponse.data,
                isLoadingDetailed: false,
                dataStage: 'detailed',
                aiStatus: 'completed',
                message: 'Complete profile analysis with AI insights available!'
              })
              
              // Stop polling
              if (pollingInterval) {
                clearInterval(pollingInterval)
                setPollingInterval(null)
              }
            } else {
              updateState({
                error: detailedResponse.error || 'Failed to load detailed data',
                isLoadingDetailed: false,
                aiStatus: 'error'
              })
            }
          }
        } else {
          updateState({
            aiStatus: 'error',
            error: statusResponse.error || 'Failed to check AI status'
          })
        }
      } catch (error: any) {
        console.error('Polling error:', error)
        // Continue polling on errors - might be temporary
      }
    }

    // Initial status check
    await poll()

    // Set up polling interval (every 5 seconds)
    const intervalId = setInterval(poll, 5000)
    setPollingInterval(intervalId)

    // Auto-stop after 5 minutes
    setTimeout(() => {
      if (intervalId) {
        clearInterval(intervalId)
        setPollingInterval(null)
        updateState({
          isLoadingDetailed: false,
          aiStatus: 'error',
          error: 'AI analysis timeout - please try refreshing the page'
        })
      }
    }, 5 * 60 * 1000) // 5 minutes
  }, [pollingInterval, updateState])

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    updateState({
      isLoadingDetailed: false
    })
  }, [pollingInterval, updateState])

  const reset = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setState({
      basicData: null,
      detailedData: null,
      isLoadingBasic: false,
      isLoadingDetailed: false,
      aiStatus: null,
      message: '',
      error: null,
      dataStage: 'none'
    })
  }, [pollingInterval])

  return [
    state,
    {
      loadProfile,
      pollForDetailedData,
      stopPolling,
      reset
    }
  ]
}