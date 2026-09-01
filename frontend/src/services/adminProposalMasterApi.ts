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

/** The caller's money scope, decided server-side by `app/core/field_policy.py`.
 *  Only 'leadership' (superadmin/admin/ceo/cofounder) is served cost and margin; the
 *  other scopes get null in those fields and the screens leave the columns out. */
export type MoneyScope = 'leadership' | 'talent' | 'account' | 'none'

export interface AdminProposal {
  id: string
  title: string
  campaign_name: string
  description?: string
  proposal_notes?: string
  status: 'draft' | 'building' | 'pending_internal_review' | 'internal_changes_requested' | 'internally_approved' | 'sent' | 'in_review' | 'approved' | 'rejected' | 'more_requested'
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

export interface AddOnResult {
  influencer_id: string
  username?: string | null
  applied: boolean
  /** Applied to somebody the client has not selected: the offer is open, nothing charged. */
  offered_only: boolean
  was: number
  now: number
  delta: number
  locked: boolean
  campaign_repriced: boolean
}

export interface ReopenState {
  status: string
  can_reopen: boolean
  budget?: number | null
  committed?: number | null
  remaining?: number | null
  locked_count: number
  on_the_table: number
  reopen_count: number
  reopened_at?: string | null
  reopen_note?: string | null
  confirmed: Array<{
    id: string
    username?: string | null
    full_name?: string | null
    profile_image_url?: string | null
    locked_at?: string | null
    locked_round?: number | null
  }>
}

export interface ReopenResult {
  status: string
  locked_count: number
  reopened_count: number
  round: number
  budget?: number | null
  committed?: number | null
  remaining?: number | null
}

/** FastAPI puts the sentence in `detail`. Reading it means the toast says what went
 *  wrong instead of showing the client a JSON blob. */
async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    return body?.detail || fallback
  } catch {
    return fallback
  }
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
    total_budget?: number | null
    /** A partial confirmation eats part of the budget. These are what is already
     *  committed to booked creators and what is left for the next round. */
    budget_committed?: number | null
    budget_remaining?: number | null
    locked_count?: number
    reopen_count?: number
    reopened_at?: string | null
    reopen_note?: string | null
    /** The priced add-on on this proposal, and whether the client actually bought it.
     *  Absent when the proposal carries no add-on. */
    price_modifier?: {
      id: string
      label: string
      description?: string | null
      kind: 'percent' | 'fixed'
      percent_value?: number | null
      amount_aed?: number | null
      offered_on: string[]
      taken_by: string[]
      taken: boolean
    } | null
  }
  influencers: AdminProposalInfluencer[]
  /** The caller's money scope, from the backend's `app/core/field_policy.py`. Only
   *  'leadership' is served cost and margin — for everyone else those fields come back
   *  null and the screen leaves the columns out rather than showing empty ones. */
  scope?: MoneyScope
  financials: {
    total_sell: number | null
    total_cost: number | null
    margin_percentage: number | null
    margin_amount: number | null
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
  /** The house's own pick for this client. Floats to the top of the client's wall. */
  recommended?: boolean
  recommended_note?: string | null
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
  assigned_deliverables?: Array<{ type: string; quantity: number; modifier_eligible?: boolean }>

  selected_deliverables?: Array<{ type: string; quantity?: number; modifier?: string }>
  /** Confirmed onto the campaign, as opposed to merely ticked. Locked creators survive
   *  a re-open: they cannot be unticked by the client or removed by an operator. */
  locked?: boolean
  locked_at?: string | null
  locked_round?: number | null
  /** Whether the proposal's add-on was offered on this creator, and whether taken. */
  modifier_offered?: boolean
  modifier_taken?: boolean
  /** Set when an operator answered the add-on rather than the client. */
  modifier_overridden?: boolean
  modifier_override_at?: string | null
  modifier_override_reason?: string | null
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
    /** The team is mid-edit. When true the API serves NO influencers and blocks
     *  select/approve/reject — the client screen is a message, not a cover over data that
     *  was sent anyway. */
    work_in_progress?: boolean
    work_in_progress_note?: string | null
    total_budget?: number | null
    /** On a re-opened proposal the cap is not all theirs to spend: part is already
     *  committed to the creators they confirmed last time. */
    budget_committed?: number | null
    budget_remaining?: number | null
    locked_count?: number
    reopen_count?: number
    reopened_at?: string | null
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
  /** We put our name on this one for this client, with the one-line reason. */
  recommended?: boolean
  recommended_note?: string | null
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
  selected_deliverables?: Array<{ type: string; quantity?: number; modifier?: string }> | string[]
  assigned_deliverables?: Array<{ type: string; quantity: number; modifier_eligible?: boolean }>
  /** Already confirmed by this client in an earlier round. Shown as confirmed and not
   *  selectable — the booking is made and we are already acting on it. */
  locked?: boolean
  locked_at?: string | null
  locked_round?: number | null
  /** The client's own reading of this creator. Coverage is counted from these, never
   *  from a selection. */
  client_opened_at?: string | null
  declined_at?: string | null
  declined_reason?: string | null
  /** What our pipeline measured. Absent for a creator we have not analysed yet. */
  measured?: {
    posts_analysed?: number
    engagement_rate?: number | null
    standing?: 'exceptional' | 'typical' | 'below_average' | null
    by_content_type?: Record<string, { engagement_rate: number; sample_size: number }>
    viral_skew?: boolean
    median_likes?: number | null
    median_comments?: number | null
    median_views?: number | null
    content_mix?: Record<string, number>
    primary_format?: string | null
    posts_per_week?: number | null
    most_active_weekday?: string | null
    category?: string | null
    language?: string | null
  }
}

