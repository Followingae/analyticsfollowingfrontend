"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { creatorApiService } from "@/services/creatorApi"
import { useCreatorSearch } from "@/hooks/useCreatorSearch"
import { useQuery } from "@tanstack/react-query"
import { CreatorProfile, Profile, UnlockedCreatorsResponse } from "@/services/creatorApi"
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
import { ProfileImage } from "@/components/ProfileImage"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AIVerificationTool } from "@/components/ui/ai-verification-tool"
import { CreatorGridCard } from "@/components/creator-cards"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [analyzingCreators, setAnalyzingCreators] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  // Authentication state - moved before React Query
  const { isAuthenticated, isLoading: authLoading, user } = useEnhancedAuth()

  // Transform backend Profile format to frontend CreatorProfile format
  const transformProfile = (profile: any): CreatorProfile => ({
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name || '',
    biography: profile.biography || '',
    followers_count: profile.followers_count,
    following_count: profile.following_count,
    posts_count: profile.posts_count,
    is_verified: profile.verified,
    is_business: false, // Not provided by unlocked endpoint
    engagement_rate: 0, // Will be calculated later or from additional field
    // Enhanced profile picture handling - try multiple sources
    profile_pic_url: profile.profile_pic_url ||
                    `https://cdn.following.ae/profiles/ig/${profile.username}/profile_picture.webp` ||
                    '',
    profile_pic_url_hd: profile.profile_pic_url ||
                       `https://cdn.following.ae/profiles/ig/${profile.username}/profile_picture.webp` ||
                       '', // Use same URL for HD
    created_at: profile.unlocked_at,
    updated_at: profile.unlocked_at,
    ai_insights: undefined // Not available in unlocked list
  })

  // React Query for unlocked creators with pagination
  const unlockedCreatorsQuery = useQuery({
    queryKey: ['unlocked-creators-page', currentPage, !!user],
    queryFn: async () => {
      if (!isAuthenticated) return { profiles: [], pagination: { current_page: 1, total_pages: 1, has_next: false } }

      const result = await creatorApiService.getUnlockedCreators({
        page: currentPage,
        page_size: 20
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to load unlocked creators')
      }

      return result.data || { profiles: [], pagination: { current_page: 1, total_pages: 1, has_next: false } }
    },
    enabled: !!isAuthenticated && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3
  })

  // Transform data for component use
  const rawProfiles = unlockedCreatorsQuery.data?.profiles || []
  const unlockedCreators = rawProfiles.map(transformProfile)
  const unlockedLoading = unlockedCreatorsQuery.isLoading
  const unlockedError = unlockedCreatorsQuery.error?.message || null
  const pagination = unlockedCreatorsQuery.data?.pagination || { current_page: 1, total_pages: 1, has_next: false }

  // Robust deduplication utility
  const deduplicateProfiles = (profiles: CreatorProfile[]): CreatorProfile[] => {

    
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
      

      return false
    })
    

    return deduplicated
  }

  // Helper function to update page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }
  // Router already declared above

  // Modern React Query based creator search
  const creatorSearchMutation = useCreatorSearch({
    onError: (error) => {
      console.error('Search failed:', error)
    }
  })


  // Manual refresh function for refresh button
  const handleRefresh = async () => {
    unlockedCreatorsQuery.refetch()
  }

  // Handle individual creator search with modern React Query
  const handleSearchCreator = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter an Instagram username")
      return
    }

    const cleanUsername = searchUsername.trim().replace('@', '')

    // Add creator to analyzing set
    setAnalyzingCreators(prev => new Set([...prev, cleanUsername]))

    // Create a placeholder creator and add it to the list immediately
    const placeholderCreator: CreatorProfile = {
      id: `temp-${cleanUsername}`,
      username: cleanUsername,
      full_name: cleanUsername,
      biography: '',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      is_verified: false,
      is_business: false,
      engagement_rate: 0,
      profile_pic_url: '',
      profile_pic_url_hd: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_insights: undefined
    }

    try {
      const result = await creatorSearchMutation.mutateAsync(cleanUsername)

      // Remove from analyzing set
      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })

      // Invalidate and refetch the unlocked creators query to include the new creator
      unlockedCreatorsQuery.refetch()

      setSearchUsername("")
      toast.success(`Found profile for @${cleanUsername}!`)
    } catch (error) {
      // Remove from analyzing set on error
      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })

      toast.error("Search failed. Please try again.")
    }
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
        unlockedCreatorsQuery.refetch()
        
        setIsSearchOpen(false)
        setBulkUsernames("")
      } else {
        toast.error("All bulk analyses failed. Please check the usernames and try again.")
      }
    } catch (error) {

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
      nano: "bg-muted text-muted-foreground border-border",
      micro: "bg-primary/10 text-primary border-primary/20",
      macro: "bg-primary/15 text-primary border-primary/30 font-medium",
      mega: "bg-gradient-to-r from-primary/20 to-primary/15 text-primary border-primary/40 font-semibold shadow-sm"
    };
    const tierLabels = {
      nano: 'Nano',
      micro: 'Micro',
      macro: 'Macro',
      mega: 'Mega'
    };

    if (isExpired) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
          Expired
        </Badge>
      );
    }

    return (
      <Badge className={`text-xs font-bold border ${tierStyles[tier]}`}>
        {tierLabels[tier]}
      </Badge>
    );
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
                <h1 className="text-3xl font-bold">Creators</h1>
                <p className="text-muted-foreground mt-1">
                  Discover and analyze Instagram creators for your campaigns
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
                        disabled={creatorSearchMutation.isPending || !searchUsername.trim()}
                      >
                        {creatorSearchMutation.isPending ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        {creatorSearchMutation.isPending ? "Searching..." : "Search & Add Creator"}
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
                        {bulkLoading ? "Processing..." : "Bulk Search"}
                      </Button>
                    </div>

                    <Separator />

                    {/* AI Verification Tool */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">📊 Analysis Tools</h3>
                      <AIVerificationTool />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>📊 Comprehensive analysis:</p>
                        <p>• Content category analysis (20+ categories)</p>
                        <p>• Audience sentiment and engagement patterns</p>
                        <p>• Multi-language content detection</p>
                        <p>• Performance scoring and insights</p>
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
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Analytics
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                          <p className="text-muted-foreground">Start by searching for creators to build your portfolio</p>
                        </div>
                        <Button onClick={() => setIsSearchOpen(true)}>
                          <Search className="h-4 w-4 mr-2" />
                          Add Creators
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Creator Cards */}
                  {!unlockedLoading && unlockedCreators.map((creator, index) => (
                    <CreatorGridCard
                      key={creator.id || creator.pk || creator.username || `creator-${index}`}
                      creator={creator}
                      isAnalyzing={analyzingCreators.has(creator.username)}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {!unlockedLoading && !unlockedError && unlockedCreators.length > 0 && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.current_page} of {pagination.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={!pagination.has_next}
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