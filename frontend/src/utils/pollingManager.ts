// utils/pollingManager.ts
/**
 * Intelligent polling manager with exponential backoff
 * Prevents aggressive polling that overwhelms the backend
 */

interface PollingConfig {
  /** Initial interval in milliseconds */
  initialInterval: number
  /** Maximum interval in milliseconds */
  maxInterval: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
  /** Maximum number of retries before stopping */
  maxRetries?: number
  /** Whether to reset interval on success */
  resetOnSuccess: boolean
}

interface PollingInstance {
  id: string
  currentInterval: number
  retryCount: number
  timeoutId?: NodeJS.Timeout
  lastSuccess: number
  config: PollingConfig
  callback: () => Promise<boolean> | boolean
  isActive: boolean
}

class PollingManager {
  private instances = new Map<string, PollingInstance>()
  private globalPaused = false
  private destroyed = false

  /**
   * Start intelligent polling with exponential backoff
   */
  startPolling(
    id: string,
    callback: () => Promise<boolean> | boolean,
    config: Partial<PollingConfig> = {}
  ): void {
    // Stop existing instance if running
    this.stopPolling(id)

    const fullConfig: PollingConfig = {
      initialInterval: 30000, // Start with 30 seconds
      maxInterval: 5 * 60 * 1000, // Max 5 minutes
      backoffMultiplier: 1.5,
      maxRetries: 10,
      resetOnSuccess: true,
      ...config
    }

    const instance: PollingInstance = {
      id,
      currentInterval: fullConfig.initialInterval,
      retryCount: 0,
      config: fullConfig,
      callback,
      isActive: true,
      lastSuccess: Date.now()
    }

    this.instances.set(id, instance)
    this.scheduleNext(instance)

  }

  /**
   * Stop polling for specific instance
   */
  stopPolling(id: string): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.isActive = false
      if (instance.timeoutId) {
        clearTimeout(instance.timeoutId)
      }
      this.instances.delete(id)
    }
  }

  /**
   * Pause all polling globally (useful for tab visibility changes)
   */
  pauseAll(): void {
    this.globalPaused = true
    this.instances.forEach(instance => {
      if (instance.timeoutId) {
        clearTimeout(instance.timeoutId)
        instance.timeoutId = undefined
      }
    })
  }

  /**
   * Resume all polling
   */
  resumeAll(): void {
    this.globalPaused = false
    this.instances.forEach(instance => {
      if (instance.isActive) {
        this.scheduleNext(instance)
      }
    })
  }

  /**
   * Update polling interval dynamically
   */
  updateInterval(id: string, newInterval: number): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.currentInterval = Math.min(newInterval, instance.config.maxInterval)
    }
  }

  /**
   * Get status of all polling instances
   */
  getStatus(): Array<{
    id: string
    currentInterval: number
    retryCount: number
    isActive: boolean
    lastSuccess: number
    nextPoll?: number
  }> {
    return Array.from(this.instances.values()).map(instance => ({
      id: instance.id,
      currentInterval: instance.currentInterval,
      retryCount: instance.retryCount,
      isActive: instance.isActive,
      lastSuccess: instance.lastSuccess,
      nextPoll: instance.timeoutId ? Date.now() + instance.currentInterval : undefined
    }))
  }

  private scheduleNext(instance: PollingInstance): void {
    // Clear any existing timeout
    if (instance.timeoutId) {
      clearTimeout(instance.timeoutId)
      instance.timeoutId = undefined
    }

    // Don't schedule if inactive, paused, or destroyed
    if (!instance.isActive || this.globalPaused || this.destroyed) {
      return
    }

    // Check max retries
    if (instance.config.maxRetries && instance.retryCount >= instance.config.maxRetries) {
      console.warn(`⚠️ Max retries exceeded for polling: ${instance.id}`)
      this.stopPolling(instance.id)
      return
    }

    // Use setInterval instead of recursive setTimeout
    instance.timeoutId = setTimeout(() => {
      this.executePollingCycle(instance)
    }, instance.currentInterval)
  }

  private async executePollingCycle(instance: PollingInstance): Promise<void> {
    if (!instance.isActive || this.globalPaused || this.destroyed) {
      return
    }

    try {
      
      const success = await instance.callback()
      
      if (success) {
        // Success - reset interval if configured
        if (instance.config.resetOnSuccess) {
          instance.currentInterval = instance.config.initialInterval
          instance.retryCount = 0
        }
        instance.lastSuccess = Date.now()
      } else {
        // Failed - increase interval with exponential backoff
        instance.retryCount++
        instance.currentInterval = Math.min(
          instance.currentInterval * instance.config.backoffMultiplier,
          instance.config.maxInterval
        )
      }
    } catch (error) {
      console.error(`💥 Polling error: ${instance.id}`, error)
      
      // Increase retry count and backoff interval
      instance.retryCount++
      instance.currentInterval = Math.min(
        instance.currentInterval * instance.config.backoffMultiplier,
        instance.config.maxInterval
      )
    }

    // Schedule next execution only if still active
    if (instance.isActive && !this.globalPaused && !this.destroyed) {
      this.scheduleNext(instance)
    }
  }

  /**
   * Cleanup all polling instances
   */
  cleanup(): void {
    this.destroyed = true
    this.instances.forEach(instance => {
      instance.isActive = false
      if (instance.timeoutId) {
        clearTimeout(instance.timeoutId)
      }
    })
    this.instances.clear()
  }
}

// Singleton instance
export const pollingManager = new PollingManager()

// Auto-pause/resume based on document visibility
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pollingManager.pauseAll()
    } else {
      pollingManager.resumeAll()
    }
  })
}

// Standard polling configurations - MUCH MORE REASONABLE
export const POLLING_CONFIGS = {
  /** For credit balance updates - very infrequent, user-driven */
  CREDITS: {
    initialInterval: 30 * 60 * 1000, // 30 minutes (was 5 minutes - ridiculous!)
    maxInterval: 60 * 60 * 1000, // 1 hour max
    backoffMultiplier: 1.2,
    resetOnSuccess: true
  },
  
  /** For setup checklist - only when user is actively using the app */
  SETUP_STATUS: {
    initialInterval: 15 * 60 * 1000, // 15 minutes (was 2 minutes - way too aggressive!)
    maxInterval: 30 * 60 * 1000, // 30 minutes max
    backoffMultiplier: 1.3,
    resetOnSuccess: true
  },
  
  /** For health monitoring - infrequent */
  HEALTH_CHECK: {
    initialInterval: 10 * 60 * 1000, // 10 minutes
    maxInterval: 30 * 60 * 1000, // 30 minutes
    backoffMultiplier: 1.1,
    resetOnSuccess: false
  }
} as const