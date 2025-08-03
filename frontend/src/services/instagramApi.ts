import { API_CONFIG, ENDPOINTS, REQUEST_HEADERS, getAuthHeaders } from '@/config/api'
import { authService } from './authService'
import { fetchWithAuth } from '@/utils/apiInterceptor'

/**
 * PRODUCTION READY API INTERFACES
 * Updated according to FRONTEND_HANDOVER.md (July 31, 2025)
 * Backend Version: Production Ready (Post-Audit)
 */

// Main profile interface matching new backend structure
export interface InstagramProfile {
  // Core Profile Information
  username: string
  full_name: string
  biography: string
  external_url: string
  profile_pic_url: string
  profile_pic_url_hd: string
  
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
  
  // Business Information (NEW!)
  business_category_name: string
  business_email: string
  business_phone_number: string
  
  // Features (NEW!)
  has_ar_effects: boolean
  has_clips: boolean
  has_guides: boolean
  has_channel: boolean
  
  // AI & Special Features (NEW!)
  ai_agent_type: string
  ai_agent_owner_username: string
  transparency_label: string
  
  // Analytics (Enhanced)
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  influence_score: number
  content_quality_score: number
  
  // Media Storage (NEW!)
  profile_images: Array<{url: string, type: string, size: string}>
  profile_thumbnails: Array<{url: string, width: number, height: number}>
  
  // Data Management
  data_quality_score: number
  last_refreshed: string
  refresh_count: number
}

// Post data interface (NEW!)
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

