import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// User Settings Interfaces
export interface UserProfile {
  email: string
  full_name: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  profile_picture_url?: string
}

export interface UserAccount {
  role: string
  subscription_tier: string
  subscription_expires_at?: string
  created_at: string
}

export interface UserPreferences {
  timezone?: string
  language?: string
  notification_preferences?: Record<string, boolean>
  profile_visibility?: string
  data_analytics_enabled?: boolean
}

export interface UserSecurity {
  two_factor_enabled: boolean
  email_verified: boolean
  last_sign_in_at: string
}

export interface MyTeam {
  team_name: string
  team_role: string
  monthly_limits: {
    profile_limit: number
    email_limit: number
  }
}

export interface MyTeamUsage {
  usage_this_month: {
    profiles_unlocked: number
    emails_sent: number
  }
}

export const userSettingsService = {
  // Profile Management
  async getProfile(): Promise<UserProfile> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.profile}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`)
    }
    return response.json()
  },

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.profile}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    })
    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.status}`)
    }
    return response.json()
  },




  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.changePassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    })
    if (!response.ok) {
      throw new Error(`Failed to change password: ${response.status}`)
    }
    return response.json()
  },

  async enable2FA(): Promise<{ qr_code: string; backup_codes: string[] }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.enable2FA}`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`Failed to enable 2FA: ${response.status}`)
    }
    return response.json()
  },

  async disable2FA(verificationCode: string): Promise<{ success: boolean }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.disable2FA}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verification_code: verificationCode })
    })
    if (!response.ok) {
      throw new Error(`Failed to disable 2FA: ${response.status}`)
    }
    return response.json()
  },

  // Team Information (Read-Only)
  async getMyTeam(): Promise<MyTeam> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teamsExtended.myTeam}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch team info: ${response.status}`)
    }
    return response.json()
  },

  async getMyTeamUsage(): Promise<MyTeamUsage> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teamsExtended.myTeamUsage}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch team usage: ${response.status}`)
    }
    return response.json()
  },

  // Data Actions
  async exportData(): Promise<{ export_url: string }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.exportData}`)
    if (!response.ok) {
      throw new Error(`Failed to export data: ${response.status}`)
    }
    return response.json()
  }
}