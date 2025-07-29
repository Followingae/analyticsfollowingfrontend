import { API_CONFIG, REQUEST_HEADERS } from '@/config/api'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'free' | 'premium' | 'admin'
  status: string
  created_at: string
  last_login: string
  profile_picture_url?: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    access_token: string
    token_type: string
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
      this.token = localStorage.getItem('auth_token')
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Registering user:', credentials.email)
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      console.log('📝 Registration response:', data)

      if (response.ok && data.access_token) {
        // Backend returns direct object, not wrapped in success/data
        this.token = data.access_token
        if (this.token) {
          localStorage.setItem('auth_token', this.token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }
        
        // Convert to expected format
        return {
          success: true,
          data: {
            user: data.user,
            access_token: data.access_token,
            token_type: data.token_type
          }
        }
      } else {
        return { success: false, error: data.error || data.detail || 'Registration failed' }
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error during registration' 
      }
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const loginUrl = `${this.baseURL}/auth/login`
      console.log('🔑 Login attempt:')
      console.log('   URL:', loginUrl)
      console.log('   Email:', credentials.email)
      console.log('   Headers:', REQUEST_HEADERS)
      console.log('   Body:', JSON.stringify(credentials))
      console.log('   Base URL from config:', this.baseURL)
      console.log('   Environment variable:', process.env.NEXT_PUBLIC_API_BASE_URL)
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        mode: 'cors',
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
          error: `Invalid JSON response: ${responseText.substring(0, 200)}...` 
        }
      }

      console.log('✅ Parsed response:', data)

      if (response.ok && data.access_token) {
        // Backend returns direct object, not wrapped in success/data
        this.token = data.access_token
        if (this.token) {
          localStorage.setItem('auth_token', this.token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }
        
        // Convert to expected format
        return {
          success: true,
          data: {
            user: data.user,
            access_token: data.access_token,
            token_type: data.token_type
          }
        }
      } else {
        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        return { 
          success: false, 
          error: data.error || data.detail || `HTTP ${response.status}: ${response.statusText}` 
        }
      }
    } catch (error) {
      console.error('❌ Login network error:', error)
      
      let errorMessage = 'Network error during login'
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running and accessible.'
      } else if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: Backend needs to allow requests from this domain'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Cannot reach the backend server'
        } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Connection refused: Backend server is not responding'
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
    localStorage.removeItem('auth_token')
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
      
      const response = await fetch(`${this.baseURL}/auth/me`, {
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
      
      const response = await fetch(`${this.baseURL}/auth/dashboard`, {
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
      
      const response = await fetch(`${this.baseURL}/auth/search-history`, {
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
}

export const authService = new AuthService()