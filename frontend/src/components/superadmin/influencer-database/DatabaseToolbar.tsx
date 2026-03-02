"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { InfluencerDatabaseFilters, ColumnKey, ViewMode } from "@/types/influencerDatabase"
import { FilterBar } from "./FilterBar"
import { ColumnVisibilityToggle } from "./ColumnVisibilityToggle"
import { BulkActionsBar } from "./BulkActionsBar"
import { Search, LayoutGrid, Table2 } from "lucide-react"

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
        />
      )}
    </div>
  )
}
