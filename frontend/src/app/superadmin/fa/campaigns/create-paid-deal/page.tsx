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
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, Plus, Trash2, Coins, ChevronDown, Calendar, Users, Shield } from "lucide-react"
import { toast } from "sonner"
import { faCampaignApi } from "@/services/faAdminApi"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.following.ae"

export default function CreatePaidDealPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [allPools, setAllPools] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [payoutAed, setPayoutAed] = useState<number>(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [deliverables, setDeliverables] = useState([{ type: "IG Story", quantity: 1 }])
  const [minTier, setMinTier] = useState("")
  const [minFollowers, setMinFollowers] = useState("")
  const [minEngagement, setMinEngagement] = useState("")
  const [showEligibility, setShowEligibility] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = (tokenManager.getTokenSync() || localStorage.getItem("access_token")) || ""
        const [clientsRes, poolsRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/admin/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/v1/admin/fa/pools`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (clientsRes.ok) { const d = await clientsRes.json(); setClients(d.data?.clients || d.clients || []) }
        if (poolsRes.ok) { const d = await poolsRes.json(); setAllPools(d.data?.pools || d.pools || []) }
      } catch (err) {
        toast.error("Failed to load clients or pools")
      }
    }
    fetchData()
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const clientPools = allPools.filter((p) => selectedClient && (p.brand_user_id === selectedClient.brand_user_id || p.brand_user_id === selectedClient.id))

  const addDeliverable = (type = "") => setDeliverables([...deliverables, { type, quantity: 1 }])
  const removeDeliverable = (i: number) => setDeliverables(deliverables.filter((_, idx) => idx !== i))
  const updateDeliverable = (i: number, field: "type" | "quantity", value: string | number) => {
    const updated = [...deliverables]
    updated[i] = { ...updated[i], [field]: value }
    setDeliverables(updated)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    if (!selectedClientId) return toast.error("Select a client")
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return toast.error("End date must be after start date")
    if (payoutAed <= 0) return toast.error("Payout amount must be greater than 0")

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        brand_user_id: selectedClient?.brand_user_id || selectedClient?.id,
        brand_name: selectedClient?.company_name || selectedClient?.name,
        pool_id: selectedPoolId || undefined,
        payout_aed: payoutAed,
        deliverable_requirements: deliverables.filter((d) => d.type.trim()).map((d) => ({ type: d.type, quantity: d.quantity, deadline_days: 7 })),
      }
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)
      if (minTier && minTier !== "any_tier") payload.min_tier = minTier
      if (minFollowers && minFollowers !== "any_followers") payload.min_followers_range = minFollowers
      if (minEngagement && minEngagement !== "any_engagement") payload.min_engagement_range = minEngagement

      await faCampaignApi.createPaidDeal(payload)
      toast.success("Paid deal campaign created!")
      router.push("/superadmin/fa/campaigns")
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
          <div>
            <Link href="/superadmin/fa/campaigns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Campaigns
            </Link>
            <h1 className="text-3xl font-bold">Create Paid Deal Campaign</h1>
            <p className="text-muted-foreground mt-1">Set up a fixed-payout influencer campaign</p>
          </div>

          {/* Client Selection */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Select Client</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setSelectedPoolId("") }}>
                <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name || c.name} ({c.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClientId && clientPools.length > 0 && (
                <div className="mt-4">
                  <Label>Funding Pool (optional)</Label>
                  <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                    <SelectTrigger><SelectValue placeholder="Select pool..." /></SelectTrigger>
                    <SelectContent>
                      {clientPools.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name || p.id} — AED {((p.available_cents || 0) / 100).toLocaleString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Paid Collab 2026" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
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

          {/* Payout Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5" /> Payout per Participant</CardTitle>
              <CardDescription>Fixed AED amount paid to each participating influencer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Payout Amount (AED) *</Label>
                <Input type="number" min={1} value={payoutAed || ""} onChange={(e) => setPayoutAed(parseFloat(e.target.value) || 0)} placeholder="e.g., 500" />
                {payoutAed > 0 && (
                  <p className="text-sm text-muted-foreground">Each participant receives AED {payoutAed.toLocaleString()} upon completion</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader><CardTitle>Deliverable Requirements</CardTitle><CardDescription>What participants must deliver</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Select value={d.type} onValueChange={(v) => updateDeliverable(i, "type", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IG Story">IG Story</SelectItem>
                      <SelectItem value="IG Reel">IG Reel</SelectItem>
                      <SelectItem value="IG Post">IG Post</SelectItem>
                      <SelectItem value="IG Carousel">IG Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} className="w-20" value={d.quantity} onChange={(e) => updateDeliverable(i, "quantity", parseInt(e.target.value) || 1)} />
                  <Button variant="ghost" size="icon" onClick={() => removeDeliverable(i)} disabled={deliverables.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addDeliverable()}><Plus className="h-4 w-4 mr-1" /> Add Deliverable</Button>
            </CardContent>
          </Card>

          {/* Eligibility (collapsible) */}
          <Collapsible open={showEligibility} onOpenChange={setShowEligibility}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Shield className="h-5 w-5" /> Eligibility Criteria</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showEligibility ? "rotate-180" : ""}`} />
                  </CardTitle>
                  <CardDescription>Optional filters for who can participate</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
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
            <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !selectedClientId || payoutAed <= 0}>
              {submitting ? "Creating..." : "Create Paid Deal Campaign"}
            </Button>
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
