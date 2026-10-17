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
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, FileText, Send,
  Image as ImageIcon, Link2, Banknote, UserMinus, PackageCheck, Truck, Undo2, Boxes, Upload,
  LayoutGrid, Rows3,
} from "lucide-react"
import { toast } from "sonner"
import { ladderApi, STAGES, type LadderCreator, type Stage } from "@/services/ladderApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { cdnAvatar } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { Aed, CARD, PageHead } from "@/components/console/primitives"
import {
  Age, Dash, DENSITY, DensityProvider, DensityToggle, FilterBar, NoMatches, Owner,
  StageRail, StageRibbon, TableShell, useDensity, type RailSegment,
} from "@/components/console/surfaces"
import { ActionIcon, StageChip } from "@/components/console/Glyph"
import { SettleCosts } from "@/components/superadmin/proposals/SettleCosts"
import { approvalsApi } from "@/services/approvalsApi"

/**
 * A person's name from the only thing we are given, their work address.
 *
 * `hajar.m@following.ae` reads as "Hajar M". It is not a display name and we do not have
 * one, but a name is what the row has to carry: "Waiting on hajar.m@following.ae" is an
 * address, and an address is not an answer to who has this.
 */
function ownerName(email?: string | null): string | null {
  if (!email) return null
  const local = email.split("@")[0]?.trim()
  if (!local) return null
  const words = local
    .split(/[._+-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  return words.length > 0 ? words.join(" ") : null
}

/** Up to two letters for the bubble beside the name. */
function ownerInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join("")
}

/**
 * "I am waiting on you", from the panel where the waiting is visible.
 *
 * A rate recorded by talent and not yet confirmed by a founder is the one rung on this
 * board that nobody can move on their own, and until now the only way to move it was to
 * walk over to a desk. This sends the reminder, which mints a fresh one-time link, so the
 * approver can answer from a phone with no login.
 *
 * No confirmation in front of it: it decides nothing and is undone by being ignored. The
 * toast is the receipt. A 404 means nothing was ever formally raised and a 429 means
 * somebody already asked today, and both of those are replies rather than failures, so
 * neither is shown in red.
 */
function NudgeRate({ creatorId }: { creatorId: string }) {
  const [sending, setSending] = useState(false)
  const send = async () => {
    setSending(true)
    try {
      const r = await approvalsApi.remind("campaign_creator", creatorId, "confirm_rate")
      if (r.ok) {
        const who = ownerName(r.approver_email) ?? r.approver_email ?? "The approver"
        toast.success(`${who} has been emailed.`, {
          description: `They can answer straight from it without logging in.${r.note ? ` ${r.note}.` : ""}`,
        })
      } else {
        toast.message(r.answer)
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not send the reminder")
    } finally {
      setSending(false)
    }
  }
  return (
    <Button variant="outline" size="sm" className="w-full gap-2" disabled={sending} onClick={send}>
      <ActionIcon verb="nudge" size="default" />
      {sending ? "Nudging the founder" : "Nudge the founder"}
    </Button>
  )
}

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

/** Where a rung sits in the ladder. -1 for a creator who has left it. */
const rungIndex = (s: Stage) => STAGES.findIndex(x => x.key === s)

const isLate = (c: LadderCreator) => dueState(c)?.tone === "late"

/**
 * The one definition of stuck, used by the lens, by the rail's tones and by the sentence
 * under the rail, so the count on the control and the colour on the bar can never disagree.
 *
 * Four ways a creator stops moving: nobody owns the row, the date went past with nothing
 * in, a founder has not confirmed the rate that talent recorded, or the post is live and
 * the payment is a founder's to make.
 *
 * Unowned is first on purpose. It is the one of the four that nobody will ever notice on
 * their own, because an unowned row does not nag anybody, and it is currently the state of
 * every row in the business.
 */
function isStuck(c: LadderCreator): boolean {
  if (c.stage === "dropped" || c.stage === "paid") return false
  if (!c.owner_user_id) return true
  if (isLate(c)) return true
  if (c.stage === "enrolled" && c.agreed_rate_cents != null && !c.rate_agreed_at) return true
  return c.stage === "posted"
}

/** A live row with nobody's name on it. Work addressed to a role is addressed to nobody. */
const isUnowned = (c: LadderCreator) => c.stage !== "dropped" && !c.owner_user_id

/** The next thing to do for this creator, in the same words as the panel's button. */
function nextAction(c: LadderCreator): string {
  switch (c.stage) {
    case "enrolled":
      return c.agreed_rate_cents == null ? "Record the rate" : "Confirm the rate"
    case "rate_agreed": return "Get the agreement on file"
    case "contracted": return "Send the guide"
    case "briefed": return "Chase the content"
    case "content_in": return "Review and approve it"
    case "content_approved": return "Record the post link"
    case "posted": return "Pay the agreed rate"
    case "paid": return "Nothing left to do"
    default: return "Off the campaign"
  }
}

/**
 * When the creator arrived on the rung they are on.
 *
 * `stage_changed_at` is the real answer and is preferred wherever it is there. It is kept
 * by a trigger, so rows that have not moved since it landed are still null, and for those
 * the stamp of the rung BEFORE is the next best thing: the moment they finished the step
 * that put them here. Nothing records an arrival on Enrolled, so a creator with no rate
 * proposed yet and no stage change has no waiting time rather than a zero.
 */
function enteredRungAt(c: LadderCreator): string | null {
  if (c.stage_changed_at) return c.stage_changed_at
  switch (c.stage) {
    case "enrolled": return c.rate_proposed_at ?? null
    case "rate_agreed": return c.rate_agreed_at ?? null
    case "contracted": return c.agreement_at ?? null
    case "briefed": return c.guide_sent_at ?? null
    case "content_in": return c.content_at ?? null
    case "content_approved": return c.content_approved_at ?? null
    case "posted": return c.posted_at ?? null
    case "paid": return c.paid_at ?? null
    default: return null
  }
}

const daysSince = (iso: string) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000))

