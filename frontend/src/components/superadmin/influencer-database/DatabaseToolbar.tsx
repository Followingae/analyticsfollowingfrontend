"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { InfluencerDatabaseFilters, ColumnKey, ViewMode } from "@/types/influencerDatabase"
import { FilterBar } from "./FilterBar"
import { ColumnVisibilityToggle } from "./ColumnVisibilityToggle"
import { BulkActionsBar } from "./BulkActionsBar"
import { Search, LayoutGrid, Table2, ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// The API has always accepted sort_by/sort_order (whitelisted server-side) and defaulted
// to created_at DESC — there was simply no way to change it from the UI, so "show me what
// we added most recently" meant scrolling. Values must stay inside the server whitelist:
// created_at, updated_at, username, followers_count, engagement_rate, status, tier.
const SORT_OPTIONS: Array<{ value: string; label: string; by: string; order: "asc" | "desc" }> = [
  { value: "created_at:desc", label: "Newest added", by: "created_at", order: "desc" },
  { value: "created_at:asc", label: "Oldest added", by: "created_at", order: "asc" },
  { value: "updated_at:desc", label: "Recently updated", by: "updated_at", order: "desc" },
  { value: "updated_at:asc", label: "Least recently updated", by: "updated_at", order: "asc" },
  { value: "followers_count:desc", label: "Most followers", by: "followers_count", order: "desc" },
  { value: "followers_count:asc", label: "Fewest followers", by: "followers_count", order: "asc" },
  { value: "engagement_rate:desc", label: "Highest engagement", by: "engagement_rate", order: "desc" },
  { value: "username:asc", label: "Username A–Z", by: "username", order: "asc" },
]

interface DatabaseToolbarProps {
  filters: InfluencerDatabaseFilters
  onFiltersChange: (filters: InfluencerDatabaseFilters) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  visibleColumns: ColumnKey[]
  onVisibleColumnsChange: (cols: ColumnKey[]) => void
  selectedCount: number
  onExportClick: () => void
  onBulkPricingClick: () => void
  onBulkTagClick: () => void
  onAddToListClick?: () => void
}

export function DatabaseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  visibleColumns,
  onVisibleColumnsChange,
  selectedCount,
  onExportClick,
  onBulkPricingClick,
  onBulkTagClick,
  onAddToListClick,
}: DatabaseToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Sync external search changes
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search influencers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <FilterBar filters={filters} onFiltersChange={onFiltersChange} />
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={`${filters.sort_by}:${filters.sort_order}`}
            onValueChange={(v) => {
              const opt = SORT_OPTIONS.find((o) => o.value === v)
              if (!opt) return
              // Reset to page 1: staying on page 4 of the old order lands the user in the
              // middle of a list they did not ask for.
              onFiltersChange({ ...filters, sort_by: opt.by, sort_order: opt.order, page: 1 })
            }}
          >
            <SelectTrigger className="h-9 w-[190px]" aria-label="Sort creators">
              <ArrowUpDown className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-r-none"
              onClick={() => onViewModeChange("table")}
            >
              <Table2 className="size-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-l-none"
              onClick={() => onViewModeChange("card")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <ColumnVisibilityToggle
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={onVisibleColumnsChange}
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onExport={onExportClick}
          onTag={onBulkTagClick}
          onPricing={onBulkPricingClick}
          onAddToList={onAddToListClick}
        />
      )}
    </div>
  )
}
