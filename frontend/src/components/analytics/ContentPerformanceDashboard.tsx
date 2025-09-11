'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Star,
  Award,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  PlayCircle,
  Camera,
  Grid3x3,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  RefreshCw,
  Download,
  Sparkles,
  Brain
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Bar,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { ContentPerformanceResponse } from '@/types/comprehensiveAnalytics'

interface ContentPerformanceDashboardProps {
  username: string
  performance: ContentPerformanceResponse['performance'] | null
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

interface RecommendationCardProps {
  recommendation: {
    recommendation_type: 'content_type' | 'posting_time' | 'topic' | 'format'
    suggestion: string
    expected_improvement: number
    confidence: number
  }
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_type': return <Camera className="h-4 w-4 text-blue-600" />
      case 'posting_time': return <Clock className="h-4 w-4 text-green-600" />
      case 'topic': return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'format': return <Grid3x3 className="h-4 w-4 text-purple-600" />
      default: return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content_type': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'posting_time': return 'bg-green-50 border-green-200 text-green-800'
      case 'topic': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'format': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${getTypeColor(recommendation.recommendation_type)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTypeIcon(recommendation.recommendation_type)}
            <Badge variant="outline" className="text-xs capitalize">
              {recommendation.recommendation_type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              +{recommendation.expected_improvement.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Expected</div>
          </div>
        </div>
        
        <p className="text-sm font-medium mb-3">{recommendation.suggestion}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <Progress value={recommendation.confidence * 100} className="w-16 h-2" />
            <span className="text-xs font-medium">{Math.round(recommendation.confidence * 100)}%</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            Apply
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ContentPerformanceDashboard({
  username,
  performance,
  isLoading = false,
  error = null,
  onRefresh
}: ContentPerformanceDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600 animate-pulse" />
            <span>Content Performance Analytics</span>
          </CardTitle>
          <CardDescription>Loading performance insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Performance Data Not Available</h3>
          <p className="text-muted-foreground">
            Content performance analytics are not yet available for this profile.
          </p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Performance
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const sentimentTimelineData = performance.sentiment_timeline?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sentiment: item.sentiment_score,
    posts: item.post_count
  })) || []

  const topCategoriesData = performance.top_categories?.map(cat => ({
    category: cat.category,
    engagement: cat.avg_engagement,
    posts: cat.post_count,
    growth: cat.growth_rate
  })) || []

  const optimalTimesData = performance.optimal_posting?.best_times?.map(time => ({
    time: `${time.day} ${time.time}`,
    reach: time.expected_reach
  })) || []

  const engagementPredictionData = performance.engagement_prediction?.map(pred => ({
    type: pred.content_type,
    predicted: pred.predicted_engagement_rate * 100,
    min: pred.confidence_interval[0] * 100,
    max: pred.confidence_interval[1] * 100
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span>Content Performance Analytics</span>
              </CardTitle>
              <CardDescription>
                AI-powered insights and recommendations for @{username}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="sentiment">
            <LineChart className="w-4 h-4 mr-2" />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="w-4 h-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Target className="w-4 h-4 mr-2" />
            Optimization
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performance.top_categories?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Content Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performance.recommendations?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">AI Recommendations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performance.optimal_posting?.best_times?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Optimal Time Slots</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performance.engagement_prediction?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Predictions Available</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Top Performing Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.top_categories?.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{category.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {category.post_count} posts
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {category.growth_rate > 0 ? (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            ) : category.growth_rate < 0 ? (
                              <ArrowDown className="h-3 w-3 text-red-600" />
                            ) : (
                              <Minus className="h-3 w-3 text-gray-600" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {category.growth_rate > 0 ? '+' : ''}{category.growth_rate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {category.avg_engagement.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">avg engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Optimal Posting Times</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.optimal_posting?.best_times?.slice(0, 5).map((time, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{time.day}</p>
                        <p className="text-sm text-muted-foreground">{time.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {time.expected_reach.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">expected reach</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Category Performance</CardTitle>
              <CardDescription>
                Engagement rates and growth trends by content category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCategoriesData.length > 0 && (
                <ChartContainer
                  config={{
                    engagement: { label: 'Avg Engagement (%)', color: '#3b82f6' },
                    growth: { label: 'Growth Rate (%)', color: '#10b981' }
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={topCategoriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="engagement" fill="#3b82f6" name="Avg Engagement (%)" />
                      <Bar dataKey="growth" fill="#10b981" name="Growth Rate (%)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performance.top_categories?.map((category, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{category.category}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Rank #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Engagement:</span>
                      <span className="font-bold text-blue-600">{category.avg_engagement.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Posts:</span>
                      <span className="font-medium">{category.post_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Growth:</span>
                      <div className="flex items-center space-x-1">
                        {category.growth_rate > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-600" />
                        ) : category.growth_rate < 0 ? (
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-600" />
                        )}
                        <span className={`font-medium ${
                          category.growth_rate > 0 ? 'text-green-600' : 
                          category.growth_rate < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {category.growth_rate > 0 ? '+' : ''}{category.growth_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis Timeline</CardTitle>
              <CardDescription>
                Content sentiment trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentimentTimelineData.length > 0 && (
                <ChartContainer
                  config={{
                    sentiment: { label: 'Sentiment Score', color: '#8b5cf6' },
                    posts: { label: 'Post Count', color: '#06b6d4' }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="sentiment"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                      <Line
                        type="monotone"
                        dataKey="posts"
                        stroke="#06b6d4"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {performance.sentiment_timeline?.filter(item => item.sentiment_score > 0.3).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Positive Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {performance.sentiment_timeline?.filter(item => 
                    Math.abs(item.sentiment_score) <= 0.3
                  ).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Neutral Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {performance.sentiment_timeline?.filter(item => item.sentiment_score < -0.3).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Negative Days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>AI-Powered Recommendations</span>
              </CardTitle>
              <CardDescription>
                Personalized suggestions to improve content performance
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performance.recommendations?.map((recommendation, index) => (
              <RecommendationCard key={index} recommendation={recommendation} />
            ))}
          </div>

          {(!performance.recommendations || performance.recommendations.length === 0) && (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Recommendations Available</h3>
                <p className="text-muted-foreground">
                  AI recommendations will appear here once enough data is collected.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span>Engagement Predictions</span>
                </CardTitle>
                <CardDescription>
                  Predicted performance by content type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.engagement_prediction?.map((prediction, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{prediction.content_type}</span>
                        <span className="text-sm font-bold text-orange-600">
                          {prediction.predicted_engagement_rate.toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={prediction.predicted_engagement_rate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Range: {prediction.confidence_interval[0].toFixed(2)}%</span>
                        <span>{prediction.confidence_interval[1].toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <span>Optimal Content Mix</span>
                </CardTitle>
                <CardDescription>
                  Recommended content type distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(performance.optimal_posting?.content_mix_recommendation || {}).map(([type, percentage]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <span className="text-sm font-bold">{Number(percentage).toFixed(0)}%</span>
                      </div>
                      <Progress value={Number(percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>Optimal Posting Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimalTimesData.length > 0 && (
                <ChartContainer
                  config={{
                    reach: { label: 'Expected Reach', color: '#10b981' }
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={optimalTimesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="reach" fill="#10b981" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}