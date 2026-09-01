"use client"

/**
 * The database as a table. Density tier: SCANNING.
 *
 * Rows sit at 34px, cells at 8 vertical and 12 horizontal, and figures are right-aligned and
 * tabular so two rates can be compared down a column. The rounded border that used to be
 * drawn around the whole grid is gone: a table already has rules, and a box around it is a
 * fourth edge that carries nothing. The air moved to the page margin, which is where it
 * belongs on a screen whose job is to hold two hundred creators at once.
 *
 * Rate columns are filtered through the viewer's money scope a second time here, so a stale
 * preference cannot put cost in front of somebody who may not read it.
 */
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { InlineEditCell } from "./InlineEditCell"
import { CreatorAvatar } from "./CreatorAvatar"
import { AnalyticsStatusCell } from "./AnalyticsStatusCell"
import type { AnalyticsStatusMap } from "@/hooks/useAnalyticsStatusPoller"
import {
  COLUMN_DEFINITIONS,
  STATUS_OPTIONS,
  getEngagementColor,
  computeMarginPercent,
  type MasterInfluencer,
  type ColumnKey,
} from "@/types/influencerDatabase"
import { count } from "./Money"
import { useMoneyColumns } from "./useMoneyColumns"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from "lucide-react"

interface InfluencerTableViewProps {
  influencers: MasterInfluencer[]
  loading: boolean
  visibleColumns: ColumnKey[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  sortBy: string
  sortOrder: "asc" | "desc"
  onSort: (key: string) => void
  onInlineEdit: (id: string, field: string, value: number | null) => void
  onViewDetails: (influencer: MasterInfluencer) => void
  onEditDetails: (influencer: MasterInfluencer) => void
  onDelete?: (influencerId: string) => void
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  analyticsStatusMap?: AnalyticsStatusMap
  completedSinceMount?: string[]
  onTriggerAnalytics?: (id: string) => void
}

export function InfluencerTableView({
  influencers,
  loading,
  visibleColumns,
  selectedIds,
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  onInlineEdit,
  onViewDetails,
  onEditDetails,
  onDelete,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  analyticsStatusMap,
  completedSinceMount,
  onTriggerAnalytics,
}: InfluencerTableViewProps) {
  const money = useMoneyColumns()
  const columns = COLUMN_DEFINITIONS.filter(
    (col) => visibleColumns.includes(col.key) && money.allows(col.key)
  )

  /** Figures compare down a column, so they sit right and the words sit left. */
  const NUMERIC: ColumnKey[] = [
    "followers", "engagement", "ig_post_cost", "ig_post_sell", "ig_reel_cost",
    "ig_reel_sell", "ig_story_cost", "video_cost", "video_sell", "margin",
  ]

  const allSelected =
    influencers.length > 0 &&
    influencers.every((inf) => selectedIds.has(inf.id))

  const someSelected =
    influencers.some((inf) => selectedIds.has(inf.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      const newIds = new Set(selectedIds)
      influencers.forEach((inf) => newIds.delete(inf.id))
      onSelectionChange(newIds)
    } else {
      const newIds = new Set(selectedIds)
      influencers.forEach((inf) => newIds.add(inf.id))
      onSelectionChange(newIds)
    }
  }

  const toggleOne = (id: string) => {
    const newIds = new Set(selectedIds)
    if (newIds.has(id)) {
      newIds.delete(id)
    } else {
      newIds.add(id)
    }
    onSelectionChange(newIds)
  }

  const offset = (page - 1) * pageSize

  const renderSortIcon = (col: (typeof COLUMN_DEFINITIONS)[0]) => {
    if (!col.sortable || !col.sortKey) return null
    if (sortBy !== col.sortKey) return null
    return sortOrder === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    )
  }

