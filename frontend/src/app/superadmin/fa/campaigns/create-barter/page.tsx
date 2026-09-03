"use client"

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
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react"
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

export default function CreateBarterPage() {
  const router = useRouter()
  const [merchants, setMerchants] = useState<any[]>([])
  const [selectedMerchantId, setSelectedMerchantId] = useState("")
  const [selfManaged, setSelfManaged] = useState(false)
  const [clientName, setClientName] = useState("")
  // Team-managed campaigns set their own branding (no merchant to inherit it from).
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [barterItems, setBarterItems] = useState([{ name: "", value_aed: 0, description: "" }])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [deliverables, setDeliverables] = useState<DeliverableSpec[]>([
    { ...DELIVERABLE_OPTIONS[0], quantity: 1 },
  ])
  const [brief, setBrief] = useState<BriefState>(emptyBrief)
  const [submitting, setSubmitting] = useState(false)

  // After a coupon-enabled campaign is created, prompt to upload the codes.
  const [couponCampaignId, setCouponCampaignId] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await faMerchantApi.list()
        setMerchants(res?.data?.merchants || res?.merchants || [])
      } catch (error) {
        console.error('Failed to fetch merchants for barter campaign:', error)
      }
    }
    fetchMerchants()
  }, [])

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)

  const addBarterItem = () => setBarterItems([...barterItems, { name: "", value_aed: 0, description: "" }])
  const removeBarterItem = (i: number) => setBarterItems(barterItems.filter((_, idx) => idx !== i))
  const updateBarterItem = (i: number, field: string, value: any) => {
    const updated = [...barterItems]
    updated[i] = { ...updated[i], [field]: value }
    setBarterItems(updated)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    // A self-managed campaign may have no merchant at all — the client isn't on the
    // platform. It still needs a name, because creators see it in the app.
    if (!selfManaged && !selectedMerchantId) return toast.error("Select a merchant")
    if (selfManaged && !selectedMerchantId && !clientName.trim()) return toast.error("Enter the client name")
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return toast.error("End date must be after start date")
    const validItems = barterItems.filter((item) => item.name.trim())
    if (validItems.length === 0) return toast.error("Add at least one barter item")
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
        barter_items: validItems.map((item) => ({
          name: item.name.trim(),
          // Mobile reads `value_aed` - keep both keys so old + new readers agree.
          value_aed: item.value_aed || 0,
          estimated_value_aed: item.value_aed || 0,
          description: item.description.trim() || undefined,
        })),
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

      const res = await faCampaignApi.createBarter(payload)
      const newId = res?.data?.id
      toast.success("Barter campaign created!")
      // If coupons are enabled, stay and prompt to upload the code pool.
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

  const totalBarterValue = barterItems.reduce((sum, item) => sum + (item.value_aed || 0), 0)

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage className="mx-auto max-w-4xl space-y-ds-5 pb-16">
          <div>
            <Link href="/superadmin/fa/campaigns" className="mb-ds-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />Back to campaigns
            </Link>
            <PageHead
              title="New barter campaign"
              sub="Creators get a product, a service or a discount code instead of a fee. Step 2 of 2."
            />
          </div>

          {/* Merchant Selection */}
          <Section title="Who it is for" description="The merchant is the place a creator actually walks into. If the client is not on the platform, run it team-managed and give it a name instead.">
            <div className="space-y-4">
              <SelfManagedToggle
                selfManaged={selfManaged}
                onSelfManagedChange={setSelfManaged}
                clientName={clientName}
                onClientNameChange={setClientName}
                merchantSelected={!!selectedMerchantId}
              />
              <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                <SelectTrigger><SelectValue placeholder={selfManaged ? "Choose a merchant (optional)..." : "Choose a merchant..."} /></SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}{m.category ? ` (${m.category})` : ""}{m.brand_name ? ` · ${m.brand_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Thai Fire Edit" />
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

          {/* What the creator gets */}
          <Section
            title="What the creator gets"
            description="Products, a service, or a discount, in exchange for the content."
          >
            <div className="space-y-4">
              {barterItems.map((item, i) => (
                <div key={i} className="space-y-3 rounded-ds-lg border border-black/[0.06] p-4 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeBarterItem(i)} disabled={barterItems.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Item Name *</Label>
                      <Input value={item.name} onChange={(e) => updateBarterItem(i, "name", e.target.value)} placeholder="e.g., AED 200 coupon, Gift basket" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estimated Value (AED)</Label>
                      <Input type="number" value={item.value_aed || ""} onChange={(e) => updateBarterItem(i, "value_aed", parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input value={item.description} onChange={(e) => updateBarterItem(i, "description", e.target.value)} placeholder="Details about the item..." />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-ds-2">
                <Button variant="outline" size="sm" onClick={addBarterItem}><Plus className="h-4 w-4 mr-1" />Add another item</Button>
                <p className="text-ds-body-sm text-muted-foreground">
                  Worth <span className="font-medium text-foreground tabular-nums">&#x20C3; {totalBarterValue.toLocaleString()}</span> in total
                </p>
              </div>
            </div>
          </Section>

          {/* Deliverables (platform-specific) */}
          <DeliverablePicker value={deliverables} onChange={setDeliverables} />

          {/* Creative brief, tags, audience, visit, coupon */}
          <CampaignBriefSection value={brief} onChange={setBrief} />

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/superadmin/fa/campaigns")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim() || (!selfManaged && !selectedMerchantId) || (selfManaged && !selectedMerchantId && !clientName.trim()) || barterItems.every((i) => !i.name.trim())}>
              {submitting ? "Creating" : "Create the campaign"}
            </Button>
          </div>
        </FaPage>

        {/* Coupon upload prompt after a coupon-enabled campaign is created */}
        <CouponManagerDialog
          campaignId={couponCampaignId}
          campaignName={name}
          open={couponOpen}
          onOpenChange={(o) => {
            setCouponOpen(o)
            if (!o) router.push(`/superadmin/fa/campaigns/${couponCampaignId}`)
          }}
        />
      </SuperAdminInterface>
    </AuthGuard>
  )
}
