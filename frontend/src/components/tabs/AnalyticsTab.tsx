'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
import { instagramApiService, CompleteProfileResponse } from '@/services/instagramApi'
import { SentimentAnalysis } from '@/types'
import { Loader2, TrendingUp, Users, Heart, BarChart3, Brain, Target, MessageCircle, Zap } from 'lucide-react'

export default function AnalyticsTab() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<CompleteProfileResponse['data'] | null>(null)
  const [sentimentData, setSentimentData] = useState<SentimentAnalysis | null>(null)
  const [activeModule, setActiveModule] = useState('executive')
  const [useSmartProxy, setUseSmartProxy] = useState(false)

  const modules = [
    { id: 'executive', name: 'Executive Summary', icon: BarChart3 },
    { id: 'sentiment', name: 'AI Sentiment', icon: Brain },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
    { id: 'engagement', name: 'Engagement', icon: Heart },
    { id: 'content', name: 'Content Strategy', icon: Target },
    { id: 'audience', name: 'Audience Quality', icon: Users },
    { id: 'growth', name: 'Growth Intelligence', icon: Zap },
    { id: 'posts', name: 'Posts Matrix', icon: MessageCircle },
    { id: 'optimization', name: 'AI Optimization', icon: Brain }
  ]

  const handleAnalyze = async () => {
    if (!username.trim()) return
    
    setLoading(true)
    try {
      let result;
      
      // Use the new search endpoint for profile unlocking
      result = await instagramApiService.searchProfile(username.trim())
      
      if (result.success && result.data) {
        setAnalyticsData(result.data)
        // TODO: Fetch real sentiment analysis from backend
        // fetchSentimentAnalysis(username).then(setSentimentData)
        setSentimentData(null) // Remove mock data, wait for backend implementation
      }
    } catch (err) {

    } finally {
      setLoading(false)
    }
  }

  const renderExecutiveSummary = () => {
    if (!analyticsData) return null

    // ✅ KEEP - Using pre-calculated values from enhanced backend analytics
    const analytics = analyticsData.analytics || analyticsData.profile;
    const kpis = [
      {
        title: 'Overall Engagement',
        value: analytics.engagement_rate,
        format: 'percentage',
        color: 'blue'
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {kpi.format === 'percentage' ? `${kpi.value.toFixed(1)}%` : kpi.value.toFixed(1)}
                {kpi.max && <span className="text-sm text-gray-500">/{kpi.max}</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${kpi.color}-500`}
                  style={{ width: `${((kpi.value / (kpi.max || 100)) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderSentimentAnalysis = () => {
    if (!sentimentData) return null

    const sentimentMetrics = [
      { name: 'Overall Sentiment', value: sentimentData.overall_sentiment, color: 'purple' },
      { name: 'Engagement Quality', value: sentimentData.engagement_sentiment, color: 'blue' },
      { name: 'Audience Authenticity', value: sentimentData.audience_sentiment, color: 'green' },
      { name: 'Content Performance', value: sentimentData.content_sentiment, color: 'orange' },
      { name: 'Growth Momentum', value: sentimentData.growth_sentiment, color: 'red' }
    ]

    return (
      <div className="space-y-6">
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Confidence Level: {(sentimentData.confidence * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-4">Sentiment Breakdown</h4>
                <div className="space-y-4">
                  {sentimentMetrics.map((metric) => (
                    <div key={metric.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{metric.name}</span>
                        <span className="text-sm font-medium">{metric.value.toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${metric.color}-500`}
                          style={{ width: `${(metric.value / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Key Insights</h4>
                <ul className="space-y-2">
                  {sentimentData.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerformanceAnalytics = () => {
    if (!analyticsData) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Followers</span>
              <span className="font-semibold">{formatNumber(analyticsData.profile.followers_count)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Posts Count</span>
              <span className="font-semibold">{formatNumber(analyticsData.profile.posts_count || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Content Quality</span>
              <span className="font-semibold">{(analyticsData.profile.content_quality_score || 0).toFixed(1)}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Influence Score</span>
              <span className="font-semibold">{(analyticsData.profile.influence_score || 0).toFixed(1)}/10</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Content distribution data not available
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCurrentModule = () => {
    switch (activeModule) {
      case 'executive':
        return renderExecutiveSummary()
      case 'sentiment':
        return renderSentimentAnalysis()
      case 'performance':
        return renderPerformanceAnalytics()
      case 'engagement':
        return <div className="text-center py-8 text-gray-500">Engagement module coming soon...</div>
      case 'content':
        return <div className="text-center py-8 text-gray-500">Content strategy module coming soon...</div>
      case 'audience':
        return <div className="text-center py-8 text-gray-500">Audience quality module coming soon...</div>
      case 'growth':
        return <div className="text-center py-8 text-gray-500">Growth intelligence module coming soon...</div>
      case 'posts':
        return <div className="text-center py-8 text-gray-500">Posts matrix module coming soon...</div>
      case 'optimization':
        return <div className="text-center py-8 text-gray-500">AI optimization module coming soon...</div>
      default:
        return renderExecutiveSummary()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Advanced Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Search to unlock 30-day access, then view detailed analytics instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username to unlock analytics..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !username.trim()}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search & Unlock'
              )}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSmartProxy}
                onChange={(e) => setUseSmartProxy(e.target.checked)}
                className="rounded border-gray-300"
              />
              Use SmartProxy (Premium)
            </label>
            <Badge variant="outline" className="text-xs">
              {useSmartProxy ? 'SmartProxy API' : 'In-house Scraper'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* Module Navigation */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                {modules.map((module) => {
                  const Icon = module.icon
                  return (
                    <Button
                      key={module.id}
                      variant={activeModule === module.id ? "default" : "outline"}
                      onClick={() => setActiveModule(module.id)}
                      className="flex flex-col gap-1 h-auto py-3"
                      size="sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{module.name}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Module Content */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(modules.find(m => m.id === activeModule)?.icon || BarChart3, { className: "w-5 h-5" })}
                {modules.find(m => m.id === activeModule)?.name}
              </CardTitle>
              <CardDescription>
                Analyzing @{analyticsData.profile.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCurrentModule()}
            </CardContent>
          </Card>
        </>
      )}

      {!analyticsData && (
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">📊 Analytics Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modules.slice(0, 6).map((module) => {
                const Icon = module.icon
                return (
                  <div key={module.id} className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                    <Icon className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{module.name}</h3>
                      <p className="text-sm text-gray-600">Advanced insights</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}