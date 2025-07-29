export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

export const ENDPOINTS = {
  // Instagram Profile Analysis (Updated to match backend specification)
  profile: {
    // Full analysis with retry mechanism (8-25 seconds)
    full: (username: string) => `/instagram/profile/${username}`,
    // Basic profile info (2-5 seconds)
    basic: (username: string) => `/instagram/profile/${username}/basic`,
    // Quick dashboard preview (2-5 seconds)
    summary: (username: string) => `/analytics/summary/${username}`,
    // Autocomplete suggestions
    suggestions: (partialUsername: string) => `/search/suggestions/${partialUsername}`,
  },
  
  // Dashboard
  dashboard: {
    brand: (brandId: string) => `/dashboard/brand/${brandId}`,
    overview: '/dashboard/overview',
  },
  
  // Campaigns
  campaigns: {
    list: (brandId: string) => `/campaigns/brand/${brandId}`,
    detail: (campaignId: string) => `/campaigns/${campaignId}`,
    analytics: (campaignId: string) => `/campaigns/${campaignId}/analytics`,
    create: '/campaigns',
    update: (campaignId: string) => `/campaigns/${campaignId}`,
    delete: (campaignId: string) => `/campaigns/${campaignId}`,
  },
  
  // Creators
  creators: {
    unlocked: (brandId: string) => `/creators/unlocked/${brandId}`,
    profile: (creatorId: string) => `/creators/${creatorId}/profile`,
    unlock: (creatorId: string) => `/creators/${creatorId}/unlock`,
    analytics: (username: string) => `/creators/${username}/analytics`,
  },
  
  // Discovery
  discovery: {
    creators: '/discovery/creators',
    search: '/discovery/search',
  },
  
  // Content
  content: {
    detail: (campaignId: string, contentId: string) => `/campaigns/${campaignId}/content/${contentId}`,
    analytics: (contentId: string) => `/content/${contentId}/analytics`,
    updateStatus: (contentId: string) => `/content/${contentId}/status`,
  },
  
  // Billing & Credits
  billing: {
    credits: (brandId: string) => `/billing/credits/${brandId}`,
  },
  
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
}

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}