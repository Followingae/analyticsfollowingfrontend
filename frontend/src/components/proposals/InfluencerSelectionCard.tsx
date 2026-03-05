"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Camera,
  MessageCircle,
  Eye,
  CheckCircle,
  Video,
  Image as ImageIcon,
} from "lucide-react"
import { getTierColor, formatCount, formatCurrency } from "./proposal-utils"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface InfluencerSelectionCardProps {
  influencer: BrandInfluencer
  isSelected: boolean
  onToggle: (id: string) => void
  onViewDetails: (influencer: BrandInfluencer) => void
  showPricing?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InfluencerSelectionCard({
  influencer,
  isSelected,
  onToggle,
  onViewDetails,
  showPricing = true,
}: InfluencerSelectionCardProps) {
  const inf = influencer
  const pricing = inf.sell_pricing ?? {}

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:border-primary/50"
      }`}
      onClick={() => onToggle(inf.id)}
    >
      <CardContent className="p-4">
        {/* Top row: checkbox + tier */}
        <div className="flex items-center justify-between mb-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(inf.id)}
            onClick={(e) => e.stopPropagation()}
          />
          {inf.tier && (
            <Badge className={getTierColor(inf.tier)}>{inf.tier}</Badge>
          )}
        </div>

        {/* Avatar + username */}
        <div className="flex flex-col items-center text-center space-y-2 mb-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={inf.profile_image_url ?? undefined} />
            <AvatarFallback>
              {(inf.username ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="font-semibold text-sm">
                @{inf.username ?? "unknown"}
              </span>
              {inf.is_verified && (
                <CheckCircle className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
              )}
            </div>
            {inf.full_name && (
              <p className="text-xs text-muted-foreground">{inf.full_name}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatCount(inf.followers_count)}
          </span>
          <span className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {formatCount(inf.posts_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {inf.engagement_rate ? `${inf.engagement_rate.toFixed(1)}%` : "-"}
          </span>
        </div>

        {/* Category badges */}
        {inf.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mb-3">
            {inf.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
            {inf.categories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{inf.categories.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Pricing row */}
        {showPricing && Object.keys(pricing).length > 0 && (
          <>
            <Separator className="mb-3" />
            <div className="flex items-center justify-center gap-4 text-xs mb-3">
              {pricing.post !== undefined && pricing.post !== null && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  Post {formatCurrency(pricing.post)}
                </span>
              )}
              {pricing.reel !== undefined && pricing.reel !== null && (
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3 text-muted-foreground" />
                  Reel {formatCurrency(pricing.reel)}
                </span>
              )}
              {pricing.story !== undefined && pricing.story !== null && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  Story {formatCurrency(pricing.story)}
                </span>
              )}
            </div>
          </>
        )}

        {/* View Details button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(inf)
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}
