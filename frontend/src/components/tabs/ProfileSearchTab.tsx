'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage, isValidProfile } from '@/lib/utils'
import { ProfileAvatar } from '@/components/ui/cdn-image'
import { creatorApiService } from '@/services/creatorApi'
import { CreatorSearchResponse } from '@/types/creator'
import { useCreatorSearch } from '@/hooks/useCreatorSearch'
import { Loader2, Search, Instagram, Users, Heart, BarChart3, Target, TrendingUp, Clock, Zap, Star, CheckCircle2, ExternalLink, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AIInsightsCard } from '@/components/ai-insights/AIInsightsCard'
import { AnalysisStatusCard } from '@/components/ai-insights/AnalysisStatusCard'

export default function ProfileSearchTab() {
  const [username, setUsername] = useState('')
  const { 
    profile, 
    loading, 
    error, 
    analysisStatus, 
    searchCreator, 
    retryAnalysis, 
    clearSearch 
  } = useCreatorSearch()
  const [batchUsernames, setBatchUsernames] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [useSmartProxy, setUseSmartProxy] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!username.trim()) return
    
    const cleanUsername = username.trim().replace('@', '')
    await searchCreator(cleanUsername, {
      force_refresh: false,
      show_progress: true
    })
  }

  const handleBatchSearch = async () => {
    if (!batchUsernames.trim()) return
    
    const usernames = batchUsernames.split(',').map(u => u.trim()).filter(u => u.length > 0)
    if (usernames.length === 0) return

    setBatchLoading(true)
    try {
      // TODO: Implement batch analysis API when backend endpoints are ready
      // await batchApiService.batchAnalysis(usernames)

    } catch (err) {

    } finally {
      setBatchLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Profile Analysis
          </CardTitle>
          <CardDescription>
            Search and analyze Instagram profiles with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Instagram className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter Instagram username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !username.trim()}
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching...
                </>
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

          {/* Loading State with Progress */}
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Analyzing profile @{username.trim().replace('@', '')}...
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    This may take up to 2 minutes for new profiles
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Analysis */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Batch Analysis
          </CardTitle>
          <CardDescription>
            Compare multiple profiles at once (comma-separated usernames)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="username1, username2, username3..."
              value={batchUsernames}
              onChange={(e) => setBatchUsernames(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleBatchSearch} 
              disabled={batchLoading || !batchUsernames.trim()}
              variant="outline"
            >
              {batchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Compare'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status Card */}
      {analysisStatus && (
        <AnalysisStatusCard 
          status={analysisStatus}
          onRetry={retryAnalysis}
          className="mb-6"
        />
      )}

      {/* Profile Results */}
      {profile && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  profile={{
                    id: profile.id,
                    username: profile.username,
                    full_name: profile.full_name,
                    profile_pic_url: profile.profile_pic_url,
                    profile_pic_url_hd: profile.profile_pic_url_hd
                  }}
                  size="large"
                  size="lg"
                  className="w-20 h-20 border-4 border-white"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                    {profile.is_verified && (
                      <Badge className="bg-blue-500">Verified</Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-600 mb-3">
                    @{profile.username}
                  </CardDescription>
                  <p className="text-sm text-gray-700 mb-4">
                    {profile.biography}
                  </p>
                  {/* TODO: Add external_url to backend response if available */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(profile.followers_count)}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(profile.following_count || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(profile.posts_count || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {profile.engagement_rate ? `${(profile.engagement_rate * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Message and View Analysis Button */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Profile Unlocked!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      @{profile.username} is now available for detailed analytics
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push(`/analytics/${profile.username}`)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analysis (Instant)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Count</span>
                  <span className="font-semibold">{formatNumber(profile.posts_count || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold">{profile.engagement_rate ? `${(profile.engagement_rate * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
                {profile.ai_insights?.content_quality_score && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content Quality</span>
                    <span className="font-semibold">{profile.ai_insights.content_quality_score.toFixed(1)}/10</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Insights Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.ai_insights?.available ? (
                  <div className="space-y-4">
                    {/* Primary content category */}
                    {profile.ai_insights.content_category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Primary Content</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {profile.ai_insights.content_category}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Sentiment score */}
                    {profile.ai_insights.average_sentiment !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Sentiment</span>
                        <span className={`font-semibold ${
                          profile.ai_insights.average_sentiment > 0.1 ? 'text-green-600' :
                          profile.ai_insights.average_sentiment < -0.1 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {Math.round(((profile.ai_insights.average_sentiment + 1) / 2) * 100)}% positive
                        </span>
                      </div>
                    )}
                    
                    {/* Quality score */}
                    {profile.ai_insights.content_quality_score !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Quality Score</span>
                        <span className="font-semibold text-purple-600">
                          {profile.ai_insights.content_quality_score.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                    
                    {/* Analysis date */}
                    {profile.ai_insights.last_analyzed && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last AI Analysis</span>
                        <span className="text-sm text-gray-500">
                          {new Date(profile.ai_insights.last_analyzed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">AI insights processing...</p>
                    <p className="text-xs">Analysis will appear here once complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Section */}
          {profile.ai_insights?.available && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Content Intelligence</h3>
                <p className="text-gray-600">Advanced AI-powered analysis of content patterns and quality</p>
              </div>

              <AIInsightsCard 
                insights={profile.ai_insights}
                className="border-0 bg-white/80 backdrop-blur-sm"
              />
            </div>
          )}

          {/* Audience Insights & Competitor Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Audience Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Audience insights not available
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Market Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Market analysis not available
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}