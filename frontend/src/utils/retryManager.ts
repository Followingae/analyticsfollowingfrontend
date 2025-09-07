// utils/retryManager.ts
/**
 * Comprehensive retry manager with exponential backoff
 * Handles various error types and implements intelligent retry strategies
 */

export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryCondition?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number, nextDelay: number) => void
}

export interface RetryStats {
  attempts: number
  totalDelay: number
  lastError?: any
  succeeded: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
}

/**
 * Sleep utility with precise timing
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error should trigger retry
 */
const shouldRetry = (error: any, attempt: number, config: RetryConfig): boolean => {
  // Custom retry condition takes precedence
  if (config.retryCondition) {
    return config.retryCondition(error, attempt)
  }

  // Don't retry if max attempts reached
  if (attempt >= config.maxRetries) {
    return false
  }

  // Network errors should be retried
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return true
  }

  // HTTP errors
  if (error?.status || error?.response?.status) {
    const status = error.status || error.response.status
    
    // Retry on server errors and rate limits
    if (status >= 500 || status === 429) {
      return true
    }
    
    // Don't retry client errors (400-499, except 429)
    if (status >= 400 && status < 500) {
      return false
    }
  }

  // Timeout errors should be retried
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return true
  }

  // Default: retry unknown errors
  return true
}

/**
 * Calculate next retry delay with jitter
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  )
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.floor(exponentialDelay + jitter)
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const stats: RetryStats = {
    attempts: 0,
    totalDelay: 0,
    succeeded: false
  }

  let lastError: any

  for (let attempt = 1; attempt <= fullConfig.maxRetries + 1; attempt++) {
    stats.attempts = attempt

    try {
      console.log(`🔄 Attempt ${attempt}/${fullConfig.maxRetries + 1}`)
      
      const result = await fn()
      stats.succeeded = true
      
      if (attempt > 1) {
        console.log(`✅ Succeeded after ${attempt} attempts (total delay: ${stats.totalDelay}ms)`)
      }
      
      return result
      
    } catch (error) {
      lastError = error
      stats.lastError = error
      
      console.log(`❌ Attempt ${attempt} failed:`, error)
      
      // Check if we should retry
      if (!shouldRetry(error, attempt, fullConfig)) {
        console.log(`🛑 Not retrying: ${error.message || error}`)
        break
      }
      
      // Don't sleep after the last attempt
      if (attempt <= fullConfig.maxRetries) {
        const delay = calculateDelay(attempt, fullConfig)
        stats.totalDelay += delay
        
        console.log(`⏳ Retrying in ${delay}ms...`)
        
        // Call retry callback if provided
        if (fullConfig.onRetry) {
          fullConfig.onRetry(error, attempt, delay)
        }
        
        await sleep(delay)
      }
    }
  }

  // All retries exhausted
  console.error(`💥 All ${fullConfig.maxRetries + 1} attempts failed. Total delay: ${stats.totalDelay}ms`)
  throw lastError
}

/**
 * Retry manager class for managing multiple retry instances
 */
export class RetryManager {
  private activeRetries = new Map<string, AbortController>()
  private retryStats = new Map<string, RetryStats>()

  /**
   * Execute function with retry and cancellation support
   */
  async executeWithRetry<T>(
    id: string,
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    // Cancel existing retry if running
    this.cancel(id)

    const controller = new AbortController()
    this.activeRetries.set(id, controller)

    try {
      const result = await withRetry(async () => {
        // Check if cancelled
        if (controller.signal.aborted) {
          throw new Error('Retry cancelled')
        }
        return await fn()
      }, {
        ...config,
        onRetry: (error, attempt, delay) => {
          // Update stats
          const stats = this.retryStats.get(id) || {
            attempts: 0,
            totalDelay: 0,
            succeeded: false
          }
          
          stats.attempts = attempt
          stats.totalDelay += delay
          stats.lastError = error
          this.retryStats.set(id, stats)

          // Call original callback
          config.onRetry?.(error, attempt, delay)
        }
      })

      // Mark as succeeded
      const stats = this.retryStats.get(id)
      if (stats) {
        stats.succeeded = true
      }

      return result

    } finally {
      this.activeRetries.delete(id)
    }
  }

  /**
   * Cancel active retry
   */
  cancel(id: string): void {
    const controller = this.activeRetries.get(id)
    if (controller) {
      controller.abort()
      this.activeRetries.delete(id)
      console.log(`🛑 Cancelled retry: ${id}`)
    }
  }

  /**
   * Cancel all active retries
   */
  cancelAll(): void {
    for (const [id, controller] of this.activeRetries) {
      controller.abort()
    }
    this.activeRetries.clear()
    console.log('🛑 Cancelled all retries')
  }

  /**
   * Get retry statistics
   */
  getStats(id?: string): RetryStats | Map<string, RetryStats> {
    if (id) {
      return this.retryStats.get(id) || {
        attempts: 0,
        totalDelay: 0,
        succeeded: false
      }
    }
    return new Map(this.retryStats)
  }

  /**
   * Check if retry is active
   */
  isActive(id: string): boolean {
    return this.activeRetries.has(id)
  }

  /**
   * Get list of active retries
   */
  getActiveRetries(): string[] {
    return Array.from(this.activeRetries.keys())
  }
}

// Singleton instance
export const retryManager = new RetryManager()

// Predefined retry configurations
export const RETRY_CONFIGS = {
  /** For critical API calls that must succeed */
  CRITICAL: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2
  },
  
  /** For standard API calls */
  STANDARD: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 1.5
  },
  
  /** For background/non-critical calls */
  BACKGROUND: {
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 1.2
  },

  /** For authentication calls */
  AUTH: {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Don't retry 401/403 errors (invalid credentials)
      const status = error?.status || error?.response?.status
      return !(status === 401 || status === 403)
    }
  }
} as const