"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Plus, Search, Trash2, Send, Save, Users, Calendar, Image, Loader2, Upload, X,
} from "lucide-react"
import { ImageCropper } from "@/components/ui/image-cropper"
import { DatePicker } from "@/components/ui/date-picker"
import { formatCount, proposalMotion, STOCK_IMAGES } from "@/components/proposals/proposal-utils"
import { motion, AnimatePresence } from "motion/react"

export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandUser {
  id: string
  email: string
  full_name?: string
  company?: string
  role?: string
}

interface MasterInfluencer {
  id: string
  username: string
  full_name?: string
  profile_image_url?: string
  followers_count: number
  engagement_rate: number
  categories: string[]
  tier?: string
  sell_post_usd_cents?: number | null
  sell_story_usd_cents?: number | null
  sell_reel_usd_cents?: number | null
  sell_carousel_usd_cents?: number | null
  sell_video_usd_cents?: number | null
  sell_bundle_usd_cents?: number | null
  sell_monthly_usd_cents?: number | null
}

const DELIVERABLE_TYPES = [
  { key: "post", label: "Post", priceField: "sell_post_usd_cents" },
  { key: "story", label: "Story", priceField: "sell_story_usd_cents" },
  { key: "reel", label: "Reel", priceField: "sell_reel_usd_cents" },
  { key: "carousel", label: "Carousel", priceField: "sell_carousel_usd_cents" },
  { key: "video", label: "Video", priceField: "sell_video_usd_cents" },
  { key: "bundle", label: "Bundle", priceField: "sell_bundle_usd_cents" },
  { key: "monthly", label: "Monthly", priceField: "sell_monthly_usd_cents" },
] as const

const TIER_OPTIONS = ["all", "nano", "micro", "mid", "macro", "mega"]
const CATEGORY_OPTIONS = [
  "all", "Fashion", "Beauty", "Fitness", "Food", "Travel",
  "Tech", "Lifestyle", "Entertainment", "Sports", "Business",
]

// ===========================================================================
// Page Component
// ===========================================================================

function CreateProposalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const addMoreId = searchParams.get("addMore")
  const isEditMode = Boolean(editId)
  const isAddMoreMode = Boolean(addMoreId)

  const [submitting, setSubmitting] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)

  // -- Brand users ----------------------------------------------------------
  const [brandUsers, setBrandUsers] = useState<BrandUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState("")

  // -- Proposal form --------------------------------------------------------
  const [title, setTitle] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [description, setDescription] = useState("")
  const [proposalNotes, setProposalNotes] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverUploading, setCoverUploading] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [showStockPicker, setShowStockPicker] = useState(false)
  const [visibility, setVisibility] = useState({
    show_sell_pricing: true,
    show_analytics: true,
    show_engagement: true,
    show_audience: true,
    show_content_analysis: true,
  })

  // -- Master DB search -----------------------------------------------------
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [masterResults, setMasterResults] = useState<MasterInfluencer[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)

  // -- Added influencers ----------------------------------------------------
  const [addedInfluencers, setAddedInfluencers] = useState<MasterInfluencer[]>([])
  // Per-influencer deliverable assignments: { influencer_id: [{ type: "reel", quantity: 2 }] }
  const [deliverableAssignments, setDeliverableAssignments] = useState<
    Record<string, Array<{ type: string; quantity: number }>>
  >({})

  // =========================================================================
  // Data fetching
  // =========================================================================

  // Load brand users from /api/v1/admin/users
  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true)
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/admin/users?page_size=100`,
          { headers: getAuthHeaders() }
        )
        if (res.ok) {
          const json = await res.json()
          const allUsers: BrandUser[] = json.users ?? json.data?.users ?? json.data ?? []
          // Filter to brand/user roles only (exclude admins/superadmins)
          const brandOnly = allUsers.filter(
            (u) => !u.role || !["super_admin", "admin", "superadmin"].includes(u.role)
          )
          setBrandUsers(brandOnly)
        }
      } catch {
        toast.error("Failed to load brand users")
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Load existing proposal in edit mode
  useEffect(() => {
    if (!editId) return
    async function loadProposal() {
      setLoadingForm(true)
      try {
        const detail = await adminProposalApi.getDetail(editId!)
        const p = detail.proposal
        setTitle(p.title)
        setCampaignName(p.campaign_name)
        setDescription(p.description || "")
        setProposalNotes(p.proposal_notes || "")
        setDeadline(p.deadline_at ? new Date(p.deadline_at) : undefined)
        setCoverImageUrl(p.cover_image_url || "")
        setSelectedUserId(p.user_id || "")
        if (p.visible_fields) {
          setVisibility((v) => ({ ...v, ...p.visible_fields }))
        }
      } catch {
        toast.error("Failed to load proposal for editing")
      } finally {
        setLoadingForm(false)
      }
    }
    loadProposal()
  }, [editId])

  // Upload cropped cover image to CDN
  const handleCoverCropped = async (croppedFile: File) => {
    setCoverUploading(true)
    try {
      const cdnUrl = await adminProposalApi.uploadCoverImage(croppedFile)
      setCoverImageUrl(cdnUrl)
      toast.success("Cover image uploaded")
    } catch {
      toast.error("Failed to upload cover image")
    } finally {
      setCoverUploading(false)
    }
  }

  // Search influencers from master DB
  const searchInfluencers = useCallback(async () => {
    setSearching(true)
    try {
      const params = new URLSearchParams({ page_size: "20" })
      if (search) params.set("search", search)
      if (tierFilter !== "all") params.set("tier", tierFilter)
      if (categoryFilter !== "all") params.set("categories", categoryFilter)
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencers/database?${params}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const json = await res.json()
        setMasterResults(json.data?.influencers ?? json.influencers ?? json.data ?? [])
      }
    } catch {
      toast.error("Failed to search influencers")
    } finally {
      setSearching(false)
    }
  }, [search, tierFilter, categoryFilter])

  useEffect(() => {
    const t = setTimeout(searchInfluencers, 400)
    return () => clearTimeout(t)
  }, [searchInfluencers])

  // =========================================================================
  // Actions
  // =========================================================================

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addSelected() {
    const alreadyIds = new Set(addedInfluencers.map((i) => i.id))
    const toAdd = masterResults.filter(
      (i) => selectedIds.has(i.id) && !alreadyIds.has(i.id)
    )
    if (!toAdd.length) {
      toast.info("No new influencers to add")
      return
    }
    setAddedInfluencers((prev) => [...prev, ...toAdd])
    setSelectedIds(new Set())
    toast.success(`Added ${toAdd.length} influencer(s)`)
  }

  function removeAdded(id: string) {
    setAddedInfluencers((prev) => prev.filter((i) => i.id !== id))
    setDeliverableAssignments((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function toggleDeliverable(influencerId: string, type: string) {
    setDeliverableAssignments((prev) => {
      const current = prev[influencerId] || []
      const exists = current.find((d) => d.type === type)
      if (exists) {
        return { ...prev, [influencerId]: current.filter((d) => d.type !== type) }
      }
      return { ...prev, [influencerId]: [...current, { type, quantity: 1 }] }
    })
  }

  function updateDeliverableQuantity(influencerId: string, type: string, quantity: number) {
    if (quantity < 1) return
    setDeliverableAssignments((prev) => {
      const current = prev[influencerId] || []
      return {
        ...prev,
        [influencerId]: current.map((d) =>
          d.type === type ? { ...d, quantity } : d
        ),
      }
    })
  }

  function getInfluencerDeliverableTotal(inf: MasterInfluencer): number {
    const assignments = deliverableAssignments[inf.id] || []
    return assignments.reduce((sum, d) => {
      const priceField = DELIVERABLE_TYPES.find((dt) => dt.key === d.type)?.priceField
      if (!priceField) return sum
      const cents = (inf as any)[priceField]
      if (cents == null) return sum
      return sum + (cents / 100) * d.quantity
    }, 0)
  }

  const proposalDeliverableTotal = addedInfluencers.reduce(
    (sum, inf) => sum + getInfluencerDeliverableTotal(inf),
    0
  )

  // -- Submit: Add-more mode ------------------------------------------------
  async function handleAddMore() {
    if (!addedInfluencers.length) {
      toast.error("Add at least one influencer")
      return
    }
    setSubmitting(true)
    try {
      const delAssignments = Object.entries(deliverableAssignments)
        .filter(([id, dels]) => dels.length > 0)
        .map(([influencer_db_id, deliverables]) => ({ influencer_db_id, deliverables }))

      await adminProposalApi.addMoreInfluencers(addMoreId!, {
        influencer_ids: addedInfluencers.map((i) => i.id),
        deliverable_assignments: delAssignments.length > 0 ? delAssignments : undefined,
      })
      toast.success("More influencers added and brand notified!")
      router.push(`/superadmin/proposals/${addMoreId}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to add more influencers")
    } finally {
      setSubmitting(false)
    }
  }

  // -- Submit: Edit mode ----------------------------------------------------
  async function handleUpdate() {
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!campaignName.trim()) { toast.error("Campaign name is required"); return }
    setSubmitting(true)
    try {
      await adminProposalApi.updateProposal(editId!, {
        title: title.trim(),
        campaign_name: campaignName.trim(),
        description: description.trim() || undefined,
        proposal_notes: proposalNotes.trim() || undefined,
        visible_fields: visibility,
        deadline_at: deadline?.toISOString() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
      })

      // Add any new influencers
      if (addedInfluencers.length) {
        const delAssignments = Object.entries(deliverableAssignments)
          .filter(([id, dels]) => dels.length > 0)
          .map(([influencer_db_id, deliverables]) => ({ influencer_db_id, deliverables }))

        await adminProposalApi.addInfluencers(editId!, {
          influencer_ids: addedInfluencers.map((i) => i.id),
          deliverable_assignments: delAssignments.length > 0 ? delAssignments : undefined,
        })
      }

      toast.success("Proposal updated!")
      router.push(`/superadmin/proposals/${editId}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update proposal")
    } finally {
      setSubmitting(false)
    }
  }

  // -- Submit: Create new ---------------------------------------------------
  async function handleCreate(sendAfter: boolean) {
    if (!selectedUserId) { toast.error("Select a brand user"); return }
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!campaignName.trim()) { toast.error("Campaign name is required"); return }
    if (!addedInfluencers.length) { toast.error("Add at least one influencer"); return }

    setSubmitting(true)
    try {
      const proposal = await adminProposalApi.createProposal({
        title: title.trim(),
        campaign_name: campaignName.trim(),
        description: description.trim() || undefined,
        proposal_notes: proposalNotes.trim() || undefined,
        user_id: selectedUserId,
        visible_fields: visibility,
        deadline_at: deadline?.toISOString() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
      })

      const delAssignments = Object.entries(deliverableAssignments)
        .filter(([id, dels]) => dels.length > 0)
        .map(([influencer_db_id, deliverables]) => ({ influencer_db_id, deliverables }))

      await adminProposalApi.addInfluencers(proposal.id, {
        influencer_ids: addedInfluencers.map((i) => i.id),
        deliverable_assignments: delAssignments.length > 0 ? delAssignments : undefined,
      })

      if (sendAfter) {
        await adminProposalApi.sendToBrand(proposal.id)
        toast.success("Proposal created and sent to brand!")
      } else {
        toast.success("Proposal saved as draft!")
      }

      router.push("/superadmin/proposals")
    } catch (err: any) {
      toast.error(err.message || "Failed to create proposal")
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================================
  // Render
  // =========================================================================

  const pageTitle = isAddMoreMode
    ? "Add More Influencers"
    : isEditMode
      ? "Edit Proposal"
      : "Create Proposal"
  const pageDescription = isAddMoreMode
    ? "Add more influencers to fulfill the brand's request"
    : isEditMode
      ? "Update proposal details and influencers"
      : "Build a new campaign proposal for a brand"

  if (loadingForm) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            <div>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
            </div>
          </div>
          <div className="rounded-lg border p-6 space-y-4">
            <div className="h-5 w-36 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-9 bg-muted animate-pulse rounded" />
              <div className="h-9 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <motion.div
        variants={proposalMotion.staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={proposalMotion.staggerItem} className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                editId || addMoreId
                  ? `/superadmin/proposals/${editId || addMoreId}`
                  : "/superadmin/proposals"
              )
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{pageDescription}</p>
          </div>
        </motion.div>

        {/* =============================================================== */}
        {/* Section 1 - Proposal Details (hidden in addMore mode)          */}
        {/* =============================================================== */}
        {!isAddMoreMode && (
          <motion.div variants={proposalMotion.staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
              <CardDescription>Core information about the proposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brand user */}
              <div>
                <Label>Brand User *</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isEditMode}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        usersLoading ? "Loading users..." : "Select brand user..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {brandUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name
                          ? `${u.full_name}${u.company ? ` — ${u.company}` : ""} (${u.email})`
                          : u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Q2 Campaign Proposal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Campaign Name *</Label>
                  <Input
                    className="mt-1"
                    placeholder="Summer 2026 Launch"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  placeholder="Brief description of the campaign..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label>Admin Notes for Brand</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="Notes visible to the brand..."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Deadline
                  </Label>
                  <div className="mt-1">
                    <DatePicker
                      date={deadline}
                      onSelect={setDeadline}
                      placeholder="Select deadline"
                    />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" /> Cover Image
                  </Label>
                  {coverImageUrl ? (
                    <div className="mt-2 relative group">
                      <img
                        src={coverImageUrl}
                        alt="Cover preview"
                        className="h-32 w-full rounded-md border object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCropperOpen(true)}
                        >
                          Upload New
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowStockPicker(true)}
                        >
                          Stock
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCoverImageUrl("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setCropperOpen(true)}
                        disabled={coverUploading}
                      >
                        {coverUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {coverUploading ? "Uploading..." : "Upload"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowStockPicker(true)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Stock photos
                      </Button>
                    </div>
                  )}

                  {/* Stock image picker */}
                  <AnimatePresence>
                    {showStockPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 rounded-md border p-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Choose a stock image</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowStockPicker(false)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {STOCK_IMAGES.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`relative h-14 rounded overflow-hidden border-2 transition-all hover:opacity-100 ${
                                  coverImageUrl === url
                                    ? "border-primary ring-1 ring-primary"
                                    : "border-transparent opacity-75"
                                }`}
                                onClick={() => {
                                  setCoverImageUrl(url)
                                  setShowStockPicker(false)
                                }}
                              >
                                <img
                                  src={url.replace("w=1920", "w=200").replace("h=600", "h=80")}
                                  alt={`Stock ${i + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <ImageCropper
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onImageCropped={handleCoverCropped}
                title="Crop Cover Image"
                aspect={16 / 5}
                outputWidth={1200}
                cropHint="Drag to select the banner area. The image will be cropped to a 16:5 wide banner."
              />

              <Separator />

              <div>
                <Label className="mb-2 block">Visibility Settings</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {Object.entries(visibility).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={key}
                        checked={val}
                        onCheckedChange={(c) =>
                          setVisibility((v) => ({ ...v, [key]: c === true }))
                        }
                      />
                      <label htmlFor={key} className="text-sm cursor-pointer capitalize">
                        {key.replace("show_", "").replace(/_/g, " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* =============================================================== */}
        {/* Section 2 - Add Influencers from Master DB                      */}
        {/* =============================================================== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isAddMoreMode
                ? "Select Additional Influencers"
                : "Add Influencers from Master DB"}
            </CardTitle>
            <CardDescription>
              Search and select influencers to include in this proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search username or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "all" ? "All Categories" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "all"
                        ? "All Tiers"
                        : t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results table */}
            <div className="border rounded-lg max-h-[380px] overflow-auto overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="min-w-[180px]">Influencer</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead className="text-right">Eng %</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Categories</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searching ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                            <div className="space-y-1">
                              <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
                              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right"><div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 w-10 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        <TableCell><div className="h-5 w-14 bg-muted animate-pulse rounded-full" /></TableCell>
                        <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : masterResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Search className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
                        <p className="text-sm text-muted-foreground">No influencers found. Try a different search.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    masterResults.map((inf) => {
                      const alreadyAdded = addedInfluencers.some(
                        (a) => a.id === inf.id
                      )
                      return (
                        <TableRow
                          key={inf.id}
                          className={`transition-colors duration-150 ${alreadyAdded ? "opacity-40" : "hover:bg-muted/50 cursor-pointer"}`}
                          onClick={!alreadyAdded ? () => toggleSelect(inf.id) : undefined}
                        >
                          <TableCell>
                            <Checkbox
                              disabled={alreadyAdded}
                              checked={selectedIds.has(inf.id)}
                              onCheckedChange={() => toggleSelect(inf.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={inf.profile_image_url} />
                                <AvatarFallback className="text-xs">
                                  {(inf.username?.[0] ?? "?").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="leading-tight">
                                <p className="font-medium text-sm">
                                  @{inf.username}
                                </p>
                                {inf.full_name && (
                                  <p className="text-xs text-muted-foreground">
                                    {inf.full_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-medium">
                            {formatCount(inf.followers_count ?? 0)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {(inf.engagement_rate ?? 0).toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            {inf.tier && (
                              <Badge variant="outline" className="capitalize text-xs">
                                {inf.tier}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(inf.categories ?? []).slice(0, 3).map((c) => (
                                <Badge
                                  key={c}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <Button onClick={addSelected} disabled={selectedIds.size === 0} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Selected
              {selectedIds.size > 0 && (
                <span className="ml-1 tabular-nums">({selectedIds.size})</span>
              )}
            </Button>

            {/* Already-added list */}
            {addedInfluencers.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="mb-2 block">
                    Added Influencers ({addedInfluencers.length})
                  </Label>
                  <div className="space-y-3">
                    {addedInfluencers.map((inf) => (
                      <div key={inf.id} className="rounded-lg border transition-colors duration-150 hover:border-border/80">
                        <div
                          className="flex items-center justify-between px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={inf.profile_image_url} />
                              <AvatarFallback className="text-xs">
                                {(inf.username?.[0] ?? "?").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              @{inf.username}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatCount(inf.followers_count ?? 0)} followers
                            </span>
                            {inf.tier && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {inf.tier}
                              </Badge>
                            )}
                            {(inf.categories ?? []).slice(0, 2).map((c) => (
                              <Badge key={c} variant="secondary" className="text-xs">
                                {c}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors duration-150"
                            onClick={() => removeAdded(inf.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Deliverable Assignments */}
                        <div className="mx-3 mb-3 p-3 rounded-lg bg-muted/30 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Deliverables
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {DELIVERABLE_TYPES.map((dt) => {
                              const cents = (inf as any)[dt.priceField]
                              if (cents == null) return null
                              const price = cents / 100
                              const assignment = (deliverableAssignments[inf.id] || []).find(
                                (d) => d.type === dt.key
                              )
                              const isActive = Boolean(assignment)
                              return (
                                <div key={dt.key} className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleDeliverable(inf.id, dt.key)}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-150 ${
                                      isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                    }`}
                                  >
                                    {dt.label}
                                    <span className="text-[10px] opacity-70">
                                      ${price}
                                    </span>
                                  </button>
                                  {isActive && (
                                    <div className="flex items-center border rounded-md overflow-hidden">
                                      <button
                                        type="button"
                                        className="px-1.5 py-0.5 text-xs hover:bg-muted transition-colors duration-150"
                                        onClick={() =>
                                          updateDeliverableQuantity(
                                            inf.id,
                                            dt.key,
                                            (assignment?.quantity || 1) - 1
                                          )
                                        }
                                      >
                                        -
                                      </button>
                                      <span className="px-1.5 py-0.5 text-xs font-medium tabular-nums min-w-[20px] text-center border-x">
                                        {assignment?.quantity || 1}
                                      </span>
                                      <button
                                        type="button"
                                        className="px-1.5 py-0.5 text-xs hover:bg-muted transition-colors duration-150"
                                        onClick={() =>
                                          updateDeliverableQuantity(
                                            inf.id,
                                            dt.key,
                                            (assignment?.quantity || 1) + 1
                                          )
                                        }
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          {getInfluencerDeliverableTotal(inf) > 0 && (
                            <p className="text-xs text-foreground font-medium mt-2">
                              Subtotal: ${getInfluencerDeliverableTotal(inf).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {addedInfluencers.length > 0 && proposalDeliverableTotal > 0 && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total across {addedInfluencers.length} creator{addedInfluencers.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-lg font-semibold tabular-nums mt-0.5">
                          ${proposalDeliverableTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* =============================================================== */}
        {/* Section 3 - Actions                                             */}
        {/* =============================================================== */}
        <div className="flex justify-end gap-3 pb-8 border-t pt-6">
          {isAddMoreMode ? (
            <Button
              disabled={submitting || !addedInfluencers.length}
              onClick={handleAddMore}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Adding..." : `Add ${addedInfluencers.length} Influencer(s)`}
            </Button>
          ) : isEditMode ? (
            <Button disabled={submitting} onClick={handleUpdate}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => handleCreate(false)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleCreate(true)}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitting ? "Sending..." : "Send to Brand"}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </SuperadminLayout>
  )
}

export default function CreateProposalPage() {
  return (
    <Suspense>
      <CreateProposalContent />
    </Suspense>
  )
}
