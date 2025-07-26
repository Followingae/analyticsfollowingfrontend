const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export interface ProfileData {
  profile: {
    username: string
    full_name: string
    biography: string
    followers: number
    following: number
    posts_count: number
    is_verified: boolean
    is_private: boolean
    profile_pic_url: string
    external_url: string
    engagement_rate: number
    avg_likes: number
    avg_comments: number
    avg_engagement: number
    follower_growth_rate: number | null
    content_quality_score: number | null
    influence_score: number
  }
  recent_posts: unknown[]
  hashtag_analysis: unknown[]
  content_strategy: {
    best_posting_hour: number
    content_type_distribution: {
      photo: number
      video: number
    }
    recommended_content_type: string
    posting_frequency_per_day: number
    avg_caption_length: number
  }
  best_posting_times: string[]
  audience_insights: Record<string, unknown>
  growth_recommendations: string[]
  analysis_timestamp: string
  data_quality_score: number
}

export interface AnalyticsResponse {
  success: boolean
  data: ProfileData
  error?: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE
  }

  async fetchProfile(username: string, useSmartProxy = false): Promise<AnalyticsResponse> {
    try {
      const endpoint = useSmartProxy 
        ? `/api/v1/instagram/profile/${username}`
        : `/api/v1/inhouse/instagram/profile/${username}`
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { 
        success: false, 
        data: {} as ProfileData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async fetchProfileWithFallback(username: string): Promise<AnalyticsResponse> {
    // Try in-house scraper first
    const inhouseResult = await this.fetchProfile(username, false)
    if (inhouseResult.success) {
      return inhouseResult
    }

    console.warn('In-house scraper failed, trying SmartProxy:', inhouseResult.error)
    
    // Fallback to SmartProxy
    const smartproxyResult = await this.fetchProfile(username, true)
    if (smartproxyResult.success) {
      return smartproxyResult
    }

    return {
      success: false,
      data: {} as ProfileData,
      error: 'Both scrapers failed to fetch profile data'
    }
  }

  async fetchBasicProfile(username: string, useSmartProxy = false): Promise<unknown> {
    try {
      const endpoint = useSmartProxy
        ? `/api/v1/instagram/profile/${username}/basic`
        : `/api/v1/inhouse/instagram/profile/${username}/basic`
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching basic profile:', error)
      throw error
    }
  }

  async testConnection(useSmartProxy = false): Promise<unknown> {
    try {
      const endpoint = useSmartProxy 
        ? '/api/v1/test-connection'
        : '/api/v1/inhouse/test'
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      return await response.json()
    } catch (error) {
      console.error('Error testing connection:', error)
      throw error
    }
  }

  async fetchHealthCheck(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching health check:', error)
      throw error
    }
  }

  async batchAnalysis(usernames: string[]): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/batch/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernames }),
      })
      return await response.json()
    } catch (error) {
      console.error('Error performing batch analysis:', error)
      throw error
    }
  }

  async discoverByHashtags(hashtags: string[], filters: Record<string, unknown> = {}): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/discovery/hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtags, filters }),
      })
      return await response.json()
    } catch (error) {
      console.error('Error discovering by hashtags:', error)
      throw error
    }
  }

  async analyzeHashtag(hashtag: string): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hashtags/${hashtag}/analysis`)
      return await response.json()
    } catch (error) {
      console.error('Error analyzing hashtag:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
export default apiService