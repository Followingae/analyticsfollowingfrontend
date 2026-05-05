"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Receipt, Check, X, Store, Clock, AlertCircle, ImageOff, ZoomIn } from "lucide-react"
import { faReceiptClaimApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const STATUS_TABS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

function confidenceBadge(score: number | null) {
  if (score == null) return <Badge variant="outline">N/A</Badge>
  const pct = Math.round(score * 100)
  if (pct >= 80) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{pct}%</Badge>
  if (pct >= 50) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{pct}%</Badge>
  return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{pct}%</Badge>
}

export default function FAReceiptClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending_review")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faReceiptClaimApi.list(activeTab)
      const list = res?.data?.claims || res?.data || []
      setClaims(Array.isArray(list) ? list : [])
    } catch {
      toast.error("Failed to load receipt claims")
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try {
      const res = await faReceiptClaimApi.approve(id)
      if (res.success) {
        toast.success(`Approved — ${res.data?.deliverables_created || 0} deliverables created, AED ${res.data?.cashback_amount || 0} cashback pending`)
        load()
      }
    } catch {
      toast.error("Failed to approve claim")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await faReceiptClaimApi.reject(id, rejectReason)
      toast.success("Receipt claim rejected")
      setRejectingId(null)
      setRejectReason("")
      load()
    } catch {
      toast.error("Failed to reject claim")
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Receipt Claims</h1>
            <p className="text-muted-foreground text-sm">
              Review AI-scanned receipt submissions from influencers
            </p>
          </div>

          {/* Status tabs */}
          <div className="flex gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
                {activeTab === tab.value && claims.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{claims.length}</Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Claims list */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No {activeTab.replace("_", " ")} receipt claims
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {claims.map((claim: any) => (
                <Card key={claim.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
                      {/* Receipt image — clickable thumbnail */}
                      <div className="flex-shrink-0">
                        {claim.receipt_image_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomedImage({
                                url: claim.receipt_image_url,
                                alt: `Receipt from ${claim.ai_extracted_merchant || "unknown merchant"} submitted by @${claim.member?.instagram_username || "unknown"}`,
                              })
                            }
                            className="group relative block h-36 w-28 overflow-hidden rounded-md border bg-muted/40 sm:h-40 sm:w-32"
                            aria-label="Open receipt image at full size"
                          >
                            <img
                              src={claim.receipt_image_url}
                              alt=""
                              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div
                            className="flex h-36 w-28 items-center justify-center rounded-md border border-dashed bg-muted/20 sm:h-40 sm:w-32"
                            aria-label="No receipt image available"
                          >
                            <ImageOff className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Right column: data + actions */}
                      <div className="flex flex-1 flex-col gap-4">
                      {/* Top row: influencer + merchant */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {claim.member?.full_name || "Unknown"}
                              </p>
                              {claim.member?.tier && (
                                <Badge variant="outline" className="text-xs">
                                  {claim.member.tier}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              @{claim.member?.instagram_username || "unknown"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold">
                            AED {claim.ai_extracted_amount?.toFixed(2) || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {claim.ai_extracted_date || "No date"}
                          </p>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {claim.ai_extracted_merchant || "Unknown merchant"}
                          </span>
                        </div>
                        <span className="text-muted-foreground">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">AI Confidence:</span>
                          {confidenceBadge(claim.ai_confidence_score)}
                        </div>
                        <span className="text-muted-foreground">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Campaign:</span>
                          {claim.matched_merchant ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              {claim.matched_merchant}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                              No match
                            </Badge>
                          )}
                        </div>
                        {claim.cashback_amount > 0 && (
                          <>
                            <span className="text-muted-foreground">|</span>
                            <span className="font-medium text-emerald-500">
                              AED {claim.cashback_amount?.toFixed(2)} cashback
                            </span>
                          </>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {claim.created_at
                            ? new Date(claim.created_at).toLocaleString("en-AE", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </div>

                        {/* Actions */}
                        {activeTab === "pending_review" && (
                          <div className="flex items-center gap-2">
                            {rejectingId === claim.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Rejection reason..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="h-8 w-48 text-sm"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(claim.id)}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setRejectingId(null); setRejectReason("") }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={() => handleApprove(claim.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => setRejectingId(claim.id)}
                                >
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {activeTab === "rejected" && claim.rejection_reason && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {claim.rejection_reason}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Receipt image zoom dialog */}
          <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
            <DialogContent className="max-w-4xl p-2">
              <DialogTitle className="sr-only">Receipt image</DialogTitle>
              {zoomedImage && (
                <img
                  src={zoomedImage.url}
                  alt={zoomedImage.alt}
                  className="max-h-[85vh] w-full rounded object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
