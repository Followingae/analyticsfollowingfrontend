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
  private readonly defaultTtl = 2 * 60 * 1000 // 2 minutes (reduced from 5)
  private readonly maxCacheSize = 50 // Reduced from 100 to prevent memory leaks
  private stats: CacheStats = {
    totalHits: 0,
    totalMisses: 0,
    totalErrors: 0,
    memoryUsage: 0
  }
  
  // Auto-cleanup timer
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    // Run cleanup every 2 minutes to prevent memory buildup
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, 2 * 60 * 1000)
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTtl,
    options: {
      forceRefresh?: boolean
      retryOnError?: boolean
    } = {}
  ): Promise<T> {
    const now = Date.now()
    const entry = this.cache.get(key)

    // Force refresh bypasses cache
    if (options.forceRefresh) {
      console.log(`🔄 Force refresh for ${key}`)
      this.cache.delete(key)
      return this.fetchAndCache(key, fetcher, ttl, now)
    }

    // Return cached data if still valid
    if (entry && now - entry.timestamp < entry.ttl) {
      console.log(`🎯 Cache HIT for ${key} (age: ${Math.round((now - entry.timestamp) / 1000)}s)`)
      entry.hitCount++
      this.stats.totalHits++
      return entry.data
    }

    // If there's already a request in progress, return that promise
    if (entry?.promise) {
      console.log(`🔄 Request in progress for ${key}, joining...`)
      return entry.promise
    }

    // Cache miss - fetch new data
    console.log(`🚀 Cache MISS for ${key}, fetching...`)
    this.stats.totalMisses++
    return this.fetchAndCache(key, fetcher, ttl, now)
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    now: number
  ): Promise<T> {
    const promise = fetcher()
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
        console.log(`✅ Cached successful response for ${key}`)
        return data
      })
      .catch((error) => {
        console.error(`❌ Request failed for ${key}:`, error)
        this.stats.totalErrors++
        
        // Update error count for existing entry or remove failed request
        const existingEntry = this.cache.get(key)
        if (existingEntry) {
          existingEntry.errorCount++
          existingEntry.promise = undefined
          // Keep stale data on error if available
          if (existingEntry.data) {
            console.log(`🔄 Keeping stale data for ${key} due to error`)
            return existingEntry.data
          }
        } else {
          this.cache.delete(key)
        }
        throw error
      })

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
    
    console.log(`🗑️ Invalidated ${invalidated} cache entries matching pattern: ${pattern}`)
    return invalidated
  }

  invalidate(key: string): void {
    console.log(`🗑️ Invalidating cache for ${key}`)
    this.cache.delete(key)
  }

  clear(): void {
    console.log('🧹 Clearing all cache')
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
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`)
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
    
    console.log(`🗑️ Evicted ${toRemove} oldest cache entries`)
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
    
    console.log(`🧹 Force cleaned ${cleaned} cache entries`)
    
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