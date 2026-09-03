"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Store, Clock, AlertCircle, ImageOff, ZoomIn } from "lucide-react"
import { PageHead, Aed } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE, TONE_TEXT } from "../_ui"
import { faReceiptClaimApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const STATUS_TABS = [
  { value: "pending_review", label: "Waiting on us" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

const EMPTY_COPY: Record<string, string> = {
  pending_review: "No receipt is waiting to be reviewed.",
  approved: "No receipt has been approved yet.",
  rejected: "No receipt has been rejected.",
}

/**
 * How sure the scanner is about what it read off the receipt.
 *
 * A missing score is "N/A", not 0%: the scan not running and the scan being certain it
 * read nothing are different facts, and only one of them means "check this by hand".
 */
function confidenceBadge(score: number | null) {
  if (score == null) return <Badge variant="outline" className={TONE_BADGE.neutral}>Not scored</Badge>
  const pct = Math.round(score * 100)
  const tone = pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad"
  return <Badge variant="outline" className={TONE_BADGE[tone]}>{pct}% sure</Badge>
}

export default function FAReceiptClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  /* Whether the list actually answered. Without it a failed request emptied the queue and
     the screen said "No pending review receipt claims" — a review queue reporting itself
     clear because it never managed to ask. */
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState("pending_review")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null)
  // Tracks the in-flight claim id so we can disable both approve + reject for it.
  // Without this, an admin double-click hits /approve twice and credits cashback twice.
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await faReceiptClaimApi.list(activeTab)
      const list = res?.data?.claims || res?.data || []
      setClaims(Array.isArray(list) ? list : [])
    } catch (e: any) {
      setError(true)
      toast.error(e?.message || e?.detail || "Could not load receipt claims")
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    if (actingId) return
    setActingId(id)
    try {
      const res = await faReceiptClaimApi.approve(id)
      if (res.success) {
        toast.success(`Approved. ${res.data?.deliverables_created || 0} deliverables created, AED ${res.data?.cashback_amount || 0} cashback now pending.`)
        load()
      }
    } catch (e: any) {
      toast.error(e?.message || e?.detail || "Could not approve the claim")
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (actingId) return
    setActingId(id)
    try {
      await faReceiptClaimApi.reject(id, rejectReason)
      toast.success("Receipt claim rejected")
      setRejectingId(null)
      setRejectReason("")
      load()
    } catch (e: any) {
      toast.error(e?.message || e?.detail || "Could not reject the claim")
    } finally {
      setActingId(null)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <FaPage>
          <PageHead
            title="Receipt claims"
            sub="Creators photograph a till receipt, the scanner reads the merchant, the amount and the date, and you decide. Approving one creates the deliverables and puts the cashback in their wallet."
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {activeTab === tab.value && !loading && !error && claims.length > 0 && (
                    <span className="ml-1.5 tabular-nums text-muted-foreground">{claims.length}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <Loading label="Loading claims" />
          ) : error ? (
            <Failed what="receipt claims" onRetry={load} />
          ) : claims.length === 0 ? (
            <Nothing>{EMPTY_COPY[activeTab] ?? "Nothing here."}</Nothing>
          ) : (
            /* Was a Card each. The receipt photo is the object here, so it keeps its own
               frame; the box around the whole claim comes off and the rule between rows
               does the separating. */
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {claims.map((claim: any) => (
                <div key={claim.id} className="flex flex-col gap-ds-3 py-ds-3 sm:flex-row">
                  {/* Receipt image, clickable thumbnail */}
                  <div className="flex-shrink-0">
                    {claim.receipt_image_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedImage({
                            url: claim.receipt_image_url,
                            alt: `Receipt from ${claim.ai_extracted_merchant || "an unknown merchant"} submitted by @${claim.member?.instagram_username || "unknown"}`,
                          })
                        }
                        className="group relative block h-36 w-28 overflow-hidden rounded-ds-md border border-black/[0.06] bg-black/[0.02] sm:h-40 sm:w-32 dark:border-white/[0.07] dark:bg-white/[0.04]"
                        aria-label="Open the receipt at full size"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        className="flex h-36 w-28 items-center justify-center rounded-ds-md border border-dashed border-black/[0.08] sm:h-40 sm:w-32 dark:border-white/[0.09]"
                        aria-label="No receipt image was attached"
                      >
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Right column: data + actions */}
                  <div className="flex flex-1 flex-col gap-ds-3">
                    <div className="flex items-start justify-between gap-ds-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{claim.member?.full_name || "Unknown creator"}</p>
                          {claim.member?.tier && (
                            <Badge variant="outline" className={`text-xs ${TONE_BADGE.neutral}`}>
                              {claim.member.tier}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{claim.member?.instagram_username || "unknown"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xl font-semibold tabular-nums">
                          <Aed>{claim.ai_extracted_amount?.toFixed(2) ?? "—"}</Aed>
                        </p>
                        <p className="text-ds-caption text-muted-foreground">
                          {claim.ai_extracted_date || "No date read"}
                        </p>
                      </div>
                    </div>

                    {/* What the scanner read */}
                    <div className="flex flex-wrap items-center gap-x-ds-3 gap-y-ds-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {claim.ai_extracted_merchant || "Merchant not read"}
                        </span>
                      </span>
                      {confidenceBadge(claim.ai_confidence_score)}
                      {claim.matched_merchant ? (
                        <Badge variant="outline" className={TONE_BADGE.good}>
                          Matches {claim.matched_merchant}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={TONE_BADGE.bad}>
                          No campaign matches this merchant
                        </Badge>
                      )}
                      {claim.cashback_amount > 0 && (
                        <span className={`font-medium ${TONE_TEXT.good}`}>
                          <Aed>{claim.cashback_amount?.toFixed(2)}</Aed> cashback
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-ds-2">
                      <span className="inline-flex items-center gap-1.5 text-ds-caption text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {claim.created_at
                          ? new Date(claim.created_at).toLocaleString("en-AE", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </span>

                      {activeTab === "pending_review" && (
                        <div className="flex items-center gap-2">
                          {rejectingId === claim.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Why, in a line the creator will read"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="h-8 w-56 text-sm"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actingId === claim.id}
                                onClick={() => handleReject(claim.id)}
                              >
                                {actingId === claim.id ? "Rejecting" : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actingId === claim.id}
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
                                disabled={actingId === claim.id}
                                onClick={() => setRejectingId(claim.id)}
                              >
                                <X className="mr-1 h-4 w-4" />Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={actingId === claim.id}
                                onClick={() => handleApprove(claim.id)}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                {actingId === claim.id ? "Approving" : "Approve"}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {activeTab === "rejected" && claim.rejection_reason && (
                        <span className={`inline-flex items-center gap-1.5 text-ds-caption ${TONE_TEXT.bad}`}>
                          <AlertCircle className="h-3 w-3" />
                          {claim.rejection_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Receipt image zoom dialog */}
          <Dialog open={!!zoomedImage} onOpenChange={(open: boolean) => !open && setZoomedImage(null)}>
            <DialogContent className="max-w-4xl p-2">
              <DialogTitle className="sr-only">Receipt image</DialogTitle>
              {zoomedImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={zoomedImage.url}
                  alt={zoomedImage.alt}
                  className="max-h-[85vh] w-full rounded object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
