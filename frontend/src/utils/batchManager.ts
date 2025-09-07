// utils/batchManager.ts
/**
 * Batched API call manager to optimize initial page loads
 * Combines multiple API calls into efficient batches
 */

interface BatchRequest<T = any> {
  id: string
  fetcher: () => Promise<T>
  priority: 'high' | 'medium' | 'low'
  timeout?: number
  retryConfig?: {
    maxRetries: number
    delay: number
  }
}

interface BatchResult<T = any> {
  id: string
  success: boolean
  data?: T
  error?: any
  duration: number
}

interface BatchStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalDuration: number
  batchStartTime: number
  batchEndTime: number
}

export class BatchManager {
  private pendingBatches = new Map<string, BatchRequest[]>()
  private activeBatches = new Map<string, Promise<BatchResult[]>>()
  private batchStats = new Map<string, BatchStats>()

  /**
   * Add request to batch queue
   */
  addToBatch<T>(
    batchId: string,
    request: BatchRequest<T>
  ): void {
    if (!this.pendingBatches.has(batchId)) {
      this.pendingBatches.set(batchId, [])
    }
    
    this.pendingBatches.get(batchId)!.push(request)
    console.log(`📦 Added ${request.id} to batch ${batchId} (priority: ${request.priority})`)
  }

  /**
   * Execute all requests in a batch with intelligent parallelization
   */
  async executeBatch(
    batchId: string,
    options: {
      maxConcurrency?: number
      timeout?: number
      priorityExecution?: boolean
    } = {}
  ): Promise<BatchResult[]> {
    // Return existing batch if already running
    if (this.activeBatches.has(batchId)) {
      console.log(`⏳ Batch ${batchId} already running, joining...`)
      return this.activeBatches.get(batchId)!
    }

    const requests = this.pendingBatches.get(batchId) || []
    if (requests.length === 0) {
      console.log(`📦 Batch ${batchId} is empty`)
      return []
    }

    console.log(`🚀 Executing batch ${batchId} with ${requests.length} requests`)

    const {
      maxConcurrency = 4,
      timeout = 30000,
      priorityExecution = true
    } = options

    // Initialize stats
    const stats: BatchStats = {
      totalRequests: requests.length,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      batchStartTime: Date.now(),
      batchEndTime: 0
    }
    this.batchStats.set(batchId, stats)

    // Sort by priority if enabled
    if (priorityExecution) {
      requests.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    }

    // Execute batch
    const batchPromise = this.executeConcurrentRequests(
      requests,
      maxConcurrency,
      timeout,
      stats
    )

    this.activeBatches.set(batchId, batchPromise)

    try {
      const results = await batchPromise
      
      // Update final stats
      stats.batchEndTime = Date.now()
      stats.totalDuration = stats.batchEndTime - stats.batchStartTime

      console.log(`✅ Batch ${batchId} completed in ${stats.totalDuration}ms (${stats.successfulRequests}/${stats.totalRequests} successful)`)
      
      return results

    } finally {
      this.activeBatches.delete(batchId)
      this.pendingBatches.delete(batchId)
    }
  }

