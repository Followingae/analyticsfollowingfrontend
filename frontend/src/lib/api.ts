// lib/api.ts - Modern API Client for Analytics Following
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

class APIClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAuthToken(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Get fresh token from localStorage on each request
    if (typeof window !== 'undefined') {
      try {
        const storedTokens = localStorage.getItem('auth_tokens')
        if (storedTokens) {
          const tokenData = JSON.parse(storedTokens)
          if (tokenData?.access_token) {
            headers['Authorization'] = `Bearer ${tokenData.access_token}`
          }
        }
      } catch (error) {
        console.error('Failed to parse auth tokens:', error)
      }
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  async get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

export const api = new APIClient(API_BASE_URL)