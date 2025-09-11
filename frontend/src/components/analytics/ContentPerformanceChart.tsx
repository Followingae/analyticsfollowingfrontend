'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  Star,
  Share,
  Eye,
  Target
} from 'lucide-react'

interface ContentPerformance {
  avg_likes_per_post: number
  avg_comments_per_post: number
  avg_shares_per_post: number
  most_engaging_content_type: string
  peak_engagement_hours: number[]
}

interface ContentPerformanceChartProps {
  performance: ContentPerformance
}

export function ContentPerformanceChart({ performance }: ContentPerformanceChartProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM'
    if (hour === 12) return '12:00 PM'
    if (hour < 12) return `${hour}:00 AM`
    return `${hour - 12}:00 PM`
  }

  const getEngagementScore = (likes: number, comments: number, shares: number): number => {
    // Weighted score: likes (weight: 1), comments (weight: 3), shares (weight: 2)
    return (likes * 1) + (comments * 3) + (shares * 2)
  }

  const totalEngagementScore = getEngagementScore(
    performance.avg_likes_per_post,
    performance.avg_comments_per_post,
    performance.avg_shares_per_post
  )

  return (
    <div className="space-y-6">
      {/* Content Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Likes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(performance.avg_likes_per_post)}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Comments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatNumber(performance.avg_comments_per_post)}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Shares</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(performance.avg_shares_per_post)}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {formatNumber(totalEngagementScore)}
            </div>
            <p className="text-xs text-muted-foreground">
              weighted total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Best Performing Content
          </CardTitle>
          <CardDescription>
            Content types that generate the highest engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/20">
              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2 mb-2">
                  {performance.most_engaging_content_type}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Most engaging content type
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <div className="text-2xl font-bold text-red-500 mb-1">
                  {formatNumber(performance.avg_likes_per_post)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Likes</div>
              </div>
              
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {formatNumber(performance.avg_comments_per_post)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Comments</div>
              </div>
              
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {formatNumber(performance.avg_shares_per_post)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Shares</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Engagement Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Peak Engagement Hours
          </CardTitle>
          <CardDescription>
            Times when your content receives the highest engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {performance.peak_engagement_hours.slice(0, 6).map((hour) => (
                <div 
                  key={hour}
                  className="text-center p-3 rounded-lg border bg-primary/10"
                >
                  <div className="font-bold text-primary">
                    {formatHour(hour)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Peak Time
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Optimization Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Schedule posts during peak hours for maximum reach</li>
                <li>• Focus on {performance.most_engaging_content_type.toLowerCase()} content for better engagement</li>
                <li>• Consider time zones of your primary audience</li>
                <li>• Test different posting times to find your optimal schedule</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Engagement Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of how your audience interacts with content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Likes Distribution */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Likes</span>
                <span className="text-sm font-bold">
                  {Math.round((performance.avg_likes_per_post / totalEngagementScore) * 100)}%
                </span>
              </div>
              <Progress 
                value={(performance.avg_likes_per_post / totalEngagementScore) * 100} 
                className="w-full"
              />
            </div>

            {/* Comments Distribution */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Comments</span>
                <span className="text-sm font-bold">
                  {Math.round(((performance.avg_comments_per_post * 3) / totalEngagementScore) * 100)}%
                </span>
              </div>
              <Progress 
                value={((performance.avg_comments_per_post * 3) / totalEngagementScore) * 100} 
                className="w-full"
              />
            </div>

            {/* Shares Distribution */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Shares</span>
                <span className="text-sm font-bold">
                  {Math.round(((performance.avg_shares_per_post * 2) / totalEngagementScore) * 100)}%
                </span>
              </div>
              <Progress 
                value={((performance.avg_shares_per_post * 2) / totalEngagementScore) * 100} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}