/** How many days past the promised date, when the date has passed and nothing is in. */
function lateDays(c: LadderCreator): number {
  if (!c.content_due || c.content_at) return 0
  const due = new Date(c.content_due + "T00:00:00")
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000))
}

/**
 * The deliverables this creator is on the campaign for.
 *
 * The ladder endpoint carries no assigned or selected deliverable list, only the frozen
 * price snapshots, so the names come from the snapshot's keys. A key is not a figure, so
 * this leaks no cost to a role that cannot see one.
 */
function deliverableNames(c: LadderCreator): string[] {
  const snap = c.sell_price_snapshot ?? c.cost_price_snapshot ?? null
  if (!snap) return []
  return Object.entries(snap)
    .filter(([, v]) => v != null)
    .map(([k]) => k.replace(/_/g, " "))
}

export default function LadderPage() {
  const campaignId = useParams().campaignId as string
  // `canSeeCost` is leadership plus talent, exactly the two scopes the backend's field
  // policy lets see a cost. It is NOT "is this person an admin": the co-founder is
  // role='user' with staff_role='cofounder', and an admin check has locked her out of her
  // own numbers before. The hook resolves her as full-access staff.
  const { canDestroy, canSeeCost } = useAdminAccess()
  const [creators, setCreators] = useState<LadderCreator[]>([])
  const [campaign, setCampaign] = useState<{ name?: string | null; ships?: boolean; dine_in?: boolean; fulfilment_mode?: string | null } | null>(null)
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

  /* ── the process view: one rail, one ribbon, one lens, two layouts ──────────────────
     None of this is sized by the number of creators. The rail is as wide as the ladder,
     the ribbon is eight numbers, and the lens is one count, so the screen reads the same
     at 10 as it does at 200. */

  // Which stage the ribbon has pinned, or null for the whole roster.
  const [stageFilter, setStageFilter] = useState<Stage | null>(null)
  // The lens. `stuck` is everything late or waiting on a founder.
  const [lens, setLens] = useState<"all" | "stuck">("all")
  /* null means nobody has chosen, so the threshold decides. Read after mount, which is
     also why the server pass and the first client pass agree. */
  const [view, setView] = useState<"board" | "list" | null>(null)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`console.ladderView.${campaignId}`)
      if (saved === "board" || saved === "list") setView(saved)
    } catch {
      /* Private window or blocked site data. The threshold is a fine answer. */
    }
  }, [campaignId])
  const chooseView = (v: "board" | "list") => {
    setView(v)
    try { window.localStorage.setItem(`console.ladderView.${campaignId}`, v) } catch { /* not worth saying */ }
  }
  /* A board stops being readable somewhere around forty cards: eight columns of five is a
     screen, eight columns of twenty-five is a scroll in both directions. Over that the
     list leads, and either way the choice is one click away and remembered. */
  const BOARD_UP_TO = 40
  const shown: "board" | "list" = view ?? (creators.length >= BOARD_UP_TO ? "list" : "board")

  const stuckCount = useMemo(() => creators.filter(isStuck).length, [creators])

  const visible = useMemo(
    () => creators.filter(c =>
      (!stageFilter || c.stage === stageFilter) && (lens === "all" || isStuck(c))),
    [creators, stageFilter, lens],
  )

  const clearFilters = () => { setStageFilter(null); setLens("all") }

  /**
   * The rail and the ribbon share their segments, so the bar and the numbers under it can
   * never tell two stories. Tone: a rung the whole roster has already passed is done, the
   * rung holding the most people is current, and any rung with somebody late on it is bad.
   */
  const segments: RailSegment[] = useMemo(() => {
    const live = creators.filter(c => c.stage !== "dropped")
    const counts = STAGES.map(s => live.filter(c => c.stage === s.key).length)
    const lates = STAGES.map(s => live.filter(c => c.stage === s.key && isLate(c)).length)
    const firstHeld = counts.findIndex(n => n > 0)
    let current = -1, most = 0
    counts.forEach((n, i) => { if (n > most) { most = n; current = i } })
    return STAGES.map((s, i) => ({
      key: s.key,
      label: s.label,
      n: counts[i],
      tone: lates[i] > 0 ? "bad"
        : firstHeld >= 0 && i < firstHeld ? "done"
          : i === current ? "current" : "neutral",
    }))
  }, [creators])

  /** How far along the roster actually is: every live creator's own rung, averaged. */
  const percent = useMemo(() => {
    const live = creators.filter(c => c.stage !== "dropped")
    if (live.length === 0 || STAGES.length < 2) return 0
    const sum = live.reduce((a, c) => a + Math.max(0, rungIndex(c.stage)) / (STAGES.length - 1), 0)
    return Math.round((sum / live.length) * 100)
  }, [creators])

  const currentLabel = segments.find(s => s.tone === "current")?.label ?? null
  const lateTotal = useMemo(() => creators.filter(c => c.stage !== "dropped" && isLate(c)).length, [creators])
  /* Said out loud under the rail, because an unowned row is the one kind of stuck that
     never chases anybody and so is never found by somebody doing their rounds. */
  const unownedTotal = useMemo(() => creators.filter(isUnowned).length, [creators])

  const byStage = useMemo(() => {
    const m: Record<string, LadderCreator[]> = {}
    for (const s of STAGES) m[s.key] = []
    m.dropped = []
    for (const c of visible) (m[c.stage] ??= []).push(c)
    return m
  }, [visible])

  /** Late first, then up the ladder, then by handle. The list opens on what is wrong. */
  const rows = useMemo(
    () => [...visible].sort((a, b) =>
      Number(isLate(b)) - Number(isLate(a))
      || rungIndex(a.stage) - rungIndex(b.stage)
      || (a.username || "").localeCompare(b.username || "")),
    [visible],
  )

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
          <div className="space-y-2">
            <Link href={`/work/campaigns/${campaignId}/timeline`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />Back to the campaign
            </Link>
            {/* The record's own name once the board has loaded; the screen's name until then,
                so the title never reads as empty. The sentence is the one thing the board
                does not already show: how many are booked and how many are out of time. */}
            <PageHead
              title={campaign?.name || "Delivery board"}
              /* The count of people who are waiting is the one number on this screen worth
                 colouring, and flattening the subtitle to a plain string dropped it. Amber
                 arrives with its word beside it, as it does everywhere else in here. */
              sub={
                <>
                  Delivery board &middot; {creators.length} booked
                  {waiting.length > 0 && (
                    <>
                      ,{" "}
                      <span className="font-semibold text-[color:var(--tone-warn-ink)]">
                        {waiting.length} due or late
                      </span>
                    </>
                  )}
                  . Click anyone to do the next thing.
                </>
              }
            />
          </div>

          {/* ── where everyone is ──────────────────────────────────────────────────────
              The rail, the ribbon and the lens. This block is the process view: it is
              sized by the ladder and not by the roster, so it is the same four lines of
              screen on a campaign of ten and a campaign of two hundred. */}
          {!loading && !failure && creators.length > 0 && (
            <section className="space-y-ds-3">
              <div className="flex items-center gap-ds-3">
                <StageRail segments={segments} className="min-w-0 flex-1" />
                <span className="shrink-0 text-ds-label font-semibold tabular-nums">
                  {percent}% through
                </span>
              </div>
              {/* The sentence the colours need: a tone on the bar never travels alone. */}
              <p className="text-ds-caption text-muted-foreground">
                {currentLabel
                  ? <>Most of the roster is sitting on <span className="font-medium text-foreground">{currentLabel}</span></>
                  : <>Nobody is on the ladder right now</>}
                {lateTotal > 0 && (
                  <>
                    , and{" "}
                    <span className="font-semibold text-[color:var(--tone-warn-ink)]">
                      {lateTotal} {lateTotal === 1 ? "is" : "are"} late
                    </span>
                  </>
                )}
                . Click a rung to see only those creators.
              </p>
              {/* Not folded into the sentence above: it is a different kind of problem from
                  a rung being busy, and it is the state of every row until somebody is put
                  on them. The word carries the amber, as everywhere else in here. */}
              {unownedTotal > 0 && (
                <p className="text-ds-caption">
                  <span className="font-semibold text-[color:var(--tone-warn-ink)]">
                    {unownedTotal === creators.length
                      ? `Nobody owns any of these ${creators.length}`
                      : `${unownedTotal} ${unownedTotal === 1 ? "has" : "have"} nobody on them`}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}&middot; a rung is a role, and a role is not a person who answers for it.
                  </span>
                </p>
              )}

              <StageRibbon
                segments={segments}
                value={stageFilter}
                onChange={(k) => setStageFilter(k as Stage | null)}
              />

              {/* The lens, and the switch between the two layouts. One control for the
                  thing somebody actually opened this screen to find. */}
              <FilterBar
                chips={[
                  { key: "all", label: "Everyone", n: creators.length },
                  { key: "stuck", label: "Stuck", n: stuckCount },
                ]}
                value={lens}
                onChange={(k) => setLens(k === "stuck" ? "stuck" : "all")}
                right={
                  <div className="flex items-center gap-1">
                    <Button
                      type="button" size="sm" variant={shown === "board" ? "default" : "outline"}
                      aria-pressed={shown === "board"} onClick={() => chooseView("board")}
                      className="h-8 gap-1.5 rounded-lg"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" aria-hidden />Board
                    </Button>
                    <Button
                      type="button" size="sm" variant={shown === "list" ? "default" : "outline"}
                      aria-pressed={shown === "list"} onClick={() => chooseView("list")}
                      className="h-8 gap-1.5 rounded-lg"
                    >
                      <Rows3 className="h-3.5 w-3.5" aria-hidden />List
                    </Button>
                  </div>
                }
              />
              {lens === "stuck" && (
                <p className="text-ds-caption text-muted-foreground">
                  Stuck means nobody owns the row, the date went past with nothing in, a
                  founder has not confirmed the rate, or the post is live and the payment is
                  a founder&apos;s to make.
                </p>
              )}
            </section>
          )}

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
                            : "Nothing packed yet."}
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
                      The client sees packed, sent and received on their own page.
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
          ) : visible.length === 0 ? (
            /* Filtered to nothing by the operator, which is the one case where a table
               vanishing is worse than a line of text: they caused it and need to know it
               was the rung or the lens rather than the campaign. */
            <div className={`${CARD} bg-card`}>
              <NoMatches onClear={clearFilters} />
            </div>
          ) : shown === "list" ? (
            /* The list. Every creator on one dense row, which is what a roster of two
               hundred wants: a row carries seven facts and a card carries two. */
            <DensityProvider id={`ladder.${campaignId}`}>
              <RosterTable rows={rows} canSeeCost={canSeeCost} onOpen={setOpen} />
            </DensityProvider>
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
                    {/* Who holds it, first, and shown even when the answer is nobody: this
                        is the panel somebody acts in, and an unowned row is the state to
                        notice before anything else on the list. */}
                    {open.stage !== "dropped" && (
                      <div className="flex items-center justify-between gap-ds-2">
                        <span className="text-muted-foreground">Holding it</span>
                        {open.owner_user_id ? (
                          <Owner
                            name={ownerName(open.owner_email) ?? "someone we cannot name"}
                            waiting={RUNG_ROLE[open.stage]?.waiting}
                          />
                        ) : (
                          <span className="flex items-center gap-ds-2">
                            <Owner name={null} />
                            <span className="text-muted-foreground">
                              should sit with {RUNG_ROLE[open.stage]?.desk ?? "somebody"}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
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

                  {/* Waiting on a founder. Shown to everybody who can open this panel, not
                      only to leadership: an account manager who cannot see the figure is
                      still the person who knows the client has been waiting four days, and
                      making her ask a founder to ask a founder is the problem rather than
                      the fix. */}
                  {open.stage === "enrolled" && open.agreed_rate_cents != null && !open.rate_agreed_at && (
                    <div className="space-y-2">
                      <NudgeRate creatorId={open.id} />
                      <p className="text-xs text-muted-foreground">
                        Emails whoever the decision was raised with, with a fresh link they can
                        answer from their phone. One a day.
                      </p>
                    </div>
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
                        {/* `Money` renders nothing when there is no confirmed rate, which
                            left the button reading "Pay" and a trailing space. */}
                        <Button className="w-full gap-2" disabled={busy}
                                onClick={() => act(() => ladderApi.paid(open.id, payRef), "Marked paid")}>
                          <Banknote className="h-4 w-4" />
                          {open.agreed_rate_cents != null && canSeeCost
                            ? <>Pay <Money cents={open.agreed_rate_cents} /></>
                            : 'Pay the agreed rate'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Written to the payables book from the confirmed rate, not typed again.
                        </p>
                      </div>
                    ) : (
                      <p className="text-ds-body text-muted-foreground">
                        Waiting on a founder.
                      </p>
                    )
                  )}

                  {open.stage === "paid" && (
                    <p className="text-ds-body text-muted-foreground">
                      Finished, posted and paid.
                    </p>
                  )}

                  {/* Ending a booking is leadership's call, the same as confirming a rate
                      or marking a payment. It was open to anybody with the campaigns
                      module, which is every talent and account manager, and the creator on
                      the other side of it may already have a signed agreement and a parcel
                      on the way. `canDestroy` is exactly the scope the endpoint now asks
                      for, so the button is not shown to somebody who would be refused. */}
                  {canDestroy && open.stage !== "paid" && open.stage !== "dropped" && (
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

/**
 * The ROLE that owns each rung, read off the one list rather than typed again.
 *
 * It is no longer the answer to "who holds this" — the row's own owner is, and that is a
 * person. This survives as the second line: it says which desk the row belongs on, which
 * is exactly what somebody needs when the answer to the first question is nobody.
 */
const RUNG_ROLE: Record<string, { name: string; desk: string; waiting: boolean }> = Object.fromEntries(
  STAGES.map(s => [s.key, {
    name: s.who === "The creator" ? "the creator" : s.who,
    /** The same role inside a sentence: "Should sit with a founder". */
    desk: s.who === "Founder" ? "a founder" : s.who === "The creator" ? "the creator" : s.who.toLowerCase(),
    waiting: s.who === "Founder" || s.who === "The creator",
  }]),
)

/**
 * The roster as a table: the same creators as the board, one dense row each.
 *
 * The board answers "where is everyone" by shape, and stops answering it somewhere around
 * forty cards. This answers the same question by column, and a row carries seven facts
 * where a card carries two, so it is the view that survives two hundred creators. Clicking
 * a row opens the same panel the board's cards open, which keeps one route to a place.
 */
function RosterTable({
  rows,
  canSeeCost,
  onOpen,
}: {
  rows: LadderCreator[]
  canSeeCost: boolean
  onOpen: (c: LadderCreator) => void
}) {
  const d = DENSITY[useDensity()]
  const heads = ["Creator", "Rung", "Next thing to do", "Who holds it", "Deliverables", "Rate", "Waiting"]
  return (
    <TableShell
      toolbar={
        <>
          <span className="text-ds-caption">
            {rows.length} {rows.length === 1 ? "creator" : "creators"} in this view
          </span>
          <div className="ml-auto">
            <DensityToggle />
          </div>
        </>
      }
      footer={
        <span className="text-ds-caption">Click a row to do the next thing for that creator.</span>
      }
    >
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className={cn("border-b bg-muted/30", d.divider)}>
            {heads.map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(d.cell, "text-ds-caption font-semibold text-muted-foreground")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const entered = enteredRungAt(c)
            const over = lateDays(c)
            const names = deliverableNames(c)
            const role = RUNG_ROLE[c.stage]
            const holder = c.owner_user_id ? ownerName(c.owner_email) : null
            return (
              <tr
                key={c.id}
                onClick={() => onOpen(c)}
                className={cn(d.row, "cursor-pointer border-b hover:bg-muted/40", d.divider)}
              >
                <td className={d.cell}>
                  {/* The row is clickable with a mouse and this is the same thing for a
                      keyboard, so the roster can be walked without a pointer. */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(c) }}
                    className="flex max-w-[220px] items-center gap-ds-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={cdnAvatar(c.avatar || undefined)} />
                      <AvatarFallback>{(c.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">@{c.username}</span>
                      {c.followers_count != null && (
                        <span className="block truncate text-ds-caption text-muted-foreground">
                          {compact(c.followers_count)}
                        </span>
                      )}
                    </span>
                  </button>
                </td>
                <td className={d.cell}>
                  <StageChip rung={c.stage} state={over > 0 ? "late" : undefined} />
                </td>
                <td className={cn(d.cell, "text-ds-body-sm")}>{nextAction(c)}</td>
                {/* Who holds it is a PERSON. Where that is nobody, which is every row in
                    the business today, the cell says so as a first class value and then
                    says whose desk it should be on, so it reads as a thing to fix rather
                    than as a cell nobody filled in. */}
                <td className={d.cell}>
                  {c.stage === "dropped" ? (
                    <span className="text-ds-caption text-muted-foreground">Off the campaign</span>
                  ) : c.owner_user_id ? (
                    <span title={role ? `${role.name} owns this rung` : undefined}>
                      <Owner
                        name={holder ?? "someone we cannot name"}
                        waiting={role?.waiting}
                        initials={holder ? ownerInitials(holder) : undefined}
                      />
                    </span>
                  ) : (
                    <span className="flex flex-col items-start gap-0.5">
                      <Owner name={null} />
                      {role && (
                        <span className="text-ds-caption text-muted-foreground">
                          Should sit with {role.desk}
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className={cn(d.cell, "text-ds-caption text-muted-foreground")}>
                  {names.length === 0 ? (
                    <Dash reason="unset" what="deliverables" />
                  ) : (
                    <>
                      {names.slice(0, 3).join(", ")}
                      {names.length > 3 && ` +${names.length - 3}`}
                    </>
                  )}
                </td>
                {/* The rate is a COST. Leadership and talent see the figure; everybody else
                    sees the column with a dash that says why, because a column that
                    disappears teaches people the number does not exist. */}
                <td className={cn(d.cell, "tabular-nums")}>
                  {!canSeeCost ? (
                    <Dash reason="unseen" what="the agreed rate" />
                  ) : c.agreed_rate_cents == null ? (
                    <Dash reason="unset" what="agreed rate" />
                  ) : (
                    <span className="text-ds-body-sm">
                      <Money cents={c.agreed_rate_cents} />
                      {!c.rate_agreed_at && (
                        <span className="text-muted-foreground"> &middot; to confirm</span>
                      )}
                    </span>
                  )}
                </td>
                <td className={d.cell}>
                  {over > 0 ? (
                    <Age days={entered ? daysSince(entered) : 0} lateDays={over} />
                  ) : entered ? (
                    <Age days={daysSince(entered)} />
                  ) : (
                    /* Nothing stamps an arrival on Enrolled, so this is genuinely unknown
                       rather than nought days. */
                    <Dash reason="unset" what="waiting time" />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableShell>
  )
}
