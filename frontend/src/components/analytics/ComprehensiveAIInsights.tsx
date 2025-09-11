'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Brain,
  TrendingUp,
  Shield,
  Users,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Clock,
  Star,
  Award,
  Lightbulb,
  Globe,
  Languages,
  Palette,
  TrendingUp as Trending
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Bar,
  Pie,
  ResponsiveContainer
} from 'recharts'
import { ComprehensiveAnalysisResponse } from '@/types/comprehensiveAnalytics'

interface ComprehensiveAIInsightsProps {
  username: string
  analysis: ComprehensiveAnalysisResponse['analysis'] | null
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export function ComprehensiveAIInsights({
  username,
  analysis,
  isLoading = false,
  error = null,
  onRefresh
}: ComprehensiveAIInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
            <CardTitle>AI Intelligence Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-primary animate-spin" />
              <div>
                <p className="font-medium">Processing with 10-Model AI System...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing behavioral patterns, content quality, and audience insights
                </p>
              </div>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="ml-4">
              Retry Analysis
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">AI Analysis Not Available</h3>
          <p className="text-muted-foreground">
            Advanced AI insights are not yet available for this profile.
          </p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Start AI Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const sentimentTrendData = analysis.behavioral_patterns?.engagement_patterns ? 
    [
      { name: 'Engagement Rate', value: analysis.behavioral_patterns.engagement_patterns.average_engagement_rate * 100 },
      { name: 'Quality Score', value: analysis.audience_quality?.engagement_authenticity * 100 || 0 },
      { name: 'Authenticity', value: analysis.fraud_detection?.authenticity_score * 100 || 0 }
    ] : []

  const audienceQualityData = [
    { name: 'Real Audience', value: analysis.audience_quality?.real_audience_percentage || 0, color: '#22c55e' },
    { name: 'Suspicious', value: 100 - (analysis.audience_quality?.real_audience_percentage || 0), color: '#ef4444' }
  ]

  const topicsData = analysis.advanced_nlp?.topic_modeling?.slice(0, 5).map(topic => ({
    topic: topic.topic,
    weight: topic.weight * 100
  })) || []

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-xl">10-Model AI Intelligence Analysis</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-white/50">
                @{username}
              </Badge>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Comprehensive analysis powered by advanced machine learning models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.audience_quality?.audience_quality_grade || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Audience Quality</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(analysis.fraud_detection?.authenticity_score * 100 || 0)}%
              </div>
              <p className="text-sm text-muted-foreground">Authenticity Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(analysis.visual_analysis?.aesthetic_consistency_score * 100 || 0)}%
              </div>
              <p className="text-sm text-muted-foreground">Visual Consistency</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(analysis.trend_detection?.viral_potential_score * 100 || 0)}%
              </div>
              <p className="text-sm text-muted-foreground">Viral Potential</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="behavioral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="behavioral">
            <Activity className="w-4 h-4 mr-2" />
            Behavioral
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="w-4 h-4 mr-2" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Palette className="w-4 h-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="content">
            <MessageSquare className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Behavioral Patterns Tab */}
        <TabsContent value="behavioral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Posting Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Frequency:</span>
                  <Badge variant="outline">
                    {analysis.behavioral_patterns?.posting_consistency?.frequency || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Consistency Score:</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={analysis.behavioral_patterns?.posting_consistency?.consistency_score * 100 || 0} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm">
                      {Math.round(analysis.behavioral_patterns?.posting_consistency?.consistency_score * 100 || 0)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Optimal Times:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.behavioral_patterns?.posting_consistency?.optimal_times?.map((time, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Engagement Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Rate:</span>
                  <span className="text-sm font-bold text-green-600">
                    {(analysis.behavioral_patterns?.engagement_patterns?.average_engagement_rate * 100 || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Trend:</span>
                  <Badge 
                    variant={
                      analysis.behavioral_patterns?.engagement_patterns?.engagement_trend === 'increasing' 
                        ? 'default' 
                        : analysis.behavioral_patterns?.engagement_patterns?.engagement_trend === 'stable' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {analysis.behavioral_patterns?.engagement_patterns?.engagement_trend || 'Unknown'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Peak Times:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.behavioral_patterns?.engagement_patterns?.peak_engagement_times?.map((time, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-purple-600" />
                <span>Content Evolution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Style Changes:</p>
                  <div className="space-y-1">
                    {analysis.behavioral_patterns?.content_evolution?.style_changes?.map((change, index) => (
                      <Badge key={index} variant="outline" className="text-xs mr-1">
                        {change}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Quality Trend:</p>
                  <Badge 
                    variant={
                      analysis.behavioral_patterns?.content_evolution?.quality_trend === 'improving' 
                        ? 'default' 
                        : analysis.behavioral_patterns?.content_evolution?.quality_trend === 'stable' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {analysis.behavioral_patterns?.content_evolution?.quality_trend || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Topic Shifts:</p>
                  <div className="space-y-1">
                    {analysis.behavioral_patterns?.content_evolution?.topic_shifts?.slice(0, 3).map((shift, index) => (
                      <Badge key={index} variant="outline" className="text-xs mr-1">
                        {shift}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Quality Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Audience Authenticity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quality Grade:</span>
                    <Badge 
                      variant={
                        ['A', 'B'].includes(analysis.audience_quality?.audience_quality_grade || '') 
                          ? 'default' 
                          : ['C'].includes(analysis.audience_quality?.audience_quality_grade || '') 
                          ? 'secondary' 
                          : 'destructive'
                      }
                      className="text-lg px-3 py-1"
                    >
                      {analysis.audience_quality?.audience_quality_grade || 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Engagement Authenticity:</span>
                      <span className="text-sm font-bold">
                        {Math.round(analysis.audience_quality?.engagement_authenticity * 100 || 0)}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.audience_quality?.engagement_authenticity * 100 || 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Real Audience:</span>
                      <span className="text-sm font-bold text-green-600">
                        {analysis.audience_quality?.real_audience_percentage || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.audience_quality?.real_audience_percentage || 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <span>Audience Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    real: { label: 'Real Audience', color: '#22c55e' },
                    suspicious: { label: 'Suspicious', color: '#ef4444' }
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={audienceQualityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {audienceQualityData.map((entry, index) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <span>Audience Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Age Groups</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.audience_insights?.demographic_predictions?.age_groups || {}).map(([age, percentage]) => (
                      <div key={age} className="flex justify-between items-center">
                        <span className="text-sm">{age}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={Number(percentage)} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">{Number(percentage).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Top Interests</h4>
                  <div className="space-y-1">
                    {analysis.audience_insights?.interest_mapping?.slice(0, 5).map((interest, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {interest.interest}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(interest.affinity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Geographic Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.audience_insights?.demographic_predictions?.geographic_distribution || {}).slice(0, 5).map(([location, percentage]) => (
                      <div key={location} className="flex justify-between items-center">
                        <span className="text-sm">{location}</span>
                        <span className="text-xs text-muted-foreground">{Number(percentage).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Analysis Tab */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-pink-600" />
                  <span>Visual Consistency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Aesthetic Score:</span>
                  <span className="text-lg font-bold text-pink-600">
                    {Math.round(analysis.visual_analysis?.aesthetic_consistency_score * 100 || 0)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.visual_analysis?.aesthetic_consistency_score * 100 || 0} 
                  className="h-3"
                />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Visual Themes:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.visual_analysis?.visual_themes?.map((theme, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Color Palette:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.visual_analysis?.color_palette_analysis?.map((color, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Content Type Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.visual_analysis?.image_vs_video_breakdown || {}).map(([type, percentage]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <span className="text-sm font-bold">{Number(percentage).toFixed(1)}%</span>
                      </div>
                      <Progress value={Number(percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trending className="h-5 w-5 text-orange-600" />
                  <span>Trending Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.trend_detection?.trending_topics?.slice(0, 5).map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{topic.topic}</p>
                        <Badge 
                          variant={
                            topic.trend_direction === 'rising' 
                              ? 'default' 
                              : topic.trend_direction === 'stable' 
                              ? 'secondary' 
                              : 'destructive'
                          }
                          className="text-xs mt-1"
                        >
                          {topic.trend_direction}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{(topic.relevance_score * 100).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">relevance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Viral Potential</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {Math.round(analysis.trend_detection?.viral_potential_score * 100 || 0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Viral Potential Score</p>
                </div>
                <Progress 
                  value={analysis.trend_detection?.viral_potential_score * 100 || 0} 
                  className="h-4"
                />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Seasonal Patterns:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(analysis.trend_detection?.seasonal_patterns || {}).map(([season, score]) => (
                      <div key={season} className="flex justify-between items-center">
                        <span className="text-xs capitalize">{season}</span>
                        <span className="text-xs font-bold">{Number(score).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Analysis Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Content Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Content Depth:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {(analysis.advanced_nlp?.content_depth_score * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.advanced_nlp?.content_depth_score * 100 || 0} 
                  className="h-2"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Vocabulary Diversity:</span>
                  <span className="text-sm font-bold text-green-600">
                    {(analysis.advanced_nlp?.vocabulary_diversity * 100 || 0).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.advanced_nlp?.vocabulary_diversity * 100 || 0} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Languages className="h-5 w-5 text-purple-600" />
                  <span>Top Keywords</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.advanced_nlp?.keyword_extraction?.slice(0, 8).map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {keyword.keyword}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {keyword.frequency}x
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          keyword.sentiment > 0.3 ? 'bg-green-500' : 
                          keyword.sentiment < -0.3 ? 'bg-red-500' : 
                          'bg-gray-400'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <span>Topic Modeling</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicsData.length > 0 && (
                <ChartContainer
                  config={{
                    weight: { label: 'Topic Weight', color: '#6366f1' }
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={topicsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="weight" fill="#6366f1" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Account Authenticity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Authenticity Score:</span>
                  <span className="text-lg font-bold text-green-600">
                    {Math.round(analysis.fraud_detection?.authenticity_score * 100 || 0)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.fraud_detection?.authenticity_score * 100 || 0} 
                  className="h-3"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge 
                    variant={
                      analysis.fraud_detection?.risk_level === 'low' 
                        ? 'default' 
                        : analysis.fraud_detection?.risk_level === 'medium' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {analysis.fraud_detection?.risk_level || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Status:</span>
                  <Badge 
                    variant={
                      analysis.fraud_detection?.verification_status === 'verified' 
                        ? 'default' 
                        : analysis.fraud_detection?.verification_status === 'suspected' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {analysis.fraud_detection?.verification_status || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Risk Indicators</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.fraud_detection?.suspicious_activity_indicators?.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.fraud_detection.suspicious_activity_indicators.map((indicator, index) => (
                      <Alert key={index} className="py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {indicator}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No suspicious activity detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}