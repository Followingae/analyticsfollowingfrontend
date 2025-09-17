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
   * Extract media data from profile response (media is included in main search response)
   */
  extractMediaFromProfile(profileData: any): CDNMediaResponse | null {
    if (!profileData?.profile) {
      return null;
    }

    const profile = profileData.profile;
    
    // Check if media object exists in profile response
    if (profile.media) {
      return {
        profile_id: profile.id,
        avatar: {
          256: profile.media.avatar?.['256'] || profile.profile_pic_url || '',
          512: profile.media.avatar?.['512'] || profile.profile_pic_url_hd || '',
          available: profile.media.avatar?.available || false,
          placeholder: profile.media.avatar?.placeholder || false
        },
        posts: profile.media.posts || [],
        processing_status: profile.media.processing_status || {
          queued: false,
          total_assets: 0,
          completed_assets: 0,
          completion_percentage: 100
        },
        cdn_info: profile.media.cdn_info || {
          base_url: 'https://cdn.following.ae',
          cache_ttl: '86400',
          immutable_urls: true
        }
      };
    }

    // Fallback: create media structure from basic profile data
    return {
      profile_id: profile.id,
      avatar: {
        256: profile.profile_pic_url || '',
        512: profile.profile_pic_url_hd || '',
        available: !!profile.profile_pic_url,
        placeholder: !profile.profile_pic_url
      },
      posts: [],
      processing_status: {
        queued: false,
        total_assets: 0,
        completed_assets: 0,
        completion_percentage: 100
      },
      cdn_info: {
        base_url: 'https://cdn.following.ae',
        cache_ttl: '86400',
        immutable_urls: true
      }
    };
  }

  /**
   * Refresh profile data (which includes media) using force_refresh
   */
  async refreshProfileData(username: string, token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/creator/search/${username}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        force_refresh: true,
        include_posts: true 
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh profile data: ${response.status}`);
    }

    return { success: true, message: 'Profile data refreshed successfully' };
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

      // Step 2: Extract media data from profile response (already included)
      const cdnData = this.extractMediaFromProfile(profileData);
      
      if (cdnData) {
        // Return profile with structured media data
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
      } else {
        // Return profile with basic avatar URLs from profile data
        return {
          ...profileData,
          cdnMedia: {
            avatar: {
              small: profile.profile_pic_url || '',
              large: profile.profile_pic_url_hd || '',
              available: !!profile.profile_pic_url,
            },
            posts: [],
            processing: {
              queued: false,
              total_assets: 0,
              completed_assets: 0,
              completion_percentage: 100
            },
          },
        };
      }
    } catch (error) {

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