/**
 * Discovery API Service
 * Handles discovery and recommendation functionality as per backend specifications
 */

import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Types based on backend specifications
export interface DiscoveredProfile {
  username: string
  full_name?: string
  bio?: string
  followers_count?: number
  engagement_rate?: number
  profile_picture_url?: string
  match_score: number
  match_reasons: string[]
  unlocked_at?: string
  last_updated?: string
}

export interface DiscoveryFilters {
  min_followers?: number
  max_followers?: number
  min_engagement_rate?: number
  max_engagement_rate?: number
  categories?: string[]
  location?: string
  verified_only?: boolean
  has_email?: boolean
}

export interface DiscoveryResponse {
  profiles: DiscoveredProfile[]
  total_count: number
  filters_applied: DiscoveryFilters
  pagination: {
    page: number
    per_page: number
    has_next: boolean
    has_prev: boolean
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class DiscoveryApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`🔗 Discovery API request: ${this.baseURL}${url}`)
      
      const response = await fetchWithAuth(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 402) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Credits required for this action')
        } else if (response.status === 403) {
          throw new Error('Access denied. Upgrade required for discovery features.')
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log(`✅ Discovery API response received`)
      
      return {
        success: true,
        data: data,
        message: data.message
      }
    } catch (error) {
      console.error(`❌ Discovery API error:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * GET /api/v1/discovery/unlocked
   * Get user's discovered/unlocked profiles with filtering and pagination
   */
  async getUnlockedProfiles(
    filters?: DiscoveryFilters,
    page: number = 1,
    per_page: number = 20
  ): Promise<ApiResponse<DiscoveryResponse>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', per_page.toString())

    // Add filters to query parameters
    if (filters) {
      if (filters.min_followers) params.append('min_followers', filters.min_followers.toString())
      if (filters.max_followers) params.append('max_followers', filters.max_followers.toString())
      if (filters.min_engagement_rate) params.append('min_engagement_rate', filters.min_engagement_rate.toString())
      if (filters.max_engagement_rate) params.append('max_engagement_rate', filters.max_engagement_rate.toString())
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(category => params.append('categories', category))
      }
      if (filters.location) params.append('location', filters.location)
      if (filters.verified_only !== undefined) params.append('verified_only', filters.verified_only.toString())
      if (filters.has_email !== undefined) params.append('has_email', filters.has_email.toString())
    }

    const queryString = params.toString()
    const endpoint = `${ENDPOINTS.discovery.unlocked}${queryString ? `?${queryString}` : ''}`
    
    return this.makeRequest<DiscoveryResponse>(endpoint)
  }

  /**
   * Get quick stats about user's discovery status
   */
  async getDiscoveryStats(): Promise<ApiResponse<{
    total_discovered: number
    total_unlocked: number
    discovery_categories: string[]
    last_discovery_update: string
  }>> {
    return this.makeRequest('/api/v1/discovery/stats')
  }

  /**
   * Search within discovered profiles
   */
  async searchDiscoveredProfiles(
    query: string,
    filters?: DiscoveryFilters,
    page: number = 1,
    per_page: number = 20
  ): Promise<ApiResponse<DiscoveryResponse>> {
    const params = new URLSearchParams()
    params.append('query', query)
    params.append('page', page.toString())
    params.append('per_page', per_page.toString())

    // Add filters to query parameters
    if (filters) {
      if (filters.min_followers) params.append('min_followers', filters.min_followers.toString())
      if (filters.max_followers) params.append('max_followers', filters.max_followers.toString())
      if (filters.min_engagement_rate) params.append('min_engagement_rate', filters.min_engagement_rate.toString())
      if (filters.max_engagement_rate) params.append('max_engagement_rate', filters.max_engagement_rate.toString())
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(category => params.append('categories', category))
      }
      if (filters.location) params.append('location', filters.location)
      if (filters.verified_only !== undefined) params.append('verified_only', filters.verified_only.toString())
      if (filters.has_email !== undefined) params.append('has_email', filters.has_email.toString())
    }

    const queryString = params.toString()
    const endpoint = `/api/v1/discovery/unlocked/search?${queryString}`
    
    return this.makeRequest<DiscoveryResponse>(endpoint)
  }

  /**
   * Export discovered profiles data
   */
  async exportDiscoveredProfiles(
    format: 'json' | 'csv' = 'json',
    filters?: DiscoveryFilters
  ): Promise<ApiResponse<{
    download_url: string
    expires_at: string
    file_name: string
  }>> {
    return this.makeRequest('/api/v1/discovery/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        filters
      })
    })
  }
}

// Export singleton instance
export const discoveryApiService = new DiscoveryApiService()
export default discoveryApiService