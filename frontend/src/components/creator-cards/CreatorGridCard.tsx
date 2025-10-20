"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Users,
  BarChart3,
  Plus,
  CheckCircle,
  Building,
  Target,
  Brain,
  Sparkles,
  ExternalLink,
  Star,
  Crown,
  Zap,
  TrendingUp
} from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getCountryCode } from '@/lib/countryUtils'
import { toast } from 'sonner'
import { CreatorProfile } from '@/types/creator'
import { getOptimizedProfilePicture, getOptimizedCountry } from '@/utils/cdnUtils'

interface CreatorGridCardProps {
  creator: CreatorProfile
  onAnalyticsClick?: (creator: CreatorProfile) => void
  onAddClick?: (creator: CreatorProfile) => void
  showAddButton?: boolean
  isAnalyzing?: boolean
}

export function CreatorGridCard({
  creator,
  onAnalyticsClick,
  onAddClick,
  showAddButton = false,
  isAnalyzing = false
}: CreatorGridCardProps) {
  const router = useRouter()


  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getInfluencerTier = (followerCount: number) => {
    if (followerCount >= 1000000) return 'mega'
    if (followerCount >= 100000) return 'macro'
    if (followerCount >= 10000) return 'micro'
    return 'nano'
  }

  const tier = getInfluencerTier(creator.followers_count)
  const hasAI = creator.ai_insights?.available

  const handleAnalyticsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAnalyticsClick) {
      onAnalyticsClick(creator)
    } else {
      if (!creator.username) {
        toast.error('Creator username is missing')
        return
      }
      const analyticsUrl = `/creator-analytics/${creator.username}`
      router.push(analyticsUrl)
    }
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddClick) {
      onAddClick(creator)
    } else {
      toast.info(`Add to list functionality coming soon for @${creator.username}`)
    }
  }

  // Tier Badge Component
  const TierBadge = ({ tier }: { tier: 'nano' | 'micro' | 'macro' | 'mega' }) => {
    const tierConfig = {
      nano: {
        label: 'Nano',
        icon: Star,
        className: 'bg-muted text-muted-foreground border-border'
      },
      micro: {
        label: 'Micro',
        icon: Zap,
        className: 'bg-primary/10 text-primary border-primary/20'
      },
      macro: {
        label: 'Macro',
        icon: TrendingUp,
        className: 'bg-primary/15 text-primary border-primary/30 font-medium'
      },
      mega: {
        label: 'Mega',
        icon: Crown,
        className: 'bg-gradient-to-r from-primary/20 to-primary/15 text-primary border-primary/40 font-semibold shadow-sm'
      }
    }

    const config = tierConfig[tier]
    const Icon = config.icon

    return (
      <Badge className={`text-xs font-medium ${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleCardClick = () => {
    if (!creator.username) {
      toast.error('Creator username is missing')
      return
    }
    const analyticsUrl = `/creator-analytics/${creator.username}`
    router.push(analyticsUrl)
  }

  return (
    <Card
      className="group relative overflow-hidden bg-card border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:from-primary/10 transition-colors duration-500 pointer-events-none" />

      {/* Country flag */}
      {getOptimizedCountry(creator) && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-background/80 border border-border rounded-full p-1 shadow-sm backdrop-blur-sm">
            <ReactCountryFlag
              countryCode={getCountryCode(getOptimizedCountry(creator)!)}
              svg
              style={{
                width: '14px',
                height: '10px',
                borderRadius: '2px'
              }}
              title={getOptimizedCountry(creator)!}
            />
          </div>
        </div>
      )}

      {/* AI badge */}
      {hasAI && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 shadow-sm">
            <Brain className="h-2.5 w-2.5 mr-1" />
            AI
          </Badge>
        </div>
      )}

      <CardContent className="p-4 space-y-4">
        {/* Avatar and basic info */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-lg scale-110 opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
            <Avatar className="relative h-16 w-16 border-3 border-background shadow-md">
              <AvatarImage
                src={creator.cdn_avatar_url || creator.profile_pic_url_hd || creator.profile_pic_url || `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`}
                alt={creator.username}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
                {creator.full_name?.charAt(0)?.toUpperCase() || creator.username?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            {creator.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-background">
                <CheckCircle className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm leading-tight line-clamp-1">
              {creator.full_name || creator.username}
            </h3>
            <p className="text-xs text-muted-foreground">@{creator.username}</p>
          </div>

          {/* Tier badge */}
          <div className="flex justify-center">
            <TierBadge tier={tier} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-md border border-border">
            <div className="text-sm font-bold text-primary">{formatNumber(creator.followers_count)}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-2.5 w-2.5" />
              Followers
            </div>
          </div>
          <div className="p-2 bg-muted/50 rounded-md border border-border">
            <div className="text-sm font-bold text-primary">
              {creator.engagement_rate ? `${creator.engagement_rate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Heart className="h-2.5 w-2.5" />
              Engagement
            </div>
          </div>
        </div>

        {/* AI Quality Score or Loading State */}
        {isAnalyzing ? (
          <div className="p-3 bg-muted/50 rounded-md border">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span className="text-xs text-muted-foreground">Processing</span>
            </div>
          </div>
        ) : hasAI && creator.ai_insights?.content_quality_score && (
          <div className="p-2 bg-primary/5 rounded-md border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">AI Score</span>
              <div className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-primary" />
                <span className="font-bold text-xs text-primary">
                  {creator.ai_insights.content_quality_score.toFixed(1)}/10
                </span>
              </div>
            </div>
            <Progress
              value={creator.ai_insights.content_quality_score * 10}
              className="h-1.5"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={handleAnalyticsClick}
            className={`${showAddButton ? 'flex-1' : 'w-full'} bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 text-xs py-1.5`}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </Button>
          {showAddButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="px-2 border-border hover:bg-muted hover:border-border transition-all duration-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}