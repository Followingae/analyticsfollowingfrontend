// utils/performanceMonitor.ts
/**
 * Performance monitoring utility to track the impact of optimizations
 * Monitors API calls, cache performance, and overall frontend metrics
 */

interface PerformanceMetric {
  name: string
  timestamp: number
  duration: number
  success: boolean
  details?: any
}

interface ApiMetric extends PerformanceMetric {
  url: string
  method: string
  status?: number
  fromCache?: boolean
  retryAttempts?: number
}

interface CacheMetric {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  averageResponseTime: number
}

interface SessionMetric {
  sessionStart: number
  lastActivity: number
  tokenRefreshCount: number
  authErrors: number
}

class PerformanceMonitor {
  private enabled = false // DISABLED BY DEFAULT
  private metrics: PerformanceMetric[] = []
  private apiMetrics: ApiMetric[] = []
  private readonly maxMetrics = 10 // Minimal array size
  private cleanupTimer?: NodeJS.Timeout
  
  // Performance thresholds
  private readonly thresholds = {
    slowApiCall: 3000, // 3 seconds
    tooManyRequests: 50, // per minute
    lowCacheHitRate: 0.7 // 70%
  }

  /**
   * Track API call performance (DISABLED)
   */
  trackApiCall(metric: Omit<ApiMetric, 'timestamp'>): void {
    if (!this.enabled) return
    
    // Only keep last few metrics to prevent memory bloat
    if (this.apiMetrics.length >= this.maxMetrics) {
      this.apiMetrics.shift() // Remove oldest
      this.metrics.shift()
    }

    const apiMetric: ApiMetric = {
      ...metric,
      timestamp: Date.now()
    }

    this.apiMetrics.push(apiMetric)
    this.metrics.push(apiMetric)
  }

