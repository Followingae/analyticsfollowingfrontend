"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { creatorApiService } from "@/services/creatorApi"
import { useCreatorSearch } from "@/hooks/useCreatorSearch"
import { useProcessingToast } from "@/contexts/ProcessingToastContext"
import { useQuery } from "@tanstack/react-query"
import { CreatorProfile, Profile, UnlockedCreatorsResponse } from "@/services/creatorApi"
import { discoveryService } from "@/services/discoveryService"
import {
  Plus,
  Users,
  Heart,
  BarChart3,
  Search,
  X,
  TrendingUp,
  Brain,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Instagram,
  Loader2,
  Unlock,
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { toast } from "sonner"
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileImage } from "@/components/ProfileImage"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CreatorGridCard } from "@/components/creator-cards"
import ReactCountryFlag from "react-country-flag"
import { getCountryCode } from "@/lib/countryUtils"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [analyzingCreators, setAnalyzingCreators] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Authentication state - moved before React Query
  const { isAuthenticated, isLoading: authLoading, user } = useEnhancedAuth()
  const { addProcessingToast, removeProcessingToast } = useProcessingToast()

  // Transform backend Profile format to frontend CreatorProfile format
  const transformProfile = (profile: any): CreatorProfile => ({
      id: profile.id || profile.profile_id,
      username: profile.username,
      full_name: profile.full_name || '',
      biography: profile.biography || '',
      followers_count: profile.followers_count,
      following_count: profile.following_count,
      posts_count: profile.posts_count,
      is_verified: profile.verified || profile.is_verified,
      is_business: false, // Not provided by unlocked endpoint
      engagement_rate: profile.engagement_rate ?? profile.avg_engagement_rate ?? null,
      // Enhanced profile picture handling with CDN support
      profile_pic_url: profile.profile_pic_url || '',
      profile_pic_url_hd: profile.profile_pic_url_hd || profile.profile_pic_url || '',
      // Add CDN fields directly from API response
      cdn_avatar_url: profile.cdn_avatar_url || null,
      cdn_url_512: profile.cdn_url_512 || null,
      cdn_urls: profile.cdn_urls || null,
      created_at: profile.unlocked_at || profile.access_granted_at,
      updated_at: profile.unlocked_at || profile.access_granted_at,
      // Unlock expiry data from backend
      access_granted_at: profile.access_granted_at,
      days_remaining: profile.days_remaining,
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

  // Handle individual creator search with auto-unlock
  const handleSearchCreator = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter an Instagram username")
      return
    }

    const cleanUsername = searchUsername.trim().replace('@', '')

    // Close dialog and add processing toast
    setIsSearchOpen(false)
    addProcessingToast(cleanUsername)
    setAnalyzingCreators(prev => new Set([...prev, cleanUsername]))
    setSearchUsername("")

    try {
      const result = await creatorSearchMutation.mutateAsync(cleanUsername)

      // Auto-unlock if profile requires it
      if (result.preview_mode || result.unlock_required) {
        if (!result.profile?.id) {
          throw new Error('Profile not found')
        }

        toast.loading(`Unlocking @${cleanUsername}...`, { id: `unlock-${cleanUsername}` })

        const unlockResult = await discoveryService.unlockProfile(result.profile.id)

        toast.dismiss(`unlock-${cleanUsername}`)

        if (!unlockResult.success) {
          throw new Error(unlockResult.error || 'Unlock failed')
        }

        // Dispatch credit balance update
        window.dispatchEvent(new CustomEvent('credit-balance-changed'))
      }

      // Remove from analyzing set
      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })
      removeProcessingToast(cleanUsername)

      // Refetch unlocked creators — the new creator will now appear
      unlockedCreatorsQuery.refetch()
      toast.success(`@${cleanUsername} unlocked and added to your portfolio!`)
    } catch (error: any) {
      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })
      removeProcessingToast(cleanUsername)
      toast.dismiss(`unlock-${cleanUsername}`)

      if (error.message?.includes('team_limit_exceeded') || error.response?.data?.error === 'team_limit_exceeded') {
        toast.error('Monthly profile limit reached. Upgrade your plan for more unlocks.')
      } else if (error.message?.includes('Insufficient credits') || error.message?.includes('402')) {
        toast.error('Insufficient credits. Please top up to unlock this creator.')
      } else {
        toast.error(error.message || "Search failed. Please try again.")
      }
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
            {/* Header - Now empty since title moved to top bar and Add Creators moved to card */}

            
            {/* Creators Portfolio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Your Creator Portfolio</CardTitle>
                  <Button onClick={() => setIsSearchOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Creator
                  </Button>

                  {/* Search Dialog */}
                  <Dialog open={isSearchOpen} onOpenChange={(open) => {
                    setIsSearchOpen(open)
                    if (!open) setSearchUsername("")
                  }}>
                    <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border/40">
                      {/* Header gradient */}
                      <div className="bg-gradient-to-b from-primary/5 to-transparent px-6 pt-6 pb-4">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-semibold">Add Creator</DialogTitle>
                          <DialogDescription className="text-sm text-muted-foreground">
                            Enter an Instagram username to unlock their full analytics.
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      {/* Search input */}
                      <div className="px-6 pb-6 space-y-4">
                        <div className="relative">
                          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            ref={searchInputRef}
                            placeholder="username"
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchCreator()}
                            className="pl-9 h-11 text-sm"
                            autoFocus
                          />
                          {searchUsername && (
                            <button
                              onClick={() => setSearchUsername("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <Button
                          className="w-full h-10 gap-2"
                          onClick={handleSearchCreator}
                          disabled={creatorSearchMutation.isPending || !searchUsername.trim()}
                        >
                          {creatorSearchMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                          {creatorSearchMutation.isPending ? "Searching..." : "Search & Unlock"}
                        </Button>

                        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI analysis</span>
                          <span className="text-border">|</span>
                          <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Full analytics</span>
                          <span className="text-border">|</span>
                          <span className="font-medium text-primary">25 credits</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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