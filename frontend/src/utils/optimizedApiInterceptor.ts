// utils/optimizedApiInterceptor.ts
/**
 * Optimized API interceptor that implements all frontend team recommendations:
 * - Request deduplication
 * - Intelligent caching
 * - Exponential backoff retry
 * - Enhanced session management
 * - Proper error handling
 */

import { tokenManager } from './tokenManager'
import { requestCache } from './requestCache'
import { withRetry, RETRY_CONFIGS } from './retryManager'

interface RequestConfig extends RequestInit {
  timeout?: number
  skipAuth?: boolean
  skipCache?: boolean
  skipRetry?: boolean
  retryConfig?: typeof RETRY_CONFIGS.STANDARD
  cacheKey?: string
  cacheTtl?: number
}

interface OptimizedResponse<T = any> extends Response {
  data?: T
  fromCache?: boolean
  retryAttempts?: number
  totalDuration?: number
}

class OptimizedApiInterceptor {
  private readonly defaultTimeout = 10000 // 10 seconds
  private pendingRequests = new Map<string, Promise<Response>>()

  /**
   * Enhanced fetch with all optimizations
   */
  async fetch<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<OptimizedResponse<T>> {
    const startTime = Date.now()
    
    const {
      timeout = this.defaultTimeout,
      skipAuth = false,
      skipCache = false,
      skipRetry = false,
      retryConfig = RETRY_CONFIGS.STANDARD,
      cacheKey,
      cacheTtl = 5 * 60 * 1000, // 5 minutes default
      ...requestInit
    } = config

    // Generate cache key if not provided
    const finalCacheKey = cacheKey || this.generateCacheKey(url, requestInit)

    // Check cache first (for GET requests)
    if (!skipCache && (requestInit.method === 'GET' || !requestInit.method)) {
      try {
        const cached = await requestCache.get(
          finalCacheKey,
          () => this.executeRequest(url, requestInit, timeout, skipAuth),
          cacheTtl
        )
        
        const response = cached as OptimizedResponse<T>
        response.fromCache = true
        response.totalDuration = Date.now() - startTime
        
        return response
      } catch (error) {
        // Cache miss or error - continue with regular request
      }
    }

    // Execute request with retry logic
    const executeWithRetry = skipRetry 
      ? () => this.executeRequest(url, requestInit, timeout, skipAuth)
      : () => withRetry(
          () => this.executeRequest(url, requestInit, timeout, skipAuth),
          retryConfig
        )

    try {
      const response = await executeWithRetry() as OptimizedResponse<T>
      response.totalDuration = Date.now() - startTime
      
      return response
    } catch (error) {
      console.error(`Request failed: ${url}`, error)
      throw error
    }
  }

  /**
   * Execute the actual request with deduplication
   */
  private async executeRequest(
    url: string,
    requestInit: RequestInit,
    timeout: number,
    skipAuth: boolean
  ): Promise<Response> {
    // Generate request key for deduplication
    const requestKey = this.generateRequestKey(url, requestInit)
    
    // Return existing promise if request is in progress
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!
    }

    // Create new request
    const requestPromise = this.performRequest(url, requestInit, timeout, skipAuth)
      .finally(() => {
        this.pendingRequests.delete(requestKey)
      })

    this.pendingRequests.set(requestKey, requestPromise)
    return requestPromise
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest(
    url: string,
    requestInit: RequestInit,
    timeout: number,
    skipAuth: boolean
  ): Promise<Response> {
    // Setup request headers
    const headers = new Headers(requestInit.headers)
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    // Add authentication if not skipped
    if (!skipAuth) {
      const tokenResult = await tokenManager.getValidTokenWithRefresh()
      if (tokenResult.isValid && tokenResult.token) {
        headers.set('Authorization', `Bearer ${tokenResult.token}`)
      }
    }

    // Setup abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...requestInit,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle authentication errors
      if (response.status === 401) {
        console.log('🔐 Authentication error, clearing tokens')
        tokenManager.clearAllTokens()
        throw new Error('Authentication required')
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
        throw new Error(`Rate limited. Retry after ${delay}ms`)
      }

      return response

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`)
      }
      
      throw error
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(url: string, requestInit: RequestInit): string {
    const method = requestInit.method || 'GET'
    const body = requestInit.body ? JSON.stringify(requestInit.body) : ''
    const hash = btoa(`${method}:${url}:${body}`).replace(/[/+=]/g, '-')
    return `api-${hash}`
  }

  /**
   * Generate request key for deduplication
   */
  private generateRequestKey(url: string, requestInit: RequestInit): string {
    return this.generateCacheKey(url, requestInit)
  }

  /**
   * Convenience methods
   */
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<OptimizedResponse<T>> {
    return this.fetch<T>(url, { ...config, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<OptimizedResponse<T>> {
    return this.fetch<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<OptimizedResponse<T>> {
    return this.fetch<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<OptimizedResponse<T>> {
    return this.fetch<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * Clear all caches and pending requests
   */
  clearAll(): void {
    requestCache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      cache: requestCache.getStats(),
      pendingRequests: this.pendingRequests.size,
      pendingRequestKeys: Array.from(this.pendingRequests.keys())
    }
  }
}

// Singleton instance
export const optimizedApi = new OptimizedApiInterceptor()

// Backwards compatible export
export const fetchWithAuth = optimizedApi.fetch.bind(optimizedApi)

// Export types
export type { RequestConfig, OptimizedResponse }