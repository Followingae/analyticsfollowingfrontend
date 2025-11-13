/**
 * Complete Campaign API Service
 * 🚀 ALL 33 LIVE CAMPAIGN ENDPOINTS
 *
 * Endpoints:
 * 1. Campaign CRUD: 8 endpoints (includes restore)
 * 2. Overview/Dashboard: 1 endpoint
 * 3. Posts Management: 3 endpoints
 * 4. Analytics & Data: 4 endpoints (includes AI insights, audience)
 * 5. Brand & Export: 4 endpoints (logo, export)
 * 6. Campaign Proposals: 6 endpoints
 * 7. Workflow System: 2 endpoints (user/superadmin flows)
 * 8. Influencer Selection: 1 endpoint
 * 9. System Health: 4 endpoints
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ==================== TYPE DEFINITIONS ====================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'in_review' | 'completed' | 'archived'
export type ProposalStatus = 'draft' | 'sent' | 'in_review' | 'approved' | 'rejected'
export type TrendType = 'up' | 'down' | 'stable'

export interface Campaign {
  id: string
  name: string
  description?: string
  brand_name: string
  brand_logo_url?: string
  status: CampaignStatus
  budget?: number
  spent?: number
  start_date?: string
  end_date?: string
  tags?: string[]
  engagement_rate: number
  total_reach: number
  creators_count: number
  posts_count: number
  created_by: 'user' | 'superadmin'
  proposal_id?: string
  created_at: string
  updated_at: string
  progress?: number
  deadline?: string
  content_delivered?: number
  content_total?: number
}

export interface CampaignOverview {
  summary: {
    totalCampaigns: number
    totalCreators: number
    totalReach: {
      current: number
      previous: number
      trend: TrendType
      changePercent: number
    }
    avgEngagementRate: {
      current: number
      previous: number
      trend: TrendType
      changePercent: number
    }
    activeCampaigns: number
    completedCampaigns: number
    pendingProposals: number
    thisMonthCampaigns: number
    totalSpend: {
      current: number
      previous: number
      trend: TrendType
      changePercent: number
    }
    contentProduced: number
  }
  recent_campaigns: Campaign[]
  top_creators: {
    id: string
    name: string
    handle: string
    avatar: string
    campaigns_count: number
    total_reach: number
    avg_engagement: number
  }[]
}

export interface CampaignPost {
  id: string
  campaign_id: string
  creator_username: string
  creator_profile_pic: string
  post_url: string
  post_image: string
  caption: string
  posted_at: string
  likes: number
  comments: number
  shares: number
  views: number
  engagement_rate: number
  reach: number
}

export interface CampaignAnalytics {
  campaign_id: string
  campaign_name: string
  period: '7d' | '30d' | '90d' | 'all'
  daily_stats: {
    date: string
    reach: number
    views: number
    impressions: number
    engagement: number
    clicks: number
  }[]
  totals: {
    total_reach: number
    total_views: number
    total_impressions: number
    total_engagement: number
    total_clicks: number
    avg_engagement_rate: number
  }
  performance_insights: {
    best_performing_day: string
    peak_reach_day: string
    trend: 'increasing' | 'decreasing' | 'stable'
    growth_rate: number
  }
}

export interface CampaignProposal {
  id: string
  title: string
  campaign_name: string
  description?: string
  status: ProposalStatus
  total_budget: number
  influencer_count: number
  created_at: string
  updated_at: string
  expected_reach: number
  avg_engagement_rate: number
  proposal_type: 'influencer_list' | 'campaign_package'
  created_by_superadmin_id: string
  proposal_notes?: string
  suggested_influencers?: SuggestedInfluencer[]
  expected_metrics?: {
    total_reach: number
    avg_engagement_rate: number
    estimated_impressions: number
  }
}

export interface SuggestedInfluencer {
  id: string
  username: string
  profile_pic: string
  followers: number
  engagement_rate: number
  estimated_cost: number
  selected: boolean
}

export interface CampaignInfluencer {
  id: string
  username: string
  profile_pic: string
  followers: number
  engagement_rate: number
  posts_count: number
  total_reach: number
  added_at: string
}

// ==================== NEW ENDPOINT INTERFACES ====================

export interface CampaignAudience {
  total_audience: number
  audience_demographics: {
    age_groups: { [key: string]: number }
    gender_distribution: { [key: string]: number }
    location_breakdown: { [key: string]: number }
    interests: string[]
  }
  reach_potential: {
    estimated_reach: number
    engagement_potential: number
    audience_overlap: number
  }
}

export interface CampaignAIInsights {
  performance_score: number
  optimization_suggestions: string[]
  content_recommendations: {
    best_posting_times: string[]
    recommended_hashtags: string[]
    content_themes: string[]
  }
  competitor_analysis: {
    similar_campaigns: Array<{
      id: string
      name: string
      performance: number
    }>
    market_position: string
  }
  predicted_outcomes: {
    estimated_reach: number
    estimated_engagement: number
    estimated_conversions: number
  }
}

export interface CampaignExport {
  export_id: string
  format: 'pdf' | 'excel' | 'csv'
  download_url: string
  expires_at: string
  file_size: number
}

export interface CampaignHealth {
  status: 'healthy' | 'warning' | 'critical'
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
    resolution: string
  }>
  last_checked: string
  next_check: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==================== CAMPAIGN API SERVICE ====================

class CampaignApiComplete {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  // ==================== 1. CAMPAIGN CRUD (7 ENDPOINTS) ====================

  /**
   * Create User Campaign (Simple Flow) - PRIMARY METHOD
   * POST /api/v1/campaigns/workflow/user/create
   *
   * Use this for regular users creating their own campaigns.
   * Campaign goes straight to 'active' status.
   */
  async createUserCampaign(data: {
    name: string
    brand_name: string
    brand_logo_url?: string
    description?: string
    budget?: number
    start_date?: string
    end_date?: string
  }): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}/api/v1/campaigns/workflow/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Create Superadmin Campaign (Full Workflow) - SUPERADMIN ONLY
   * POST /api/v1/campaigns/workflow/superadmin/create
   *
   * Creates campaign FOR a user with full workflow stages.
   */
  async createSuperadminCampaign(data: {
    user_id: string
    name: string
    brand_name: string
    brand_logo_url?: string
    description?: string
    budget?: number
    start_date?: string
    end_date?: string
  }): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}/api/v1/campaigns/workflow/superadmin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * @deprecated LEGACY: Use createUserCampaign() instead
   */
  async createCampaign(data: {
    name: string
    description?: string
    brand_name: string
    start_date?: string
    end_date?: string
    budget?: number
    tags?: string[]
  }): Promise<ApiResponse<Campaign>> {
    console.warn('⚠️ DEPRECATED: Use createUserCampaign() instead')
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.list}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * List Campaigns
   * GET /api/v1/campaigns/?status=active&limit=50&offset=0
   */
  async listCampaigns(params?: {
    status?: CampaignStatus
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    campaigns: Campaign[]
    total_count: number
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set('status', params.status)
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())

    const url = `${this.baseUrl}${ENDPOINTS.campaigns.list}?${queryParams.toString()}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Get Campaign Details
   * GET /api/v1/campaigns/{campaign_id}
   */
  async getCampaignDetails(campaignId: string): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}`)
    return response.json()
  }

  /**
   * Update Campaign
   * PATCH /api/v1/campaigns/{campaign_id}
   */
  async updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.update(campaignId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Delete Campaign (Archive)
   * DELETE /api/v1/campaigns/{campaign_id}
   */
  async deleteCampaign(campaignId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.delete(campaignId)}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  /**
   * Restore Campaign
   * POST /api/v1/campaigns/{campaign_id}/restore
   */
  async restoreCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.restore(campaignId)}`, {
      method: 'POST'
    })
    return response.json()
  }

  /**
   * Update Campaign Status
   * PATCH /api/v1/campaigns/{campaign_id}/status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<ApiResponse<Campaign>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.updateStatus(campaignId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    return response.json()
  }

  // ==================== 2. OVERVIEW/DASHBOARD (1 ENDPOINT) ====================

  /**
   * Get Dashboard Overview
   * GET /api/v1/campaigns/overview
   */
  async getDashboardOverview(): Promise<ApiResponse<CampaignOverview>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.overview}`)
    return response.json()
  }

  // ==================== 3. POSTS MANAGEMENT (3 ENDPOINTS) ====================

  /**
   * List Campaign Posts
   * GET /api/v1/campaigns/{campaign_id}/posts?limit=50&offset=0
   */
  async listCampaignPosts(
    campaignId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<{
    posts: CampaignPost[]
    total_count: number
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())

    const url = `${this.baseUrl}${ENDPOINTS.campaigns.posts(campaignId)}?${queryParams.toString()}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Add Post to Campaign
   * POST /api/v1/campaigns/{campaign_id}/posts
   */
  async addPostToCampaign(
    campaignId: string,
    data: {
      instagram_post_url: string
      notes?: string
    }
  ): Promise<ApiResponse<CampaignPost>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.posts(campaignId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Remove Post from Campaign
   * DELETE /api/v1/campaigns/{campaign_id}/posts/{post_id}
   */
  async removePostFromCampaign(
    campaignId: string,
    postId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.removePost(campaignId, postId)}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  // ==================== 4. ANALYTICS & REPORTS (2 ENDPOINTS) ====================

  /**
   * Get Campaign Analytics
   * GET /api/v1/campaigns/{campaign_id}/analytics?period=30d
   */
  async getCampaignAnalytics(
    campaignId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<ApiResponse<CampaignAnalytics>> {
    const url = `${this.baseUrl}${ENDPOINTS.campaigns.analytics(campaignId)}?period=${period}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Generate Report
   * POST /api/v1/campaigns/{campaign_id}/reports/generate
   */
  async generateReport(
    campaignId: string,
    data: {
      format: 'pdf' | 'excel'
      sections: string[]
    }
  ): Promise<ApiResponse<{
    report_url: string
    expires_at: string
  }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.generateReport(campaignId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  // ==================== 5. CAMPAIGN PROPOSALS (5 ENDPOINTS) ====================

  /**
   * List User Proposals
   * GET /api/v1/campaigns/proposals?status=sent&limit=50&offset=0
   */
  async listProposals(params?: {
    status?: ProposalStatus
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    proposals: CampaignProposal[]
    total_count: number
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set('status', params.status)
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())

    const url = `${this.baseUrl}${ENDPOINTS.campaigns.proposals}?${queryParams.toString()}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Get Proposal Details
   * GET /api/v1/campaigns/proposals/{proposal_id}
   */
  async getProposalDetails(proposalId: string): Promise<ApiResponse<CampaignProposal>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.proposalDetail(proposalId)}`)
    return response.json()
  }

  /**
   * Select Influencers in Proposal
   * PUT /api/v1/campaigns/proposals/{proposal_id}/influencers
   */
  async selectInfluencers(
    proposalId: string,
    data: {
      selected_influencer_ids: string[]
    }
  ): Promise<ApiResponse<CampaignProposal>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.selectInfluencers(proposalId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Approve Proposal
   * POST /api/v1/campaigns/proposals/{proposal_id}/approve
   */
  async approveProposal(
    proposalId: string,
    data: {
      selected_influencer_ids: string[]
      notes?: string
    }
  ): Promise<ApiResponse<{
    campaign_id: string
    campaign_name: string
    status: string
    created_from_proposal: boolean
  }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.approveProposal(proposalId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Reject Proposal
   * POST /api/v1/campaigns/proposals/{proposal_id}/reject
   */
  async rejectProposal(
    proposalId: string,
    data: {
      reason: string
    }
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.rejectProposal(proposalId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  // ==================== 6. CAMPAIGN INFLUENCERS (1 ENDPOINT) ====================

  /**
   * Get Campaign Influencers
   * GET /api/v1/campaigns/{campaign_id}/creators
   */
  async getCampaignInfluencers(campaignId: string): Promise<ApiResponse<{
    influencers: CampaignInfluencer[]
  }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.creators(campaignId)}`)
    return response.json()
  }

  /**
   * Add Creator to Campaign
   * POST /api/v1/campaigns/{campaign_id}/creators
   */
  async addCreatorToCampaign(
    campaignId: string,
    creatorData: {
      username: string;
      notes?: string;
      role?: string;
    }
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.addCreator(campaignId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creatorData)
    })
    return response.json()
  }

  /**
   * Remove Creator from Campaign
   * DELETE /api/v1/campaigns/{campaign_id}/creators/{creator_id}
   */
  async removeCreatorFromCampaign(
    campaignId: string,
    creatorId: string
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(`${this.baseUrl}/api/v1/campaigns/${campaignId}/creators/${creatorId}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  // ==================== 7. WORKFLOW SYSTEM (NEW - HIGH PRIORITY) ====================

  /**
   * Select Influencer for Campaign (Workflow - User Action)
   * POST /api/v1/campaigns/workflow/{campaign_id}/select-influencer
   */
  async selectInfluencerForWorkflow(
    campaignId: string,
    data: {
      profile_id: string
      selection_notes?: string
      estimated_cost?: number
    }
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/select-influencer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return response.json()
  }

  /**
   * Get Influencer Selections for Campaign
   * GET /api/v1/campaigns/workflow/{campaign_id}/selections
   */
  async getInfluencerSelections(campaignId: string): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/selections`
    )
    return response.json()
  }

  /**
   * Lock Selected Influencers (Superadmin Only)
   * POST /api/v1/campaigns/workflow/{campaign_id}/lock-influencers
   */
  async lockInfluencers(
    campaignId: string,
    data: {
      selection_ids: string[]
      lock_duration_hours?: number
    }
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/lock-influencers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return response.json()
  }

  /**
   * Submit Content for Approval
   * POST /api/v1/campaigns/workflow/{campaign_id}/submit-content
   */
  async submitContentForApproval(
    campaignId: string,
    data: {
      profile_id: string
      content_type: 'draft' | 'final' | 'published'
      content_url: string
      content_caption?: string
      content_media_urls?: string[]
    }
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/submit-content`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return response.json()
  }

  /**
   * Review Submitted Content (Superadmin Only)
   * POST /api/v1/campaigns/workflow/{campaign_id}/content/{approval_id}/review
   */
  async reviewContent(
    campaignId: string,
    approvalId: string,
    data: {
      approval_status: 'approved' | 'rejected' | 'revision_requested'
      reviewer_notes?: string
      revision_notes?: string
    }
  ): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/content/${approvalId}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return response.json()
  }

  /**
   * Get Workflow State
   * GET /api/v1/campaigns/workflow/{campaign_id}/state
   */
  async getWorkflowState(campaignId: string): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/${campaignId}/state`
    )
    return response.json()
  }

  /**
   * Get Workflow Notifications
   * GET /api/v1/campaigns/workflow/notifications
   */
  async getWorkflowNotifications(params?: {
    unread_only?: boolean
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.unread_only) queryParams.set('unread_only', 'true')

    const url = `${this.baseUrl}/api/v1/campaigns/workflow/notifications?${queryParams.toString()}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Mark Notification as Read
   * POST /api/v1/campaigns/workflow/notifications/{notification_id}/read
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/api/v1/campaigns/workflow/notifications/${notificationId}/read`,
      {
        method: 'POST'
      }
    )
    return response.json()
  }

  // ==================== ADDITIONAL ANALYTICS & DATA (4 NEW ENDPOINTS) ====================

  /**
   * Get Campaign Audience Data
   * GET /api/v1/campaigns/{campaign_id}/audience
   */
  async getCampaignAudience(campaignId: string): Promise<ApiResponse<CampaignAudience>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/audience`)
    return response.json()
  }

  /**
   * Get Campaign AI Insights
   * GET /api/v1/campaigns/{campaign_id}/ai-insights
   */
  async getCampaignAIInsights(campaignId: string): Promise<ApiResponse<CampaignAIInsights>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/ai-insights`)
    return response.json()
  }

  // ==================== BRAND & EXPORT (4 NEW ENDPOINTS) ====================

  /**
   * Upload Brand Logo
   * POST /api/v1/campaigns/{campaign_id}/logo
   */
  async uploadBrandLogo(
    campaignId: string,
    logoFile: File
  ): Promise<ApiResponse<{ logo_url: string }>> {
    const formData = new FormData()
    formData.append('logo', logoFile)

    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/logo`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }

  /**
   * Delete Brand Logo
   * DELETE /api/v1/campaigns/{campaign_id}/logo
   */
  async deleteBrandLogo(campaignId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/logo`, {
      method: 'DELETE'
    })
    return response.json()
  }

  /**
   * Export Campaign Data
   * GET /api/v1/campaigns/{campaign_id}/export
   */
  async exportCampaign(
    campaignId: string,
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<ApiResponse<CampaignExport>> {
    const url = `${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/export?format=${format}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  /**
   * Export All Campaigns
   * GET /api/v1/campaigns/export/all
   */
  async exportAllCampaigns(
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<ApiResponse<CampaignExport>> {
    const url = `${this.baseUrl}/api/v1/campaigns/export/all?format=${format}`
    const response = await fetchWithAuth(url)
    return response.json()
  }

  // ==================== SYSTEM HEALTH (4 NEW ENDPOINTS) ====================

  /**
   * Cleanup Campaign Orphaned Creators
   * POST /api/v1/campaigns/{campaign_id}/cleanup
   */
  async cleanupCampaignOrphanedCreators(
    campaignId: string
  ): Promise<ApiResponse<{ cleaned_count: number; message: string }>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/cleanup`, {
      method: 'POST'
    })
    return response.json()
  }

  /**
   * Campaign Health Check
   * GET /api/v1/campaigns/health/check
   */
  async campaignHealthCheck(): Promise<ApiResponse<CampaignHealth>> {
    const response = await fetchWithAuth(`${this.baseUrl}/api/v1/campaigns/health/check`)
    return response.json()
  }

  /**
   * Proposal Health Check
   * GET /api/v1/campaigns/proposals/health/check
   */
  async proposalHealthCheck(): Promise<ApiResponse<CampaignHealth>> {
    const response = await fetchWithAuth(`${this.baseUrl}/api/v1/campaigns/proposals/health/check`)
    return response.json()
  }

  /**
   * Get Campaign Health Status
   * GET /api/v1/campaigns/{campaign_id}/health
   */
  async getCampaignHealth(campaignId: string): Promise<ApiResponse<CampaignHealth>> {
    const response = await fetchWithAuth(`${this.baseUrl}${ENDPOINTS.campaigns.detail(campaignId)}/health`)
    return response.json()
  }
}

// Export singleton instance
export const campaignApi = new CampaignApiComplete()

// Export all types
export type {
  ApiResponse,
  Campaign,
  CampaignOverview,
  CampaignPost,
  CampaignAnalytics,
  CampaignProposal,
  SuggestedInfluencer,
  CampaignInfluencer,
  CampaignAudience,
  CampaignAIInsights,
  CampaignExport,
  CampaignHealth,
  CampaignStatus,
  ProposalStatus,
  TrendType
}
