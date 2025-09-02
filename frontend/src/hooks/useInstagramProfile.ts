import { useState, useCallback } from 'react'
import { instagramCdnApi, InstagramProfileCDN } from '@/services/instagramCdnApi'

export interface UseInstagramProfileState {
  profile: InstagramProfileCDN | null
  isLoading: boolean
  error: string | null
}

export interface UseInstagramProfileActions {
  loadProfile: (username: string) => Promise<void>
  reset: () => void
}

/**
 * Hook for loading Instagram profiles with CDN URLs
 */
export function useInstagramProfile(): [UseInstagramProfileState, UseInstagramProfileActions] {
  const [state, setState] = useState<UseInstagramProfileState>({
    profile: null,
    isLoading: false,
    error: null
  })

  const updateState = useCallback((updates: Partial<UseInstagramProfileState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const loadProfile = useCallback(async (username: string) => {

    
    updateState({ isLoading: true, error: null })
    
    try {
      const response = await instagramCdnApi.getProfile(username)
      
      if (response.success && response.data) {

        updateState({ 
          profile: response.data, 
          isLoading: false,
          error: null 
        })
      } else {

        updateState({ 
          profile: null, 
          isLoading: false,
          error: response.error || 'Failed to load profile' 
        })
      }
    } catch (error) {

      updateState({ 
        profile: null, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })
    }
  }, [updateState])

  const reset = useCallback(() => {
    setState({
      profile: null,
      isLoading: false,
      error: null
    })
  }, [])

  return [state, { loadProfile, reset }]
}

export default useInstagramProfile