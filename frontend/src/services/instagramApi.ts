import { API_CONFIG, ENDPOINTS, REQUEST_HEADERS, getAuthHeaders } from '@/config/api'
import { authService } from './authService'
import { fetchWithAuth } from '@/utils/apiInterceptor'
/**
 * PRODUCTION READY API INTERFACES
 * Updated according to FRONTEND_HANDOVER.md (July 31, 2025)
 * Backend Version: Production Ready (Post-Audit)
 */
// AI Analysis Status - Updated to match backend integration guide
export type AIProcessingStatus = 'pending' | 'completed' | 'not_available'

// AI Content Categories
export type AIContentCategory = 
  | 'Fashion & Beauty' | 'Food & Dining' | 'Travel & Adventure' 
  | 'Technology & Gadgets' | 'Fitness & Health' | 'Home & Lifestyle'
  | 'Business & Professional' | 'Art & Creativity' | 'Entertainment'
  | 'Education & Learning' | 'Sports & Recreation' | 'Family & Personal'
  | 'Photography' | 'Music & Audio' | 'Automotive' | 'Gaming'
  | 'Nature & Outdoors' | 'Shopping & Reviews' | 'News & Politics' | 'General'

// AI Sentiment
export type AISentiment = 'positive' | 'negative' | 'neutral'

// AI Language Codes
export type AILanguageCode = 'ar' | 'bg' | 'de' | 'el' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' | 'nl' | 'pl' | 'pt' | 'ru' | 'sw' | 'th' | 'tr' | 'ur' | 'vi' | 'zh'

// AI Content Distribution
export interface AIContentDistribution {
  [category: string]: number // 0.0 to 1.0
}

// AI Language Distribution
export interface AILanguageDistribution {
  [languageCode: string]: number // 0.0 to 1.0
}

// AI Processing Progress
export interface AIProcessingProgress {
  completed: number
  processing: number
  pending: number
  total_posts?: number
  analyzed_posts?: number
  processing_posts?: number
  pending_posts?: number
  completion_percentage?: number
  estimated_completion_time?: string
}

// AI Analysis Completion Status
export interface AICompletionStatus {
  all_steps_completed: boolean
  posts_processing_done: boolean
  profile_insights_done: boolean
  database_updates_done: boolean
  ready_for_display: boolean
}

// Frontend Action Recommendations
export interface AIFrontendActions {
  can_refresh_profile: boolean
  can_view_ai_insights: boolean
  should_show_success_message?: boolean
  should_show_error_message?: boolean
  recommended_next_step: 'refresh_profile_data' | 'retry_analysis_later' | 'view_existing_data'
}

// NEW: AI Verification Response from backend team
export interface AIVerificationResponse {
  username: string
  total_posts: number
  posts_analyzed: number
  analysis_coverage: number // percentage 0-100
  ready_for_frontend_display: boolean
  profile_ai_insights_complete: boolean
  sample_ai_data: {
    post_count: number
    sample_posts: Array<{
      id: string
      ai_content_category: AIContentCategory
      ai_category_confidence: number
      ai_sentiment: AISentiment
      ai_sentiment_score: number
      ai_language_code: AILanguageCode
      ai_analyzed_at: string
      is_real_ai_data: boolean
    }>
  }
  verification_timestamp: string
  system_status: 'healthy' | 'degraded' | 'offline'
}

// NEW: AI Status Monitoring Response
export interface AIStatusMonitoringResponse {
  active_analyses: number
  queue_depth: number
  system_health: 'healthy' | 'degraded' | 'offline'
  models_loaded: boolean
  processing_capacity: number
  last_health_check: string
}

// AI Analysis Response
export interface AIAnalysisResponse {
  success: boolean
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING'
  analysis_complete: boolean
  message: string
  error?: string
  username?: string
  profile_id?: string
  posts_analyzed?: number
  total_posts_found?: number
  success_rate?: number
  profile_insights_updated?: boolean
  processing_type?: 'direct' | 'background'
  action_taken?: 'analysis_completed' | 'already_complete' | 'analysis_failed'
  completion_status: AICompletionStatus
  frontend_actions: AIFrontendActions
}

