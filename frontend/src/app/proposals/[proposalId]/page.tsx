"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  brandProposalViewApi,
  BrandProposalView,
  BrandInfluencer,
} from "@/services/adminProposalMasterApi"
import { toast } from "sonner"
import { useNotifications } from "@/contexts/NotificationContext"

import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LayoutGrid,
  List,
  Users,
  X,
  Calendar,
  Target,
  UserCheck,
  Sparkles,
  MessageSquare,
} from "lucide-react"

// Motion
import { motion, AnimatePresence } from "motion/react"
import NumberFlow from "@number-flow/react"

// dnd-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"

import { FlippableInfluencerCard } from "@/components/proposals/FlippableInfluencerCard"
import { ProposalActionBar } from "@/components/proposals/ProposalActionBar"
import { RequestMoreDialog } from "@/components/proposals/RequestMoreDialog"
import { SelectedCreatorsPanel } from "@/components/proposals/SelectedCreatorsPanel"
import { AISnapshotPanel } from "@/components/proposals/AISnapshotPanel"
import { formatCount, formatCurrency, getStockImage, DEFAULT_AVATAR } from "@/components/proposals/proposal-utils"
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysRemaining(deadline?: string): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const PRICE_KEYS = [
  "post", "reel", "story", "carousel", "video", "bundle", "monthly",
] as const

