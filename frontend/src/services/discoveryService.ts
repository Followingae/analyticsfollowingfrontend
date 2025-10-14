/**
 * Discovery Service - Complete creator discovery and unlocking system
 * Based on DISCOVERY_API_GUIDE.md specifications
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Types based on actual Discovery API response
export interface DiscoveryProfile {
  id: string
  username: string
  full_name: string | null
  biography: string | null
  followers_count: number
  following_count: number
  posts_count: number
  is_verified: boolean
  is_private: boolean
  profile_pic_url: string | null
  profile_pic_url_hd: string | null

  // CDN URLs from following backend
  cdn_urls?: {
    avatar?: string[]
    posts?: string[]
  }

  // Discovery-specific fields - CORRECT STRUCTURE from backend
  unlock_status: {
    is_unlocked: boolean
    days_remaining: number | null
    expires_at: string | null
  }
  unlock_cost: number // Credits required to unlock (typically 25)
  content_category: string | null
  last_post_date: string | null
  avg_engagement_rate: number | null

  // Preview data (always available)
  preview_data: {
    recent_post_count: number
    follower_growth_trend: 'up' | 'down' | 'stable'
    estimated_engagement: number
    content_preview: string[]
  }
}

export interface DiscoveryFilters {
  search?: string
  category?: string
  min_followers?: number
  max_followers?: number
  min_engagement?: number
  max_engagement?: number
  verified_only?: boolean
  unlocked_only?: boolean
  sort_by?: 'followers' | 'engagement' | 'recent' | 'alphabetical'
  sort_order?: 'asc' | 'desc'
}

export interface DiscoveryResponse {
  profiles: DiscoveryProfile[]
  total_count: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
  filters_applied: DiscoveryFilters
}

export interface DiscoveryDashboard {
  total_profiles_available: number
  user_unlocked_count: number
  discovery_percentage: number
  credit_balance: number
  categories_breakdown: Record<string, number>
  usage_stats: {
    profiles_viewed_today: number
    profiles_unlocked_this_month: number
    most_popular_category: string
  }
  tips: string[]
}

export interface UnlockResult {
  success: boolean
  profile_id: string
  credits_charged: number
  access_expires_at: string
  days_remaining: number
  error?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class DiscoveryService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 402) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Insufficient credits for this action')
        } else if (response.status === 403) {
          throw new Error('Access denied.')
        } else if (response.status === 404) {
          throw new Error('Profile not found.')
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Browse all profiles with filtering and search
   * Shows ALL profiles in database, not just unlocked ones
   */
  async browseProfiles(
    filters: DiscoveryFilters = {},
    page: number = 1,
    per_page: number = 20
  ): Promise<ApiResponse<DiscoveryResponse>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', per_page.toString())

    if (filters.search) params.append('search', filters.search)
    if (filters.category) params.append('category', filters.category)
    if (filters.min_followers) params.append('min_followers', filters.min_followers.toString())
    if (filters.max_followers) params.append('max_followers', filters.max_followers.toString())
    if (filters.min_engagement) params.append('min_engagement', filters.min_engagement.toString())
    if (filters.max_engagement) params.append('max_engagement', filters.max_engagement.toString())
    if (filters.verified_only !== undefined) params.append('verified_only', filters.verified_only.toString())
    if (filters.unlocked_only !== undefined) params.append('unlocked_only', filters.unlocked_only.toString())
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)

    const queryString = params.toString()
    const endpoint = `${ENDPOINTS.discovery.browse}${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<DiscoveryResponse>(endpoint)
  }

  /**
   * Unlock a profile for 30 days access (costs 25 credits)
   */
  async unlockProfile(profileId: string): Promise<ApiResponse<UnlockResult>> {
    return this.makeRequest<UnlockResult>(ENDPOINTS.discovery.unlockProfile, {
      method: 'POST',
      body: JSON.stringify({
        profile_id: profileId
      })
    })
  }

  /**
   * Get user's unlocked profiles with expiry information
   */
  async getUnlockedProfiles(
    page: number = 1,
    per_page: number = 20
  ): Promise<ApiResponse<DiscoveryResponse>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', per_page.toString())

    const endpoint = `${ENDPOINTS.discovery.unlockedProfiles}?${params.toString()}`
    return this.makeRequest<DiscoveryResponse>(endpoint)
  }

  /**
   * Get discovery dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DiscoveryDashboard>> {
    return this.makeRequest<DiscoveryDashboard>(ENDPOINTS.discovery.dashboard)
  }

  /**
   * Get available content categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    return this.makeRequest<string[]>(ENDPOINTS.discovery.categories)
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<ApiResponse<{
    unlock_cost: number
    access_duration_days: number
    bulk_discounts: Record<string, number>
  }>> {
    return this.makeRequest(ENDPOINTS.discovery.pricing)
  }
}

// Export singleton instance
export const discoveryService = new DiscoveryService()
export default discoveryService