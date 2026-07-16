"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X, ExternalLink, ClipboardCheck, Camera, ImageIcon, Loader2, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { faDeliverableApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface Deliverable {
  id: string
  member_id: string | null
  member_name: string | null
  member_handle: string | null
  campaign_id: string | null
  campaign_name: string | null
  campaign_type: string | null
  type: string
  quantity: number
  deadline: string | null
  status: string
  content_status: string | null
  content_url: string | null
  content_urls: string[] | null
  proof_url: string | null
  revision_count: number
  revision_limit: number
  rejection_reason: string | null
  stage: string
  submitted_at: string | null
  verified_at: string | null
  cashback_linked: number
  created_at: string | null
}

// Filters map to the backend `stage` query (computed from content_status + status).
const FILTERS: { value: string; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "content_review", label: "Content review" },
  { value: "revision_requested", label: "Edit requested" },
  { value: "content_approved", label: "Approved · awaiting post" },
  { value: "proof_submitted", label: "Proof submitted" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "archive", label: "Archive" },
  { value: "all", label: "All" },
]

const STAGE_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-slate-500/10 text-slate-600 border-slate-300/40" },
  content_review: { label: "Content review", cls: "bg-amber-500/15 text-amber-700 border-amber-300/40" },
  revision_requested: { label: "Edit requested", cls: "bg-orange-500/15 text-orange-700 border-orange-300/40" },
  content_approved: { label: "Approved · awaiting post", cls: "bg-sky-500/15 text-sky-700 border-sky-300/40" },
  proof_submitted: { label: "Proof submitted", cls: "bg-violet-500/15 text-violet-700 border-violet-300/40" },
  verified: { label: "Verified", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" },
  rejected: { label: "Rejected", cls: "bg-rose-500/15 text-rose-700 border-rose-300/40" },
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric" }) : "—"

// Creators occasionally type a message ("Contact me in WhatsApp") instead of a link;
// rendering that as an href navigates to a broken relative URL. Link only real URLs.
const isHttpUrl = (v?: string | null): v is string =>
  !!v && (v.startsWith("http://") || v.startsWith("https://"))

// In-page media kind — raw R2/CDN files (especially iPhone .mov) don't view well in a
// bare browser tab, so we render them in a dialog with <img>/<video> instead.
const mediaKind = (url: string): "image" | "video" | "other" => {
  try {
    const p = new URL(url).pathname.toLowerCase()
    if (/\.(jpe?g|png|webp|gif|avif|heic)$/.test(p)) return "image"
    if (/\.(mp4|mov|webm|m4v)$/.test(p)) return "video"
  } catch { /* fall through */ }
  return "other"
}

export default function FADeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("active")
  const [busy, setBusy] = useState<string | null>(null)
  const [editNote, setEditNote] = useState("")
  // In-page content viewer: which deliverable's files are open + current index
  const [viewer, setViewer] = useState<{ d: Deliverable; urls: string[]; index: number } | null>(null)

  const load = useCallback(async (stage: string) => {
    setLoading(true)
    try {
      const res = await faDeliverableApi.listAll({ stage, limit: 100 })
      const list = res?.data?.deliverables || []
      setDeliverables(Array.isArray(list) ? list : [])
    } catch { toast.error("Failed to load deliverables") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  const act = async (key: string, fn: () => Promise<any>, okMsg: string) => {
    setBusy(key)
    try {
      const r = await fn()
      if (r && r.success === false) throw new Error(r.detail || r.message || "Action failed")
      toast.success(okMsg)
      await load(filter)
    } catch (e: any) {
      toast.error(e?.message || "Action failed")
    } finally {
      setBusy(null)
    }
  }

  const approveContent = (d: Deliverable) => {
    if (!d.campaign_id) return toast.error("No campaign linked")
    return act(d.id + "ac", () => faDeliverableApi.approveContent(d.campaign_id!, d.id), "Content approved — creator notified")
  }
  const requestEdit = (d: Deliverable, note: string) => {
    if (!d.campaign_id) return toast.error("No campaign linked")
    return act(d.id + "re", () => faDeliverableApi.requestEdit(d.campaign_id!, d.id, note || undefined), "Edit requested")
  }
  // Proof verification is Following-team ONLY — the campaign-scoped /confirm endpoint
  // is intentionally disabled (403) for everyone, so always use the admin verify route.
  const confirm = (d: Deliverable) =>
    act(d.id + "cf", () => faDeliverableApi.verify(d.id), "Verified — payout released")
  const reject = (d: Deliverable) =>
    act(d.id + "rj", () => faDeliverableApi.reject(d.id), "Deliverable rejected")

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">FA Deliverables</h1>
            <p className="text-muted-foreground text-sm">
              Oversight across every campaign — content review, proof of posting, and verification.
            </p>
          </div>

          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex flex-wrap h-auto">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs">{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
          ) : deliverables.length === 0 ? (
            <Card><CardContent className="text-center py-12">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No deliverables in this view</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {deliverables.map((d) => {
                const meta = STAGE_META[d.stage] ?? STAGE_META.pending
                const isContentReview = d.stage === "content_review"
                const isProofSubmitted = d.stage === "proof_submitted"
                const editsLeft = Math.max(0, (d.revision_limit ?? 2) - (d.revision_count ?? 0))
                return (
                  <Card key={d.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Camera className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {d.member_handle ? `@${d.member_handle}` : d.member_name || "Creator"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-0.5">
                              <span className="truncate">{d.campaign_name || "—"}</span>
                              {d.campaign_type && <Badge variant="outline" className="text-[10px]">{d.campaign_type}</Badge>}
                              <span>·</span>
                              <span>{d.type} x{d.quantity}</span>
                              <span>·</span>
                              <span>Due {fmtDate(d.deadline)}</span>
                              {d.cashback_linked > 0 && <><span>·</span><span className="font-medium">AED {d.cashback_linked} linked</span></>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                              {(d.revision_count ?? 0) > 0 && (
                                <span className="text-[11px] text-muted-foreground">
                                  {d.revision_count}/{d.revision_limit} edits used
                                </span>
                              )}
                              {d.rejection_reason && (
                                <span className="text-[11px] text-orange-600 italic truncate max-w-[280px]">“{d.rejection_reason}”</span>
                              )}
                              {d.content_url && !isHttpUrl(d.content_url) && (
                                <span className="text-[11px] text-amber-700 italic truncate max-w-[320px]" title={d.content_url}>
                                  Creator note: “{d.content_url}”
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {(() => {
                            const urls = (d.content_urls && d.content_urls.length > 0
                              ? d.content_urls
                              : isHttpUrl(d.content_url) ? [d.content_url] : []
                            ).filter(isHttpUrl)
                            if (urls.length === 0) return null
                            return (
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setViewer({ d, urls, index: 0 })}>
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Content{urls.length > 1 ? ` (${urls.length})` : ""}
                              </Button>
                            )
                          })()}
                          {isHttpUrl(d.proof_url) && (
                            <a href={d.proof_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="text-xs"><ExternalLink className="h-4 w-4 mr-1" />Proof</Button>
                            </a>
                          )}

                          {isContentReview && (
                            <>
                              {/* Request edit is intentionally understated to favour fast approvals. */}
                              {editsLeft > 0 && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" disabled={!!busy}>
                                      <Pencil className="h-3.5 w-3.5 mr-1" />Request edit
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Request an edit</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        The creator will be asked to resubmit. {editsLeft} edit{editsLeft !== 1 ? "s" : ""} remaining for this {d.campaign_type || "campaign"}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="What needs changing? (optional)" />
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setEditNote("")}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => { requestEdit(d, editNote); setEditNote("") }}>
                                        Send edit request
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              <Button size="sm" disabled={!!busy} onClick={() => approveContent(d)}>
                                {busy === d.id + "ac" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Approve content</>}
                              </Button>
                            </>
                          )}

                          {isProofSubmitted && (
                            <>
                              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => reject(d)}>
                                <X className="h-4 w-4 mr-1" />Reject
                              </Button>
                              <Button size="sm" disabled={!!busy} onClick={() => confirm(d)}>
                                {busy === d.id + "cf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Verify</>}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* In-page content viewer — images and videos render right here instead of a
              raw file tab (Chrome downloads .mov files rather than playing them). */}
          <Dialog open={!!viewer} onOpenChange={(o: boolean) => { if (!o) setViewer(null) }}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                  {viewer?.d.member_handle ? `@${viewer.d.member_handle}` : viewer?.d.member_name || "Creator"}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {viewer?.d.campaign_name} · {viewer?.d.type} x{viewer?.d.quantity}
                  </span>
                </DialogTitle>
              </DialogHeader>
              {viewer && (() => {
                const url = viewer.urls[viewer.index]
                const kind = mediaKind(url)
                return (
                  <div className="space-y-3">
                    <div className="relative flex items-center justify-center rounded-lg bg-black/90 min-h-[320px] max-h-[70vh] overflow-hidden">
                      {kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="Submitted content" className="max-h-[70vh] w-auto object-contain" />
                      ) : kind === "video" ? (
                        <video key={url} src={url} controls autoPlay playsInline className="max-h-[70vh] w-full" />
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-10">
                          This file type can&apos;t be previewed here.
                        </div>
                      )}
                      {viewer.urls.length > 1 && (
                        <>
                          <Button
                            size="icon" variant="secondary"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80"
                            disabled={viewer.index === 0}
                            onClick={() => setViewer({ ...viewer, index: viewer.index - 1 })}
                          ><ChevronLeft className="h-4 w-4" /></Button>
                          <Button
                            size="icon" variant="secondary"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80"
                            disabled={viewer.index === viewer.urls.length - 1}
                            onClick={() => setViewer({ ...viewer, index: viewer.index + 1 })}
                          ><ChevronRight className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{viewer.urls.length > 1 ? `File ${viewer.index + 1} of ${viewer.urls.length}` : " "}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="h-3 w-3" />Open original
                      </a>
                    </div>
                  </div>
                )
              })()}
            </DialogContent>
          </Dialog>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
