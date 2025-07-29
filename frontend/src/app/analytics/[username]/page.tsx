"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService } from "@/services/instagramApi"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompleteProfileResponse } from "@/services/instagramApi"
import ErrorBoundary from "@/components/ErrorBoundary"
import { RealEngagementTimeline } from "@/components/real-engagement-timeline"
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Users,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Eye,
  Mail,
  Phone,
  ExternalLink,
  Building,
  Globe,
  BarChart3,
  PieChart,
  Clock,
  FileText,
  Hash,
  AtSign,
  Smile
} from "lucide-react"

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function AnalyticsPage() {
  const params = useParams()
  const username = params?.username as string
  const [profileData, setProfileData] = useState<CompleteProfileResponse['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  console.log('AnalyticsPage render - username:', username, 'params:', params, 'profileData:', profileData)

  // Early return if no username is available
  if (!username) {
    console.log('No username available, returning loading state')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  const analyzeProfile = async (targetUsername: string) => {
    console.log('analyzeProfile called with:', targetUsername)
    
    if (!targetUsername?.trim()) {
      console.log('No username provided')
      return
    }
    
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    try {
      console.log('Calling API service...')
      // Use real backend API service instead of mock
      const result = await instagramApiService.fetchProfileWithFallback(targetUsername)
      
      console.log('API service result:', result)
      setDebugInfo({ apiResult: result, timestamp: new Date().toISOString() })
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }
      
      console.log('Backend response data:', result.data)
      
      if (!result.data) {
        throw new Error('No data returned from backend')
      }
      
      setProfileData(result.data)
      console.log('Profile data set successfully')
      
    } catch (error) {
      console.error('Profile analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze profile'
      setError(errorMessage)
      setDebugInfo({ 
        error: errorMessage, 
        errorStack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString() 
      })
    } finally {
      setLoading(false)
      console.log('analyzeProfile completed')
    }
  }

  // Auto-load analytics when component mounts - backend handles caching
  useEffect(() => {
    console.log('useEffect triggered - username:', username, typeof username)
    try {
      if (username && typeof username === 'string') {
        // Trust backend caching - no frontend cache needed
        console.log('🌐 Loading analytics from backend (will use DB cache if available)')
        setTimeout(() => {
          analyzeProfile(username)
        }, 100)
      }
    } catch (error) {
      console.error('Error in useEffect:', error)
      setError('Failed to initialize analytics')
    }
  }, [username])

  // Add error boundary-like behavior
  if (error) {
    console.log('Rendering error state:', error)
  }

  // Wrap the entire render in try-catch to catch any rendering errors
  try {

  return (
    <AuthGuard requireAuth={true}>
      <ErrorBoundary>
        <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Creator Analytics</h1>
                <p className="text-muted-foreground">
                  Detailed analytics for @{username}
                </p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                ← Back to Creators
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing @{username}</h3>
                  <p className="text-muted-foreground text-center">
                    Getting comprehensive analytics data...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500 mb-4">
                    <Search className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground text-center mb-4">{error}</p>
                  
                  {/* Debug Information */}
                  {debugInfo && (
                    <details className="mb-4 text-left w-full max-w-lg">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600">
                        🔍 Debug Information (Click to expand)
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                        <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                  
                  <div className="flex gap-2">
                    <Button onClick={() => analyzeProfile(username)}>
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Reload Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {profileData && profileData.profile && (
              <div className="space-y-6">
                
                {/* Beautiful Creator Profile Header - Mono Theme */}
                <div className="relative overflow-hidden">
                  {/* Subtle Background - Mono */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
                  <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-gray-100/[0.02]" />
                  
                  <Card className="relative border border-gray-200 dark:border-gray-800 shadow-2xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                        {/* Profile Picture Section */}
                        <div className="relative flex-shrink-0">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 rounded-full blur opacity-30 animate-pulse"></div>
                            <img 
                              src={profileData.profile.profile_pic_url || 'https://via.placeholder.com/120x120/6b7280/ffffff?text=' + (profileData.profile.full_name?.charAt(0) || 'U')}
                              alt={profileData.profile.full_name || 'Profile'}
                              className="relative w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-2xl"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/120x120/6b7280/ffffff?text=' + (profileData.profile.full_name?.charAt(0) || 'U')
                              }}
                            />
                            {profileData.profile.is_verified && (
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-lg">
                                <svg className="w-6 h-6 text-white dark:text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Influence Score Badge - Mono */}
                          <div className="absolute -top-4 -left-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gray-600 dark:bg-gray-400 rounded-full blur opacity-40"></div>
                              <Badge className="relative bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 px-3 py-1.5 text-sm font-bold shadow-lg">
                                {profileData.profile.influence_score?.toFixed(1)}/10
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Profile Information */}
                        <div className="flex-1 space-y-6">
                          {/* Name and Status */}
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                                {profileData.profile.full_name}
                              </h1>
                              <div className="flex flex-wrap gap-2">
                                {profileData.profile.is_verified && (
                                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </Badge>
                                )}
                                {profileData.profile.business_info?.is_business_account && (
                                  <Badge variant="outline" className="border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                                    <Building className="w-3 h-3 mr-1" />
                                    Business
                                  </Badge>
                                )}
                                {profileData.profile.business_info?.is_professional_account && (
                                  <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                    <Users className="w-3 h-3 mr-1" />
                                    Professional
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xl text-muted-foreground font-medium">@{profileData.profile.username}</p>
                            
                            {/* Categories - Mono Theme */}
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 px-3 py-1 font-medium">
                                {profileData.profile.business_info?.category_name || 'Lifestyle'}
                              </Badge>
                              <Badge className="bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-800 border-0 px-3 py-1 font-medium">
                                Fashion
                              </Badge>
                              <Badge className="bg-gray-500 dark:bg-gray-500 text-white dark:text-white border-0 px-3 py-1 font-medium">
                                Entertainment
                              </Badge>
                            </div>
                          </div>

                          {/* Bio and Links */}
                          {profileData.profile.bio && (
                            <div className="space-y-2">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profileData.profile.bio}</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData.profile.external_links?.primary_url && (
                                  <a 
                                    href={profileData.profile.external_links.primary_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors underline decoration-gray-300 hover:decoration-gray-500"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="text-sm font-medium">{profileData.profile.external_links.primary_url}</span>
                                  </a>
                                )}
                                {profileData.profile.external_links?.bio_links?.map((link, index) => (
                                  <a 
                                    key={index}
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors underline decoration-gray-300 hover:decoration-gray-500"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="text-sm font-medium">{link.title || link.url}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid - Mono Theme */}
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatNumber(profileData.profile.followers)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Followers</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                {profileData.profile.quick_stats?.followers_formatted}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatNumber(profileData.profile.following)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Following</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                Social Graph
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatNumber(profileData.profile.posts_count)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Posts</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                Content Library
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {profileData.profile.engagement_rate?.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Engagement</div>
                            <div className="mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  (profileData.profile.engagement_rate || 0) > 3 
                                    ? 'border-gray-400 text-gray-800 dark:border-gray-500 dark:text-gray-200' 
                                    : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {profileData.profile.quick_stats?.engagement_level || 'Unknown'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>



                {/* Beautiful Analytics Tabs - Mono Theme */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50/20 via-gray-100/20 to-gray-50/20 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20 rounded-lg blur-sm" />
                  
                  <Tabs defaultValue="profile" className="relative w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 shadow-lg">
                      <TabsTrigger 
                        value="profile" 
                        className="data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-100 data-[state=active]:text-white dark:data-[state=active]:text-gray-900 font-medium transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Profile
                      </TabsTrigger>
                      <TabsTrigger 
                        value="audience" 
                        className="data-[state=active]:bg-gray-800 dark:data-[state=active]:bg-gray-200 data-[state=active]:text-white dark:data-[state=active]:text-gray-800 font-medium transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Audience
                      </TabsTrigger>
                      <TabsTrigger 
                        value="engagement" 
                        className="data-[state=active]:bg-gray-700 dark:data-[state=active]:bg-gray-300 data-[state=active]:text-white dark:data-[state=active]:text-gray-700 font-medium transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Engagement
                      </TabsTrigger>
                      <TabsTrigger 
                        value="content" 
                        className="data-[state=active]:bg-gray-600 dark:data-[state=active]:bg-gray-400 data-[state=active]:text-white dark:data-[state=active]:text-gray-600 font-medium transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Content
                      </TabsTrigger>
                    </TabsList>
                  
                    <TabsContent value="profile" className="space-y-6 mt-6">
                      {/* Bio Analysis - Mono Theme */}
                      <Card className="border-gray-200 dark:border-gray-800 shadow-lg bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-900/80 dark:to-gray-800/80">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white dark:text-gray-900" />
                            </div>
                            <div>
                              <CardTitle className="text-gray-900 dark:text-gray-100">Bio Intelligence</CardTitle>
                              <CardDescription className="text-gray-600 dark:text-gray-400">Advanced biography content analysis</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {profileData.profile.bio_analysis ? (
                            <div className="grid gap-6 md:grid-cols-2">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" />
                                  Content Metrics
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileData.profile.bio_analysis.emoji_count}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Emojis</div>
                                      <Smile className="w-4 h-4 mx-auto mt-1 text-gray-500 dark:text-gray-400" />
                                    </CardContent>
                                  </Card>
                                  <Card className="border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileData.profile.bio_analysis.hashtag_count}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Hashtags</div>
                                      <Hash className="w-4 h-4 mx-auto mt-1 text-gray-500 dark:text-gray-400" />
                                    </CardContent>
                                  </Card>
                                  <Card className="border-gray-400 dark:border-gray-500 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500">
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileData.profile.bio_analysis.mention_count}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Mentions</div>
                                      <AtSign className="w-4 h-4 mx-auto mt-1 text-gray-500 dark:text-gray-400" />
                                    </CardContent>
                                  </Card>
                                  <Card className="border-gray-500 dark:border-gray-400 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-400">
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profileData.profile.bio_analysis.call_to_action_score}/10</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">CTA Score</div>
                                      <Target className="w-4 h-4 mx-auto mt-1 text-gray-500 dark:text-gray-400" />
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                                  <Building className="w-4 h-4" />
                                  Brand Intelligence
                                </h4>
                                {profileData.profile.bio_analysis.brand_mentions.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {profileData.profile.bio_analysis.brand_mentions.map((brand, index) => (
                                        <Badge key={index} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1">
                                          {brand}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                        ✨ {profileData.profile.bio_analysis.brand_mentions.length} brand keyword{profileData.profile.bio_analysis.brand_mentions.length > 1 ? 's' : ''} detected
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
                                    <CardContent className="p-4 text-center">
                                      <Building className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">No brand keywords detected</p>
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Consider adding brand partnerships mentions</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
                              <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-red-400" />
                                <p className="text-red-700 dark:text-red-300 font-medium">Bio analysis not available</p>
                                <Badge variant="outline" className="text-red-600 border-red-300 mt-2">No Data</Badge>
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>

                    {/* Quality Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quality Metrics</CardTitle>
                        <CardDescription>Content and influence scoring</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold mb-1">{profileData.profile.influence_score?.toFixed(1) || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Influence Score</div>
                            <div className="text-xs text-muted-foreground mt-1">out of 10</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold mb-1">{profileData.profile.content_quality_score?.toFixed(1) || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Content Quality</div>
                            <div className="text-xs text-muted-foreground mt-1">out of 10</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold mb-1">{profileData.profile.engagement_rate?.toFixed(1) || 'N/A'}%</div>
                            <div className="text-sm text-muted-foreground">Engagement Rate</div>
                            <div className="text-xs text-muted-foreground mt-1">{profileData.profile.quick_stats?.engagement_level || 'Unknown'}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold mb-1">{profileData.profile.real_engagement?.posting_consistency_score || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Consistency</div>
                            <div className="text-xs text-muted-foreground mt-1">out of 10</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Features */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Features</CardTitle>
                        <CardDescription>Available content types and features</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium mb-3">Feature Availability</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Highlights</span>
                                <Badge variant="outline">{profileData.profile.content_features?.highlight_reel_count || 0} reels</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Reels</span>
                                <Badge variant="outline">{profileData.profile.content_features?.reels_count || 0} posts</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Guides</span>
                                <Badge variant={profileData.profile.content_features?.has_guides ? "default" : "outline"}>
                                  {profileData.profile.content_features?.has_guides ? "Available" : "Not Available"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">AR Effects</span>
                                <Badge variant={profileData.profile.content_features?.has_ar_effects ? "default" : "outline"}>
                                  {profileData.profile.content_features?.has_ar_effects ? "Available" : "Not Available"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-3">Business Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Account Type</span>
                                <Badge variant="outline">
                                  {profileData.profile.business_info?.is_business_account ? 'Business' : 
                                   profileData.profile.business_info?.is_professional_account ? 'Professional' : 'Personal'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Contact Method</span>
                                <Badge variant="outline">{profileData.profile.business_info?.business_contact_method || 'N/A'}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Category</span>
                                <Badge variant="outline">{profileData.profile.business_info?.category_name || 'N/A'}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="audience" className="space-y-6">
                    {/* Audience Overview */}
                    <div className="grid gap-6 md:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Total Audience</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-2">{formatNumber(profileData.profile.followers)}</div>
                            <div className="text-sm text-muted-foreground">Followers</div>
                            <div className="mt-2">
                              <Badge variant="secondary">{profileData.profile.quick_stats?.followers_formatted}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Primary Age Group</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-2">{profileData.audience_insights?.primary_age_group || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Most Common Age</div>
                            <div className="mt-2">
                              <Badge variant="outline">Demographic Data</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Audience Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-2">{profileData.profile.influence_score?.toFixed(1) || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Influence Score</div>
                            <div className="mt-2">
                              <Badge variant={Number(profileData.profile.influence_score || 0) > 7 ? "default" : "secondary"}>
                                {profileData.profile.quick_stats?.influence_level || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Demographics & Locations */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Gender Demographics</CardTitle>
                          <CardDescription>Audience gender distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {profileData.audience_insights?.gender_split ? (
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">Female</span>
                                  <span className="text-sm font-bold">{profileData.audience_insights.gender_split.female}%</span>
                                </div>
                                <Progress value={profileData.audience_insights.gender_split.female || 0} className="h-3" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">Male</span>
                                  <span className="text-sm font-bold">{profileData.audience_insights.gender_split.male}%</span>
                                </div>
                                <Progress value={profileData.audience_insights.gender_split.male || 0} className="h-3" />
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="text-center p-3 bg-muted rounded-lg">
                                  <div className="text-lg font-bold">{profileData.audience_insights.gender_split.female}%</div>
                                  <div className="text-xs text-muted-foreground">Female Audience</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                  <div className="text-lg font-bold">{profileData.audience_insights.gender_split.male}%</div>
                                  <div className="text-xs text-muted-foreground">Male Audience</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">Gender data not available</p>
                              <Badge variant="outline" className="text-red-600 mt-2">No Data</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Top Locations</CardTitle>
                          <CardDescription>Geographic distribution of audience</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {profileData.audience_insights?.top_locations && profileData.audience_insights.top_locations.length > 0 ? (
                            <div className="space-y-3">
                              {profileData.audience_insights.top_locations.slice(0, 5).map((location, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                                      {index + 1}
                                    </div>
                                    <span className="text-sm font-medium">{location}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.max(0, 100 - index * 15)}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">Location data not available</p>
                              <Badge variant="outline" className="text-red-600 mt-2">No Data</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Interests & Activity */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Audience Interests</CardTitle>
                          <CardDescription>Top interests and categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {profileData.audience_insights?.interests && profileData.audience_insights.interests.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.audience_insights.interests.map((interest, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">Interest data not available</p>
                              <Badge variant="outline" className="text-red-600 mt-2">No Data</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Activity Patterns</CardTitle>
                          <CardDescription>When your audience is most active</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {profileData.audience_insights?.activity_times && profileData.audience_insights.activity_times.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {profileData.audience_insights.activity_times.map((time, index) => (
                                <Badge key={index} variant="outline" className="justify-center p-2 text-xs">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">Activity data not available</p>
                              <Badge variant="outline" className="text-red-600 mt-2">No Data</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="engagement" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Engagement Metrics</CardTitle>
                          <CardDescription>Current engagement performance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{profileData.engagement_metrics?.like_rate?.toFixed(2) || '0.00'}%</div>
                              <div className="text-sm text-muted-foreground">Like Rate</div>
                              {(profileData.engagement_metrics?.like_rate || 0) === 0 && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{profileData.engagement_metrics?.comment_rate?.toFixed(2) || '0.00'}%</div>
                              <div className="text-sm text-muted-foreground">Comment Rate</div>
                              {(profileData.engagement_metrics?.comment_rate || 0) === 0 && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{profileData.engagement_metrics?.save_rate?.toFixed(2) || '0.00'}%</div>
                              <div className="text-sm text-muted-foreground">Save Rate</div>
                              {(profileData.engagement_metrics?.save_rate || 0) === 0 && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{profileData.engagement_metrics?.share_rate?.toFixed(2) || '0.00'}%</div>
                              <div className="text-sm text-muted-foreground">Share Rate</div>
                              {(profileData.engagement_metrics?.share_rate || 0) === 0 && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{profileData.engagement_metrics?.reach_rate?.toFixed(2) || '0.00'}%</div>
                            <div className="text-sm text-muted-foreground">Reach Rate</div>
                            {(profileData.engagement_metrics?.reach_rate || 0) === 0 && (
                              <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Real Performance Data</CardTitle>
                          <CardDescription>Calculated from actual posts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {profileData.profile.real_engagement && profileData.profile.real_engagement.recent_posts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement.actual_engagement_rate.toFixed(2)}%</div>
                                <div className="text-sm text-muted-foreground">Actual Engagement</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">{formatNumber(profileData.profile.real_engagement.avg_likes_per_post)}</div>
                                <div className="text-sm text-muted-foreground">Avg Likes</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">{formatNumber(profileData.profile.real_engagement.avg_comments_per_post)}</div>
                                <div className="text-sm text-muted-foreground">Avg Comments</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement.content_mix.video_percentage.toFixed(0)}%</div>
                                <div className="text-sm text-muted-foreground">Video Content</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-muted-foreground mb-4">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No recent posts data available</p>
                              </div>
                              <Badge variant="outline" className="text-red-600">No Data</Badge>
                              <p className="text-xs text-muted-foreground mt-2">
                                Backend recent_posts array is empty - cannot calculate real performance metrics
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Real Engagement Timeline */}
                    {profileData.profile.real_engagement && profileData.profile.real_engagement.recent_posts.length > 0 ? (
                      <RealEngagementTimeline 
                        data={profileData.profile.real_engagement.recent_posts} 
                        title="Post Performance Timeline"
                        description="Individual post engagement over time"
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Post Performance Timeline</CardTitle>
                          <CardDescription>Individual post engagement over time</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center py-8">
                          <div className="text-center text-muted-foreground">
                            <div className="text-2xl mb-2">📊</div>
                            <p>No post data available for timeline analysis</p>
                            <Badge variant="outline" className="text-red-600 mt-2">No Data</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-6">
                    {/* Recent Posts Grid */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Posts</CardTitle>
                        <CardDescription>Latest 6 posts with engagement stats</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {profileData.profile.real_engagement && profileData.profile.real_engagement.recent_posts.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {profileData.profile.real_engagement.recent_posts.slice(0, 6).map((post, index) => (
                              <Card key={post.id} className="overflow-hidden">
                                <div className="aspect-square bg-muted flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="w-8 h-8 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                                      {post.is_video ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Post #{index + 1}</div>
                                  </div>
                                </div>
                                <CardContent className="p-3 space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <div className="font-medium">{formatNumber(post.likes)}</div>
                                      <div className="text-muted-foreground">Likes</div>
                                    </div>
                                    <div>
                                      <div className="font-medium">{formatNumber(post.comments)}</div>
                                      <div className="text-muted-foreground">Comments</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <Badge variant="outline" className="text-xs">
                                      {post.engagement_rate.toFixed(1)}% ER
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-muted-foreground mb-4">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No recent posts data available</p>
                            </div>
                            <Badge variant="outline" className="text-red-600">No Data</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Content Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Insights</CardTitle>
                        <CardDescription>Content distribution and performance analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Content Mix Chart */}
                          <div>
                            <h4 className="font-medium mb-4">Content Distribution</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm">Photos</span>
                                  <span className="text-sm font-medium">{profileData.content_strategy?.content_mix?.photos || 0}%</span>
                                </div>
                                <Progress value={profileData.content_strategy?.content_mix?.photos || 0} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm">Videos</span>
                                  <span className="text-sm font-medium">{profileData.content_strategy?.content_mix?.videos || 0}%</span>
                                </div>
                                <Progress value={profileData.content_strategy?.content_mix?.videos || 0} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm">Carousels</span>
                                  <span className="text-sm font-medium">{profileData.content_strategy?.content_mix?.carousels || 0}%</span>
                                </div>
                                <Progress value={profileData.content_strategy?.content_mix?.carousels || 0} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm">Reels</span>
                                  <span className="text-sm font-medium">{profileData.content_strategy?.content_mix?.reels || 0}%</span>
                                </div>
                                <Progress value={profileData.content_strategy?.content_mix?.reels || 0} className="h-2" />
                              </div>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div>
                            <h4 className="font-medium mb-4">Performance Metrics</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement?.avg_likes_per_post ? formatNumber(profileData.profile.real_engagement.avg_likes_per_post) : 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">Avg Likes</div>
                              </div>
                              <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement?.avg_comments_per_post ? formatNumber(profileData.profile.real_engagement.avg_comments_per_post) : 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">Avg Comments</div>
                              </div>
                              <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement?.content_mix?.video_percentage?.toFixed(0) || 0}%</div>
                                <div className="text-xs text-muted-foreground">Video Rate</div>
                              </div>
                              <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">{profileData.profile.real_engagement?.posting_consistency_score || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">Consistency</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Pillars */}
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Content Pillars</h4>
                          <div className="flex flex-wrap gap-2">
                            {(profileData.content_strategy?.primary_content_pillars || ['Lifestyle', 'Travel', 'Fashion']).map((pillar, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {pillar}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Best Posting Times */}
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Optimal Posting Times</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(profileData.best_posting_times || ['9:00 AM', '1:00 PM', '7:00 PM', '9:00 PM']).map((time, index) => (
                              <Badge key={index} variant="outline" className="justify-center p-2 text-xs">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  </Tabs>
                </div>

                {/* Beautiful Contact Information - Mono Theme */}
                <Card className="border-gray-200 dark:border-gray-800 shadow-lg bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white dark:text-gray-900" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 dark:text-gray-100">Professional Contact</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">Business collaboration details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Business Contact</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {profileData.profile.business_info?.business_email || 
                             profileData.profile.business_info?.business_phone_number || 
                             'Contact details not available from public profile'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge 
                          className={`${
                            profileData.profile.is_verified 
                              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0' 
                              : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                          }`}
                          variant={profileData.profile.is_verified ? "default" : "outline"}
                        >
                          {profileData.profile.is_verified ? "✨ Verified Creator" : "📋 Public Profile"}
                        </Badge>
                        {profileData.profile.business_info?.business_contact_method && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 text-xs">
                            {profileData.profile.business_info.business_contact_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </SidebarInset>
      </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  )
  
  } catch (renderError) {
    console.error('Rendering error caught:', renderError)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Rendering Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              There was an error rendering the analytics page.
            </p>
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {renderError instanceof Error ? renderError.message : String(renderError)}
              </pre>
              {debugInfo && (
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </details>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}