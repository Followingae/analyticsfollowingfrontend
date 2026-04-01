"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Building2,
  Store,
  Wallet,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  QrCode,
} from "lucide-react"
import Link from "next/link"
import { faCampaignApi, faMerchantApi, faPoolApi, faClientApi } from "@/services/faAdminApi"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────
interface ClientOption { id: string; name: string; company_name: string; subscription_tier: string; brand_user_id?: string }
interface MerchantOption { id: string; name: string; category: string }
interface PoolOption { id: string; pool_name: string; brand_user_id: string; available_cents: number; currency: string }

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const
const FOLLOWER_RANGES = ["1K-10K", "10K-50K", "50K-100K", "100K+"] as const
const ENGAGEMENT_RANGES = ["1-2%", "2-4%", "4-6%", "6%+"] as const

export default function CreateCashbackCampaignPage() {
  const router = useRouter()

  // ─── Data sources ───────────────────────────────────────────────
  const [clients, setClients] = useState<ClientOption[]>([])
  const [merchants, setMerchants] = useState<MerchantOption[]>([])
  const [allPools, setAllPools] = useState<PoolOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ─── Form state ─────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedMerchantId, setSelectedMerchantId] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [cashbackPercentage, setCashbackPercentage] = useState<string>("10")
  const [cashbackTiers, setCashbackTiers] = useState<Record<string, string>>({
    BRONZE: "",
    SILVER: "",
    GOLD: "",
    PLATINUM: "",
  })
  const [useTieredRates, setUseTieredRates] = useState(false)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")

  // Eligibility
  const [showEligibility, setShowEligibility] = useState(false)
  const [minTier, setMinTier] = useState("")
  const [minFollowers, setMinFollowers] = useState("")
  const [minEngagement, setMinEngagement] = useState("")

  // Deliverables
  const [deliverables, setDeliverables] = useState<{ type: string; quantity: number }[]>([
    { type: "IG Story", quantity: 3 },
  ])

  const [submitting, setSubmitting] = useState(false)

  // ─── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [clientRes, merchantRes, poolRes] = await Promise.all([
          faClientApi.list({ limit: 200 }),
          faMerchantApi.list(),
          faPoolApi.listAll(),
        ])
        // Clients
        const clientList = clientRes?.clients || clientRes?.data?.clients || clientRes?.data || []
        setClients(Array.isArray(clientList) ? clientList : [])

        // Merchants
        const merchantList = merchantRes?.data?.merchants || merchantRes?.data || []
        setMerchants(Array.isArray(merchantList) ? merchantList : [])

        // Pools
        const poolList = poolRes?.data?.pools || poolRes?.data || []
        setAllPools(Array.isArray(poolList) ? poolList : [])
      } catch {
        toast.error("Failed to load form data")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // ─── Derived values ─────────────────────────────────────────────
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const filteredPools = allPools.filter((p) => {
    if (!selectedClient) return true
    // Match pool to client's brand_user_id or team_id
    return p.brand_user_id === selectedClient.brand_user_id || p.brand_user_id === selectedClient.id
  })
  const selectedPool = allPools.find((p) => p.id === selectedPoolId)
  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)

  const fmtAed = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

  // ─── Deliverable helpers ────────────────────────────────────────
  const addDeliverable = () => setDeliverables([...deliverables, { type: "", quantity: 1 }])
  const removeDeliverable = (i: number) => setDeliverables(deliverables.filter((_, idx) => idx !== i))
  const updateDeliverable = (i: number, field: "type" | "quantity", value: string | number) => {
    const updated = [...deliverables]
    updated[i] = { ...updated[i], [field]: value }
    setDeliverables(updated)
  }

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    if (!selectedClientId) return toast.error("Select a client")
    if (!selectedMerchantId) return toast.error("Select a merchant")
    if (!selectedPoolId) return toast.error("Select a pool")

    const pct = parseFloat(cashbackPercentage)
    if (!pct || pct <= 0 || pct > 100) return toast.error("Cashback % must be between 1 and 100")

    // Build tiered rates if enabled
    let tiersPayload: Record<string, number> | undefined
    if (useTieredRates) {
      tiersPayload = {}
      for (const tier of TIERS) {
        const val = parseFloat(cashbackTiers[tier])
        if (val && val > 0 && val <= 100) {
          tiersPayload[tier] = val
        }
      }
      if (Object.keys(tiersPayload).length === 0) tiersPayload = undefined
    }

    const validDeliverables = deliverables.filter((d) => d.type.trim())

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        brand_user_id: selectedClient?.brand_user_id || selectedClient?.id,
        merchant_id: selectedMerchantId,
        pool_id: selectedPoolId,
        cashback_percentage: pct,
        deliverable_requirements: validDeliverables.map((d) => ({
          type: d.type,
          quantity: d.quantity,
          deadline_days: 7,
        })),
      }
      if (tiersPayload) payload.cashback_tiers = tiersPayload
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)
      if (minTier) payload.min_tier = minTier
      if (minFollowers) payload.min_followers_range = minFollowers
      if (minEngagement) payload.min_engagement_range = minEngagement

      await faCampaignApi.createCashback(payload)
      toast.success("Cashback campaign created!")
      router.push("/superadmin/fa/campaigns")
    } catch (e: any) {
      toast.error(e?.message || "Failed to create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div>
            <Link href="/superadmin/fa/campaigns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />Back to Campaigns
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <QrCode className="h-6 w-6 text-green-600" />
              Create Cashback Campaign
            </h1>
            <p className="text-muted-foreground text-sm">
              Set up a new cashback campaign with tiered rates for influencers
            </p>
          </div>

          {/* Section 1: Client + Merchant + Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Campaign Setup
              </CardTitle>
              <CardDescription>Select the client, merchant, and funding pool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div className="space-y-2">
                <Label>Client (Company) *</Label>
                <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setSelectedPoolId("") }}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading clients..." : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name || c.name} — {c.subscription_tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Merchant */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Merchant *
                </Label>
                <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading merchants..." : "Select a merchant"} />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pool */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Cashback Pool *
                </Label>
                <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder={filteredPools.length === 0 ? "No pools available" : "Select a pool"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPools.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.pool_name || "Default Pool"} — {fmtAed(p.available_cents || 0)} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPool && (
                  <div className={`text-sm px-3 py-2 rounded-md ${
                    (selectedPool.available_cents || 0) <= 0
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  }`}>
                    Pool Balance: <span className="font-semibold">{fmtAed(selectedPool.available_cents || 0)}</span>
                    {(selectedPool.available_cents || 0) <= 0 && " — Pool is empty, brand needs to top up"}
                  </div>
                )}
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input placeholder="e.g. Summer Fashion Cashback" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Optional campaign description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Cashback Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cashback Rates</CardTitle>
              <CardDescription>Set a flat rate or different rates per influencer tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default rate */}
              <div className="space-y-2">
                <Label>Default Cashback % *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={0.5}
                    value={cashbackPercentage}
                    onChange={(e) => setCashbackPercentage(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">% of transaction amount</span>
                </div>
              </div>

              {/* Tiered toggle */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={useTieredRates ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseTieredRates(!useTieredRates)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  {useTieredRates ? "Tiered Rates Enabled" : "Enable Tiered Rates"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Different cashback % per influencer tier (BRONZE, SILVER, GOLD, PLATINUM)
                </span>
              </div>

              {useTieredRates && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/50 border">
                  {TIERS.map((tier) => (
                    <div key={tier} className="flex items-center gap-2">
                      <Badge variant="outline" className="w-24 justify-center text-xs">{tier}</Badge>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder={`${cashbackPercentage}%`}
                        value={cashbackTiers[tier]}
                        onChange={(e) => setCashbackTiers({ ...cashbackTiers, [tier]: e.target.value })}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  ))}
                  <p className="col-span-2 text-xs text-muted-foreground mt-1">
                    Leave blank to use the default rate ({cashbackPercentage}%) for that tier
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Schedule + Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule & Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input type="number" min={1} placeholder="Unlimited" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Deliverable Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deliverable Requirements</CardTitle>
              <CardDescription>What content must influencers deliver?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    placeholder="e.g. IG Story, IG Reel, Post"
                    value={d.type}
                    onChange={(e) => updateDeliverable(i, "type", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Qty:</Label>
                    <Input
                      type="number"
                      min={1}
                      value={d.quantity}
                      onChange={(e) => updateDeliverable(i, "quantity", parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </div>
                  {deliverables.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeDeliverable(i)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDeliverable}>
                <Plus className="h-4 w-4 mr-1" />Add Deliverable
              </Button>
            </CardContent>
          </Card>

          {/* Section 5: Eligibility (collapsible) */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setShowEligibility(!showEligibility)}>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Eligibility Criteria
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </span>
                {showEligibility ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
            {showEligibility && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Min Tier</Label>
                    <Select value={minTier} onValueChange={setMinTier}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_tier">Any</SelectItem>
                        {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Followers</Label>
                    <Select value={minFollowers} onValueChange={setMinFollowers}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_followers">Any</SelectItem>
                        {FOLLOWER_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Engagement</Label>
                    <Select value={minEngagement} onValueChange={setMinEngagement}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_engagement">Any</SelectItem>
                        {ENGAGEMENT_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" asChild>
              <Link href="/superadmin/fa/campaigns">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create Cashback Campaign"}
            </Button>
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
