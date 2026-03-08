'use client'

import React, { useState, useEffect, useRef } from 'react'
import ReactCountryFlag from 'react-country-flag'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Users,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Clock,
  Heart,
  MessageCircle,
  Lock,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'
import { getCountryName } from '@/utils/countryNames'
import { normalizeFancyUnicode } from '@/utils/formatUtils'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { superadminApi } from '@/services/superadminApi'
import { SuperadminIMDPanel } from '@/components/analytics/SuperadminIMDPanel'
import type { MasterInfluencer } from '@/types/influencerDatabase'

import { OverviewTab } from '@/components/analytics/creator-tabs/OverviewTab'
import { AudienceTab } from '@/components/analytics/creator-tabs/AudienceTab'
import { ContentTab } from '@/components/analytics/creator-tabs/ContentTab'
import { PostsTab } from '@/components/analytics/creator-tabs/PostsTab'

interface ComprehensiveCreatorAnalyticsProps {
  username: string
}

const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function ComprehensiveCreatorAnalyticsComponent({ username }: ComprehensiveCreatorAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [imdInfluencer, setImdInfluencer] = useState<MasterInfluencer | null>(null)
  const imdFetchedRef = useRef<string | null>(null)

  const { isSuperAdmin } = useEnhancedAuth()

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const response = await comprehensiveAnalyticsApi.getCompleteDashboardData(username, { forceRefresh })
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchIMDData = async () => {
    try {
      const res = await superadminApi.getInfluencerByUsername(username)
      if (res.success && res.data?.influencer) {
        setImdInfluencer(res.data.influencer)
      }
    } catch {
      // Not in master database — that's fine
    }
  }

  useEffect(() => {
    if (username) {
      fetchData()
    }
  }, [username])

  useEffect(() => {
    if (username && isSuperAdmin && imdFetchedRef.current !== username) {
      imdFetchedRef.current = username
      fetchIMDData()
    }
  }, [username, isSuperAdmin])

  const handleUnlock = async () => {
    if (!data?.profileId) return
    try {
      setUnlocking(true)
      const result = await comprehensiveAnalyticsApi.unlockProfile(data.profileId)
      if (!result.success) {
        throw new Error(result.message || result.error || 'Unlock failed')
      }
      toast.success('Profile unlocked!')
      window.dispatchEvent(new CustomEvent('credit-balance-changed'))
      // Refetch full data now that profile is unlocked
      await fetchData(true)
    } catch (err: any) {
      if (err.message?.includes('Insufficient credits') || err.message?.includes('402')) {
        // Show insufficient credits feedback
        toast.error('Insufficient credits. Please purchase more credits to unlock this profile.')
      } else {
        toast.error(err.message || 'Failed to unlock profile')
      }
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-8 animate-pulse">
              <div className="h-32 w-32 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-5 bg-muted rounded w-24" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data || !data.profile) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
        </div>
      </Card>
    )
  }

  // Preview/locked state — profile not yet unlocked
  if (data.preview) {
    const previewProfile = data.profile
    return (
      <div className="space-y-6">
        {/* Preview Header */}
        <Card className="border-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-8">
              <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-xl ring-4 ring-primary/10 shrink-0">
                <AvatarImage
                  src={previewProfile.cdn_avatar_url || previewProfile.profile_pic_url_hd || previewProfile.profile_pic_url}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {previewProfile.full_name?.charAt(0) || previewProfile.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold truncate">{previewProfile.full_name || previewProfile.username}</h1>
                  {previewProfile.is_verified && <CheckCircle className="h-6 w-6 text-blue-500 shrink-0" />}
                </div>
                <p className="text-xl text-muted-foreground">@{previewProfile.username}</p>
                {previewProfile.biography && (
                  <div className="flex items-start gap-2.5 max-w-2xl">
                    <span className="shrink-0 mt-0.5 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      bio
                    </span>
                    <p className="text-sm text-muted-foreground line-clamp-2 font-sans tracking-normal leading-relaxed capitalize">
                      {normalizeFancyUnicode(previewProfile.biography).toLowerCase()}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{formatNumber(previewProfile.followers_count)}</span>
                    <span className="text-sm text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatNumber(previewProfile.posts_count)}</span>
                    <span className="text-sm text-muted-foreground">posts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatNumber(previewProfile.following_count)}</span>
                    <span className="text-sm text-muted-foreground">following</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unlock Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="py-10 text-center">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unlock Full Analytics</h2>
            <p className="text-muted-foreground mb-1">
              Get detailed AI insights, audience demographics, content analysis, and post-level data.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-semibold text-primary">25 credits</span> &middot; Unlocked profiles accessible for 30 days
            </p>
            <Button
              size="lg"
              onClick={handleUnlock}
              disabled={unlocking}
              className="gap-2"
            >
              <Unlock className="h-4 w-4" />
              {unlocking ? 'Unlocking...' : 'Unlock Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Blurred tab placeholders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Overview', 'Audience', 'Content', 'Posts'].map((tab) => (
            <Card key={tab} className="blur-sm opacity-50 pointer-events-none">
              <CardContent className="p-6 text-center">
                <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-3" />
                <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const profile = data.profile
  const posts = data.posts || profile.posts || []
  const analyticsSum = data.analytics_summary || profile.analytics_summary || {}

  // Backend nested structure from _format_ai_insights()
  const aiAnalysis = profile.ai_analysis || {}
  const audience = profile.audience || {}
  const content = profile.content || {}
  const engagement = profile.engagement || {}
  const security = profile.security || {}

  return (
    <div className="space-y-6">
      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <Card className="border-0 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-secondary" />

        <CardContent className="p-6 md:p-8">
          {/* Top row: Avatar + Identity + Scores */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-border shadow-lg shrink-0">
              <AvatarImage
                src={profile.cdn_avatar_url || profile.profile_pic_url_hd || profile.profile_pic_url}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Identity block */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name + verified */}
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                  {profile.full_name || profile.username}
                </h1>
                {profile.is_verified && <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />}
              </div>

              {/* Username + meta badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base text-muted-foreground">@{profile.username}</span>
                {profile.detected_country && (
                  <Badge variant="outline" className="gap-1 font-normal text-xs">
                    <ReactCountryFlag
                      countryCode={profile.detected_country}
                      svg
                      style={{ width: '1em', height: '1em' }}
                      title={getCountryName(profile.detected_country)}
                    />
                    {getCountryName(profile.detected_country)}
                  </Badge>
                )}
                {profile.is_business_account && (
                  <Badge variant="secondary" className="text-xs font-normal">Business</Badge>
                )}
                {profile.category && (
                  <Badge variant="outline" className="capitalize text-xs font-normal">{profile.category}</Badge>
                )}
              </div>

              {/* External link */}
              {profile.external_url && (
                <a
                  href={profile.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {new URL(profile.external_url).hostname.replace('www.', '')}
                </a>
              )}
            </div>

            {/* AI score pills — right side on desktop */}
            <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
              {aiAnalysis.content_quality_score != null && (
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Quality</span>
                  <span className="text-sm font-bold text-primary">
                    {safeToFixed(aiAnalysis.content_quality_score, 0)}
                  </span>
                </div>
              )}
              {profile.influence_score != null && (
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Influence</span>
                  <span className="text-sm font-bold text-primary">
                    {safeToFixed(profile.influence_score, 0)}
                  </span>
                </div>
              )}
              {aiAnalysis.primary_content_type && (
                <Badge variant="outline" className="capitalize text-xs font-normal">
                  {aiAnalysis.primary_content_type}
                </Badge>
              )}
              {profile.last_refreshed && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated {new Date(profile.last_refreshed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-5" />

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Followers</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(profile.followers_count)}</p>
                    {profile.follower_growth_rate != null && (
                      <p className={`text-xs font-medium ${Number(profile.follower_growth_rate) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {Number(profile.follower_growth_rate) >= 0 ? '+' : ''}{safeToFixed(profile.follower_growth_rate, 1)}% growth
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Following</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(profile.following_count)}</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Posts</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber(profile.posts_count)}</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                    <p className="text-2xl font-bold text-primary">{safeToFixed(profile.engagement_rate, 2)}%</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Likes</p>
                    <p className="text-2xl font-bold text-primary">
                      {profile.avg_likes != null ? formatNumber(profile.avg_likes) : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Comments</p>
                    <p className="text-2xl font-bold text-primary">
                      {profile.avg_comments != null ? formatNumber(profile.avg_comments) : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ── Superadmin: Master Database Panel ──────────────────────────── */}
      {isSuperAdmin && imdInfluencer && (
        <SuperadminIMDPanel
          influencer={imdInfluencer}
          onUpdated={fetchIMDData}
        />
      )}

      {/* ── Tab sections ────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            profile={profile}
            aiAnalysis={aiAnalysis}
            engagement={engagement}
            audience={audience}
            content={content}
            analyticsSum={analyticsSum}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab
            content={content}
            aiAnalysis={aiAnalysis}
            engagement={engagement}
            posts={posts}
          />
        </TabsContent>

        <TabsContent value="audience">
          <AudienceTab
            audience={audience}
            security={security}
          />
        </TabsContent>

        <TabsContent value="posts">
          <PostsTab
            posts={posts}
            analyticsSum={analyticsSum}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ComprehensiveCreatorAnalyticsComponent as ComprehensiveCreatorAnalytics }
