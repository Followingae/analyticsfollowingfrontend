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
import { CreatorProfile } from '@/services/creatorApi'

interface CreatorGridCardProps {
  creator: CreatorProfile
  onAnalyticsClick?: (creator: CreatorProfile) => void
  onAddClick?: (creator: CreatorProfile) => void
  showAddButton?: boolean
}

export function CreatorGridCard({
  creator,
  onAnalyticsClick,
  onAddClick,
  showAddButton = false
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
        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      },
      micro: {
        label: 'Micro',
        icon: Zap,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      },
      macro: {
        label: 'Macro',
        icon: TrendingUp,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
      },
      mega: {
        label: 'Mega',
        icon: Crown,
        className: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 dark:border-purple-700'
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

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/30 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:from-primary/10 transition-colors duration-500" />

      {/* Country flag */}
      {creator.country_block && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow-sm backdrop-blur-sm">
            <ReactCountryFlag
              countryCode={getCountryCode(creator.country_block)}
              svg
              style={{
                width: '14px',
                height: '10px',
                borderRadius: '2px'
              }}
              title={creator.country_block}
            />
          </div>
        </div>
      )}

      {/* AI badge */}
      {hasAI && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-1.5 py-0.5 shadow-sm">
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
            <Avatar className="relative h-16 w-16 border-3 border-white dark:border-gray-800 shadow-md">
              <AvatarImage src={creator.profile_pic_url} alt={creator.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-semibold">
                {creator.full_name?.charAt(0) || creator.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {creator.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                <CheckCircle className="h-3 w-3 text-white" />
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
          <div className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-md border">
            <div className="text-sm font-bold text-primary">{formatNumber(creator.followers_count)}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-2.5 w-2.5" />
              Followers
            </div>
          </div>
          <div className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-md border">
            <div className="text-sm font-bold text-primary">
              {creator.engagement_rate ? `${creator.engagement_rate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Heart className="h-2.5 w-2.5" />
              Engagement
            </div>
          </div>
        </div>

        {/* AI Quality Score */}
        {hasAI && creator.ai_insights?.content_quality_score && (
          <div className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-md border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">AI Score</span>
              <div className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-yellow-500" />
                <span className="font-bold text-xs">
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
            className={`${showAddButton ? 'flex-1' : 'w-full'} bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs py-1.5`}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </Button>
          {showAddButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="px-2 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}