// Main profile interface matching new backend structure with AI enhancements
export interface InstagramProfile {
  // Core Profile Information
  username: string
  full_name: string
  biography: string
  external_url: string
  profile_pic_url: string
  profile_pic_url_hd: string
  category?: string // Original Instagram category
  
  // Statistics (ALL from Decodo)
  followers_count: number
  following_count: number
  posts_count: number
  mutual_followers_count: number
  highlight_reel_count: number
  
  // Account Status
  is_verified: boolean
  is_private: boolean
  is_business_account: boolean
  is_professional_account: boolean
  
  // Business Information
  business_category_name: string
  business_email: string
  business_phone_number: string
  instagram_business_category?: string
  
  // Features
  has_ar_effects: boolean
  has_clips: boolean
  has_guides: boolean
  has_channel: boolean
  
  // AI & Special Features
  ai_agent_type: string
  ai_agent_owner_username: string
  transparency_label: string
  
  // Analytics (Enhanced)
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  influence_score: number
  content_quality_score: number
  
  // AI fields are now in separate ai_insights object - keeping these for backward compatibility
  ai_primary_content_type?: AIContentCategory | null
  ai_content_distribution?: AIContentDistribution | null
  ai_avg_sentiment_score?: number | null // -1.0 to +1.0
  ai_language_distribution?: AILanguageDistribution | null
  ai_content_quality_score?: number | null // 0.0 to 1.0
  ai_profile_analyzed_at?: string | null
  ai_analysis_status?: AIProcessingStatus
  
  // Media Storage
  profile_images: Array<{url: string, type: string, size: string}>
  profile_thumbnails: Array<{url: string, width: number, height: number}>
  
  // Data Management
  data_quality_score: number
  last_refreshed: string
  refresh_count: number
}
// Post data interface with AI enhancements
export interface InstagramPost {
  id: string
  instagram_post_id: string
  shortcode: string
  url?: string
  media_type: string            // "GraphImage", "GraphVideo", "GraphSidecar"
  is_video: boolean
  is_carousel?: boolean
  carousel_media_count?: number
  display_url: string
  video_url?: string
  caption: string
  hashtags: string[]
  mentions: string[]
  likes_count: number
  comments_count: number
  video_view_count?: number
  engagement_rate: number
  taken_at_timestamp: number
  posted_at: string
  location?: {name: string, id: string}
  comments_disabled?: boolean
  tagged_users?: any[]
  sidecar_children?: any[]
  images?: Array<{
    url: string
    proxied_url: string
    type: string
    width: number
    height: number
    is_video?: boolean
  }>
  thumbnails?: Array<{
    url: string
    proxied_url: string
    width: number
    height: number
    type: string
  }>
  dimensions?: {width: number, height: number}
  
  // Legacy fields - DEPRECATED: Use ai_analysis object instead
  // Kept for backward compatibility but use ai_analysis.* fields for new code
  ai_content_category?: AIContentCategory | null
  ai_category_confidence?: number | null // 0.0 to 1.0
  ai_sentiment?: AISentiment | null
  ai_sentiment_score?: number | null // -1.0 to +1.0
  ai_sentiment_confidence?: number | null // 0.0 to 1.0
  ai_language_code?: AILanguageCode | null // CORRECTED FIELD NAME
  ai_language_confidence?: number | null // 0.0 to 1.0
  ai_analyzed_at?: string | null
  ai_analysis_status?: AIProcessingStatus
  
  // NEW: AI analysis object from integration guide
  ai_analysis?: PostAIAnalysis
  
  // Legacy fields for compatibility
  post_images?: Array<{url: string, width: number, height: number}>
  post_thumbnails?: Array<{url: string, width: number, height: number}>
}
// Demographics data interface (NEW!)
export interface AudienceDemographics {
  gender_distribution: {female: number, male: number}
  age_distribution: {"18-24": number, "25-34": number, "35-44": number, "45-54": number, "55+": number}
  location_distribution: Record<string, number>
  sample_size: number
  confidence_score: number
  analysis_method: string
}
// AI Sentiment Analysis
export interface AISentimentAnalysis {
  average_sentiment_score?: number | null // -1.0 to +1.0
  positive_ratio?: number | null // 0.0 to 1.0
  neutral_ratio?: number | null // 0.0 to 1.0
  negative_ratio?: number | null // 0.0 to 1.0
}

