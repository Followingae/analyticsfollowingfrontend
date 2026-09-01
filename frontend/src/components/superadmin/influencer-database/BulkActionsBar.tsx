"use client"

import { Button } from "@/components/ui/button"
import { Download, Tag, Coins, ListPlus , FileText} from "lucide-react"
import { useAdminAccess } from "@/hooks/useAdminAccess"

interface BulkActionsBarProps {
  selectedCount: number
  onExport: () => void
  onTag: () => void
  onPricing: () => void
  onAddToList?: () => void
  onAddToProposal?: () => void
}

export function BulkActionsBar({
  selectedCount,
  onExport,
  onTag,
  onPricing,
  onAddToList,
  onAddToProposal,
}: BulkActionsBarProps) {
  // Bulk extraction is leadership-only — the server refuses regardless, this stops us
  // showing the team a button that always fails. See app/core/field_policy.py.
  const { canExport } = useAdminAccess()
  return (
    // A selection is a state, so it is a tint rather than a bordered box: the surface says
    // "something is set apart here" without drawing a fourth edge across the toolbar.
    <div className="flex flex-wrap items-center gap-ds-2 rounded-ds-surface bg-[var(--tone-info-wash)] px-ds-3 py-ds-2">
      <span className="text-ds-label">
        {selectedCount} selected
      </span>
      <div className="h-4 w-px bg-black/10 dark:bg-white/15" />
      {onAddToProposal && (
        <Button variant="ghost" size="sm" onClick={onAddToProposal}>
          <FileText className="size-4" />
          Add to proposal
        </Button>
      )}
      {onAddToList && (
        <Button variant="ghost" size="sm" onClick={onAddToList}>
          <ListPlus className="size-4" />
          Add to list
        </Button>
      )}
      {canExport && (
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="size-4" />
          Export
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onTag}>
        <Tag className="size-4" />
        Tag
      </Button>
      <Button variant="ghost" size="sm" onClick={onPricing}>
        <Coins className="size-4" />
        Set their rates
      </Button>
    </div>
  )
}
