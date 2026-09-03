"use client"

/**
 * Enrolments — every link we have sent a creator, and what came back.
 *
 * The screen is organised by what somebody has to DO, not by what the rows are. Three tabs:
 * what is waiting on you, what is out with creators, and what is finished. A flat list
 * sorted by date buries the two links that need approving under forty that do not.
 *
 * The approval queue is first because it blocks everybody else: a talent manager cannot
 * send a link until somebody approves it, so a link sitting here unapproved is a creator
 * not being signed.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2, Copy, Check, Download, ShieldCheck, X, ExternalLink, Search,
  FileSignature, Clock, CircleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { enrolmentApi, type EnrolmentRow } from "@/services/enrolmentApi"
import { useAdminAccess } from "@/hooks/useAdminAccess"

const money = (c?: number | null) =>
  c == null ? "—" : `AED ${(c / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`

const when = (iso?: string | null) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
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

const toneClass: Record<string, string> = {
  wait: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  go: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  dead: "bg-muted text-muted-foreground border-transparent",
}

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
  const { can } = useAdminAccess()
  const [rows, setRows] = useState<EnrolmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [retracting, setRetracting] = useState<EnrolmentRow | null>(null)
  const [retractReason, setRetractReason] = useState("")

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
  const closed = filtered.filter((r) => !["pending_approval", "live"].includes(r.status))
  // A signed creator whose payee nobody has confirmed is blocking a payment, so it counts
  // as waiting on us even though the link itself is finished.
  const payeeWaiting = filtered.filter((r) => r.completed_at && r.bank_status === "pending")

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
    return (
      <TableRow>
        <TableCell>
          <Link href={`/work/enrolments/${r.id}`} className="block min-w-0">
            <div className="truncate font-medium">{r.creator_handle || r.creator_name || "—"}</div>
            <div className="truncate text-xs text-muted-foreground">{r.creator_name}</div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="truncate text-sm">{r.campaign_display_name || "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{r.brand_display_name}</div>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-sm">{r.deliverables_summary || "—"}</TableCell>
        <TableCell className="text-sm tabular-nums">{money(r.fee_aed_cents)}</TableCell>
        <TableCell className="hidden sm:table-cell text-sm">{r.talent_name || "—"}</TableCell>
        <TableCell>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[p.tone]}`}>
            {p.label}
          </span>
        </TableCell>
        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{when(r.created_at)}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {r.status === "live" && (
              <Button size="icon" variant="ghost" title="Copy the link" onClick={() => copy(r)}>
                {copiedId === r.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
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

  const Grid = ({ list, actions }: { list: EnrolmentRow[]; actions?: boolean }) => {
    if (!list.length) {
      return (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nothing here.
        </div>
      )
    }
    return (
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
              <TableHead className="hidden xl:table-cell">Made</TableHead>
              <TableHead className="text-right">—</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{list.map((r) => <Row key={r.id} r={r} actions={actions} />)}</TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enrolments</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Once a brand confirms a creator, this is the paperwork: the agreement they sign, the
            details they give us, and where their money and their product go.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Creator, brand, owner" className="w-56 pl-8" />
          </div>
          <Button
            variant="outline"
            onClick={() => enrolmentApi.rosterXlsx().catch((e) => toast.error(e instanceof Error ? e.message : "Export failed"))}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {err && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <CircleAlert className="mt-0.5 h-4 w-4 text-destructive" /><span>{err}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <Tabs defaultValue={pending.length || payeeWaiting.length ? "waiting" : "out"} className="mt-6">
          <TabsList>
            <TabsTrigger value="waiting" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Waiting on us
              {(pending.length + payeeWaiting.length) > 0 && (
                <Badge variant="secondary" className="ml-1">{pending.length + payeeWaiting.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="out" className="gap-1.5">
              <FileSignature className="h-3.5 w-3.5" /> With the creator
              {out.length > 0 && <Badge variant="secondary" className="ml-1">{out.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="closed">Finished and closed</TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="mt-4 space-y-8">
            <section>
              <h2 className="mb-2 text-sm font-semibold">Links to approve</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                A talent manager made these. They do not work until somebody approves them, so a link sitting
                here is a creator not being signed.
              </p>
              <Grid list={pending} actions />
            </section>
            <section>
              <h2 className="mb-2 text-sm font-semibold">Payees to confirm</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                These creators are signed and their bank details are in. Somebody has to check the holder name
                and last four digits with them directly before anything pays out.
              </p>
              <Grid list={payeeWaiting} />
            </section>
          </TabsContent>

          <TabsContent value="out" className="mt-4"><Grid list={out} /></TabsContent>
          <TabsContent value="closed" className="mt-4"><Grid list={closed} /></TabsContent>
        </Tabs>
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
