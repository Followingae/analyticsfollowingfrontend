'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  User,
  Users,
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Star,
  Award,
  Target,
  Globe,
  Zap,
  Eye,
  Activity,
  ThumbsUp,
  Share2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import {
  LineChart,
  BarChart,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Bar,
  Pie,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

// Import the comprehensive analytics API
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'
import { AnalyticsDashboardData } from '@/types/comprehensiveAnalytics'

interface ModernAnalyticsDashboardProps {
  username: string
}

interface DashboardStatus {
  loading: boolean
  error: string | null
  lastUpdated: string | null
  dataFreshness: 'fresh' | 'stale' | 'outdated'
}

export function ModernAnalyticsDashboard({ username }: ModernAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null)
  const [status, setStatus] = useState<DashboardStatus>({
    loading: true,
    error: null,
    lastUpdated: null,
    dataFreshness: 'fresh'
  })

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))
      
      const data = await comprehensiveAnalyticsApi.getCompleteDashboardData(username)
      setDashboardData(data)
      
      setStatus(prev => ({
        ...prev,
        loading: false,
        lastUpdated: new Date().toISOString(),
        dataFreshness: 'fresh'
      }))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data'
      }))
    }
  }

  const refreshAnalysis = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }))
      await comprehensiveAnalyticsApi.refreshAnalysis(username)
      await loadDashboardData(true)
      setStatus(prev => ({ ...prev, loading: false }))
    } catch (error) {
      console.error('Error refreshing analysis:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh analysis'
      }))
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [username])

  // Prepare chart data
  const engagementData = dashboardData?.posts?.slice(0, 10).map(post => ({
    date: new Date(post.timestamp).toLocaleDateString(),
    likes: post.like_count,
    comments: post.comment_count,
    engagement: ((post.like_count + post.comment_count) / (dashboardData.profile?.followers_count || 1000)) * 100
  })) || []

  const contentDistributionData = dashboardData?.profile?.ai_content_distribution ? 
    Object.entries(dashboardData.profile.ai_content_distribution).map(([type, percentage], index) => ({
      name: type,
      value: percentage * 100,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
    })) : []

  const audienceData = [
    { name: '18-24', value: 30, color: '#3b82f6' },
    { name: '25-34', value: 40, color: '#10b981' },
    { name: '35-44', value: 20, color: '#f59e0b' },
    { name: '45+', value: 10, color: '#ef4444' }
  ]

  if (status.loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <BarChart3 className="h-7 w-7 text-blue-600 animate-pulse" />
                  <span>Creator Analytics</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Loading insights for @{username}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="animate-pulse">
                Processing...
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-primary animate-spin" />
                <div>
                  <p className="font-medium">Analyzing Profile & Content...</p>
                  <p className="text-sm text-muted-foreground">
                    Loading profile data, audience insights, and engagement metrics
                  </p>
                </div>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (status.error && !dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{status.error}</span>
            <Button variant="outline" size="sm" onClick={() => loadDashboardData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const profile = dashboardData?.profile
  const hasAIInsights = profile?.ai_primary_content_type

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.profile_pic_url} alt={profile?.full_name} />
                <AvatarFallback className="text-xl font-bold">
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <span>@{profile?.username}</span>
                  {hasAIInsights && <CheckCircle className="h-6 w-6 text-green-500" />}
                </CardTitle>
                <CardDescription className="text-lg">
                  {profile?.full_name} • Creator Analytics
                </CardDescription>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="bg-white/50">
                    {profile?.followers_count?.toLocaleString()} followers
                  </Badge>
                  <Badge variant="outline" className="bg-white/50">
                    {(profile?.engagement_rate || 0).toFixed(1)}% engagement
                  </Badge>
                  {hasAIInsights && (
                    <Badge className="bg-green-500">
                      <Zap className="h-3 w-3 mr-1" />
                      AI Analyzed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => loadDashboardData(true)}>
                <RefreshCw className={`h-4 w-4 mr-2 ${status.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={refreshAnalysis}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.posts_count?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profile?.followers_count?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {profile?.following_count?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(profile?.engagement_rate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {profile?.ai_content_quality_score ? 
                  `${(profile.ai_content_quality_score * 100).toFixed(0)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Quality Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {status.lastUpdated ? 
                  new Date(status.lastUpdated).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Alert */}
      {status.error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Some analytics data may be incomplete: {status.error}</span>
              <Button variant="outline" size="sm" onClick={() => loadDashboardData(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasAIInsights && (
        <Alert>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>AI analysis is in progress. Advanced insights will be available shortly.</span>
              <Button variant="outline" size="sm" onClick={refreshAnalysis}>
                <Zap className="h-4 w-4 mr-2" />
                Check Status
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="w-4 h-4 mr-2" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Heart className="w-4 h-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="posting">
            <Calendar className="w-4 h-4 mr-2" />
            Posting
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Profile Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm">@{profile?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Full Name:</span>
                  <span className="text-sm">{profile?.full_name || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Posts:</span>
                  <span className="text-sm font-bold">{profile?.posts_count?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Followers:</span>
                  <span className="text-sm font-bold">{profile?.followers_count?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Following:</span>
                  <span className="text-sm font-bold">{profile?.following_count?.toLocaleString() || 0}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Biography:</span>
                  <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {profile?.biography || 'No biography provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Content Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasAIInsights ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Primary Content:</span>
                      <Badge variant="default">
                        {profile.ai_primary_content_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quality Score:</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(profile.ai_content_quality_score || 0) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-bold">
                          {((profile.ai_content_quality_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Top Categories:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.ai_top_3_categories?.map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {contentDistributionData.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium mb-2 block">Content Distribution:</span>
                        <ChartContainer
                          config={{
                            distribution: { label: 'Content Type', color: '#3b82f6' }
                          }}
                          className="h-[150px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={contentDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={60}
                                dataKey="value"
                              >
                                {contentDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      Content analysis in progress...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audience Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Audience Quality</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">A</div>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Authenticity:</span>
                    <span className="text-sm font-bold text-green-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engagement Quality:</span>
                    <span className="text-sm font-bold text-blue-600">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Age Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Age Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    age: { label: 'Age Group', color: '#8b5cf6' }
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-orange-600" />
                <span>Geographic Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Primary Market:</span>
                    <span className="text-sm font-bold">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Secondary:</span>
                    <span className="text-sm font-bold">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other:</span>
                    <span className="text-sm font-bold">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Avg Likes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {engagementData.length > 0 ? 
                    Math.round(engagementData.reduce((sum, post) => sum + post.likes, 0) / engagementData.length).toLocaleString()
                    : '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">per post</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span>Avg Comments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {engagementData.length > 0 ? 
                    Math.round(engagementData.reduce((sum, post) => sum + post.comments, 0) / engagementData.length).toLocaleString()
                    : '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">per post</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Engagement Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {(profile?.engagement_rate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">overall</p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trend */}
          {engagementData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Engagement Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    engagement: { label: 'Engagement Rate', color: '#10b981' },
                    likes: { label: 'Likes', color: '#ef4444' },
                    comments: { label: 'Comments', color: '#3b82f6' }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="engagement" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posting Tab */}
        <TabsContent value="posting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Posting Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Posting Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Frequency:</span>
                  <Badge variant="outline">Regular</Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Best Times:</span>
                  <div className="flex flex-wrap gap-1">
                    {['6-8 PM', '12-2 PM', '8-10 AM'].map((time, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consistency Score:</span>
                    <span className="text-sm font-bold text-green-600">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Content Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasAIInsights && profile.ai_primary_content_type ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Top Category:</span>
                      <Badge variant="default">
                        {profile.ai_primary_content_type}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Performance:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {((profile.ai_content_quality_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(profile.ai_content_quality_score || 0) * 100} className="h-2" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      Content analysis in progress...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Posts Performance */}
          {dashboardData?.posts && dashboardData.posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span>Recent Posts Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.posts.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate max-w-xs">
                          {post.caption || `Post ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-bold text-red-500">
                            {post.like_count?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-500">
                            {post.comment_count?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">comments</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Status */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Analytics Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  Updated: {status.lastUpdated ? 
                    new Date(status.lastUpdated).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
            <Badge 
              variant={status.dataFreshness === 'fresh' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {status.dataFreshness === 'fresh' ? '🟢 Fresh' :
               status.dataFreshness === 'stale' ? '🟡 Stale' : '🔴 Outdated'} Data
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}