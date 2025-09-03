/**
 * 🎯 COMPREHENSIVE CREATOR DATA TYPES
 * Matches backend specification for Phase 1 & Phase 2 data display
 * Updated to ensure 100% backend data consumption
 */

// ========================================
// PHASE 1: IMMEDIATE DISPLAY DATA
// ========================================

export interface ProfileHeader {
  username: string
  full_name: string
  profile_pic_url: string
  is_verified: boolean
  followers_count: number
  following_count: number
  posts_count: number
  engagement_rate?: number | null  // Optional since new API might not provide it initially
  category_name?: string  // Also making this optional since it might not always be present
  id?: string  // Adding id field that's referenced in ProfileHeaderCard
}

export interface QuickMetrics {
  avg_likes_per_post: number
  avg_comments_per_post: number
  posting_frequency: string
  last_post_date: string
  account_type: string
}

export interface ContactInfo {
  business_email: string | null
  business_phone: string | null
  external_url: string | null
  location: string | null
}

export interface RecentPostPreview {
  post_id: string
  thumbnail_url: string
  likes_count: number
  comments_count: number
  posted_at: string
  caption_preview: string
}

export interface Phase1Data {
  profile_header: ProfileHeader
  quick_metrics: QuickMetrics
  contact_info: ContactInfo
  recent_posts: RecentPostPreview[]
}

// ========================================
// PHASE 2: AI ANALYTICS DATA
// ========================================

export interface ContentAnalysis {
  primary_content_type: string
  content_distribution: Record<string, number>
  content_consistency_score: number
  brand_safety_score: number
}

export interface SentimentAnalysis {
  overall_sentiment: 'Positive' | 'Negative' | 'Neutral'
  sentiment_score: number
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
  brand_friendliness: number
}

export interface AudienceInsights {
  estimated_demographics: {
    age_groups: Record<string, number>
    gender_split: {
      female: number
      male: number
    }
    top_locations: string[]
  }
}

export interface LanguageAnalysis {
  primary_language: string
  language_distribution: Record<string, number>
  target_markets: string[]
  multilingual_score: number
}

export interface PartnershipPotential {
  overall_score: number
  scoring_breakdown: {
    engagement_quality: number
    audience_alignment: number
    content_consistency: number
    brand_safety: number
    posting_regularity: number
  }
  recommended_budget: string
  best_collaboration_types: string[]
}

export interface PostWithAI {
  post_id: string
  media_url: string
  caption: string
  likes_count: number
  comments_count: number
  posted_at: string
  // AI Analysis per post
  ai_content_category: string
  ai_sentiment: 'positive' | 'negative' | 'neutral'
  ai_sentiment_score: number
  ai_language: string
  engagement_performance: 'above_average' | 'average' | 'below_average'
}

export interface EngagementTrends {
  trend_direction: 'increasing' | 'decreasing' | 'stable'
  monthly_growth: number
  peak_hours: number[]
  optimal_posting_days: string[]
}

export interface ContentPerformance {
  best_performing_type: string
  worst_performing_type: string
  viral_potential_score: number
}

export interface CompetitiveAnalysis {
  market_position: string
  similar_creators: string[]
  competitive_advantage: string
}

export interface AdvancedMetrics {
  engagement_trends: EngagementTrends
  content_performance: ContentPerformance
  competitive_analysis: CompetitiveAnalysis
}

export interface Phase2Data {
  content_analysis: ContentAnalysis
  sentiment_analysis: SentimentAnalysis
  audience_insights: AudienceInsights
  language_analysis: LanguageAnalysis
  partnership_potential: PartnershipPotential
  all_posts: PostWithAI[]
  advanced_metrics: AdvancedMetrics
}

// ========================================
// COMPLETE CREATOR PROFILE
// ========================================

export interface CompleteCreatorProfile {
  phase1: Phase1Data
  phase2?: Phase2Data // Optional until AI analysis completes
  analysis_status: 'pending' | 'processing' | 'completed' | 'error'
  loading_progress?: {
    completed: number
    total: number
    percentage: number
    current_step: string
  }
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface CreatorSearchResponse {
  success: boolean
  data?: Phase1Data
  error?: string
}

export interface CreatorDetailedResponse {
  success: boolean
  data?: Phase2Data
  error?: string
}

export interface CreatorStatusResponse {
  success: boolean
  data?: {
    analysis_status: 'pending' | 'processing' | 'completed' | 'error'
    progress?: {
      completed: number
      total: number
      percentage: number
    }
  }
  error?: string
}