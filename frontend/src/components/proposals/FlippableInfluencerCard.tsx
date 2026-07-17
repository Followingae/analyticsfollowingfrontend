"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart3, X, ArrowLeft } from "lucide-react"
import { getTierConfig, formatCount, formatCurrency, DEFAULT_AVATAR } from "./proposal-utils"
import { motion, AnimatePresence } from "motion/react"
import { FreelancerProfileCard } from "@/components/ui/freelancer-profile-card"
import { HealthStatCard, type StatData, type HealthGraphData } from "@/components/ui/health-stat-card"
import { FlickeringGrid } from "@/components/ui/flickering-grid"

interface FlippableInfluencerCardProps {
  influencer: BrandInfluencer
  isSelected: boolean
  onToggle: (id: string) => void
  isFlipped: boolean
  onFlip: (id: string) => void
  onUnflip: () => void
  showPricing?: boolean
  selectedDeliverables?: string[]
  onToggleDeliverable?: (influencerId: string, deliverable: string) => void
  onViewAnalytics?: (username: string) => void
  /** The best value for each metric across the whole proposal. The back-face bars are a
   *  comparison against these, so "how does this creator stack up here" is a question the
   *  chart can actually answer. Without them every bar would need an invented absolute
   *  scale — which is what it had, and why three of them were always empty. */
  benchmarks?: ProposalBenchmarks
}

export interface ProposalBenchmarks {
  followers: number
  engagement: number
  likes: number
  comments: number
}

function seedColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  const abs = (n: number) => (n < 0 ? -n : n)
  const colors = [
    "rgb(139, 92, 246)",
    "rgb(59, 130, 246)",
    "rgb(16, 185, 129)",
    "rgb(244, 63, 94)",
    "rgb(99, 102, 241)",
    "rgb(20, 184, 166)",
  ]
  return colors[abs(h) % colors.length]
}

// Transparent 1px gif so FreelancerProfileCard banner is transparent
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

const DELIVERABLE_LABELS: Record<string, string> = {
  post: "Post",
  story: "Story",
  reel: "Reel",
  carousel: "Carousel",
  video: "Video",
  bundle: "Bundle",
  monthly: "Monthly",
}

