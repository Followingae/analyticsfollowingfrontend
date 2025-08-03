import { API_CONFIG, REQUEST_HEADERS, ENDPOINTS, getAuthHeaders } from '@/config/api'

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
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    access_token: string | null
    refresh_token?: string
    token_type: string
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
  private token: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Registering user:', credentials.email)
      
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.register}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      console.log('📝 Registration response status:', response.status)
      console.log('📝 Registration response data:', JSON.stringify(data, null, 2))

      if (response.ok) {
        // Handle new backend response format
        if (data.email_confirmation_required) {
          console.log('📧 Email confirmation required for registration')
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
        console.log('✅ User registered successfully:', data.user?.email)
        
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
        console.log('❌ Registration failed with status:', response.status)
        const errorMessage = data.detail?.message || data.detail || data.error || `Registration failed (${response.status})`
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
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
      console.log('🔗 Testing backend connectivity:', healthUrl)
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      console.log('🔗 Health check response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers)
      })
      
      if (response.ok) {
        return { success: true, message: 'Backend is accessible' }
      } else {
        return { success: false, message: `Backend responded with ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      console.error('🔗 Connectivity test failed:', error)
      
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
      console.log('🔗 Connectivity test result:', connectTest)
      
      if (!connectTest.success) {
        return { 
          success: false, 
          error: `Cannot connect to backend: ${connectTest.message}` 
        }
      }
      
      const loginUrl = `${this.baseURL}${ENDPOINTS.auth.login}`
      console.log('🔑 Login attempt:')
      console.log('   URL:', loginUrl)
      console.log('   Email:', credentials.email)
      console.log('   Headers:', REQUEST_HEADERS)
      console.log('   Body:', JSON.stringify(credentials))
      console.log('   Base URL from config:', this.baseURL)
      console.log('   Environment variable:', process.env.NEXT_PUBLIC_API_BASE_URL)
      
      // Add better CORS and error handling
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          ...REQUEST_HEADERS,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(credentials)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers))

      let data: any
      const responseText = await response.text()
      console.log('📡 Raw response:', responseText)

      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        return { 
          success: false, 
          error: `Server returned invalid response. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...` 
        }
      }

      console.log('✅ Parsed response:', data)

      if (response.ok && data.access_token) {
        // Backend returns direct object, not wrapped in success/data
        this.token = data.access_token
        if (this.token) {
          localStorage.setItem('access_token', this.token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
          // Store refresh token if provided
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
        }
        
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
        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        
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
      console.error('❌ Login network error:', error)
      
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
    this.token = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<{ success: boolean; data?: User; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('👤 Fetching current user profile')
      
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.me}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.token}`
        }
      })

      let data: any
      const responseText = await response.text()
      console.log('📡 Raw /auth/me response:', responseText)

      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        return { 
          success: false, 
          error: `Invalid JSON response: ${responseText.substring(0, 200)}...` 
        }
      }

      console.log('📡 Parsed /auth/me response:', data)

      if (response.ok && (data.success || data.email)) {
        // Handle both wrapped and direct response formats
        const userData = data.success ? data.data : data
        localStorage.setItem('user_data', JSON.stringify(userData))
        return { success: true, data: userData }
      } else {
        if (response.status === 401) {
          // Token is invalid, logout
          this.logout()
        }
        return { success: false, error: data.error || data.detail || 'Failed to fetch user profile' }
      }
    } catch (error) {
      console.error('❌ Get current user error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching user' 
      }
    }
  }

  // Get user dashboard statistics
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('📊 Fetching user dashboard stats')
      
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.dashboard}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.token}`
        }
      })

      let data: any
      const responseText = await response.text()
      console.log('📡 Raw /auth/dashboard response:', responseText)

      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        return { 
          success: false, 
          error: `Invalid JSON response: ${responseText.substring(0, 200)}...` 
        }
      }

      console.log('📡 Parsed /auth/dashboard response:', data)

      if (response.ok) {
        // Handle both wrapped and direct response formats
        const dashboardData = data.success ? data.data : data
        return { success: true, data: dashboardData }
      } else {
        return { success: false, error: data.error || data.detail || 'Failed to fetch dashboard stats' }
      }
    } catch (error) {
      console.error('❌ Dashboard stats error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching dashboard' 
      }
    }
  }

  // Get user search history
  async getSearchHistory(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      console.log('📋 Fetching user search history')
      
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.searchHistory}`, {
        method: 'GET',
        headers: {
          ...REQUEST_HEADERS,
          'Authorization': `Bearer ${this.token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return data
      } else {
        return { success: false, error: data.error || 'Failed to fetch search history' }
      }
    } catch (error) {
      console.error('❌ Search history error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error fetching search history' 
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Get stored token
  getToken(): string | null {
    return this.token
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
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
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
      console.log('🔐 Password reset request for:', email)
      
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
      console.error('❌ Password reset error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during password reset'
      }
    }
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('📧 Verifying email with token')
      
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
      console.error('❌ Email verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during email verification'
      }
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<{ success: boolean; access_token?: string; error?: string }> {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    try {
      console.log('🔄 Refreshing authentication token')
      
      const response = await fetch(`${this.baseURL}${ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      const data = await response.json()

      if (response.ok && data.access_token) {
        this.token = data.access_token
        localStorage.setItem('access_token', data.access_token)
        
        return {
          success: true,
          access_token: data.access_token
        }
      } else {
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
}

export const authService = new AuthService()