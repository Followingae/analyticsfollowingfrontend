// API Response Interfaces - Based on COMPREHENSIVE_FRONTEND_INTEGRATION_GUIDE.md

// 1. Profile Search/Analysis Response (Updated for new API structure)
export interface ProfileSearchResponse {
  success: boolean
  profile: {
    username: string
    full_name: string | null
    biography: string | null
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
    profile_pic_url: string | null
    ai_analysis: {
      available: boolean  // NEW: indicates if AI data exists
      primary_content_type: string | null
      content_distribution: Record<string, number> | null
      avg_sentiment_score: number | null
      language_distribution: Record<string, number> | null
      content_quality_score: number | null
      profile_analyzed_at: string | null
    }
  }
  message: string
  cached: boolean  // ⚠️ CRITICAL: Shows if from database (true) or new (false)
}

// 2. Profile Get Response  
export interface ProfileGetResponse {
  success: boolean
  profile: {
    username: string
    full_name: string | null
    biography: string | null
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
    profile_pic_url: string | null
  }
  message: string
}

// 3. CDN Media Response
export interface CDNMediaResponse {
  profile_id: string
  avatar: {
    "256": string  // CDN URL or placeholder
    "512": string  // CDN URL or placeholder
    available: boolean
    placeholder: boolean
  }
  posts: Array<{
    mediaId: string
    thumb: {
      "256": string  // CDN URL or placeholder
      "512": string  // CDN URL or placeholder
    }
    available: boolean
    placeholder: boolean
    processing_status: string
  }>
  processing_status: {
    queued: boolean
    total_assets: number
    completed_assets: number
    completion_percentage: number
  }
  cdn_info: {
    base_url: string
    cache_ttl: string
    formats_available: string[]
    sizes_available: number[]
  }
}

// 4. System Stats Response
export interface SystemStatsResponse {
  success: boolean
  stats: {
    profiles: {
      total: number
      with_ai_analysis: number
      ai_completion_rate: string
    }
    posts: {
      total: number
      with_ai_analysis: number
      ai_completion_rate: string
    }
    system: {
      status: string
      ai_system: string
    }
  }
  message: string
}