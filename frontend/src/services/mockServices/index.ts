// Mock service infrastructure - no actual data yet
import { isDemoMode, demoLog } from '@/utils/demoMode'

// Mock authentication service
export const mockAuthService = {
  async login(email: string, password: string) {
    demoLog('Mock login attempt', { email })

    // Only accept demo credentials
    if (email === 'test@brand.com' && password === '12345') {
      demoLog('Demo login successful')

      // TODO: Return mock user data when ready
      return {
        success: true,
        user: null, // Will be populated with mock user data later
        token: 'demo-token-12345'
      }
    }

    throw new Error('Invalid demo credentials')
  },

  async getUserData() {
    demoLog('Mock getUserData called')
    // TODO: Return mock dashboard data when ready
    return null
  }
}

// Mock analytics service
export const mockAnalyticsService = {
  async getCompleteDashboardData(username: string) {
    demoLog('Mock getCompleteDashboardData called', { username })
    // TODO: Return mock analytics data when ready
    return null
  },

  async getEnhancedProfile(username: string) {
    demoLog('Mock getEnhancedProfile called', { username })
    // TODO: Return mock profile data when ready
    return null
  }
}

// Mock creators service
export const mockCreatorsService = {
  async searchCreators(query: string) {
    demoLog('Mock searchCreators called', { query })
    // TODO: Return mock creators list when ready
    return null
  }
}

// Service factory - returns mock or real service based on demo mode
export const getAuthService = () => {
  if (isDemoMode()) {
    demoLog('Using mock auth service')
    return mockAuthService
  }
  // Return real service (imported dynamically to avoid circular deps)
  return null // Will import real service when needed
}

export const getAnalyticsService = () => {
  if (isDemoMode()) {
    demoLog('Using mock analytics service')
    return mockAnalyticsService
  }
  return null // Will import real service when needed
}

export const getCreatorsService = () => {
  if (isDemoMode()) {
    demoLog('Using mock creators service')
    return mockCreatorsService
  }
  return null // Will import real service when needed
}