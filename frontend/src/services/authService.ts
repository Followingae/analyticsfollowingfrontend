import { API_CONFIG, REQUEST_HEADERS, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { tokenManager } from '@/utils/tokenManager'
import { fetchWithAuth } from '@/utils/apiInterceptor'
export interface User {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  company?: string
  job_title?: string
  phone_number?: string
  bio?: string
  role: 'free' | 'premium' | 'admin'
  status: string
  created_at: string
  last_login?: string
  profile_picture_url?: string
  timezone?: string
  language?: string
  avatar_config?: {
    variant: string
    colorScheme: string
    colors: string[]
    seed?: string
  }
}
export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: number
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    access_token: string | null
    refresh_token?: string
    token_type: string
    expires_in?: number
    message?: string
    email_confirmation_required?: boolean
  }
  error?: string
}
export interface LoginCredentials {
  email: string
  password: string
}
export interface RegisterCredentials {
  email: string
  password: string
  full_name: string
}
export interface DashboardStats {
  total_searches: number
  searches_this_month: number
  favorite_profiles: Array<any>
  recent_searches: Array<{
    username: string
    created_at: string
    search_type?: string
  }>
  account_created: string
  last_active: string
}
class AuthService {
  private baseURL: string
  private tokenData: TokenData | null = null
  private lastLoginTime: number = 0
  private refreshPromise: Promise<{ success: boolean; access_token?: string; error?: string }> | null = null
  private tokenHealthStats = {
    validationSuccesses: 0,
    validationFailures: 0,
    malformedTokens: 0,
    refreshAttempts: 0,
    refreshSuccesses: 0,
    lastHealthCheck: Date.now()
  }

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    
    // Initialize TokenManager (this will clean up any invalid tokens)
    // Note: TokenManager is a singleton, so getInstance() is safe to call
    tokenManager // Initialize the singleton
    