  /**
   * Track general performance metric (DISABLED)
   */
  trackMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.enabled) return
    
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics.shift()
    }

    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    overview: {
      totalApiCalls: number
      averageResponseTime: number
      successRate: number
      cacheHitRate: number
    }
    apiCalls: {
      total: number
      successful: number
      failed: number
      averageTime: number
      slowCalls: number
      fromCache: number
    }
    topEndpoints: Array<{
      url: string
      callCount: number
      averageTime: number
      successRate: number
      cacheHitRate: number
    }>
    timeRange: {
      start: Date
      end: Date
      duration: number
    }
    warnings: string[]
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Filter recent metrics
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp > oneHourAgo)
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo)

    if (recentApiMetrics.length === 0) {
      return this.getEmptyReport()
    }

    // Calculate overview stats
    const totalApiCalls = recentApiMetrics.length
    const successfulCalls = recentApiMetrics.filter(m => m.success).length
    const cachedCalls = recentApiMetrics.filter(m => m.fromCache).length
    const totalResponseTime = recentApiMetrics.reduce((sum, m) => sum + m.duration, 0)
    const slowCalls = recentApiMetrics.filter(m => m.duration > this.thresholds.slowApiCall).length

    const averageResponseTime = totalResponseTime / totalApiCalls
    const successRate = successfulCalls / totalApiCalls
    const cacheHitRate = cachedCalls / totalApiCalls

    // Group by endpoint
    const endpointStats = this.groupByEndpoint(recentApiMetrics)

    // Generate warnings
    const warnings = this.generateWarnings(recentApiMetrics, {
      averageResponseTime,
      successRate,
      cacheHitRate
    })

    return {
      overview: {
        totalApiCalls,
        averageResponseTime: Math.round(averageResponseTime),
        successRate: Math.round(successRate * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      },
      apiCalls: {
        total: totalApiCalls,
        successful: successfulCalls,
        failed: totalApiCalls - successfulCalls,
        averageTime: Math.round(averageResponseTime),
        slowCalls,
        fromCache: cachedCalls
      },
      topEndpoints: endpointStats.slice(0, 10),
      timeRange: {
        start: new Date(Math.min(...recentApiMetrics.map(m => m.timestamp))),
        end: new Date(Math.max(...recentApiMetrics.map(m => m.timestamp))),
        duration: now - oneHourAgo
      },
      warnings
    }
  }

  /**
   * Get cache performance statistics
   */
  getCacheStats(): CacheMetric {
    const { requestCache } = require('./requestCache')
    return requestCache.getStats()
  }

  /**
   * Get polling manager statistics
   */
  getPollingStats(): any {
    try {
      const { pollingManager } = require('./pollingManager')
      return pollingManager.getStatus()
    } catch {
      return { error: 'Polling manager not available' }
    }
  }

  /**
   * Get batch manager statistics  
   */
  getBatchStats(): any {
    try {
      const { batchManager } = require('./batchManager')
      return batchManager.getOverallStats()
    } catch {
      return { error: 'Batch manager not available' }
    }
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    const report = this.getPerformanceReport()
    
    console.group('🚀 Frontend Performance Report')
    console.log(`📊 API Calls: ${report.apiCalls.total} (${report.overview.successRate * 100}% success)`)
    console.log(`⚡ Average Response: ${report.overview.averageResponseTime}ms`)
    console.log(`🎯 Cache Hit Rate: ${report.overview.cacheHitRate * 100}%`)
    console.log(`⚠️  Slow Calls: ${report.apiCalls.slowCalls}`)
    console.log(`💾 From Cache: ${report.apiCalls.fromCache}`)
    
    if (report.warnings.length > 0) {
      console.group('⚠️ Performance Warnings')
      report.warnings.forEach(warning => console.warn(warning))
      console.groupEnd()
    }
    
    console.group('📈 Top Endpoints')
    report.topEndpoints.slice(0, 5).forEach(endpoint => {
      console.log(`${endpoint.url}: ${endpoint.callCount} calls, ${endpoint.averageTime}ms avg`)
    })
    console.groupEnd()
    
    console.groupEnd()
  }

  /**
   * Export performance data
   */
  exportData(): {
    metrics: PerformanceMetric[]
    apiMetrics: ApiMetric[]
    report: ReturnType<typeof this.getPerformanceReport>
    timestamp: number
  } {
    return {
      metrics: this.metrics.slice(),
      apiMetrics: this.apiMetrics.slice(),
      report: this.getPerformanceReport(),
      timestamp: Date.now()
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.length = 0
    this.apiMetrics.length = 0
  }

  // Private helper methods
  
  private getEmptyReport() {
    return {
      overview: {
        totalApiCalls: 0,
        averageResponseTime: 0,
        successRate: 0,
        cacheHitRate: 0
      },
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        slowCalls: 0,
        fromCache: 0
      },
      topEndpoints: [],
      timeRange: {
        start: new Date(),
        end: new Date(),
        duration: 0
      },
      warnings: []
    }
  }

  private groupByEndpoint(metrics: ApiMetric[]) {
    const groups = new Map<string, ApiMetric[]>()
    
    metrics.forEach(metric => {
      const endpoint = this.normalizeEndpoint(metric.url)
      if (!groups.has(endpoint)) {
        groups.set(endpoint, [])
      }
      groups.get(endpoint)!.push(metric)
    })

    return Array.from(groups.entries()).map(([url, metrics]) => {
      const callCount = metrics.length
      const successfulCalls = metrics.filter(m => m.success).length
      const cachedCalls = metrics.filter(m => m.fromCache).length
      const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0)

      return {
        url,
        callCount,
        averageTime: Math.round(totalTime / callCount),
        successRate: Math.round((successfulCalls / callCount) * 100) / 100,
        cacheHitRate: Math.round((cachedCalls / callCount) * 100) / 100
      }
    }).sort((a, b) => b.callCount - a.callCount)
  }

  private normalizeEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  private checkPerformanceThresholds(metric: ApiMetric): void {
    if (metric.duration > this.thresholds.slowApiCall) {
      console.warn(`🐌 Slow API call: ${metric.url} took ${metric.duration}ms`)
    }

    // Check request frequency
    const recentCalls = this.apiMetrics.filter(
      m => m.url === metric.url && Date.now() - m.timestamp < 60000
    ).length

    if (recentCalls > this.thresholds.tooManyRequests) {
      console.warn(`🔥 Too many requests to ${metric.url}: ${recentCalls} in last minute`)
    }
  }

  private generateWarnings(metrics: ApiMetric[], stats: {
    averageResponseTime: number
    successRate: number
    cacheHitRate: number
  }): string[] {
    const warnings: string[] = []

    if (stats.averageResponseTime > this.thresholds.slowApiCall) {
      warnings.push(`Average response time is slow: ${stats.averageResponseTime}ms`)
    }

    if (stats.successRate < 0.9) {
      warnings.push(`Low success rate: ${Math.round(stats.successRate * 100)}%`)
    }

    if (stats.cacheHitRate < this.thresholds.lowCacheHitRate) {
      warnings.push(`Low cache hit rate: ${Math.round(stats.cacheHitRate * 100)}%`)
    }

    const failedCalls = metrics.filter(m => !m.success)
    if (failedCalls.length > 5) {
      warnings.push(`High number of failed calls: ${failedCalls.length}`)
    }

    return warnings
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Auto-logging for development (DISABLED to prevent memory leaks)
// if (process.env.NODE_ENV === 'development') {
//   // Log performance summary every 5 minutes
//   setInterval(() => {
//     performanceMonitor.logPerformanceSummary()
//   }, 5 * 60 * 1000)
// }

// Export types
export type { PerformanceMetric, ApiMetric, CacheMetric }