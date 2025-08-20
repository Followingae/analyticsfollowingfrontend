"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService, UnlockedProfile, UnlockedProfilesResponse } from "@/services/instagramApi"
import { preloadPageImages } from "@/lib/image-cache"
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
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { toast } from "sonner"
import { handleNotificationsWithFallback } from "@/utils/notifications"
// REMOVED: AI notification service that was causing polling
// REMOVED: AI analysis trigger that was causing duplicate requests
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreatorsSkeleton } from "@/components/skeletons"
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
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { Progress } from "@/components/ui/progress"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AIVerificationTool } from "@/components/ui/ai-verification-tool"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"
// Disable static generation for this page
export const dynamic = 'force-dynamic'
export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [analyzingCreators, setAnalyzingCreators] = useState<{[key: string]: {status: 'analyzing' | 'completed' | 'failed', progress: number, error?: string}}>({})
  const [unlockedCreators, setUnlockedCreators] = useState<UnlockedProfile[]>([])
  const [unlockedLoading, setUnlockedLoading] = useState(true)
  const [unlockedError, setUnlockedError] = useState<string | null>(null)
  // Basic request state tracking to prevent spam clicks
  const [activeAnalysisRequests, setActiveAnalysisRequests] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState<{page: number, totalPages: number, hasNext: boolean}>({
    page: 1,
    totalPages: 1,
    hasNext: false
  })
  const router = useRouter()
  // REMOVED: AI notification service and analysis trigger to stop polling madness
  // Note: URL param analysis temporarily disabled for production build
  // TODO: Implement proper Suspense boundary for useSearchParams
  // Load unlocked profiles from backend
  const loadUnlockedProfiles = async (page: number = 1) => {
    setUnlockedLoading(true)
    setUnlockedError(null)
    try {
      const result = await instagramApiService.getUnlockedProfiles(page, 20)
      if (result.success && result.data) {
        setUnlockedCreators(result.data.profiles)
        setPagination({
          page: result.data.pagination.page,
          totalPages: result.data.pagination.total_pages,
          hasNext: result.data.pagination.has_next
        })
        setUnlockedError(null)
        // Preload images for better performance
        if (result.data.profiles.length > 0) {
          const imageUrls = result.data.profiles.map(profile => 
            profile.profile_pic_url_hd || profile.profile_pic_url
          ).filter(Boolean)
          preloadPageImages(imageUrls)
        }
      } else {
        console.error('❌ Failed to load unlocked profiles:', result.error)
        setUnlockedError(result.error || 'Failed to load unlocked profiles')
      }
    } catch (error) {
      console.error('❌ Error loading unlocked profiles:', error)
      setUnlockedError('Network error while loading profiles')
    } finally {
      setUnlockedLoading(false)
    }
  }
  // Load data on component mount
  useEffect(() => {
    loadUnlockedProfiles()
  }, [])
  const creators: UnlockedProfile[] = unlockedCreators
  const startAnalysis = async (username: string) => {
    const cleanUsername = username.trim().replace('@', '')
    
    // Prevent spam clicks - basic request state tracking
    if (activeAnalysisRequests.has(cleanUsername)) {
      toast.info(`Analysis already in progress for @${cleanUsername}`)
      return
    }
    
    // Add to active requests to prevent duplicates
    setActiveAnalysisRequests(prev => new Set([...prev, cleanUsername]))
    
    // Add to analyzing list
    setAnalyzingCreators(prev => ({
      ...prev,
      [cleanUsername]: { status: 'analyzing', progress: 0 }
    }))
    // Show success message
    toast.success(`Started analyzing @${cleanUsername}...`)
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalyzingCreators(prev => {
          const current = prev[cleanUsername]
          if (current && current.status === 'analyzing' && current.progress < 90) {
            return {
              ...prev,
              [cleanUsername]: { ...current, progress: current.progress + 10 }
            }
          }
          return prev
        })
      }, 1000)
      const result = await instagramApiService.searchProfile(cleanUsername)
      clearInterval(progressInterval)
      if (result.success && result.data && result.data.profile) {
        // Transform the backend data to creator card format matching UnlockedProfile interface
        const newCreator: UnlockedProfile = {
          username: result.data.profile.username,
          full_name: result.data.profile.full_name,
          profile_pic_url: result.data.profile.profile_pic_url,
          profile_pic_url_hd: result.data.profile.profile_pic_url_hd,
          proxied_profile_pic_url: '', // Let frontend handle proxying for new profiles
          followers_count: result.data.profile.followers_count,
          following_count: result.data.profile.following_count,
          posts_count: result.data.profile.posts_count,
          engagement_rate: result.data.profile.engagement_rate,
          is_verified: result.data.profile.is_verified,
          is_private: result.data.profile.is_private,
          is_business_account: result.data.profile.is_business_account,
          business_category_name: result.data.profile.business_category_name,
          access_granted_at: new Date().toISOString(),
          days_remaining: result.data.meta?.access_expires_in_days || 30
        }
        // Add to unlocked creators (this will replace analyzing state)
        setUnlockedCreators(prev => {
          // Check if already exists
          const exists = prev.find(c => c.username === cleanUsername)
          if (exists) {
            return prev.map(c => c.username === cleanUsername ? newCreator : c)
          }
          return [newCreator, ...prev]
        })
        // Complete the progress and then immediately remove from analyzing list
        setAnalyzingCreators(prev => ({
          ...prev,
          [cleanUsername]: { status: 'completed', progress: 100 }
        }))
        // Remove from analyzing list and active requests
        setTimeout(() => {
          setAnalyzingCreators(prev => {
            const newState = { ...prev }
            delete newState[cleanUsername]
            return newState
          })
          // Remove from active requests to allow retries
          setActiveAnalysisRequests(prev => {
            const newSet = new Set(prev)
            newSet.delete(cleanUsername)
            return newSet
          })
        }, 500) // Reduced to 500ms for smoother transition
        // Handle new notification system from backend
        handleNotificationsWithFallback(
          result.data.notifications,
          `Successfully analyzed @${cleanUsername}! Added to your unlocked creators.`
        )
        
        // REMOVED: AI polling and duplicate requests stopped
        // Profile search already includes AI analysis trigger
        // No additional polling needed - notifications handle completion status
        
        // Note: New creator already added to unlockedCreators state above, no need to reload entire list
      } else {
        // Enhanced error handling with specific messages
        let errorMessage = 'Analysis failed'
        if (typeof result.error === 'string') {
          errorMessage = result.error
        } else if (result.error && typeof result.error === 'object') {
          // Handle validation error objects with {type, loc, msg, input, url} structure
          if (Array.isArray(result.error) && result.error.length > 0 && result.error[0].msg) {
            errorMessage = result.error[0].msg
          } else if (result.error.msg) {
            errorMessage = result.error.msg
          } else if (result.error.detail) {
            errorMessage = result.error.detail
          } else {
            errorMessage = JSON.stringify(result.error)
          }
        }
        
        // Map common backend errors to user-friendly messages
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMessage = 'Analysis is taking longer than expected. This can happen with large profiles. Please try again in a moment.'
        } else if (errorMessage.includes('Authentication required') || errorMessage.includes('Not authenticated') || errorMessage.includes('401')) {
          errorMessage = 'Please log in again to continue analyzing profiles.'
        } else if (errorMessage.includes('No access to this profile')) {
          errorMessage = 'This profile requires premium access. Click to unlock 30-day access.'
        } else if (errorMessage.includes('Profile not found')) {
          errorMessage = 'Instagram profile not found. Please check the username and try again.'
        } else if (errorMessage.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.'
        } else if (errorMessage.includes('Server error')) {
          errorMessage = 'Backend service is experiencing issues. Please try again in a few minutes.'
        }
        setAnalyzingCreators(prev => ({
          ...prev,
          [cleanUsername]: { status: 'failed', progress: 0, error: errorMessage }
        }))
        // Remove from active requests to allow retries
        setActiveAnalysisRequests(prev => {
          const newSet = new Set(prev)
          newSet.delete(cleanUsername)
          return newSet
        })
        // Handle new notification system for errors
        handleNotificationsWithFallback(
          result.notifications,
          undefined,
          errorMessage
        )
      }
    } catch (error) {
      console.error('❌ Analysis error for @' + cleanUsername + ':', error)
      // Enhanced catch block error handling
      let errorMessage = 'Network error occurred'
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'Request timed out. The backend may be busy processing large profiles. Please try again.'
        } else if (error.message.includes('Cannot connect to server')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.'
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }
      setAnalyzingCreators(prev => ({
        ...prev,
        [cleanUsername]: { status: 'failed', progress: 0, error: errorMessage }
      }))
      // Remove from active requests to allow retries
      setActiveAnalysisRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })
      toast.error(`Error analyzing @${cleanUsername}: ${errorMessage}`)
    }
  }
  const handleSearchCreator = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter an Instagram username")
      return
    }
    const cleanUsername = searchUsername.trim().replace('@', '')
    setIsSearchOpen(false)
    setSearchUsername("")
    // Start analysis
    await startAnalysis(cleanUsername)
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
        usernames.map(username => instagramApiService.searchProfile(username))
      )
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful
      if (successful > 0) {
        toast.success(`Successfully analyzed ${successful} creators${failed > 0 ? `, ${failed} failed` : ''}`)
        // For now, navigate to the first successful result
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          if (result.status === 'fulfilled' && result.value.success) {
            setIsSearchOpen(false)
            setBulkUsernames("")
            router.push(`/analytics/${usernames[i]}`)
            break
          }
        }
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
  const getStatusColor = (status: 'active' | 'paused' | 'completed' | 'draft') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  // Calculate real stats from unlocked creators
  const totalFollowers = unlockedCreators.reduce((sum, creator) => sum + (creator.followers_count || 0), 0)
  const mostDominantNiche = unlockedCreators.reduce((acc, creator) => {
    const category = creator.business_category_name || 'Mixed'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const dominantNiche = Object.entries(mostDominantNiche).sort(([,a], [,b]) => b - a)[0]?.[0] || "Mixed"
  const creatorsData = {
    unlockedCreators: unlockedCreators.length,
    portfolioReach: dominantNiche, // Using this field for dominant niche
    avgEngagement: '7 days', // Using this field for credits reset
    inCampaigns: 0 // Will be replaced with custom cards
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
  // Creator Component (vertical layout with circular images)
  function CreatorCard({ creator }: { creator: UnlockedProfile }) {
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
        <CardHeader className="pb-3">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <ProfileAvatar
              src={creator.profile_pic_url_hd || creator.profile_pic_url}
              alt={creator.full_name || 'Profile'}
              fallbackText={creator.username}
              className="w-20 h-20 border-2 border-white dark:border-gray-900"
            />
          </div>
          {/* Name and Username */}
          <div className="text-center space-y-1 select-none">
            <h3 className="font-semibold text-lg">{creator.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              @{creator.username}
            </p>
          </div>
          {/* Content Category Badges */}
          <div className="mt-3 select-none">
            <div className="flex flex-wrap justify-center gap-1 max-w-full">
              {(() => {
                const categories = [];
                // Add business category or default
                if (creator.business_category_name) {
                  categories.push(creator.business_category_name);
                } else {
                  categories.push('Lifestyle');
                }
                // Add account type
                if (creator.is_business_account) {
                  categories.push('Business');
                } else {
                  categories.push('Creator');
                }
                // Add content focus category
                categories.push('Social Media');
                // Ensure we only show 3 categories
                return categories.slice(0, 3).map((category, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-2 py-1 whitespace-nowrap select-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    style={{ maxWidth: '90px' }}
                  >
                    <span className="truncate">{category}</span>
                  </Badge>
                ));
              })()
              }
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
          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <Button 
              className="flex-1" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/analytics/${creator.username}`);
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
                // TODO: Implement add to list functionality
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
              </div>
              <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetTrigger asChild>
                  <Button style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
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
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {searchLoading ? "Analyzing..." : "Analyze & Add Creator"}
                      </Button>
                    </div>
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
                    {/* Upload CSV */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Upload Creator List</label>
                        <div className="mt-2 flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Download className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> CSV file
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">CSV with usernames (MAX. 100)</p>
                            </div>
                            <input type="file" className="hidden" accept=".csv" />
                          </label>
                        </div>
                      </div>
                    </div>
                    {/* Search Filters */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Discovery Filters</label>
                      <div className="grid gap-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="fashion">Fashion & Style</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="fitness">Fitness & Health</SelectItem>
                            <SelectItem value="food">Food & Cooking</SelectItem>
                            <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Follower Range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="micro">Micro (1K-100K)</SelectItem>
                            <SelectItem value="mid">Mid-tier (100K-1M)</SelectItem>
                            <SelectItem value="macro">Macro (1M+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => toast.info("Finding similar creators based on your criteria...")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Find Similar Creators
                      </Button>
                    </div>
                    {/* AI Verification Tool */}
                    <div className="pt-6 border-t space-y-4">
                      <h3 className="text-sm font-medium">🔬 AI Analysis Verification</h3>
                      <AIVerificationTool />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>💡 Pro tips:</p>
                        <p>• Use @username format for best results</p>
                        <p>• Bulk analysis supports up to 50 usernames</p>
                        <p>• CSV upload allows up to 100 creators</p>
                        <p>• Use AI verification to ensure complete analysis</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* Creators Portfolio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Your Creator Portfolio</CardTitle>
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
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                      <SelectItem value="es">Spain</SelectItem>
                      <SelectItem value="it">Italy</SelectItem>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="mx">Mexico</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="fashion">Fashion & Style</SelectItem>
                      <SelectItem value="beauty">Beauty & Skincare</SelectItem>
                      <SelectItem value="fitness">Fitness & Health</SelectItem>
                      <SelectItem value="food">Food & Cooking</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="travel">Travel & Adventure</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
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
                </div>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Currently Analyzing Creators */}
                  {Object.entries(analyzingCreators).map(([username, analysis]) => {
                    // Check if this creator has been unlocked but is still in analyzing state
                    const unlockedCreator = unlockedCreators.find(c => c.username === username);
                    if (unlockedCreator && analysis.status === 'completed') {
                      // Return the populated card instead of loading card
                      return <CreatorCard key={`unlocked-${username}`} creator={unlockedCreator} />;
                    }
                    // Return skeleton card that matches real creator card layout
                    return (
                      <Card key={`analyzing-${username}`} className="relative overflow-hidden animate-pulse">
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        
                        <CardHeader className="pb-3">
                          {/* Avatar Skeleton */}
                          <div className="flex justify-center mb-3">
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            </div>
                          </div>
                          
                          {/* Name and Username Skeleton */}
                          <div className="text-center space-y-1">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-32"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-24"></div>
                          </div>
                          
                          {/* Category Badges Skeleton */}
                          <div className="mt-3 flex justify-center gap-1">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Stats Skeleton */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                            </div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
                            </div>
                          </div>
                          
                          {/* Action Buttons Skeleton */}
                          <div className="pt-2 flex gap-2">
                            <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                          
                          {/* Progress indicator for analyzing status */}
                          {analysis.status === 'analyzing' && (
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Analyzing @{username}...</div>
                              <Progress value={analysis.progress} className="h-2 mt-2" />
                            </div>
                          )}
                          
                          {/* Error state */}
                          {analysis.status === 'failed' && (
                            <div className="text-center">
                              <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                                {analysis.error || 'Analysis failed'}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => startAnalysis(username)}
                                className="w-full"
                              >
                                Retry Analysis
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
                        <p className="text-red-600 dark:text-red-400">{unlockedError}</p>
                        <Button variant="outline" onClick={() => loadUnlockedProfiles()}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Empty State */}
                  {!unlockedLoading && !unlockedError && creators.length === 0 && (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No unlocked creators yet</h3>
                          <p className="text-muted-foreground">Start by searching for creators to analyze</p>
                        </div>
                        <Button onClick={() => setIsSearchOpen(true)} style={{ backgroundColor: '#5100f3', color: 'white' }} className="hover:opacity-90">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Creators
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Existing Creators (exclude those currently being analyzed) */}
                  {!unlockedLoading && creators
                    .filter(creator => !analyzingCreators[creator.username])
                    .map((creator) => (
                    <CreatorCard key={creator.username} creator={creator} />
                  ))}
                </div>
                {/* Pagination Controls */}
                {!unlockedLoading && !unlockedError && creators.length > 0 && pagination.totalPages > 1 && (
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
                      {creators.length} creators shown
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