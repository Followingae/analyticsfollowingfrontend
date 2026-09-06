"use client"

/**
 * Payments — who has signed, and whether their money went out.
 *
 * The enrolment flow used to end at "payee confirmed" and then fall off a cliff. The
 * agreement a creator signs promises them a schedule, and nothing recorded whether either
 * instalment left the bank, so the only way to answer "have we paid Nabil" was to read a
 * WhatsApp thread.
 *
 * THE SCREEN IS A WORK QUEUE, NOT A LEDGER. It opens on what is still owed, because that is
 * the only thing anybody comes here to act on. Paid rows are one tab away, not interleaved.
 *
 * TWO THINGS ARE DELIBERATELY LOUD.
 *
 * 1. An unconfirmed payee. Somebody typed their own IBAN into a page with no login, and the
 *    only thing between that and paying the wrong account is a person reading it back to
 *    them. So a row whose payee has not been confirmed says so, and its pay button is off.
 *    Making that a soft warning turns the confirmation step into decoration.
 *
 * 2. A payment that did not match what was promised. The remaining instalments re-spread
 *    over what is genuinely left, so an underpayment does not quietly shrink the fee, and
 *    the row says the amount differed rather than leaving somebody to spot it by subtracting.
 *
 * Marking a payment emails the creator, which is why every row also offers an undo.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2, Search, ShieldAlert, ShieldCheck, Banknote, Undo2, ExternalLink, Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  enrolmentApi, type PayableCreator, type Instalment,
} from "@/services/enrolmentApi"

const money = (c?: number | null) =>
  c == null ? "—" : `AED ${(c / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`

const when = (iso?: string | null) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const today = () => new Date().toISOString().slice(0, 10)

export default function PaymentsPageWrapper() {
  return (
    <AuthGuard>
      <SuperAdminInterface>
        <PaymentsPage />
      </SuperAdminInterface>
    </AuthGuard>
  )
}

function PaymentsPage() {
  const [rows, setRows] = useState<PayableCreator[]>([])
  const [totals, setTotals] = useState({ paid_aed_cents: 0, owed_aed_cents: 0 })
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState<string | null>(null)
  const [tab, setTab] = useState<"owed" | "paid">("owed")
  const [q, setQ] = useState("")
  const [paying, setPaying] = useState<{ row: PayableCreator; inst: Instalment } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await enrolmentApi.paymentsBoard()
      setRows(data.creators)
      setTotals(data.totals)
      setDenied(null)
    } catch (e) {
      setDenied(e instanceof Error ? e.message : "That did not load.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(r => {
      const isPaid = r.payments.status === "paid"
      if (tab === "owed" && isPaid) return false
      if (tab === "paid" && !isPaid) return false
      if (!needle) return true
      return [r.creator_name, r.creator_handle, r.campaign, r.brand]
        .some(v => (v || "").toLowerCase().includes(needle))
    })
  }, [rows, tab, q])

  const owedCount = rows.filter(r => r.payments.status !== "paid").length
  const paidCount = rows.length - owedCount

  if (denied) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-lg rounded-xl border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{denied}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Everyone who has signed an agreement, and whether their money has gone out. Only
            creators who have signed appear here.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Figure label="Still owed" value={money(totals.owed_aed_cents)} accent />
          <Figure label="Paid out" value={money(totals.paid_aed_cents)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v: string) => setTab(v as "owed" | "paid")}>
          <TabsList>
            <TabsTrigger value="owed">Owed{owedCount ? ` (${owedCount})` : ""}</TabsTrigger>
            <TabsTrigger value="paid">Paid{paidCount ? ` (${paidCount})` : ""}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Creator or campaign"
                 className="pl-8" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {tab === "owed"
            ? "Nobody is waiting on money."
            : "Nothing has been paid yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {shown.map(r => (
            <CreatorCard key={r.link_id} row={r}
                         onPay={inst => setPaying({ row: r, inst })}
                         onChanged={load} />
          ))}
        </div>
      )}

      {paying && (
        <MarkPaidDialog
          row={paying.row}
          inst={paying.inst}
          onClose={() => setPaying(null)}
          onDone={() => { setPaying(null); void load() }}
        />
      )}
    </div>
  )
}

function Figure({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${accent ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}
      </div>
    </div>
  )
}

function CreatorCard({ row, onPay, onChanged }: {
  row: PayableCreator
  onPay: (inst: Instalment) => void
  onChanged: () => void
}) {
  const p = row.payments
  const [undoing, setUndoing] = useState<number | null>(null)

  const undo = async (seq: number) => {
    setUndoing(seq)
    try {
      await enrolmentApi.unmarkPaid(row.link_id, seq)
      toast.success("Unmarked. The creator was already told, so tell them yourself too.")
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally {
      setUndoing(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/work/enrolments/${row.link_id}`}
                  className="font-medium hover:underline">
              {row.creator_name || row.creator_handle || "Creator"}
            </Link>
            {row.creator_handle && (
              <span className="text-sm text-muted-foreground">@{row.creator_handle}</span>
            )}
            <Link href={`/work/enrolments/${row.link_id}`}
                  className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {row.campaign || "—"}{row.brand ? ` · ${row.brand}` : ""} · signed {when(row.signed_at)}
          </div>
          <div className="mt-2">
            {row.payee_confirmed ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Payee confirmed{row.bank_last4 ? ` · ends ${row.bank_last4}` : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-3 w-3" />
                Payee not confirmed yet
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Figure label="Fee" value={money(p.fee_aed_cents)} />
          <Figure label={p.overpaid ? "Overpaid by" : "Outstanding"}
                  value={money(Math.abs(p.outstanding_aed_cents))}
                  accent={p.outstanding_aed_cents > 0} />
        </div>
      </div>

      <div className="divide-y">
        {p.instalments.map(i => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {i.pct != null ? `${i.pct}% ` : ""}{i.label || `Instalment ${i.seq}`}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {i.paid ? (
                  <>
                    {money(i.paid_aed_cents)} sent {when(i.paid_on)}
                    {i.reference ? ` · ref ${i.reference}` : ""}
                    {i.marked_by_label ? ` · marked by ${i.marked_by_label}` : ""}
                  </>
                ) : (
                  <>
                    {money(i.now_due_aed_cents)} due
                    {i.now_due_aed_cents !== i.due_aed_cents && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {" "}· adjusted from {money(i.due_aed_cents)}
                      </span>
                    )}
                  </>
                )}
              </div>
              {i.differs && (
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Not the amount the agreement promised ({money(i.due_aed_cents)}).
                </div>
              )}
            </div>

            {i.paid ? (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                      disabled={undoing === i.seq} onClick={() => void undo(i.seq)}>
                {undoing === i.seq
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Undo2 className="h-3.5 w-3.5" />}
                Undo
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5"
                      disabled={!row.payee_confirmed}
                      title={row.payee_confirmed
                        ? undefined
                        : "Confirm the bank details with the creator first."}
                      onClick={() => onPay(i)}>
                <Banknote className="h-3.5 w-3.5" /> Mark paid
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MarkPaidDialog({ row, inst, onClose, onDone }: {
  row: PayableCreator
  inst: Instalment
  onClose: () => void
  onDone: () => void
}) {
  // Pre-filled with what is owed and today's date, because that is what almost every
  // transfer is. Somebody who has to retype a number the system already knows stops using
  // the screen and marks nothing.
  const [amount, setAmount] = useState(String(((inst.now_due_aed_cents ?? 0) / 100).toFixed(0)))
  const [paidOn, setPaidOn] = useState(today())
  const [reference, setReference] = useState("")
  const [busy, setBusy] = useState(false)

  const cents = Math.round(Number(amount || 0) * 100)
  const differs = cents > 0 && cents !== (inst.now_due_aed_cents ?? 0)

  const submit = async () => {
    if (!(cents > 0)) { toast.error("A payment needs an amount."); return }
    setBusy(true)
    try {
      await enrolmentApi.markPaid(row.link_id, inst.seq, {
        amount_aed_cents: cents,
        paid_on: paidOn,
        reference: reference.trim() || undefined,
      })
      toast.success(`Marked paid. ${row.creator_name || "The creator"} has been emailed.`)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That did not work.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark this payment sent</DialogTitle>
          <DialogDescription>
            {inst.pct != null ? `${inst.pct}% ` : ""}{inst.label || `Instalment ${inst.seq}`} for{" "}
            {row.creator_name || row.creator_handle}
            {row.bank_last4 ? `, to the account ending ${row.bank_last4}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amt">Amount sent (AED)</Label>
            <Input id="amt" inputMode="decimal" value={amount}
                   onChange={e => setAmount(e.target.value)} className="mt-1.5" />
            {differs && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                That is not the {money(inst.now_due_aed_cents)} owed. The difference moves to
                what is left, so the fee still adds up.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="on">Date it left the account</Label>
            <Input id="on" type="date" max={today()} value={paidOn}
                   onChange={e => setPaidOn(e.target.value)} className="mt-1.5" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Not today's date unless it went today. This is what a bank statement is matched
              against.
            </p>
          </div>

          <div>
            <Label htmlFor="ref">Transfer reference <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="ref" value={reference} onChange={e => setReference(e.target.value)}
                   placeholder="e.g. FT26090612345" className="mt-1.5" />
          </div>

          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            This emails the creator to say their payment is on its way. You can undo it, but
            they will already have read it.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Mark paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
