// Demo mode utilities and configuration
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export const getDemoConfig = () => {
  return {
    isEnabled: isDemoMode(),
    demoUser: {
      email: 'test@brand.com',
      password: '12345',
      name: process.env.NEXT_PUBLIC_DEMO_USER_NAME || 'Demo User',
      company: process.env.NEXT_PUBLIC_DEMO_COMPANY || 'Analytics Pro Demo'
    }
  }
}

// Demo mode console logging
export const demoLog = (message: string, data?: any) => {
  if (isDemoMode() && process.env.NODE_ENV === 'development') {
    console.log(`🎭 DEMO MODE: ${message}`, data || '')
  }
}