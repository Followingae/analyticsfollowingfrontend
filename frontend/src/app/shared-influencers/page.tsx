"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { superadminApiService } from "@/services/superadminApi"
import { toast } from "sonner"
import { formatCount, formatCents, getEngagementColor } from "@/types/influencerDatabase"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import {
  Search,
  Users,
  Loader2,
  CheckCircle,
  Inbox,
  ArrowLeft,
  Instagram,
  Heart,
  MessageCircle,
  Eye,
  Coins,
} from "lucide-react"

interface SharedInfluencer {
  id: string
  username: string
  full_name?: string | null
  biography?: string | null
  profile_image_url?: string | null
  is_verified?: boolean
  is_private?: boolean
  followers_count?: number | null
  following_count?: number | null
  posts_count?: number | null
  status?: string | null
  tier?: string | null
  categories?: string[] | null
  tags?: string[] | null
  engagement_rate?: number | null
  avg_likes?: number | null
  avg_comments?: number | null
  avg_views?: number | null
  sell_post_aed_cents?: number | null
  sell_story_aed_cents?: number | null
  sell_reel_aed_cents?: number | null
  sell_carousel_aed_cents?: number | null
  sell_video_aed_cents?: number | null
  sell_bundle_aed_cents?: number | null
  sell_monthly_aed_cents?: number | null
}

function getTierColor(tier?: string | null) {
  switch (tier?.toLowerCase()) {
    case "mega": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    case "macro": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "mid": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "micro": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "nano": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    default: return "bg-muted text-muted-foreground"
  }
}

function SharedInfluencersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get("share_id")
  const shareName = searchParams.get("name")

  const [influencers, setInfluencers] = useState<SharedInfluencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadShared = useCallback(async () => {
    try {
      setLoading(true)
      const result = await superadminApiService.getSharedInfluencersForUser()
      if (result.success && result.data) {
        const data = result.data as any
        const list = data.influencers || data
        setInfluencers(Array.isArray(list) ? list : [])
      }
    } catch {
      toast.error("Failed to load shared influencers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadShared()
  }, [loadShared])

  const filtered = influencers.filter((inf) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (inf.username || "").toLowerCase().includes(q) ||
      (inf.full_name || "").toLowerCase().includes(q) ||
      (inf.categories || []).some((c) => c.toLowerCase().includes(q))
    )
  })

  const hasPricing = influencers.some(
    (inf) =>
      inf.sell_post_aed_cents != null ||
      inf.sell_reel_aed_cents != null ||
      inf.sell_story_aed_cents != null
  )

  return (
    <AuthGuard requireAuth>
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/my-lists?tab=shared")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      {shareName || "Shared Influencers"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {influencers.length} influencer{influencers.length !== 1 ? "s" : ""} shared with your account
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, username, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium">
                    {influencers.length === 0
                      ? "No influencers have been shared with your account"
                      : "No influencers match your search"}
                  </p>
                  {influencers.length === 0 && (
                    <p className="text-sm mt-1">
                      Ask your account manager to share influencer profiles with you
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 @md/main:grid-cols-2 @xl/main:grid-cols-3">
                  {filtered.map((inf) => (
                    <Card key={inf.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Profile header */}
                        <div className="flex items-start gap-3 mb-3">
                          <ProfileAvatar
                            src={inf.profile_image_url}
                            alt={inf.username}
                            fallbackText={inf.username}
                            size="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold truncate">
                                @{inf.username}
                              </span>
                              {inf.is_verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                              )}
                            </div>
                            {inf.full_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {inf.full_name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {inf.tier && (
                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getTierColor(inf.tier)}`}>
                                  {inf.tier}
                                </Badge>
                              )}
                              {inf.status && inf.status !== "active" && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {inf.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        {inf.biography && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {inf.biography}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 rounded-md bg-muted/50">
                            <p className="text-xs text-muted-foreground">Followers</p>
                            <p className="text-sm font-semibold">
                              {formatCount(inf.followers_count ?? null)}
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-muted/50">
                            <p className="text-xs text-muted-foreground">Posts</p>
                            <p className="text-sm font-semibold">
                              {formatCount(inf.posts_count ?? null)}
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-muted/50">
                            <p className="text-xs text-muted-foreground">Engagement</p>
                            <p className={`text-sm font-semibold ${inf.engagement_rate != null ? getEngagementColor(inf.engagement_rate) : ""}`}>
                              {inf.engagement_rate != null
                                ? `${inf.engagement_rate.toFixed(2)}%`
                                : "--"}
                            </p>
                          </div>
                        </div>

                        {/* Engagement details (if available) */}
                        {(inf.avg_likes != null || inf.avg_comments != null || inf.avg_views != null) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            {inf.avg_likes != null && (
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {formatCount(inf.avg_likes)} avg
                              </span>
                            )}
                            {inf.avg_comments != null && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {formatCount(inf.avg_comments)} avg
                              </span>
                            )}
                            {inf.avg_views != null && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatCount(inf.avg_views)} avg
                              </span>
                            )}
                          </div>
                        )}

                        {/* Categories */}
                        {(inf.categories || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(inf.categories || []).slice(0, 4).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-[10px]">
                                {cat}
                              </Badge>
                            ))}
                            {(inf.categories || []).length > 4 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{(inf.categories || []).length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Sell Pricing */}
                        {hasPricing && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              Pricing
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {inf.sell_post_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Post</p>
                                  <p className="font-medium">{formatCents(inf.sell_post_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_reel_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Reel</p>
                                  <p className="font-medium">{formatCents(inf.sell_reel_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_story_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Story</p>
                                  <p className="font-medium">{formatCents(inf.sell_story_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_carousel_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Carousel</p>
                                  <p className="font-medium">{formatCents(inf.sell_carousel_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_video_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Video</p>
                                  <p className="font-medium">{formatCents(inf.sell_video_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_bundle_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Bundle</p>
                                  <p className="font-medium">{formatCents(inf.sell_bundle_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_monthly_aed_cents != null && (
                                <div>
                                  <p className="text-muted-foreground">Monthly</p>
                                  <p className="font-medium">{formatCents(inf.sell_monthly_aed_cents)}</p>
                                </div>
                              )}
                              {inf.sell_post_aed_cents == null &&
                                inf.sell_reel_aed_cents == null &&
                                inf.sell_story_aed_cents == null && (
                                  <p className="text-muted-foreground col-span-3">No pricing set</p>
                                )}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {(inf.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                            {(inf.tags || []).slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

export default function SharedInfluencersPage() {
  return (
    <Suspense>
      <SharedInfluencersContent />
    </Suspense>
  )
}
