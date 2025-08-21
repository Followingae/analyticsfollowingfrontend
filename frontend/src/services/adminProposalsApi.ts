/**
 * Admin Brand Proposals API Service
 * Admin-to-Brand proposal system for marketing services sales pipeline
 */

import { getAuthHeaders, API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Admin Proposal Types
export interface AdminProposal {
  id: string
  brand_user_id: string
  created_by_admin_id: string
  proposal_title: string
  proposal_description: string
  executive_summary?: string
  service_type: 'influencer_marketing' | 'content_creation' | 'brand_strategy' | 'campaign_management'
  service_description: string
  deliverables: string[]
  proposed_start_date?: string
  proposed_end_date?: string
  estimated_duration_days?: number
  proposed_budget_usd: number
  budget_breakdown?: Record<string, number>
  payment_terms?: 'net_30' | 'net_15' | 'upfront' | 'milestone'
  campaign_objectives?: string[]
  target_audience_description?: string
  expected_deliverables?: string[]
  success_metrics?: string[]
  expected_results?: string
  status: 'draft' | 'sent' | 'under_review' | 'approved' | 'rejected' | 'negotiation' | 'closed'
  priority_level?: 'high' | 'medium' | 'low'
  brand_viewed_at?: string
  brand_response_due_date?: string
  brand_decision?: 'approved' | 'rejected' | 'counter_proposal' | 'needs_clarification'
  brand_feedback?: string
  brand_counter_proposal?: CounterProposal
  last_contact_date?: string
  next_follow_up_date?: string
  contact_attempts: number
  admin_notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
  sent_at?: string
  responded_at?: string
  closed_at?: string
  
  // Related data
  brand_user?: {
    id: string
    email: string
    name?: string
  }
  versions?: ProposalVersion[]
  communications?: Communication[]
  analytics?: ProposalAnalytics[]
}

export interface BrandProposal {
  id: string
  proposal_title: string
  proposal_description: string
  executive_summary?: string
  service_type: string
  service_description: string
  deliverables: string[]
  proposed_start_date?: string
  proposed_end_date?: string
  proposed_budget_usd: number
  budget_breakdown?: Record<string, number>
  payment_terms?: string
  expected_results?: string
  success_metrics?: string[]
  status: string
  sent_at?: string
  brand_response_due_date?: string
  responded_at?: string
  brand_decision?: string
  brand_feedback?: string
}

export interface ProposalVersion {
  id: string
  proposal_id: string
  version_number: number
  version_description: string
  created_by_admin_id: string
  proposal_data: Record<string, any>
  changes_made: string[]
  created_at: string
  is_current_version: boolean
}

export interface Communication {
  id: string
  proposal_id: string
  sender_admin_id?: string
  sender_is_brand: boolean
  communication_type: 'email' | 'phone_call' | 'meeting' | 'message' | 'document_shared'
  subject?: string
  message_content: string
  meeting_type?: 'video_call' | 'phone_call' | 'in_person' | 'presentation'
  meeting_duration_minutes?: number
  meeting_attendees?: string[]
  shared_documents?: string[]
  action_items?: string[]
  follow_up_required?: boolean
  follow_up_date?: string
  delivery_status: 'sent' | 'delivered' | 'read' | 'responded'
  brand_response_required?: boolean
  brand_responded?: boolean
  created_at: string
  scheduled_for?: string
  completed_at?: string
}

export interface ProposalAnalytics {
  id: string
  proposal_id: string
  date_recorded: string
  days_in_draft: number
  days_sent_to_brand: number
  days_under_review: number
  days_in_negotiation: number
  time_to_decision_days?: number
  total_communications: number
  admin_initiated_communications: number
  brand_initiated_communications: number
  meetings_held: number
  documents_shared: number
  proposal_views: number
  time_spent_reviewing_minutes: number
  sections_viewed: string[]
  conversion_stage: 'created' | 'sent' | 'viewed' | 'responded' | 'negotiated' | 'decided'
  conversion_probability?: number
  proposed_value_usd: number
  negotiated_value_usd?: number
  discount_amount_usd?: number
  discount_percentage?: number
  final_decision?: 'approved' | 'rejected' | 'withdrawn'
  rejection_reason?: 'budget' | 'timeline' | 'services' | 'competition' | 'internal_decision'
  win_reason?: 'price' | 'services' | 'relationship' | 'expertise' | 'timeline'
  recorded_at: string
}

export interface ProposalTemplate {
  id: string
  template_name: string
  template_description: string
  service_type: string
  template_structure: TemplateStructure
  default_budget_range?: {
    min: number
    max: number
  }
  default_timeline_days?: number
  is_active: boolean
  usage_count: number
  created_by_admin_id: string
  category?: 'standard' | 'premium' | 'enterprise' | 'custom'
  tags?: string[]
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface TemplateStructure {
  sections: TemplateSection[]
  default_values: Record<string, any>
  required_fields: string[]
  conditional_fields: Record<string, any>
}

export interface TemplateSection {
  section_name: string
  section_title: string
  section_content: string
  is_required: boolean
  order_index: number
  variables: TemplateVariable[]
}

export interface TemplateVariable {
  variable_name: string
  variable_type: 'text' | 'number' | 'date' | 'array' | 'object'
  display_name: string
  default_value?: any
  is_required: boolean
  validation_rules?: Record<string, any>
}

export interface CounterProposal {
  requested_budget_usd?: number
  requested_timeline_days?: number
  requested_changes?: string[]
  additional_requirements?: string
}

export interface PipelineSummary {
  total_proposals: number
  draft_proposals: number
  sent_proposals: number
  under_review: number
  in_negotiation: number
  approved_proposals: number
  rejected_proposals: number
  total_proposed_value: number
  approved_value: number
  conversion_rate: number
  proposals_sent_this_month: number
  responses_received_this_month: number
  proposals_needing_follow_up: number
  overdue_responses: number
}

export interface ProposalMetrics {
  proposal_id: string
  proposal_title: string
  status: string
  proposed_budget_usd: number
  service_type: string
  created_at: string
  sent_at?: string
  responded_at?: string
  days_since_created: number
  days_since_sent?: number
  days_to_response?: number
  total_communications: number
  admin_communications: number
  brand_communications: number
  last_communication_date?: string
  proposal_viewed: boolean
  brand_viewed_at?: string
  versions_created: number
  is_overdue: boolean
  needs_follow_up: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export class AdminProposalsApiService {
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
          ...getAuthHeaders(),
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

  // Admin Proposal Management
  async createProposal(proposalData: {
    brand_user_id: string
    proposal_title: string
    proposal_description: string
    executive_summary?: string
    service_type: 'influencer_marketing' | 'content_creation' | 'brand_strategy' | 'campaign_management'
    service_description: string
    deliverables: string[]
    proposed_start_date?: string
    proposed_end_date?: string
    estimated_duration_days?: number
    proposed_budget_usd: number
    budget_breakdown?: Record<string, number>
    payment_terms?: 'net_30' | 'net_15' | 'upfront' | 'milestone'
    campaign_objectives?: string[]
    target_audience_description?: string
    expected_deliverables?: string[]
    success_metrics?: string[]
    expected_results?: string
    priority_level?: 'high' | 'medium' | 'low'
    admin_notes?: string
    tags?: string[]
  }): Promise<ApiResponse<AdminProposal>> {
    return this.makeRequest('/api/admin/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData)
    })
  }

  async updateProposal(proposalId: string, updates: Partial<AdminProposal>): Promise<ApiResponse<AdminProposal>> {
    return this.makeRequest(`/api/admin/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async sendProposalToBrand(proposalId: string, options?: {
    response_due_date?: string
    custom_message?: string
    send_notification?: boolean
  }): Promise<ApiResponse<{
    proposal_id: string
    status: string
    sent_at: string
    message: string
  }>> {
    return this.makeRequest(`/api/admin/proposals/${proposalId}/send`, {
      method: 'POST',
      body: JSON.stringify(options || {})
    })
  }

  async getAdminProposals(filters?: {
    status?: string
    service_type?: string
    priority_level?: string
    min_budget?: number
    max_budget?: number
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    proposals: AdminProposal[]
    total_count: number
    limit: number
    offset: number
    has_more: boolean
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/admin/proposals?${params.toString()}`)
  }

  async getProposalDetails(proposalId: string): Promise<ApiResponse<AdminProposal>> {
    return this.makeRequest(`/api/admin/proposals/${proposalId}`)
  }

  async getProposalMetrics(proposalId: string): Promise<ApiResponse<ProposalMetrics>> {
    return this.makeRequest(`/api/admin/proposals/${proposalId}/metrics`)
  }

  async getPipelineSummary(): Promise<ApiResponse<PipelineSummary>> {
    return this.makeRequest('/api/admin/proposals/pipeline-summary')
  }

  // Communications
  async addCommunication(proposalId: string, communication: {
    communication_type: 'email' | 'phone_call' | 'meeting' | 'message' | 'document_shared'
    subject?: string
    message_content: string
    meeting_type?: 'video_call' | 'phone_call' | 'in_person' | 'presentation'
    meeting_duration_minutes?: number
    meeting_attendees?: string[]
    shared_documents?: string[]
    action_items?: string[]
    follow_up_required?: boolean
    follow_up_date?: string
    brand_response_required?: boolean
  }): Promise<ApiResponse<Communication>> {
    return this.makeRequest(`/api/admin/proposals/${proposalId}/communications`, {
      method: 'POST',
      body: JSON.stringify(communication)
    })
  }

  async getCommunications(proposalId: string): Promise<ApiResponse<{
    communications: Communication[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/proposals/${proposalId}/communications`)
  }

  // Templates
  async getProposalTemplates(filters?: {
    service_type?: string
    category?: string
    is_active?: boolean
  }): Promise<ApiResponse<{
    templates: ProposalTemplate[]
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
    
    return this.makeRequest(`/api/admin/proposal-templates?${params.toString()}`)
  }

  async createProposalTemplate(templateData: {
    template_name: string
    template_description: string
    service_type: string
    template_structure: TemplateStructure
    default_budget_range?: {
      min: number
      max: number
    }
    default_timeline_days?: number
    category?: string
    tags?: string[]
  }): Promise<ApiResponse<ProposalTemplate>> {
    return this.makeRequest('/api/admin/proposal-templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    })
  }

  async createProposalFromTemplate(templateId: string, proposalData: {
    brand_user_id: string
    proposal_title: string
    customizations?: Record<string, any>
  }): Promise<ApiResponse<AdminProposal>> {
    return this.makeRequest(`/api/admin/proposals/from-template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify(proposalData)
    })
  }
}

// Brand Proposals Service (for brand users)
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
          ...getAuthHeaders(),
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

  async getBrandProposals(): Promise<ApiResponse<{
    proposals: BrandProposal[]
    total_count: number
  }>> {
    return this.makeRequest('/api/brand/proposals')
  }

  async getProposalDetails(proposalId: string): Promise<ApiResponse<BrandProposal>> {
    return this.makeRequest(`/api/brand/proposals/${proposalId}`)
  }

  async submitResponse(proposalId: string, response: {
    decision: 'approved' | 'rejected' | 'counter_proposal' | 'needs_clarification'
    feedback?: string
    counter_proposal?: CounterProposal
  }): Promise<ApiResponse<{
    proposal_id: string
    decision: string
    status: string
    responded_at: string
    message: string
  }>> {
    return this.makeRequest(`/api/brand/proposals/${proposalId}/respond`, {
      method: 'POST',
      body: JSON.stringify(response)
    })
  }
}

export const adminProposalsApiService = new AdminProposalsApiService()
export const brandProposalsApiService = new BrandProposalsApiService()