/**
 * Team Management API Service
 * Handles all team-related API calls for the new team authentication system
 * Updated according to FRONTEND BACKEND INTEGRATION UPDATE (August 23, 2025)
 */

import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Team Context Interface (replaces user_context)
export interface TeamContext {
  team_id: string
  team_name: string
  user_role: 'owner' | 'member'
  subscription_tier: 'free' | 'standard' | 'premium'
  subscription_status: 'active' | 'inactive' | 'expired'
  monthly_limits: {
    profiles: number
    emails: number
    posts: number
  }
  current_usage: {
    profiles: number
    emails: number
    posts: number
  }
  remaining_capacity: {
    profiles: number
    emails: number
    posts: number
  }
  user_permissions: {
    can_analyze_profiles: boolean
    can_unlock_emails: boolean
    can_analyze_posts: boolean
    can_manage_team: boolean
    can_invite_members: boolean
    can_view_billing: boolean
  }
}

// Team Member Interface
export interface TeamMember {
  id: string
  user_id: string
  role: 'owner' | 'member'
  status: 'active' | 'pending' | 'suspended'
  user_email: string
  user_name: string
  joined_at: string
  permissions: {
    can_analyze_profiles: boolean
    can_unlock_emails: boolean
    can_analyze_posts: boolean
    can_manage_team: boolean
    can_invite_members: boolean
    can_view_billing: boolean
  }
}

// Team Invitation Interface
export interface TeamInvitation {
  id: string
  email: string
  role: 'member'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at: string
  invitation_token?: string
  invited_by_email: string
  created_at: string
  personal_message?: string
}

// Team Overview Interface
export interface TeamOverview {
  team_info: {
    team_id: string
    team_name: string
    subscription_tier: 'free' | 'standard' | 'premium'
  }
  membership: {
    active_members: number
    max_members: number
    pending_invitations: number
    available_slots: number
  }
  usage_summary: {
    profiles: number
    emails: number
    posts: number
  }
  permissions: {
    can_analyze_profiles: boolean
    can_unlock_emails: boolean
    can_analyze_posts: boolean
    can_manage_team: boolean
    can_invite_members: boolean
    can_view_billing: boolean
  }
}

// Team Usage Summary Interface
export interface TeamUsageSummary {
  team_id: string
  team_name: string
  subscription_tier: 'free' | 'standard' | 'premium'
  billing_month: string
  monthly_limits: {
    profiles: number
    emails: number
    posts: number
  }
  current_usage: {
    profiles: number
    emails: number
    posts: number
  }
  remaining_capacity: {
    profiles: number
    emails: number
    posts: number
  }
  usage_percentage: {
    profiles: number
    emails: number
    posts: number
  }
  member_usage: Array<{
    user_id: string
    role: 'owner' | 'member'
    profiles_analyzed: number
    emails_unlocked: number
    posts_analyzed: number
  }>
}

// Error Classes for Team-specific errors
export class TeamUsageLimitError extends Error {
  public usageType: string
  public currentUsage: string
  public limit: string
  public available: string
  public tier: string

  constructor(data: any) {
    super(data.detail)
    this.usageType = data.headers?.['x-usage-type'] || 'unknown'
    this.currentUsage = data.headers?.['x-current-usage'] || '0'
    this.limit = data.headers?.['x-limit'] || '0'
    this.available = data.headers?.['x-available'] || '0'
    this.tier = data.headers?.['x-subscription-tier'] || 'unknown'
  }
}

export class TeamAccessError extends Error {
  constructor(message: string) {
    super(message)
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class TeamApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetchWithAuth(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit',
      })

      if (!response.ok) {
        // Handle team-specific error responses
        const errorText = await response.text()
        let errorData: any = {}
        
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText }
        }

        if (response.status === 402) {
          throw new TeamUsageLimitError({
            detail: errorData.detail || 'Team usage limit exceeded',
            headers: Object.fromEntries(response.headers.entries())
          })
        } else if (response.status === 401 && 
                   errorData.detail?.includes('team')) {
          throw new TeamAccessError(errorData.detail)
        } else if (response.status === 403 && 
                   errorData.detail?.includes('team')) {
          throw new TeamAccessError(errorData.detail)
        } else {
          throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const responseText = await response.text()
      if (!responseText) {
        throw new Error('Empty response body received from server')
      }

      return JSON.parse(responseText)
    } catch (error) {
      throw error
    }
  }

  // Team Member Management
  async getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
    try {
      const response = await this.makeRequest<TeamMember[]>('/api/v1/teams/members')
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team members'
      }
    }
  }

  async inviteTeamMember(
    email: string,
    role: 'member' = 'member',
    personalMessage?: string
  ): Promise<ApiResponse<TeamInvitation>> {
    try {
      const response = await this.makeRequest<TeamInvitation>('/api/v1/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          personal_message: personalMessage
        })
      })
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      if (error instanceof TeamUsageLimitError) {
        return {
          success: false,
          error: `Team member limit reached. Upgrade to invite more members.`
        }
      }
      return {
        success: false,
        error: error.message || 'Failed to send invitation'
      }
    }
  }

  async removeTeamMember(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.makeRequest<any>(`/api/v1/teams/members/${userId}`, {
        method: 'DELETE'
      })
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove team member'
      }
    }
  }

  async getTeamInvitations(status?: 'pending' | 'accepted' | 'expired'): Promise<ApiResponse<TeamInvitation[]>> {
    try {
      const queryParam = status ? `?status=${status}` : ''
      const response = await this.makeRequest<TeamInvitation[]>(`/api/v1/teams/invitations${queryParam}`)
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team invitations'
      }
    }
  }

  async cancelTeamInvitation(invitationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.makeRequest<any>(`/api/v1/teams/invitations/${invitationId}`, {
        method: 'DELETE'
      })
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cancel invitation'
      }
    }
  }

  // Team Overview & Usage
  async getTeamOverview(): Promise<ApiResponse<TeamOverview>> {
    try {
      const response = await this.makeRequest<TeamOverview>('/api/v1/teams/overview')
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team overview'
      }
    }
  }

  async getTeamUsage(): Promise<ApiResponse<TeamUsageSummary>> {
    try {
      const response = await this.makeRequest<TeamUsageSummary>('/api/v1/team/instagram/team/usage')
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team usage'
      }
    }
  }

  async getTeamContext(): Promise<ApiResponse<TeamContext>> {
    try {
      const response = await this.makeRequest<TeamContext>('/api/v1/team/instagram/team/context')
      return {
        success: true,
        data: response
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team context'
      }
    }
  }

  // Helper method to update team context in app state
  updateTeamContext(teamContext: TeamContext): void {
    // Store in localStorage for persistence across sessions
    localStorage.setItem('teamContext', JSON.stringify(teamContext))
    
    // Dispatch custom event for global state management
    window.dispatchEvent(new CustomEvent('teamContextUpdated', {
      detail: teamContext
    }))
  }

  // Helper method to get stored team context
  getStoredTeamContext(): TeamContext | null {
    try {
      const stored = localStorage.getItem('teamContext')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }
}

// Export singleton instance
export const teamApiService = new TeamApiService()
export default teamApiService