export function FlippableInfluencerCard({
  influencer,
  isSelected,
  onToggle,
  isFlipped,
  onFlip,
  onUnflip,
  showPricing = true,
  selectedDeliverables = [],
  onToggleDeliverable,
  onViewAnalytics,
  benchmarks,
}: FlippableInfluencerCardProps) {
  const inf = influencer
  const pricing = inf.sell_pricing ?? {}
  const tierConfig = inf.tier ? getTierConfig(inf.tier) : null
  const TierIcon = tierConfig?.icon

  const rateDisplay = (() => {
    if (showPricing && pricing.post != null) return formatCurrency(pricing.post)
    if (showPricing && pricing.reel != null) return formatCurrency(pricing.reel)
    return formatCount(inf.posts_count) + " posts"
  })()

  const toolsBadges = (
    <div className="flex flex-wrap gap-1">
      {tierConfig && TierIcon && (
        <Badge
          className={`text-[10px] font-medium ${tierConfig.className} flex items-center gap-0.5 px-1.5 py-0`}
        >
          <TierIcon className="h-2.5 w-2.5" />
          {tierConfig.label}
        </Badge>
      )}
      {inf.is_verified && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          <CheckCircle className="h-2.5 w-2.5 mr-0.5 text-blue-500" />
        </Badge>
      )}
    </div>
  )

  const healthStats: StatData[] = [
    { title: "Avg Likes", value: formatCount(inf.avg_likes) },
    { title: "Avg Comments", value: formatCount(inf.avg_comments) },
    ...(inf.avg_views && inf.avg_views > 0
      ? [{ title: "Avg Views", value: formatCount(inf.avg_views) }]
      : [{ title: "Posts", value: formatCount(inf.posts_count) }]),
  ]

  // Each bar is this creator MEASURED AGAINST THE BEST IN THIS PROPOSAL, so the strongest
  // creator fills the bar and everyone else reads as a share of them. That is a comparison
  // the number can actually support.
  //
  // What was here before could not:
  //   Followers    -> hardcoded 90. Every creator, always. It showed nothing at all.
  //   Engagement   -> rate x 10. Real rates run ~0.2-1.5%, so every bar sat at 2-15%.
  //   Avg Likes    -> likes/followers x 100. That IS engagement, ~1%, so: another stub.
  //   Avg Comments -> comments/likes x 100, capped at 80. ~5%.
  // Three permanently-empty bars next to one permanently-full fake one — which is exactly
  // what you see on the card, and none of it was about the creator.
  const bar = (value: number | null | undefined, best: number | null | undefined) => {
    const v = value ?? 0
    const b = best ?? 0
    if (v <= 0 || b <= 0) return 0
    // Floor at 4 so a real-but-small value still renders as a bar rather than vanishing
    // into the axis and reading as "no data".
    return Math.max(4, Math.min(100, (v / b) * 100))
  }

  const graphData: HealthGraphData[] = [
    {
      label: "Followers",
      value: bar(inf.followers_count, benchmarks?.followers),
      color: "#8b5cf6",
      description: formatCount(inf.followers_count),
    },
    {
      label: "Engagement",
      value: bar(inf.engagement_rate, benchmarks?.engagement),
      color: "#3b82f6",
      description: `${(inf.engagement_rate ?? 0).toFixed(2)}%`,
    },
    {
      label: "Avg Likes",
      value: bar(inf.avg_likes, benchmarks?.likes),
      color: "#10b981",
      description: formatCount(inf.avg_likes),
    },
    {
      label: "Avg Comments",
      value: bar(inf.avg_comments, benchmarks?.comments),
      color: "#f59e0b",
      description: formatCount(inf.avg_comments),
    },
  ]

  const pricingEntries = Object.entries(pricing).filter(
    ([, v]) => v !== null && v !== undefined
  )

  // Selection check badge (shared between faces)
  const selectionBadge = (
    <AnimatePresence>
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute top-3 left-3 z-30 bg-emerald-500 rounded-full p-1 border-2 border-card"
        >
          <CheckCircle className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-500/10"
          : "opacity-80 hover:opacity-100"
      }`}
      style={{ perspective: 1200 }}
    >
      {selectionBadge}

      <div
        className="relative w-full transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ================================================================= */}
        {/* FRONT FACE                                                        */}
        {/* ================================================================= */}
        <div
          className="relative w-full cursor-pointer"
          style={{ backfaceVisibility: "hidden" }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return
            onToggle(inf.id)
          }}
        >
          {/* FlickeringGrid behind the transparent banner area */}
          <div className="absolute inset-x-0 top-0 h-32 bg-muted pointer-events-none rounded-t-2xl overflow-hidden">
            <FlickeringGrid
              squareSize={4}
              gridGap={6}
              flickerChance={0.3}
              color={seedColor(inf.username || inf.id)}
              maxOpacity={0.3}
              className="absolute inset-0"
            />
          </div>

          <FreelancerProfileCard
            name={inf.full_name || inf.username || "Unknown"}
            title={`@${inf.username || "unknown"}`}
            avatarSrc={inf.profile_image_url || DEFAULT_AVATAR}
            bannerSrc={TRANSPARENT_PIXEL}
            rating={inf.engagement_rate ?? 0}
            duration={formatCount(inf.followers_count)}
            rate={rateDisplay}
            tools={toolsBadges}
            onGetInTouch={() => onFlip(inf.id)}
            onBookmark={() => onToggle(inf.id)}
            className="max-w-none card-transparent-banner relative z-[1] [&_h2]:truncate [&_h2]:max-w-[200px]"
            buttonLabel="View Analytics"
            statLabels={{ rating: "engagement", duration: "followers", rate: showPricing ? "price" : "posts" }}
            toolsLabel=""
          />
        </div>

        {/* ================================================================= */}
        {/* BACK FACE                                                         */}
        {/* ================================================================= */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex flex-col bg-card"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Back button. Pinned OUTSIDE the scroll area — it used to sit inside the
              content, so once the content overflowed there was no way back to the front. */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={() => onUnflip()}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUnflip()}
              aria-label="Close analytics"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* The scroll area. The back face is absolutely positioned to the front's height,
              so stats + a 4-bar chart + a legend + deliverables + a button could not
              possibly fit — and overflow-hidden simply cut them off. Scroll instead of
              clip: nothing is unreachable now. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <HealthStatCard
              headerIcon={<BarChart3 className="h-5 w-5" />}
              title="Creator Analytics"
              stats={healthStats}
              graphData={graphData}
              graphHeight={100}
              showLegend={true}
              legendTitle={benchmarks ? "Metrics · vs. best in this proposal" : "Metrics"}
              legendFormat={(item) => (item.description ? `${item.label} · ${item.description}` : item.label)}
              className="max-w-none border-0 shadow-none"
            />
          </div>

          {/* Deliverables + Pricing + Select */}
          <div className="shrink-0 border-t border-border/40 bg-card p-4 pt-3 space-y-3">
            {/* The main action. It was a 7px-tall outline button tucked in a corner, on the
                back of a card you had to find first. */}
            {onViewAnalytics && inf.username && (
              <Button
                className="w-full gap-1.5"
                size="sm"
                onClick={() => onViewAnalytics(inf.username!)}
              >
                <BarChart3 className="h-4 w-4" />
                View full analytics
              </Button>
            )}
            {showPricing && (() => {
              const assigned = inf.assigned_deliverables || []
              const hasAssigned = assigned.length > 0

              const deliverablesToShow = hasAssigned
                ? assigned.map((d) => ({
                    key: d.type,
                    value: pricing[d.type] ?? null,
                    quantity: d.quantity,
                  })).filter((d) => d.value !== null)
                : pricingEntries.map(([key, value]) => ({ key, value, quantity: 1 }))

              if (deliverablesToShow.length === 0) return null

              return (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {hasAssigned ? "Assigned Deliverables" : "Deliverables"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {deliverablesToShow.map(({ key, value, quantity }) => {
                      const isActive = selectedDeliverables.includes(key)
                      return (
                        <button
                          key={key}
                          onClick={() => onToggleDeliverable?.(inf.id, key)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {DELIVERABLE_LABELS[key] || key}
                          {quantity > 1 && (
                            <span className="font-semibold">x{quantity}</span>
                          )}
                          <span className="font-bold text-[11px]">
                            {formatCurrency(value! * quantity)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {hasAssigned && (
                    <p className="text-xs font-semibold text-foreground mt-2 tabular-nums">
                      Total: {formatCurrency(
                        deliverablesToShow.reduce((sum, d) => sum + (d.value || 0) * d.quantity, 0)
                      )}
                    </p>
                  )}
                </div>
              )
            })()}
            <Button
              className="w-full"
              variant={isSelected ? "outline" : "default"}
              size="sm"
              onClick={() => onToggle(inf.id)}
            >
              {isSelected ? "Deselect Creator" : "Select Creator"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
