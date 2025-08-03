/**
 * Centralized API Error Handling
 * Based on FRONTEND_UPDATE_GUIDE.md backend v2.0.1 error codes
 */

export interface ApiError {
  status: number
  message: string
  code?: string
  details?: any
}

export class ApiErrorHandler {
  static handleError(response: Response, error?: any): ApiError {
    const status = response?.status || (error?.status ? parseInt(error.status) : 500)
    
    switch (status) {
      case 401:
        return {
          status: 401,
          message: 'Authentication required. Please log in again.',
          code: 'UNAUTHORIZED'
        }
      
      case 403:
        return {
          status: 403,
          message: 'Access denied. Insufficient permissions.',
          code: 'FORBIDDEN'
        }
      
      case 404:
        return {
          status: 404,
          message: 'Resource not found. Please check the URL and try again.',
          code: 'NOT_FOUND'
        }
      
      case 429:
        return {
          status: 429,
          message: 'Rate limit exceeded. Please wait before trying again.',
          code: 'RATE_LIMITED'
        }
      
      case 503:
        return {
          status: 503,
          message: 'Service temporarily unavailable. Please try again in a few minutes.',
          code: 'SERVICE_UNAVAILABLE'
        }
      
      case 500:
        return {
          status: 500,
          message: 'Internal server error. Please try again later.',
          code: 'INTERNAL_ERROR'
        }
      
      case 422:
        return {
          status: 422,
          message: 'Invalid request format. Please check your input.',
          code: 'VALIDATION_ERROR'
        }
      
      default:
        return {
          status: status,
          message: error?.message || 'An unexpected error occurred.',
          code: 'UNKNOWN_ERROR'
        }
    }
  }

  static handleAuthenticationError(): void {
    // Clear tokens and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      window.location.href = '/auth/login'
    }
  }

  static getProfileErrorMessage(error: ApiError, endpoint: string): string {
    if (endpoint.includes('/analytics') && error.status === 404) {
      return 'Profile not analyzed yet. Click "Analyze Profile" to get detailed insights.'
    }
    
    if (error.status === 503) {
      return 'Instagram data service temporarily unavailable. Please try again in a few minutes.'
    }
    
    return error.message || 'An unexpected error occurred.'
  }

  static shouldRetry(error: ApiError): boolean {
    // Retry on temporary errors but not on client errors
    return error.status >= 500 || error.status === 503 || error.status === 429
  }

  static getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount), 10000)
  }
}

// Timeout handling utilities
export class TimeoutHandler {
  static createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout - analysis may take up to ${Math.floor(timeoutMs / 1000)} seconds`))
      }, timeoutMs)
    })
  }

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      TimeoutHandler.createTimeoutPromise(timeoutMs)
    ])
  }
}

// Enhanced fetch with error handling and timeout
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  timeout: number = 35000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const apiError = ApiErrorHandler.handleError(response)
      
      if (apiError.status === 401) {
        ApiErrorHandler.handleAuthenticationError()
      }
      
      throw new Error(apiError.message)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms. The server may be taking too long to respond.`)
      } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your internet connection.')
      }
    }
    
    throw error
  }
}