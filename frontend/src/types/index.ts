export interface InstagramProfile {
  username: string
  full_name: string
  biography: string
  followers: number
  following: number
  posts_count: number
  is_verified: boolean
  is_private: boolean
  profile_pic_url: string | null
  external_url: string | null
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  avg_engagement: number
  content_quality_score: number
  influence_score: number
  follower_growth_rate: number | null
}

export interface EngagementMetrics {
  like_rate: number
  comment_rate: number
  save_rate: number
  share_rate: number
  reach_rate: number
}

export interface AudienceInsights {
  primary_age_group: string
  gender_split: {
    female: number
    male: number
  }
  top_locations: string[]
  activity_times: string[]
  interests: string[]
}

export interface CompetitorAnalysis {
  similar_accounts: string[]
  competitive_score: number
  market_position: string
  growth_opportunities: string[]
}

export interface ContentPerformance {
  top_performing_content_types: string[]
  optimal_posting_frequency: string
  content_themes: string[]
  hashtag_effectiveness: {
    trending: number
    niche: number
    branded: number
  }
}

export interface ContentStrategy {
  primary_content_pillars: string[]
  posting_schedule: {
    monday: string[]
    tuesday: string[]
    wednesday: string[]
    thursday: string[]
    friday: string[]
    saturday: string[]
    sunday: string[]
  }
  content_mix: {
    photos: number
    videos: number
    carousels: number
    reels: number
  }
  hashtag_strategy: {
    trending_hashtags: number
    niche_hashtags: number
    branded_hashtags: number
    location_hashtags: number
  }
  engagement_tactics: string[]
}

export interface Post {
  id: string
  caption: string
  likes: number
  comments: number
  views?: number
  engagement_rate: number
  media_url: string
  media_type: 'photo' | 'video' | 'carousel'
  timestamp: string
}

export interface HashtagAnalysis {
  hashtag: string
  usage_count: number
  difficulty_score: number
  performance_score: number
  related_hashtags: string[]
}

export interface CompleteProfileResponse {
  profile: InstagramProfile
  engagement_metrics: EngagementMetrics
  audience_insights: AudienceInsights
  competitor_analysis: CompetitorAnalysis
  content_performance: ContentPerformance
  content_strategy: ContentStrategy
  best_posting_times: string[]
  growth_recommendations: string[]
  analysis_timestamp: string
  data_quality_score: number
  scraping_method: string
}

export interface AnalyticsData {
  profile: InstagramProfile
  recent_posts: Post[]
  hashtag_analysis: HashtagAnalysis[]
  content_strategy: ContentStrategy
  best_posting_times: string[]
  audience_insights: AudienceInsights
  growth_recommendations: string[]
  analysis_timestamp: string
  data_quality_score: number
}

export interface SentimentAnalysis {
  overall_sentiment: number
  confidence: number
  engagement_sentiment: number
  audience_sentiment: number
  content_sentiment: number
  growth_sentiment: number
  insights: string[]
}

export interface DiscoveryFilters extends Record<string, unknown> {
  follower_count_min?: number
  follower_count_max?: number
  engagement_rate_min?: number
  engagement_rate_max?: number
  niche?: string
  location?: string
}

export interface CreatorProfile {
  username: string
  full_name: string
  followers: number
  engagement_rate: number
  profile_pic_url: string
  categories: string[]
  location: string
  is_verified: boolean
  unlocked: boolean
}

export interface HashtagOpportunity {
  hashtag: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  posts_count: number
  avg_engagement: number
  competition_level: number
  opportunity_score: number
}