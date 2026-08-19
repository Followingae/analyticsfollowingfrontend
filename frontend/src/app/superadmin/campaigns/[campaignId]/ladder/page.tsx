"use client"

/**
 * The delivery board — every booked creator on a campaign, and the rung they are on.
 *
 * Laid out as the journey itself: one column per rung, creators sitting in the column they
 * have reached, so "where is everyone" is answered by looking rather than by opening eight
 * records. A card carries the face, because a board of faces reads faster than a table of
 * handles.
 *
 * Acting happens in place. Clicking a creator opens the panel for the rung they are on and
 * nothing else — the next thing to do, not a form with eight fields where seven are wrong.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertTriangle, FileText, Send,
  Image as ImageIcon, Link2, Banknote, UserMinus,
} from "lucide-react"
import { toast } from "sonner"
import { ladderApi, STAGES, type LadderCreator, type Stage } from "@/services/ladderApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { cdnAvatar } from "@/lib/avatar"
import { CARD } from "@/components/console/primitives"

const aed = (cents?: number | null) =>
  cents == null ? null : `AED ${(cents / 100).toLocaleString("en-AE")}`

const compact = (n?: number | null) =>
  n == null ? "" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n)

const day = (iso?: string | null) =>
  !iso ? "" : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

/** How the due date reads today: the thing the chaser is counting down to. */
function dueState(c: LadderCreator): { text: string; tone: "calm" | "warn" | "late" } | null {
  if (!c.content_due || c.content_at) return null
  const due = new Date(c.content_due + "T00:00:00")
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (c.defaulted_at) return { text: "Missed", tone: "late" }
  if (days < 0) return { text: `${Math.abs(days)}d late`, tone: "late" }
  if (days === 0) return { text: "Due today", tone: "warn" }
  if (days === 1) return { text: "Due tomorrow", tone: "warn" }
  return { text: `Due ${day(c.content_due)}`, tone: "calm" }
}

