"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, X, Users, QrCode, Coins, Gift, Loader2, Sparkles, ChevronDown, Wand2 } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"

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
  }
  lifecycle: {
    invited_at?: string | null
    brand_approved_at?: string | null
    creator_accepted_at?: string | null
    joined_at?: string | null
    completed_at?: string | null
  }
  cashback: { scan_count: number; total_transaction_amount: number; total_cashback_amount: number }
  paid_deal: { payout_cents: number | null }
  barter: { items: any }
  deliverables: { pending: number; submitted: number; verified: number }
}

const STATUS_META: Record<ParticipantStatus, { label: string; tone: string }> = {
  pending_brand_approval: { label: "Awaiting approval", tone: "bg-amber-500/10 text-amber-600 border-amber-300/40" },
  brand_rejected:         { label: "Rejected",          tone: "bg-rose-500/10 text-rose-600 border-rose-300/40" },
  accepted:               { label: "Approved",          tone: "bg-blue-500/10 text-blue-600 border-blue-300/40" },
  declined_by_creator:    { label: "Declined",          tone: "bg-slate-500/10 text-slate-600 border-slate-300/40" },
  active:                 { label: "Active",            tone: "bg-emerald-500/10 text-emerald-600 border-emerald-300/40" },
  completed:              { label: "Completed",         tone: "bg-indigo-500/10 text-indigo-600 border-indigo-300/40" },
  cancelled:              { label: "Cancelled",         tone: "bg-slate-500/10 text-slate-600 border-slate-300/40" },
}

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
  return `د.إ ${amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function hoursSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 0
  return Math.floor((Date.now() - then) / 3_600_000)
}

function isStale(iso: string | null | undefined): boolean {
  return hoursSince(iso) >= 24
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
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [snapshot, setSnapshot] = useState<AiSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [snapshotOpen, setSnapshotOpen] = useState(false)

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
      setRejectReason("")
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

  const meta = TYPE_ICON[campaignType]
  const TypeIcon = meta.icon

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
      <div className="space-y-6">
        {/* AI Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="h-4 w-4 text-primary" />
                  AI Snapshot
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audience + content insights across your approved creators.
                </p>
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
          </CardHeader>
          {snapshot && snapshotOpen && (
            <CardContent className="space-y-4">
              {snapshot.headline && (
                <p className="text-sm font-medium leading-snug">{snapshot.headline}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {snapshot.scores?.total_reach != null && (
                  <SummaryCard
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    label="Combined reach"
                    value={snapshot.scores.total_reach.toLocaleString()}
                  />
                )}
                {snapshot.scores?.avg_engagement != null && (
                  <SummaryCard
                    icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                    label="Avg engagement"
                    value={`${snapshot.scores.avg_engagement}%`}
                  />
                )}
                {snapshot.scores?.authenticity != null && (
                  <SummaryCard
                    icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                    label="Authenticity"
                    value={`${snapshot.scores.authenticity}`}
                  />
                )}
                {snapshot.scores?.total_selected != null && (
                  <SummaryCard
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    label="Creators"
                    value={snapshot.scores.total_selected}
                  />
                )}
              </div>
              {Array.isArray(snapshot.recommendations) && snapshot.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations</p>
                  <ul className="space-y-1 text-sm">
                    {snapshot.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(snapshot.insights) && snapshot.insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {snapshot.insights.map((ins, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-semibold mb-2">{ins.title}</p>
                      {Array.isArray(ins.data) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(ins.data as Array<{ name: string; value: number }>).map((d, j) => (
                            <Badge key={j} variant="secondary" className="text-[10px]">
                              {d.name} · {d.value}%
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                          {JSON.stringify(ins.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Participants"
            value={participants.length}
          />
          <SummaryCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Pending review"
            value={grouped.pending.length}
          />
          <SummaryCard
            icon={<TypeIcon className={`h-4 w-4 ${meta.accent}`} />}
            label={campaignType === "cashback" ? "Total scans" : campaignType === "paid_deal" ? "Accepted" : "Accepted"}
            value={campaignType === "cashback" ? totalScans : grouped.active.length}
          />
          {campaignType === "cashback" && (
            <SummaryCard
              icon={<Coins className="h-4 w-4 text-emerald-600" />}
              label="Cashback paid"
              value={fmtAED(totalCashback)}
            />
          )}
          {campaignType !== "cashback" && (
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Completed"
              value={participants.filter((p) => p.status === "completed").length}
            />
          )}
        </div>

        {/* Pending approvals */}
        {grouped.pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Pending your approval ({grouped.pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ParticipantTable
                rows={grouped.pending}
                campaignType={campaignType}
                renderActions={(p) => (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      disabled={actionId === p.participant_id}
                      onClick={() => approve(p.participant_id)}
                    >
                      {actionId === p.participant_id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Check className="h-3.5 w-3.5 mr-1" />Approve</>}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={actionId === p.participant_id}>
                          <X className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject @{p.member.instagram_username}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The creator will see this rejection. You can optionally include a reason.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Label className="mt-2">Reason (optional)</Label>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Not a fit for this campaign..."
                          className="mt-1"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => reject(p.participant_id, rejectReason)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirm rejection
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Active + accepted */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TypeIcon className={`h-4 w-4 ${meta.accent}`} />
              {meta.label} progress ({grouped.active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : grouped.active.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No active participants yet.
              </div>
            ) : (
              <ParticipantTable rows={grouped.active} campaignType={campaignType} />
            )}
          </CardContent>
        </Card>

        {/* Other lifecycle states */}
        {grouped.other.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                History ({grouped.other.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ParticipantTable rows={grouped.other} campaignType={campaignType} />
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

function ParticipantTable({
  rows,
  campaignType,
  renderActions,
}: {
  rows: Participant[]
  campaignType: CampaignType
  renderActions?: (p: Participant) => React.ReactNode
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">Creator</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Source</TableHead>
          {campaignType === "cashback" && (
            <>
              <TableHead className="text-right">Scans</TableHead>
              <TableHead className="text-right">Claimed</TableHead>
              <TableHead className="text-right">Cashback</TableHead>
            </>
          )}
          {campaignType === "paid_deal" && (
            <TableHead className="text-right">Payout</TableHead>
          )}
          {campaignType === "barter" && (
            <TableHead>Items</TableHead>
          )}
          <TableHead>Deliverables</TableHead>
          {renderActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => {
          const statusMeta = STATUS_META[p.status]
          return (
            <TableRow key={p.participant_id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.member.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(p.member.instagram_username?.[0] ?? p.member.full_name?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight min-w-0">
                    <p className="font-medium text-sm truncate">@{p.member.instagram_username ?? "—"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {p.member.full_name && <span className="truncate max-w-[140px]">{p.member.full_name}</span>}
                      {p.member.tier && (
                        <Badge variant="outline" className="text-[10px] uppercase">{p.member.tier}</Badge>
                      )}
                      <span className="tabular-nums">{fmtCount(p.member.followers_count)} followers</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className={`text-xs w-fit ${statusMeta.tone}`}>
                    {statusMeta.label}
                  </Badge>
                  {/* SLA urgency — pending >24h */}
                  {p.status === "pending_brand_approval" && isStale(p.lifecycle.invited_at) && (
                    <Badge variant="outline" className="text-[10px] w-fit bg-rose-500/10 text-rose-600 border-rose-300/40">
                      Waiting {hoursSince(p.lifecycle.invited_at)}h
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {p.source === "applied" ? (
                    <Badge variant="outline" className="text-[10px] w-fit bg-blue-500/10 text-blue-600 border-blue-300/40">
                      Applied via app
                    </Badge>
                  ) : p.is_offline ? (
                    <Badge variant="outline" className="text-[10px] w-fit bg-amber-500/10 text-amber-700 border-amber-300/40">
                      Team Suggested · Offline
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] w-fit bg-purple-500/10 text-purple-600 border-purple-300/40">
                      Team Suggested
                    </Badge>
                  )}
                  {p.application_mode === "receipt" && p.receipt && (
                    <Badge variant="outline" className="text-[10px] w-fit bg-emerald-500/10 text-emerald-700 border-emerald-300/40">
                      Receipt on file · {p.receipt.amount != null ? fmtAED(p.receipt.amount) : "—"}
                    </Badge>
                  )}
                  {p.application_mode === "intent" && (
                    <Badge variant="outline" className="text-[10px] w-fit bg-sky-500/10 text-sky-700 border-sky-300/40">
                      Pre-visit application
                    </Badge>
                  )}
                </div>
              </TableCell>
              {campaignType === "cashback" && (
                <>
                  <TableCell className="text-right tabular-nums">{p.cashback.scan_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtAED(p.cashback.total_transaction_amount)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmtAED(p.cashback.total_cashback_amount)}</TableCell>
                </>
              )}
              {campaignType === "paid_deal" && (
                <TableCell className="text-right tabular-nums">
                  {p.paid_deal.payout_cents != null
                    ? fmtAED(p.paid_deal.payout_cents / 100)
                    : "—"}
                </TableCell>
              )}
              {campaignType === "barter" && (
                <TableCell>
                  {Array.isArray(p.barter.items) && p.barter.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.barter.items.slice(0, 2).map((it: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {typeof it === "string" ? it : (it.name ?? it.type ?? "item")}
                        </Badge>
                      ))}
                      {p.barter.items.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{p.barter.items.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2 text-xs">
                  {p.deliverables.verified > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300/40 border">
                          {p.deliverables.verified} verified
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Verified deliverables</TooltipContent>
                    </Tooltip>
                  )}
                  {p.deliverables.submitted > 0 && (
                    <Badge variant="outline" className="text-[10px]">{p.deliverables.submitted} submitted</Badge>
                  )}
                  {p.deliverables.pending > 0 && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300/40">
                      {p.deliverables.pending} pending
                    </Badge>
                  )}
                  {p.deliverables.pending === 0 && p.deliverables.submitted === 0 && p.deliverables.verified === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              {renderActions && (
                <TableCell className="text-right">{renderActions(p)}</TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
