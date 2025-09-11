/**
 * 🎯 Instagram CDN API Service
 * Handles Instagram profile data with CDN URLs for images
 */

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Instagram Profile with CDN URLs
export interface InstagramProfileCDN {
  username: string
  full_name?: string
  biography?: string
  followers_count?: number
  following_count?: number
  posts_count?: number
  is_verified?: boolean
  is_private?: boolean
  is_business?: boolean
  // CDN Profile Picture URLs
  profile_pic_url: string | null // Original/fallback profile picture URL
  cdn_url_512: string | null // CDN 512px profile picture URL (preferred)
  profile_pic_url_hd?: string | null // Legacy HD URL (deprecated)
  cdn_urls?: {
    avatar_256?: string
    avatar_512?: string
  }
  // Posts with CDN URLs
  posts?: InstagramPostCDN[]
}

// Instagram Post with CDN URLs
export interface InstagramPostCDN {
  id: string
  media_type: 'photo' | 'video' | 'carousel'
  caption?: string
  likes_count?: number
  comments_count?: number
  // CDN Thumbnail URLs
  thumbnail_url: string | null // Original/fallback thumbnail URL
  cdn_url_512: string | null // CDN 512px thumbnail URL (preferred)
  display_url?: string | null // Legacy display URL (deprecated)
  cdn_urls?: {
    256?: string // 256px thumbnail
    512?: string // 512px thumbnail
  }
  cdn_available: boolean
}

// API Response Structure
export interface InstagramProfileResponse {
  success: boolean
  profile: InstagramProfileCDN
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class InstagramCdnApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  /**
   * Get Instagram profile with CDN URLs
   */
  async getProfile(username: string): Promise<ApiResponse<InstagramProfileCDN>> {
    const url = `${this.baseUrl}${ENDPOINTS.instagram.profile(username)}`
    
    try {

      
      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()

        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data: InstagramProfileResponse = await response.json()


      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Instagram API returned failure'
        }
      }

      return {
        success: true,
        data: data.profile
      }
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Get profile picture URL with CDN fallback
   */
  getProfilePictureUrl(profile: InstagramProfileCDN, size: '256' | '512' = '512'): string {
    // Prefer cdn_url_512 for all sizes, with fallback to original
    return profile.cdn_url_512 || profile.profile_pic_url || '/placeholder-avatar.png'
  }

  /**
   * Get post thumbnail URL with CDN fallback
   */
  getPostThumbnailUrl(post: InstagramPostCDN, size: '256' | '512' = '512'): string {
    // Prefer cdn_url_512 for all sizes, with fallback to original
    return post.cdn_url_512 || post.thumbnail_url || '/placeholder-post.png'
  }

  /**
   * Check if profile has valid CDN images
   */
  hasValidCdnImages(profile: InstagramProfileCDN): boolean {
    return !!(profile.cdn_url_512 || profile.profile_pic_url)
  }

  /**
   * Check if post has valid CDN images  
   */
  postHasValidCdnImages(post: InstagramPostCDN): boolean {
    return !!(post.cdn_url_512 || post.thumbnail_url)
  }
}

// Export singleton instance
export const instagramCdnApi = new InstagramCdnApiService()
export default instagramCdnApi