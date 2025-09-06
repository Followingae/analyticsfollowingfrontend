/**
 * 🚀 BULLETPROOF CREATOR SEARCH API SERVICE
 * Comprehensive replacement for Instagram API with AI-powered insights
 */

import { UsageStatsResponse } from '@/types/creator';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface AIInsights {
  available: boolean;
  content_category: string;
  content_distribution: Record<string, number>;
  average_sentiment: number;
  language_distribution: Record<string, number>;
  content_quality_score: number;
  analysis_completeness: 'complete' | 'partial' | 'processing';
  last_analyzed: string;
}

export interface PostAIAnalysis {
  content_category: string;
  category_confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  sentiment_confidence: number;
  language: string;
  language_confidence: number;
  analyzed_at: string;
  analysis_version: string;
}

// ✅ Profile interface matching backend specification for /api/v1/simple/creator/unlocked
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  biography: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  verified: boolean;
  is_private: boolean;
  profile_pic_url: string | null;
  unlocked_at: string;  // ISO timestamp
  credits_spent: number;
  // Additional analytics fields...
}

export interface CreatorProfile {
  id: string;
  username: string;
  full_name: string;
  biography: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
  is_business: boolean;
  engagement_rate: number;
  profile_pic_url: string;
  profile_pic_url_hd: string;
  proxied_profile_pic_url?: string;
  proxied_profile_pic_url_hd?: string;
  external_url?: string;
  created_at: string;
  updated_at: string;
  ai_insights?: AIInsights;
}

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
  ai_analysis?: PostAIAnalysis;
}

export interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  message: string;
  completion_percentage?: number;
  estimated_completion?: number;
  ai_data_available?: boolean;
  last_analyzed?: string;
}

export interface SearchResponse {
  success: boolean;
  stage: 'basic' | 'complete' | 'error';
  data_source: string;
  message: string;
  profile: CreatorProfile;
  ai_analysis: {
    status: 'processing' | 'completed';
    estimated_completion?: number;
    posts_to_analyze?: number;
    completion_percentage?: number;
    data_quality?: string;
  };
  processing_time?: number;
  next_steps?: string[];
  team_context?: {
    team_id: string;
    team_name: string;
    subscription_tier: string;
  };
  usage_info?: {
    profiles_used: number;
    profiles_limit: number;
    remaining_profiles: number;
  };
}

export interface DetailedResponse {
  success: boolean;
  stage: 'complete' | 'processing';
  data_source: string;
  message: string;
  profile: CreatorProfile;
  ai_analysis: {
    status: 'processing' | 'completed';
    completion_percentage: number;
    data_quality?: string;
    estimated_completion?: number;
  };
  team_context?: {
    team_id: string;
    team_name: string;
    access_type: string;
  };
}

export interface PostsResponse {
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
  team_context?: {
    team_id: string;
    team_name: string;
    posts_used: number;
    posts_limit: number;
  };
  ai_analysis_stats?: {
    posts_with_ai: number;
    analysis_completeness: string;
  };
}

export interface UnlockedCreatorsResponse {
  success: boolean;
  profiles: Profile[];  // ✅ CORRECTED: Backend returns 'profiles' of type Profile
  pagination: {
    current_page: number;  // ✅ CORRECTED: Backend uses 'current_page'
    total_pages: number;
    total_items: number;   // ✅ CORRECTED: Backend uses 'total_items'
    has_next: boolean;
    has_previous: boolean;
  };
  filters_applied?: {
    search?: string;
    category?: string;
    min_followers?: number;
  };
  team_context?: {
    team_id: string;
    team_name: string;
    total_unlocked: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    creator_search_service: boolean;
    ai_system: boolean;
  };
  ai_system: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    models_status: {
      sentiment: {
        status: 'loaded' | 'loading' | 'failed';
        usage_count: number;
        loaded_at: string;
      };
      language: {
        status: 'loaded' | 'loading' | 'failed';
        usage_count: number;
        loaded_at: string;
      };
      category: {
        status: 'loaded' | 'loading' | 'failed';
        usage_count: number;
        loaded_at: string;
      };
    };
    system_ready: boolean;
    last_check: string;
  };
  version: string;
}

