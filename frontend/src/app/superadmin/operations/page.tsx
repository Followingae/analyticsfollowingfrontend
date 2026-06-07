"use client"

/**
 * Agency Operations — superadmin command center.
 *
 * One screen for "everything in flight and awaiting the agency's action":
 *  - KPIs across the live operational surfaces
 *  - a unified Action Queue (deliverables, receipt claims, withdrawals, member
 *    reviews) with inline approve/reject — the real pending items, wired to live
 *    FA admin endpoints
 *  - campaigns currently in flight
 *
 * This is the spine of the Operations OS (Phase B1). Deeper per-campaign
 * workstreams/deliverables build on top of this in later phases.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { StandardMetricCard } from "@/components/ui/standard-metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  ClipboardCheck, Receipt, Banknote, UserCheck, Megaphone, ListChecks,
  Check, X, ArrowRight, Inbox, CheckCircle2,
} from "lucide-react"
import {
  faDeliverableApi, faWithdrawalApi, faReceiptClaimApi, faMemberApi,
} from "@/services/faAdminApi"
import { operationsApi } from "@/services/operationsApi"

// ── helpers ───────────────────────────────────────────────────────────
const unwrap = (res: any, ...keys: string[]) => {
  const d = res?.data ?? res
  for (const k of keys) {
    if (d && Array.isArray(d[k])) return d[k]
  }
  return Array.isArray(d) ? d : []
}
const fmtDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("en-AE", { month: "short", day: "numeric" }) : "—"
const fmtAED = (v: any) =>
  `AED ${parseFloat(v || 0).toLocaleString("en-AE", { minimumFractionDigits: 0 })}`

type QueueKind = "deliverable" | "receipt" | "withdrawal" | "member"

export default function AgencyOperationsPage() {
  const [loading, setLoading] = useState(true)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [queues, setQueues] = useState<any | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // reject dialog
  const [reject, setReject] = useState<{ kind: QueueKind; id: string; label: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const [d, r, w, m, dash] = await Promise.allSettled([
      faDeliverableApi.listPending(),
      faReceiptClaimApi.list("pending_review"),
      faWithdrawalApi.listPending(),
      faMemberApi.list({ is_approved: 0, limit: 50 }),
      operationsApi.getDashboard(),
    ])
    if (d.status === "fulfilled") setDeliverables(unwrap(d.value, "deliverables"))
    if (r.status === "fulfilled") setReceipts(unwrap(r.value, "claims"))
    if (w.status === "fulfilled") setWithdrawals(unwrap(w.value, "withdrawals"))
    if (m.status === "fulfilled") setMembers(unwrap(m.value, "members"))
    if (dash.status === "fulfilled") {
      const dd = dash.value?.data ?? dash.value
      setCampaigns(Array.isArray(dd?.campaigns) ? dd.campaigns : [])
      setQueues(dd?.queues ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [load])

  // Authoritative counts from the backend dashboard (cross-campaign, includes
  // participant brand-approvals); fall back to the loaded item-list lengths.
  const cnt = {
    deliverables: queues?.pending_deliverables ?? deliverables.length,
    participants: queues?.pending_participant_approvals ?? 0,
    withdrawals: queues?.pending_withdrawals ?? withdrawals.length,
    members: queues?.pending_member_reviews ?? members.length,
    receipts: receipts.length, // no backend receipt count yet — use the live list
  }
  // Items actionable in the queue tabs below (participant approvals are handled
  // per-campaign, surfaced as a KPI here until the B3 per-campaign bridge lands).
  const queueItemsTotal = deliverables.length + receipts.length + withdrawals.length + members.length
  const totalPending = cnt.deliverables + cnt.participants + cnt.withdrawals + cnt.members + cnt.receipts

  // ── actions ─────────────────────────────────────────────────────────
  const removeFrom = (kind: QueueKind, id: string) => {
    if (kind === "deliverable") setDeliverables((x) => x.filter((i) => i.id !== id))
    if (kind === "receipt") setReceipts((x) => x.filter((i) => i.id !== id))
    if (kind === "withdrawal") setWithdrawals((x) => x.filter((i) => i.id !== id))
    if (kind === "member") setMembers((x) => x.filter((i) => i.id !== id))
  }

  const approve = async (kind: QueueKind, id: string) => {
    setBusyId(id)
    try {
      if (kind === "deliverable") await faDeliverableApi.verify(id)
      else if (kind === "receipt") await faReceiptClaimApi.approve(id)
      else if (kind === "withdrawal") await faWithdrawalApi.approve(id)
      else if (kind === "member") await faMemberApi.approve(id)
      removeFrom(kind, id)
      toast.success("Approved")
    } catch {
      toast.error("Action failed")
    } finally {
      setBusyId(null)
    }
  }

  const confirmReject = async () => {
    if (!reject) return
    const { kind, id } = reject
    setBusyId(id)
    try {
      const reason = rejectReason.trim() || undefined
      if (kind === "deliverable") await faDeliverableApi.reject(id, reason)
      else if (kind === "receipt") await faReceiptClaimApi.reject(id, reason)
      else if (kind === "withdrawal") await faWithdrawalApi.reject(id, reason)
      else if (kind === "member") await faMemberApi.reject(id, reason)
      removeFrom(kind, id)
      toast.success("Rejected")
    } catch {
      toast.error("Action failed")
    } finally {
      setBusyId(null)
      setReject(null)
      setRejectReason("")
    }
  }

  const kpis = useMemo(() => ([
    { icon: Megaphone, label: "Campaigns in flight", value: campaigns.length, subtitle: "live across all types" },
    { icon: ListChecks, label: "Pending Approvals", value: totalPending, subtitle: "across all queues" },
    { icon: ClipboardCheck, label: "Deliverables", value: cnt.deliverables, subtitle: "awaiting verification" },
    { icon: UserCheck, label: "Participant Approvals", value: cnt.participants, subtitle: "brand sign-off" },
    { icon: Receipt, label: "Receipt Claims", value: cnt.receipts, subtitle: "awaiting review" },
    { icon: Banknote, label: "Withdrawals", value: cnt.withdrawals, subtitle: "awaiting payout" },
  ]), [totalPending, cnt, campaigns])

  // ── row renderers ───────────────────────────────────────────────────
  const ActionRow = ({ kind, id, title, meta, right }: {
    kind: QueueKind; id: string; title: string; meta: string; right?: React.ReactNode
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        <Button size="sm" variant="outline" className="gap-1.5" disabled={busyId === id}
          onClick={() => approve(kind, id)}>
          <Check className="h-3.5 w-3.5" /> Approve
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive"
          disabled={busyId === id}
          onClick={() => setReject({ kind, id, label: title })}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>
    </div>
  )

  const QueueEmpty = ({ label }: { label: string }) => (
    <div className="py-10">
      <EmptyState title={`No ${label} pending`} description="You're all caught up here." icons={[CheckCircle2]} />
    </div>
  )

  const TabCount = ({ n }: { n: number }) =>
    n > 0 ? <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 tabular-nums">{n}</Badge> : null

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Agency command center — everything in flight and awaiting your action.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>Refresh</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)
            : kpis.map((k) => <StandardMetricCard key={k.label} {...k} />)}
        </div>

        {/* Action Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              Action Queue
              {queueItemsTotal > 0 && (
                <Badge variant="secondary" className="tabular-nums">{queueItemsTotal}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : (
              <Tabs defaultValue="deliverables">
                <TabsList className="mb-4">
                  <TabsTrigger value="deliverables">Deliverables<TabCount n={deliverables.length} /></TabsTrigger>
                  <TabsTrigger value="receipts">Receipts<TabCount n={receipts.length} /></TabsTrigger>
                  <TabsTrigger value="withdrawals">Withdrawals<TabCount n={withdrawals.length} /></TabsTrigger>
                  <TabsTrigger value="members">Member Reviews<TabCount n={members.length} /></TabsTrigger>
                </TabsList>

                <TabsContent value="deliverables" className="space-y-2">
                  {deliverables.length === 0 ? <QueueEmpty label="deliverables" /> : deliverables.map((d) => (
                    <ActionRow key={d.id} kind="deliverable" id={d.id}
                      title={d.member_name || "Influencer"}
                      meta={`${d.type || "deliverable"}${d.quantity ? ` ×${d.quantity}` : ""} · due ${fmtDate(d.deadline)}`}
                      right={d.cashback_linked ? <Badge variant="outline" className="font-mono text-xs">{fmtAED(d.cashback_linked)}</Badge> : null}
                    />
                  ))}
                  {deliverables.length > 0 && (
                    <FullPageLink href="/superadmin/fa/deliverables" label="Open Deliverables" />
                  )}
                </TabsContent>

                <TabsContent value="receipts" className="space-y-2">
                  {receipts.length === 0 ? <QueueEmpty label="receipt claims" /> : receipts.map((c) => (
                    <ActionRow key={c.id} kind="receipt" id={c.id}
                      title={c.member?.full_name || c.member?.instagram_username || "Member"}
                      meta={`${c.ai_extracted_merchant || "Receipt"} · ${fmtDate(c.created_at)}`}
                    />
                  ))}
                  {receipts.length > 0 && (
                    <FullPageLink href="/superadmin/fa/receipt-claims" label="Open Receipt Claims" />
                  )}
                </TabsContent>

                <TabsContent value="withdrawals" className="space-y-2">
                  {withdrawals.length === 0 ? <QueueEmpty label="withdrawals" /> : withdrawals.map((w) => (
                    <ActionRow key={w.id} kind="withdrawal" id={w.id}
                      title={w.member_name || w.account_holder || "Member"}
                      meta={`${w.iban || ""}${w.bank_name ? ` · ${w.bank_name}` : ""} · ${fmtDate(w.requested_at)}`}
                      right={<Badge variant="outline" className="font-mono text-xs">{fmtAED(w.amount)}</Badge>}
                    />
                  ))}
                  {withdrawals.length > 0 && (
                    <FullPageLink href="/superadmin/fa/withdrawals" label="Open Withdrawals" />
                  )}
                </TabsContent>

                <TabsContent value="members" className="space-y-2">
                  {members.length === 0 ? <QueueEmpty label="member reviews" /> : members.map((m) => (
                    <ActionRow key={m.id} kind="member" id={m.id}
                      title={m.full_name || `@${m.instagram_username || "member"}`}
                      meta={`${m.tier ? `${m.tier} · ` : ""}${(m.followers_count || 0).toLocaleString()} followers`}
                    />
                  ))}
                  {members.length > 0 && (
                    <FullPageLink href="/superadmin/fa/members" label="Open Members" />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Campaigns in flight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Campaigns in flight
              </span>
              <Link href="/superadmin/fa/campaigns" className="text-xs font-normal text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : campaigns.length === 0 ? (
              <div className="py-8"><EmptyState title="No active campaigns" description="Active campaigns will appear here as they launch." icons={[Megaphone]} /></div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 rounded-lg border px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{c.name || c.campaign_name || "Campaign"}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.brand_name || "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.type && <Badge variant="outline" className="capitalize text-xs">{String(c.type).replace(/_/g, " ")}</Badge>}
                      <Badge variant="secondary" className="capitalize text-xs">{c.status || "active"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject dialog */}
      <Dialog open={!!reject} onOpenChange={(o: boolean) => { if (!o) { setReject(null); setRejectReason("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject — {reject?.label}</DialogTitle>
            <DialogDescription>
              Add an optional reason. The member is notified where applicable.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setReject(null); setRejectReason("") }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!!busyId}>Confirm reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}

function FullPageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground">
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
