"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, CheckCircle, Save, Loader2, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "./proposal-utils"
import { ProposalStatusBadge } from "./ProposalStatusBadge"
import { motion, AnimatePresence } from "motion/react"

interface ProposalActionBarProps {
  selectedCount: number
  totalCount: number
  estimatedTotal?: number
  showPricing?: boolean
  onRequestMore: () => void
  onApprove: () => void
  onReject?: () => void
  onSaveSelection?: () => void
  savingSelection?: boolean
  selectionDirty?: boolean
  status: string
}

export function ProposalActionBar({
  selectedCount,
  totalCount,
  estimatedTotal,
  showPricing = true,
  onRequestMore,
  onApprove,
  onReject,
  onSaveSelection,
  savingSelection = false,
  selectionDirty = false,
  status,
}: ProposalActionBarProps) {
  const isTerminal = status === "approved" || status === "rejected"
  const canRequestMore =
    status === "sent" || status === "in_review" || status === "more_requested"
  const canApprove = selectedCount > 0 && !isTerminal
  const canReject = !isTerminal
  const canSave = selectionDirty && !isTerminal

  // Magnetic button effect for approve CTA
  const approveRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const btn = approveRef.current
    if (!btn || isTerminal) return

    const supportsHover = window.matchMedia("(hover: hover)").matches
    if (!supportsHover) return

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`
      btn.style.transition = "transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)"
    }
    const handleLeave = () => {
      btn.style.transform = "translate(0, 0)"
      btn.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
    }

    btn.addEventListener("mousemove", handleMove)
    btn.addEventListener("mouseleave", handleLeave)
    return () => {
      btn.removeEventListener("mousemove", handleMove)
      btn.removeEventListener("mouseleave", handleLeave)
    }
  }, [isTerminal])

  if (isTerminal) {
    return (
      <div className="sticky bottom-0 z-50 border-t border-border/30 bg-background/70 backdrop-blur-xl">
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ProposalStatusBadge status={status} />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky bottom-0 z-50 border-t border-border/30 bg-background/70 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4">
        {/* Left: selection counter + progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedCount}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {selectedCount}
              </motion.span>
            </AnimatePresence>
            {" "}of {totalCount} selected
          </span>
          {/* Mini progress indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: totalCount > 0 ? `${(selectedCount / totalCount) * 100}%` : "0%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Center: estimated total */}
        {showPricing && estimatedTotal !== undefined && estimatedTotal > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Estimated total:
            </span>
            <span className="text-lg font-semibold font-mono tabular-nums">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>
        )}

        {/* Right: action buttons with clear hierarchy */}
        <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2">
          {/* Secondary actions */}
          <AnimatePresence>
            {canSave && onSaveSelection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onSaveSelection}
                      disabled={savingSelection}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {savingSelection ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save Draft</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          {canRequestMore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRequestMore}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Request More Creators</TooltipContent>
            </Tooltip>
          )}

          {/* Separator between secondary and primary actions */}
          {(canSave || canRequestMore) && (canReject || canApprove) && (
            <div className="h-6 w-px bg-border" />
          )}

          {/* Primary actions */}
          {canReject && onReject && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReject}
                  className="text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reject Proposal</TooltipContent>
            </Tooltip>
          )}

          <Button
            ref={approveRef}
            onClick={onApprove}
            disabled={!canApprove}
            className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow px-6"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
