'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProfileAvatar } from '@/components/ui/profile-avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { creatorApiService } from '@/services/creatorApi'
import { CreatorProfile } from '@/types/creator'
import { Loader2, Search, Hash, TrendingUp, Filter, Users } from 'lucide-react'

export default function DiscoveryTab() {
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [filters, setFilters] = useState({
    follower_count_min: 1000,
    follower_count_max: 1000000,
    engagement_rate_min: 0.01,
    engagement_rate_max: 0.10,
    content_categories: [] as string[],
    languages: [] as string[]
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleDiscovery = async () => {
    setLoading(true)
    try {
      const result = await creatorApiService.getUnlockedCreators({
        limit: 20,
        offset: 0,
        min_followers: filters.follower_count_min,
        max_followers: filters.follower_count_max,
        min_engagement_rate: filters.engagement_rate_min,
        max_engagement_rate: filters.engagement_rate_max,
        content_categories: filters.content_categories,
        languages: filters.languages,
        sort_by: 'engagement_rate',
        sort_order: 'desc'
      })
      
      if (result.success && result.data) {
        setCreators(result.data.creators)
      } else {
        setCreators([])
      }
    } catch (err) {
      console.error('Discovery failed:', err)
      setCreators([])
    } finally {
      setLoading(false)
    }
  }

  const trendingNiches = [
    { name: 'Fashion', count: '2.5M', growth: '+15%' },
    { name: 'Fitness', count: '1.8M', growth: '+12%' },
    { name: 'Food', count: '3.1M', growth: '+8%' },
    { name: 'Travel', count: '2.2M', growth: '+20%' },
    { name: 'Tech', count: '980K', growth: '+25%' },
    { name: 'Beauty', count: '1.5M', growth: '+10%' }
  ]

  const handleNicheClick = (niche: string) => {
    setFilters(prev => ({ 
      ...prev, 
      content_categories: [niche.toLowerCase()] 
    }))
    // Auto-trigger discovery when niche is clicked
    setLoading(true)
    setTimeout(() => {
      handleDiscovery()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Hashtag Discovery */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Hashtag-Based Discovery
          </CardTitle>
          <CardDescription>
            Discover trending creators and unlocked profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search unlocked creators..."
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button 
              onClick={handleDiscovery} 
              disabled={loading}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Followers</label>
                    <Input
                      type="number"
                      value={filters.follower_count_min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        follower_count_min: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Followers</label>
                    <Input
                      type="number"
                      value={filters.follower_count_max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        follower_count_max: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Engagement %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={filters.engagement_rate_min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        engagement_rate_min: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Engagement %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={filters.engagement_rate_max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        engagement_rate_max: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Trending Niches */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trending Niches
          </CardTitle>
          <CardDescription>
            Discover growing niches and creator categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trendingNiches.map((niche) => (
              <Card 
                key={niche.name} 
                className="cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50"
                onClick={() => handleNicheClick(niche.name.toLowerCase())}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-semibold text-gray-800">{niche.name}</div>
                  <div className="text-sm text-gray-600">{niche.count} creators</div>
                  <Badge variant="secondary" className="mt-2 text-green-600">
                    {niche.growth}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Creator Results */}
      {creators.length > 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Discovered Creators ({creators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <Card key={creator.username}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <ProfileAvatar
                        src={creator.profile_pic_url_hd || creator.profile_pic_url}
                        alt={creator.username}
                        fallbackText={creator.username}
                        size="lg"
                        className="border-2 border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {creator.full_name}
                          </h3>
                          {creator.is_verified && (
                            <Badge className="bg-blue-500 text-xs">✓</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Followers</span>
                        <span className="font-medium">{formatNumber(creator.followers_count)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Engagement</span>
                        <span className="font-medium">{creator.engagement_rate ? `${(creator.engagement_rate * 100).toFixed(1)}%` : 'N/A'}</span>
                      </div>
                      {creator.ai_insights?.content_category && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Category</span>
                          <Badge variant="outline" className="text-xs">{creator.ai_insights.content_category}</Badge>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Posts</span>
                        <span className="font-medium">{formatNumber(creator.posts_count)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => {
                        // Navigate to analytics page
                        window.open(`/analytics/${creator.username}`, '_blank')
                      }}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovery Tips */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Discovery Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Use specific hashtags for better targeted results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Combine multiple hashtags to find niche creators</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Adjust filters to find creators that match your criteria</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Click on trending niches for quick discovery</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}