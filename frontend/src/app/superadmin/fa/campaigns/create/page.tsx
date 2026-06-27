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
import { faCampaignApi, faPoolApi, faMerchantApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import {
  CampaignBriefSection, DeliverablePicker, emptyBrief, buildBriefPayload, buildDeliverablePayload,
  type BriefState, type DeliverableSpec, DELIVERABLE_OPTIONS,
} from "@/components/superadmin/fa/CampaignBriefFields"
import { CouponManagerDialog } from "@/components/superadmin/fa/CouponManagerDialog"

// ─── Types ──────────────────────────────────────────────────────────
interface PoolOption { id: string; pool_name: string; brand_user_id: string; available_cents: number; currency: string }
interface MerchantOption { id: string; name: string; category?: string; brand_user_id?: string | null; brand_name?: string | null; logo_url?: string; location_address?: string; gradient_start?: string; gradient_end?: string; status: string }

const TIERS = ["NANO", "MICRO", "MACRO", "MEGA"] as const
const TIER_CONFIG: Record<string, { icon: typeof Medal; color: string; bg: string; border: string; ring: string; gradient: string; label: string; range: string; description: string }> = {
  NANO:  { icon: Medal, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800", ring: "ring-emerald-400", gradient: "from-emerald-500/10 to-emerald-600/5", label: "Nano",  range: "1K – 10K followers",   description: "Niche creators with highly authentic, close-knit audiences." },
  MICRO: { icon: Award, color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-950/50",       border: "border-blue-200 dark:border-blue-800",       ring: "ring-blue-400",    gradient: "from-blue-500/10 to-blue-600/5",       label: "Micro", range: "10K – 100K followers", description: "Trusted voices with strong engagement and loyal communities." },
  MACRO: { icon: Star,  color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/50",     border: "border-amber-200 dark:border-amber-800",     ring: "ring-amber-400",   gradient: "from-amber-500/10 to-amber-600/5",     label: "Macro", range: "100K – 1M followers",  description: "Professional creators offering broad reach across segments." },
  MEGA:  { icon: Crown, color: "text-purple-600 dark:text-purple-400",   bg: "bg-purple-50 dark:bg-purple-950/50",   border: "border-purple-200 dark:border-purple-800",   ring: "ring-purple-400",  gradient: "from-purple-500/10 to-purple-600/5",   label: "Mega",  range: "1M+ followers",        description: "Celebrity-level influencers with mass-market reach." },
}
const FOLLOWER_RANGES = ["1K-10K", "10K-50K", "50K-100K", "100K+"] as const
const ENGAGEMENT_RANGES = ["1-2%", "2-4%", "4-6%", "6%+"] as const

export default function CreateCashbackCampaignPage() {
  const router = useRouter()

  // ─── Data sources ───────────────────────────────────────────────
  const [allPools, setAllPools] = useState<PoolOption[]>([])
  const [merchants, setMerchants] = useState<MerchantOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ─── Form state ─────────────────────────────────────────────────
  const [selectedMerchantId, setSelectedMerchantId] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [cashbackPercentage, setCashbackPercentage] = useState(10)
  const [intentOnly, setIntentOnly] = useState(false)
  const [cashbackTiers, setCashbackTiers] = useState<Record<string, number>>({
    NANO: 5,
    MICRO: 10,
    MACRO: 15,
    MEGA: 20,
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

  // Deliverables (platform-specific)
  const [deliverables, setDeliverables] = useState<DeliverableSpec[]>([
    { ...DELIVERABLE_OPTIONS[0], quantity: 3 },
  ])

  // Creative brief + coupon
  const [brief, setBrief] = useState<BriefState>(emptyBrief)
  const [couponCampaignId, setCouponCampaignId] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // ─── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [poolRes, merchantRes] = await Promise.all([
          faPoolApi.listAll(),
          faMerchantApi.list(),
        ])
        const poolList = poolRes?.data?.pools || poolRes?.data || []
        setAllPools(Array.isArray(poolList) ? poolList : [])
        const merchantList = merchantRes?.data?.merchants || merchantRes?.merchants || []
        setMerchants(Array.isArray(merchantList) ? merchantList.filter((m: MerchantOption) => m.status !== "inactive") : [])
      } catch {
        toast.error("Failed to load form data")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // ─── Derived ────────────────────────────────────────────────────
  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)
  const derivedBrandId = (selectedMerchant as any)?.brand_user_id || ""
  const filteredPools = allPools.filter((p) => {
    if (!derivedBrandId) return true
    return p.brand_user_id === derivedBrandId
  })
  const selectedPool = allPools.find((p) => p.id === selectedPoolId)
  const fmtAed = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

  // Progress calculation
  const completedSteps = [
    !!selectedMerchantId,
    !!name.trim(),
    cashbackPercentage > 0,
    deliverables.length > 0,
  ].filter(Boolean).length
  const totalSteps = 4
  const progressPct = Math.round((completedSteps / totalSteps) * 100)

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Campaign name is required")
    if (!selectedMerchantId) return toast.error("Select a merchant")
    if (!derivedBrandId) return toast.error("This merchant has no brand linked. Edit it in /superadmin/fa/merchants and assign a brand first.")
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
    if (deliverables.length === 0) return toast.error("Pick at least one deliverable")
    if (brief.coupon_enabled && !brief.redemption_url.trim()) return toast.error("Add a redemption URL for the coupon, or turn coupons off")

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        brand_user_id: derivedBrandId,
        brand_name: (selectedMerchant as any)?.brand_name || selectedMerchant?.name,
        merchant_id: selectedMerchantId,
        pool_id: selectedPoolId,
        cashback_percentage: cashbackPercentage,
        intent_only: intentOnly,
        deliverable_requirements: buildDeliverablePayload(deliverables),
        ...buildBriefPayload(brief),
      }
      if (tiersPayload) payload.cashback_tiers = tiersPayload
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)
      if (minTier && minTier !== "any_tier") payload.min_tier = minTier
      if (minFollowers && minFollowers !== "any_followers") payload.min_followers_range = minFollowers
      if (minEngagement && minEngagement !== "any_engagement") payload.min_engagement_range = minEngagement

      const res = await faCampaignApi.createCashback(payload)
      const newId = res?.data?.id
      toast.success("Cashback campaign created!")
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

            {/* ─── Step 1: Merchant Selection ────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                <h2 className="text-lg font-semibold">Select Merchant</h2>
                {selectedMerchantId && <Check className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Cashback is redeemed at a specific merchant location. Pick the merchant this campaign applies to.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loadingData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-5">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                ) : merchants.length === 0 ? (
                  <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
                    <CardContent className="p-8 text-center space-y-3">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">No merchants yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create one before launching a cashback campaign.
                        </p>
                      </div>
                      <Link href="/superadmin/fa/merchants">
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Manage Merchants
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  merchants.map((m) => (
                    <Card
                      key={m.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMerchantId === m.id
                          ? "ring-2 ring-primary shadow-md border-primary/50"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedMerchantId(m.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                            selectedMerchantId === m.id ? "ring-2 ring-primary" : ""
                          }`}
                          style={
                            m.gradient_start && m.gradient_end
                              ? { background: `linear-gradient(135deg, ${m.gradient_start}, ${m.gradient_end})` }
                              : undefined
                          }
                        >
                          {m.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.logo_url} alt={m.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{m.name}</p>
                          {(m as any).brand_name && (
                            <p className="text-[11px] font-medium truncate">{(m as any).brand_name}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground truncate">
                            {m.category || "—"}
                            {m.location_address ? ` • ${m.location_address}` : ""}
                          </p>
                          {!(m as any).brand_user_id && (
                            <Badge variant="destructive" className="text-[9px] mt-1">No brand linked</Badge>
                          )}
                        </div>
                        {selectedMerchantId === m.id && (
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
                    onValueChange={([v]: number[]) => setCashbackPercentage(v)}
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

              {/* Pre-approval required toggle (intent_only) */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Shield className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Require pre-approval before visit</p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                          Creators must apply and get brand approval before their visit is eligible
                          for cashback. Recommended for hotels, restaurants, or campaigns where
                          content must be captured during the visit.
                        </p>
                      </div>
                    </div>
                    <Switch checked={intentOnly} onCheckedChange={setIntentOnly} />
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
                            <div className="flex items-start gap-2.5 mb-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-white dark:bg-black/20 shadow-sm shrink-0`}>
                                <TierIcon className={`h-4 w-4 ${cfg.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{tier}</span>
                                </div>
                                <p className="text-[11px] font-medium text-foreground/80 mt-0.5">{cfg.range}</p>
                                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{cfg.description}</p>
                              </div>
                            </div>
                            <div className="flex items-end gap-2">
                              <Slider
                                value={[cashbackTiers[tier]]}
                                onValueChange={([v]: number[]) => setCashbackTiers({ ...cashbackTiers, [tier]: v })}
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

            {/* ─── Deliverables (platform-specific) ──────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">5</div>
                <h2 className="text-lg font-semibold">Deliverable Requirements</h2>
              </div>
              <DeliverablePicker value={deliverables} onChange={setDeliverables} />
            </div>

            {/* ─── Creative brief, tags, audience, visit, coupon ─── */}
            <CampaignBriefSection value={brief} onChange={setBrief} />

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
                                    <TierIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                    <span className="font-medium">{cfg.label}</span>
                                    <span className="text-xs text-muted-foreground">({cfg.range})</span>
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

          <CouponManagerDialog
            campaignId={couponCampaignId}
            campaignName={name}
            open={couponOpen}
            onOpenChange={(o) => { setCouponOpen(o); if (!o) router.push("/superadmin/fa/campaigns") }}
          />
        </TooltipProvider>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
