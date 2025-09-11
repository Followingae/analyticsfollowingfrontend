'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CreatorProfile } from '@/components/analytics/CreatorAnalyticsDashboard'
import { creatorApiService } from '@/services/creatorApi'

export interface CreatorAnalyticsState {
  profile: CreatorProfile | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface UseCreatorAnalyticsOptions {
  username: string
  autoFetch?: boolean
}

export function useCreatorAnalytics({
  username,
  autoFetch = true
}: UseCreatorAnalyticsOptions): CreatorAnalyticsState {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!username) return

    try {
      setLoading(true)
      setError(null)

      // Use the existing creator API service
      const result = await creatorApiService.searchCreator(username, {
        force_refresh: false,
        analysis_depth: 'detailed'
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile')
      }

      if (!result.data) {
        throw new Error('No profile data received')
      }

      // Transform the API response to match our CreatorProfile interface
      const apiProfile = result.data.profile
      const transformedProfile: CreatorProfile = {
        username: apiProfile.username,
        full_name: apiProfile.full_name || '',
        biography: apiProfile.biography || '',
        is_private: apiProfile.is_private || false,
        is_verified: apiProfile.is_verified || false,
        external_url: apiProfile.external_url,
        profile_pic_url: apiProfile.profile_pic_url || '',
        profile_pic_url_hd: apiProfile.profile_pic_url_hd,
        cdn_url_512: apiProfile.cdn_url_512,
        
        // Basic Metrics
        followers_count: apiProfile.followers_count || 0,
        following_count: apiProfile.following_count || 0,
        posts_count: apiProfile.posts_count || 0,
        
        // AI Analysis (new structure)
        ai_analysis: {
          available: apiProfile.ai_analysis?.available || false,
          primary_content_type: apiProfile.ai_analysis?.primary_content_type,
          content_distribution: apiProfile.ai_analysis?.content_distribution,
          avg_sentiment_score: apiProfile.ai_analysis?.avg_sentiment_score,
          language_distribution: apiProfile.ai_analysis?.language_distribution,
          content_quality_score: apiProfile.ai_analysis?.content_quality_score,
          profile_analyzed_at: apiProfile.ai_analysis?.profile_analyzed_at
        },
        
        // Unlock Status (assume unlocked if we got data)
        is_unlocked: true,
        unlock_cost: 25,
        can_unlock: true,
        
        // Engagement metrics (basic calculation)
        engagement_metrics: apiProfile.engagement_rate ? {
          avg_likes: Math.round((apiProfile.followers_count * apiProfile.engagement_rate) / 100),
          avg_comments: Math.round((apiProfile.followers_count * apiProfile.engagement_rate) / 500),
          engagement_rate: apiProfile.engagement_rate / 100,
          engagement_trend: 'stable' as const,
          best_performing_time: '18:00-20:00 UTC',
          posting_frequency: 'daily'
        } : undefined
      }
      
      setProfile(transformedProfile)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(errorMessage)
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [username])

  const refetch = useCallback(() => {
    fetchProfile()
  }, [fetchProfile])

  // Initial fetch when component mounts or username changes
  useEffect(() => {
    if (autoFetch && username) {
      fetchProfile()
    }
  }, [username, autoFetch, fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch
  }
}

// Helper hook for profile unlock functionality
export function useProfileUnlock() {
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const unlockProfile = useCallback(async (username: string) => {
    try {
      setUnlocking(true)
      setUnlockError(null)

      // In the current system, searching a creator might automatically unlock them
      // This is a placeholder - the actual unlock logic may be handled by the search API
      const result = await creatorApiService.searchCreator(username, {
        force_refresh: true,
        analysis_depth: 'detailed'
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to unlock profile')
      }

      // Return mock unlock response
      const mockResult = {
        success: true,
        credits_spent: 25,
        credits_remaining: 475, // This would come from user balance
        profile_unlocked: true,
        message: 'Profile unlocked successfully',
        permanent_access: true
      }

      return mockResult

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unlock failed'
      setUnlockError(errorMessage)
      throw err
    } finally {
      setUnlocking(false)
    }
  }, [])

  return {
    unlockProfile,
    unlocking,
    unlockError
  }
}

// Helper hook for posts data
export function useCreatorPosts(username: string, enabled: boolean = false) {
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchPosts = useCallback(async (page: number = 1, limit: number = 12) => {
    if (!username || !enabled) return

    try {
      setPostsLoading(true)
      setPostsError(null)

      const offset = (page - 1) * limit
      const result = await creatorApiService.getCreatorPosts(username, {
        limit,
        offset,
        include_ai: true
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch posts')
      }

      if (!result.data) {
        throw new Error('No posts data received')
      }

      setPosts(result.data.posts || [])
      setPagination(result.data.pagination || null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts'
      setPostsError(errorMessage)
      console.error('Posts fetch error:', err)
    } finally {
      setPostsLoading(false)
    }
  }, [username, enabled])

  useEffect(() => {
    if (enabled && username) {
      fetchPosts()
    }
  }, [enabled, username, fetchPosts])

  return {
    posts,
    postsLoading,
    postsError,
    pagination,
    refetchPosts: fetchPosts
  }
}