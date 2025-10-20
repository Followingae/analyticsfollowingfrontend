"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Users, MessageCircle, ImageIcon } from 'lucide-react'
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
      primary_content_type: string | null
      avg_sentiment_score: number | null
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
            <div className="space-y-2">
              <h4 className="font-medium text-sm">AI Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {profile.ai_analysis.primary_content_type && (
                  <Badge variant="outline">
                    {profile.ai_analysis.primary_content_type}
                  </Badge>
                )}
                {getSentimentBadge(profile.ai_analysis.avg_sentiment_score)}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  )
}