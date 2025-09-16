'use client'

import React, { useState, useEffect, useRef } from 'react'
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
    is_business: boolean
    profile_pic_url: string
    external_url?: string
    engagement_rate: number

    // AI Content Intelligence
    ai_content_analysis: {
      content_quality_score: number
      primary_content_type: string
      content_distribution: Record<string, number>
      language_distribution: Record<string, number>
      avg_sentiment_score: number
    }

    // Audience Quality Analytics
    ai_audience_quality: {
      authenticity_score: number
      bot_detection_score: number
      fake_follower_percentage: number
      engagement_consistency: number
      likes_comments_ratio: number
    }

    // Demographics & Insights
    ai_audience_insights: {
      age_groups: Record<string, number>
      gender_split: Record<string, number>
      geographic_reach: string
      peak_engagement_hours: string
      audience_loyalty: number
    }

    // Trend & Performance Analytics
    ai_trend_detection: {
      viral_potential_score: number
      content_freshness: number
      consistency_score: number
      high_performing_posts: number
      optimization_potential: number
    }

    // Advanced Text Analysis
    ai_advanced_nlp: {
      vocabulary_richness: number
      text_complexity: number
      top_keywords: Array<{word: string, count: number}>
      content_themes: string[]
      avg_caption_length: number
      emojis_used: number
    }

    // Visual Content Analysis
    ai_visual_content: {
      aesthetic_score: number
      professional_quality: number
      images_processed: number
      dominant_colors: Array<{color: string, percentage: number}>
      faces_detected: number
      brand_logos: number
    }

    // Fraud Detection
    ai_fraud_detection: {
      trust_score: number
      risk_level: string
      fraud_score: number
      bot_likelihood: number
    }

    // Behavioral Patterns
    ai_behavioral_patterns: {
      posting_consistency: number
      content_strategy_maturity: number
      audience_building_effectiveness: number
      current_stage: string
      growth_indicators: string[]
    }
  }
  posts?: any[]
  analytics_summary?: any
}

