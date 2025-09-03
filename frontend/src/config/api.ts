export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, ''), // Remove trailing slash
  TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  SEARCH_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs for Decodo calls
  ANALYTICS_TIMEOUT: 7200000, // 2 hours - Let backend take all the time it needs
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Instagram Profile System - CDN Integration
  instagram: {
    // Primary Instagram Profile Endpoint with CDN URLs
    profile: (username: string) => `/api/instagram/profile/${username}`, // GET - Instagram profile with CDN images
  },

  // Creator Search System - Simple Flow (CORRECTED ENDPOINTS)
  creator: {
    // ✅ CORRECTED: Simple Flow Endpoints
    get: (username: string) => `/api/v1/simple/creator/${username}`, // GET - Get existing creator profile
    search: (username: string) => `/api/v1/simple/creator/search/${username}`, // POST - Search new creator
    
    // Legacy endpoints (may still be used by some components)
    detailed: (username: string) => `/api/v1/creator/${username}/detailed`, // GET - Get detailed analytics
    posts: (username: string) => `/api/v1/creator/${username}/posts`, // GET - Get creator posts with AI
    // ❌ REMOVED: status endpoint no longer exists
    refresh: (username: string) => `/api/v1/creator/${username}/refresh`, // POST - Force refresh
    scheduleAnalysis: (username: string) => `/api/v1/creator/${username}/schedule-analysis`, // POST - Schedule analysis
    
    // Unlocked creators (CORRECTED)
    unlocked: '/api/v1/simple/creator/unlocked', // GET - List all unlocked creators
  },

  // Legacy Profile Endpoints (Updated to use correct simple flow endpoints)
  profile: {
    basic: (username: string) => `/api/v1/simple/creator/${username}`, // ✅ CORRECTED
    search: (username: string) => `/api/v1/simple/creator/search/${username}`, // ✅ CORRECTED  
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
    me: '/api/v1/auth/me',
    logout: '/api/v1/auth/logout',
  },

  // Credits & Financial Management
  credits: {
    balance: '/api/v1/credits/balance',
    walletSummary: '/api/v1/credits/wallet/summary',
    dashboard: '/api/v1/credits/dashboard',
    transactions: '/api/v1/credits/transactions',
    usageMonthly: '/api/v1/credits/usage/monthly',
    canPerform: (actionType: string) => `/api/v1/credits/can-perform/${actionType}`,
    allowances: '/api/v1/credits/allowances',
  },

  // Settings & Preferences
  settings: {
    overview: '/api/v1/settings/overview',
    profile: '/api/v1/settings/profile',
    notifications: '/api/v1/settings/notifications',
    preferences: '/api/v1/settings/preferences',
    security: {
      password: '/api/v1/settings/security/password',
      twoFactor: '/api/v1/settings/security/2fa',
      privacy: '/api/v1/settings/security/privacy',
    },
    avatar: '/api/v1/settings/profile/avatar',
  },

  // Teams
  teams: {
    overview: '/api/v1/teams/overview',
    members: '/api/v1/teams/members',
    invitations: '/api/v1/teams/invitations',
    invite: '/api/v1/teams/invite',
    removeMember: (userId: string) => `/api/v1/teams/members/${userId}`,
    cancelInvitation: (invitationId: string) => `/api/v1/teams/invitations/${invitationId}`,
  },

  // Discovery & Recommendations
  discovery: {
    unlocked: '/api/v1/discovery/unlocked',
  },
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

import { tokenManager } from '@/utils/tokenManager';

export const getAuthHeaders = () => {
  if (typeof window === 'undefined') return REQUEST_HEADERS;
  
  // Use centralized token manager for consistent token access
  const token = tokenManager.getTokenSync();
  
  if (token) {
    return {
      ...REQUEST_HEADERS,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // No valid token found

  return REQUEST_HEADERS;
};