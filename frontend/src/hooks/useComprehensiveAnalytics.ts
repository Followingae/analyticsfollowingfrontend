'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnalyticsDashboardData } from '@/types/comprehensiveAnalytics'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'

export interface UseComprehensiveAnalyticsOptions {
  username: string
  autoFetch?: boolean
  refreshInterval?: number // milliseconds, 0 = no auto refresh
}

export interface UseComprehensiveAnalyticsReturn {
  data: AnalyticsDashboardData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshAnalysis: () => Promise<void>
  lastUpdated: Date | null
}

export function useComprehensiveAnalytics({
  username,
  autoFetch = true,
  refreshInterval = 0
}: UseComprehensiveAnalyticsOptions): UseComprehensiveAnalyticsReturn {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    if (!username) return

    try {
      setLoading(true)
      setError(null)

      const analyticsData = await comprehensiveAnalyticsApi.getCompleteDashboardData(username)
      setData(analyticsData)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(errorMessage)
      console.error('Comprehensive analytics error:', err)
    } finally {
      setLoading(false)
    }
  }, [username])

  const refreshAnalysis = useCallback(async () => {
    if (!username) return

    try {
      setLoading(true)
      setError(null)

      // Trigger AI analysis refresh
      await comprehensiveAnalyticsApi.refreshAnalysis(username)
      
      // Wait a bit for analysis to start, then refresh data
      setTimeout(() => {
        refresh()
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh analysis'
      setError(errorMessage)
      console.error('Analysis refresh error:', err)
      setLoading(false)
    }
  }, [username, refresh])

  // Initial fetch
  useEffect(() => {
    if (autoFetch && username) {
      refresh()
    }
  }, [username, autoFetch, refresh])

  // Auto refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && username) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, username, refresh])

  return {
    data,
    loading,
    error,
    refresh,
    refreshAnalysis,
    lastUpdated
  }
}

// Hook for individual API endpoints
export function useEnhancedProfile(username: string) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!username) return

    try {
      setLoading(true)
      setError(null)
      const response = await comprehensiveAnalyticsApi.getEnhancedProfile(username)
      setProfile(response.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, refetch: fetchProfile }
}

export function usePostAnalytics(username: string, options?: { limit?: number; offset?: number }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = useCallback(async (reset = false) => {
    if (!username) return

    try {
      setLoading(true)
      setError(null)

      const response = await comprehensiveAnalyticsApi.getPostAnalytics(username, {
        limit: options?.limit || 20,
        offset: reset ? 0 : (options?.offset || posts.length),
        include_ai: true
      })

      if (reset) {
        setPosts(response.posts)
      } else {
        setPosts(prev => [...prev, ...response.posts])
      }

      setHasMore(response.pagination.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [username, options, posts.length])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(false)
    }
  }, [fetchPosts, loading, hasMore])

  const refresh = useCallback(() => {
    fetchPosts(true)
  }, [fetchPosts])

  useEffect(() => {
    fetchPosts(true)
  }, [username])

  return { 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  }
}

export function useSystemHealth() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await comprehensiveAnalyticsApi.getSystemHealth()
      setHealth(response.health)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    // Refresh health status every minute
    const interval = setInterval(fetchHealth, 60000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  return { health, loading, error, refresh: fetchHealth }
}