'use client'

/**
 * One merchant of record order, as a page.
 *
 * WHY A PAGE AND NOT THE SLIDE-OVER IT REPLACES. An order is where the money, the paperwork
 * and four or five people's state all meet, and a panel 640px wide forced that into a column
 * with no room for any of it. The thing it left out was the one that mattered: whether the
 * creator had actually been emailed, whether it bounced, whether they had opened it. An
 * agreement went out for AED 22,000 with a blank deliverables line and there was no screen
 * anywhere that would have shown it.
 *
 * THE ORDER OF THE PAGE IS THE ORDER OF THE JOB. Where it has got to, then who we invoice,
 * then what we are charging, then the thing to do next, then each creator in detail. An
 * operator opening this mid-morning reads the top third and knows whether to act.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PageHead, Panel } from '@/components/console/primitives'
import { toast } from 'sonner'
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, Download, FileSignature, FileText,
  Loader2, Mail, MessageCircle, Receipt, RefreshCw, Send,
} from 'lucide-react'
import {
  morOpsApi, aedFromCents,
  type MorBilling, type MorOrderCreator, type MorOrderDetail, type MorPayable, type OrderKind,
} from '@/services/morOpsApi'
import { enrolmentApi } from '@/services/enrolmentApi'
import { cn } from '@/lib/utils'

const when = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function MorOrderPage() {
  return <SuperadminLayout><Order /></SuperadminLayout>
}

function Order() {
  const params = useParams()
  const kind = String(params?.kind || 'payment') as OrderKind
  const id = String(params?.id || '')

  const [data, setData] = useState<MorOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailure(null)
    try { setData((await morOpsApi.detail(kind, id)).data) }
    catch (e) { setFailure((e as Error).message) }
    finally { setLoading(false) }
  }, [kind, id])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-ds-4 p-ds-3 md:p-ds-4">
        {[0, 1, 2].map(n => <Skeleton key={n} className="h-32 w-full rounded-ds-lg" />)}
      </div>
    )
  }

  if (failure || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-ds-3 md:p-ds-4">
        <div className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-semibold text-destructive">This did not load</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Not an empty order, a failed request. {failure}
          </p>
        </div>
      </div>
    )
  }

  const o = data.order

  return (
    <div className="mx-auto w-full max-w-5xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/work/mor"><ArrowLeft className="mr-1.5 size-4" />Merchant of Record</Link>
      </Button>

      <PageHead
        title={o.label || o.reference || 'Order'}
        sub={`${o.client || 'Unknown client'} · ${data.creators.length} ${data.creators.length === 1 ? 'creator' : 'creators'} · ${aedFromCents(data.money.total_cents)}`}
        action={
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load() }}>
            <RefreshCw className="mr-2 size-4" />Refresh
          </Button>
        }
      />

      <Progress detail={data} />
      <InvoiceTo billing={data.billing} />
      <MoneySplit detail={data} />
      <Actions detail={data} onChange={load} />

      <Panel title="The creators" description="Where each of them has got to, and whether our email actually reached them." flush>
        <div className="divide-y">
          {data.creators.map(c => (
            <CreatorCard key={c.id} c={c} onChange={load} />
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ── where it has got to ───────────────────────────────────────────────────────────── */

/**
 * The order's own timeline, which is not the same as any creator's.
 *
 * Started early sits between invoiced and paid deliberately: it is the state where the
 * creators are working and we are holding nothing, and it should read as a thing that
 * happened rather than as progress towards being paid.
 */
