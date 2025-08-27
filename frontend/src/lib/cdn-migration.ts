/**
 * CDN Migration Utilities
 * Helper functions for migrating from Instagram URL proxying to CDN system
 */

import { cdnMediaService } from '@/services/cdnMediaApi'

/**
 * @deprecated Use ProfileAvatar from @/components/ui/cdn-image instead
 * Legacy function kept for compatibility during migration
 */
export function proxyInstagramUrl(url: string | null | undefined): string {
  console.warn('proxyInstagramUrl is deprecated. Use CDN system instead.')
  
  if (!url) return ''
  
  // If it's already a CDN URL, return as is
  if (cdnMediaService.isCDNUrl(url)) {
    return url
  }
  
  // For Instagram URLs, return placeholder instead of proxy
  if (cdnMediaService.isInstagramUrl(url)) {
    const placeholders = cdnMediaService.getPlaceholderUrls()
    return placeholders.avatar.large
  }
  
  return url
}

/**
 * @deprecated Use ProfileAvatar from @/components/ui/cdn-image instead
 * Legacy function kept for compatibility during migration
 */
export function proxyInstagramUrlCached(url: string | null | undefined): string {
  console.warn('proxyInstagramUrlCached is deprecated. Use CDN system instead.')
  return proxyInstagramUrl(url)
}

/**
 * @deprecated Use CDNImage or ProfileAvatar components instead
 * Legacy error handler kept for compatibility
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  console.warn('handleImageError is deprecated. Use CDN components with automatic fallbacks.')
  const target = event.currentTarget
  const placeholders = cdnMediaService.getPlaceholderUrls()
  target.src = placeholders.avatar.large
}

/**
 * Migration helper to identify components that need updating
 */
export function flagLegacyImageUsage(componentName: string, url?: string) {
  if (process.env.NODE_ENV === 'development') {
    if (url && cdnMediaService.isInstagramUrl(url)) {
      console.warn(
        `🚨 Legacy image usage detected in ${componentName}:`,
        'Instagram URL found. Consider migrating to CDN system.',
        '\n📖 See: /frontend/FRONTEND_MIGRATION_GUIDE.md'
      )
    }
  }
}

/**
 * Development helper to check migration status
 */
export function getMigrationStatus() {
  if (process.env.NODE_ENV !== 'development') {
    return { migrated: true, legacy: 0 }
  }
  
  // This would require more sophisticated analysis in a real implementation
  return {
    migrated: false,
    legacy: 0,
    recommendations: [
      'Replace ProfileAvatar imports from profile-avatar to cdn-image',
      'Update components to use CDN media hooks',
      'Remove corsproxy.io environment variables',
      'Delete image-proxy.ts and image-cache.ts files'
    ]
  }
}

/**
 * Utility to convert legacy profile data to CDN-compatible format
 */
export function prepareLegacyProfileForCDN(profile: any) {
  return {
    id: profile.id || profile.profile_id,
    username: profile.username,
    full_name: profile.full_name,
    profile_pic_url: profile.profile_pic_url,
    profile_pic_url_hd: profile.profile_pic_url_hd || profile.profile_pic_url,
  }
}

/**
 * Check if profile has CDN data available
 */
export function hasCDNData(cdnMedia: any): boolean {
  return !!(cdnMedia?.avatar?.available && cdnMedia.avatar.large)
}

/**
 * Get best available image URL with CDN preference
 */
export function getBestImageUrl(
  cdnUrl: string | null | undefined,
  fallbackUrl: string | null | undefined,
  size: 'small' | 'large' = 'large'
): string {
  if (cdnUrl && cdnMediaService.isCDNUrl(cdnUrl)) {
    return cdnUrl
  }
  
  // Don't use expired Instagram URLs
  if (fallbackUrl && cdnMediaService.isInstagramUrl(fallbackUrl)) {
    const placeholders = cdnMediaService.getPlaceholderUrls()
    return size === 'large' ? placeholders.avatar.large : placeholders.avatar.small
  }
  
  const placeholders = cdnMediaService.getPlaceholderUrls()
  return fallbackUrl || (size === 'large' ? placeholders.avatar.large : placeholders.avatar.small)
}