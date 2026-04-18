/**
 * Admin Proposal Master API Service
 * Complete admin proposal management + brand proposal view system
 * Uses /api/v1/admin/proposals (admin) and /api/v1/campaigns/proposals (brand)
 */

import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AdminProposal {
  id: string
  title: string
  campaign_name: string
  description?: string
  proposal_notes?: string
  status: 'draft' | 'sent' | 'in_review' | 'approved' | 'rejected' | 'more_requested'
  user_id: string
  user_email?: string
  total_influencers: number
  selected_count: number
  total_sell_amount?: number
  total_cost_amount?: number
  margin_percentage?: number
  deadline_at?: string
  cover_image_url?: string
  visible_fields?: Record<string, boolean>
  brand_notes?: string
  request_more_notes?: string
  created_at: string
  sent_at?: string
}

export interface AdminProposalDetail {
  proposal: {
    id: string
    title: string
    campaign_name: string
    description?: string
    proposal_notes?: string
    status: string
    user_id: string
    user_email?: string
    visible_fields?: Record<string, boolean>
    brand_notes?: string
    request_more_notes?: string
    deadline_at?: string
    cover_image_url?: string
    created_at: string
    sent_at?: string
  }
  influencers: AdminProposalInfluencer[]
  financials: {
    total_sell: number
    total_cost: number
    margin_percentage: number
    margin_amount: number
  }
  timeline: Array<{
    event: string
    timestamp: string
    notes?: string
  }>
}

export interface AdminProposalInfluencer {
  id: string
  influencer_db_id?: string
  profile_id?: string
  priority_order: number
  selected_by_user: boolean
  selected_at?: string
  admin_notes?: string
  username?: string
  full_name?: string
  profile_image_url?: string
  is_verified: boolean
  followers_count?: number
  engagement_rate?: number
  categories: string[]
  tier?: string
  sell_price_snapshot?: Record<string, number | null>
  cost_price_snapshot?: Record<string, number | null>
  custom_sell_pricing?: Record<string, number | null>
  assigned_deliverables?: Array<{ type: string; quantity: number }>
  selected_deliverables?: string[]
}

export interface BrandProposalView {
  proposal: {
    id: string
    title: string
    campaign_name: string
    description?: string
    proposal_notes?: string
    status: string
    sent_at?: string
    deadline_at?: string
    cover_image_url?: string
    total_sell_amount?: number
    visible_fields?: Record<string, boolean>
    created_at: string
    more_added_at?: string
    request_more_at?: string
  }
  influencers: BrandInfluencer[]
  summary: {
    total_influencers: number
    selected_count: number
    total_reach: number
    avg_engagement_rate: number
    estimated_total_sell: number
    category_breakdown: Array<{ name: string; count: number; percentage: number }>
    tier_breakdown: Array<{ name: string; count: number; percentage: number }>
  }
}

export interface BrandInfluencer {
  id: string
  influencer_db_id?: string
  priority_order: number
  batch_number?: number
  added_at?: string
  selected_by_user: boolean
  selected_at?: string
  username?: string
  full_name?: string
  profile_image_url?: string
  is_verified: boolean
  followers_count?: number
  following_count?: number
  posts_count?: number
  biography?: string
  categories: string[]
  tags: string[]
  tier?: string
  engagement_rate?: number
  avg_likes?: number
  avg_comments?: number
  avg_views?: number
  sell_pricing?: Record<string, number | null>
  available_deliverables?: string[]
  selected_deliverables?: string[]
  assigned_deliverables?: Array<{ type: string; quantity: number }>
}

export interface AdminProposalStats {
  total_proposals: number
  active_proposals: number
  approved_proposals: number
  approval_rate: number
  total_margin: number
  avg_margin_percentage: number
}

export interface AISnapshotResponse {
  headline: string
  insights: Array<{
    type: string
    title: string
    data: any
  }>
  recommendations: string[]
  scores: {
    authenticity: number
    sentiment: number
    avg_engagement: number
    total_reach: number
    creators_with_ai_data: number
    total_selected: number
  }
}

// =============================================================================
// ADMIN PROPOSAL API SERVICE
// =============================================================================

