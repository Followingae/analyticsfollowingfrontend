export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, ''), // Remove trailing slash
  TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  SEARCH_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs for Decodo calls
  ANALYTICS_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Instagram Profile Analysis (TWO-ENDPOINT ARCHITECTURE)
  profile: {
    // NEW: Profile search/preview endpoint - calls Decodo if needed, stores in DB, grants 30-day access
    search: (username: string) => `/api/v1/instagram/profile/${username}`,
    // NEW: Analytics endpoint - ONLY reads from DB cache, NEVER calls Decodo
    analytics: (username: string) => `/api/v1/instagram/profile/${username}/analytics`,
    // NEW: Posts endpoint - retrieves stored posts with pagination
    posts: (username: string) => `/api/v1/instagram/profile/${username}/posts`,
    // DEPRECATED: Use search endpoint instead
    full: (username: string) => `/api/v1/instagram/profile/${username}`,
    // DEPRECATED: Use search endpoint instead  
    basic: (username: string) => `/api/v1/instagram/profile/${username}/basic`,
    // DEPRECATED: Use search endpoint instead
    refresh: (username: string) => `/api/v1/instagram/profile/${username}/refresh`,
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
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? {
    ...REQUEST_HEADERS,
    'Authorization': `Bearer ${token}`
  } : REQUEST_HEADERS;
};