"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Users, MessageCircle, ImageIcon, Shield, Zap, TrendingUp } from 'lucide-react'
import { ProfileImageWithFallback } from './profile-image-with-fallback'
import { getOptimizedProfilePicture } from '@/utils/cdnUtils'

interface ProfileCardProps {
  profile: {
    username: string
    full_name: string | null
    biography: string | null
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
    profile_pic_url: string | null
    cdn_url_512?: string | null
    cdn_avatar_url?: string | null
    cdn_urls?: {
      avatar_256?: string
      avatar_512?: string
    }
    ai_analysis?: {
      // Core AI Analysis (always available)
      primary_content_type: string | null
      avg_sentiment_score: number | null
      content_quality_score?: number

      // Advanced AI Analysis (now always available)
      audience_quality_assessment?: {
        authenticity_score: number
        bot_percentage: number
        engagement_quality: string
      }
      visual_content_analysis?: {
        aesthetic_score: number
        color_consistency: number
        composition_quality: string
      }
      fraud_detection_analysis?: {
        fraud_risk_score: number
        brand_safety_score: number
      }
      comprehensive_insights?: {
        overall_authenticity_score: number
        content_quality_rating: number
        fraud_risk_level: string
        engagement_trend: string
        lifecycle_stage: string
      }

      // Metadata
      comprehensive_analysis_version?: string
      models_success_rate?: number
    }
    data_source?: string
    performance?: {
      total_time_seconds: number
    }
  }
  showAI?: boolean
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, showAI = false }) => {
  // Use CDN-optimized URL with fallback
  const profileImageUrl = getOptimizedProfilePicture(profile) || '/placeholder-avatar.webp'

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getSentimentBadge = (score: number | null) => {
    if (score === null) return null
    
    if (score > 0.3) return <Badge className="bg-green-100 text-green-800">Positive</Badge>
    if (score < -0.3) return <Badge className="bg-red-100 text-red-800">Negative</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ProfileImageWithFallback
            src={profileImageUrl}
            fallback={profile.profile_pic_url}
            alt={profile.username}
            className="h-12 w-12"
            isPlaceholder={false}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span>@{profile.username}</span>
              {profile.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
            </div>
            {profile.full_name && (
              <span className="text-sm text-muted-foreground">
                {profile.full_name}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.biography && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {profile.biography}
          </p>
        )}
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{formatNumber(profile.followers_count)}</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{formatNumber(profile.following_count)}</span>
            <span className="text-xs text-muted-foreground">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-semibold">{formatNumber(profile.posts_count)}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
        </div>

        {showAI && profile.ai_analysis && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm">AI Analysis</h4>

              {/* Primary Content & Sentiment */}
              <div className="flex flex-wrap gap-2">
                {profile.ai_analysis.primary_content_type && (
                  <Badge variant="outline">
                    {profile.ai_analysis.primary_content_type}
                  </Badge>
                )}
                {getSentimentBadge(profile.ai_analysis.avg_sentiment_score)}
              </div>

              {/* Advanced Metrics - Now Always Available */}
              {profile.ai_analysis.comprehensive_insights && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-green-600">
                      {profile.ai_analysis.comprehensive_insights.overall_authenticity_score}%
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" />
                      Authentic
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-blue-600">
                      {profile.ai_analysis.comprehensive_insights.content_quality_rating}%
                    </span>
                    <span className="text-xs text-muted-foreground">Quality</span>
                  </div>
                  <div className="flex flex-col">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        profile.ai_analysis.comprehensive_insights.fraud_risk_level === 'low'
                          ? 'text-green-600 border-green-600'
                          : profile.ai_analysis.comprehensive_insights.fraud_risk_level === 'medium'
                          ? 'text-yellow-600 border-yellow-600'
                          : 'text-red-600 border-red-600'
                      }`}
                    >
                      {profile.ai_analysis.comprehensive_insights.fraud_risk_level} risk
                    </Badge>
                  </div>
                </div>
              )}

              {/* Data Source Indicator */}
              {profile.data_source && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className={`h-3 w-3 ${profile.data_source === 'database_fast_path' ? 'text-yellow-500' : 'text-blue-500'}`} />
                    {profile.data_source === 'database_fast_path' ? 'Cached' : 'Fresh'} Analysis
                  </span>
                  {profile.performance && (
                    <span>{profile.performance.total_time_seconds.toFixed(1)}s</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  )
}