// AI Language Insights
export interface AILanguageInsights {
  primary_language?: AILanguageCode | null
  language_distribution?: AILanguageDistribution | null
}

// AI Insights - Updated to match backend integration guide
export interface AIInsights {
  ai_primary_content_type?: AIContentCategory | null
  ai_content_distribution?: AIContentDistribution | null
  ai_avg_sentiment_score?: number | null // -1.0 to 1.0
  ai_language_distribution?: AILanguageDistribution | null
  ai_content_quality_score?: number | null // 0.0 to 1.0
  ai_profile_analyzed_at?: string | null
  has_ai_analysis: boolean
  ai_processing_status: AIProcessingStatus
}

// Post AI Analysis - Updated with corrected field names from backend team
export interface PostAIAnalysis {
  ai_content_category?: AIContentCategory | null
  ai_category_confidence?: number | null // 0.0 to 1.0 - CORRECTED FIELD NAME
  ai_sentiment?: AISentiment | null
  ai_sentiment_score?: number | null // -1.0 to 1.0
  ai_language_code?: AILanguageCode | null // CORRECTED FIELD NAME (was ai_language)
  ai_language_confidence?: number | null // 0.0 to 1.0
  ai_analyzed_at?: string | null // CORRECTED FIELD NAME (was ai_post_analyzed_at)
  has_ai_analysis: boolean
  is_real_ai_data?: boolean // NEW: Guarantee no mock data
  ai_processing_status?: AIProcessingStatus
}

