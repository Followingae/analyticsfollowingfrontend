"use client"

/**
 * Enrolments — every link we have sent a creator, and what came back.
 *
 * The screen is organised by what somebody has to DO, not by what the rows are. Four views:
 * what is waiting on us, what is out with creators, what is signed, and what was cancelled.
 * A flat list sorted by date buries the two links that need approving under forty that do not.
 *
 * The approval queue is first because it blocks everybody else: a talent manager cannot
 * send a link until somebody approves it, so a link sitting here unapproved is a creator
 * not being signed.
 *
 * It speaks the console's vocabulary now rather than its own dialect of it:
 *
 *   - the views are `FilterBar` chips, named after who is blocking, with counts that stay
 *     on screen at zero. They were tabs whose badges disappeared at nought, so "nothing is
 *     waiting on us" and "we have never looked" drew the same thing.
 *   - how long a link has sat is `Age`, which keeps the two clocks apart: days since it was
 *     raised, and days past the link's own expiry. The column was the date it was made,
 *     which is the one fact nobody chasing a link needs.
 *   - who holds it is `Owner`, so an unassigned link reads "Nobody yet" rather than a dash
 *     that looked exactly like a missing field.
 *   - a missing figure is `Dash` with a reason, or `NotAgreed` where no fee was ever
 *     proposed. Four different nothings were all drawn as one em dash.
 *   - a failed read says so and offers a retry. It used to print the error AND the empty
 *     list underneath it, which read as an all clear with a warning above it.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { MoneyHubHeader } from "@/components/console/MoneyHubHeader"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2, Copy, Check, Download, ShieldCheck, X, ExternalLink, Search,
  FileSignature, CircleAlert, CircleCheck, Banknote, Plus,
} from "lucide-react"
import { toast } from "sonner"
import {
  Age, Dash, FilterBar, NoMatches, NotAgreed, Owner, SectionHead, type FilterChip,
} from "@/components/console/surfaces"
import { enrolmentApi, type EnrolmentRow } from "@/services/enrolmentApi"
import { DirectEnrolmentDialog } from "@/components/enrolment/DirectEnrolmentDialog"
import { useAdminAccess } from "@/hooks/useAdminAccess"

/** AED and a thousands-separated integer. Never a dash: a figure that is not there has a
 *  reason, and the reason is the caller's to say with `Dash` or `NotAgreed`. */
const money = (c: number) => `AED ${(c / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`

const DAY = 86_400_000

/** Whole days since something happened. `Age` owns what that earns in colour. */
const daysSince = (iso?: string | null) => {
  if (!iso) return 0
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  return Number.isFinite(d) ? Math.max(0, d) : 0
}

/** How far past a date we promised, or nothing when it has not passed. The second clock. */
const lateBy = (iso?: string | null) => {
  if (!iso) return undefined
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  return Number.isFinite(d) && d > 0 ? d : undefined
}

