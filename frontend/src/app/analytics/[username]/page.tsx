"use client"
// @ts-nocheck

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, ProfileResponse, InstagramPost, AIInsights, AIProcessingStatus } from "@/services/instagramApi"
import { AILoadingState } from "@/components/AILoadingState"
import { AIStatusIndicator, AIInsightsDisplay } from "@/components/ui/ai-status-indicator"
import { AIContentCharts } from "@/components/ui/ai-content-charts"
import { 
  ContentDistributionChart, 
  SentimentIndicator, 
  LanguageDistribution, 
  QualityScoreIndicator 
} from '@/components/ui/ai-insights'
import { preloadPageImages } from "@/lib/image-cache"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { API_CONFIG } from "@/config/api"
import { AppSidebar } from "@/components/app-sidebar"
import { AnalyticsSkeleton } from "@/components/skeletons"
import { SiteHeader } from "@/components/site-header"
import { useProfileAccess, useAccessWarnings } from "@/hooks/useProfileAccess"
import { useAIStatus } from "@/hooks/useAIStatus"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ErrorBoundary from "@/components/ErrorBoundary"
import { toast } from "sonner"
import { RealEngagementTimeline } from "@/components/real-engagement-timeline"
import PostCard from "@/components/posts/PostCard"
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
  Smile,
  RefreshCw,
  Unlock,
  ArrowLeft,
  ChevronDown,
  Download,
  FileText as FileIcon,
  User,
  Brain,
  Sparkles,
  Languages,
  Tag,
  Loader2
} from "lucide-react"

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Category Icon Mapping - DESIGN FROM 4 DAYS AGO
const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: string } = {
    "Fashion & Beauty": "👗",
    "Food & Drink": "🍽️",
    "Travel & Tourism": "✈️",
    "Technology": "💻",
    "Fitness & Health": "💪",
    "Entertainment": "🎬",
    "Lifestyle": "🌟",
    "Business & Finance": "💼",
    "Education": "📚",
    "Art & Culture": "🎨",
    "Sports": "⚽",
    "Music": "🎵",
    "Photography": "📸",
    "Gaming": "🎮",
    "Automotive": "🚗",
    "Home & Garden": "🏡",
    "Pets & Animals": "🐕",
    "News & Politics": "📰",
    "Science": "🔬",
    "General": "📱"
  };
  return iconMap[category] || "📱";
};

// Helper function to determine influencer tier - DESIGN FROM 4 DAYS AGO
const getInfluencerTier = (followerCount: number) => {
  if (followerCount >= 1000000) return 'mega';
  if (followerCount >= 100000) return 'macro';
  if (followerCount >= 10000) return 'micro';
  return 'nano';
};

// Tier Badge Component - DESIGN FROM 4 DAYS AGO
function TierBadge({ tier }: { tier: 'nano' | 'micro' | 'macro' | 'mega' }) {
  const tierStyles = {
    nano: "bg-white text-black border border-gray-300 dark:bg-gray-100 dark:text-black dark:border-gray-200",
    micro: "text-black border bg-[#d3ff02] border-[#d3ff02] dark:bg-[#d3ff02] dark:border-[#d3ff02] dark:text-black",
    macro: "text-white border ring-2 bg-[#5100f3] border-[#5100f3] ring-[#5100f3]/30 dark:bg-[#5100f3] dark:border-[#5100f3] dark:ring-[#5100f3]/30", 
    mega: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 border-2 border-yellow-500 ring-2 ring-yellow-400/60 animate-pulse [animation-duration:7s] dark:from-yellow-500 dark:via-yellow-400 dark:to-yellow-300 dark:border-yellow-400 dark:ring-yellow-300/60"
  };

  const tierLabels = {
    nano: 'Nano',
    micro: 'Micro', 
    macro: 'Macro',
    mega: 'Mega'
  };

  return (
    <Badge className={`text-xs font-bold ${tierStyles[tier]}`}>
      {tierLabels[tier]}
    </Badge>
  );
}

