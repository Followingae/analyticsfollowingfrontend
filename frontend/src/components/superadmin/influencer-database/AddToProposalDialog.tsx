"use client"

/**
 * Put the creators you have selected onto a proposal.
 *
 * The reason this exists: you filter the database to food in KSA, you can see the eight
 * people you want, and the next thing you want is a proposal — not a detour through making
 * a list you will never open again.
 *
 * Only creators with a sell price can go on, because a creator with no sell price cannot be
 * quoted. Rather than filtering them out quietly, they are named: nine times out of ten the
 * answer is to price them, and you cannot do that if you never learn who they were.
 *
 * THE SECOND SCREEN, and why it is not a toast.
 *
 * The server holds back anyone this client has already turned down. Failing safe on the
 * server is worth nothing if the interface makes the safe outcome look like a bug: pick
 * forty, get thirty-eight, no explanation, and the operator concludes the tool dropped two
 * and adds them again by hand within the day. A silent hold is the one outcome worse than
 * either warning or refusing.
 *
 * So the dialog turns into a second screen naming each held-back creator with the client's
 * own sentence, the date, and the area it was recorded in. Two ways out, and leaving them
 * out is the easy one. Adding them anyway takes a typed reason, and the screen says plainly
 * that it flags them for a colleague to review rather than sneaking them past anyone. A
 * control people understand is a control they keep using.
 *
 * Density: compact. This is a dialog, so the ds- scale is used at its tighter steps and the
 * separation ladder stops at a tint. Nothing here is a card, because nothing here is an
 * object you can open.
 */
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search, FileText, AlertTriangle, ThumbsDown, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi, type ClientRejection } from "@/services/imdListsApi"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import type { MasterInfluencer } from "@/types/influencerDatabase"

/** Sell pricing lives in several per-deliverable fields; any one of them makes them sellable. */
function hasSell(inf: MasterInfluencer): boolean {
  const anyInf = inf as unknown as Record<string, number | null | undefined>
  return ["post", "reel", "story", "carousel", "video", "bundle", "monthly"]
    .some(d => Number(anyInf[`sell_${d}_aed_cents`] ?? 0) > 0)
}

// Proposals that are still being put together. Once one is with a client, adding creators to
// it behind their back is not an edit — it is a different proposal.
const OPEN_STATUSES = ["draft", "internal_review", "internally_approved", "more_requested"]

// What we are quoting. A creator added with no deliverable shows no price anywhere and is
// silently left out of the proposal total — so this is asked for, never assumed away.
const DELIVERABLES = [
  { key: "reel", label: "Reel" },
  { key: "post", label: "Post" },
  { key: "story", label: "Story" },
  { key: "carousel", label: "Carousel" },
  { key: "video", label: "Video" },
]

