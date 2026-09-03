"use client"

/**
 * The master database. Density tier: SCANNING.
 *
 * This is the screen an operator opens to work down two hundred creators, so the air goes
 * around the table and never inside it: rows stay near 34px, cells keep 8 to 10 vertical and
 * 12 to 16 horizontal, and the separation between the page's parts is space rather than a
 * border. The table used to sit in a rounded box; a grid that already has rules of its own
 * does not need a fourth edge drawn around it.
 *
 * Three states, not one. A read that failed is not an empty database: "no creators found"
 * over a 500 has had people re-import a spreadsheet we already held.
 */
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
import { useMoneyColumns } from "./useMoneyColumns"

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
    // Coverage links on the same three words it counts with. A param this screen does not
    // recognise is not merely ignored: the URL-sync effect below rewrites the bar from
    // `filters`, so an unread param is stripped a render later and the link silently opens
    // the unfiltered database while the tile it came from claimed a number.
    const pricing = searchParams.get("pricing")
    if (pricing === "costed" || pricing === "quotable"
        || pricing === "unquotable" || pricing === "none") params.pricing = pricing
    const stale = searchParams.get("stale_costs")
    if (stale === "true" || stale === "false") params.stale_costs = stale === "true"
    const status = searchParams.get("status")
    if (status) params.status = [status] as never
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
  /* Loading, loaded and failed are three different screens. Held separately from `loading`
     so a failed read can refuse to draw a table at all rather than drawing an empty one. */
  const [error, setError] = useState<string | null>(null)

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
    if (filters.pricing) params.set("pricing", filters.pricing)
    if (filters.stale_costs !== null) params.set("stale_costs", String(filters.stale_costs))
    if (filters.status.length) params.set("status", filters.status[0])
    if (filters.page > 1) params.set("page", String(filters.page))
    if (filters.page_size !== DEFAULT_FILTERS.page_size) params.set("page_size", String(filters.page_size))
    const qs = params.toString()
    // /work is the console's address for this screen and the one every link in the nav uses.
    // Rewriting the bar to /superadmin on first render told a talent manager, on the screen
    // they live in, that they were somewhere they are not. Same page either way.
    const path = `/work/influencers${qs ? `?${qs}` : ""}`
    router.replace(path, { scroll: false })
  }, [filters, router])

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await superadminApiService.getInfluencerDatabase(filters)
      if (result.success && result.data) {
        const data = result.data as InfluencerDatabaseResponse
        setInfluencers(data.influencers || [])
        setTotalCount(data.total_count || 0)
        setTotalPages(data.total_pages || 0)
      } else {
        // This branch was empty, so a refusal left the last good page on screen and said
        // nothing. A read that did not succeed is an error, not a database with nothing in it.
        throw new Error((result as any)?.error || "The database did not answer")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The database did not answer")
      setInfluencers([])
      setTotalCount(0)
      setTotalPages(0)
      toast.error("Could not load the creator database")
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
  /* Cost, sell and margin are three different secrets and this list carries all of them.
     The columns a viewer may not read are removed from the definition list rather than
     blanked, so the table never lays them out and the picker never offers them. */
  const money = useMoneyColumns()
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

  /* Removing a creator was the one destructive action on this screen that asked with the
     browser's own dialog: a different typeface, a different place on the screen, and a
     sentence that could not say what is actually lost. */
  const [toRemove, setToRemove] = useState<MasterInfluencer | null>(null)

  const onDelete = useCallback((influencerId: string) => {
    setToRemove(influencers.find((i) => i.id === influencerId) ?? null)
  }, [influencers])

  const confirmRemove = useCallback(async () => {
    if (!toRemove) return
    try {
      await superadminApiService.removeInfluencerFromDatabase(toRemove.id)
      toast.success(`@${toRemove.username} removed`)
      setToRemove(null)
      fetchData()
    } catch {
      toast.error("Could not remove that creator")
    }
  }, [toRemove, fetchData])

  const onViewDetails = useCallback((influencer: MasterInfluencer) => {
    router.push(`/creator-analytics/${influencer.username}`)
  }, [router])

  const onEditDetails = useCallback((influencer: MasterInfluencer) => {
    setDetailInfluencer(influencer)
    setDetailOpen(true)
  }, [])

  const onAddClick = useCallback(() => {
    router.push("/work/influencers/add")
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

  /* The stored preference is what the operator ticked; this is what they may be shown. The
     intersection is taken at render, so a rate column cannot reach the DOM through a
     preference set before we knew who was looking. */
  const shownColumns = useMemo(
    () => visibleColumns.filter(money.allows),
    [visibleColumns, money],
  )

  return (
    <div className="flex flex-col gap-ds-5">
      {/* Work in progress is a state, so it is a tinted surface rather than a card, and the
          tint is the console's info tone rather than a fifth hand-picked blue. */}
      {hasActiveJobs && activeJobCount > 0 && (
        <section className="flex flex-col gap-ds-2 rounded-ds-surface bg-[var(--tone-info-wash)] px-ds-4 py-ds-3">
          <p className="flex items-center gap-ds-2 text-ds-label">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing {activeJobCount} creator{activeJobCount === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col gap-ds-1">
            {activeJobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-ds-2 text-ds-caption">
                <span className="font-medium">@{j.username}</span>
                <span className="text-muted-foreground">
                  {j.message || j.status}
                  {j.progress ? ` · ${j.progress}%` : ""}
                </span>
                {/* Disabled with no reason given is a dead control: the reader is left to
                    work out whether it is broken or whether they are not allowed. The header
                    already explains this rule on the same page; the row says it too. */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <button
                        type="button"
                        disabled={!isSuperAdmin}
                        onClick={() => triggerRetry(j.id)}
                        className="underline underline-offset-2 hover:text-foreground disabled:no-underline disabled:opacity-50"
                      >
                        Start again
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSuperAdmin
                      ? `Start @${j.username} over`
                      : 'Only a superadmin can start analytics for a creator'}
                  </TooltipContent>
                </Tooltip>
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
        </section>
      )}

      <DatabaseHeader
        totalCount={totalCount}
        countKnown={!loading && !error}
        loading={loading}
        selectedCount={isSuperAdmin ? selectedIds.size : 0}
        canRefresh={isSuperAdmin}
        refreshing={refreshingSelected}
        onAddClick={onAddClick}
        onRefresh={fetchData}
        onRefreshSelected={onRefreshSelected}
      />

      {/* The toolbar belongs to the list it filters, so they are one group with a sibling's
          gap between them, not two subjects a section apart. */}
      <div className="flex flex-col gap-ds-3">
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

        {/* An error draws no list. "No creators found" over a failed read has had people
            re-import a spreadsheet we were already holding. */}
        {error ? (
          <section className="flex max-w-[65ch] flex-col items-start gap-ds-2 py-ds-5">
            <p className="text-ds-label">The creator database did not load.</p>
            <p className="text-ds-body text-muted-foreground">
              {error}. Nothing is being shown because nothing is known: this is not an empty
              database.
            </p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Try again
            </Button>
          </section>
        ) : viewMode === "table" ? (
          <InfluencerTableView
            influencers={influencers}
            loading={loading}
            visibleColumns={shownColumns}
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
      </div>

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
      <AlertDialog open={!!toRemove} onOpenChange={(o: boolean) => { if (!o) setToRemove(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove @{toRemove?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              They come off the database, with the rates and notes we hold on them. Rosters
              and proposals they are already on are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddToProposalDialog
        open={addToProposalOpen}
        onOpenChange={setAddToProposalOpen}
        selected={influencers.filter(i => selectedIds.has(i.id))}
        onDone={() => setSelectedIds(new Set())}
      />
    </div>
  )
}
