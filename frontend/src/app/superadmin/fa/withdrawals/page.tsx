"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, X, Banknote } from "lucide-react"
import { faWithdrawalApi } from "@/services/faAdminApi"
import { toast } from "sonner"

export default function FAWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faWithdrawalApi.listPending()
      if (res.success) setWithdrawals(res.data || [])
    } catch { toast.error("Failed to load withdrawals") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try {
      await faWithdrawalApi.approve(id)
      toast.success("Withdrawal approved — funds will be transferred")
      load()
    } catch { toast.error("Failed to approve") }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await faWithdrawalApi.reject(rejectId, rejectReason)
      toast.success("Withdrawal rejected — funds returned to wallet")
      setRejectId(null)
      setRejectReason("")
      load()
    } catch { toast.error("Failed to reject") }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">FA Withdrawals</h1>
            <p className="text-muted-foreground text-sm">Process influencer bank withdrawal requests</p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
          ) : withdrawals.length === 0 ? (
            <Card><CardContent className="text-center py-12"><Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No pending withdrawals</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w: any) => (
                <Card key={w.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{w.member_name || w.account_holder}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono">AED {parseFloat(w.amount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}</span>
                            <span>|</span>
                            <span className="font-mono text-xs">{w.iban}</span>
                            {w.bank_name && <><span>|</span><span>{w.bank_name}</span></>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested {new Date(w.requested_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{w.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(w.id)}>
                          <X className="h-4 w-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(w.id)}>
                          <Check className="h-4 w-4 mr-1" />Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) { setRejectId(null); setRejectReason("") } }}>
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
