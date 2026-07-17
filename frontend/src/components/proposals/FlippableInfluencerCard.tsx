"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart3, X, ArrowLeft } from "lucide-react"
import { getTierConfig, formatCount, formatCurrency, DEFAULT_AVATAR } from "./proposal-utils"
import { motion, AnimatePresence } from "motion/react"
import { FreelancerProfileCard } from "@/components/ui/freelancer-profile-card"
// Types only. HealthStatCard itself is gone from this card: its title row, mb-5/mb-6
// rhythm and legend were the reason the back face could never fit, and the legend only
// re-printed the values already written under each bar. The bars are rendered inline.
import { type StatData, type HealthGraphData } from "@/components/ui/health-stat-card"
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
        {/* pointer-events, not just backface-visibility. A hidden backface still sits in
            the layout and still swallows clicks — the back face is absolute inset-0, so
            while the card was unflipped it lay invisibly on top of the front and ate every
            press, including "View Analytics". Only the face you can see may be clicked. */}
        <div
          className={`relative w-full cursor-pointer ${isFlipped ? "pointer-events-none" : ""}`}
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
        {/* It FITS. No scrolling — a card that scrolls inside itself is not a card.
            What was making it overflow was never the creator's data: HealthStatCard's own
            chrome (its title row, mb-5/mb-6 spacing) plus a legend that just re-printed the
            four values already written under the bars. All of it is gone; the bars are
            rendered directly and labelled in place. */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex flex-col bg-card border border-border ${
            isFlipped ? "" : "pointer-events-none"
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Header — the one way back, pinned and never scrolled away. */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-2 py-1.5">
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-[11px]" onClick={() => onUnflip()}>
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
            <span className="truncate text-[11px] font-medium text-muted-foreground">@{inf.username}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUnflip()} aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
            {/* Stats */}
            <div className="grid shrink-0 grid-cols-3 gap-1 text-center">
              {healthStats.map((s, i) => (
                <div key={i} className="rounded-md bg-muted/50 py-1">
                  <div className="text-[13px] font-semibold leading-tight tabular-nums">{s.value}</div>
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.title}</div>
                </div>
              ))}
            </div>

            {/* Bars — each creator against the best in this proposal, so the tallest bar is
                a real creator rather than an invented ceiling. */}
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-1 rounded-md bg-muted/40 px-2 pb-1 pt-2">
              <div className="flex min-h-0 flex-1 items-end justify-around gap-2">
                {graphData.map((b, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span className="shrink-0 text-[9px] font-semibold leading-none tabular-nums">{b.description}</span>
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{ height: `${b.value}%`, backgroundColor: b.color, minHeight: 2 }}
                    />
                    <span className="w-full shrink-0 truncate text-center text-[8px] leading-none text-muted-foreground">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
              {benchmarks && (
                <p className="shrink-0 text-center text-[8px] leading-none text-muted-foreground/70">
                  relative to the strongest creator in this proposal
                </p>
              )}
            </div>
          </div>

          {/* Deliverables + Pricing + Select */}
          <div className="shrink-0 border-t border-border/40 bg-card p-3 pt-2 space-y-2">
            {/* The main action. It was a 7px-tall outline button tucked in a corner, on the
                back of a card you had to find first. */}
            {onViewAnalytics && inf.username && (
              <Button
                className="h-8 w-full gap-1.5"
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

              const total = deliverablesToShow.reduce((sum, d) => sum + (d.value || 0) * d.quantity, 0)

              return (
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {hasAssigned ? "Assigned" : "Deliverables"}
                    </p>
                    {hasAssigned && (
                      <p className="text-[11px] font-semibold tabular-nums">{formatCurrency(total)}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {deliverablesToShow.map(({ key, value, quantity }) => {
                      const isActive = selectedDeliverables.includes(key)
                      return (
                        <button
                          key={key}
                          onClick={() => onToggleDeliverable?.(inf.id, key)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/50 bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {DELIVERABLE_LABELS[key] || key}
                          {quantity > 1 && <span className="font-semibold">x{quantity}</span>}
                          <span className="text-[10px] font-bold">{formatCurrency(value! * quantity)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            <Button
              className="h-8 w-full"
              variant={isSelected ? "outline" : "secondary"}
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
