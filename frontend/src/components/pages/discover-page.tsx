"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Users,
  Eye,
  Heart,
  TrendingUp,
  MapPin,
  Unlock,
  Star,
  Instagram,
  ExternalLink,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { discoveryService, DiscoveryProfile, DiscoveryFilters } from "@/services/discoveryService"
import { creditsApiService } from "@/services/creditsApi"

export default function DiscoverPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [loading, setLoading] = useState(true)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([])
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch credit balance
  const fetchCreditBalance = useCallback(async () => {
    try {
      const result = await creditsApiService.getBalance()
      if (result.success && result.data) {
        const data = result.data as any
        setCreditBalance(data.current_balance ?? data.balance ?? data.credits ?? 0)
      }
    } catch {
      // Silently fail - credit balance is supplementary info
    }
  }, [])

  // Fetch profiles from API
  const fetchProfiles = useCallback(async (resetPage = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentPage = resetPage ? 1 : page
      if (resetPage) setPage(1)

      const filters: DiscoveryFilters = {}
      if (searchQuery.trim()) filters.search = searchQuery.trim()
      if (selectedCategory !== "all") filters.category = selectedCategory
      // Location filter is client-side since API may not support it directly

      const result = await discoveryService.browseProfiles(filters, currentPage, 20)

      if (result.success && result.data) {
        setProfiles(result.data.profiles || [])
        setHasMore(result.data.has_next || false)
        setTotalCount(result.data.total_count || 0)
      } else {
        setError(result.error || "Failed to load profiles")
        setProfiles([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles")
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, page])

  // Initial load
  useEffect(() => {
    fetchProfiles(true)
    fetchCreditBalance()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change (debounced for search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProfiles(true)
    }, searchQuery ? 500 : 0)
    return () => clearTimeout(timeout)
  }, [searchQuery, selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle unlock
  const handleUnlockCreator = async (profileId: string) => {
    setUnlockingId(profileId)
    try {
      const result = await discoveryService.unlockProfile(profileId)

      if (result.success) {
        toast.success("Profile unlocked successfully!")
        // Update local state to reflect unlock
        setProfiles(prev =>
          prev.map(p =>
            p.id === profileId
              ? {
                  ...p,
                  unlock_status: {
                    is_unlocked: true,
                    days_remaining: result.data?.days_remaining ?? 30,
                    expires_at: result.data?.access_expires_at ?? null,
                  },
                }
              : p
          )
        )
        // Refresh credit balance after spending
        fetchCreditBalance()
      } else {
        toast.error(result.error || "Failed to unlock profile")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unlock profile")
    } finally {
      setUnlockingId(null)
    }
  }

  // Navigate to creator analytics
  const handleViewAnalytics = (username: string) => {
    router.push(`/creator-analytics/${username}`)
  }

  // Client-side location filter (API may not support location filtering)
  const filteredProfiles = selectedLocation === "all"
    ? profiles
    : profiles.filter(p => {
        const bio = (p.biography || "").toLowerCase()
        const name = (p.full_name || "").toLowerCase()
        return bio.includes(selectedLocation.toLowerCase()) || name.includes(selectedLocation.toLowerCase())
      })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCreditBalance = (balance: number | null) => {
    if (balance === null) return "..."
    return balance.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover Creators</h1>
          <p className="text-muted-foreground">Find and unlock Instagram creators for your campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Zap className="h-3 w-3 mr-1" />
            {formatCreditBalance(creditBalance)} credits
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-search-input
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load creators</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchProfiles(true)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const isUnlocked = profile.unlock_status?.is_unlocked || false
              const engagementRate = profile.avg_engagement_rate ?? profile.preview_data?.estimated_engagement ?? 0
              const unlockCost = profile.unlock_cost ?? 25

              return (
                <Card key={profile.id} className="relative overflow-hidden">
                  {isUnlocked && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <Unlock className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={profile.cdn_urls?.avatar?.[0] || profile.profile_pic_url_hd || profile.profile_pic_url || ""}
                          alt={profile.username}
                        />
                        <AvatarFallback>
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{profile.full_name || profile.username}</h3>
                          {profile.is_verified && (
                            <Badge variant="secondary" className="px-1 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                        {profile.content_category && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{profile.content_category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Followers</span>
                        </div>
                        <p className="font-semibold">{formatNumber(profile.followers_count || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-muted-foreground">Posts</span>
                        </div>
                        <p className="font-semibold">{formatNumber(profile.posts_count || 0)}</p>
                      </div>
                    </div>

                    {/* Engagement Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Engagement Rate</span>
                        <span className="font-medium">{engagementRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(engagementRate * 10, 100)} className="h-2" />
                    </div>

                    {/* Category */}
                    <div className="flex items-center justify-between">
                      {profile.content_category ? (
                        <Badge variant="outline">{profile.content_category}</Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Instagram className="h-3 w-3" />
                        <span>Instagram</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {isUnlocked ? (
                        <>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewAnalytics(profile.username)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Analytics
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Visit Profile</DialogTitle>
                                <DialogDescription>
                                  Visit @{profile.username} on Instagram
                                </DialogDescription>
                              </DialogHeader>
                              <Button asChild>
                                <a
                                  href={`https://instagram.com/${profile.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open Instagram Profile
                                </a>
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUnlockCreator(profile.id)}
                          disabled={unlockingId === profile.id}
                        >
                          {unlockingId === profile.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Unlock className="h-3 w-3 mr-1" />
                          )}
                          Unlock ({unlockCost} credits)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {(hasMore || page > 1) && (
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  setPage(p => p - 1)
                  fetchProfiles(false)
                }}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                Page {page} ({totalCount} total)
              </span>
              <Button
                variant="outline"
                disabled={!hasMore}
                onClick={() => {
                  setPage(p => p + 1)
                  fetchProfiles(false)
                }}
              >
                Next
              </Button>
            </div>
          )}

          {filteredProfiles.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
