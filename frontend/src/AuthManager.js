/**
 * OptimizedAuthManager - Client-Side Session Management
 * 
 * Implements single authentication check pattern with cached user state
 * Eliminates redundant token validations and optimizes load times
 * 
 * Features:
 * - One-time bootstrap on app start
 * - Cached user identity in memory
 * - Automatic token refresh handling
 * - Silent authentication state management
 */

class OptimizedAuthManager {
  constructor() {
    // Core authentication state
    this.user = null;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Event listeners for auth state changes
    this.listeners = new Set();
    
    // Configuration
    this.config = {
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
      tokenStorageKey: 'access_token',
      refreshStorageKey: 'refresh_token',
      expiryStorageKey: 'token_expiry',
      userStorageKey: 'user_data',
      refreshThresholdMinutes: 5, // Refresh token 5 minutes before expiry
      maxRetryAttempts: 3
    };
    
    // Performance tracking
    this.performanceMetrics = {
      bootstrapTime: 0,
      cacheHits: 0,
      apiCalls: 0,
      lastBootstrap: null
    };
    
    console.log('🚀 OptimizedAuthManager initialized');
  }

  /**
   * Bootstrap authentication state on app startup
   * SINGLE VALIDATION - called once when app loads
   */
  async bootstrap() {
    const startTime = performance.now();
    console.log('🔄 Starting auth bootstrap...');
    
    this.isLoading = true;
    this.notifyListeners();
    
    try {
      // Step 1: Check for stored tokens
      const storedToken = localStorage.getItem(this.config.tokenStorageKey);
      const storedRefreshToken = localStorage.getItem(this.config.refreshStorageKey);
      const storedExpiry = localStorage.getItem(this.config.expiryStorageKey);
      const storedUser = localStorage.getItem(this.config.userStorageKey);
      
      if (!storedToken) {
        console.log('ℹ️ No stored token found - user not logged in');
        this.clearAuthState();
        return false;
      }
      
      // Step 2: Check token expiry
      const now = new Date();
      const expiryTime = storedExpiry ? new Date(storedExpiry) : null;
      
      if (expiryTime && now >= expiryTime) {
        console.log('⏰ Token expired, attempting refresh...');
        
        if (storedRefreshToken) {
          const refreshSuccess = await this.refreshTokenSilently(storedRefreshToken);
          if (!refreshSuccess) {
            console.log('❌ Token refresh failed - clearing auth state');
            this.clearAuthState();
            return false;
          }
        } else {
          console.log('❌ No refresh token available - clearing auth state');
          this.clearAuthState();
          return false;
        }
      } else {
        // Step 3: Use cached user data if available and token is valid
        if (storedUser) {
          try {
            this.user = JSON.parse(storedUser);
            this.accessToken = storedToken;
            this.refreshToken = storedRefreshToken;
            this.tokenExpiry = expiryTime;
            this.isAuthenticated = true;
            
            console.log('✅ Using cached user data - no API call needed');
            this.performanceMetrics.cacheHits++;
            
            // Schedule automatic refresh if needed
            this.scheduleTokenRefresh();
            
            this.performanceMetrics.bootstrapTime = performance.now() - startTime;
            this.performanceMetrics.lastBootstrap = new Date();
            
            return true;
          } catch (error) {
            console.warn('⚠️ Failed to parse cached user data:', error);
          }
        }
        
        // Step 4: Validate token with server (only if no cached user data)
        console.log('🔍 Validating token with server...');
        this.performanceMetrics.apiCalls++;
        
        const userData = await this.validateTokenWithServer(storedToken);
        if (userData) {
          this.setAuthState(storedToken, storedRefreshToken, userData, expiryTime);
          console.log('✅ Token validation successful');
          return true;
        } else {
          console.log('❌ Token validation failed');
          this.clearAuthState();
          return false;
        }
      }
    } catch (error) {
      console.error('💥 Bootstrap failed:', error);
      this.clearAuthState();
      return false;
    } finally {
      this.isLoading = false;
      this.performanceMetrics.bootstrapTime = performance.now() - startTime;
      this.performanceMetrics.lastBootstrap = new Date();
      this.notifyListeners();
      
      console.log(`⚡ Bootstrap completed in ${this.performanceMetrics.bootstrapTime.toFixed(2)}ms`);
    }
  }