  /**
   * Execute requests with controlled concurrency
   */
  private async executeConcurrentRequests(
    requests: BatchRequest[],
    maxConcurrency: number,
    globalTimeout: number,
    stats: BatchStats
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = []
    const executing: Promise<void>[] = []
    let requestIndex = 0

    const executeRequest = async (request: BatchRequest): Promise<void> => {
      const startTime = Date.now()
      const requestTimeout = request.timeout || globalTimeout

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), requestTimeout)
        })

        // Execute with timeout
        const data = await Promise.race([
          request.fetcher(),
          timeoutPromise
        ])

        const duration = Date.now() - startTime
        
        results.push({
          id: request.id,
          success: true,
          data,
          duration
        })

        stats.successfulRequests++
        console.log(`✅ ${request.id} completed in ${duration}ms`)

      } catch (error) {
        const duration = Date.now() - startTime
        
        results.push({
          id: request.id,
          success: false,
          error,
          duration
        })

        stats.failedRequests++
        console.error(`❌ ${request.id} failed after ${duration}ms:`, error)

        // Retry if configured
        if (request.retryConfig && request.retryConfig.maxRetries > 0) {
          console.log(`🔄 Retrying ${request.id}...`)
          // Simple retry implementation
          try {
            await new Promise(resolve => setTimeout(resolve, request.retryConfig!.delay))
            const retryData = await request.fetcher()
            
            // Update result to success
            const resultIndex = results.findIndex(r => r.id === request.id)
            if (resultIndex >= 0) {
              results[resultIndex] = {
                id: request.id,
                success: true,
                data: retryData,
                duration: Date.now() - startTime
              }
              stats.successfulRequests++
              stats.failedRequests--
            }
          } catch (retryError) {
            console.error(`❌ Retry failed for ${request.id}:`, retryError)
          }
        }
      }
    }

    // Execute requests with concurrency control
    while (requestIndex < requests.length || executing.length > 0) {
      // Start new requests up to concurrency limit
      while (executing.length < maxConcurrency && requestIndex < requests.length) {
        const request = requests[requestIndex++]
        const promise = executeRequest(request)
        executing.push(promise)
      }

      // Wait for at least one request to complete
      if (executing.length > 0) {
        await Promise.race(executing.map(p => p.catch(() => {}))) // Ignore errors here
        
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          const promise = executing[i]
          if (await Promise.race([promise.then(() => true), Promise.resolve(false)])) {
            executing.splice(i, 1)
          }
        }
      }
    }

    return results
  }

  /**
   * Get batch statistics
   */
  getBatchStats(batchId: string): BatchStats | undefined {
    return this.batchStats.get(batchId)
  }

  /**
   * Check if batch is currently executing
   */
  isBatchActive(batchId: string): boolean {
    return this.activeBatches.has(batchId)
  }

  /**
   * Cancel active batch
   */
  cancelBatch(batchId: string): void {
    this.activeBatches.delete(batchId)
    this.pendingBatches.delete(batchId)
    console.log(`🛑 Cancelled batch: ${batchId}`)
  }

  /**
   * Clear all pending batches
   */
  clearAll(): void {
    this.pendingBatches.clear()
    this.activeBatches.clear()
    console.log('🧹 Cleared all batches')
  }

  /**
   * Get overall performance stats
   */
  getOverallStats(): {
    totalBatches: number
    averageDuration: number
    averageSuccessRate: number
    stats: Array<{ batchId: string; stats: BatchStats }>
  } {
    const allStats = Array.from(this.batchStats.entries())
    
    if (allStats.length === 0) {
      return {
        totalBatches: 0,
        averageDuration: 0,
        averageSuccessRate: 0,
        stats: []
      }
    }

    const totalDuration = allStats.reduce((sum, [, stats]) => sum + stats.totalDuration, 0)
    const totalRequests = allStats.reduce((sum, [, stats]) => sum + stats.totalRequests, 0)
    const totalSuccessful = allStats.reduce((sum, [, stats]) => sum + stats.successfulRequests, 0)

    return {
      totalBatches: allStats.length,
      averageDuration: totalDuration / allStats.length,
      averageSuccessRate: totalSuccessful / totalRequests,
      stats: allStats.map(([batchId, stats]) => ({ batchId, stats }))
    }
  }
}

// Singleton instance
export const batchManager = new BatchManager()

// Predefined batch configurations
export const BATCH_CONFIGS = {
  /** Initial dashboard load */
  DASHBOARD_INIT: {
    maxConcurrency: 3,
    timeout: 10000,
    priorityExecution: true
  },
  
  /** User profile and settings */
  USER_INIT: {
    maxConcurrency: 2,
    timeout: 8000,
    priorityExecution: false
  },
  
  /** Background data refresh */
  BACKGROUND_REFRESH: {
    maxConcurrency: 2,
    timeout: 15000,
    priorityExecution: false
  }
} as const

/**
 * Helper function to create dashboard initialization batch
 */
export const createDashboardBatch = (
  userStore: any,
  fetchFunctions: {
    fetchDashboard: () => Promise<any>
    fetchTeams: () => Promise<any>
    fetchProfiles: () => Promise<any>
    fetchCampaigns: () => Promise<any>
  }
): void => {
  // Clear any existing dashboard batch
  batchManager.cancelBatch('dashboard-init')

  // Add high priority requests
  batchManager.addToBatch('dashboard-init', {
    id: 'dashboard-data',
    fetcher: fetchFunctions.fetchDashboard,
    priority: 'high',
    timeout: 8000
  })

  // Add medium priority requests
  batchManager.addToBatch('dashboard-init', {
    id: 'teams-data',
    fetcher: fetchFunctions.fetchTeams,
    priority: 'medium',
    timeout: 10000
  })

  batchManager.addToBatch('dashboard-init', {
    id: 'profiles-data',
    fetcher: fetchFunctions.fetchProfiles,
    priority: 'medium',
    timeout: 10000
  })

  // Add low priority requests
  batchManager.addToBatch('dashboard-init', {
    id: 'campaigns-data',
    fetcher: fetchFunctions.fetchCampaigns,
    priority: 'low',
    timeout: 12000
  })
}