export interface AdminProposalStats {
  total_proposals: number
  active_proposals: number
  approved_proposals: number
  approval_rate: number
  /** Null for anyone the backend's field policy does not serve margin to. */
  total_margin: number | null
  avg_margin_percentage: number | null
  scope?: MoneyScope
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
    scope?: MoneyScope
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
  // DELETE /api/v1/admin/proposals/{id} - Delete a proposal (superadmin)
  // ---------------------------------------------------------------------------
  async deleteProposal(proposalId: string): Promise<{ deleted: boolean }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete proposal: ${errorText}`)
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
  // POST /api/v1/admin/proposals/{id}/influencers/bulk-remove
  //
  // POST rather than DELETE because a delete with a body is not reliably carried by every
  // client and proxy in the chain. Refuses outright if any of them are already confirmed.
  // ---------------------------------------------------------------------------
  async bulkRemoveInfluencers(proposalId: string, influencerIds: string[]): Promise<{
    data: { removed: number; removed_ids: string[]; was_selected: string[] }
    message: string
  }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/influencers/bulk-remove`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ influencer_ids: influencerIds }),
    })
    if (!response.ok) throw new Error(await errorMessage(response, 'Could not remove those creators'))
    return await response.json()
  }

  // ---------------------------------------------------------------------------
  // GET/POST /api/v1/admin/proposals/{id}/reopen - Carry on after a partial yes
  //
  // A client who confirmed part of a roster and came back for more. The GET says what
  // re-opening would mean in real numbers so the dialog can state the consequence; the
  // POST does it, keeping the confirmed creators booked and the budget part-spent.
  // ---------------------------------------------------------------------------
  async reopenPreview(proposalId: string): Promise<ReopenState> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/reopen`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error(await errorMessage(response, 'Could not read this proposal'))
    return (await response.json()).data
  }

  async reopen(proposalId: string, note?: string): Promise<{ data: ReopenResult; message: string }> {
    const response = await fetchWithAuth(`${this.baseUrl}/${proposalId}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note: note || undefined }),
    })
    if (!response.ok) throw new Error(await errorMessage(response, 'Could not re-open this proposal'))
    return await response.json()
  }

  // ---------------------------------------------------------------------------
  // PUT /api/v1/admin/proposals/{id}/influencers/{rowId}/add-on
  //
  // Answering the priced add-on on the client's behalf. Deals are agreed on calls, not by
  // clicks. Re-prices the proposal and, when the creator is already booked, the campaign.
  // ---------------------------------------------------------------------------
  async setAddOn(proposalId: string, rowId: string, body: {
    applied: boolean
    types?: string[]
    reason?: string
  }): Promise<{ data: AddOnResult; message: string }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/influencers/${rowId}/add-on`,
      { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) },
    )
    if (!response.ok) throw new Error(await errorMessage(response, 'Could not change the add-on'))
    return await response.json()
  }

  // ---------------------------------------------------------------------------
  // PUT /api/v1/admin/proposals/{id}/influencers/{rowId}/recommend
  // Put our name on one creator for this client, with an optional one-line reason.
  // ---------------------------------------------------------------------------
  async setRecommended(proposalId: string, rowId: string, body: {
    recommended: boolean
    note?: string
  }): Promise<{ data: { recommended: boolean; note: string | null } }> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/${proposalId}/influencers/${rowId}/recommend`,
      { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) },
    )
    if (!response.ok) throw new Error(await errorMessage(response, 'Could not change the recommendation'))
    return await response.json()
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
    /** Either the plain form (["reel"]) or lines that can carry the proposal's priced
     *  add-on ({ type, quantity, modifier }). The server re-checks any add-on against
     *  what was actually offered on that creator. */
    deliverable_selections?: {
      influencer_id: string
      deliverables: (string | { type: string; quantity?: number; modifier?: string })[]
    }[]
    notes?: string
    /** Which month of a retainer these picks fill. A one-off deal sends nothing. */
    period?: string
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
