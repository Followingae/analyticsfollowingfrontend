"use client"

import { Suspense, useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { FirstPartyAudienceAnalytics } from "@/components/analytics/FirstPartyAudienceAnalytics"
import { CARD, PageHead } from "@/components/console/primitives"
import {
  FaPage, Failed, Loading, Nothing, TIER_BADGE, TONE_BADGE, TONE_TEXT, figure, type Tone,
} from "../_ui"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Check,
  X,
  Users,
  Clock,
  ShieldCheck,
  ShieldX,
  Instagram,
  Mail,
  Phone,
  AlertTriangle,
  Star,
  Tag,
  Search,
  ArrowDownUp,
  Sparkles,
  Loader2,
  Brain,
  Eye,
  Heart,
  BarChart3,
  CalendarDays,
  ExternalLink,
  Trash2,
  Globe2,
  Wallet,
  RefreshCcw,
  Megaphone,
  QrCode,
  Coins,
  Gift,
  Hourglass,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { faMemberApi, faMemberCampaignsApi } from "@/services/faAdminApi"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface FAMemberAnalytics {
  profile_id: string
  influence_score: number
  data_quality_score: number
  ai_content_quality_score: number
  ai_avg_sentiment_score: number
  ai_top_3_categories: Array<{ category: string; percentage: number; confidence: number }>
  ai_fraud_detection: any
  ai_audience_quality: any
  ai_audience_insights: any
  ai_behavioral_patterns: any
  ai_content_distribution: Record<string, number>
  ai_language_distribution: Record<string, number>
  ai_profile_analyzed_at: string | null
  posts_count: number
  following_count: number
}

interface FAMember {
  id: string
  full_name: string
  phone: string
  email: string
  gender: string
  instagram_username: string
  instagram_profile_pic: string | null
  instagram_bio: string | null
  followers_count: number
  followers_range: string
  engagement_rate: number
  engagement_range: string
  posts_count: number
  following_count: number
  content_niche: string[]
  tier: string
  verified: boolean
  eligible: boolean
  fraud_score: number
  audience_quality_score: number
  is_approved: number
  campaigns_participated: number
  status: string
  created_at: string
  analytics?: FAMemberAnalytics | null
  // Instagram OAuth health (critical for an OAuth-only product)
  instagram_oauth_verified?: boolean
  instagram_account_type?: string | null
  instagram_oauth_connected_at?: string | null
  instagram_token_expires_at?: string | null
  instagram_last_refresh_at?: string | null
  instagram_refresh_failures?: number
  needs_reconnect?: boolean
  analytics_status?: "pending" | "processing" | "complete" | "failed" | null
  instagram_audience_demographics?: InstagramAudienceDemographics | null
  instagram_insights?: InstagramInsights | null
  instagram_audience_fetched_at?: string | null
  analytics_source?: string | null
}

interface InstagramAudienceDemographics {
  gender_distribution?: Record<string, number>
  age_distribution?: Record<string, number>
  location_distribution?: Record<string, number>
  sample_size?: number | null
  confidence_score?: number | null
  analysis_method?: string | null
}

interface InstagramInsights {
  reach?: number | null
  impressions?: number | null
  profile_views?: number | null
  accounts_engaged?: number | null
  total_interactions?: number | null
  period?: string | null
}

type SortOption = "followers" | "engagement" | "newest" | "fraud"

// ─── Constants ──────────────────────────────────────────────────────────────

/* Tier was violet / amber / blue / emerald: four unrelated hues for four points on one
   scale, which read as four states rather than four sizes. TIER_BADGE is that scale in
   one neutral, shading up as the tier goes up. */

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

// scoreColor / scoreBg removed with the fraud panel they used to paint. Both were
// unreferenced, and both were another set of hand-picked reds and greens for a number
// (fraud_score) that is 0.0 for every member on the platform.

// getFraudRiskLevel / getAudienceQualityLabel removed. Both read profiles.ai_* columns
// that no longer have a writer — the analyzers behind them were deleted in July after
// it turned out they produced fabricated output (a 130% audience gender split) or
// never ran at all. With the columns empty, getFraudRiskLevel fell through to
// fraud_score, which is 0.0 for all 118 members, and would have labelled every single
// creator a confident green "Low" risk; getAudienceQualityLabel would have rendered
// "0%" for everyone. Neither result was ever rendered — both were computed into unused
// variables — but leaving them was an invitation to wire them up.
//
// If a real fraud signal is ever wanted, it has to be measured, not derived from a
// column nothing writes.

// ─── Member Card ────────────────────────────────────────────────────────────

function tokenDaysLeft(iso?: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

const ANALYTICS_STATUS_TONE: Record<string, Tone> = {
  complete: "good",
  processing: "info",
  pending: "warn",
  failed: "bad",
}

/** Instagram OAuth health badges. An admin must see token validity before approving. */
function OAuthHealthBadges({ m }: { m: Partial<FAMember> }) {
  const days = tokenDaysLeft(m.instagram_token_expires_at)
  const tokenWarn = days != null && days < 7
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {m.instagram_oauth_verified && !m.needs_reconnect ? (
        <Badge variant="outline" className={`px-1.5 text-[10px] ${TONE_BADGE.good}`}>
          <ShieldCheck className="mr-1 h-3 w-3" />Instagram connected
        </Badge>
      ) : (
        <Badge variant="outline" className={`px-1.5 text-[10px] ${TONE_BADGE.bad}`}>
          <ShieldX className="mr-1 h-3 w-3" />{m.needs_reconnect ? "Needs to reconnect" : "Not connected"}
        </Badge>
      )}
      {m.instagram_account_type && (
        <Badge variant="outline" className={`px-1.5 text-[10px] capitalize ${TONE_BADGE.neutral}`}>
          {m.instagram_account_type.toLowerCase()}
        </Badge>
      )}
      {days != null && (
        <Badge
          variant="outline"
          className={`px-1.5 text-[10px] ${tokenWarn ? TONE_BADGE.warn : TONE_BADGE.neutral}`}
        >
          <Clock className="mr-1 h-3 w-3" />
          {days < 0 ? `Token expired ${Math.abs(days)}d ago` : `Token expires in ${days}d`}
        </Badge>
      )}
      {(m.instagram_refresh_failures ?? 0) > 0 && (
        <Badge variant="outline" className={`px-1.5 text-[10px] ${TONE_BADGE.warn}`}>
          <RefreshCcw className="mr-1 h-3 w-3" />{m.instagram_refresh_failures} failed refreshes
        </Badge>
      )}
      {m.analytics_status && (
        <Badge variant="outline" className={`px-1.5 text-[10px] capitalize ${TONE_BADGE[ANALYTICS_STATUS_TONE[m.analytics_status] ?? "neutral"]}`}>
          <Sparkles className="mr-1 h-3 w-3" />Analytics {m.analytics_status}
        </Badge>
      )}
    </div>
  )
}

// DistroBars and its pct() helper removed: neither was ever rendered. The demographics
// they were written for are drawn by FirstPartyAudienceAnalytics, which is what both the
// member card and the detail sheet actually call.

// ─── Member campaigns (per-member participation) ─────────────────────────────

interface MemberCampaign {
  campaign_id: string | null
  campaign_name: string | null
  brand_name: string | null
  campaign_type: string | null
  campaign_status: string | null
  participant_status: string | null
  participation_type: string | null
  source: string | null
  joined_at: string | null
  last_event_at: string | null
}

/* Type is a fact, not a state, so it is neutral and its icon does the telling. */
const CAMPAIGN_TYPE_META: Record<string, { label: string; icon: any }> = {
  cashback:  { label: "Cashback",  icon: QrCode },
  paid_deal: { label: "Paid deal", icon: Coins },
  barter:    { label: "Barter",    icon: Gift },
}

const PARTICIPANT_STATUS_TONE: Record<string, Tone> = {
  pending_brand_approval: "warn",
  brand_rejected: "bad",
  accepted: "good",
  active: "good",
  completed: "info",
  declined_by_creator: "neutral",
  cancelled: "neutral",
}

function prettyStatus(s?: string | null): string {
  if (!s) return "—"
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function MemberCampaignsSection({ memberId, fallbackCount }: { memberId: string; fallbackCount: number }) {
  const [data, setData] = useState<{ total: number; types: string[]; campaigns: MemberCampaign[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    faMemberCampaignsApi
      .list(memberId)
      .then((res) => {
        if (!active) return
        const payload = res?.data ?? res
        if (payload && Array.isArray(payload.campaigns)) setData(payload)
        else setUnavailable(true)
      })
      .catch(() => { if (active) setUnavailable(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [memberId])

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Megaphone className="h-3.5 w-3.5" />Campaigns participated
        <Badge variant="secondary" className="ml-1 text-[10px]">{data?.total ?? fallbackCount}</Badge>
      </h4>

      {/* Distinct campaign types */}
      {data && data.types.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {data.types.map((t) => {
            const cfg = CAMPAIGN_TYPE_META[t] || { label: t, icon: Megaphone }
            const Icon = cfg.icon
            return (
              <Badge key={t} variant="outline" className={`text-[10px] ${TONE_BADGE.neutral}`}>
                <Icon className="h-3 w-3 mr-1" />{cfg.label}
              </Badge>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading campaigns…
        </div>
      ) : unavailable ? (
        <p className="text-xs text-muted-foreground">
          {fallbackCount > 0
            ? `Participated in ${fallbackCount} campaign${fallbackCount === 1 ? "" : "s"}. Per-campaign breakdown unavailable.`
            : "No campaign participation yet."}
        </p>
      ) : !data || data.campaigns.length === 0 ? (
        <p className="text-xs text-muted-foreground">No campaign participation yet.</p>
      ) : (
        <div className="space-y-2">
          {data.campaigns.map((c, i) => {
            const cfg = CAMPAIGN_TYPE_META[c.campaign_type || ""] || { label: c.campaign_type || "Campaign", icon: Megaphone }
            const Icon = cfg.icon
            const row = (
              <div className="flex items-center gap-3 rounded-ds-md border border-black/[0.06] px-3 py-2 dark:border-white/[0.07]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-sm bg-black/[0.04] dark:bg-white/[0.07]">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.campaign_name || "Untitled campaign"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[cfg.label, c.brand_name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] capitalize ${TONE_BADGE[PARTICIPANT_STATUS_TONE[c.participant_status || ""] ?? "neutral"]}`}
                >
                  {prettyStatus(c.participant_status)}
                </Badge>
              </div>
            )
            return c.campaign_id ? (
              <a key={c.campaign_id + i} href={`/campaigns/${c.campaign_id}/posts`} className="block transition-opacity hover:opacity-80">
                {row}
              </a>
            ) : (
              <div key={(c.campaign_name || "c") + i}>{row}</div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** Full member detail (campaigns, OAuth health, wallet, first-party demographics,
 *  insights) in a large side Sheet so the analytics lay out properly. */
function MemberDetailSheet({ memberId, name, campaignsCount }: { memberId: string; name: string; campaignsCount: number }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || data) return
    setLoading(true)
    faMemberApi
      .get(memberId)
      .then((res) => setData(res?.data ?? res))
      .catch(() => toast.error("Failed to load member detail"))
      .finally(() => setLoading(false))
  }, [open, data, memberId])

  const demo: InstagramAudienceDemographics | null = data?.instagram_audience_demographics
  const insights: InstagramInsights | null = data?.instagram_insights
  const wallet = data?.wallet

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5 mr-1" />Details
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>Member detail</SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {loading || !data ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-6">
              <MemberCampaignsSection memberId={memberId} fallbackCount={campaignsCount} />

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Instagram connection</h4>
                <OAuthHealthBadges m={data} />
              </section>

              {wallet && (
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />Wallet ({wallet.currency || "AED"})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Available</p>
                      <p className="text-sm font-bold">{formatNumber(wallet.balance_available)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Earned</p>
                      <p className="text-sm font-bold">{formatNumber(wallet.total_earned)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Withdrawn</p>
                      <p className="text-sm font-bold">{formatNumber(wallet.total_withdrawn)}</p>
                    </div>
                  </div>
                </section>
              )}

              <FirstPartyAudienceAnalytics
                demographics={demo}
                insights={insights}
                fetchedAt={(data as any)?.instagram_audience_fetched_at ?? null}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MemberCard({ member, onAction, selected, onToggleSelect }: {
  member: FAMember
  onAction: () => void
  /** When onToggleSelect is provided the card becomes multi-select capable. */
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const [acting, setActing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const analytics = member.analytics
  const approvalStatus = member.is_approved === 1 ? "approved" : member.is_approved === 2 ? "rejected" : "pending"

  // Eligibility display: the backend `eligible` flag is set at signup BEFORE engagement
  // is known (engagement defaults to 0, so the signup check always yields false) and is
  // only corrected once stats are refreshed. So never contradict an approval decision —
  // an approved member is eligible by definition — and otherwise derive eligibility from
  // the member's actual current metrics rather than the stale signup-time flag.
  // Mirrors fa_auth_service.check_eligible(followers, engagement). The `fraud_score
  // < 0.3` term was dropped from the backend in July: fraud_score was 0.0 for every
  // member, so the term was always true and never once changed an outcome. Keeping it
  // here made the frontend gate disagree with the backend's on paper while agreeing by
  // accident.
  const isEligible =
    member.is_approved === 1 ||
    member.eligible ||
    ((member.followers_count ?? 0) >= 1000 && (member.engagement_rate ?? 0) >= 1.0)
  const joinDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "-"

  // Content categories: prefer analytics AI categories, fall back to content_niche
  const categories = analytics?.ai_top_3_categories && analytics.ai_top_3_categories.length > 0
    ? analytics.ai_top_3_categories
    : member.content_niche?.map(n => ({ category: n, percentage: 0, confidence: 0 })) || []

  const handleApprove = async () => {
    setActing(true)
    try {
      await faMemberApi.approve(member.id)
      toast.success(`${member.full_name} approved`)
      onAction()
    } catch {
      toast.error("Failed to approve")
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    setActing(true)
    try {
      await faMemberApi.reject(member.id, rejectReason || undefined)
      toast.success(`${member.full_name} rejected`)
      setRejectMode(false)
      setRejectReason("")
      onAction()
    } catch {
      toast.error("Failed to reject")
    } finally {
      setActing(false)
    }
  }

  const handleDelete = async () => {
    setActing(true)
    try {
      await faMemberApi.deletePermanently(member.id)
      toast.success(`${member.full_name} permanently deleted`)
      onAction()
    } catch {
      toast.error("Failed to delete member")
    } finally {
      setActing(false)
      setDeleteConfirm(false)
    }
  }

  const handleRunAnalytics = async () => {
    setAnalyzing(true)
    try {
      // Endpoint runs synchronously (refreshes follower/engagement/tier stats +
      // first-party Instagram analytics), so the data is ready once it resolves.
      const res = await faMemberApi.triggerAnalytics(member.id)
      if (res && res.success === false) {
        throw new Error(res.message || res.detail || "Analytics failed")
      }
      toast.success(`Analytics refreshed for ${member.full_name}`)
      onAction()
    } catch (e: any) {
      toast.error(e?.message || "Failed to run analytics")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className={`${CARD} overflow-hidden bg-[var(--tone-neutral-wash)]`}>
      <div>
        <div className="p-5 space-y-4">
          {/* ─── Row 1: Avatar + Identity + Actions ─── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {onToggleSelect && (
                <Checkbox
                  className="mt-6 shrink-0"
                  checked={!!selected}
                  onCheckedChange={() => onToggleSelect(member.id)}
                  aria-label={`Select ${member.full_name}`}
                />
              )}
              {/* Large Avatar */}
              <Avatar className="h-16 w-16 shrink-0 border-2 border-muted">
                <AvatarImage src={member.instagram_profile_pic || undefined} alt={member.full_name} referrerPolicy="no-referrer" />
                <AvatarFallback className="text-lg font-semibold bg-primary/5">
                  {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base leading-tight">{member.full_name}</h3>
                  <Badge variant="outline" className={`px-2 text-[11px] ${TIER_BADGE[member.tier] || TONE_BADGE.neutral}`}>
                    {member.tier}
                  </Badge>
                  {member.verified && (
                    <Badge variant="outline" className={`px-1.5 text-[10px] ${TONE_BADGE.neutral}`}>Verified on Instagram</Badge>
                  )}
                  {!isEligible && (
                    <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${TONE_BADGE.warn}`}>Below our bar</Badge>
                  )}
                </div>
                <a
                  href={`https://instagram.com/${member.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span className="font-medium">@{member.instagram_username}</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
                {member.instagram_bio && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 max-w-lg leading-relaxed italic">
                    &ldquo;{member.instagram_bio}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {approvalStatus === "pending" && !rejectMode && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectMode(true)}
                    disabled={acting}
                    className={TONE_TEXT.bad}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={acting}
                    
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {approvalStatus === "approved" && !deleteConfirm && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={TONE_BADGE.good}>
                    <ShieldCheck className="h-3 w-3 mr-1" />Approved
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRunAnalytics}
                    disabled={analyzing || member.analytics_status === "processing"}
                    className="h-7 px-2 text-xs"
                    title="Run Creator Analytics on this member's Instagram"
                  >
                    <Sparkles className={`h-3.5 w-3.5 mr-1 ${analyzing ? "animate-pulse" : ""}`} />
                    {analyzing || member.analytics_status === "processing" ? "Analyzing…" : "Run Analytics"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(true)}
                    className={`h-7 px-2 ${TONE_TEXT.bad}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {approvalStatus === "approved" && deleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${TONE_TEXT.bad}`}>Delete them for good?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={acting}
                    className="h-7 px-2 text-xs"
                  >
                    {acting ? "Deleting..." : "Yes, Delete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {approvalStatus === "rejected" && !deleteConfirm && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={TONE_BADGE.bad}>
                    <ShieldX className="h-3 w-3 mr-1" />Rejected
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(true)}
                    className={`h-7 px-2 ${TONE_TEXT.bad}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {approvalStatus === "rejected" && deleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${TONE_TEXT.bad}`}>Delete them for good?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={acting}
                    className="h-7 px-2 text-xs"
                  >
                    {acting ? "Deleting..." : "Yes, Delete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Row 1.5: Instagram connection health ─── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <OAuthHealthBadges m={member} />
            <MemberDetailSheet memberId={member.id} name={member.full_name} campaignsCount={member.campaigns_participated} />
          </div>

          {/* ─── Rejection reason input (inline) ─── */}
          {rejectMode && (
            <div className={`flex items-center gap-2 rounded-ds-md p-3 ${TONE_BADGE.bad}`}>
              <Input
                placeholder="Rejection reason (optional)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-8 flex-1 bg-background text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={acting}
                className="shrink-0"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setRejectMode(false); setRejectReason("") }}
                className="shrink-0"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* ─── Row 2: Core Stats ─── */}
          {/* Four figures that were four tinted tiles. The tiles said nothing the row had
              not already said; the gap between them does the grouping now.

              Engagement read `member.engagement_rate ?? 0`, so a creator whose scrape
              never produced a rate was shown a confident "0%" — which on this screen is a
              reason to reject somebody. A rate we do not hold is a dash. */}
          <div className="grid grid-cols-2 gap-x-ds-4 gap-y-ds-3 sm:grid-cols-4">
            <div>
              <p className="text-ds-overline uppercase text-muted-foreground">Followers</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(member.followers_count)}</p>
              <p className="text-ds-caption text-muted-foreground">{member.followers_range}</p>
            </div>
            <div>
              <p className="text-ds-overline uppercase text-muted-foreground">Engagement</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {member.engagement_rate == null ? "—" : `${member.engagement_rate}%`}
              </p>
              <p className="text-ds-caption text-muted-foreground">
                {member.engagement_rate == null ? "Not measured yet" : member.engagement_range}
              </p>
            </div>
            <div>
              <p className="text-ds-overline uppercase text-muted-foreground">Posts</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(member.posts_count || analytics?.posts_count)}</p>
            </div>
            <div>
              <p className="text-ds-overline uppercase text-muted-foreground">Following</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(member.following_count || analytics?.following_count)}</p>
            </div>
          </div>

          {/* ─── Row 3: Content Categories ─── */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
              {categories.map((cat, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[11px] font-medium bg-primary/5 border-primary/15"
                >
                  {cat.category}
                  {cat.percentage > 0 && (
                    <span className="ml-1 text-muted-foreground">{Math.round(cat.percentage)}%</span>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* ─── Row 4: First-party Instagram audience (FA members' analytics) ─── */}
          <FirstPartyAudienceAnalytics
            variant="preview"
            demographics={member.instagram_audience_demographics}
            insights={member.instagram_insights}
            fetchedAt={member.instagram_audience_fetched_at}
          />

          {/* ─── Row 5: Contact & Meta ─── */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-1 border-t">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />{member.phone}
            </span>
            {member.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" />{member.email}
              </span>
            )}
            {member.gender && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3" />{member.gender}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3" />{member.campaigns_participated} campaigns
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />Joined {joinDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type MemberTab = "pending" | "approved" | "rejected" | "incomplete"
const MEMBER_TABS: MemberTab[] = ["pending", "approved", "rejected", "incomplete"]

/**
 * Every tile and alert that sent someone here meant a particular queue and none of them
 * could say so, so the roster always opened on Pending — including the links that counted
 * something else entirely.
 */
export default function FAMembersPage() {
  return <Suspense fallback={null}><FAMembers /></Suspense>
}

function FAMembers() {
  const askedTab = useSearchParams()?.get("tab") || ""
  const [tab, setTab] = useState<MemberTab>(
    MEMBER_TABS.includes(askedTab as MemberTab) ? (askedTab as MemberTab) : "pending")
  const [members, setMembers] = useState<FAMember[]>([])
  const [loading, setLoading] = useState(true)
  /* Whether the roster actually answered. Without it a failed request emptied the list and
     the screen said "No pending creators" over a 500 — an approval queue reporting itself
     clear. */
  const [error, setError] = useState(false)
  // Multi-select bulk approve (only meaningful for not-yet-approved members).
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkApproving, setBulkApproving] = useState(false)
  /* Counts start unknown, not zero. `getTotal` read `r.data?.total ?? 0`, and the whole
     Promise.all rejects if any one of the five calls fails, so a broken tab counter left
     the header saying "0 total" and every tab showing a confident nought. */
  const [counts, setCounts] = useState<{
    pending: number | null; approved: number | null; rejected: number | null; incomplete: number | null
  }>({ pending: null, approved: null, rejected: null, incomplete: null })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      // "pending" review = only COMPLETE signups (IG + niches + profile all done).
      // In-progress / abandoned signups live in their own "Incomplete" tab so they
      // never clutter the approval queue.
      const listParams =
        tab === "pending" ? { is_approved: 0, signup_completed: true } :
        tab === "approved" ? { is_approved: 1 } :
        tab === "rejected" ? { is_approved: 2 } :
        { signup_completed: false }

      const [res, pendingRes, approvedRes, rejectedRes, incompleteRes] = await Promise.all([
        faMemberApi.list({ ...listParams, limit: 200 }),
        faMemberApi.list({ is_approved: 0, signup_completed: true, limit: 1 }),
        faMemberApi.list({ is_approved: 1, limit: 1 }),
        faMemberApi.list({ is_approved: 2, limit: 1 }),
        faMemberApi.list({ signup_completed: false, limit: 1 }),
      ])

      const list: FAMember[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.members)
          ? res.data.members
          : Array.isArray(res)
            ? res
            : []
      setMembers(list)

      const getTotal = (r: any) => r.data?.total ?? null
      setCounts({
        pending: getTotal(pendingRes),
        approved: getTotal(approvedRes),
        rejected: getTotal(rejectedRes),
        incomplete: getTotal(incompleteRes),
      })
    } catch {
      setError(true)
      setCounts({ pending: null, approved: null, rejected: null, incomplete: null })
      toast.error("Could not load creators")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])
  // Selection is per-tab; never carry ids across a tab switch.
  useEffect(() => { setSelected(new Set()) }, [tab])

  // Bulk approve is offered on any tab whose members aren't already approved.
  const selectable = tab !== "approved"

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const bulkApprove = async () => {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBulkApproving(true)
    try {
      const res = await faMemberApi.bulkApprove(ids)
      const d = res?.data ?? {}
      const approved = d.approved ?? ids.length
      toast.success(
        `Approved ${approved} member${approved === 1 ? "" : "s"}` +
        (d.already_approved ? ` · ${d.already_approved} already approved` : "")
      )
      setSelected(new Set())
      await load()
    } catch (e: any) {
      toast.error(e?.message || "Bulk approve failed")
    } finally {
      setBulkApproving(false)
    }
  }

  // ─── Filtered + Sorted members ──────────────────────────────────
  const filteredMembers = useMemo(() => {
    let result = [...members]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m =>
        m.full_name?.toLowerCase().includes(q) ||
        m.instagram_username?.toLowerCase().includes(q) ||
        m.content_niche?.some(n => n.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sortBy) {
      case "followers":
        result.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0))
        break
      case "engagement":
        result.sort((a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0))
        break
      // "Highest Fraud Score" removed: fraud_score is 0.0 for all 118 members, so the
      // control reordered nothing while implying the roster had been screened.
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return result
  }, [members, searchQuery, sortBy])

  /* Null unless all three answered: adding a known figure to an unknown one produces a
     number that looks measured and is not. */
  const totalCount =
    counts.pending == null || counts.approved == null || counts.rejected == null
      ? null
      : counts.pending + counts.approved + counts.rejected

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage>
          {/* ─── Header ─── */}
          <PageHead
            title="Creators"
            sub={
              totalCount == null
                ? "Everyone who has signed up to the Following App. Approving somebody lets them apply to campaigns."
                : `${totalCount} creators have signed up to the Following App. Approving somebody lets them apply to campaigns.`
            }
            action={
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search a name, a handle or a niche"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-64 pl-9"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-9 w-44">
                    <ArrowDownUp className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="followers">Most followers</SelectItem>
                    <SelectItem value="engagement">Highest engagement</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />

          {/* ─── Filter Tabs ─── */}
          {/* Each count is a dash until its request answers. A queue counter that shows a
              nought when it could not ask is the difference between "nobody is waiting"
              and "we do not know", and only one of those means you can go home. */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: "pending" as const, icon: Clock, label: "Waiting on us", count: counts.pending,
                title: "Signups that finished but still need a decision" },
              { key: "approved" as const, icon: ShieldCheck, label: "Approved", count: counts.approved, title: undefined },
              { key: "rejected" as const, icon: ShieldX, label: "Rejected", count: counts.rejected, title: undefined },
              { key: "incomplete" as const, icon: Hourglass, label: "Never finished signing up", count: counts.incomplete,
                title: "Signed up but never connected Instagram or picked their niches" },
            ]).map((t) => {
              const Icon = t.icon
              return (
                <Button
                  key={t.key}
                  variant={tab === t.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTab(t.key)}
                  className="gap-1.5"
                  title={t.title}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span className="ml-1 tabular-nums opacity-70">{figure(t.count)}</span>
                </Button>
              )
            })}
          </div>

          {/* ─── Member List ─── */}
          {loading ? (
            <Loading label="Loading creators" />
          ) : error ? (
            <Failed what="creators" onRetry={load} />
          ) : filteredMembers.length === 0 ? (
            <div className="space-y-ds-2">
              <Nothing>
                {searchQuery
                  ? `No creator matches “${searchQuery}”.`
                  : "Nobody is in this list."}
              </Nothing>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                  Clear the search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectable && filteredMembers.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-ds-md border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.07]">
                  <Checkbox
                    checked={selected.size > 0 && selected.size === filteredMembers.length}
                    onCheckedChange={(v) =>
                      setSelected(v ? new Set(filteredMembers.map((m) => m.id)) : new Set())
                    }
                    aria-label="Select all members"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selected.size > 0
                      ? `${selected.size} of ${filteredMembers.length} selected`
                      : `Select all ${filteredMembers.length}`}
                  </span>
                  {selected.size > 0 && (
                    <div className="ml-auto flex items-center gap-2">
                      <Button size="sm" variant="ghost" disabled={bulkApproving} onClick={() => setSelected(new Set())}>
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        disabled={bulkApproving}
                        onClick={bulkApprove}
                        
                      >
                        {bulkApproving
                          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Approving…</>
                          : <><Check className="h-4 w-4 mr-1" />Approve {selected.size} selected</>}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {filteredMembers.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onAction={load}
                  selected={selected.has(m.id)}
                  onToggleSelect={selectable ? toggleSelect : undefined}
                />
              ))}
            </div>
          )}
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
