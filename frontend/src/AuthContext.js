/**
 * AuthContext - React Context Provider for Optimized Authentication
 * 
 * Provides React components with access to cached authentication state
 * Eliminates prop drilling and ensures consistent auth state across app
 * 
 * Features:
 * - Real-time auth state updates
 * - Automatic bootstrap on app start
 * - Performance-optimized with cached data
 * - Comprehensive error handling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authManager from '../services/AuthManager';

// Create auth context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps app with authentication state management
 */
export function AuthProvider({ children }) {
  // Auth state from AuthManager
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true during bootstrap
    accessToken: null,
    error: null
  });

  // Performance tracking
  const [performanceStats, setPerformanceStats] = useState({
    bootstrapTime: 0,
    renderCount: 0,
    lastUpdate: null
  });

  /**
   * Handle auth state changes from AuthManager
   */
  const handleAuthStateChange = useCallback((newState) => {
    setAuthState(prevState => ({
      ...prevState,
      ...newState,
      error: null // Clear errors on successful state update
    }));
    
    setPerformanceStats(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastUpdate: new Date()
    }));
  }, []);

  /**
   * Bootstrap authentication on component mount
   */
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🚀 AuthContext: Initializing authentication...');
      
      try {
        // Subscribe to auth state changes
        const unsubscribe = authManager.subscribe(handleAuthStateChange);
        
        // Bootstrap authentication (single validation)
        const startTime = performance.now();
        const isAuthenticated = await authManager.bootstrap();
        const bootstrapTime = performance.now() - startTime;
        
        if (mounted) {
          setPerformanceStats(prev => ({
            ...prev,
            bootstrapTime
          }));
          
          console.log(`✅ AuthContext: Bootstrap completed in ${bootstrapTime.toFixed(2)}ms`);
          console.log('📊 Auth Status:', { 
            isAuthenticated,
            user: authManager.getUser()?.email,
            cacheHit: bootstrapTime < 50 // Likely cache hit if under 50ms
          });
        }
        
        // Cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('💥 AuthContext: Bootstrap failed:', error);
        
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to initialize authentication'
          }));
        }
      }
    };
    
    initializeAuth().then(cleanup => {
      // Store cleanup function
      if (cleanup && mounted) {
        // Will be called in cleanup effect
        return cleanup;
      }
    });
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - runs once on mount

  /**
   * Login function with error handling
   */
  const login = useCallback(async (email, password) => {
    console.log('🔑 AuthContext: Logging in user...');
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await authManager.login(email, password);
      
      if (result.success) {
        console.log('✅ AuthContext: Login successful');
        // State will be updated via subscription
        return { success: true, user: result.user };
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? result.error.message || 'Login failed'
          : result.error || 'Login failed';
          
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('💥 AuthContext: Login error:', error);
      
      const errorMessage = 'Network error - please check your connection';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    console.log('👋 AuthContext: Logging out user...');
    
    try {
      await authManager.logout();
      console.log('✅ AuthContext: Logout successful');
      // State will be updated via subscription
    } catch (error) {
      console.error('💥 AuthContext: Logout error:', error);
      // Force clear state even if logout API fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        error: null
      });
    }
  }, []);

  /**
   * Refresh user data from cache (no API call)
   */
  const refreshUser = useCallback(() => {
    const user = authManager.getUser();
    const isAuthenticated = authManager.isLoggedIn();
    const accessToken = authManager.getAccessToken();
    
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated,
      accessToken
    }));
    
    console.log('🔄 AuthContext: Refreshed user data from cache');
  }, []);

  /**
   * Make authenticated API request
   */
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    try {
      return await authManager.makeAuthenticatedRequest(url, options);
    } catch (error) {
      if (error.message === 'Authentication expired') {
        // Update context state to reflect unauthenticated status
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          error: 'Your session has expired. Please log in again.'
        });
      }
      throw error;
    }
  }, []);

  /**
   * Clear auth error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return {
      context: performanceStats,
      authManager: authManager.getPerformanceMetrics()
    };
  }, [performanceStats]);

  /**
   * Get debug information
   */
  const getDebugInfo = useCallback(() => {
    return {
      contextState: authState,
      contextPerformance: performanceStats,
      authManagerDebug: authManager.getDebugInfo()
    };
  }, [authState, performanceStats]);

  // Context value with all auth functionality
  const contextValue = {
    // Auth state
    ...authState,
    
    // Auth actions
    login,
    logout,
    refreshUser,
    clearError,
    
    // API helper
    makeAuthenticatedRequest,
    
    // Utility functions
    getPerformanceMetrics,
    getDebugInfo,
    
    // Direct access to AuthManager for advanced use cases
    authManager
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 * Provides type-safe access to authentication state and functions
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for components that only need to know if user is authenticated
 * Optimized for components that don't need full user data
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

/**
 * Hook for components that need user data
 * Returns cached user data (no API call)
 */
export function useUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
}

/**
 * Hook for making authenticated API requests
 * Handles token expiry and refresh automatically
 */
export function useAuthenticatedRequest() {
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();
  
  return {
    makeRequest: makeAuthenticatedRequest,
    isAuthenticated
  };
}

/**
 * Hook for auth actions (login, logout, etc.)
 */
export function useAuthActions() {
  const { login, logout, clearError, refreshUser } = useAuth();
  
  return {
    login,
    logout,  
    clearError,
    refreshUser
  };
}

/**
 * Performance monitoring hook
 * Useful for debugging and optimization
 */
export function useAuthPerformance() {
  const { getPerformanceMetrics, getDebugInfo } = useAuth();
  
  return {
    getMetrics: getPerformanceMetrics,
    getDebugInfo
  };
}

export default AuthContext;