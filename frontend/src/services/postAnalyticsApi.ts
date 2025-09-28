/**
 * Post Analytics API Service
 * Integration with /api/v1/post-analytics endpoints
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PostAnalysisRequest {
  post_url: string
  campaign_id?: string
  tags?: string[]
}

export interface BatchAnalysisRequest {
  post_urls: string[]
  campaign_id?: string
  max_concurrent?: number
}

export interface PostAnalysisData {
  // Post Identification
  id: string
  shortcode: string
  post_url: string
  post_type: 'photo' | 'video' | 'carousel'

  // Raw Apify Data (complete scraper response)
  raw_apify_data: {
    inputUrl: string
    id: string
    type: string
    shortCode: string
    caption: string
    hashtags: string[]
    mentions: string[]
    url: string
    commentsCount: number
    firstComment: string
    latestComments: Array<{
      id: string
      text: string
      ownerUsername: string
      ownerProfilePicUrl: string
      timestamp: string
      repliesCount: number
      replies: any[]
      likesCount: number
      owner: {
        id: string
        is_verified: boolean
        profile_pic_url: string
        username: string
      }
    }>
    dimensionsHeight: number
    dimensionsWidth: number
    displayUrl: string
    images: string[]
    videoUrl?: string
    alt?: string
    likesCount: number
    videoViewCount?: number
    videoPlayCount?: number
    timestamp: string
    childPosts: any[]
    locationName?: string
    locationId?: string
    ownerFullName: string
    ownerUsername: string
    ownerId: string
    productType: string
    videoDuration?: number
    isSponsored: boolean
    taggedUsers: Array<{
      full_name: string
      id: string
      is_verified: boolean
      profile_pic_url: string
      username: string
    }>
    musicInfo?: {
      artist_name: string
      song_name: string
      uses_original_audio: boolean
      should_mute_audio: boolean
      should_mute_audio_reason: string
      audio_id: string
    }
    coauthorProducers: any[]
    isCommentsDisabled: boolean
  }

  // Extracted Key Metrics
  likes_count: number
  comments_count: number
  video_views_count?: number
  video_plays_count?: number

  // Content Analysis
  caption: string
  hashtags: string[]
  mentions: string[]

  // Media Information
  media_urls: string[]
  media_count: number
  display_url: string
  video_url?: string
  video_duration?: number

  // Creator Information
  creator_username: string
  creator_full_name: string
  creator_id: string
  creator_follower_count?: number
  creator_is_verified: boolean
  creator_profile_pic: string

  // Engagement Metrics
  engagement_rate: number

  // Location Data
  location_name?: string
  location_id?: string

  // Tags & Categories
  user_tags?: string[]
  content_category?: string
  sentiment?: 'positive' | 'neutral' | 'negative'

  // Metadata
  created_at: string
  updated_at: string
  analysis_status: 'pending' | 'completed' | 'failed'
  campaign_id?: string
  user_notes?: string
  is_sponsored: boolean
  tagged_users: Array<{
    username: string
    full_name: string
    is_verified: boolean
    profile_pic_url: string
  }>
  music_info?: {
    artist_name: string
    song_name: string
    uses_original_audio: boolean
  }
}

export interface AnalyticsOverview {
  total_analyses: number
  media_type_distribution: {
    photo: number
    video: number
    carousel: number
  }
  sentiment_distribution: {
    positive: number
    neutral: number
    negative: number
  }
  average_metrics: {
    likes: number
    comments: number
    views: number
    engagement_rate: number
  }
  top_content_categories: Array<{
    category: string
    count: number
  }>
  recent_analyses: PostAnalysisData[]
}

export interface SearchFilters {
  username_filter?: string
  content_category?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  media_type?: 'photo' | 'video' | 'carousel'
  min_likes?: number
  min_engagement_rate?: number
  limit?: number
  offset?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class PostAnalyticsApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`

      const response = await fetchWithAuth(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          if (errorText) errorMessage = errorText
        }

        return {
          success: false,
          error: errorMessage
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || data,
        message: data.message
      }
    } catch (error) {
      console.error('Post Analytics API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // ========================================================================
  // CORE ANALYSIS ENDPOINTS
  // ========================================================================

  /**
   * Analyze a single Instagram post
   */
  async analyzeSinglePost(request: PostAnalysisRequest): Promise<ApiResponse<PostAnalysisData>> {
    return this.makeRequest<PostAnalysisData>(ENDPOINTS.postAnalytics.analyze, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Batch analyze multiple Instagram posts
   */
  async batchAnalyzePosts(request: BatchAnalysisRequest): Promise<ApiResponse<{
    analyses: PostAnalysisData[]
    failed_urls: Array<{ url: string; error: string }>
    total_processed: number
    total_successful: number
    total_failed: number
  }>> {
    console.log('ENDPOINTS object:', ENDPOINTS)
    console.log('postAnalytics:', ENDPOINTS.postAnalytics)
    console.log('analyzeBatch:', ENDPOINTS.postAnalytics?.analyzeBatch)

    return this.makeRequest(ENDPOINTS.postAnalytics.analyzeBatch, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // ========================================================================
  // RETRIEVE ANALYSIS ENDPOINTS
  // ========================================================================

  /**
   * Get analysis by Instagram shortcode
   */
  async getAnalysisByShortcode(shortcode: string): Promise<ApiResponse<PostAnalysisData>> {
    return this.makeRequest<PostAnalysisData>(ENDPOINTS.postAnalytics.getByShortcode(shortcode))
  }

  /**
   * Get analysis by analysis ID
   */
  async getAnalysisById(analysisId: string): Promise<ApiResponse<PostAnalysisData>> {
    return this.makeRequest<PostAnalysisData>(ENDPOINTS.postAnalytics.getById(analysisId))
  }

  // ========================================================================
  // SEARCH AND FILTER ENDPOINTS
  // ========================================================================

  /**
   * Advanced search with filters
   */
  async searchAnalyses(filters: SearchFilters): Promise<ApiResponse<{
    analyses: PostAnalysisData[]
    total_count: number
    has_more: boolean
  }>> {
    return this.makeRequest(ENDPOINTS.postAnalytics.search, {
      method: 'POST',
      body: JSON.stringify(filters)
    })
  }

  /**
   * Get user's analyses with pagination
   */
  async getMyAnalyses(params: {
    limit?: number
    offset?: number
    media_type?: 'photo' | 'video' | 'carousel'
    sentiment?: 'positive' | 'neutral' | 'negative'
  } = {}): Promise<ApiResponse<{
    analyses: PostAnalysisData[]
    total_count: number
    has_more: boolean
  }>> {
    const queryParams = new URLSearchParams()

    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.media_type) queryParams.append('media_type', params.media_type)
    if (params.sentiment) queryParams.append('sentiment', params.sentiment)

    const queryString = queryParams.toString()
    const endpoint = `${ENDPOINTS.postAnalytics.myAnalyses}${queryString ? `?${queryString}` : ''}`

    return this.makeRequest(endpoint)
  }

  // ========================================================================
  // ANALYTICS & INSIGHTS ENDPOINTS
  // ========================================================================

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
    return this.makeRequest<AnalyticsOverview>(ENDPOINTS.postAnalytics.overview)
  }

  // ========================================================================
  // MANAGEMENT ENDPOINTS
  // ========================================================================

  /**
   * Delete an analysis
   */
  async deleteAnalysis(analysisId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.makeRequest<{ deleted: boolean }>(ENDPOINTS.postAnalytics.delete(analysisId), {
      method: 'DELETE'
    })
  }

  // ========================================================================
  // SYSTEM ENDPOINTS
  // ========================================================================

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>(ENDPOINTS.postAnalytics.health)
  }

  // ========================================================================
  // REAL-TIME ANALYSIS MONITORING
  // ========================================================================

  /**
   * Monitor analysis completion with real-time polling
   */
  async monitorAnalysis(postUrl: string, campaignId?: string): Promise<PostAnalysisData> {
    // 1. Submit for analysis
    const submission = await this.analyzeSinglePost({
      post_url: postUrl,
      campaign_id: campaignId
    })

    if (!submission.success || !submission.data) {
      throw new Error(submission.error || 'Failed to submit post for analysis')
    }

    const shortcode = submission.data.shortcode || this.extractShortcode(postUrl)
    if (!shortcode) {
      throw new Error('Could not extract shortcode from post URL')
    }

    // 2. Poll for completion
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getAnalysisByShortcode(shortcode)

          if (status.success && status.data) {
            const analysis = status.data

            // Check if analysis is complete
            if (analysis.analysis_status === 'completed') {
              clearInterval(pollInterval)
              resolve(analysis)
            } else if (analysis.analysis_status === 'failed') {
              clearInterval(pollInterval)
              reject(new Error('Analysis failed on server'))
            }
            // Continue polling if still processing
          }
        } catch (error) {
          // Still processing or network error - continue polling
          console.log('Checking analysis status...', error)
        }
      }, 5000) // Check every 5 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        reject(new Error('Analysis timeout - processing took longer than 5 minutes'))
      }, 300000)
    })
  }

  /**
   * Batch monitor multiple posts with real-time polling
   */
  async monitorBatchAnalysis(postUrls: string[], campaignId?: string): Promise<{
    analyses: PostAnalysisData[]
    failed_urls: Array<{ url: string; error: string }>
    total_processed: number
    total_successful: number
    total_failed: number
  }> {
    // Submit batch for analysis
    const batchResult = await this.batchAnalyzePosts({
      post_urls: postUrls,
      campaign_id: campaignId,
      max_concurrent: 3
    })

    if (!batchResult.success || !batchResult.data) {
      throw new Error(batchResult.error || 'Failed to submit batch for analysis')
    }

    // If analyses are immediately available, return them
    if (batchResult.data.analyses && batchResult.data.analyses.length > 0) {
      return batchResult.data
    }

    // Otherwise, poll for completion of each post
    const results: PostAnalysisData[] = []
    const failed: Array<{ url: string; error: string }> = []

    for (const url of postUrls) {
      try {
        const analysis = await this.monitorAnalysis(url, campaignId)
        results.push(analysis)
      } catch (error) {
        failed.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      analyses: results,
      failed_urls: failed,
      total_processed: postUrls.length,
      total_successful: results.length,
      total_failed: failed.length
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Extract shortcode from Instagram URL
   */
  extractShortcode(url: string): string | null {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  /**
   * Validate Instagram URL
   */
  validateInstagramUrl(url: string): { valid: boolean; error?: string } {
    // More flexible regex that accepts various Instagram URL formats including query params
    const instagramPostRegex = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?[^#]*)?(\#.*)?$/

    if (!url.trim()) {
      return { valid: false, error: 'URL is required' }
    }

    const cleanUrl = url.trim()

    console.log('Validating URL:', cleanUrl)
    console.log('Regex test result:', instagramPostRegex.test(cleanUrl))

    if (!instagramPostRegex.test(cleanUrl)) {
      return {
        valid: false,
        error: 'Invalid Instagram URL format. Expected: https://www.instagram.com/p/POST_ID/ or https://www.instagram.com/reel/POST_ID/'
      }
    }

    return { valid: true }
  }

  /**
   * Format engagement numbers for display
   */
  formatEngagement(count: number | undefined | null): string {
    // Handle undefined, null, or invalid values
    if (count === undefined || count === null || isNaN(count)) {
      return '0'
    }

    // Ensure count is a number
    const numCount = Number(count)

    if (numCount >= 1000000) {
      return `${(numCount / 1000000).toFixed(1)}M`
    } else if (numCount >= 1000) {
      return `${(numCount / 1000).toFixed(1)}K`
    }
    return numCount.toLocaleString()
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(likes: number, comments: number, followers: number): number {
    if (followers === 0) return 0
    return ((likes + comments) / followers) * 100
  }

  /**
   * Get sentiment color for UI
   */
  getSentimentColor(sentiment?: string): string {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'negative':
        return 'text-red-600 bg-red-100 border-red-200'
      case 'neutral':
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  /**
   * Get media type icon
   */
  getMediaTypeIcon(mediaType: string): string {
    switch (mediaType) {
      case 'video': return '🎥'
      case 'carousel': return '📱'
      case 'photo':
      default: return '📷'
    }
  }
}

// Export singleton instance
export const postAnalyticsApi = new PostAnalyticsApiService()
export default postAnalyticsApi