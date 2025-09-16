// utils/requestSequencer.ts
import { API_CONFIG } from '@/config/api'

interface QueuedRequest<T> {
  id: string
  executor: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
  priority: number
}

class RequestSequencer {
  private queue: QueuedRequest<any>[] = []
  private activeRequests = new Set<string>()
  private processing = false

  private readonly maxConcurrent = API_CONFIG.MAX_CONCURRENT_REQUESTS
  private readonly requestDelay = API_CONFIG.REQUEST_DELAY

  /**
   * Add a request to the queue with optional priority
   * Higher priority = processed first (default: 0)
   */
  async execute<T>(
    id: string,
    executor: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    // If request with same ID is already active, wait for it
    if (this.activeRequests.has(id)) {
      console.log(`⏳ Request ${id} already in progress, waiting...`)
      return new Promise((resolve, reject) => {
        const checkCompletion = () => {
          if (!this.activeRequests.has(id)) {
            // Try to execute immediately since the previous request completed
            this.execute(id, executor, priority).then(resolve).catch(reject)
          } else {
            setTimeout(checkCompletion, 100)
          }
        }
        checkCompletion()
      })
    }

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id,
        executor,
        resolve,
        reject,
        timestamp: Date.now(),
        priority
      }

      // Insert into queue based on priority
      const insertIndex = this.queue.findIndex(req => req.priority < priority)
      if (insertIndex === -1) {
        this.queue.push(queuedRequest)
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest)
      }

      console.log(`📋 Queued request ${id} (priority: ${priority}, queue size: ${this.queue.length})`)

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0 && this.activeRequests.size < this.maxConcurrent) {
      const request = this.queue.shift()
      if (!request) break

      // Skip if request is too old (30 seconds)
      if (Date.now() - request.timestamp > 30000) {
        request.reject(new Error('Request timeout - too long in queue'))
        continue
      }

      this.activeRequests.add(request.id)
      console.log(`🚀 Executing request ${request.id} (active: ${this.activeRequests.size}/${this.maxConcurrent})`)

      // Execute request asynchronously
      this.executeRequest(request).finally(() => {
        this.activeRequests.delete(request.id)
        console.log(`✅ Completed request ${request.id} (active: ${this.activeRequests.size}/${this.maxConcurrent})`)

        // Continue processing queue
        if (this.queue.length > 0) {
          setTimeout(() => this.processQueue(), this.requestDelay)
        }
      })

      // Add delay between starting requests
      if (this.requestDelay > 0 && this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay))
      }
    }

    this.processing = false
  }

  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      const result = await request.executor()
      request.resolve(result)
    } catch (error) {
      console.error(`❌ Request ${request.id} failed:`, error)
      request.reject(error)
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift()
      if (request) {
        request.reject(new Error('Request cancelled'))
      }
    }
    console.log('🚫 Cancelled all pending requests')
  }

  /**
   * Cancel specific request by ID
   */
  cancel(id: string): boolean {
    const index = this.queue.findIndex(req => req.id === id)
    if (index !== -1) {
      const request = this.queue.splice(index, 1)[0]
      request.reject(new Error('Request cancelled'))
      console.log(`🚫 Cancelled request ${id}`)
      return true
    }
    return false
  }

  /**
   * Get queue status for monitoring
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
      maxConcurrent: this.maxConcurrent,
      processing: this.processing,
      oldestRequestAge: this.queue.length > 0 ? Date.now() - Math.min(...this.queue.map(r => r.timestamp)) : 0,
      activeRequestIds: Array.from(this.activeRequests),
      queuedRequestIds: this.queue.map(r => r.id)
    }
  }
}

export const requestSequencer = new RequestSequencer()

// High-level wrapper for common API calls
export const sequencedFetch = async <T>(
  id: string,
  fetcher: () => Promise<T>,
  priority: number = 0
): Promise<T> => {
  return requestSequencer.execute(id, fetcher, priority)
}

// Priority constants for common request types
export const REQUEST_PRIORITIES = {
  CRITICAL: 100,     // Auth, dashboard stats
  HIGH: 50,          // Creator searches, analytics
  NORMAL: 0,         // General API calls
  LOW: -50,          // Background data, non-critical
  BACKGROUND: -100   // Cleanup, maintenance calls
} as const