/**
 * B2B Proposals API Service - Complete Rewrite
 * Based on backend team handover specifications for new proposals system
 */

import { getAuthHeaders, API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// =============================================================================
// TYPE DEFINITIONS - Based on Backend Schema
// =============================================================================

// Influencer Pricing (SUPERADMIN ONLY)
export interface InfluencerPricing {
  id: string
  profile_id: string
  instagram_username: string
  story_price_usd_cents: number
  post_price_usd_cents: number
  reel_price_usd_cents: number
  pricing_tier: 'micro' | 'standard' | 'premium' | 'celebrity'
  negotiable: boolean
  minimum_campaign_value_usd_cents: number
  last_updated_by_admin_id: string
  created_at: string
  updated_at: string
}

// Invite Campaign System
export interface InviteCampaign {
  id: string
  campaign_name: string
  campaign_description: string
  campaign_type: 'paid' | 'barter' | 'hybrid'
  deliverables: Deliverable[]
  invite_link_slug: string
  eligible_follower_range: {
    min: number
    max: number
  }
  eligible_categories: string[]
  terms_and_conditions: string
  total_applications_received: number
  total_applications_approved: number
  status: 'draft' | 'active' | 'paused' | 'closed'
  created_by_admin_id: string
  published_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface Deliverable {
  type: 'story' | 'post' | 'reel' | 'video' | 'live' | 'ugc'
  quantity: number
  description?: string
  requirements?: string[]
}

// Influencer Applications
export interface InfluencerApplication {
  id: string
  invite_campaign_id: string
  instagram_username: string
  email: string
  phone_number?: string
  full_name?: string
  followers_count: number
  engagement_rate?: number
  category: string
  bio?: string
  proposed_story_price_usd_cents?: number
  proposed_post_price_usd_cents?: number
  proposed_reel_price_usd_cents?: number
  portfolio_links: string[]
  content_samples: string[]
  why_interested: string
  previous_brand_collaborations?: string[]
  application_status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  matched_profile_id?: string
  submitted_at: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// Brand Proposals (Main System)
export interface BrandProposal {
  id: string
  assigned_brand_users: string[]
  brand_company_name?: string
  proposal_title: string
  proposal_description: string
  total_campaign_budget_usd_cents: number
  deliverables: Deliverable[]
  campaign_timeline: {
    start_date?: string
    end_date?: string
    key_milestones?: Array<{
      date: string
      description: string
    }>
  }
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'needs_discussion'
  priority_level: 'high' | 'medium' | 'low'
  brand_response?: 'approved' | 'rejected' | 'request_changes' | 'needs_discussion'
  brand_feedback?: string
  brand_requested_changes?: string[]
  admin_notes?: string
  created_by_admin_id: string
  sent_to_brands_at?: string
  brand_responded_at?: string
  response_due_date?: string
  created_at: string
  updated_at: string
  
  // Related data
  assigned_influencers?: ProposalInfluencer[]
  communications?: ProposalCommunication[]
  brand_users?: Array<{
    id: string
    email: string
    full_name?: string
  }>
}

// Proposal Influencers (Link table)
export interface ProposalInfluencer {
  id: string
  proposal_id: string
  profile_id?: string
  application_id?: string
  instagram_username: string
  followers_count: number
  total_influencer_budget_usd_cents: number
  original_database_pricing?: {
    story_price_usd_cents: number
    post_price_usd_cents: number
    reel_price_usd_cents: number
  }
  admin_price_adjustments?: {
    story_price_usd_cents?: number
    post_price_usd_cents?: number
    reel_price_usd_cents?: number
    adjustment_reason?: string
  }
  assigned_deliverables: Deliverable[]
  selection_reason?: string
  added_by_admin_id: string
  added_at: string
}

// Communications
export interface ProposalCommunication {
  id: string
  proposal_id: string
  sender_user_id: string
  sender_type: 'admin' | 'brand'
  recipient_user_ids: string[]
  message_content: string
  message_type: 'message' | 'feedback' | 'change_request' | 'approval' | 'rejection'
  attachments?: string[]
  read_by_users: Record<string, string> // user_id -> read_timestamp
  is_system_message: boolean
  parent_message_id?: string
  sent_at: string
  created_at: string
}

// Dashboard Types
export interface SuperadminDashboard {
  total_proposals: number
  active_proposals: number
  pending_brand_responses: number
  approved_proposals: number
  total_proposed_value_usd_cents: number
  active_invite_campaigns: number
  total_applications_received: number
  proposals_by_status: Record<string, number>
  recent_proposals: BrandProposal[]
  recent_applications: InfluencerApplication[]
  top_performing_campaigns: InviteCampaign[]
}

export interface BrandDashboard {
  assigned_proposals: BrandProposal[]
  pending_responses: number
  overdue_responses: number
  approved_proposals: number
  total_proposals_received: number
  response_rate: number
  average_response_time_days: number
}

// =============================================================================
// SUPERADMIN API SERVICE
// =============================================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class SuperadminProposalsApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // ==========================================================================
  // INFLUENCER PRICING MANAGEMENT (SUPERADMIN ONLY)
  // ==========================================================================

  async createInfluencerPricing(pricingData: {
    profile_id: string
    instagram_username: string
    story_price_usd_cents: number
    post_price_usd_cents: number
    reel_price_usd_cents: number
    pricing_tier: 'micro' | 'standard' | 'premium' | 'celebrity'
    negotiable?: boolean
    minimum_campaign_value_usd_cents?: number
  }): Promise<ApiResponse<InfluencerPricing>> {
    return this.makeRequest('/api/v1/superadmin/proposals/pricing/influencers', {
      method: 'POST',
      body: JSON.stringify(pricingData)
    })
  }

  async updateInfluencerPricing(pricingId: string, updates: Partial<InfluencerPricing>): Promise<ApiResponse<InfluencerPricing>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/pricing/influencers/${pricingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async getInfluencerPricing(profileId: string): Promise<ApiResponse<InfluencerPricing>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/pricing/influencers/${profileId}`)
  }

  async calculateInfluencerCost(profileId: string, deliverables: Deliverable[]): Promise<ApiResponse<{
    total_cost_usd_cents: number
    cost_breakdown: Record<string, number>
    pricing_details: InfluencerPricing
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/pricing/calculate/${profileId}`, {
      method: 'POST',
      body: JSON.stringify({ deliverables })
    })
  }

  // ==========================================================================
  // INVITE CAMPAIGNS
  // ==========================================================================

  async createInviteCampaign(campaignData: {
    campaign_name: string
    campaign_description: string
    campaign_type: 'paid' | 'barter' | 'hybrid'
    deliverables: Deliverable[]
    eligible_follower_range: {
      min: number
      max: number
    }
    eligible_categories: string[]
    terms_and_conditions: string
    expires_at?: string
  }): Promise<ApiResponse<InviteCampaign>> {
    return this.makeRequest('/api/v1/superadmin/proposals/invite-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    })
  }

  async publishInviteCampaign(campaignId: string): Promise<ApiResponse<{
    campaign_id: string
    invite_url: string
    published_at: string
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/invite-campaigns/${campaignId}/publish`, {
      method: 'POST'
    })
  }

  async getInviteCampaigns(filters?: {
    status?: 'draft' | 'active' | 'paused' | 'closed'
    campaign_type?: 'paid' | 'barter' | 'hybrid'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    campaigns: InviteCampaign[]
    total_count: number
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/v1/superadmin/proposals/invite-campaigns?${params.toString()}`)
  }

  async getCampaignApplications(campaignId: string): Promise<ApiResponse<{
    applications: InfluencerApplication[]
    total_count: number
    pending_count: number
    approved_count: number
    rejected_count: number
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/invite-campaigns/${campaignId}/applications`)
  }

  async approveApplication(applicationId: string, approvalData?: {
    admin_notes?: string
    create_profile?: boolean
  }): Promise<ApiResponse<{
    application_id: string
    status: string
    profile_created?: boolean
    profile_id?: string
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvalData || {})
    })
  }

  async rejectApplication(applicationId: string, rejectionData: {
    admin_notes: string
    rejection_reason: string
  }): Promise<ApiResponse<{
    application_id: string
    status: string
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData)
    })
  }

  // ==========================================================================
  // BRAND PROPOSALS MANAGEMENT
  // ==========================================================================

  async createBrandProposal(proposalData: {
    assigned_brand_users: string[]
    brand_company_name?: string
    proposal_title: string
    proposal_description: string
    total_campaign_budget_usd_cents: number
    deliverables: Deliverable[]
    campaign_timeline?: {
      start_date?: string
      end_date?: string
      key_milestones?: Array<{
        date: string
        description: string
      }>
    }
    priority_level?: 'high' | 'medium' | 'low'
    admin_notes?: string
  }): Promise<ApiResponse<BrandProposal>> {
    return this.makeRequest('/api/v1/superadmin/proposals/brand-proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData)
    })
  }

  async updateBrandProposal(proposalId: string, updates: Partial<BrandProposal>): Promise<ApiResponse<BrandProposal>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async addInfluencersToProposal(proposalId: string, influencerData: {
    influencers: Array<{
      profile_id?: string
      application_id?: string
      instagram_username: string
      assigned_deliverables: Deliverable[]
      custom_pricing?: {
        story_price_usd_cents?: number
        post_price_usd_cents?: number
        reel_price_usd_cents?: number
        adjustment_reason?: string
      }
      selection_reason?: string
    }>
  }): Promise<ApiResponse<{
    proposal_id: string
    influencers_added: number
    total_budget_updated: number
    influencers: ProposalInfluencer[]
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}/influencers`, {
      method: 'POST',
      body: JSON.stringify(influencerData)
    })
  }

  async sendProposalToBrands(proposalId: string, sendData?: {
    response_due_date?: string
    custom_message?: string
    send_notifications?: boolean
  }): Promise<ApiResponse<{
    proposal_id: string
    sent_to_users: string[]
    sent_at: string
    response_due_date?: string
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}/send`, {
      method: 'POST',
      body: JSON.stringify(sendData || {})
    })
  }

  async getAllProposals(filters?: {
    status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'needs_discussion'
    priority_level?: 'high' | 'medium' | 'low'
    assigned_brand_user?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    proposals: BrandProposal[]
    total_count: number
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals?${params.toString()}`)
  }

  async getProposalDetails(proposalId: string): Promise<ApiResponse<BrandProposal>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}`)
  }

  async getProposalInfluencers(proposalId: string): Promise<ApiResponse<{
    influencers: ProposalInfluencer[]
    total_budget_usd_cents: number
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}/influencers`)
  }

  async getDashboard(): Promise<ApiResponse<SuperadminDashboard>> {
    return this.makeRequest('/api/v1/superadmin/proposals/dashboard')
  }

  // ==========================================================================
  // COMMUNICATIONS
  // ==========================================================================

  async sendMessage(proposalId: string, messageData: {
    recipient_user_ids: string[]
    message_content: string
    message_type?: 'message' | 'feedback' | 'change_request' | 'approval' | 'rejection'
    attachments?: string[]
  }): Promise<ApiResponse<ProposalCommunication>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}/communications`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    })
  }

  async getProposalCommunications(proposalId: string): Promise<ApiResponse<{
    communications: ProposalCommunication[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/superadmin/proposals/brand-proposals/${proposalId}/communications`)
  }
}

