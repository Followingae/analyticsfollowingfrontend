const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

import { CompleteProfileResponse } from '../types'

export interface ProfileData extends CompleteProfileResponse {}

export interface BasicProfileResponse {
  username: string
  full_name: string
  followers: number
  following: number
  posts_count: number
  is_verified: boolean
  profile_pic_url: string | null
}

export interface AnalyticsResponse {
  success: boolean
  data: ProfileData
  error?: string
}

export interface BasicAnalyticsResponse {
  success: boolean
  data: BasicProfileResponse
  error?: string
}

export interface HealthCheckResponse {
  status: string
  timestamp: string
  version?: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE
  }

  async fetchProfile(username: string, useSmartProxy = false): Promise<AnalyticsResponse> {
    try {
      const endpoint = useSmartProxy 
        ? `/api/v1/instagram/profile/${username}`
        : `/api/v1/inhouse/instagram/profile/${username}`
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { 
        success: false, 
        data: {} as ProfileData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async fetchProfileWithFallback(username: string): Promise<AnalyticsResponse> {
    // Try in-house scraper first
    const inhouseResult = await this.fetchProfile(username, false)
    if (inhouseResult.success) {
      return inhouseResult
    }

    console.warn('In-house scraper failed, trying SmartProxy:', inhouseResult.error)
    
    // Fallback to SmartProxy
    const smartproxyResult = await this.fetchProfile(username, true)
    if (smartproxyResult.success) {
      return smartproxyResult
    }

    return {
      success: false,
      data: {} as ProfileData,
      error: 'Both scrapers failed to fetch profile data'
    }
  }

  async fetchBasicProfile(username: string): Promise<BasicAnalyticsResponse> {
    try {
      const endpoint = `/api/v1/inhouse/instagram/profile/${username}/basic`
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching basic profile:', error)
      return {
        success: false,
        data: {} as BasicProfileResponse,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async testConnection(): Promise<HealthCheckResponse> {
    try {
      const endpoint = '/api/v1/inhouse/test'
      
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error testing connection:', error)
      throw error
    }
  }

  async fetchHealthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching health check:', error)
      throw error
    }
  }

  async batchAnalysis(usernames: string[]): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/batch/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernames }),
      })
      return await response.json()
    } catch (error) {
      console.error('Error performing batch analysis:', error)
      throw error
    }
  }

  async discoverByHashtags(hashtags: string[], filters: Record<string, unknown> = {}): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/discovery/hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtags, filters }),
      })
      return await response.json()
    } catch (error) {
      console.error('Error discovering by hashtags:', error)
      throw error
    }
  }

  async analyzeHashtag(hashtag: string): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hashtags/${hashtag}/analysis`)
      return await response.json()
    } catch (error) {
      console.error('Error analyzing hashtag:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
export default apiService