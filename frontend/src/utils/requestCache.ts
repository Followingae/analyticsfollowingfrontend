// utils/requestCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
  ttl: number
  hitCount: number
  errorCount: number
}

interface CacheStats {
  totalHits: number
  totalMisses: number
  totalErrors: number
  memoryUsage: number
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTtl = 5 * 60 * 1000 // 5 minutes - AGGRESSIVE CACHING
  private readonly maxCacheSize = 100 // Increased cache size for aggressive caching
  private stats: CacheStats = {
    totalHits: 0,
    totalMisses: 0,
    totalErrors: 0,
    memoryUsage: 0
  }

  // Auto-cleanup timer
  private cleanupTimer?: NodeJS.Timeout
  // Request deduplication - track ongoing requests
  private pendingRequests = new Map<string, Promise<any>>()

  constructor() {
    // Run cleanup every 5 minutes for aggressive caching
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, 5 * 60 * 1000)
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTtl,
    options: {
      forceRefresh?: boolean
      retryOnError?: boolean
      retryAttempts?: number
      retryDelay?: number
    } = {}
  ): Promise<T> {
    const now = Date.now()
    const entry = this.cache.get(key)

    // Force refresh bypasses cache
    if (options.forceRefresh) {
      this.cache.delete(key)
      this.pendingRequests.delete(key)
      return this.fetchAndCache(key, fetcher, ttl, now, options)
    }

    // Return cached data if still valid (aggressive caching)
    if (entry && now - entry.timestamp < entry.ttl) {
      entry.hitCount++
      this.stats.totalHits++
      console.log(`✅ Cache HIT for ${key} (age: ${Math.round((now - entry.timestamp) / 1000)}s)`)
      return entry.data
    }

    // REQUEST DEDUPLICATION - Check if same request is already in progress
    const pendingRequest = this.pendingRequests.get(key)
    if (pendingRequest) {
      console.log(`🔄 Request DEDUPLICATION for ${key} - returning existing promise`)
      return pendingRequest
    }

    // Cache miss - fetch new data
    this.stats.totalMisses++
    console.log(`❌ Cache MISS for ${key} - fetching new data`)
    return this.fetchAndCache(key, fetcher, ttl, now, options)
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    now: number,
    options: {
      retryAttempts?: number
      retryDelay?: number
      retryOnError?: boolean
    } = {}
  ): Promise<T> {
    const maxRetries = options.retryAttempts || 3
    const baseDelay = options.retryDelay || 1000

    // Retry wrapper with exponential backoff
    const fetchWithRetry = async (attempt: number = 1): Promise<T> => {
      try {
        console.log(`🔄 Fetch attempt ${attempt}/${maxRetries} for ${key}`)
        const data = await fetcher()
        console.log(`✅ Fetch SUCCESS for ${key} on attempt ${attempt}`)
        return data
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error'
        console.error(`❌ Fetch attempt ${attempt}/${maxRetries} failed for ${key}:`, errorMessage)

        // Handle specific error codes - don't retry client errors
        if (errorMessage.includes('402') ||
            errorMessage.includes('PAYMENT_REQUIRED') ||
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('404')) {
          console.log(`🚫 Not retrying ${key} - client error: ${errorMessage}`)
          throw error
        }

        // Retry logic for server errors (500) and timeouts
        // DON'T retry on 60+ second timeouts - they indicate backend processing time issues
        const isLongTimeout = errorMessage.includes('60') || errorMessage.includes('timeout after 60')

        if (attempt < maxRetries && !isLongTimeout && (
          errorMessage.includes('500') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('fetch')
        )) {
          const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff: 1s, 2s, 4s
          console.log(`⏳ Retrying ${key} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchWithRetry(attempt + 1)
        }

        // For 60+ second timeouts, provide helpful error message
        if (isLongTimeout) {
          console.log(`🚫 Not retrying ${key} - 60+ second timeout indicates backend processing issue`)
          throw new Error('Request timeout: The backend is taking too long to process this request. Please try again in a few minutes.')
        }

        // Handle 10+ second timeouts with fallback data
        const isLongRequest = errorMessage.includes('10') || errorMessage.includes('timeout after 10')
        if (isLongRequest) {
          console.log(`⚠️ 10+ second timeout for ${key} - providing fallback data`)

          // Return fallback data for common endpoints
          if (key.includes('unlocked-profiles')) {
            return {
              profiles: [],
              pagination: { total_items: 0, page: 1, page_size: 10, total_pages: 0 }
            }
          }

          if (key.includes('system-stats')) {
            return {
              total_users: 0,
              total_profiles_analyzed: 0,
              total_api_calls_today: 0,
              system_health: 'degraded'
            }
          }
        }

        throw error
      }
    }

    // Create the promise with retry logic
    const promise = fetchWithRetry()
      .then((data) => {
        // Store successful result
        this.cache.set(key, {
          data,
          timestamp: now,
          ttl,
          hitCount: 0,
          errorCount: 0,
          promise: undefined
        })

        // Remove from pending requests
        this.pendingRequests.delete(key)

        console.log(`💾 Cached successful result for ${key} (TTL: ${ttl / 1000}s)`)
        return data
      })
      .catch((error) => {
        console.error(`❌ All retry attempts failed for ${key}:`, error?.message)
        this.stats.totalErrors++

        // Remove from pending requests
        this.pendingRequests.delete(key)

        // Update error count for existing entry or remove failed request
        const existingEntry = this.cache.get(key)
        if (existingEntry) {
          existingEntry.errorCount++
          existingEntry.promise = undefined

          // GRACEFUL ERROR HANDLING - return stale data if available
          if (existingEntry.data && options.retryOnError) {
            console.log(`🔄 Returning stale data for ${key} due to error`)
            return existingEntry.data
          }
        } else {
          this.cache.delete(key)
        }
        throw error
      })

    // Add to pending requests for deduplication
    this.pendingRequests.set(key, promise)

    // Store the promise temporarily to prevent duplicate requests
    const existingEntry = this.cache.get(key)
    this.cache.set(key, {
      data: existingEntry?.data,
      timestamp: existingEntry?.timestamp || 0,
      ttl,
      hitCount: existingEntry?.hitCount || 0,
      errorCount: existingEntry?.errorCount || 0,
      promise
    })

    // Prevent memory leaks - remove oldest entries if cache is too large
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldest()
    }

    return promise
  }

  /**
   * Batch invalidation of related keys
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0
    const regex = new RegExp(pattern.replace('*', '.*'))
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key)
        invalidated++
      }
    }
    
    return invalidated
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.stats = {
      totalHits: 0,
      totalMisses: 0,
      totalErrors: 0,
      memoryUsage: 0
    }
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
    }
  }

  /**
   * Evict oldest entries to prevent memory leaks
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    
    const toRemove = Math.ceil(this.maxCacheSize * 0.1) // Remove 10% of entries
    for (let i = 0; i < toRemove && entries[i]; i++) {
      const [key] = entries[i]
      this.cache.delete(key)
    }
    
  }

  /**
   * Get cache stats for debugging and monitoring
   */
  getStats() {
    const now = Date.now()
    this.stats.memoryUsage = this.cache.size
    
    return {
      ...this.stats,
      hitRate: this.stats.totalHits / Math.max(1, this.stats.totalHits + this.stats.totalMisses),
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        age: now - entry.timestamp,
        ttl: entry.ttl,
        hitCount: entry.hitCount,
        errorCount: entry.errorCount,
        hasPromise: !!entry.promise,
        isExpired: now - entry.timestamp > entry.ttl
      }))
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.clear()
  }

  /**
   * Force aggressive cleanup
   */
  forceCleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    // Clear all entries older than 30 seconds
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > 30000 || entry.promise) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    
    // Reset stats
    this.stats = {
      totalHits: 0,
      totalMisses: 0,
      totalErrors: 0,
      memoryUsage: 0
    }
  }
}

export const requestCache = new RequestCache()

// Export cache key generators to prevent typos
export const CACHE_KEYS = {
  SYSTEM_STATS: 'system-stats',
  DASHBOARD_STATS: 'dashboard-stats',
  TEAMS_OVERVIEW: 'teams-overview',
  UNLOCKED_PROFILES: 'unlocked-profiles',
  ACTIVE_CAMPAIGNS: 'active-campaigns'
} as const