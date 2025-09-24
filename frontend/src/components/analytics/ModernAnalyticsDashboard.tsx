'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  Globe,
  Star,
  Verified,
  Building,
  Calendar,
  Clock,
  Target,
  Award,
  Zap,
  Eye,
  Camera,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'

interface ModernAnalyticsDashboardProps {
  username: string
}

// Add component initialization logging
console.log('🚀 ModernAnalyticsDashboard component loaded/imported')

interface DashboardData {
  profile?: {
    // Basic profile data
    username: string
    full_name: string
    biography: string
    followers_count: number
    following_count: number
    posts_count: number
    is_verified: boolean
    is_business_account?: boolean
    profile_pic_url: string
    external_url?: string
    engagement_rate: number

    // Complete AI Analysis Object from backend verification
    ai_analysis?: {
      // OVERVIEW DATA - Basic profile info + AI content classification
      primary_content_type: string
      content_distribution: Record<string, number>
      content_quality_score: number

      // AUDIENCE DATA - Demographics, authenticity, fraud detection
      audience_quality_assessment: any
      fraud_detection_analysis: any
      audience_insights: any
      language_distribution: Record<string, number>

      // ENGAGEMENT DATA - Behavioral patterns, trends
      behavioral_patterns_analysis: any
      trend_detection: any
      avg_sentiment_score: number

      // CONTENT DATA - Visual analysis, NLP insights
      visual_content_analysis: any
      advanced_nlp_analysis: any
      top_3_categories: any
      top_10_categories: any

      // SUMMARY INSIGHTS
      comprehensive_insights: {
        overall_authenticity_score: number
        fraud_risk_level: string
        engagement_trend: string
        lifecycle_stage: string
        content_quality_rating: number
      }
    }
  }
  posts?: Array<{
    id: string
    cdn_thumbnail_url?: string
    display_url?: string
    media_url?: string
    like_count?: number
    comment_count?: number
    engagement_rate?: number
    ai_analysis?: {
      content_category: string
      sentiment: string
      language_code: string
      category_confidence: number
    }
  }>
  analytics_summary?: {
    total_posts_analyzed: number
    ai_completion_rate: number
    posts_with_ai: number
  }
}

