import { API_CONFIG, REQUEST_HEADERS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export interface ProfileUpdateRequest {
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  timezone?: string
  language?: string
}

export interface ProfileUpdateResponse {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  profile_picture_url?: string
  timezone: string
  language: string
  updated_at: string
  message: string
}

class SettingsService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
    }
  }

  private getAuthHeaders() {
    return getAuthHeaders()
  }

  // Get current profile settings
  async getProfile(): Promise<{ success: boolean; data?: ProfileUpdateResponse; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('📱 Fetching profile settings')
      
      const response = await fetchWithAuth(`${this.baseURL}/api/v1/settings/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      console.log('📡 Profile settings response:', data)

      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to fetch profile' }
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Update profile settings
  async updateProfile(profileData: ProfileUpdateRequest): Promise<{ success: boolean; data?: ProfileUpdateResponse; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('💾 Updating profile settings:', profileData)
      
      const response = await fetchWithAuth(`${this.baseURL}/api/v1/settings/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      })

      const data = await response.json()
      console.log('📡 Profile update response:', data)

      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to update profile' }
      }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Get complete settings overview
  async getSettingsOverview(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('📱 Fetching settings overview')
      
      const response = await fetchWithAuth(`${this.baseURL}/api/v1/settings/overview`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()
      console.log('📡 Settings overview response:', data)

      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to fetch settings' }
      }
    } catch (error) {
      console.error('❌ Settings overview error:', error)
      return { success: false, error: 'Network error' }
    }
  }
}

export const settingsService = new SettingsService()
export default settingsService