/**
 * 🧠 CREATOR TYPES WITH AI INSIGHTS
 * Enhanced TypeScript definitions for the new Creator API system
 */

// ========================================
// AI ANALYSIS TYPES
// ========================================

/**
 * Content categories supported by AI analysis (20 categories)
 */
export type ContentCategory = 
  | 'Fashion & Beauty'
  | 'Food & Drink'
  | 'Travel & Tourism'
  | 'Technology'
  | 'Fitness & Health'
  | 'Entertainment'
  | 'Lifestyle'
  | 'Business & Finance'
  | 'Education'
  | 'Art & Culture'
  | 'Sports'
  | 'Music'
  | 'Photography'
  | 'Gaming'
  | 'Automotive'
  | 'Home & Garden'
  | 'Pets & Animals'
  | 'News & Politics'
  | 'Science'
  | 'General';

/**
 * Sentiment analysis results
 */
export type SentimentType = 'positive' | 'negative' | 'neutral';

/**
 * Analysis completion status
 */
export type AnalysisStatus = 'complete' | 'partial' | 'processing' | 'failed';

/**
 * Language codes supported by AI analysis
 */
export type LanguageCode = 
  | 'en' | 'ar' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' 
  | 'zh' | 'nl' | 'sv' | 'no' | 'da' | 'fi' | 'pl' | 'tr' | 'hi' | 'th';

/**
 * Subscription tiers
 */
export type SubscriptionTier = 'free' | 'standard' | 'premium';

// ========================================
// AI INSIGHTS INTERFACES
// ========================================

/**
 * Comprehensive AI insights for creator profiles
 */
export interface AIInsights {
  available: boolean;
  content_category: ContentCategory;
  content_distribution: Record<ContentCategory, number>;
  average_sentiment: number; // -1.0 to 1.0
  language_distribution: Record<LanguageCode, number>;
  content_quality_score: number; // 0-10
  analysis_completeness: AnalysisStatus;
  last_analyzed: string;
}

/**
 * AI analysis for individual posts
 */
export interface PostAIAnalysis {
  content_category: ContentCategory;
  category_confidence: number; // 0-1
  sentiment: SentimentType;
  sentiment_score: number; // -1.0 to 1.0
  sentiment_confidence: number; // 0-1
  language: LanguageCode;
  language_confidence: number; // 0-1
  analyzed_at: string;
  analysis_version: string;
  processing_info?: {
    text_length: number;
    hashtags_analyzed: number;
    model_used: 'ai' | 'rule_based';
    processing_time: number;
  };
}

// ========================================
// CORE DATA MODELS
// ========================================

/**
 * Enhanced creator profile with AI insights
 */
export interface CreatorProfile {
  id: string;
  username: string;
  full_name: string;
  biography: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
  is_private: boolean;
  is_business: boolean;
  is_business_account: boolean;
  business_category_name?: string;
  engagement_rate: number;
  profile_pic_url: string;
  profile_pic_url_hd: string;
  proxied_profile_pic_url?: string;
  proxied_profile_pic_url_hd?: string;
  external_url?: string;
  country_block?: string;
  created_at: string;
  updated_at: string;
  access_granted_at?: string;
  days_remaining?: number;
  
  // AI-powered insights
  ai_insights?: AIInsights;
}

/**
 * Creator post with AI analysis
 */
export interface CreatorPost {
  id: string;
  instagram_post_id: string;
  caption: string;
  media_type: 'photo' | 'video' | 'carousel';
  likes_count: number;
  comments_count: number;
  engagement_rate: number;
  created_at: string;
  hashtags: string[];
  mentions: string[];
  media_urls: {
    display_url: string;
    thumbnail_src: string;
    video_url?: string;
  };
  
  // AI analysis results
  ai_analysis?: PostAIAnalysis;
}

// ========================================
// API RESPONSE TYPES
// ========================================

/**
 * Analysis status for polling
 */
export interface AnalysisStatusResponse {
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  message: string;
  completion_percentage?: number;
  estimated_completion?: number; // seconds
  ai_data_available?: boolean;
  last_analyzed?: string;
}

/**
 * Team context information
 */
export interface TeamContext {
  team_id: string;
  team_name: string;
  subscription_tier: SubscriptionTier;
  access_type?: string;
}

/**
 * Usage tracking information
 */
export interface UsageInfo {
  profiles_used: number;
  profiles_limit: number;
  remaining_profiles: number;
  posts_used?: number;
  posts_limit?: number;
}

/**
 * AI analysis progress information
 */
export interface AIAnalysisProgress {
  status: 'processing' | 'completed' | 'failed';
  estimated_completion?: number; // seconds
  posts_to_analyze?: number;
  completion_percentage?: number;
  data_quality?: 'high' | 'medium' | 'low';
}

/**
 * Analysis status response from polling endpoint
 */
export interface AnalysisStatusResponse {
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  message: string;
  completion_percentage?: number;
  estimated_completion?: number;
  last_analyzed?: string;
}

/**
 * Main creator search response (Phase 1)
 */
