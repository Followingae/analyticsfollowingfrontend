import { API_CONFIG, ENDPOINTS, REQUEST_HEADERS } from '@/config/api'
import { authService } from './authService'

// Updated to match actual backend response structure from Decodo
export interface ActualBackendResponse {
  profile: {
    username: string
    full_name: string
    biography?: string
    followers: number
    following: number
    posts_count: number
    is_verified: boolean
    is_private: boolean
    profile_pic_url: string
    external_url?: string
    engagement_rate: number
    avg_likes: number
    avg_comments: number
    avg_engagement: number
    follower_growth_rate?: number
    content_quality_score: number
    influence_score: number
    // Business & Professional Data
    is_business_account?: boolean
    is_professional_account?: boolean
    business_contact_method?: string
    business_email?: string
    business_phone_number?: string
    category_name?: string
    // Bio Links
    bio_links?: Array<{
      url: string
      title?: string
      type?: string
    }>
    // Content Features
    highlight_reel_count?: number
    edge_felix_video_timeline?: number
    has_clips?: boolean
    has_guides?: boolean
    has_ar_effects?: boolean
  }
  recent_posts: Array<{
    id: string
    shortcode: string
    taken_at_timestamp: number
    edge_liked_by: { count: number }
    edge_media_to_comment: { count: number }
    is_video: boolean
    video_view_count?: number
    caption?: string
    media_url?: string
  }>
  hashtag_analysis: any[]
  engagement_metrics: {
    like_rate: number
    comment_rate: number
    save_rate: number
    share_rate: number
    reach_rate: number
  }
  audience_insights: {
    primary_age_group: string
    gender_split: {
      female: number
      male: number
    }
    top_locations: string[]
    activity_times: string[]
    interests: string[]
  }
  competitor_analysis: {
    similar_accounts: any[]
    competitive_score: number
    market_position: string
    growth_opportunities: string[]
  }
  content_performance: {
    top_performing_content_types: any[]
    optimal_posting_frequency: string
    content_themes: any[]
    hashtag_effectiveness: any
  }
  content_strategy: {
    best_posting_hour: number
    content_type_distribution: {
      photos: number
      videos: number
      carousels: number
      reels: number
    }
    recommended_content_type: string
    posting_frequency_per_day: number
    avg_caption_length: number
    hashtag_strategy: {
      trending_hashtags: number
      niche_hashtags: number
      branded_hashtags: number
      location_hashtags: number
    }
  }
  best_posting_times: string[]
  growth_recommendations: string[]
  analysis_timestamp: string
  data_quality_score: number
  scraping_method: string
}

// Frontend-expected interface (kept for compatibility)
export interface BackendProfileResponse {
  username: string
  full_name: string
  bio?: string
  followers: number
  following?: number
  posts_count?: number
  engagement_rate: number
  influence_score: number
  is_verified: boolean
  is_private?: boolean
  profile_pic_url: string
  content_quality_score?: number
  quick_stats?: {
    followers_formatted: string
    engagement_level: string
    influence_level: string
  }
  // Business Contact Information
  business_info?: {
    is_business_account: boolean
    is_professional_account: boolean
    business_email?: string
    business_phone_number?: string
    business_contact_method?: string
    category_name?: string
  }
  // External Links
  external_links?: {
    primary_url?: string
    bio_links: Array<{
      url: string
      title?: string
      type?: string
    }>
    link_count: number
  }
  // Content Features
  content_features?: {
    highlight_reel_count: number
    reels_count: number
    has_clips: boolean
    has_guides: boolean
    has_ar_effects: boolean
  }
  // Bio Analysis
  bio_analysis?: {
    length: number
    emoji_count: number
    hashtag_count: number
    mention_count: number
    call_to_action_score: number
    brand_mentions: string[]
  }
  // Real Engagement Data
  real_engagement?: {
    actual_engagement_rate: number
    avg_likes_per_post: number
    avg_comments_per_post: number
    avg_video_views?: number
    content_mix: {
      video_percentage: number
      photo_percentage: number
    }
    posting_consistency_score: number
    recent_posts: Array<{
      id: string
      shortcode: string
      timestamp: number
      likes: number
      comments: number
      is_video: boolean
      video_views?: number
      engagement_rate: number
    }>
  }
  engagement_metrics?: {
    like_rate: number
    comment_rate: number
    share_rate: number
    save_rate: number
    reach_rate: number
  }
  audience_insights?: {
    primary_age_group: string
    gender_split: {
      male: number
      female: number
    }
    top_locations: string[]
    interests: string[]
    activity_times: string[]
  }
  content_strategy?: {
    content_mix: {
      photos: number
      videos: number
      carousels: number
      reels: number
    }
    primary_content_pillars: string[]
    engagement_tactics: string[]
  }
  growth_recommendations?: string[]
  competitor_analysis?: {
    market_position: string
    competitive_score: number
    growth_opportunities: string[]
  }
  best_posting_times?: string[]
}

