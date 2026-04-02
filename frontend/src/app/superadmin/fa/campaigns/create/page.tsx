"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Wallet,
  Users,
  Calendar,
  ChevronDown,
  Plus,
  Trash2,
  QrCode,
  Percent,
  TrendingUp,
  Shield,
  Camera,
  Video,
  Image as ImageIcon,
  Megaphone,
  Check,
  Sparkles,
  Info,
  Crown,
  Award,
  Medal,
  Star,
  UserCheck,
  Hash,
  Heart,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { faCampaignApi, faPoolApi, faClientApi } from "@/services/faAdminApi"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────
interface ClientOption { id: string; name: string; company_name: string; subscription_tier: string; brand_user_id?: string }
interface PoolOption { id: string; pool_name: string; brand_user_id: string; available_cents: number; currency: string }

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const
const TIER_CONFIG: Record<string, { icon: typeof Medal; color: string; bg: string; border: string; ring: string; gradient: string }> = {
  BRONZE: { icon: Medal, color: "text-amber-700 dark:text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-400", gradient: "from-amber-500/10 to-amber-600/5" },
  SILVER: { icon: Award, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-200 dark:border-slate-700", ring: "ring-slate-400", gradient: "from-slate-500/10 to-slate-600/5" },
  GOLD: { icon: Star, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/50", border: "border-yellow-200 dark:border-yellow-800", ring: "ring-yellow-400", gradient: "from-yellow-500/10 to-yellow-600/5" },
  PLATINUM: { icon: Crown, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50", border: "border-purple-200 dark:border-purple-800", ring: "ring-purple-400", gradient: "from-purple-500/10 to-purple-600/5" },
}
const FOLLOWER_RANGES = ["1K-10K", "10K-50K", "50K-100K", "100K+"] as const
const ENGAGEMENT_RANGES = ["1-2%", "2-4%", "4-6%", "6%+"] as const

const DELIVERABLE_PRESETS = [
  { type: "IG Story", icon: Camera, color: "text-pink-500" },
  { type: "IG Reel", icon: Video, color: "text-purple-500" },
  { type: "IG Post", icon: ImageIcon, color: "text-blue-500" },
  { type: "IG Carousel", icon: ImageIcon, color: "text-teal-500" },
]

export default function CreateCashbackCampaignPage() {
  const router = useRouter()

  // ─── Data sources ───────────────────────────────────────────────
  const [clients, setClients] = useState<ClientOption[]>([])
  const [allPools, setAllPools] = useState<PoolOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ─── Form state ─────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [cashbackPercentage, setCashbackPercentage] = useState(10)
  const [cashbackTiers, setCashbackTiers] = useState<Record<string, number>>({
    BRONZE: 5,
    SILVER: 10,
    GOLD: 15,
    PLATINUM: 20,
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
        const [clientRes, poolRes] = await Promise.all([
          faClientApi.list({ limit: 200 }),
          faPoolApi.listAll(),
        ])
        const clientList = clientRes?.clients || clientRes?.data?.clients || clientRes?.data || []
        setClients(Array.isArray(clientList) ? clientList : [])
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

  // ─── Derived ────────────────────────────────────────────────────
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const filteredPools = allPools.filter((p) => {
    if (!selectedClient) return true
    return p.brand_user_id === selectedClient.brand_user_id || p.brand_user_id === selectedClient.id
  })
  const selectedPool = allPools.find((p) => p.id === selectedPoolId)
  const fmtAed = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

  // Progress calculation
  const completedSteps = [
    !!selectedClientId,
    !!name.trim(),
    cashbackPercentage > 0,
    deliverables.some((d) => d.type.trim()),
  ].filter(Boolean).length
  const totalSteps = 4
  const progressPct = Math.round((completedSteps / totalSteps) * 100)

  // ─── Deliverable helpers ────────────────────────────────────────
  const addDeliverable = (type = "") => setDeliverables([...deliverables, { type, quantity: 1 }])
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
    // Pool is optional for testing
    if (cashbackPercentage <= 0 || cashbackPercentage > 100) return toast.error("Cashback % must be between 1 and 100")

    let tiersPayload: Record<string, number> | undefined
    if (useTieredRates) {
      tiersPayload = {}
      for (const tier of TIERS) {
        if (cashbackTiers[tier] > 0 && cashbackTiers[tier] <= 100) {
          tiersPayload[tier] = cashbackTiers[tier]
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
        brand_name: selectedClient?.company_name || selectedClient?.name,
        pool_id: selectedPoolId,
        cashback_percentage: cashbackPercentage,
        deliverable_requirements: validDeliverables.map((d) => ({ type: d.type, quantity: d.quantity, deadline_days: 7 })),
      }
      if (tiersPayload) payload.cashback_tiers = tiersPayload
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)
      if (minTier && minTier !== "any_tier") payload.min_tier = minTier
      if (minFollowers && minFollowers !== "any_followers") payload.min_followers_range = minFollowers
      if (minEngagement && minEngagement !== "any_engagement") payload.min_engagement_range = minEngagement

      await faCampaignApi.createCashback(payload)
      toast.success("Cashback campaign created!")
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
        <TooltipProvider>
          <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* ─── Header ──────────────────────────────────────── */}
            <div>
              <Link href="/superadmin/fa/campaigns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="h-4 w-4" />Back to Campaigns
              </Link>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    Create Cashback Campaign
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Set up a new cashback campaign with tiered rates for influencers
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{completedSteps}/{totalSteps} complete</span>
                  <Progress value={progressPct} className="w-32 h-2" />
                </div>
              </div>
            </div>

            {/* ─── Step 1: Client Selection ─────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                <h2 className="text-lg font-semibold">Select Client</h2>
                {selectedClientId && <Check className="h-5 w-5 text-green-500" />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loadingData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></CardContent></Card>
                  ))
                ) : (
                  clients.map((c) => (
                    <Card
                      key={c.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedClientId === c.id
                          ? "ring-2 ring-primary shadow-md border-primary/50"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => { setSelectedClientId(c.id); setSelectedPoolId("") }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedClientId === c.id ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.company_name || c.name}</p>
                          <Badge variant="secondary" className="text-[10px] mt-0.5">{c.subscription_tier}</Badge>
                        </div>
                        {selectedClientId === c.id && (
                          <Check className="h-5 w-5 text-primary ml-auto shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* ─── Step 2: Pool Selection ───────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                <h2 className="text-lg font-semibold">Funding Pool</h2>
                {selectedPoolId && <Check className="h-5 w-5 text-green-500" />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPools.length === 0 && !loadingData ? (
                  <Card className="sm:col-span-2 border-dashed">
                    <CardContent className="p-8 text-center">
                      <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No pools found for this client</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPools.map((p) => {
                    const bal = p.available_cents || 0
                    const isEmpty = bal <= 0
                    return (
                      <Card
                        key={p.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPoolId === p.id
                            ? "ring-2 ring-primary shadow-md border-primary/50"
                            : "hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedPoolId(p.id)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                              selectedPoolId === p.id ? "bg-primary text-primary-foreground" : isEmpty ? "bg-red-100 dark:bg-red-950" : "bg-green-100 dark:bg-green-950"
                            }`}>
                              <Wallet className="h-5 w-5" />
                            </div>
                            {selectedPoolId === p.id && <Check className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="font-medium">{p.pool_name || "Default Pool"}</p>
                          <p className={`text-2xl font-bold mt-1 ${isEmpty ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                            {fmtAed(bal)}
                          </p>
                          {isEmpty && (
                            <Badge variant="destructive" className="mt-2 text-[10px]">Empty — needs top-up</Badge>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* ─── Campaign Details ──────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                <h2 className="text-lg font-semibold">Campaign Details</h2>
              </div>
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Campaign Name *</Label>
                    <Input
                      placeholder="e.g. Summer Fashion Cashback"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-base h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      placeholder="What's this campaign about? (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />Start Date
                      </Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />End Date
                      </Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />Max Participants
                      </Label>
                      <Input type="number" min={1} placeholder="Unlimited" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Cashback Rates ────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">4</div>
                <h2 className="text-lg font-semibold">Cashback Rates</h2>
              </div>

              {/* Default rate with big slider */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-medium">Default Cashback Rate</Label>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tabular-nums">{cashbackPercentage}</span>
                      <span className="text-lg text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Applied to all tiers unless overridden below</p>
                  <Slider
                    value={[cashbackPercentage]}
                    onValueChange={([v]) => setCashbackPercentage(v)}
                    min={1}
                    max={50}
                    step={0.5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    <span>1%</span>
                    <span>10%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tiered rates */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-yellow-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Tiered Cashback Rates</p>
                        <p className="text-xs text-muted-foreground">Different rates for each influencer tier</p>
                      </div>
                    </div>
                    <Switch checked={useTieredRates} onCheckedChange={setUseTieredRates} />
                  </div>

                  {useTieredRates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {TIERS.map((tier) => {
                        const cfg = TIER_CONFIG[tier]
                        const TierIcon = cfg.icon
                        return (
                          <div
                            key={tier}
                            className={`relative rounded-xl border p-4 ${cfg.border} ${cfg.bg} bg-gradient-to-br ${cfg.gradient}`}
                          >
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white dark:bg-black/20 shadow-sm`}>
                                <TierIcon className={`h-4 w-4 ${cfg.color}`} />
                              </div>
                              <span className={`font-semibold text-sm ${cfg.color}`}>{tier}</span>
                            </div>
                            <div className="flex items-end gap-2">
                              <Slider
                                value={[cashbackTiers[tier]]}
                                onValueChange={([v]) => setCashbackTiers({ ...cashbackTiers, [tier]: v })}
                                min={0}
                                max={50}
                                step={0.5}
                                className="flex-1"
                              />
                              <div className="flex items-baseline gap-0.5 min-w-[52px] justify-end">
                                <span className="text-xl font-bold tabular-nums">{cashbackTiers[tier]}</span>
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ─── Deliverables ──────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">5</div>
                <h2 className="text-lg font-semibold">Deliverable Requirements</h2>
              </div>

              {/* Quick-add preset buttons */}
              <div className="flex flex-wrap gap-2">
                {DELIVERABLE_PRESETS.map((preset) => {
                  const Icon = preset.icon
                  const exists = deliverables.some((d) => d.type === preset.type)
                  return (
                    <Button
                      key={preset.type}
                      variant={exists ? "secondary" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        if (!exists) addDeliverable(preset.type)
                      }}
                      disabled={exists}
                    >
                      <Icon className={`h-3.5 w-3.5 ${exists ? "text-muted-foreground" : preset.color}`} />
                      {preset.type}
                      {exists && <Check className="h-3 w-3 ml-0.5" />}
                    </Button>
                  )
                })}
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  {deliverables.map((d, i) => {
                    const presetMatch = DELIVERABLE_PRESETS.find((p) => p.type === d.type)
                    const PresetIcon = presetMatch?.icon || Megaphone
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-background shrink-0`}>
                          <PresetIcon className={`h-4 w-4 ${presetMatch?.color || "text-muted-foreground"}`} />
                        </div>
                        <Input
                          placeholder="Deliverable type"
                          value={d.type}
                          onChange={(e) => updateDeliverable(i, "type", e.target.value)}
                          className="flex-1 h-9"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateDeliverable(i, "quantity", Math.max(1, d.quantity - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-semibold tabular-nums">{d.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateDeliverable(i, "quantity", d.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        {deliverables.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeDeliverable(i)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                  <Button variant="outline" size="sm" onClick={() => addDeliverable("")} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-1.5" />Add Custom Deliverable
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ─── Eligibility (Collapsible) ─────────────────────── */}
            <Collapsible open={showEligibility} onOpenChange={setShowEligibility}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                          <Shield className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Eligibility Criteria</CardTitle>
                          <CardDescription className="text-xs">Filter which influencers can participate</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showEligibility ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />Min Tier
                        </Label>
                        <Select value={minTier} onValueChange={setMinTier}>
                          <SelectTrigger><SelectValue placeholder="Any tier" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any_tier">Any tier</SelectItem>
                            {TIERS.map((t) => {
                              const cfg = TIER_CONFIG[t]
                              const TierIcon = cfg.icon
                              return (
                                <SelectItem key={t} value={t}>
                                  <span className="flex items-center gap-2">
                                    <TierIcon className={`h-3.5 w-3.5 ${cfg.color}`} />{t}
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />Min Followers
                        </Label>
                        <Select value={minFollowers} onValueChange={setMinFollowers}>
                          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any_followers">Any</SelectItem>
                            {FOLLOWER_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5 text-muted-foreground" />Min Engagement
                        </Label>
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
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* ─── Submit Bar ────────────────────────────────────── */}
            <Card className="sticky bottom-4 shadow-lg border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <Button variant="ghost" asChild>
                  <Link href="/superadmin/fa/campaigns" className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />Cancel
                  </Link>
                </Button>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <Progress value={progressPct} className="w-24 h-2" />
                    <span>{progressPct}%</span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || progressPct < 100}
                    size="lg"
                    className="gap-2 min-w-[200px]"
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />Create Campaign
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
