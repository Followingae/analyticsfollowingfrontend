export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Instagram Profile Analysis (Based on actual backend API)
  profile: {
    // Comprehensive profile analysis with detailed insights
    full: (username: string) => `/instagram/profile/${username}`,
    // Basic profile info (faster response)
    basic: (username: string) => `/instagram/profile/${username}/basic`,
    // Refresh profile data (bypasses cache)
    refresh: (username: string) => `/instagram/profile/${username}/refresh`,
  },
  
  // Hashtag Analysis
  hashtag: {
    analysis: (hashtag: string) => `/instagram/hashtag/${hashtag}`,
  },
  
  // Authentication (Updated to match actual backend)
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    dashboard: '/auth/dashboard',
    searchHistory: '/auth/search-history',
    forgotPassword: '/auth/forgot-password',
    verifyEmail: (token: string) => `/auth/verify-email/${token}`,
  },
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}