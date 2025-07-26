export interface ProfileMetrics {
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

export interface ContentStrategy {
  best_posting_hour: number
  content_type_distribution: {
    photo: number
    video: number
  }
  recommended_content_type: string
  posting_frequency_per_day: number
  avg_caption_length: number
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

export interface AnalyticsData {
  profile: ProfileMetrics
  recent_posts: Post[]
  hashtag_analysis: HashtagAnalysis[]
  content_strategy: ContentStrategy
  best_posting_times: string[]
  audience_insights: Record<string, unknown>
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
  niche: string
  is_verified: boolean
}

export interface HashtagOpportunity {
  hashtag: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  posts_count: number
  avg_engagement: number
  competition_level: number
  opportunity_score: number
}