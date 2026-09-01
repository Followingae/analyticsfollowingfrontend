"use client"

/**
 * What we have shared with this client.
 *
 * WORKING tier: 40px between subjects, 16px between siblings, and a card only around a
 * creator, which is a real object.
 *
 * Two things on this screen were saying something untrue, and both mattered more than the
 * spacing did.
 *
 * A failed fetch rendered as "No influencers have been shared with your account". This is
 * the page where a client reads what we sent them, so a 500 was telling them we had sent
 * nothing. Error, empty and still-loading are now three separate states, and the
 * `result.success === false` branch, which used to fall through silently into the same
 * sentence, is a failure too.
 *
 * And the figures went through `formatCount`, which returns "0" for a value that is
 * missing. A creator with no follower count is a scrape that failed, not a creator with no
 * followers. They now go through the brand primitives, where the mark for "we do not know"
 * is an en dash and is impossible to confuse with a measurement.
 *
 * Money is the `Money` primitive rather than `formatCents`, which builds its string around a
 * bare U+20C3 codepoint. That renders as an empty box anywhere the Dirham face is not named
 * on the element itself, which is everywhere except the primitive.
 */

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { superadminApiService } from "@/services/superadminApi"
import { getEngagementColor } from "@/types/influencerDatabase"

import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import {
  Search,
  CheckCircle,
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Coins,
} from "lucide-react"
import { cdnAvatar } from "@/lib/avatar"
import {
  compact, LoadFailed, Loading, Money, Nothing, Page, PageHead, percent, UNKNOWN,
} from "@/components/brand/primitives"

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

// Tier badges use the theme's OKLCH categorical (chart) tokens rather than raw Tailwind
// palette classes, so they stay on-system and theme-aware in both light and dark. Text
// stays `foreground` for guaranteed contrast; the tinted fill + border differentiate tiers.
function getTierColor(tier?: string | null) {
  switch (tier?.toLowerCase()) {
    case "mega": return "bg-chart-2/15 text-foreground border border-chart-2/40"
    case "macro": return "bg-chart-1/15 text-foreground border border-chart-1/40"
    case "mid": return "bg-chart-5/15 text-foreground border border-chart-5/40"
    case "micro": return "bg-chart-4/15 text-foreground border border-chart-4/40"
    case "nano": return "bg-chart-3/15 text-foreground border border-chart-3/40"
    default: return "bg-muted text-muted-foreground"
  }
}

/** The seven sell prices, in the order a client reads them. */
const DELIVERABLES = [
  ["Post", "sell_post_aed_cents"],
  ["Reel", "sell_reel_aed_cents"],
  ["Story", "sell_story_aed_cents"],
  ["Carousel", "sell_carousel_aed_cents"],
  ["Video", "sell_video_aed_cents"],
  ["Bundle", "sell_bundle_aed_cents"],
  ["Monthly", "sell_monthly_aed_cents"],
] as const

function SharedInfluencersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareName = searchParams.get("name")

  const [influencers, setInfluencers] = useState<SharedInfluencer[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState("")

  const loadShared = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const result = await superadminApiService.getSharedInfluencersForUser()
      // `success: false` used to fall straight through to the empty copy with the list
      // still at []. On this screen that reads as "we sent you nothing".
      if (!result.success || !result.data) {
        setInfluencers([])
        setFailed(true)
        return
      }
      const data = result.data as any
      const list = data.influencers || data
      setInfluencers(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Failed to load shared influencers:', error)
      setInfluencers([])
      setFailed(true)
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

  // The count under the title is a fact about what we sent. While it is loading, or after
  // the call failed, we do not have that fact and must not invent a zero.
  const subtitle = loading
    ? "Loading what your account manager has shared."
    : failed
    ? "We could not read your shared list just now."
    : `${influencers.length} creator${influencers.length !== 1 ? "s" : ""} shared with your account`

  return (
    <AuthGuard requireAuth>
      <BrandUserInterface>
        <Page tier="working" className="@container/main">
          <PageHead
            title={shareName || "Shared with you"}
            sub={subtitle}
            back={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/my-lists?tab=shared")}
                className="-ml-2 h-auto gap-ds-2 self-start px-2 py-1 text-ds-caption text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Shared lists
              </Button>
            }
          />

          {/* The search only makes sense over a list we actually hold. */}
          {!loading && !failed && influencers.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {loading ? (
            <Loading rows={4} />
          ) : failed ? (
            <LoadFailed
              what="Your shared creators"
              detail="Something went wrong on our side. This is a display problem, not a count of zero, so it does not mean nothing has been shared with you."
              onRetry={() => void loadShared()}
            />
          ) : influencers.length === 0 ? (
            <Nothing>
              Nothing has been shared with your account yet. Ask your account manager to
              share creator profiles with you.
            </Nothing>
          ) : filtered.length === 0 ? (
            <Nothing>No creators match “{search}”.</Nothing>
          ) : (
            <div className="grid gap-ds-3 @md/main:grid-cols-2 @xl/main:grid-cols-3">
              {filtered.map((inf) => {
                const prices = DELIVERABLES
                  .map(([label, key]) => [label, inf[key]] as const)
                  .filter(([, cents]) => cents != null)

                return (
                  <Card key={inf.id} className="overflow-hidden">
                    <CardContent className="flex flex-col gap-ds-3 p-6">
                      {/* Who */}
                      <div className="flex items-start gap-ds-3">
                        <ProfileAvatar
                          src={cdnAvatar(inf.profile_image_url)}
                          alt={inf.username}
                          fallbackText={inf.username}
                          size="lg"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                          <div className="flex items-center gap-ds-1">
                            <span className="truncate text-ds-label">@{inf.username}</span>
                            {inf.is_verified && (
                              <CheckCircle className="h-4 w-4 shrink-0 text-info" />
                            )}
                          </div>
                          {inf.full_name && (
                            <p className="truncate text-ds-caption text-muted-foreground">
                              {inf.full_name}
                            </p>
                          )}
                          {(inf.tier || (inf.status && inf.status !== "active")) && (
                            <div className="flex flex-wrap items-center gap-ds-1 pt-ds-1">
                              {inf.tier && (
                                <Badge variant="secondary" className={`capitalize ${getTierColor(inf.tier)}`}>
                                  {inf.tier}
                                </Badge>
                              )}
                              {inf.status && inf.status !== "active" && (
                                <Badge variant="outline" className="capitalize">{inf.status}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {inf.biography && (
                        <p className="line-clamp-2 max-w-[65ch] text-ds-caption text-muted-foreground">
                          {inf.biography}
                        </p>
                      )}

                      {/* Three readings. The grey tiles came off: a number is not an
                          object, and three tinted boxes in a row said it three times. */}
                      <dl className="grid grid-cols-3 gap-ds-3">
                        <div className="flex flex-col gap-ds-1">
                          <dt className="text-ds-overline uppercase text-muted-foreground">Followers</dt>
                          <dd className="text-ds-label tabular-nums">
                            {compact(inf.followers_count, true)}
                          </dd>
                        </div>
                        <div className="flex flex-col gap-ds-1">
                          <dt className="text-ds-overline uppercase text-muted-foreground">Posts</dt>
                          <dd className="text-ds-label tabular-nums">
                            {compact(inf.posts_count)}
                          </dd>
                        </div>
                        <div className="flex flex-col gap-ds-1">
                          <dt className="text-ds-overline uppercase text-muted-foreground">Engagement</dt>
                          <dd
                            className={`text-ds-label tabular-nums ${
                              inf.engagement_rate ? getEngagementColor(inf.engagement_rate) : ""
                            }`}
                            title={percent(inf.engagement_rate, 2) === UNKNOWN ? "This did not measure" : undefined}
                          >
                            {percent(inf.engagement_rate, 2)}
                          </dd>
                        </div>
                      </dl>

                      {(inf.avg_likes != null || inf.avg_comments != null || inf.avg_views != null) && (
                        <p className="flex flex-wrap items-center gap-ds-3 text-ds-caption text-muted-foreground">
                          {inf.avg_likes != null && (
                            <span className="flex items-center gap-ds-1">
                              <Heart className="h-3 w-3" />
                              {compact(inf.avg_likes)} avg
                            </span>
                          )}
                          {inf.avg_comments != null && (
                            <span className="flex items-center gap-ds-1">
                              <MessageCircle className="h-3 w-3" />
                              {compact(inf.avg_comments)} avg
                            </span>
                          )}
                          {inf.avg_views != null && (
                            <span className="flex items-center gap-ds-1">
                              <Eye className="h-3 w-3" />
                              {compact(inf.avg_views)} avg
                            </span>
                          )}
                        </p>
                      )}

                      {(inf.categories || []).length > 0 && (
                        <div className="flex flex-wrap gap-ds-1">
                          {(inf.categories || []).slice(0, 4).map((cat) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))}
                          {(inf.categories || []).length > 4 && (
                            <Badge variant="outline">+{(inf.categories || []).length - 4}</Badge>
                          )}
                        </div>
                      )}

                      {/* Pricing is a different subject, so it gets one hairline rather
                          than a second card inside the first. */}
                      {hasPricing && (
                        <div className="flex flex-col gap-ds-2 border-t border-border pt-ds-3">
                          <p className="flex items-center gap-ds-1 text-ds-overline uppercase text-muted-foreground">
                            <Coins className="h-3 w-3" />
                            Pricing
                          </p>
                          {prices.length === 0 ? (
                            <p className="text-ds-caption text-muted-foreground">
                              No price set for this creator yet.
                            </p>
                          ) : (
                            <dl className="grid grid-cols-3 gap-ds-2">
                              {prices.map(([label, cents]) => (
                                <div key={label} className="flex flex-col gap-ds-1">
                                  <dt className="text-ds-caption text-muted-foreground">{label}</dt>
                                  <dd className="text-ds-label tabular-nums">
                                    <Money amount={(cents as number) / 100} decimals={0} />
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      )}

                      {(inf.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-ds-1 border-t border-border pt-ds-3">
                          {(inf.tags || []).slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </Page>
      </BrandUserInterface>
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
