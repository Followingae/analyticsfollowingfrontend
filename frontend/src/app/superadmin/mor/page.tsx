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
import { useRouter } from 'next/navigation'
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
import { PageHead, Panel, Stat } from '@/components/console/primitives'
import { toast } from 'sonner'
import {
  AlertTriangle, Banknote, CheckCircle2, FileText, Loader2, Receipt, RefreshCw, Users, Wallet,
} from 'lucide-react'
import {
  morOpsApi, aedFromCents,
  type MorOpsOverview, type MorOrder,
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
  /* An order opens as its own page now. It was a slide-over, and 640px of column had no room
     for the thing that mattered most: whether our email had actually reached the creator. */
  const router = useRouter()
  const openOrder = (o: MorOrder) => router.push(`/work/mor/${o.kind}/${o.id}`)

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
        title="Creator Contracting"
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
              <OrderTable orders={waiting.invoice} onOpen={openOrder} />
            </Panel>
          )}

          {waiting.transfer.length > 0 && (
            <Panel title={`${waiting.transfer.length} waiting on their transfer`}
                   description="Invoiced. Watch the bank, then mark it in. Any already started early are marked, and their creators are contracted but cannot be paid."
                   flush>
              <OrderTable orders={waiting.transfer} onOpen={openOrder} />
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
            <OrderTable orders={data.orders} onOpen={openOrder} showStatus />
          </Panel>
        </>
      ) : null}

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
