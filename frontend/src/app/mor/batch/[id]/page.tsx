'use client'

/**
 * One batch: what was instructed, what it cost, and where each creator has got to.
 *
 * Two questions get asked of this page and they are not the same question. "Have I paid yet"
 * is about the batch and has one answer. "Has Sara been paid" is about one creator and has N
 * answers. So the money we are owed sits at the top as a single state, and underneath it the
 * table gives every creator their own line and their own status, because we pay six people
 * through six transfers on six days and pretending otherwise would be a lie told with a tick.
 *
 * A card payment is opened from here and finished on Stripe. Nothing here marks anything
 * funded: only the webhook does, and it fans out from the batch to every creator on it.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowLeft, ArrowUpRight, BadgeCheck, CreditCard, Download, Landmark, ReceiptText, ShieldCheck } from 'lucide-react'
import { morPaymentsApi, aed, type MorBatch, type MorPayment } from '@/services/morPaymentsApi'
import { cn } from '@/lib/utils'

const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
`

export default function MorBatchPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <Detail />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function Detail() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const [batch, setBatch] = useState<MorBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await morPaymentsApi.batches.read(id)
      setBatch(r.data)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) void load() }, [id, load])

  const payByCard = async () => {
    setPaying(true)
    try {
      const origin = window.location.origin
      const r = await morPaymentsApi.batches.checkout(
        id, `${origin}/mor/batch/${id}?paid=1`, `${origin}/mor/batch/${id}`)
      window.location.href = r.data.checkout_url
    } catch (e) {
      toast.error((e as Error).message)
      setPaying(false)
    }
  }

  const cancel = async () => {
    try {
      const r = await morPaymentsApi.batches.cancel(id)
      setBatch(r.data)
      setCancelOpen(false)
      toast.success('Cancelled')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="mor-scope mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <style>{TOKENS}</style>

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Creator Contracting
      </Button>

      {loading ? (
        <div className="mt-8">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
          <Skeleton className="mt-12 h-[160px] w-full rounded-[14px]" />
          <Skeleton className="mt-8 h-[280px] w-full rounded-[14px]" />
        </div>
      ) : !batch ? (
        <p className="mt-8 text-[14.5px] leading-relaxed text-muted-foreground">
          We could not find that list. It may have been cancelled, or it may belong to another
          account.
        </p>
      ) : (
        <>
          <header className="mt-6">
            <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">
              {batch.label || `${batch.creators} creators`}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
              <span className="font-mono">{batch.reference}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {batch.creators} {batch.creators === 1 ? 'creator' : 'creators'}
              </span>
              {batch.waived_count > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{batch.waived_count} fee-free</span>
                </>
              )}
            </p>
          </header>

          <Money batch={batch} paying={paying} onPay={payByCard} />

          {/* Every creator, with their own state. Each is contracted and paid separately,
              so they move at different times; the card says where each one has got to. */}
          <section className="mt-12 space-y-5">
            <h2 className="flex items-baseline gap-2 text-[15px] font-medium">
              The creators
              <span className="text-[13px] font-normal tabular-nums text-muted-foreground">
                {batch.payments.length}
              </span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {batch.payments.map((p) => <CreatorCard key={p.id} payment={p} />)}
            </div>
          </section>

          {(batch.status === 'draft' || batch.status === 'awaiting_payment') && (
            <div className="mt-12 border-t border-[var(--mor-rule)] pt-8">
              <Button variant="ghost" size="sm"
                      className="-ml-2.5 text-muted-foreground hover:text-destructive"
                      onClick={() => setCancelOpen(true)}>
                Cancel this list
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this whole list?</AlertDialogTitle>
            <AlertDialogDescription>
              Every creator on it is called off and nothing is charged. If you only want to
              drop one of them, open that creator and cancel them instead, and the rest carries
              on.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>Cancel the list</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* The one number they owe us, and the one thing to do about it. */
function Money({ batch, paying, onPay }: {
  batch: MorBatch; paying: boolean; onPay: () => void
}) {
  const owed = batch.status === 'awaiting_payment'
  return (
    <section className="mt-10 rounded-2xl border border-black/[0.06] bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:px-9 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="min-w-0">
          <div className="text-[12.5px] text-muted-foreground">{batch.status_label}</div>
          <div className="mt-2 text-[32px] font-semibold leading-none tabular-nums tracking-[-0.025em]">
            {aed(batch.total_aed, batch.currency)}
          </div>
          <div className="mt-4 space-y-1 text-[13px] text-muted-foreground">
            <Split label="Creators' fees" value={aed(batch.creator_fee_aed, batch.currency)} />
            <Split
              label="Our service fee"
              value={batch.our_fee_aed === 0 ? 'Waived' : aed(batch.our_fee_aed, batch.currency)}
              lime={batch.our_fee_aed === 0}
            />
            {batch.vat_aed > 0 && (
              <Split label={batch.vat_label} value={aed(batch.vat_aed, batch.currency)} />
            )}
          </div>
        </div>

        <div className="shrink-0">
          {owed && batch.payment_method === 'card' && (
            <Button onClick={onPay} disabled={paying} className="gap-1.5">
              <CreditCard className="size-4" />
              {paying ? 'Opening…' : `Pay ${aed(batch.total_aed, batch.currency)}`}
            </Button>
          )}
          {owed && batch.payment_method === 'transfer' && !batch.invoice_url && (
            <div className="max-w-[280px] rounded-[10px] bg-muted/50 px-4 py-3.5">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Landmark className="size-4 text-muted-foreground" aria-hidden />
                Invoice on its way
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                One invoice for the whole list. We start the moment it clears.
              </p>
            </div>
          )}
          {/* The list is billed ONCE, so its paperwork is the list's: one invoice, one
              receipt. A creator's own page points back here rather than offering its own. */}
          {(batch.invoice_url || batch.receipt_url) && (
            <div className="flex flex-col gap-2.5">
              {batch.invoice_url && (
                <a href={batch.invoice_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 rounded-xl border border-black/[0.08] px-4 py-3 transition
                              hover:border-black/20 dark:border-white/[0.12]">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#d3ff02] text-[#111]">
                    <ReceiptText className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium">Invoice{batch.invoice_number ? ` ${batch.invoice_number}` : ''}</span>
                    <span className="block text-[12.5px] text-muted-foreground">Whole list</span>
                  </span>
                  <Download className="ml-6 size-4 text-muted-foreground" />
                </a>
              )}
              {batch.receipt_url && (
                <a href={batch.receipt_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 rounded-xl border border-black/[0.08] px-4 py-3 transition
                              hover:border-black/20 dark:border-white/[0.12]">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="text-[14px] font-medium">Receipt</span>
                  <Download className="ml-auto size-4 text-muted-foreground" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Split({ label, value, lime }: { label: string; value: string; lime?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-8">
      <span>{label}</span>
      {lime ? (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
        >
          <ShieldCheck className="size-3" aria-hidden />{value}
        </span>
      ) : (
        <span className="tabular-nums text-foreground">{value}</span>
      )}
    </div>
  )
}

const DOT: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  awaiting_payment: 'bg-amber-500',
  funded: 'bg-sky-500',
  paid: 'bg-emerald-600',
  cancelled: 'bg-muted-foreground/40',
}

const initials = (name: string | null | undefined) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/* One creator on the list: who, where they have got to, what they get and what it costs you.
   Opens the creator for their agreement and payout; the invoice is the list's, above. */
function CreatorCard({ payment }: { payment: MorPayment }) {
  const work = payment.deliverables
    .map((d) => (d.quantity > 1 ? `${d.quantity} × ${d.what}` : d.what))
    .join(', ')
  const off = payment.status === 'cancelled'
  return (
    <Link
      href={`/mor/${payment.id}`}
      className={cn(
        'group flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6',
        'shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition duration-200 hover:-translate-y-0.5',
        'hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)] dark:border-white/[0.08] dark:bg-white/[0.03]',
        off && 'opacity-55',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-[14px] font-medium">
          {initials(payment.creator_name)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn('size-1.5 shrink-0 rounded-full', DOT[payment.status])} aria-hidden />
          <span className="truncate">{payment.status_label}</span>
        </span>
      </div>
      <p className="mt-8 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
        {aed(payment.total_aed, payment.currency)}
      </p>
      <h3 className="mt-2 truncate text-[15px]" title={work || undefined}>{payment.creator_name}</h3>
      <div className="mt-auto flex items-center justify-between pt-8">
        <span className="truncate text-[13px] text-muted-foreground">
          {payment.creator_handle ? `@${payment.creator_handle}` : `Fee ${aed(payment.creator_fee_aed, payment.currency)}`}
        </span>
        {payment.fee_waived ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}>
            <ShieldCheck className="size-3" aria-hidden />Fee waived
          </span>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full border border-black/[0.08] text-foreground/70
                           transition group-hover:border-black/20 dark:border-white/[0.12]">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
    </Link>
  )
}