// Main API response structure - Updated for automatic AI integration
export interface ProfileResponse {
  success: boolean
  profile: InstagramProfile
  analytics: {
    engagement_rate: number                    // Overall engagement rate
    engagement_rate_last_12_posts: number     // Last 12 posts (Instagram standard)
    engagement_rate_last_30_days: number      // Recent 30-day performance
    influence_score: number                     // Multi-factor score (1-10)
    avg_likes: number                          // Average likes per post
    avg_comments: number                       // Average comments per post
    avg_total_engagement: number               // Combined average engagement
    posts_analyzed: number                     // Number of posts used in calculation
    data_quality_score: number                // Data reliability score
    content_quality_score: number             // Content analysis score
    
    // Legacy AI analytics - may still be present
    ai_enhanced_engagement?: number | null
    ai_content_quality_score?: number | null
    ai_avg_sentiment?: number | null
    ai_analysis_status?: AIProcessingStatus
  }
  // NEW: Automatic AI insights integration
  ai_insights?: AIInsights
  meta: {
    analysis_timestamp: string
    user_has_access: boolean
    access_expires_in_days: number
    data_source: string
    includes_ai_insights?: boolean
  }
  posts?: InstagramPost[]
  demographics?: AudienceDemographics
}
// Legacy interface - DEPRECATED - Use InstagramProfile instead
export interface BackendProfileResponse extends InstagramProfile {
  // Kept for backward compatibility only
}
// Posts pagination interface
export interface PostsPagination {
  limit: number
  offset: number
  total: number
  has_more: boolean
  next_offset: number
}
// Posts API response interface - Updated with AI analysis summary
export interface PostsResponse {
  profile: {
    username: string
    full_name: string
    total_posts: number
  }
  posts: InstagramPost[]
  // Optional fields that may be added by backend later
  pagination?: PostsPagination
  meta?: {
    posts_returned: number
    note?: string
    // NEW AI ANALYSIS SUMMARY
    ai_analysis_summary?: {
      total_posts: number
      posts_analyzed: number
      posts_processing: number
      posts_pending: number
    }
  }
  // NEW: AI analytics from integration guide
  ai_analytics?: {
    posts_with_ai_analysis: number
    total_posts_returned: number
    ai_analysis_coverage: number // percentage
    ai_features_available: string[]
  }
}
// API Response interfaces
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
export interface BasicProfileResponse extends ApiResponse<ProfileResponse> {}
export interface CompleteProfileResponse extends ApiResponse<ProfileResponse> {}
export interface PostsApiResponse extends ApiResponse<PostsResponse> {}
// Unlocked Profiles interfaces
export interface UnlockedProfile {
  // Profile data (similar to InstagramProfile but may be subset)
  username: string
  full_name: string
  profile_pic_url: string
  profile_pic_url_hd: string
  followers_count: number
  following_count: number
  posts_count: number
  is_verified: boolean
  is_private: boolean
  is_business_account: boolean
  business_category_name?: string
  engagement_rate?: number
  country_block?: string // Country from Decodo API
  // Access info
  access_granted_at: string
  days_remaining: number
  // Pre-proxied image URLs (no CORS issues)
  proxied_profile_pic_url: string
  proxied_profile_pic_url_hd?: string
}
export interface UnlockedProfilesPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}
export interface UnlockedProfilesResponse {
  profiles: UnlockedProfile[]
  pagination: UnlockedProfilesPagination
  meta: {
    total_unlocked: number
    user_tier: string
    access_level: string
  }
}
export interface UnlockedProfilesApiResponse extends ApiResponse<UnlockedProfilesResponse> {}
export class InstagramApiService {
  private baseURL: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS
    this.retryDelay = API_CONFIG.RETRY_DELAY
  }
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0,
    customTimeout?: number
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutMs = customTimeout || this.timeout
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeoutMs)
    try {
      const response = await fetchWithAuth(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        const errorText = await response.text()
        // Handle specific error cases for two-endpoint architecture
        if (response.status === 401) {
          throw new Error(`Authentication required. Please log in again.`)
        } else if (response.status === 403) {
          throw new Error(`No access to this profile. Click to unlock 30-day access.`)
        } else if (response.status === 404) {
          // Different 404 handling based on endpoint
          if (url.includes('/analytics')) {
            throw new Error(`Please search for this profile first to unlock analytics`)
          } else {
            throw new Error(`Profile not found. Please check the username and try again.`)
          }
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait before trying again.`)
        } else if (response.status === 503) {
          throw new Error(`Profile temporarily unavailable. Please try again in 5 minutes.`)
        } else if (response.status === 500) {
          throw new Error(`Server error. The backend service is experiencing issues. Please try again later.`)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      const responseText = await response.text()
      if (!responseText) {
        throw new Error('Empty response body received from server')
      }
      try {
        const parsedResponse = JSON.parse(responseText)
        return parsedResponse
      } catch (parseError) {
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}...`)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      // Retry logic (skip retries for AbortError/timeouts)
      if (retryCount < this.retryAttempts && error instanceof Error && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeRequest<T>(url, options, retryCount + 1, customTimeout)
      }
      // Enhance error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Check if this was a manual abort or timeout
          const timeoutMsg = `Request timed out after ${timeoutMs}ms. The server may be taking too long to respond.`
          throw new Error(timeoutMsg)
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Cannot connect to server. Please check your internet connection.`)
        } else if (error.message.includes('signal is aborted')) {
          throw new Error(`Request was cancelled or timed out. The backend might be processing a large profile - please try again.`)
        }
      }
      throw error
    }
  }
  /**
   * NEW: Profile search/preview endpoint - TWO-ENDPOINT ARCHITECTURE
   * Uses: GET /api/v1/instagram/profile/{username}
   * Purpose: Initial profile search and preview cards
   * Behavior:
   * - Checks database first
   * - If not found: Calls Decodo + stores in database
   * - If found: Returns cached data instantly
   * - Grants user 30-day access
   * - Response Time: 15-30 seconds (first time) or 0.5 seconds (cached)
   */
  async searchProfile(username: string): Promise<BasicProfileResponse> {
    try {
      const response = await this.makeRequest<ProfileResponse>(ENDPOINTS.profile.search(username), {
        method: 'GET',
      }, 0, API_CONFIG.SEARCH_TIMEOUT)
      // Validate response structure
      if (!response) {
        throw new Error('Empty response received from backend')
      }
      if (!response.profile) {
        throw new Error('No profile data received from backend')
      }
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search profile'
      }
    }
  }
  /**
   * NEW: Analytics endpoint - TWO-ENDPOINT ARCHITECTURE
   * Uses: GET /api/v1/instagram/profile/{username}/analytics
   * Purpose: "View Analysis" detailed page
   * Behavior:
   * - ONLY reads from database cache
   * - NEVER calls Decodo
   * - Response Time: ~0.5 seconds
   * - Returns 404 if profile not unlocked yet
   */
  async getAnalytics(username: string): Promise<BasicProfileResponse> {
    try {
      const response = await this.makeRequest<ProfileResponse>(ENDPOINTS.profile.analytics(username), {
        method: 'GET',
      }, 0, API_CONFIG.ANALYTICS_TIMEOUT)
      // Validate response structure
      if (!response) {
        throw new Error('Empty response received from backend')
      }
      if (!response.profile) {
        throw new Error('No profile data received from backend')
      }
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      // Handle specific 404 case for unlocked profiles
      if (error.message.includes('404')) {
        return {
          success: false,
          error: 'Please search for this profile first to unlock analytics'
        }
      }
      return {
        success: false,
        error: error.message || 'Failed to load analytics'
      }
    }
  }
  /**
   * DEPRECATED: Use searchProfile instead for better performance
   * This method now redirects to searchProfile for backward compatibility
   */
  async getProfile(username: string): Promise<BasicProfileResponse> {
    return this.searchProfile(username)
  }
  /**
   * Legacy method - now redirects to main getProfile method
   * @deprecated Use getProfile instead
   */
  async getProfileAnalysis(username: string): Promise<CompleteProfileResponse> {
    return this.getProfile(username)
  }
  /**
   * Legacy method - backend no longer supports separate refresh endpoint
   * Main endpoint always returns fresh data
   * @deprecated Use getProfile instead
   */
  async refreshProfileData(username: string): Promise<CompleteProfileResponse> {
    return this.getProfile(username)
  }
  /**
   * Hashtag analysis - REMOVED
   * This endpoint was removed in backend cleanup
   * @deprecated No longer available
   */
  async getHashtagAnalysis(hashtag: string): Promise<{ success: boolean; data?: any; error?: string }> {
    console.warn('⚠️ Hashtag analysis endpoint was removed in backend cleanup')
    return {
      success: false,
      error: 'Hashtag analysis is no longer available. Use main profile endpoint instead.'
    }
  }
  /**
   * Get profile image with enhanced format support and CORS proxy
   * Uses new profile_images array for HD images when available
   */
  getProfileImage(profile: InstagramProfile): string {
    const images = profile.profile_images || []
    const hdImage = images.find(img => img.type === 'hd')
    const standardImage = images.find(img => img.type === 'standard')
    const imageUrl = hdImage?.url || standardImage?.url || profile.profile_pic_url
    if (!imageUrl) return ''
    return imageUrl
  }
  /**
   * Get post image with enhanced format support and CORS proxy
   * Uses new post_images array
   */
  getPostImage(post: InstagramPost): string {
    const images = post.post_images || []
    const imageUrl = images[0]?.url || post.display_url
    if (!imageUrl) return ''
    return imageUrl
  }
  /**
   * NEW: Get posts for a profile with pagination
   * Uses: GET /api/instagram/profile/{username}/posts
   */
  async getPosts(username: string, limit: number = 20, offset: number = 0): Promise<PostsApiResponse> {
    const fullUrl = `${ENDPOINTS.profile.posts(username)}?limit=${limit}&offset=${offset}`;
    const completeUrl = `${this.baseURL}${fullUrl}`;
    try {
      const response = await this.makeRequest<PostsResponse>(
        fullUrl,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      // Handle specific posts access errors
      if (error.message.includes('profile_not_accessible') || 
          error.message.includes("You don't have access to posts") ||
          error.message.includes('search for this profile first')) {
        return {
          success: false,
          error: 'Please search for this profile first to unlock posts access'
        }
      }
      return {
        success: false,
        error: error.message || 'Failed to load posts'
      }
    }
  }

  /**
   * NEW: Refresh profile with AI analysis
   * Uses: POST /api/v1/ai/fix/profile/{username}
   */
  async refreshProfile(username: string): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: {
          username: string;
          refresh_performed: boolean;
          refresh_needed: boolean;
        };
        message: string;
      }>(
        `/api/v1/ai/fix/profile/${username}`,
        { method: 'POST' }
      )
      return {
        success: response.success,
        data: response.data,
        message: response.message
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to refresh profile'
      }
    }
  }

  /**
   * NEW: Get unlocked profiles for creators page
   * Uses: GET /api/v1/auth/unlocked-profiles
   */
  async getUnlockedProfiles(page: number = 1, pageSize: number = 20): Promise<UnlockedProfilesApiResponse> {
    try {
      const response = await this.makeRequest<UnlockedProfilesResponse>(
        `/api/v1/auth/unlocked-profiles?page=${page}&page_size=${pageSize}`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load unlocked profiles'
      }
    }
  }
  /**
   * NEW: Manual Engagement Calculation
   * Uses: POST /api/v1/engagement/calculate/profile/{username}
   * Purpose: Recalculate engagement from stored Decodo post data
   */
  async recalculateEngagement(username: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.makeRequest<{ message: string }>(
        `/api/v1/engagement/calculate/profile/${username}`,
        { method: 'POST' }
      )
      return {
        success: true,
        message: response.message || 'Engagement recalculated successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to recalculate engagement'
      }
    }
  }

  /**
   * NEW: Engagement Statistics
   * Uses: GET /api/v1/engagement/stats
   * Purpose: Shows calculation coverage and database stats
   */
  async getEngagementStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<any>(
        `/api/v1/engagement/stats`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get engagement stats'
      }
    }
  }

  /**
   * NEW: Get Profile Analysis Status (with job tracking)
   * Uses: GET /api/v1/ai/status/profile/{username}
   * Purpose: Check analysis status with job tracking info
   */
  async getProfileAnalysisStatus(username: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<any>(
        `/api/v1/ai/status/profile/${username}`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profile analysis status'
      }
    }
  }

  /**
   * NEW: Get Analysis Job Status
   * Uses: GET /api/v1/ai/analysis/status/{job_id}
   * Purpose: Track specific job progress
   */
  async getAnalysisJobStatus(jobId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<any>(
        `/api/v1/ai/analysis/status/${jobId}`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get job status'
      }
    }
  }

  /**
   * NEW: Detect Partial Data Issues (Batch Fix)
   * Uses: POST /api/v1/ai/fix/batch
   * Purpose: Detect and fix partial data corruption
   */
  async detectPartialDataIssues(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<any>(
        `/api/v1/ai/fix/batch`,
        { method: 'POST' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to detect partial data issues'
      }
    }
  }

  /**
   * NEW: Repair Profile Aggregation Data
   * Uses: POST /api/v1/ai/repair/profile-aggregation
   * Purpose: Fix partial data corruption
   */
  async repairProfileAggregation(profileIds: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const profileIdsParam = profileIds.join(',')
      const response = await this.makeRequest<any>(
        `/api/v1/ai/repair/profile-aggregation?profile_ids=${profileIdsParam}`,
        { method: 'POST' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to repair profile aggregation'
      }
    }
  }

  /**
   * NEW: Get System Health Status
   * Uses: GET /api/v1/ai/status/profile/{username}
   * Purpose: Check AI system health
   */
  async getAISystemHealth(username: string = 'default'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<any>(
        `/api/v1/ai/status/profile/${username}`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI system health'
      }
    }
  }

  /**
   * NEW: Get Detailed AI Insights for Profile
   * Uses: GET /api/v1/ai/profile/{username}/insights
   * Purpose: Detailed AI insights with processing status
   */
  async getProfileAIInsights(username: string): Promise<{ success: boolean; data?: AIInsights; error?: string }> {
    try {
      const response = await this.makeRequest<{ ai_insights: AIInsights }>(
        `/api/v1/ai/profile/${username}/insights`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response.ai_insights
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI insights'
      }
    }
  }

  /**
   * NEW: Comprehensive AI Profile Analysis
   * Uses: POST /api/v1/ai/fix/profile/{username}
   * Purpose: Complete AI analysis with full completion indicators
   */
  async triggerProfileAnalysis(username: string): Promise<AIAnalysisResponse> {
    try {
      const response = await this.makeRequest<AIAnalysisResponse>(
        `/api/v1/ai/fix/profile/${username}`,
        { method: 'POST' }
      )
      
      return response
    } catch (error: any) {
      // Return a properly formatted error response
      return {
        success: false,
        status: 'FAILED',
        analysis_complete: false,
        message: error.message || 'AI analysis failed',
        error: error.message || 'Failed to trigger AI analysis',
        completion_status: {
          all_steps_completed: false,
          posts_processing_done: false,
          profile_insights_done: false,
          database_updates_done: false,
          ready_for_display: false
        },
        frontend_actions: {
          can_refresh_profile: false,
          can_view_ai_insights: false,
          should_show_error_message: true,
          recommended_next_step: 'retry_analysis_later'
        }
      }
    }
  }

  /**
   * NEW: Analyze Individual Post
   * Uses: POST /api/v1/ai/analyze/post/{post_id}
   * Purpose: Trigger AI analysis for specific post
   */
  async analyzeIndividualPost(postId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<{
        post_id: string
        analysis: {
          ai_content_category: AIContentCategory
          ai_category_confidence: number
          ai_sentiment: AISentiment
          ai_sentiment_score: number
          ai_sentiment_confidence: number
          ai_language_code: AILanguageCode
          ai_language_confidence: number
          analysis_metadata: {
            processed_at: string
            processing_time_ms: number
          }
        }
      }>(
        `/api/v1/ai/analyze/post/${postId}`,
        { method: 'POST' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to analyze post'
      }
    }
  }

  /**
   * NEW: Get AI System Statistics
   * Uses: GET /api/v1/ai/analysis/stats
   * Purpose: Get overall AI system statistics
   */
  async getAIStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<{
        ai_analysis_stats: {
          posts: {
            total: number
            analyzed: number
            processing: number
            pending: number
            analysis_coverage: number
          }
          profiles: {
            total: number
            analyzed: number
            processing: number
            pending: number
            analysis_coverage: number
          }
          content_categories: Record<string, number>
          sentiment_distribution: {
            positive: number
            neutral: number
            negative: number
          }
          processing_queue: {
            active_analyses: number
            queue_depth: number
            average_processing_time: string
          }
        }
      }>(
        `/api/v1/ai/analysis/stats`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response.ai_analysis_stats
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI stats'
      }
    }
  }

  /**
   * NEW: AI Verification Endpoint - Verify AI analysis completion
   * Uses: GET /api/v1/ai/verify/{username}
   * Purpose: Check exact AI analysis status and sample real data
   */
  async verifyAIAnalysis(username: string): Promise<{ success: boolean; data?: AIVerificationResponse; error?: string }> {
    try {
      const response = await this.makeRequest<AIVerificationResponse>(
        `/api/v1/ai/verify/${username}`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify AI analysis'
      }
    }
  }

  /**
   * NEW: AI Status Monitoring - Check system health
   * Uses: GET /api/v1/ai/analysis/status  
   * Purpose: Monitor AI system status and processing capacity
   */
  async getAISystemStatus(): Promise<{ success: boolean; data?: AIStatusMonitoringResponse; error?: string }> {
    try {
      const response = await this.makeRequest<AIStatusMonitoringResponse>(
        `/api/v1/ai/analysis/status`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI system status'
      }
    }
  }

  /**
   * NEW: Get AI Models Status
   * Uses: GET /api/v1/ai/models/status
   * Purpose: Check AI service and models status
   */
  async getAIModelsStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest<{
        ai_service_initialized: boolean
        models_info: {
          initialized: boolean
          loaded_models: string[]
          device_info: {
            cuda_available: boolean
            cuda_device_count: number
          }
        }
        supported_features: {
          sentiment_analysis: boolean
          language_detection: boolean
          content_categorization: boolean
          profile_insights: boolean
        }
      }>(
        `/api/v1/ai/models/status`,
        { method: 'GET' }
      )
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI models status'
      }
    }
  }

  // Legacy compatibility methods - all redirect to main getProfile
  async getDecodoOnlyAnalysis(username: string): Promise<CompleteProfileResponse> {
    return this.getProfile(username)
  }
  async analyzeProfile(username: string): Promise<CompleteProfileResponse> {
    return this.getProfile(username)
  }
  async fetchProfileWithFallback(username: string): Promise<CompleteProfileResponse> {
    return this.getProfile(username)
  }
  // Legacy method for backward compatibility
  async getBasicProfile(username: string): Promise<BasicProfileResponse> {
    return this.getProfile(username)
  }
}
export const instagramApiService = new InstagramApiService()