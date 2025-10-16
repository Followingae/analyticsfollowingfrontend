'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Users,
  Plus,
  BarChart3,
  Eye,
  Heart,
  Building,
  Target,
  Brain,
  Sparkles,
  Verified,
  Loader2,
  RefreshCw,
  CheckCircle,
  Crown,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatNumber } from '@/lib/utils'
import { discoveryService, DiscoveryProfile } from '@/services/discoveryService'
import { toast } from 'sonner'

export default function DiscoveryTab() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([])
  const [category, setCategory] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30 // 5 columns × 6 rows

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load initial data when component mounts
  useEffect(() => {
    handleSearch()
  }, [])

  const handleSearch = async (page: number = currentPage, resetPage: boolean = false) => {
    setLoading(true)

    const pageToUse = resetPage ? 1 : page
    if (resetPage) {
      setCurrentPage(1)
    }

    try {
      console.log('🔍 Searching profiles with filters:', {
        search: searchTerm.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        min_followers: getMinFollowersFromTier(tierFilter),
        page: pageToUse
      })

      const result = await discoveryService.browseProfiles({
        search: searchTerm.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        min_followers: getMinFollowersFromTier(tierFilter),
        sort_by: 'followers',
        sort_order: 'desc'
      }, pageToUse, itemsPerPage)

      console.log('📊 Discovery API response:', result)

      if (result.success && result.data) {
        setProfiles(result.data.profiles)
        setTotalCount(result.data.total_count)
        console.log(`✅ Loaded ${result.data.profiles.length} profiles with CDN images`)
      } else {
        setProfiles([])
        setTotalCount(0)
        console.log('❌ No profiles returned:', result.error)
        if (result.error) {
          toast.error(`Discovery failed: ${result.error}`)
        }
      }
    } catch (err) {
      console.error('💥 Discovery error:', err)
      setProfiles([])
      setTotalCount(0)
      toast.error('Failed to load profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMinFollowersFromTier = (tier: string): number | undefined => {
    switch (tier) {
      case 'mega': return 1000000
      case 'macro': return 100000
      case 'micro': return 10000
      case 'nano': return 1000
      default: return undefined
    }
  }

  const getInfluencerTier = (followerCount: number) => {
    if (followerCount >= 1000000) return 'Mega'
    if (followerCount >= 100000) return 'Macro'
    if (followerCount >= 10000) return 'Micro'
    return 'Nano'
  }

  const handleAddCreator = () => {
    toast.success('Add Creator feature coming soon!')
  }

  const handleFilterChange = (newValue: string, filterType: 'category' | 'tier') => {
    if (filterType === 'category') {
      setCategory(newValue)
    } else {
      setTierFilter(newValue)
    }
    // Reset to first page when filters change
    handleSearch(1, true)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    handleSearch(newPage)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleUnlockProfile = async (profile: DiscoveryProfile) => {
    if (profile.unlock_status.is_unlocked) {
      // Already unlocked, go to analytics
      router.push(`/analytics/${profile.username}`)
      return
    }

    // No confirmation needed here - handled by AlertDialog

    try {
      console.log(`🔓 Attempting to unlock profile: ${profile.username} (ID: ${profile.id})`)

      const result = await discoveryService.unlockProfile(profile.id)

      console.log('🔐 Unlock response:', result)

      if (result.success && result.data) {
        toast.success(`Successfully unlocked ${profile.full_name || profile.username}! Access granted for 30 days.`)

        // Update the profile in local state to reflect unlocked status
        setProfiles(prev => prev.map(p =>
          p.id === profile.id
            ? {
                ...p,
                unlock_status: {
                  is_unlocked: true,
                  days_remaining: result.data!.days_remaining,
                  expires_at: result.data!.access_expires_at
                }
              }
            : p
        ))

        // Navigate to analytics
        console.log(`🚀 Navigating to analytics for: ${profile.username}`)
        router.push(`/analytics/${profile.username}`)
      } else {
        console.log('❌ Unlock failed:', result.error)
        if (result.error?.includes('credits') || result.error?.includes('insufficient')) {
          toast.error('Insufficient credits. Please top up your account to unlock this profile.')
        } else if (result.error?.includes('already unlocked')) {
          toast.error('Profile is already unlocked. Redirecting to analytics...')
          router.push(`/analytics/${profile.username}`)
        } else {
          toast.error(result.error || 'Failed to unlock profile')
        }
      }
    } catch (err) {
      console.error('💥 Unlock error:', err)
      toast.error('Network error. Please check your connection and try again.')
    }
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'food', label: 'Food & Cooking' },
    { value: 'travel', label: 'Travel' },
    { value: 'tech', label: 'Technology' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' }
  ]

  const tiers = [
    { value: 'all', label: 'All Tiers' },
    { value: 'nano', label: 'Nano (1K-10K)' },
    { value: 'micro', label: 'Micro (10K-100K)' },
    { value: 'macro', label: 'Macro (100K-1M)' },
    { value: 'mega', label: 'Mega (1M+)' }
  ]

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="space-y-6">Loading filters...</div>
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(1, true)}
              className="pl-9"
            />
          </div>

          <Select value={category} onValueChange={(value) => handleFilterChange(value, 'category')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={(value) => handleFilterChange(value, 'tier')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              {tiers.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => handleSearch(1, true)} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button onClick={handleAddCreator} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Creator
        </Button>
      </div>


      {/* Creator Cards Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((profile) => (
            <Card key={profile.username} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border border-border bg-card shadow-sm hover:shadow-md hover:border-border/60">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  {/* Profile Picture */}
                  <div className="flex justify-center relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20">
                      <img
                        src={profile.profile_pic_url}
                        alt={profile.full_name || profile.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient background with initials
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.className = parent.className + ' flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40';
                            parent.innerHTML = `<div class="text-sm font-bold text-primary-foreground">${(profile.full_name || profile.username).slice(0, 2).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    </div>

                    {/* Unlock Status Badge - Top Right */}
                    {profile.unlock_status.is_unlocked && profile.unlock_status.days_remaining && (
                      <div className="absolute top-0 right-0">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-muted text-muted-foreground px-2 py-0.5"
                        >
                          {profile.unlock_status.days_remaining} days
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="space-y-1 text-center">
                      <h3 className="font-semibold leading-none tracking-tight">
                        {profile.full_name || profile.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{profile.username}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        <span className="mr-1">🌍</span>
                        {profile.country || 'Global'}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {getInfluencerTier(profile.followers_count)}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-lg font-bold">
                        {formatNumber(profile.followers_count)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Followers
                      </p>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {formatNumber(profile.posts_count)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Posts
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  {profile.content_category && (
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {profile.content_category}
                      </Badge>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {profile.unlock_status.is_unlocked ? (
                      <Button
                        onClick={() => handleUnlockProfile(profile)}
                        className="w-full"
                        size="sm"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        View Analytics
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="w-full" size="sm" variant="outline">
                            <Zap className="w-3 h-3 mr-1" />
                            Unlock Analytics
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unlock Creator Analytics</AlertDialogTitle>
                            <AlertDialogDescription>
                              Get full access to <strong>{profile.full_name || profile.username}</strong>'s analytics for 30 days.
                              This will cost 25 credits from your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnlockProfile(profile)}>
                              Unlock for 25 Credits
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Creators Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to discover more creators.
          </p>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </Card>
      )}

      {/* Pagination */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3
                ? i + 1
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i

              if (page < 1 || page > totalPages) return null

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="text-sm text-muted-foreground ml-2">
            Page {currentPage} of {totalPages} ({formatNumber(totalCount)} creators)
          </div>
        </div>
      )}
    </div>
  )
}