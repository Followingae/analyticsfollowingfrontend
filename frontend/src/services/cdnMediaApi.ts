import { API_CONFIG } from '@/config/api';

export interface CDNAvatar {
  256: string;
  512: string;
  available: boolean;
  placeholder: boolean;
}

export interface CDNPost {
  mediaId: string;
  thumb: {
    256: string;
    512: string;
  };
  available: boolean;
  placeholder: boolean;
  processing_status: 'completed' | 'processing' | 'pending' | 'failed';
}

export interface CDNProcessingStatus {
  queued: boolean;
  total_assets: number;
  completed_assets: number;
  completion_percentage: number;
}

export interface CDNInfo {
  base_url: string;
  cache_ttl: string;
  immutable_urls: boolean;
}

export interface CDNMediaResponse {
  profile_id: string;
  avatar: CDNAvatar;
  posts: CDNPost[];
  processing_status: CDNProcessingStatus;
  cdn_info: CDNInfo;
}

export interface CreatorProfileWithCDN {
  profile: any;
  cdnMedia?: {
    avatar: {
      small: string;
      large: string;
      available: boolean;
    };
    posts: Array<{
      mediaId: string;
      thumbnail: string;
      fullSize: string;
      available: boolean;
    }>;
    processing: CDNProcessingStatus;
  };
}

/**
 * CDN Media Service for migrating from Instagram URLs to permanent CDN URLs
 */
class CDNMediaService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Get CDN media URLs for a profile
   */
  async getCDNMedia(profileId: string, token: string): Promise<CDNMediaResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/creators/ig/${profileId}/media`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CDN media: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Refresh CDN media for a profile (optional endpoint)
   */
  async refreshCDNMedia(profileId: string, token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/creators/ig/${profileId}/media/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh CDN media: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Complete migration function - combines profile search with CDN media
   */
  async getProfileWithCDN(username: string, token: string): Promise<CreatorProfileWithCDN> {
    try {
      // Step 1: Get profile data (existing endpoint)
      const profileResponse = await fetch(`${this.baseUrl}/api/v1/creator/search/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ include_posts: true }),
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      const profile = profileData.profile;

      if (!profile?.id) {
        throw new Error('Profile ID not found in response');
      }

      // Step 2: Get CDN URLs (NEW endpoint)
      try {
        const cdnData = await this.getCDNMedia(profile.id, token);

        // Return profile with CDN URLs
        return {
          ...profileData,
          cdnMedia: {
            avatar: {
              small: cdnData.avatar['256'],
              large: cdnData.avatar['512'],
              available: cdnData.avatar.available,
            },
            posts: cdnData.posts.map(post => ({
              mediaId: post.mediaId,
              thumbnail: post.thumb['256'],
              fullSize: post.thumb['512'],
              available: post.available,
            })),
            processing: cdnData.processing_status,
          },
        };
      } catch (cdnError) {
        // Fallback: Return profile without CDN data if CDN fetch fails
        console.warn('CDN data fetch failed, falling back to original profile:', cdnError);
        return profileData;
      }
    } catch (error) {
      console.error('Profile/CDN fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get placeholder image URLs
   */
  getPlaceholderUrls() {
    return {
      avatar: {
        small: 'https://cdn.following.ae/placeholders/avatar-256.webp',
        large: 'https://cdn.following.ae/placeholders/avatar-512.webp',
      },
      post: {
        thumbnail: 'https://cdn.following.ae/placeholders/post-256.webp',
        fullSize: 'https://cdn.following.ae/placeholders/post-512.webp',
      },
    };
  }

  /**
   * Check if a URL is a CDN URL (permanent)
   */
  isCDNUrl(url: string): boolean {
    return url.includes('cdn.following.ae');
  }

  /**
   * Check if a URL is an Instagram URL (temporary)
   */
  isInstagramUrl(url: string): boolean {
    return (
      url.includes('cdninstagram.com') ||
      url.includes('scontent-') ||
      url.includes('.fbcdn.net') ||
      url.startsWith('https://instagram.')
    );
  }
}

// Export singleton instance
export const cdnMediaService = new CDNMediaService();