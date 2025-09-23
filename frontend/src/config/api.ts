export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, ''), // Base URL without /api/v1
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000, // 30 seconds default timeout
  // AGGRESSIVE CACHING CONFIGURATION
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  CACHE_RETRY_ATTEMPTS: 3,
  CACHE_RETRY_DELAY: 1000,
  // REQUEST SEQUENCING
  MAX_CONCURRENT_REQUESTS: 2, // Limit concurrent requests
  REQUEST_DELAY: 100, // Delay between requests in ms
}

export const ENDPOINTS = {
  // 🎯 ALL ACTUAL BACKEND ENDPOINTS - Based on main.py includes

  // Auth & User (/api/v1/auth/)
  auth: {
    login: '/api/v1/auth/login', // POST - User login
    register: '/api/v1/auth/register', // POST - User registration
    me: '/api/v1/auth/me', // GET - Current user info
    dashboard: '/api/v1/auth/dashboard', // GET - Dashboard data
    logout: '/api/v1/auth/logout', // POST - User logout
    refresh: '/api/v1/auth/refresh', // POST - Refresh token
    searchHistory: '/api/v1/auth/search-history', // GET - User search history
    unlockedProfiles: '/api/v1/auth/unlocked-profiles', // GET - Unlocked profiles
    forgotPassword: '/api/v1/auth/forgot-password', // POST - Forgot password
    verifyEmail: (token: string) => `/api/v1/auth/verify-email/${token}`, // GET - Verify email
  },

  // Credits (/api/v1/credits/)
  credits: {
    balance: '/api/v1/credits/balance', // GET - User balance
    totalPlanCredits: '/api/v1/credits/total-plan-credits', // GET - Plan credit allowances
    walletSummary: '/api/v1/credits/wallet/summary', // GET - Wallet information
    dashboard: '/api/v1/credits/dashboard', // GET - Credits dashboard
    transactions: '/api/v1/credits/transactions', // GET - Transaction history
    usageMonthly: '/api/v1/credits/usage/monthly', // GET - Monthly usage
    canPerform: (actionType: string) => `/api/v1/credits/can-perform/${actionType}`, // GET - Check permissions
    pricing: '/api/v1/credits/pricing', // GET - Pricing info
    topUpEstimate: '/api/v1/credits/top-up/estimate', // POST - Estimate top-up cost
  },

  // Creator Search (/api/v1/search/ & /api/v1/simple/)
  creator: {
    search: (username: string) => `/api/v1/search/creator/${username}`, // GET - MAIN ENDPOINT
    unlocked: '/api/v1/simple/creator/unlocked', // GET - Unlocked profiles
    systemStats: '/api/v1/simple/creator/system/stats', // GET - System stats

    // Legacy aliases
    get: (username: string) => `/api/v1/search/creator/${username}`,
    basic: (username: string) => `/api/v1/search/creator/${username}`,
    detailed: (username: string) => `/api/v1/search/creator/${username}`,
    analytics: (username: string) => `/api/v1/search/creator/${username}`,
    posts: (username: string) => `/api/v1/search/creator/${username}`,
    full: (username: string) => `/api/v1/search/creator/${username}`,
  },

  // Instagram Profile Analysis (/api/v1/instagram/)
  instagram: {
    profile: (username: string) => `/api/v1/instagram/profile/${username}`, // GET - Profile analysis
    posts: (username: string) => `/api/v1/instagram/profile/${username}/posts`, // GET - Posts analysis
    aiStatus: (username: string) => `/api/v1/instagram/profile/${username}/ai-status`, // GET - AI status
  },

  // Teams (/api/v1/teams/)
  teams: {
    members: '/api/v1/teams/members', // GET - Team members
    invite: '/api/v1/teams/invite', // POST - Invite member
    invitations: '/api/v1/teams/invitations', // GET - Team invitations
    acceptInvitation: (token: string) => `/api/v1/teams/invitations/${token}/accept`, // PUT - Accept invitation
    removeMember: (userId: string) => `/api/v1/teams/members/${userId}`, // DELETE - Remove member
    overview: '/api/v1/teams/overview', // GET - Team overview
  },

  // Campaigns (/api/v1/campaigns/)
  campaigns: {
    list: '/api/v1/campaigns', // GET/POST - Campaigns
    detail: (id: string) => `/api/v1/campaigns/${id}`, // GET - Campaign detail
    dashboard: '/api/v1/campaigns/dashboard', // GET - Campaign dashboard
    analytics: '/api/v1/campaigns/analytics', // GET - Campaign analytics
  },

  // Lists (/api/v1/lists/)
  lists: {
    templates: '/api/v1/lists/templates', // GET - List templates
    list: '/api/v1/lists', // GET - List all user lists
    create: '/api/v1/lists', // POST - Create new list
    detail: (listId: string) => `/api/v1/lists/${listId}`, // GET - Get specific list by UUID
    update: (listId: string) => `/api/v1/lists/${listId}`, // PUT - Update list
    delete: (listId: string) => `/api/v1/lists/${listId}`, // DELETE - Delete list
    addItem: (listId: string) => `/api/v1/lists/${listId}/items`, // POST - Add item
    removeItem: (listId: string, itemId: string) => `/api/v1/lists/${listId}/items/${itemId}`, // DELETE - Remove item
    duplicate: (listId: string) => `/api/v1/lists/${listId}/duplicate`, // POST - Duplicate list
    availableProfiles: '/api/v1/lists/available-profiles', // GET - Available profiles for lists
    userLists: '/api/v1/lists', // GET - Alias for backwards compatibility
  },

  // Discovery (/api/v1/discovery/)
  discovery: {
    search: '/api/v1/discovery/search', // GET - Search creators with filters
  },

  // Settings (/api/v1/settings/)
  settings: {
    user: '/api/v1/settings/user', // GET/PUT - User settings and preferences
    profile: '/api/v1/settings/profile', // GET/PUT - User profile settings (legacy)
    overview: '/api/v1/settings/overview', // GET - Settings overview (legacy)
  },

  // Stripe (/api/v1/stripe/)
  stripe: {
    createCustomer: '/api/v1/stripe/create-customer', // POST - Create Stripe customer
    portalUrl: '/api/v1/stripe/portal-url', // GET - Customer portal URL
    status: '/api/v1/stripe/status', // GET - Subscription status
    config: '/api/v1/stripe/config', // GET - Stripe configuration
    webhook: '/api/v1/stripe/webhooks/stripe', // POST - Stripe webhook
    plans: '/api/v1/stripe/plans', // GET - Stripe plans (legacy)
  },

  // System Status (/api/v1/)
  system: {
    status: '/api/v1/system/status', // GET - System status (legacy)
    comprehensive: '/api/v1/status/comprehensive', // GET - Comprehensive system status
  },

  // CDN (/api/v1/cdn/ & /api/v1/creators/)
  cdn: {
    processingStatus: '/api/v1/cdn/processing-status', // GET - CDN processing status
    health: '/api/v1/cdn/health', // GET - CDN health
    media: (profileId: string) => `/api/v1/creators/ig/${profileId}/media`, // GET - Creator media
  },

  // Brand Proposals (/api/) - Note: No /v1 prefix
  proposals: {
    list: '../brand-proposals', // GET/POST - Brand proposals (/api/brand-proposals)
  },

  // Health & System (/api/) - Note: No /v1 prefix
  health: {
    system: '../health', // GET - System health check (/api/health)
    metrics: '../metrics', // GET - System metrics (/api/metrics)
    database: '../database/pool', // GET - Database pool health (/api/database/pool)
  },

  // Admin/Superadmin (/api/) - Note: No /v1 prefix
  admin: {
    proposals: '../admin/proposals', // GET - Admin proposals
    dashboard: '../superadmin/dashboard', // GET - Superadmin dashboard
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