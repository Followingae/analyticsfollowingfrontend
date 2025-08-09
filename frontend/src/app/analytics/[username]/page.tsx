"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, ProfileResponse, InstagramPost } from "@/services/instagramApi"
import { preloadPageImages } from "@/lib/image-cache"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { API_CONFIG } from "@/config/api"
import { AppSidebar } from "@/components/app-sidebar"
import { AnalyticsSkeleton } from "@/components/skeletons"
import { SiteHeader } from "@/components/site-header"
import { ProfileAccessWrapper } from "@/components/profile-access-wrapper"
import { useProfileAccess, useAccessWarnings } from "@/hooks/useProfileAccess"
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
  User
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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  
  // 30-day access system hooks
  const { unlockProfile, isUnlocking, checkAccessStatus } = useProfileAccess()
  const { showExpirationWarning, showAccessExpiredWarning } = useAccessWarnings()

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
      
      // Check access status and show warnings if needed (updated for new response structure)
      const accessStatus = checkAccessStatus(profileResponse)
      if (accessStatus.hasAccess && accessStatus.isExpiring) {
        showExpirationWarning(accessStatus.daysRemaining!, targetUsername)
      }
      
      console.log('✅ Profile data set successfully with access status:', {
        hasAccess: profileResponse.meta?.user_has_access,
        expiresInDays: profileResponse.meta?.access_expires_in_days
      })
      
      // Load posts separately for content tab
      loadPosts(targetUsername)
      
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

  // Handle refresh profile data - triggers fresh Decodo call
  const handleRefreshProfile = async () => {
    if (!username) return
    
    console.log('🔄 Starting profile refresh for:', username)
    setRefreshing(true)
    
    try {
      // Get auth token
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        setRefreshing(false)
        return
      }

      // Show user feedback immediately
      toast.info(`Refreshing @${username}... this may take up to 2 minutes. Redirecting to creators page.`, {
        duration: 3000
      })

      // Start refresh in background (don't wait for completion)
      console.log('🔄 Starting background refresh for:', username)
      fetch(`${API_CONFIG.BASE_URL}/api/v1/instagram/profile/${username}/force-refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(async (response) => {
        // Handle completion in background
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Background refresh completed:', {
            username,
            refreshedAt: data.meta?.refreshed_at,
            refreshType: data.meta?.refresh_type,
            allDataReplaced: data.meta?.all_data_replaced
          })
          toast.success(`✅ @${username} profile data refreshed successfully!`, {
            duration: 5000
          })
        } else {
          const errorText = await response.text()
          console.error('❌ Background refresh failed:', response.status, errorText)
          toast.error(`❌ Failed to refresh @${username}: ${response.status} ${response.statusText}`, {
            duration: 5000
          })
        }
      }).catch((error) => {
        console.error('❌ Background refresh network error:', error)
        toast.error(`❌ Network error refreshing @${username}: ${error.message}`, {
          duration: 5000
        })
      })

      // Redirect immediately (don't wait for refresh to complete)
      setTimeout(() => {
        console.log('🔄 Redirecting to creators page...')
        router.push('/creators')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Profile refresh setup error:', error)
      toast.error(`Failed to start refresh: ${error instanceof Error ? error.message : String(error)}`)
      setRefreshing(false)
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

            {/* Loading State */}
            {loading && <AnalyticsSkeleton />}

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
                                    {refreshing ? 'Refreshing...' : 'Refresh'}
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
                  
                  <Tabs defaultValue="profile" className="relative w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="profile" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                        <Users className="w-4 h-4 mr-2" />
                        Profile
                      </TabsTrigger>
                      <TabsTrigger value="audience" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                        <Target className="w-4 h-4 mr-2" />
                        Audience
                      </TabsTrigger>
                      <TabsTrigger value="engagement" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                        <Heart className="w-4 h-4 mr-2" />
                        Engagement
                      </TabsTrigger>
                      <TabsTrigger value="content" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Content
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
                  </TabsContent>
                  
                  <TabsContent value="engagement" className="space-y-6">
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
                            <div className="text-2xl mb-2">📊</div>
                            <p>{postsLoading ? 'Loading timeline data...' : 'No post data available for timeline analysis'}</p>
                            <Badge variant="outline" className={postsLoading ? "text-blue-600" : "text-red-600"} >{postsLoading ? 'Loading...' : 'No Data'}</Badge>
                          </div>
                        </CardContent>
                      </Card>
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
                            {profileData.profile.is_verified ? "✨ Verified Creator" : "📋 Public Profile"}
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