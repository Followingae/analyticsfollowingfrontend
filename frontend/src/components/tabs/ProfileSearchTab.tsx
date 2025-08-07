'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage, isValidProfile } from '@/lib/utils'
import { ProfileAvatar } from '@/components/ui/profile-avatar'
import { instagramApiService, CompleteProfileResponse } from '@/services/instagramApi'
import { Loader2, Search, Instagram, Users, Heart, BarChart3, Target, TrendingUp, Clock, Zap, Star, CheckCircle2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfileSearchTab() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<CompleteProfileResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchUsernames, setBatchUsernames] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [useSmartProxy, setUseSmartProxy] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!username.trim()) return
    
    const cleanUsername = username.trim().replace('@', '')
    setLoading(true)
    setError(null)
    setProfileData(null)
    
    console.log(`🔍 Starting profile search for: @${cleanUsername}`)
    
    try {
      const result = await instagramApiService.searchProfile(cleanUsername)
      
      if (result.success && result.data) {
        setProfileData(result.data)
        console.log('✅ Profile unlocked! User can now view analytics instantly.')
      } else {
        setError(result.error || 'Profile search failed')
      }
    } catch (err) {
      console.error('Profile search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during search')
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

      {/* Profile Results */}
      {profileData && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  src={profileData.profile.profile_pic_url}
                  alt={profileData.profile.username}
                  fallbackText={profileData.profile.username}
                  size="lg"
                  className="w-20 h-20 border-4 border-white"
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
                  {/* TODO: Add external_url to backend response if available */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(profileData.profile.followers_count)}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(profileData.profile.following_count || 0)}
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
                      @{profileData.profile.username} is now available for detailed analytics
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push(`/analytics/${profileData.profile.username}`)}
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

            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  Advanced metrics not available
                </div>
              </CardContent>
            </Card>
          </div>

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