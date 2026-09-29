'use client'

/**
 * Merchant of Record, the operator's module.
 *
 * WHAT THIS REPLACES. Nothing. Every money action on MoR existed as an endpoint with no call
 * site anywhere in the app: marking a transfer received, releasing a payout, settling a name
 * mismatch. They were performed, when they were performed at all, by hand against the API.
 * The single MoR control that had a screen, the fee waiver, lived inside a client's page.
 *
 * THE ORDER IS THE UNIT. A brand pays once per order, so the invoice, the receipt and the
 * transfer hang off the order rather than off a creator. An operator thinks "Barakat's
 * October order, six creators, waiting on their transfer", not "payment three of six".
 *
 * WHAT COMES FIRST. Not the newest order: the one somebody is waiting behind. A transfer
 * that has landed and not been marked is the most expensive row on the screen, because every
 * creator on it is sitting unpaid while nothing happens. So the work waiting on us is above
 * the list, and the list is only there when nothing is.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { PageHead, Panel, Stat } from '@/components/console/primitives'
import { toast } from 'sonner'
import {
  AlertTriangle, Banknote, CheckCircle2, FileText, Loader2, Receipt, RefreshCw, Users, Wallet,
} from 'lucide-react'
import {
  morOpsApi, aedFromCents,
  type MorBilling, type MorOpsOverview, type MorOrder, type MorOrderCreator,
  type MorOrderDetail, type MorPayable, type OrderKind,
} from '@/services/morOpsApi'
import { cn } from '@/lib/utils'

export default function MorOpsPage() {
  return (
    <SuperadminLayout>
      <Ops />
    </SuperadminLayout>
  )
}

function Ops() {
  const [data, setData] = useState<MorOpsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  /* A failed read must not look like a quiet day. An empty MoR screen and a broken MoR screen
     are the same picture, and only one of them means there is nothing to do. */
  const [failure, setFailure] = useState<string | null>(null)
  const [open, setOpen] = useState<MorOrder | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await morOpsApi.overview()
      setData(r.data)
      setFailure(null)
    } catch (e) {
      setData(null)
      setFailure((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const waiting = useMemo(() => {
    if (!data) return { invoice: [] as MorOrder[], transfer: [] as MorOrder[] }
    return {
      invoice: data.orders.filter(o => o.status === 'awaiting_payment' && !o.invoice_attached_at),
      transfer: data.orders.filter(o => o.status === 'awaiting_payment' && !!o.invoice_attached_at),
    }
  }, [data])

  const m = data?.money

  return (
    <div className="mx-auto w-full max-w-7xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <PageHead
        title="Merchant of Record"
        sub="Every order, every client. Raise the invoice, mark the money in, pay the creators."
        action={
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        }
      />

      {failure && (
        <div className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-semibold text-destructive">This did not load</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Not an empty pipeline, a failed request. {failure}
          </p>
        </div>
      )}

      <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 xl:grid-cols-5">
        <Stat icon={Wallet} label="Owed to us" value={m ? aedFromCents(m.owed_to_us) : '—'} />
        <Stat icon={CheckCircle2} label="Received" value={m ? aedFromCents(m.received) : '—'} />
        <Stat icon={Users} label="Owed to creators" value={m ? aedFromCents(m.owed_to_creators) : '—'} />
        <Stat icon={Banknote} label="Paid out" value={m ? aedFromCents(m.paid_out) : '—'} />
        {/* The only number in the product that says what MoR earns. */}
        <Stat icon={Receipt} label="Our margin" value={m ? aedFromCents(m.our_margin) : '—'} />
      </div>

      {loading && !data ? (
        <div className="space-y-ds-3">
          {[0, 1, 2].map(n => <Skeleton key={n} className="h-28 w-full rounded-ds-lg" />)}
        </div>
      ) : data ? (
        <>
          {/* Work waiting on us, above everything. */}
          {data.mismatches.length > 0 && (
            <Panel
              title={`${data.mismatches.length} signed under a different name`}
              description="They signed with a name that does not match what the brand told us. Nobody gets paid until this is settled, and the brand is never asked."
            >
              <div className="space-y-ds-3">
                {data.mismatches.map(x => (
                  <Mismatch key={x.id} row={x} onDone={load} />
                ))}
              </div>
            </Panel>
          )}

          {waiting.invoice.length > 0 && (
            <Panel title={`${waiting.invoice.length} waiting on an invoice`}
                   description="The brand has locked these and is looking at “your invoice is being prepared”."
                   flush>
              <OrderTable orders={waiting.invoice} onOpen={setOpen} />
            </Panel>
          )}

          {waiting.transfer.length > 0 && (
            <Panel title={`${waiting.transfer.length} waiting on their transfer`}
                   description="Invoiced. Watch the bank, then mark it in. Any already started early are marked, and their creators are contracted but cannot be paid."
                   flush>
              <OrderTable orders={waiting.transfer} onOpen={setOpen} />
            </Panel>
          )}

          {data.ready_to_pay.length > 0 && (
            <Panel
              title={`${data.ready_to_pay.length} ready to be paid`}
              description="Signed, bank details in, name checked. This is the payout run."
              flush
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Creator</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Owed</TableHead>
                      <TableHead className="pr-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ready_to_pay.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="pl-6 font-medium">{r.creator_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.client}</TableCell>
                        <TableCell className="font-mono text-[12px]">
                          {r.bank_holder} · ····{r.bank_last4}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {aedFromCents(r.creator_fee_cents)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <PayButton id={r.id} name={r.creator_name || 'them'} onDone={load} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          )}

          <Panel title="Every order" flush>
            <OrderTable orders={data.orders} onOpen={setOpen} showStatus />
          </Panel>
        </>
      ) : null}

      {open && <OrderSheet order={open} onClose={() => setOpen(null)} onChange={load} />}
    </div>
  )
}

/* ── the order list ─────────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
  awaiting_payment: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  funded: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  paid: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
}

function OrderTable({ orders, onOpen, showStatus }: {
  orders: MorOrder[]; onOpen: (o: MorOrder) => void; showStatus?: boolean
}) {
  if (orders.length === 0) {
    return <p className="px-6 pb-ds-3 text-ds-body-sm text-muted-foreground">Nothing here.</p>
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Order</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Creators</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Paperwork</TableHead>
            {showStatus && <TableHead>Status</TableHead>}
            <TableHead className="pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(o => (
            <TableRow key={`${o.kind}-${o.id}`} className="cursor-pointer"
                      onClick={() => onOpen(o)}>
              <TableCell className="pl-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{o.label || o.reference}</span>
                  {/* Contracted on the brand's word. Worth seeing from the list, because it
                      is the one state where creators are working and we hold nothing. */}
                  {o.advance_released_at && !o.receipt_attached_at && (
                    <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                      started early
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">{o.reference}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">{o.client || '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {o.paid > 0 ? `${o.paid}/${o.creators}` : o.creators}
              </TableCell>
              <TableCell className="text-right tabular-nums">{aedFromCents(o.total_cents)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Doc on={!!o.invoice_attached_at} label="Invoice" />
                  <Doc on={!!o.receipt_attached_at} label="Receipt" />
                </div>
              </TableCell>
              {showStatus && (
                <TableCell>
                  <Badge variant="secondary"
                         className={cn('border-0 text-[11px]', STATUS_TONE[o.status] || '')}>
                    {o.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="pr-6 text-right">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Open</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Doc({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium',
      on ? 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
         : 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
    )}>
      <FileText className="size-3" aria-hidden />{label}
    </span>
  )
}

/* ── a name mismatch ────────────────────────────────────────────────────────────────── */

function Mismatch({ row, onDone }: { row: any; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const settle = async (accept: boolean) => {
    setBusy(true)
    try {
      await morOpsApi.settleName(row.id, accept, note.trim() || undefined)
      toast.success(accept ? 'Accepted, they can be paid' : 'Rejected, this will not be paid')
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-ds-lg bg-[var(--tone-warn-wash)] px-4 py-3">
      <p className="flex items-center gap-1.5 text-ds-label text-[var(--tone-warn-ink)]">
        <AlertTriangle className="size-4" aria-hidden />
        {row.client} · {row.reference}
      </p>
      <p className="mt-1.5 text-ds-body-sm">
        The brand is paying <strong>{row.expected}</strong>. The agreement was signed by{' '}
        <strong>{row.signed || 'nobody'}</strong>.
      </p>
      <Textarea
        value={note} onChange={e => setNote(e.target.value)} rows={2}
        placeholder="What you checked, so the next person does not check it again"
        className="mt-ds-2 bg-background text-[13px]"
      />
      <div className="mt-ds-2 flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => settle(true)}>
          {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}Same person, pay them
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => settle(false)}>
          Not them, hold it
        </Button>
      </div>
    </div>
  )
}

function PayButton({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')
  const [open, setOpen] = useState(false)

  const pay = async () => {
    setBusy(true)
    try {
      await morOpsApi.markPaid(id, ref.trim() || undefined)
      toast.success(`${name} marked paid`)
      setOpen(false)
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <>
      <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>Mark paid</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {name} paid</DialogTitle>
            <DialogDescription>
              Do this after the transfer has actually left. They get an email with the amount
              and this reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Our bank reference</Label>
            <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="FT26091600123" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={pay} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Mark paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ── one order ──────────────────────────────────────────────────────────────────────── */

function OrderSheet({ order, onClose, onChange }: {
  order: MorOrder; onClose: () => void; onChange: () => void
}) {
  const [detail, setDetail] = useState<MorOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [invNo, setInvNo] = useState(order.invoice_number || '')
  const [invUrl, setInvUrl] = useState('')
  const [invName, setInvName] = useState('')
  const [rcptUrl, setRcptUrl] = useState('')
  const [rcptName, setRcptName] = useState('')
  const [advUrl, setAdvUrl] = useState('')
  const [advName, setAdvName] = useState('')
  const [advNote, setAdvNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)

  const creators = detail?.creators ?? []

  const load = useCallback(async () => {
    try {
      const r = await morOpsApi.detail(order.kind as OrderKind, order.id)
      setDetail(r.data)
    } catch (e) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }, [order])

  /* The file is stored first and recorded second, so a failed upload never leaves an order
     claiming an invoice that does not exist. */
  const pickInvoice = async (file: File) => {
    setUploading(true)
    try {
      const r = await morOpsApi.uploadInvoiceFile(order.kind, order.id, file)
      setInvUrl(r.data.url); setInvName(r.data.name)
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const pickReceipt = async (file: File) => {
    setUploading(true)
    try {
      const r = await morOpsApi.uploadReceiptFile(order.kind, order.id, file)
      setRcptUrl(r.data.url); setRcptName(r.data.name)
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const pickProof = async (file: File) => {
    setUploading(true)
    try {
      const r = await morOpsApi.uploadAdvanceProof(order.kind, order.id, file)
      setAdvUrl(r.data.url); setAdvName(r.data.name)
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const releaseEarly = async () => {
    setBusy(true)
    try {
      const r = await morOpsApi.releaseEarly(order.kind, order.id, advUrl, advNote)
      toast.success(
        `${r.data.invited} of ${r.data.creators} ${r.data.creators === 1 ? 'creator' : 'creators'} invited`,
        { description: 'The order still shows as owed to us until you mark the transfer in.' })
      setAdvUrl(''); setAdvName(''); setAdvNote('')
      onChange(); void load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  useEffect(() => { void load() }, [load])

  const attach = async () => {
    setBusy(true)
    try {
      await morOpsApi.attachInvoice(order.kind, order.id, invNo, invUrl)
      toast.success('Invoice attached and emailed to them')
      onChange(); onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  const received = async () => {
    setBusy(true)
    try {
      await morOpsApi.markReceived(order.kind, order.id, rcptUrl)
      toast.success('Marked received', {
        description: 'Every creator on this order has been emailed their link.',
      })
      onChange(); onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <Sheet open onOpenChange={(o: boolean) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle className="pr-6">{order.label || order.reference}</SheetTitle>
          <SheetDescription>
            {order.client} · {order.creators} {order.creators === 1 ? 'creator' : 'creators'} ·{' '}
            {aedFromCents(order.total_cents)} · our fee {aedFromCents(order.our_fee_cents)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-ds-4 px-4 pb-10">
          {/* Who the invoice is made out to. It is the client's own billing record, and
              raising an invoice against a half-finished one is how a legal name gets
              invented, so what is missing is named rather than left blank. */}
          {detail && <InvoiceTo billing={detail.billing} />}

          {/* What we are charging, split the way the payout is split. One creator is one
              line: their fee, our commission on it, the VAT, what the brand pays. */}
          {detail && <MoneySplit detail={detail} />}

          {/* The two actions, in the order they happen. */}
          {!order.invoice_attached_at && (
            <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
              <p className="text-ds-label">Attach the invoice</p>
              <p className="mt-1 text-ds-body-sm text-muted-foreground">
                Raise it in QuickBooks off the figures above, then put the number and the PDF
                here. They are told the moment you do.
              </p>
              <div className="mt-ds-3 space-y-2">
                <Input value={invNo} onChange={e => setInvNo(e.target.value)}
                       placeholder="Invoice number, e.g. INV-1042" />
                <FilePick label="Choose the invoice PDF" name={invName} busy={uploading}
                          onPick={pickInvoice} id="mor-invoice-file" />
                <Button size="sm" onClick={attach} disabled={busy || uploading || !invNo.trim() || !invUrl}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}Attach and send
                </Button>
              </div>
            </section>
          )}

          {/* Starting the creators before the money lands. Offered only while the order is
              still owed, and never again once it has been done. */}
          {!order.receipt_attached_at && !detail?.order.advance_released_at && (
            <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
              <p className="text-ds-label">Start without the money</p>
              <p className="mt-1 text-ds-body-sm text-muted-foreground">
                For when the brand says the transfer is a day or two away. The creators get
                their links now, so nobody is still doing paperwork when it lands. The order
                stays owed to us, still wants the bank receipt, and nothing can be paid out
                until you mark that in.
              </p>
              <div className="mt-ds-3 space-y-2">
                <FilePick label="What the brand sent you" name={advName} busy={uploading}
                          onPick={pickProof} id="mor-advance-file" />
                <Input value={advNote} onChange={e => setAdvNote(e.target.value)}
                       placeholder="Who told you, and when they said it will land" />
                <Button size="sm" variant="outline"
                        onClick={releaseEarly} disabled={busy || uploading || !advUrl}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Send the creators their links now
                </Button>
              </div>
            </section>
          )}

          {detail?.order.advance_released_at && !order.receipt_attached_at && (
            <section className="rounded-ds-lg border border-[var(--tone-warn-line)] bg-[var(--tone-warn-bg)] p-4">
              <p className="text-ds-label">Started early, money still owed</p>
              <p className="mt-1 text-ds-body-sm">
                The creators have their links. {aedFromCents(order.total_cents)} has not
                reached us, and nobody on this order can be paid until it does.
                {detail.order.advance_note ? ` “${detail.order.advance_note}”` : ''}
              </p>
              {detail.order.advance_proof_url && (
                <a href={detail.order.advance_proof_url} target="_blank" rel="noreferrer"
                   className="mt-ds-2 inline-flex items-center gap-1.5 text-[12.5px] underline underline-offset-2">
                  <FileText className="size-3.5" />What the brand sent
                </a>
              )}
            </section>
          )}

          {order.invoice_attached_at && !order.receipt_attached_at && (
            <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
              <p className="text-ds-label">Mark the transfer received</p>
              <p className="mt-1 text-ds-body-sm text-muted-foreground">
                Attaching the receipt is what marks it received, and it is what sends every
                creator on this order their link. There is no undo.
              </p>
              <div className="mt-ds-3 space-y-2">
                <FilePick label="Choose the bank receipt" name={rcptName} busy={uploading}
                          onPick={pickReceipt} id="mor-receipt-file" />
                <Button size="sm" onClick={received} disabled={busy || uploading || !rcptUrl}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Money is in, invite the creators
                </Button>
              </div>
            </section>
          )}

          {order.receipt_attached_at && (
            <PayoutRun order={order} onChange={() => { void load(); onChange() }} />
          )}

          <section>
            <p className="text-ds-label">The creators</p>
            {loading ? (
              <Skeleton className="mt-ds-2 h-32 w-full rounded-ds-lg" />
            ) : (
              <div className="mt-ds-2 space-y-1.5">
                {creators.map(c => <CreatorRow key={c.id} c={c} />)}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * The payout run: one file out, one reference back, everybody marked at once.
 *
 * WHY IT IS A RUN AND NOT A ROW OF BUTTONS. Paying nine creators is one visit to the bank, so
 * it should be one action here. Nine buttons is how the ninth gets missed, and the ninth is a
 * person waiting on money we are already holding.
 *
 * WHY THE FILE IS A DOWNLOAD. It is the only place a full IBAN appears. It is pulled
 * deliberately rather than rendered onto a screen that sits open all afternoon, and it holds
 * only creators who can be paid right now, so nobody re-reads the rules while using it.
 */
function PayoutRun({ order, onChange }: { order: MorOrder; onChange: () => void }) {
  const [rows, setRows] = useState<MorPayable['creators']>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')
  const [receipt, setReceipt] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await morOpsApi.payable(order.kind as OrderKind, order.id)
      setRows(r.data.creators); setTotal(r.data.total_cents)
    } catch { /* the sheet already shows what is wrong; this section just stays empty */ }
    finally { setLoading(false) }
  }, [order])

  useEffect(() => { void load() }, [load])

  const download = async () => {
    try {
      await morOpsApi.payoutFile(order.kind as OrderKind, order.id,
        `mor-payouts-${order.reference || order.id.slice(0, 8)}.xlsx`)
    } catch (e) { toast.error((e as Error).message) }
  }

  const pay = async () => {
    setBusy(true)
    try {
      const r = await morOpsApi.markPaidTogether(order.kind as OrderKind, order.id, {
        payment_ids: rows.map(x => x.id),
        payment_reference: ref.trim(),
        receipt_file_url: receipt.trim() || undefined,
      })
      /* Anybody the gate refused is named, never swallowed: a run that says "9 paid" while
         one person was skipped is how somebody waits another week for nothing. */
      if (r.data.skipped.length) {
        toast.warning(`${r.data.paid} paid, ${r.data.skipped.length} skipped`, {
          description: r.data.skipped.map(x => x.why).join(' '),
          duration: 12000,
        })
      } else {
        toast.success(`${r.data.paid} paid`, {
          description: r.data.order_complete
            ? 'That was the last one. The brand has been told the order is finished.'
            : undefined,
        })
      }
      setOpen(false); onChange(); void load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  if (loading) return <Skeleton className="h-24 w-full rounded-ds-lg" />
  if (!rows.length) return null

  return (
    <section className="rounded-ds-lg border border-[var(--tone-info-line)] bg-[var(--tone-info-bg)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-ds-label">
            {rows.length} ready to be paid
          </p>
          <p className="mt-1 text-ds-body-sm text-muted-foreground">
            Signed, bank details in, names checked. {aedFromCents(total)} to go out.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={download}>
            <FileText className="mr-1.5 size-3.5" />Payout file
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Banknote className="mr-1.5 size-3.5" />Mark all paid
          </Button>
        </div>
      </div>

      <div className="mt-ds-3 space-y-1">
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="truncate">
              {r.creator_name}
              {r.bank_holder && r.bank_holder !== r.creator_name && (
                <span className="text-muted-foreground"> · paying {r.bank_holder}</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {aedFromCents(r.creator_fee_cents)}
            </span>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {rows.length} paid</DialogTitle>
            <DialogDescription>
              Do this after the transfers have actually left the bank. {aedFromCents(total)} to{' '}
              {rows.length} {rows.length === 1 ? 'creator' : 'creators'}. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-ds-3">
            <div className="space-y-1.5">
              <Label htmlFor="mor-run-ref">Bank reference</Label>
              <Input id="mor-run-ref" value={ref} onChange={e => setRef(e.target.value)}
                     placeholder="The reference on the transfer" />
              <p className="text-[11.5px] text-muted-foreground">
                Goes on every creator in this run, so the statement can be reconciled later.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mor-run-receipt">Bank receipt (optional)</Label>
              <Input id="mor-run-receipt" value={receipt}
                     onChange={e => setReceipt(e.target.value)}
                     placeholder="Link to the receipt covering this run" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={pay} disabled={busy || !ref.trim()}>
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Mark {rows.length} paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}


/** Where one creator has got to, in the order the steps happen. */
function creatorStage(c: MorOrderCreator): { label: string; tone: string } {
  if (c.status === 'paid') return { label: 'Paid', tone: 'text-[var(--tone-good-ink)]' }
  if (c.name_check === 'rejected') return { label: 'Signature rejected', tone: 'text-[var(--tone-bad-ink)]' }
  if (c.name_check === 'mismatch') return { label: 'Name does not match', tone: 'text-[var(--tone-warn-ink)]' }
  if (c.bank_at) return { label: 'Ready to pay', tone: 'text-[var(--tone-info-ink)]' }
  if (c.signed_at) return { label: 'Signed, waiting on bank details', tone: 'text-muted-foreground' }
  if (c.first_opened_at) return { label: 'Opened the link', tone: 'text-muted-foreground' }
  if (c.invite_failed_reason) return { label: 'We could not reach them', tone: 'text-[var(--tone-bad-ink)]' }
  if (c.invite_sent_at) return { label: 'Invited', tone: 'text-muted-foreground' }
  return { label: 'Not invited yet', tone: 'text-muted-foreground' }
}

/**
 * Who the invoice is made out to.
 *
 * It is the client's own billing record, entered by them. An order whose client never
 * finished that form cannot be invoiced correctly, and the failure mode is somebody here
 * typing a legal name from memory, so the gaps are named rather than rendered as blanks.
 */
function InvoiceTo({ billing }: { billing: MorBilling }) {
  const incomplete = billing.missing.length > 0
  const label: Record<string, string> = {
    trn: 'their TRN', legal_name: 'their legal name', invoice_address: 'their invoice address',
  }
  return (
    <section className={cn(
      'rounded-ds-lg border p-4',
      incomplete
        ? 'border-[var(--tone-warn-line)] bg-[var(--tone-warn-bg)]'
        : 'border-black/[0.08] dark:border-white/[0.1]',
    )}>
      <p className="text-ds-label">Invoice to</p>
      {incomplete ? (
        <p className="mt-1 text-ds-body-sm">
          They have not given us {billing.missing.map(k => label[k] || k).join(', ')}. Ask them
          to finish their billing details before this is invoiced.
        </p>
      ) : null}
      <dl className="mt-ds-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <Field k="Legal name" v={billing.legal_name} />
        <Field k="TRN" v={billing.trn} mono />
        <Field k="Address" v={billing.invoice_address} span />
      </dl>
      {billing.trade_licence_url && (
        <a href={billing.trade_licence_url} target="_blank" rel="noreferrer"
           className="mt-ds-3 inline-flex items-center gap-1.5 text-[12.5px] underline underline-offset-2">
          <FileText className="size-3.5" />{billing.trade_licence_name || 'Trade licence'}
        </a>
      )}
    </section>
  )
}

function Field({ k, v, mono, span }: { k: string; v?: string | null; mono?: boolean; span?: boolean }) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <dt className="text-[11.5px] text-muted-foreground">{k}</dt>
      <dd className={cn('text-[13.5px]', mono && 'font-mono', !v && 'text-muted-foreground')}>
        {v || 'not given'}
      </dd>
    </div>
  )
}

/**
 * What we are charging, split the way the payout is split.
 *
 * One creator is one line, because that is how the order was priced and how it will be paid:
 * their fee, our commission on it, the VAT, and what the brand pays for them. An order for
 * six creators showed a single total, which is not something anybody can raise an invoice
 * from without opening the brand's own screen to see the parts.
 */
function MoneySplit({ detail }: { detail: MorOrderDetail }) {
  const { creators, money } = detail
  const many = creators.length > 1
  return (
    <section className="rounded-ds-lg border border-black/[0.08] dark:border-white/[0.1]">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
        <p className="text-ds-label">What we are charging</p>
        <p className="text-[11.5px] text-muted-foreground">
          {creators.length} {creators.length === 1 ? 'creator' : 'creators'}
          {detail.order.vat_rate ? ` · VAT ${Math.round(Number(detail.order.vat_rate) * 100)}%` : ''}
        </p>
      </div>
      <div className="mt-ds-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Creator</TableHead>
              <TableHead className="text-right">Their fee</TableHead>
              <TableHead className="text-right">Our fee</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="pr-4 text-right">Brand pays</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.map(c => (
              <TableRow key={c.id}>
                <TableCell className="pl-4">
                  <span className="text-[13.5px] font-medium">{c.creator_name}</span>
                  {c.creator_handle && (
                    <span className="ml-1.5 text-[11.5px] text-muted-foreground">@{c.creator_handle}</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{aedFromCents(c.creator_fee_cents)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.fee_waived
                    ? <span className="text-muted-foreground">waived</span>
                    : <>
                        {aedFromCents(c.our_fee_cents)}
                        {c.our_fee_pct != null && (
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            {Number(c.our_fee_pct)}%
                          </span>
                        )}
                      </>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{aedFromCents(c.vat_cents)}</TableCell>
                <TableCell className="pr-4 text-right font-medium tabular-nums">
                  {aedFromCents(c.total_cents)}
                </TableCell>
              </TableRow>
            ))}
            {/* Only worth a totals row when there is more than one line to add up. */}
            {many && (
              <TableRow className="border-t-2">
                <TableCell className="pl-4 text-[13.5px] font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {aedFromCents(money.creator_fees_cents)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {aedFromCents(money.our_fee_cents)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {aedFromCents(money.vat_cents)}
                </TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">
                  {aedFromCents(money.total_cents)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* What they actually bought. It lived only on the brand's own screen. */}
      {creators.some(c => (c.deliverables?.length || c.usage_terms || c.posting_dates)) && (
        <div className="space-y-ds-3 border-t border-black/[0.06] px-4 py-ds-3 dark:border-white/[0.08]">
          <p className="text-ds-label">What they ordered</p>
          {creators.map(c => (
            <div key={c.id} className="text-[12.5px] leading-relaxed text-muted-foreground">
              {many && <span className="font-medium text-foreground">{c.creator_name}: </span>}
              {(c.deliverables || []).map(d =>
                `${d.quantity && d.quantity > 1 ? `${d.quantity} × ` : ''}${d.what || ''}`).join('; ')
                || 'nothing written'}
              {c.posting_dates && <> · posting {c.posting_dates}</>}
              {c.usage_terms && <> · usage {c.usage_terms}</>}
              {c.brand_notes && <div className="mt-0.5 italic">“{c.brand_notes}”</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * A file picker that uploads on selection.
 *
 * Both of these used to be "paste a link to the PDF", which quietly requires the operator to
 * go and host a file somewhere first. Nobody does that, so orders sat un-invoiced while the
 * brand watched a screen telling them their invoice was being prepared.
 */
function FilePick({ id, label, name, busy, onPick }: {
  id: string; label: string; name: string; busy: boolean; onPick: (f: File) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input id={id} type="file" accept="application/pdf,image/*" className="sr-only"
             onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
      {/* `asChild` hands the styling to the label, and a label ignores `disabled`, so the
          busy state has to stop the click itself or a second file can be picked mid-upload. */}
      <Button asChild size="sm" variant="outline">
        <label htmlFor={id}
               className={cn('cursor-pointer', busy && 'pointer-events-none opacity-60')}>
          {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <FileText className="mr-1.5 size-3.5" />}
          {label}
        </label>
      </Button>
      {name && (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-[var(--tone-good-ink)]" />{name}
        </span>
      )}
    </div>
  )
}

function CreatorRow({ c }: { c: MorOrderCreator }) {
  const stage = creatorStage(c)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-ds-lg bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.03]">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{c.creator_name}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
          {c.creator_email || 'no email'}
          {c.bank_last4 && ` · ····${c.bank_last4}`}
          {c.signed_name && c.signed_name !== c.creator_name && ` · signed ${c.signed_name}`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn('text-[12.5px] font-medium', stage.tone)}>{stage.label}</div>
        <div className="text-[11.5px] tabular-nums text-muted-foreground">
          {aedFromCents(c.creator_fee_cents)}
        </div>
      </div>
    </div>
  )
}