const initialsOf = (name?: string | null) => {
  if (!name) return undefined
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return undefined
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

/** Where a link actually is, in one phrase. The raw status does not say whether a live
 *  link has been opened, and "sent, not opened" is the thing worth chasing. */
function progressOf(r: EnrolmentRow): { label: string; tone: "wait" | "go" | "done" | "dead" } {
  if (r.reported_at) return { label: "Reported, killed", tone: "dead" }
  if (r.status === "retracted") return { label: "Retracted", tone: "dead" }
  if (r.status === "rejected") return { label: "Rejected", tone: "dead" }
  if (r.status === "pending_approval") return { label: "Needs approval", tone: "wait" }
  if (r.status === "completed" || r.completed_at) {
    return r.bank_status === "pending"
      ? { label: "Signed, payee to confirm", tone: "wait" }
      : { label: "Complete", tone: "done" }
  }
  if (r.signed_at) return { label: "Signed, finishing", tone: "go" }
  if (r.email_verified_at) return { label: "Started", tone: "go" }
  if (r.first_opened_at) return { label: "Opened", tone: "go" }
  return { label: "Sent, not opened", tone: "wait" }
}

/* These were hand-picked amber, sky and emerald steps: a fourth amber beside the three the
   console decides once, on a screen that sits beside Payables. They name the tone tokens
   now, so "waiting" is the same colour here as it is everywhere else. Colour never travels
   without the word, and the word is the phrase above. */
const toneClass: Record<string, string> = {
  wait: "bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]",
  go: "bg-[var(--tone-info-wash)] text-foreground",
  done: "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]",
  dead: "bg-muted text-muted-foreground",
}

/** The four views, keyed on who is blocking. */
type View = "waiting" | "out" | "done" | "dead"

export default function EnrolmentsPageWrapper() {
  return (
    <AuthGuard>
      <SuperAdminInterface>
        <Suspense fallback={null}><EnrolmentsPage /></Suspense>
      </SuperAdminInterface>
    </AuthGuard>
  )
}

function EnrolmentsPage() {
  /* `canExport` is the same set of people the server calls leadership: operators plus the
     CEO and co-founder. The server refuses either way; this only stops us showing a button
     that would always come back 403. */
  const { can, canExport: isLeadership } = useAdminAccess()
  const [direct, setDirect] = useState(false)
  const [rows, setRows] = useState<EnrolmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [retracting, setRetracting] = useState<EnrolmentRow | null>(null)
  const [retractReason, setRetractReason] = useState("")
  /* Null until somebody picks one, so the opening view can still follow the data the way
     the tabs' `defaultValue` did: straight to the approval queue when there is one. */
  const [picked, setPicked] = useState<View | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      setRows(await enrolmentApi.list())
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load enrolments.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      [r.creator_handle, r.creator_name, r.brand_display_name, r.campaign_display_name, r.talent_name]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)))
  }, [rows, q])

  const pending = filtered.filter((r) => r.status === "pending_approval")
  const out = filtered.filter((r) => r.status === "live")
  // Signed and killed are opposite outcomes and were sharing one tab called "Finished and
  // closed". Sixteen retracted links read on that screen as sixteen creators who had been
  // through the whole thing, which is the exact opposite of what happened to them.
  const done = filtered.filter((r) => r.status === "completed" || r.completed_at)
  const dead = filtered.filter((r) =>
    !r.completed_at && ["retracted", "rejected", "expired"].includes(r.status))
  // A signed creator whose payee nobody has confirmed is blocking a payment, so it counts
  // as waiting on us even though the link itself is finished.
  const payeeWaiting = filtered.filter((r) => r.completed_at && r.bank_status === "pending")

  const view: View = picked ?? (pending.length || payeeWaiting.length ? "waiting" : "out")

  /* Named after who is blocking rather than after a status, and a count is a fact so it
     renders at zero. Nothing is pruned by role: a scoped talent manager cannot approve a
     link, but she still has to see that one of hers is sitting in the queue, so none of
     these chips is a tautology for anybody. */
  const chips: FilterChip[] = [
    { key: "waiting", label: "Waiting on us", n: pending.length + payeeWaiting.length },
    { key: "out", label: "With the creator", n: out.length },
    { key: "done", label: "Signed", n: done.length },
    { key: "dead", label: "Cancelled", n: dead.length },
  ]

  const copy = (r: EnrolmentRow) => {
    navigator.clipboard.writeText(r.url)
    setCopiedId(r.id); toast.success("Link copied")
    setTimeout(() => setCopiedId(null), 1800)
  }

  const approve = async (r: EnrolmentRow) => {
    setBusyId(r.id)
    try {
      await enrolmentApi.approve(r.id)
      toast.success(`Live. ${r.talent_name || "The owner"} has been emailed the link.`)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not approve that.")
    } finally { setBusyId(null) }
  }

  const doRetract = async () => {
    if (!retracting) return
    setBusyId(retracting.id)
    try {
      await enrolmentApi.retract(retracting.id, retractReason.trim())
      toast.success("Retracted. The link is dead and the team has been told.")
      setRetracting(null); setRetractReason("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not retract that.")
    } finally { setBusyId(null) }
  }

  const Row = ({ r, actions }: { r: EnrolmentRow; actions?: boolean }) => {
    const p = progressOf(r)
    /* The expiry is a date we promised, so a live or unapproved link past it is late. Once
       somebody has signed, the expiry stopped mattering and the row is not late at all. */
    const overdue = !r.completed_at && ["live", "pending_approval"].includes(r.status)
      ? lateBy(r.expires_at)
      : undefined
    return (
      <TableRow>
        <TableCell>
          <Link href={`/work/enrolments/${r.id}`} className="block min-w-0">
            <div className="truncate font-medium">
              {r.creator_handle || r.creator_name || <Dash reason="unset" what="a creator handle" />}
            </div>
            <div className="truncate text-xs text-muted-foreground">{r.creator_name}</div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="truncate text-sm">
            {r.campaign_display_name || <Dash reason="unset" what="a campaign" />}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {r.brand_display_name}
            {/* A direct link has no booking behind it, and until it is tagged its payments
                sit outside every campaign money screen. Worth seeing from the list. */}
            {r.purpose === "direct" && !r.campaign_id && (
              <span className="ml-1.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                direct, untagged
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-sm">
          {r.deliverables_summary || <Dash reason="unset" what="deliverables" />}
        </TableCell>
        <TableCell className="text-sm tabular-nums">
          {/* A link with no fee is not a blank field, it is a rate nobody has proposed, and
              that is a job somebody has to do before this creator can be paid. */}
          {r.fee_aed_cents == null ? <NotAgreed /> : money(r.fee_aed_cents)}
        </TableCell>
        <TableCell className="hidden sm:table-cell text-sm">
          {/* An unowned link used to read as a dash, which looked like a field we had failed
              to fill rather than a creator nobody is looking after. */}
          <Owner name={r.talent_name} initials={initialsOf(r.talent_name)} />
          {/* Who raised a link and who owns it are different facts. Showing only the
              assignee made links raised by somebody else read as theirs, which is how
              sixteen links raised during the build looked like a talent manager had sent
              them to real creators. */}
          {r.created_by_name && r.created_by_name !== r.talent_name && (
            <div className="text-xs text-muted-foreground">
              raised by {r.created_by_name}
            </div>
          )}
        </TableCell>
        <TableCell>
          <span className={`inline-flex rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium ${toneClass[p.tone]}`}>
            {p.label}
          </span>
        </TableCell>
        <TableCell>
          {r.created_at
            ? <Age days={daysSince(r.created_at)} lateDays={overdue} />
            : <Dash reason="unset" what="the date it was raised" />}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {r.status === "live" && (
              <Button size="icon" variant="ghost" title="Copy the link" onClick={() => copy(r)}>
                {copiedId === r.id ? <Check className="h-4 w-4 text-[color:var(--tone-good-ink)]" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
            {actions && r.status === "pending_approval" && can("proposals") && (
              <Button size="sm" onClick={() => approve(r)} disabled={busyId === r.id}>
                {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="mr-1.5 h-4 w-4" />Approve</>}
              </Button>
            )}
            {["live", "pending_approval"].includes(r.status) && (
              <Button size="icon" variant="ghost" title="Retract" onClick={() => setRetracting(r)}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" asChild title="Open">
              <Link href={`/work/enrolments/${r.id}`}><ExternalLink className="h-4 w-4" /></Link>
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const Grid = ({ list, actions }: { list: EnrolmentRow[]; actions?: boolean }) => (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creator</TableHead>
            <TableHead className="hidden md:table-cell">Campaign</TableHead>
            <TableHead className="hidden lg:table-cell">Deliverables</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead className="hidden sm:table-cell">Owner</TableHead>
            <TableHead>Where it is</TableHead>
            <TableHead>Waiting</TableHead>
            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{list.map((r) => <Row key={r.id} r={r} actions={actions} />)}</TableBody>
      </Table>
    </div>
  )

  /**
   * A view that came up empty.
   *
   * A section with no rows is not rendered at all, header included, which is the house rule.
   * The one exception is a view the USER narrowed to nothing: they caused it, so they need
   * to know it was the chip or the search box rather than the data. That is the only thing
   * `NoMatches` is for, and it never stands in for an empty screen.
   */
  const Nothing = () =>
    rows.length ? <NoMatches onClear={q ? () => setQ("") : undefined} /> : null

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Was a hand-rolled title block at a size no other console screen uses, on a screen
          the sidebar listed on its own. It is one of the money jobs, so it wears the money
          hub's header and its tabs: "we cannot pay her yet" and the reason why are no longer
          two screens apart. */}
      <MoneyHubHeader
        title="Enrolments"
        sub="Once a brand confirms a creator, this is the paperwork: the agreement they sign, the details they give us, and where their money and their product go."
        action={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Creator, brand, owner" className="w-56 pl-8" />
          </div>
          <Button variant="outline" asChild>
            <Link href="/work/enrolments/payments">
              <Banknote className="mr-2 h-4 w-4" /> Payments
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => enrolmentApi.rosterXlsx().catch((e) => toast.error(e instanceof Error ? e.message : "Export failed"))}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          {/* Every other link on this screen was raised from a booking that already exists.
              This is the one way to paper a creator with no proposal behind them. */}
          {isLeadership && (
            <Button onClick={() => setDirect(true)}>
              <Plus className="mr-2 h-4 w-4" /> New link
            </Button>
          )}
        </div>
        }
      />

      <DirectEnrolmentDialog open={direct} onOpenChange={setDirect} onCreated={() => { void load() }} />

      {/* A refused read is not "no enrolments". The error used to print above the list and
          the list still drew its empty state underneath, so a 500 read as an all clear with
          a warning over it. Nothing else renders until the read comes back. */}
      {err ? (
        <div className="mt-6 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><span>{err}</span>
          </div>
          <p className="text-muted-foreground">
            This is not an all clear: links may still be waiting on somebody.
          </p>
          <Button variant="outline" size="sm" onClick={() => { void load() }}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <FilterBar chips={chips} value={view} onChange={(k: string) => setPicked(k as View)} />

          {view === "waiting" && (
            <div className="space-y-8">
              {pending.length > 0 && (
                <section>
                  <SectionHead
                    icon={ShieldCheck}
                    title="Links to approve"
                    count={pending.length}
                    note="A talent manager made these. They do not work until somebody approves them, so a link sitting here is a creator not being signed."
                  />
                  <Grid list={pending} actions />
                </section>
              )}
              {payeeWaiting.length > 0 && (
                <section>
                  <SectionHead
                    icon={Banknote}
                    title="Payees to confirm"
                    count={payeeWaiting.length}
                    note="These creators are signed and their bank details are in. Somebody has to check the holder name and last four digits with them directly before anything pays out."
                  />
                  <Grid list={payeeWaiting} />
                </section>
              )}
              {!pending.length && !payeeWaiting.length && <Nothing />}
            </div>
          )}

          {view === "out" && (
            <section>
              {out.length > 0 ? (
                <>
                  <SectionHead icon={FileSignature} title="With the creator" count={out.length} />
                  <Grid list={out} />
                </>
              ) : <Nothing />}
            </section>
          )}

          {view === "done" && (
            <section>
              {done.length > 0 ? (
                <>
                  <SectionHead
                    icon={CircleCheck}
                    title="Signed"
                    count={done.length}
                    note="These creators signed the agreement and gave us their details."
                  />
                  <Grid list={done} />
                </>
              ) : <Nothing />}
            </section>
          )}

          {view === "dead" && (
            <section>
              {dead.length > 0 ? (
                <>
                  <SectionHead
                    icon={X}
                    title="Cancelled"
                    count={dead.length}
                    note="Retracted, rejected or expired. Nothing was signed through any of these."
                  />
                  <Grid list={dead} />
                </>
              ) : <Nothing />}
            </section>
          )}
        </div>
      )}

      <AlertDialog open={!!retracting} onOpenChange={(v: boolean) => { if (!v) { setRetracting(null); setRetractReason("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retract this link?</AlertDialogTitle>
            <AlertDialogDescription>
              {retracting?.creator_handle} will see a dead link if they open it again. Anything they already
              signed is kept and marked terminated, because withdrawing a link does not undo an agreement
              somebody made. The talent owner and leadership are emailed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={retractReason}
            onChange={(e) => setRetractReason(e.target.value)}
            placeholder="Why, in a few words (goes to the team, not the creator)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={doRetract} disabled={busyId === retracting?.id}>
              Retract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