export interface BasicProfileResponse {
  success: boolean
  data?: BackendProfileResponse
  error?: string
}

export interface CompleteProfileResponse {
  success: boolean
  data?: {
    profile: BackendProfileResponse
    engagement_metrics: BackendProfileResponse['engagement_metrics']
    audience_insights: BackendProfileResponse['audience_insights']
    content_strategy: BackendProfileResponse['content_strategy']
    growth_recommendations: BackendProfileResponse['growth_recommendations']
    competitor_analysis: BackendProfileResponse['competitor_analysis']
    best_posting_times: BackendProfileResponse['best_posting_times']
  }
  error?: string
}

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
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          ...authService.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (retryCount < this.retryAttempts && error instanceof Error) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeRequest<T>(url, options, retryCount + 1)
      }

      throw error
    }
  }

  // Basic profile info (2-5 seconds)
  async getBasicProfile(username: string): Promise<BasicProfileResponse> {
    console.log('Fetching basic profile:', `${this.baseURL}${ENDPOINTS.profile.basic(username)}`)
    
    try {
      const response = await this.makeRequest<ActualBackendResponse>(ENDPOINTS.profile.basic(username), {
        method: 'GET',
      })
      
      // Transform the backend response to frontend format
      const transformedData = this.transformBackendResponse(response)
      
      return {
        success: true,
        data: transformedData
      }
    } catch (error: any) {
      console.error('Basic profile fetch failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch basic profile'
      }
    }
  }

  // Full analysis with retry mechanism (8-25 seconds)
  async getProfileAnalysis(username: string): Promise<CompleteProfileResponse> {
    console.log('Fetching full profile analysis:', `${this.baseURL}${ENDPOINTS.profile.full(username)}`)
    
    try {
      const response = await this.makeRequest<ActualBackendResponse>(ENDPOINTS.profile.full(username), {
        method: 'GET',
      })
      
      console.log('Raw backend response:', response)
      
      // Transform the backend response to frontend format
      const transformedProfile = this.transformBackendResponse(response)
      
      return {
        success: true,
        data: {
          profile: transformedProfile,
          engagement_metrics: response.engagement_metrics,
          audience_insights: response.audience_insights,
          content_strategy: {
            content_mix: response.content_strategy.content_type_distribution,
            primary_content_pillars: response.content_performance.content_themes || [],
            engagement_tactics: [
              "Use trending hashtags",
              "Post during peak hours", 
              "Create engaging captions",
              "Use Stories and Reels"
            ] // Derived from best practices
          },
          growth_recommendations: response.growth_recommendations,
          competitor_analysis: response.competitor_analysis,
          best_posting_times: response.best_posting_times
        }
      }
    } catch (error: any) {
      console.error('Full profile analysis failed:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        name: error.name,
        url: `${this.baseURL}${ENDPOINTS.profile.full(username)}`
      })
      
      let errorMessage = 'Failed to fetch profile analysis'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out - please try again'
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Network error - please check your connection'
      } else if (error.message?.includes('HTTP')) {
        errorMessage = `Backend error: ${error.message}`
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }


  // Refresh profile data (bypasses cache)
  async refreshProfileData(username: string): Promise<CompleteProfileResponse> {
    console.log('Refreshing profile data:', `${this.baseURL}${ENDPOINTS.profile.refresh(username)}`)
    
    try {
      const response = await this.makeRequest<ActualBackendResponse>(ENDPOINTS.profile.refresh(username), {
        method: 'POST',
      })
      
      // Transform the backend response to frontend format
      const transformedProfile = this.transformBackendResponse(response)
      
      return {
        success: true,
        data: {
          profile: transformedProfile,
          engagement_metrics: response.engagement_metrics,
          audience_insights: response.audience_insights,
          content_strategy: {
            content_mix: response.content_strategy.content_type_distribution,
            primary_content_pillars: response.content_performance.content_themes || [],
            engagement_tactics: [
              "Use trending hashtags",
              "Post during peak hours", 
              "Create engaging captions",
              "Use Stories and Reels"
            ]
          },
          growth_recommendations: response.growth_recommendations,
          competitor_analysis: response.competitor_analysis,
          best_posting_times: response.best_posting_times
        }
      }
    } catch (error: any) {
      console.error('Profile refresh failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to refresh profile data'
      }
    }
  }

  // Hashtag analysis
  async getHashtagAnalysis(hashtag: string): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log('Fetching hashtag analysis:', `${this.baseURL}${ENDPOINTS.hashtag.analysis(hashtag)}`)
    
    try {
      const response = await this.makeRequest<any>(ENDPOINTS.hashtag.analysis(hashtag), {
        method: 'GET',
      })
      
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      console.error('Hashtag analysis failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch hashtag analysis'
      }
    }
  }

  // Transform backend response to frontend format
  private transformBackendResponse(response: ActualBackendResponse): BackendProfileResponse {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
      return num.toString()
    }

    const getEngagementLevel = (rate: number) => {
      if (rate > 6) return 'Excellent'
      if (rate > 3) return 'Good'
      if (rate > 1) return 'Average'
      return 'Low'
    }

    const getInfluenceLevel = (score: number) => {
      if (score > 8) return 'High Influence'
      if (score > 6) return 'Moderate Influence'
      if (score > 4) return 'Growing Influence'
      return 'Building Influence'
    }

    // Analyze bio content
    const analyzeBio = (bio: string = '') => {
      const emojiRegex = /\p{Emoji}/gu
      const hashtagRegex = /#\w+/g
      const mentionRegex = /@\w+/g
      const brandKeywords = ['brand', 'sponsored', 'partner', 'collab', 'ambassador', 'founder', 'ceo', 'co-founder']
      
      const emojis = bio.match(emojiRegex) || []
      const hashtags = bio.match(hashtagRegex) || []
      const mentions = bio.match(mentionRegex) || []
      
      const brandMentions = brandKeywords.filter(keyword => 
        bio.toLowerCase().includes(keyword)
      )
      
      const callToActionWords = ['link', 'bio', 'shop', 'buy', 'visit', 'check', 'click', 'swipe', 'dm', 'contact']
      const callToActionScore = callToActionWords.reduce((score, word) => 
        bio.toLowerCase().includes(word) ? score + 1 : score, 0
      )
      
      return {
        length: bio.length,
        emoji_count: emojis.length,
        hashtag_count: hashtags.length,
        mention_count: mentions.length,
        call_to_action_score: Math.min(callToActionScore * 2, 10), // Score out of 10
        brand_mentions: brandMentions
      }
    }

    // Calculate real engagement metrics from posts
    const calculateRealEngagement = (posts: typeof response.recent_posts) => {
      if (!posts || posts.length === 0) {
        return {
          actual_engagement_rate: 0,
          avg_likes_per_post: 0,
          avg_comments_per_post: 0,
          avg_video_views: 0,
          content_mix: { video_percentage: 0, photo_percentage: 100 },
          posting_consistency_score: 0,
          recent_posts: []
        }
      }

      const totalLikes = posts.reduce((sum, post) => sum + (post.edge_liked_by?.count || 0), 0)
      const totalComments = posts.reduce((sum, post) => sum + (post.edge_media_to_comment?.count || 0), 0)
      const totalEngagement = totalLikes + totalComments
      
      const videoPosts = posts.filter(post => post.is_video)
      const avgVideoViews = videoPosts.length > 0 
        ? videoPosts.reduce((sum, post) => sum + (post.video_view_count || 0), 0) / videoPosts.length 
        : 0
      
      const videoPercentage = (videoPosts.length / posts.length) * 100
      const photoPercentage = 100 - videoPercentage
      
      // Calculate posting consistency (based on time gaps between posts)
      const timestamps = posts.map(post => post.taken_at_timestamp).sort((a, b) => b - a)
      const gaps = []
      for (let i = 1; i < timestamps.length; i++) {
        gaps.push(timestamps[i - 1] - timestamps[i])
      }
      const avgGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0
      const consistencyScore = avgGap > 0 ? Math.min(10, (7 * 24 * 60 * 60) / (avgGap / 1000) * 10) : 0 // Score based on weekly posting
      
      const actualEngagementRate = response.profile.followers > 0 
        ? (totalEngagement / posts.length / response.profile.followers) * 100 
        : 0
      
      return {
        actual_engagement_rate: actualEngagementRate,
        avg_likes_per_post: totalLikes / posts.length,
        avg_comments_per_post: totalComments / posts.length,
        avg_video_views: avgVideoViews,
        content_mix: {
          video_percentage: videoPercentage,
          photo_percentage: photoPercentage
        },
        posting_consistency_score: Math.round(consistencyScore),
        recent_posts: posts.map(post => ({
          id: post.id,
          shortcode: post.shortcode,
          timestamp: post.taken_at_timestamp,
          likes: post.edge_liked_by?.count || 0,
          comments: post.edge_media_to_comment?.count || 0,
          is_video: post.is_video,
          video_views: post.video_view_count,
          engagement_rate: response.profile.followers > 0 
            ? ((post.edge_liked_by?.count || 0) + (post.edge_media_to_comment?.count || 0)) / response.profile.followers * 100
            : 0
        }))
      }
    }

    const bioAnalysis = analyzeBio(response.profile.biography)
    const realEngagement = calculateRealEngagement(response.recent_posts)

    return {
      username: response.profile.username,
      full_name: response.profile.full_name,
      bio: response.profile.biography,
      followers: response.profile.followers,
      following: response.profile.following,
      posts_count: response.profile.posts_count,
      engagement_rate: response.profile.engagement_rate,
      influence_score: response.profile.influence_score,
      is_verified: response.profile.is_verified,
      is_private: response.profile.is_private,
      profile_pic_url: response.profile.profile_pic_url,
      content_quality_score: response.profile.content_quality_score,
      quick_stats: {
        followers_formatted: formatNumber(response.profile.followers),
        engagement_level: getEngagementLevel(response.profile.engagement_rate),
        influence_level: getInfluenceLevel(response.profile.influence_score)
      },
      // Business Contact Information
      business_info: {
        is_business_account: response.profile.is_business_account || false,
        is_professional_account: response.profile.is_professional_account || false,
        business_email: response.profile.business_email,
        business_phone_number: response.profile.business_phone_number,
        business_contact_method: response.profile.business_contact_method,
        category_name: response.profile.category_name
      },
      // External Links Analysis
      external_links: {
        primary_url: response.profile.external_url,
        bio_links: response.profile.bio_links || [],
        link_count: (response.profile.external_url ? 1 : 0) + (response.profile.bio_links?.length || 0)
      },
      // Content Features
      content_features: {
        highlight_reel_count: response.profile.highlight_reel_count || 0,
        reels_count: response.profile.edge_felix_video_timeline || 0,
        has_clips: response.profile.has_clips || false,
        has_guides: response.profile.has_guides || false,
        has_ar_effects: response.profile.has_ar_effects || false
      },
      // Bio Analysis
      bio_analysis: bioAnalysis,
      // Real Engagement Data
      real_engagement: realEngagement,
      engagement_metrics: response.engagement_metrics,
      audience_insights: response.audience_insights,
      content_strategy: {
        content_mix: response.content_strategy.content_type_distribution,
        primary_content_pillars: response.content_performance.content_themes || [],
        engagement_tactics: [
          "Use trending hashtags",
          "Post during peak hours", 
          "Create engaging captions",
          "Use Stories and Reels"
        ] // Derived from best practices
      },
      growth_recommendations: response.growth_recommendations,
      competitor_analysis: response.competitor_analysis,
      best_posting_times: response.best_posting_times
    }
  }

  // Legacy compatibility methods
  async getDecodoOnlyAnalysis(username: string): Promise<CompleteProfileResponse> {
    return this.getProfileAnalysis(username)
  }

  async analyzeProfile(username: string): Promise<CompleteProfileResponse> {
    return this.getProfileAnalysis(username)
  }

  async fetchProfileWithFallback(username: string): Promise<CompleteProfileResponse> {
    return this.getProfileAnalysis(username)
  }
}

export const instagramApiService = new InstagramApiService()