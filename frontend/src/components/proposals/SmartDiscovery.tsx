'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

import {
  Wand2,
  Search,
  Filter,
  Star,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Play,
  Camera,
  Globe,
  Target,
  Zap,
  Crown,
  Diamond,
  RefreshCw,
  Plus,
  X
} from "lucide-react"

interface InfluencerProfile {
  id: string
  username: string
  full_name: string
  profile_image_url?: string
  followers_count: number
  following_count: number
  posts_count: number
  engagement_rate: number
  avg_likes: number
  avg_comments: number
  category: string
  verified: boolean
  location?: string
  bio?: string
  pricing?: {
    post_price_usd_cents: number
    story_price_usd_cents: number
    reel_price_usd_cents: number
  }
  ai_insights: {
    content_quality_score: number
    authenticity_score: number
    brand_safety_score: number
    audience_match_score?: number
    top_hashtags: string[]
    content_themes: string[]
    posting_frequency: string
    best_posting_times: string[]
  }
  recent_performance: {
    avg_reach_30d: number
    avg_impressions_30d: number
    growth_rate_30d: number
  }
  collaboration_history?: {
    total_brand_partnerships: number
    recent_partnerships: string[]
    partnership_success_rate: number
  }
}

interface DiscoveryFilters {
  categories: string[]
  follower_range: [number, number]
  engagement_range: [number, number]
  location?: string
  verified_only: boolean
  has_pricing: boolean
  min_content_quality: number
  min_authenticity: number
  min_brand_safety: number
  budget_range?: [number, number]
}

interface SmartDiscoveryProps {
  onInfluencerSelect?: (influencer: InfluencerProfile) => void
  onBulkSelect?: (influencers: InfluencerProfile[]) => void
  preselectedIds?: string[]
  campaignContext?: {
    brand_category: string
    target_audience: string
    campaign_objectives: string[]
    budget_total: number
  }
}

const CATEGORIES = [
  'fashion', 'beauty', 'lifestyle', 'fitness', 'food', 'travel',
  'technology', 'gaming', 'automotive', 'home_decor', 'parenting',
  'business', 'education', 'entertainment', 'sports', 'health'
]

const LOCATIONS = [
  'UAE', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Saudi Arabia', 'Qatar',
  'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Lebanon', 'Jordan'
]

