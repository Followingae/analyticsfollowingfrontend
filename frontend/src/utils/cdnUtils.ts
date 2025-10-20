/**
 * CDN URL Prioritization Utilities (CORRECTED)
 * Prioritizes cdn_avatar_url as the primary CDN field with proper fallback hierarchy
 */

interface CDNMediaSource {
  // CDN URLs (corrected prioritization)
  cdn_avatar_url?: string | null;  // PRIMARY: Optimized WebP, 512px
  cdn_url_512?: string | null;     // Alternative CDN URL
  cdn_urls?: {
    avatar_256?: string;
    avatar_512?: string;
  };

  // Fallback URLs (corrected priority order)
  profile_pic_url_hd?: string | null;  // Instagram original (preferred fallback)
  profile_pic_url?: string | null;     // Often empty, avoid when possible
  profile_picture_url?: string | null; // Alternative naming

  // For debugging
  username?: string;
}

/**
 * Get the best available profile picture URL with CORRECTED CDN prioritization
 * Priority: cdn_avatar_url > profile_pic_url_hd > cdn_url_512 > cdn_urls.avatar_512 > cdn_urls.avatar_256 > profile_pic_url
 */
export function getOptimizedProfilePicture(source: CDNMediaSource): string | null {
  // Debug specifically for laurazaraa
  if (source.username?.toLowerCase().includes('laurazaraa') || JSON.stringify(source).toLowerCase().includes('laurazaraa')) {
    console.log('🚨 LAURAZARAA CDN CHECK:', {
      cdn_avatar_url: source.cdn_avatar_url,
      detected_country: source.detected_country,
      sourceKeys: Object.keys(source)
    })
  }

  // 1. PRIMARY: CDN avatar URL (optimized WebP, 512px)
  if (source.cdn_avatar_url) {
    console.log('✅ CDN avatar found:', source.cdn_avatar_url)
    return source.cdn_avatar_url;
  }

  // 2. PREFERRED FALLBACK: Instagram original HD (reliable fallback)
  if (source.profile_pic_url_hd) {
    return source.profile_pic_url_hd;
  }

  // 3. Alternative CDN URLs (legacy support)
  if (source.cdn_url_512) {
    return source.cdn_url_512;
  }

  if (source.cdn_urls?.avatar_512) {
    return source.cdn_urls.avatar_512;
  }

  if (source.cdn_urls?.avatar_256) {
    return source.cdn_urls.avatar_256;
  }

  // 4. LAST RESORT: profile_pic_url (often empty, avoid when possible)
  return source.profile_pic_url || source.profile_picture_url || null;
}

/**
 * Check if CDN version is available (prioritizing cdn_avatar_url)
 */
export function hasCDNVersion(source: CDNMediaSource): boolean {
  return !!(
    source.cdn_avatar_url ||
    source.cdn_url_512 ||
    source.cdn_urls?.avatar_512 ||
    source.cdn_urls?.avatar_256
  );
}

/**
 * Get CDN processing status for debugging (corrected prioritization)
 */
export function getCDNStatus(source: CDNMediaSource): {
  status: 'cdn_available' | 'cdn_partial' | 'fallback_only';
  primary_url: string | null;
  cdn_fields: string[];
} {
  const cdnFields: string[] = [];

  // Check in priority order
  if (source.cdn_avatar_url) cdnFields.push('cdn_avatar_url');
  if (source.cdn_url_512) cdnFields.push('cdn_url_512');
  if (source.cdn_urls?.avatar_512) cdnFields.push('cdn_urls.avatar_512');
  if (source.cdn_urls?.avatar_256) cdnFields.push('cdn_urls.avatar_256');

  const primaryUrl = getOptimizedProfilePicture(source);

  // Status based on CDN availability
  if (source.cdn_avatar_url) {
    return { status: 'cdn_available', primary_url: primaryUrl, cdn_fields: cdnFields };
  } else if (cdnFields.length >= 1) {
    return { status: 'cdn_partial', primary_url: primaryUrl, cdn_fields: cdnFields };
  } else {
    return { status: 'fallback_only', primary_url: primaryUrl, cdn_fields: cdnFields };
  }
}

/**
 * Get optimized location/country information
 * Uses detected_country field (ISO country codes) over legacy country_block
 */
export function getOptimizedCountry(source: {
  detected_country?: string | null;    // PRIMARY: ISO country codes (AE, US, GB, etc.)
  country_block?: string | null;       // FALLBACK: Legacy country detection
  username?: string;                   // For debugging
}): string | null {
  // Debug specifically for laurazaraa
  if (source.username?.toLowerCase().includes('laurazaraa') || JSON.stringify(source).toLowerCase().includes('laurazaraa')) {
    console.log('🚨 LAURAZARAA COUNTRY CHECK:', {
      detected_country: source.detected_country,
      country_block: source.country_block,
      sourceKeys: Object.keys(source)
    })
  }

  // 1. PRIMARY: detected_country field (ISO country codes)
  if (source.detected_country) {
    console.log('✅ Country found:', source.detected_country)
    return source.detected_country;
  }

  // 2. FALLBACK: Legacy country_block field
  return source.country_block || null;
}