export default function AnalyticsPage() {
  const params = useParams()
  const username = params?.username as string
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [postsData, setPostsData] = useState<InstagramPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const router = useRouter()
  
  // TODAY'S LOGIC: 30-day access system hooks
  const { unlockProfile, isUnlocking, checkAccessStatus } = useProfileAccess()
  const { showExpirationWarning, showAccessExpiredWarning } = useAccessWarnings()
  
  // TODAY'S LOGIC: AI status management
  const { aiStatus, isProcessing } = useAIStatus(username)

  console.log('AnalyticsPage render - username:', username, 'params:', params, 'profileData:', profileData)

  // Early return if no username is available
  if (!username) {
    console.log('No username available, returning loading state')
    return (
      <AuthGuard requireAuth={true}>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 66)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <AnalyticsSkeleton />
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  const loadPosts = async (targetUsername: string) => {
    console.log('🔍 POSTS: Starting to load posts for:', targetUsername)
    setPostsLoading(true)
    
    try {
      console.log('🔍 POSTS: Calling instagramApiService.getPosts...')
      const result = await instagramApiService.getPosts(targetUsername, 20, 0)
      
      console.log('🔍 POSTS: Full result received:', result)
      
      if (result.success && result.data) {
        console.log('✅ POSTS: Success! Posts data structure:', {
          profile: result.data.profile,
          postsCount: result.data.posts?.length || 0,
          firstPost: result.data.posts?.[0],
          pagination: result.data.pagination
        })
        setPostsData(result.data.posts || [])
        console.log('✅ POSTS: Posts state updated with', result.data.posts?.length || 0, 'posts')
        
        // Preload post images
        if (result.data.posts && result.data.posts.length > 0) {
          const postImages = result.data.posts.flatMap(post => [
            post.display_url,
            ...(post.images?.map(img => img.proxied_url) || [])
          ]).filter(Boolean)
          if (postImages.length > 0) {
            preloadPageImages(postImages)
          }
        }
      } else {
        console.log('❌ POSTS: Loading failed with error:', result.error)
        console.log('❌ POSTS: Full result object:', result)
        setPostsData([])
      }
    } catch (error) {
      console.error('❌ POSTS: Exception during loading:', error)
      console.error('❌ POSTS: Error stack:', error instanceof Error ? error.stack : 'No stack')
      setPostsData([])
    } finally {
      setPostsLoading(false)
      console.log('🔍 POSTS: Loading completed, postsLoading set to false')
    }
  }

  // TODAY'S LOGIC: Use both basic and detailed endpoints
  const analyzeProfile = async (targetUsername: string, forceDetailed: boolean = false) => {
    console.log('analyzeProfile called with:', targetUsername, 'forceDetailed:', forceDetailed)
    
    if (!targetUsername?.trim()) {
      console.log('No username provided')
      return
    }
    
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    try {
      let result;
      
      if (forceDetailed) {
        console.log('Calling detailed profile API service for complete data...')
        result = await instagramApiService.getDetailedProfile(targetUsername)
      } else {
        console.log('Calling basic profile API service for initial load...')
        result = await instagramApiService.getBasicProfile(targetUsername)
      }
      
      console.log('API service result:', result)
      setDebugInfo({ apiResult: result, timestamp: new Date().toISOString() })
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }
      
      console.log('Backend response data:', result.data)
      
      if (!result.data) {
        throw new Error('No data returned from backend')
      }
      
      const profileResponse = result.data
      setProfileData(profileResponse)
      
      // Preload profile images
      const profileImages = [
        profileResponse.profile.proxied_profile_pic_url_hd,
        profileResponse.profile.proxied_profile_pic_url,
        profileResponse.profile.profile_pic_url_hd,
        profileResponse.profile.profile_pic_url,
        ...(profileResponse.profile.profile_images?.map(img => img.url) || [])
      ].filter(Boolean)
      if (profileImages.length > 0) {
        preloadPageImages(profileImages)
      }
      
      // Check access status and show warnings if needed
      const accessStatus = checkAccessStatus(profileResponse)
      if (accessStatus.hasAccess && accessStatus.isExpiring) {
        showExpirationWarning(accessStatus.daysRemaining!, targetUsername)
      }
      
      console.log('✅ Profile data set successfully with access status:', {
        hasAccess: profileResponse.meta?.user_has_access,
        expiresInDays: profileResponse.meta?.access_expires_in_days
      })
      
    } catch (error) {
      console.error('Profile analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze profile'
      
      // Check if this is a 404 error for analytics - redirect to search
      if (errorMessage.includes('Please search for this profile first')) {
        console.log('🔄 Profile not unlocked, redirecting to search...')
        router.push(`/?search=${encodeURIComponent(targetUsername)}`)
        return
      }
      
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

  // TODAY'S LOGIC: Handle unlock profile action
  const handleUnlockProfile = async () => {
    if (!username) return
    
    const unlockedData = await unlockProfile(username)
    if (unlockedData) {
      setProfileData(unlockedData)
      // After unlocking, load detailed data
      setTimeout(() => {
        analyzeProfile(username, true)
      }, 1000)
    }
  }

  // TODAY'S LOGIC: Handle refresh profile data
  const handleRefreshProfile = async () => {
    if (!username) return
    
    console.log('🔄 Starting profile refresh for:', username)
    setRefreshing(true)
    
    try {
      // Use the service method for refresh
      const result = await instagramApiService.refreshProfile(username)
      console.log('🔄 Refresh response:', result)

      if (result.success) {
        // Simple success message - just refresh the data
        if (result.data?.refresh_needed === false) {
          toast.success('Profile data is already up to date')
        } else {
          toast.success('Profile data refreshed successfully')
        }

        // Refresh the profile data in UI after successful refresh
        setTimeout(() => {
          console.log('🔄 Refreshing UI data after successful refresh')
          // Use detailed if user has access, otherwise basic
          const hasAccess = profileData?.meta?.user_has_access || false
          analyzeProfile(username, hasAccess)
        }, 1000)
      } else {
        // Handle specific AI analysis in progress error
        if (result.message && result.message.includes('AI Analysis already in progress')) {
          toast.info('AI analysis is currently processing. Refreshing current data...')
          // Still refresh the UI with current data
          setTimeout(() => {
            console.log('🔄 Refreshing UI data while AI analysis is in progress')
            const hasAccess = profileData?.meta?.user_has_access || false
            analyzeProfile(username, hasAccess)
          }, 500)
        } else {
          toast.error(result.error || result.message || 'Failed to refresh - please try again')
        }
      }

    } catch (error) {
      console.error('❌ Profile refresh error:', error)
      toast.error('Network error during refresh')
    } finally {
      setRefreshing(false)
    }
  }

  // TODAY'S LOGIC: Handle tab changes and load data on-demand
  const handleTabChange = (tabValue: string) => {
    console.log('Tab changed to:', tabValue)
    setActiveTab(tabValue)
    
    // Only load posts when Content tab is accessed and we don't have posts data yet
    if (tabValue === 'content' && username && postsData.length === 0 && !postsLoading) {
      console.log('Loading posts for Content tab...')
      loadPosts(username)
    }
  }

  // TODAY'S LOGIC: Auto-load analytics when component mounts
  useEffect(() => {
    console.log('useEffect triggered - username:', username, typeof username)
    try {
      if (username && typeof username === 'string') {
        console.log('🌐 Loading basic analytics from backend (will use DB cache if available)')
        setTimeout(() => {
          analyzeProfile(username, false) // Start with basic
        }, 100)
      }
    } catch (error) {
      console.error('Error in useEffect:', error)
      setError('Failed to initialize analytics')
    }
  }, [username])

  // Load posts if content tab is the initial tab or user navigates back to it
  useEffect(() => {
    if (activeTab === 'content' && username && postsData.length === 0 && !postsLoading && profileData) {
      console.log('Loading posts for Content tab (useEffect)...')
      loadPosts(username)
    }
  }, [activeTab, username, postsData.length, postsLoading, profileData])

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
              "--sidebar-width": "calc(var(--spacing) * 66)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
                
                {/* DESIGN FROM 4 DAYS AGO: Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.back()}
                      className="p-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold">Creator Analytics</h1>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Export
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("PDF export feature coming soon!")}>
                        <FileIcon className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("CSV export feature coming soon!")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Loading State */}
                {loading && !profileData && <AnalyticsSkeleton />}

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
                {profileData && (
                  <div className="space-y-6">
                  
                  {/* DESIGN FROM 4 DAYS AGO: Beautiful Creator Profile Header - No Box */}
                  <div className="space-y-6">
                    <div className="p-8">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                          {/* Profile Picture Section */}
                          <div className="relative flex-shrink-0">
                            <div className="relative">
                              <ProfileAvatar
                                src={profileData.profile.proxied_profile_pic_url_hd || 
                                     profileData.profile.proxied_profile_pic_url || 
                                     profileData.profile.profile_pic_url_hd || 
                                     profileData.profile.profile_pic_url}
                                alt={profileData.profile.full_name || 'Profile'}
                                fallbackText={profileData.profile.username}
                                className="relative w-32 h-32 border-4 border-white dark:border-gray-900"
                              />
                            </div>
                            
                          </div>

                          {/* Profile Information */}
                          <div className="flex-1 space-y-6">
                            {/* Name and Status */}
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-2">
                                      <User className="h-5 w-5 text-[#5100f3]" />
                                      <h1 className="text-2xl font-bold text-foreground">
                                        {profileData.profile.full_name}
                                      </h1>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <AtSign className="h-5 w-5 text-[#5100f3]" />
                                      <p className="text-2xl text-foreground font-bold">{profileData.profile.username}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                  {profileData.profile.is_business_account && (
                                    <Badge variant="outline" className="border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                                      <Building className="w-3 h-3 mr-1" />
                                      Business
                                    </Badge>
                                  )}
                                  {profileData.profile.is_professional_account && (
                                    <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                      <Users className="w-3 h-3 mr-1" />
                                      Professional
                                    </Badge>
                                  )}
                                  
                                  {/* Influencer Tier Badge */}
                                  <TierBadge tier={getInfluencerTier(profileData.profile.followers_count)} />
                                  
                                  {/* TODAY'S LOGIC: TOP 3 Content Categories from AI insights */}
                                  {profileData.ai_insights?.top_3_categories && profileData.ai_insights.top_3_categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {profileData.ai_insights.top_3_categories.map((category, index) => (
                                        <Badge
                                          key={`category-${index}-${category.category}-${category.percentage}`}
                                          variant={index === 0 ? "default" : "secondary"}
                                          className={`${
                                            index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary"
                                          } flex items-center gap-1 px-3 py-1`}
                                        >
                                          <span className="mr-1">{getCategoryIcon(category.category)}</span>
                                          {category.category}
                                          <span className="text-xs opacity-70">
                                            {category.percentage}%
                                          </span>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : profileData.ai_insights?.ai_primary_content_type && (
                                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                      <span className="mr-1">{getCategoryIcon(profileData.ai_insights.ai_primary_content_type)}</span>
                                      {profileData.ai_insights.ai_primary_content_type}
                                    </Badge>
                                  )}
                                  </div>

                                </div>
                                
                                {/* Profile Status & Data Freshness - Top Right */}
                                <div className="flex flex-col items-end gap-3">
                                  
                                  {/* Data Freshness & Refresh Button - Single Row */}
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Profile data last received: </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        {profileData.profile.last_refreshed ? 
                                          new Date(profileData.profile.last_refreshed).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }) : 
                                          'Unknown'
                                        }
                                      </span>
                                    </div>
                                    
                                    <Button
                                      onClick={handleRefreshProfile}
                                      disabled={refreshing}
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1 h-6 px-2 text-xs"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                                      {refreshing ? 'Updating...' : 'Refresh Data'}
                                    </Button>
                                  </div>
                                  
                                  {refreshing && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 text-right">
                                      <div className="flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Fetching fresh data...
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Bio and Links */}
                              {profileData.profile.biography && (
                                <div className="space-y-2">
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profileData.profile.biography}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {profileData.profile.external_url && (
                                      <a 
                                        href={profileData.profile.external_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors underline decoration-gray-300 hover:decoration-gray-500"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        <span className="text-sm font-medium">{profileData.profile.external_url}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* DESIGN FROM 4 DAYS AGO: Stats Grid - Enhanced with Real Data */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {formatNumber(profileData.profile.followers_count)}
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">Followers</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {formatNumber(profileData.profile.following_count)}
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">Following</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {formatNumber(profileData.profile.posts_count)}
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">Posts</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {profileData.profile.avg_engagement_rate ? `${profileData.profile.avg_engagement_rate.toFixed(2)}%` : 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">Engagement Rate</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>

                    {/* DESIGN FROM 4 DAYS AGO: Tabs Section with TODAY'S LOGIC */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile">
                          <Users className="h-4 w-4 mr-2" />
                          Profile
                        </TabsTrigger>
                        <TabsTrigger value="audience">
                          <Target className="h-4 w-4 mr-2" />
                          Audience
                        </TabsTrigger>
                        <TabsTrigger value="engagement">
                          <Heart className="h-4 w-4 mr-2" />
                          Engagement
                        </TabsTrigger>
                        <TabsTrigger value="content">
                          <FileText className="h-4 w-4 mr-2" />
                          Content
                        </TabsTrigger>
                      </TabsList>

                      {/* Profile Tab */}
                      <TabsContent value="profile" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Profile Summary */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Summary
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                  <div className="text-2xl font-bold text-foreground">
                                    {formatNumber(profileData.profile.followers_count)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Followers</div>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                  <div className="text-2xl font-bold text-foreground">
                                    {formatNumber(profileData.profile.following_count)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Following</div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Account Type</span>
                                  <Badge variant="outline">
                                    {profileData.profile.is_business_account ? 'Business' : 
                                     profileData.profile.is_professional_account ? 'Creator' : 'Personal'}
                                  </Badge>
                                </div>
                                
                                {profileData.profile.business_category_name && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Category</span>
                                    <Badge variant="outline">{profileData.profile.business_category_name}</Badge>
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Verified</span>
                                  <Badge variant={profileData.profile.is_verified ? "default" : "secondary"}>
                                    {profileData.profile.is_verified ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Contact Information */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Contact & Links
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {profileData.profile.external_url && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={profileData.profile.external_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                                  >
                                    {profileData.profile.external_url}
                                  </a>
                                </div>
                              )}
                              
                              {profileData.profile.business_email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    {profileData.profile.business_email}
                                  </span>
                                </div>
                              )}
                              
                              {profileData.profile.business_phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    {profileData.profile.business_phone_number}
                                  </span>
                                </div>
                              )}

                              {!profileData.profile.external_url && 
                               !profileData.profile.business_email && 
                               !profileData.profile.business_phone_number && (
                                <div className="text-center py-4 text-muted-foreground">
                                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No public contact information available</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Audience Tab */}
                      <TabsContent value="audience" className="space-y-6">
                        <div className="space-y-6">
                            {/* TODAY'S LOGIC: AI Processing Status for Audience */}
                            {aiStatus && (
                              <Card>
                                <CardContent className="p-4">
                                  <AIStatusIndicator 
                                    status={aiStatus.audience_insights}
                                    title="Audience Analytics"
                                    description="AI-powered audience demographics and behavior insights"
                                  />
                                </CardContent>
                              </Card>
                            )}

                            <div className="grid gap-6 md:grid-cols-2">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Follower Growth
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>Follower growth chart would be rendered here</p>
                                      <p className="text-xs mt-2">Based on historical data points</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Demographics
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>Age & gender distribution</p>
                                      <p className="text-xs mt-2">Available with detailed analytics</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                      </TabsContent>

                      {/* Engagement Tab */}
                      <TabsContent value="engagement" className="space-y-6">
                        <div className="space-y-6">
                            {/* TODAY'S LOGIC: AI Processing Status for Engagement */}
                            {aiStatus && (
                              <Card>
                                <CardContent className="p-4">
                                  <AIStatusIndicator 
                                    status={aiStatus.engagement_patterns}
                                    title="Engagement Analytics" 
                                    description="AI analysis of engagement patterns and optimal posting times"
                                  />
                                </CardContent>
                              </Card>
                            )}

                            <div className="grid gap-6">
                              {/* Engagement Overview */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5" />
                                    Engagement Overview
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {profileData.profile.avg_likes ? formatNumber(profileData.profile.avg_likes) : 'N/A'}
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                        <Heart className="h-3 w-3" />
                                        Avg. Likes
                                      </div>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {profileData.profile.avg_comments ? formatNumber(profileData.profile.avg_comments) : 'N/A'}
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        Avg. Comments
                                      </div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {profileData.profile.avg_engagement_rate ? `${profileData.profile.avg_engagement_rate.toFixed(2)}%` : 'N/A'}
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Engagement
                                      </div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {profileData.profile.posts_count ? formatNumber(profileData.profile.posts_count) : 'N/A'}
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                        <BarChart3 className="h-3 w-3" />
                                        Total Posts
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Real Engagement Timeline */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Engagement Timeline
                                  </CardTitle>
                                  <CardDescription>
                                    Historical engagement patterns and trends
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <RealEngagementTimeline username={username} />
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                      </TabsContent>

                      {/* Content Tab */}
                      <TabsContent value="content" className="space-y-6">
                        <div className="space-y-6">
                            {/* TODAY'S LOGIC: AI Processing Status for Content */}
                            {aiStatus && (
                              <Card>
                                <CardContent className="p-4">
                                  <AIStatusIndicator 
                                    status={aiStatus.content_analysis}
                                    title="Content Analytics"
                                    description="AI analysis of content themes, hashtags, and performance"
                                  />
                                </CardContent>
                              </Card>
                            )}

                            {/* Content Analysis */}
                            <div className="grid gap-6 md:grid-cols-2">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Content Overview
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                      <div className="text-2xl font-bold text-foreground">
                                        {postsData.length || 0}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Posts Analyzed</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                      <div className="text-2xl font-bold text-foreground">
                                        {profileData.profile.posts_count || 0}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Total Posts</div>
                                    </div>
                                  </div>

                                  {postsLoading && (
                                    <div className="text-center py-4 text-muted-foreground">
                                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                      <p className="text-sm">Loading posts...</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Hash className="h-5 w-5" />
                                    Content Insights
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {/* TODAY'S LOGIC: AI Insights Display */}
                                  {profileData.ai_insights ? (
                                    <div className="space-y-4">
                                      {/* Content Distribution Chart */}
                                      {profileData.ai_insights.content_distribution && (
                                        <div>
                                          <h4 className="font-medium mb-2">Content Categories</h4>
                                          <ContentDistributionChart data={profileData.ai_insights.content_distribution} />
                                        </div>
                                      )}
                                      
                                      {/* Sentiment Indicator */}
                                      {profileData.ai_insights.average_sentiment && (
                                        <div>
                                          <h4 className="font-medium mb-2">Content Sentiment</h4>
                                          <SentimentIndicator sentiment={profileData.ai_insights.average_sentiment} />
                                        </div>
                                      )}
                                      
                                      {/* Language Distribution */}
                                      {profileData.ai_insights.language_distribution && (
                                        <div>
                                          <h4 className="font-medium mb-2">Languages Used</h4>
                                          <LanguageDistribution data={profileData.ai_insights.language_distribution} />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                                      <div className="text-center">
                                        <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Content insights will appear here</p>
                                        <p className="text-xs mt-2">After AI analysis is complete</p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>

                            {/* Posts Grid */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Recent Posts
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {postsData.length} posts loaded
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {postsData.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {postsData.slice(0, 6).map((post, index) => (
                                      <PostCard key={`post-${post.id || index}-${post.shortcode || ''}`} post={post} />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-12 text-muted-foreground">
                                    {postsLoading ? (
                                      <div className="space-y-3">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                                        <p>Loading recent posts...</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <FileText className="h-8 w-8 mx-auto opacity-50" />
                                        <p>No posts available yet</p>
                                        <p className="text-xs">Posts will appear here once analyzed</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                      </TabsContent>
                    </Tabs>

                  </div>
                )}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  )
  } catch (error) {
    console.error('Render error:', error)
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Rendering Error</h3>
              <p className="text-muted-foreground text-center mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }
}