"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, ProfileResponse, InstagramPost, AIInsights, AIProcessingStatus } from "@/services/instagramApi"
import { AILoadingState } from "@/components/AILoadingState"
import { AIStatusIndicator, AIInsightsDisplay } from "@/components/ui/ai-status-indicator"
import { AIDataHealthMonitor } from "@/components/ui/ai-data-health"
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
import { ProfileAccessWrapper } from "@/components/profile-access-wrapper"
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

// Helper function to determine influencer tier
const getInfluencerTier = (followerCount: number) => {
  if (followerCount >= 1000000) return 'mega';
  if (followerCount >= 100000) return 'macro';
  if (followerCount >= 10000) return 'micro';
  return 'nano';
};

// Tier Badge Component
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
  
  // AI auto-refresh state for progressive enhancement
  const [aiAutoRefreshTimer, setAiAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  
  // 30-day access system hooks
  const { unlockProfile, isUnlocking, checkAccessStatus } = useProfileAccess()
  const { showExpirationWarning, showAccessExpiredWarning } = useAccessWarnings()
  
  // Professional AI status management
  const { handleProfileLoad } = useAIStatus()

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

  // Test function to manually check posts endpoint
  const testPostsEndpoint = async (targetUsername: string) => {
    const testUrl = `http://localhost:8000/api/v1/instagram/profile/${targetUsername}/posts?limit=5&offset=0`;
    console.log('🧪 TEST: Testing posts endpoint manually:', testUrl);
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      console.log('🧪 TEST: Response status:', response.status);
      console.log('🧪 TEST: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('🧪 TEST: Response data:', data);
      } else {
        const errorText = await response.text();
        console.log('🧪 TEST: Error response:', errorText);
      }
    } catch (error) {
      console.error('🧪 TEST: Fetch failed:', error);
    }
  };

  const loadPosts = async (targetUsername: string) => {
    console.log('🔍 POSTS: Starting to load posts for:', targetUsername)
    console.log('🔍 POSTS: Posts endpoint will be:', `/api/v1/instagram/profile/${targetUsername}/posts`)
    setPostsLoading(true)
    
    // First test the endpoint manually
    await testPostsEndpoint(targetUsername);
    
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

  const analyzeProfile = async (targetUsername: string, isBackgroundRefresh: boolean = false) => {
    console.log('analyzeProfile called with:', targetUsername, 'backgroundRefresh:', isBackgroundRefresh)
    
    if (!targetUsername?.trim()) {
      console.log('No username provided')
      return
    }
    
    // Only show full loading state if this is not a background refresh and we don't have profile data
    if (!isBackgroundRefresh) {
      setLoading(true)
    }
    setError(null)
    setDebugInfo(null)
    
    try {
      console.log('Calling analytics API service...')
      // NEW: Use analytics endpoint for instant load from DB cache
      const result = await instagramApiService.getAnalytics(targetUsername)
      
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
        profileResponse.profile.profile_pic_url_hd,
        profileResponse.profile.profile_pic_url,
        ...(profileResponse.profile.profile_images?.map(img => img.url) || [])
      ].filter(Boolean)
      if (profileImages.length > 0) {
        preloadPageImages(profileImages)
      }
      
      // 🧠 AI ANALYSIS INFORMATION (Auto-Enhanced)
      const aiInsights = profileResponse.ai_insights
      const hasAIAnalysis = aiInsights?.has_ai_analysis || false
      const aiStatus = aiInsights?.ai_processing_status || 'not_available'
      
      // Set up auto-refresh if AI analysis is pending
      if (aiStatus === 'pending') {
        console.log('🤖 AI analysis in progress - setting up auto-refresh...')
        setupAIAutoRefresh()
      } else if (aiStatus === 'completed') {
        console.log('✅ AI analysis completed - no auto-refresh needed')
        // Clear any existing auto-refresh timer
        if (aiAutoRefreshTimer) {
          clearInterval(aiAutoRefreshTimer)
          setAiAutoRefreshTimer(null)
        }
      }
      
      // Check access status and show warnings if needed (updated for new response structure)
      const accessStatus = checkAccessStatus(profileResponse)
      if (accessStatus.hasAccess && accessStatus.isExpiring) {
        showExpirationWarning(accessStatus.daysRemaining!, targetUsername)
      }
      
      console.log('✅ Profile data set successfully with access status:', {
        hasAccess: profileResponse.meta?.user_has_access,
        expiresInDays: profileResponse.meta?.access_expires_in_days
      })
      
      // Posts will be loaded on-demand when Content tab is accessed
      // No need to load posts automatically on every profile analysis
      
      // AI insights are now auto-integrated from backend
      
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

  // Handle unlock profile action
  const handleUnlockProfile = async () => {
    if (!username) return
    
    const unlockedData = await unlockProfile(username)
    if (unlockedData) {
      setProfileData(unlockedData)
    }
  }

  // Handle refresh profile data - triggers fresh Instagram data fetch + AI analysis
  const handleRefreshProfile = async () => {
    if (!username) return
    
    console.log('🔄 Starting profile refresh for:', username)
    setRefreshing(true)
    
    try {
      // Use the service method for refresh
      const result = await instagramApiService.refreshProfile(username)
      console.log('🔄 Refresh response:', result)

      if (result.success) {
        // Show success message based on response
        if (result.data?.refresh_needed === false) {
          toast.success('Profile data is already up to date')
        } else {
          toast.success(result.message || 'Profile data updated successfully')
        }

        // Refresh the profile data in UI after successful refresh
        setTimeout(() => {
          console.log('🔄 Refreshing UI data after successful refresh')
          analyzeProfile(username, true) // Background refresh to keep UI visible
        }, 1000)
      } else {
        toast.error(result.error || result.message || 'Failed to refresh - please try again')
      }

    } catch (error) {
      console.error('❌ Profile refresh error:', error)
      toast.error('Network error during refresh')
    } finally {
      setRefreshing(false)
    }
  }

  // Auto-refresh function for AI analysis progress
  const setupAIAutoRefresh = () => {
    // Clear any existing timer
    if (aiAutoRefreshTimer) {
      clearInterval(aiAutoRefreshTimer)
    }
    
    // Set up auto-refresh every 60 seconds when AI is processing
    const timer = setInterval(() => {
      if (username && profileData?.ai_insights?.ai_processing_status === 'pending') {
        console.log('Auto-refreshing for AI analysis progress...')
        analyzeProfile(username, true) // Background refresh - don't show loading state
      } else {
        // Stop auto-refresh if no longer pending
        if (aiAutoRefreshTimer) {
          clearInterval(aiAutoRefreshTimer)
          setAiAutoRefreshTimer(null)
        }
      }
    }, 60000) // 60 seconds
    
    setAiAutoRefreshTimer(timer)
  }

  // Handle tab changes and load data on-demand
  const handleTabChange = (tabValue: string) => {
    console.log('Tab changed to:', tabValue)
    setActiveTab(tabValue)
    
    // Only load posts when Content tab is accessed and we don't have posts data yet
    if (tabValue === 'content' && username && postsData.length === 0 && !postsLoading) {
      console.log('Loading posts for Content tab...')
      loadPosts(username)
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
        
        // Professional AI status management - automatically handle AI analysis status
        setTimeout(() => {
          handleProfileLoad(username)
        }, 200)
      }
    } catch (error) {
      console.error('Error in useEffect:', error)
      setError('Failed to initialize analytics')
    }

    // Cleanup function to clear AI auto-refresh timer on unmount
    return () => {
      if (aiAutoRefreshTimer) {
        console.log('🧹 Cleaning up AI auto-refresh timer on component unmount')
        clearInterval(aiAutoRefreshTimer)
        setAiAutoRefreshTimer(null)
      }
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
            
            {/* Header */}
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

            {/* Loading State - Only show full skeleton when completely loading, not during AI processing */}
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
              <ProfileAccessWrapper
                profileData={profileData}
                onUnlock={handleUnlockProfile}
                isUnlocking={isUnlocking}
              >
                <div className="space-y-6">
                
                {/* Beautiful Creator Profile Header - No Box */}
                <div className="space-y-6">
                  <div className="p-8">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                        {/* Profile Picture Section */}
                        <div className="relative flex-shrink-0">
                          <div className="relative">
                            <ProfileAvatar
                              src={(() => {
                                // Use HD profile image from profile_images array if available, fallback to profile_pic_url_hd, then regular
                                const profileImages = profileData.profile.profile_images || [];
                                const hdImage = profileImages.find(img => img.type === 'hd');
                                return hdImage?.url || profileData.profile.profile_pic_url_hd || profileData.profile.profile_pic_url;
                              })()}
                              alt={profileData.profile.full_name || 'Profile'}
                              fallbackText={profileData.profile.username}
                              className="relative w-32 h-32 border-4 border-white dark:border-gray-900"
                            />
                            {profileData.profile.is_verified && (
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900">
                                <svg className="w-6 h-6 text-white dark:text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
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
                                {profileData.profile.is_verified && (
                                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </Badge>
                                )}
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
                                
                                
                                {/* AI Content Category */}
                                {profileData.ai_insights?.ai_primary_content_type && (
                                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    <Brain className="w-3 h-3 mr-1" />
                                    {profileData.ai_insights.ai_primary_content_type}
                                  </Badge>
                                )}
                                </div>

                                {/* AI Status Indicator */}
                                <div className="mt-4">
                                  <AIStatusIndicator
                                    username={profileData.profile.username}
                                    insights={profileData.ai_insights}
                                    showDetails={true}
                                    onRetryAnalysis={async () => {
                                      try {
                                        await instagramApiService.triggerProfileAnalysis(profileData.profile.username)
                                        toast.success("AI analysis started successfully")
                                      } catch (error) {
                                        toast.error("Failed to start AI analysis")
                                      }
                                    }}
                                  />
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
                                      Refreshing Instagram data & running AI analysis...
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Business Category */}
                            {profileData.profile.business_category_name && (
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 px-3 py-1 font-medium">
                                  {profileData.profile.business_category_name}
                                </Badge>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Stats Grid - Standard Shadcn/UI Analytics Cards */}
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Followers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(profileData.profile.followers_count)}</div>
                            <p className="text-xs text-muted-foreground">
                              +12% from last month
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(profileData.profile.posts_count)}</div>
                            <p className="text-xs text-muted-foreground">
                              {postsData.length || 0} stored locally
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Likes</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{profileData.profile.avg_likes ? formatNumber(profileData.profile.avg_likes) : 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                              Per post average
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Comments</CardTitle>
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{profileData.profile.avg_comments ? formatNumber(profileData.profile.avg_comments) : 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                              Per post average
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{profileData.profile.engagement_rate?.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                              {profileData.profile.engagement_rate ? 'Above average' : 'Unknown'}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                </div>
                </div>



                {/* Analytics Tabs */}
                <div className="relative">
                  
                  <TooltipProvider>
                    <Tabs defaultValue="profile" className="relative w-full" onValueChange={handleTabChange}>
                      <TabsList className="flex w-full h-auto p-1 bg-muted rounded-lg overflow-x-auto scrollbar-hide">
                      <TabsTrigger value="profile" className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2">
                        <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Profile</span>
                      </TabsTrigger>
                      {profileData?.ai_insights?.ai_processing_status === 'pending' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger 
                              value="audience" 
                              className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2 opacity-75"
                            >
                              <Target className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">Audience</span>
                              <div className="ml-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI is analyzing audience data - processing in progress</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <TabsTrigger value="audience" className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2">
                          <Target className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Audience</span>
                        </TabsTrigger>
                      )}
                      {profileData?.ai_insights?.ai_processing_status === 'pending' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger 
                              value="engagement" 
                              className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2 opacity-75"
                            >
                              <Heart className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">Engagement</span>
                              <div className="ml-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI is analyzing engagement data - processing in progress</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <TabsTrigger value="engagement" className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2">
                          <Heart className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Engagement</span>
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="content" className="flex-1 min-w-0 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black text-sm px-2 py-2">
                        <BarChart3 className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Content</span>
                      </TabsTrigger>
                    </TabsList>
                  
                    <TabsContent value="profile" className="space-y-6 mt-6">
                      {/* Bio/Description */}
                      {profileData.profile.biography && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Profile Bio</CardTitle>
                            <CardDescription>Creator's profile description</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed">{profileData.profile.biography}</p>
                            
                            {/* Additional Data Quality Info */}
                            {(profileData.profile.refresh_count || profileData.profile.data_quality_score) && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  {profileData.profile.refresh_count && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Refreshed {profileData.profile.refresh_count} times
                                    </div>
                                  )}
                                  {profileData.profile.data_quality_score && (
                                    <div className="flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3" />
                                      Quality: {profileData.profile.data_quality_score.toFixed(1)}/10
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      

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
                            <div className="text-xs text-muted-foreground mt-1">{profileData.profile.engagement_rate ? `${profileData.profile.engagement_rate}%` : 'Unknown'}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold mb-1">N/A</div>
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
                                <Badge variant="outline">{profileData.profile.highlight_reel_count || 0} reels</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Reels</span>
                                <Badge variant="outline">0 posts</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Guides</span>
                                <Badge variant={profileData.profile.has_guides ? "default" : "outline"}>
                                  {profileData.profile.has_guides ? "Available" : "Not Available"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">AR Effects</span>
                                <Badge variant={profileData.profile.has_ar_effects ? "default" : "outline"}>
                                  {profileData.profile.has_ar_effects ? "Available" : "Not Available"}
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
                                  {profileData.profile.is_business_account ? 'Business' : 
                                   profileData.profile.is_professional_account ? 'Professional' : 'Personal'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Contact Method</span>
                                <Badge variant="outline">{'N/A'}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">Category</span>
                                <Badge variant="outline">{profileData.profile.business_category_name || 'N/A'}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="audience" className="space-y-6">
                    {/* Show processing state during AI analysis */}
                    {profileData?.ai_insights?.ai_processing_status === 'pending' ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <h3 className="text-lg font-semibold mb-2">Processing</h3>
                          <p className="text-muted-foreground text-center">AI is analyzing audience data...</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Audience Overview */}
                        <div className="grid gap-6 md:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Total Audience</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-2">{formatNumber(profileData.profile.followers_count)}</div>
                            <div className="text-sm text-muted-foreground">Followers</div>
                            <div className="mt-2">
                              <Badge variant="secondary">{formatNumber(profileData.profile.followers_count)}</Badge>
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
                            <div className="text-3xl font-bold mb-2">N/A</div>
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
                                {profileData.profile.influence_score ? `${profileData.profile.influence_score}/100` : 'Unknown'}
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
                          {profileData.demographics?.gender_distribution ? (
                            <div className="space-y-4">
                              {/* Demographics Quality Info */}
                              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-4">
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div className="text-center">
                                    <div className="font-bold text-blue-800 dark:text-blue-200">
                                      {profileData.demographics.sample_size?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400">Sample Size</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-blue-800 dark:text-blue-200">
                                      {profileData.demographics.confidence_score?.toFixed(1) || 'N/A'}%
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400">Confidence</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-blue-800 dark:text-blue-200">
                                      {profileData.demographics.analysis_method || 'N/A'}
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400">Method</div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">Female</span>
                                  <span className="text-sm font-bold">{profileData.demographics.gender_distribution.female}%</span>
                                </div>
                                <Progress value={profileData.demographics.gender_distribution.female || 0} className="h-3" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">Male</span>
                                  <span className="text-sm font-bold">{profileData.demographics.gender_distribution.male}%</span>
                                </div>
                                <Progress value={profileData.demographics.gender_distribution.male || 0} className="h-3" />
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="text-center p-3 bg-muted rounded-lg">
                                  <div className="text-lg font-bold">{profileData.demographics.gender_distribution.female}%</div>
                                  <div className="text-xs text-muted-foreground">Female Audience</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                  <div className="text-lg font-bold">{profileData.demographics.gender_distribution.male}%</div>
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
                          {profileData.demographics?.location_distribution && Object.keys(profileData.demographics.location_distribution).length > 0 ? (
                            <div className="space-y-3">
                              {Object.entries(profileData.demographics.location_distribution).slice(0, 5).map(([location, percentage], index) => (
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
                          {false ? (
                            <div className="flex flex-wrap gap-2">
                              {[].map((interest, index) => (
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
                          {false ? (
                            <div className="grid grid-cols-2 gap-2">
                              {[].map((time, index) => (
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

                    {/* AI-Enhanced Audience Insights */}
                    <div className="space-y-6">
                      <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-600" />
                          AI-Enhanced Audience Intelligence
                        </h3>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* AI Language Analysis */}
                          {profileData.ai_insights?.has_ai_analysis && profileData.ai_insights.ai_language_distribution ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Languages className="w-5 h-5 text-purple-600" />
                                  Language Preferences
                                </CardTitle>
                                <CardDescription>AI-detected audience language patterns</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                    <div className="text-xl font-bold text-purple-600">
                                      {Object.keys(profileData.ai_insights.ai_language_distribution)[0]?.toUpperCase() || 'N/A'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Primary Language</div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {Object.entries(profileData.ai_insights.ai_language_distribution).slice(0, 4).map(([lang, percentage]) => (
                                      <div key={lang}>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                                          <span className="text-sm font-bold">{(percentage * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={percentage * 100} className="h-2" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Language Analysis"
                              description="AI analyzing audience language preferences"
                              message="Detecting audience language patterns..."
                              icon={<Languages className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Content Interest Categories */}
                          {profileData.ai_insights?.has_ai_analysis && profileData.ai_insights.ai_content_distribution ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Tag className="w-5 h-5 text-blue-600" />
                                  Interest Categories
                                </CardTitle>
                                <CardDescription>What your audience is interested in</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <div className="text-xl font-bold text-blue-600">
                                      {profileData.ai_insights.ai_primary_content_type || 'Mixed'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Primary Interest</div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {Object.entries(profileData.ai_insights.ai_content_distribution).slice(0, 4).map(([category, percentage]) => (
                                      <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                                        <span className="text-sm font-medium">{category}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {(percentage * 100).toFixed(1)}%
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Interest Analysis"
                              description="AI analyzing audience content preferences"
                              message="Identifying audience interests..."
                              icon={<Tag className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Audience Sophistication */}
                          {profileData.ai_insights?.has_ai_analysis && profileData.ai_insights.ai_content_quality_score ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-orange-600" />
                                  Audience Sophistication
                                </CardTitle>
                                <CardDescription>AI-analyzed content quality expectations</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-center">
                                  <div className="text-3xl font-bold mb-2 text-orange-600">
                                    {(profileData.ai_insights.ai_content_quality_score * 10).toFixed(1)}
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-3">Sophistication Score (out of 10)</div>
                                  <Progress value={profileData.ai_insights.ai_content_quality_score * 100} className="h-3" />
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {profileData.ai_insights.ai_content_quality_score > 0.7 ? 'High-quality content expected' : 
                                     profileData.ai_insights.ai_content_quality_score > 0.4 ? 'Moderate content standards' : 
                                     'Casual content preferences'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Sophistication Analysis"
                              description="AI analyzing audience quality expectations"
                              message="Evaluating audience sophistication..."
                              icon={<Sparkles className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Sentiment Profile */}
                          {profileData.ai_insights?.has_ai_analysis && profileData.ai_insights.ai_avg_sentiment_score !== null ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Smile className="w-5 h-5 text-green-600" />
                                  Audience Mood
                                </CardTitle>
                                <CardDescription>Preferred emotional tone of content</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-center">
                                  <div className="text-2xl font-bold mb-2 text-green-600">
                                    {profileData.ai_insights.ai_avg_sentiment_score && profileData.ai_insights.ai_avg_sentiment_score > 0 ? 
                                      `+${profileData.ai_insights.ai_avg_sentiment_score.toFixed(2)}` : 
                                      profileData.ai_insights.ai_avg_sentiment_score?.toFixed(2) || 'N/A'
                                    }
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-3">Sentiment Score (-1.0 to +1.0)</div>
                                  <div className="text-sm font-medium">
                                    {(profileData.ai_insights.ai_avg_sentiment_score ?? 0) > 0.3 ? 'Positive Content Preferred' :
                                     (profileData.ai_insights.ai_avg_sentiment_score ?? 0) < -0.3 ? 'Serious Content Preferred' :
                                     'Balanced Content Preferred'}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Sentiment Analysis"
                              description="AI analyzing audience mood preferences"
                              message="Understanding audience sentiment..."
                              icon={<Smile className="w-5 h-5" />}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="engagement" className="space-y-6">
                    {/* Show processing state during AI analysis */}
                    {profileData?.ai_insights?.ai_processing_status === 'pending' ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <h3 className="text-lg font-semibold mb-2">Processing</h3>
                          <p className="text-muted-foreground text-center">AI is analyzing engagement data...</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Enhanced Engagement Analytics</CardTitle>
                          <CardDescription>Multi-faceted engagement rates from backend</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {profileData?.analytics ? (
                            <div className="grid grid-cols-1 gap-4">
                              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{profileData.analytics.engagement_rate?.toFixed(2) || '0.00'}%</div>
                                <div className="text-sm text-muted-foreground font-medium">Overall Engagement Rate</div>
                                <div className="text-xs text-muted-foreground mt-1">All-time average performance</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                  <div className="text-lg font-bold text-green-600">{profileData.analytics.engagement_rate_last_12_posts?.toFixed(2) || '0.00'}%</div>
                                  <div className="text-sm text-muted-foreground">Last 12 Posts</div>
                                  <Badge variant="outline" className="text-xs mt-1">Instagram Standard</Badge>
                                </div>
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded">
                                  <div className="text-lg font-bold text-purple-600">{profileData.analytics.engagement_rate_last_30_days?.toFixed(2) || '0.00'}%</div>
                                  <div className="text-sm text-muted-foreground">Recent 30 Days</div>
                                  <Badge variant="outline" className="text-xs mt-1">Trending</Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                  <div className="text-lg font-bold text-orange-600">{formatNumber(profileData.analytics.avg_likes)}</div>
                                  <div className="text-sm text-muted-foreground">Avg Likes</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                                  <div className="text-lg font-bold text-red-600">{formatNumber(profileData.analytics.avg_comments)}</div>
                                  <div className="text-sm text-muted-foreground">Avg Comments</div>
                                </div>
                              </div>
                              
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-950 rounded">
                                <div className="text-lg font-bold">{profileData.analytics.posts_analyzed || 0}</div>
                                <div className="text-sm text-muted-foreground">Posts Analyzed</div>
                                <div className="text-xs text-muted-foreground mt-1">Data reliability: {profileData.analytics.data_quality_score?.toFixed(1) || '0.0'}/10</div>
                              </div>
                            </div>
                          ) : profileData?.profile ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                <div className="text-lg font-bold text-blue-600">{profileData.profile.engagement_rate?.toFixed(2) || '0.00'}%</div>
                                <div className="text-sm text-muted-foreground">Engagement Rate</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold text-green-600">{profileData.profile.influence_score?.toFixed(1) || '0.0'}</div>
                                <div className="text-sm text-muted-foreground">Influence Score</div>
                              </div>
                              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                <div className="text-lg font-bold text-orange-600">{formatNumber(profileData.profile.avg_likes)}</div>
                                <div className="text-sm text-muted-foreground">Avg Likes</div>
                              </div>
                              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                                <div className="text-lg font-bold text-red-600">{formatNumber(profileData.profile.avg_comments)}</div>
                                <div className="text-sm text-muted-foreground">Avg Comments</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-muted-foreground mb-4">
                                <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No engagement data available</p>
                              </div>
                              <Badge variant="outline" className="text-red-600">No Data</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Post-Level Analytics</CardTitle>
                          <CardDescription>Performance metrics from individual posts ({postsData.length} posts)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {postsData && postsData.length > 0 ? (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                  <div className="text-lg font-bold text-green-600">
                                    {(postsData.reduce((sum, post) => sum + post.engagement_rate, 0) / postsData.length).toFixed(2)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">Avg Post Engagement</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                  <div className="text-lg font-bold text-blue-600">
                                    {formatNumber(postsData.reduce((sum, post) => sum + post.likes_count, 0) / postsData.length)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Avg Likes</div>
                                </div>
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded">
                                  <div className="text-lg font-bold text-purple-600">
                                    {formatNumber(postsData.reduce((sum, post) => sum + post.comments_count, 0) / postsData.length)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Avg Comments</div>
                                </div>
                                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                  <div className="text-lg font-bold text-orange-600">
                                    {postsData.filter(post => post.is_video).length}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Video Posts</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-950 rounded">
                                  <div className="font-semibold">{Math.max(...postsData.map(p => p.engagement_rate)).toFixed(2)}%</div>
                                  <div className="text-muted-foreground text-xs">Best Post</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-950 rounded">
                                  <div className="font-semibold">{Math.min(...postsData.map(p => p.engagement_rate)).toFixed(2)}%</div>
                                  <div className="text-muted-foreground text-xs">Lowest Post</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-950 rounded">
                                  <div className="font-semibold">{postsData.filter(post => post.is_carousel).length}</div>
                                  <div className="text-muted-foreground text-xs">Carousels</div>
                                </div>
                              </div>
                              
                              {/* AI-Enhanced Metrics */}
                              {postsData.some(post => post.ai_analysis?.has_ai_analysis || post.ai_content_category) && (
                                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                  <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                                    <Brain className="h-4 w-4" />
                                    AI-Enhanced Analytics
                                  </h5>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {/* AI Sentiment Distribution */}
                                    {postsData.some(post => post.ai_analysis?.ai_sentiment || post.ai_sentiment) && (
                                      <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded">
                                        <div className="font-semibold text-green-800 dark:text-green-200">
                                          {((postsData.filter(post => (post.ai_analysis?.ai_sentiment || post.ai_sentiment) === 'positive').length / postsData.filter(post => post.ai_analysis?.ai_sentiment || post.ai_sentiment).length) * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-green-600 dark:text-green-400 text-xs">Positive Posts</div>
                                      </div>
                                    )}
                                    
                                    {/* AI Content Categories */}
                                    {postsData.some(post => post.ai_analysis?.ai_content_category || post.ai_content_category) && (
                                      <div className="text-center p-2 bg-purple-100 dark:bg-purple-900 rounded">
                                        <div className="font-semibold text-purple-800 dark:text-purple-200">
                                          {Array.from(new Set(postsData.filter(post => post.ai_analysis?.ai_content_category || post.ai_content_category).map(post => post.ai_analysis?.ai_content_category || post.ai_content_category))).length}
                                        </div>
                                        <div className="text-purple-600 dark:text-purple-400 text-xs">AI Categories</div>
                                      </div>
                                    )}
                                    
                                    {/* AI Language Detection */}
                                    {postsData.some(post => post.ai_analysis?.ai_language_code || post.ai_language_code) && (
                                      <div className="text-center p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">
                                          {Array.from(new Set(postsData.filter(post => post.ai_analysis?.ai_language_code || post.ai_language_code).map(post => post.ai_analysis?.ai_language_code || post.ai_language_code))).join(', ').toUpperCase()}
                                        </div>
                                        <div className="text-blue-600 dark:text-blue-400 text-xs">Languages</div>
                                      </div>
                                    )}
                                    
                                    {/* AI Analysis Coverage */}
                                    <div className="text-center p-2 bg-gray-100 dark:bg-gray-900 rounded">
                                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                                        {postsData.filter(post => post.ai_analysis?.has_ai_analysis).length}/{postsData.length}
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-400 text-xs">AI Analyzed</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-muted-foreground mb-4">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Loading post analytics...</p>
                              </div>
                              {postsLoading ? (
                                <Badge variant="outline" className="text-blue-600">Loading Posts...</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600">No Posts Data</Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Real Engagement Timeline */}
                    {postsData && postsData.length > 0 ? (
                      <RealEngagementTimeline 
                        data={postsData} 
                        title="Post Performance Timeline"
                        description={`Individual post engagement over time (${postsData.length} posts)`}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Post Performance Timeline</CardTitle>
                          <CardDescription>Individual post engagement over time</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center py-8">
                          <div className="text-center text-muted-foreground">
                            <div className="text-2xl mb-2"></div>
                            <p>{postsLoading ? 'Loading timeline data...' : 'No post data available for timeline analysis'}</p>
                            <Badge variant="outline" className={postsLoading ? "text-blue-600" : "text-red-600"} >{postsLoading ? 'Loading...' : 'No Data'}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI-Enhanced Performance Analysis */}
                    <div className="space-y-6">
                      <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          AI-Enhanced Performance Intelligence
                        </h3>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* AI Sentiment vs Engagement Correlation */}
                          {profileData.ai_insights?.has_ai_analysis ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  Sentiment Performance
                                </CardTitle>
                                <CardDescription>How emotions drive engagement</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
 
                                      {(profileData.ai_insights.ai_avg_sentiment_score || 0) > 0 ? 
                                        ` +${((profileData.ai_insights.ai_avg_sentiment_score || 0) * 100).toFixed(0)}%` : 
                                        ` ${((profileData.ai_insights.ai_avg_sentiment_score || 0) * 100).toFixed(0)}%`}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Sentiment Impact</div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                                      <span className="text-sm">Positive Content</span>
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Higher Engagement
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded">
                                      <span className="text-sm">Neutral Content</span>
                                      <Badge variant="outline">
                                        Moderate Engagement
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Sentiment Analysis"
                              description="AI analyzing emotion vs engagement patterns"
                              message="Correlating sentiment with performance..."
                              icon={<TrendingUp className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Content Distribution Charts */}
                          {profileData.ai_insights?.has_ai_analysis ? (
                            <AIContentCharts
                              contentDistribution={profileData.ai_insights.ai_content_distribution}
                              languageDistribution={profileData.ai_insights.ai_language_distribution}
                              primaryContentType={profileData.ai_insights.ai_primary_content_type}
                              sentimentScore={profileData.ai_insights.ai_avg_sentiment_score}
                              qualityScore={profileData.ai_insights.ai_content_quality_score}
                            />
                          ) : (
                            <AILoadingState 
                              title="AI Content Analytics"
                              description="AI analyzing content patterns and performance"
                              message="Generating comprehensive content insights..."
                              icon={<BarChart3 className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Content Optimization Suggestions */}
                          {profileData.ai_insights?.has_ai_analysis ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-orange-600" />
                                  Optimization Insights
                                </CardTitle>
                                <CardDescription>AI recommendations for better performance</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                                    <div className="font-medium text-blue-800 dark:text-blue-200 text-sm">
Primary Focus
                                    </div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                      Continue with {profileData.ai_insights.ai_primary_content_type || 'current'} content - it resonates well
                                    </p>
                                  </div>
                                  
                                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border-l-4 border-green-500">
                                    <div className="font-medium text-green-800 dark:text-green-200 text-sm">
Sentiment Strategy  
                                    </div>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                      {(profileData.ai_insights.ai_avg_sentiment_score || 0) > 0 ? 
                                        'Positive content performs well - maintain upbeat tone' :
                                        'Consider more positive content for higher engagement'
                                      }
                                    </p>
                                  </div>
                                  
                                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-500">
                                    <div className="font-medium text-purple-800 dark:text-purple-200 text-sm">
Quality Score
                                    </div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                      Content quality: {((profileData.ai_insights.ai_content_quality_score || 0) * 10).toFixed(1)}/10 - 
                                      {(profileData.ai_insights.ai_content_quality_score || 0) > 0.7 ? ' Excellent!' : 
                                       (profileData.ai_insights.ai_content_quality_score || 0) > 0.4 ? ' Good, room for improvement' : 
                                       ' Focus on quality improvements'}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Optimization Insights"
                              description="AI generating performance recommendations"
                              message="Creating optimization suggestions..."
                              icon={<Sparkles className="w-5 h-5" />}
                            />
                          )}

                          {/* AI Language Impact */}
                          {profileData.ai_insights?.has_ai_analysis && profileData.ai_insights.ai_language_distribution ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Globe className="w-5 h-5 text-indigo-600" />
                                  Language Performance
                                </CardTitle>
                                <CardDescription>How language choice affects engagement</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {Object.entries(profileData.ai_insights.ai_language_distribution).slice(0, 3).map(([lang, percentage]) => {
                                    // Simulate engagement impact
                                    const impact = lang === 'en' ? 'High' : lang === 'ar' ? 'Medium' : 'Variable';
                                    const impactColor = impact === 'High' ? 'text-green-600' : 
                                                       impact === 'Medium' ? 'text-yellow-600' : 'text-gray-600';
                                    return (
                                      <div key={lang} className="flex items-center justify-between p-3 bg-muted rounded">
                                        <div>
                                          <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {(percentage * 100).toFixed(1)}% of content
                                          </div>
                                        </div>
                                        <Badge variant="outline" className={`text-xs ${impactColor}`}>
                                          {impact} Impact
                                        </Badge>
                                      </div>
                                    )
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <AILoadingState 
                              title="Language Impact"
                              description="AI analyzing language vs engagement correlation"
                              message="Evaluating language performance..."
                              icon={<Globe className="w-5 h-5" />}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-6">
                    {/* Recent Posts Grid - Using Real Data */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Posts</CardTitle>
                        <CardDescription>
                          {postsLoading 
                            ? "Loading posts from database..."
                            : postsData.length 
                              ? `Showing ${postsData.length} stored posts with engagement stats`
                              : "No posts available in database"
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {postsLoading ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <Card key={i}>
                                <CardContent className="p-4">
                                  <div className="h-48 w-full mb-4 bg-muted animate-pulse rounded" />
                                  <div className="h-4 w-full mb-2 bg-muted animate-pulse rounded" />
                                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                  <div className="flex justify-between mt-4">
                                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : postsData.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {postsData.slice(0, 12).map((post) => (
                              <PostCard key={post.instagram_post_id || post.id} post={post} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-muted-foreground mb-4">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No posts stored in database yet</p>
                              <p className="text-sm mt-2">Posts are automatically stored when you search for a profile</p>
                            </div>
                            <Badge variant="outline" className="text-orange-600">No Posts Data</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Content Insights - Real Data */}
                    {postsData.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Content Analysis</CardTitle>
                          <CardDescription>Based on {postsData.length} stored posts</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const posts = postsData;
                            const totalPosts = posts.length;
                            const photos = posts.filter(p => p.media_type === 'GraphImage').length;
                            const videos = posts.filter(p => p.media_type === 'GraphVideo').length;
                            const carousels = posts.filter(p => p.media_type === 'GraphSidecar').length;
                            
                            const avgLikes = Math.round(posts.reduce((sum, p) => sum + p.likes_count, 0) / totalPosts);
                            const avgComments = Math.round(posts.reduce((sum, p) => sum + p.comments_count, 0) / totalPosts);
                            const avgEngagement = (posts.reduce((sum, p) => sum + p.engagement_rate, 0) / totalPosts).toFixed(1);
                            
                            const photoPercent = Math.round((photos / totalPosts) * 100);
                            const videoPercent = Math.round((videos / totalPosts) * 100);
                            const carouselPercent = Math.round((carousels / totalPosts) * 100);
                            
                            return (
                              <div className="grid gap-6 md:grid-cols-2">
                                {/* Content Mix Chart */}
                                <div>
                                  <h4 className="font-medium mb-4">Content Distribution</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <span className="text-sm">Photos</span>
                                        <span className="text-sm font-medium">{photoPercent}% ({photos})</span>
                                      </div>
                                      <Progress value={photoPercent} className="h-2" />
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <span className="text-sm">Videos</span>
                                        <span className="text-sm font-medium">{videoPercent}% ({videos})</span>
                                      </div>
                                      <Progress value={videoPercent} className="h-2" />
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <span className="text-sm">Carousels</span>
                                        <span className="text-sm font-medium">{carouselPercent}% ({carousels})</span>
                                      </div>
                                      <Progress value={carouselPercent} className="h-2" />
                                    </div>
                                  </div>
                                </div>

                                {/* Performance Metrics */}
                                <div>
                                  <h4 className="font-medium mb-4">Performance Metrics</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                      <div className="text-lg font-bold">{formatNumber(avgLikes)}</div>
                                      <div className="text-xs text-muted-foreground">Avg Likes</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                      <div className="text-lg font-bold">{formatNumber(avgComments)}</div>
                                      <div className="text-xs text-muted-foreground">Avg Comments</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                      <div className="text-lg font-bold">{avgEngagement}%</div>
                                      <div className="text-xs text-muted-foreground">Avg Engagement</div>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                      <div className="text-lg font-bold">{totalPosts}</div>
                                      <div className="text-xs text-muted-foreground">Total Posts</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Hashtag Analysis */}
                          {(() => {
                            const allHashtags = postsData.flatMap(post => post.hashtags || []);
                            const uniqueHashtags = [...new Set(allHashtags)];
                            
                            return uniqueHashtags.length > 0 && (
                              <div className="mt-6">
                                <h4 className="font-medium mb-3">Top Hashtags Used</h4>
                                <div className="flex flex-wrap gap-2">
                                  {uniqueHashtags.slice(0, 10).map((hashtag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {hashtag}
                                    </Badge>
                                  ))}
                                  {uniqueHashtags.length > 10 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{uniqueHashtags.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  
                    </Tabs>
                  </TooltipProvider>

                  {/* AI Data Health Monitor - Developer/Admin Panel */}
                  {debugInfo && (
                    <div className="mt-8">
                      <AIDataHealthMonitor username={username || undefined} />
                    </div>
                  )}
                </div>

                {/* Contact Information & External Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact & Links
                    </CardTitle>
                    <CardDescription>Business collaboration details and external links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Business Contact */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">Business Contact</h3>
                            <p className="text-sm text-muted-foreground">
                              {profileData.profile.business_email || 
                               profileData.profile.business_phone_number || 
                               'Contact details not available from public profile'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge 
                            variant={profileData.profile.is_verified ? "default" : "outline"}
                          >
                            {profileData.profile.is_verified ? "Verified Creator" : "Public Profile"}
                          </Badge>
                          {profileData.profile.business_email && (
                            <Badge variant="outline" className="text-xs">
                              Email Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* External Links */}
                      {profileData.profile.external_url && (
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold mb-2">External Links</h4>
                          <div className="flex flex-wrap gap-2">
                            <a 
                              href={profileData.profile.external_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors underline decoration-muted-foreground hover:decoration-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="text-sm font-medium">{profileData.profile.external_url}</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              </ProfileAccessWrapper>
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