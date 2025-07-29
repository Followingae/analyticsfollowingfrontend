'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage, getProfileImageUrl, isValidProfile } from '@/lib/utils'
import { instagramApiService, CompleteProfileResponse } from '@/services/instagramApi'
import { Loader2, Search, Instagram, Users, Heart, BarChart3, Target, TrendingUp, Clock, Zap, Star, CheckCircle2 } from 'lucide-react'

export default function ProfileSearchTab() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<CompleteProfileResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchUsernames, setBatchUsernames] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [useSmartProxy, setUseSmartProxy] = useState(false)

  const handleSearch = async () => {
    if (!username.trim()) return
    
    const cleanUsername = username.trim().replace('@', '')
    
    console.log(`🔄 Redirecting to creators page for analysis: @${cleanUsername}`)
    
    // Redirect to creators page to show loading state
    window.location.href = `/creators?analyzing=${encodeURIComponent(cleanUsername)}`
  }

  const handleBatchSearch = async () => {
    if (!batchUsernames.trim()) return
    
    const usernames = batchUsernames.split(',').map(u => u.trim()).filter(u => u.length > 0)
    if (usernames.length === 0) return

    setBatchLoading(true)
    try {
      // TODO: Implement batch analysis API when backend endpoints are ready
      // await batchApiService.batchAnalysis(usernames)
      console.log('Batch analysis feature will be implemented when backend endpoints are available')
    } catch (err) {
      console.error('Batch analysis failed:', err)
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
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Analyze'
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

      {/* Batch Analysis */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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

      {/* Profile Results */}
      {profileData && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Image
                  src={getProfileImageUrl(profileData.profile.profile_pic_url)}
                  alt={profileData.profile.username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-avatar.svg'
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{profileData.profile.full_name}</CardTitle>
                    {profileData.profile.is_verified && (
                      <Badge className="bg-blue-500">Verified</Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-600 mb-3">
                    @{profileData.profile.username}
                  </CardDescription>
                  <p className="text-sm text-gray-700 mb-4">
                    {profileData.profile.bio}
                  </p>
                  {/* TODO: Add external_url to backend response if available */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(profileData.profile.followers)}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(profileData.profile.following || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(profileData.profile.posts_count || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPercentage(profileData.profile.engagement_rate)}
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Count</span>
                  <span className="font-semibold">{formatNumber(profileData.profile.posts_count || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold">{(profileData.profile.engagement_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Quality</span>
                  <span className="font-semibold">{(profileData.profile.content_quality_score || 0).toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Quality Score</span>
                  <span className="font-semibold">{(profileData.profile.content_quality_score || 0).toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Influence Score</span>
                  <span className="font-semibold">{(profileData.profile.influence_score || 0).toFixed(1)}/10</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.engagement_metrics && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Like Rate</span>
                      <span className="font-semibold">{formatPercentage(profileData.engagement_metrics.like_rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comment Rate</span>
                      <span className="font-semibold">{formatPercentage(profileData.engagement_metrics.comment_rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Save Rate</span>
                      <span className="font-semibold">{formatPercentage(profileData.engagement_metrics.save_rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Share Rate</span>
                      <span className="font-semibold">{formatPercentage(profileData.engagement_metrics.share_rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reach Rate</span>
                      <span className="font-semibold">{formatPercentage(profileData.engagement_metrics.reach_rate)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audience Insights & Competitor Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            {profileData.audience_insights && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Audience Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Age Group</span>
                    <span className="font-semibold">{profileData.audience_insights.primary_age_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender Split</span>
                    <span className="font-semibold">
                      {profileData.audience_insights.gender_split.female}% F / {profileData.audience_insights.gender_split.male}% M
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">Top Locations</span>
                    <div className="flex flex-wrap gap-1">
                      {profileData.audience_insights.top_locations.slice(0, 3).map((location, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">Interests</span>
                    <div className="flex flex-wrap gap-1">
                      {profileData.audience_insights.interests.slice(0, 4).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profileData.competitor_analysis && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Market Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Position</span>
                    <span className="font-semibold">{profileData.competitor_analysis.market_position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Competitive Score</span>
                    <span className="font-semibold">{profileData.competitor_analysis.competitive_score}/10</span>
                  </div>
                  {profileData.competitor_analysis.growth_opportunities.length > 0 && (
                    <div>
                      <span className="text-gray-600 block mb-2">Growth Opportunities</span>
                      <ul className="space-y-1">
                        {profileData.competitor_analysis.growth_opportunities.slice(0, 3).map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                            <span className="text-gray-700">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content Strategy */}
          {profileData.content_strategy && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Content Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Content Mix
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Photos</span>
                        <span className="font-semibold">{profileData.content_strategy.content_mix.photos}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Videos</span>
                        <span className="font-semibold">{profileData.content_strategy.content_mix.videos}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carousels</span>
                        <span className="font-semibold">{profileData.content_strategy.content_mix.carousels}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reels</span>
                        <span className="font-semibold">{profileData.content_strategy.content_mix.reels}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Hashtag Strategy
                    </h4>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Hashtag analysis will be available when implemented in backend
                      </div>
                    </div>
                  </div>
                </div>
                
                {profileData.content_strategy.primary_content_pillars.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Content Pillars</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileData.content_strategy.primary_content_pillars.map((pillar, index) => (
                        <Badge key={index} variant="outline">
                          {pillar}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profileData.content_strategy.engagement_tactics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Engagement Tactics</h4>
                    <ul className="space-y-1">
                      {profileData.content_strategy.engagement_tactics.slice(0, 4).map((tactic, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-3 h-3 text-blue-500 mt-0.5" />
                          <span className="text-gray-700">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Growth Recommendations */}
          {profileData.growth_recommendations && profileData.growth_recommendations.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {profileData.growth_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Best Posting Times */}
          {profileData.best_posting_times && profileData.best_posting_times.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Best Posting Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.best_posting_times.map((time, index) => (
                    <Badge key={index} variant="outline">
                      {time}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Quality & Meta Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Analysis Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Influence Score</span>
                <span className="font-semibold">{profileData.profile.influence_score.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Content Quality</span>
                <span className="font-semibold">{(profileData.profile.content_quality_score || 0).toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profile Type</span>
                <span className="font-semibold">
                  {profileData.profile.is_private ? 'Private' : 'Public'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}