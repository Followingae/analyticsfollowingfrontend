export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, ''), // Remove trailing slash
  TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  SEARCH_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs for Decodo calls
  ANALYTICS_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Creator Search System - Robust Implementation
  creator: {
    // Core Search Endpoints
    search: (username: string) => `/api/v1/creator/search/${username}`, // POST - Main creator search
    get: (username: string) => `/api/v1/creator/${username}`, // GET - Get existing creator data
    detailed: (username: string) => `/api/v1/creator/${username}/detailed`, // GET - Get detailed analytics
    
    // Posts & Content
    posts: (username: string) => `/api/v1/creator/${username}/posts`, // GET - Get creator posts with AI
    
    // Analysis Status
    status: (username: string) => `/api/v1/creator/${username}/status`, // GET - Check AI analysis status
    
    // Refresh & Updates
    refresh: (username: string) => `/api/v1/creator/${username}/refresh`, // POST - Force refresh
    
    // Background Processing
    scheduleAnalysis: (username: string) => `/api/v1/creator/${username}/schedule-analysis`, // POST - Schedule analysis
  },

  // Legacy Profile Endpoints (Deprecated - use creator endpoints above)
  profile: {
    basic: (username: string) => `/api/v1/creator/search/${username}`,
    search: (username: string) => `/api/v1/creator/search/${username}`,
    analytics: (username: string) => `/api/v1/creator/${username}/detailed`,
    posts: (username: string) => `/api/v1/creator/${username}/posts`,
    full: (username: string) => `/api/v1/creator/${username}/detailed`,
  },
  
  // Hashtag Analysis
  hashtag: {
    analysis: (hashtag: string) => `/api/v1/instagram/hashtag/${hashtag}`,
  },
  
  // My Lists Management
  lists: {
    // Core List Management
    getAll: '/api/v1/lists',
    create: '/api/v1/lists',
    update: (id: string) => `/api/v1/lists/${id}`,
    delete: (id: string) => `/api/v1/lists/${id}`,
    
    // List Items Management
    addItem: (id: string) => `/api/v1/lists/${id}/items`,
    updateItem: (id: string, itemId: string) => `/api/v1/lists/${id}/items/${itemId}`,
    removeItem: (id: string, itemId: string) => `/api/v1/lists/${id}/items/${itemId}`,
    bulkAdd: (id: string) => `/api/v1/lists/${id}/items/bulk`,
    
    // Advanced Operations
    reorder: (id: string) => `/api/v1/lists/${id}/reorder`,
    duplicate: (id: string) => `/api/v1/lists/${id}/duplicate`,
    analytics: (id: string) => `/api/v1/lists/${id}/analytics`,
  },
  
  // Profiles for Lists
  profiles: {
    availableForLists: '/api/v1/profiles/available-for-lists',
  },

  // Authentication (Updated to match actual backend)
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    dashboard: '/api/v1/auth/dashboard',
    searchHistory: '/api/v1/auth/search-history',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    verifyEmail: (token: string) => `/api/v1/auth/verify-email/${token}`,
    me: '/api/v1/me',
    logout: '/api/v1/auth/logout',
    unlockedProfiles: '/api/v1/auth/unlocked-profiles',
  },

  // Teams
  teams: {
    overview: '/api/v1/teams/overview',
  },
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export const getAuthHeaders = () => {
  if (typeof window === 'undefined') return REQUEST_HEADERS;
  
  // Try new token format first
  const authTokens = localStorage.getItem('auth_tokens');
  if (authTokens) {
    try {
      const tokenData = JSON.parse(authTokens);
      if (tokenData.access_token) {
        return {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${tokenData.access_token}`
        };
      }
    } catch {}
  }
  
  // Fallback to old format for compatibility
  const oldToken = localStorage.getItem('access_token');
  return oldToken ? {
    ...REQUEST_HEADERS,
    'Authorization': `Bearer ${oldToken}`
  } : REQUEST_HEADERS;
};