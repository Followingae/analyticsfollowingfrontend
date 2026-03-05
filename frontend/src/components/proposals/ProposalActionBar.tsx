"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, CheckCircle, Save, Loader2, XCircle } from "lucide-react"
import { formatCurrency } from "./proposal-utils"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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

  // H4: Hide action bar entirely for terminal statuses
  if (isTerminal) {
    return (
      <div className="sticky bottom-0 z-50 border-t bg-background shadow-[0_-4px_6px_-1px_rgb(0_0_0/0.1)]">
        <Card className="rounded-none border-0 shadow-none">
          <div className="flex items-center justify-center p-4">
            <Badge className={status === "approved"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }>
              Proposal {status}
            </Badge>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="sticky bottom-0 z-50 border-t bg-background shadow-[0_-4px_6px_-1px_rgb(0_0_0/0.1)]">
      <Card className="rounded-none border-0 shadow-none">
        <div className="flex items-center justify-between p-4">
          {/* Left: selection counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} of {totalCount} selected
            </span>
            {selectedCount > 0 && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {selectedCount}
              </Badge>
            )}
          </div>

          {/* Center: estimated total */}
          {showPricing && estimatedTotal !== undefined && estimatedTotal > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Estimated total:
              </span>
              <span className="text-lg font-semibold">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
          )}

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {canSave && onSaveSelection && (
              <Button
                variant="outline"
                onClick={onSaveSelection}
                disabled={savingSelection}
              >
                {savingSelection ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {savingSelection ? "Saving..." : "Save Selection"}
              </Button>
            )}
            {canRequestMore && (
              <Button variant="outline" onClick={onRequestMore}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Request More
              </Button>
            )}
            {canReject && onReject && (
              <Button variant="outline" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            <Button onClick={onApprove} disabled={!canApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selection
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
