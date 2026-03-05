"use client"

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
import { AnalyticsStatusCell } from "./AnalyticsStatusCell"
import type { AnalyticsStatusMap } from "@/hooks/useAnalyticsStatusPoller"
import {
  COLUMN_DEFINITIONS,
  TIER_OPTIONS,
  STATUS_OPTIONS,
  formatCents,
  formatCount,
  getEngagementColor,
  computeMarginPercent,
  type MasterInfluencer,
  type ColumnKey,
} from "@/types/influencerDatabase"
import {
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  DollarSign,
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

function getAvatarGradient(name: string): string {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
    "from-amber-500 to-orange-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
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
  const columns = COLUMN_DEFINITIONS.filter((col) =>
    visibleColumns.includes(col.key)
  )

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
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${getAvatarGradient(inf.username)}`}
            >
              {inf.username.charAt(0).toUpperCase()}
            </div>
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
          <span className="font-medium">
            {formatCount(inf.followers_count)}
          </span>
        )
      case "engagement":
        return inf.engagement_rate ? (
          <span className={`font-medium ${getEngagementColor(inf.engagement_rate)}`}>
            {inf.engagement_rate.toFixed(2)}%
          </span>
        ) : (
          <span className="text-muted-foreground">--</span>
        )
      case "categories":
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(inf.categories || []).slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                {cat}
              </Badge>
            ))}
            {(inf.categories || []).length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{inf.categories.length - 2}
              </Badge>
            )}
          </div>
        )
      case "tier": {
        const tier = inf.tier
        if (!tier) return <span className="text-muted-foreground">--</span>
        const opt = TIER_OPTIONS.find((t) => t.value === tier)
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${opt?.color ?? ""}`}>
            {opt?.label ?? tier}
          </span>
        )
      }
      case "ig_post_cost":
        return (
          <InlineEditCell
            value={inf.cost_post_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_post_usd_cents", v)}
          />
        )
      case "ig_post_sell":
        return (
          <InlineEditCell
            value={inf.sell_post_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_post_usd_cents", v)}
          />
        )
      case "ig_reel_cost":
        return (
          <InlineEditCell
            value={inf.cost_reel_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_reel_usd_cents", v)}
          />
        )
      case "ig_reel_sell":
        return (
          <InlineEditCell
            value={inf.sell_reel_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_reel_usd_cents", v)}
          />
        )
      case "ig_story_cost":
        return (
          <InlineEditCell
            value={inf.cost_story_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_story_usd_cents", v)}
          />
        )
      case "video_cost":
        return (
          <InlineEditCell
            value={inf.cost_video_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "cost_video_usd_cents", v)}
          />
        )
      case "video_sell":
        return (
          <InlineEditCell
            value={inf.sell_video_usd_cents}
            onSave={(v) => onInlineEdit(inf.id, "sell_video_usd_cents", v)}
          />
        )
      case "margin": {
        const margin = computeMarginPercent(
          inf.cost_post_usd_cents,
          inf.sell_post_usd_cents
        )
        if (margin === null)
          return <span className="text-muted-foreground">--</span>
        const color =
          margin >= 30
            ? "text-green-600"
            : margin >= 15
              ? "text-yellow-600"
              : "text-red-600"
        return <span className={`font-medium ${color}`}>{margin.toFixed(1)}%</span>
      }
      case "status": {
        const opt = STATUS_OPTIONS.find((s) => s.value === inf.status)
        return (
          <span className={`text-sm font-medium ${opt?.color ?? ""}`}>
            {opt?.label ?? inf.status}
          </span>
        )
      }
      case "verified":
        return inf.is_verified ? (
          <BadgeCheck className="size-4 text-blue-500" />
        ) : (
          <span className="text-muted-foreground">--</span>
        )
      case "added":
        return (
          <span className="text-xs text-muted-foreground">
            {inf.created_at
              ? new Date(inf.created_at).toLocaleDateString()
              : "--"}
          </span>
        )
      case "last_refresh":
        return (
          <span className="text-xs text-muted-foreground">
            {inf.last_analytics_refresh
              ? new Date(inf.last_analytics_refresh).toLocaleDateString()
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
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewDetails(inf)}>
                <DollarSign className="size-4" />
                Edit Pricing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete?.(inf.id)}
              >
                <Trash2 className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={
                    col.sortable ? "cursor-pointer select-none" : undefined
                  }
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
                    <div className="flex items-center gap-1">
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
                      <TableCell key={col.key}>
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
                      <TableCell key={col.key}>
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
                  No influencers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + pageSize, totalCount)} of{" "}
            {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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
