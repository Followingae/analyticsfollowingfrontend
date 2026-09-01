"use client"

/**
 * The proposal builder.
 *
 * Three modes on one screen, as before:
 *   - create   (no query string)  — a new proposal
 *   - edit     (?edit=<id>)       — change a proposal's details, add creators
 *   - add-more (?addMore=<id>)    — attach creators to a proposal already sent
 *
 * The page owns every piece of state and every network call. The drawing is
 * split into three files under `components/superadmin/proposals/builder/` so
 * this one stays readable:
 *
 *   ProposalDetailsCard  the deal    (brand, budget, terms, cover, visibility)
 *   CreatorSourcePicker  where creators come from (master DB / FA / handle)
 *   RosterPanel          the list being assembled, priced and ordered
 *
 * The picker and the roster now sit side by side. Assembling a roster is the
 * whole job of this screen and it was impossible to see the list and the search
 * results at the same time.
 *
 * MONEY: this builder handles SELL prices only. Cost and margin are leadership
 * scope, decided server-side in `app/core/field_policy.py`, and no cost field is
 * fetched or rendered anywhere on this page. Do not add one.
 */

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Plus, Save, Users, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { proposalMotion } from "@/components/proposals/proposal-utils"
import { motion } from "motion/react"
import { DEFAULT_TERMS, type PaymentTerms } from "@/components/superadmin/proposals/PaymentStructure"
import {
  ProposalDetailsCard,
  type CampaignTypeTarget,
  type VisibilityFlags,
} from "@/components/superadmin/proposals/builder/ProposalDetailsCard"
import {
  CreatorSourcePicker,
  type PickerTab,
} from "@/components/superadmin/proposals/builder/CreatorSourcePicker"
import { RosterPanel } from "@/components/superadmin/proposals/builder/RosterPanel"
import {
  unitSellPrice,
  type DeliverableAssignmentMap,
  type MasterInfluencer,
} from "@/components/superadmin/proposals/builder/types"

export const dynamic = "force-dynamic"

