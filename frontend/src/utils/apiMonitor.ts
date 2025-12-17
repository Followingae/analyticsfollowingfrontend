// utils/apiMonitor.ts
interface APICall {
  url: string
  method: string
  timestamp: number
  duration?: number
  status?: number
  error?: string
}

class APIMonitor {
  private calls: APICall[] = []
  private isEnabled = process.env.NODE_ENV === 'development'

  logCall(url: string, method: string, startTime: number, response?: Response, error?: Error) {
    if (!this.isEnabled) return

    const call: APICall = {
      url,
      method,
      timestamp: startTime,
      duration: Date.now() - startTime,
      status: response?.status,
      error: error?.message,
    }

    this.calls.push(call)

    // Keep only last 100 calls
    if (this.calls.length > 100) {
      this.calls = this.calls.slice(-100)
    }

    // Log duplicate calls
    this.detectDuplicates(call)
  }

  private detectDuplicates(newCall: APICall) {
    const recentCalls = this.calls.filter(call =>
      call.url === newCall.url &&
      call.method === newCall.method &&
      newCall.timestamp - call.timestamp < 5000 // Within 5 seconds
    )

    if (recentCalls.length > 1) {
      console.warn(`🚨 DUPLICATE API CALL DETECTED:`, {
        url: newCall.url,
        method: newCall.method,
        count: recentCalls.length,
        timestamps: recentCalls.map(c => new Date(c.timestamp).toISOString()),
        durations: recentCalls.map(c => c.duration),
      })
    }
  }

  getStats() {
    const now = Date.now()
    const last5Minutes = this.calls.filter(call => now - call.timestamp < 5 * 60 * 1000)

    // Group by URL+method
    const grouped = last5Minutes.reduce((acc, call) => {
      const key = `${call.method} ${call.url}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Find duplicates
    const duplicates = Object.entries(grouped).filter(([, count]) => count > 1)

    return {
      totalCalls: this.calls.length,
      last5Minutes: last5Minutes.length,
      duplicates: duplicates.map(([key, count]) => ({ endpoint: key, count })),
      recentCalls: last5Minutes.slice(-10).map(call => ({
        endpoint: `${call.method} ${call.url}`,
        timestamp: new Date(call.timestamp).toISOString(),
        duration: call.duration,
        status: call.status,
        error: call.error,
      })),
    }
  }

  clear() {
    this.calls = []
  }

  // Browser console helper
  printStats() {
    if (!this.isEnabled) return

    const stats = this.getStats()
    console.log('📊 API Call Statistics:', stats)

    if (stats.duplicates.length > 0) {
      console.warn('🚨 Duplicate API calls detected:', stats.duplicates)
    }
  }
}

export const apiMonitor = new APIMonitor()

// Make it available in browser console for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).apiMonitor = apiMonitor
}

// Helper to wrap fetch calls with monitoring
export const monitoredFetch = async (url: string, options: RequestInit = {}) => {
  const startTime = Date.now()
  const method = options.method || 'GET'

  try {
    const response = await fetch(url, options)
    apiMonitor.logCall(url, method, startTime, response)
    return response
  } catch (error) {
    apiMonitor.logCall(url, method, startTime, undefined, error as Error)
    throw error
  }
}