// utils/apiDeduplication.ts
import { fetchWithAuth } from './apiInterceptor'
import { apiMonitor } from './apiMonitor'

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class APIDeduplication {
  private pendingRequests = new Map<string, PendingRequest>()
  private readonly maxAge = 30 * 1000 // 30 seconds max age for deduplication

  async deduplicatedFetch<T = any>(
    url: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    // Generate cache key from URL and method
    const key = cacheKey || this.generateCacheKey(url, options)

    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending && this.isRequestValid(pending)) {
      console.log(`🔄 API DEDUPLICATION: Returning existing request for ${key}`)
      return pending.promise
    }

    // Clean up expired requests
    this.cleanupExpiredRequests()

    // Create new request
    console.log(`🚀 API NEW REQUEST: ${key}`)
    const startTime = Date.now()
    const promise = fetchWithAuth(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    }).then(async (response) => {
      // Log successful call
      apiMonitor.logCall(url, options.method || 'GET', startTime, response)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    }).catch((error) => {
      // Log failed call
      apiMonitor.logCall(url, options.method || 'GET', startTime, undefined, error)
      throw error
    }).finally(() => {
      // Remove from pending requests when complete
      this.pendingRequests.delete(key)
    })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    return promise
  }

  private generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private isRequestValid(pending: PendingRequest): boolean {
    return Date.now() - pending.timestamp < this.maxAge
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now()
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > this.maxAge) {
        this.pendingRequests.delete(key)
      }
    }
  }

  clearPendingRequests(): void {
    this.pendingRequests.clear()
  }

  getPendingRequestsCount(): number {
    return this.pendingRequests.size
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    }
  }
}

export const apiDeduplication = new APIDeduplication()

// Convenience wrapper for common API calls with proper base URL
export const dedicatedApiCall = {
  // Dashboard data
  dashboard: async () => {
    const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
    return apiDeduplication.deduplicatedFetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.auth.dashboard}`,
      { method: 'GET' },
      'dashboard-data'
    )
  },

  // Campaigns overview
  campaignsOverview: async () => {
    const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
    return apiDeduplication.deduplicatedFetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.overview}`,
      { method: 'GET' },
      'campaigns-overview'
    )
  },

  // Teams overview
  teamsOverview: async () => {
    const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
    return apiDeduplication.deduplicatedFetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`,
      { method: 'GET' },
      'teams-overview'
    )
  },

  // Campaign list
  campaignsList: async (params: { status?: string; limit?: number } = {}) => {
    const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.limit) query.append('limit', params.limit.toString())

    const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.campaigns.list}${query.toString() ? `?${query.toString()}` : ''}`
    return apiDeduplication.deduplicatedFetch(
      url,
      { method: 'GET' },
      `campaigns-list-${query.toString()}`
    )
  },

  // Unlocked profiles
  unlockedProfiles: async (page = 1, pageSize = 20) => {
    const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
    return apiDeduplication.deduplicatedFetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.auth.unlockedProfiles}?page=${page}&page_size=${pageSize}`,
      { method: 'GET' },
      `unlocked-profiles-${page}-${pageSize}`
    )
  },
}