    // Load token data from localStorage on initialization
    this.loadTokenData()
    // Log health stats periodically
    this.startHealthMonitoring()
  }

  // Clean up any invalid tokens that might be stored
  private cleanupInvalidTokens(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Check auth_tokens format
      const authTokens = localStorage.getItem('auth_tokens');
      if (authTokens) {
        try {
          const tokenData = JSON.parse(authTokens);
          if (tokenData.access_token === 'null' || 
              tokenData.access_token === 'undefined' || 
              typeof tokenData.access_token !== 'string' || 
              tokenData.access_token.split('.').length !== 3) {

            localStorage.removeItem('auth_tokens');
          }
        } catch {

          localStorage.removeItem('auth_tokens');
        }
      }

      // Check old format access_token
      const oldToken = localStorage.getItem('access_token');
      if (oldToken && (oldToken === 'null' || oldToken === 'undefined' || oldToken.split('.').length !== 3)) {

        localStorage.removeItem('access_token');
      }
    } catch (error) {

    }
  }

  private loadTokenData(): void {
    if (typeof window !== 'undefined') {
      // Try new token format first
      const storedTokens = localStorage.getItem('auth_tokens')
      if (storedTokens) {
        try {
          this.tokenData = JSON.parse(storedTokens)
          return
        } catch {
          // Invalid token data, clear it
          localStorage.removeItem('auth_tokens')
        }
      }
      
      // Migration: Check for old token format
      const oldAccessToken = localStorage.getItem('access_token')
      const oldRefreshToken = localStorage.getItem('refresh_token')
      
      if (oldAccessToken) {
        // Create new token data with default expiration (assume expired to force refresh)
        const tokenData: TokenData = {
          access_token: oldAccessToken,
          refresh_token: oldRefreshToken || '',
          token_type: 'bearer',
          expires_at: Date.now() - 1 // Mark as expired to force refresh
        }
        
        this.saveTokenData(tokenData)
        
        // Clean up old tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  }

  private saveTokenData(tokenData: TokenData): void {
    // Validate token data before storing
    if (!tokenData.access_token || 
        tokenData.access_token === 'null' || 
        tokenData.access_token === 'undefined' || 
        typeof tokenData.access_token !== 'string') {
      return;
    }

    // Validate JWT format (should have 3 segments)
    const segments = tokenData.access_token.split('.');
    if (segments.length !== 3) {
      return;
    }

    this.tokenData = tokenData
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_tokens', JSON.stringify(tokenData))
    }
  }

  private clearTokenData(): void {

    console.trace('clearTokenData call stack:')
    this.tokenData = null
    
    // Use TokenManager to clear all tokens consistently
    tokenManager.clearAllTokens()
    

  }

  private isTokenExpired(): boolean {
    if (!this.tokenData) {

      return true
    }
    // Consider token expired only if it's actually expired (no buffer for debugging)
    const bufferTime = 0 // No buffer to prevent premature expiration
    const isExpired = Date.now() >= (this.tokenData.expires_at - bufferTime)
    const timeUntilExpiry = this.tokenData.expires_at - Date.now()
    
    return isExpired
  }

  private async ensureValidToken(): Promise<boolean> {

    
    // Grace period: Skip token validation for 10 seconds after login
    const timeSinceLogin = Date.now() - this.lastLoginTime
    if (timeSinceLogin < 10000) { // 10 seconds

      return true
    }
    
    if (!this.tokenData) {

      return false
    }

    if (this.isTokenExpired()) {

      const refreshResult = await this.refreshToken()

      if (!refreshResult.success) {

      }
      return refreshResult.success
    }


    return true
  }
  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.register}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify(credentials)
      })
      const data = await response.json()
      if (response.ok) {
        // Handle new backend response format
        if (data.email_confirmation_required) {
          return {
            success: true,
            data: {
              user: data.user || null,
              access_token: null,
              token_type: 'bearer',
              message: data.message || 'Please check your email and click the confirmation link before logging in.',
              email_confirmation_required: true
            }
          }
        }
        // Registration successful with immediate access
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }
        return {
          success: true,
          data: {
            user: data.user,
            access_token: data.access_token || null,
            refresh_token: data.refresh_token || null,
            token_type: data.token_type || 'bearer',
            message: data.message || 'Registration successful',
            email_confirmation_required: false
          }
        }
      } else {
        const errorMessage = data.detail?.message || data.detail || data.error || `Registration failed (${response.status})`
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error during registration' 
      }
    }
  }
  // Test backend connectivity
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const healthUrl = `${this.baseURL}/health`
      const response = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      })
      if (response.ok) {
        return { success: true, message: 'Backend is accessible' }
      } else {
        return { success: false, message: `Backend responded with ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      let errorMessage = 'Connection failed'
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (this.baseURL.includes('localhost')) {
          errorMessage = 'Cannot connect to local backend server. Please make sure the backend is running on http://localhost:8000'
        } else {
          errorMessage = 'CORS error: Cannot connect to production backend from localhost. The backend needs to allow requests from http://localhost:3000'
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }
  async login(credentials: LoginCredentials): Promise<AuthResponse> {

    try {

      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify(credentials)
      })


      if (!response.ok) {

        const error = await response.text()
        return {
          success: false,
          error: error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()
      
      if (data.access_token && data.user) {

        
        // Validate access token before processing
        if (data.access_token === 'null' || 
            data.access_token === 'undefined' || 
            typeof data.access_token !== 'string' || 
            data.access_token.split('.').length !== 3) {
          return {
            success: false,
            error: 'Invalid authentication token received from server'
          };
        }
        
        // Calculate expiration (default to 24 hours if not provided - backend standard)
        const expiresIn = data.expires_in || 86400 // 24 hours in seconds
        const expiresAt = Date.now() + (expiresIn * 1000)
        
        // Create token data with expiration
        const tokenData: TokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || '',
          token_type: data.token_type || 'bearer',
          expires_at: expiresAt
        }
        
        // Store both in localStorage and in-memory using TokenManager
        tokenManager.setTokenData(tokenData)
        this.saveTokenData(tokenData)
        
        // Validate user data before storing
        if (data.user && typeof data.user === 'object') {
          localStorage.setItem('user_data', JSON.stringify(data.user))
        } else {

        }
        
        // Set login grace period to prevent immediate token validation
        this.lastLoginTime = Date.now()
        
        return {
          success: true,
          data: data
        }
      }

      return {
        success: false,
        error: 'Invalid response format'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  // Register user
  // Logout user
  logout(): void {

    console.trace('logout call stack:')
    this.clearTokenData()
    
    // Only redirect if we're not already on a login/auth page to prevent loops
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAlreadyOnAuthPage = currentPath.startsWith('/auth/') || currentPath === '/login'
      
      if (!isAlreadyOnAuthPage) {

        window.location.href = '/auth/login'
      } else {

      }
    }
  }
  // Get current user profile with enhanced debugging
  async getCurrentUser(): Promise<{ success: boolean; data?: User; error?: string }> {
    // Ensure we have a valid token before making the request
    const hasValidToken = await this.ensureValidToken()
    if (!hasValidToken) {
      return { success: false, error: 'No authentication token' }
    }

    try {

      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.auth.me}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.tokenData!.access_token}`
        }
      })

      let data: any
      const responseText = await response.text()
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { 
          success: false, 
          error: `Invalid JSON response: ${responseText.substring(0, 200)}...` 
        }
      }

      if (response.ok && (data.success || data.email)) {
        // Handle both wrapped and direct response formats
        const userData = data.success ? data.data : data
        
        // 🚨 CRITICAL DEBUGGING: User Role Analysis
        
        // Check for role/subscription mismatch
        if (userData.role === 'free' && userData.email?.includes('analyticsfollowing')) {
          // Role mismatch detected
        }
        
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        // Fetch team context for additional debugging
        this.debugTeamContext()
        
        return { success: true, data: userData }
      } else {
        return { success: false, error: data.error || data.detail || 'Failed to fetch user profile' }
      }
    } catch (error) {
      // If fetchWithAuth throws, it means all retry attempts failed
      if (error instanceof Error && error.message.includes('Authentication failed')) {

        this.logout()
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching user' 
      }
    }
  }
  // Get user dashboard statistics
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    // Ensure we have a valid token before making the request (with grace period protection)
    const hasValidToken = await this.ensureValidToken()
    if (!hasValidToken) {
      return { success: false, error: 'No authentication token' }
    }
    try {
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.auth.dashboard}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.tokenData!.access_token}`
        }
      })
      let data: any
      const responseText = await response.text()
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { 
          success: false, 
          error: `Invalid JSON response: ${responseText.substring(0, 200)}...` 
        }
      }
      if (response.ok) {
        // Handle both wrapped and direct response formats
        const dashboardData = data.success ? data.data : data
        return { success: true, data: dashboardData }
      } else {
        return { success: false, error: data.error || data.detail || 'Failed to fetch dashboard stats' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching dashboard' 
      }
    }
  }
  // Get user search history
  async getSearchHistory(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // Ensure we have a valid token before making the request
    const hasValidToken = await this.ensureValidToken()
    if (!hasValidToken) {
      return { success: false, error: 'No authentication token' }
    }
    try {
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.auth.searchHistory}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.tokenData!.access_token}`
        }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        return data
      } else {
        return { success: false, error: data.error || 'Failed to fetch search history' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching search history' 
      }
    }
  }
  // Check if user is authenticated - now uses TokenManager
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated()
  }
  // Start health monitoring for token system
  private startHealthMonitoring(): void {
    // Log health stats every 5 minutes
    setInterval(() => {
      if (this.tokenHealthStats.validationSuccesses + this.tokenHealthStats.validationFailures > 0) {
        const successRate = (this.tokenHealthStats.validationSuccesses / 
          (this.tokenHealthStats.validationSuccesses + this.tokenHealthStats.validationFailures)) * 100
        
        this.tokenHealthStats.lastHealthCheck = Date.now()
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  // Validate JWT token format (must have 3 segments: header.payload.signature)
  private validateTokenFormat(token: string | null): boolean {
    if (!token) {

      this.tokenHealthStats.validationFailures++
      return false
    }
    
    const segments = token.split('.')
    const isValid = segments.length === 3
    
    if (!isValid) {
      this.tokenHealthStats.malformedTokens++
      this.tokenHealthStats.validationFailures++
      
      // Clear malformed token immediately
      this.clearTokenData()
    } else {
      this.tokenHealthStats.validationSuccesses++

    }
    
    return isValid
  }

  // Get stored token with validation - now uses TokenManager
  getToken(): string | null {
    return tokenManager.getTokenSync()
  }
  // Get stored user data
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch {
        return null
      }
    }
    return null
  }
  // Test the problematic system stats endpoint with detailed diagnostics
  async testSystemStatsEndpoint(): Promise<void> {
    try {

      const response = await fetchWithAuth(`${this.baseURL}/api/v1/creator/system/stats`)
      
      if (response.ok) {
        const data = await response.json()

      } else {
        const errorText = await response.text()
        // Error occurred during request
      }
    } catch (error) {

    }
  }

  // Get and analyze team context for debugging role issues
  async debugTeamContext(): Promise<void> {
    try {

      const response = await fetchWithAuth(`${this.baseURL}/api/v1/teams/overview`)
      
      if (response.ok) {
        const teamData = await response.json()
        
        // Also test the problematic endpoint
        await this.testSystemStatsEndpoint()
        
      } else {

      }
    } catch (error) {

    }
  }

  // Get authorization headers for API calls
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...REQUEST_HEADERS }
    if (this.tokenData?.access_token) {
      headers['Authorization'] = `Bearer ${this.tokenData.access_token}`
    }
    return headers
  }
  // Check if user has premium access
  isPremiumUser(): boolean {
    const user = this.getStoredUser()
    return user?.role === 'premium' || user?.role === 'admin'
  }
  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getStoredUser()
    return user?.role === 'admin'
  }
  // Password reset functionality
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.forgotPassword}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Password reset email sent successfully'
        }
      } else {
        return {
          success: false,
          error: data.error || data.detail || 'Failed to send reset email'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during password reset'
      }
    }
  }
  // Verify email with token
  async verifyEmail(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.verifyEmail(token)}`, {
        method: 'GET',
        headers: REQUEST_HEADERS
      })
      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Email verified successfully'
        }
      } else {
        return {
          success: false,
          error: data.error || data.detail || 'Email verification failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during email verification'
      }
    }
  }
  // Refresh authentication token with race condition prevention
  async refreshToken(): Promise<{ success: boolean; access_token?: string; error?: string }> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {

      return await this.refreshPromise
    }
    
    if (!this.tokenData?.refresh_token) {

      return { success: false, error: 'No refresh token available' }
    }

    // Start refresh operation
    this.refreshPromise = this.performTokenRefresh()
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      // Clear promise after completion
      this.refreshPromise = null
    }
  }
  
  // Internal method to perform actual token refresh
  private async performTokenRefresh(): Promise<{ success: boolean; access_token?: string; error?: string }> {
    this.tokenHealthStats.refreshAttempts++
    
    try {

      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify({ refresh_token: this.tokenData!.refresh_token })
      })

      const data = await response.json()
      
      if (response.ok && data.access_token) {
        // Validate the refreshed token
        if (data.access_token === 'null' || 
            data.access_token === 'undefined' || 
            typeof data.access_token !== 'string' || 
            data.access_token.split('.').length !== 3) {
          return {
            success: false,
            error: 'Invalid authentication token received during refresh'
          };
        }
        
        this.tokenHealthStats.refreshSuccesses++
        
        // Calculate new expiration time (default to 24 hours - backend standard)
        const expiresIn = data.expires_in || 86400 // 24 hours in seconds
        const expiresAt = Date.now() + (expiresIn * 1000)
        
        // Update token data
        const newTokenData: TokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || this.tokenData!.refresh_token,
          token_type: data.token_type || 'bearer',
          expires_at: expiresAt
        }
        
        tokenManager.setTokenData(newTokenData)
        this.saveTokenData(newTokenData)
        
        return {
          success: true,
          access_token: data.access_token
        }
      } else {

        // Don't logout immediately - let the user continue with current session

        return {
          success: false,
          error: data.error || data.detail || 'Token refresh failed'
        }
      }
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during token refresh'
      }
    }
  }

  // Get unlocked profiles
  async getUnlockedProfiles(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // Ensure we have a valid token before making the request
    const hasValidToken = await this.ensureValidToken()
    if (!hasValidToken) {

      return { success: false, error: 'Failed to load unlocked creators: No authentication token' }
    }
    try {
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.creator.unlocked}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.tokenData!.access_token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {








        
        const profilesArray = data.profiles || data.data || data.unlocked_profiles || data.results || (Array.isArray(data) ? data : [])

        
        return {
          success: true,
          data: profilesArray
        }
      } else {
        return {
          success: false,
          error: data.detail || data.error || 'Failed to fetch unlocked profiles'
        }
      }
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error fetching unlocked profiles'
      }
    }
  }
}
export const authService = new AuthService()