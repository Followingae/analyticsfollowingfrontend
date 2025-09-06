'use client'

import { useState } from 'react'
import { useCreatorSearch } from '@/hooks/useCreatorSearch'
import { useProfileAIAnalysis } from '@/hooks/useProfileAIAnalysis'
import { useCDNMedia } from '@/hooks/useCDNMedia'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Building,
  Mail,
  Phone,
  Globe,
  Target,
  Sparkles,
  Image,
  Eye
} from "lucide-react"
import { 
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Label } from "recharts"
import { ProfileAvatar } from '@/components/ui/profile-avatar'

interface CreatorProfilePageProps {
  username: string
  onError?: (error: string) => void
}

export function CreatorProfilePage({ username, onError }: CreatorProfilePageProps) {
  const [activeTab, setActiveTab] = useState('profile')
  
  // Step 1: Basic profile data (immediate)
  const profileSearch = useCreatorSearch({
    onError: (error) => onError?.(error.message)
  })
  
  // Step 2: AI analysis data (progressive)
  const aiAnalysis = useProfileAIAnalysis(username, {
    enabled: Boolean(profileSearch.data?.profile)
  })
  
  // CDN data for enhanced images
  const { data: cdnData } = useCDNMedia(username)
  
  // Search for profile if not already loaded
  const handleSearchProfile = () => {
    profileSearch.mutate(username)
  }
  
  // Get current profile data
  const profile = profileSearch.data?.profile
  const isLoading = profileSearch.isPending
  const hasError = profileSearch.error
  
  // Format numbers for display
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }
  
  // Determine influencer tier
  const getInfluencerTier = (followerCount: number) => {
    if (followerCount >= 1000000) return { tier: 'mega', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' }
    if (followerCount >= 100000) return { tier: 'macro', color: 'bg-[hsl(var(--primary))] text-white' }
    if (followerCount >= 10000) return { tier: 'micro', color: 'bg-[#d3ff02] text-foreground' }
    return { tier: 'nano', color: 'bg-gray-100 text-foreground border' }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Loading Creator Profile</h3>
                <p className="text-sm text-muted-foreground">Fetching profile data for @{username}...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Error state
  if (hasError || !profile) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Profile Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  {hasError?.message || `No profile found for @${username}`}
                </p>
              </div>
              <Button onClick={handleSearchProfile}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Search Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierInfo = getInfluencerTier(profile.followers_count || 0)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with profile info */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <ProfileAvatar
                src={cdnData?.avatar?.available ? cdnData.avatar["512"] : profile.profile_pic_url}
                alt={profile.full_name}
                fallbackText={profile.full_name}
                size="xl"
                className="w-24 h-24 border-2 border-white dark:border-gray-900 shadow-lg"
              />
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {profile.full_name}
                    {profile.is_verified && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </h1>
                  <Badge className={tierInfo.color}>
                    {tierInfo.tier}
                  </Badge>
                </div>
                
                <p className="text-xl text-muted-foreground">@{profile.username}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">{formatNumber(profile.followers_count)}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="font-semibold">{profile.engagement_rate?.toFixed(2) || '0'}%</span>
                    <span className="text-muted-foreground">engagement</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span className="font-semibold">{formatNumber(profile.posts_count)}</span>
                    <span className="text-muted-foreground">posts</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleSearchProfile} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="audience" disabled={!aiAnalysis.data}>Audience</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="posts" disabled={!aiAnalysis.data}>Posts</TabsTrigger>
        </TabsList>
        
        {/* Tab: Profile */}
        <TabsContent value="profile" className="space-y-6">
          {/* Main Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total Followers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(profile.followers_count)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Following {formatNumber(profile.following_count)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.engagement_rate?.toFixed(2) || '0'}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.engagement_rate && profile.engagement_rate > 3 ? 'Excellent' : 
                   profile.engagement_rate && profile.engagement_rate > 1 ? 'Good' : 'Average'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Image className="h-4 w-4 text-green-500" />
                  Total Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(profile.posts_count)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Content Library
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalysis.data?.profile_ai_summary?.content_quality_score ? (
                  <>
                    <div className="text-2xl font-bold">
                      {(aiAnalysis.data.profile_ai_summary.content_quality_score * 10).toFixed(1)}/10
                    </div>
                    <Progress 
                      value={aiAnalysis.data.profile_ai_summary.content_quality_score * 100} 
                      className="mt-2 h-2" 
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-16">
                    {aiAnalysis.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4" />
                        <span>{profile.is_business_account ? 'Business' : 
                              profile.is_professional_account ? 'Creator' : 'Personal'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Verification</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className={`h-4 w-4 ${profile.is_verified ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span>{profile.is_verified ? 'Verified Account' : 'Not Verified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {profile.biography && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Biography</label>
                      <p className="mt-1 text-sm">{profile.biography}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.business_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.business_email}</span>
                    </div>
                  )}
                  {profile.business_phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.business_phone_number}</span>
                    </div>
                  )}
                  {profile.external_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={profile.external_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-500 hover:underline">
                        {profile.external_url}
                      </a>
                    </div>
                  )}
                  {(!profile.business_email && !profile.business_phone_number && !profile.external_url) && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Tab: Audience */}
        <TabsContent value="audience" className="space-y-6">
          {aiAnalysis.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-48">
                      <div className="text-center space-y-3">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Processing AI Analysis</p>
                          <p className="text-xs text-muted-foreground">Check back in 5-7 minutes</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : aiAnalysis.data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Primary Content Type</label>
                    <p className="text-lg font-semibold mt-1">
                      {aiAnalysis.data.profile_ai_summary.primary_content_type || 'Not Available'}
                    </p>
                  </div>
                  
                  {aiAnalysis.data.profile_ai_summary.content_distribution && 
                   Object.keys(aiAnalysis.data.profile_ai_summary.content_distribution).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">Content Distribution</label>
                      <ChartContainer config={{}} className="h-[200px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={Object.entries(aiAnalysis.data.profile_ai_summary.content_distribution).map(([key, value]) => ({
                              name: key,
                              value: Math.round(value * 100),
                              fill: `var(--chart-${Object.keys(aiAnalysis.data.profile_ai_summary.content_distribution).indexOf(key) + 1})`
                            }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={2}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                  return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                        Content
                                      </tspan>
                                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-sm">
                                        Distribution
                                      </tspan>
                                    </text>
                                  )
                                }
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </div>
                  )}
                  
                  {aiAnalysis.data.profile_ai_summary.content_quality_score && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Content Quality Score</label>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress 
                          value={aiAnalysis.data.profile_ai_summary.content_quality_score * 100} 
                          className="flex-1" 
                        />
                        <span className="text-sm font-semibold">
                          {(aiAnalysis.data.profile_ai_summary.content_quality_score * 10).toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Sentiment Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Overall Sentiment</label>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant={aiAnalysis.data.profile_ai_summary.avg_sentiment_score && aiAnalysis.data.profile_ai_summary.avg_sentiment_score > 0 ? 'default' : 'secondary'}>
                        {aiAnalysis.data.profile_ai_summary.avg_sentiment_score && aiAnalysis.data.profile_ai_summary.avg_sentiment_score > 0.1 ? 'Positive' :
                         aiAnalysis.data.profile_ai_summary.avg_sentiment_score && aiAnalysis.data.profile_ai_summary.avg_sentiment_score < -0.1 ? 'Negative' : 'Neutral'}
                      </Badge>
                      <span className="text-lg font-semibold">
                        {aiAnalysis.data.profile_ai_summary.avg_sentiment_score?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                  
                  {aiAnalysis.data.ai_statistics.sentiment_distribution && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">Sentiment Breakdown</label>
                      <ChartContainer config={{}} className="h-[150px]">
                        <BarChart
                          data={[
                            { sentiment: 'Positive', count: aiAnalysis.data.ai_statistics.sentiment_distribution.positive, fill: 'var(--chart-1)' },
                            { sentiment: 'Neutral', count: aiAnalysis.data.ai_statistics.sentiment_distribution.neutral, fill: 'var(--chart-2)' },
                            { sentiment: 'Negative', count: aiAnalysis.data.ai_statistics.sentiment_distribution.negative, fill: 'var(--chart-3)' }
                          ]}
                          layout="vertical"
                          margin={{ left: -20 }}
                        >
                          <XAxis type="number" dataKey="count" hide />
                          <YAxis dataKey="sentiment" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="count" fill="var(--color-desktop)" radius={5} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Language Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Language Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiAnalysis.data.profile_ai_summary.language_distribution && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Language Distribution</label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(aiAnalysis.data.profile_ai_summary.language_distribution).map(([lang, percentage]) => (
                          <div key={lang} className="flex items-center gap-3">
                            <span className="text-sm w-16">{lang}</span>
                            <Progress value={percentage * 100} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-12">
                              {Math.round(percentage * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* AI Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analysis Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{aiAnalysis.data.ai_statistics.total_posts}</div>
                      <p className="text-xs text-muted-foreground">Total Posts</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{aiAnalysis.data.ai_statistics.analyzed_posts}</div>
                      <p className="text-xs text-muted-foreground">Analyzed</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Analysis Completion</span>
                      <span>{aiAnalysis.data.ai_statistics.analysis_completion_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={aiAnalysis.data.ai_statistics.analysis_completion_rate} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis Not Available</h3>
                <p className="text-muted-foreground">AI analysis data is not available for this profile.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Tab: Engagement */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Overview Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Average Likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.avg_likes_per_post ? formatNumber(profile.avg_likes_per_post) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per Post</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Average Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.avg_comments_per_post ? formatNumber(profile.avg_comments_per_post) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per Post</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.engagement_rate?.toFixed(2) || '0'}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.engagement_rate && profile.engagement_rate > 3 ? 'Excellent' : 
                   profile.engagement_rate && profile.engagement_rate > 1 ? 'Good' : 'Below Average'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Additional engagement metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Performance</CardTitle>
              <CardDescription>
                Detailed engagement metrics and performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced engagement analytics available with AI analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Posts */}
        <TabsContent value="posts" className="space-y-6">
          {aiAnalysis.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Processing Post Analysis</p>
                        <p className="text-xs text-muted-foreground">Check back in 5-7 minutes</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : aiAnalysis.data?.posts_analysis?.length ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">AI Post Analysis</h3>
                  <p className="text-muted-foreground">
                    Detailed analysis of {aiAnalysis.data.posts_analysis.length} posts with AI insights
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Analyzed
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiAnalysis.data.posts_analysis.map((post) => (
                  <Card key={post.post_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Post Image Placeholder - Since we don't have media URLs in the AI analysis */}
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                      
                      {/* AI Analysis Badges Overlay */}
                      <div className="absolute top-3 left-3 space-y-1">
                        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                          {post.ai_analysis.content_category}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant={post.ai_analysis.sentiment === 'positive' ? 'default' : 
                                 post.ai_analysis.sentiment === 'negative' ? 'destructive' : 'secondary'}
                          className="text-xs bg-background/80 backdrop-blur-sm"
                        >
                          {post.ai_analysis.sentiment}
                        </Badge>
                      </div>
                      
                      {/* Engagement Stats Overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-black/60 rounded-lg p-2 text-white text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{formatNumber(post.likes_count)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{formatNumber(post.comments_count)}</span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold">
                              {(post.engagement_rate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Post Details */}
                    <CardContent className="p-4 space-y-3">
                      {/* Caption Preview */}
                      <div>
                        <p className="text-sm line-clamp-2 leading-relaxed">
                          {post.caption || 'No caption available'}
                        </p>
                      </div>
                      
                      {/* AI Analysis Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">AI Confidence</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={post.ai_analysis.category_confidence * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(post.ai_analysis.category_confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Language</span>
                          <Badge variant="outline" className="text-xs">
                            {post.ai_analysis.language_code.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Posted</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Sentiment Score */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Sentiment Score</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.abs(post.ai_analysis.sentiment_score) * 100}%`,
                                  backgroundColor: post.ai_analysis.sentiment_score > 0.1 ? '#22c55e' : 
                                                 post.ai_analysis.sentiment_score < -0.1 ? '#ef4444' : '#6b7280'
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {post.ai_analysis.sentiment_score.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {aiAnalysis.data.posts_analysis.length > 12 && (
                <div className="text-center pt-6">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Load More Posts
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Post Analysis Available</h3>
                <p className="text-muted-foreground">Post analysis data is not available for this profile.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
      </Tabs>
    </div>
  )
}