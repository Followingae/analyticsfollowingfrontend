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
  
  // Status states (simplified - no polling needed)
  aiStatus: 'completed' | 'error' | null
  
  // Messages
  message: string
  error: string | null
  
  // Data stage
  dataStage: 'none' | 'basic' | 'detailed'
}

export interface ProgressiveLoadingActions {
  loadProfile: (username: string) => Promise<void>
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

  // ❌ REMOVED: No polling needed

  const updateState = useCallback((updates: Partial<ProgressiveLoadingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const loadProfile = useCallback(async (username: string) => {
    updateState({
      basicData: null,
      detailedData: null,
      isLoadingBasic: true,
      isLoadingDetailed: false,
      error: null,
      message: 'Loading complete profile data...',
      dataStage: 'none'
    })

    try {
      // Single API call gets everything immediately
      const response = await instagramApiService.getBasicProfile(username)
      
      if (response.success && response.data) {
        updateState({
          basicData: response.data,
          detailedData: response.data, // Same data - complete from single call
          isLoadingBasic: false,
          isLoadingDetailed: false,
          dataStage: 'detailed',
          aiStatus: 'completed',
          message: 'Complete profile with AI insights loaded!'
        })
      } else {
        updateState({
          isLoadingBasic: false,
          isLoadingDetailed: false,
          error: response.error || 'Failed to load profile data',
          message: ''
        })
      }
    } catch (error: any) {
      updateState({
        isLoadingBasic: false,
        isLoadingDetailed: false,
        error: error.message || 'Failed to load profile',
        message: ''
      })
    }
  }, [updateState])

  // ❌ REMOVED: pollForDetailedData - no polling needed with single API call
  // ❌ REMOVED: stopPolling - no polling needed

  const reset = useCallback(() => {
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
  }, [])

  return [
    state,
    {
      loadProfile,
      reset
    }
  ]
}