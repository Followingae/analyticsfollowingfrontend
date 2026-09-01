"use client"

/**
 * One creator, as a card. Density tier: WORKING.
 *
 * A card is right here and nowhere else on this screen: a creator is a real object you can
 * open, edit and remove, which is exactly the test. What is not right is a card inside it,
 * so the tinted pricing tray is gone and its three lines sit on a hairline instead. The
 * padding is the 24px shadcn ships rather than the p-4 it was overridden to.
 *
 * Rates are gated. Talent see what we pay, account management see what we charge, and only
 * leadership see the difference; a viewer outside a scope gets no line at all rather than an
 * empty one, because a blanked row still says "there is a number here you are not allowed".
 */
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TIER_OPTIONS,
  STATUS_OPTIONS,
  getEngagementColor,
  computeMarginPercent,
  type MasterInfluencer,
} from "@/types/influencerDatabase"
import { BadgeCheck, Pencil } from "lucide-react"
import { CreatorAvatar } from "./CreatorAvatar"
import { Money, count } from "./Money"
import { useMoneyColumns } from "./useMoneyColumns"
import { cn } from "@/lib/utils"

interface InfluencerCardProps {
  influencer: MasterInfluencer
  onViewDetails: (influencer: MasterInfluencer) => void
  onEditDetails: (influencer: MasterInfluencer) => void
}

const STATUS_INK: Record<string, string> = {
  active: "text-[var(--tone-good-ink)]",
  inactive: "text-muted-foreground",
  blacklisted: "text-[var(--tone-bad-ink)]",
  pending: "text-[var(--tone-warn-ink)]",
}

export function InfluencerCard({
  influencer: inf,
  onViewDetails,
  onEditDetails,
}: InfluencerCardProps) {
  const { canSeeCost, canSeeSell, canSeeMargin } = useMoneyColumns()

  const tierOpt = inf.tier ? TIER_OPTIONS.find((t) => t.value === inf.tier) : null
  const statusOpt = STATUS_OPTIONS.find((s) => s.value === inf.status)

  const costPost = inf.cost_post_aed_cents
  const sellPost = inf.sell_post_aed_cents
  const margin = canSeeMargin ? computeMarginPercent(costPost, sellPost) : null
  const marginTone =
    margin === null ? null
      : margin >= 30 ? { ink: "text-[var(--tone-good-ink)]", word: "healthy" }
      : margin >= 15 ? { ink: "text-[var(--tone-warn-ink)]", word: "thin" }
      : { ink: "text-[var(--tone-bad-ink)]", word: "poor" }

  return (
    <Card className="gap-0 py-0 transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col gap-ds-3 p-ds-4">
        {/* Who they are */}
        <div className="flex items-center gap-ds-2">
          <CreatorAvatar username={inf.username} src={inf.profile_image_url} className="size-10" textClassName="text-sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-ds-1">
              <span className="truncate text-ds-label font-semibold">
                @{inf.username}
              </span>
              {inf.is_verified && (
                <BadgeCheck className="size-3.5 shrink-0 text-[var(--tone-info-dot)]" />
              )}
            </div>
            {inf.full_name && (
              <p className="truncate text-ds-caption text-muted-foreground">
                {inf.full_name}
              </p>
            )}
          </div>
        </div>

        {inf.categories.length > 0 && (
          <div className="flex flex-wrap gap-ds-1">
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

        {/* Two figures, separated by the space between them rather than a box each. An
            engagement rate we were never given is a dash, not 0%. */}
        <div className="flex gap-ds-5">
          <div>
            <p className="text-ds-caption text-muted-foreground">Followers</p>
            <p className="text-ds-label font-semibold tabular-nums">
              {count(inf.followers_count)}
            </p>
          </div>
          <div>
            <p className="text-ds-caption text-muted-foreground">Engagement</p>
            <p
              className={cn(
                "text-ds-label font-semibold tabular-nums",
                inf.engagement_rate != null ? getEngagementColor(inf.engagement_rate) : "text-muted-foreground",
              )}
            >
              {inf.engagement_rate != null ? `${inf.engagement_rate.toFixed(2)}%` : "–"}
            </p>
          </div>
        </div>

        {/* What a post is worth, on a hairline rather than in a tray. */}
        {(canSeeCost || canSeeSell) && (
          <div className="flex flex-col gap-ds-1 border-t pt-ds-2">
            {canSeeCost && (
              <div className="flex items-center justify-between text-ds-caption">
                <span className="text-muted-foreground">Post, what we pay</span>
                <span className="font-medium tabular-nums"><Money cents={costPost} /></span>
              </div>
            )}
            {canSeeSell && (
              <div className="flex items-center justify-between text-ds-caption">
                <span className="text-muted-foreground">Post, what we charge</span>
                <span className="font-medium tabular-nums"><Money cents={sellPost} /></span>
              </div>
            )}
            {margin !== null && marginTone && (
              <div className="flex items-center justify-between text-ds-caption">
                <span className="text-muted-foreground">Margin</span>
                <span className={cn("font-semibold tabular-nums", marginTone.ink)}>
                  {margin.toFixed(1)}%
                  <span className="ml-1 font-normal">{marginTone.word}</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-ds-2">
          {tierOpt && (
            <span className="inline-flex items-center rounded-ds-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-white/[0.08]">
              {tierOpt.label}
            </span>
          )}
          {statusOpt && (
            <span className={cn("text-[10px] font-medium", STATUS_INK[inf.status] ?? "")}>
              {statusOpt.label}
            </span>
          )}
        </div>

        <div className="flex gap-ds-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(inf)}
          >
            Open their analytics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            aria-label={`Edit @${inf.username}`}
            onClick={() => onEditDetails(inf)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
