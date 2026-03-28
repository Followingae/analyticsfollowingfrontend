// utils/safeMode.ts
/**
 * EMERGENCY SAFE MODE - Disables memory-intensive features
 * Use this to prevent browser crashes while we fix the optimizations
 */

export const SAFE_MODE_CONFIG = {
  // Disable aggressive polling completely
  DISABLE_POLLING: true,
  
  // Disable advanced caching (use simple React Query only)  
  DISABLE_ADVANCED_CACHING: true,
  
  // Disable performance monitoring to prevent memory leaks
  DISABLE_PERFORMANCE_MONITORING: true,
  
  // Disable batch processing (use individual requests)
  DISABLE_BATCHING: true,
  
  // Use minimal retry attempts
  MAX_RETRY_ATTEMPTS: 1,
  
  // Shorter cache TTLs
  CACHE_TTL: 30 * 1000, // 30 seconds instead of minutes
  
  // Immediate cleanup intervals
  CLEANUP_INTERVAL: 30 * 1000, // 30 seconds
}

/**
 * Check if we're in safe mode
 */
export const isSafeMode = (): boolean => {
  // Check for safe mode flag
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const safeMode = urlParams.get('safe') || localStorage.getItem('safe_mode')
    return safeMode === 'true' || safeMode === '1'
  }
  
  // Default to safe mode if memory issues detected
  return true // TEMPORARILY ENABLED
}

/**
 * Enable safe mode
 */
export const enableSafeMode = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safe_mode', 'true')
  }
}

/**
 * Disable safe mode
 */
export const disableSafeMode = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('safe_mode')
  }
}

/**
 * Safe wrapper for polling operations
 */
export const safePolling = {
  start: (id: string, callback: () => Promise<boolean>, config?: any) => {
    if (SAFE_MODE_CONFIG.DISABLE_POLLING || isSafeMode()) {
      return
    }
    // Original polling logic here
  },
  
  stop: (id: string) => {
    // Always allow stopping
  }
}

/**
 * Safe wrapper for caching operations
 */
export const safeCache = {
  get: async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    if (SAFE_MODE_CONFIG.DISABLE_ADVANCED_CACHING || isSafeMode()) {
      // Direct fetch without caching
      return fetcher()
    }
    // Original cache logic here
    return fetcher()
  },
  
  clear: () => {
  }
}

/**
 * Log safe mode status
 */
export const logSafeModeStatus = (): void => {
  // Safe mode status check - no logging in production
}