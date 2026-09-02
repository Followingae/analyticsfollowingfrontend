"use client"

/**
 * Operations — everything in flight and everything waiting on us.
 *
 * One screen for the agency's own queue:
 *  - the figures across the live operational surfaces
 *  - a single action queue (deliverables, receipt claims, withdrawals, member reviews)
 *    with approve and reject in the row, wired to the live FA admin endpoints
 *  - the campaigns currently running
 *
 * Two things were wrong with it beyond the look.
 *
 * The five reads are settled independently, which is right — one refused endpoint must not
 * take the screen down. But a rejected read left its list at `[]`, and `[]` rendered as a
 * green tick and the words "You're all caught up here". On the screen whose entire job is
 * to say what is waiting on us, a failed request was reporting an all clear, and the figure
 * above it printed a confident zero. A source that did not answer now has no number and its
 * tab says the read failed.
 *
 * The rest is presentation: six metric cards, two bordered cards and a bordered line per
 * queue item put an edge around every single thing on the page. The figures are figures now,
 * grouped by the space around them, and the items are rows in one panel.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  ClipboardCheck, Receipt, Banknote, UserCheck, Megaphone, ListChecks,
  Check, X, ArrowRight, ChevronRight,
} from "lucide-react"
import {
  faDeliverableApi, faWithdrawalApi, faReceiptClaimApi, faMemberApi,
} from "@/services/faAdminApi"
import { operationsApi } from "@/services/operationsApi"
import { Aed, Empty, PageHead, Panel, Row, Stat, StatGrid } from "@/components/console/primitives"

// ── helpers ───────────────────────────────────────────────────────────
const unwrap = (res: any, ...keys: string[]) => {
  const d = res?.data ?? res
  for (const k of keys) {
    if (d && Array.isArray(d[k])) return d[k]
  }
  return Array.isArray(d) ? d : []
}
const fmtDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("en-AE", { month: "short", day: "numeric" }) : "-"
/** The figure only. The dirham mark is the `Aed` primitive's job, in the one font that has it. */
const fmtAED = (v: any) =>
  parseFloat(v || 0).toLocaleString("en-AE", { minimumFractionDigits: 0 })

/** A number we were never given is a dash. A real zero still prints 0. */
const num = (v: number | null) => (v == null ? "—" : v)

type QueueKind = "deliverable" | "receipt" | "withdrawal" | "member"

/** Which of the five reads did not answer this time. */
type Failed = Record<"deliverables" | "receipts" | "withdrawals" | "members" | "dash", boolean>
const NONE_FAILED: Failed = {
  deliverables: false, receipts: false, withdrawals: false, members: false, dash: false,
}