interface DashboardStatus {
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export function ModernAnalyticsDashboard({ username }: ModernAnalyticsDashboardProps) {
  console.log('🔍 ModernAnalyticsDashboard rendered with username:', username)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<DashboardStatus>({
    loading: true,
    error: null,
    lastUpdated: null
  })
  const loadingRef = useRef(false)

  const loadDashboardData = async (forceRefresh = false) => {
    console.log('🔍 loadDashboardData called with:', { username, forceRefresh, isLoadingRef: loadingRef.current })
    // Prevent multiple simultaneous calls using ref
    if (loadingRef.current && !forceRefresh) {
      console.log('🔍 Skipping API call - already loading (ref check)')
      return
    }

    loadingRef.current = true

    try {
      console.log('🔍 Starting API call to getCompleteDashboardData')
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      const result = await comprehensiveAnalyticsApi.getCompleteDashboardData(username, { forceRefresh })
      console.log('🔍 API call completed with result:', result)

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
        console.log('🔍 Error message:', error.message)
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

      console.log('🔍 Setting error status:', errorMessage)
      setStatus({
        loading: false,
        error: errorMessage,
        lastUpdated: null
      })
    } finally {
      loadingRef.current = false
    }
  }

  useEffect(() => {
    console.log('🔍 useEffect triggered with username:', username)
    let isCancelled = false

    const loadData = async () => {
      if (username && !isCancelled) {
        console.log('🔍 Starting 2-second delay before API call')
        // Add delay to let other API calls complete first
        // This prevents database connection conflicts from AuthContext, UserStore, SiteHeader, etc.
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (!isCancelled) {
          console.log('🔍 Delay complete, calling loadDashboardData')
          await loadDashboardData()
        } else {
          console.log('🔍 Effect was cancelled during delay')
        }
      } else {
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
  }, [username])

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
                  {profile.ai_content_analysis?.primary_content_type && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{profile.ai_content_analysis.primary_content_type}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {profile.biography && (
                    <p className="text-muted-foreground max-w-md">{profile.biography}</p>
                  )}

                  {/* Contact Information for Business Accounts */}
                  {profile.is_business && (profile.business_email || profile.business_phone) && (
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
                      {profile.ai_content_analysis?.primary_content_type || 'Mixed'} Expert
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
                      {profile.ai_fraud_detection?.trust_score ? `${Math.round(profile.ai_fraud_detection.trust_score)}/100` : 'N/A'}
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
                      value={profile.ai_content_analysis?.content_quality_score ? `${profile.ai_content_analysis.content_quality_score.toFixed(1)}/100` : 'N/A'}
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
                    <Badge variant={profile.is_business ? "default" : "secondary"}>
                      {profile.is_business ? 'Business' : 'Personal'}
                    </Badge>
                  </div>

                  {profile.ai_content_analysis?.primary_content_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Content Focus</span>
                      <Badge variant="outline">{profile.ai_content_analysis.primary_content_type}</Badge>
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
            {/* Audience Quality Analytics */}
            {profile.ai_audience_quality && (
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Audience Quality Analytics</CardTitle>
                  <CardDescription>Comprehensive audience authenticity and engagement analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_quality.authenticity_score.toFixed(1)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Authenticity Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_quality.fake_follower_percentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Fake Followers</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_quality.bot_detection_score.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Bot Activity</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_quality.engagement_consistency.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Engagement Consistency</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_quality.likes_comments_ratio.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">Likes/Comments Ratio</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_audience_insights?.audience_loyalty || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Audience Loyalty</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demographics */}
            {profile.ai_audience_insights && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>👥 Age Groups</CardTitle>
                    <CardDescription>Audience age distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(profile.ai_audience_insights.age_groups).map(([age, percentage]) => (
                        <div key={age} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{age}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <Progress value={percentage as number} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>⚧ Gender Split</CardTitle>
                    <CardDescription>Audience gender distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(profile.ai_audience_insights.gender_split).map(([gender, percentage]) => (
                        <div key={gender} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{gender}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <Progress value={percentage as number} className="h-2" />
                        </div>
                      ))}
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

              {/* Demographics */}
              {/* Demographics */}
              {profile.ai_content_analysis?.language_distribution && Object.keys(profile.ai_content_analysis.language_distribution).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Language Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(profile.ai_content_analysis.language_distribution).slice(0, 5).map(([lang, percentage]) => (
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
                      {profile.ai_fraud_detection?.trust_score
                        ? Math.round(profile.ai_fraud_detection.trust_score)
                        : 'N/A'
                      }
                      {profile.ai_fraud_detection?.trust_score && <span className="text-lg">/100</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">Audience Quality Score</p>
                    {profile.ai_fraud_detection?.trust_score && (
                      <Badge className="mt-2" variant="outline">
                        {profile.ai_fraud_detection.trust_score > 80 ? 'Premium' :
                         profile.ai_fraud_detection.trust_score > 60 ? 'Good' : 'Standard'} Audience
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Authenticity Score</span>
                      <span className="text-sm font-medium">
                        {profile.ai_fraud_detection?.authenticity_score
                          ? `${Math.round(profile.ai_fraud_detection.authenticity_score * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fake Followers</span>
                      <span className="text-sm font-medium">
                        {profile.ai_fraud_detection?.fake_follower_percentage
                          ? `${Math.round(profile.ai_fraud_detection.fake_follower_percentage * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Growth Pattern</span>
                      <span className="text-sm font-medium">
                        {profile.ai_fraud_detection?.growth_pattern || profile.ai_behavioral_patterns?.growth_pattern || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            {/* Trend & Performance Analytics */}
            {profile.ai_trend_detection && (
              <Card>
                <CardHeader>
                  <CardTitle>📈 Trend & Performance Analytics</CardTitle>
                  <CardDescription>Viral potential, content freshness, and optimization insights</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_trend_detection.viral_potential_score.toFixed(1)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Viral Potential</p>
                    <Badge className="mt-2" variant="outline">
                      {profile.ai_trend_detection.viral_potential_score > 80 ? 'High' :
                       profile.ai_trend_detection.viral_potential_score > 60 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_trend_detection.content_freshness.toFixed(0)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Content Freshness</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_trend_detection.consistency_score.toFixed(0)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Consistency Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_trend_detection.high_performing_posts}
                    </div>
                    <p className="text-sm text-muted-foreground">High-Performing Posts</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_trend_detection.optimization_potential.toFixed(1)}x
                    </div>
                    <p className="text-sm text-muted-foreground">Optimization Potential</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Behavioral Patterns */}
            {profile.ai_behavioral_patterns && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Behavioral Patterns</CardTitle>
                  <CardDescription>Content strategy, posting consistency, and audience building effectiveness</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posting Consistency</span>
                      <span className="text-sm font-medium">{profile.ai_behavioral_patterns.posting_consistency}/100</span>
                    </div>
                    <Progress value={profile.ai_behavioral_patterns.posting_consistency} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Content Strategy Maturity</span>
                      <span className="text-sm font-medium">{profile.ai_behavioral_patterns.content_strategy_maturity}/100</span>
                    </div>
                    <Progress value={profile.ai_behavioral_patterns.content_strategy_maturity} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Audience Building Effectiveness</span>
                      <span className="text-sm font-medium">{profile.ai_behavioral_patterns.audience_building_effectiveness}/100</span>
                    </div>
                    <Progress value={profile.ai_behavioral_patterns.audience_building_effectiveness} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Stage</span>
                      <Badge variant="outline">{profile.ai_behavioral_patterns.current_stage}</Badge>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Growth Indicators</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.ai_behavioral_patterns.growth_indicators.map((indicator, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
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
            {/* Content Analysis Overview */}
            {profile.ai_content_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Content Intelligence</CardTitle>
                  <CardDescription>Comprehensive content analysis and insights</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_content_analysis.content_quality_score.toFixed(1)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Content Quality Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_content_analysis.primary_content_type}
                    </div>
                    <p className="text-sm text-muted-foreground">Primary Content Type</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_content_analysis.avg_sentiment_score > 0.1 ? 'Positive' :
                       profile.ai_content_analysis.avg_sentiment_score < -0.1 ? 'Negative' : 'Neutral'}
                    </div>
                    <p className="text-sm text-muted-foreground">Sentiment</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Text Analysis */}
            {profile.ai_advanced_nlp && (
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Advanced Text Analysis</CardTitle>
                  <CardDescription>Vocabulary richness, complexity, and keyword insights</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vocabulary Richness</span>
                      <span className="text-sm font-medium">{profile.ai_advanced_nlp.vocabulary_richness.toFixed(1)}%</span>
                    </div>
                    <Progress value={profile.ai_advanced_nlp.vocabulary_richness} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Text Complexity</span>
                      <span className="text-sm font-medium">{profile.ai_advanced_nlp.text_complexity.toFixed(1)}/100</span>
                    </div>
                    <Progress value={profile.ai_advanced_nlp.text_complexity} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Caption Length</span>
                      <span className="text-sm font-medium">{profile.ai_advanced_nlp.avg_caption_length} chars</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Emojis Used</span>
                      <span className="text-sm font-medium">{profile.ai_advanced_nlp.emojis_used}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Top Keywords</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.ai_advanced_nlp.top_keywords.slice(0, 10).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword.word} ({keyword.count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Content Themes</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.ai_advanced_nlp.content_themes.map((theme, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Content Analysis */}
            {profile.ai_visual_content && (
              <Card>
                <CardHeader>
                  <CardTitle>🖼️ Visual Content Analysis</CardTitle>
                  <CardDescription>Aesthetic quality, colors, and visual elements analysis</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_visual_content.aesthetic_score}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Aesthetic Score</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_visual_content.professional_quality}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Professional Quality</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_visual_content.images_processed}
                    </div>
                    <p className="text-sm text-muted-foreground">Images Processed</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_visual_content.faces_detected}
                    </div>
                    <p className="text-sm text-muted-foreground">Faces Detected</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold mb-2">
                      {profile.ai_visual_content.brand_logos}
                    </div>
                    <p className="text-sm text-muted-foreground">Brand Logos</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <div className="text-sm text-muted-foreground mb-2">Dominant Colors</div>
                    <div className="flex gap-1">
                      {profile.ai_visual_content.dominant_colors.slice(0, 3).map((colorData, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-border"
                            style={{ backgroundColor: colorData.color }}
                          />
                          <span className="text-xs mt-1">{colorData.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Distribution */}
              {profile.ai_content_analysis?.content_distribution && Object.keys(profile.ai_content_analysis.content_distribution).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Content Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(profile.ai_content_analysis.content_distribution)
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
                <div>
                  <h3 className="text-lg font-semibold">Recent Posts ({posts.length})</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {posts.slice(0, 20).map((post, index) => (
                    <PostCard key={post.id || index} post={post} />
                  ))}
                </div>
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
        {post.display_url || post.media_url ? (
          <img
            src={post.display_url || post.media_url}
            alt="Post"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Engagement overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white text-center space-y-1">
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