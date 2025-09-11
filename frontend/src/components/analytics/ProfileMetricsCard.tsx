'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  UserPlus, 
  Grid3x3, 
  Heart, 
  TrendingUp,
  Shield,
  Star,
  Globe
} from 'lucide-react'
import { CreatorProfile } from './CreatorAnalyticsDashboard'

interface ProfileMetricsCardProps {
  profile: CreatorProfile
}

export function ProfileMetricsCard({ profile }: ProfileMetricsCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getEngagementRateColor = (rate: number): string => {
    if (rate >= 0.06) return 'text-green-600'
    if (rate >= 0.03) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Followers Metric */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Followers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(profile.followers_count)}</div>
          {profile.engagement_metrics && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              {getTrendIcon(profile.engagement_metrics.engagement_trend)}
              <span>{profile.engagement_metrics.engagement_trend}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Following Metric */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Following</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(profile.following_count)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Ratio: {(profile.followers_count / profile.following_count).toFixed(0)}:1
          </div>
        </CardContent>
      </Card>

      {/* Posts Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posts</CardTitle>
          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(profile.posts_count)}</div>
          {profile.engagement_metrics && (
            <div className="text-xs text-muted-foreground mt-1">
              {profile.engagement_metrics.posting_frequency}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {profile.engagement_metrics ? (
            <div 
              className={`text-2xl font-bold ${getEngagementRateColor(profile.engagement_metrics.engagement_rate)}`}
            >
              {formatPercentage(profile.engagement_metrics.engagement_rate)}
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Industry average: 3.0%
          </div>
        </CardContent>
      </Card>

      {/* AI Content Quality Score (Stage 2 only) */}
      {profile.ai_content_quality_score !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Quality</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(profile.ai_content_quality_score * 10).toFixed(1)}/10
            </div>
            <Progress 
              value={profile.ai_content_quality_score * 100} 
              className="w-full mt-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Brand Safety Score (Stage 2 only) */}
      {profile.brand_safety && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Safety</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(profile.brand_safety.safety_score)}
            </div>
            <Badge variant="secondary" className="mt-1">
              {profile.brand_safety.content_appropriateness}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Authenticity Score (Stage 2 only) */}
      {profile.authenticity_metrics && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(profile.authenticity_metrics.authenticity_score)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPercentage(profile.authenticity_metrics.fake_follower_percentage)} fake followers
            </div>
          </CardContent>
        </Card>
      )}

      {/* Average Engagement (Stage 2 only) */}
      {profile.engagement_metrics && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Likes:</span>
                <span className="font-semibold">{formatNumber(profile.engagement_metrics.avg_likes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Comments:</span>
                <span className="font-semibold">{formatNumber(profile.engagement_metrics.avg_comments)}</span>
              </div>
            </div>
            {profile.engagement_metrics.best_performing_time && (
              <div className="text-xs text-muted-foreground mt-2">
                Best time: {profile.engagement_metrics.best_performing_time}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}