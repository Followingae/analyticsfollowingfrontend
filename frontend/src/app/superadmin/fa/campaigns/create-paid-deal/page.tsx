"use client"
import { tokenManager } from '@/utils/tokenManager'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { PageHead } from "@/components/console/primitives"
import { FaPage, Section } from "../../_ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar } from "lucide-react"
import { toast } from "sonner"
import { faCampaignApi, faMerchantApi } from "@/services/faAdminApi"
import {
  CampaignBriefSection, DeliverablePicker, emptyBrief, buildBriefPayload, buildDeliverablePayload,
  validateBriefFulfilment,
  type BriefState, type DeliverableSpec, DELIVERABLE_OPTIONS,
} from "@/components/superadmin/fa/CampaignBriefFields"
import { CouponManagerDialog } from "@/components/superadmin/fa/CouponManagerDialog"
import { SelfManagedToggle } from "@/components/superadmin/fa/SelfManagedToggle"
import { SelfManagedBranding } from "@/components/superadmin/fa/SelfManagedBranding"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

export default function CreatePaidDealPage() {
  const router = useRouter()
  const [merchants, setMerchants] = useState<any[]>([])
  const [allPools, setAllPools] = useState<any[]>([])
  const [selectedMerchantId, setSelectedMerchantId] = useState("")
  const [selfManaged, setSelfManaged] = useState(false)
  const [clientName, setClientName] = useState("")
  // Team-managed campaigns set their own branding (no merchant to inherit it from).
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [payoutAed, setPayoutAed] = useState<number>(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [deliverables, setDeliverables] = useState<DeliverableSpec[]>([{ ...DELIVERABLE_OPTIONS[0], quantity: 1 }])
  const [brief, setBrief] = useState<BriefState>(emptyBrief)
  const [submitting, setSubmitting] = useState(false)

  const [couponCampaignId, setCouponCampaignId] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = (tokenManager.getTokenSync() || localStorage.getItem("access_token")) || ""
        const [merchantsRes, poolsRes] = await Promise.all([
          faMerchantApi.list(),
          fetch(`${API_BASE}/api/v1/admin/fa/pools`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setMerchants(merchantsRes?.data?.merchants || merchantsRes?.merchants || [])
        if (poolsRes.ok) { const d = await poolsRes.json(); setAllPools(d.data?.pools || d.pools || []) }
      } catch (err) {
        toast.error("Failed to load merchants or pools")
      }
    }
    fetchData()
  }, [])

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)
  // Pools belong to a brand. A self-managed campaign has no brand, so there is nothing to
  // filter by — the operator may pick any pool to fund the payout. A pool is optional:
  // when none is linked, verify still pays the creator from their wallet.
  const merchantPools = selfManaged
    ? allPools
    : allPools.filter((p) => selectedMerchant && p.brand_user_id === selectedMerchant.brand_user_id)

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    if (!selfManaged && !selectedMerchantId) return toast.error("Select a merchant")
    if (selfManaged && !selectedMerchantId && !clientName.trim()) return toast.error("Enter the client name")
    // Pool is optional: a paid deal can be created before a pool is funded, or team-managed
    // with no brand pool at all. Verify pays the creator from their wallet regardless.
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return toast.error("End date must be after start date")
    if (payoutAed <= 0) return toast.error("Payout amount must be greater than 0")
    if (deliverables.length === 0) return toast.error("Pick at least one deliverable")
    const fulfilmentError = validateBriefFulfilment(brief)
    if (fulfilmentError) return toast.error(fulfilmentError)

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        // Merchant-first: backend derives brand_user_id + brand_name from the merchant.
        // On a self-managed campaign it derives the name only — never the brand id.
        merchant_id: selectedMerchantId || undefined,
        self_managed: selfManaged,
        pool_id: selectedPoolId || undefined,
        payout_aed: payoutAed,
        deliverable_requirements: buildDeliverablePayload(deliverables),
        ...buildBriefPayload(brief),
      }
      if (description.trim()) payload.description = description.trim()
      if (selfManaged && clientName.trim()) payload.brand_name = clientName.trim()
      // Only team-managed campaigns set their own branding; merchant campaigns inherit it.
      if (selfManaged) {
        if (brandLogoUrl) payload.brand_logo_url = brandLogoUrl
        if (heroImageUrl) payload.hero_image_url = heroImageUrl
      }
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)

      const res = await faCampaignApi.createPaidDeal(payload)
      const newId = res?.data?.id
      toast.success("Paid deal campaign created!")
      if (brief.coupon_enabled && newId) {
        setCouponCampaignId(newId)
        setCouponOpen(true)
      } else {
        // The campaign you just made is the destination; the list is where you go to
        // find one you have lost. `newId` was already in hand and thrown away.
        router.push(newId ? `/superadmin/fa/campaigns/${newId}` : "/superadmin/fa/campaigns")
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage className="mx-auto max-w-4xl pb-16">
          <div>
            <Link href="/superadmin/fa/campaigns" className="mb-ds-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />Back to campaigns
            </Link>
            <PageHead
              title="New paid deal"
              sub="Every creator is paid the same fixed fee, out of the client's funded pool, once their deliverables are verified. Step 2 of 2."
            />
          </div>

          {/* Merchant Selection */}
          <Section title="Who it is for" description="The merchant is the place a creator actually walks into. If the client is not on the platform, run it team-managed and give it a name instead.">
            <div className="space-y-4">
              <SelfManagedToggle
                selfManaged={selfManaged}
                onSelfManagedChange={(v: boolean) => { setSelfManaged(v); setSelectedPoolId("") }}
                clientName={clientName}
                onClientNameChange={setClientName}
                merchantSelected={!!selectedMerchantId}
              />
              <Select value={selectedMerchantId} onValueChange={(v: string) => { setSelectedMerchantId(v); setSelectedPoolId("") }}>
                <SelectTrigger><SelectValue placeholder={selfManaged ? "Choose a merchant (optional)..." : "Choose a merchant..."} /></SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}{m.category ? ` (${m.category})` : ""}{m.brand_name ? ` · ${m.brand_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* A paid deal always needs a funded pool — the backend rejects one without.
                  Shown for self-managed even with no merchant, or the form would demand a
                  pool it never offered. */}
              {(selectedMerchantId || selfManaged) && merchantPools.length > 0 && (
                <div className="mt-4">
                  <Label>Funding pool (optional)</Label>
                  <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                    <SelectTrigger><SelectValue placeholder="Select pool..." /></SelectTrigger>
                    <SelectContent>
                      {merchantPools.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name || p.id} - ⃃ {((p.available_cents || 0) / 100).toLocaleString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selfManaged && (
                <SelfManagedBranding
                  brandLogoUrl={brandLogoUrl}
                  heroImageUrl={heroImageUrl}
                  onBrandLogoChange={setBrandLogoUrl}
                  onHeroImageChange={setHeroImageUrl}
                />
              )}
            </div>
          </Section>

          {/* Campaign Details */}
          <Section title="The campaign" description="The name creators see in the app, when it runs, and how many people can join.">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Paid Collab 2026" />
              </div>
              <div className="space-y-2">
                <Label>What are we promoting</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A line or two creators will read in the app" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label><Calendar className="h-3.5 w-3.5 inline mr-1" />Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label><Calendar className="h-3.5 w-3.5 inline mr-1" />End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>How many creators at most</Label>
                <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Leave empty for no cap" />
              </div>
            </div>
          </Section>

          {/* Payout Amount */}
          <Section
            title="What each creator is paid"
            description="One fixed amount per creator, released once their deliverables are verified."
          >
            <div className="space-y-2">
              <Label>Fee per creator (AED) *</Label>
              <Input type="number" min={1} value={payoutAed || ""} onChange={(e) => setPayoutAed(parseFloat(e.target.value) || 0)} placeholder="e.g. 500" />
              {payoutAed > 0 && (
                <p className="text-ds-body-sm text-muted-foreground">
                  Each creator receives &#x20C3; {payoutAed.toLocaleString()} once everything is delivered and verified.
                </p>
              )}
            </div>
          </Section>


          {/* Deliverables (platform-specific) */}
          <DeliverablePicker value={deliverables} onChange={setDeliverables} />

          {/* Creative brief, tags, audience, visit, coupon */}
          <CampaignBriefSection value={brief} onChange={setBrief} />

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/superadmin/fa/campaigns")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim() || (!selfManaged && !selectedMerchantId) || (selfManaged && !selectedMerchantId && !clientName.trim()) || payoutAed <= 0}>
              {submitting ? "Creating" : "Create the campaign"}
            </Button>
          </div>
        </FaPage>

        <CouponManagerDialog
          campaignId={couponCampaignId}
          campaignName={name}
          open={couponOpen}
          onOpenChange={(o) => { setCouponOpen(o); if (!o) router.push(`/superadmin/fa/campaigns/${couponCampaignId}`) }}
        />
      </SuperAdminInterface>
    </AuthGuard>
  )
}
