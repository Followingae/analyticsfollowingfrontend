"use client"

import { Button } from "@/components/ui/button"
import { Download, Tag, Coins, ListPlus } from "lucide-react"

interface BulkActionsBarProps {
  selectedCount: number
  onExport: () => void
  onTag: () => void
  onPricing: () => void
  onAddToList?: () => void
}

export function BulkActionsBar({
  selectedCount,
  onExport,
  onTag,
  onPricing,
  onAddToList,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>
      <div className="h-4 w-px bg-border" />
      {onAddToList && (
        <Button variant="ghost" size="sm" onClick={onAddToList}>
          <ListPlus className="size-4" />
          Add to list
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onExport}>
        <Download className="size-4" />
        Export
      </Button>
      <Button variant="ghost" size="sm" onClick={onTag}>
        <Tag className="size-4" />
        Tag
      </Button>
      <Button variant="ghost" size="sm" onClick={onPricing}>
        <Coins className="size-4" />
        Update Pricing
      </Button>
    </div>
  )
}
