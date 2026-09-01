"use client"

/**
 * The database's own strip: what is in it, and the three things you do to it.
 *
 * There is no h1 here any more. The Creators hub above this screen already prints the page
 * title and the tab you are standing on, so a second 24px heading underneath it made the
 * screen open with two titles and told the reader neither was the real one. What is left is
 * the count, which is the only thing this line was ever really saying, and the actions.
 *
 * The count is only printed when we have one. It read `Manage {totalCount} profiles` off a
 * state that starts at 0, so every load of the master database opened by announcing that we
 * hold no creators.
 */
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
  /** False while the count is loading or after a failed read, so we never print a guess. */
  countKnown?: boolean
  loading: boolean
  selectedCount: number
  canRefresh: boolean
  refreshing: boolean
  onAddClick: () => void
  onRefresh: () => void
  onRefreshSelected: () => void
}

export function DatabaseHeader({
  totalCount,
  countKnown = true,
  loading,
  selectedCount,
  canRefresh,
  refreshing,
  onAddClick,
  onRefresh,
  onRefreshSelected,
}: DatabaseHeaderProps) {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-ds-3">
      <p className="max-w-[65ch] text-ds-body text-muted-foreground">
        {countKnown
          ? `${totalCount.toLocaleString()} creator${totalCount === 1 ? "" : "s"} we hold rates for.`
          : "Counting the creators we hold."}
      </p>

      <div className="flex flex-wrap items-center gap-ds-2">
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
                disabled={!canRefresh || selectedCount === 0 || refreshing || loading}
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {selectedCount > 0 && (
                  <span className="ml-1">Re-analyse {selectedCount}</span>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {!canRefresh
              ? "Only a superadmin can start analytics for a creator"
              : selectedCount === 0
                ? "Tick the creators you want re-analysed"
                : `Re-run analytics for ${selectedCount} selected creator${selectedCount === 1 ? "" : "s"}`}
          </TooltipContent>
        </Tooltip>
        <Button onClick={() => setImportOpen(true)} variant="outline" size="sm">
          <Upload className="size-4" />
          Import a spreadsheet
        </Button>
        <Button onClick={onAddClick} size="sm" data-tour="add-creators">
          <Plus className="size-4" />
          Add a creator
        </Button>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={onRefresh}
      />
    </div>
  )
}
