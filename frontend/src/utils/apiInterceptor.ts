/**
 * API Interceptor with Automatic Token Refresh
 * Handles 401 errors by attempting to refresh tokens before failing
 */

import { authService } from '@/services/authService'
import { tokenManager } from '@/utils/tokenManager'
import { waitForAuthInit } from '@/utils/authInit'

interface RequestConfig {
  url: string
  options: RequestInit
}

class ApiInterceptor {
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value: Response) => void
    reject: (error: Error) => void
    config: RequestConfig
  }> = []

  /**
   * Enhanced fetch with automatic token refresh and validation
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Ensure auth system is initialized before making requests
    await waitForAuthInit()
    
    // Use token manager for consistent token access
    const tokenResult = await tokenManager.getValidToken()
    
    if (!tokenResult.isValid || !tokenResult.token) {
      console.warn('🔒 API Request: No valid token available for', url, 'Reason:', tokenResult.reason)
      throw new Error('No authentication token available')
    }

    // Add token to request if not already present
    if (!this.hasAuthHeader(options)) {
      options = this.updateAuthHeader(options, tokenResult.token)
      console.log('🔒 API Request: Added Authorization header for', url)
    }
    
    const config = { url, options }
    
    try {
      const response = await fetch(url, options)
      
      // If 401, attempt token refresh and retry
      if (response.status === 401) {
        return this.handle401Error(config)
      }
      
      // If 403 (Forbidden), check if this is a permission issue vs auth issue
      if (response.status === 403) {
        const responseText = await response.clone().text()
        // Only logout if it's clearly an auth issue, not a permission issue
        if (responseText.includes('token') || responseText.includes('expired') || responseText.includes('invalid')) {
          console.log('🚫 403 Forbidden due to invalid token - clearing auth state')
          authService.logout()
          throw new Error('Authentication expired. Please log in again.')
        } else {
          console.log('🚫 403 Forbidden due to permissions - not logging out')
          // Don't logout for permission issues, let the calling code handle it
        }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle 401 errors with token refresh logic
   */
  private async handle401Error(config: RequestConfig): Promise<Response> {
    if (this.isRefreshing) {
      // Token refresh already in progress, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config })
      })
    }

    this.isRefreshing = true

    try {
      console.log('🔄 401 detected, attempting token refresh...')
      
      const refreshResult = await authService.refreshToken()
      
      if (refreshResult.success && refreshResult.access_token) {
        console.log('✅ Token refreshed successfully')
        
        // Process failed queue with new token
        this.processQueue(null)
        
        // Retry original request with new token
        const updatedOptions = this.updateAuthHeader(config.options, refreshResult.access_token)
        return fetch(config.url, updatedOptions)
      } else {
        console.log('❌ Token refresh failed, logging out')
        
        // Refresh failed, logout user - but don't call logout multiple times
        this.processQueue(new Error('Token refresh failed'))
        if (authService.isAuthenticated()) {
          console.log('🚪 API Interceptor: Calling logout due to token refresh failure')
          authService.logout()
        }
        throw new Error('Authentication failed. Please log in again.')
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      
      this.processQueue(error as Error)
      if (authService.isAuthenticated()) {
        console.log('🚪 API Interceptor: Calling logout due to token refresh error')
        authService.logout()
      }
      throw new Error('Authentication failed. Please log in again.')
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: Error | null) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error)
      } else {
        // Retry with new token
        const token = authService.getToken()
        if (token) {
          const updatedOptions = this.updateAuthHeader(config.options, token)
          fetch(config.url, updatedOptions).then(resolve).catch(reject)
        } else {
          reject(new Error('No token available after refresh'))
        }
      }
    })
    
    this.failedQueue = []
  }

  /**
   * Update Authorization header with new token
   */
  private updateAuthHeader(options: RequestInit, token: string): RequestInit {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }

  /**
   * Check if request has Authorization header
   */
  private hasAuthHeader(options: RequestInit): boolean {
    const headers = options.headers as Record<string, string> || {}
    return 'Authorization' in headers || 'authorization' in headers
  }
}

// Export singleton instance
export const apiInterceptor = new ApiInterceptor()

/**
 * Enhanced fetch function that automatically handles token refresh
 * Use this instead of regular fetch for authenticated requests
 */
export const fetchWithAuth = apiInterceptor.fetch.bind(apiInterceptor)