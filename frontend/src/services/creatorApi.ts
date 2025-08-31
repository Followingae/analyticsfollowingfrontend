/**
 * 🚀 BULLETPROOF CREATOR SEARCH API SERVICE
 * Comprehensive replacement for Instagram API with AI-powered insights
 */

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
    console.log('🔍 CreatorAPI: Retrieved auth token via TokenManager:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN FOUND');
    return token || '';
  } catch (error) {
    console.error('🔍 CreatorAPI: Error accessing TokenManager:', error);
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
  
  console.log('🔍 CreatorAPI: Creating headers with token:', {
    hasTeamToken: !!teamToken,
    hasAuthToken: !!authToken,
    tokenUsed: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    tokenLength: token?.length || 0
  });

  if (!token) {
    console.warn('🔍 CreatorAPI: ⚠️ No authentication token available - API calls will fail');
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
    this.baseUrl = `${API_BASE_URL}${API_VERSION}/creator`;
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
   * 📊 ANALYSIS STATUS - Check AI Progress
   * Use for polling while waiting for analysis completion
   */
  async getAnalysisStatus(username: string): Promise<ApiResponse<AnalysisStatus>> {
    const url = `${this.baseUrl}/${username}/status`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<AnalysisStatus>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analysis status'
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
      console.log('🔍 CreatorAPI: Fetching unlocked creators from:', url);
      console.log('🔍 CreatorAPI: Request headers:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔍 CreatorAPI: Response status:', response.status);
      console.log('🔍 CreatorAPI: Response headers:', Object.fromEntries(response.headers));

      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        console.error('🔍 CreatorAPI: Authentication error:', errorText);
        return {
          success: false,
          error: `Authentication failed: ${errorText}. Please log in again.`
        };
      }

      return await handleResponse<UnlockedCreatorsResponse>(response);
    } catch (error) {
      console.error('🔍 CreatorAPI: Network error:', error);
      
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
   * 📊 USAGE STATISTICS - Team usage statistics and limits
   */
  async getUsageStats(): Promise<ApiResponse<UsageStatsResponse>> {
    const url = `${this.baseUrl}/system/stats`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(false)
      });

      return await handleResponse<UsageStatsResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage stats'
      };
    }
  }

  /**
   * 🔄 COMPREHENSIVE CREATOR SEARCH WITH POLLING
   * Complete workflow with automatic AI analysis waiting
   */
  async searchCreatorComplete(
    username: string,
    onProgress?: (status: AnalysisStatus) => void,
    maxWaitTime: number = 300000 // 5 minutes max
  ): Promise<ApiResponse<DetailedResponse>> {
    try {
      // Step 1: Initial search
      const searchResult = await this.searchCreator(username);
      if (!searchResult.success || !searchResult.data) {
        return { success: false, error: searchResult.error };
      }

      // Step 2: If already complete, get detailed data
      if (searchResult.data.stage === 'complete') {
        return await this.getDetailedAnalysis(username);
      }

      // Step 3: Poll for completion
      const startTime = Date.now();
      const pollInterval = 30000; // 30 seconds

      return new Promise((resolve) => {
        const poll = async () => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed > maxWaitTime) {
            resolve({
              success: false,
              error: 'AI analysis timeout - taking longer than expected'
            });
            return;
          }

          const statusResult = await this.getAnalysisStatus(username);
          if (!statusResult.success || !statusResult.data) {
            resolve({ success: false, error: statusResult.error });
            return;
          }

          onProgress?.(statusResult.data);

          if (statusResult.data.status === 'completed') {
            const detailedResult = await this.getDetailedAnalysis(username);
            resolve(detailedResult);
          } else if (statusResult.data.status === 'failed') {
            resolve({
              success: false,
              error: 'AI analysis failed'
            });
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        };

        setTimeout(poll, pollInterval);
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Comprehensive search failed'
      };
    }
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
  console.warn('searchProfile is deprecated. Use creatorApiService.searchCreator() instead.');
  return creatorApiService.searchCreator(username);
};

/**
 * @deprecated Use creatorApiService.getUnlockedCreators() instead
 */
export const getUnlockedProfiles = (page: number = 1, pageSize: number = 20) => {
  console.warn('getUnlockedProfiles is deprecated. Use creatorApiService.getUnlockedCreators() instead.');
  return creatorApiService.getUnlockedCreators({ page, page_size: pageSize });
};