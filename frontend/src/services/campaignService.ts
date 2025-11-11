import { ApiResponse } from './types'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// Campaign types
interface Campaign {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'draft' | 'paused'
  budget: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  profile_count: number
  total_reach: number
  total_engagement: number
}

interface CampaignAnalytics {
  campaign_id: string
  campaign_name: string
  period: string
  daily_stats: Array<{
    date: string
    reach: number
    views: number
    impressions: number
    engagement: number
    clicks: number
  }>
  totals: {
    total_reach: number
    total_views: number
    total_impressions: number
    total_engagement: number
    total_clicks: number
    avg_engagement_rate: number
  }
  performance_insights: {
    best_performing_day: string
    peak_reach_day: string
    trend: 'increasing' | 'decreasing' | 'stable'
    growth_rate: number
  }
}

interface CurrentCampaign {
  current_campaign: {
    id: string
    name: string
    status: string
    days_remaining: number
    progress_percentage: number
    last_activity: string
  }
  recent_campaigns: Campaign[]
}

class CampaignService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithAuth(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }

  // Get all campaigns
  async getCampaigns(): Promise<ApiResponse<{ campaigns: Campaign[], pagination: any }>> {
    return this.request('/api/v1/campaigns/')
  }

  // Get campaign analytics
  async getCampaignAnalytics(campaignId: string, period: string = '30d'): Promise<ApiResponse<CampaignAnalytics>> {
    return this.request(`/api/v1/campaigns/${campaignId}/analytics?period=${period}`)
  }

  // Get current campaign
  async getCurrentCampaign(): Promise<ApiResponse<CurrentCampaign>> {
    return this.request<CurrentCampaign>('/api/v1/campaigns/current')
  }

  // Transform API analytics data to chart format
  transformToChartData(analytics: CampaignAnalytics) {
    return analytics.daily_stats.map(day => ({
      date: day.date,
      reach: day.reach,
      views: day.views,
      impressions: day.impressions,
      engagement: day.engagement,
      clicks: day.clicks
    }))
  }
}

export const campaignService = new CampaignService()
export type { Campaign, CampaignAnalytics, CurrentCampaign }