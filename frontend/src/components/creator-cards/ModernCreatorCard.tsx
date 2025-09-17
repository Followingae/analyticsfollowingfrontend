"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  CheckCircle,
  Building,
  Target,
  Brain,
  Sparkles,
  MapPin,
  ExternalLink,
  Star,
  Verified,
  Crown,
  Zap
} from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ProfileImage } from '@/components/ProfileImage'
import { getCountryCode } from '@/lib/countryUtils'
import { toast } from 'sonner'
import { CreatorProfile } from '@/services/creatorApi'

interface ModernCreatorCardProps {
  creator: CreatorProfile
  variant?: 'default' | 'compact' | 'featured'
  showAnalyticsButton?: boolean
  showAddButton?: boolean
  onAnalyticsClick?: (creator: CreatorProfile) => void
  onAddClick?: (creator: CreatorProfile) => void
}

export function ModernCreatorCard({
  creator,
  variant = 'default',
  showAnalyticsButton = true,
  showAddButton = true,
  onAnalyticsClick,
  onAddClick
}: ModernCreatorCardProps) {
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

  const openInstagram = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://www.instagram.com/${creator.username}/`, '_blank')
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

  if (variant === 'compact') {
    return (
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-md">
                <AvatarImage
                  src={creator.profile_pic_url || `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`}
                  alt={creator.username}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('cdn.following.ae')) {
                      target.src = `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`;
                    }
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                  {creator.full_name?.charAt(0) || creator.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {creator.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{creator.full_name || creator.username}</h3>
              <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <TierBadge tier={tier} />
                {hasAI && (
                  <Badge className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
                    AI
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold">{formatNumber(creator.followers_count)}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      {/* Gradient overlay that appears on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Country flag - top left */}
      {creator.country_block && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-1.5 shadow-sm backdrop-blur-sm">
            <ReactCountryFlag
              countryCode={getCountryCode(creator.country_block)}
              svg
              style={{
                width: '16px',
                height: '12px',
                borderRadius: '2px'
              }}
              title={creator.country_block}
            />
          </div>
        </div>
      )}

      {/* AI badge - top right */}
      {hasAI && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 shadow-md">
            <Brain className="h-3 w-3 mr-1" />
            AI Enhanced
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        {/* Avatar with enhanced styling */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl scale-110 opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            <Avatar className="relative h-20 w-20 border-4 border-white dark:border-gray-800 shadow-lg">
              <AvatarImage
                src={creator.profile_pic_url || `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`}
                alt={creator.username}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('cdn.following.ae')) {
                    target.src = `https://cdn.following.ae/profiles/ig/${creator.username}/profile_picture.webp`;
                  }
                }}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-semibold">
                {creator.full_name?.charAt(0) || creator.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {creator.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-2 border-white dark:border-gray-800">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Name and username */}
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold leading-tight">
            {creator.full_name || creator.username}
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            @{creator.username}
          </CardDescription>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <TierBadge tier={tier} />

          {hasAI && creator.ai_insights?.content_category && (
            <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
              <Target className="h-3 w-3 mr-1" />
              {creator.ai_insights.content_category}
            </Badge>
          )}

          {creator.is_business_account && (
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
              <Building className="h-3 w-3 mr-1" />
              Business
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
            <div className="text-xl font-bold text-primary">{formatNumber(creator.followers_count)}</div>
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Followers
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
            <div className="text-xl font-bold text-primary">
              {creator.engagement_rate ? `${creator.engagement_rate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Heart className="h-3 w-3" />
              Engagement
            </div>
          </div>
        </div>

        {/* AI insights */}
        {hasAI && (
          <div className="space-y-3">
            <Separator />

            {/* Quality score */}
            {creator.ai_insights?.content_quality_score && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">AI Quality Score</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    <span className="font-bold text-sm">
                      {creator.ai_insights.content_quality_score.toFixed(1)}/10
                    </span>
                  </div>
                </div>
                <Progress
                  value={creator.ai_insights.content_quality_score * 10}
                  className="h-2"
                />
              </div>
            )}

            {/* Sentiment */}
            {creator.ai_insights?.average_sentiment !== undefined && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Sentiment Analysis</span>
                  <Badge
                    variant={creator.ai_insights.average_sentiment > 0.1 ? 'default' : creator.ai_insights.average_sentiment < -0.1 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {creator.ai_insights.average_sentiment > 0.1 ? 'Positive' :
                     creator.ai_insights.average_sentiment < -0.1 ? 'Negative' : 'Neutral'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 space-y-3">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {showAnalyticsButton && (
            <Button
              size="sm"
              onClick={handleAnalyticsClick}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          )}
          {showAddButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>

        {/* Instagram link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openInstagram}
          className="w-full text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Instagram
        </Button>
      </CardFooter>
    </Card>
  )
}