export interface UsageStats {
  team_stats: {
    total_unlocked_profiles: number;
    profiles_with_ai: number;
    ai_completion_rate: string;
  };
  usage_limits: {
    profiles_used: number;
    profiles_limit: number;
    posts_used: number;
    posts_limit: number;
  };
  team_context: {
    team_name: string;
    subscription_tier: string;
  };
}

// NEW: Step 2 AI Analysis Response Types
export interface ProfileAISummary {
  primary_content_type: string | null;
  content_distribution: Record<string, number> | null;
  avg_sentiment_score: number | null;
  language_distribution: Record<string, number> | null;
  content_quality_score: number | null;
  profile_analyzed_at: string | null;
}

export interface PostAIAnalysisDetailed {
  content_category: string;
  category_confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  sentiment_confidence: number;
  language_code: string;
  language_confidence: number;
  analyzed_at: string;
}

export interface PostAnalysisItem {
  post_id: string;
  instagram_post_id: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  engagement_rate: number;
  ai_analysis: PostAIAnalysisDetailed;
  created_at: string;
}

export interface AIStatistics {
  total_posts: number;
  analyzed_posts: number;
  analysis_completion_rate: number;
  avg_sentiment_score: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ProfileAIAnalysisResponse {
  success: boolean;
  username: string;
  profile_ai_summary: ProfileAISummary;
  posts_analysis: PostAnalysisItem[];
  ai_statistics: AIStatistics;
}

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
// UTILITY FUNCTIONS
// ========================================

const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Use TokenManager for consistent token access
  try {
    const { tokenManager } = require('@/utils/tokenManager');
    const token = tokenManager.getTokenSync();

    return token || '';
  } catch (error) {

    return '';
  }
};

const getTeamToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('team_token') || sessionStorage.getItem('team_token') || '';
};

