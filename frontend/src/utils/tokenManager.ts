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

  private constructor() {
    // Private constructor for singleton
    this.initializeFromStorage()
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
            console.log('✅ TokenManager: Loaded valid token from storage')
          }
        } catch (error) {
          console.warn('🧹 TokenManager: Removing corrupted auth_tokens')
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
        console.log('✅ TokenManager: Loaded legacy token')
        // Migrate to new format
        this.saveTokenData(this.tokenData)
        localStorage.removeItem('access_token')
      }
    } catch (error) {
      console.error('❌ TokenManager: Initialization error:', error)
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
      console.warn('🧹 TokenManager: Removing literal null/empty from auth_tokens')
      localStorage.removeItem('auth_tokens')
    } else if (authTokens) {
      try {
        const parsed = JSON.parse(authTokens)
        if (parsed && (parsed.access_token === 'null' || parsed.access_token === 'undefined' || parsed.access_token === '')) {
          console.warn('🧹 TokenManager: Removing auth_tokens with null access_token')
          localStorage.removeItem('auth_tokens')
        }
      } catch (e) {
        console.warn('🧹 TokenManager: Removing corrupted auth_tokens')
        localStorage.removeItem('auth_tokens')
      }
    }

    // Clean legacy token
    const oldToken = localStorage.getItem('access_token')
    if (oldToken && (oldToken === 'null' || oldToken === 'undefined' || oldToken === '' || !this.isValidJWT(oldToken))) {
      console.warn('🧹 TokenManager: Removing invalid legacy token:', { token: oldToken, length: oldToken?.length })
      localStorage.removeItem('access_token')
    }

    // Clean any other potential token storage locations
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken && (refreshToken === 'null' || refreshToken === 'undefined' || refreshToken === '')) {
      console.warn('🧹 TokenManager: Removing invalid refresh_token')
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
        console.log('🔄 TokenManager: Token expired, refreshing...')
        return await this.refreshToken()
      }

      return {
        isValid: true,
        token: this.tokenData.access_token
      }
    }

    // No valid token, try to refresh
    if (this.tokenData?.refresh_token) {
      console.log('🔄 TokenManager: No valid access token, refreshing...')
      return await this.refreshToken()
    }

    console.warn('⚠️ TokenManager: No valid token or refresh token available')
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
      console.log('🔄 TokenManager: Refresh already in progress, waiting...')
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

      console.log('✅ TokenManager: Token refreshed successfully')
      return {
        isValid: true,
        token: newTokenData.access_token
      }

    } catch (error) {
      console.error('❌ TokenManager: Token refresh failed:', error)
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
      console.error('❌ TokenManager: Attempted to set invalid token data')
      return
    }

    this.tokenData = tokenData
    this.saveTokenData(tokenData)
    this.notifySubscribers(tokenData.access_token)
    console.log('✅ TokenManager: Token data set successfully')
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
      console.error('❌ TokenManager: Failed to save token data:', error)
    }
  }

  /**
   * Clear all token data
   */
  clearAllTokens(): void {
    this.tokenData = null
    this.notifySubscribers(null)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_last_updated')
      console.log('🧹 TokenManager: All tokens cleared')
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
        console.error('❌ TokenManager: Subscriber error:', error)
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
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getTokenSync() !== null
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance()
export default tokenManager