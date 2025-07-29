export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Instagram Profile Analysis (Based on actual backend API)
  profile: {
    // Comprehensive profile analysis with detailed insights
    full: (username: string) => `/api/v1/instagram/profile/${username}`,
    // Basic profile info (faster response)
    basic: (username: string) => `/api/v1/instagram/profile/${username}/basic`,
    // Refresh profile data (bypasses cache)
    refresh: (username: string) => `/api/v1/instagram/profile/${username}/refresh`,
  },
  
  // Hashtag Analysis
  hashtag: {
    analysis: (hashtag: string) => `/api/v1/instagram/hashtag/${hashtag}`,
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
    me: '/api/v1/auth/me',
    logout: '/api/v1/auth/logout',
  },
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}