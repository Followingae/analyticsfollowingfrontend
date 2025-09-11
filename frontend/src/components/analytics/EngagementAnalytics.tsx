'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Clock,
  TrendingUp,
  BarChart3,
  Activity,
  Timer
} from 'lucide-react'

interface EngagementMetrics {
  avg_likes: number
  avg_comments: number
  engagement_rate: number
  engagement_trend: 'increasing' | 'stable' | 'decreasing'
  best_performing_time: string
  posting_frequency: string
}

interface EngagementAnalyticsProps {
  metrics: EngagementMetrics
}

export function EngagementAnalytics({ metrics }: EngagementAnalyticsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`
  }

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-yellow-600" />
    }
  }

  const getEngagementRateQuality = (rate: number): { label: string; color: string } => {
    if (rate >= 0.06) return { label: 'Excellent', color: 'text-green-600' }
    if (rate >= 0.03) return { label: 'Good', color: 'text-blue-600' }
    if (rate >= 0.01) return { label: 'Average', color: 'text-yellow-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const getPostingFrequencyColor = (frequency: string): string => {
    if (frequency.includes('daily')) return 'text-green-600'
    if (frequency.includes('weekly')) return 'text-blue-600'
    return 'text-yellow-600'
  }

  // Calculate engagement rates relative to follower benchmarks
  const engagementQuality = getEngagementRateQuality(metrics.engagement_rate)

  return (
    <div className="space-y-6">
      {/* Key Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(metrics.avg_likes)}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatNumber(metrics.avg_comments)}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${engagementQuality.color}`}>
              {formatPercentage(metrics.engagement_rate)}
            </div>
            <Badge variant="secondary" className="mt-1">
              {engagementQuality.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            {getTrendIcon(metrics.engagement_trend)}
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${getTrendColor(metrics.engagement_trend)}`}>
              {metrics.engagement_trend.charAt(0).toUpperCase() + metrics.engagement_trend.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              30-day trend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Rate Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engagement Rate Analysis
          </CardTitle>
          <CardDescription>
            Your engagement rate compared to industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Rate</span>
                <span className={`text-sm font-bold ${engagementQuality.color}`}>
                  {formatPercentage(metrics.engagement_rate)}
                </span>
              </div>
              <Progress 
                value={Math.min((metrics.engagement_rate / 0.1) * 100, 100)} 
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg border bg-muted/50">
                <div className="text-sm text-muted-foreground">Poor</div>
                <div className="font-semibold text-red-600">&lt; 1%</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-muted/50">
                <div className="text-sm text-muted-foreground">Good</div>
                <div className="font-semibold text-blue-600">3-6%</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-muted/50">
                <div className="text-sm text-muted-foreground">Excellent</div>
                <div className="font-semibold text-green-600">&gt; 6%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posting Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Optimal Timing
            </CardTitle>
            <CardDescription>
              Best times for maximum engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Best Performing Time</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {metrics.best_performing_time}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Posts published during this time receive highest engagement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Posting Frequency
            </CardTitle>
            <CardDescription>
              Content publishing consistency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Frequency</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 ${getPostingFrequencyColor(metrics.posting_frequency)}`}
                  >
                    {metrics.posting_frequency}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consistent posting helps maintain audience engagement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Breakdown
          </CardTitle>
          <CardDescription>
            Detailed analysis of interaction types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Likes Analysis */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Likes</span>
                </div>
                <span className="text-sm font-bold">
                  {formatNumber(metrics.avg_likes)} avg
                </span>
              </div>
              <Progress 
                value={75} // You can calculate this based on total engagement
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Primary engagement metric - shows content appeal
              </p>
            </div>

            {/* Comments Analysis */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Comments</span>
                </div>
                <span className="text-sm font-bold">
                  {formatNumber(metrics.avg_comments)} avg
                </span>
              </div>
              <Progress 
                value={25} // You can calculate this based on total engagement
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deep engagement - indicates strong audience connection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}