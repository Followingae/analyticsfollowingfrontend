"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { faMemberApi } from "@/services/faAdminApi"
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
}

type SortOption = "followers" | "engagement" | "newest" | "fraud"

// ─── Constants ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  PLATINUM: "bg-violet-500/10 text-violet-600 border-violet-300",
  GOLD: "bg-amber-500/10 text-amber-600 border-amber-300",
  SILVER: "bg-slate-400/10 text-slate-500 border-slate-300",
  BRONZE: "bg-orange-500/10 text-orange-600 border-orange-300",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function scoreColor(score: number): string {
  if (score > 0.7) return "text-emerald-600"
  if (score > 0.4) return "text-amber-600"
  return "text-red-600"
}

function scoreBg(score: number): string {
  if (score > 0.7) return "bg-emerald-500/10 border-emerald-500/20"
  if (score > 0.4) return "bg-amber-500/10 border-amber-500/20"
  return "bg-red-500/10 border-red-500/20"
}

function getFraudRiskLevel(analytics: FAMemberAnalytics | null | undefined, fraudScore: number): { label: string; color: string; bgColor: string } {
  // Try analytics AI fraud detection first
  if (analytics?.ai_fraud_detection) {
    const fd = analytics.ai_fraud_detection
    const risk = fd.risk_level || fd.fraud_risk || fd.level
    if (typeof risk === "string") {
      const lower = risk.toLowerCase()
      if (lower === "high" || lower === "critical") return { label: risk, color: "text-red-600", bgColor: "bg-red-500/10 border-red-500/20" }
      if (lower === "medium" || lower === "moderate") return { label: risk, color: "text-amber-600", bgColor: "bg-amber-500/10 border-amber-500/20" }
      return { label: risk, color: "text-emerald-600", bgColor: "bg-emerald-500/10 border-emerald-500/20" }
    }
  }
  // Fall back to fraud_score
  if (fraudScore > 0.2) return { label: "High", color: "text-red-600", bgColor: "bg-red-500/10 border-red-500/20" }
  if (fraudScore > 0.1) return { label: "Medium", color: "text-amber-600", bgColor: "bg-amber-500/10 border-amber-500/20" }
  return { label: "Low", color: "text-emerald-600", bgColor: "bg-emerald-500/10 border-emerald-500/20" }
}

function getAudienceQualityLabel(analytics: FAMemberAnalytics | null | undefined, aqScore: number): { label: string; score: number } {
  if (analytics?.ai_audience_quality) {
    const aq = analytics.ai_audience_quality
    const score = aq.overall_score ?? aq.score ?? aq.quality_score ?? aqScore
    return { label: `${Math.round((score ?? 0) * 100)}%`, score: score ?? 0 }
  }
  return { label: `${Math.round(aqScore * 100)}%`, score: aqScore }
}

// ─── Member Card ────────────────────────────────────────────────────────────

