"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Plus,
  RefreshCw,
  Loader2,
  Upload,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExcelImportDialog } from "./ExcelImportDialog"

interface DatabaseHeaderProps {
  totalCount: number
  loading: boolean
  selectedCount: number
  refreshing: boolean
  onAddClick: () => void
  onRefresh: () => void
  onRefreshSelected: () => void
}

export function DatabaseHeader({
  totalCount,
  loading,
  selectedCount,
  refreshing,
  onAddClick,
  onRefresh,
  onRefreshSelected,
}: DatabaseHeaderProps) {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Influencer Database
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage {totalCount.toLocaleString()} influencer profiles and pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Re-running analytics costs money and takes an Apify slot each, so this asks
              for creators first. It used to reload the page quietly, which is why it was
              pressed against the whole database and why nineteen creators were refreshed
              in three minutes with our scraper limits blocking most of them. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={onRefreshSelected}
                  variant="outline"
                  size="sm"
                  disabled={selectedCount === 0 || refreshing || loading}
                >
                  {refreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {selectedCount > 0 && (
                    <span className="ml-1">Refresh {selectedCount}</span>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {selectedCount === 0
                ? "Tick the creators you want re-analysed"
                : `Re-run analytics for ${selectedCount} selected creator${selectedCount === 1 ? "" : "s"}`}
            </TooltipContent>
          </Tooltip>
          <Button onClick={() => setImportOpen(true)} variant="outline" size="sm">
            <Upload className="size-4" />
            Import Excel
          </Button>
          <Button onClick={onAddClick} size="sm" data-tour="add-creators">
            <Plus className="size-4" />
            Add Influencer
          </Button>
        </div>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={onRefresh}
      />
    </div>
  )
}
