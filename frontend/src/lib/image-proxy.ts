/**
 * @deprecated - MIGRATED TO CDN SYSTEM
 * This file is deprecated and should not be used.
 * Use CDN system instead: @/services/cdnMediaApi and @/components/ui/cdn-image
 */

import { getBestImageUrl } from './cdn-migration';

/**
 * @deprecated Use CDN system instead
 * Legacy function redirects to CDN migration utility
 */
export function proxyInstagramUrl(url: string | null | undefined): string {
  return getBestImageUrl(null, url);
}

/**
 * @deprecated Use CDN components with automatic fallbacks instead
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const target = event.currentTarget;
  target.src = 'https://cdn.following.ae/placeholders/avatar-512.webp';
};

/**
 * @deprecated Instagram URLs are no longer validated as they expire
 * CDN URLs are permanent and don't require validation
 */
import { z } from 'zod';

export const InstagramUrlSchema = z.string().refine(() => false, {
  message: "Instagram URLs are deprecated. Use CDN system instead."
});