export interface CreatorSearchResponse {
  success: boolean;
  stage: 'basic' | 'complete' | 'error';
  data_source: 'instagram_fresh' | 'database_complete' | 'cache';
  message: string;
  profile: CreatorProfile;
  ai_analysis: AIAnalysisProgress;
  processing_time?: number;
  next_steps?: string[];
  team_context?: TeamContext;
  usage_info?: UsageInfo;
}

/**
 * Detailed analysis response (Phase 2)
 */
export interface CreatorDetailedResponse {
  success: boolean;
  stage: 'complete' | 'processing';
  data_source: 'detailed_complete' | 'processing';
  message: string;
  profile: CreatorProfile;
  ai_analysis: AIAnalysisProgress;
  team_context?: TeamContext;
}

/**
 * Posts response with pagination
 */
export interface CreatorPostsResponse {
  success: boolean;
  profile_username: string;
  posts: CreatorPost[];
  pagination: {
    limit: number;
    offset: number;
    total_count: number;
    total_pages: number;
    has_more: boolean;
  };
  team_context?: TeamContext & {
    posts_used: number;
    posts_limit: number;
  };
  ai_analysis_stats?: {
    posts_with_ai: number;
    analysis_completeness: string;
  };
}

/**
 * Unlocked creators response with filtering
 */
export interface UnlockedCreatorsResponse {
  success: boolean;
  creators: CreatorProfile[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_more: boolean;
  };
  filters_applied?: {
    search?: string;
    category?: ContentCategory;
    min_followers?: number;
  };
  team_context?: TeamContext & {
    total_unlocked: number;
  };
}

// ========================================
// SYSTEM HEALTH & STATS
// ========================================

/**
 * AI model status
 */
export interface AIModelStatus {
  status: 'loaded' | 'loading' | 'failed';
  usage_count: number;
  loaded_at: string;
}

/**
 * System health response
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    creator_search_service: boolean;
    ai_system: boolean;
  };
  ai_system: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    models_status: {
      sentiment: AIModelStatus;
      language: AIModelStatus;
      category: AIModelStatus;
    };
    system_ready: boolean;
    last_check: string;
  };
  version: string;
}

/**
 * Usage statistics response
 */
export interface UsageStatsResponse {
  team_stats: {
    total_unlocked_profiles: number;
    profiles_with_ai: number;
    ai_completion_rate: string;
  };
  usage_limits: UsageInfo & {
    posts_used: number;
    posts_limit: number;
  };
  team_context: {
    team_name: string;
    subscription_tier: SubscriptionTier;
  };
}

// ========================================
// GENERIC API WRAPPER
// ========================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  notifications?: Array<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>;
}

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Search options for creator search
 */
export interface CreatorSearchOptions {
  force_refresh?: boolean;
  include_posts?: boolean;
  analysis_depth?: 'standard' | 'detailed';
}

/**
 * Posts query options
 */
export interface PostsQueryOptions {
  limit?: number;
  offset?: number;
  include_ai?: boolean;
}

/**
 * Unlocked creators query options
 */
export interface UnlockedCreatorsOptions {
  page?: number;
  page_size?: number;
  search?: string;
  category?: ContentCategory;
  min_followers?: number;
}

/**
 * Content category with confidence score for UI display
 */
export interface CategoryWithConfidence {
  category: ContentCategory;
  percentage: number;
  confidence?: number;
}

/**
 * Language with percentage for UI display
 */
export interface LanguageWithPercentage {
  code: LanguageCode;
  name: string;
  percentage: number;
}

// ========================================
// LEGACY COMPATIBILITY
// ========================================

/**
 * @deprecated Use CreatorProfile instead
 */
export interface UnlockedProfile extends CreatorProfile {
  // Legacy compatibility
}

/**
 * @deprecated Use CreatorPostsResponse instead
 */
export interface UnlockedProfilesResponse extends UnlockedCreatorsResponse {
  profiles: CreatorProfile[];
}

// ========================================
// CONSTANTS
// ========================================

/**
 * Content category display names
 */
export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  'Fashion & Beauty': 'Fashion & Beauty',
  'Food & Drink': 'Food & Drink',
  'Travel & Tourism': 'Travel & Tourism',
  'Technology': 'Technology',
  'Fitness & Health': 'Fitness & Health',
  'Entertainment': 'Entertainment',
  'Lifestyle': 'Lifestyle',
  'Business & Finance': 'Business & Finance',
  'Education': 'Education',
  'Art & Culture': 'Art & Culture',
  'Sports': 'Sports',
  'Music': 'Music',
  'Photography': 'Photography',
  'Gaming': 'Gaming',
  'Automotive': 'Automotive',
  'Home & Garden': 'Home & Garden',
  'Pets & Animals': 'Pets & Animals',
  'News & Politics': 'News & Politics',
  'Science': 'Science',
  'General': 'General'
};

/**
 * Language display names
 */
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  'en': 'English',
  'ar': 'Arabic',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish',
  'hi': 'Hindi',
  'th': 'Thai'
};

/**
 * Sentiment type labels
 */
export const SENTIMENT_LABELS: Record<SentimentType, string> = {
  'positive': 'Positive',
  'negative': 'Negative',
  'neutral': 'Neutral'
};

/**
 * Subscription tier labels
 */
export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  'free': 'Free',
  'standard': 'Standard',
  'premium': 'Premium'
};