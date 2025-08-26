import { useState, useCallback, useEffect } from 'react'
import { creatorApiService } from '@/services/creatorApi'
import type { CompleteCreatorProfile, Phase1Data, Phase2Data } from '@/types/creatorTypes'

export interface UseCreatorProfileDataState {
  profile: CompleteCreatorProfile | null
  isLoading: boolean
  error: string | null
  isPolling: boolean
}

export interface UseCreatorProfileDataActions {
  loadProfile: (username: string) => Promise<void>
  refreshProfile: () => Promise<void>
  stopPolling: () => void
  reset: () => void
}

export function useCreatorProfileData(): [UseCreatorProfileDataState, UseCreatorProfileDataActions] {
  const [state, setState] = useState<UseCreatorProfileDataState>({
    profile: null,
    isLoading: false,
    error: null,
    isPolling: false
  })

  const [currentUsername, setCurrentUsername] = useState<string>('')
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const updateState = useCallback((updates: Partial<UseCreatorProfileDataState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Load Phase 1 data (immediate display)
  const loadPhase1Data = useCallback(async (username: string) => {
    console.log('🚀 useCreatorProfileData: Loading Phase 1 for:', username)
    
    try {
      const response = await creatorApiService.searchCreator(username, {
        force_refresh: false,
        include_posts: true,
        analysis_depth: 'standard'
      })

      if (response.success && response.data) {
        // Transform API response to Phase1Data structure
        const phase1Data: Phase1Data = {
          profile_header: {
            username: response.data.profile.username,
            full_name: response.data.profile.full_name || username,
            profile_pic_url: response.data.profile.profile_pic_url_hd || response.data.profile.profile_pic_url || '',
            is_verified: response.data.profile.is_verified || false,
            followers_count: response.data.profile.followers_count || 0,
            following_count: response.data.profile.following_count || 0,
            posts_count: response.data.profile.posts_count || 0,
            engagement_rate: response.data.profile.engagement_rate || 0,
            category_name: response.data.profile.category || 'General'
          },
          quick_metrics: {
            avg_likes_per_post: response.data.profile.avg_likes_per_post || 0,
            avg_comments_per_post: response.data.profile.avg_comments_per_post || 0,
            posting_frequency: response.data.profile.posting_frequency || 'Unknown',
            last_post_date: response.data.profile.last_post_date || new Date().toISOString(),
            account_type: response.data.profile.is_business_account ? 'Business' : 
                         response.data.profile.is_professional_account ? 'Creator' : 'Personal'
          },
          contact_info: {
            business_email: response.data.profile.business_email || null,
            business_phone: response.data.profile.business_phone_number || null,
            external_url: response.data.profile.external_url || null,
            location: response.data.profile.location || null
          },
          recent_posts: response.data.recent_posts?.slice(0, 10).map(post => ({
            post_id: post.id,
            thumbnail_url: post.media_url,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            posted_at: post.posted_at,
            caption_preview: post.caption?.substring(0, 100) + '...' || ''
          })) || []
        }

        const completeProfile: CompleteCreatorProfile = {
          phase1: phase1Data,
          analysis_status: response.data.stage === 'complete' ? 'completed' : 'processing',
          loading_progress: response.data.progress
        }

        updateState({
          profile: completeProfile,
          isLoading: false,
          error: null
        })

        console.log('✅ useCreatorProfileData: Phase 1 loaded, analysis status:', response.data.stage)

        // If not complete, start polling for Phase 2
        if (response.data.stage !== 'complete') {
          startPollingForPhase2(username)
        } else {
          // Load Phase 2 immediately if ready
          await loadPhase2Data(username, completeProfile)
        }
      } else {
        throw new Error(response.error || 'Failed to load profile data')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      console.error('❌ useCreatorProfileData: Phase 1 error:', error)
      updateState({
        isLoading: false,
        error: errorMessage
      })
    }
  }, [updateState])

  // Start polling for Phase 2 completion
  const startPollingForPhase2 = useCallback((username: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    updateState({ isPolling: true })

    const poll = async () => {
      try {
        const statusResponse = await creatorApiService.getAnalysisStatus(username)
        
        if (statusResponse.success && statusResponse.data) {
          const analysisStatus = statusResponse.data.status
          
          updateState(prevState => ({
            profile: prevState.profile ? {
              ...prevState.profile,
              analysis_status: analysisStatus,
              loading_progress: statusResponse.data.progress
            } : prevState.profile
          }))

          if (analysisStatus === 'completed') {
            console.log('🎉 useCreatorProfileData: Analysis complete!')
            stopPolling()
            await loadPhase2Data(username, state.profile!)
          } else if (analysisStatus === 'error') {
            console.error('❌ useCreatorProfileData: Analysis failed')
            stopPolling()
          }
        }
      } catch (error) {
        console.error('❌ useCreatorProfileData: Polling error:', error)
        // Continue polling on network errors
      }
    }

    const intervalId = setInterval(poll, 5000)
    setPollingInterval(intervalId)

    // Auto-stop after 10 minutes
    setTimeout(() => {
      if (intervalId) {
        clearInterval(intervalId)
        setPollingInterval(null)
        updateState({ isPolling: false })
        console.log('⏰ useCreatorProfileData: Polling timeout')
      }
    }, 10 * 60 * 1000)
  }, [pollingInterval, updateState, state.profile])

  // Load Phase 2 data (detailed analytics)
  const loadPhase2Data = useCallback(async (username: string, currentProfile: CompleteCreatorProfile) => {
    try {
      console.log('🧠 useCreatorProfileData: Loading Phase 2 data...')
      
      // Get detailed analytics
      const [detailedResponse, postsResponse] = await Promise.all([
        creatorApiService.getDetailedAnalysis(username),
        creatorApiService.getCreatorPosts(username, {
          limit: 50,
          offset: 0,
          include_ai: true
        })
      ])

      if (detailedResponse.success && detailedResponse.data) {
        const allPosts = postsResponse.success && postsResponse.data ? 
          postsResponse.data.posts.map(post => ({
            post_id: post.id,
            media_url: post.media_url,
            caption: post.caption || '',
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            posted_at: post.posted_at,
            ai_content_category: post.ai_content_category || 'General',
            ai_sentiment: post.ai_sentiment as any || 'neutral',
            ai_sentiment_score: post.ai_sentiment_score || 0.5,
            ai_language: post.ai_language || 'English',
            engagement_performance: post.engagement_performance as any || 'average'
          })) : []

        const phase2Data: Phase2Data = {
          content_analysis: detailedResponse.data.content_analysis || {
            primary_content_type: 'General',
            content_distribution: {},
            content_consistency_score: 0,
            brand_safety_score: 0
          },
          sentiment_analysis: detailedResponse.data.sentiment_analysis || {
            overall_sentiment: 'Neutral',
            sentiment_score: 0.5,
            sentiment_breakdown: { positive: 33, neutral: 34, negative: 33 },
            brand_friendliness: 50
          },
          audience_insights: detailedResponse.data.audience_insights || {
            estimated_demographics: {
              age_groups: { '25-34': 40, '18-24': 30, '35-44': 20, '45+': 10 },
              gender_split: { female: 50, male: 50 },
              top_locations: ['Global']
            }
          },
          language_analysis: detailedResponse.data.language_analysis || {
            primary_language: 'English',
            language_distribution: { 'English': 100 },
            target_markets: ['Global'],
            multilingual_score: 20
          },
          partnership_potential: detailedResponse.data.partnership_potential || {
            overall_score: 5.0,
            scoring_breakdown: {
              engagement_quality: 5.0,
              audience_alignment: 5.0,
              content_consistency: 5.0,
              brand_safety: 5.0,
              posting_regularity: 5.0
            },
            recommended_budget: '$1000-2000',
            best_collaboration_types: ['general']
          },
          all_posts: allPosts,
          advanced_metrics: detailedResponse.data.advanced_metrics || {
            engagement_trends: {
              trend_direction: 'stable',
              monthly_growth: 0,
              peak_hours: [9, 12, 18, 21],
              optimal_posting_days: ['Monday', 'Wednesday', 'Friday']
            },
            content_performance: {
              best_performing_type: 'General Content',
              worst_performing_type: 'Text Posts',
              viral_potential_score: 5.0
            },
            competitive_analysis: {
              market_position: 'Growing',
              similar_creators: [],
              competitive_advantage: 'Consistent engagement'
            }
          }
        }

        updateState({
          profile: {
            ...currentProfile,
            phase2: phase2Data,
            analysis_status: 'completed'
          }
        })

        console.log('✅ useCreatorProfileData: Phase 2 data loaded successfully')
      }
    } catch (error) {
      console.error('❌ useCreatorProfileData: Phase 2 error:', error)
    }
  }, [updateState])

  // Main load profile function
  const loadProfile = useCallback(async (username: string) => {
    setCurrentUsername(username)
    updateState({ isLoading: true, error: null, profile: null })
    await loadPhase1Data(username)
  }, [loadPhase1Data, updateState])

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (currentUsername) {
      stopPolling()
      updateState({ isLoading: true, error: null })
      await loadPhase1Data(currentUsername)
    }
  }, [currentUsername, loadPhase1Data, updateState])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    updateState({ isPolling: false })
  }, [pollingInterval, updateState])

  // Reset state
  const reset = useCallback(() => {
    stopPolling()
    setCurrentUsername('')
    setState({
      profile: null,
      isLoading: false,
      error: null,
      isPolling: false
    })
  }, [stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  return [
    state,
    {
      loadProfile,
      refreshProfile,
      stopPolling,
      reset
    }
  ]
}