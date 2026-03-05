"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  brandProposalViewApi,
  BrandProposalView,
  BrandInfluencer,
} from "@/services/adminProposalMasterApi"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  LayoutGrid,
  List,
  Search,
  Users,
  TrendingUp,
  Eye,
  CheckCircle,
} from "lucide-react"

import { InfluencerSelectionCard } from "@/components/proposals/InfluencerSelectionCard"
import { ProposalActionBar } from "@/components/proposals/ProposalActionBar"
import { RequestMoreDialog } from "@/components/proposals/RequestMoreDialog"
import { InfluencerDetailSheet } from "@/components/proposals/InfluencerDetailSheet"
import { formatCount, formatCurrency } from "@/components/proposals/proposal-utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysRemaining(deadline?: string): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getStatusColor(status: string) {
  switch (status) {
    case "sent":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "in_review":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "more_requested":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function BrandProposalViewPage() {
  const params = useParams<{ proposalId: string }>()
  const proposalId = params.proposalId

  // Data
  const [data, setData] = useState<BrandProposalView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // View / filter
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("followers_desc")

  // Detail sheet
  const [detailInfluencer, setDetailInfluencer] =
    useState<BrandInfluencer | null>(null)

  // Dialogs
  const [requestMoreOpen, setRequestMoreOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting, setRejecting] = useState(false)

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await brandProposalViewApi.getDetail(proposalId)
      setData(result)
      // Pre-select already-selected influencers
      const preSelected = new Set<string>()
      result.influencers.forEach((inf) => {
        if (inf.selected_by_user) preSelected.add(inf.id)
      })
      setSelectedIds(preSelected)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (proposalId) loadData()
  }, [proposalId])

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const allCategories = useMemo(() => {
    if (!data) return [] as string[]
    const cats = new Set<string>()
    data.influencers.forEach((inf) =>
      inf.categories.forEach((c) => cats.add(c))
    )
    return Array.from(cats).sort()
  }, [data])

  const filteredInfluencers = useMemo(() => {
    if (!data) return [] as BrandInfluencer[]
    let list = [...data.influencers]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (inf) =>
          inf.username?.toLowerCase().includes(q) ||
          inf.full_name?.toLowerCase().includes(q)
      )
    }

    // Category
    if (categoryFilter !== "all") {
      list = list.filter((inf) => inf.categories.includes(categoryFilter))
    }

    // Sort
    switch (sortBy) {
      case "followers_desc":
        list.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0))
        break
      case "engagement_desc":
        list.sort(
          (a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0)
        )
        break
      case "price_desc": {
        // M9: Use representative price (first non-null in priority order)
        const getRepPrice = (inf: BrandInfluencer): number => {
          const p = inf.sell_pricing ?? {}
          for (const key of PRICE_KEYS) {
            const v = p[key]
            if (v !== null && v !== undefined) return v
          }
          return 0
        }
        list.sort((a, b) => getRepPrice(b) - getRepPrice(a))
      }
        break
    }

    return list
  }, [data, searchQuery, categoryFilter, sortBy])

  // Show pricing only if visible_fields allows it (default true)
  const showPricing =
    data?.proposal.visible_fields?.show_sell_pricing !== false

  const totalReach = useMemo(
    () =>
      data?.influencers.reduce(
        (s, inf) => s + (inf.followers_count ?? 0),
        0
      ) ?? 0,
    [data]
  )

  const avgEngagement = useMemo(() => {
    if (!data || data.influencers.length === 0) return 0
    const sum = data.influencers.reduce(
      (s, inf) => s + (inf.engagement_rate ?? 0),
      0
    )
    return sum / data.influencers.length
  }, [data])

  // M8: Use representative price (first non-null in priority order), matching backend
  const PRICE_KEYS = ["post", "reel", "story", "carousel", "video", "bundle", "monthly"] as const
  const estimatedTotal = useMemo(() => {
    if (!showPricing || !data) return 0
    return data.influencers
      .filter((inf) => selectedIds.has(inf.id))
      .reduce((total, inf) => {
        const pricing = inf.sell_pricing ?? {}
        for (const key of PRICE_KEYS) {
          const v = pricing[key]
          if (v !== null && v !== undefined) return total + v
        }
        return total
      }, 0)
  }, [data, selectedIds, showPricing])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const [savingSelection, setSavingSelection] = useState(false)
  const [selectionDirty, setSelectionDirty] = useState(false)

  // H4: Read-only for terminal statuses
  const isTerminal = data?.proposal.status === "approved" || data?.proposal.status === "rejected"

  const toggleInfluencer = (id: string) => {
    if (isTerminal) return // H4: No changes on approved/rejected
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectionDirty(true)
  }

  const handleSaveSelection = async () => {
    setSavingSelection(true)
    try {
      await brandProposalViewApi.updateInfluencerSelection(proposalId, {
        selected_influencer_ids: Array.from(selectedIds),
      })
      toast.success("Selection saved")
      setSelectionDirty(false)
    } catch {
      toast.error("Failed to save selection")
    } finally {
      setSavingSelection(false)
    }
  }

  const handleRequestMore = async (notes: string) => {
    try {
      await brandProposalViewApi.requestMore(proposalId, { notes })
      toast.success("Request sent to the agency team")
      setRequestMoreOpen(false)
      loadData()
    } catch {
      toast.error("Failed to submit request")
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      await brandProposalViewApi.approveProposal(proposalId, {
        selected_influencer_ids: Array.from(selectedIds),
      })
      toast.success("Proposal approved successfully!")
      setApproveDialogOpen(false)
      loadData()
    } catch {
      toast.error("Failed to approve proposal")
    } finally {
      setApproving(false)
    }
  }

  // H5: Reject handler
  const handleReject = async () => {
    setRejecting(true)
    try {
      await brandProposalViewApi.rejectProposal(proposalId, {
        reason: rejectReason || undefined,
      })
      toast.success("Proposal rejected")
      setRejectDialogOpen(false)
      setRejectReason("")
      loadData()
    } catch {
      toast.error("Failed to reject proposal")
    } finally {
      setRejecting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const sidebarStyle = {
    "--sidebar-width": "calc(var(--spacing) * 66)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  if (loading) {
    return (
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading proposal...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !data) {
    return (
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">
                {error || "Proposal not found"}
              </p>
              <Button variant="outline" onClick={loadData}>
                Try Again
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const days = daysRemaining(data.proposal.deadline_at)
  const { proposal, summary } = data

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 pb-28">
            {/* ----------------------------------------------------------- */}
            {/* Header Banner                                               */}
            {/* ----------------------------------------------------------- */}
            <Card className="overflow-hidden">
              {proposal.cover_image_url && (
                <div className="h-40 w-full bg-muted">
                  <img
                    src={proposal.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">
                      {proposal.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {proposal.campaign_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status.replace(/_/g, " ")}
                    </Badge>
                    {days !== null && (
                      <Badge variant="outline">
                        {days > 0 ? `${days} days remaining` : "Deadline passed"}
                      </Badge>
                    )}
                  </div>
                </div>
                {proposal.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {proposal.description}
                  </p>
                )}
                {proposal.proposal_notes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    {proposal.proposal_notes}
                  </p>
                )}
              </CardHeader>
            </Card>

            {/* ----------------------------------------------------------- */}
            {/* KPI Summary Row                                             */}
            {/* ----------------------------------------------------------- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Influencers</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {summary.total_influencers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    suggested for you
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {selectedIds.size}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {summary.total_influencers - selectedIds.size} remaining
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Reach</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {formatCount(totalReach)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    combined followers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg Engagement</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {avgEngagement.toFixed(1)}%
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-xs ${
                      avgEngagement >= 3
                        ? "border-green-500 text-green-700 dark:text-green-400"
                        : ""
                    }`}
                  >
                    {avgEngagement >= 3 ? "Above average" : "Standard"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Filter / Sort Bar                                           */}
            {/* ----------------------------------------------------------- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search influencers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers_desc">
                      Followers (high-low)
                    </SelectItem>
                    <SelectItem value="engagement_desc">
                      Engagement (high-low)
                    </SelectItem>
                    <SelectItem value="price_desc">
                      Price (high-low)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => {
                  if (v === "grid" || v === "list") setViewMode(v)
                }}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Influencer Grid                                             */}
            {/* ----------------------------------------------------------- */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInfluencers.map((inf) => (
                  <InfluencerSelectionCard
                    key={inf.id}
                    influencer={inf}
                    isSelected={selectedIds.has(inf.id)}
                    onToggle={toggleInfluencer}
                    onViewDetails={setDetailInfluencer}
                    showPricing={showPricing}
                  />
                ))}

                {filteredInfluencers.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No influencers match your filters.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* --------------------------------------------------------- */
              /* Influencer List View                                       */
              /* --------------------------------------------------------- */
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredInfluencers.map((inf) => (
                      <div
                        key={inf.id}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedIds.has(inf.id)
                            ? "bg-primary/5"
                            : ""
                        }`}
                        onClick={() => toggleInfluencer(inf.id)}
                      >
                        <Checkbox
                          checked={selectedIds.has(inf.id)}
                          onCheckedChange={() => toggleInfluencer(inf.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={inf.profile_image_url ?? undefined} />
                          <AvatarFallback>
                            {(inf.username ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            @{inf.username ?? "unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {inf.full_name ?? ""}
                          </p>
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCount(inf.followers_count)}
                        </span>
                        <div className="hidden md:flex gap-1 max-w-[200px] overflow-hidden">
                          {inf.categories.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat}
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {inf.engagement_rate
                            ? `${inf.engagement_rate.toFixed(1)}%`
                            : "-"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailInfluencer(inf)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {filteredInfluencers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No influencers match your filters.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ----------------------------------------------------------- */}
            {/* Category & Tier Distribution                                */}
            {/* ----------------------------------------------------------- */}
            {summary.category_breakdown.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Category Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.category_breakdown.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3"
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.name}</span>
                          <span className="text-sm font-medium">
                            {item.count}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Tier Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.tier_breakdown.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3"
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.name}</span>
                          <span className="text-sm font-medium">
                            {item.count}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Sticky Bottom Action Bar                                      */}
          {/* ------------------------------------------------------------- */}
          <ProposalActionBar
            selectedCount={selectedIds.size}
            totalCount={summary.total_influencers}
            estimatedTotal={estimatedTotal}
            showPricing={showPricing}
            onRequestMore={() => setRequestMoreOpen(true)}
            onApprove={() => setApproveDialogOpen(true)}
            onReject={() => setRejectDialogOpen(true)}
            onSaveSelection={handleSaveSelection}
            savingSelection={savingSelection}
            selectionDirty={selectionDirty}
            status={proposal.status}
          />
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Detail Sheet                                                    */}
        {/* --------------------------------------------------------------- */}
        <InfluencerDetailSheet
          influencer={detailInfluencer}
          open={!!detailInfluencer}
          onOpenChange={(open) => {
            if (!open) setDetailInfluencer(null)
          }}
          isSelected={
            detailInfluencer ? selectedIds.has(detailInfluencer.id) : false
          }
          onToggleSelection={toggleInfluencer}
          showPricing={showPricing}
        />

        {/* --------------------------------------------------------------- */}
        {/* Request More Dialog                                             */}
        {/* --------------------------------------------------------------- */}
        <RequestMoreDialog
          open={requestMoreOpen}
          onOpenChange={setRequestMoreOpen}
          onSubmit={handleRequestMore}
        />

        {/* --------------------------------------------------------------- */}
        {/* Approve Alert Dialog                                            */}
        {/* --------------------------------------------------------------- */}
        <AlertDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Proposal</AlertDialogTitle>
              <AlertDialogDescription>
                You are approving this proposal with{" "}
                <strong>{selectedIds.size}</strong> influencer
                {selectedIds.size !== 1 ? "s" : ""} selected
                {showPricing && estimatedTotal > 0 && (
                  <> for an estimated total of {formatCurrency(estimatedTotal)}</>
                )}
                . This action will notify the agency team.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove} disabled={approving}>
                {approving ? "Approving..." : "Confirm Approval"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* H5: Reject Alert Dialog */}
        <AlertDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Proposal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this proposal? This action will
                notify the agency team.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={rejecting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
