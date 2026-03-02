"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { superadminApiService } from "@/services/superadminApi"
import {
  type MasterInfluencer,
  type InfluencerDatabaseFilters,
  type InfluencerDatabaseResponse,
  type ViewMode,
  type ColumnKey,
  COLUMN_DEFINITIONS,
  DEFAULT_FILTERS,
} from "@/types/influencerDatabase"
import { DatabaseHeader } from "./DatabaseHeader"
import { DatabaseToolbar } from "./DatabaseToolbar"
import { InfluencerTableView } from "./InfluencerTableView"
import { InfluencerCardView } from "./InfluencerCardView"
import { InfluencerDetailSheet } from "./InfluencerDetailSheet"
import { ExportInfluencersDialog } from "./ExportInfluencersDialog"
import { BulkPricingDialog } from "./BulkPricingDialog"
import { BulkTagDialog } from "./BulkTagDialog"

export function InfluencerDatabasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // --- State ---
  const [filters, setFilters] = useState<InfluencerDatabaseFilters>(() => {
    const params: Partial<InfluencerDatabaseFilters> = {}
    const search = searchParams.get("search")
    if (search) params.search = search
    const sortBy = searchParams.get("sort_by")
    if (sortBy) params.sort_by = sortBy
    const sortOrder = searchParams.get("sort_order")
    if (sortOrder === "asc" || sortOrder === "desc") params.sort_order = sortOrder
    const page = searchParams.get("page")
    if (page) params.page = parseInt(page, 10) || 1
    const pageSize = searchParams.get("page_size")
    if (pageSize) params.page_size = parseInt(pageSize, 10) || 25
    return { ...DEFAULT_FILTERS, ...params }
  })
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(
    COLUMN_DEFINITIONS.filter((c) => c.defaultVisible).map((c) => c.key)
  )
  const [influencers, setInfluencers] = useState<MasterInfluencer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  // Dialog / Sheet state
  const [detailInfluencer, setDetailInfluencer] = useState<MasterInfluencer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkPricingOpen, setBulkPricingOpen] = useState(false)
  const [bulkTagOpen, setBulkTagOpen] = useState(false)

  // --- URL Sync ---
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.sort_by !== DEFAULT_FILTERS.sort_by) params.set("sort_by", filters.sort_by)
    if (filters.sort_order !== DEFAULT_FILTERS.sort_order) params.set("sort_order", filters.sort_order)
    if (filters.page > 1) params.set("page", String(filters.page))
    if (filters.page_size !== DEFAULT_FILTERS.page_size) params.set("page_size", String(filters.page_size))
    const qs = params.toString()
    const path = `/superadmin/influencers${qs ? `?${qs}` : ""}`
    router.replace(path, { scroll: false })
  }, [filters, router])

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await superadminApiService.getInfluencerDatabase(filters)
      if (result.success && result.data) {
        const data = result.data as InfluencerDatabaseResponse
        setInfluencers(data.influencers || [])
        setTotalCount(data.total_count || 0)
        setTotalPages(data.total_pages || 0)
      } else {
        console.warn("Failed to load influencer database:", result.error)
      }
    } catch (error) {
      toast.error("Failed to load influencer database")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Handlers ---
  const onSort = useCallback((sortKey: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortKey,
      sort_order: prev.sort_by === sortKey && prev.sort_order === "asc" ? "desc" : "asc",
      page: 1,
    }))
  }, [])

  const onSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids)
  }, [])

  const onInlineEdit = useCallback(async (influencerId: string, field: string, value: any) => {
    try {
      // Use the update endpoint, not the old pricing endpoint
      await superadminApiService.updateInfluencerMetadata(influencerId, { [field]: value })
      toast.success("Updated")
      fetchData()
    } catch {
      toast.error("Failed to update")
    }
  }, [fetchData])

  const onSave = useCallback(async (influencerId: string, data: any) => {
    try {
      await superadminApiService.updateInfluencerMetadata(influencerId, data)
      toast.success("Saved")
      fetchData()
    } catch {
      toast.error("Failed to save")
    }
  }, [fetchData])

  const onRefresh = useCallback(async (influencerId: string) => {
    try {
      await superadminApiService.refreshInfluencerAnalytics(influencerId)
      toast.success("Analytics refreshed from profiles table")
      fetchData()
    } catch {
      toast.error("Failed to refresh — influencer may not have Creator Analytics data yet")
    }
  }, [fetchData])

  const onViewDetails = useCallback((influencer: MasterInfluencer) => {
    setDetailInfluencer(influencer)
    setDetailOpen(true)
  }, [])

  const onAddClick = useCallback(() => {
    router.push("/superadmin/influencers/add")
  }, [router])

  const onExportClick = useCallback(() => {
    setExportOpen(true)
  }, [])

  const onBulkPricingClick = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one influencer")
      return
    }
    setBulkPricingOpen(true)
  }, [selectedIds])

  const onBulkTagClick = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one influencer")
      return
    }
    setBulkTagOpen(true)
  }, [selectedIds])

  const onPageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }, [])

  const handleBulkPricing = useCallback(async (updates: any[]) => {
    try {
      await superadminApiService.bulkUpdateInfluencerPricing(updates)
      toast.success("Pricing updated")
      fetchData()
    } catch {
      toast.error("Failed to update pricing")
    }
  }, [fetchData])

  const handleExport = useCallback(async (params: any) => {
    try {
      await superadminApiService.exportInfluencers(params)
      toast.success("Export started")
    } catch {
      toast.error("Export failed")
    }
  }, [])

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  return (
    <div className="space-y-6">
      <DatabaseHeader
        totalCount={totalCount}
        loading={loading}
        onAddClick={onAddClick}
        onRefresh={fetchData}
      />

      <DatabaseToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        selectedCount={selectedIds.size}
        onExportClick={onExportClick}
        onBulkPricingClick={onBulkPricingClick}
        onBulkTagClick={onBulkTagClick}
      />

      {viewMode === "table" ? (
        <InfluencerTableView
          influencers={influencers}
          loading={loading}
          visibleColumns={visibleColumns}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onSort={onSort}
          sortBy={filters.sort_by}
          sortOrder={filters.sort_order}
          onViewDetails={onViewDetails}
          onInlineEdit={onInlineEdit}
          totalCount={totalCount}
          page={filters.page}
          pageSize={filters.page_size}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : (
        <InfluencerCardView
          influencers={influencers}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onViewDetails={onViewDetails}
          totalCount={totalCount}
          page={filters.page}
          pageSize={filters.page_size}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      <InfluencerDetailSheet
        influencer={detailInfluencer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSave={onSave}
        onRefresh={onRefresh}
      />

      <ExportInfluencersDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={selectedIdsArray}
        totalCount={totalCount}
        onSubmit={handleExport}
      />

      <BulkPricingDialog
        open={bulkPricingOpen}
        onOpenChange={setBulkPricingOpen}
        selectedIds={selectedIdsArray}
        onSubmit={handleBulkPricing}
      />

      <BulkTagDialog
        open={bulkTagOpen}
        onOpenChange={setBulkTagOpen}
        selectedIds={selectedIdsArray}
        onComplete={fetchData}
      />
    </div>
  )
}