export function SmartDiscovery({
  onInfluencerSelect,
  onBulkSelect,
  preselectedIds = [],
  campaignContext
}: SmartDiscoveryProps) {
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(preselectedIds)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('smart')

  const [filters, setFilters] = useState<DiscoveryFilters>({
    categories: campaignContext?.brand_category ? [campaignContext.brand_category] : [],
    follower_range: [10000, 1000000],
    engagement_range: [2, 10],
    verified_only: false,
    has_pricing: false,
    min_content_quality: 70,
    min_authenticity: 80,
    min_brand_safety: 90,
    budget_range: campaignContext?.budget_total ? [1000, campaignContext.budget_total / 100] : undefined
  })

  const [smartRecommendations, setSmartRecommendations] = useState<{
    top_matches: InfluencerProfile[]
    rising_stars: InfluencerProfile[]
    value_picks: InfluencerProfile[]
    premium_tier: InfluencerProfile[]
  }>({
    top_matches: [],
    rising_stars: [],
    value_picks: [],
    premium_tier: []
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadInfluencers()
  }, [filters])

  const loadInfluencers = async () => {
    setLoading(true)
    try {
      // Mock data - this would be replaced with actual API calls
      const mockProfiles: InfluencerProfile[] = [
        {
          id: '1',
          username: 'fashionista_uae',
          full_name: 'Layla Al-Rashid',
          profile_image_url: '/api/placeholder/150/150',
          followers_count: 125000,
          following_count: 1850,
          posts_count: 2340,
          engagement_rate: 4.2,
          avg_likes: 5250,
          avg_comments: 280,
          category: 'fashion',
          verified: true,
          location: 'Dubai, UAE',
          bio: 'Fashion enthusiast | Lifestyle blogger | Dubai-based',
          pricing: {
            post_price_usd_cents: 50000, // $500
            story_price_usd_cents: 25000, // $250
            reel_price_usd_cents: 75000   // $750
          },
          ai_insights: {
            content_quality_score: 92,
            authenticity_score: 88,
            brand_safety_score: 95,
            audience_match_score: 94,
            top_hashtags: ['#fashion', '#dubai', '#lifestyle', '#ootd', '#style'],
            content_themes: ['fashion', 'lifestyle', 'travel', 'beauty'],
            posting_frequency: '1-2 posts per day',
            best_posting_times: ['9:00 AM', '2:00 PM', '7:00 PM']
          },
          recent_performance: {
            avg_reach_30d: 89000,
            avg_impressions_30d: 142000,
            growth_rate_30d: 5.2
          },
          collaboration_history: {
            total_brand_partnerships: 45,
            recent_partnerships: ['Zara', 'Sephora', 'Louis Vuitton'],
            partnership_success_rate: 92
          }
        },
        {
          id: '2',
          username: 'tech_reviewer_dubai',
          full_name: 'Omar Khalil',
          profile_image_url: '/api/placeholder/150/150',
          followers_count: 89000,
          following_count: 650,
          posts_count: 1240,
          engagement_rate: 3.8,
          avg_likes: 3380,
          avg_comments: 195,
          category: 'technology',
          verified: false,
          location: 'Dubai, UAE',
          bio: 'Tech reviews | Gadget unboxing | AI enthusiast',
          pricing: {
            post_price_usd_cents: 40000, // $400
            story_price_usd_cents: 20000, // $200
            reel_price_usd_cents: 60000   // $600
          },
          ai_insights: {
            content_quality_score: 88,
            authenticity_score: 91,
            brand_safety_score: 93,
            audience_match_score: 87,
            top_hashtags: ['#tech', '#review', '#gadgets', '#ai', '#dubai'],
            content_themes: ['technology', 'reviews', 'unboxing', 'tutorials'],
            posting_frequency: '3-4 posts per week',
            best_posting_times: ['11:00 AM', '4:00 PM', '8:00 PM']
          },
          recent_performance: {
            avg_reach_30d: 67000,
            avg_impressions_30d: 98000,
            growth_rate_30d: 3.1
          },
          collaboration_history: {
            total_brand_partnerships: 28,
            recent_partnerships: ['Samsung', 'Apple', 'Huawei'],
            partnership_success_rate: 89
          }
        },
        {
          id: '3',
          username: 'healthy_lifestyle_me',
          full_name: 'Sarah Ahmed',
          profile_image_url: '/api/placeholder/150/150',
          followers_count: 67000,
          following_count: 420,
          posts_count: 890,
          engagement_rate: 5.7,
          avg_likes: 3819,
          avg_comments: 215,
          category: 'fitness',
          verified: false,
          location: 'Abu Dhabi, UAE',
          bio: 'Fitness coach | Nutrition specialist | Healthy living advocate',
          pricing: {
            post_price_usd_cents: 35000, // $350
            story_price_usd_cents: 18000, // $180
            reel_price_usd_cents: 45000   // $450
          },
          ai_insights: {
            content_quality_score: 85,
            authenticity_score: 94,
            brand_safety_score: 96,
            audience_match_score: 90,
            top_hashtags: ['#fitness', '#health', '#nutrition', '#wellness', '#abudhabi'],
            content_themes: ['fitness', 'nutrition', 'wellness', 'motivation'],
            posting_frequency: '1 post per day',
            best_posting_times: ['6:00 AM', '12:00 PM', '6:00 PM']
          },
          recent_performance: {
            avg_reach_30d: 45000,
            avg_impressions_30d: 78000,
            growth_rate_30d: 8.3
          },
          collaboration_history: {
            total_brand_partnerships: 18,
            recent_partnerships: ['Nike', 'Adidas', 'MyProtein'],
            partnership_success_rate: 95
          }
        }
      ]

      // Filter profiles based on current filters
      const filteredProfiles = mockProfiles.filter(profile => {
        const categoryMatch = filters.categories.length === 0 || filters.categories.includes(profile.category)
        const followerMatch = profile.followers_count >= filters.follower_range[0] &&
                             profile.followers_count <= filters.follower_range[1]
        const engagementMatch = profile.engagement_rate >= filters.engagement_range[0] &&
                               profile.engagement_rate <= filters.engagement_range[1]
        const verifiedMatch = !filters.verified_only || profile.verified
        const pricingMatch = !filters.has_pricing || !!profile.pricing
        const qualityMatch = profile.ai_insights.content_quality_score >= filters.min_content_quality
        const authenticityMatch = profile.ai_insights.authenticity_score >= filters.min_authenticity
        const brandSafetyMatch = profile.ai_insights.brand_safety_score >= filters.min_brand_safety

        return categoryMatch && followerMatch && engagementMatch &&
               verifiedMatch && pricingMatch && qualityMatch &&
               authenticityMatch && brandSafetyMatch
      })

      setProfiles(filteredProfiles)

      // Generate smart recommendations
      setSmartRecommendations({
        top_matches: filteredProfiles.slice(0, 3),
        rising_stars: filteredProfiles.filter(p => p.recent_performance.growth_rate_30d > 5),
        value_picks: filteredProfiles.filter(p => p.pricing && p.engagement_rate > 4),
        premium_tier: filteredProfiles.filter(p => p.verified && p.followers_count > 100000)
      })

    } catch (error) {
      console.error('Failed to load influencers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600'
    if (rate >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleProfileSelect = (profile: InfluencerProfile) => {
    if (selectedProfiles.includes(profile.id)) {
      setSelectedProfiles(prev => prev.filter(id => id !== profile.id))
    } else {
      setSelectedProfiles(prev => [...prev, profile.id])
    }

    if (onInfluencerSelect) {
      onInfluencerSelect(profile)
    }
  }

  const handleBulkSelection = (profileIds: string[]) => {
    setSelectedProfiles(prev => [...new Set([...prev, ...profileIds])])

    if (onBulkSelect) {
      const profilesToSelect = profiles.filter(p => profileIds.includes(p.id))
      onBulkSelect(profilesToSelect)
    }
  }

  const updateFilter = (key: keyof DiscoveryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const InfluencerCard = ({ profile, compact = false }: { profile: InfluencerProfile, compact?: boolean }) => (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${
      selectedProfiles.includes(profile.id) ? 'ring-2 ring-primary' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.profile_image_url} alt={profile.username} />
              <AvatarFallback>{profile.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            {profile.verified && (
              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                <Crown className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-sm">@{profile.username}</h4>
                <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                {profile.location && (
                  <p className="text-xs text-muted-foreground">{profile.location}</p>
                )}
              </div>
              <Button
                size="sm"
                variant={selectedProfiles.includes(profile.id) ? "default" : "outline"}
                onClick={() => handleProfileSelect(profile)}
              >
                {selectedProfiles.includes(profile.id) ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {formatNumber(profile.followers_count)}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${getEngagementColor(profile.engagement_rate)}`} />
                <span className={getEngagementColor(profile.engagement_rate)}>
                  {profile.engagement_rate}%
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profile.category}
              </Badge>
            </div>

            {!compact && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Content Quality</span>
                  <span className={getScoreColor(profile.ai_insights.content_quality_score)}>
                    {profile.ai_insights.content_quality_score}%
                  </span>
                </div>
                <Progress value={profile.ai_insights.content_quality_score} className="h-1" />

                {profile.pricing && (
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span>Post Price</span>
                    <span className="font-medium">{formatCurrency(profile.pricing.post_price_usd_cents)}</span>
                  </div>
                )}

                {profile.ai_insights.audience_match_score && (
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="h-3 w-3 text-green-500" />
                    <span>{profile.ai_insights.audience_match_score}% audience match</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Influencer Discovery</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedProfiles.length} selected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProfiles([])}
            disabled={selectedProfiles.length === 0}
          >
            Clear Selection
          </Button>
          <Button
            size="sm"
            onClick={() => loadInfluencers()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smart">Smart Recommendations</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="filters">Filters & Targeting</TabsTrigger>
        </TabsList>

        <TabsContent value="smart" className="space-y-6">
          {/* Campaign Context Banner */}
          {campaignContext && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Campaign Context Applied</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing recommendations for {campaignContext.brand_category} brand with {formatCurrency(campaignContext.budget_total)} budget
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Matches */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold">Top Matches</h4>
              <Badge variant="outline">AI Recommended</Badge>
              {smartRecommendations.top_matches.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkSelection(smartRecommendations.top_matches.map(p => p.id))}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add All Top Matches
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {smartRecommendations.top_matches.map(profile => (
                <InfluencerCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>

          {/* Rising Stars */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <h4 className="font-semibold">Rising Stars</h4>
              <Badge variant="outline">High Growth</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {smartRecommendations.rising_stars.map(profile => (
                <InfluencerCard key={profile.id} profile={profile} compact />
              ))}
            </div>
          </div>

          {/* Value Picks */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-blue-500" />
              <h4 className="font-semibold">Value Picks</h4>
              <Badge variant="outline">Best ROI</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {smartRecommendations.value_picks.map(profile => (
                <InfluencerCard key={profile.id} profile={profile} compact />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, name, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          {/* Search Results */}
          <div>
            <h4 className="font-semibold mb-4">Search Results ({profiles.length})</h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles
                .filter(profile =>
                  !searchTerm ||
                  profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  profile.bio?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(profile => (
                  <InfluencerCard key={profile.id} profile={profile} />
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Categories</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CATEGORIES.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter('categories', [...filters.categories, category])
                            } else {
                              updateFilter('categories', filters.categories.filter(c => c !== category))
                            }
                          }}
                        />
                        <Label htmlFor={category} className="text-xs capitalize">
                          {category.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Follower Range: {formatNumber(filters.follower_range[0])} - {formatNumber(filters.follower_range[1])}
                  </Label>
                  <Slider
                    value={filters.follower_range}
                    onValueChange={(value) => updateFilter('follower_range', value as [number, number])}
                    min={1000}
                    max={10000000}
                    step={1000}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Engagement Rate: {filters.engagement_range[0]}% - {filters.engagement_range[1]}%
                  </Label>
                  <Slider
                    value={filters.engagement_range}
                    onValueChange={(value) => updateFilter('engagement_range', value as [number, number])}
                    min={0.1}
                    max={15}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="verified">Verified Only</Label>
                  <Checkbox
                    id="verified"
                    checked={filters.verified_only}
                    onCheckedChange={(checked) => updateFilter('verified_only', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="has_pricing">Has Pricing Data</Label>
                  <Checkbox
                    id="has_pricing"
                    checked={filters.has_pricing}
                    onCheckedChange={(checked) => updateFilter('has_pricing', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Quality Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Quality Filters</CardTitle>
                <CardDescription>Filter by AI-generated quality scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Content Quality: {filters.min_content_quality}%+
                  </Label>
                  <Slider
                    value={[filters.min_content_quality]}
                    onValueChange={(value) => updateFilter('min_content_quality', value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Authenticity Score: {filters.min_authenticity}%+
                  </Label>
                  <Slider
                    value={[filters.min_authenticity]}
                    onValueChange={(value) => updateFilter('min_authenticity', value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Brand Safety: {filters.min_brand_safety}%+
                  </Label>
                  <Slider
                    value={[filters.min_brand_safety]}
                    onValueChange={(value) => updateFilter('min_brand_safety', value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtered Results */}
          <div>
            <h4 className="font-semibold mb-4">Filtered Results ({profiles.length})</h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map(profile => (
                <InfluencerCard key={profile.id} profile={profile} compact />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}