export default function AgencyOperationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [queues, setQueues] = useState<any | null>(null)
  const [failed, setFailed] = useState<Failed>(NONE_FAILED)
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
    // Which sources are silent this time. Kept so a queue with no answer can say so
    // instead of drawing the same green tick as a queue that is genuinely clear.
    setFailed({
      deliverables: d.status === "rejected",
      receipts: r.status === "rejected",
      withdrawals: w.status === "rejected",
      members: m.status === "rejected",
      dash: dash.status === "rejected",
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [load])

  // Authoritative counts from the backend dashboard (cross-campaign, includes
  // participant brand-approvals); fall back to the loaded item-list lengths — but only
  // where that list actually arrived. Where neither answered the count is null, not zero.
  const cnt = {
    deliverables: queues?.pending_deliverables ?? (failed.deliverables ? null : deliverables.length),
    participants: queues?.pending_participant_approvals ?? (failed.dash ? null : 0),
    withdrawals: queues?.pending_withdrawals ?? (failed.withdrawals ? null : withdrawals.length),
    members: queues?.pending_member_reviews ?? (failed.members ? null : members.length),
    receipts: failed.receipts ? null : receipts.length, // no backend receipt count yet
  }
  // Items actionable in the queue tabs below (participant approvals are handled
  // per-campaign, surfaced as a figure here until the per-campaign bridge lands).
  const queueItemsTotal = deliverables.length + receipts.length + withdrawals.length + members.length
  // A total is only a total when every part of it answered. One missing part and the sum
  // is a smaller number presented as the whole truth, which is worse than no number.
  const parts = [cnt.deliverables, cnt.participants, cnt.withdrawals, cnt.members, cnt.receipts]
  const totalPending = parts.some(p => p == null)
    ? null
    : parts.reduce((a, b) => (a as number) + (b as number), 0)
  const anyFailed = Object.values(failed).some(Boolean)

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
    { icon: Megaphone, label: "Campaigns in flight", tone: "info" as const,
      value: failed.dash ? null : campaigns.length, hint: "Live across all types" },
    { icon: ListChecks, label: "Waiting on us", value: totalPending, tone: "warn" as const,
      hint: totalPending == null ? "One of the queues did not answer" : "Across every queue" },
    { icon: ClipboardCheck, label: "Deliverables", value: cnt.deliverables, tone: "warn" as const,
      hint: "Content to verify" },
    { icon: UserCheck, label: "Participant approvals", value: cnt.participants, tone: "warn" as const,
      hint: "Waiting on the brand to sign off" },
    { icon: Receipt, label: "Receipt claims", value: cnt.receipts, tone: "warn" as const,
      hint: "Sent in, not yet read" },
    { icon: Banknote, label: "Withdrawals", value: cnt.withdrawals, tone: "warn" as const,
      hint: "Money creators have asked for" },
  ]), [totalPending, cnt.deliverables, cnt.participants, cnt.receipts, cnt.withdrawals,
       campaigns.length, failed.dash])

  // ── row renderers ───────────────────────────────────────────────────
  const ActionRow = ({ kind, id, title, meta, right }: {
    kind: QueueKind; id: string; title: string; meta: string; right?: React.ReactNode
  }) => (
    <Row
      tone="warn"
      title={title}
      meta={meta}
      right={right}
      actions={
        <>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" disabled={busyId === id}
            onClick={() => approve(kind, id)}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-full text-muted-foreground hover:text-destructive"
            disabled={busyId === id}
            onClick={() => setReject({ kind, id, label: title })}>
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </>
      }
    />
  )

  /**
   * Clear and unknown are not the same sentence.
   *
   * This said "No X pending. You're all caught up here." under a green tick regardless of
   * why the list was empty. A queue whose read was refused now says so, and says what it
   * means: there may be work here that nobody can see.
   */
  const QueueEmpty = ({ label, failed: didFail }: { label: string; failed: boolean }) =>
    didFail ? (
      <div className="space-y-3 px-6 py-10 text-center">
        <p className="text-sm font-medium">The {label} queue did not load.</p>
        <p className="text-sm text-muted-foreground">
          This is not an all clear: there may be {label} waiting that nobody can see.
        </p>
        <Button variant="outline" size="sm" onClick={load}>Try again</Button>
      </div>
    ) : (
      <Empty>Nothing waiting: every one of the {label} has been dealt with.</Empty>
    )

  const TabCount = ({ n, failed: didFail }: { n: number; failed: boolean }) =>
    didFail ? <Badge variant="outline" className="ml-1.5 h-5 px-1.5">—</Badge>
    : n > 0 ? <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 tabular-nums">{n}</Badge>
    : null

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="Operations"
          sub="Everything in flight, and everything waiting on us. Approve or turn down an item without leaving this screen."
          action={
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>Refresh</Button>
          }
        />

        {loading ? (
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-28 rounded-ds-sm" />
                <Skeleton className="h-9 w-16 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {anyFailed && (
              /* Said once, at the top, so nobody has to notice a dash to know the screen is
                 incomplete. The dashes below say which parts. */
              <p className="text-sm text-muted-foreground">
                Some of this screen did not load, so the figures with a dash are unknown rather
                than zero. <button type="button" onClick={load}
                  className="font-medium text-foreground underline underline-offset-4">Try again</button>
              </p>
            )}

            <StatGrid cols={3}>
              {kpis.map((k) => (
                <Stat key={k.label} label={k.label} value={num(k.value)} icon={k.icon}
                      tone={k.value ? k.tone : "neutral"} hint={k.hint} />
              ))}
            </StatGrid>
          </>
        )}

        <Panel
          title="Waiting on us"
          description="Approve it or turn it down, here"
          action={queueItemsTotal > 0
            ? <Badge variant="secondary" className="tabular-nums">{queueItemsTotal}</Badge>
            : undefined}
          flush
        >
          {loading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-ds-lg" />)}
            </div>
          ) : (
            <Tabs defaultValue="deliverables">
              <TabsList className="mx-6 mb-2">
                <TabsTrigger value="deliverables">Deliverables<TabCount n={deliverables.length} failed={failed.deliverables} /></TabsTrigger>
                <TabsTrigger value="receipts">Receipts<TabCount n={receipts.length} failed={failed.receipts} /></TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals<TabCount n={withdrawals.length} failed={failed.withdrawals} /></TabsTrigger>
                <TabsTrigger value="members">Member reviews<TabCount n={members.length} failed={failed.members} /></TabsTrigger>
              </TabsList>

              <TabsContent value="deliverables">
                {deliverables.length === 0
                  ? <QueueEmpty label="deliverables" failed={failed.deliverables} />
                  : deliverables.map((d) => (
                    <ActionRow key={d.id} kind="deliverable" id={d.id}
                      title={d.member_name || "Influencer"}
                      meta={`${d.type || "deliverable"}${d.quantity ? ` ×${d.quantity}` : ""} · due ${fmtDate(d.deadline)}`}
                      right={d.cashback_linked
                        ? <Badge variant="outline" className="tabular-nums"><Aed>{fmtAED(d.cashback_linked)}</Aed></Badge>
                        : null}
                    />
                  ))}
                {deliverables.length > 0 && (
                  <FullPageLink href="/superadmin/fa/deliverables?stage=proof_submitted" label="Open Deliverables" />
                )}
              </TabsContent>

              <TabsContent value="receipts">
                {receipts.length === 0
                  ? <QueueEmpty label="receipt claims" failed={failed.receipts} />
                  : receipts.map((c) => (
                    <ActionRow key={c.id} kind="receipt" id={c.id}
                      title={c.member?.full_name || c.member?.instagram_username || "Member"}
                      meta={`${c.ai_extracted_merchant || "Receipt"} · ${fmtDate(c.created_at)}`}
                    />
                  ))}
                {receipts.length > 0 && (
                  <FullPageLink href="/superadmin/fa/receipt-claims" label="Open Receipt Claims" />
                )}
              </TabsContent>

              <TabsContent value="withdrawals">
                {withdrawals.length === 0
                  ? <QueueEmpty label="withdrawals" failed={failed.withdrawals} />
                  : withdrawals.map((w) => (
                    <ActionRow key={w.id} kind="withdrawal" id={w.id}
                      title={w.member_name || w.account_holder || "Member"}
                      meta={`${w.iban || ""}${w.bank_name ? ` · ${w.bank_name}` : ""} · ${fmtDate(w.requested_at)}`}
                      right={<Badge variant="outline" className="tabular-nums"><Aed>{fmtAED(w.amount)}</Aed></Badge>}
                    />
                  ))}
                {withdrawals.length > 0 && (
                  <FullPageLink href="/superadmin/fa/withdrawals" label="Open Withdrawals" />
                )}
              </TabsContent>

              <TabsContent value="members">
                {members.length === 0
                  ? <QueueEmpty label="member reviews" failed={failed.members} />
                  : members.map((m) => (
                    <ActionRow key={m.id} kind="member" id={m.id}
                      title={m.full_name || `@${m.instagram_username || "member"}`}
                      meta={`${m.tier ? `${m.tier} · ` : ""}${(m.followers_count || 0).toLocaleString()} followers`}
                    />
                  ))}
                {members.length > 0 && (
                  <FullPageLink href="/superadmin/fa/members?tab=pending" label="Open Members" />
                )}
              </TabsContent>
            </Tabs>
          )}
        </Panel>

        <Panel
          title="Campaigns in flight"
          description="Running now, across every type"
          action={
            <Link href="/superadmin/fa/campaigns"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              View all
            </Link>
          }
          flush
        >
          {loading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-ds-lg" />)}
            </div>
          ) : failed.dash ? (
            <div className="space-y-3 px-6 py-10 text-center">
              <p className="text-sm font-medium">The campaign list did not load.</p>
              <p className="text-sm text-muted-foreground">
                Campaigns may be running that are not shown here.
              </p>
              <Button variant="outline" size="sm" onClick={load}>Try again</Button>
            </div>
          ) : campaigns.length === 0 ? (
            <Empty>Nothing is running right now.</Empty>
          ) : (
            campaigns.map((c) => (
              <Row
                key={c.id}
                tone="info"
                title={c.name || c.campaign_name || "Campaign"}
                meta={c.brand_name || "No client on it"}
                right={
                  <>
                    {c.type && <Badge variant="outline" className="capitalize">{String(c.type).replace(/_/g, " ")}</Badge>}
                    <Badge variant="secondary" className="capitalize">{c.status || "active"}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                }
                onClick={() => router.push(`/ops/campaigns/${c.id}`)}
              />
            ))
          )}
        </Panel>
      </div>

      {/* Reject dialog */}
      <Dialog open={!!reject} onOpenChange={(o: boolean) => { if (!o) { setReject(null); setRejectReason("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn down: {reject?.label}</DialogTitle>
            <DialogDescription>
              Say why, if it helps them fix it. The member is told where that applies.
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
            <Button variant="destructive" onClick={confirmReject} disabled={!!busyId}>Turn it down</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}

function FullPageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="mx-6 mb-4 mt-2 flex items-center justify-center gap-1.5 rounded-ds-lg py-2 text-xs text-muted-foreground transition-colors hover:bg-black/[0.035] hover:text-foreground dark:hover:bg-white/[0.05]">
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
