"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { superadminApiService } from "@/services/superadminApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import {
  type MasterInfluencer,
  type InfluencerDatabaseFilters,
  type InfluencerDatabaseResponse,
  type ViewMode,
  type ColumnKey,
  COLUMN_DEFINITIONS,
  DEFAULT_FILTERS,
} from "@/types/influencerDatabase"
import { useAnalyticsStatusPoller } from "@/hooks/useAnalyticsStatusPoller"
import { DatabaseHeader } from "./DatabaseHeader"
import { DatabaseToolbar } from "./DatabaseToolbar"
import { InfluencerTableView } from "./InfluencerTableView"
import { InfluencerCardView } from "./InfluencerCardView"
import { InfluencerDetailSheet } from "./InfluencerDetailSheet"
import { ExportInfluencersDialog } from "./ExportInfluencersDialog"
import { BulkPricingDialog } from "./BulkPricingDialog"
import { BulkTagDialog } from "./BulkTagDialog"
import { AddToListDialog } from "./AddToListDialog"
import { AddToProposalDialog } from "./AddToProposalDialog"

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
    // Category and market arrive from Coverage, which links straight at the gap it is
    // asking someone to fill. Comma separated so a link can carry more than one.
    const categories = searchParams.get("categories")
    if (categories) params.categories = categories.split(",").filter(Boolean) as never
    const countries = searchParams.get("countries")
    if (countries) params.countries = countries.split(",").filter(Boolean)
    const hasPricing = searchParams.get("has_pricing")
    if (hasPricing === "true" || hasPricing === "false") params.has_pricing = hasPricing === "true"
    return { ...DEFAULT_FILTERS, ...params }
  })
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addToListOpen, setAddToListOpen] = useState(false)
  const [addToProposalOpen, setAddToProposalOpen] = useState(false)
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
    if (filters.categories.length) params.set("categories", filters.categories.join(","))
    if (filters.countries.length) params.set("countries", filters.countries.join(","))
    if (filters.has_pricing !== null) params.set("has_pricing", String(filters.has_pricing))
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

      }
    } catch (error) {
      toast.error("Failed to load influencer database")

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
      toast.error("Failed to refresh - influencer may not have Creator Analytics data yet")
    }
  }, [fetchData])

  const { isSuperAdmin } = useAdminAccess()
  const [refreshingSelected, setRefreshingSelected] = useState(false)

  /** Re-run analytics for the creators that are ticked, and nobody else.
   *
   * One at a time on purpose. Our Apify account allows 32 concurrent runs and 64GB across
   * them, and each creator launches four actors; firing a page of creators at once is how
   * five of them ended up reading "failed" this morning when the only thing that failed was
   * our own queue being full.
   */
  const onRefreshSelected = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return

    setRefreshingSelected(true)
    let started = 0
    let already = 0
    const refused: string[] = []
    try {
      for (const id of ids) {
        const who = influencers.find((i) => i.id === id)?.username ?? "creator"
        // This service reports failure in the response rather than by throwing, so the
        // result has to be read; a try/catch alone would count every refusal as a success.
        const res = await superadminApiService.triggerInfluencerAnalytics(id).catch(
          (e: any) => ({ success: false, error: String(e?.message ?? e) })
        )
        if (res?.success) started += 1
        else if (/already (queued|in progress)/i.test(String(res?.error ?? ""))) already += 1
        else refused.push(who)
      }
      if (started) toast.success(`Analysing ${started} creator${started === 1 ? "" : "s"}`)
      if (already) toast.info(`${already} already running`)
      if (refused.length) toast.error(`Could not start: ${refused.slice(0, 3).join(", ")}`)
      fetchData()
    } finally {
      setRefreshingSelected(false)
    }
  }, [selectedIds, influencers, fetchData])

  const onDelete = useCallback(async (influencerId: string) => {
    if (!confirm("Remove this influencer from the database?")) return
    try {
      await superadminApiService.removeInfluencerFromDatabase(influencerId)
      toast.success("Influencer removed")
      fetchData()
    } catch {
      toast.error("Failed to remove influencer")
    }
  }, [fetchData])

  const onViewDetails = useCallback((influencer: MasterInfluencer) => {
    router.push(`/creator-analytics/${influencer.username}`)
  }, [router])

  const onEditDetails = useCallback((influencer: MasterInfluencer) => {
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

  // --- Analytics Status Polling ---
  const influencerIds = useMemo(() => influencers.map((i) => String(i.id)), [influencers])
  const { statusMap, hasActiveJobs, completedSinceMount } = useAnalyticsStatusPoller(
    influencerIds,
    influencers.length > 0
  )

  // Auto-refresh table when analytics complete (synced data now available)
  useEffect(() => {
    if (completedSinceMount.length > 0) {
      fetchData()
    }
  }, [completedSinceMount.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerRetry = useCallback(async (influencerId: string) => {
    try {
      await superadminApiService.triggerInfluencerAnalytics(influencerId)
      toast.success("Analytics job queued")
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        toast.warning("Analytics already in progress")
      } else {
        toast.error("Failed to trigger analytics")
      }
    }
  }, [])

  /* Who is actually being analysed, by name.
   *
   * A count on its own is unactionable: "2 influencers are being analysed" for three days
   * tells you something is wrong and nothing about what. These are the rows, so they can be
   * chased, retried or stopped. */
  const activeJobs = useMemo(
    () =>
      Object.entries(statusMap)
        .filter(([, s]) =>
          !["completed", "failed", "skipped", "unavailable", "not_started"].includes(s.status))
        .map(([id, s]) => ({
          id,
          username: influencers.find((i) => String(i.id) === id)?.username || id.slice(0, 8),
          status: s.status,
          progress: s.progress,
          message: s.progressMessage,
        })),
    [statusMap, influencers]
  )
  const activeJobCount = activeJobs.length

  const stopAnalytics = useCallback(async (influencerId: string) => {
    try {
      await superadminApiService.cancelAnalytics(influencerId)
      toast.success("Stopped")
      fetchData()
    } catch {
      toast.error("Could not stop that one")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  return (
    <div className="space-y-6">
      {hasActiveJobs && activeJobCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>
            Analysing {activeJobCount} creator{activeJobCount === 1 ? "" : "s"}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1.5">
              {activeJobs.map((j) => (
                <div key={j.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-medium">@{j.username}</span>
                  <span className="text-muted-foreground">
                    {j.message || j.status}
                    {j.progress ? ` · ${j.progress}%` : ""}
                  </span>
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => triggerRetry(j.id)}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Start again
                  </button>
                  <button
                    type="button"
                    onClick={() => stopAnalytics(j.id)}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Stop
                  </button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <DatabaseHeader
        totalCount={totalCount}
        loading={loading}
        selectedCount={isSuperAdmin ? selectedIds.size : 0}
        canRefresh={isSuperAdmin}
        refreshing={refreshingSelected}
        onAddClick={onAddClick}
        onRefresh={fetchData}
        onRefreshSelected={onRefreshSelected}
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
        onAddToListClick={() => setAddToListOpen(true)}
        onAddToProposalClick={() => setAddToProposalOpen(true)}
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
          onEditDetails={onEditDetails}
          onDelete={onDelete}
          onInlineEdit={onInlineEdit}
          totalCount={totalCount}
          page={filters.page}
          pageSize={filters.page_size}
          totalPages={totalPages}
          onPageChange={onPageChange}
          analyticsStatusMap={statusMap}
          completedSinceMount={completedSinceMount}
          onTriggerAnalytics={isSuperAdmin ? triggerRetry : undefined}
        />
      ) : (
        <InfluencerCardView
          influencers={influencers}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onViewDetails={onViewDetails}
          onEditDetails={onEditDetails}
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

      <AddToListDialog
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
        influencerIds={selectedIdsArray}
        onDone={() => setSelectedIds(new Set())}
      />

      {/* The whole row is passed, not just the id: the dialog has to say which of the
          selected creators cannot be quoted, and that needs their pricing. */}
      <AddToProposalDialog
        open={addToProposalOpen}
        onOpenChange={setAddToProposalOpen}
        selected={influencers.filter(i => selectedIds.has(i.id))}
        onDone={() => setSelectedIds(new Set())}
      />
    </div>
  )
}
