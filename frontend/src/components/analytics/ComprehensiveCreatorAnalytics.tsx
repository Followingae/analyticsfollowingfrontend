'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ReactCountryFlag from 'react-country-flag'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  Shield,
  Eye,
  Globe,
  Star,
  Award,
  Target,
  Camera,
  MapPin,
  Flag,
  CheckCircle,
  AlertTriangle,
  Brain,
  Activity,
  Lightbulb,
  Search,
  Image as ImageIcon,
  TrendingUp,
  Zap
} from 'lucide-react'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'

// Utility functions for safe number formatting
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toFixed(decimals)
}

const safePercentage = (value: any, decimals: number = 1): string => {
  const num = Number(value)
  return isNaN(num) ? '0' : (num * 100).toFixed(decimals)
}

const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

// EXACT Backend Response Structure (NO TRANSFORMATION)
interface ComprehensiveCreatorAnalyticsProps {
  username: string
}

function ComprehensiveCreatorAnalyticsComponent({ username }: ComprehensiveCreatorAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await comprehensiveAnalyticsApi.getCompleteDashboardData(username)

        setData(response)
      } catch (err) {
        console.error('❌ Error fetching creator analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchData()
    }
  }, [username])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
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

  const profile = data.profile

  // 🚨 DEBUG: Log COMPLETE API response to see ALL available data
  console.log('🔥 COMPLETE API RESPONSE:', JSON.stringify(data, null, 2))
  console.log('🔥 PROFILE KEYS:', Object.keys(data.profile || {}))
  console.log('🔥 AI_ANALYSIS KEYS:', Object.keys(data.profile?.ai_analysis || {}))
  console.log('🔥 POSTS COUNT:', data.posts?.length || data.profile?.posts?.length || 0)

  // ✅ FIXED: Map to actual backend structure from API service
  const ai = data.profile?.ai_analysis
  const audience = data.audience || data.profile?.ai_analysis?.audience_demographics || data.profile?.ai_analysis?.audience_insights
  const content = data.content || data.profile?.ai_analysis?.visual_content_analysis
  const engagement = data.engagement || data.profile?.engagement || data.profile
  const security = data.security || data.profile?.ai_analysis?.fraud_detection_analysis
  const posts = data.posts || data.profile?.posts || []

  // 🔍 DEBUG: Add comprehensive logging to see actual API structure
  console.log('🔥 COMPLETE API RESPONSE:', JSON.stringify(data, null, 2))
  console.log('🔥 AI ANALYSIS STRUCTURE:', JSON.stringify(ai, null, 2))
  console.log('🔥 PROFILE DATA:', JSON.stringify(profile, null, 2))

  // 🔥 DEBUG: Log what we're extracting to identify missing data
  console.log('🔥 EXTRACTED DATA AVAILABILITY:', {
    ai: !!ai,
    ai_keys: ai ? Object.keys(ai) : [],
    audience: !!audience,
    audience_keys: audience ? Object.keys(audience) : [],
    content: !!content,
    content_keys: content ? Object.keys(content) : [],
    engagement: !!engagement,
    security: !!security,
    security_keys: security ? Object.keys(security) : [],
    posts_count: posts.length,
    posts_sample: posts[0] ? Object.keys(posts[0]) : []
  })

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Profile Data</h3>
          <p className="text-muted-foreground">Unable to load creator profile data</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Profile Overview */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={profile.cdn_avatar_url || profile.profile_pic_url_hd} />
              <AvatarFallback>{profile.full_name?.charAt(0) || profile.username?.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
                {profile.is_verified && <CheckCircle className="h-6 w-6 text-blue-500" />}
                {profile.detected_country && (
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      countryCode={profile.detected_country}
                      svg
                      style={{
                        width: '1.5em',
                        height: '1.5em',
                      }}
                      title={profile.detected_country}
                    />
                    <Badge variant="outline">{profile.detected_country}</Badge>
                  </div>
                )}
                {profile.is_business_account && (
                  <Badge variant="secondary">Business</Badge>
                )}
              </div>

              <p className="text-xl text-muted-foreground">@{profile.username}</p>

              {profile.biography && (
                <p className="text-muted-foreground max-w-2xl">{profile.biography}</p>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{(profile.followers_count || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{(profile.posts_count || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{safePercentage(profile.engagement_rate, 2)}%</span>
                  <span className="text-muted-foreground">engagement</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              {ai?.content_quality_score && (
                <Badge variant="secondary" className="mb-2">
                  AI Score: {safeToFixed(ai.content_quality_score || 85, 1)}/100
                </Badge>
              )}
              {data.performance && (
                <div className="text-sm text-muted-foreground">
                  Source: {data.data_source}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Metrics - Display ALL Backend Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Core Engagement Metrics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Likes</p>
                <p className="text-2xl font-bold">{(profile.avg_likes || 0).toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Comments</p>
                <p className="text-2xl font-bold">{(profile.avg_comments || 0).toLocaleString()}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Following Metrics */}
        {profile.following_count && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Following</p>
                  <p className="text-2xl font-bold">{profile.following_count.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* External URL Metrics */}
        {profile.external_url && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <p className="text-lg font-bold truncate">{new URL(profile.external_url).hostname}</p>
                </div>
                <Globe className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Account Status */}
        {profile.is_business_account !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <p className="text-2xl font-bold">{profile.is_business_account ? 'Business' : 'Personal'}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category */}
        {profile.category && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-lg font-bold capitalize">{profile.category}</p>
                </div>
                <Target className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Quality Metrics */}
        {ai?.audience_quality_assessment?.authenticity_score && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Authenticity</p>
                  <p className="text-2xl font-bold">{safeToFixed(ai.audience_quality_assessment?.authenticity_score, 1)}%</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {ai?.primary_content_type && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Content Type</p>
                  <p className="text-2xl font-bold capitalize">{ai.primary_content_type}</p>
                </div>
                <Camera className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Content Quality Score */}
        {ai?.content_quality_score && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Content Quality</p>
                  <p className="text-2xl font-bold">{safeToFixed(ai.content_quality_score, 1)}/100</p>
                </div>
                <Star className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Brand Safety Score */}
        {ai?.brand_safety_score && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brand Safety</p>
                  <p className="text-2xl font-bold">{safeToFixed(ai.brand_safety_score, 1)}/100</p>
                </div>
                <Shield className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Level */}
        {ai?.posting_frequency && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activity Level</p>
                  <p className="text-2xl font-bold capitalize">{ai.posting_frequency}</p>
                </div>
                <Activity className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growth Trend */}
        {ai?.follower_growth_rate && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">{safePercentage(ai.follower_growth_rate, 2)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-lime-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comprehensive Engagement Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Engagement Performance Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Engagement Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Engagement Rate</span>
              <span className="font-bold">{safePercentage(profile.engagement_rate, 2)}%</span>
            </div>
            {profile.avg_likes && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Likes per Post</span>
                <span className="font-bold">{profile.avg_likes.toLocaleString()}</span>
              </div>
            )}
            {profile.avg_comments && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Comments per Post</span>
                <span className="font-bold">{profile.avg_comments.toLocaleString()}</span>
              </div>
            )}
            {ai?.audience_quality_assessment?.engagement_authenticity && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Engagement Authenticity</span>
                <span className="font-bold">{safeToFixed(ai.audience_quality_assessment.engagement_authenticity, 1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Statistics Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Account Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Followers</span>
              <span className="font-bold">{profile.followers_count?.toLocaleString() || '0'}</span>
            </div>
            {profile.following_count && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Following</span>
                <span className="font-bold">{profile.following_count.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Posts</span>
              <span className="font-bold">{profile.posts_count?.toLocaleString() || '0'}</span>
            </div>
            {profile.following_count && profile.followers_count && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Follow Ratio</span>
                <span className="font-bold">{safeToFixed(profile.followers_count / profile.following_count, 2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality & Safety Metrics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Quality & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ai?.content_quality_score && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Content Quality</span>
                <span className="font-bold">{safeToFixed(ai.content_quality_score, 1)}/100</span>
              </div>
            )}
            {ai?.brand_safety_score && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Brand Safety</span>
                <span className="font-bold">{safeToFixed(ai.brand_safety_score, 1)}/100</span>
              </div>
            )}
            {ai?.audience_quality_assessment?.authenticity_score && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Authenticity</span>
                <span className="font-bold">{safeToFixed(ai.audience_quality_assessment.authenticity_score, 1)}%</span>
              </div>
            )}
            {profile.is_verified !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verification Status</span>
                <span className="font-bold">{profile.is_verified ? 'Verified' : 'Unverified'}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Profile Insights - Display ALL Remaining Backend Data */}
      {(profile.contact_phone_number || profile.public_email || profile.external_url || ai?.peak_posting_time || ai?.posting_frequency || ai?.audience_growth_rate || ai?.brand_mentions || ai?.hashtag_usage_patterns) && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Additional Profile Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              {profile.contact_phone_number && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                  <p className="text-lg font-bold">{profile.contact_phone_number}</p>
                </div>
              )}

              {profile.public_email && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Public Email</p>
                  <p className="text-lg font-bold">{profile.public_email}</p>
                </div>
              )}

              {profile.external_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <p className="text-lg font-bold truncate">{profile.external_url}</p>
                </div>
              )}

              {/* AI Insights */}
              {ai?.peak_posting_time && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Peak Posting Time</p>
                  <p className="text-lg font-bold">{ai.peak_posting_time}</p>
                </div>
              )}

              {ai?.posting_frequency && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Posting Frequency</p>
                  <p className="text-lg font-bold capitalize">{ai.posting_frequency}</p>
                </div>
              )}

              {ai?.audience_growth_rate && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Audience Growth Rate</p>
                  <p className="text-lg font-bold">{safePercentage(ai.audience_growth_rate, 2)}%</p>
                </div>
              )}

              {ai?.brand_mentions && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Brand Mentions</p>
                  <p className="text-lg font-bold">{ai.brand_mentions}</p>
                </div>
              )}

              {ai?.hashtag_usage_patterns && typeof ai.hashtag_usage_patterns === 'object' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Top Hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(ai.hashtag_usage_patterns).slice(0, 3).map(([hashtag, count]) => (
                      <Badge key={hashtag} variant="outline" className="text-xs">
                        #{hashtag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional AI Analysis Fields */}
              {ai?.content_themes && Array.isArray(ai.content_themes) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Content Themes</p>
                  <div className="flex flex-wrap gap-1">
                    {ai.content_themes.slice(0, 3).map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {ai?.collaboration_score && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Collaboration Score</p>
                  <p className="text-lg font-bold">{safeToFixed(ai.collaboration_score, 1)}/100</p>
                </div>
              )}

              {ai?.brand_affinity_score && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Brand Affinity</p>
                  <p className="text-lg font-bold">{safeToFixed(ai.brand_affinity_score, 1)}/100</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="authenticity">Authenticity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Distribution */}
            {ai?.content_distribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Content Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(ai.content_distribution).map(([category, percentage]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">{safePercentage(percentage, 1)}%</span>
                        </div>
                        <Progress value={(percentage as number) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Language Distribution */}
            {ai?.language_distribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(ai.language_distribution).map(([lang, percentage]) => (
                      <div key={lang} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="uppercase">{lang}</span>
                          <span className="font-medium">{safePercentage(percentage, 1)}%</span>
                        </div>
                        <Progress value={(percentage as number) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quality Indicators - GUARANTEED DISPLAY */}
          {ai && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Quality Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Content Quality Score */}
                  {ai.content_quality_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Content Quality Score</span>
                        <span className="font-medium">{safeToFixed(ai.content_quality_score, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(ai.content_quality_score)} className="h-2" />
                    </div>
                  )}

                  {/* Models Success Rate */}
                  {ai.models_success_rate !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Models Success</span>
                        <span className="font-medium">{safeToFixed(ai.models_success_rate, 1)}%</span>
                      </div>
                      <Progress value={safeNumber(ai.models_success_rate)} className="h-2" />
                    </div>
                  )}

                  {/* Authenticity Score from audience.quality */}
                  {audience?.quality?.authenticity_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Authenticity Score</span>
                        <span className="font-medium">{safeToFixed(audience.quality.authenticity_score, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(audience.quality.authenticity_score)} className="h-2" />
                    </div>
                  )}

                  {/* Bot Detection Score from audience.quality */}
                  {audience?.quality?.bot_detection_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bot Detection</span>
                        <span className="font-medium">{safeToFixed(audience.quality.bot_detection_score, 1)}%</span>
                      </div>
                      <Progress value={safeNumber(audience.quality.bot_detection_score)} className="h-2" />
                    </div>
                  )}

                  {/* Fake Follower Percentage from audience.quality */}
                  {audience?.quality?.fake_follower_percentage !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fake Followers</span>
                        <span className="font-medium">{safeToFixed(audience.quality.fake_follower_percentage, 1)}%</span>
                      </div>
                      <Progress value={safeNumber(audience.quality.fake_follower_percentage)} className="h-2" />
                    </div>
                  )}

                  {/* Engagement Authenticity from audience.quality */}
                  {audience?.quality?.engagement_authenticity !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Engagement Authenticity</span>
                        <span className="font-medium">{safeToFixed(audience.quality.engagement_authenticity, 1)}%</span>
                      </div>
                      <Progress value={safeNumber(audience.quality.engagement_authenticity)} className="h-2" />
                    </div>
                  )}

                  {/* Visual Content Analysis - Professional Quality from content.visual_analysis */}
                  {content?.visual_analysis?.professional_quality_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Professional Quality</span>
                        <span className="font-medium">{safeToFixed(content.visual_analysis.professional_quality_score, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(content.visual_analysis.professional_quality_score)} className="h-2" />
                    </div>
                  )}

                  {/* Visual Content Analysis - Aesthetic Score from content.visual_analysis */}
                  {content?.visual_analysis?.aesthetic_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Aesthetic Score</span>
                        <span className="font-medium">{safeToFixed(content.visual_analysis.aesthetic_score, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(content.visual_analysis.aesthetic_score)} className="h-2" />
                    </div>
                  )}

                  {/* Comprehensive Insights - Overall Authenticity */}
                  {ai.comprehensive_insights?.overall_authenticity_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Authenticity</span>
                        <span className="font-medium">{safeToFixed(ai.comprehensive_insights.overall_authenticity_score, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(ai.comprehensive_insights.overall_authenticity_score)} className="h-2" />
                    </div>
                  )}

                  {/* Comprehensive Insights - Content Quality Rating */}
                  {ai.comprehensive_insights?.content_quality_rating !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Content Quality Rating</span>
                        <span className="font-medium">{safeToFixed(ai.comprehensive_insights.content_quality_rating, 1)}/100</span>
                      </div>
                      <Progress value={safeNumber(ai.comprehensive_insights.content_quality_rating)} className="h-2" />
                    </div>
                  )}

                  {/* Average Sentiment Score */}
                  {ai.avg_sentiment_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Sentiment</span>
                        <span className="font-medium">{safeToFixed(ai.avg_sentiment_score, 2)}</span>
                      </div>
                      <Progress value={Math.abs(safeNumber(ai.avg_sentiment_score)) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Summary - Using new API structure */}
          {(posts?.length > 0 || profile?.engagement_rate !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{posts?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Posts Analyzed</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{safePercentage(profile?.engagement_rate, 2)}%</div>
                    <div className="text-sm text-muted-foreground">Avg Engagement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ALL AI ANALYSIS CONTENT DISTRIBUTION - GUARANTEED DISPLAY */}
            {ai?.content_distribution && Object.keys(ai.content_distribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Content Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(ai.content_distribution).map(([type, percentage]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(percentage as number)} className="h-2 w-20" />
                          <span className="text-sm font-medium w-12">{(percentage as number).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ALL AI ANALYSIS LANGUAGE DISTRIBUTION - GUARANTEED DISPLAY */}
            {ai?.language_distribution && Object.keys(ai.language_distribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(ai.language_distribution).map(([lang, percentage]) => (
                      <div key={lang} className="flex justify-between items-center">
                        <span className="text-sm uppercase">{lang}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(percentage as number)} className="h-2 w-20" />
                          <span className="text-sm font-medium w-12">{(percentage as number).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demographics - GUARANTEED DISPLAY */}
            {ai?.audience_demographics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Age Distribution - GUARANTEED DISPLAY */}
                    {ai.audience_demographics.age_distribution && Object.keys(ai.audience_demographics.age_distribution || {}).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Age Groups</h4>
                        <div className="space-y-2">
                          {Object.entries(ai.audience_demographics.age_distribution).map(([age, percentage]) => (
                            <div key={age} className="flex justify-between items-center">
                              <span className="text-sm">{age}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={(percentage as number)} className="h-2 w-20" />
                                <span className="text-sm font-medium w-12">{(percentage as number).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gender Distribution - GUARANTEED DISPLAY with fallback data */}
                    {ai.audience_demographics.gender_distribution && Object.keys(ai.audience_demographics.gender_distribution || {}).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Gender Split</h4>
                        <div className="space-y-2">
                          {Object.entries(ai.audience_demographics.gender_distribution).map(([gender, percentage]) => (
                            <div key={gender} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{gender}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={(percentage as number)} className="h-2 w-20" />
                                <span className="text-sm font-medium w-12">{(percentage as number).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Geographic Analysis from audience.demographics.countries */}
            {audience?.demographics?.countries && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Use audience.demographics.countries (percentages) */}
                    {Object.entries(audience.demographics.countries)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([country, percentage]) => (
                        <div key={country} className="flex justify-between items-center">
                          <span className="text-sm">{country}</span>
                          <span className="font-medium">{(percentage as number).toFixed(1)}%</span>
                        </div>
                      ))
                    }
                  </div>

                  {/* Additional geographic analysis from audience.geographic_insights if available */}
                  {audience?.geographic_insights && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Geographic Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Geographic Diversity Score</span>
                          <span className="font-medium">{(audience.geographic_insights.geographic_diversity_score * 100).toFixed(1)}%</span>
                        </div>
                        {audience.geographic_insights.primary_regions && (
                          <div>
                            <span className="text-sm text-muted-foreground">Primary Regions: </span>
                            <span className="text-sm">{audience.geographic_insights.primary_regions.join(', ')}</span>
                          </div>
                        )}
                        {audience.geographic_insights.international_reach !== undefined && (
                          <div>
                            <span className="text-sm text-muted-foreground">International Reach: </span>
                            <Badge variant={audience.geographic_insights.international_reach ? "default" : "secondary"}>
                              {audience.geographic_insights.international_reach ? "Yes" : "No"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cultural Analysis from audience.cultural_analysis */}
          {audience?.cultural_analysis &&
           ((audience.cultural_analysis.language_indicators && Object.keys(audience.cultural_analysis.language_indicators || {}).length > 0) ||
            (audience.cultural_analysis.social_context)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Cultural Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language Indicators as object with counts */}
                  {audience.cultural_analysis.language_indicators && Object.keys(audience.cultural_analysis.language_indicators || {}).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Language Indicators</h4>
                      <div className="space-y-2">
                        {Object.entries(audience.cultural_analysis.language_indicators).map(([language, count]) => (
                          <div key={language} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{language}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Social Context */}
                  {audience.cultural_analysis.social_context && (
                    <div>
                      <h4 className="font-medium mb-3">Social Context</h4>
                      <Badge variant="outline" className="capitalize">{audience.cultural_analysis.social_context}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Continue with remaining tabs... */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Content Analysis from content.visual_analysis */}
            {content?.visual_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Visual Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {content.visual_analysis.aesthetic_score !== undefined && (
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{safeToFixed(content.visual_analysis.aesthetic_score, 1)}</div>
                          <div className="text-sm text-muted-foreground">Aesthetic Score</div>
                        </div>
                      )}
                      {content.visual_analysis.professional_quality_score !== undefined && (
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{safeToFixed(content.visual_analysis.professional_quality_score, 1)}</div>
                          <div className="text-sm text-muted-foreground">Professional Quality</div>
                        </div>
                      )}
                    </div>

                    {/* Visual Analysis Details from content.visual_analysis */}
                    {content.visual_analysis && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Visual Metrics</h4>
                        {content.visual_analysis.brightness_score !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm">Brightness Score</span>
                            <span className="font-medium">{safeToFixed(content.visual_analysis.brightness_score, 1)}</span>
                          </div>
                        )}
                        {content.visual_analysis.contrast_score !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm">Contrast Score</span>
                            <span className="font-medium">{safeToFixed(content.visual_analysis.contrast_score, 1)}</span>
                          </div>
                        )}
                        {content.visual_analysis.composition_score !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm">Composition Score</span>
                            <span className="font-medium">{safeToFixed(content.visual_analysis.composition_score, 1)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dominant Colors from content.visual_analysis */}
                    {content.visual_analysis?.dominant_colors && (content.visual_analysis.dominant_colors || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Dominant Colors</h4>
                        <div className="flex gap-2 flex-wrap">
                          {content.visual_analysis.dominant_colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Face Analysis from content.visual_analysis */}
                    {content.visual_analysis?.face_analysis && (
                      <div>
                        <h4 className="font-medium mb-2">Face Analysis</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Faces Detected</span>
                            <span className="font-medium">{content.visual_analysis.face_analysis.faces_detected || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Unique Faces</span>
                            <span className="font-medium">{content.visual_analysis.face_analysis.unique_faces || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ALL AI VISUAL CONTENT ANALYSIS - GUARANTEED DISPLAY */}
            {ai?.visual_content_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visual Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {ai.visual_content_analysis.aesthetic_score !== undefined && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(ai.visual_content_analysis.aesthetic_score, 1)}</div>
                        <div className="text-sm text-muted-foreground">Aesthetic Score</div>
                      </div>
                    )}
                    {ai.visual_content_analysis.color_consistency !== undefined && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(ai.visual_content_analysis.color_consistency, 1)}</div>
                        <div className="text-sm text-muted-foreground">Color Consistency</div>
                      </div>
                    )}
                    {ai.visual_content_analysis.composition_quality && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold capitalize">{ai.visual_content_analysis.composition_quality}</div>
                        <div className="text-sm text-muted-foreground">Composition Quality</div>
                      </div>
                    )}
                    {ai.visual_content_analysis.professional_quality_score !== undefined && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(ai.visual_content_analysis.professional_quality_score, 1)}</div>
                        <div className="text-sm text-muted-foreground">Professional Quality</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Recognition from content.visual_analysis */}
            {content?.visual_analysis?.content_recognition && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Content Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{content.visual_analysis.content_recognition.food_items_detected || 0}</div>
                        <div className="text-sm text-muted-foreground">Food Items</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{content.visual_analysis.content_recognition.kitchen_items_detected || 0}</div>
                        <div className="text-sm text-muted-foreground">Kitchen Items</div>
                      </div>
                    </div>

                    {content.visual_analysis.content_recognition.confidence_scores && (content.visual_analysis.content_recognition.confidence_scores || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Detection Confidence</h4>
                        <div className="space-y-1">
                          {content.visual_analysis.content_recognition.confidence_scores.map((score, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Item {index + 1}</span>
                              <span className="font-medium">{safePercentage(score, 1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Image Quality Metrics from content.visual_analysis */}
          {content?.visual_analysis?.image_quality_metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Image Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {content.visual_analysis.image_quality_metrics.average_quality_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Quality</span>
                        <span className="font-medium">{safeToFixed(content.visual_analysis.image_quality_metrics.average_quality_score, 1)}</span>
                      </div>
                      <Progress value={content.visual_analysis.image_quality_metrics.average_quality_score} className="h-2" />
                    </div>
                  )}
                  {content.visual_analysis.image_quality_metrics.resolution_consistency !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Resolution Consistency</span>
                        <span className="font-medium">{safePercentage(content.visual_analysis.image_quality_metrics.resolution_consistency, 1)}%</span>
                      </div>
                      <Progress value={(content.visual_analysis.image_quality_metrics.resolution_consistency || 0) * 100} className="h-2" />
                    </div>
                  )}
                  {content.visual_analysis.image_quality_metrics.image_processing_quality !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing Quality</span>
                        <span className="font-medium">{safePercentage(content.visual_analysis.image_quality_metrics.image_processing_quality, 1)}%</span>
                      </div>
                      <Progress value={(content.visual_analysis.image_quality_metrics.image_processing_quality || 0) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Authenticity Tab */}
        <TabsContent value="authenticity" className="space-y-6">
          {/* ALL AI FRAUD DETECTION ANALYSIS - GUARANTEED DISPLAY */}
          {ai?.fraud_detection_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Fraud Detection Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ai.fraud_detection_analysis.fraud_risk_score !== undefined && (
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-3xl font-bold text-red-600">{safeToFixed(ai.fraud_detection_analysis.fraud_risk_score, 1)}</div>
                      <div className="text-sm text-red-700">Fraud Risk Score</div>
                    </div>
                  )}
                  {ai.fraud_detection_analysis.brand_safety_score !== undefined && (
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600">{safeToFixed(ai.fraud_detection_analysis.brand_safety_score, 1)}</div>
                      <div className="text-sm text-green-700">Brand Safety Score</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ALL AI BEHAVIORAL PATTERNS ANALYSIS - GUARANTEED DISPLAY */}
          {ai?.behavioral_patterns_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Behavioral Patterns Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ai.behavioral_patterns_analysis.posting_frequency && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold capitalize">{ai.behavioral_patterns_analysis.posting_frequency}</div>
                      <div className="text-sm text-muted-foreground">Posting Frequency</div>
                    </div>
                  )}
                  {ai.behavioral_patterns_analysis.lifecycle_stage && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold capitalize">{ai.behavioral_patterns_analysis.lifecycle_stage}</div>
                      <div className="text-sm text-muted-foreground">Lifecycle Stage</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fraud Detection Analysis from security.fraud_detection */}
          {security?.fraud_detection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Fraud Detection Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {security.fraud_detection.fraud_assessment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600">{security.fraud_detection.fraud_assessment.authenticity_score || 0}</div>
                      <div className="text-sm text-green-700">Authenticity Score</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{security.fraud_detection.fraud_assessment.overall_fraud_score || 0}</div>
                      <div className="text-sm text-blue-700">Fraud Score</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600 capitalize">{security.fraud_detection.fraud_assessment.risk_level || 'unknown'}</div>
                      <div className="text-sm text-purple-700">Risk Level</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-3xl font-bold text-orange-600">{safePercentage(security.fraud_detection.fraud_assessment.confidence, 1)}%</div>
                      <div className="text-sm text-orange-700">Confidence</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Account Metrics */}
                  {security.fraud_detection.account_metrics && (
                    <div>
                      <h4 className="font-medium mb-3">Account Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Growth Pattern</span>
                          <Badge variant="outline" className="capitalize">{security.fraud_detection.account_metrics.follower_growth_pattern || 'unknown'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Engagement Velocity</span>
                          <Badge variant="outline" className="capitalize">{security.fraud_detection.account_metrics.engagement_velocity || 'unknown'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Posting Pattern</span>
                          <Badge variant="outline" className="capitalize">{security.fraud_detection.account_metrics.content_posting_pattern || 'unknown'}</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Engagement Analysis */}
                  {security.fraud_detection.engagement_analysis && (
                    <div>
                      <h4 className="font-medium mb-3">Engagement Analysis</h4>
                      <div className="space-y-2">
                        {security.fraud_detection.engagement_analysis.natural_engagement_indicators && (security.fraud_detection.engagement_analysis.natural_engagement_indicators || []).map((indicator, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{indicator}</span>
                          </div>
                        ))}
                        {security.fraud_detection.engagement_analysis.suspicious_patterns && (security.fraud_detection.engagement_analysis.suspicious_patterns || []).map((pattern, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{pattern}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Red Flags */}
                {security.fraud_detection.red_flags && (security.fraud_detection.red_flags || []).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Red Flags</h4>
                    <div className="space-y-2">
                      {security.fraud_detection.red_flags.map((flag, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span className="text-sm">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {security.fraud_detection.recommendations && (security.fraud_detection.recommendations || []).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {security.fraud_detection.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bot Detection & Audience Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bot Detection - GUARANTEED DISPLAY */}
            {ai?.audience_quality_assessment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Bot Detection & Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ai.audience_quality_assessment.bot_detection_score !== undefined && (
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{safeToFixed(ai.audience_quality_assessment?.bot_detection_score, 1)}%</div>
                        <div className="text-sm text-muted-foreground">Bot Detection Score</div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {ai.audience_quality_assessment.fake_follower_percentage !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm">Fake Followers</span>
                          <span className="font-medium">{safeToFixed(ai.audience_quality_assessment?.fake_follower_percentage, 1)}%</span>
                        </div>
                      )}
                      {ai.audience_quality_assessment.engagement_authenticity && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">Authentic Engagement</span>
                            <span className="font-medium">{safeToFixed(ai.audience_quality_assessment?.engagement_authenticity?.authentic_engagement_percentage, 1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Suspicious Activity</span>
                            <span className="font-medium">{safeToFixed(ai.audience_quality_assessment?.engagement_authenticity?.suspicious_activity_score, 1)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Anomaly Detection - GUARANTEED DISPLAY */}
            {ai?.audience_quality_assessment?.anomaly_detection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Anomaly Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{safeToFixed(ai.audience_quality_assessment?.anomaly_detection?.overall_score, 1)}</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Anomalies Detected</h4>
                      {(ai.audience_quality_assessment.anomaly_detection.anomalies_detected || []).length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">No anomalies detected</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {ai.audience_quality_assessment.anomaly_detection.anomalies_detected.map((anomaly, index) => (
                            <div key={index} className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">{anomaly}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Modeling */}
            {ai?.advanced_nlp_analysis?.topic_modeling?.topics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Topic Modeling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(ai.advanced_nlp_analysis.topic_modeling.topics || []).map((topic, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{(topic.topic || '').replace(/_/g, ' ')}</span>
                          <span className="font-medium">{safePercentage(topic.weight, 1)}%</span>
                        </div>
                        <Progress value={(topic.weight || 0) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entity Extraction */}
            {ai?.advanced_nlp_analysis?.entity_extraction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Entity Extraction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ai.advanced_nlp_analysis.entity_extraction.locations && (ai.advanced_nlp_analysis.entity_extraction.locations || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Locations</h4>
                        <div className="flex flex-wrap gap-1">
                          {ai.advanced_nlp_analysis.entity_extraction.locations.map((location, index) => (
                            <Badge key={index} variant="secondary">{location}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {ai.advanced_nlp_analysis.entity_extraction.organizations && (ai.advanced_nlp_analysis.entity_extraction.organizations || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Organizations</h4>
                        <div className="flex flex-wrap gap-1">
                          {ai.advanced_nlp_analysis.entity_extraction.organizations.map((org, index) => (
                            <Badge key={index} variant="outline">{org}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {ai.advanced_nlp_analysis.entity_extraction.people && (ai.advanced_nlp_analysis.entity_extraction.people || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">People</h4>
                        <div className="flex flex-wrap gap-1">
                          {ai.advanced_nlp_analysis.entity_extraction.people.map((person, index) => (
                            <Badge key={index} variant="destructive">{person}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {ai.advanced_nlp_analysis.entity_extraction.food_items && (ai.advanced_nlp_analysis.entity_extraction.food_items || []).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Food Items</h4>
                        <div className="flex flex-wrap gap-1">
                          {ai.advanced_nlp_analysis.entity_extraction.food_items.map((food, index) => (
                            <Badge key={index} variant="default">{food}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Brand Analysis */}
          {ai?.advanced_nlp_analysis?.brand_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Brand Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Brand Mentions</h4>
                    <div className="space-y-1">
                      {ai.advanced_nlp_analysis.brand_analysis.brand_mentions && (ai.advanced_nlp_analysis.brand_analysis.brand_mentions || []).map((mention, index) => (
                        <Badge key={index} variant="outline">{mention}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Brand Sentiment</h4>
                    <Badge variant="default" className="capitalize">
                      {ai.advanced_nlp_analysis.brand_analysis.brand_sentiment || 'N/A'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Commercial Intent</h4>
                    <div className="space-y-2">
                      <Progress value={(ai.advanced_nlp_analysis.brand_analysis.commercial_intent || 0) * 100} className="h-2" />
                      <span className="text-sm font-medium">{safePercentage(ai.advanced_nlp_analysis.brand_analysis.commercial_intent, 1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Semantic Features */}
          {ai?.advanced_nlp_analysis?.semantic_features && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Semantic Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ai.advanced_nlp_analysis.semantic_features.primary_themes && (ai.advanced_nlp_analysis.semantic_features.primary_themes || []).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Primary Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {ai.advanced_nlp_analysis.semantic_features.primary_themes.map((theme, index) => (
                          <Badge key={index} variant="secondary">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-3">Emotional Tone</h4>
                    <Badge variant="outline" className="capitalize">
                      {ai.advanced_nlp_analysis.semantic_features.emotional_tone || 'N/A'}
                    </Badge>
                  </div>

                  {ai.advanced_nlp_analysis.semantic_features.expertise_indicators && (ai.advanced_nlp_analysis.semantic_features.expertise_indicators || []).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Expertise Indicators</h4>
                      <div className="flex flex-wrap gap-2">
                        {ai.advanced_nlp_analysis.semantic_features.expertise_indicators.map((indicator, index) => (
                          <Badge key={index} variant="default">{indicator}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Insights */}
          {ai?.advanced_nlp_analysis?.content_insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Content Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{ai.advanced_nlp_analysis.content_insights.average_caption_length || 0}</div>
                    <div className="text-sm text-muted-foreground">Avg Caption Length</div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Hashtag Pattern</h4>
                    <Badge variant="outline" className="capitalize">
                      {ai.advanced_nlp_analysis.content_insights.hashtag_usage_pattern || 'N/A'}
                    </Badge>
                  </div>

                  {ai.advanced_nlp_analysis.content_insights.engagement_keywords && (ai.advanced_nlp_analysis.content_insights.engagement_keywords || []).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Engagement Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {ai.advanced_nlp_analysis.content_insights.engagement_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Engagement Prediction */}
          {ai?.advanced_nlp_analysis?.engagement_prediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Engagement Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Predicted Performance</h4>
                    <Badge variant="outline" className="capitalize">
                      {ai.advanced_nlp_analysis.engagement_prediction.predicted_performance || 'N/A'}
                    </Badge>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{safePercentage(ai.advanced_nlp_analysis.engagement_prediction.confidence, 1)}%</div>
                    <div className="text-sm text-muted-foreground">Prediction Confidence</div>
                  </div>

                  {ai.advanced_nlp_analysis.engagement_prediction.key_factors && (ai.advanced_nlp_analysis.engagement_prediction.key_factors || []).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Key Factors</h4>
                      <div className="space-y-1">
                        {ai.advanced_nlp_analysis.engagement_prediction.key_factors.map((factor, index) => (
                          <div key={index} className="text-sm">{factor}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Behavioral Patterns from ai.behavioral_patterns */}
          {ai?.behavioral_patterns && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Behavioral Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Behavioral Scores */}
                  {ai.behavioral_patterns.behavioral_patterns && (
                    <div>
                      <h4 className="font-medium mb-3">Behavioral Scores</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Consistency Score</span>
                            <span className="font-medium">{ai.behavioral_patterns.behavioral_patterns.consistency_score || 0}%</span>
                          </div>
                          <Progress value={ai.behavioral_patterns.behavioral_patterns.consistency_score || 0} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Innovation Score</span>
                            <span className="font-medium">{ai.behavioral_patterns.behavioral_patterns.innovation_score || 0}%</span>
                          </div>
                          <Progress value={ai.behavioral_patterns.behavioral_patterns.innovation_score || 0} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Audience Retention</span>
                            <span className="font-medium">{ai.behavioral_patterns.behavioral_patterns.audience_retention || 0}%</span>
                          </div>
                          <Progress value={ai.behavioral_patterns.behavioral_patterns.audience_retention || 0} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lifecycle Analysis */}
                  {ai.behavioral_patterns.lifecycle_analysis && (
                    <div>
                      <h4 className="font-medium mb-3">Lifecycle Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Current Stage</span>
                          <Badge variant="outline" className="capitalize">{ai.behavioral_patterns.lifecycle_analysis.current_stage || 'unknown'}</Badge>
                        </div>
                      </div>

                      {ai.behavioral_patterns.lifecycle_analysis.growth_indicators && (ai.behavioral_patterns.lifecycle_analysis.growth_indicators || []).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Growth Indicators</h4>
                          <div className="space-y-1">
                            {ai.behavioral_patterns.lifecycle_analysis.growth_indicators.map((indicator, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-sm">{indicator}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Strategy */}
                {ai.behavioral_patterns.content_strategy && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Content Strategy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{safePercentage(ai.behavioral_patterns.content_strategy.content_consistency, 1)}%</div>
                        <div className="text-xs text-muted-foreground">Content Consistency</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{safePercentage(ai.behavioral_patterns.content_strategy.brand_alignment, 1)}%</div>
                        <div className="text-xs text-muted-foreground">Brand Alignment</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold capitalize">{ai.behavioral_patterns.content_strategy.primary_content_type || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">Primary Content Type</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Behavioral Insights */}
                {ai.behavioral_patterns.behavioral_insights && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Behavioral Insights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium">Posting Time:</span>
                        <p className="text-sm text-muted-foreground capitalize">{ai.behavioral_patterns.behavioral_insights.posting_time_preferences || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Content Length:</span>
                        <p className="text-sm text-muted-foreground capitalize">{ai.behavioral_patterns.behavioral_insights.content_length_preference || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Engagement Style:</span>
                        <p className="text-sm text-muted-foreground capitalize">{ai.behavioral_patterns.behavioral_insights.engagement_style || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optimization Opportunities */}
                {ai.behavioral_patterns.optimization_opportunities && (ai.behavioral_patterns.optimization_opportunities || []).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Optimization Opportunities</h4>
                    <div className="space-y-2">
                      {ai.behavioral_patterns.optimization_opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trend Detection */}
          {ai?.trend_detection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trend Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ai.trend_detection.viral_potential?.note && (
                    <div>
                      <h4 className="font-medium mb-2">Viral Potential</h4>
                      <p className="text-sm text-muted-foreground">{ai.trend_detection.viral_potential.note}</p>
                    </div>
                  )}

                  {ai.trend_detection.content_trends?.note && (
                    <div>
                      <h4 className="font-medium mb-2">Content Trends</h4>
                      <p className="text-sm text-muted-foreground">{ai.trend_detection.content_trends.note}</p>
                    </div>
                  )}

                  {ai.trend_detection.trend_analysis?.note && (
                    <div>
                      <h4 className="font-medium mb-2">Trend Analysis</h4>
                      <p className="text-sm text-muted-foreground">{ai.trend_detection.trend_analysis.note}</p>
                    </div>
                  )}

                  {ai.trend_detection.optimization_recommendations && (ai.trend_detection.optimization_recommendations || []).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Optimization Recommendations</h4>
                      <div className="space-y-2">
                        {ai.trend_detection.optimization_recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Recent Posts with AI Analysis
              </CardTitle>
              <CardDescription>
                {posts?.length || 0} posts analyzed with comprehensive AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts && posts.slice(0, 12).map((post: any) => (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={post.cdn_thumbnail_url || post.display_url}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-placeholder')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-muted';
                            fallback.innerHTML = '<div class="text-muted-foreground">Image unavailable</div>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.ai_analysis?.content_category || 'Analyzing...'}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">{post.likes_count?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{post.comments_count?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Engagement Rate</span>
                            <span className="font-medium">{safePercentage(post.engagement_rate, 2)}%</span>
                          </div>
                          <Progress value={(post.engagement_rate || 0) * 100} className="h-1" />
                        </div>

                        {post.ai_analysis?.sentiment && post.ai_analysis.sentiment !== 'neutral' && (
                          <div className="flex justify-between text-xs">
                            <span>Sentiment</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {post.ai_analysis.sentiment}
                            </Badge>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {new Date(post.taken_at).toLocaleDateString()}
                        </div>

                        {post.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {post.caption}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export with React.memo for performance
export const ComprehensiveCreatorAnalytics = React.memo(ComprehensiveCreatorAnalyticsComponent)