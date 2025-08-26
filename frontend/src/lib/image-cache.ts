/**
 * Enhanced image caching system for CORS-proxied Instagram images
 * Handles both memory and browser cache with fallback strategies
 */

interface CacheEntry {
  url: string
  cachedAt: number
  expiresAt: number
}

class ImageCache {
  private memoryCache = new Map<string, string>()
  private cacheExpiry = 30 * 60 * 1000 // 30 minutes
  private maxMemoryCache = 100 // Max 100 images in memory

  /**
   * Get cached image URL or create new proxied URL with caching headers
   * IMPORTANT: Only works client-side due to CORS proxy restrictions
   */
  getCachedUrl(originalUrl: string): string {
    if (!originalUrl) return ''

    // CRITICAL: Only proxy on client-side - server-side requests are blocked by CORS proxy
    if (typeof window === 'undefined') {
      return originalUrl // Return original URL on server-side
    }

    // Check memory cache first
    const cached = this.memoryCache.get(originalUrl)
    if (cached) {
      return cached
    }

    // Create proxied URL with aggressive caching
    const proxiedUrl = this.createProxiedUrl(originalUrl)
    
    // Store in memory cache
    this.addToMemoryCache(originalUrl, proxiedUrl)
    
    return proxiedUrl
  }

  private createProxiedUrl(url: string): string {
    const apiKey = process.env.NEXT_PUBLIC_CORSPROXY_API_KEY
    const altProxy = process.env.NEXT_PUBLIC_CORS_ALTERNATIVE
    
    if (!apiKey && !altProxy) {
      console.warn('No CORS proxy configured')
      return url
    }

    // Try primary CORS proxy first
    if (apiKey) {
      const proxyUrl = new URL('https://api.corsproxy.io/')
      proxyUrl.searchParams.set('url', url)
      proxyUrl.searchParams.set('key', apiKey)
      proxyUrl.searchParams.set('cache', 'max-age=1800') // 30 minutes
      
      return proxyUrl.toString()
    }
    
    // Fallback to alternative proxy
    if (altProxy) {
      return `${altProxy}${encodeURIComponent(url)}`
    }
    
    return url
  }

  private addToMemoryCache(originalUrl: string, proxiedUrl: string): void {
    // Clean up old entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCache) {
      const oldestKey = this.memoryCache.keys().next().value
      if (oldestKey) {
        this.memoryCache.delete(oldestKey)
      }
    }

    this.memoryCache.set(originalUrl, proxiedUrl)
  }

  /**
   * Preload images for better performance
   */
  preloadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Skip preloading on server-side to avoid CORS proxy 403 errors
      if (typeof window === 'undefined') {
        resolve(this.getCachedUrl(url))
        return
      }

      const img = new Image()
      const cachedUrl = this.getCachedUrl(url)
      
      img.onload = () => resolve(cachedUrl)
      img.onerror = () => reject(new Error(`Failed to load image: ${cachedUrl}`))
      
      // Set cache-friendly attributes
      img.crossOrigin = 'anonymous'
      img.src = cachedUrl
    })
  }

  /**
   * Batch preload multiple images
   */
  async preloadImages(urls: string[]): Promise<string[]> {
    const validUrls = urls.filter(Boolean)
    const preloadPromises = validUrls.map(url => 
      this.preloadImage(url).catch(err => {
        console.warn(`Failed to preload image: ${url}`, err)
        return this.getCachedUrl(url) // Return cached URL even if preload fails
      })
    )
    
    return Promise.all(preloadPromises)
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.memoryCache.clear()
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      memorySize: this.memoryCache.size,
      maxSize: this.maxMemoryCache,
      entries: Array.from(this.memoryCache.keys())
    }
  }
}

// Singleton instance
export const imageCache = new ImageCache()


/**
 * Enhanced version of proxyInstagramUrl with caching
 */
export function proxyInstagramUrlCached(url: string | null | undefined): string {
  if (!url) return ''

  // Check if it's an Instagram URL that needs proxying
  const isInstagramUrl =
    url.startsWith('https://scontent-') ||
    url.startsWith('https://instagram.') ||
    url.startsWith('https://scontent.cdninstagram.com') ||
    url.includes('.fbcdn.net') ||
    url.includes('cdninstagram.com') ||
    url.includes('scontent-')

  if (!isInstagramUrl) {
    return url
  }

  return imageCache.getCachedUrl(url)
}

/**
 * React hook for cached image URLs
 */
import { useEffect, useState } from 'react'

export function useCachedImage(url: string | null | undefined) {
  const [cachedUrl, setCachedUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setCachedUrl('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const cached = proxyInstagramUrlCached(url)
    setCachedUrl(cached)

    // Skip preloading to avoid CORS proxy 403 errors
    // Just return the cached URL immediately
    setIsLoading(false)
  }, [url])

  return { cachedUrl, isLoading, error }
}

/**
 * Utility to preload images for a page/component
 * DISABLED: Skip preloading to avoid CORS proxy 403 errors
 */
export function preloadPageImages(urls: (string | null | undefined)[]): Promise<void> {
  // Skip preloading entirely to avoid CORS proxy server-side requests
  return Promise.resolve()
}