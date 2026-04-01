"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TIER_OPTIONS,
  STATUS_OPTIONS,
  formatCount,
  formatCents,
  getEngagementColor,
  computeMarginPercent,
  type MasterInfluencer,
} from "@/types/influencerDatabase"
import { BadgeCheck, Pencil } from "lucide-react"

interface InfluencerCardProps {
  influencer: MasterInfluencer
  onViewDetails: (influencer: MasterInfluencer) => void
  onEditDetails: (influencer: MasterInfluencer) => void
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
    "from-amber-500 to-orange-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export function InfluencerCard({
  influencer: inf,
  onViewDetails,
  onEditDetails,
}: InfluencerCardProps) {
  const tierOpt = inf.tier ? TIER_OPTIONS.find((t) => t.value === inf.tier) : null
  const statusOpt = STATUS_OPTIONS.find((s) => s.value === inf.status)

  const costPost = inf.cost_post_aed_cents
  const sellPost = inf.sell_post_aed_cents
  const margin = computeMarginPercent(costPost, sellPost)

  return (
    <Card className="gap-0 py-0 transition-shadow hover:shadow-lg">
      <CardContent className="p-4 space-y-3">
        {/* Profile Header */}
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${getAvatarGradient(inf.username)}`}
          >
            {inf.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold">
                @{inf.username}
              </span>
              {inf.is_verified && (
                <BadgeCheck className="size-3.5 shrink-0 text-blue-500" />
              )}
            </div>
            {inf.full_name && (
              <p className="truncate text-xs text-muted-foreground">
                {inf.full_name}
              </p>
            )}
          </div>
        </div>

        {/* Categories */}
        {inf.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {inf.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                {cat}
              </Badge>
            ))}
            {inf.categories.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{inf.categories.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="text-sm font-semibold">
              {formatCount(inf.followers_count)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Engagement</p>
            <p
              className={`text-sm font-semibold ${inf.engagement_rate !== null ? getEngagementColor(inf.engagement_rate) : ""}`}
            >
              {inf.engagement_rate !== null ? `${inf.engagement_rate.toFixed(2)}%` : "—"}
            </p>
          </div>
        </div>

        {/* Cost vs Sell */}
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">IG Post Cost</span>
            <span className="font-medium">{formatCents(costPost)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">IG Post Sell</span>
            <span className="font-medium">{formatCents(sellPost)}</span>
          </div>
          {margin !== null && (
            <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Margin</span>
              <span
                className={`font-semibold ${
                  margin >= 30
                    ? "text-green-600"
                    : margin >= 15
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {margin.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Tier + Status badges */}
        <div className="flex items-center gap-2">
          {tierOpt && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tierOpt.color}`}
            >
              {tierOpt.label}
            </span>
          )}
          {statusOpt && (
            <span className={`text-[10px] font-medium ${statusOpt.color}`}>
              {statusOpt.label}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(inf)}
          >
            View Analytics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            onClick={() => onEditDetails(inf)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