interface BrandUser {
  id: string
  email: string
  full_name?: string
  company?: string
  role?: string
}

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
  const [totalBudget, setTotalBudget] = useState("")
  // How the deal is paid for. The old percentages list stays in the payload for older
  // readers of a proposal; this is the shape that can also describe a retainer.
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(DEFAULT_TERMS)
  const [paymentSchedule] = useState<{ label: string; pct: string }[]>([
    { label: "Advance", pct: "50" },
    { label: "On completion", pct: "50" },
  ])
  const [description, setDescription] = useState("")
  const [proposalNotes, setProposalNotes] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverUploading, setCoverUploading] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [showStockPicker, setShowStockPicker] = useState(false)
  const [visibility, setVisibility] = useState<VisibilityFlags>({
    show_sell_pricing: true,
    show_analytics: true,
    show_engagement: true,
    show_audience: true,
    show_content_analysis: true,
  })

  // Target campaign type once the proposal is approved by the brand.
  const [campaignTypeTarget, setCampaignTypeTarget] = useState<CampaignTypeTarget>("influencer")

  // Unified picker tab: master DB | FA members | add by Instagram handle
  const [pickerTab, setPickerTab] = useState<PickerTab>("master")
  // FA members results
  const [faSearch, setFaSearch] = useState("")
  const [faResults, setFaResults] = useState<any[]>([])
  const [faSearching, setFaSearching] = useState(false)
  // Add-by-handle state
  const [newHandle, setNewHandle] = useState("")
  const [addingHandle, setAddingHandle] = useState(false)
  // Analytics drawer (inline creator preview)
  const [analyticsUsername, setAnalyticsUsername] = useState<string | null>(null)

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
  const [deliverableAssignments, setDeliverableAssignments] =
    useState<DeliverableAssignmentMap>({})

  // =========================================================================
  // Data fetching
  // =========================================================================

  // Load brand users from the clients list
  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true)
      try {
        // The clients list, not the users list. /admin/users is mounted behind the `users`
        // module, which no staff role has — so this returned 403, the `if (res.ok)` swallowed
        // it without a word, and the brand dropdown was empty for every account manager and
        // business developer. Submit is blocked on that dropdown, so nobody outside an
        // operator could create a proposal at all.
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/admin/clients?page_size=200`,
          { headers: getAuthHeaders() }
        )
        if (res.ok) {
          const json = await res.json()
          const rows = json.data?.clients ?? json.clients ?? json.data ?? []
          setBrandUsers(rows
            .filter((c: any) => c.brand_user_id)
            .map((c: any) => ({
              id: c.brand_user_id,
              email: c.owner_email,
              full_name: c.name || c.company_name || c.owner_name,
              company: c.company_name || c.name,
            })) as BrandUser[])
        } else {
          const detail = (await res.json().catch(() => ({}))).detail
          toast.error(detail || "Could not load the client list")
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
        setTotalBudget(p.total_budget != null ? String(p.total_budget) : "")
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  /** Roster order is the order the ids are submitted in, so it is worth arranging. */
  function moveInRoster(index: number, direction: -1 | 1) {
    setAddedInfluencers((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  // ---- FA members search -------------------------------------------------
  const searchFaMembers = useCallback(async () => {
    setFaSearching(true)
    try {
      const params = new URLSearchParams()
      if (faSearch.trim()) params.set("q", faSearch.trim())
      params.set("limit", "30")
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/fa-members/search?${params.toString()}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const body = await res.json()
        setFaResults(body?.data?.members ?? [])
      }
    } catch {
      toast.error("FA member search failed")
    } finally {
      setFaSearching(false)
    }
  }, [faSearch])

  // Look up an Instagram handle in master DB; create the DB row if missing.
  async function resolveHandleToMaster(username: string): Promise<MasterInfluencer | null> {
    const clean = username.trim().replace(/^@/, "")
    if (!clean) return null

    // 1. Check if already in master DB
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/influencers/database?search=${encodeURIComponent(clean)}&page_size=5`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const body = await res.json()
        const rows: any[] = body?.data?.influencers ?? body?.data?.items ?? body?.data ?? []
        const hit = rows.find((r: any) => (r.username || "").toLowerCase() === clean.toLowerCase())
        if (hit) return hit as MasterInfluencer
      }
    } catch { /* fall through to create */ }

    // 2. Otherwise create it
    const createRes = await fetchWithAuth(
      `${API_CONFIG.BASE_URL}/api/v1/admin/influencers/add`,
      {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean, status: "active" }),
      }
    )
    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(err || `Failed to add @${clean}`)
    }
    const body = await createRes.json()
    return (body?.data?.influencer ?? null) as MasterInfluencer | null
  }

  async function addFaMemberSelection(members: any[]) {
    if (!members.length) return
    const alreadyUsernames = new Set(addedInfluencers.map((i) => i.username?.toLowerCase()))
    const toResolve = members.filter(
      (m) => m.instagram_username && !alreadyUsernames.has(m.instagram_username.toLowerCase())
    )
    if (!toResolve.length) { toast.info("Already added"); return }

    const resolved: MasterInfluencer[] = []
    for (const m of toResolve) {
      try {
        const master = await resolveHandleToMaster(m.instagram_username)
        if (master) resolved.push(master)
      } catch (e: any) {
        toast.error(e.message || `Failed to add @${m.instagram_username}`)
      }
    }
    if (resolved.length) {
      setAddedInfluencers((prev) => [...prev, ...resolved])
      toast.success(`Added ${resolved.length} FA member(s)`)
    }
  }

  async function addHandle() {
    if (!newHandle.trim()) return
    setAddingHandle(true)
    try {
      const master = await resolveHandleToMaster(newHandle)
      if (!master) {
        toast.error("Could not resolve handle")
        return
      }
      if (addedInfluencers.some((i) => i.id === master.id)) {
        toast.info("Already added")
        return
      }
      setAddedInfluencers((prev) => [...prev, master])
      setNewHandle("")
      toast.success(`Added @${master.username}`)
    } catch (e: any) {
      toast.error(e.message || "Failed to add handle")
    } finally {
      setAddingHandle(false)
    }
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
        [influencerId]: current.map((d) => (d.type === type ? { ...d, quantity } : d)),
      }
    })
  }

  /**
   * Set one deliverable across every creator priced for it. If they all already
   * have it, the same click takes it off again — so it is never a one-way door.
   * Quantities that were already set are left alone.
   */
  function applyDeliverableToAll(type: string) {
    const eligible = addedInfluencers.filter((inf) => unitSellPrice(inf, type) != null)
    if (!eligible.length) return

    const everyoneHasIt = eligible.every((inf) =>
      (deliverableAssignments[inf.id] || []).some((d) => d.type === type)
    )

    setDeliverableAssignments((prev) => {
      const next = { ...prev }
      for (const inf of eligible) {
        const current = next[inf.id] || []
        if (everyoneHasIt) {
          next[inf.id] = current.filter((d) => d.type !== type)
        } else if (!current.some((d) => d.type === type)) {
          next[inf.id] = [...current, { type, quantity: 1 }]
        }
      }
      return next
    })

    const label = type.charAt(0).toUpperCase() + type.slice(1)
    toast.success(
      everyoneHasIt
        ? `${label} removed from ${eligible.length} creator(s)`
        : `${label} added to ${eligible.length} creator(s)`
    )
  }

  /** The assignments payload, in the roster's current order. */
  function deliverablePayload() {
    return addedInfluencers
      .filter((inf) => (deliverableAssignments[inf.id] || []).length > 0)
      .map((inf) => ({
        influencer_db_id: inf.id,
        deliverables: deliverableAssignments[inf.id],
      }))
  }

  // -- Submit: Add-more mode ------------------------------------------------
  async function handleAddMore() {
    if (!addedInfluencers.length) {
      toast.error("Add at least one influencer")
      return
    }
    setSubmitting(true)
    try {
      const delAssignments = deliverablePayload()

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
        const delAssignments = deliverablePayload()
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
  // Create the proposal SHELL. Influencers are NOT required here - in the new flow
  // they're added by talent managers in the approval workspace. `startApproval`
  // routes straight into that workspace; otherwise we save a draft.
  async function handleCreate(startApproval: boolean) {
    if (!selectedUserId) { toast.error("Select a brand user"); return }
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!campaignName.trim()) { toast.error("Campaign name is required"); return }

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
        campaign_type_target: campaignTypeTarget,
        total_budget: totalBudget ? Number(totalBudget) : undefined,
        payment_schedule: paymentSchedule
          .filter((m) => m.label.trim())
          .map((m) => ({ label: m.label.trim(), pct: Number(m.pct) || 0 })),
        payment_terms: paymentTerms,
      } as any)

      // Optionally pre-attach influencers if the operator added any (not required).
      if (addedInfluencers.length) {
        const delAssignments = deliverablePayload()
        await adminProposalApi.addInfluencers(proposal.id, {
          influencer_ids: addedInfluencers.map((i) => i.id),
          deliverable_assignments: delAssignments.length > 0 ? delAssignments : undefined,
        })
      }

      if (startApproval) {
        toast.success("Proposal created - opening the approval workflow")
        router.push(`/superadmin/proposals/${proposal.id}/approval`)
      } else {
        toast.success("Proposal saved as draft")
        router.push("/superadmin/proposals")
      }
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
        {/* The skeleton promised a bordered box that the loaded page no longer draws, so the
            layout jumped once the data arrived. It now stands for what actually appears. */}
        <div className="space-y-ds-4">
          <div className="flex items-center gap-ds-3">
            <div className="h-9 w-20 animate-pulse rounded-ds-md bg-muted" />
            <div>
              <div className="h-6 w-48 animate-pulse rounded-ds-sm bg-muted" />
              <div className="mt-ds-2 h-4 w-72 animate-pulse rounded-ds-sm bg-muted" />
            </div>
          </div>
          <div className="space-y-ds-3">
            <div className="h-5 w-36 animate-pulse rounded-ds-sm bg-muted" />
            <div className="grid grid-cols-2 gap-ds-3">
              <div className="h-9 animate-pulse rounded-ds-md bg-muted" />
              <div className="h-9 animate-pulse rounded-ds-md bg-muted" />
            </div>
            <div className="h-20 animate-pulse rounded-ds-md bg-muted" />
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
        className="space-y-ds-5 pb-24"
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
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{pageDescription}</p>
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/* Section 1 - Proposal Details (hidden in addMore mode)            */}
        {/* ================================================================ */}
        {!isAddMoreMode && (
          <motion.div variants={proposalMotion.staggerItem}>
            <ProposalDetailsCard
              isEditMode={isEditMode}
              campaignTypeTarget={campaignTypeTarget}
              onCampaignTypeTarget={setCampaignTypeTarget}
              brandUsers={brandUsers}
              usersLoading={usersLoading}
              selectedUserId={selectedUserId}
              onSelectedUserId={setSelectedUserId}
              title={title}
              onTitle={setTitle}
              campaignName={campaignName}
              onCampaignName={setCampaignName}
              totalBudget={totalBudget}
              onTotalBudget={setTotalBudget}
              paymentTerms={paymentTerms}
              onPaymentTerms={setPaymentTerms}
              description={description}
              onDescription={setDescription}
              proposalNotes={proposalNotes}
              onProposalNotes={setProposalNotes}
              deadline={deadline}
              onDeadline={setDeadline}
              coverImageUrl={coverImageUrl}
              onCoverImageUrl={setCoverImageUrl}
              coverUploading={coverUploading}
              cropperOpen={cropperOpen}
              onCropperOpen={setCropperOpen}
              onCoverCropped={handleCoverCropped}
              showStockPicker={showStockPicker}
              onShowStockPicker={setShowStockPicker}
              visibility={visibility}
              onVisibility={setVisibility}
            />
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* Section 2 - The roster workbench                                 */}
        {/* ================================================================ */}
        {/* The workbench used to sit inside a card of its own, and the two things inside it -
            the picker and the roster - each carry their own border already. So every creator
            row was three edges deep: row, panel, wrapper. The wrapper is gone; its title and
            description are a plain section heading, which is what they always were, and the
            picker and the roster are now the boxes. */}
        <motion.div variants={proposalMotion.staggerItem} className="space-y-ds-3">
            <div>
              <h2 className="flex items-center gap-ds-2 text-ds-subheading">
                <Users className="h-5 w-5" />
                {isAddMoreMode ? "Select Additional Influencers" : "Add Influencers (optional)"}
              </h2>
              <p className="mt-ds-1 max-w-3xl text-ds-body-sm text-muted-foreground">
                {isAddMoreMode
                  ? "Search master DB, pick FA members, or add by Instagram handle"
                  : "Optional - you can leave this empty and assign a talent manager to add creators in the approval workflow. Add here only if you want to pre-fill the list."}
              </p>
            </div>

            <div>
              <div className="grid gap-ds-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
                <CreatorSourcePicker
                  pickerTab={pickerTab}
                  onPickerTab={setPickerTab}
                  search={search}
                  onSearch={setSearch}
                  categoryFilter={categoryFilter}
                  onCategoryFilter={setCategoryFilter}
                  tierFilter={tierFilter}
                  onTierFilter={setTierFilter}
                  masterResults={masterResults}
                  searching={searching}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onAddSelected={addSelected}
                  faSearch={faSearch}
                  onFaSearch={setFaSearch}
                  faResults={faResults}
                  faSearching={faSearching}
                  onSearchFaMembers={searchFaMembers}
                  onAddFaMember={(m) => addFaMemberSelection([m])}
                  newHandle={newHandle}
                  onNewHandle={setNewHandle}
                  addingHandle={addingHandle}
                  onAddHandle={addHandle}
                  addedInfluencers={addedInfluencers}
                  onOpenAnalytics={setAnalyticsUsername}
                />

                <div className="lg:sticky lg:top-6">
                  <RosterPanel
                    addedInfluencers={addedInfluencers}
                    deliverableAssignments={deliverableAssignments}
                    onToggleDeliverable={toggleDeliverable}
                    onUpdateQuantity={updateDeliverableQuantity}
                    onApplyToAll={applyDeliverableToAll}
                    onRemove={removeAdded}
                    onMove={moveInRoster}
                    onOpenAnalytics={setAnalyticsUsername}
                  />
                </div>
              </div>
            </div>
        </motion.div>
      </motion.div>

      {/* ================================================================== */}
      {/* Section 3 - Actions. Pinned, because the roster is long and the     */}
      {/* thing you came to do should not be at the bottom of a scroll.       */}
      {/* ================================================================== */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {addedInfluencers.length > 0 && (
            <p className="mr-auto text-sm text-muted-foreground tabular-nums">
              {addedInfluencers.length} creator{addedInfluencers.length !== 1 ? "s" : ""} in the roster
            </p>
          )}
          {isAddMoreMode ? (
            <Button disabled={submitting || !addedInfluencers.length} onClick={handleAddMore}>
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
              <Button variant="outline" disabled={submitting} onClick={() => handleCreate(false)}>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button disabled={submitting} onClick={() => handleCreate(true)}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {submitting ? "Creating..." : "Create & start approval"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Inline creator analytics drawer - opens /creator-analytics/[username] in a side sheet */}
      <Sheet
        open={!!analyticsUsername}
        onOpenChange={(open: boolean) => { if (!open) setAnalyticsUsername(null) }}
      >
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-5 pb-3 border-b">
            <SheetTitle>@{analyticsUsername}</SheetTitle>
            <SheetDescription>Full creator analytics - same data the brand will see.</SheetDescription>
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
