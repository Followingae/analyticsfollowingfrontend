import { API_CONFIG, REQUEST_HEADERS, ENDPOINTS, getAuthHeaders } from '@/config/api'
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

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    // Load token data from localStorage on initialization
    this.loadTokenData()
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
        console.log('🔄 Migrating from old token format')
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
    this.tokenData = tokenData
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_tokens', JSON.stringify(tokenData))
    }
  }

  private clearTokenData(): void {
    this.tokenData = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('access_token') // Remove old format
      localStorage.removeItem('refresh_token') // Remove old format
      localStorage.removeItem('user_data')
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenData) return true
    // Consider token expired if it expires in less than 5 minutes
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    return Date.now() >= (this.tokenData.expires_at - bufferTime)
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.tokenData) {
      console.log('🔐 No token data available')
      return false
    }

    if (this.isTokenExpired()) {
      console.log('🔄 Token expired, attempting refresh...')
      const refreshResult = await this.refreshToken()
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
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // First test connectivity
      const connectTest = await this.testConnection()
      if (!connectTest.success) {
        return { 
          success: false, 
          error: `Cannot connect to backend: ${connectTest.message}` 
        }
      }
      const loginUrl = `${this.baseURL}${ENDPOINTS.auth.login}`
      // Add better CORS and error handling
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(credentials)
      })
      let data: any
      const responseText = await response.text()
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { 
          success: false, 
          error: `Server returned invalid response. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...` 
        }
      }
      if (response.ok && data.access_token) {
        // Calculate expiration time (default to 15 minutes if not provided)
        const expiresIn = data.expires_in || 900 // 15 minutes in seconds
        const expiresAt = Date.now() + (expiresIn * 1000)
        
        // Save token data with expiration
        const tokenData: TokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || '',
          token_type: data.token_type || 'bearer',
          expires_at: expiresAt
        }
        
        this.saveTokenData(tokenData)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        // Convert to expected format
        return {
          success: true,
          data: {
            user: data.user,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type
          }
        }
      } else {
        // Handle specific error cases
        let errorMessage = 'Login failed'
        if (response.status === 500) {
          // Check for the specific datetime parsing error
          if (data.detail && data.detail.includes("'str' object cannot be interpreted as an integer")) {
            errorMessage = 'Backend authentication service has a bug (datetime parsing error). Please contact support - this is a known issue that needs to be fixed on the server.'
          } else if (data.detail && data.detail.includes("Authentication failed due to server error")) {
            errorMessage = 'Authentication service has a server error. This is a backend issue that needs to be fixed.'
          } else {
            errorMessage = 'Server error - authentication service is currently down. Please try again in a few minutes.'
          }
        } else if (response.status === 401 || response.status === 403) {
          // NEW: Handle specific authentication error types
          if (data.detail && typeof data.detail === 'object') {
            if (data.detail.error === 'email_not_confirmed') {
              errorMessage = data.detail.message || 'Please check your email and click the confirmation link before logging in.'
              // Store email for potential resend functionality
              if (data.detail.email) {
                localStorage.setItem('pending_confirmation_email', data.detail.email)
              }
            } else if (data.detail.error === 'invalid_credentials') {
              errorMessage = data.detail.message || 'Invalid email or password'
            } else {
              errorMessage = data.detail.message || 'Authentication failed'
            }
          } else {
            errorMessage = data.detail || data.error || 'Invalid email or password'
          }
        } else if (response.status === 422) {
          errorMessage = 'Invalid request format'
        } else if (response.status >= 500) {
          errorMessage = 'Backend server error - please try again later'
        } else {
          errorMessage = data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`
        }
        return { 
          success: false, 
          error: errorMessage
        }
      }
    } catch (error) {
      let errorMessage = 'Network error during login'
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.'
      } else if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: Cross-origin request blocked. Please contact support.'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Cannot reach the backend server. Please check your connection.'
        } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Connection refused: Backend server is not responding. Please try again later.'
        } else if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = `Network error: ${error.message}`
        }
      }
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }
  // Logout user
  logout(): void {
    console.log('🚪 Logging out user')
    this.clearTokenData()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }
  // Get current user profile
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
        localStorage.setItem('user_data', JSON.stringify(userData))
        return { success: true, data: userData }
      } else {
        return { success: false, error: data.error || data.detail || 'Failed to fetch user profile' }
      }
    } catch (error) {
      // If fetchWithAuth throws, it means all retry attempts failed
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        console.log('🚪 Authentication failed, logging out')
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
    // Ensure we have a valid token before making the request
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
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.tokenData && !this.isTokenExpired()
  }
  // Get stored token
  getToken(): string | null {
    return this.tokenData?.access_token || null
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
  // Refresh authentication token
  async refreshToken(): Promise<{ success: boolean; access_token?: string; error?: string }> {
    if (!this.tokenData?.refresh_token) {
      console.log('🔐 No refresh token available')
      return { success: false, error: 'No refresh token available' }
    }

    try {
      console.log('🔄 Refreshing token...')
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify({ refresh_token: this.tokenData.refresh_token })
      })

      const data = await response.json()
      
      if (response.ok && data.access_token) {
        console.log('✅ Token refreshed successfully')
        
        // Calculate new expiration time
        const expiresIn = data.expires_in || 900 // 15 minutes in seconds
        const expiresAt = Date.now() + (expiresIn * 1000)
        
        // Update token data
        const newTokenData: TokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || this.tokenData.refresh_token,
          token_type: data.token_type || 'bearer',
          expires_at: expiresAt
        }
        
        this.saveTokenData(newTokenData)
        
        return {
          success: true,
          access_token: data.access_token
        }
      } else {
        console.log('❌ Token refresh failed:', data.error || data.detail)
        // Refresh token is invalid, logout user
        this.logout()
        return {
          success: false,
          error: data.error || data.detail || 'Token refresh failed'
        }
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error)
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
      console.error('🔐 AuthService: No authentication token found')
      return { success: false, error: 'Failed to load unlocked creators: No authentication token' }
    }
    try {
      const response = await fetchWithAuth(`${this.baseURL}${ENDPOINTS.auth.unlockedProfiles}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.tokenData!.access_token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('🔐 AuthService: Unlocked profiles data:', data)
        console.log('🔐 AuthService: Unlocked profiles - Full Object:', JSON.stringify(data, null, 2))
        console.log('🔐 AuthService: Checking fields:')
        console.log('  - data.profiles:', data.profiles)
        console.log('  - data.data:', data.data)
        console.log('  - data (direct):', Array.isArray(data) ? `Array with ${data.length} items` : 'Not an array')
        console.log('  - data.unlocked_profiles:', data.unlocked_profiles)
        console.log('  - data.results:', data.results)
        
        const profilesArray = data.profiles || data.data || data.unlocked_profiles || data.results || (Array.isArray(data) ? data : [])
        console.log('🔐 AuthService: Final profiles array:', profilesArray, 'Length:', Array.isArray(profilesArray) ? profilesArray.length : 'Not array')
        
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
      console.error('🔐 AuthService: Unlocked profiles error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error fetching unlocked profiles'
      }
    }
  }
}
export const authService = new AuthService()