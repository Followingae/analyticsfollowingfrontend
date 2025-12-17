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
    register: '/api/v1/auth/register', // POST - User registration (201 Created)
    billingTypes: '/api/v1/auth/billing-types', // GET - Get billing type options
    me: '/api/v1/auth/me', // GET - Current user info
    dashboard: '/api/v1/auth/dashboard', // GET - Dashboard data
    logout: '/api/v1/auth/logout', // POST - User logout
    refresh: '/api/v1/auth/refresh', // POST - Refresh token
    searchHistory: '/api/v1/auth/search-history', // GET - User search history
    unlockedProfiles: '/api/v1/auth/unlocked-profiles', // GET - Unlocked profiles
    forgotPassword: '/api/v1/auth/forgot-password', // POST - Forgot password
    verifyEmail: (token: string) => `/api/v1/auth/verify-email/${token}`, // GET - Verify email
    adminCreateManagedUser: '/api/v1/auth/admin/create-managed-user', // POST - Admin creates managed user
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

  // Campaigns (/api/v1/campaigns/) - COMPLETE LIVE CAMPAIGN SYSTEM
  campaigns: {
    // 1. CAMPAIGN CRUD (7 endpoints)
    list: '/api/v1/campaigns/', // GET/POST - List and create campaigns
    detail: (id: string) => `/api/v1/campaigns/${id}`, // GET - Campaign detail
    update: (id: string) => `/api/v1/campaigns/${id}`, // PATCH - Update campaign
    delete: (id: string) => `/api/v1/campaigns/${id}`, // DELETE - Archive campaign
    restore: (id: string) => `/api/v1/campaigns/${id}/restore`, // POST - Restore archived campaign
    updateStatus: (id: string) => `/api/v1/campaigns/${id}/status`, // PATCH - Update campaign status

    // 2. OVERVIEW/DASHBOARD (1 endpoint)
    overview: '/api/v1/campaigns/overview', // GET - Dashboard overview with trends

    // 3. POSTS MANAGEMENT (3 endpoints)
    posts: (id: string) => `/api/v1/campaigns/${id}/posts`, // GET/POST - List and add posts
    removePost: (id: string, postId: string) => `/api/v1/campaigns/${id}/posts/${postId}`, // DELETE - Remove post

    // 4. ANALYTICS & REPORTS (3 endpoints)
    analytics: (id: string) => `/api/v1/campaigns/${id}/analytics`, // GET - Campaign analytics with period
    audience: (id: string) => `/api/v1/campaigns/${id}/audience`, // GET - Campaign audience insights
    aiInsights: (id: string) => `/api/v1/campaigns/${id}/ai-insights`, // GET - AI-powered campaign insights

    // 5. BRAND & EXPORT (3 endpoints)
    uploadLogo: (id: string) => `/api/v1/campaigns/${id}/logo`, // POST - Upload brand logo
    deleteLogo: (id: string) => `/api/v1/campaigns/${id}/logo`, // DELETE - Delete brand logo
    export: (id: string) => `/api/v1/campaigns/${id}/export`, // GET - Export campaign data
    exportAll: '/api/v1/campaigns/export/all', // GET - Export all campaigns

    // 6. CAMPAIGN CREATORS (2 endpoints)
    creators: (id: string) => `/api/v1/campaigns/${id}/creators`, // GET - Campaign creators
    addCreator: (id: string) => `/api/v1/campaigns/${id}/creators`, // POST - Add creator to campaign

    // 7. DUAL WORKFLOW SYSTEM (3 endpoints)
    createUser: '/api/v1/campaigns/workflow/user/create', // POST - User self-managed campaign
    createSuperadmin: '/api/v1/campaigns/workflow/superadmin/create', // POST - Superadmin managed campaign
    selectInfluencer: (id: string) => `/api/v1/campaigns/workflow/${id}/select-influencer`, // POST - Select influencer for workflow

    // 8. CAMPAIGN PROPOSALS (5 endpoints)
    proposals: '/api/v1/campaigns/proposals', // GET - List user proposals
    proposalDetail: (id: string) => `/api/v1/campaigns/proposals/${id}`, // GET - Proposal details
    updateInfluencers: (id: string) => `/api/v1/campaigns/proposals/${id}/influencers`, // PUT - Update influencer selection
    approveProposal: (id: string) => `/api/v1/campaigns/proposals/${id}/approve`, // POST - Approve proposal
    rejectProposal: (id: string) => `/api/v1/campaigns/proposals/${id}/reject`, // POST - Reject proposal

    // 9. SYSTEM & HEALTH (3 endpoints)
    cleanup: (id: string) => `/api/v1/campaigns/${id}/cleanup`, // POST - Cleanup orphaned creators
    healthCheck: '/api/v1/campaigns/health/check', // GET - Campaign system health
    proposalHealthCheck: '/api/v1/campaigns/proposals/health/check', // GET - Proposal system health

    // Legacy aliases
    dashboard: '/api/v1/campaigns/dashboard/', // Legacy - Use overview instead
  },

  // Lists (/api/v1/lists/) - Complete API Documentation
  lists: {
    // Core CRUD Operations
    list: '/api/v1/lists', // GET - List all user lists (paginated)
    create: '/api/v1/lists', // POST - Create new list
    detail: (listId: string) => `/api/v1/lists/${listId}`, // GET - Get specific list with items
    update: (listId: string) => `/api/v1/lists/${listId}`, // PUT - Update list metadata
    delete: (listId: string) => `/api/v1/lists/${listId}`, // DELETE - Delete list and all items

    // List Items Management
    addItem: (listId: string) => `/api/v1/lists/${listId}/items`, // POST - Add profile to list
    updateItem: (listId: string, itemId: string) => `/api/v1/lists/${listId}/items/${itemId}`, // PUT - Update list item
    removeItem: (listId: string, itemId: string) => `/api/v1/lists/${listId}/items/${itemId}`, // DELETE - Remove profile from list
    bulkAddItems: (listId: string) => `/api/v1/lists/${listId}/items/bulk`, // POST - Add multiple profiles

    // List Operations
    reorder: (listId: string) => `/api/v1/lists/${listId}/reorder`, // PUT - Reorder list items
    duplicate: (listId: string) => `/api/v1/lists/${listId}/duplicate`, // POST - Duplicate list
    bulkOperations: '/api/v1/lists/bulk-operations', // POST - Bulk operations (delete, favorite)

    // Discovery & Templates
    templates: '/api/v1/lists/templates', // GET - Get list templates
    availableProfiles: '/api/v1/lists/available-profiles', // GET - Get profiles available for lists

    // Legacy aliases for backwards compatibility
    userLists: '/api/v1/lists', // GET - Alias for backwards compatibility
    bulkAdd: (listId: string) => `/api/v1/lists/${listId}/items/bulk`, // POST - Legacy alias
    analytics: (listId: string) => `/api/v1/lists/${listId}/analytics`, // GET - List analytics (if implemented)
  },

  // Discovery (/api/v1/discovery/)
  discovery: {
    browse: '/api/v1/discovery/browse', // GET - Browse all profiles with filtering
    unlockProfile: '/api/v1/discovery/unlock-profile', // POST - Unlock profile for 30 days (25 credits)
    unlockedProfiles: '/api/v1/discovery/unlocked-profiles', // GET - User's unlocked profiles
    dashboard: '/api/v1/discovery/dashboard', // GET - Discovery statistics
    searchAdvanced: '/api/v1/discovery/search-advanced', // GET - Advanced search
    categories: '/api/v1/discovery/categories', // GET - Available content categories
    pricing: '/api/v1/discovery/pricing', // GET - Pricing information
  },

  // Post Analytics (/api/v1/post-analytics/)
  postAnalytics: {
    analyze: '/api/v1/post-analytics/analyze', // POST - Analyze single post
    analyzeBatch: '/api/v1/post-analytics/analyze/batch', // POST - Batch analyze posts
    getByShortcode: (shortcode: string) => `/api/v1/post-analytics/analysis/${shortcode}`, // GET - Get by shortcode
    getById: (id: string) => `/api/v1/post-analytics/analysis/id/${id}`, // GET - Get by ID
    search: '/api/v1/post-analytics/search', // POST - Search analyses
    myAnalyses: '/api/v1/post-analytics/my-analyses', // GET - User's analyses
    overview: '/api/v1/post-analytics/insights/overview', // GET - Analytics overview
    delete: (id: string) => `/api/v1/post-analytics/analysis/${id}`, // DELETE - Delete analysis
    health: '/api/v1/post-analytics/health', // GET - Health check
  },

  // Settings (/api/v1/settings/)
  settings: {
    user: '/api/v1/settings/user', // GET/PUT - User settings and preferences
    profile: '/api/v1/settings/profile', // GET/PUT - User profile settings (legacy)
    overview: '/api/v1/settings/overview', // GET - Settings overview (legacy)
  },

  // Billing (/api/v1/billing/)
  billing: {
    // Public endpoints (no auth)
    products: '/api/v1/billing/products', // GET - Get available products

    // V3 Payment-First Registration Flow (Latest - Better Reliability)
    preRegistrationCheckout: '/api/v1/billing/v3/pre-registration-checkout', // POST - Payment before registration
    freeTierRegistration: '/api/v1/billing/v3/free-tier-registration', // POST - Direct free tier signup
    verifySession: (sessionId: string) => `/api/v1/billing/v3/verify-session/${sessionId}`, // GET - Check account creation status

    // Existing user endpoints
    createCheckoutSession: '/api/v1/billing/create-checkout-session', // POST - Create checkout session
    upgradeSubscription: '/api/v1/billing/upgrade-subscription', // POST - Upgrade existing subscription
    subscription: '/api/v1/billing/subscription-status', // GET - Get subscription status
    createPortalSession: '/api/v1/billing/create-portal-session', // POST - Create customer portal session
    portalUrl: '/api/v1/billing/subscription/portal-url', // GET - Get Stripe portal URL (correct endpoint from backend)
    cancelSubscription: '/api/v1/billing/cancel-subscription', // POST - Cancel subscription

    // Webhooks
    webhook: '/api/v1/billing/webhook', // POST - Stripe webhook for existing subscriptions
    webhookCompleteRegistration: '/api/v1/billing/v2/webhook/complete-registration', // POST - Webhook for new registrations
  },

  // Admin Billing (/api/v1/admin/billing/)
  adminBilling: {
    pendingUsers: '/api/v1/admin/billing/pending-users', // GET - Get pending approval users
    approveUser: '/api/v1/admin/billing/approve-user', // POST - Approve user with custom billing
  },

  // Stripe (Legacy - keeping for backwards compatibility)
  stripe: {
    createCustomer: '/api/v1/stripe/create-customer', // POST - Create Stripe customer
    portalUrl: '/api/v1/stripe/portal-url', // GET - Customer portal URL
    status: '/api/v1/stripe/status', // GET - Subscription status
    config: '/api/v1/stripe/config', // GET - Stripe configuration
    webhook: '/api/v1/stripe/webhooks/stripe', // POST - Stripe webhook
    plans: '/api/v1/stripe/plans', // GET - Stripe plans (legacy)
  },

  // Currency (/api/v1/currency/)
  currency: {
    userCurrent: '/api/v1/currency/user/current', // GET - Current user's currency settings
    teamCurrency: (teamId: string) => `/api/v1/currency/team/${teamId}`, // GET/PUT - Team currency settings
    supported: '/api/v1/currency/supported', // GET - Supported currencies (superadmin)
    format: '/api/v1/currency/format', // POST - Format currency amounts
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

  // Admin/Superadmin Endpoints - Complete 46+ Endpoint Implementation
  admin: {
    // User Management
    getUser: (userId: string) => `/admin/users/${userId}`, // GET - Get user details
    updateUser: (userId: string) => `/admin/users/${userId}`, // PUT - Update user
    deleteUser: (userId: string) => `/admin/users/${userId}`, // DELETE - Delete user
    bulkUpdateUsers: '/admin/users/bulk-update', // POST - Bulk operations
    getUserActivity: (userId: string) => `/admin/users/${userId}/activity`, // GET - User activity

    // Credits Management
    adjustCredits: '/admin/credits/adjust', // POST - Adjust user credits

    // Security Actions
    verifyUserEmail: (userId: string) => `/admin/users/${userId}/verify-email`, // POST - Verify email
    resetUser2FA: (userId: string) => `/admin/users/${userId}/reset-2fa`, // POST - Reset 2FA

    // Legacy
    proposals: '../admin/proposals', // GET - Admin proposals
    dashboard: '../superadmin/dashboard', // GET - Superadmin dashboard
  },

  // 🚀 COMPLETE SUPERADMIN ENDPOINTS - Full 46+ Endpoint Guide Implementation
  superadmin: {
    // === CORE DASHBOARD & ANALYTICS ===
    dashboard: '/api/superadmin/dashboard', // GET - Main superadmin dashboard
    realtimeAnalytics: '/api/superadmin/analytics/realtime', // GET - Live analytics
    systemHealth: '/api/superadmin/system/health', // GET - System health check
    systemStats: '/api/superadmin/system/stats', // GET - System statistics
    platformAnalytics: '/api/superadmin/platform/analytics/comprehensive', // GET - Platform analytics

    // === USER MANAGEMENT ===
    users: '/api/superadmin/users', // GET/POST - User list and creation
    createUser: '/api/superadmin/users/create', // POST - Create new user
    editUser: (userId: string) => `/api/superadmin/users/${userId}/edit`, // PUT - Edit user
    deleteUser: (userId: string) => `/api/superadmin/users/${userId}`, // DELETE - Delete user
    userActivities: (userId: string) => `/api/superadmin/users/${userId}/activities`, // GET - User activities
    userPermissions: (userId: string) => `/api/superadmin/users/${userId}/permissions`, // GET/POST - User permissions
    userSessions: (userId: string) => `/api/superadmin/users/${userId}/security/sessions`, // POST - Manage user sessions
    userMFA: (userId: string) => `/api/superadmin/users/${userId}/security/mfa`, // POST - Manage MFA
    passwordReset: (userId: string) => `/api/superadmin/users/${userId}/security/password-reset`, // POST - Reset password
    loginHistory: (userId: string) => `/api/superadmin/users/${userId}/login-history`, // GET - Login history
    impersonateUser: (userId: string) => `/api/superadmin/users/${userId}/impersonate`, // POST - Impersonate user
    updateUserStatus: (userId: string) => `/api/superadmin/users/${userId}/status`, // POST - Update user status
    bulkUserOperations: '/api/superadmin/users/bulk-operations', // POST - Bulk user operations
    advancedUserSearch: '/api/superadmin/users/advanced-search', // GET - Advanced user search
    cohortAnalysis: '/api/superadmin/users/cohort-analysis', // GET - User cohort analysis
    userSegmentation: '/api/superadmin/users/segmentation', // GET - User segmentation

    // === CREDITS & BILLING MANAGEMENT ===
    creditOverview: '/api/superadmin/credits/overview', // GET - Credits overview
    adjustUserCredits: (userId: string) => `/api/superadmin/credits/users/${userId}/adjust`, // POST - Adjust credits
    transactions: '/api/superadmin/billing/transactions', // GET - Transaction history
    revenueAnalytics: '/api/superadmin/billing/revenue-analytics', // GET - Revenue analytics

    // === INFLUENCER DATABASE ===
    influencers: '/api/superadmin/influencers/master-database', // GET - Influencer database
    influencerDetails: (influencerId: string) => `/api/superadmin/influencers/${influencerId}/detailed`, // GET - Influencer details

    // === PROPOSALS MANAGEMENT ===
    proposalsOverview: '/api/superadmin/proposals/overview', // GET - Proposals overview
    proposalsManage: '/api/superadmin/proposals/manage', // GET - Manage proposals
    proposalStatus: (proposalId: string) => `/api/superadmin/proposals/${proposalId}/status`, // PUT - Update proposal status
    proposalsDashboard: '/api/superadmin/proposals/dashboard', // GET - Proposals dashboard
    proposalsHealth: '/api/superadmin/proposals/health', // GET - Proposals health
    availableInfluencers: '/api/superadmin/proposals/influencers/available', // GET - Available influencers
    availableBrands: '/api/superadmin/proposals/brands/available', // GET - Available brands
    brandTeams: '/api/superadmin/proposals/brands/teams', // GET - Brand teams
    teamMembers: (teamId: string) => `/api/superadmin/proposals/brands/teams/${teamId}/members`, // GET - Team members
    influencerPricing: '/api/superadmin/proposals/pricing/influencers', // POST - Set influencer pricing
    getInfluencerPricing: (profileId: string) => `/api/superadmin/proposals/pricing/influencers/${profileId}`, // GET - Get influencer pricing
    calculateCampaignPricing: (profileId: string) => `/api/superadmin/proposals/pricing/calculate/${profileId}`, // POST - Calculate pricing
    createInviteCampaign: '/api/superadmin/proposals/invite-campaigns', // POST - Create invite campaign
    publishInviteCampaign: (campaignId: string) => `/api/superadmin/proposals/invite-campaigns/${campaignId}/publish`, // POST - Publish campaign
    campaignApplications: (campaignId: string) => `/api/superadmin/proposals/invite-campaigns/${campaignId}/applications`, // GET - Campaign applications
    approveApplication: (applicationId: string) => `/api/superadmin/proposals/applications/${applicationId}/approve`, // POST - Approve application
    brandProposalDrafts: '/api/superadmin/proposals/brand-proposals/drafts', // GET/POST - Draft management
    latestDraft: '/api/superadmin/proposals/brand-proposals/drafts/latest', // GET - Latest draft
    brandProposals: '/api/superadmin/proposals/brand-proposals', // GET/POST - Brand proposals
    brandProposalDetails: (proposalId: string) => `/api/superadmin/proposals/brand-proposals/${proposalId}`, // GET - Proposal details
    assignInfluencers: (proposalId: string) => `/api/superadmin/proposals/brand-proposals/${proposalId}/influencers`, // POST - Assign influencers
    sendBrandProposal: (proposalId: string) => `/api/superadmin/proposals/brand-proposals/${proposalId}/send`, // POST - Send proposal

    // === SECURITY & PERMISSIONS ===
    securityAlerts: '/api/superadmin/security/alerts', // GET - Security alerts
    securityThreats: '/api/superadmin/security/threats', // GET - Security threats
    suspiciousActivities: '/api/superadmin/security/suspicious-activities', // GET - Suspicious activities
    emergencyUserLock: '/api/superadmin/security/user-lock', // POST - Emergency user lock
    complianceReports: '/api/superadmin/compliance/reports', // GET - Compliance reports

    // === ROLE & PERMISSION MANAGEMENT ===
    roles: '/api/superadmin/roles', // GET - Get roles
    createRole: '/api/superadmin/roles/create', // POST - Create role
    updateRolePermissions: (roleId: string) => `/api/superadmin/roles/${roleId}/permissions`, // PUT - Update role permissions
    permissionMatrix: '/api/superadmin/permissions/matrix', // GET - Permission matrix

    // === TEAM MANAGEMENT ===
    comprehensiveTeams: '/api/superadmin/teams/comprehensive', // GET - Comprehensive teams
    bulkTeamMemberOperations: (teamId: string) => `/api/superadmin/teams/${teamId}/members/bulk`, // POST - Bulk team operations
    updateTeamPermissions: (teamId: string) => `/api/superadmin/teams/${teamId}/permissions`, // PUT - Update team permissions

    // === AI SYSTEM MANAGEMENT ===
    aiModelsStatus: '/api/superadmin/ai/models/status', // GET - AI models status
    aiAnalysisQueue: '/api/superadmin/ai/analysis/queue', // GET - AI analysis queue
    aiAnalysisStats: '/api/superadmin/ai/analysis/stats', // GET - AI analysis stats
    aiAnalysisOverview: '/api/superadmin/ai/analysis/overview', // GET - AI analysis overview
    retryAIAnalysis: '/api/superadmin/ai/analysis/retry', // POST - Retry AI analysis

    // === CONTENT & MEDIA MANAGEMENT ===
    contentModerationQueue: '/api/superadmin/content/moderation/queue', // GET - Content moderation queue
    contentCategoriesDistribution: '/api/superadmin/content/categories/distribution', // GET - Content categories
    contentAnalyticsOverview: '/api/superadmin/content/analytics/overview', // GET - Content analytics
    cdnPerformance: '/api/superadmin/cdn/performance', // GET - CDN performance
    cdnAssets: '/api/superadmin/cdn/assets', // GET - CDN assets

    // === SYSTEM CONFIGURATION ===
    systemConfigurations: '/api/superadmin/system/configurations', // GET/PUT - System configurations
    featureFlags: '/api/superadmin/system/feature-flags', // GET - Feature flags
    toggleFeatureFlag: (flagId: string) => `/api/superadmin/system/feature-flags/${flagId}/toggle`, // POST - Toggle feature flag
    systemComponents: '/api/superadmin/system/components', // GET - System components
    restartComponent: (componentName: string) => `/api/superadmin/system/components/${componentName}/restart`, // POST - Restart component
    systemBroadcast: '/api/superadmin/system/broadcast', // POST - System broadcast

    // === PLATFORM ANALYTICS ===
    detailedPlatformUsage: '/api/superadmin/platform/usage/detailed', // GET - Detailed platform usage
    platformPerformanceMetrics: '/api/superadmin/platform/performance/metrics', // GET - Performance metrics
    apiUsageAnalytics: '/api/superadmin/platform/api/usage', // GET - API usage analytics

    // === BUSINESS INTELLIGENCE ===
    businessForecasting: '/api/superadmin/business/forecasting', // GET - Business forecasting

    // === OPERATIONS & MAINTENANCE ===
    operationsHealth: '/api/superadmin/operations/health', // GET - Operations health
    auditLog: '/api/superadmin/operations/audit-log', // GET - Audit log
    performMaintenance: '/api/superadmin/operations/maintenance', // POST - Perform maintenance
    backupStatus: '/api/superadmin/operations/backup-status', // GET - Backup status

    // === DATA EXPORT & INTEGRATION ===
    createDataExport: '/api/superadmin/data/export/comprehensive', // POST - Create data export
    dataExportJobs: '/api/superadmin/data/export/jobs', // GET - Data export jobs
    thirdPartyIntegrations: '/api/superadmin/integrations/third-party', // GET - Third party integrations

    // === FEATURE ACCESS MANAGEMENT ===
    featureAccessGrants: '/api/superadmin/features/access-grants', // GET - Feature access grants
    bulkFeatureGrant: '/api/superadmin/features/bulk-grant', // POST - Bulk feature grant
    grantProposalAccess: (userId: string) => `/api/superadmin/users/${userId}/features/proposals/grant`, // POST - Grant proposal access
    revokeProposalAccess: (userId: string) => `/api/superadmin/users/${userId}/features/proposals/revoke`, // POST - Revoke proposal access
  },

  // User Settings Endpoints (/api/v1/settings/)
  settings: {
    // Profile Management
    profile: '/api/v1/settings/profile', // GET/PUT - User profile
    account: '/api/v1/settings/account', // GET - Account status
    preferences: '/api/v1/settings/preferences', // GET/PUT - User preferences
    security: '/api/v1/settings/security', // GET - Security info

    // Profile Actions
    uploadAvatar: '/api/v1/settings/upload-avatar', // POST - Upload profile picture

    // Security Actions
    changePassword: '/api/v1/settings/change-password', // POST - Change password
    enable2FA: '/api/v1/settings/2fa/enable', // POST - Enable 2FA
    disable2FA: '/api/v1/settings/2fa/disable', // DELETE - Disable 2FA

    // Data Actions
    exportData: '/api/v1/settings/export-data', // GET - Export user data

    // Legacy
    user: '/api/v1/settings/user', // GET/PUT - User settings and preferences
    overview: '/api/v1/settings/overview', // GET - Settings overview (legacy)
  },

  // Teams Additional Endpoints
  teamsExtended: {
    myTeam: '/api/v1/teams/my-team', // GET - Current user's team
    myTeamUsage: '/api/v1/teams/my-team/usage', // GET - Team usage stats
    updateTeam: (teamId: string) => `/api/v1/teams/${teamId}`, // PUT - Update team settings
    updateMember: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`, // PUT - Update member role
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