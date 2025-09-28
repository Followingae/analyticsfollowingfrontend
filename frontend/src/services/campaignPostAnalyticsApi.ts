/**
 * Campaign Post Analytics API Service
 * Integration with new /api/v1/campaigns endpoints for post analytics
 */

import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CampaignPost {
  id: string
  instagram_url: string
  instagram_post_id: string
  analysis_status: 'pending' | 'completed' | 'failed'
  scraped_data: {
    caption: string
    likes_count: number
    comments_count: number
    video_view_count?: number
    is_video: boolean
  }
  ai_analysis: {
    sentiment: 'positive' | 'neutral' | 'negative'
    sentiment_score: number
    content_category: string
    language: string
    engagement_quality: 'low' | 'medium' | 'high'
  }
  added_at: string
  analyzed_at?: string
}

export interface CampaignPostsResponse {
  campaign_id: string
  posts: CampaignPost[]
  summary: {
    total_posts: number
    completed_analysis: number
    pending_analysis: number
    failed_analysis: number
    avg_sentiment_score: number
    top_categories: string[]
    total_engagement: number
  }
  pagination: {
    total_count: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export interface AddPostsRequest {
  post_urls: string[]
  analysis_priority?: 'low' | 'normal' | 'high'
}

export interface AddPostsResponse {
  campaign_id: string
  posts_added: number
  posts_queued: number
  analysis_jobs: string[]
  estimated_completion: string
  credits: {
    cost_per_post: number
    total_cost: number
    remaining_balance: number
  }
}

export interface CampaignAnalyticsSummary {
  campaign_id: string
  overview: {
    total_posts: number
    total_engagement: number
    avg_likes: number
    avg_comments: number
    engagement_rate: number
  }
  ai_insights: {
    sentiment_distribution: {
      positive: number
      neutral: number
      negative: number
    }
    content_categories: Record<string, number>
    language_distribution: Record<string, number>
  }
  performance_metrics: {
    top_performing_posts: CampaignPost[]
    engagement_trends: Array<{
      date: string
      engagement: number
      posts_count: number
    }>
    best_posting_times: Array<{
      hour: number
      day_of_week: number
      avg_engagement: number
    }>
  }
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

class CampaignPostAnalyticsApiService {
  private baseUrl = API_CONFIG.BASE_URL

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`

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
      console.error('Campaign Post Analytics API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // ========================================================================
  // CAMPAIGN POSTS MANAGEMENT
  // ========================================================================

  /**
   * Add Instagram posts to a campaign for analysis
   */
  async addPostsToCampaign(
    campaignId: string,
    request: AddPostsRequest
  ): Promise<ApiResponse<AddPostsResponse>> {
    return this.makeRequest<AddPostsResponse>(
      `/api/v1/campaigns/${campaignId}/posts`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    )
  }

  /**
   * Get campaign posts with analytics data
   */
  async getCampaignPosts(
    campaignId: string,
    options: {
      limit?: number
      offset?: number
      analysis_status?: 'all' | 'pending' | 'completed' | 'failed'
    } = {}
  ): Promise<ApiResponse<CampaignPostsResponse>> {
    const params = new URLSearchParams()

    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    if (options.analysis_status && options.analysis_status !== 'all') {
      params.append('analysis_status', options.analysis_status)
    }

    const queryString = params.toString()
    const endpoint = `/api/v1/campaigns/${campaignId}/posts${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<CampaignPostsResponse>(endpoint)
  }

  /**
   * Get comprehensive campaign analytics summary
   */
  async getCampaignAnalyticsSummary(
    campaignId: string
  ): Promise<ApiResponse<CampaignAnalyticsSummary>> {
    return this.makeRequest<CampaignAnalyticsSummary>(
      `/api/v1/campaigns/${campaignId}/analytics/summary`
    )
  }

  /**
   * Delete a post from campaign analytics
   */
  async removePostFromCampaign(
    campaignId: string,
    postId: string
  ): Promise<ApiResponse<{ removed: boolean }>> {
    return this.makeRequest<{ removed: boolean }>(
      `/api/v1/campaigns/${campaignId}/posts/${postId}`,
      {
        method: 'DELETE'
      }
    )
  }

  /**
   * Retry analysis for a failed post
   */
  async retryPostAnalysis(
    campaignId: string,
    postId: string
  ): Promise<ApiResponse<{ analysis_job_id: string }>> {
    return this.makeRequest<{ analysis_job_id: string }>(
      `/api/v1/campaigns/${campaignId}/posts/${postId}/retry`,
      {
        method: 'POST'
      }
    )
  }

  /**
   * Export campaign posts analytics to CSV/Excel
   */
  async exportCampaignAnalytics(
    campaignId: string,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<ApiResponse<{ download_url: string; expires_at: string }>> {
    return this.makeRequest<{ download_url: string; expires_at: string }>(
      `/api/v1/campaigns/${campaignId}/analytics/export?format=${format}`
    )
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Validate Instagram URL format
   */
  validateInstagramUrl(url: string): { valid: boolean; error?: string } {
    const instagramPostRegex = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/

    if (!url.trim()) {
      return { valid: false, error: 'URL is required' }
    }

    if (!instagramPostRegex.test(url.trim())) {
      return {
        valid: false,
        error: 'Invalid Instagram URL format. Expected: https://www.instagram.com/p/POST_ID/'
      }
    }

    return { valid: true }
  }

  /**
   * Validate multiple Instagram URLs
   */
  validateInstagramUrls(urls: string[]): {
    valid: string[]
    invalid: Array<{ url: string; error: string }>
  } {
    const valid: string[] = []
    const invalid: Array<{ url: string; error: string }> = []

    for (const url of urls) {
      const result = this.validateInstagramUrl(url)
      if (result.valid) {
        valid.push(url.trim())
      } else {
        invalid.push({ url: url.trim(), error: result.error || 'Invalid URL' })
      }
    }

    return { valid, invalid }
  }

  /**
   * Parse bulk Instagram URLs from text input
   */
  parseBulkUrls(text: string): string[] {
    const urlRegex = /https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/g
    const matches = text.match(urlRegex) || []

    // Remove duplicates and clean URLs
    return [...new Set(matches.map(url => url.trim()))]
  }

  /**
   * Calculate engagement rate for a post
   */
  calculateEngagementRate(post: CampaignPost, followerCount?: number): number {
    if (!followerCount) return 0

    const totalEngagement = post.scraped_data.likes_count + post.scraped_data.comments_count
    return (totalEngagement / followerCount) * 100
  }

  /**
   * Get sentiment color for UI
   */
  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100'
      case 'negative':
        return 'text-red-600 bg-red-100'
      case 'neutral':
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  /**
   * Format engagement numbers for display
   */
  formatEngagement(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }
}

// Export singleton instance
export const campaignPostAnalyticsApi = new CampaignPostAnalyticsApiService()
export default campaignPostAnalyticsApi