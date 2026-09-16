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
  type MorOpsOverview, type MorOrder, type MorOrderCreator, type OrderKind,
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
                   description="Invoiced. Watch the bank, then mark it in and the creators get their links."
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
                <div className="font-medium">{o.label || o.reference}</div>
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
  const [creators, setCreators] = useState<MorOrderCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [invNo, setInvNo] = useState(order.invoice_number || '')
  const [invUrl, setInvUrl] = useState('')
  const [rcptUrl, setRcptUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await morOpsApi.creators(order.kind as OrderKind, order.id)
      setCreators(r.data.creators)
    } catch (e) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }, [order])

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
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle className="pr-6">{order.label || order.reference}</SheetTitle>
          <SheetDescription>
            {order.client} · {order.creators} {order.creators === 1 ? 'creator' : 'creators'} ·{' '}
            {aedFromCents(order.total_cents)} · our fee {aedFromCents(order.our_fee_cents)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-ds-4 px-4 pb-10">
          {/* The two actions, in the order they happen. */}
          {!order.invoice_attached_at && (
            <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
              <p className="text-ds-label">Attach the invoice</p>
              <p className="mt-1 text-ds-body-sm text-muted-foreground">
                Raise it in QuickBooks, then put the number and the PDF here. They are told the
                moment you do.
              </p>
              <div className="mt-ds-3 space-y-2">
                <Input value={invNo} onChange={e => setInvNo(e.target.value)}
                       placeholder="Invoice number, e.g. INV-1042" />
                <Input value={invUrl} onChange={e => setInvUrl(e.target.value)}
                       placeholder="Link to the PDF" />
                <Button size="sm" onClick={attach} disabled={busy || !invNo.trim() || !invUrl.trim()}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}Attach and send
                </Button>
              </div>
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
                <Input value={rcptUrl} onChange={e => setRcptUrl(e.target.value)}
                       placeholder="Link to the bank receipt" />
                <Button size="sm" onClick={received} disabled={busy || !rcptUrl.trim()}>
                  {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Money is in, invite the creators
                </Button>
              </div>
            </section>
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
