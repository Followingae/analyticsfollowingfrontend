"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Camera,
  TrendingUp,
  CheckCircle,
  Heart,
  MessageCircle,
  Play,
} from "lucide-react"
import { getTierColor, formatCount, formatCurrency } from "./proposal-utils"

// Friendly label for pricing keys
function pricingLabel(key: string): string {
  const labels: Record<string, string> = {
    post: "Post",
    reel: "Reel",
    story: "Story",
    carousel: "Carousel",
    video: "Video",
    live: "Live",
    ugc: "UGC",
  }
  return labels[key.toLowerCase()] ?? key
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface InfluencerDetailSheetProps {
  influencer: BrandInfluencer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSelected: boolean
  onToggleSelection: (id: string) => void
  showPricing?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InfluencerDetailSheet({
  influencer,
  open,
  onOpenChange,
  isSelected,
  onToggleSelection,
  showPricing = true,
}: InfluencerDetailSheetProps) {
  // M10: Always render Sheet so close animation works; guard content inside
  const inf = influencer
  const pricing = inf?.sell_pricing ?? {}
  const pricingEntries = Object.entries(pricing).filter(
    ([, v]) => v !== null && v !== undefined
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {!inf ? (
          <SheetHeader><SheetTitle>Loading...</SheetTitle><SheetDescription className="sr-only">Loading influencer details</SheetDescription></SheetHeader>
        ) : (
        <>
        <SheetHeader className="text-left">
          {/* Avatar + identity */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={inf.profile_image_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {(inf.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <SheetTitle className="flex items-center gap-1.5 text-lg">
                @{inf.username ?? "unknown"}
                {inf.is_verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />
                )}
              </SheetTitle>
              {inf.full_name && (
                <p className="text-sm text-muted-foreground">{inf.full_name}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                {inf.tier && (
                  <Badge className={getTierColor(inf.tier)}>{inf.tier}</Badge>
                )}
                {isSelected && (
                  <Badge variant="default" className="text-xs">
                    Selected
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Influencer profile details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Biography */}
          {inf.biography && (
            <div>
              <h4 className="text-sm font-medium mb-1">Biography</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {inf.biography}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">
                  {formatCount(inf.followers_count)}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Camera className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">
                  {formatCount(inf.posts_count)}
                </p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">
                  {inf.engagement_rate
                    ? `${inf.engagement_rate.toFixed(1)}%`
                    : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* Avg metrics */}
          {(inf.avg_likes || inf.avg_comments || inf.avg_views) && (
            <div className="grid grid-cols-3 gap-3">
              {inf.avg_likes !== undefined && inf.avg_likes !== null && (
                <div className="text-center">
                  <Heart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-semibold">
                    {formatCount(inf.avg_likes)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Likes</p>
                </div>
              )}
              {inf.avg_comments !== undefined && inf.avg_comments !== null && (
                <div className="text-center">
                  <MessageCircle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-semibold">
                    {formatCount(inf.avg_comments)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Comments</p>
                </div>
              )}
              {inf.avg_views !== undefined && inf.avg_views !== null && (
                <div className="text-center">
                  <Play className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-semibold">
                    {formatCount(inf.avg_views)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Views</p>
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {inf.categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-1.5">
                {inf.categories.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {inf.tags && inf.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {inf.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sell Pricing table */}
          {showPricing && pricingEntries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Pricing</h4>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pricingEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span className="text-sm">{pricingLabel(key)}</span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="pt-4">
          <Button
            className="w-full"
            variant={isSelected ? "outline" : "default"}
            onClick={() => onToggleSelection(inf.id)}
          >
            {isSelected ? (
              <>Deselect Influencer</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Select Influencer
              </>
            )}
          </Button>
        </SheetFooter>
        </>
        )}
      </SheetContent>
    </Sheet>
  )
}