  const renderCell = (inf: MasterInfluencer, key: ColumnKey) => {
    switch (key) {
      case "select":
        return (
          <Checkbox
            checked={selectedIds.has(inf.id)}
            onCheckedChange={() => toggleOne(inf.id)}
          />
        )
      case "profile":
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <CreatorAvatar username={inf.username} src={inf.profile_image_url} />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">
                  @{inf.username}
                </span>
                {inf.is_verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-blue-500" />
                )}
              </div>
              {inf.full_name && (
                <p className="truncate text-xs text-muted-foreground">
                  {inf.full_name}
                </p>
              )}
            </div>
          </div>
        )
      case "followers":
        return (
          <span className="font-medium tabular-nums">
            {count(inf.followers_count)}
          </span>
        )
      case "engagement":
        // An engagement rate we were never given is a dash. A measured 0% is a real,
        // alarming figure and still prints as 0.00%, which is why this tests for null
        // rather than for falsiness.
        return inf.engagement_rate != null ? (
          <span className={`font-medium tabular-nums ${getEngagementColor(inf.engagement_rate)}`}>
            {inf.engagement_rate.toFixed(2)}%
          </span>
        ) : (
          <span className="text-muted-foreground">–</span>
        )
      case "categories": {
        /* What somebody tagged them as, or failing that what the analytics decided they
           post about. 136 of 315 creators carry no tag at all, and an empty cell says
           nothing about whether we simply never got round to them. */
        const cats: string[] =
          (inf.categories?.length ? inf.categories : (inf as any).ai_content_categories) || []
        if (!cats.length) return <span className="text-muted-foreground">–</span>
        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {cats.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                {cat}
              </Badge>
            ))}
            {cats.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{cats.length - 2}
              </Badge>
            )}
          </div>
        )
      }
      case "tier": {
        /* The BAND, not the pricing tier.
         *
         * `tier` on this table means standard / premium / exclusive, and 292 of 315
         * creators have never been given one, so this column was blank for almost the whole
         * database. The band is nano / micro / macro / mega, it is what proposals are sold
         * in, and the server works it out from follower count for anyone we have measured.
         * A band somebody set by hand is marked, because that is a decision rather than
         * arithmetic. */
        const band = (inf as any).band_label as string | undefined
        const derived = (inf as any).band_derived as boolean | undefined
        if (!band) return <span className="text-muted-foreground">–</span>
        return (
          <span
            title={derived ? "From their follower count" : "Set by hand"}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              derived ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            {band}
            {!derived && <span className="text-[9px]">•</span>}
          </span>
        )
      }
      case "country":
        // "--" not "UAE": country is only ever what an operator recorded. Showing a guess
        // here would make an unset creator look filterable when they are not.
        return inf.country
          ? <span className="text-xs">{inf.country}</span>
          : <span className="text-muted-foreground">–</span>
      case "ig_post_cost":
        return (
          <InlineEditCell
            value={inf.cost_post_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_post_aed_cents", v)}
          />
        )
      case "ig_post_sell":
        return (
          <InlineEditCell
            value={inf.sell_post_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_post_aed_cents", v)}
          />
        )
      case "ig_reel_cost":
        return (
          <InlineEditCell
            value={inf.cost_reel_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_reel_aed_cents", v)}
          />
        )
      case "ig_reel_sell":
        return (
          <InlineEditCell
            value={inf.sell_reel_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_reel_aed_cents", v)}
          />
        )
      case "ig_story_cost":
        return (
          <InlineEditCell
            value={inf.cost_story_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_story_aed_cents", v)}
          />
        )
      case "video_cost":
        return (
          <InlineEditCell
            value={inf.cost_video_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_video_aed_cents", v)}
          />
        )
      case "video_sell":
        return (
          <InlineEditCell
            value={inf.sell_video_aed_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_video_aed_cents", v)}
          />
        )
      case "margin": {
        const margin = computeMarginPercent(
          inf.cost_post_aed_cents,
          inf.sell_post_aed_cents
        )
        if (margin === null)
          return <span className="text-muted-foreground">–</span>
        /* Colour is the state of the margin, from the console's tones rather than a sixth
           set of hand-picked palette steps, and it never carries the meaning alone: the
           word is there for anyone who cannot separate the two greens and for anyone
           reading this printed. */
        const tone =
          margin >= 30
            ? { ink: "text-[var(--tone-good-ink)]", word: "healthy" }
            : margin >= 15
              ? { ink: "text-[var(--tone-warn-ink)]", word: "thin" }
              : { ink: "text-[var(--tone-bad-ink)]", word: "poor" }
        return (
          <span className={cn("font-medium tabular-nums", tone.ink)}>
            {margin.toFixed(1)}%
            <span className="ml-1 text-[11px] font-normal">{tone.word}</span>
          </span>
        )
      }
      case "status": {
        const opt = STATUS_OPTIONS.find((s) => s.value === inf.status)
        const ink: Record<string, string> = {
          active: "text-[var(--tone-good-ink)]",
          inactive: "text-muted-foreground",
          blacklisted: "text-[var(--tone-bad-ink)]",
          pending: "text-[var(--tone-warn-ink)]",
        }
        return (
          <span className={cn("text-sm font-medium", ink[inf.status] ?? "")}>
            {opt?.label ?? inf.status}
          </span>
        )
      }
      case "verified":
        return inf.is_verified ? (
          <BadgeCheck className="size-4 text-blue-500" />
        ) : (
          <span className="text-muted-foreground">–</span>
        )
      case "added":
        return (
          <span className="text-xs text-muted-foreground">
            {inf.created_at
              ? new Date(inf.created_at).toLocaleDateString("en-GB")
              : "–"}
          </span>
        )
      case "last_refresh":
        return (
          <span className="text-xs text-muted-foreground">
            {inf.last_analytics_refresh
              ? new Date(inf.last_analytics_refresh).toLocaleDateString("en-GB")
              : "Never"}
          </span>
        )
      case "analytics_status": {
        const liveStatus = analyticsStatusMap?.[inf.id]
        const cellStatus = liveStatus || {
          status: (inf as any).analytics_status || "pending",
          progress: (inf as any).analytics_progress || 0,
          progressMessage: (inf as any).analytics_progress_message,
          error: (inf as any).analytics_error,
          completedAt: (inf as any).analytics_completed_at,
        }
        const justCompleted = completedSinceMount?.includes(inf.id) ?? false
        return (
          <AnalyticsStatusCell
            status={cellStatus}
            justCompleted={justCompleted}
            onRetry={
              cellStatus.status === "failed" || cellStatus.status === "pending"
                ? () => onTriggerAnalytics?.(inf.id)
                : undefined
            }
          />
        )
      }
      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(inf)}>
                <Eye className="size-4" />
                Open their analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditDetails(inf)}>
                <Pencil className="size-4" />
                Edit their record
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--tone-bad-ink)] focus:text-[var(--tone-bad-ink)]"
                onClick={() => onDelete?.(inf.id)}
              >
                <Trash2 className="size-4" />
                Remove from the database
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-ds-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-9 px-3 text-ds-overline text-muted-foreground uppercase",
                    NUMERIC.includes(col.key) && "text-right",
                    col.sortable && "cursor-pointer select-none",
                  )}
                  onClick={() => {
                    if (col.sortable && col.sortKey) {
                      onSort(col.sortKey)
                    }
                  }}
                >
                  {col.key === "select" ? (
                    <Checkbox
                      checked={allSelected}
                      {...(someSelected ? { "data-state": "indeterminate" as const } : {})}
                      onCheckedChange={toggleAll}
                    />
                  ) : (
                    <div className={cn(
                      "flex items-center gap-1",
                      NUMERIC.includes(col.key) && "justify-end",
                    )}>
                      {col.label}
                      {renderSortIcon(col)}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="px-3 py-ds-2">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : influencers.map((inf) => (
                  <TableRow
                    key={inf.id}
                    data-state={selectedIds.has(inf.id) ? "selected" : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "px-3 py-ds-2 align-middle",
                          NUMERIC.includes(col.key) && "text-right",
                        )}
                      >
                        {renderCell(inf, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            {!loading && influencers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No creator here matches what you asked for.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-ds-2">
          <p className="text-ds-caption text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + pageSize, totalCount)} of{" "}
            {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-ds-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-ds-caption text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
