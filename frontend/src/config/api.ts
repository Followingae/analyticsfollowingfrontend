export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, ''), // Include /api/v1 prefix
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
    login: '/auth/login', // POST - User login
    me: '/auth/me', // GET - Current user info
    dashboard: '/auth/dashboard', // GET - Dashboard data
    logout: '/auth/logout', // POST - User logout
  },

  // Credits (/api/v1/credits/)
  credits: {
    balance: '/credits/balance', // GET - User balance
    transactions: '/credits/transactions', // GET - Transaction history
    canPerform: (actionType: string) => `/credits/can-perform/${actionType}`, // GET - Check permissions
    usageMonthly: '/credits/usage/monthly', // GET - Monthly usage
    pricing: '/credits/pricing', // GET - Pricing info
  },

  // Creator Search (/api/v1/search/ & /api/v1/simple/)
  creator: {
    search: (username: string) => `/search/creator/${username}`, // GET - MAIN ENDPOINT
    unlocked: '/simple/creator/unlocked', // GET - Unlocked profiles
    systemStats: '/simple/creator/system/stats', // GET - System stats

    // Legacy aliases
    get: (username: string) => `/search/creator/${username}`,
    basic: (username: string) => `/search/creator/${username}`,
    detailed: (username: string) => `/search/creator/${username}`,
    analytics: (username: string) => `/search/creator/${username}`,
    posts: (username: string) => `/search/creator/${username}`,
    full: (username: string) => `/search/creator/${username}`,
  },

  // Teams (/api/v1/teams/)
  teams: {
    members: '/teams/members', // GET - Team members
    invite: '/teams/invite', // POST - Invite member
    invitations: '/teams/invitations', // GET - Team invitations
    removeMember: (userId: string) => `/teams/members/${userId}`, // DELETE - Remove member
    overview: '/teams/overview', // GET - Team overview
  },

  // Campaigns (/api/v1/campaigns/)
  campaigns: {
    list: '/campaigns', // GET/POST - Campaigns
    detail: (id: string) => `/campaigns/${id}`, // GET - Campaign detail
    dashboard: '/campaigns/dashboard', // GET - Campaign dashboard
    analytics: '/campaigns/analytics', // GET - Campaign analytics
  },

  // Lists (/api/v1/lists/) - Only endpoints that actually exist
  lists: {
    templates: '/lists/templates', // GET - List templates (confirmed exists)
    list: '/lists', // GET - List all user lists
    create: '/lists', // POST - Create new list
    detail: (listId: string) => `/lists/${listId}`, // GET - Get specific list by UUID
    userLists: '/lists', // GET - Alias for backwards compatibility

    // ⚠️ These endpoints don't exist yet - will cause undefined errors
    // update: (listId: string) => `/lists/${listId}`, // PUT - Update list
    // delete: (listId: string) => `/lists/${listId}`, // DELETE - Delete list
    // addItem: (listId: string) => `/lists/${listId}/items`, // POST - Add item
    // removeItem: (listId: string, itemId: string) => `/lists/${listId}/items/${itemId}`, // DELETE - Remove item
  },

  // Discovery (/api/v1/discovery/)
  discovery: {
    search: '/discovery/search', // GET - Search creators with filters
  },

  // Settings (/api/v1/settings/)
  settings: {
    profile: '/settings/profile', // GET/PUT - User profile settings
  },

  // Stripe (/api/v1/stripe/)
  stripe: {
    webhook: '/stripe/webhook', // POST - Stripe webhook
    plans: '/stripe/plans', // GET - Stripe plans
  },

  // System Status (/api/v1/system/)
  system: {
    status: '/system/status', // GET - System status
  },

  // CDN (/api/v1/cdn/ & /api/v1/creators/)
  cdn: {
    processingStatus: '/cdn/processing-status', // GET - CDN processing status
    health: '/cdn/health', // GET - CDN health
    media: (profileId: string) => `/creators/ig/${profileId}/media`, // GET - Creator media
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