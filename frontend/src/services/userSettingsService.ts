import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// User Settings Interfaces
export interface UserProfile {
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  profile_picture_url?: string
  avatar_config?: any
  timezone?: string
  language?: string
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
  theme?: string
  dashboard_layout?: string
  default_analysis_type?: string
  preferences?: Record<string, any>
}

export interface PrivacySettings {
  profile_visibility?: boolean | string
  data_analytics_enabled?: boolean
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  weekly_reports: boolean
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

export interface SettingsOverview {
  profile: UserProfile
  security: {
    two_factor_enabled: boolean
    email_verified: boolean
    phone_verified: boolean
  }
  notifications: NotificationPreferences
  privacy: PrivacySettings
  preferences: UserPreferences
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    })
    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.status}`)
    }
    return response.json()
  },

  // Settings Overview (single call to get everything)
  async getOverview(): Promise<SettingsOverview> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.overview}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch settings overview: ${response.status}`)
    }
    return response.json()
  },

  // Security - Password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.changePassword}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || `Failed to change password: ${response.status}`)
    }
    return response.json()
  },

  // Security - 2FA Toggle
  async toggle2FA(enable: boolean, password: string): Promise<{ two_factor_enabled: boolean; message: string; qr_code_url?: string; backup_codes?: string[] }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.toggle2FA}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable, password })
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || `Failed to ${enable ? 'enable' : 'disable'} 2FA: ${response.status}`)
    }
    return response.json()
  },

  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.preferences}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`)
    }
    return response.json()
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.settings.preferences}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    })
    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.status}`)
    }
    return response.json()
  },

  // Notifications
  async getNotifications(): Promise<NotificationPreferences> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/settings/notifications`)
    if (!response.ok) {
      throw new Error(`Failed to fetch notification preferences: ${response.status}`)
    }
    return response.json()
  },

  async updateNotifications(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/settings/notifications`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    })
    if (!response.ok) {
      throw new Error(`Failed to update notification preferences: ${response.status}`)
    }
    return response.json()
  },

  // Privacy
  async updatePrivacy(privacy: PrivacySettings): Promise<PrivacySettings> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/settings/security/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(privacy)
    })
    if (!response.ok) {
      throw new Error(`Failed to update privacy settings: ${response.status}`)
    }
    return response.json()
  },

  // Team Information
  async getMyTeam(): Promise<MyTeam> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teamsExtended.myTeam}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch team info: ${response.status}`)
    }
    return response.json()
  },

  // Team Usage
  async getMyTeamUsage(): Promise<MyTeamUsage> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teamsExtended.myTeamUsage}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch team usage: ${response.status}`)
    }
    return response.json()
  },
}