export function AddToProposalDialog({
  open, onOpenChange, selected, onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  selected: MasterInfluencer[]
  onDone?: () => void
}) {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState("")
  const [dType, setDType] = useState("reel")
  const [qty, setQty] = useState(1)

  // The held-back screen. `held` being non-empty is what switches the dialog over, so there
  // is one source of truth for which screen is showing.
  const [held, setHeld] = useState<ClientRejection[]>([])
  const [heldFor, setHeldFor] = useState<{ id: string; label: string; added: number } | null>(null)
  const [overrideWhy, setOverrideWhy] = useState("")

  // Blank and one character are both refused. This reason is going onto the proposal row and
  // an approver reads it later, so "x" is worse than nothing: it looks like an answer.
  const reasonOk = overrideWhy.trim().length >= 3

  const resetFlow = () => { setHeld([]); setHeldFor(null); setOverrideWhy("") }

  const sellable = useMemo(() => selected.filter(hasSell), [selected])
  const unpriced = useMemo(() => selected.filter(i => !hasSell(i)), [selected])

  useEffect(() => {
    if (!open) { resetFlow(); return }
    setLoading(true)
    adminProposalApi.listProposals({ limit: 100 })
      .then(r => setProposals((r.proposals || []).filter(p => OPEN_STATUSES.includes(p.status))))
      .catch(() => toast.error("Could not load proposals"))
      .finally(() => setLoading(false))
  }, [open])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return proposals
    return proposals.filter(p =>
      (p.campaign_name || p.title || "").toLowerCase().includes(t) ||
      (p.brand_name || "").toLowerCase().includes(t))
  }, [proposals, q])

  /** What went on, said once, so both the first pass and the override report it the same way. */
  const reportAdded = (proposalId: string, label: string, d: any, extra?: string) => {
    const bits = [`${d.added} added to ${label} · ${qty} ${dType}${qty > 1 ? "s" : ""} each`]
    if (extra) bits.push(extra)
    if (d.already_on_proposal) bits.push(`${d.already_on_proposal} already there`)
    if (d.without_deliverable?.length)
      bits.push(`${d.without_deliverable.length} have no ${dType} price, set one by hand`)
    if (d.no_cost?.length) bits.push(`${d.no_cost.length} with no cost recorded`)
    toast.success(bits.join(" · "), {
      action: { label: "Open proposal", onClick: () => router.push(`/work/proposals/${proposalId}`) },
    })
  }

  const add = async (proposalId: string, label: string) => {
    setBusy(true)
    try {
      const res = await imdListsApi.addSelectionToProposal(
        proposalId, sellable.map(i => i.id), { type: dType, quantity: qty })
      const d = res.data

      // Everyone else is already on. Only the held-back ones are still to decide, so the
      // dialog stays open on them rather than closing and leaving the count unexplained.
      if (d.client_rejected?.length) {
        setHeld(d.client_rejected)
        setHeldFor({ id: proposalId, label, added: d.added })
        return
      }

      reportAdded(proposalId, label, d)
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to the proposal")
    } finally { setBusy(false) }
  }

  /** Leave the held-back creators off. The easy way out, and the right one by default. */
  const skipHeld = () => {
    if (heldFor) {
      toast.success(
        `${heldFor.added} added to ${heldFor.label}`,
        { description: `${held.length} left out, this client had already turned them down.`,
          action: { label: "Open proposal",
                    onClick: () => router.push(`/work/proposals/${heldFor.id}`) } })
    }
    resetFlow()
    onOpenChange(false)
    onDone?.()
  }

  /** Add them anyway, with the reason. Only the held-back ids are re-sent: the rest are on. */
  const overrideHeld = async () => {
    if (!heldFor || !reasonOk) return
    setBusy(true)
    try {
      const res = await imdListsApi.addSelectionToProposal(
        heldFor.id, held.map(h => h.influencer_db_id), { type: dType, quantity: qty },
        { reason: overrideWhy.trim() })
      reportAdded(heldFor.id, heldFor.label,
                  { ...res.data, added: heldFor.added + (res.data.added || 0) },
                  `${res.data.overridden?.length ?? 0} flagged for review`)
      resetFlow()
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add them")
    } finally { setBusy(false) }
  }

  const when = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB",
      { day: "numeric", month: "short", year: "numeric" }) : "an earlier round"

  // ── the held-back screen ────────────────────────────────────────────────────────────
  // Separation ladder: space between rows, one hairline between them, one tint around the
  // whole thing to carry the state. No card, because a rejection is not an object you open.
  if (held.length > 0 && heldFor) {
    return (
      <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) resetFlow(); onOpenChange(o) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {held.length} of these have been turned down by this client
            </DialogTitle>
            <DialogDescription>
              {heldFor.added} {heldFor.added === 1 ? "creator is" : "creators are"} already on{" "}
              {heldFor.label}. The {held.length === 1 ? "one" : "ones"} below went in front of
              this client before and came back a no, so nothing has been added for them
              until you decide.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-ds-2 rounded-ds-lg bg-[var(--tone-warn-wash)] p-ds-3">
            {held.map((h, i) => (
              <div key={h.influencer_db_id}
                   className={`flex flex-col gap-ds-1 ${i > 0 ? "border-t border-black/[0.06] pt-ds-2 dark:border-white/[0.07]" : ""}`}>
                <div className="flex flex-wrap items-baseline gap-ds-2">
                  <span className="text-ds-label">@{h.username}</span>
                  <span className="text-ds-caption text-muted-foreground">
                    {when(h.rejected_at)}
                    {h.area ? ` · ${h.area}` : ""}
                    {h.round_no ? ` · round ${h.round_no}` : ""}
                  </span>
                </div>
                {/* Their sentence, not our summary of it. This is the line that lets someone
                    judge in two seconds whether the objection still stands. */}
                <p className="text-ds-body">
                  {h.client_reason
                    ? `“${h.client_reason}”`
                    : "No reason was recorded with the rejection."}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-ds-2">
            <Label htmlFor="override-why" className="text-ds-label">
              To add them anyway, say why
            </Label>
            <Textarea
              id="override-why"
              rows={3}
              value={overrideWhy}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverrideWhy(e.target.value)}
              placeholder="e.g. the brief widened to nano creators after this feedback, so the size objection no longer applies"
            />
            {/* Said plainly. An operator overriding is asking a colleague to look, not
                sneaking anyone past them, and knowing that is the difference between a
                control people respect and one they resent. */}
            <p className="text-ds-caption text-muted-foreground">
              Adding them flags them on the proposal for review, with what the client said and
              your reason beside it, so a colleague looks before this reaches the client.
            </p>
          </div>

          <DialogFooter className="gap-ds-2 sm:justify-between">
            <Button variant="ghost" className="gap-1.5" disabled={busy}
                    onClick={() => { setHeld([]); setHeldFor(null); setOverrideWhy("") }}>
              <ArrowLeft className="size-4" />Back
            </Button>
            <span className="flex flex-wrap items-center gap-ds-2">
              {/* Leaving them out is the easy one, so it is the solid button. */}
              <Button onClick={skipHeld} disabled={busy}>
                Leave them out
              </Button>
              <Button variant="outline" className="gap-1.5"
                      disabled={busy || !reasonOk} onClick={overrideHeld}>
                {busy ? <Loader2 className="size-4 animate-spin" />
                      : <ThumbsDown className="size-4" />}
                Add anyway
              </Button>
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to a proposal</DialogTitle>
          <DialogDescription>
            {sellable.length} of {selected.length} selected creators can be quoted.
            Pick the proposal they belong on.
          </DialogDescription>
        </DialogHeader>

        {/* This was a hand-picked amber: a border, a wash and a text colour written out by
            eye, which is a fourth amber beside the three the console decides once. It names
            the tone tokens now, so it agrees with the held-back screen it sits next to. */}
        {unpriced.length > 0 && (
          <div className="flex gap-ds-2 rounded-ds-lg bg-[var(--tone-warn-wash)] p-ds-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--tone-warn-ink)]" />
            <div className="flex min-w-0 flex-col gap-ds-1">
              <p className="text-ds-label text-[var(--tone-warn-ink)]">
                {unpriced.length} will be left out, they have no sell price yet
              </p>
              <p className="truncate text-ds-caption text-muted-foreground">
                {unpriced.slice(0, 6).map(i => `@${i.username}`).join(", ")}
                {unpriced.length > 6 ? ` and ${unpriced.length - 6} more` : ""}
              </p>
              <p className="text-ds-caption text-muted-foreground">
                Price them in the waiting room and they become selectable everywhere.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium">What are we quoting for each of them?</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {DELIVERABLES.map(d => (
              <Button key={d.key} type="button" size="sm"
                      variant={dType === d.key ? "default" : "outline"}
                      onClick={() => setDType(d.key)}>
                {d.label}
              </Button>
            ))}
            <span className="ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              ×
              <Input type="number" min={1} value={qty} className="h-8 w-16"
                     onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
              each
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A creator added with no deliverable shows no price on the proposal and is left out
            of the total.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="h-9 pl-8" placeholder="Search proposals…"
                 value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="max-h-[320px] space-y-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />Loading proposals…
            </div>
          )}
          {!loading && shown.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              No proposals are open for edits. Create one first.
            </p>
          )}
          {shown.map(p => (
            <button
              key={p.id}
              type="button"
              disabled={busy || sellable.length === 0}
              onClick={() => add(p.id, p.campaign_name || p.title || "the proposal")}
              className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-muted disabled:opacity-50"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {p.campaign_name || p.title || "Untitled proposal"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.brand_name || "No brand linked"}
                </span>
              </span>
              <Badge variant="outline" className="shrink-0 capitalize">
                {String(p.status || "").replace(/_/g, " ")}
              </Badge>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => router.push("/work/proposals/create")}>
            New proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
