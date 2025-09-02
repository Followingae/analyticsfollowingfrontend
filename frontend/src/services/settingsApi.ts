import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { authService } from './authService'
import { fetchWithAuth } from '@/utils/apiInterceptor'

/**
 * SETTINGS API SERVICE
 * Based on FRONTEND_SETTINGS_HANDOVER.md
 * Handles all user settings functionality
 */

// Type definitions based on backend API spec
export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  company: string
  job_title: string
  phone_number: string
  bio: string
  profile_picture_url: string
  timezone: string
  language: string
  updated_at: string
}

export interface SecuritySettings {
  two_factor_enabled: boolean
  email_verified: boolean
  phone_verified: boolean
}

export interface PrivacySettings {
  profile_visibility: boolean
  data_analytics_enabled: boolean
}

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  weekly_reports: boolean
}

export interface UserPreferences {
  timezone: string
  language: string
  preferences: {
    theme: string
    dashboard_layout: string
    default_analysis_type?: string
  }
}

export interface SettingsOverview {
  profile: UserProfile
  security: SecuritySettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  preferences: UserPreferences
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface PasswordChangeResponse {
  message: string
  timestamp: string
  requires_reauth: boolean
}

export interface TwoFactorRequest {
  enable: boolean
  password: string
}

export interface TwoFactorResponse {
  two_factor_enabled: boolean
  message: string
  qr_code_url?: string
  backup_codes?: string[]
}

export interface AvatarUploadResponse {
  profile_picture_url: string
  message: string
}

class SettingsApiService {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {

      
      const response = await fetchWithAuth(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 400) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Validation error')
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()

      
      return {
        success: true,
        data: data,
        message: data.message
      }
    } catch (error) {
      clearTimeout(timeoutId)

      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * GET /api/v1/settings/overview
   * Load all settings data for page initialization
   */
  async getSettingsOverview(): Promise<ApiResponse<SettingsOverview>> {
    return this.makeRequest<SettingsOverview>(ENDPOINTS.settings.overview)
  }

  /**
   * Profile Settings
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(ENDPOINTS.settings.profile)
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(ENDPOINTS.settings.profile, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    })
  }

  async uploadAvatar(file: File): Promise<ApiResponse<AvatarUploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.makeRequest<AvatarUploadResponse>(ENDPOINTS.settings.avatar, {
      method: 'POST',
      body: formData
      // Note: Don't set Content-Type header for FormData, browser sets it automatically
    })
  }

  /**
   * Security Settings
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<ApiResponse<PasswordChangeResponse>> {
    return this.makeRequest<PasswordChangeResponse>(ENDPOINTS.settings.security.password, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData)
    })
  }

  async toggleTwoFactor(twoFactorData: TwoFactorRequest): Promise<ApiResponse<TwoFactorResponse>> {
    return this.makeRequest<TwoFactorResponse>(ENDPOINTS.settings.security.twoFactor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(twoFactorData)
    })
  }

  async updatePrivacySettings(privacyData: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> {
    return this.makeRequest<PrivacySettings>(ENDPOINTS.settings.security.privacy, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(privacyData)
    })
  }

  /**
   * Notification Settings
   */
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return this.makeRequest<NotificationSettings>(ENDPOINTS.settings.notifications)
  }

  async updateNotificationSettings(notificationData: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    return this.makeRequest<NotificationSettings>(ENDPOINTS.settings.notifications, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    })
  }

  /**
   * User Preferences
   */
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    return this.makeRequest<UserPreferences>(ENDPOINTS.settings.preferences)
  }

  async updatePreferences(preferencesData: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return this.makeRequest<UserPreferences>(ENDPOINTS.settings.preferences, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencesData)
    })
  }

  /**
   * Utility Methods
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, and GIF files are allowed' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 2MB' }
    }

    return { valid: true }
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const settingsApiService = new SettingsApiService()