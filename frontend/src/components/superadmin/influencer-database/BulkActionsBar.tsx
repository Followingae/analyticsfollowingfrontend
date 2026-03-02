"use client"

import { Button } from "@/components/ui/button"
import { Download, Tag, DollarSign } from "lucide-react"

interface BulkActionsBarProps {
  selectedCount: number
  onExport: () => void
  onTag: () => void
  onPricing: () => void
}

export function BulkActionsBar({
  selectedCount,
  onExport,
  onTag,
  onPricing,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={onExport}>
        <Download className="size-4" />
        Export
      </Button>
      <Button variant="ghost" size="sm" onClick={onTag}>
        <Tag className="size-4" />
        Tag
      </Button>
      <Button variant="ghost" size="sm" onClick={onPricing}>
        <DollarSign className="size-4" />
        Update Pricing
      </Button>
    </div>
  )
}
