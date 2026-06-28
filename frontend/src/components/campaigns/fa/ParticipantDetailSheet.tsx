"use client"

import { useCallback, useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Check, X, Loader2, BarChart3, Instagram, Film, ImageIcon, Camera, Layers,
  Gift, Coins, QrCode, CheckCircle2, Clock, Sparkles, ExternalLink, BadgeCheck, Bot,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FirstPartyAudienceAnalytics } from "@/components/analytics/FirstPartyAudienceAnalytics"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"

type CampaignType = "cashback" | "paid_deal" | "barter"

// First-party Instagram vs AI/Apify-estimated analytics envelope, served per
// participant by GET /fa-progress (member.analytics). When has_first_party is
// false the demographics/insights are null — we never fabricate them.
export interface CreatorAnalyticsBundle {
  analytics_source?: "instagram_first_party" | "ai_estimated"
  has_first_party?: boolean
  demographics?: {
    gender_distribution?: Record<string, number> | null
    age_distribution?: Record<string, number> | null
    location_distribution?: Record<string, number> | null
    sample_size?: number | null
    confidence_score?: number | null
    analysis_method?: string | null
  } | null
  insights?: {
    reach?: number | null
    impressions?: number | null
    profile_views?: number | null
    accounts_engaged?: number | null
    total_interactions?: number | null
    period?: string | null
  } | null
  fetched_at?: string | null
}

// Loose shape — mirrors the participant object from /fa-progress.
export interface ParticipantLike {
  participant_id: string
  member_id: string | null
  is_offline?: boolean
  status: string
  source: "curated" | "applied"
  application_mode?: "receipt" | "intent" | null
  receipt?: { merchant?: string | null; amount?: number | null; date?: string | null; image_url?: string | null; status?: string | null } | null
  member: {
    full_name?: string; instagram_username?: string; avatar_url?: string; tier?: string
    followers_count?: number; engagement_rate?: number | null
    // First-party (Instagram Graph) vs AI/Apify-estimated analytics envelope.
    analytics?: CreatorAnalyticsBundle | null
  }
  lifecycle: { invited_at?: string | null; brand_approved_at?: string | null; creator_accepted_at?: string | null; joined_at?: string | null; completed_at?: string | null }
  cashback: { scan_count: number; total_transaction_amount: number; total_cashback_amount: number }
  paid_deal: { payout_cents: number | null }
  barter: { items: any }
  deliverables: { pending: number; submitted: number; verified: number }
}

interface Deliverable {
  id: string
  type: string
  quantity: number
  status: "pending" | "submitted" | "verified" | "rejected" | string
  proof_url: string | null
  submitted_at: string | null
  verified_at: string | null
  deadline: string | null
  cashback_linked: number | null
}

const fmtCount = (n?: number | null) =>
  n == null ? "—" : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)
const fmtAED = (a: number) => `د.إ ${a.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—")

const DTYPE: Record<string, { icon: typeof Film; label: string }> = {
  reel: { icon: Film, label: "Reel" },
  video: { icon: Film, label: "Video" },
  story: { icon: Camera, label: "Story" },
  post: { icon: ImageIcon, label: "Post" },
  carousel: { icon: Layers, label: "Carousel" },
}
const dtypeMeta = (t: string) => DTYPE[t] ?? { icon: ImageIcon, label: t.charAt(0).toUpperCase() + t.slice(1) }

// Real submitted-proof rendering: detect media kind from the URL so we can inline
// the actual image/video the creator uploaded (R2/CDN), with a link fallback.
const isImageProof = (u: string) => /\.(jpe?g|png|webp|gif|heic|heif|avif)(\?|#|$)/i.test(u)
const isVideoProof = (u: string) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(u)

// Deterministic gradient — only a loading backdrop behind the real proof image.
function gradientFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 38) % 360} 72% 48%))`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  campaignType: CampaignType
  participant: ParticipantLike | null
  onChanged?: () => void
}

