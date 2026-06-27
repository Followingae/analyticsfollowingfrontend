"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Check, X, Banknote, Loader2, Clock, CheckCircle2, XCircle, Instagram } from "lucide-react"
import { faWithdrawalApi } from "@/services/faAdminApi"
import { formatCurrencyAED } from "@/components/ui/currency"
import { toast } from "sonner"

type TabKey = "pending" | "completed" | "failed"

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-500/10 text-amber-600 border-amber-300",
  processing: "bg-blue-500/10 text-blue-600 border-blue-300",
  completed:  "bg-emerald-500/10 text-emerald-600 border-emerald-300",
  failed:     "bg-red-500/10 text-red-600 border-red-300",
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })
}

function WithdrawalCard({
  w,
  onApprove,
  onReject,
}: {
  w: any
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}) {
  const actionable = !!onApprove && !!onReject
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{w.member_name || w.account_holder}</p>
                {w.instagram_username && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Instagram className="h-3 w-3" />@{w.instagram_username}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span className="font-mono font-semibold text-foreground">AED {formatCurrencyAED(Number(w.amount) || 0)}</span>
                <span>|</span>
                <span className="font-mono text-xs">{w.iban}</span>
                {w.bank_name && <><span>|</span><span>{w.bank_name}</span></>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requested {fmtDate(w.requested_at)}
                {w.processed_at && <> · Processed {fmtDate(w.processed_at)}</>}
              </p>
              {w.failure_reason && (
                <p className="text-xs text-red-600 mt-1">Reason: {w.failure_reason}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={STATUS_STYLES[w.status] || ""}>{w.status}</Badge>
            {actionable && (
              <>
                <Button size="sm" variant="outline" onClick={() => onReject!(w.id)}>
                  <X className="h-4 w-4 mr-1" />Reject
                </Button>
                <Button size="sm" onClick={() => onApprove!(w.id)}>
                  <Check className="h-4 w-4 mr-1" />Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
      toast.error("Failed to load withdrawals")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try {
      await faWithdrawalApi.approve(id)
      toast.success("Withdrawal approved - funds will be transferred")
      load()
    } catch { toast.error("Failed to approve") }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await faWithdrawalApi.reject(rejectId, rejectReason)
      toast.success("Withdrawal rejected - funds returned to wallet")
      setRejectId(null)
      setRejectReason("")
      load()
    } catch { toast.error("Failed to reject") }
  }

  const emptyCopy: Record<TabKey, string> = {
    pending: "No pending withdrawals",
    completed: "No completed withdrawals",
    failed: "No failed withdrawals",
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading...</p>
        </div>
      )
    }
    if (error) {
      return (
        <Card><CardContent className="text-center py-12">
          <Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Couldn&apos;t load withdrawals</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
        </CardContent></Card>
      )
    }
    if (withdrawals.length === 0) {
      return (
        <Card><CardContent className="text-center py-12">
          <Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{emptyCopy[tab]}</p>
        </CardContent></Card>
      )
    }
    return (
      <div className="space-y-3">
        {withdrawals.map((w: any) => (
          <WithdrawalCard
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
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">FA Withdrawals</h1>
            <p className="text-muted-foreground text-sm">Process bank withdrawal requests and review history</p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="pending"><Clock className="h-3.5 w-3.5" />Pending</TabsTrigger>
              <TabsTrigger value="completed"><CheckCircle2 className="h-3.5 w-3.5" />Completed</TabsTrigger>
              <TabsTrigger value="failed"><XCircle className="h-3.5 w-3.5" />Failed</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {renderList()}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!rejectId} onOpenChange={(o: boolean) => { if (!o) { setRejectId(null); setRejectReason("") } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Funds will be returned to the influencer&apos;s available balance.</p>
              <Input placeholder="Reason for rejection (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason("") }}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject}>Reject Withdrawal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
