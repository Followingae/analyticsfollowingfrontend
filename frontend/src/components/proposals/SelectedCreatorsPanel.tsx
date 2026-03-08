"use client"

import { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserCheck, Users, X, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useDroppable } from "@dnd-kit/core"
import { formatCount, formatCurrency, DEFAULT_AVATAR } from "./proposal-utils"

const DELIVERABLE_LABELS: Record<string, string> = {
  post: "Post",
  story: "Story",
  reel: "Reel",
  carousel: "Carousel",
  video: "Video",
  bundle: "Bundle",
  monthly: "Monthly",
}

interface SelectedCreatorsPanelProps {
  influencers: BrandInfluencer[]
  selectedIds: Set<string>
  onDeselect: (id: string) => void
  showPricing: boolean
  estimatedTotal: number
  deliverableSelections: Record<string, string[]>
  selectedReach?: number
  selectedAvgEngagement?: number
}

export function SelectedCreatorsPanel({
  influencers,
  selectedIds,
  onDeselect,
  showPricing,
  estimatedTotal,
  deliverableSelections,
  selectedReach,
  selectedAvgEngagement,
}: SelectedCreatorsPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "selection-sidebar" })

  const selectedInfluencers = influencers.filter((inf) => selectedIds.has(inf.id))

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col transition-colors duration-200 ${
        isOver ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Your Selection</h3>
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {selectedInfluencers.length} / {influencers.length}
          </Badge>
        </div>
        {showPricing && estimatedTotal > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Est. total:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(estimatedTotal)}
            </span>
          </p>
        )}
        {/* Mini progress bar */}
        <div className="mt-2 w-full h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width:
                influencers.length > 0
                  ? `${(selectedInfluencers.length / influencers.length) * 100}%`
                  : "0%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        {selectedInfluencers.length > 0 && selectedReach != null && selectedAvgEngagement != null && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatCount(selectedReach)} reach
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {selectedAvgEngagement.toFixed(1)}% eng
            </span>
          </div>
        )}
      </div>

      {/* Drop zone hint */}
      {isOver && (
        <div className="mx-4 mt-2 p-2 rounded-lg border-2 border-dashed border-emerald-500/50 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Drop to select
          </p>
        </div>
      )}

      {/* Selected list */}
      <ScrollArea className="flex-1 p-2">
        <AnimatePresence mode="popLayout">
          {selectedInfluencers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                Select creators from the left to build your campaign
              </p>
            </motion.div>
          ) : (
            selectedInfluencers.map((inf) => {
              const assigned = inf.assigned_deliverables || []
              const pricing = inf.sell_pricing || {}

              // Calculate per-creator deliverable total
              let creatorTotal = 0
              if (assigned.length > 0) {
                for (const d of assigned) {
                  const price = pricing[d.type]
                  if (price != null) {
                    creatorTotal += price * d.quantity
                  }
                }
              }

              return (
                <motion.div
                  key={inf.id}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="p-2.5 rounded-lg hover:bg-muted/50 mb-1.5 group/item"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={inf.profile_image_url || DEFAULT_AVATAR}
                      />
                      <AvatarFallback className="text-xs">
                        {(inf.username ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        @{inf.username ?? "unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCount(inf.followers_count)} followers
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
                      onClick={() => onDeselect(inf.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Assigned deliverables */}
                  {assigned.length > 0 && (
                    <div className="mt-1.5 ml-10 flex flex-wrap gap-1">
                      {assigned.map((d) => {
                        const price = pricing[d.type]
                        return (
                          <span
                            key={d.type}
                            className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {DELIVERABLE_LABELS[d.type] || d.type}
                            {d.quantity > 1 && (
                              <span className="font-medium">x{d.quantity}</span>
                            )}
                            {price != null && (
                              <span className="font-medium text-foreground">
                                {formatCurrency(price * d.quantity)}
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Fallback: show selected deliverables */}
                  {assigned.length === 0 &&
                    deliverableSelections[inf.id]?.length > 0 && (
                      <p className="mt-1 ml-10 text-xs text-primary truncate">
                        {deliverableSelections[inf.id]
                          .map(
                            (d) =>
                              (DELIVERABLE_LABELS[d] || d).charAt(0).toUpperCase() +
                              (DELIVERABLE_LABELS[d] || d).slice(1)
                          )
                          .join(", ")}
                      </p>
                    )}

                  {/* Creator subtotal */}
                  {showPricing && creatorTotal > 0 && (
                    <p className="mt-1 ml-10 text-xs font-semibold text-foreground tabular-nums">
                      {formatCurrency(creatorTotal)}
                    </p>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}
