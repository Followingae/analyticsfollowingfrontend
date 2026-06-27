"use client"
import { tokenManager } from '@/utils/tokenManager'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, Plus, Trash2, Gift, ChevronDown, Calendar, Users, Shield } from "lucide-react"
import { toast } from "sonner"
import { faCampaignApi } from "@/services/faAdminApi"
import {
  CampaignBriefSection, DeliverablePicker, emptyBrief, buildBriefPayload, buildDeliverablePayload,
  type BriefState, type DeliverableSpec, DELIVERABLE_OPTIONS,
} from "@/components/superadmin/fa/CampaignBriefFields"
import { CouponManagerDialog } from "@/components/superadmin/fa/CouponManagerDialog"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

export default function CreateBarterPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [barterItems, setBarterItems] = useState([{ name: "", value_aed: 0, description: "" }])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [deliverables, setDeliverables] = useState<DeliverableSpec[]>([
    { ...DELIVERABLE_OPTIONS[0], quantity: 1 },
  ])
  const [minTier, setMinTier] = useState("")
  const [minFollowers, setMinFollowers] = useState("")
  const [minEngagement, setMinEngagement] = useState("")
  const [showEligibility, setShowEligibility] = useState(false)
  const [brief, setBrief] = useState<BriefState>(emptyBrief)
  const [submitting, setSubmitting] = useState(false)

  // After a coupon-enabled campaign is created, prompt to upload the codes.
  const [couponCampaignId, setCouponCampaignId] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = (tokenManager.getTokenSync() || localStorage.getItem("access_token")) || ""
        const res = await fetch(`${API_BASE}/api/v1/admin/clients`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) { const d = await res.json(); setClients(d.data?.clients || d.clients || []) }
      } catch (error) {
        console.error('Failed to fetch clients for barter campaign:', error)
      }
    }
    fetchClients()
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const addBarterItem = () => setBarterItems([...barterItems, { name: "", value_aed: 0, description: "" }])
  const removeBarterItem = (i: number) => setBarterItems(barterItems.filter((_, idx) => idx !== i))
  const updateBarterItem = (i: number, field: string, value: any) => {
    const updated = [...barterItems]
    updated[i] = { ...updated[i], [field]: value }
    setBarterItems(updated)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    if (!selectedClientId) return toast.error("Select a client")
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return toast.error("End date must be after start date")
    const validItems = barterItems.filter((item) => item.name.trim())
    if (validItems.length === 0) return toast.error("Add at least one barter item")
    if (deliverables.length === 0) return toast.error("Pick at least one deliverable")
    if (brief.coupon_enabled && !brief.redemption_url.trim()) return toast.error("Add a redemption URL for the coupon, or turn coupons off")

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        brand_user_id: selectedClient?.brand_user_id || selectedClient?.id,
        brand_name: selectedClient?.company_name || selectedClient?.name,
        barter_items: validItems.map((item) => ({
          name: item.name.trim(),
          // Mobile reads `value_aed` — keep both keys so old + new readers agree.
          value_aed: item.value_aed || 0,
          estimated_value_aed: item.value_aed || 0,
          description: item.description.trim() || undefined,
        })),
        deliverable_requirements: buildDeliverablePayload(deliverables),
        ...buildBriefPayload(brief),
      }
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)
      if (minTier && minTier !== "any_tier") payload.min_tier = minTier
      if (minFollowers && minFollowers !== "any_followers") payload.min_followers_range = minFollowers
      if (minEngagement && minEngagement !== "any_engagement") payload.min_engagement_range = minEngagement

      const res = await faCampaignApi.createBarter(payload)
      const newId = res?.data?.id
      toast.success("Barter campaign created!")
      // If coupons are enabled, stay and prompt to upload the code pool.
      if (brief.coupon_enabled && newId) {
        setCouponCampaignId(newId)
        setCouponOpen(true)
      } else {
        router.push("/superadmin/fa/campaigns")
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  const totalBarterValue = barterItems.reduce((sum, item) => sum + (item.value_aed || 0), 0)

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
          <div>
            <Link href="/superadmin/fa/campaigns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Campaigns
            </Link>
            <h1 className="text-3xl font-bold">Create Barter Campaign</h1>
            <p className="text-muted-foreground mt-1">Set up a campaign where influencers receive products/services (or a discount code) in exchange for content</p>
          </div>

          {/* Client Selection */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Select Client</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name || c.name} ({c.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Thai Fire Edit" />
              </div>
              <div className="space-y-2">
                <Label>What are we promoting?</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Campaign description..." />
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
                <Label>Max Participants</Label>
                <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Leave empty for unlimited" />
              </div>
            </CardContent>
          </Card>

          {/* Barter Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Barter Items</CardTitle>
              <CardDescription>Products, services, or a discount value offered in exchange for content. Total value: AED {totalBarterValue.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {barterItems.map((item, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
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
              <Button variant="outline" size="sm" onClick={addBarterItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
            </CardContent>
          </Card>

          {/* Deliverables (platform-specific) */}
          <DeliverablePicker value={deliverables} onChange={setDeliverables} />

          {/* Creative brief, tags, audience, visit, coupon */}
          <CampaignBriefSection value={brief} onChange={setBrief} />

          {/* Eligibility (real filters) */}
          <Collapsible open={showEligibility} onOpenChange={setShowEligibility}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Shield className="h-5 w-5" /> Eligibility Filters</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showEligibility ? "rotate-180" : ""}`} />
                  </CardTitle>
                  <CardDescription>Restrict who can apply (tier / followers / engagement).</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Min Tier</Label>
                      <Select value={minTier} onValueChange={setMinTier}>
                        <SelectTrigger><SelectValue placeholder="Any tier" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any_tier">Any tier</SelectItem>
                          <SelectItem value="NANO">Nano (1K – 10K)</SelectItem>
                          <SelectItem value="MICRO">Micro (10K – 100K)</SelectItem>
                          <SelectItem value="MACRO">Macro (100K – 1M)</SelectItem>
                          <SelectItem value="MEGA">Mega (1M+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Followers</Label>
                      <Select value={minFollowers} onValueChange={setMinFollowers}>
                        <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any_followers">Any</SelectItem>
                          <SelectItem value="1k-5k">1K-5K</SelectItem>
                          <SelectItem value="5k-10k">5K-10K</SelectItem>
                          <SelectItem value="10k-50k">10K-50K</SelectItem>
                          <SelectItem value="50k+">50K+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Engagement</Label>
                      <Select value={minEngagement} onValueChange={setMinEngagement}>
                        <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any_engagement">Any</SelectItem>
                          <SelectItem value="1-3%">1-3%</SelectItem>
                          <SelectItem value="3-5%">3-5%</SelectItem>
                          <SelectItem value="5%+">5%+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/superadmin/fa/campaigns")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !selectedClientId || barterItems.every((i) => !i.name.trim())}>
              {submitting ? "Creating..." : "Create Barter Campaign"}
            </Button>
          </div>
        </div>

        {/* Coupon upload prompt after a coupon-enabled campaign is created */}
        <CouponManagerDialog
          campaignId={couponCampaignId}
          campaignName={name}
          open={couponOpen}
          onOpenChange={(o) => {
            setCouponOpen(o)
            if (!o) router.push("/superadmin/fa/campaigns")
          }}
        />
      </SuperAdminInterface>
    </AuthGuard>
  )
}
