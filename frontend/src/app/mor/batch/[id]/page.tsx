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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, CreditCard, Landmark, ShieldCheck } from 'lucide-react'
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
    <div className="mor-scope mx-auto w-full max-w-[1040px] px-5 py-12 sm:px-8 sm:py-16">
      <style>{TOKENS}</style>

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Merchant of Record
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
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
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

          {/* Every creator, with their own state. The point of the page. */}
          <section className="mt-14">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              The creators
            </h2>
            <p className="mt-2.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
              Each one is contracted and paid separately, so they will not all move at the same
              time. Open any of them for the agreement and the payout.
            </p>

            <div className="mt-5 overflow-x-auto rounded-[14px] border border-[var(--mor-rule)]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Creator</TableHead>
                    <TableHead>What they are posting</TableHead>
                    <TableHead>Where it has got to</TableHead>
                    <TableHead className="text-right">Their fee</TableHead>
                    <TableHead className="pr-4 text-right">Cost to you</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.payments.map((p) => <CreatorRow key={p.id} payment={p} />)}
                </TableBody>
              </Table>
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
    <section className="mt-12 rounded-[14px] border border-[var(--mor-rule)] px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="min-w-0">
          <div className="text-[12.5px] text-muted-foreground">{batch.status_label}</div>
          <div className="mt-2 text-[32px] font-semibold leading-none tabular-nums tracking-[-0.025em]">
            {aed(batch.total_aed)}
          </div>
          <div className="mt-4 space-y-1 text-[13px] text-muted-foreground">
            <Split label="Creators' fees" value={aed(batch.creator_fee_aed)} />
            <Split
              label="Our Merchant of Record fee"
              value={batch.our_fee_aed === 0 ? 'Waived' : aed(batch.our_fee_aed)}
              lime={batch.our_fee_aed === 0}
            />
            <Split label={batch.vat_label} value={aed(batch.vat_aed)} />
          </div>
        </div>

        <div className="shrink-0">
          {owed && batch.payment_method === 'card' && (
            <Button onClick={onPay} disabled={paying} className="gap-1.5">
              <CreditCard className="size-4" />
              {paying ? 'Opening…' : `Pay ${aed(batch.total_aed)}`}
            </Button>
          )}
          {owed && batch.payment_method === 'transfer' && (
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
          {batch.status === 'funded' && (
            <div className="max-w-[280px] rounded-[10px] bg-muted/50 px-4 py-3.5">
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                Your payment has cleared. We are paying the creators now, each one separately,
                and the table below moves as they go out.
              </p>
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

function CreatorRow({ payment }: { payment: MorPayment }) {
  const work = payment.deliverables
    .map((d) => (d.quantity > 1 ? `${d.quantity} × ${d.what}` : d.what))
    .join(', ')
  const off = payment.status === 'cancelled'
  return (
    <TableRow className={cn(off && 'opacity-55')}>
      <TableCell className="pl-4">
        <div className="text-[14px] font-medium tracking-[-0.01em]">{payment.creator_name}</div>
        {payment.creator_handle && (
          <div className="mt-0.5 text-[12px] text-muted-foreground">@{payment.creator_handle}</div>
        )}
      </TableCell>
      <TableCell className="text-[13px] text-muted-foreground">{work || '—'}</TableCell>
      <TableCell>
        <span className="flex items-center gap-2 text-[13px]">
          <span className={cn('size-[6px] shrink-0 rounded-full', DOT[payment.status])} aria-hidden />
          {payment.status_label}
        </span>
      </TableCell>
      <TableCell className="text-right text-[13.5px] tabular-nums">
        {aed(payment.creator_fee_aed)}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <div className="text-[13.5px] font-medium tabular-nums">{aed(payment.total_aed)}</div>
        {payment.fee_waived && (
          <span
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
          >
            <ShieldCheck className="size-[11px]" aria-hidden />Fee waived
          </span>
        )}
      </TableCell>
      <TableCell className="pr-3">
        <Link href={`/mor/${payment.id}`} aria-label={`Open ${payment.creator_name}`}
              className="inline-flex rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowRight className="size-4" />
        </Link>
      </TableCell>
    </TableRow>
  )
}
