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

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
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
  Image as ImageIcon, Link2, Banknote, UserMinus, PackageCheck, Truck, Undo2, Boxes, Upload,
} from "lucide-react"
import { toast } from "sonner"
import { ladderApi, STAGES, type LadderCreator, type Stage } from "@/services/ladderApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { cdnAvatar } from "@/lib/avatar"
import { Aed, CARD } from "@/components/console/primitives"
import { SettleCosts } from "@/components/superadmin/proposals/SettleCosts"

/**
 * The figure only.
 *
 * The mark was a bare U+20C3 inside a template string. No system font carries that
 * codepoint, and only the `Aed` primitive names the face that does, so every rate on this
 * board was rendering the mark as an empty box.
 */
const aedNum = (cents?: number | null) =>
  cents == null ? null : (cents / 100).toLocaleString("en-AE")
const Money = ({ cents }: { cents?: number | null }) => {
  const n = aedNum(cents)
  return n === null ? null : <Aed>{n}</Aed>
}


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
  // `canSeeCost` is leadership plus talent, exactly the two scopes the backend's field
  // policy lets see a cost. It is NOT "is this person an admin": the co-founder is
  // role='user' with staff_role='cofounder', and an admin check has locked her out of her
  // own numbers before. The hook resolves her as full-access staff.
  const { canDestroy, canSeeCost } = useAdminAccess()
  const [creators, setCreators] = useState<LadderCreator[]>([])
  const [campaign, setCampaign] = useState<{ ships?: boolean; dine_in?: boolean; fulfilment_mode?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<LadderCreator | null>(null)
  const [busy, setBusy] = useState(false)

  // one field set per rung, only the one on screen is ever used
  const [rate, setRate] = useState(""); const [rateNote, setRateNote] = useState("")
  const [agreementUrl, setAgreementUrl] = useState("")
  const agreementFileRef = useRef<HTMLInputElement>(null)
  const [guideUrl, setGuideUrl] = useState(""); const [due, setDue] = useState("")
  const [contentUrl, setContentUrl] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [payRef, setPayRef] = useState("")
  const [courier, setCourier] = useState("")
  const [dropWhy, setDropWhy] = useState("")

  /**
   * "Nobody is booked on this campaign yet" was what a failed read said.
   *
   * The catch toasted and left `creators` at [], which drew the empty state — an all clear
   * on a chasing board, with a line explaining that creators arrive when a proposal is
   * approved. The failure is held so the board can say the read failed instead.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailure(null)
    try {
      const res = await ladderApi.get(campaignId)
      setCreators(res.data.creators)
      setCampaign(res.data.campaign ?? null)
    } catch (e) {
      const msg = (e as Error).message || "Could not load the board"
      setFailure(msg)
      toast.error(msg)
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
      setContentUrl(""); setPostUrl(""); setPayRef(""); setDropWhy(""); setCourier("")
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

  // Whether this campaign sends product is the CAMPAIGN's answer, not "has anybody stamped
  // one yet". Deriving it from the stamps made the delivery track invisible until it had
  // been used — which it could not be, because it was invisible.
  const shipping = useMemo(() => {
    const live = creators.filter(c => c.stage !== "dropped")
    const ready = live.filter(c => c.product_ready_at).length
    const sent = live.filter(c => c.dispatched_at).length
    const got = live.filter(c => c.received_at).length
    const stamped = ready + sent + got > 0
    return { on: campaign?.ships ?? stamped, asked: campaign?.fulfilment_mode != null,
             live: live.length, ready, sent, got, stamped }
  }, [creators, campaign])

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="space-y-ds-4 p-ds-4">
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
                <Badge variant="outline" className="gap-1 text-[var(--tone-warn-ink)]">
                  <Clock className="h-3 w-3" />{waiting.length} due or late
                </Badge>
              )}
              {shipping.on && (
                <Badge variant="outline" className="gap-1">
                  <Truck className="h-3 w-3" />{shipping.got}/{shipping.live} have their product
                </Badge>
              )}
              {byStage.paid?.length > 0 && (
                <Badge variant="outline" className="gap-1 text-[var(--tone-good-ink)]">
                  <CheckCircle2 className="h-3 w-3" />{byStage.paid.length} paid
                </Badge>
              )}
            </div>
          </div>

          {/* Getting the product to the creators. Its own panel, because on a campaign that
              ships it is the question everybody asks — the client most of all — and it runs
              on its own clock alongside the rungs. */}
          {!loading && creators.length > 0 && !campaign?.dine_in && (
            shipping.on ? (
              /* Products is a genuinely different subject from the rungs — it runs on its own
                 clock — so it keeps one hairline. What it no longer does is put three counts
                 in three pill outlines inside that hairline: they are plain figures now,
                 grouped by the gap, at the size the pills would not allow. */
              <section className={`${CARD} flex flex-wrap items-center justify-between gap-ds-4 bg-[var(--tone-neutral-wash)] p-ds-4`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-ds-2 font-medium">
                      <Boxes className="h-4 w-4 text-muted-foreground" />Products
                    </div>
                    <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
                      {shipping.got === shipping.live
                        ? "Every creator has their product."
                        : shipping.sent
                          ? `${shipping.sent} sent, ${shipping.got} received of ${shipping.live}.`
                          : shipping.ready
                            ? `${shipping.ready} packed and waiting on a courier.`
                            : "Nothing packed yet. Mark the batch ready, then send them out one by one."}
                    </p>
                    <div className="mt-ds-3 flex flex-wrap gap-x-ds-5 gap-y-ds-2">
                      {([["Packed", shipping.ready], ["Sent", shipping.sent], ["Received", shipping.got]] as const).map(
                        ([label, n]) => (
                          <div key={label}>
                            <p className="text-ds-caption font-medium text-muted-foreground">{label}</p>
                            <p className="mt-ds-1 text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{n}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-ds-2">
                    <Button
                      variant={shipping.ready ? "outline" : "default"} size="sm"
                      className="gap-1.5 rounded-ds-control" disabled={busy}
                      onClick={() => act(() => ladderApi.productReady(campaignId),
                                         "Everyone marked packed and ready to dispatch")}
                    >
                      <PackageCheck className="h-3.5 w-3.5" />Mark everyone packed
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-ds-control" disabled={busy}
                            onClick={() => act(() => ladderApi.setFulfilmentMode(campaignId, "none"),
                                               "This campaign sends nothing")}>
                      Nothing ships here
                    </Button>
                  </div>
              </section>
            ) : !shipping.asked ? (
              <section className="flex flex-wrap items-center justify-between gap-ds-4 rounded-ds-2xl border border-dashed border-black/[0.12] p-ds-4 dark:border-white/[0.14]">
                  <div>
                    <div className="font-medium">Does this campaign send product to the creators?</div>
                    <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
                      If it does, we track it per creator — packed, sent, received — and the
                      client sees exactly that on their own campaign page.
                    </p>
                  </div>
                  <div className="flex gap-ds-2">
                    <Button size="sm" className="gap-1.5 rounded-ds-control" disabled={busy}
                            onClick={() => act(() => ladderApi.setFulfilmentMode(campaignId, "delivery"),
                                               "Product tracking on")}>
                      <Truck className="h-3.5 w-3.5" />Yes, we send product
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-ds-control" disabled={busy}
                            onClick={() => act(() => ladderApi.setFulfilmentMode(campaignId, "none"),
                                               "No product on this campaign")}>
                      No
                    </Button>
                  </div>
              </section>
            ) : null
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : failure ? (
            <div className="space-y-3 py-ds-4">
              <p className="text-sm font-medium">Could not load the board.</p>
              <p className="text-sm text-muted-foreground">
                {failure}. This is not an empty campaign, and nothing here is known: there may
                be content due today that is not on screen.
              </p>
              <Button variant="outline" size="sm"
                      onClick={() => { setLoading(true); load() }}>Try again</Button>
            </div>
          ) : creators.length === 0 ? (
            <div className="px-ds-4 py-ds-6 text-center">
              <p className="font-medium">Nobody is booked on this campaign yet</p>
              <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
                Creators arrive here when a proposal is approved.
              </p>
            </div>
          ) : (
            /* The board used to be boxes inside boxes: each column was a tinted, rounded,
               padded well, and every creator inside it was a card of its own. The well was
               only saying "these belong to this column", which the heading above and the gap
               beside it already say. The wells are gone; the columns are separated by ds-5,
               wider than any gap inside a column, and the cards keep the one edge that marks
               a creator as a thing you can click. */
            <div className="w-full min-w-0 overflow-x-auto pb-ds-3">
              <div className="flex min-w-max gap-ds-5">
                {STAGES.map((s) => {
                  const list = byStage[s.key] ?? []
                  return (
                    <div key={s.key} className="w-[260px] shrink-0">
                      <div className="flex items-baseline justify-between">
                        <span className="text-ds-label font-semibold">{s.label}</span>
                        <span className="text-ds-caption tabular-nums text-muted-foreground">{list.length}</span>
                      </div>
                      <p className="mt-ds-1 text-ds-overline uppercase text-muted-foreground">{s.who}</p>
                      <div className="mt-ds-3 min-h-[140px] space-y-ds-2">
                        {list.map((c) => {
                          const d = dueState(c)
                          return (
                            <button
                              key={c.id}
                              onClick={() => setOpen(c)}
                              className={`${CARD} w-full bg-white p-ds-3 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-neutral-900/80`}
                            >
                              <div className="flex items-center gap-ds-2">
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
                              {/* The rate and the due state were two more outlined pills inside
                                  a card that already has an edge. They are words now; the due
                                  state keeps a coloured dot so it is still scannable, and the
                                  word beside it carries the same meaning without the colour. */}
                              <div className="mt-ds-2 flex flex-wrap items-center gap-x-ds-3 gap-y-ds-1 text-ds-caption">
                                {/* The rate is a COST, and cost belongs to leadership and
                                    talent. It arrives on the wire regardless, so the card
                                    leaves it out entirely rather than printing a dash: a
                                    dash tells an account manager the number exists and is
                                    being kept from them. Whether the rate still needs
                                    confirming is not money, so that still shows. */}
                                {c.agreed_rate_cents != null && canSeeCost && (
                                  <span className="tabular-nums text-muted-foreground">
                                    <Money cents={c.agreed_rate_cents} />
                                    {!c.rate_agreed_at && " · to confirm"}
                                  </span>
                                )}
                                {c.agreed_rate_cents != null && !canSeeCost && !c.rate_agreed_at && (
                                  <span className="text-muted-foreground">Rate to confirm</span>
                                )}
                                {d && (
                                  <span
                                    className={`inline-flex items-center gap-ds-1 ${
                                      d.tone === "late" ? "text-[var(--tone-bad-ink)]"
                                        : d.tone === "warn" ? "text-[var(--tone-warn-ink)]"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {d.tone !== "calm" && (
                                      <span
                                        aria-hidden
                                        className={`h-1.5 w-1.5 flex-none rounded-full ${
                                          d.tone === "late" ? "bg-[var(--tone-bad-dot)]" : "bg-[var(--tone-warn-dot)]"
                                        }`}
                                      />
                                    )}
                                    {d.text}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                        {list.length === 0 && (
                          <p className="py-ds-4 text-center text-ds-caption text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(byStage.dropped?.length ?? 0) > 0 && (
                  <div className="w-[220px] shrink-0 opacity-70">
                    <div className="flex items-baseline justify-between">
                      <span className="text-ds-label font-semibold">Dropped</span>
                      <span className="text-ds-caption tabular-nums text-muted-foreground">{byStage.dropped.length}</span>
                    </div>
                    <div className="mt-ds-3 space-y-ds-2">
                      {byStage.dropped.map(c => (
                        <div key={c.id} className={`${CARD} bg-white p-ds-3 dark:bg-neutral-900/80`}>
                          <div className="truncate text-ds-label font-medium">@{c.username}</div>
                          {c.stage_note && (
                            <p className="mt-ds-1 line-clamp-2 text-ds-caption text-muted-foreground">{c.stage_note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {creators.length > 0 && <SettleCosts campaignId={campaignId} />}
        </div>

        {/* The next thing to do for this creator, and only that. */}
        <Sheet open={!!open} onOpenChange={(v: boolean) => { if (!v) setOpen(null) }}>
          <SheetContent className="w-full overflow-y-auto px-5 pb-6 sm:max-w-md [&>button]:top-5 [&>button]:right-5">
            {open && (
              <>
                <SheetHeader className="space-y-3 px-0">
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

                <div className="mt-ds-4 space-y-ds-4">
                  {/* What has already happened, in order. This was a bordered, tinted box
                      inside a sheet that already has an edge and a title above it — six
                      short facts behind two more edges. It is a plain list now. */}
                  <div className="space-y-ds-2 text-ds-caption">
                    {/* Cost, so leadership and talent only. Where it is out of scope the
                        row still says whether the rate is settled, because that is a state,
                        not a number, and everyone chasing this creator needs it. */}
                    {open.agreed_rate_cents != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-medium">
                          {canSeeCost && <Money cents={open.agreed_rate_cents} />}
                          {open.rate_agreed_at
                            ? (canSeeCost ? " · confirmed" : "Confirmed")
                            : (canSeeCost ? " · waiting on a founder" : "Waiting on a founder")}
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

                  {/* ── getting the product there ────────────────────────────────
                      Alongside the rungs, not inside them: it runs on its own clock,
                      and it is the part the client watches most closely. */}
                  {shipping.on && (
                    /* Delivery is a different subject from the rung, so it keeps its
                       separation — but from the rule above, not from a box of its own. */
                    <div className="space-y-ds-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-ds-body-sm">Delivery</Label>
                        <span className="text-ds-caption text-muted-foreground">
                          {open.received_at ? `Received ${day(open.received_at)}`
                            : open.dispatched_at ? `Sent ${day(open.dispatched_at)}`
                              : open.product_ready_at ? "Packed" : "Not packed yet"}
                        </span>
                      </div>

                      {!open.dispatched_at && (
                        <>
                          <Input placeholder="Courier reference (optional)"
                                 value={courier} onChange={(e) => setCourier(e.target.value)} />
                          <Button className="w-full gap-2" variant="outline" disabled={busy}
                                  onClick={() => act(() => ladderApi.dispatch(open.id, courier || undefined), "Marked dispatched")}>
                            <Truck className="h-4 w-4" />It has gone out
                          </Button>
                        </>
                      )}

                      {open.dispatched_at && !open.received_at && (
                        <Button className="w-full gap-2" variant="outline" disabled={busy}
                                onClick={() => act(() => ladderApi.received(open.id), "Marked received")}>
                          <PackageCheck className="h-4 w-4" />They have it
                        </Button>
                      )}

                      {(open.dispatched_at || open.received_at) && (
                        <button
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          disabled={busy}
                          onClick={() => act(
                            () => ladderApi.undoFulfilment(open.id, open.received_at ? "received" : "dispatched"),
                            "Taken back",
                          )}
                        >
                          <Undo2 className="h-3 w-3" />
                          Undo {open.received_at ? "received" : "dispatched"}
                        </button>
                      )}

                      {open.dispatch_ref && (
                        <p className="text-ds-caption text-muted-foreground">Ref {open.dispatch_ref}</p>
                      )}
                    </div>
                  )}
                  {/* The delivery block lost its border; the hairline that used to be its box
                      becomes the one rule between it and the rung below, which is where the
                      subject actually changes. */}
                  {shipping.on && <Separator />}

                  {/* ── the rung they are on ─────────────────────────────────── */}
                  {open.stage === "enrolled" && (
                    <div className="space-y-3">
                      <Label>What did you agree with them?</Label>
                      <div className="flex gap-2">
                        <Input type="number" inputMode="decimal" placeholder="Amount in AED"
                               value={rate} onChange={(e) => setRate(e.target.value)} />
                      </div>
                      <Textarea rows={2} placeholder="Anything worth remembering: what it covers, who agreed it"
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
                      <CheckCircle2 className="h-4 w-4" />Confirm <Money cents={open.agreed_rate_cents} />
                    </Button>
                  )}

                  {open.stage === "rate_agreed" && (
                    <div className="space-y-3">
                      <Label>Signed agreement</Label>
                      {/* Uploading is the primary way in: the file lands on our own CDN, so it
                          cannot go missing the way a link to someone else's drive does. */}
                      <input ref={agreementFileRef} type="file" className="hidden"
                             accept=".pdf,.doc,.docx,image/*"
                             onChange={(e) => {
                               const f = e.target.files?.[0]
                               if (!f) return
                               act(() => ladderApi.agreementUpload(open.id, f), "Agreement on file")
                               e.target.value = ""
                             }} />
                      <Button className="w-full gap-2" disabled={busy}
                              onClick={() => agreementFileRef.current?.click()}>
                        <Upload className="h-4 w-4" />Upload the signed agreement
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">PDF, Word or a photo of the signed page. Up to 15MB.</p>
                      <div className="flex items-center gap-3 py-1">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[11px] text-muted-foreground">or link to it</span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <Input placeholder="Link to the signed file"
                             value={agreementUrl} onChange={(e) => setAgreementUrl(e.target.value)} />
                      <Button variant="outline" className="w-full gap-2" disabled={busy || !agreementUrl}
                              onClick={() => act(() => ladderApi.agreement(open.id, agreementUrl), "Agreement on file")}>
                        <FileText className="h-4 w-4" />Put the link on file
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
                          <Banknote className="h-4 w-4" />Pay <Money cents={open.agreed_rate_cents} />
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Written to the payables book from the confirmed rate, not typed again.
                        </p>
                      </div>
                    ) : (
                      <p className="text-ds-body text-muted-foreground">
                        Waiting on a founder to release the payment.
                      </p>
                    )
                  )}

                  {open.stage === "paid" && (
                    <p className="text-ds-body text-muted-foreground">
                      Finished, posted and paid.
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
                          <Textarea rows={2} placeholder="Why? It stays on their record"
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
                    <div className="flex items-start gap-ds-2 rounded-ds-lg bg-[var(--tone-bad-wash)] p-ds-3 text-ds-caption text-[var(--tone-bad-ink)]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Marked missed. The date passed with nothing in.</span>
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
