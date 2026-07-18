"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, QrCode, Coins, Gift, Loader2, Sparkles, ChevronDown, Wand2 } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"
import { ParticipantDetailSheet, type CreatorAnalyticsBundle } from "./ParticipantDetailSheet"
import { AISnapshotView } from "./AISnapshotView"
import { AddCuratedCreatorsDialog } from "./AddCuratedCreatorsDialog"
import { useAdminAccess } from "@/hooks/useAdminAccess"

type CampaignType = "cashback" | "paid_deal" | "barter"
type ParticipantStatus =
  | "pending_brand_approval"
  | "brand_rejected"
  | "accepted"
  | "declined_by_creator"
  | "active"
  | "completed"
  | "cancelled"

interface Participant {
  participant_id: string
  member_id: string | null
  is_offline?: boolean
  status: ParticipantStatus
  source: "curated" | "applied"
  application_mode?: "receipt" | "intent" | null
  receipt?: {
    id: string | null
    merchant?: string | null
    amount?: number | null
    date?: string | null
    image_url?: string | null
    status?: string | null
  } | null
  member: {
    full_name?: string
    instagram_username?: string
    avatar_url?: string
    tier?: string
    followers_count?: number
    engagement_rate?: number | null
    posts_count?: number
    content_niche?: string[] | null
    // True while our analytics pipeline is still running on an offline suggestion.
    analytics_pending?: boolean
    // Following-staff only; null for brand users and for offline (team-suggested) creators.
    contact?: { email?: string | null; phone?: string | null } | null
    // First-party (Instagram) vs AI/Apify-estimated analytics envelope.
    analytics?: CreatorAnalyticsBundle | null
  }
  lifecycle: {
    invited_at?: string | null
    brand_approved_at?: string | null
    creator_accepted_at?: string | null
    joined_at?: string | null
    completed_at?: string | null
    // When a pending barter applicant will be auto-approved if the brand doesn't
    // act first (applied_at + the backend auto-approve window). Null for paid deals.
    auto_approve_at?: string | null
  }
  cashback: { scan_count: number; total_transaction_amount: number; total_cashback_amount: number }
  paid_deal: { payout_cents: number | null }
  barter: { items: any }
  deliverables: { pending: number; submitted: number; verified: number; posting?: number }
  // Human-readable "influencer is posting approved content…" line (or null) for
  // deliverables that are content-approved but not yet posted/verified.
  posting_status?: string | null
}

// ── Status language: ONE pill per creator, four tones, all on theme tokens ──
type Tone = "attn" | "neutral" | "good" | "muted"
const STATUS_META: Record<ParticipantStatus, { label: string; tone: Tone }> = {
  pending_brand_approval: { label: "Awaiting you", tone: "attn" },
  accepted:               { label: "Approved",     tone: "neutral" },
  active:                 { label: "Active",        tone: "neutral" },
  completed:              { label: "Completed",     tone: "good" },
  brand_rejected:         { label: "Rejected",      tone: "muted" },
  declined_by_creator:    { label: "Declined",      tone: "muted" },
  cancelled:              { label: "Cancelled",     tone: "muted" },
}

const TONE_PILL: Record<Tone, string> = {
  attn: "text-primary border-primary/40",
  neutral: "text-foreground border-border",
  good: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  muted: "text-muted-foreground border-border",
}
const TONE_DOT: Record<Tone, string> = {
  attn: "bg-primary",
  neutral: "bg-muted-foreground",
  good: "bg-emerald-500",
  muted: "bg-muted-foreground/50",
}

