/**
 * Campaign Enhancement API Service
 * Enhanced campaign management with deliverables, milestones, collaboration, and advanced reporting
 */

import { getAuthHeaders, API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Enhanced Campaign Types
export interface EnhancedCampaign {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  start_date: string
  end_date: string
  budget_allocated: number
  budget_spent: number
  budget_remaining: number
  currency: string
  client_name?: string
  client_email?: string
  campaign_manager_id: string
  team_members: string[]
  created_by: string
  created_at: string
  updated_at: string
  last_activity_at: string
  completion_percentage: number
  
  // Enhanced metadata
  campaign_type: 'awareness' | 'conversion' | 'retention' | 'engagement'
  target_audience: string
  campaign_goals: string[]
  success_metrics: string[]
  tags: string[]
  external_campaign_id?: string
  notes?: string
  
  // Related data
  deliverables?: CampaignDeliverable[]
  milestones?: CampaignMilestone[]
  reports?: CampaignReport[]
  collaborators?: CampaignCollaborator[]
  budget_breakdown?: BudgetBreakdown
  performance_summary?: PerformanceSummary
}

export interface CampaignDeliverable {
  id: string
  campaign_id: string
  title: string
  description: string
  deliverable_type: 'content' | 'design' | 'video' | 'report' | 'analysis' | 'strategy' | 'other'
  assigned_to: string
  due_date: string
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'delivered' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  estimated_hours: number
  actual_hours?: number
  budget_allocated: number
  budget_spent?: number
  dependencies: string[]
  requirements?: string[]
  acceptance_criteria?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  
  // File attachments
  attachments?: DeliverableAttachment[]
  
  // Review & approval
  review_required: boolean
  reviewed_by?: string
  reviewed_at?: string
  review_feedback?: string
  approval_required: boolean
  approved_by?: string
  approved_at?: string
}

export interface DeliverableAttachment {
  id: string
  deliverable_id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
  version: number
  is_current_version: boolean
}

export interface CampaignMilestone {
  id: string
  campaign_id: string
  title: string
  description: string
  due_date: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  milestone_type: 'deliverable' | 'review' | 'approval' | 'launch' | 'checkpoint'
  dependencies: string[]
  deliverables_required: string[]
  budget_checkpoint?: number
  success_criteria?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  completion_notes?: string
}

export interface CampaignCollaborator {
  id: string
  campaign_id: string
  user_id: string
  user_email: string
  user_name?: string
  role: 'manager' | 'contributor' | 'reviewer' | 'client' | 'observer'
  permissions: CollaboratorPermissions
  added_at: string
  added_by: string
  last_activity_at?: string
  notification_preferences: NotificationPreferences
}

export interface CollaboratorPermissions {
  can_edit_campaign: boolean
  can_manage_deliverables: boolean
  can_manage_milestones: boolean
  can_manage_budget: boolean
  can_invite_collaborators: boolean
  can_view_reports: boolean
  can_export_data: boolean
}

export interface NotificationPreferences {
  email_notifications: boolean
  milestone_reminders: boolean
  deliverable_updates: boolean
  budget_alerts: boolean
  weekly_summaries: boolean
}

export interface BudgetBreakdown {
  campaign_id: string
  categories: BudgetCategory[]
  total_allocated: number
  total_spent: number
  total_committed: number
  remaining_budget: number
  budget_utilization_percentage: number
  last_updated: string
}

export interface BudgetCategory {
  category_name: string
  allocated: number
  spent: number
  committed: number
  remaining: number
  transactions: BudgetTransaction[]
}

export interface BudgetTransaction {
  id: string
  campaign_id: string
  category: string
  amount: number
  transaction_type: 'expense' | 'refund' | 'allocation' | 'reallocation'
  description: string
  transaction_date: string
  created_by: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  receipt_url?: string
}

export interface CampaignReport {
  id: string
  campaign_id: string
  report_type: 'weekly' | 'milestone' | 'final' | 'custom'
  report_title: string
  generated_at: string
  generated_by: string
  reporting_period_start: string
  reporting_period_end: string
  status: 'generating' | 'ready' | 'error'
  file_url?: string
  key_metrics: Record<string, any>
  insights: string[]
  recommendations: string[]
  next_actions: string[]
}

export interface PerformanceSummary {
  campaign_id: string
  period_start: string
  period_end: string
  key_performance_indicators: KPI[]
  goal_achievement: GoalAchievement[]
  budget_performance: {
    budget_efficiency: number
    cost_per_goal: number
    roi_percentage: number
  }
  timeline_performance: {
    on_time_deliverables: number
    overdue_deliverables: number
    milestone_adherence: number
  }
  team_performance: {
    average_task_completion_time: number
    collaboration_score: number
    quality_score: number
  }
  last_calculated: string
}

export interface KPI {
  metric_name: string
  current_value: number
  target_value: number
  previous_value?: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  achievement_percentage: number
}

export interface GoalAchievement {
  goal_name: string
  target_value: number
  achieved_value: number
  achievement_percentage: number
  status: 'achieved' | 'on_track' | 'at_risk' | 'behind'
}

export interface CampaignTemplate {
  id: string
  template_name: string
  template_description: string
  campaign_type: string
  default_duration_days: number
  template_structure: {
    milestones: Partial<CampaignMilestone>[]
    deliverable_types: string[]
    budget_categories: string[]
    default_team_roles: string[]
  }
  success_metrics_template: string[]
  is_active: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface CampaignAnalytics {
  total_campaigns: number
  active_campaigns: number
  completed_campaigns_this_month: number
  average_campaign_duration: number
  average_budget_utilization: number
  on_time_completion_rate: number
  team_productivity_metrics: TeamProductivityMetrics
  budget_analytics: BudgetAnalytics
  performance_trends: PerformanceTrend[]
}

export interface TeamProductivityMetrics {
  average_deliverables_per_campaign: number
  average_completion_time: number
  quality_score_average: number
  collaboration_effectiveness: number
  workload_distribution: WorkloadDistribution[]
}

export interface WorkloadDistribution {
  user_id: string
  user_name: string
  active_campaigns: number
  pending_deliverables: number
  overdue_items: number
  utilization_percentage: number
}

export interface BudgetAnalytics {
  total_budget_managed: number
  average_budget_per_campaign: number
  budget_efficiency_score: number
  top_expense_categories: ExpenseCategory[]
  budget_variance_trends: BudgetVariance[]
}

export interface ExpenseCategory {
  category_name: string
  total_spent: number
  percentage_of_total: number
  campaign_count: number
}

export interface BudgetVariance {
  period: string
  planned_budget: number
  actual_spent: number
  variance_amount: number
  variance_percentage: number
}

export interface PerformanceTrend {
  metric_name: string
  data_points: DataPoint[]
  trend_direction: 'improving' | 'declining' | 'stable'
  growth_rate: number
}

export interface DataPoint {
  period: string
  value: number
  comparison_value?: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class CampaignsApiService {
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

  // Campaign Management
  async getCampaigns(filters?: {
    status?: string
    priority?: string
    campaign_type?: string
    assigned_to?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    campaigns: EnhancedCampaign[]
    total_count: number
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
  }>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    
    return this.makeRequest(`/api/v1/campaigns?${params.toString()}`)
  }

  async getCampaignDetails(campaignId: string): Promise<ApiResponse<EnhancedCampaign>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}`)
  }

  async createCampaign(campaignData: {
    name: string
    description?: string
    start_date: string
    end_date: string
    budget_allocated: number
    currency?: string
    client_name?: string
    client_email?: string
    team_members?: string[]
    campaign_type: 'awareness' | 'conversion' | 'retention' | 'engagement'
    target_audience: string
    campaign_goals: string[]
    success_metrics?: string[]
    priority?: 'low' | 'medium' | 'high' | 'critical'
    tags?: string[]
    notes?: string
  }): Promise<ApiResponse<EnhancedCampaign>> {
    return this.makeRequest('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    })
  }

  async updateCampaign(campaignId: string, updates: Partial<EnhancedCampaign>): Promise<ApiResponse<EnhancedCampaign>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}`, {
      method: 'DELETE'
    })
  }

  // Deliverables Management
  async getDeliverables(campaignId: string): Promise<ApiResponse<{
    deliverables: CampaignDeliverable[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/deliverables`)
  }

  async createDeliverable(campaignId: string, deliverableData: {
    title: string
    description: string
    deliverable_type: 'content' | 'design' | 'video' | 'report' | 'analysis' | 'strategy' | 'other'
    assigned_to: string
    due_date: string
    priority?: 'low' | 'medium' | 'high'
    estimated_hours: number
    budget_allocated: number
    dependencies?: string[]
    requirements?: string[]
    acceptance_criteria?: string[]
    review_required?: boolean
    approval_required?: boolean
  }): Promise<ApiResponse<CampaignDeliverable>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(deliverableData)
    })
  }

  async updateDeliverable(deliverableId: string, updates: Partial<CampaignDeliverable>): Promise<ApiResponse<CampaignDeliverable>> {
    return this.makeRequest(`/api/deliverables/${deliverableId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteDeliverable(deliverableId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/api/deliverables/${deliverableId}`, {
      method: 'DELETE'
    })
  }

  async addDeliverableAttachment(deliverableId: string, attachment: {
    filename: string
    file_url: string
    file_size: number
    file_type: string
  }): Promise<ApiResponse<DeliverableAttachment>> {
    return this.makeRequest(`/api/deliverables/${deliverableId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(attachment)
    })
  }

  // Milestones Management
  async getMilestones(campaignId: string): Promise<ApiResponse<{
    milestones: CampaignMilestone[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/milestones`)
  }

  async createMilestone(campaignId: string, milestoneData: {
    title: string
    description: string
    due_date: string
    milestone_type: 'deliverable' | 'review' | 'approval' | 'launch' | 'checkpoint'
    dependencies?: string[]
    deliverables_required?: string[]
    budget_checkpoint?: number
    success_criteria?: string[]
  }): Promise<ApiResponse<CampaignMilestone>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(milestoneData)
    })
  }

  async updateMilestone(milestoneId: string, updates: Partial<CampaignMilestone>): Promise<ApiResponse<CampaignMilestone>> {
    return this.makeRequest(`/api/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async completeMilestone(milestoneId: string, completionData: {
    completion_notes?: string
  }): Promise<ApiResponse<CampaignMilestone>> {
    return this.makeRequest(`/api/milestones/${milestoneId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData)
    })
  }

  // Collaboration Management
  async getCollaborators(campaignId: string): Promise<ApiResponse<{
    collaborators: CampaignCollaborator[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/collaborators`)
  }

  async inviteCollaborator(campaignId: string, inviteData: {
    user_email: string
    role: 'manager' | 'contributor' | 'reviewer' | 'client' | 'observer'
    permissions: CollaboratorPermissions
    message?: string
  }): Promise<ApiResponse<CampaignCollaborator>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/collaborators/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
  }

  async updateCollaboratorPermissions(
    collaboratorId: string,
    permissions: CollaboratorPermissions
  ): Promise<ApiResponse<CampaignCollaborator>> {
    return this.makeRequest(`/api/collaborators/${collaboratorId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    })
  }

  async removeCollaborator(collaboratorId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/api/collaborators/${collaboratorId}`, {
      method: 'DELETE'
    })
  }

  // Budget Management
  async getBudgetBreakdown(campaignId: string): Promise<ApiResponse<BudgetBreakdown>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/budget`)
  }

  async addBudgetTransaction(campaignId: string, transaction: {
    category: string
    amount: number
    transaction_type: 'expense' | 'refund' | 'allocation' | 'reallocation'
    description: string
    receipt_url?: string
  }): Promise<ApiResponse<BudgetTransaction>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/budget/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    })
  }

  async updateBudgetCategories(campaignId: string, categories: {
    category_name: string
    allocated: number
  }[]): Promise<ApiResponse<BudgetBreakdown>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/budget/categories`, {
      method: 'PUT',
      body: JSON.stringify({ categories })
    })
  }

  // Reporting & Analytics
  async generateReport(campaignId: string, reportData: {
    report_type: 'weekly' | 'milestone' | 'final' | 'custom'
    report_title: string
    reporting_period_start: string
    reporting_period_end: string
    include_sections?: string[]
  }): Promise<ApiResponse<CampaignReport>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(reportData)
    })
  }

  async getCampaignReports(campaignId: string): Promise<ApiResponse<{
    reports: CampaignReport[]
    total_count: number
  }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/reports`)
  }

  async getPerformanceSummary(campaignId: string): Promise<ApiResponse<PerformanceSummary>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/performance`)
  }

  async getCampaignAnalytics(): Promise<ApiResponse<CampaignAnalytics>> {
    return this.makeRequest('/api/v1/campaigns/analytics')
  }

  // Templates
  async getCampaignTemplates(): Promise<ApiResponse<{
    templates: CampaignTemplate[]
    total_count: number
  }>> {
    return this.makeRequest('/api/v1/campaigns/templates')
  }

  async createCampaignFromTemplate(templateId: string, campaignData: {
    name: string
    start_date: string
    end_date: string
    budget_allocated: number
    client_name?: string
    customizations?: Record<string, any>
  }): Promise<ApiResponse<EnhancedCampaign>> {
    return this.makeRequest(`/api/v1/campaigns/templates/${templateId}/create`, {
      method: 'POST',
      body: JSON.stringify(campaignData)
    })
  }

  // Dashboard & Overview
  async getDashboard(): Promise<ApiResponse<{
    active_campaigns: EnhancedCampaign[]
    pending_deliverables: CampaignDeliverable[]
    upcoming_milestones: CampaignMilestone[]
    budget_alerts: BudgetTransaction[]
    team_workload: WorkloadDistribution[]
    performance_summary: {
      campaigns_on_track: number
      total_active_budget: number
      deliverables_due_this_week: number
      milestones_due_this_week: number
    }
  }>> {
    return this.makeRequest('/api/v1/campaigns/dashboard')
  }

  async exportCampaignData(campaignId: string, exportOptions: {
    format: 'csv' | 'xlsx' | 'pdf'
    sections: string[]
    date_range?: {
      start_date: string
      end_date: string
    }
  }): Promise<ApiResponse<{
    export_id: string
    status: 'processing' | 'ready' | 'error'
    download_url?: string
    expires_at: string
  }>> {
    return this.makeRequest(`/api/v1/campaigns/${campaignId}/export`, {
      method: 'POST',
      body: JSON.stringify(exportOptions)
    })
  }
}

export const campaignsApiService = new CampaignsApiService()