// ---------------------------------------------------------------------------
// Draggable card wrapper for the grid
// ---------------------------------------------------------------------------
function DraggableGridCard({
  id,
  children,
  disabled,
}: {
  id: string
  children: React.ReactNode
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={disabled ? "" : "cursor-grab active:cursor-grabbing"}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function BrandProposalViewPage() {
  const params = useParams<{ proposalId: string }>()
  const proposalId = params.proposalId
  const router = useRouter()
  const { markReadByReference } = useNotifications()

  // Data
  const [data, setData] = useState<BrandProposalView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // Deliverable selections per influencer: { infId: ["post", "reel"] }
  const [deliverableSelections, setDeliverableSelections] = useState<Record<string, string[]>>({})

  // View / filter
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("followers_desc")

  // Flip state — only one card flipped at a time
  const [flippedId, setFlippedId] = useState<string | null>(null)

  // DND
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Mobile sidebar sheet
  const [mobileSelectionOpen, setMobileSelectionOpen] = useState(false)

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
      markReadByReference("proposal", proposalId)
      const preSelected = new Set<string>()
      const preDeliverables: Record<string, string[]> = {}
      result.influencers.forEach((inf) => {
        if (inf.selected_by_user) preSelected.add(inf.id)
        if (inf.selected_deliverables && inf.selected_deliverables.length > 0) {
          preDeliverables[inf.id] = inf.selected_deliverables
        }
      })
      setSelectedIds(preSelected)
      setDeliverableSelections(preDeliverables)
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
  const sortedInfluencers = useMemo(() => {
    if (!data) return [] as BrandInfluencer[]
    let list = [...data.influencers]

    switch (sortBy) {
      case "followers_desc":
        list.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0))
        break
      case "engagement_desc":
        list.sort((a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0))
        break
      case "price_desc": {
        const getRepPrice = (inf: BrandInfluencer): number => {
          const p = inf.sell_pricing ?? {}
          for (const key of PRICE_KEYS) {
            const v = p[key]
            if (v !== null && v !== undefined) return v
          }
          return 0
        }
        list.sort((a, b) => getRepPrice(b) - getRepPrice(a))
        break
      }
    }

    return list
  }, [data, sortBy])

  const showPricing =
    data?.proposal.visible_fields?.show_sell_pricing !== false

  // Selected-only metrics
  const selectedReach = useMemo(() => {
    if (!data) return 0
    return data.influencers
      .filter((inf) => selectedIds.has(inf.id))
      .reduce((s, inf) => s + (inf.followers_count ?? 0), 0)
  }, [data, selectedIds])

  const selectedAvgEngagement = useMemo(() => {
    if (!data) return 0
    const selected = data.influencers.filter((inf) => selectedIds.has(inf.id))
    if (selected.length === 0) return 0
    const sum = selected.reduce((s, inf) => s + (inf.engagement_rate ?? 0), 0)
    return sum / selected.length
  }, [data, selectedIds])

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
  // DND
  // -------------------------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    if (!over) return

    const draggedId = active.id as string

    // Dropped on sidebar → select
    if (over.id === "selection-sidebar" && !selectedIds.has(draggedId)) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.add(draggedId)
        return next
      })
      setSelectionDirty(true)
    }
  }

  const activeDragInfluencer = activeDragId
    ? data?.influencers.find((inf) => inf.id === activeDragId)
    : null

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const [savingSelection, setSavingSelection] = useState(false)
  const [selectionDirty, setSelectionDirty] = useState(false)

  const isTerminal =
    data?.proposal.status === "approved" ||
    data?.proposal.status === "rejected"

  const toggleInfluencer = useCallback((id: string) => {
    if (isTerminal) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectionDirty(true)
  }, [isTerminal])

  const toggleDeliverable = useCallback((influencerId: string, deliverable: string) => {
    if (isTerminal) return
    setDeliverableSelections((prev) => {
      const current = prev[influencerId] || []
      const next = current.includes(deliverable)
        ? current.filter((d) => d !== deliverable)
        : [...current, deliverable]
      return { ...prev, [influencerId]: next }
    })
    setSelectionDirty(true)
  }, [isTerminal])

  const deselectInfluencer = useCallback((id: string) => {
    if (isTerminal) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setSelectionDirty(true)
  }, [isTerminal])

  const handleSaveSelection = async () => {
    setSavingSelection(true)
    try {
      const delSelections = Object.entries(deliverableSelections)
        .filter(([id]) => selectedIds.has(id))
        .map(([influencer_id, deliverables]) => ({ influencer_id, deliverables }))

      await brandProposalViewApi.updateInfluencerSelection(proposalId, {
        selected_influencer_ids: Array.from(selectedIds),
        deliverable_selections: delSelections.length > 0 ? delSelections : undefined,
      })
      toast.success("Draft saved")
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
      const result = await brandProposalViewApi.approveProposal(proposalId, {
        selected_influencer_ids: Array.from(selectedIds),
      })
      toast.success("Proposal approved! Redirecting to campaign...")
      setApproveDialogOpen(false)
      // Redirect to the newly created campaign
      if (result.campaign_id) {
        setTimeout(() => router.push(`/campaigns/${result.campaign_id}`), 1500)
      } else {
        loadData()
      }
    } catch {
      toast.error("Failed to approve proposal")
    } finally {
      setApproving(false)
    }
  }

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
  // AI Snapshot
  // -------------------------------------------------------------------------
  const fetchAISnapshot = useCallback(async (ids: string[]) => {
    return await brandProposalViewApi.getAISnapshot(proposalId, {
      selected_influencer_ids: ids,
    })
  }, [proposalId])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <BrandUserInterface>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading proposal...</p>
            </div>
          </div>
      </BrandUserInterface>
    )
  }

  if (error || !data) {
    return (
      <BrandUserInterface>
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
      </BrandUserInterface>
    )
  }

  const days = daysRemaining(data.proposal.deadline_at)
  const { proposal, summary } = data

  return (
    <BrandUserInterface>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
        <div className="flex flex-1 flex-col">
          {/* ============================================================= */}
          {/* Cover / Hero                                                   */}
          {/* ============================================================= */}
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4 relative rounded-2xl overflow-hidden group/hero">
            {/* Background image — taller for impact */}
            <img
              src={getStockImage(proposal.id)}
              alt=""
              className="h-40 md:h-48 w-full object-cover transition-transform duration-700 group-hover/hero:scale-[1.02]"
            />
            {/* Cinematic dark gradient — stronger at bottom for text, subtle vignette at top */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            {/* Subtle radial highlight for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.06),transparent_60%)]" />

            {/* Content overlaid at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 inset-x-0 p-5 md:p-6"
            >
              {/* Campaign name as breadcrumb */}
              <p className="text-xs uppercase tracking-widest text-white/50 font-medium mb-2">
                {proposal.campaign_name}
              </p>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-[1.1]">
                {proposal.title}
              </h1>

              {/* Badges row */}
              <div className="flex items-center gap-2.5 mt-4">
                <ProposalStatusBadge status={proposal.status} />
                {days !== null && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {days > 0 ? `${days} days remaining` : "Past deadline"}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {summary.total_influencers} creators
                </Badge>

                {/* Agency notes popover */}
                {proposal.proposal_notes && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="relative bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-1.5 transition-colors">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold">Agency Note</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {proposal.proposal_notes}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {proposal.description && (
                <p className="text-sm text-white/60 line-clamp-2 mt-3 max-w-2xl">
                  {proposal.description}
                </p>
              )}
            </motion.div>
          </div>

          {/* ============================================================= */}
          {/* Description + Notes + KPIs                                     */}
          {/* ============================================================= */}
          <div className="px-4 md:px-6 lg:px-8">
            {/* KPI strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40 my-6"
            >
              {[
                {
                  icon: Target,
                  label: "Available",
                  value: summary.total_influencers,
                  isNumber: true,
                  sub: "creators curated for you",
                },
                {
                  icon: UserCheck,
                  label: "Selected",
                  value: selectedIds.size,
                  isNumber: true,
                  sub: selectedIds.size === 0
                    ? "none yet"
                    : `of ${summary.total_influencers} creators`,
                  subClass: selectedIds.size > 0 ? "text-emerald-600 dark:text-emerald-400" : undefined,
                },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-background px-5 py-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                  </div>
                  {kpi.isNumber ? (
                    <NumberFlow
                      value={kpi.value as number}
                      className="text-2xl font-bold tabular-nums block"
                      transformTiming={{ duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
                  )}
                  <p className={`text-[11px] ${kpi.subClass ?? "text-muted-foreground"}`}>{kpi.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ============================================================= */}
          {/* TWO-COLUMN LAYOUT                                              */}
          {/* ============================================================= */}
          <div className="flex flex-1 px-4 md:px-6 lg:px-8 lg:gap-6">
            {/* =========================================================== */}
            {/* LEFT COLUMN — Available Creators                             */}
            {/* =========================================================== */}
            <div className="flex-1 flex flex-col pb-36 min-w-0">
              {/* Sort Bar */}
              <div className="sticky top-[var(--header-height)] z-40 py-3 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                      {sortedInfluencers.length} Creators
                    </h2>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[170px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers_desc">Followers (high-low)</SelectItem>
                        <SelectItem value="engagement_desc">Engagement (high-low)</SelectItem>
                        <SelectItem value="price_desc">Price (high-low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="bg-muted rounded-lg p-0.5">
                      <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(v) => {
                          if (v === "grid" || v === "list") setViewMode(v)
                        }}
                      >
                        <ToggleGroupItem value="grid" aria-label="Grid view" className="h-7 w-7">
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view" className="h-7 w-7">
                          <List className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                </div>
              </div>

              {/* Influencer Grid / List */}
              <div>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedInfluencers.map((inf, i) => (
                      <motion.div
                        key={inf.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: Math.min(i * 0.05, 0.3),
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <DraggableGridCard id={inf.id} disabled={isTerminal}>
                          <FlippableInfluencerCard
                            influencer={inf}
                            isSelected={selectedIds.has(inf.id)}
                            onToggle={toggleInfluencer}
                            isFlipped={flippedId === inf.id}
                            onFlip={(id) => setFlippedId(id)}
                            onUnflip={() => setFlippedId(null)}
                            showPricing={showPricing}
                            selectedDeliverables={deliverableSelections[inf.id] || []}
                            onToggleDeliverable={toggleDeliverable}
                          />
                        </DraggableGridCard>
                      </motion.div>
                    ))}

                    {sortedInfluencers.length === 0 && (
                      <div className="col-span-full text-center py-16">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No influencers in this proposal.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-border/40 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead>Influencer</TableHead>
                          <TableHead className="text-right">Followers</TableHead>
                          <TableHead className="hidden md:table-cell">Categories</TableHead>
                          <TableHead className="text-right">Engagement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedInfluencers.map((inf) => (
                          <TableRow
                            key={inf.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedIds.has(inf.id) ? "bg-primary/5" : ""
                            }`}
                            onClick={() => toggleInfluencer(inf.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(inf.id)}
                                onCheckedChange={() => toggleInfluencer(inf.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={inf.profile_image_url || DEFAULT_AVATAR} />
                                  <AvatarFallback>
                                    {(inf.username ?? "?").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">@{inf.username ?? "unknown"}</p>
                                  <p className="text-sm text-muted-foreground truncate">{inf.full_name ?? ""}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCount(inf.followers_count)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex gap-1 max-w-[200px] overflow-hidden">
                                {inf.categories.slice(0, 2).map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs whitespace-nowrap">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {inf.engagement_rate ? `${inf.engagement_rate.toFixed(1)}%` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}

                        {sortedInfluencers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No influencers in this proposal.</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

            </div>

            {/* =========================================================== */}
            {/* RIGHT COLUMN — Selected + AI Snapshot                        */}
            {/* =========================================================== */}
            {!isTerminal && (
              <div className="w-[380px] shrink-0 hidden lg:flex flex-col sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height)-4rem)] border rounded-xl border-border/40 bg-muted/20 overflow-hidden">
                {/* AI Snapshot */}
                <AISnapshotPanel
                  proposalId={proposalId}
                  selectedIds={selectedIds}
                  onFetchSnapshot={fetchAISnapshot}
                />

                {/* Selected Creators (scrollable) */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <SelectedCreatorsPanel
                    influencers={data.influencers}
                    selectedIds={selectedIds}
                    onDeselect={deselectInfluencer}
                    showPricing={showPricing}
                    estimatedTotal={estimatedTotal}
                    deliverableSelections={deliverableSelections}
                    selectedReach={selectedReach}
                    selectedAvgEngagement={selectedAvgEngagement}
                  />
                </div>
              </div>
            )}

            {/* Mobile floating button + Sheet for selection sidebar */}
            {!isTerminal && (
              <Sheet open={mobileSelectionOpen} onOpenChange={setMobileSelectionOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground shadow-lg rounded-full px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors">
                    <UserCheck className="h-4 w-4" />
                    View Selection{selectedIds.size > 0 && ` (${selectedIds.size})`}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col">
                  <SheetTitle className="sr-only">Selected Creators</SheetTitle>
                  <AISnapshotPanel
                    proposalId={proposalId}
                    selectedIds={selectedIds}
                    onFetchSnapshot={fetchAISnapshot}
                  />
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <SelectedCreatorsPanel
                      influencers={data.influencers}
                      selectedIds={selectedIds}
                      onDeselect={deselectInfluencer}
                      showPricing={showPricing}
                      estimatedTotal={estimatedTotal}
                      deliverableSelections={deliverableSelections}
                      selectedReach={selectedReach}
                      selectedAvgEngagement={selectedAvgEngagement}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragInfluencer && (
              <div className="bg-card rounded-xl shadow-2xl border p-3 flex items-center gap-3 w-64 opacity-90">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeDragInfluencer.profile_image_url || DEFAULT_AVATAR} />
                  <AvatarFallback>
                    {(activeDragInfluencer.username ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">@{activeDragInfluencer.username}</p>
                  <p className="text-xs text-muted-foreground">{formatCount(activeDragInfluencer.followers_count)} followers</p>
                </div>
              </div>
            )}
          </DragOverlay>

          {/* Action Bar */}
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
        </DndContext>

        {/* Dialogs */}
        <RequestMoreDialog
          open={requestMoreOpen}
          onOpenChange={setRequestMoreOpen}
          onSubmit={handleRequestMore}
        />

        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
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

        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Proposal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this proposal? This action will notify the agency team.
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
    </BrandUserInterface>
  )
}
