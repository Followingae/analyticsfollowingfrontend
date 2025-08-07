"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, ProfileResponse, InstagramPost } from "@/services/instagramApi"
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
  Unlock
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
                            <ProfileAvatar
                              src={(() => {
                                // Use HD profile image from profile_images array if available, fallback to profile_pic_url_hd, then regular
                                const profileImages = profileData.profile.profile_images || [];
                                const hdImage = profileImages.find(img => img.type === 'hd');
                                return hdImage?.url || profileData.profile.profile_pic_url_hd || profileData.profile.profile_pic_url;
                              })()}
                              alt={profileData.profile.full_name || 'Profile'}
                              fallbackText={profileData.profile.username}
                              className="relative w-32 h-32 border-4 border-white dark:border-gray-900 shadow-2xl"
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
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
                                {/* Profile Unlocked Badge */}
                                {profileData.meta?.user_has_access && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-2 text-sm font-medium shadow-sm">
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Profile Unlocked till {profileData.meta?.access_expires_in_days ? (profileData.meta.access_expires_in_days + (profileData.meta.access_expires_in_days !== 1 ? ' days' : ' day')) : 'N/A'}
                                  </Badge>
                                )}
                                
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
                            
                            <p className="text-xl text-muted-foreground font-medium">@{profileData.profile.username}</p>
                            
                            {/* Business Category */}
                            {profileData.profile.business_category_name && (
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 px-3 py-1 font-medium">
                                  {profileData.profile.business_category_name}
                                </Badge>
                              </div>
                            )}
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
                              
                              {/* Additional Data Quality Info */}
                              {(profileData.profile.refresh_count || profileData.profile.data_quality_score) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
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
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid - Enhanced with Real Data */}
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatNumber(profileData.profile.followers_count)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Followers</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                Audience
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatNumber(profileData.profile.posts_count)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Posts</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                {postsData.length || 0} stored
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {profileData.profile.avg_likes ? formatNumber(profileData.profile.avg_likes) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Likes</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                Per Post
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {profileData.profile.avg_comments ? formatNumber(profileData.profile.avg_comments) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Comments</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                Per Post
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-400 hover:shadow-md transition-shadow">
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
                                {profileData.profile.engagement_rate ? 'Active' : 'Unknown'}
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
                          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
                            <CardContent className="p-8 text-center">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-red-400" />
                              <p className="text-red-700 dark:text-red-300 font-medium">Bio analysis not available</p>
                              <Badge variant="outline" className="text-red-600 border-red-300 mt-2">No Data</Badge>
                            </CardContent>
                          </Card>
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
                          <CardTitle>Engagement Metrics</CardTitle>
                          <CardDescription>Current engagement performance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">0.00%</div>
                              <div className="text-sm text-muted-foreground">Like Rate</div>
                              {true && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">0.00%</div>
                              <div className="text-sm text-muted-foreground">Comment Rate</div>
                              {true && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">0.00%</div>
                              <div className="text-sm text-muted-foreground">Save Rate</div>
                              {true && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted rounded">
                              <div className="text-lg font-bold">0.00%</div>
                              <div className="text-sm text-muted-foreground">Share Rate</div>
                              {true && (
                                <Badge variant="outline" className="text-xs mt-1 text-red-600">No Data</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-lg font-bold">0.00%</div>
                            <div className="text-sm text-muted-foreground">Reach Rate</div>
                            {true && (
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
                          {false ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">N/A</div>
                                <div className="text-sm text-muted-foreground">Actual Engagement</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">N/A</div>
                                <div className="text-sm text-muted-foreground">Avg Likes</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">N/A</div>
                                <div className="text-sm text-muted-foreground">Avg Comments</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <div className="text-lg font-bold">N/A</div>
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
                    {false ? (
                      <RealEngagementTimeline 
                        data={[]} 
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
                            {profileData.profile.business_email || 
                             profileData.profile.business_phone_number || 
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
                        {profileData.profile.business_email && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 text-xs">
                            Email Available
                          </Badge>
                        )}
                      </div>
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