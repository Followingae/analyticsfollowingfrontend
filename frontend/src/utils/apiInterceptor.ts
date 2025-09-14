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

      throw new Error('No authentication token available')
    }

    // Add token to request if not already present
    if (!this.hasAuthHeader(options)) {
      options = this.updateAuthHeader(options, tokenResult.token)

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
        console.log('⚠️  API Interceptor: 403 Forbidden received, checking if auth-related')
        
        // Be VERY conservative - only logout if it's explicitly a token issue
        if (responseText.includes('token expired') || responseText.includes('invalid token') || responseText.includes('authentication failed')) {
          console.log('🚪 API Interceptor: 403 is auth-related, logging out')
          authService.logout()
          throw new Error('Authentication expired. Please log in again.')
        } else {
          console.log('⚠️  API Interceptor: 403 is permission-related, not auth issue')
          // Don't logout for general permission issues, let the calling code handle it
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
      console.log('🔄 API Interceptor: Attempting token refresh for 401 error')
      
      const refreshResult = await authService.refreshToken()
      
      if (refreshResult.success && refreshResult.access_token) {
        console.log('✅ API Interceptor: Token refresh successful')
        
        // Process failed queue with new token
        this.processQueue(null)
        
        // Retry original request with new token
        const updatedOptions = this.updateAuthHeader(config.options, refreshResult.access_token)
        return fetch(config.url, updatedOptions)
      } else {
        console.log('❌ API Interceptor: Token refresh failed, but NOT forcing logout immediately')
        
        // CRITICAL FIX: Don't logout immediately on refresh failure
        // This could be a temporary network issue or server problem
        this.processQueue(new Error('Token refresh failed'))
        
        // Instead of logout, throw error to let calling code handle it
        throw new Error('Authentication token expired. Please refresh the page or log in again.')
      }
    } catch (error) {
      console.log('❌ API Interceptor: Exception during token refresh:', error)
      
      this.processQueue(error as Error)
      
      // CRITICAL FIX: Only logout if this is definitely an auth failure
      // Check if the error indicates a permanent auth failure vs temporary network issue
      const errorMessage = error instanceof Error ? error.message : ''
      const isPermanentAuthFailure = errorMessage.includes('invalid_grant') || 
                                    errorMessage.includes('invalid_token') ||
                                    errorMessage.includes('unauthorized')
      
      if (isPermanentAuthFailure && authService.isAuthenticated()) {
        console.log('🚪 API Interceptor: Permanent auth failure detected, logging out')
        authService.logout()
      } else {
        console.log('⚠️  API Interceptor: Temporary error, not logging out')
      }
      
      throw new Error('Authentication failed. Please refresh the page or log in again.')
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