// Main API response structure - Updated for backend v2.0.1
export interface ProfileResponse {
  profile: InstagramProfile
  analytics: {
    engagement_rate: number
    influence_score: number
    data_quality_score: number
  }
  meta: {
    analysis_timestamp: string
    user_has_access: boolean
    access_expires_in_days: number
    data_source: string
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

// Posts API response interface - Updated to match actual backend response
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
    note: string
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
      console.log(`⏱️ Request timeout triggered after ${timeoutMs}ms for ${url}`)
      controller.abort()
    }, timeoutMs)

    try {
      console.log(`🔗 Making request to: ${this.baseURL}${url}`)
      console.log(`🔗 Headers:`, { ...getAuthHeaders(), ...options.headers })
      
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

      console.log(`📡 Response status: ${response.status}`)
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers))

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error: ${response.status} - ${errorText}`)
        
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
      console.log(`📡 Raw response text:`, responseText.substring(0, 500))
      
      if (!responseText) {
        throw new Error('Empty response body received from server')
      }
      
      try {
        const parsedResponse = JSON.parse(responseText)
        console.log(`📡 Parsed response structure:`, {
          hasProfile: !!parsedResponse?.profile,
          hasPosts: !!parsedResponse?.posts,
          hasAccess: parsedResponse?.has_access,
          topLevelKeys: Object.keys(parsedResponse || {}),
          profileKeys: parsedResponse?.profile ? Object.keys(parsedResponse.profile) : null
        })
        return parsedResponse
      } catch (parseError) {
        console.error(`❌ JSON parse error:`, parseError)
        console.error(`❌ Raw response that failed to parse:`, responseText)
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}...`)
      }
    } catch (error) {
      clearTimeout(timeoutId)

      console.error(`❌ Request failed:`, error)

      // Retry logic (skip retries for AbortError/timeouts)
      if (retryCount < this.retryAttempts && error instanceof Error && error.name !== 'AbortError') {
        console.log(`🔄 Retrying request (${retryCount + 1}/${this.retryAttempts}) in ${this.retryDelay * (retryCount + 1)}ms`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeRequest<T>(url, options, retryCount + 1, customTimeout)
      }

      // Enhance error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Check if this was a manual abort or timeout
          const timeoutMsg = `Request timed out after ${timeoutMs}ms. The server may be taking too long to respond.`
          console.log(`⏱️ ${timeoutMsg}`)
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
    console.log('🔍 SEARCH: Starting profile search for:', username)
    console.log('🔍 SEARCH: Using endpoint:', `${this.baseURL}/api/v1/instagram/profile/${username}`)
    console.log('⏱️ SEARCH: Timeout set to:', API_CONFIG.SEARCH_TIMEOUT, 'ms (2 minutes)')
    console.log('⏱️ SEARCH: Expected response time: 15-30 seconds (first time) or 0.5 seconds (cached)')
    console.log('🔄 SEARCH: Starting request at:', new Date().toISOString())
    
    try {
      const response = await this.makeRequest<ProfileResponse>(ENDPOINTS.profile.search(username), {
        method: 'GET',
      }, 0, API_CONFIG.SEARCH_TIMEOUT)
      
      console.log('✅ SEARCH: Raw response received:', response)
      
      // Validate response structure
      if (!response) {
        throw new Error('Empty response received from backend')
      }
      
      if (!response.profile) {
        console.error('❌ SEARCH: No profile data in response:', response)
        throw new Error('No profile data received from backend')
      }
      
      console.log('✅ SEARCH: Profile data received:', {
        username: response.profile.username,
        hasAccess: response.meta?.user_has_access,
        postsCount: response.posts?.length || 0,
        isNewProfile: !response.profile.last_refreshed
      })
      
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('❌ SEARCH: Profile search failed:', error)
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
    console.log('📊 ANALYTICS: Loading analytics for:', username)
    console.log('📊 ANALYTICS: Using endpoint:', `${this.baseURL}/api/v1/instagram/profile/${username}/analytics`)
    console.log('⏱️ ANALYTICS: Expected response time: ~0.5 seconds (DB only)')
    console.log('🔄 ANALYTICS: Starting request at:', new Date().toISOString())
    
    try {
      const response = await this.makeRequest<ProfileResponse>(ENDPOINTS.profile.analytics(username), {
        method: 'GET',
      }, 0, API_CONFIG.ANALYTICS_TIMEOUT)
      
      console.log('✅ ANALYTICS: Raw response received:', response)
      
      // Validate response structure
      if (!response) {
        throw new Error('Empty response received from backend')
      }
      
      if (!response.profile) {
        console.error('❌ ANALYTICS: No profile data in response:', response)
        throw new Error('No profile data received from backend')
      }
      
      console.log('✅ ANALYTICS: Analytics data received instantly:', {
        username: response.profile.username,
        hasAccess: response.meta?.user_has_access,
        postsCount: response.posts?.length || 0
      })
      
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('❌ ANALYTICS: Analytics fetch failed:', error)
      
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
    console.log('⚠️ DEPRECATED: getProfile called, redirecting to searchProfile')
    return this.searchProfile(username)
  }

  /**
   * Legacy method - now redirects to main getProfile method
   * @deprecated Use getProfile instead
   */
  async getProfileAnalysis(username: string): Promise<CompleteProfileResponse> {
    console.log('⚠️ getProfileAnalysis is deprecated, using getProfile instead')
    return this.getProfile(username)
  }


  /**
   * Legacy method - backend no longer supports separate refresh endpoint
   * Main endpoint always returns fresh data
   * @deprecated Use getProfile instead
   */
  async refreshProfileData(username: string): Promise<CompleteProfileResponse> {
    console.log('⚠️ refreshProfileData is deprecated, using getProfile instead')
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
    
    if (!imageUrl) return '/placeholder-avatar.svg'
    
    // Use proxy for Instagram URLs to bypass CORS
    if (imageUrl.includes('cdninstagram.com') || imageUrl.includes('scontent-')) {
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    }
    
    return imageUrl
  }

  /**
   * Get post image with enhanced format support and CORS proxy
   * Uses new post_images array
   */
  getPostImage(post: InstagramPost): string {
    const images = post.post_images || []
    const imageUrl = images[0]?.url || post.display_url
    
    if (!imageUrl) return '/placeholder-post.png'
    
    // Use proxy for Instagram URLs to bypass CORS
    if (imageUrl.includes('cdninstagram.com') || imageUrl.includes('scontent-')) {
      return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    }
    
    return imageUrl
  }

  /**
   * NEW: Get posts for a profile with pagination
   * Uses: GET /api/instagram/profile/{username}/posts
   */
  async getPosts(username: string, limit: number = 20, offset: number = 0): Promise<PostsApiResponse> {
    const fullUrl = `${ENDPOINTS.profile.posts(username)}?limit=${limit}&offset=${offset}`;
    const completeUrl = `${this.baseURL}${fullUrl}`;
    
    console.log('📸 POSTS: ===========================================')
    console.log('📸 POSTS: Starting posts fetch')
    console.log('📸 POSTS: Username:', username)
    console.log('📸 POSTS: Parameters:', { limit, offset })
    console.log('📸 POSTS: Endpoint function result:', ENDPOINTS.profile.posts(username))
    console.log('📸 POSTS: Full URL path:', fullUrl)
    console.log('📸 POSTS: Complete URL:', completeUrl)
    console.log('📸 POSTS: Base URL:', this.baseURL)
    console.log('📸 POSTS: Auth headers:', getAuthHeaders())
    console.log('📸 POSTS: ===========================================')
    
    try {
      const response = await this.makeRequest<PostsResponse>(
        fullUrl,
        { method: 'GET' }
      )
      
      console.log('✅ POSTS: Raw response received:', response)
      console.log('✅ POSTS: Response type:', typeof response)
      console.log('✅ POSTS: Response keys:', Object.keys(response || {}))
      
      if (response) {
        console.log('✅ POSTS: Profile data:', response.profile)
        console.log('✅ POSTS: Posts array:', response.posts)
        console.log('✅ POSTS: Posts count:', response.posts?.length || 0)
        console.log('✅ POSTS: Pagination:', response.pagination)
        console.log('✅ POSTS: Meta:', response.meta)
      }
      
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('❌ POSTS: Exception caught:', error)
      console.error('❌ POSTS: Error message:', error.message)
      console.error('❌ POSTS: Error stack:', error.stack)
      console.error('❌ POSTS: Error type:', typeof error)
      console.error('❌ POSTS: Error instanceof Error:', error instanceof Error)
      
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
   * NEW: Get unlocked profiles for creators page
   * Uses: GET /api/v1/auth/unlocked-profiles
   */
  async getUnlockedProfiles(page: number = 1, pageSize: number = 20): Promise<UnlockedProfilesApiResponse> {
    console.log('👥 UNLOCKED: Starting unlocked profiles fetch')
    console.log('👥 UNLOCKED: Parameters:', { page, pageSize })
    console.log('👥 UNLOCKED: Endpoint:', `${this.baseURL}/api/v1/auth/unlocked-profiles?page=${page}&page_size=${pageSize}`)
    
    try {
      const response = await this.makeRequest<UnlockedProfilesResponse>(
        `/api/v1/auth/unlocked-profiles?page=${page}&page_size=${pageSize}`,
        { method: 'GET' }
      )
      
      console.log('✅ UNLOCKED: Raw response received:', response)
      console.log('✅ UNLOCKED: Response type:', typeof response)
      console.log('✅ UNLOCKED: Response keys:', Object.keys(response || {}))
      
      if (response) {
        console.log('✅ UNLOCKED: Profiles array:', response.profiles)
        console.log('✅ UNLOCKED: Profiles count:', response.profiles?.length || 0)
        console.log('✅ UNLOCKED: Pagination:', response.pagination)
        console.log('✅ UNLOCKED: Meta:', response.meta)
      }
      
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('❌ UNLOCKED: Exception caught:', error)
      console.error('❌ UNLOCKED: Error message:', error.message)
      console.error('❌ UNLOCKED: Error stack:', error.stack)
      
      return {
        success: false,
        error: error.message || 'Failed to load unlocked profiles'
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