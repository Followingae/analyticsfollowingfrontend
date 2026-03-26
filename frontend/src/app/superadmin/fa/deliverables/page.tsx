"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, ExternalLink, ClipboardCheck, Camera } from "lucide-react"
import { faDeliverableApi } from "@/services/faAdminApi"
import { toast } from "sonner"

export default function FADeliverablesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faDeliverableApi.listPending()
      if (res.success) setDeliverables(res.data || [])
    } catch { toast.error("Failed to load deliverables") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleVerify = async (id: string) => {
    try {
      await faDeliverableApi.verify(id)
      toast.success("Deliverable verified — cashback released to influencer")
      load()
    } catch { toast.error("Failed to verify") }
  }

  const handleReject = async (id: string) => {
    try {
      await faDeliverableApi.reject(id)
      toast.success("Deliverable rejected")
      load()
    } catch { toast.error("Failed to reject") }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">FA Deliverables</h1>
            <p className="text-muted-foreground text-sm">Review and verify influencer content submissions</p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
          ) : deliverables.length === 0 ? (
            <Card><CardContent className="text-center py-12"><ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No pending deliverables</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {deliverables.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{d.member_name || "Influencer"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{d.type} x{d.quantity}</span>
                            <span>|</span>
                            <span>Due {new Date(d.deadline).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}</span>
                            {d.cashback_linked > 0 && (
                              <><span>|</span><span className="font-medium">AED {d.cashback_linked} linked</span></>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.proof_url && (
                          <a href={d.proof_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-1" />View Proof</Button>
                          </a>
                        )}
                        <Badge variant="secondary">{d.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleReject(d.id)}>
                          <X className="h-4 w-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" onClick={() => handleVerify(d.id)}>
                          <Check className="h-4 w-4 mr-1" />Verify
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