export default function LadderPage() {
  const campaignId = useParams().campaignId as string
  const { canDestroy } = useAdminAccess()
  const [creators, setCreators] = useState<LadderCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<LadderCreator | null>(null)
  const [busy, setBusy] = useState(false)

  // one field set per rung, only the one on screen is ever used
  const [rate, setRate] = useState(""); const [rateNote, setRateNote] = useState("")
  const [agreementUrl, setAgreementUrl] = useState("")
  const [guideUrl, setGuideUrl] = useState(""); const [due, setDue] = useState("")
  const [contentUrl, setContentUrl] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [payRef, setPayRef] = useState("")
  const [dropWhy, setDropWhy] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await ladderApi.get(campaignId)
      setCreators(res.data.creators)
    } catch (e) {
      toast.error((e as Error).message || "Could not load the board")
    } finally {
      setLoading(false)
    }
  }, [campaignId])
  useEffect(() => { load() }, [load])

  // Keep the open panel pointed at fresh data after every action.
  useEffect(() => {
    if (!open) return
    const fresh = creators.find(c => c.id === open.id)
    if (fresh && fresh !== open) setOpen(fresh)
  }, [creators])   // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn: () => Promise<any>, done: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(done)
      setRate(""); setRateNote(""); setAgreementUrl(""); setGuideUrl(""); setDue("")
      setContentUrl(""); setPostUrl(""); setPayRef(""); setDropWhy("")
      await load()
    } catch (e) {
      toast.error((e as Error).message || "That did not go through")
    } finally {
      setBusy(false)
    }
  }

  const byStage = useMemo(() => {
    const m: Record<string, LadderCreator[]> = {}
    for (const s of STAGES) m[s.key] = []
    m.dropped = []
    for (const c of creators) (m[c.stage] ??= []).push(c)
    return m
  }, [creators])

  const waiting = useMemo(() => creators.filter(c => dueState(c)?.tone !== "calm" && dueState(c)), [creators])

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href={`/work/campaigns/${campaignId}/timeline`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />Back to the campaign
              </Link>
              <h1 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">Delivery</h1>
              <p className="mt-1 text-muted-foreground">
                Every booked creator and where they have got to. Click anyone to do the next thing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">{creators.length} booked</Badge>
              {waiting.length > 0 && (
                <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />{waiting.length} due or late
                </Badge>
              )}
              {byStage.paid?.length > 0 && (
                <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />{byStage.paid.length} paid
                </Badge>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : creators.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <p className="font-medium">Nobody is booked on this campaign yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Creators arrive here when a proposal is approved.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-max gap-4">
                {STAGES.map((s) => {
                  const list = byStage[s.key] ?? []
                  return (
                    <div key={s.key} className="w-[260px] shrink-0">
                      <div className="mb-2 flex items-baseline justify-between px-1">
                        <span className="text-sm font-semibold">{s.label}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{list.length}</span>
                      </div>
                      <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-muted-foreground">{s.who}</p>
                      <div className="min-h-[140px] space-y-2 rounded-[22px] bg-black/[0.035] p-2.5 dark:bg-white/[0.04]">
                        {list.map((c) => {
                          const d = dueState(c)
                          return (
                            <button
                              key={c.id}
                              onClick={() => setOpen(c)}
                              className={`${CARD} w-full bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 dark:bg-neutral-900/80`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={cdnAvatar(c.avatar || undefined)} />
                                  <AvatarFallback>{(c.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">@{c.username}</div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {compact(c.followers_count)}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1">
                                {c.agreed_rate_cents != null && (
                                  <Badge variant="outline" className="text-[11px]">
                                    {aed(c.agreed_rate_cents)}
                                    {!c.rate_agreed_at && " · to confirm"}
                                  </Badge>
                                )}
                                {d && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[11px] ${
                                      d.tone === "late" ? "border-red-500/40 text-red-600 dark:text-red-400"
                                        : d.tone === "warn" ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {d.text}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          )
                        })}
                        {list.length === 0 && (
                          <p className="px-2 py-6 text-center text-xs text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(byStage.dropped?.length ?? 0) > 0 && (
                  <div className="w-[220px] shrink-0 opacity-70">
                    <div className="mb-2 flex items-baseline justify-between px-1">
                      <span className="text-sm font-semibold">Dropped</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{byStage.dropped.length}</span>
                    </div>
                    <div className="space-y-2 rounded-[22px] bg-black/[0.035] p-2.5 dark:bg-white/[0.04]">
                      {byStage.dropped.map(c => (
                        <div key={c.id} className={`${CARD} bg-white p-3.5 dark:bg-neutral-900/80`}>
                          <div className="truncate text-sm font-medium">@{c.username}</div>
                          {c.stage_note && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.stage_note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* The next thing to do for this creator, and only that. */}
        <Sheet open={!!open} onOpenChange={(v: boolean) => { if (!v) setOpen(null) }}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            {open && (
              <>
                <SheetHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={cdnAvatar(open.avatar || undefined)} />
                      <AvatarFallback>{(open.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="truncate">@{open.username}</SheetTitle>
                      <SheetDescription className="truncate">
                        {open.full_name} · {compact(open.followers_count)} followers
                      </SheetDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">{open.stage_label}</Badge>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  {/* what has already happened, in order */}
                  <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-xs">
                    {open.agreed_rate_cents != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-medium">
                          {aed(open.agreed_rate_cents)}
                          {open.rate_agreed_at ? " · confirmed" : " · waiting on a founder"}
                        </span>
                      </div>
                    )}
                    {open.agreement_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agreement</span>
                        <a href={open.agreement_url || "#"} target="_blank" rel="noopener noreferrer"
                           className="font-medium hover:underline">{open.agreement_name || "On file"}</a>
                      </div>
                    )}
                    {open.guide_sent_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guide sent</span>
                        <span className="font-medium">{day(open.guide_sent_at)}</span>
                      </div>
                    )}
                    {open.content_due && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Content due</span>
                        <span className="font-medium">{day(open.content_due)}</span>
                      </div>
                    )}
                    {open.posted_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Posted</span>
                        <a href={open.posted_url || "#"} target="_blank" rel="noopener noreferrer"
                           className="font-medium hover:underline">{day(open.posted_at)}</a>
                      </div>
                    )}
                    {open.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium">{day(open.paid_at)}</span>
                      </div>
                    )}
                    {!open.agreed_rate_cents && !open.guide_sent_at && (
                      <p className="text-muted-foreground">Nothing recorded yet.</p>
                    )}
                  </div>

                  <Separator />

                  {/* ── the rung they are on ─────────────────────────────────── */}
                  {open.stage === "enrolled" && (
                    <div className="space-y-3">
                      <Label>What did you agree with them?</Label>
                      <div className="flex gap-2">
                        <Input type="number" inputMode="decimal" placeholder="Amount in AED"
                               value={rate} onChange={(e) => setRate(e.target.value)} />
                      </div>
                      <Textarea rows={2} placeholder="Anything worth remembering — what it covers, who agreed it"
                                value={rateNote} onChange={(e) => setRateNote(e.target.value)} />
                      <Button className="w-full gap-2" disabled={busy || !rate}
                              onClick={() => act(() => ladderApi.proposeRate(open.id, Number(rate), rateNote), "Sent for confirmation")}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Record the rate
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        A founder confirms it before anything is signed.
                      </p>
                    </div>
                  )}

                  {open.stage === "enrolled" && open.agreed_rate_cents != null && canDestroy && (
                    <Button variant="outline" className="w-full gap-2" disabled={busy}
                            onClick={() => act(() => ladderApi.confirmRate(open.id), "Rate confirmed")}>
                      <CheckCircle2 className="h-4 w-4" />Confirm {aed(open.agreed_rate_cents)}
                    </Button>
                  )}

                  {open.stage === "rate_agreed" && (
                    <div className="space-y-3">
                      <Label>Signed agreement</Label>
                      <Input placeholder="Link to the signed file"
                             value={agreementUrl} onChange={(e) => setAgreementUrl(e.target.value)} />
                      <Button className="w-full gap-2" disabled={busy || !agreementUrl}
                              onClick={() => act(() => ladderApi.agreement(open.id, agreementUrl), "Agreement on file")}>
                        <FileText className="h-4 w-4" />Put it on file
                      </Button>
                    </div>
                  )}

                  {open.stage === "contracted" && (
                    <div className="space-y-3">
                      <Label>Shooting guide</Label>
                      <Input placeholder="Link to the guide (optional)"
                             value={guideUrl} onChange={(e) => setGuideUrl(e.target.value)} />
                      <Label>Content due back</Label>
                      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                      <Button className="w-full gap-2" disabled={busy || !due}
                              onClick={() => act(() => ladderApi.guide(open.id, due, guideUrl), "Guide sent")}>
                        <Send className="h-4 w-4" />Mark the guide sent
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        From here the platform chases: four days out, two, one, the day itself.
                      </p>
                    </div>
                  )}

                  {open.stage === "briefed" && (
                    <div className="space-y-3">
                      <Label>Content that arrived</Label>
                      <Input placeholder="Link to the content"
                             value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
                      <Button className="w-full gap-2" disabled={busy || !contentUrl}
                              onClick={() => act(() => ladderApi.content(open.id, contentUrl), "Content in")}>
                        <ImageIcon className="h-4 w-4" />It came in
                      </Button>
                    </div>
                  )}

                  {open.stage === "content_in" && (
                    <div className="space-y-3">
                      {open.content_url && (
                        <a href={open.content_url} target="_blank" rel="noopener noreferrer"
                           className="block text-sm font-medium text-primary hover:underline">Open the content →</a>
                      )}
                      <Button className="w-full gap-2" disabled={busy}
                              onClick={() => act(() => ladderApi.approveContent(open.id), "Approved to post")}>
                        <CheckCircle2 className="h-4 w-4" />Approve it
                      </Button>
                    </div>
                  )}

                  {open.stage === "content_approved" && (
                    <div className="space-y-3">
                      <Label>It is live</Label>
                      <Input placeholder="Link to the post"
                             value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
                      <Button className="w-full gap-2" disabled={busy || !postUrl}
                              onClick={() => act(() => ladderApi.posted(open.id, postUrl), "Marked live")}>
                        <Link2 className="h-4 w-4" />Mark it posted
                      </Button>
                    </div>
                  )}

                  {open.stage === "posted" && (
                    canDestroy ? (
                      <div className="space-y-3">
                        <Label>Payment</Label>
                        <Input placeholder="Reference (optional)"
                               value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                        <Button className="w-full gap-2" disabled={busy}
                                onClick={() => act(() => ladderApi.paid(open.id, payRef), "Marked paid")}>
                          <Banknote className="h-4 w-4" />Pay {aed(open.agreed_rate_cents)}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Written to the payables book from the confirmed rate, not typed again.
                        </p>
                      </div>
                    ) : (
                      <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                        Waiting on a founder to release the payment.
                      </p>
                    )
                  )}

                  {open.stage === "paid" && (
                    <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Finished — posted and paid.
                    </p>
                  )}

                  {open.stage !== "paid" && open.stage !== "dropped" && (
                    <>
                      <Separator />
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          They came off the campaign
                        </summary>
                        <div className="mt-3 space-y-2">
                          <Textarea rows={2} placeholder="Why — it stays on their record"
                                    value={dropWhy} onChange={(e) => setDropWhy(e.target.value)} />
                          <Button variant="outline" size="sm" className="w-full gap-2"
                                  disabled={busy || !dropWhy.trim()}
                                  onClick={() => act(() => ladderApi.drop(open.id, dropWhy), "Taken off the campaign")}>
                            <UserMinus className="h-4 w-4" />Take them off
                          </Button>
                        </div>
                      </details>
                    </>
                  )}

                  {open.defaulted_at && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span>Marked missed — the date passed with nothing in.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