const createHeaders = (includeContentType: boolean = true): HeadersInit => {
  const teamToken = getTeamToken();
  const authToken = getAuthToken();
  const token = teamToken || authToken;

  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`,
        notifications: data.notifications
      };
    }
    
    return {
      success: true,
      data,
      notifications: data.notifications
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

// ========================================
// CREATOR API SERVICE CLASS
// ========================================

class CreatorApiService {
  private baseUrl: string;

  constructor() {
    // ✅ CORRECTED: Use Simple Flow endpoints
    this.baseUrl = `${API_BASE_URL}${API_VERSION}/simple/creator`;
  }

  /**
   * 🔍 MAIN CREATOR SEARCH - Phase 1 Response
   * Primary creator search endpoint with immediate basic data
   */
  async searchCreator(
    username: string, 
    options: {
      force_refresh?: boolean;
      include_posts?: boolean;
      analysis_depth?: 'standard' | 'detailed';
    } = {}
  ): Promise<ApiResponse<SearchResponse>> {
    const url = `${this.baseUrl}/search/${username}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          force_refresh: options.force_refresh || false,
          include_posts: options.include_posts || false,
          analysis_depth: options.analysis_depth || 'standard'
        })
      });

      return await handleResponse<SearchResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search creator'
      };
    }
  }

  /**
   * 👤 GET EXISTING CREATOR - Get cached creator data
   * Returns profile data if previously analyzed
   */
  async getCreator(username: string): Promise<ApiResponse<SearchResponse>> {
    const url = `${this.baseUrl}/${username}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<SearchResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get creator data'
      };
    }
  }

  /**
   * 🧠 DETAILED ANALYSIS - Phase 2 Response
   * Complete analysis with AI insights (must call search first)
   */
  async getDetailedAnalysis(username: string): Promise<ApiResponse<DetailedResponse>> {
    const url = `${this.baseUrl}/${username}/detailed`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<DetailedResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get detailed analysis'
      };
    }
  }

  /**
   * 🚀 NEW: AI ANALYSIS DATA - Step 2 Complete AI Analysis
   * Comprehensive AI analysis data with profile summary and post analysis
   */
  async getProfileAIAnalysis(username: string): Promise<ApiResponse<ProfileAIAnalysisResponse>> {
    const url = `${this.baseUrl}/${username}/ai-analysis`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<ProfileAIAnalysisResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI analysis data'
      };
    }
  }


  /**
   * 🔄 REFRESH CREATOR DATA - Force refresh from Instagram
   */
  async refreshCreator(username: string): Promise<ApiResponse<SearchResponse>> {
    const url = `${this.baseUrl}/${username}/refresh`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: createHeaders()
      });

      return await handleResponse<SearchResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh creator data'
      };
    }
  }

  /**
   * ⏳ SCHEDULE BACKGROUND ANALYSIS - Schedule AI analysis
   */
  async scheduleAnalysis(username: string): Promise<ApiResponse<{ job_id: string }>> {
    const url = `${this.baseUrl}/${username}/schedule-analysis`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: createHeaders()
      });

      return await handleResponse<{ job_id: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule analysis'
      };
    }
  }

  /**
   * 📱 CREATOR POSTS - Paginated posts with AI analysis
   */
  async getCreatorPosts(
    username: string,
    options: {
      limit?: number;
      offset?: number;
      include_ai?: boolean;
    } = {}
  ): Promise<ApiResponse<PostsResponse>> {
    const params = new URLSearchParams({
      limit: String(options.limit || 20),
      offset: String(options.offset || 0),
      include_ai: String(options.include_ai !== false)
    });
    
    const url = `${this.baseUrl}/${username}/posts?${params}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<PostsResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get creator posts'
      };
    }
  }

  /**
   * 📋 UNLOCKED CREATORS - List all creators team has access to
   */
  async getUnlockedCreators(options: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    min_followers?: number;
  } = {}): Promise<ApiResponse<UnlockedCreatorsResponse>> {
    const params = new URLSearchParams({
      page: String(options.page || 1),
      page_size: String(options.page_size || 20)
    });

    if (options.search) params.append('search', options.search);
    if (options.category) params.append('category', options.category);
    if (options.min_followers) params.append('min_followers', String(options.min_followers));

    const url = `${this.baseUrl}/unlocked?${params}`;
    
    try {
      const headers = createHeaders(false);


      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });




      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();

        return {
          success: false,
          error: `Authentication failed: ${errorText}. Please log in again.`
        };
      }

      return await handleResponse<UnlockedCreatorsResponse>(response);
    } catch (error) {

      
      // Check if it's a network connectivity issue
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          success: false,
          error: 'Network connection failed. Please check your internet connection or try logging in again.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get unlocked creators'
      };
    }
  }

  /**
   * 🏥 SYSTEM HEALTH - Check system and AI component health
   */
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    const url = `${this.baseUrl}/system/health`;
    
    try {
      const response = await fetch(url, {
        method: 'GET'
      });

      return await handleResponse<SystemHealth>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get system health'
      };
    }
  }

  /**
   * 📊 USAGE STATISTICS - Team usage statistics and limits (FIXED: Now with caching)
   */
  async getUsageStats(): Promise<ApiResponse<UsageStatsResponse>> {
    // Import requestCache dynamically to prevent circular imports
    const { requestCache, CACHE_KEYS } = await import('@/utils/requestCache')
    
    return requestCache.get(
      CACHE_KEYS.SYSTEM_STATS,
      async () => {
        const url = `${this.baseUrl}/system/stats`;
        const headers = createHeaders(false);
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        });
        
        const result = await handleResponse<UsageStatsResponse>(response);
        return result;
      },
      3 * 60 * 1000 // Cache for 3 minutes
    ).catch((error) => {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage stats'
      };
    });
  }

}

// ========================================
// SINGLETON EXPORT
// ========================================

export const creatorApiService = new CreatorApiService();
export default creatorApiService;

// ========================================
// BACKWARD COMPATIBILITY HELPERS
// ========================================

/**
 * @deprecated Use creatorApiService.searchCreator() instead
 */
export const searchProfile = (username: string) => {

  return creatorApiService.searchCreator(username);
};

/**
 * @deprecated Use creatorApiService.getUnlockedCreators() instead
 */
export const getUnlockedProfiles = (page: number = 1, pageSize: number = 20) => {

  return creatorApiService.getUnlockedCreators({ page, page_size: pageSize });
};