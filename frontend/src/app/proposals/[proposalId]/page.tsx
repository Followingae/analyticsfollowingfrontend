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
import { AuthGuard } from "@/components/AuthGuard"

import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet"
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
  Download,
  FileSpreadsheet,
  FileText,
  Coins,
  Wallet,
  Users,
  X,
  Calendar,
  Target,
  UserCheck,
  Sparkles,
  MessageSquare,
  Construction,
} from "lucide-react"

// Motion
import { motion, AnimatePresence } from "motion/react"
import NumberFlow from "@number-flow/react"

// dnd-kit
import { cdnAvatar } from "@/lib/avatar"
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
import { TierAllowancePanel } from "@/components/proposals/TierAllowancePanel"
import { RetainerMonths, type RetainerMonth } from "@/components/proposals/RetainerMonths"
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
function BrandProposalViewPageContent() {
  const params = useParams<{ proposalId: string }>()
  const proposalId = params.proposalId
  const router = useRouter()

  const exportProposal = async (fmt: "xlsx" | "csv") => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals/${proposalId}/export?format=${fmt}`)
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const cd = res.headers.get("content-disposition") || ""
      const m = cd.match(/filename="?([^"]+)"?/)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = m?.[1] || `proposal_influencers.${fmt}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success(fmt === "xlsx" ? "Excel exported" : "CSV exported")
    } catch (e) {
      toast.error((e as Error).message || "Export failed")
    }
  }
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
  const [sortBy, setSortBy] = useState("newest_added")

  // Flip state — only one card flipped at a time
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [analyticsUsername, setAnalyticsUsername] = useState<string | null>(null)

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
      // Track that brand has viewed the current state — list page uses this to dim "new batch" badges.
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`proposal_last_viewed:${proposalId}`, new Date().toISOString())
      }
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
      case "newest_added":
        // Newest first, and it is the DEFAULT: what a brand wants on open is what we
        // added since they last looked, not the biggest account on the list.
        // priority_order breaks ties so a batch added in one go keeps its curated order.
        list.sort((a, b) => {
          const at = a.added_at ? Date.parse(a.added_at) : 0
          const bt = b.added_at ? Date.parse(b.added_at) : 0
          if (bt !== at) return bt - at
          return (a.priority_order ?? 0) - (b.priority_order ?? 0)
        })
        break
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

  /* Sold by tier: the client buys a count from each band and never sees a price. The bands
     and the caps come from the server, which enforces them too, so the screen and the rule
     cannot drift apart. */
  const selection = (data as any)?.selection
  const byTier = selection?.mode === "tiers"
  const bands: Record<string, any> = selection?.bands || {}
  const allowances: Record<string, number> = selection?.allowances || {}

  /** How many of each band are ticked right now, counted off the live selection rather
      than off what was last saved. */
  /* A retainer is picked a month at a time. `activeMonth` is the one being filled: it
     starts on whichever the server says is live, and the client can look at any month that
     has opened. */
  const months: RetainerMonth[] = selection?.periods || []
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const [confirmingMonth, setConfirmingMonth] = useState(false)

  useEffect(() => {
    if (!months.length) return
    setActiveMonth((prev) =>
      prev && months.some((m) => m.period === prev) ? prev : selection?.current_period ?? months[0].period,
    )
  }, [months, selection?.current_period])

  const month = months.find((m) => m.period === activeMonth) || null

  const pickedByTier = useMemo(() => {
    const out: Record<string, number> = {}
    if (!byTier || !data) return out
    for (const inf of data.influencers as any[]) {
      if (!selectedIds.has(inf.id)) continue
      // On a retainer a pick counts against the month it belongs to, so a creator taken
      // for September does not eat October's places.
      if (months.length && (inf.period ?? activeMonth) !== activeMonth) continue
      const t = inf.tier
      if (t) out[t] = (out[t] || 0) + 1
    }
    return out
  }, [byTier, data, selectedIds, months.length, activeMonth])

  const tierRows = useMemo(
    () =>
      Object.entries(allowances)
        .filter(([, want]) => Number(want) > 0)
        .map(([tier, want]) => ({
          tier,
          label: bands[tier]?.label || tier.charAt(0).toUpperCase() + tier.slice(1),
          allowed: Number(want),
          picked: pickedByTier[tier] || 0,
        })),
    [allowances, bands, pickedByTier],
  )
  const tierComplete =
    tierRows.length > 0 && tierRows.every((r) => r.picked >= r.allowed)

  /* One roster.
     The list used to be cut into "Batch 1", "Batch 2" and so on, which is our filing
     rather than their shortlist: a client looking at people to hire does not care which
     afternoon we added them, and the headers made the same page look like several. The
     newest are still first, so anything we added since they last looked is at the top. */

  // Every real value per metric, sorted, so a card can rank its creator against the rest
  // of the proposal. Zeros and nulls are excluded, not treated as lows — a creator whose
  // avg_likes never got backfilled has no likes VALUE, which is not the same as few likes,
  // and ranking them last would invent a judgement about them.
  const benchmarks = useMemo(() => {
    const values = (pick: (i: BrandInfluencer) => number | null | undefined) =>
      sortedInfluencers
        .map(pick)
        .filter((v): v is number => typeof v === "number" && v > 0)
        .sort((a, b) => a - b)
    return {
      followers: values((i) => i.followers_count),
      engagement: values((i) => i.engagement_rate),
      likes: values((i) => i.avg_likes),
      comments: values((i) => i.avg_comments),
    }
  }, [sortedInfluencers])

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
    // Must equal the sum of the per-creator line items the client actually sees in
    // SelectedCreatorsPanel (assigned_deliverables × quantity). The old version added
    // only the first available price key per creator, so the approve-dialog total could
    // differ from the rows in front of the approver.
    return data.influencers
      .filter((inf) => selectedIds.has(inf.id))
      .reduce((total, inf) => {
        const assigned = inf.assigned_deliverables || []
        const pricing = inf.sell_pricing ?? {}
        let creatorTotal = 0
        for (const d of assigned) {
          const price = pricing[d.type]
          if (price != null) creatorTotal += price * d.quantity
        }
        return total + creatorTotal
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

    // Dropped on sidebar → select. Same cap as the tick: two ways in, one rule.
    if (over.id === "selection-sidebar" && !selectedIds.has(draggedId)) {
      toggleInfluencer(draggedId)
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
    data?.proposal.status === "rejected" ||
    // A confirmed month is settled. Looking is fine, changing it is not.
    Boolean(month?.is_locked) ||
    Boolean(months.length && month && !month.is_open)

  const toggleInfluencer = useCallback((id: string) => {
    if (isTerminal) return

    /* On a tier deal the band is full or it is not. Stopping the tick here, with the
       reason, beats letting them build a selection of 27 and refusing it at the end. */
    if (byTier && !selectedIds.has(id)) {
      const inf: any = data?.influencers.find((x) => x.id === id)
      const tier = inf?.tier
      const allowed = Number(allowances[tier] ?? 0)
      if (tier && allowed > 0 && (pickedByTier[tier] || 0) >= allowed) {
        const label = bands[tier]?.label || tier
        toast.error(`All ${allowed} ${label} places are taken`, {
          description: "Remove one to swap in someone else. Your plan is on the right.",
        })
        return
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectionDirty(true)
  }, [isTerminal, byTier, selectedIds, data, allowances, pickedByTier, bands])

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

  /** `silent` is for the save that happens on the way to confirming a month: the client
   *  asked to confirm, not to save, and two toasts for one click reads as a stutter. */
  const handleSaveSelection = async ({ silent = false }: { silent?: boolean } = {}) => {
    setSavingSelection(true)
    try {
      const delSelections = Object.entries(deliverableSelections)
        .filter(([id]) => selectedIds.has(id))
        .map(([influencer_id, deliverables]) => ({ influencer_id, deliverables }))

      await brandProposalViewApi.updateInfluencerSelection(proposalId, {
        selected_influencer_ids: Array.from(selectedIds),
        period: activeMonth ?? undefined,
        deliverable_selections: delSelections.length > 0 ? delSelections : undefined,
      })
      if (!silent) toast.success("Draft saved")
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
    if (selectedIds.size === 0) {
      toast.error("Please select at least one influencer before approving")
      return
    }
    setApproving(true)
    try {
      // Approving takes no month: a retainer is confirmed month by month, and this path
      // is only reached on a one-off deal.
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

  /** Confirm one month, whole.
   *
   *  The selection is saved first. The server confirms what it has stored, not what is on
   *  the client's screen, so a month that looks full here and empty there would be refused
   *  with a message nobody could act on. */
  const handleConfirmMonth = async (period: string) => {
    setConfirmingMonth(true)
    try {
      await handleSaveSelection({ silent: true })

      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals/${proposalId}/confirm-month`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period }),
        },
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || "Could not confirm that month")
      toast.success(j?.message || "Month confirmed", {
        description: j?.data?.proposal_closed
          ? "That is every month of your retainer booked."
          : "We will be in touch about the creators, and the next month opens on time.",
      })
      await loadData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm that month")
    } finally {
      setConfirmingMonth(false)
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

  // The team is mid-edit. The API serves no creators at all in this state — this screen is
  // what there is, not a cover over data that was sent anyway.
  if (data.proposal?.work_in_progress) {
    return (
      <BrandUserInterface>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md space-y-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-500/10">
              <Construction className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">We&apos;re still working on this</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.proposal.work_in_progress_note
                  || "Our team is putting the finishing touches to this proposal. It'll be ready for you shortly — we'll let you know the moment it is."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.proposal.campaign_name || data.proposal.title}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={loadData}>Check again</Button>
              <Button variant="ghost" onClick={() => router.push("/proposals")}>All proposals</Button>
            </div>
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
              src={proposal.cover_image_url || getStockImage(proposal.id)}
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
            {/* What this deal includes.
                On a tier proposal the client is not shopping against a price, they are
                filling places: three macro and one micro, say. Without this the page asked
                them to pick from 27 creators with nothing telling them how many they were
                entitled to, and they could tick all of them. */}
            {months.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="my-6"
              >
                <RetainerMonths
                  months={months}
                  active={activeMonth}
                  onSelect={setActiveMonth}
                  liveTiers={tierRows}
                />
              </motion.div>
            )}

            {byTier && tierRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="my-6 rounded-xl border border-border/60 bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">What your plan includes</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {tierComplete
                        ? "Every place is filled. You can confirm below."
                        : "Choose this many from each group. Prices are already agreed in your plan."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tierRows.map((r) => {
                      const full = r.picked >= r.allowed
                      return (
                        <div
                          key={r.tier}
                          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                            full
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.label} {r.picked} of {r.allowed}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* KPI strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40 my-6"
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
                  sub: byTier && tierRows.length
                    ? `of ${tierRows.reduce((n, r) => n + r.allowed, 0)} places`
                    : selectedIds.size === 0
                      ? "none yet"
                      : `of ${summary.total_influencers} creators`,
                  subClass: selectedIds.size > 0 ? "text-emerald-600 dark:text-emerald-400" : undefined,
                },
                ...(showPricing && (proposal as any).total_budget
                  ? [
                      {
                        icon: Wallet,
                        label: "Your budget",
                        value: formatCurrency((proposal as any).total_budget),
                        isNumber: false,
                        sub: "campaign budget",
                      },
                      {
                        icon: Coins,
                        label: "Selection total",
                        value: formatCurrency(estimatedTotal),
                        isNumber: false,
                        // Going over budget was a grey "over budget" tacked onto the end
                        // of a sub-label — the right thing said far too quietly. The value
                        // itself now turns red and the sub says by HOW MUCH, which is the
                        // number that decides what gets dropped.
                        valueClass: estimatedTotal > (Number((proposal as any).total_budget) || 0)
                          ? "text-red-600 dark:text-red-400"
                          : undefined,
                        sub: (() => {
                          const b = Number((proposal as any).total_budget) || 0;
                          if (!b) return " ";
                          const over = estimatedTotal - b;
                          if (over > 0) return formatCurrency(over) + " over budget";
                          return formatCurrency(b - estimatedTotal) + " left";
                        })(),
                        subClass: estimatedTotal > (Number((proposal as any).total_budget) || 0)
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      },
                    ]
                  : []),
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
                    <p className={`text-2xl font-bold tabular-nums ${(kpi as any).valueClass ?? ""}`}>{kpi.value}</p>
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
                        <SelectItem value="newest_added">Newest added</SelectItem>
                        <SelectItem value="followers_desc">Followers (high-low)</SelectItem>
                        <SelectItem value="engagement_desc">Engagement (high-low)</SelectItem>
                        <SelectItem value="price_desc">Price (high-low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5">
                          <Download className="h-3.5 w-3.5" /> Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportProposal("xlsx")}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportProposal("csv")}>
                          <FileText className="mr-2 h-4 w-4" /> CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  <div className="space-y-8">
                    {(
                      <div className="space-y-3">
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
                                  onViewAnalytics={setAnalyticsUsername}
                                  benchmarks={benchmarks}
                                />
                              </DraggableGridCard>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sortedInfluencers.length === 0 && (
                      <div className="text-center py-16">
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
                                  <AvatarImage src={cdnAvatar(inf.profile_image_url) || DEFAULT_AVATAR} />
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
                {/* AI Snapshot.
                    Bounded and scrolled on its own. The column is a fixed
                    h-[calc(100vh-…)] with overflow-hidden, and this panel had neither a
                    max height nor shrink-0 — so a snapshot with a few insights grew past
                    the bottom of the viewport and crushed the selection list under it.
                    Capped at 45% of the column: whatever the AI returns, the client can
                    always still see what they have selected. */}
                {/* What the plan includes, before anything the AI has to say about it.
                    A client filling places needs the shape of the deal in front of them the
                    whole time, not only when they overfill a band. */}
                {byTier && tierRows.length > 0 && (
                  <TierAllowancePanel rows={tierRows} className="shrink-0" />
                )}

                <div className="shrink-0 max-h-[45%] overflow-y-auto">
                  <AISnapshotPanel
                    proposalId={proposalId}
                    selectedIds={selectedIds}
                    onFetchSnapshot={fetchAISnapshot}
                  />
                </div>

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
                    totalBudget={(proposal as any)?.total_budget}
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
                  {byTier && tierRows.length > 0 && <TierAllowancePanel rows={tierRows} />}
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
                  <AvatarImage src={cdnAvatar(activeDragInfluencer.profile_image_url) || DEFAULT_AVATAR} />
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
            hideApprove={months.length > 0}
            /* On a retainer the terminal action is confirming THIS month, so it takes the
               Approve slot: same weight, same place, right next to Reject. */
            retainer={
              month && month.is_open && !month.is_locked
                ? {
                    label: month.label,
                    complete: tierComplete,
                    picked: tierRows.reduce((n, r) => n + Math.min(r.picked, r.allowed), 0),
                    allowed: tierRows.reduce((n, r) => n + r.allowed, 0),
                    missing: tierRows
                      .filter((r) => r.picked < r.allowed)
                      .map((r) => `${r.label} ${r.picked} of ${r.allowed}`)
                      .join(" · "),
                    confirming: confirmingMonth,
                    onConfirm: () => handleConfirmMonth(month.period),
                  }
                : null
            }
            onReject={() => setRejectDialogOpen(true)}
            onSaveSelection={() => handleSaveSelection()}
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

        {/* Inline creator analytics drawer — same analytics the brand would see on the profile page */}
        <Sheet
          open={!!analyticsUsername}
          onOpenChange={(open: boolean) => { if (!open) setAnalyticsUsername(null) }}
        >
          <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-5 pb-3 border-b">
              <SheetTitle>@{analyticsUsername}</SheetTitle>
              <SheetDescription>Full creator analytics</SheetDescription>
            </SheetHeader>
            {analyticsUsername && (
              <iframe
                src={`/creator-analytics/${analyticsUsername}?embed=1`}
                className="w-full h-[calc(100vh-5rem)] border-0"
                title={`Analytics for @${analyticsUsername}`}
              />
            )}
          </SheetContent>
        </Sheet>
    </BrandUserInterface>
  )
}

export default function BrandProposalViewPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandProposalViewPageContent />
    </AuthGuard>
  )
}
