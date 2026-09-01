"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { CARD, PageHead } from "@/components/console/primitives"
import { FaPage, Nothing, Section, Step, TONE_BADGE, TONE_TEXT } from "../../_ui"
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
  ArrowLeft,
  ArrowRight,
  Building2,
  Wallet,
  Users,
  Calendar,
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
  Clock,
} from "lucide-react"
import Link from "next/link"
import { faCampaignApi, faPoolApi, faMerchantApi } from "@/services/faAdminApi"
import { SelfManagedToggle } from "@/components/superadmin/fa/SelfManagedToggle"
import { SelfManagedBranding } from "@/components/superadmin/fa/SelfManagedBranding"
import { toast } from "sonner"
import {
  CampaignBriefSection, DeliverablePicker, emptyBrief, buildBriefPayload, buildDeliverablePayload,
  validateBriefFulfilment,
  type BriefState, type DeliverableSpec, DELIVERABLE_OPTIONS,
} from "@/components/superadmin/fa/CampaignBriefFields"
import { CouponManagerDialog } from "@/components/superadmin/fa/CouponManagerDialog"

// ─── Types ──────────────────────────────────────────────────────────
interface PoolOption { id: string; pool_name: string; brand_user_id: string; available_cents: number; currency: string }
interface MerchantOption { id: string; name: string; category?: string; brand_user_id?: string | null; brand_name?: string | null; logo_url?: string; location_address?: string; gradient_start?: string; gradient_end?: string; status: string }

const TIERS = ["NANO", "MICRO", "MACRO", "MEGA"] as const
/* The four tiers carried five colour fields each — a border, a wash, a ring, an ink and a
   gradient, in four unrelated palette families. Nothing here is a state: a tier is a band
   of follower counts, and colouring it green or purple was decoration that also made the
   card look like it was warning about something. The icon and the range carry it. */
const TIER_CONFIG: Record<string, { icon: typeof Medal; label: string; range: string; description: string }> = {
  NANO:  { icon: Medal, label: "Nano",  range: "1K to 10K followers",   description: "Niche creators with small, close-knit audiences that actually listen." },
  MICRO: { icon: Award, label: "Micro", range: "10K to 100K followers", description: "Trusted voices with strong engagement and a loyal community." },
  MACRO: { icon: Star,  label: "Macro", range: "100K to 1M followers",  description: "Professional creators with broad reach across segments." },
  MEGA:  { icon: Crown, label: "Mega",  range: "1M or more followers",  description: "Household names with mass-market reach." },
}

