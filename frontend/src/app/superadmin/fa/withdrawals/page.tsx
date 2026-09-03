"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PageHead } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE, TONE_TEXT, type Tone } from "../_ui"
import { Check, X, Clock, CheckCircle2, XCircle, Instagram } from "lucide-react"
import { faWithdrawalApi } from "@/services/faAdminApi"
import { formatCurrencyAED } from "@/components/ui/currency"
import { Aed } from "@/components/console/primitives"
import { toast } from "sonner"

type TabKey = "pending" | "completed" | "failed"

/* Five hand-picked palette steps, one per status, none of which matched the amber or the
   green anywhere else in the console. They name the console tone tokens now: waiting is
   amber, done is green, broken is rose, everywhere. */
const STATUS_TONE: Record<string, Tone> = {
  pending: "warn",
  processing: "info",
  completed: "good",
  failed: "bad",
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * One request, as a list line rather than a card.
 *
 * It was a Card each: a border, a shadow and its own padding per row, so reading a queue
 * of twenty meant crossing forty edges. It is a list, so it is drawn as one. Every field
 * the card carried is still on the row.
 */
function WithdrawalRow({
  w,
  onApprove,
  onReject,
}: {
  w: any
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}) {
  const actionable = !!onApprove && !!onReject
  const tone: Tone = STATUS_TONE[w.status] ?? "neutral"
  return (
    <div className="flex flex-wrap items-start justify-between gap-ds-3 py-ds-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{w.member_name || w.account_holder}</p>
          {w.instagram_username && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Instagram className="h-3 w-3" />@{w.instagram_username}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            <Aed>{formatCurrencyAED(Number(w.amount) || 0)}</Aed>
          </span>
          <span>·</span>
          <span className="tabular-nums">{w.iban}</span>
          {w.bank_name && <><span>·</span><span>{w.bank_name}</span></>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Requested {fmtDate(w.requested_at)}
          {w.processed_at && <> · Processed {fmtDate(w.processed_at)}</>}
        </p>
        {w.failure_reason && (
          <p className={`mt-1 text-xs ${TONE_TEXT.bad}`}>Why it failed: {w.failure_reason}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className={`capitalize ${TONE_BADGE[tone]}`}>{w.status}</Badge>
        {actionable && (
          <>
            <Button size="sm" variant="outline" onClick={() => onReject!(w.id)}>
              <X className="mr-1 h-4 w-4" />Reject
            </Button>
            <Button size="sm" onClick={() => onApprove!(w.id)}>
              <Check className="mr-1 h-4 w-4" />Approve
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function FAWithdrawalsPage() {
  const [tab, setTab] = useState<TabKey>("pending")
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = tab === "pending"
        ? await faWithdrawalApi.listPending()
        : await faWithdrawalApi.list({ status: tab, limit: 100 })
      const list = res?.data?.withdrawals || res?.data || []
      setWithdrawals(Array.isArray(list) ? list : [])
    } catch {
      setError(true)
      toast.error("Could not load withdrawals")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try {
      await faWithdrawalApi.approve(id)
      toast.success("Approved. The transfer goes out from here.")
      load()
    } catch { toast.error("Could not approve it") }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await faWithdrawalApi.reject(rejectId, rejectReason)
      toast.success("Rejected. The money is back in the creator's wallet.")
      setRejectId(null)
      setRejectReason("")
      load()
    } catch { toast.error("Could not reject it") }
  }

  const emptyCopy: Record<TabKey, string> = {
    pending: "Nobody is waiting to be paid.",
    completed: "Nothing has been paid out yet.",
    failed: "No transfer has failed.",
  }

  const renderList = () => {
    if (loading) return <Loading label="Loading withdrawals" />
    if (error) return <Failed what="withdrawals" onRetry={load} />
    if (withdrawals.length === 0) return <Nothing>{emptyCopy[tab]}</Nothing>
    return (
      <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {withdrawals.map((w: any) => (
          <WithdrawalRow
            key={w.id}
            w={w}
            onApprove={tab === "pending" ? handleApprove : undefined}
            onReject={tab === "pending" ? (id) => setRejectId(id) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <FaPage>
          <PageHead
            title="Withdrawals"
            sub="Creators asking for their balance in the bank. Approving one sends the transfer, so check the IBAN against the name before you do."
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="pending"><Clock className="h-3.5 w-3.5" />Waiting on us</TabsTrigger>
              <TabsTrigger value="completed"><CheckCircle2 className="h-3.5 w-3.5" />Paid</TabsTrigger>
              <TabsTrigger value="failed"><XCircle className="h-3.5 w-3.5" />Failed</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-ds-3">
              {renderList()}
            </TabsContent>
          </Tabs>
        </FaPage>

        <Dialog open={!!rejectId} onOpenChange={(o: boolean) => { if (!o) { setRejectId(null); setRejectReason("") } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject this withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The money goes straight back to the creator&apos;s available balance. They can ask again.
              </p>
              <Input
                placeholder="Why, in a line the creator will read (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason("") }}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject}>Reject and return the money</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