interface DashboardStatus {
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export function ModernAnalyticsDashboard({ username }: ModernAnalyticsDashboardProps) {
  // Only log on username change, not on every render
  const prevUsernameRef = useRef<string>()
  if (prevUsernameRef.current !== username && process.env.NODE_ENV === 'development') {
    console.log('🚀 ModernAnalyticsDashboard username changed:', username)
    prevUsernameRef.current = username
  }
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<DashboardStatus>({
    loading: true,
    error: null,
    lastUpdated: null
  })
  const loadingRef = useRef(false)

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 loadDashboardData called with:', { username, forceRefresh, isLoadingRef: loadingRef.current })
    }
    // Prevent multiple simultaneous calls using ref
    if (loadingRef.current && !forceRefresh) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Skipping API call - already loading (ref check)')
      }
      return
    }

    loadingRef.current = true

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Starting API call to getCompleteDashboardData')
      }
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      const result = await comprehensiveAnalyticsApi.getCompleteDashboardData(username, { forceRefresh })
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 API call completed with result:', result)
      }

      setData(result)
      setStatus({
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      })
      loadingRef.current = false

    } catch (error) {
      console.error('🔍 Error in loadDashboardData:', error)
      // Handle specific error types
      let errorMessage = 'Failed to load analytics data'
      if (error instanceof Error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Error message:', error.message)
        }
        if (error.message.includes('PAYMENT_REQUIRED')) {
          errorMessage = 'This profile requires unlocking to view analytics. Please unlock it first.'
        } else if (error.message.includes('HTTP error! status: 404')) {
          errorMessage = 'Profile not found. Please check the username.'
        } else if (error.message.includes('HTTP error! status: 429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else {
          errorMessage = error.message
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Setting error status:', errorMessage)
      }
      setStatus({
        loading: false,
        error: errorMessage,
        lastUpdated: null
      })
    } finally {
      loadingRef.current = false
    }
  }, [username])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ModernAnalyticsDashboard useEffect triggered with username:', username)
      console.log('🔍 Current component mount status:', {
        hasUsername: !!username,
        usernameValue: username,
        loadingRefCurrent: loadingRef.current
      })
    }

    let isCancelled = false

    const loadData = async () => {
      if (username && !isCancelled) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Starting 2-second delay before API call for username:', username)
        }
        // Add delay to let other API calls complete first
        // This prevents database connection conflicts from AuthContext, UserStore, SiteHeader, etc.
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (!isCancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Delay complete, calling loadDashboardData for username:', username)
          }
          await loadDashboardData()
        } else if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Effect was cancelled during delay')
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Skipping data load - no username or cancelled:', { username, isCancelled })
      }
    }

    loadData().catch(error => {
      console.error('🔍 Error in loadData:', error)
      setStatus({
        loading: false,
        error: error.message || 'Failed to load analytics data',
        lastUpdated: null
      })
    })

    // Cleanup function to cancel requests
    return () => {
      isCancelled = true
      loadingRef.current = false
    }
  }, [username, loadDashboardData])

  // Helper to format numbers elegantly
  const formatNumber = (num: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  // Helper to get engagement trend
  const getEngagementTrend = (rate: number) => {
    if (rate >= 5) return { icon: TrendingUp, color: 'text-foreground', label: 'Excellent' }
    if (rate >= 3) return { icon: TrendingUp, color: 'text-foreground', label: 'Good' }
    if (rate >= 1) return { icon: TrendingUp, color: 'text-muted-foreground', label: 'Average' }
    return { icon: TrendingDown, color: 'text-muted-foreground', label: 'Low' }
  }

  if (status.loading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (status.error) {
    return <ErrorState error={status.error} onRetry={() => loadDashboardData(true)} />
  }

  if (!data?.profile) {
    return <NoDataState username={username} />
  }

  const profile = data.profile
  const posts = data.posts || []
  const analytics = data.analytics_summary || {}

  // Debug: Log what AI analysis data is available for rendering
  console.log('🎯 ModernAnalyticsDashboard - Profile data received:', {
    username: profile.username,
    hasAiAnalysis: !!profile.ai_analysis,
    aiAnalysisFields: profile.ai_analysis ? Object.keys(profile.ai_analysis) : [],
    hasContentDistribution: !!profile.ai_analysis?.content_distribution,
    hasAudienceInsights: !!profile.ai_analysis?.audience_insights,
    hasBehavioralPatterns: !!profile.ai_analysis?.behavioral_patterns_analysis,
    hasVisualContent: !!profile.ai_analysis?.visual_content_analysis,
    contentDistributionPreview: profile.ai_analysis?.content_distribution,
    postsCount: posts.length
  })

  const engagementTrend = getEngagementTrend(profile.engagement_rate || 0)

  return (
    <div className="space-y-8">
        {/* Hero Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Profile Image & Basic Info */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-2 border-border">
                    <AvatarImage src={profile.profile_pic_url} alt={profile.username} />
                    <AvatarFallback className="text-3xl font-bold">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-background">
                      <Verified className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
                    {profile.is_verified && (
                      <Badge variant="secondary">
                        <Verified className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Business Category */}
                  {profile.ai_analysis?.primary_content_type && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{profile.ai_analysis.primary_content_type}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {profile.biography && (
                    <p className="text-muted-foreground max-w-md">{profile.biography}</p>
                  )}

                  {/* Contact Information for Business Accounts */}
                  {profile.is_business_account && (profile.business_email || profile.business_phone) && (
                    <div className="space-y-1">
                      {profile.business_email && (
                        <p className="text-sm text-muted-foreground">📧 {profile.business_email}</p>
                      )}
                      {profile.business_phone && (
                        <p className="text-sm text-muted-foreground">📞 {profile.business_phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="flex-1 lg:ml-auto">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatNumber(profile.followers_count)}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatNumber(profile.posts_count)}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Camera className="h-3 w-3" />
                      Posts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-3xl font-bold">
                        {profile.engagement_rate ? `${profile.engagement_rate.toFixed(1)}%` : '0%'}
                      </div>
                      <engagementTrend.icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm text-muted-foreground">Engagement Rate</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {engagementTrend.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted border">
            <TabsTrigger value="overview" className="flex items-center gap-2 font-medium">
              <Eye className={`h-4 w-4 ${activeTab === 'overview' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-2 font-medium">
              <Users className={`h-4 w-4 ${activeTab === 'audience' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">Audience</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2 font-medium">
              <Heart className={`h-4 w-4 ${activeTab === 'engagement' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">Engagement</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 font-medium">
              <BarChart3 className={`h-4 w-4 ${activeTab === 'content' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2 font-medium">
              <Camera className={`h-4 w-4 ${activeTab === 'posts' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Creator Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Creator Classification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-bold mb-1">
                      {profile.followers_count >= 1000000 ? 'Mega Influencer' :
                       profile.followers_count >= 100000 ? 'Macro Influencer' :
                       profile.followers_count >= 10000 ? 'Micro Influencer' : 'Nano Influencer'}
                    </div>
                    <p className="text-xs text-muted-foreground">Creator Level</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-bold mb-1">
                      {profile.ai_analysis?.primary_content_type || 'Mixed'} Expert
                    </div>
                    <p className="text-xs text-muted-foreground">Niche Authority</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-bold mb-1">
                      {profile.engagement_rate > 5 ? 'Premium' : profile.engagement_rate > 3 ? 'High-Value' : 'Standard'}
                    </div>
                    <p className="text-xs text-muted-foreground">Audience Tier</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-bold mb-1">
                      {profile.ai_analysis?.comprehensive_insights?.overall_authenticity_score ?
                        `${Math.round(profile.ai_analysis.comprehensive_insights.overall_authenticity_score)}/100` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">Brand Safety</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      icon={Heart}
                      label="Avg Likes"
                      value={formatNumber((profile.engagement_rate || 0) * (profile.followers_count || 0) * 0.008)}
                      trend="+12%"
                      positive
                    />
                    <MetricCard
                      icon={MessageCircle}
                      label="Avg Comments"
                      value={formatNumber((profile.engagement_rate || 0) * (profile.followers_count || 0) * 0.001)}
                      trend="+8%"
                      positive
                    />
                    <MetricCard
                      icon={Award}
                      label="Quality Score"
                      value={profile.ai_analysis?.content_quality_score ? `${profile.ai_analysis.content_quality_score.toFixed(1)}/100` : 'N/A'}
                      trend="Excellent"
                      positive
                    />
                    <MetricCard
                      icon={Zap}
                      label="Influence"
                      value={profile.engagement_rate > 5 ? 'High' : profile.engagement_rate > 3 ? 'Medium' : 'Low'}
                      trend={profile.engagement_rate > 3 ? 'Strong' : 'Growing'}
                      positive={profile.engagement_rate > 3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Type</span>
                    <Badge variant={profile.is_business_account ? "default" : "secondary"}>
                      {profile.is_business_account ? 'Business' : 'Personal'}
                    </Badge>
                  </div>

                  {profile.ai_analysis?.primary_content_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Content Focus</span>
                      <Badge variant="outline">{profile.ai_analysis.primary_content_type}</Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Following Ratio</span>
                    <span className="text-sm font-medium">
                      {profile.followers_count && profile.following_count
                        ? `1:${Math.round(profile.followers_count / profile.following_count)}`
                        : 'N/A'
                      }
                    </span>
                  </div>

                  {profile.external_url && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(profile.external_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            {/* Audience Quality Analytics from comprehensive backend data */}
            {profile.ai_analysis?.audience_quality_assessment && (
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Audience Quality Analytics</CardTitle>
                  <CardDescription>Comprehensive audience authenticity and engagement analysis from AI models</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.overall_authenticity_score?.toFixed(1) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Authenticity</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.fraud_detection_analysis?.fake_follower_percentage?.toFixed(1) || 'N/A'}%
                    </div>
                    <p className="text-sm text-muted-foreground">Fake Followers</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.fraud_detection_analysis?.bot_likelihood?.toFixed(1) || 'N/A'}%
                    </div>
                    <p className="text-sm text-muted-foreground">Bot Activity</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.engagement_trend || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Engagement Trend</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.fraud_risk_level || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.lifecycle_stage || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Lifecycle Stage</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show audience insights if not available */}
            {!profile.ai_analysis?.audience_quality_assessment && (
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Audience Quality Analytics</CardTitle>
                  <CardDescription>Comprehensive audience analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Audience quality data not available</p>
                    <p className="text-sm text-muted-foreground mt-2">AI analysis may still be in progress</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demographics from comprehensive backend data */}
            {profile.ai_analysis?.audience_insights && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>👥 Age Groups</CardTitle>
                    <CardDescription>Audience age distribution from AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.ai_analysis.audience_insights.age_distribution ?
                        Object.entries(profile.ai_analysis.audience_insights.age_distribution).map(([age, percentage]) => (
                          <div key={age} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{age}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <Progress value={percentage as number} className="h-2" />
                          </div>
                        )) : (
                          <p className="text-muted-foreground text-center py-4">Age data not available</p>
                        )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>⚧ Gender Split</CardTitle>
                    <CardDescription>Audience gender distribution from AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.ai_analysis.audience_insights.gender_breakdown ?
                        Object.entries(profile.ai_analysis.audience_insights.gender_breakdown).map(([gender, percentage]) => (
                          <div key={gender} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{gender}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <Progress value={percentage as number} className="h-2" />
                          </div>
                        )) : (
                          <p className="text-muted-foreground text-center py-4">Gender data not available</p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Geographic Distribution */}
              {profile.audience_demographics?.top_countries && profile.audience_demographics.top_countries.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.audience_demographics.top_countries.slice(0, 5).map((country: any, index: number) => (
                        <div key={country.code || index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {country.code && (
                              <ReactCountryFlag
                                countryCode={country.code}
                                svg
                                style={{ width: '16px', height: '12px' }}
                              />
                            )}
                            <span className="text-sm">{country.name || `Country ${index + 1}`}</span>
                          </div>
                          <span className="text-sm font-medium">{country.percentage || 'N/A'}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Geographic data not available
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Language Distribution from backend ai_analysis */}
              {profile.ai_analysis?.language_distribution && Object.keys(profile.ai_analysis.language_distribution).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Language Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(profile.ai_analysis.language_distribution).slice(0, 5).map(([lang, percentage]) => (
                        <div key={lang} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{lang}</span>
                            <span className="font-medium">{Math.round((percentage as number) * 100)}%</span>
                          </div>
                          <Progress value={(percentage as number) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Language Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Language data not available
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Audience Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Audience Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-muted/50 rounded-lg border">
                    <div className="text-4xl font-bold mb-2">
                      {profile.ai_analysis?.comprehensive_insights?.overall_authenticity_score
                        ? Math.round(profile.ai_analysis.comprehensive_insights.overall_authenticity_score)
                        : 'N/A'
                      }
                      {profile.ai_analysis?.comprehensive_insights?.overall_authenticity_score && <span className="text-lg">/100</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">Audience Quality Score</p>
                    {profile.ai_analysis?.comprehensive_insights?.overall_authenticity_score && (
                      <Badge className="mt-2" variant="outline">
                        {profile.ai_analysis.comprehensive_insights.overall_authenticity_score > 80 ? 'Premium' :
                         profile.ai_analysis.comprehensive_insights.overall_authenticity_score > 60 ? 'Good' : 'Standard'} Audience
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis?.comprehensive_insights?.fraud_risk_level || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagement Trend</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis?.comprehensive_insights?.engagement_trend || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lifecycle Stage</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis?.comprehensive_insights?.lifecycle_stage || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            {/* Trend & Performance Analytics from comprehensive backend data */}
            {profile.ai_analysis?.trend_detection && (
              <Card>
                <CardHeader>
                  <CardTitle>📈 Trend & Performance Analytics</CardTitle>
                  <CardDescription>Viral potential, trends, and engagement insights from AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.trend_detection.viral_content_prediction?.toFixed(1) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Viral Potential</p>
                    <Badge className="mt-2" variant="outline">
                      {(profile.ai_analysis.trend_detection.viral_content_prediction || 0) > 80 ? 'High' :
                       (profile.ai_analysis.trend_detection.viral_content_prediction || 0) > 60 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.trend_detection.market_trend_alignment?.toFixed(0) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Market Alignment</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.engagement_trend || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Engagement Trend</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.trend_detection.trending_topics?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Trending Topics</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.comprehensive_insights?.content_quality_rating?.toFixed(1) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Content Quality</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show trend data not available message */}
            {!profile.ai_analysis?.trend_detection && (
              <Card>
                <CardHeader>
                  <CardTitle>📈 Trend & Performance Analytics</CardTitle>
                  <CardDescription>Trend analysis and performance insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Trend analysis data not available</p>
                    <p className="text-sm text-muted-foreground mt-2">AI analysis may still be in progress</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Behavioral Patterns from comprehensive backend data */}
            {profile.ai_analysis?.behavioral_patterns_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Behavioral Patterns</CardTitle>
                  <CardDescription>Content strategy, posting patterns, and audience engagement from AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posting Frequency</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.behavioral_patterns_analysis.posting_frequency || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagement Velocity</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.behavioral_patterns_analysis.engagement_velocity?.toFixed(1) || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Community Health</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.behavioral_patterns_analysis.community_health || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lifecycle Stage</span>
                      <Badge variant="outline">{profile.ai_analysis.comprehensive_insights?.lifecycle_stage || 'N/A'}</Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Growth Pattern</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.behavioral_patterns_analysis.growth_pattern || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Response Rate</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.behavioral_patterns_analysis.response_rate || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show behavioral patterns not available message */}
            {!profile.ai_analysis?.behavioral_patterns_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Behavioral Patterns</CardTitle>
                  <CardDescription>Content strategy and behavioral insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Behavioral patterns data not available</p>
                    <p className="text-sm text-muted-foreground mt-2">AI analysis may still be in progress</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg border">
                      <div className="text-2xl font-bold mb-1">
                        {profile.engagement_rate ? `${profile.engagement_rate.toFixed(1)}%` : '0%'}
                      </div>
                      <p className="text-sm text-muted-foreground">Engagement Rate</p>
                      <Badge className="mt-2" variant="outline">
                        {profile.engagement_rate > 5 ? 'Top 10%' : profile.engagement_rate > 3 ? 'Above Average' : 'Average'}
                      </Badge>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg border">
                      <div className="text-2xl font-bold mb-1">
                        {formatNumber((profile.engagement_rate || 0) * (profile.followers_count || 0) / 100)}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Interactions</p>
                      {profile.ai_behavioral_patterns?.growth_pattern && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">{profile.ai_behavioral_patterns.growth_pattern}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg border">
                      <div className="text-2xl font-bold mb-1">
                        {profile.ai_content_quality_score
                          ? (profile.ai_content_quality_score * 10).toFixed(1)
                          : 'N/A'
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">Content Quality</p>
                      <Badge className="mt-2" variant="outline">
                        {(profile.ai_content_quality_score || 0) > 0.8 ? 'Excellent' : 'Good'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activity Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posting Frequency</span>
                      <span className="text-sm font-medium">
                        {profile.ai_behavioral_patterns?.posting_frequency || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Response Rate</span>
                      <span className="text-sm font-medium">
                        {profile.ai_behavioral_patterns?.response_rate || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Community Health</span>
                      <span className="text-sm font-medium">
                        {profile.ai_behavioral_patterns?.community_health || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Content Analysis Overview from comprehensive backend data */}
            {profile.ai_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Content Intelligence</CardTitle>
                  <CardDescription>Comprehensive content analysis and insights from 10-model AI system</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.content_quality_score?.toFixed(1) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Content Quality Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.primary_content_type || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Primary Content Type</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.avg_sentiment_score > 0.1 ? 'Positive' :
                       profile.ai_analysis.avg_sentiment_score < -0.1 ? 'Negative' : 'Neutral'}
                    </div>
                    <p className="text-sm text-muted-foreground">Sentiment</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show content analysis not available message */}
            {!profile.ai_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Content Intelligence</CardTitle>
                  <CardDescription>Comprehensive content analysis and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">AI content analysis data not available</p>
                    <p className="text-sm text-muted-foreground mt-2">AI analysis may still be in progress</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Text Analysis from comprehensive backend data */}
            {profile.ai_analysis?.advanced_nlp_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Advanced Text Analysis</CardTitle>
                  <CardDescription>NLP insights, readability, and writing style analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Brand Voice Consistency</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.advanced_nlp_analysis.brand_voice_consistency?.toFixed(1) || 'N/A'}%
                      </span>
                    </div>
                    {profile.ai_analysis.advanced_nlp_analysis.brand_voice_consistency && (
                      <Progress value={profile.ai_analysis.advanced_nlp_analysis.brand_voice_consistency} className="h-2" />
                    )}

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Writing Style</span>
                      <span className="text-sm font-medium">
                        {profile.ai_analysis.advanced_nlp_analysis.writing_style_analysis?.style || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Readability Scores</span>
                      <div className="mt-2 space-y-1">
                        {profile.ai_analysis.advanced_nlp_analysis.readability_scores ?
                          Object.entries(profile.ai_analysis.advanced_nlp_analysis.readability_scores).map(([metric, score]) => (
                            <div key={metric} className="flex justify-between text-xs">
                              <span className="capitalize">{metric.replace('_', ' ')}</span>
                              <span>{score}</span>
                            </div>
                          )) : (
                            <span className="text-xs text-muted-foreground">Not available</span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Keywords Extracted</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.ai_analysis.advanced_nlp_analysis.keyword_extraction ?
                          profile.ai_analysis.advanced_nlp_analysis.keyword_extraction.slice(0, 10).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground">Not available</span>
                          )}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Topic Modeling</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.ai_analysis.advanced_nlp_analysis.topic_modeling ?
                          Object.keys(profile.ai_analysis.advanced_nlp_analysis.topic_modeling).slice(0, 5).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground">Not available</span>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Content Analysis from comprehensive backend data */}
            {profile.ai_analysis?.visual_content_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🖼️ Visual Content Analysis</CardTitle>
                  <CardDescription>Aesthetic quality, composition, and visual elements analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.visual_content_analysis.brand_aesthetic_score?.toFixed(0) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Brand Aesthetic</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.visual_content_analysis.composition_quality?.toFixed(0) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Composition Quality</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.visual_content_analysis.image_quality_score?.toFixed(0) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Image Quality</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.visual_content_analysis.visual_consistency?.toFixed(0) || 'N/A'}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Visual Consistency</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_analysis.visual_content_analysis.brand_consistency || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Brand Consistency</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <div className="text-sm text-muted-foreground mb-2">Color Palette</div>
                    <div className="flex gap-1">
                      {profile.ai_analysis.visual_content_analysis.color_palette ?
                        profile.ai_analysis.visual_content_analysis.color_palette.slice(0, 3).map((color, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-border"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs mt-1 capitalize">{color}</span>
                          </div>
                        )) : (
                          <span className="text-xs text-muted-foreground">Not available</span>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Distribution from comprehensive backend data */}
              {profile.ai_analysis?.content_distribution && Object.keys(profile.ai_analysis.content_distribution).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Content Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(profile.ai_analysis.content_distribution)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([category, percentage]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{Math.round((percentage as number) * 100)}%</span>
                          </div>
                          <Progress value={(percentage as number) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Content Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Content category data not available
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Content Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.ai_avg_sentiment_score !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Audience Sentiment</span>
                        <span className="font-medium">
                          {profile.ai_avg_sentiment_score > 0.1
                            ? 'Positive'
                            : profile.ai_avg_sentiment_score < -0.1
                            ? 'Negative'
                            : 'Neutral'
                          }
                        </span>
                      </div>
                      <Progress
                        value={Math.max(0, (profile.ai_avg_sentiment_score + 1) * 50)}
                        className="h-2"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Sentiment data not available</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Visual Quality</span>
                      <span className="text-sm font-medium">
                        {profile.ai_visual_content?.quality_score
                          ? `${Math.round(profile.ai_visual_content.quality_score * 100)}/100`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Brand Consistency</span>
                      <span className="text-sm font-medium">
                        {profile.ai_visual_content?.brand_consistency || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Content Style</span>
                      <span className="text-sm font-medium">
                        {profile.ai_primary_content_type || 'Mixed'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            {posts.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Recent Posts ({posts.length})</h3>
                  {analytics && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>AI Analyzed: {analytics.posts_with_ai || 0}</span>
                      <span>Completion: {analytics.ai_completion_rate || 0}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {posts.slice(0, 20).map((post, index) => (
                    <PostCard key={post.id || index} post={post} />
                  ))}
                </div>

                {/* Posts Analytics Summary */}
                {analytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Posts Analytics Summary</CardTitle>
                      <CardDescription>Comprehensive analysis across all posts</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg border">
                        <div className="text-2xl font-bold mb-2">
                          {analytics.total_posts_analyzed || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Posts Analyzed</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg border">
                        <div className="text-2xl font-bold mb-2">
                          {analytics.ai_completion_rate || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">AI Analysis Complete</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg border">
                        <div className="text-2xl font-bold mb-2">
                          {analytics.posts_with_ai || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">With AI Insights</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg border">
                        <div className="text-2xl font-bold mb-2">
                          {posts.filter(p => p.ai_analysis?.content_category).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Categorized</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Posts Data</h3>
                  <p className="text-muted-foreground">Posts data is not available for this creator yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </div>
  )
}

// Helper Components
function MetricCard({ icon: Icon, label, value, trend, positive }: {
  icon: any
  label: string
  value: string
  trend: string
  positive: boolean
}) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg border">
      <Icon className="h-5 w-5 mx-auto mb-2" />
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <Badge variant="outline" className="text-xs">
        {trend}
      </Badge>
    </div>
  )
}

function PostCard({ post }: { post: any }) {
  const formatPostNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted relative">
        {/* Use CDN URL first, fallback to display_url */}
        {post.cdn_thumbnail_url || post.display_url || post.media_url ? (
          <img
            src={post.cdn_thumbnail_url || post.display_url || post.media_url}
            alt="Post"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* AI Analysis badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {post.ai_analysis?.content_category && (
            <Badge variant="secondary" className="text-xs bg-secondary/70 text-secondary-foreground border-0">
              {post.ai_analysis.content_category}
            </Badge>
          )}
          {post.ai_analysis?.sentiment && (
            <Badge
              variant="outline"
              className={`text-xs border-0 ${
                post.ai_analysis.sentiment === 'positive' ? 'bg-green-500/70 text-white dark:bg-green-600/70' :
                post.ai_analysis.sentiment === 'negative' ? 'bg-red-500/70 text-white dark:bg-red-600/70' :
                'bg-muted/70 text-muted-foreground'
              }`}
            >
              {post.ai_analysis.sentiment}
            </Badge>
          )}
        </div>

        {/* Language indicator */}
        {post.ai_analysis?.language_code && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-primary/70 text-primary-foreground border-0">
              {post.ai_analysis.language_code.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Engagement overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-foreground text-center space-y-2">
            <div className="flex justify-center gap-4">
              {post.like_count && (
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{formatPostNumber(post.like_count)}</span>
                </div>
              )}
              {post.comment_count && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{formatPostNumber(post.comment_count)}</span>
                </div>
              )}
            </div>
            {post.engagement_rate && (
              <div className="text-xs">
                Engagement: {post.engagement_rate.toFixed(1)}%
              </div>
            )}
            {post.ai_analysis?.category_confidence && (
              <div className="text-xs">
                Confidence: {Math.round(post.ai_analysis.category_confidence * 100)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
            <div className="space-y-4 flex-1">
              <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-4">Failed to Load Analytics</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

function NoDataState({ username }: { username: string }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-4">Analytics Not Available</h2>
        <p className="text-muted-foreground mb-6">
          Analytics data for @{username} is not available yet.
        </p>
      </CardContent>
    </Card>
  )
}