function StatusPill({ status }: { status: ParticipantStatus }) {
  const m = STATUS_META[status]
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium whitespace-nowrap ${TONE_PILL[m.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[m.tone]}`} />
      {m.label}
    </Badge>
  )
}

// Submission state per creator, derived from their deliverable counts.
type ContentState = "awaiting" | "review" | "posting" | "done"
const CONTENT_META: Record<ContentState, { label: string; dot: string; bar: string }> = {
  awaiting: { label: "Awaiting content",  dot: "bg-muted-foreground/60", bar: "bg-muted-foreground/50" },
  review:   { label: "Submitted · review", dot: "bg-amber-500",          bar: "bg-amber-500" },
  posting:  { label: "Posting",            dot: "bg-sky-500",            bar: "bg-sky-500" },
  done:     { label: "Completed",          dot: "bg-emerald-500",        bar: "bg-emerald-500" },
}

const contentState = (p: Participant): ContentState | null => {
  const d = p.deliverables
  if (!d) return null
  if ((d.submitted ?? 0) > 0) return "review"          // needs the brand's eyes first
  if ((d.posting ?? 0) > 0) return "posting"
  if ((d.pending ?? 0) > 0) return "awaiting"
  if ((d.verified ?? 0) > 0) return "done"
  return null
}
const deliverableTotal = (p: Participant): number => {
  const d = p.deliverables
  if (!d) return 0
  return (d.pending ?? 0) + (d.submitted ?? 0) + (d.verified ?? 0) + (d.posting ?? 0)
}

const CONTENT_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "review", label: "Submitted · review" },
  { value: "awaiting", label: "Awaiting content" },
  { value: "posting", label: "Posting" },
  { value: "done", label: "Completed" },
]

const TYPE_ICON: Record<CampaignType, { icon: typeof QrCode; label: string; accent: string }> = {
  cashback:  { icon: QrCode, label: "Cashback",  accent: "text-emerald-600" },
  paid_deal: { icon: Coins,  label: "Paid deal", accent: "text-blue-600" },
  barter:    { icon: Gift,   label: "Barter",    accent: "text-purple-600" },
}

function fmtCount(n?: number | null): string {
  if (n == null) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
function fmtAED(amount: number): string {
  return `د.إ ${amount.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
function hoursUntil(iso?: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.round(ms / 3_600_000))
}

// Source, worded as the brand's relationship to the creator (leads, not a loud pill).
function sourceLabel(p: Participant): string {
  if (p.source === "applied") return "Applied via app"
  if (p.is_offline) return "Suggested for you · offline"
  return "Suggested for you"
}
// Calm auto-approve countdown (barter pending only; backend nulls it for paid).
function autoApproveLabel(p: Participant): string | null {
  if (p.status !== "pending_brand_approval") return null
  const h = hoursUntil(p.lifecycle.auto_approve_at)
  if (h == null) return null
  return h <= 0 ? "auto-approving…" : `auto-approves in ${h}h`
}
// The deal value line, per campaign type — real data only.
function DealLine({ p, campaignType }: { p: Participant; campaignType: CampaignType }) {
  if (campaignType === "barter") {
    const items: any[] = Array.isArray(p.barter?.items) ? p.barter.items : []
    const names = items.map((it) => (typeof it === "string" ? it : (it.item ?? it.name ?? it.type ?? "Item")))
    const text = names.length ? names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "") : "Barter package"
    return <div className="mt-4 flex items-center gap-2 text-sm"><Gift className="h-3.5 w-3.5 text-primary shrink-0" />{text}</div>
  }
  if (campaignType === "paid_deal") {
    if (p.paid_deal?.payout_cents == null) return null
    return <div className="mt-4 flex items-center gap-2 text-sm"><Coins className="h-3.5 w-3.5 text-primary shrink-0" />{fmtAED(p.paid_deal.payout_cents / 100)} payout</div>
  }
  // cashback
  return <div className="mt-4 flex items-center gap-2 text-sm"><QrCode className="h-3.5 w-3.5 text-primary shrink-0" />{p.cashback.scan_count} scans · {fmtAED(p.cashback.total_cashback_amount)}</div>
}

interface Props {
  campaignId: string
  campaignType: CampaignType
}

interface AiSnapshot {
  headline?: string
  insights?: Array<{ type: string; title: string; data: any }>
  recommendations?: string[]
  scores?: {
    authenticity?: number
    sentiment?: number
    avg_engagement?: number
    total_reach?: number
    creators_with_ai_data?: number
    total_selected?: number
  }
}

export function FaCampaignProgressPanel({ campaignId, campaignType }: Props) {
  // Access model: the BRAND (or Following team) approves/rejects creators; scoped agency
  // managers (account/talent) curate + view but never decide. Anyone on the agency side
  // (staff or superadmin) may add curated creators.
  const { isSuperAdmin, isStaff, isFullAccessStaff } = useAdminAccess()
  const isScopedManager = isStaff && !isFullAccessStaff
  const canDecide = !isScopedManager        // brand / superadmin / ceo / cofounder
  const canCurate = isStaff || isSuperAdmin  // agency side adds creators

  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [actionId, setActionId] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<AiSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [selected, setSelected] = useState<Participant | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tab, setTab] = useState<string>("needs")
  // Filter the active roster by submission state — "who has sent content" at a glance.
  const [contentFilter, setContentFilter] = useState<string>("all")
  const openParticipant = (p: Participant) => { setSelected(p); setSheetOpen(true) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/fa-progress`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setParticipants(body?.data?.participants ?? [])
    } catch (e: any) {
      toast.error(e.message || "Failed to load progress")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [campaignId])

  const approve = async (pid: string) => {
    setActionId(pid)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/participants/${pid}/approve`,
        { method: "POST", headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success("Approved — creator has been notified")
      load()
    } catch (e: any) {
      toast.error(e.message || "Approve failed")
    } finally {
      setActionId(null)
    }
  }

  const loadSnapshot = async () => {
    setSnapshotLoading(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/ai-snapshot`,
        { method: "POST", headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setSnapshot(body?.data ?? null)
    } catch (e: any) {
      toast.error(e.message || "Failed to generate snapshot")
    } finally {
      setSnapshotLoading(false)
    }
  }

  const reject = async (pid: string, reason: string) => {
    setActionId(pid)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/participants/${pid}/reject`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || null }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success("Rejected")
      load()
    } catch (e: any) {
      toast.error(e.message || "Reject failed")
    } finally {
      setActionId(null)
    }
  }

  const grouped = useMemo(() => {
    const groups: Record<string, Participant[]> = { pending: [], active: [], other: [] }
    for (const p of participants) {
      if (p.status === "pending_brand_approval") groups.pending.push(p)
      else if (p.status === "accepted" || p.status === "active") groups.active.push(p)
      else groups.other.push(p)
    }
    return groups
  }, [participants])

  const activeFiltered = useMemo(
    () => (contentFilter === "all"
      ? grouped.active
      : grouped.active.filter((p) => contentState(p) === contentFilter)),
    [grouped.active, contentFilter]
  )
  // Counts per submission bucket, so the filters show how many are waiting on whom.
  const contentCounts = useMemo(() => {
    const c: Record<string, number> = { all: grouped.active.length }
    for (const p of grouped.active) {
      const s = contentState(p)
      if (s) c[s] = (c[s] ?? 0) + 1
    }
    return c
  }, [grouped.active])

  // Default to whichever tab has work — pending first, else the roster.
  useEffect(() => {
    if (!loading) setTab(grouped.pending.length > 0 ? "needs" : "roster")
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const meta = TYPE_ICON[campaignType]
  const TypeIcon = meta.icon

  // Pipeline counts — every number a real filter, no fabricated metrics.
  const completedN = participants.filter((p) => p.status === "completed").length
  const deliveringN = grouped.active.filter((p) => { const s = contentState(p); return s === "posting" || s === "review" }).length
  const totalCashback = useMemo(
    () => participants.reduce((s, p) => s + p.cashback.total_cashback_amount, 0),
    [participants]
  )
  const totalScans = useMemo(
    () => participants.reduce((s, p) => s + p.cashback.scan_count, 0),
    [participants]
  )

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* AI Snapshot */}
        <Card className="p-0">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Snapshot</div>
                <p className="text-xs text-muted-foreground mt-0.5">Audience &amp; content insights across your approved creators.</p>
              </div>
            </div>
            {!snapshot ? (
              <Button size="sm" onClick={() => { loadSnapshot(); setSnapshotOpen(true) }} disabled={snapshotLoading}>
                {snapshotLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={loadSnapshot} disabled={snapshotLoading}>
                  {snapshotLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSnapshotOpen((o) => !o)}>
                  <ChevronDown className={`h-4 w-4 transition-transform ${snapshotOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </div>
          {snapshotOpen && (
            <div className="border-t p-5">
              <AISnapshotView snapshot={snapshot} loading={snapshotLoading} />
            </div>
          )}
        </Card>

        {/* Pipeline strip — the status-wise overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <PipelineStage label="Applied / suggested" value={participants.length} />
          <PipelineStage label="Awaiting you" value={grouped.pending.length} attn />
          <PipelineStage label="Active" value={grouped.active.length} />
          <PipelineStage label={campaignType === "cashback" ? "Total scans" : "Delivering"} value={campaignType === "cashback" ? totalScans : deliveringN} />
          <PipelineStage label={campaignType === "cashback" ? "Cashback paid" : "Completed"} value={campaignType === "cashback" ? fmtAED(totalCashback) : completedN} />
        </div>

        {/* Curate: add Team-Suggested creators (agency side only; brand still approves) */}
        {canCurate && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">
              Suggest creators for this campaign — they’ll go to the brand for approval.
            </div>
            <AddCuratedCreatorsDialog campaignId={campaignId} onAdded={load} />
          </div>
        )}

        {/* Tabbed roster */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="needs" className="gap-2">
              {canDecide ? "Needs you" : "Pending"}
              {grouped.pending.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2 text-[11px] font-semibold text-primary">{grouped.pending.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="roster" className="gap-2">
              Roster
              <span className="rounded-full bg-secondary px-2 text-[11px] font-semibold text-muted-foreground">{grouped.active.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              History
              <span className="rounded-full bg-secondary px-2 text-[11px] font-semibold text-muted-foreground">{grouped.other.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* NEEDS YOU — approval queue */}
          <TabsContent value="needs" className="mt-6">
            {loading ? (
              <GridSkeleton />
            ) : grouped.pending.length === 0 ? (
              <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Nothing awaiting you" hint="New applicants and suggestions will appear here for approval." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {grouped.pending.map((p) => (
                  <ApprovalCard
                    key={p.participant_id}
                    p={p}
                    campaignType={campaignType}
                    canDecide={canDecide}
                    busy={actionId === p.participant_id}
                    onApprove={() => approve(p.participant_id)}
                    onReject={(reason) => reject(p.participant_id, reason)}
                    onOpen={() => openParticipant(p)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ROSTER — active / accepted */}
          <TabsContent value="roster" className="mt-6">
            {grouped.active.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-1.5">
                {CONTENT_FILTERS.map((f) => {
                  const n = contentCounts[f.value] ?? 0
                  if (f.value !== "all" && n === 0) return null
                  const on = contentFilter === f.value
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setContentFilter(f.value)}
                      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                        on ? "bg-primary text-primary-foreground border-primary"
                           : "bg-background hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {f.label} ({n})
                    </button>
                  )
                })}
              </div>
            )}
            {loading ? (
              <GridSkeleton />
            ) : grouped.active.length === 0 ? (
              <EmptyState icon={<TypeIcon className="h-6 w-6" />} title="No active creators yet" hint="Approved creators appear here as they join and start delivering." />
            ) : activeFiltered.length === 0 ? (
              <EmptyState icon={<TypeIcon className="h-6 w-6" />} title="No creators in this state" />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeFiltered.map((p) => (
                  <RosterCard key={p.participant_id} p={p} campaignType={campaignType} onOpen={() => openParticipant(p)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* HISTORY — terminal states */}
          <TabsContent value="history" className="mt-6">
            {grouped.other.length === 0 ? (
              <EmptyState title="No history yet" hint="Rejected, declined and cancelled creators appear here." />
            ) : (
              <div className="space-y-3">
                {grouped.other.map((p) => (
                  <HistoryRow key={p.participant_id} p={p} onOpen={() => openParticipant(p)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ParticipantDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          campaignId={campaignId}
          campaignType={campaignType}
          participant={selected}
          onChanged={load}
        />
      </div>
    </TooltipProvider>
  )
}

function PipelineStage({ label, value, attn }: { label: string; value: React.ReactNode; attn?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${attn ? "border-primary/40" : ""}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2.5 text-3xl font-bold tabular-nums tracking-tight ${attn ? "text-primary" : ""}`}>{value}</div>
    </div>
  )
}

// ── Shared creator identity block ──
function CreatorId({ p, children }: { p: Participant; children?: React.ReactNode }) {
  const m = p.member
  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={m.avatar_url} />
        <AvatarFallback className="text-sm">
          {(m.instagram_username?.[0] ?? m.full_name?.[0] ?? "?").toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold leading-tight">@{m.instagram_username ?? "—"}</div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {m.full_name || "Creator"}
          {m.tier && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide">{m.tier}</span>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Metric({ value, label, pos }: { value: React.ReactNode; label: string; pos?: boolean }) {
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums tracking-tight ${pos ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

function ApprovalCard({
  p, campaignType, canDecide, busy, onApprove, onReject, onOpen,
}: {
  p: Participant
  campaignType: CampaignType
  canDecide: boolean
  busy: boolean
  onApprove: () => void
  onReject: (reason: string) => void
  onOpen: () => void
}) {
  const [reason, setReason] = useState("")
  const m = p.member
  const sla = autoApproveLabel(p)
  const eng = m.engagement_rate
  const engPos = eng != null && eng >= 4
  return (
    <Card
      className="cursor-pointer p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      onClick={onOpen}
    >
      <CreatorId p={p}><StatusPill status={p.status} /></CreatorId>

      {m.analytics_pending ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pulling this creator’s analytics…
        </div>
      ) : (
        <div className="mt-5 flex gap-8">
          {m.followers_count != null && <Metric value={fmtCount(m.followers_count)} label="followers" />}
          {eng != null && <Metric value={`${eng.toFixed(1)}%`} label="engagement" pos={engPos} />}
        </div>
      )}

      {m.content_niche && m.content_niche.length > 0 && (
        <div className="mt-4 text-[13px] text-muted-foreground">{m.content_niche.slice(0, 3).join(" · ")}</div>
      )}

      <DealLine p={p} campaignType={campaignType} />

      <div className="mt-2 text-xs text-muted-foreground">
        {sourceLabel(p)}
        {sla && <> · <span className="text-amber-600 dark:text-amber-400">{sla}</span></>}
      </div>

      {canDecide ? (
        <div className="mt-6 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={busy}>
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject @{m.instagram_username}?</AlertDialogTitle>
                <AlertDialogDescription>The creator will see this rejection. You can optionally include a reason.</AlertDialogDescription>
              </AlertDialogHeader>
              <Label className="mt-2">Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Not a fit for this campaign..." className="mt-1" />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setReason("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onReject(reason)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirm rejection
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex-1" />
          <Button size="sm" disabled={busy} onClick={onApprove}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1.5 h-3.5 w-3.5" />Approve</>}
          </Button>
        </div>
      ) : (
        <div className="mt-6 text-xs text-muted-foreground">Awaiting brand decision</div>
      )}
    </Card>
  )
}

function RosterCard({ p, campaignType, onOpen }: { p: Participant; campaignType: CampaignType; onOpen: () => void }) {
  const m = p.member
  const cs = contentState(p)
  const total = deliverableTotal(p)
  const verified = p.deliverables?.verified ?? 0
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0
  const csMeta = cs ? CONTENT_META[cs] : null
  const submitted = p.deliverables?.submitted ?? 0
  const metaLine = [
    m.followers_count != null ? `${fmtCount(m.followers_count)} followers` : null,
    m.engagement_rate != null ? `${m.engagement_rate.toFixed(1)}% eng` : null,
    campaignType === "cashback" && p.cashback.scan_count > 0 ? `${p.cashback.scan_count} scans` : null,
  ].filter(Boolean).join(" · ")

  return (
    <Card className="cursor-pointer p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" onClick={onOpen}>
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={m.avatar_url} />
          <AvatarFallback className="text-sm">{(m.instagram_username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">@{m.instagram_username ?? "—"}</div>
          {metaLine && <div className="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">{metaLine}</div>}
        </div>
        <StatusPill status={p.status} />
      </div>

      {total > 0 && csMeta && (
        <>
          <div className="my-5 h-px bg-border" />
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="inline-flex items-center gap-2 font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${csMeta.dot}`} />{csMeta.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{verified}/{total} verified</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full border bg-secondary">
            <span className={`block h-full rounded-full ${csMeta.bar}`} style={{ width: `${Math.max(pct, 3)}%` }} />
          </div>
        </>
      )}

      {p.posting_status && (p.status === "active" || p.status === "accepted") && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-3 truncate text-xs text-sky-600 dark:text-sky-400">▸ Posting approved content…</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">{p.posting_status}</TooltipContent>
        </Tooltip>
      )}

      {submitted > 0 && (
        <Button variant="outline" size="sm" className="mt-5 w-full" onClick={(e) => { e.stopPropagation(); onOpen() }}>
          Review content
          <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 text-[11px] text-amber-600 dark:text-amber-400">{submitted} to review</span>
        </Button>
      )}
    </Card>
  )
}

function HistoryRow({ p, onOpen }: { p: Participant; onOpen: () => void }) {
  const m = p.member
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left opacity-80 transition-opacity hover:opacity-100"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={m.avatar_url} />
        <AvatarFallback className="text-xs">{(m.instagram_username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">@{m.instagram_username ?? "—"}</div>
        {p.receipt?.status && <div className="truncate text-xs text-muted-foreground">{p.receipt.status}</div>}
      </div>
      <StatusPill status={p.status} />
    </button>
  )
}

function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-5 h-8 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-5 h-9 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
