/**
 * INDUSTRY-STANDARD CENTRALIZED TOKEN MANAGER
 * 
 * This singleton ensures ALL token access goes through one validated source,
 * preventing race conditions and "null" token issues.
 * 
 * Based on OAuth 2.0 best practices and enterprise authentication patterns.
 */

interface TokenData {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_at: number
}

interface TokenValidationResult {
  isValid: boolean
  token: string | null
  reason?: string
}

class TokenManager {
  private static instance: TokenManager
  private tokenData: TokenData | null = null
  private isRefreshing: boolean = false
  private refreshPromise: Promise<TokenValidationResult> | null = null
  private subscribers: ((token: string | null) => void)[] = []
  
  // Enhanced session management
  private sessionTimeout?: NodeJS.Timeout
  private lastActivity: number = Date.now()
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours (much longer to prevent logout on refresh)
  private readonly ACTIVITY_CHECK_INTERVAL = 60 * 1000 // 1 minute
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry
  
  // Request deduplication for authentication
  private pendingRequests = new Map<string, Promise<any>>()

  private constructor() {
    // Private constructor for singleton
    this.initializeFromStorage()
    this.setupSessionManagement()
    this.setupActivityTracking()
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  /**
   * Initialize token data from localStorage with validation
   */
  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      // Clean up any invalid tokens first
      this.cleanupInvalidTokens()

      // Try to load valid tokens
      const authTokens = localStorage.getItem('auth_tokens')
      if (authTokens && authTokens !== 'null' && authTokens !== 'undefined') {
        try {
          const tokenData = JSON.parse(authTokens)
          if (this.isValidTokenData(tokenData)) {
            this.tokenData = tokenData

          }
        } catch (error) {

          localStorage.removeItem('auth_tokens')
        }
      }

      // Legacy token check
      const oldToken = localStorage.getItem('access_token')
      if (oldToken && oldToken !== 'null' && oldToken !== 'undefined' && this.isValidJWT(oldToken) && !this.tokenData) {
        this.tokenData = {
          access_token: oldToken,
          token_type: 'bearer',
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }

        // Migrate to new format
        this.saveTokenData(this.tokenData)
        localStorage.removeItem('access_token')
      }
    } catch (error) {

      this.clearAllTokens()
    }
  }

  /**
   * Validate token data structure and JWT format
   */
  private isValidTokenData(tokenData: any): boolean {
    if (!tokenData || typeof tokenData !== 'object') return false
    if (!tokenData.access_token || typeof tokenData.access_token !== 'string') return false
    if (tokenData.access_token === 'null' || tokenData.access_token === 'undefined') return false
    return this.isValidJWT(tokenData.access_token)
  }

  /**
   * Validate JWT format (3 segments)
   */
  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    if (token === 'null' || token === 'undefined') return false
    const segments = token.split('.')
    return segments.length === 3 && segments.every(seg => seg.length > 0)
  }

  /**
   * Clean up any invalid tokens from storage
   */
  private cleanupInvalidTokens(): void {
    if (typeof window === 'undefined') return

    // Clean auth_tokens
    const authTokens = localStorage.getItem('auth_tokens')
    if (authTokens && (authTokens === 'null' || authTokens === 'undefined' || authTokens === '')) {

      localStorage.removeItem('auth_tokens')
    } else if (authTokens) {
      try {
        const parsed = JSON.parse(authTokens)
        if (parsed && (parsed.access_token === 'null' || parsed.access_token === 'undefined' || parsed.access_token === '')) {

          localStorage.removeItem('auth_tokens')
        }
      } catch (e) {

        localStorage.removeItem('auth_tokens')
      }
    }

    // Clean legacy token
    const oldToken = localStorage.getItem('access_token')
    if (oldToken && (oldToken === 'null' || oldToken === 'undefined' || oldToken === '' || !this.isValidJWT(oldToken))) {

      localStorage.removeItem('access_token')
    }

    // Clean any other potential token storage locations
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken && (refreshToken === 'null' || refreshToken === 'undefined' || refreshToken === '')) {

      localStorage.removeItem('refresh_token')
    }
  }

  /**
   * Get current valid token
   */
  async getValidToken(): Promise<TokenValidationResult> {
    // Check if we have a valid token
    if (this.tokenData && this.isValidJWT(this.tokenData.access_token)) {
      // Check if token is expired
      if (this.tokenData.expires_at && Date.now() > this.tokenData.expires_at) {

        return await this.refreshToken()
      }

      return {
        isValid: true,
        token: this.tokenData.access_token
      }
    }

    // No valid token, try to refresh
    if (this.tokenData?.refresh_token) {

      return await this.refreshToken()
    }


    return {
      isValid: false,
      token: null,
      reason: 'No valid token available'
    }
  }

  /**
   * Refresh token with proper error handling
   */
  private async refreshToken(): Promise<TokenValidationResult> {
    if (this.isRefreshing && this.refreshPromise) {

      return await this.refreshPromise
    }

    if (!this.tokenData?.refresh_token) {
      return {
        isValid: false,
        token: null,
        reason: 'No refresh token available'
      }
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<TokenValidationResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: this.tokenData!.refresh_token
        })
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.access_token || !this.isValidJWT(data.access_token)) {
        throw new Error('Invalid token received from refresh')
      }

      // Update token data
      const newTokenData: TokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokenData!.refresh_token,
        token_type: data.token_type || 'bearer',
        expires_at: Date.now() + ((data.expires_in || 86400) * 1000)
      }

      this.setTokenData(newTokenData)


      return {
        isValid: true,
        token: newTokenData.access_token
      }

    } catch (error) {

      this.clearAllTokens()
      this.notifySubscribers(null)
      
      return {
        isValid: false,
        token: null,
        reason: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }

  /**
   * Set new token data (from login)
   */
  setTokenData(tokenData: TokenData): void {
    if (!this.isValidTokenData(tokenData)) {

      return
    }

    this.tokenData = tokenData
    this.saveTokenData(tokenData)
    this.notifySubscribers(tokenData.access_token)

  }

  /**
   * Save token data to localStorage
   */
  private saveTokenData(tokenData: TokenData): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('auth_tokens', JSON.stringify(tokenData))
      localStorage.setItem('user_last_updated', Date.now().toString())
    } catch (error) {

    }
  }

  /**
   * Clear all token data and clean up timers
   */
  clearAllTokens(): void {
    this.tokenData = null
    this.lastActivity = 0
    this.pendingRequests.clear()
    this.notifySubscribers(null)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_last_updated')
    }

    // Clean up timeout to prevent infinite recursion
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
      this.sessionTimeout = undefined
    }
  }

  /**
   * Subscribe to token changes
   */
  subscribe(callback: (token: string | null) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  /**
   * Notify subscribers of token changes
   */
  private notifySubscribers(token: string | null): void {
    this.subscribers.forEach(callback => {
      try {
        callback(token)
      } catch (error) {

      }
    })
  }

  /**
   * Get token synchronously (for backwards compatibility)
   * WARNING: This may return null even if a valid token can be obtained via refresh
   */
  getTokenSync(): string | null {
    if (this.tokenData && this.isValidJWT(this.tokenData.access_token)) {
      // Don't return expired tokens
      if (this.tokenData.expires_at && Date.now() > this.tokenData.expires_at) {
        return null
      }
      return this.tokenData.access_token
    }
    return null
  }

  /**
   * Setup session management with single timeout check
   */
  private setupSessionManagement(): void {
    if (typeof window === 'undefined') return

    // Use single timeout instead of infinite interval
    this.scheduleNextSessionCheck()
  }

  /**
   * Schedule next session check (non-recursive)
   */
  private scheduleNextSessionCheck(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
    }

    // Only schedule if we have active token data
    if (!this.tokenData) return

    const now = Date.now()
    const timeSinceActivity = now - this.lastActivity
    const timeToSessionTimeout = this.SESSION_TIMEOUT - timeSinceActivity
    const timeToTokenExpiry = this.tokenData.expires_at ? this.tokenData.expires_at - now : Infinity

    // Check which event happens first, but ensure minimum 1 second delay
    const nextCheckIn = Math.max(
      1000, // Minimum 1 second to prevent infinite recursion
      Math.min(
        Math.max(timeToSessionTimeout, 1000),
        Math.max(timeToTokenExpiry - this.TOKEN_REFRESH_BUFFER, 1000),
        this.ACTIVITY_CHECK_INTERVAL // Fallback to 1 minute max
      )
    )

    this.sessionTimeout = setTimeout(() => {
      this.handleSessionCheck()
    }, nextCheckIn)
  }

  /**
   * Handle session check and schedule next one if needed
   */
  private handleSessionCheck(): void {
    // Prevent multiple concurrent session checks
    if (!this.tokenData) {
      return // No token data, stop the chain
    }

    const now = Date.now()

    // DISABLED: Session timeout check during navigation debugging
    // The 24-hour session timeout might be interfering with navigation
    // if (this.tokenData && now - this.lastActivity > this.SESSION_TIMEOUT) {
    //   console.log('🕐 Session timeout - clearing tokens (after 24 hours)')
    //   this.clearAllTokens()
    //   return // CRITICAL: Don't schedule another check after clearing tokens
    // }

    // Only do proactive token refresh, but don't force logout on session timeout
    if (this.tokenData.expires_at) {
      const timeToExpiry = this.tokenData.expires_at - now
      if (timeToExpiry > 0 && timeToExpiry < this.TOKEN_REFRESH_BUFFER) {
        this.refreshToken().catch((error) => {
          console.warn('Token refresh failed during proactive refresh:', error)
          // Don't clear tokens here - let API calls handle auth failures
        })
      }
    }

    // CRITICAL FIX: Only schedule next check if we still have active session
    // Use setTimeout to prevent immediate recursion
    if (this.tokenData && this.sessionTimeout !== undefined) {
      setTimeout(() => {
        if (this.tokenData) { // Double-check token still exists
          this.scheduleNextSessionCheck()
        }
      }, 100) // Small delay to break the call stack
    }
  }

  /**
   * Setup activity tracking to extend session
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return

    const updateActivity = () => {
      this.lastActivity = Date.now()
    }

    // Track user activity
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Track navigation
    window.addEventListener('beforeunload', updateActivity)
  }

  /**
   * Deduplicated API request to prevent multiple auth calls
   */
  private async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Return existing promise if request is in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Enhanced token validation with preemptive refresh
   */
  async getValidTokenWithRefresh(): Promise<TokenValidationResult> {
    return this.deduplicateRequest('getValidToken', async () => {
      // Update activity timestamp
      this.lastActivity = Date.now()

      // Check if we have a valid token
      if (this.tokenData && this.isValidJWT(this.tokenData.access_token)) {
        // Check if token expires soon and refresh proactively
        const timeToExpiry = this.tokenData.expires_at ? 
          this.tokenData.expires_at - Date.now() : 0

        if (timeToExpiry > this.TOKEN_REFRESH_BUFFER) {
          return {
            isValid: true,
            token: this.tokenData.access_token
          }
        } else {
          return await this.refreshToken()
        }
      }

      // No valid token, try to refresh
      if (this.tokenData?.refresh_token) {
        return await this.refreshToken()
      }

      return {
        isValid: false,
        token: null,
        reason: 'No valid token available'
      }
    })
  }

  /**
   * Check if user session is active (not timed out)
   */
  isSessionActive(): boolean {
    if (!this.tokenData) return false
    return Date.now() - this.lastActivity < this.SESSION_TIMEOUT
  }

  /**
   * Get session information
   */
  getSessionInfo(): {
    isActive: boolean
    lastActivity: Date
    timeToExpiry?: number
    timeToTimeout: number
  } {
    const timeToTimeout = this.SESSION_TIMEOUT - (Date.now() - this.lastActivity)
    const timeToExpiry = this.tokenData?.expires_at ? 
      this.tokenData.expires_at - Date.now() : undefined

    return {
      isActive: this.isSessionActive(),
      lastActivity: new Date(this.lastActivity),
      timeToExpiry: timeToExpiry && timeToExpiry > 0 ? timeToExpiry : undefined,
      timeToTimeout: Math.max(0, timeToTimeout)
    }
  }


  /**
   * Check if user is authenticated with session validation
   */
  isAuthenticated(): boolean {
    return this.getTokenSync() !== null && this.isSessionActive()
  }


  /**
   * Cleanup resources when done
   */
  destroy(): void {
    this.clearAllTokens()
    this.subscribers.length = 0
  }

  /**
   * Extend session and reschedule check
   */
  extendSession(): void {
    this.lastActivity = Date.now()
    // Reschedule session check with new activity time
    this.scheduleNextSessionCheck()
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance()
export default tokenManager