function Progress({ detail }: { detail: MorOrderDetail }) {
  const o = detail.order
  const paid = detail.creators.filter(c => c.status === 'paid').length
  const steps = [
    { label: 'Ordered', at: o.submitted_at, note: `${detail.creators.length} booked` },
    { label: 'Invoiced', at: o.invoice_attached_at, note: o.invoice_number || 'not raised yet' },
    ...(o.advance_released_at ? [{
      label: 'Started early', at: o.advance_released_at,
      note: 'creators contracted on the brand’s word',
    }] : []),
    { label: 'Money in', at: o.receipt_attached_at, note: o.receipt_attached_at ? 'receipt on file' : 'watching the bank' },
    {
      label: 'Creators paid', at: paid === detail.creators.length && paid > 0 ? 'done' : null,
      note: `${paid} of ${detail.creators.length}`,
    },
  ]
  return (
    <ol className="flex flex-wrap gap-ds-3 rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
      {steps.map(s => {
        const done = !!s.at
        return (
          <li key={s.label} className="flex min-w-[150px] flex-1 items-start gap-2.5">
            <span className={cn(
              'mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-full border',
              done ? 'border-transparent bg-foreground text-background' : 'border-black/[0.15] dark:border-white/[0.2]',
            )}>
              {done && <Check className="size-3" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{s.label}</span>
              <span className="block text-[11.5px] text-muted-foreground">
                {typeof s.at === 'string' && s.at !== 'done' ? when(s.at) || s.note : s.note}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ── who we invoice ───────────────────────────────────────────────────────────────── */

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
      {incomplete && (
        <p className="mt-1 text-ds-body-sm">
          They have not given us {billing.missing.map(k => label[k] || k).join(', ')}. Ask them
          to finish their billing details before this is invoiced.
        </p>
      )}
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
      <dd className={cn('whitespace-pre-line text-[13.5px]', mono && 'font-mono', !v && 'text-muted-foreground')}>
        {v || 'not given'}
      </dd>
    </div>
  )
}

/* ── the money ────────────────────────────────────────────────────────────────────── */

function MoneySplit({ detail }: { detail: MorOrderDetail }) {
  const { creators, money } = detail
  const many = creators.length > 1
  return (
    <section className="rounded-ds-lg border border-black/[0.08] dark:border-white/[0.1]">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
        <p className="text-ds-label">What we are charging</p>
        <p className="text-[11.5px] text-muted-foreground">
          {detail.order.vat_rate ? `VAT ${Math.round(Number(detail.order.vat_rate) * 100)}%` : ''}
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
                          <span className="ml-1 text-[11px] text-muted-foreground">{Number(c.our_fee_pct)}%</span>
                        )}
                      </>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{aedFromCents(c.vat_cents)}</TableCell>
                <TableCell className="pr-4 text-right font-medium tabular-nums">
                  {aedFromCents(c.total_cents)}
                </TableCell>
              </TableRow>
            ))}
            {many && (
              <TableRow className="border-t-2">
                <TableCell className="pl-4 text-[13.5px] font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{aedFromCents(money.creator_fees_cents)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{aedFromCents(money.our_fee_cents)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{aedFromCents(money.vat_cents)}</TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">{aedFromCents(money.total_cents)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

/* ── the thing to do next ─────────────────────────────────────────────────────────── */

function Actions({ detail, onChange }: { detail: MorOrderDetail; onChange: () => void }) {
  const o = detail.order
  const kind = o.kind as OrderKind
  const [invNo, setInvNo] = useState(o.invoice_number || '')
  const [invUrl, setInvUrl] = useState('')
  const [invName, setInvName] = useState('')
  const [rcptUrl, setRcptUrl] = useState('')
  const [rcptName, setRcptName] = useState('')
  const [advUrl, setAdvUrl] = useState('')
  const [advName, setAdvName] = useState('')
  const [advNote, setAdvNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)

  const pick = (
    fn: (k: OrderKind, i: string, f: File) => Promise<{ data: { url: string; name: string } }>,
    setUrl: (v: string) => void, setName: (v: string) => void,
  ) => async (file: File) => {
    setUploading(true)
    try {
      const r = await fn(kind, o.id, file)
      setUrl(r.data.url); setName(r.data.name)
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const run = (fn: () => Promise<unknown>, ok: string, note?: string) => async () => {
    setBusy(true)
    try { await fn(); toast.success(ok, note ? { description: note } : undefined); onChange() }
    catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-ds-3">
      {!o.invoice_attached_at && (
        <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
          <p className="text-ds-label">Attach the invoice</p>
          <p className="mt-1 text-ds-body-sm text-muted-foreground">
            Raise it in QuickBooks off the figures above, then put the number and the PDF here.
            They are told the moment you do.
          </p>
          <div className="mt-ds-3 space-y-2">
            <Input value={invNo} onChange={e => setInvNo(e.target.value)}
                   placeholder="Invoice number, e.g. INV-1042" />
            <FilePick id="inv" label="Choose the invoice PDF" name={invName} busy={uploading}
                      onPick={pick(morOpsApi.uploadInvoiceFile, setInvUrl, setInvName)} />
            <Button size="sm" disabled={busy || uploading || !invNo.trim() || !invUrl}
                    onClick={run(() => morOpsApi.attachInvoice(kind, o.id, invNo, invUrl),
                                 'Invoice attached and emailed to them')}>
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}Attach and send
            </Button>
          </div>
        </section>
      )}

      {!o.receipt_attached_at && !o.advance_released_at && (
        <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
          <p className="text-ds-label">Start without the money</p>
          <p className="mt-1 text-ds-body-sm text-muted-foreground">
            For when the brand says the transfer is a day or two away. The creators get their
            links now. The order stays owed to us, and nothing can be paid out until you mark
            the transfer in.
          </p>
          <div className="mt-ds-3 space-y-2">
            <FilePick id="adv" label="What the brand sent you" name={advName} busy={uploading}
                      onPick={pick(morOpsApi.uploadAdvanceProof, setAdvUrl, setAdvName)} />
            <Input value={advNote} onChange={e => setAdvNote(e.target.value)}
                   placeholder="Who told you, and when they said it will land" />
            <Button size="sm" variant="outline" disabled={busy || uploading || !advUrl}
                    onClick={run(() => morOpsApi.releaseEarly(kind, o.id, advUrl, advNote),
                                 'The creators have their links',
                                 'The order still shows as owed until you mark the transfer in.')}>
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Send the creators their links now
            </Button>
          </div>
        </section>
      )}

      {o.advance_released_at && !o.receipt_attached_at && (
        <section className="rounded-ds-lg border border-[var(--tone-warn-line)] bg-[var(--tone-warn-bg)] p-4">
          <p className="text-ds-label">Started early, money still owed</p>
          <p className="mt-1 text-ds-body-sm">
            The creators have their links. {aedFromCents(detail.money.total_cents)} has not
            reached us, and nobody on this order can be paid until it does.
            {o.advance_note ? ` “${o.advance_note}”` : ''}
          </p>
          {o.advance_proof_url && (
            <a href={o.advance_proof_url} target="_blank" rel="noreferrer"
               className="mt-ds-2 inline-flex items-center gap-1.5 text-[12.5px] underline underline-offset-2">
              <FileText className="size-3.5" />What the brand sent
            </a>
          )}
        </section>
      )}

      {o.invoice_attached_at && !o.receipt_attached_at && (
        <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
          <p className="text-ds-label">Mark the transfer received</p>
          <p className="mt-1 text-ds-body-sm text-muted-foreground">
            Attaching the receipt is what marks it received. There is no undo.
          </p>
          <div className="mt-ds-3 space-y-2">
            <FilePick id="rcpt" label="Choose the bank receipt" name={rcptName} busy={uploading}
                      onPick={pick(morOpsApi.uploadReceiptFile, setRcptUrl, setRcptName)} />
            <Button size="sm" disabled={busy || uploading || !rcptUrl}
                    onClick={run(() => morOpsApi.markReceived(kind, o.id, rcptUrl),
                                 'Marked received')}>
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Money is in
            </Button>
          </div>
        </section>
      )}

      {o.receipt_attached_at && <PayoutRun kind={kind} id={o.id} reference={o.reference} onChange={onChange} />}

      {/* The order's own files. Once attached they vanished from this screen: the upload
          section is replaced by the next step, so nobody could re-read the invoice they
          raised or the receipt they filed. */}
      {(o.invoice_file_url || o.receipt_file_url || o.advance_proof_url) && (
        <section className="rounded-ds-lg border border-black/[0.08] p-4 dark:border-white/[0.1]">
          <p className="text-ds-label">On file</p>
          <div className="mt-ds-2 flex flex-wrap gap-2">
            {o.invoice_file_url && (
              <DocLink href={o.invoice_file_url} icon={FileText}
                       label={o.invoice_number ? `Invoice ${o.invoice_number}` : 'Invoice'} />
            )}
            {o.receipt_file_url && (
              <DocLink href={o.receipt_file_url} icon={Receipt} label="Bank receipt" />
            )}
            {o.advance_proof_url && (
              <DocLink href={o.advance_proof_url} icon={FileText} label="What the brand sent" />
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function DocLink({ href, icon: Icon, label }: {
  href: string; icon: typeof FileText; label: string
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
       className="inline-flex items-center gap-1.5 rounded-ds-lg border border-black/[0.08] px-3 py-1.5 text-[12.5px] hover:bg-black/[0.03] dark:border-white/[0.1] dark:hover:bg-white/[0.04]">
      <Icon className="size-3.5" />{label}
    </a>
  )
}

function FilePick({ id, label, name, busy, onPick }: {
  id: string; label: string; name: string; busy: boolean; onPick: (f: File) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input id={`mor-file-${id}`} type="file" accept="application/pdf,image/*" className="sr-only"
             onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
      <Button asChild size="sm" variant="outline">
        <label htmlFor={`mor-file-${id}`}
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

/* ── the payout run ───────────────────────────────────────────────────────────────── */

function PayoutRun({ kind, id, reference, onChange }: {
  kind: OrderKind; id: string; reference: string | null; onChange: () => void
}) {
  const [rows, setRows] = useState<MorPayable['creators']>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await morOpsApi.payable(kind, id)
      setRows(r.data.creators); setTotal(r.data.total_cents)
    } catch { /* the page already says what is wrong */ }
    finally { setLoading(false) }
  }, [kind, id])

  useEffect(() => { void load() }, [load])

  if (loading) return <Skeleton className="h-24 w-full rounded-ds-lg" />
  if (!rows.length) return null

  const pay = async () => {
    setBusy(true)
    try {
      const r = await morOpsApi.markPaidTogether(kind, id, {
        payment_ids: rows.map(x => x.id), payment_reference: ref.trim(),
      })
      if (r.data.skipped.length) {
        toast.warning(`${r.data.paid} paid, ${r.data.skipped.length} skipped`, {
          description: r.data.skipped.map(x => x.why).join(' '), duration: 12000,
        })
      } else {
        toast.success(`${r.data.paid} paid`)
      }
      setOpen(false); onChange(); void load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <section className="rounded-ds-lg border border-[var(--tone-info-line)] bg-[var(--tone-info-bg)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-ds-label">{rows.length} ready to be paid</p>
          <p className="mt-1 text-ds-body-sm text-muted-foreground">
            {aedFromCents(total)} in total. One visit to the bank, one reference back.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"
                  onClick={() => morOpsApi.payoutFile(kind, id, `mor-payouts-${reference || id.slice(0, 8)}.xlsx`)
                    .catch(e => toast.error((e as Error).message))}>
            <Download className="mr-1.5 size-3.5" />Payout file
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>Mark them paid</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {rows.length} paid</DialogTitle>
            <DialogDescription>
              Do this after the transfers have left the bank. {aedFromCents(total)} to{' '}
              {rows.length} {rows.length === 1 ? 'creator' : 'creators'}. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="mor-run-ref">Bank reference</Label>
            <Input id="mor-run-ref" value={ref} onChange={e => setRef(e.target.value)}
                   placeholder="The reference on the transfer" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={pay} disabled={busy || !ref.trim()}>
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}Mark {rows.length} paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ── one creator ──────────────────────────────────────────────────────────────────── */

/**
 * Everything about one creator, including whether our email reached them.
 *
 * THE EMAIL LINE IS THE POINT OF THIS CARD. Every other screen in the module could tell you
 * a creator had not signed and none of them could tell you why: an invite that bounced and
 * one that was ignored looked identical. Sent, failed with the reason, opened, and a resend
 * that takes a corrected address.
 */
function CreatorCard({ c, onChange }: { c: MorOrderCreator; onChange: () => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const stage = creatorStage(c)

  const resend = async () => {
    setBusy(true)
    try {
      const r = await morOpsApi.resendInvite(c.id, email.trim() || undefined)
      /* Both channels are attempted and the toast says which actually went, because "sent"
         over a WhatsApp that silently failed is the message that wastes a week. */
      const went = [r.data.sent && 'email', r.data.whatsapp && 'WhatsApp'].filter(Boolean)
      toast.success(went.length ? `Sent by ${went.join(' and ')}` : 'Nothing sent',
                    { description: `${r.data.to}` })
      setEmail(''); onChange()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  const copy = async () => {
    if (!c.token) return
    try {
      await navigator.clipboard.writeText(`https://platform.following.ae/e/${c.token}`)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('Could not copy it.') }
  }

  const steps: { label: string; at?: string | null; bad?: boolean }[] = [
    { label: 'Invited', at: c.invite_sent_at },
    { label: 'Opened', at: c.first_opened_at },
    { label: 'Signed', at: c.signed_at },
    { label: 'Bank details in', at: c.bank_at },
    { label: 'Paid', at: c.creator_paid_at },
  ]

  return (
    <div className="space-y-ds-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium">
            {c.creator_name}
            {c.creator_handle && (
              <span className="ml-1.5 text-[12px] text-muted-foreground">@{c.creator_handle}</span>
            )}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {aedFromCents(c.creator_fee_cents)}
            {c.signed_name && c.signed_name !== c.creator_name && ` · signed as ${c.signed_name}`}
            {c.bank_last4 && ` · ····${c.bank_last4}`}
          </p>
        </div>
        <Badge variant="secondary" className={cn('border-0 text-[11px]', stage.tone)}>
          {stage.label}
        </Badge>
      </div>

      {/* How we have tried to reach them. Both channels, because an address that bounces and
          a number that delivers are different facts and only one of them is a problem. */}
      <div className={cn(
        'rounded-ds-lg border p-3',
        c.invite_failed_reason && c.whatsapp_failed_reason
          ? 'border-[var(--tone-bad-line)] bg-[var(--tone-bad-bg)]'
          : 'border-black/[0.06] dark:border-white/[0.08]',
      )}>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{c.invite_email || c.creator_email || 'no address'}</span>
          <span className={cn(c.invite_failed_reason ? 'text-[var(--tone-bad-ink)]' : 'text-muted-foreground')}>
            {c.invite_failed_reason
              ? `· did not send: ${c.invite_failed_reason}`
              : c.invite_sent_at
                ? `· sent ${when(c.invite_sent_at)}`
                : '· not sent yet'}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
          <MessageCircle className="size-3.5 shrink-0 text-muted-foreground" />
          {/* The number we messaged, falling back to the one on the order. `invite_whatsapp`
              is only written once a message has gone, so reading it alone said "no WhatsApp
              number" about a creator whose number we were holding all along. */}
          <span className="font-medium">
            {c.invite_whatsapp || c.creator_whatsapp || 'no WhatsApp number'}
          </span>
          <span className={cn(c.whatsapp_failed_reason ? 'text-[var(--tone-bad-ink)]' : 'text-muted-foreground')}>
            {c.whatsapp_failed_reason
              ? `· did not send: ${c.whatsapp_failed_reason}`
              : c.whatsapp_sent_at
                /* Twilio's own verdict where we have it. "Sent" only means they accepted it,
                   "delivered" means the phone has it, "read" means they opened it. */
                ? `· ${c.whatsapp_status || 'sent'} ${when(c.whatsapp_sent_at)}`
                : '· not sent yet'}
          </span>
        </div>
        <div className="mt-ds-2 flex flex-wrap items-center gap-2">
          <Input value={email} onChange={e => setEmail(e.target.value)}
                 placeholder="Send to a different address (optional)"
                 className="h-8 w-full max-w-[280px] text-[12.5px]" />
          <Button size="sm" variant="outline" className="h-8" onClick={resend} disabled={busy}>
            {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Send className="mr-1.5 size-3.5" />}
            Resend
          </Button>
          {c.token && (
            <Button size="sm" variant="ghost" className="h-8" onClick={copy}>
              {copied ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
              {copied ? 'Copied' : 'Copy their link'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {steps.map(s => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[12px]">
            <span className={cn(
              'size-[7px] rounded-full',
              s.at ? 'bg-[var(--tone-good-ink)]' : 'bg-black/[0.15] dark:bg-white/[0.2]',
            )} />
            <span className={s.at ? '' : 'text-muted-foreground'}>{s.label}</span>
            {s.at && <span className="text-muted-foreground">{when(s.at)}</span>}
          </span>
        ))}
      </div>

      {/* What they typed in. All of it was captured and none of it was on this screen, so
          answering "what did they actually give us" meant opening a second one. */}
      {(c.details_at || c.bank_at || c.signed_at) && (
        <dl className="grid gap-x-8 gap-y-2 rounded-ds-lg bg-black/[0.02] p-3 dark:bg-white/[0.03] sm:grid-cols-2">
          <Entered k="Name they gave" v={c.signed_name} />
          <Entered k="Instagram" v={c.verified_handle ? `@${c.verified_handle}` : null} />
          <Entered k="Email (verified)" v={c.verified_email} />
          <Entered k="Mobile" v={c.verified_mobile} />
          <Entered k="Date of birth" v={c.date_of_birth} />
          <Entered k="Signed as" v={c.signature_name} />
          <Entered k="Account holder" v={c.bank_holder} />
          {/* The number you actually type into the bank, with a copy button, because
              retyping an IBAN by hand is how a transfer goes to the wrong account. */}
          {c.bank_iban && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] text-muted-foreground">IBAN</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-[13px] tracking-[0.02em]">{c.bank_iban}</span>
                <CopyIban value={c.bank_iban} />
              </dd>
            </div>
          )}
          <Entered k="SWIFT" v={c.bank_swift} />
          <Entered k="Bank country" v={c.bank_country} />
          {(c.address_line || c.address_city) && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] text-muted-foreground">Delivery address</dt>
              <dd className="text-[13px]">
                {[c.address_line, c.address_city, c.address_country].filter(Boolean).join(', ')}
                {c.address_phone && <span className="text-muted-foreground"> · {c.address_phone}</span>}
                {c.address_maps_url && (
                  <a href={c.address_maps_url} target="_blank" rel="noreferrer"
                     className="ml-1.5 underline underline-offset-2">map</a>
                )}
              </dd>
            </div>
          )}
          {c.bank_rejected_reason && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] text-muted-foreground">Bank details rejected</dt>
              <dd className="text-[13px] text-[var(--tone-bad-ink)]">{c.bank_rejected_reason}</dd>
            </div>
          )}
          {c.signed_at && (
            <div className="sm:col-span-2 text-[11.5px] text-muted-foreground">
              Confirmed they read it{c.agreed_electronic ? ', agreed to sign electronically' : ''}
              {c.agreed_age ? ', and that they are 18 or older' : ''}
              {c.sign_ip ? ` · from ${c.sign_ip}` : ''}
              {c.agreement_sha256 ? ` · ${c.agreement_sha256.slice(0, 12)}` : ''}
            </div>
          )}
        </dl>
      )}

      {/* Their paperwork. The agreement is the document the whole order hangs on and it was
          downloadable from the enrolments screen only. */}
      {c.link_id && c.signed_at && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="h-8"
                  onClick={() => enrolmentApi.agreementPdf(c.link_id as string)
                    .catch(e => toast.error((e as Error).message))}>
            <FileSignature className="mr-1.5 size-3.5" />Signed agreement
          </Button>
          <Button size="sm" variant="outline" className="h-8"
                  onClick={() => enrolmentApi.recordPdf(c.link_id as string)
                    .catch(e => toast.error((e as Error).message))}>
            <FileText className="mr-1.5 size-3.5" />Record pack
          </Button>
          <Button size="sm" variant="ghost" className="h-8" asChild>
            <Link href={`/work/enrolments/${c.link_id}`}>Open the enrolment</Link>
          </Button>
        </div>
      )}

      {c.name_check === 'mismatch' && (
        <div className="flex items-start gap-2 rounded-ds-lg border border-[var(--tone-warn-line)] bg-[var(--tone-warn-bg)] p-3 text-[12.5px]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            They signed as <b>{c.signed_name}</b>, not {c.creator_name}. Nobody is paid until
            somebody here settles it, on the board above.
          </span>
        </div>
      )}
    </div>
  )
}

function CopyIban({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button size="sm" variant="ghost" className="h-6 px-1.5"
            aria-label="Copy the IBAN"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value.replace(/\s+/g, ''))
                setDone(true); setTimeout(() => setDone(false), 2000)
              } catch { toast.error('Could not copy it.') }
            }}>
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

/** One thing the creator typed, skipped entirely when they have not given it. */
function Entered({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{k}</dt>
      <dd className="text-[13px]">{v}</dd>
    </div>
  )
}

function creatorStage(c: MorOrderCreator): { label: string; tone: string } {
  if (c.reported_at) return { label: 'Says it is not them', tone: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]' }
  if (c.status === 'paid') return { label: 'Paid', tone: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' }
  if (c.name_check === 'rejected') return { label: 'Signature rejected', tone: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]' }
  if (c.name_check === 'mismatch') return { label: 'Name does not match', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' }
  if (c.bank_at) return { label: 'Ready to pay', tone: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' }
  if (c.signed_at) return { label: 'Signed, waiting on bank details', tone: '' }
  if (c.first_opened_at) return { label: 'Opened the link', tone: '' }
  if (c.invite_failed_reason) return { label: 'We could not reach them', tone: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]' }
  if (c.invite_sent_at) return { label: 'Invited', tone: '' }
  return { label: 'Not invited yet', tone: '' }
}