// =============================================================================
// BRAND USER API SERVICE
// =============================================================================

export class BrandProposalsApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // ==========================================================================
  // BRAND PROPOSAL VIEWING (NO SENSITIVE PRICING DATA)
  // ==========================================================================

  async getAssignedProposals(filters?: {
    status?: 'sent' | 'approved' | 'rejected' | 'needs_discussion'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    proposals: BrandProposal[]
    total_count: number
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/v1/brand/proposals?${params.toString()}`)
  }

  async getProposalDetails(proposalId: string): Promise<ApiResponse<BrandProposal>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}`)
  }

  async getProposalInfluencers(proposalId: string): Promise<ApiResponse<{
    influencers: Array<{
      id: string
      instagram_username: string
      followers_count: number
      assigned_deliverables: Deliverable[]
      // NOTE: NO PRICING DATA EXPOSED TO BRANDS
    }>
    total_influencers: number
  }>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/influencers`)
  }

  async getProposalStatus(proposalId: string): Promise<ApiResponse<{
    proposal_id: string
    status: string
    sent_at: string
    response_due_date?: string
    responded_at?: string
    brand_response?: string
  }>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/status`)
  }

  async submitResponse(proposalId: string, responseData: {
    response: 'approved' | 'rejected' | 'request_changes' | 'needs_discussion'
    feedback?: string
    requested_changes?: string[]
  }): Promise<ApiResponse<{
    proposal_id: string
    response: string
    responded_at: string
    status_updated: boolean
  }>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/respond`, {
      method: 'POST',
      body: JSON.stringify(responseData)
    })
  }

  async getDashboard(): Promise<ApiResponse<BrandDashboard>> {
    return this.makeRequest('/api/v1/brand/proposals/summary')
  }

  // ==========================================================================
  // BRAND COMMUNICATIONS
  // ==========================================================================

  async sendMessage(proposalId: string, messageData: {
    message_content: string
    message_type?: 'message' | 'feedback' | 'change_request'
    attachments?: string[]
  }): Promise<ApiResponse<ProposalCommunication>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/communications`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    })
  }

  async getProposalCommunications(proposalId: string): Promise<ApiResponse<{
    communications: ProposalCommunication[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/communications`)
  }

  async markMessagesAsRead(proposalId: string, messageIds: string[]): Promise<ApiResponse<{
    messages_marked: number
  }>> {
    return this.makeRequest(`/api/v1/brand/proposals/${proposalId}/communications/read`, {
      method: 'POST',
      body: JSON.stringify({ message_ids: messageIds })
    })
  }
}

// =============================================================================
// PUBLIC INVITE APPLICATION SYSTEM (NO AUTH REQUIRED)
// =============================================================================

export class PublicInviteApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: errorText || `Request failed with status ${response.status}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  async getInviteCampaign(inviteSlug: string): Promise<ApiResponse<{
    campaign: InviteCampaign
    is_active: boolean
    applications_count: number
  }>> {
    return this.makeRequest(`/api/public/invite/${inviteSlug}`)
  }

  async submitApplication(inviteSlug: string, applicationData: {
    instagram_username: string
    email: string
    phone_number?: string
    full_name?: string
    followers_count: number
    engagement_rate?: number
    category: string
    bio?: string
    proposed_story_price_usd_cents?: number
    proposed_post_price_usd_cents?: number
    proposed_reel_price_usd_cents?: number
    portfolio_links: string[]
    content_samples: string[]
    why_interested: string
    previous_brand_collaborations?: string[]
    consent_to_terms: boolean
    consent_to_data_processing: boolean
  }): Promise<ApiResponse<{
    application_id: string
    status: string
    submitted_at: string
    estimated_review_time_days: number
  }>> {
    return this.makeRequest(`/api/public/invite/${inviteSlug}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData)
    })
  }
}

// =============================================================================
// EXPORT INSTANCES
// =============================================================================

export const superadminProposalsApi = new SuperadminProposalsApiService()
export const brandProposalsApi = new BrandProposalsApiService()
export const publicInviteApi = new PublicInviteApiService()

// Export all types for use in components
export type {
  InfluencerPricing,
  InviteCampaign,
  InfluencerApplication,
  BrandProposal,
  ProposalInfluencer,
  ProposalCommunication,
  SuperadminDashboard,
  BrandDashboard,
  Deliverable
}