import { API_CONFIG, REQUEST_HEADERS, ENDPOINTS, getAuthHeaders } from '@/config/api'
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
  avatar_config?: {
    variant: string
    colorScheme: string
    colors: string[]
    seed?: string
  }
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
  avatar_config?: {
    variant: string
    colorScheme: string
    colors: string[]
    seed?: string
  }
}

class SettingsService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    // Token management now handled by TokenManager via fetchWithAuth
    this.token = null
  }


  // Get current profile settings
  async getProfile(): Promise<{ success: boolean; data?: ProfileUpdateResponse; error?: string }> {
    try {


      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.settings.user}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const data = await response.json()


      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to fetch profile' }
      }
    } catch (error) {

      return { success: false, error: 'Network error' }
    }
  }

  // Update profile settings
  async updateProfile(profileData: ProfileUpdateRequest): Promise<{ success: boolean; data?: ProfileUpdateResponse; error?: string }> {
    try {
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.settings.user}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()



      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to update profile' }
      }
    } catch (error) {

      return { success: false, error: 'Network error' }
    }
  }

  // Get complete settings overview
  async getSettingsOverview(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {

      
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.settings.overview}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const data = await response.json()


      if (response.ok) {
        return { success: true, data }
      } else {
        return { success: false, error: data.detail || 'Failed to fetch settings' }
      }
    } catch (error) {

      return { success: false, error: 'Network error' }
    }
  }
}

export const settingsService = new SettingsService()
export default settingsService