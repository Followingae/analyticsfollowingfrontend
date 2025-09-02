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
  profile_pic_url: string | null // 256px avatar
  profile_pic_url_hd: string | null // 512px HD avatar
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
  display_url: string | null // Primary 256px thumbnail
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
  getProfilePictureUrl(profile: InstagramProfileCDN, size: '256' | '512' = '256'): string {
    if (size === '512') {
      return profile.profile_pic_url_hd || profile.cdn_urls?.avatar_512 || '/placeholder-avatar.png'
    } else {
      return profile.profile_pic_url || profile.cdn_urls?.avatar_256 || '/placeholder-avatar.png'
    }
  }

  /**
   * Get post thumbnail URL with CDN fallback
   */
  getPostThumbnailUrl(post: InstagramPostCDN, size: '256' | '512' = '256'): string {
    if (!post.cdn_available) {
      return '/placeholder-post.png'
    }

    if (size === '512') {
      return post.cdn_urls?.['512'] || post.display_url || '/placeholder-post.png'
    } else {
      return post.display_url || post.cdn_urls?.['256'] || '/placeholder-post.png'
    }
  }

  /**
   * Check if profile has valid CDN images
   */
  hasValidCdnImages(profile: InstagramProfileCDN): boolean {
    return !!(profile.profile_pic_url || profile.profile_pic_url_hd)
  }

  /**
   * Check if post has valid CDN images  
   */
  postHasValidCdnImages(post: InstagramPostCDN): boolean {
    return post.cdn_available && !!(post.display_url || post.cdn_urls?.['256'] || post.cdn_urls?.['512'])
  }
}

// Export singleton instance
export const instagramCdnApi = new InstagramCdnApiService()
export default instagramCdnApi