/**
 * Post Analytics API Service
 * Integration with /api/v1/post-analytics endpoints
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Verify ENDPOINTS structure on import
if (typeof window !== 'undefined') {
  console.log('PostAnalyticsApi: ENDPOINTS structure check', {
    hasPostAnalytics: !!ENDPOINTS.postAnalytics,
    hasAnalyzeBatch: !!ENDPOINTS.postAnalytics?.analyzeBatch,
    endpoints: ENDPOINTS.postAnalytics
  })
}

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
  instagram_post_id: string

  // Media Information
  media_type: "Video" | "Image" | "Carousel"
  is_video: boolean
  display_url: string
  cdn_thumbnail_url: string        // ⭐ Optimized Cloudflare CDN URL
  width: number
  height: number
  video_url?: string

  // Content
  caption: string
  hashtags: string[]
  mentions: string[]

  // Engagement Data
  likes_count: number              // Can be -1 if hidden
  comments_count: number
  engagement_rate: number

  // Profile Information (nested object)
  profile: {
    id: string
    username: string
    full_name: string
    followers_count: number
    following_count: number
    posts_count: number
    profile_pic_url: string
    biography: string
  }

  // Location Data
  location_name: string
  location_id: string

  // Carousel Data
  is_carousel: boolean
  carousel_media_count: number
  sidecar_children: any[]

  // Timestamps
  posted_at: string
  taken_at_timestamp: number
  ai_analyzed_at: string
  created_at: string

  // Analysis metadata
  analysis_source: string

  // Legacy fields for backward compatibility
  id?: string
  post_url?: string
  post_type?: 'photo' | 'video' | 'carousel'
  likes_count?: number
  comments_count?: number
  video_views_count?: number
  video_plays_count?: number
  caption?: string
  hashtags?: string[]
  mentions?: string[]
  media_urls?: string[]
  media_count?: number
  display_url?: string
  video_url?: string
  video_duration?: number
  creator_username?: string
  creator_full_name?: string
  creator_id?: string
  creator_follower_count?: number
  creator_is_verified?: boolean
  creator_profile_pic?: string
  engagement_rate?: number
  location_name?: string
  location_id?: string
  user_tags?: string[]
  content_category?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  updated_at?: string
  analysis_status?: 'pending' | 'completed' | 'failed'
  campaign_id?: string
  user_notes?: string
  is_sponsored?: boolean
  tagged_users?: Array<{
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
   * Returns complete analysis with CDN-optimized URLs immediately
   */
  async analyzeSinglePost(request: PostAnalysisRequest): Promise<ApiResponse<PostAnalysisData>> {
    return this.makeRequest<PostAnalysisData>(ENDPOINTS.postAnalytics.analyze, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Batch analyze multiple Instagram posts (NEW ENHANCED VERSION)
   * Up to 50 posts with concurrent processing (3-5 posts simultaneously)
   * 10x faster than sequential processing
   *
   * Processing Time Expectations:
   * - Each post: 1-6 minutes (varies greatly)
   * - Posts with existing creators: 1-2 minutes
   * - Posts with NEW creators: 4-6 minutes (includes full Creator Analytics)
   * - Large batches: Can take 30-60+ minutes
   */
  async batchAnalyzePosts(request: BatchAnalysisRequest): Promise<ApiResponse<{
    results: Array<{
      success: boolean
      post_url: string
      data?: PostAnalysisData
      error?: string
    }>
    summary: {
      total_requested: number
      successful: number
      failed: number
      success_rate: number
    }
  }>> {
    console.log('🚀 Starting batch analysis for', request.post_urls.length, 'posts')

    // Ensure the endpoint exists before making the request
    if (!ENDPOINTS.postAnalytics?.analyzeBatch) {
      return {
        success: false,
        error: 'Batch analysis endpoint not configured'
      }
    }

    // Validate post limit (up to 50 posts)
    if (request.post_urls.length > 50) {
      return {
        success: false,
        error: 'Maximum 50 posts allowed per batch'
      }
    }

    // Set default concurrency if not specified
    const finalRequest = {
      ...request,
      max_concurrent: request.max_concurrent || 3 // Default to 3 concurrent posts
    }

    return this.makeRequest(ENDPOINTS.postAnalytics.analyzeBatch, {
      method: 'POST',
      body: JSON.stringify(finalRequest)
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
  // DIRECT ANALYSIS METHODS (NO POLLING NEEDED)
  // ========================================================================

  /**
   * Analyze single post with immediate results
   * Returns complete analysis with CDN-optimized URLs in ~15-20 seconds
   */
  async analyzePostDirect(postUrl: string, campaignId?: string): Promise<PostAnalysisData> {
    const result = await this.analyzeSinglePost({
      post_url: postUrl,
      campaign_id: campaignId
    })

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to analyze post')
    }

    return result.data
  }

  /**
   * Analyze multiple posts using the new enhanced batch endpoint
   * Up to 50 posts with true concurrent processing (3-5 posts simultaneously)
   *
   * @param postUrls Array of Instagram post URLs (max 50)
   * @param campaignId Optional campaign ID to associate posts with
   * @param maxConcurrent Optional concurrency level (1-5, default: 3)
   */
  async analyzePostsBatch(
    postUrls: string[],
    campaignId?: string,
    maxConcurrent: number = 3
  ): Promise<{
    analyses: PostAnalysisData[]
    failed_urls: Array<{ url: string; error: string }>
    total_processed: number
    total_successful: number
    total_failed: number
  }> {
    console.log('🚀 Using new enhanced batch endpoint for', postUrls.length, 'posts')

    // Use the new batch endpoint for better performance
    const batchResult = await this.batchAnalyzePosts({
      post_urls: postUrls,
      campaign_id: campaignId,
      max_concurrent: Math.min(Math.max(maxConcurrent, 1), 5) // Clamp between 1-5
    })

    if (!batchResult.success || !batchResult.data) {
      // Fallback to sequential processing if batch fails
      console.warn('⚠️ Batch endpoint failed, falling back to sequential processing')
      return this._sequentialAnalysis(postUrls, campaignId)
    }

    // Transform new API format to legacy format for backward compatibility
    const analyses: PostAnalysisData[] = []
    const failed: Array<{ url: string; error: string }> = []

    batchResult.data.results.forEach(result => {
      if (result.success && result.data) {
        analyses.push(result.data)
      } else {
        failed.push({
          url: result.post_url,
          error: result.error || 'Unknown error'
        })
      }
    })

    return {
      analyses,
      failed_urls: failed,
      total_processed: batchResult.data.summary.total_requested,
      total_successful: batchResult.data.summary.successful,
      total_failed: batchResult.data.summary.failed
    }
  }

  /**
   * Fallback sequential analysis method
   * @private
   */
  private async _sequentialAnalysis(postUrls: string[], campaignId?: string): Promise<{
    analyses: PostAnalysisData[]
    failed_urls: Array<{ url: string; error: string }>
    total_processed: number
    total_successful: number
    total_failed: number
  }> {
    const results: PostAnalysisData[] = []
    const failed: Array<{ url: string; error: string }> = []

    // Process posts one by one as fallback
    for (const url of postUrls) {
      try {
        const analysis = await this.analyzePostDirect(url, campaignId)
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

  /**
   * @deprecated Use analyzePostDirect instead
   * Legacy method for backward compatibility
   */
  async monitorAnalysis(postUrl: string, campaignId?: string): Promise<PostAnalysisData> {
    console.warn('monitorAnalysis is deprecated. Use analyzePostDirect instead.')
    return this.analyzePostDirect(postUrl, campaignId)
  }

  /**
   * @deprecated Use analyzePostsBatch instead
   * Legacy method for backward compatibility
   */
  async monitorBatchAnalysis(postUrls: string[], campaignId?: string): Promise<{
    analyses: PostAnalysisData[]
    failed_urls: Array<{ url: string; error: string }>
    total_processed: number
    total_successful: number
    total_failed: number
  }> {
    console.warn('monitorBatchAnalysis is deprecated. Use analyzePostsBatch instead.')
    return this.analyzePostsBatch(postUrls, campaignId)
  }

  // ========================================================================
  // NEW ENHANCED BATCH PROCESSING METHODS
  // ========================================================================

  /**
   * Process large batches with realistic expectations
   * Follows backend team's recommended usage pattern
   *
   * @param postUrls Array of Instagram post URLs (max 50)
   * @param options Configuration options
   * @returns Promise with detailed results and progress tracking
   */
  async processBatch(postUrls: string[], options: {
    campaignId?: string
    maxConcurrent?: number
    onProgress?: (completed: number, total: number) => void
    onWarning?: (message: string) => void
  } = {}): Promise<{
    success: boolean
    data?: {
      results: Array<{
        success: boolean
        post_url: string
        data?: PostAnalysisData
        error?: string
      }>
      summary: {
        total_requested: number
        successful: number
        failed: number
        success_rate: number
      }
    }
    message?: string
    estimatedTimeMessage?: string
  }> {
    const { campaignId, maxConcurrent = 3, onProgress, onWarning } = options

    // Validate inputs
    if (!postUrls.length) {
      return {
        success: false,
        message: 'No post URLs provided'
      }
    }

    if (postUrls.length > 50) {
      return {
        success: false,
        message: 'Maximum 50 posts allowed per batch'
      }
    }

    // Set realistic expectations
    const estimatedMinutes = this._estimateProcessingTime(postUrls.length)
    const estimatedTimeMessage = this._getTimeEstimateMessage(postUrls.length, estimatedMinutes)

    if (onWarning) {
      onWarning(estimatedTimeMessage)
    }

    // Call the enhanced batch endpoint
    const result = await this.batchAnalyzePosts({
      post_urls: postUrls,
      campaign_id: campaignId,
      max_concurrent: Math.min(Math.max(maxConcurrent, 1), 5)
    })

    // Simulate progress for UI (since backend processes concurrently)
    if (onProgress) {
      // The backend processes in parallel, so we can't track real progress
      // But we can give estimated progress updates
      const progressInterval = setInterval(() => {
        const estimatedProgress = Math.min(Math.floor(Math.random() * 30) + 10, 95)
        onProgress(estimatedProgress, 100)
      }, 5000)

      // Clear interval when done (this is just UI feedback)
      setTimeout(() => {
        clearInterval(progressInterval)
        if (result.success) {
          onProgress(100, 100)
        }
      }, Math.min(estimatedMinutes * 60 * 1000, 30000)) // Max 30 seconds for UI feedback
    }

    return {
      success: result.success,
      data: result.data,
      message: result.message,
      estimatedTimeMessage
    }
  }

  /**
   * Estimate processing time based on post count
   * @private
   */
  private _estimateProcessingTime(postCount: number): number {
    // Conservative estimates based on backend team's guidance
    const baseTimePerPost = 3 // 3 minutes average per post
    const concurrencyFactor = 0.4 // 40% efficiency gain from concurrency

    return Math.ceil(postCount * baseTimePerPost * concurrencyFactor)
  }

  /**
   * Get user-friendly time estimate message
   * @private
   */
  private _getTimeEstimateMessage(postCount: number, estimatedMinutes: number): string {
    if (postCount === 1) {
      return 'Processing 1 post... This may take 1-6 minutes depending on content complexity.'
    }

    if (postCount <= 5) {
      return `Processing ${postCount} posts... This may take 5-15 minutes. New creators require additional time for profile analysis.`
    }

    if (postCount <= 20) {
      return `Processing ${postCount} posts... This may take 15-45 minutes. Large batches with new creators can take longer.`
    }

    return `Processing ${postCount} posts... This may take 30-60+ minutes. You can safely close this tab - processing continues in background.`
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

  /**
   * Get optimal image URL with CDN fallback
   * Prioritizes CDN-optimized URLs from Cloudflare
   */
  getOptimalImageUrl(postData: PostAnalysisData): string {
    // New API structure with CDN optimization
    if (postData.cdn_thumbnail_url) {
      return postData.cdn_thumbnail_url
    }
    if (postData.display_url) {
      return postData.display_url
    }

    return ''
  }

  /**
   * Get video URL if available
   */
  getVideoUrl(postData: PostAnalysisData): string | null {
    if (postData.video_url) {
      return postData.video_url
    }
    return null
  }

  /**
   * Check if post has video content
   */
  isVideoPost(postData: PostAnalysisData): boolean {
    return postData.is_video || postData.media_type === 'Video'
  }

  /**
   * Get normalized post data for display
   * Handles the actual API response format
   */
  normalizePostData(postData: PostAnalysisData): {
    id: string
    caption: string
    likes: number
    comments: number
    engagementRate: number
    creator: {
      username: string
      fullName: string
      followersCount: number
      postsCount: number
      profilePicUrl: string
      biography: string
    }
    media: {
      imageUrl: string
      videoUrl?: string
      isVideo: boolean
      type: string
      width: number
      height: number
    }
    location: {
      name: string
      id: string
    }
    carousel: {
      isCarousel: boolean
      mediaCount: number
    }
    postedAt: string
    hashtags: string[]
    mentions: string[]
  } {
    return {
      id: postData.id || postData.shortcode,
      caption: postData.caption || '',
      likes: postData.likes_count || 0,
      comments: postData.comments_count || 0,
      engagementRate: postData.engagement_rate || 0,
      creator: {
        username: postData.profile?.username || '',
        fullName: postData.profile?.full_name || '',
        followersCount: postData.profile?.followers_count || 0,
        postsCount: postData.profile?.posts_count || 0,
        profilePicUrl: postData.profile?.profile_pic_url || '',
        biography: postData.profile?.biography || ''
      },
      media: {
        imageUrl: this.getOptimalImageUrl(postData),
        videoUrl: this.getVideoUrl(postData) || undefined,
        isVideo: this.isVideoPost(postData),
        type: postData.media_type || 'Image',
        width: postData.width || 0,
        height: postData.height || 0
      },
      location: {
        name: postData.location_name || '',
        id: postData.location_id || ''
      },
      carousel: {
        isCarousel: postData.is_carousel || false,
        mediaCount: postData.carousel_media_count || 1
      },
      postedAt: postData.posted_at || postData.created_at || new Date().toISOString(),
      hashtags: postData.hashtags || [],
      mentions: postData.mentions || []
    }
  }
}

// Export singleton instance
export const postAnalyticsApi = new PostAnalyticsApiService()
export default postAnalyticsApi