export class AdminProposalApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/v1/admin/proposals`
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/admin/proposals/upload-cover - Upload cover image to CDN
  // ---------------------------------------------------------------------------
  async uploadCoverImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetchWithAuth(`${this.baseUrl}/upload-cover`, {
      method: 'POST',
      headers: {
        // Let browser set Content-Type with boundary for multipart
        'Authorization': getAuthHeaders()['Authorization'] || '',
      },
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload cover image: ${errorText}`)
    }
    const result = await response.json()
    return result.data.url
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/admin/proposals - Create proposal
  // ---------------------------------------------------------------------------
  async createProposal(data: {
    title: string
    campaign_name: string
    description?: string
    proposal_notes?: string
    user_id: string
    visible_fields?: Record<string, boolean>
    deadline_at?: string
    cover_image_url?: string
  }): Promise<AdminProposal> {
    const response = await fetchWithAuth(this.baseUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create proposal: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // GET /api/v1/admin/proposals - List all proposals
  // ---------------------------------------------------------------------------
  async listProposals(filters?: {
    status?: string
    user_id?: string
    limit?: number
    offset?: number
  }): Promise<{
    proposals: AdminProposal[]
    pagination: { limit: number; offset: number; total: number }
  }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to list proposals: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // GET /api/v1/admin/proposals/stats - Dashboard stats
  // ---------------------------------------------------------------------------
  async getStats(): Promise<AdminProposalStats> {
    const response = await fetchWithAuth(`${this.baseUrl}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get proposal stats: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // GET /api/v1/admin/proposals/{id} - Full detail
  // ---------------------------------------------------------------------------
  async getDetail(proposalId: string): Promise<AdminProposalDetail> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get proposal detail: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // PUT /api/v1/admin/proposals/{id} - Update proposal
  // ---------------------------------------------------------------------------
  async updateProposal(proposalId: string, data: {
    title?: string
    campaign_name?: string
    description?: string
    proposal_notes?: string
    visible_fields?: Record<string, boolean>
    deadline_at?: string
    cover_image_url?: string
    status?: string
  }): Promise<AdminProposal> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update proposal: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/admin/proposals/{id}/influencers - Add influencers from master DB
  // ---------------------------------------------------------------------------
  async addInfluencers(proposalId: string, data: {
    influencer_ids: string[]
    custom_pricing?: Record<string, Record<string, number | null>>
    deliverable_assignments?: Array<{
      influencer_db_id: string
      deliverables: Array<{ type: string; quantity: number }>
    }>
  }): Promise<{
    added_count: number
    influencer_ids: string[]
  }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/influencers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add influencers: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/v1/admin/proposals/{id}/influencers/{inf_id} - Remove influencer
  // ---------------------------------------------------------------------------
  async removeInfluencer(proposalId: string, influencerId: string): Promise<{
    removed: boolean
    message: string
  }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/influencers/${influencerId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to remove influencer: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/admin/proposals/{id}/send - Send to brand
  // ---------------------------------------------------------------------------
  async sendToBrand(proposalId: string): Promise<{
    proposal_id: string
    status: string
    sent_at: string
  }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to send proposal to brand: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/admin/proposals/{id}/add-more - Add more influencers
  // ---------------------------------------------------------------------------
  async addMoreInfluencers(proposalId: string, data: {
    influencer_ids: string[]
    custom_pricing?: Record<string, Record<string, number | null>>
    deliverable_assignments?: Array<{
      influencer_db_id: string
      deliverables: Array<{ type: string; quantity: number }>
    }>
  }): Promise<{
    added_count: number
    influencer_ids: string[]
  }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/add-more`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add more influencers: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }
}

// =============================================================================
// BRAND PROPOSAL VIEW API SERVICE
// =============================================================================

export class BrandProposalViewApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals`
  }

  // ---------------------------------------------------------------------------
  // GET /api/v1/campaigns/proposals - List brand proposals
  // ---------------------------------------------------------------------------
  async listProposals(filters?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{
    proposals: BrandProposalView[]
    total_count: number
  }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to list brand proposals: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // GET /api/v1/campaigns/proposals/{id} - Brand-visible detail
  // ---------------------------------------------------------------------------
  async getDetail(proposalId: string): Promise<BrandProposalView> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get proposal detail: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // PUT /api/v1/campaigns/proposals/{id}/influencers - Update selection
  // ---------------------------------------------------------------------------
  async updateInfluencerSelection(proposalId: string, data: {
    selected_influencer_ids: string[]
    deliverable_selections?: { influencer_id: string; deliverables: string[] }[]
    notes?: string
  }): Promise<{
    updated_count: number
    selected_count: number
    message: string
  }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/influencers`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update influencer selection: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/campaigns/proposals/{id}/request-more - Request more influencers
  // ---------------------------------------------------------------------------
  async requestMore(proposalId: string, data: {
    notes: string
  }): Promise<{
    proposal_id: string
    status: string
    request_more_at: string
    message: string
  }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/request-more`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to request more influencers: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/campaigns/proposals/{id}/approve - Approve proposal
  // ---------------------------------------------------------------------------
  async approveProposal(proposalId: string, data: {
    selected_influencer_ids: string[]
    notes?: string
  }): Promise<{
    campaign_id: string
    campaign_name: string
    campaign_status: string
    proposal_id: string
    selected_influencers_count: number
    created_at: string
  }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/approve`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to approve proposal: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/campaigns/proposals/{id}/reject - Reject proposal
  // ---------------------------------------------------------------------------
  async rejectProposal(proposalId: string, data: {
    reason?: string
  }): Promise<{
    proposal_id: string
    status: string
    rejected_at: string
    message: string
  }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/reject`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to reject proposal: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/campaigns/proposals/{id}/ai-snapshot - AI selection insights
  // ---------------------------------------------------------------------------
  async getAISnapshot(proposalId: string, data: {
    selected_influencer_ids: string[]
  }): Promise<AISnapshotResponse> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/ai-snapshot`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get AI snapshot: ${errorText}`)
    }
    const result = await response.json()
    return result.data
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const adminProposalApi = new AdminProposalApiService()
export const brandProposalViewApi = new BrandProposalViewApiService()