  /**
   * Validate token with server - ONLY called during bootstrap or auth failure
   */
  async validateTokenWithServer(token) {
    try {
      const response = await fetch(`${this.config.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Cache the user data to avoid future API calls
        localStorage.setItem(this.config.userStorageKey, JSON.stringify(userData));
        return userData;
      } else if (response.status === 401) {
        // Token is invalid, try refresh if available
        const refreshToken = localStorage.getItem(this.config.refreshStorageKey);
        if (refreshToken) {
          console.log('🔄 Access token invalid, attempting refresh...');
          const refreshSuccess = await this.refreshTokenSilently(refreshToken);
          if (refreshSuccess) {
            // Retry validation with new token
            return await this.validateTokenWithServer(this.accessToken);
          }
        }
        return null;
      } else {
        console.error('Server validation failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Silent token refresh - no user interaction required
   */
  async refreshTokenSilently(refreshToken) {
    try {
      console.log('🔄 Refreshing token silently...');
      
      const response = await fetch(`${this.config.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate expiry time
        const expiryTime = new Date(Date.now() + (data.expires_in * 1000));
        
        this.setAuthState(data.access_token, data.refresh_token, data.user, expiryTime);
        console.log('✅ Token refreshed successfully');
        
        return true;
      } else {
        console.error('Token refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Login user - updates cached state
   */
  async login(email, password) {
    console.log('🔑 Logging in user...');
    
    try {
      const response = await fetch(`${this.config.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate expiry time
        const expiryTime = new Date(Date.now() + (data.expires_in * 1000));
        
        this.setAuthState(data.access_token, data.refresh_token, data.user, expiryTime);
        console.log('✅ Login successful');
        
        return { success: true, user: data.user };
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Logout user - clears all cached state
   */
  async logout() {
    console.log('👋 Logging out user...');
    
    try {
      // Call logout endpoint if token is available
      if (this.accessToken) {
        await fetch(`${this.config.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      this.clearAuthState();
      console.log('✅ Logout completed');
    }
  }

  /**
   * Set authentication state and cache data
   */
  setAuthState(accessToken, refreshToken, user, expiryTime) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
    this.tokenExpiry = expiryTime;
    this.isAuthenticated = true;
    
    // Persist to localStorage
    localStorage.setItem(this.config.tokenStorageKey, accessToken);
    localStorage.setItem(this.config.refreshStorageKey, refreshToken || '');
    localStorage.setItem(this.config.expiryStorageKey, expiryTime?.toISOString() || '');
    localStorage.setItem(this.config.userStorageKey, JSON.stringify(user));
    
    // Schedule automatic refresh
    this.scheduleTokenRefresh();
    
    this.notifyListeners();
  }

  /**
   * Clear authentication state and cache
   */
  clearAuthState() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
    
    // Clear localStorage
    localStorage.removeItem(this.config.tokenStorageKey);
    localStorage.removeItem(this.config.refreshStorageKey);
    localStorage.removeItem(this.config.expiryStorageKey);
    localStorage.removeItem(this.config.userStorageKey);
    
    // Clear any scheduled refresh
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    this.notifyListeners();
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }
    
    if (!this.tokenExpiry || !this.refreshToken) {
      return;
    }
    
    const now = new Date();
    const refreshTime = new Date(this.tokenExpiry.getTime() - (this.config.refreshThresholdMinutes * 60 * 1000));
    const timeUntilRefresh = refreshTime.getTime() - now.getTime();
    
    if (timeUntilRefresh > 0) {
      this.refreshTimeoutId = setTimeout(async () => {
        console.log('⏰ Automatic token refresh triggered');
        await this.refreshTokenSilently(this.refreshToken);
      }, timeUntilRefresh);
      
      console.log(`📅 Token refresh scheduled in ${Math.round(timeUntilRefresh / 60000)} minutes`);
    }
  }

  /**
   * Get cached user data - NO API CALL
   */
  getUser() {
    this.performanceMetrics.cacheHits++;
    return this.user;
  }

  /**
   * Check if user is authenticated - NO API CALL
   */
  isLoggedIn() {
    this.performanceMetrics.cacheHits++;
    return this.isAuthenticated;
  }

  /**
   * Get access token for API calls
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Make authenticated API request with automatic token handling
   */
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    
    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, requestOptions);
      
      // Handle token expiry
      if (response.status === 401 && this.refreshToken) {
        console.log('🔄 Token expired during request, refreshing...');
        const refreshSuccess = await this.refreshTokenSilently(this.refreshToken);
        
        if (refreshSuccess) {
          // Retry request with new token
          requestOptions.headers.Authorization = `Bearer ${this.accessToken}`;
          return await fetch(url, requestOptions);
        } else {
          // Refresh failed, user needs to login again
          this.clearAuthState();
          throw new Error('Authentication expired');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of auth state changes
   */
  notifyListeners() {
    const state = {
      user: this.user,
      isAuthenticated: this.isAuthenticated,
      isLoading: this.isLoading,
      accessToken: this.accessToken
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      memoryUsage: {
        userDataSize: this.user ? JSON.stringify(this.user).length : 0,
        listenersCount: this.listeners.size,
        cacheEfficiency: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.apiCalls) * 100
      }
    };
  }

  /**
   * Debug information
   */
  getDebugInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      isLoading: this.isLoading,
      hasUser: !!this.user,
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      tokenExpiry: this.tokenExpiry,
      refreshScheduled: !!this.refreshTimeoutId,
      performanceMetrics: this.getPerformanceMetrics()
    };
  }
}

// Create singleton instance
const authManager = new OptimizedAuthManager();

export default authManager;