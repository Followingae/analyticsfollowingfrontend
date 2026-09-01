"use client"

/**
 * Unlocked creators.
 *
 * Density tier: SCANNING at the grid, WORKING at the head. The air goes around the grid,
 * at the page margin, not into each tile.
 *
 * What changed. The entire page used to live inside a single `<Card>`: the title, the
 * "Add Creator" button, three filters and the whole grid, all wrapped in one border with
 * a header rule across it. A page is not an object, so it does not get a card. The title
 * is now the page's own head, the filters sit on the ground as a rail with one hairline
 * under them, and the grid is a grid of creators rather than a grid inside a box.
 *
 * Error, loading and empty were also being drawn as one shape, three sizes: the same
 * centred icon-over-heading-over-sentence, so a 500 looked exactly like an empty portfolio.
 * They are three different components now and the failure says out loud that it is not a
 * count of zero.
 */

import { useState, useRef } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { creatorApiService } from "@/services/creatorApi"
import { useCreatorSearch } from "@/hooks/useCreatorSearch"
import { useProcessingToast } from "@/contexts/ProcessingToastContext"
import { useQuery } from "@tanstack/react-query"
import { CreatorProfile } from "@/services/creatorApi"
import { discoveryService } from "@/services/discoveryService"
import {
  Plus,
  Search,
  X,
  RefreshCw,
  Instagram,
  Loader2,
  Unlock,
  Sparkles,
  BarChart3,
} from "lucide-react"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { toast } from "sonner"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreatorGridCard, ProcessingCreatorCard } from "@/components/creator-cards"
import {
  Page,
  PageHead,
  LoadFailed,
  Nothing,
  unmeasuredLast,
} from "@/components/brand/primitives"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function CreatorsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  // Unlock requires explicit consent (25 credits) — same UX as Discovery.
  const [pendingUnlock, setPendingUnlock] = useState<{ username: string; profileId: string } | null>(null)
  // Portfolio filters (client-side over the unlocked list)
  const [filterText, setFilterText] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterTier, setFilterTier] = useState("all")
  const [analyzingCreators, setAnalyzingCreators] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Authentication state - moved before React Query
  const { isAuthenticated, isLoading: authLoading, user } = useEnhancedAuth()
  const { addProcessingToast, removeProcessingToast, processingToasts } = useProcessingToast()

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
      category: profile.category || profile.ai_primary_content_type || null,
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
  const rawProfiles = Array.isArray(unlockedCreatorsQuery.data?.profiles) ? unlockedCreatorsQuery.data.profiles : []
  const unlockedCreators = rawProfiles.map(transformProfile)
  const unlockedLoading = unlockedCreatorsQuery.isLoading
  const unlockedError = unlockedCreatorsQuery.error?.message || null
  const pagination = unlockedCreatorsQuery.data?.pagination || { current_page: 1, total_pages: 1, has_next: false }

  // Client-side portfolio filters (name, category, follower tier)
  const availableCategories = Array.from(
    new Set(unlockedCreators.map(c => c.category).filter(Boolean))
  ) as string[]

  const visibleCreators = unlockedCreators.filter(c => {
    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase()
      if (!c.username?.toLowerCase().includes(q) && !c.full_name?.toLowerCase().includes(q)) return false
    }
    if (filterCategory !== 'all' && c.category !== filterCategory) return false
    if (filterTier !== 'all') {
      const f = c.followers_count
      // A creator we could not measure has no tier. They are excluded from a tier filter
      // rather than counted as "nano", which is what `|| 0` used to do to them.
      if (f == null || f <= 0) return false
      const tier = f >= 1000000 ? 'mega' : f >= 100000 ? 'macro' : f >= 10000 ? 'micro' : 'nano'
      if (tier !== filterTier) return false
    }
    return true
  })
  // Biggest first, and anyone whose scrape failed sorts LAST rather than as a zero.
  .sort(unmeasuredLast<CreatorProfile>(c => c.followers_count, 'desc', true))

  const hasActiveFilters = filterText.trim() !== '' || filterCategory !== 'all' || filterTier !== 'all'

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Modern React Query based creator search
  const creatorSearchMutation = useCreatorSearch({
    onError: () => {}
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

      // Existing profile not yet unlocked: this costs 25 credits, so ask first
      // (was a silent auto-unlock — same consent dialog as Discovery now).
      if (result.preview_mode || result.unlock_required) {
        if (!result.profile?.id) {
          throw new Error('Profile not found')
        }
        setAnalyzingCreators(prev => {
          const newSet = new Set(prev)
          newSet.delete(cleanUsername)
          return newSet
        })
        removeProcessingToast(cleanUsername)
        setPendingUnlock({ username: cleanUsername, profileId: result.profile.id })
        return
      }

      // Always dispatch credit balance update (worker auto-unlock also spends credits)
      window.dispatchEvent(new CustomEvent('credit-balance-changed'))

      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(cleanUsername)
        return newSet
      })
      removeProcessingToast(cleanUsername)

      // Brief delay to allow DB commit propagation, then refetch unlocked creators
      await new Promise(resolve => setTimeout(resolve, 500))
      await unlockedCreatorsQuery.refetch()
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

  const confirmPendingUnlock = async () => {
    if (!pendingUnlock) return
    const { username, profileId } = pendingUnlock
    setPendingUnlock(null)
    addProcessingToast(username)
    setAnalyzingCreators(prev => new Set([...prev, username]))
    try {
      toast.loading(`Unlocking @${username}...`, { id: `unlock-${username}` })
      const unlockResult = await discoveryService.unlockProfile(profileId)
      toast.dismiss(`unlock-${username}`)
      if (!unlockResult.success) {
        throw new Error(unlockResult.error || 'Unlock failed')
      }
      window.dispatchEvent(new CustomEvent('credit-balance-changed'))
      await new Promise(resolve => setTimeout(resolve, 500))
      await unlockedCreatorsQuery.refetch()
      toast.success(`@${username} unlocked and added to your portfolio!`)
    } catch (error: any) {
      toast.dismiss(`unlock-${username}`)
      if (error.message?.includes('team_limit_exceeded')) {
        toast.error('Monthly profile limit reached. Upgrade your plan for more unlocks.')
      } else if (error.message?.includes('Insufficient credits') || error.message?.includes('402')) {
        toast.error('Insufficient credits. Please top up to unlock this creator.')
      } else {
        toast.error(error.message || 'Unlock failed. Please try again.')
      }
    } finally {
      setAnalyzingCreators(prev => {
        const newSet = new Set(prev)
        newSet.delete(username)
        return newSet
      })
      removeProcessingToast(username)
    }
  }

  // Get processing creators not already in the unlocked list
  const processingUsernames = processingToasts
    .filter(t => !unlockedCreators.some(c => c.username?.toLowerCase() === t.username?.toLowerCase()))

  const clearFilters = () => { setFilterText(""); setFilterCategory("all"); setFilterTier("all") }

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        {unlockedLoading ? (
          <CreatorsSkeleton />
        ) : (
          <Page tier="working">

            <PageHead
              title="Your creators"
              sub={
                unlockedError
                  ? undefined
                  : "Everyone your team has unlocked. Open one for the full analytics, or add another by username."
              }
              action={
                <Button onClick={() => setIsSearchOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add creator
                </Button>
              }
            />

            {/* A FAILED fetch. It replaces the grid entirely and says what it is, because
                the alternative here has always been an empty grid that reads as "you have
                no creators". */}
            {unlockedError ? (
              <LoadFailed what="Your creators" detail={unlockedError} onRetry={handleRefresh} />
            ) : (
              <>
                {/* The filter rail: on the ground, one hairline beneath it. 16px between
                    siblings, 8px between a control and its own parts. */}
                <div className="flex flex-col gap-ds-3 border-b border-border/70 pb-ds-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search your creators"
                      className="pl-9"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </div>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      <SelectItem value="nano">Nano, 1K to 10K</SelectItem>
                      <SelectItem value="micro">Micro, 10K to 100K</SelectItem>
                      <SelectItem value="macro">Macro, 100K to 1M</SelectItem>
                      <SelectItem value="mega">Mega, over 1M</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}

                  {/* The count reflects what is SELECTED, not the blanket total, whenever
                      a filter is on. */}
                  <p className="text-ds-body-sm text-muted-foreground sm:ml-auto">
                    {hasActiveFilters
                      ? `${visibleCreators.length} of ${unlockedCreators.length} shown`
                      : `${unlockedCreators.length} creator${unlockedCreators.length === 1 ? '' : 's'}`}
                  </p>

                  <Button variant="ghost" size="sm" onClick={handleRefresh} aria-label="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Genuinely nothing unlocked yet. One sentence and the action, no
                    illustration and no pitch. */}
                {unlockedCreators.length === 0 && processingUsernames.length === 0 ? (
                  <Nothing action={
                    <Button onClick={() => setIsSearchOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first creator
                    </Button>
                  }>
                    You have not unlocked anyone yet.
                  </Nothing>
                ) : visibleCreators.length === 0 && processingUsernames.length === 0 ? (
                  <Nothing action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}>
                    No creator matches these filters.
                  </Nothing>
                ) : (
                  <div className="grid grid-cols-1 gap-ds-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {processingUsernames.map((pt) => (
                      <ProcessingCreatorCard
                        key={`processing-${pt.username}`}
                        username={pt.username}
                        startedAt={pt.startedAt}
                      />
                    ))}
                    {visibleCreators.map((creator, index) => (
                      <CreatorGridCard
                        key={creator.id || creator.pk || creator.username || `creator-${index}`}
                        creator={creator}
                        isAnalyzing={analyzingCreators.has(creator.username)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination, on the ground with one rule above it. */}
                {unlockedCreators.length > 0 && pagination.total_pages > 1 && (
                  <div className="flex items-center gap-ds-3 border-t border-border/70 pt-ds-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-ds-body-sm text-muted-foreground">
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
                )}
              </>
            )}

            {/* Add a creator by username. */}
            <Dialog open={isSearchOpen} onOpenChange={(open) => {
              setIsSearchOpen(open)
              if (!open) setSearchUsername("")
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add a creator</DialogTitle>
                  <DialogDescription>
                    Enter an Instagram username to unlock their full analytics.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-ds-3">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="username"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchCreator()}
                      className="h-11 pl-9"
                      autoFocus
                    />
                    {searchUsername && (
                      <button
                        type="button"
                        onClick={() => setSearchUsername("")}
                        aria-label="Clear"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <Button
                    className="h-10 w-full gap-2"
                    onClick={handleSearchCreator}
                    disabled={creatorSearchMutation.isPending || !searchUsername.trim()}
                  >
                    {creatorSearchMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Unlock className="h-4 w-4" />}
                    {creatorSearchMutation.isPending ? "Searching" : "Search and unlock"}
                  </Button>

                  <p className="flex flex-wrap items-center justify-center gap-x-ds-3 gap-y-ds-1 text-ds-caption text-muted-foreground">
                    <span className="inline-flex items-center gap-ds-1"><Sparkles className="h-3 w-3" /> AI analysis</span>
                    <span className="inline-flex items-center gap-ds-1"><BarChart3 className="h-3 w-3" /> Full analytics</span>
                    <span className="font-medium text-foreground">25 credits</span>
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Unlock consent — 25 credits is never spent silently */}
            <AlertDialog open={!!pendingUnlock} onOpenChange={(open) => { if (!open) setPendingUnlock(null) }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlock @{pendingUnlock?.username}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This creator is already in our database. Unlocking costs{" "}
                    <span className="font-semibold text-foreground">25 credits</span> and gives your team
                    full analytics access for 30 days.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmPendingUnlock}>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock for 25 credits
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </Page>
        )}
      </BrandUserInterface>
    </AuthGuard>
  )
}
