"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { creatorApiService } from "@/services/creatorApi"
import { useCreatorSearch } from "@/hooks/useCreatorSearch"
import { CreatorProfile, UnlockedCreatorsResponse } from "@/types/creator"
// CDN migration: preloadPageImages no longer needed with CDN
import {
  Plus,
  Users,
  Eye,
  Heart,
  BarChart3,
  Download,
  Search,
  X,
  Building,
  TrendingUp,
  Calendar,
  Target,
  Brain,
  Sparkles,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { handleNotificationsWithFallback } from "@/utils/notifications"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreatorsSkeleton } from "@/components/skeletons"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { ProfileAvatar } from "@/components/ui/cdn-image"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AIVerificationTool } from "@/components/ui/ai-verification-tool"
import { AIInsightsCard } from "@/components/ai-insights/AIInsightsCard"
import { AnalysisStatusCard } from "@/components/ai-insights/AnalysisStatusCard"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [unlockedCreators, setUnlockedCreators] = useState<CreatorProfile[]>([])
  const [unlockedLoading, setUnlockedLoading] = useState(true)
  const [unlockedError, setUnlockedError] = useState<string | null>(null)

  // Robust deduplication utility
  const deduplicateProfiles = (profiles: CreatorProfile[]): CreatorProfile[] => {
    console.log('🔧 Creators: Deduplicating profiles, input count:', profiles.length)
    
    const seen = new Set<string>()
    const deduplicated = profiles.filter(profile => {
      // Use multiple identifiers for robust deduplication
      const primaryId = profile.username?.toLowerCase()
      const secondaryId = profile.id || profile.pk
      const fallbackId = profile.full_name?.toLowerCase()
      
      // Create a unique key combining multiple identifiers
      const uniqueKey = `${primaryId}|${secondaryId}|${fallbackId}`
      
      // Also check individual identifiers to catch various duplicate scenarios
      const isDuplicate = seen.has(primaryId) || 
                         (secondaryId && seen.has(secondaryId.toString())) ||
                         seen.has(uniqueKey)
      
      if (!isDuplicate) {
        seen.add(primaryId)
        if (secondaryId) seen.add(secondaryId.toString())
        seen.add(uniqueKey)
        return true
      }
      
      console.log('🔧 Creators: Removing duplicate profile:', primaryId)
      return false
    })
    
    console.log('🔧 Creators: Deduplication complete, output count:', deduplicated.length)
    return deduplicated
  }

  // Centralized function to update creators list with deduplication
  const updateUnlockedCreators = (newProfiles: CreatorProfile[], operation: 'replace' | 'add' = 'replace') => {
    console.log('🔧 Creators: Updating creators list, operation:', operation, 'new profiles:', newProfiles.length)
    
    setUnlockedCreators(prev => {
      let updatedProfiles: CreatorProfile[]
      
      if (operation === 'replace') {
        updatedProfiles = newProfiles
      } else {
        // Add new profiles to existing ones
        updatedProfiles = [...newProfiles, ...prev]
      }
      
      // Always deduplicate the final list
      return deduplicateProfiles(updatedProfiles)
    })
  }
  const [pagination, setPagination] = useState<{page: number, totalPages: number, hasNext: boolean}>({
    page: 1,
    totalPages: 1,
    hasNext: false
  })
  const router = useRouter()
  
  // Authentication state
  const { isAuthenticated, isLoading: authLoading } = useEnhancedAuth()

  // Creator search hook for new search functionality
  const {
    profile: searchedProfile,
    loading: searchLoading,
    searching,
    aiAnalyzing,
    aiComplete,
    error: searchError,
    analysisStatus,
    stage: searchStage,
    searchCreator,
    retryAnalysis,
    clearSearch
  } = useCreatorSearch()

  // Load unlocked profiles from backend using creatorApiService
  const loadUnlockedProfiles = async (page: number = 1) => {
    setUnlockedLoading(true)
    setUnlockedError(null)
    try {
      // Use the correct creatorApiService with proper pagination
      const { creatorApiService } = await import('@/services/creatorApi')
      const result = await creatorApiService.getUnlockedCreators({
        page,
        page_size: 20
      })

      console.log('🔍 Creators: Creator API service result:', result)

      if (result.success && result.data) {
        // Use the creators array from the API response
        const profiles = result.data.creators || []
        updateUnlockedCreators(profiles, page === 1 ? 'replace' : 'append')
        
        // Update pagination based on API response
        const paginationInfo = result.data.pagination || {}
        setPagination({
          page: paginationInfo.page || 1,
          totalPages: paginationInfo.total_pages || 1,
          hasNext: paginationInfo.has_more || false
        })
        setUnlockedError(null)
        
        // Preload images for better performance
        // CDN migration: Image preloading no longer needed
        // CDN URLs are permanent and cached by Cloudflare
      } else {
        console.error('❌ Failed to load unlocked creators:', result.error)
        setUnlockedError(result.error || 'Failed to load unlocked creators')
      }
    } catch (error) {
      console.error('❌ Error loading unlocked creators:', error)
      setUnlockedError('Network error while loading creators')
    } finally {
      setUnlockedLoading(false)
    }
  }

  // Load data on component mount, but only when authenticated
  useEffect(() => {
    console.log('🔍 Creators: Auth status:', { isAuthenticated, authLoading })
    
    // Only load unlocked profiles if user is authenticated and not loading
    if (isAuthenticated && !authLoading) {
      console.log('🔍 Creators: User is authenticated, loading unlocked profiles')
      loadUnlockedProfiles()
    } else if (!authLoading && !isAuthenticated) {
      console.log('🔍 Creators: User is not authenticated, skipping API call')
      // Clear any existing data when not authenticated
      setUnlockedProfiles([])
      setUnlockedError('Please log in to view unlocked creators')
    }
  }, [isAuthenticated, authLoading])

  // Automatically add search results to the list when they complete
  useEffect(() => {
    if (searchedProfile && searchStage === 'complete') {
      console.log('🔧 Creators: Auto-adding search result:', searchedProfile.username)
      updateUnlockedCreators([searchedProfile], 'add')
    }
  }, [searchedProfile, searchStage])

  // Manual refresh function for refresh button
  const handleRefresh = async () => {
    console.log('🔄 Creators: Manual refresh triggered')
    await loadUnlockedProfiles()
  }

  // Handle individual creator search
  const handleSearchCreator = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter an Instagram username")
      return
    }
    
    const cleanUsername = searchUsername.trim().replace('@', '')
    await searchCreator(cleanUsername, { show_progress: true })
    setSearchUsername("")
    
    // Note: Search results are automatically added via useEffect
  }

  const handleBulkAnalysis = async () => {
    if (!bulkUsernames.trim()) {
      toast.error("Please enter usernames for bulk analysis")
      return
    }
    
    const usernames = bulkUsernames
      .split(/[,\n]/)
      .map(u => u.trim().replace('@', ''))
      .filter(u => u.length > 0)
      
    if (usernames.length === 0) {
      toast.error("No valid usernames found")
      return
    }
    
    if (usernames.length > 10) {
      toast.error("Maximum 10 usernames allowed for bulk analysis")
      return
    }

    setBulkLoading(true)
    toast.info(`Starting bulk analysis for ${usernames.length} creators...`)
    
    try {
      const results = await Promise.allSettled(
        usernames.map(username => 
          creatorApiService.searchCreator(username, { force_refresh: false })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`Successfully analyzed ${successful} creators${failed > 0 ? `, ${failed} failed` : ''}`)
        
        // Reload the unlocked creators list
        await loadUnlockedProfiles()
        
        setIsSearchOpen(false)
        setBulkUsernames("")
      } else {
        toast.error("All bulk analyses failed. Please check the usernames and try again.")
      }
    } catch (error) {
      console.error('Bulk analysis error:', error)
      toast.error("Bulk analysis failed. Please try again.")
    } finally {
      setBulkLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null) => {
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
  function TierBadge({ tier, isExpired }: { tier: 'nano' | 'micro' | 'macro' | 'mega', isExpired?: boolean }) {
    const tierStyles = {
      nano: "bg-white text-black border border-gray-300 dark:bg-gray-100 dark:text-black dark:border-gray-200",
      micro: "text-black border" + " " + "bg-[#d3ff02] border-[#d3ff02] dark:bg-[#d3ff02] dark:border-[#d3ff02] dark:text-black",
      macro: "text-white border ring-2" + " " + "bg-[#5100f3] border-[#5100f3] ring-[#5100f3]/30 dark:bg-[#5100f3] dark:border-[#5100f3] dark:ring-[#5100f3]/30", 
      mega: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 border-2 border-yellow-500 ring-2 ring-yellow-400/60 animate-pulse [animation-duration:7s] dark:from-yellow-500 dark:via-yellow-400 dark:to-yellow-300 dark:border-yellow-400 dark:ring-yellow-300/60"
    };
    const tierLabels = {
      nano: 'Nano',
      micro: 'Micro', 
      macro: 'Macro',
      mega: 'Mega'
    };
    
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs border border-red-300 dark:border-red-700">
          Expired
        </Badge>
      );
    }
    
    return (
      <Badge className={`text-xs font-bold ${tierStyles[tier]}`}>
        {tierLabels[tier]}
      </Badge>
    );
  }

  // Enhanced Creator Component with AI insights
  function CreatorCard({ creator }: { creator: CreatorProfile }) {
    const tier = getInfluencerTier(creator.followers_count)
    const hasAI = creator.ai_insights?.available
    
    return (
      <Card className="relative overflow-hidden">
        {/* Country Flag - Top Left */}
        {creator.country_block && (
          <div className="absolute top-3 left-3 z-10">
            <ReactCountryFlag 
              countryCode={getCountryCode(creator.country_block)}
              svg 
              style={{
                width: '24px',
                height: '18px',
                borderRadius: '2px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}
              title={creator.country_block}
            />
          </div>
        )}

        {/* AI Indicator - Top Right */}
        {hasAI && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1">
              <Brain className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <ProfileAvatar
                profile={{
                  id: creator.id,
                  username: creator.username,
                  full_name: creator.full_name,
                  profile_pic_url: creator.profile_pic_url,
                  profile_pic_url_hd: creator.profile_pic_url_hd
                }}
                size="large"
                className="w-20 h-20 border-2 border-white dark:border-gray-900"
              />
              {creator.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Name and Username */}
          <div className="text-center space-y-1 select-none">
            <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
              {creator.full_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              @{creator.username}
            </p>
          </div>

          {/* Tier and AI Content Category */}
          <div className="mt-3 select-none">
            <div className="flex flex-wrap justify-center gap-2 max-w-full">
              <TierBadge tier={tier} />
              
              {hasAI && creator.ai_insights?.content_category && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border-purple-200 dark:border-purple-700">
                  <Target className="h-3 w-3 mr-1" />
                  {creator.ai_insights.content_category}
                </Badge>
              )}
              
              {creator.is_business_account && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  <Building className="h-3 w-3 mr-1" />
                  Business
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 select-none">
          {/* Followers and Engagement */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-muted rounded-md">
              <div className="text-lg font-bold">{formatNumber(creator.followers_count)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <div className="text-lg font-bold">{creator.engagement_rate ? `${creator.engagement_rate.toFixed(2)}%` : 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </div>

          {/* AI Quality Score */}
          {hasAI && creator.ai_insights?.content_quality_score && (
            <div className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">AI Quality Score</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="font-bold text-sm">
                    {creator.ai_insights.content_quality_score.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <Button 
              className="flex-1" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/analytics/${creator.username}?fromDashboard=true`);
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toast.info(`Add to list functionality coming soon for @${creator.username}`);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

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
        {unlockedLoading ? (
          <CreatorsSkeleton />
        ) : (
          <div className="flex min-h-screen">
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Unlocked Creators</h1>
                <p className="text-muted-foreground mt-1">
                  AI-powered creator analytics and insights
                </p>
              </div>
              <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Creators
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[450px] sm:w-[600px] p-8">
                  <SheetHeader>
                    <SheetTitle>Add New Creators</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Manual Username Entry */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Instagram Username</label>
                        <Input
                          placeholder="Enter Instagram username (e.g., @influencer_name)"
                          className="mt-2"
                          value={searchUsername}
                          onChange={(e) => setSearchUsername(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchCreator()}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleSearchCreator}
                        disabled={searchLoading || !searchUsername.trim()}
                      >
                        {searchLoading ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        {searchLoading ? "Analyzing..." : "Analyze & Add Creator"}
                      </Button>
                    </div>

                    <Separator />

                    {/* Bulk Analysis */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Bulk Analysis</label>
                        <textarea
                          placeholder="Enter multiple usernames separated by commas or new lines..."
                          className="mt-2 w-full min-h-[100px] p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                          value={bulkUsernames}
                          onChange={(e) => setBulkUsernames(e.target.value)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleBulkAnalysis}
                        disabled={bulkLoading || !bulkUsernames.trim()}
                      >
                        {bulkLoading ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <BarChart3 className="h-4 w-4 mr-2" />
                        )}
                        {bulkLoading ? "Processing..." : "Bulk Analyze"}
                      </Button>
                    </div>

                    <Separator />

                    {/* AI Verification Tool */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">🔬 AI Analysis Verification</h3>
                      <AIVerificationTool />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>💡 Enhanced with AI:</p>
                        <p>• Content category analysis (20+ categories)</p>
                        <p>• Sentiment analysis with confidence scores</p>
                        <p>• Language detection (20+ languages)</p>
                        <p>• Quality scoring and insights</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Search Results - Show if currently searching */}
            {(searchedProfile || searchLoading || searchError || aiAnalyzing) && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Latest Search Results
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {searchLoading && (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                      <p className="text-muted-foreground">
                        {searching ? "Searching creator..." : aiAnalyzing ? "AI analysis in progress..." : "Loading..."}
                      </p>
                    </div>
                  )}

                  {searchedProfile && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <CreatorCard creator={searchedProfile} />
                      
                      {/* AI Analysis Status */}
                      {(aiAnalyzing || analysisStatus) && (
                        <div className="space-y-4">
                          {analysisStatus && (
                            <AnalysisStatusCard 
                              status={analysisStatus}
                              onRetry={retryAnalysis}
                            />
                          )}
                          
                          {searchedProfile.ai_insights && (
                            <AIInsightsCard 
                              insights={searchedProfile.ai_insights}
                              className="h-fit"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {searchError && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">{searchError}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Creators Portfolio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Your Creator Portfolio</CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI-Enhanced
                  </Badge>
                </div>
                
                {/* Search and Filters in one row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search creators..."
                      className="pl-10 w-[200px]"
                    />
                  </div>
                  
                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="fashion">Fashion & Beauty</SelectItem>
                      <SelectItem value="food">Food & Drink</SelectItem>
                      <SelectItem value="travel">Travel & Tourism</SelectItem>
                      <SelectItem value="fitness">Fitness & Health</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                      <SelectItem value="micro">Micro (10K-100K)</SelectItem>
                      <SelectItem value="macro">Macro (100K-1M)</SelectItem>
                      <SelectItem value="mega">Mega (1M+)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm">
                    Clear Filters
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Loading State */}
                  {unlockedLoading && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading your unlocked creators...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {unlockedError && !unlockedLoading && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                        <div>
                          <h3 className="text-lg font-semibold text-red-600">Failed to Load Creators</h3>
                          <p className="text-muted-foreground">{unlockedError}</p>
                        </div>
                        <Button variant="outline" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Empty State */}
                  {!unlockedLoading && !unlockedError && unlockedCreators.length === 0 && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No unlocked creators yet</h3>
                          <p className="text-muted-foreground">Start by searching for creators to analyze with AI</p>
                        </div>
                        <Button onClick={() => setIsSearchOpen(true)} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                          <Brain className="h-4 w-4 mr-2" />
                          Add Creators
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Creator Cards */}
                  {!unlockedLoading && unlockedCreators.map((creator, index) => (
                    <CreatorCard 
                      key={creator.id || creator.pk || creator.username || `creator-${index}`} 
                      creator={creator} 
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {!unlockedLoading && !unlockedError && unlockedCreators.length > 0 && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUnlockedProfiles(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUnlockedProfiles(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {unlockedCreators.length} creators shown
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}