function MemberCard({ member, onAction }: { member: FAMember; onAction: () => void }) {
  const [acting, setActing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const analytics = member.analytics
  const approvalStatus = member.is_approved === 1 ? "approved" : member.is_approved === 2 ? "rejected" : "pending"
  const joinDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—"

  const fraudRisk = getFraudRiskLevel(analytics, member.fraud_score)
  const audienceQuality = getAudienceQualityLabel(analytics, member.audience_quality_score)

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
      await faMemberApi.triggerAnalytics(member.id)
      toast.success(`Analytics triggered for ${member.full_name}`)
      // Give backend a moment to process, then refresh
      setTimeout(() => {
        onAction()
        setAnalyzing(false)
      }, 2000)
    } catch {
      toast.error("Failed to trigger analytics")
      setAnalyzing(false)
    }
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          {/* ─── Row 1: Avatar + Identity + Actions ─── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
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
                  <Badge variant="outline" className={`text-[11px] px-2 ${TIER_STYLES[member.tier] || ""}`}>
                    {member.tier}
                  </Badge>
                  {member.verified && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-300 text-[10px] px-1.5">Verified</Badge>
                  )}
                  {!member.eligible && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Ineligible</Badge>
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
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={acting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {approvalStatus === "approved" && !deleteConfirm && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300">
                    <ShieldCheck className="h-3 w-3 mr-1" />Approved
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {approvalStatus === "approved" && deleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">Permanently delete?</span>
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
                  <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-300">
                    <ShieldX className="h-3 w-3 mr-1" />Rejected
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {approvalStatus === "rejected" && deleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">Permanently delete?</span>
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

          {/* ─── Rejection reason input (inline) ─── */}
          {rejectMode && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <Input
                placeholder="Rejection reason (optional)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-8 flex-1 text-sm border-red-200 focus-visible:ring-red-400"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Followers</p>
              <p className="text-lg font-bold mt-0.5">{formatNumber(member.followers_count)}</p>
              <p className="text-[11px] text-muted-foreground">{member.followers_range}</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Engagement</p>
              <p className="text-lg font-bold mt-0.5">{member.engagement_rate ?? 0}%</p>
              <p className="text-[11px] text-muted-foreground">{member.engagement_range}</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Posts</p>
              <p className="text-lg font-bold mt-0.5">{formatNumber(member.posts_count || analytics?.posts_count)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Following</p>
              <p className="text-lg font-bold mt-0.5">{formatNumber(member.following_count || analytics?.following_count)}</p>
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

          {/* ─── Row 4: Analytics Indicators ─── */}
          {analytics ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Content Quality */}
              <div className={`rounded-lg px-3 py-2.5 border ${scoreBg(analytics.ai_content_quality_score)}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Content Quality</p>
                </div>
                <p className={`text-lg font-bold mt-0.5 ${scoreColor(analytics.ai_content_quality_score)}`}>
                  {Math.round(analytics.ai_content_quality_score * 100)}%
                </p>
              </div>

              {/* Audience Quality */}
              <div className={`rounded-lg px-3 py-2.5 border ${scoreBg(audienceQuality.score)}`}>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Audience Quality</p>
                </div>
                <p className={`text-lg font-bold mt-0.5 ${scoreColor(audienceQuality.score)}`}>
                  {audienceQuality.label}
                </p>
              </div>

              {/* Fraud Risk */}
              <div className={`rounded-lg px-3 py-2.5 border ${fraudRisk.bgColor}`}>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Fraud Risk</p>
                </div>
                <p className={`text-lg font-bold mt-0.5 ${fraudRisk.color}`}>
                  {fraudRisk.label}
                </p>
              </div>

              {/* Sentiment */}
              <div className={`rounded-lg px-3 py-2.5 border ${scoreBg(analytics.ai_avg_sentiment_score)}`}>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Sentiment</p>
                </div>
                <p className={`text-lg font-bold mt-0.5 ${scoreColor(analytics.ai_avg_sentiment_score)}`}>
                  {Math.round(analytics.ai_avg_sentiment_score * 100)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              <span className="text-sm text-muted-foreground">Creator analytics processing — data will appear automatically once complete</span>
            </div>
          )}

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
      </CardContent>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FAMembersPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [members, setMembers] = useState<FAMember[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const approvalFilter = tab === "pending" ? 0 : tab === "approved" ? 1 : 2

      const [res, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        faMemberApi.list({ is_approved: approvalFilter, limit: 200 }),
        faMemberApi.list({ is_approved: 0, limit: 1 }),
        faMemberApi.list({ is_approved: 1, limit: 1 }),
        faMemberApi.list({ is_approved: 2, limit: 1 }),
      ])

      const list: FAMember[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.members)
          ? res.data.members
          : Array.isArray(res)
            ? res
            : []
      setMembers(list)

      const getTotal = (r: any) => r.data?.total ?? 0
      setCounts({
        pending: getTotal(pendingRes),
        approved: getTotal(approvedRes),
        rejected: getTotal(rejectedRes),
      })
    } catch {
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

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
      case "fraud":
        result.sort((a, b) => (b.fraud_score ?? 0) - (a.fraud_score ?? 0))
        break
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return result
  }, [members, searchQuery, sortBy])

  const totalCount = counts.pending + counts.approved + counts.rejected

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          {/* ─── Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Creator Review</h1>
                <Badge variant="secondary" className="text-xs font-medium">
                  {totalCount} total
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Review, analyze, and approve influencer applications
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, username, niche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 h-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-44 h-9">
                  <ArrowDownUp className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="followers">Most Followers</SelectItem>
                  <SelectItem value="engagement">Highest Engagement</SelectItem>
                  <SelectItem value="fraud">Highest Fraud Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ─── Filter Tabs ─── */}
          <div className="flex gap-2">
            <Button
              variant={tab === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("pending")}
              className="gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              Pending Review
              {counts.pending > 0 && (
                <Badge
                  variant={tab === "pending" ? "secondary" : "destructive"}
                  className="ml-1 h-5 px-1.5 text-[11px] font-semibold"
                >
                  {counts.pending}
                </Badge>
              )}
            </Button>
            <Button
              variant={tab === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("approved")}
              className="gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Approved
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">{counts.approved}</Badge>
            </Button>
            <Button
              variant={tab === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("rejected")}
              className="gap-1.5"
            >
              <ShieldX className="h-3.5 w-3.5" />
              Rejected
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">{counts.rejected}</Badge>
            </Button>
          </div>

          {/* ─── Member List ─── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading creators...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  {searchQuery
                    ? `No creators matching "${searchQuery}"`
                    : `No ${tab} creators`}
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((m) => (
                <MemberCard key={m.id} member={m} onAction={load} />
              ))}
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
