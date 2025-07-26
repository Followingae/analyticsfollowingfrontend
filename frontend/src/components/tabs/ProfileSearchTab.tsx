'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { apiService, ProfileData } from '@/services/api'
import { Loader2, Search, Instagram, Users, Heart, BarChart3 } from 'lucide-react'

export default function ProfileSearchTab() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchUsernames, setBatchUsernames] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [useSmartProxy, setUseSmartProxy] = useState(false)

  const handleSearch = async () => {
    if (!username.trim()) return
    
    setLoading(true)
    setError(null)
    setProfileData(null)

    try {
      let result;
      
      if (useSmartProxy) {
        // Use SmartProxy first when toggle is enabled
        result = await apiService.fetchProfile(username.trim(), true)
        if (!result.success) {
          console.warn('SmartProxy failed, trying in-house scraper:', result.error)
          result = await apiService.fetchProfile(username.trim(), false)
        }
      } else {
        // Use fallback method (in-house first, then SmartProxy)
        result = await apiService.fetchProfileWithFallback(username.trim())
      }
      
      if (result.success) {
        setProfileData(result.data)
      } else {
        setError(result.error || 'Failed to fetch profile data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSearch = async () => {
    if (!batchUsernames.trim()) return
    
    const usernames = batchUsernames.split(',').map(u => u.trim()).filter(u => u.length > 0)
    if (usernames.length === 0) return

    setBatchLoading(true)
    try {
      await apiService.batchAnalysis(usernames)
      // Handle batch results
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
                  src={profileData.profile.profile_pic_url || '/placeholder-avatar.svg'}
                  alt={profileData.profile.username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
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
                    {profileData.profile.biography}
                  </p>
                  {profileData.profile.external_url && (
                    <a
                      href={profileData.profile.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {profileData.profile.external_url}
                    </a>
                  )}
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
                    {formatNumber(profileData.profile.following)}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(profileData.profile.posts_count)}
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
                  <span className="text-gray-600">Average Likes</span>
                  <span className="font-semibold">{formatNumber(profileData.profile.avg_likes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Comments</span>
                  <span className="font-semibold">{formatNumber(profileData.profile.avg_comments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Engagement</span>
                  <span className="font-semibold">{formatNumber(profileData.profile.avg_engagement)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Influence Score</span>
                  <span className="font-semibold">{profileData.profile.influence_score}/10</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Content Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Posting Hour</span>
                  <span className="font-semibold">{profileData.content_strategy.best_posting_hour}:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts Per Day</span>
                  <span className="font-semibold">{profileData.content_strategy.posting_frequency_per_day.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended Type</span>
                  <span className="font-semibold capitalize">{profileData.content_strategy.recommended_content_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Caption Length</span>
                  <span className="font-semibold">{profileData.content_strategy.avg_caption_length} chars</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Recommendations */}
          {profileData.growth_recommendations.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Growth Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {profileData.growth_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Best Posting Times */}
          {profileData.best_posting_times.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Best Posting Times</CardTitle>
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
        </div>
      )}
    </div>
  )
}