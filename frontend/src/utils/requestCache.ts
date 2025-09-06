// utils/requestCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTtl = 5 * 60 * 1000 // 5 minutes

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    const now = Date.now()
    const entry = this.cache.get(key)

    // Return cached data if still valid
    if (entry && now - entry.timestamp < ttl) {
      console.log(`🎯 Cache HIT for ${key}`)
      return entry.data
    }

    // If there's already a request in progress, return that promise
    if (entry?.promise) {
      console.log(`🔄 Request in progress for ${key}, joining...`)
      return entry.promise
    }

    // Create new request
    console.log(`🚀 Cache MISS for ${key}, fetching...`)
    const promise = fetcher().then((data) => {
      // Store successful result
      this.cache.set(key, {
        data,
        timestamp: now,
        promise: undefined
      })
      return data
    }).catch((error) => {
      // Remove failed request from cache
      this.cache.delete(key)
      throw error
    })

    // Store the promise temporarily to prevent duplicate requests
    this.cache.set(key, {
      data: entry?.data,
      timestamp: entry?.timestamp || 0,
      promise
    })

    return promise
  }

  invalidate(key: string): void {
    console.log(`🗑️ Invalidating cache for ${key}`)
    this.cache.delete(key)
  }

  clear(): void {
    console.log('🧹 Clearing all cache')
    this.cache.clear()
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
        hasPromise: !!entry.promise
      }))
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