import { z } from 'zod';

/**
 * Converts Instagram CDN URLs to CORSPROXY.IO proxied URLs
 * Handles CORS issues for Instagram images
 */
export function proxyInstagramUrl(url: string | null | undefined): string {
  // Handle falsy values
  if (!url) return '';

  // Only proxy Instagram CDN URLs
  const isInstagramUrl =
    url.startsWith('https://scontent-') ||
    url.startsWith('https://instagram.') ||
    url.startsWith('https://scontent.cdninstagram.com') ||
    url.includes('.fbcdn.net') ||
    url.includes('cdninstagram.com') ||
    url.includes('scontent-');

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Proxy check:', { url, isInstagramUrl });
  }

  if (!isInstagramUrl) {
    return url;
  }

  const apiKey = process.env.NEXT_PUBLIC_CORSPROXY_API_KEY;

  if (!apiKey) {
    console.warn('CORSPROXY API key not found in environment variables');
    return url; // Return original URL as fallback
  }

  const proxyUrl = `https://api.corsproxy.io/?url=${encodeURIComponent(url)}&key=${apiKey}`;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Proxying URL:', { original: url, proxied: proxyUrl });
  }

  return proxyUrl;
}

/**
 * Type-safe image error handler for Instagram images
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {       
  const target = event.currentTarget;
  target.style.display = 'none';

  // Optional: Log failed image URLs for debugging
  if (process.env.NODE_ENV === 'development') {
    console.warn('Failed to load image:', target.src);
  }
};

/**
 * Zod schema for validating Instagram URLs (optional but recommended)
 */
export const InstagramUrlSchema = z.string().refine(
  (url) =>
    url.startsWith('https://scontent-') ||
    url.startsWith('https://instagram.') ||
    url.startsWith('https://scontent.cdninstagram.com') ||
    url.includes('.fbcdn.net') ||
    url.includes('cdninstagram.com') ||
    url.includes('scontent-'),
  {
    message: "Must be a valid Instagram CDN URL"
  }
);