export function ParticipantDetailSheet({ open, onOpenChange, campaignId, campaignType, participant, onChanged }: Props) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loadingDel, setLoadingDel] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const username = participant?.member.instagram_username
  const canShowAnalytics = !!username && !participant?.is_offline
  const analytics = participant?.member.analytics
  const hasFirstParty = !!analytics?.has_first_party

  const loadDeliverables = useCallback(async () => {
    if (!participant) return
    setLoadingDel(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/participants/${participant.participant_id}/deliverables`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setDeliverables(body?.data?.deliverables ?? [])
    } catch {
      setDeliverables([])
    } finally {
      setLoadingDel(false)
    }
  }, [campaignId, participant])

  useEffect(() => { if (open && participant) loadDeliverables() }, [open, participant, loadDeliverables])

  const participantAction = async (action: "approve" | "reject", reason?: string) => {
    if (!participant) return
    setBusy(action)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/participants/${participant.participant_id}/${action}`,
        action === "reject"
          ? { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason || null }) }
          : { method: "POST", headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success(action === "approve" ? "Approved — creator notified" : "Rejected")
      onChanged?.()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e.message || `${action} failed`)
    } finally {
      setBusy(null)
    }
  }

  const deliverableAction = async (d: Deliverable, action: "approve" | "reject") => {
    setBusy(d.id + action)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/deliverables/${d.id}/${action}`,
        { method: "POST", headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success(action === "approve" ? "Submission approved" : "Submission rejected")
      await loadDeliverables()
      onChanged?.()
    } catch (e: any) {
      toast.error(e.message || `Could not ${action} submission`)
    } finally {
      setBusy(null)
    }
  }

  const barterItems: any[] = Array.isArray(participant?.barter?.items) ? participant!.barter.items : []
  const isPending = participant?.status === "pending_brand_approval"

  const submittedCount = deliverables.filter((d) => d.status === "submitted").length
  const verifiedCount = deliverables.filter((d) => d.status === "verified" || d.status === "approved").length

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
          {participant && (
            <>
              {/* Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-0 text-left">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-border">
                    <AvatarImage src={participant.member.avatar_url} />
                    <AvatarFallback>{(username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-lg leading-tight truncate">
                      @{username ?? "—"}
                    </SheetTitle>
                    <SheetDescription className="truncate">
                      {participant.member.full_name || "Creator"}
                    </SheetDescription>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {participant.member.tier && (
                        <Badge variant="outline" className="text-[10px] uppercase">{participant.member.tier}</Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] tabular-nums">
                        {fmtCount(participant.member.followers_count)} followers
                      </Badge>
                      {participant.member.engagement_rate != null && (
                        <Badge variant="secondary" className="text-[10px] tabular-nums">
                          {participant.member.engagement_rate.toFixed(1)}% eng.
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {canShowAnalytics && (
                    <Button size="sm" variant="default" onClick={() => setAnalyticsOpen(true)} className="gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" /> View full analytics
                    </Button>
                  )}
                  {username && (
                    <Button size="sm" variant="outline" asChild className="gap-1.5">
                      <a href={`https://instagram.com/${username}`} target="_blank" rel="noreferrer">
                        <Instagram className="h-3.5 w-3.5" /> Instagram <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </Button>
                  )}
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 mt-3 rounded-lg border border-amber-300/40 bg-amber-500/5 p-2.5">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-700 flex-1">Awaiting your approval. Review their analytics, then decide.</span>
                    <Button size="sm" disabled={!!busy} onClick={() => participantAction("approve")}>
                      {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" />Approve</>}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={!!busy}><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject @{username}?</AlertDialogTitle>
                          <AlertDialogDescription>The creator will see this. A reason is optional.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Not a fit for this campaign…" />
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => participantAction("reject", rejectReason)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Confirm rejection
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Type-specific summary */}
                {campaignType === "cashback" && (
                  <Section title="Cashback" icon={<QrCode className="h-4 w-4 text-emerald-600" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Stat label="Scans" value={participant.cashback.scan_count} />
                      <Stat label="Spend" value={fmtAED(participant.cashback.total_transaction_amount)} />
                      <Stat label="Cashback" value={fmtAED(participant.cashback.total_cashback_amount)} accent />
                    </div>
                    {participant.receipt?.image_url && (
                      <a href={participant.receipt.image_url} target="_blank" rel="noreferrer" className="mt-3 block">
                        <img src={participant.receipt.image_url} alt="receipt" className="h-40 rounded-lg border object-contain bg-muted/30" />
                      </a>
                    )}
                  </Section>
                )}
                {campaignType === "paid_deal" && (
                  <Section title="Paid deal" icon={<Coins className="h-4 w-4 text-blue-600" />}>
                    <div className="grid grid-cols-2 gap-3">
                      <Stat label="Agreed payout" value={participant.paid_deal.payout_cents != null ? fmtAED(participant.paid_deal.payout_cents / 100) : "—"} accent />
                      <Stat label="Status" value={participant.status === "completed" ? "Paid" : "Pending delivery"} />
                    </div>
                  </Section>
                )}
                {campaignType === "barter" && (
                  <Section title="Barter package" icon={<Gift className="h-4 w-4 text-purple-600" />}>
                    {barterItems.length > 0 ? (
                      <div className="space-y-2">
                        {barterItems.map((it: any, i: number) => {
                          const name = typeof it === "string" ? it : (it.item ?? it.name ?? it.type ?? "Item")
                          const value = typeof it === "object" ? (it.value_aed ?? it.value) : null
                          return (
                            <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Gift className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                <span className="text-sm truncate">{name}</span>
                              </div>
                              {value != null && <span className="text-sm font-medium tabular-nums text-muted-foreground">{fmtAED(Number(value))}</span>}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No items recorded.</p>
                    )}
                  </Section>
                )}

                {/* Submissions */}
                <Section
                  title="Content submissions"
                  icon={<Film className="h-4 w-4 text-primary" />}
                  right={
                    <div className="flex items-center gap-1.5 text-xs">
                      {verifiedCount > 0 && <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-300/40">{verifiedCount} verified</Badge>}
                      {submittedCount > 0 && <Badge variant="outline" className="text-amber-600 border-amber-300/40">{submittedCount} to review</Badge>}
                    </div>
                  }
                >
                  {loadingDel ? (
                    <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : deliverables.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No deliverables yet. They appear here once the creator posts.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {deliverables.map((d) => (
                        <SubmissionCard
                          key={d.id}
                          d={d}
                          avatar={participant.member.avatar_url}
                          username={username}
                          busy={busy}
                          onApprove={() => deliverableAction(d, "approve")}
                          onReject={() => deliverableAction(d, "reject")}
                        />
                      ))}
                    </div>
                  )}
                </Section>

                {/* Timeline */}
                <Section title="Timeline" icon={<Clock className="h-4 w-4 text-muted-foreground" />}>
                  <div className="space-y-2">
                    <TimelineRow label="Invited / applied" at={participant.lifecycle.invited_at} />
                    <TimelineRow label="Brand approved" at={participant.lifecycle.brand_approved_at} />
                    <TimelineRow label="Creator accepted" at={participant.lifecycle.creator_accepted_at} />
                    <TimelineRow label="Joined" at={participant.lifecycle.joined_at} />
                    <TimelineRow label="Completed" at={participant.lifecycle.completed_at} />
                  </div>
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Full analytics — TWO clearly separated displays:
          (1) Instagram Analytics — first-party Graph data (authoritative), shown
              only when the creator OAuth-connected and Instagram has synced;
          (2) Our Analytics — AI/Apify-estimated, the real creator-analytics embed.
          Each labelled with its source. No mock numbers — first-party falls back
          to an honest empty state when absent. */}
      <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-hidden flex flex-col gap-0">
          <SheetHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <SheetTitle>@{username}</SheetTitle>
            <SheetDescription>Full creator analytics</SheetDescription>
          </SheetHeader>
          {username && (
            <Tabs defaultValue={hasFirstParty ? "instagram" : "ours"} className="flex-1 flex flex-col min-h-0 gap-0">
              <div className="px-6 pt-3 pb-2 border-b shrink-0">
                <TabsList className="w-full">
                  <TabsTrigger value="instagram" className="flex-1 gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" /> Instagram Analytics
                  </TabsTrigger>
                  <TabsTrigger value="ours" className="flex-1 gap-1.5">
                    <Bot className="h-3.5 w-3.5" /> Our Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* (1) First-party Instagram — authoritative */}
              <TabsContent value="instagram" className="flex-1 overflow-y-auto m-0 px-6 py-5 data-[state=inactive]:hidden">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="mr-1 h-3 w-3" /> First-party · Instagram
                  </Badge>
                  <span className="text-xs text-muted-foreground">Owner-consented Graph API data — authoritative.</span>
                </div>
                {hasFirstParty ? (
                  <FirstPartyAudienceAnalytics
                    demographics={analytics?.demographics}
                    insights={analytics?.insights}
                    fetchedAt={analytics?.fetched_at}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
                    <Instagram className="mb-3 h-9 w-9 text-muted-foreground" />
                    <p className="text-sm font-medium">No first-party Instagram data</p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      This creator hasn’t connected Instagram (or it’s still syncing).
                      See “Our Analytics” for AI/Apify estimates.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* (2) Our Analytics — AI/Apify estimated (real creator-analytics page) */}
              <TabsContent value="ours" className="flex-1 m-0 flex flex-col min-h-0 data-[state=inactive]:hidden">
                <div className="px-6 py-2.5 border-b shrink-0 flex items-center gap-2">
                  <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Bot className="mr-1 h-3 w-3" /> AI / Apify · estimated
                  </Badge>
                  <span className="text-xs text-muted-foreground">Modelled from public signals — not first-party.</span>
                </div>
                <iframe
                  src={`/creator-analytics/${username}?embed=1`}
                  className="w-full flex-1 border-0"
                  title={`Analytics for @${username}`}
                />
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Section({ title, icon, right, children }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${accent ? "text-emerald-600" : ""}`}>{value}</p>
    </div>
  )
}

function TimelineRow({ label, at }: { label: string; at?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={`h-2 w-2 rounded-full shrink-0 ${at ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
      <span className={at ? "" : "text-muted-foreground"}>{label}</span>
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">{fmtDate(at)}</span>
    </div>
  )
}

function SubmissionCard({
  d, avatar, username, busy, onApprove, onReject,
}: {
  d: Deliverable; avatar?: string; username?: string; busy: string | null
  onApprove: () => void; onReject: () => void
}) {
  const meta = dtypeMeta(d.type)
  const Icon = meta.icon
  const isDone = d.status === "verified" || d.status === "approved"
  const showContent = d.status === "submitted" || isDone
  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
      <div className="relative aspect-[4/5]" style={{ background: gradientFor(d.id) }}>
        {showContent ? (
          <>
            {d.proof_url ? (
              <a href={d.proof_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
                {isImageProof(d.proof_url) ? (
                  <img src={d.proof_url} alt={`${meta.label} submission`} className="absolute inset-0 h-full w-full object-cover" />
                ) : isVideoProof(d.proof_url) ? (
                  <video src={d.proof_url} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/90">
                    <Icon className="h-9 w-9" /><span className="text-[10px] underline">Open submission</span>
                  </div>
                )}
                <span className="absolute bottom-1.5 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">View ↗</span>
              </a>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/85">
                <Icon className="h-9 w-9" /><span className="text-[10px]">Submitted — no media</span>
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/35 backdrop-blur px-2 py-0.5">
              <Avatar className="h-4 w-4"><AvatarImage src={avatar} /><AvatarFallback className="text-[8px]">{(username?.[0] ?? "?").toUpperCase()}</AvatarFallback></Avatar>
              <span className="text-[10px] text-white font-medium truncate max-w-[80px]">@{username}</span>
            </div>
            {isDone && (
              <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1"><CheckCircle2 className="h-3 w-3 text-white" /></div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/80">
            <Clock className="h-7 w-7" /><span className="text-[11px]">Not submitted yet</span>
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{meta.label}{d.quantity > 1 ? ` ×${d.quantity}` : ""}</span>
          <StatusPill status={d.status} />
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-auto">
          {isDone ? `Verified ${fmtDate(d.verified_at)}` : d.status === "submitted" ? `Submitted ${fmtDate(d.submitted_at)}` : `Due ${fmtDate(d.deadline)}`}
        </p>
        {d.status === "submitted" && (
          <div className="flex items-center gap-1.5 pt-1">
            <Button size="sm" className="h-7 flex-1 text-xs" disabled={!!busy} onClick={onApprove}>
              {busy === d.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Approve</>}
            </Button>
            <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" disabled={!!busy} onClick={onReject}>
              {busy === d.id + "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" />Reject</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40",
    approved: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40",
    submitted: "bg-amber-500/15 text-amber-700 border-amber-300/40",
    rejected: "bg-rose-500/15 text-rose-700 border-rose-300/40",
    pending: "bg-slate-500/10 text-slate-600 border-slate-300/40",
  }
  const label: Record<string, string> = { verified: "Verified", approved: "Approved", submitted: "Review", rejected: "Rejected", pending: "Pending" }
  return <Badge variant="outline" className={`text-[9px] ${map[status] ?? map.pending}`}>{label[status] ?? status}</Badge>
}