export default function CreateCashbackCampaignPage() {
  const router = useRouter()

  // ─── Data sources ───────────────────────────────────────────────
  const [allPools, setAllPools] = useState<PoolOption[]>([])
  const [merchants, setMerchants] = useState<MerchantOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ─── Form state ─────────────────────────────────────────────────
  const [selectedMerchantId, setSelectedMerchantId] = useState("")
  const [selectedPoolId, setSelectedPoolId] = useState("")
  const [selfManaged, setSelfManaged] = useState(false)
  // Team-managed branding — optional override of the merchant logo creators would otherwise see.
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")

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
  const fmtAed = (cents: number) => `⃃ ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`

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
    // Cashback is always merchant-based: the claim is a receipt scanned AT a merchant.
    // Self-managed changes who owns the campaign, not where the scan happens.
    if (!selectedMerchantId) return toast.error("Select a merchant")
    // A self-managed campaign deliberately has no brand, so an unlinked merchant is
    // expected there rather than a misconfiguration.
    if (!selfManaged && !derivedBrandId) return toast.error("This merchant has no brand linked. Edit it in /superadmin/fa/merchants and assign a brand first.")
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
    const fulfilmentError = validateBriefFulfilment(brief)
    if (fulfilmentError) return toast.error(fulfilmentError)

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        // Omitted when self-managed — the backend force-clears it regardless, but sending
        // a brand id for a campaign that must have none is a contradiction worth not
        // putting on the wire.
        brand_user_id: selfManaged ? undefined : derivedBrandId,
        self_managed: selfManaged,
        brand_name: (selectedMerchant as any)?.brand_name || selectedMerchant?.name,
        merchant_id: selectedMerchantId,
        pool_id: selectedPoolId,
        cashback_percentage: cashbackPercentage,
        intent_only: intentOnly,
        deliverable_requirements: buildDeliverablePayload(deliverables),
        ...buildBriefPayload(brief),
      }
      if (tiersPayload) payload.cashback_tiers = tiersPayload
      // Only team-managed campaigns set their own branding; merchant campaigns inherit it.
      if (selfManaged) {
        if (brandLogoUrl) payload.brand_logo_url = brandLogoUrl
        if (heroImageUrl) payload.hero_image_url = heroImageUrl
      }
      if (description.trim()) payload.description = description.trim()
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (maxParticipants) payload.max_participants = parseInt(maxParticipants)

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
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <TooltipProvider>
          <FaPage className="mx-auto max-w-4xl pb-16">
            {/* ─── Header ──────────────────────────────────────── */}
            <div>
              <Link href="/superadmin/fa/campaigns" className="mb-ds-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />Back to campaigns
              </Link>
              <PageHead
                title="New cashback campaign"
                sub="Creators send people to the venue. A buyer scans the QR on their receipt and the pool pays the creator's cut on its own. Step 2 of 2."
                action={
                  <div className="hidden items-center gap-3 text-sm sm:flex">
                    <span className="text-muted-foreground tabular-nums">{completedSteps} of {totalSteps} done</span>
                    <Progress value={progressPct} className="h-2 w-32" />
                  </div>
                }
              />
            </div>

            {/* ─── Step 1: Merchant Selection ────────────────────── */}
            <Step
              n={1}
              title="Where it is redeemed"
              done={!!selectedMerchantId}
              description="Cashback is claimed off a receipt from one merchant. Pick the one this campaign runs at."
            >
              <SelfManagedToggle
                selfManaged={selfManaged}
                onSelfManagedChange={setSelfManaged}
                merchantSelected={!!selectedMerchantId}
                requiresMerchant
              />
              {selfManaged && (
                <SelfManagedBranding
                  brandLogoUrl={brandLogoUrl}
                  heroImageUrl={heroImageUrl}
                  onBrandLogoChange={setBrandLogoUrl}
                  onHeroImageChange={setHeroImageUrl}
                />
              )}
              <div className="grid grid-cols-1 gap-ds-2 sm:grid-cols-2 lg:grid-cols-3">
                {loadingData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`${CARD} animate-pulse bg-[var(--tone-neutral-wash)] p-ds-3`}>
                      <div className="mb-2 h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                      <div className="h-3 w-1/2 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                    </div>
                  ))
                ) : merchants.length === 0 ? (
                  <div className="space-y-ds-2 sm:col-span-2 lg:col-span-3">
                    <Nothing>No merchants exist yet, and cashback has to be redeemed at one.</Nothing>
                    <Link href="/superadmin/fa/merchants">
                      <Button variant="outline" size="sm">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add a merchant first
                      </Button>
                    </Link>
                  </div>
                ) : (
                  merchants.map((m) => {
                    const on = selectedMerchantId === m.id
                    return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      className={`${CARD} flex items-center gap-3 bg-[var(--tone-neutral-wash)] p-ds-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        on
                          ? "ring-2 ring-foreground/50"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                      }`}
                      onClick={() => setSelectedMerchantId(m.id)}
                    >
                        <div
                          className="h-10 w-10 shrink-0 overflow-hidden rounded-ds-md flex items-center justify-center bg-black/[0.06] dark:bg-white/[0.08]"
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
                            <p className="text-ds-caption font-medium truncate">{(m as any).brand_name}</p>
                          )}
                          <p className="truncate text-ds-caption text-muted-foreground">
                            {m.category || "—"}
                            {m.location_address ? ` · ${m.location_address}` : ""}
                          </p>
                          {!(m as any).brand_user_id && (
                            <Badge variant="outline" className={`mt-1 text-[9px] ${TONE_BADGE.bad}`}>No brand linked</Badge>
                          )}
                        </div>
                        {on && <Check className={`ml-auto h-5 w-5 shrink-0 ${TONE_TEXT.good}`} />}
                    </button>
                    )
                  })
                )}
              </div>
            </Step>

            {/* ─── Step 2: Pool Selection ───────────────────────── */}
            <Step
              n={2}
              title="What funds it"
              done={!!selectedPoolId}
              description="The client's pool the cashback is paid out of. An empty pool cannot pay anybody."
            >
              <div className="grid grid-cols-1 gap-ds-2 sm:grid-cols-2">
                {filteredPools.length === 0 && !loadingData ? (
                  <div className="sm:col-span-2">
                    <Nothing>This client has no funding pool yet.</Nothing>
                  </div>
                ) : (
                  filteredPools.map((p) => {
                    const bal = p.available_cents || 0
                    const isEmpty = bal <= 0
                    const on = selectedPoolId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          on ? "ring-2 ring-foreground/50" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                        }`}
                        onClick={() => setSelectedPoolId(p.id)}
                      >
                          <div className="mb-ds-2 flex items-start justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-ds-lg bg-black/[0.04] dark:bg-white/[0.07]">
                              <Wallet className="h-5 w-5 text-muted-foreground" />
                            </div>
                            {on && <Check className={`h-5 w-5 ${TONE_TEXT.good}`} />}
                          </div>
                          <p className="font-medium">{p.pool_name || "Default pool"}</p>
                          {/* The balance is the state here, and it is the only thing on the
                              card that gets colour: empty is a problem, funded is not. */}
                          <p className={`mt-1 text-2xl font-semibold tabular-nums ${isEmpty ? TONE_TEXT.bad : ""}`}>
                            {fmtAed(bal)}
                          </p>
                          {isEmpty && (
                            <Badge variant="outline" className={`mt-2 text-[10px] ${TONE_BADGE.bad}`}>Empty, needs a top-up</Badge>
                          )}
                      </button>
                    )
                  })
                )}
              </div>
            </Step>

            <Separator />

            {/* ─── Campaign Details ──────────────────────────────── */}
            <Step n={3} title="The campaign" description="The name creators see in the app, when it runs, and how many can join.">
              <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Campaign name *</Label>
                    <Input
                      placeholder="e.g. Summer Fashion Cashback"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What are we promoting</Label>
                    <Textarea
                      placeholder="A line or two creators will read in the app"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />Starts
                      </Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />Ends
                      </Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />How many creators at most
                      </Label>
                      <Input type="number" min={1} placeholder="No cap" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
                    </div>
                  </div>
              </div>
            </Step>

            {/* ─── Cashback Rates ────────────────────────────────── */}
            <Step n={4} title="The rate" description="What share of a receipt goes back to the creator.">
              {/* Default rate with big slider */}
              <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label>The rate everybody gets</Label>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tabular-nums">{cashbackPercentage}</span>
                      <span className="text-lg text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="mb-4 text-ds-caption text-muted-foreground">Applies to every tier unless you override it below</p>
                  <Slider
                    value={[cashbackPercentage]}
                    onValueChange={([v]: number[]) => setCashbackPercentage(v)}
                    min={1}
                    max={50}
                    step={0.5}
                    className="mb-2"
                  />
                  <div className="flex justify-between px-1 text-[10px] text-muted-foreground">
                    <span>1%</span>
                    <span>10%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
              </div>

              {/* Pre-approval required toggle (intent_only) */}
              <div>
                  <div className="flex items-center justify-between gap-ds-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-black/[0.04] dark:bg-white/[0.07]">
                        <Shield className="h-4.5 w-4.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-ds-label">Creators must be approved before they visit</p>
                        <p className="mt-0.5 text-ds-caption leading-snug text-muted-foreground">
                          They apply, the brand approves, and only then does their visit earn
                          cashback. Use it for hotels and restaurants, or anywhere the content
                          has to be shot during the visit.
                        </p>
                      </div>
                    </div>
                    <Switch checked={intentOnly} onCheckedChange={setIntentOnly} />
                  </div>
              </div>

              {/* Tiered rates */}
              <div>
                  <div className="mb-4 flex items-center justify-between gap-ds-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-black/[0.04] dark:bg-white/[0.07]">
                        <TrendingUp className="h-4.5 w-4.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-ds-label">Pay bigger creators a different rate</p>
                        <p className="text-ds-caption text-muted-foreground">One rate per tier instead of one rate for all</p>
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
                            className="relative rounded-ds-lg border border-black/[0.06] p-4 dark:border-white/[0.07]"
                          >
                            <div className="mb-3 flex items-start gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-black/[0.04] dark:bg-white/[0.07]">
                                <TierIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{cfg.label}</span>
                                  <span className="text-ds-overline uppercase text-muted-foreground">{tier}</span>
                                </div>
                                <p className="mt-0.5 text-ds-caption font-medium">{cfg.range}</p>
                                <p className="mt-0.5 text-ds-caption leading-snug text-muted-foreground">{cfg.description}</p>
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
                              <div className="flex min-w-[52px] items-baseline justify-end gap-0.5">
                                <span className="text-xl font-semibold tabular-nums">{cashbackTiers[tier]}</span>
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
            </Step>

            {/* ─── Deliverables (platform-specific) ──────────────── */}
            <Step n={5} title="What the creator posts" description="Pick the formats and how many of each.">
              <DeliverablePicker value={deliverables} onChange={setDeliverables} />
            </Step>

            {/* ─── Creative brief, tags, audience, visit, coupon ─── */}
            <CampaignBriefSection value={brief} onChange={setBrief} />

            {/* ─── Submit Bar ────────────────────────────────────── */}
            <div className={`${CARD} sticky bottom-4 flex items-center justify-between bg-[var(--tone-neutral-wash)] p-ds-3`}>
                <Button variant="ghost" asChild>
                  <Link href="/superadmin/fa/campaigns" className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />Cancel
                  </Link>
                </Button>
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                    <Progress value={progressPct} className="h-2 w-24" />
                    <span className="tabular-nums">{progressPct}%</span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || progressPct < 100}
                    size="lg"
                    className="min-w-[200px] gap-2"
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />Creating
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />Create the campaign
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
            </div>
          </FaPage>

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
