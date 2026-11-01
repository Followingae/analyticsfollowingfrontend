'use client'

/**
 * Creator Contracting — the one screen.
 *
 * A brand arrives here having already agreed terms with a creator, and wants us to contract
 * that creator and pay them. Two things are asked of this page: start a payment, and check
 * whether one has gone out. Both should be readable without reading.
 *
 * November 2026: rows of sentences became cards (who, where it has got to, how much, the
 * invoice), and the list became date-wise. The last 30 days by default, and anything still
 * open whatever its date, because a period is a way to tidy away finished work, never a way
 * to lose sight of a payment that is still moving. A batch is one card with one invoice: the
 * brand gave one instruction and settles once.
 *
 * Somebody who does not hold the module gets the offer instead. `GET /overview` is gated and
 * would 403 at them, so the ungated offer call decides which of the two this is.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowRight, ArrowUpRight, Download, Plus, ShieldCheck, Users, Wallet } from 'lucide-react'
import { morApi, type MorOffer } from '@/services/morApi'
import {
  morPaymentsApi, aed,
  type MorOverview, type MorPayment, type MorBatch, type FeeFreeState,
  type MorSummaryBucket,
} from '@/services/morPaymentsApi'
import { cn } from '@/lib/utils'

export default function MorPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <MorContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

/* The page's own tokens. Lime is light enough that anything on it has to be near-black. */
const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
`

function MorContent() {
  const router = useRouter()
  const [offer, setOffer] = useState<MorOffer | null>(null)
  const [data, setData] = useState<MorOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const o = await morApi.offer()
      setOffer(o.data)
      if (o.data.active) {
        const r = await morPaymentsApi.overview()
        setData(r.data)
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="mor-scope mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <style>{TOKENS}</style>
      {loading ? <LoadingShape /> : offer?.active ? (
        <Live
          data={data}
          onGo={() => router.push('/mor/new')}
          onGoMany={() => router.push('/mor/batch/new')}
        />
      ) : (
        <Offer offer={offer} />
      )}
    </div>
  )
}

/* Loading: the shape of the answer, not a spinner. */
function LoadingShape() {
  return (
    <div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <Skeleton className="mt-10 h-[120px] w-full rounded-2xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((n) => <Skeleton key={n} className="h-[240px] rounded-2xl" />)}
      </div>
    </div>
  )
}

type Period = '30' | '90' | 'year' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: '90 days' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
]

/* Open means somebody still has something to do: us, the brand, or the creator. */
const OPEN = new Set(['draft', 'awaiting_payment', 'funded', 'submitted'])

function since(period: Period): number {
  const now = new Date()
  if (period === 'all') return 0
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).getTime()
  return now.getTime() - Number(period) * 86_400_000
}

type Entry =
  | { kind: 'batch'; at: string; batch: MorBatch }
  | { kind: 'one'; at: string; payment: MorPayment }

function Live({ data, onGo, onGoMany }: {
  data: MorOverview | null; onGo: () => void; onGoMany: () => void
}) {
  const [period, setPeriod] = useState<Period>('30')

  if (!data) {
    return (
      <p className="text-[14.5px] leading-relaxed text-muted-foreground">
        We could not load your creator payments just now. Reload the page, and if it keeps
        happening tell us and we will look.
      </p>
    )
  }

  const { summary, payments } = data
  const batches = data.batches ?? []
  const free = summary.fee_free

  /* A batch is ONE entry carrying its creators, not N entries that happen to share a date. */
  const entries: Entry[] = [
    ...batches.map((b) => ({ kind: 'batch' as const, at: b.created_at ?? '', batch: b })),
    ...payments
      .filter((p) => !p.batch_id)
      .map((p) => ({ kind: 'one' as const, at: p.created_at ?? '', payment: p })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

  const status = (e: Entry) => (e.kind === 'batch' ? e.batch.status : e.payment.status)
  const from = since(period)
  const open = entries.filter((e) => OPEN.has(status(e)))
  const done = entries.filter((e) => !OPEN.has(status(e)) && new Date(e.at).getTime() >= from)
  const older = entries.filter((e) => !OPEN.has(status(e)) && new Date(e.at).getTime() < from).length

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 space-y-2">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em]">
            Creator Contracting
          </h1>
          <p className="text-[15px] text-muted-foreground">
            We contract your creators, you pay us once, we pay them.
          </p>
          {free.remaining > 0 && <FeeFreeBadge free={free} />}
        </div>
        {/* Two ways in, because they are genuinely different jobs. */}
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Button variant="outline" onClick={onGoMany} className="gap-1.5 rounded-full">
            <Users className="size-4" />Pay several
          </Button>
          <Button onClick={onGo} className="gap-1.5 rounded-full">
            <Plus className="size-4" />Pay a creator
          </Button>
        </div>
      </header>

      {payments.length > 0 && (
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06]
                        sm:grid-cols-3 dark:border-white/[0.08] dark:bg-white/[0.08]">
          <Figure label="Waiting on you" bucket={summary.awaiting_payment} />
          <Figure label="Paying the creators" bucket={summary.paying_creator} />
          <Figure label="Paid" bucket={summary.paid} />
        </div>
      )}

      {entries.length === 0 ? (
        <section className="mt-12"><Empty onGo={onGo} /></section>
      ) : (
        <>
          <div className="mt-12 flex flex-wrap items-center gap-1 rounded-full border border-black/[0.06] bg-white p-1
                          sm:w-fit dark:border-white/[0.08] dark:bg-white/[0.03]">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn('rounded-full px-4 py-1.5 text-[13px] transition',
                  period === p.key ? 'bg-[#111] text-white dark:bg-white dark:text-[#111]'
                                   : 'text-muted-foreground hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>

          <Group title="In progress" entries={open}
                 empty="Nothing in progress. Every payment is settled." />
          <Group title="Done" entries={done}
                 empty={older
                   ? `Nothing finished in this period. ${older} earlier, under a longer period.`
                   : 'Nothing finished yet.'} />
        </>
      )}
    </div>
  )
}

function Group({ title, entries, empty }: { title: string; entries: Entry[]; empty: string }) {
  return (
    <section className="mt-10 space-y-5">
      <h2 className="flex items-baseline gap-2 text-[15px] font-medium">
        {title}
        <span className="text-[13px] font-normal tabular-nums text-muted-foreground">{entries.length}</span>
      </h2>
      {entries.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => e.kind === 'batch'
            ? <BatchCard key={e.batch.id} batch={e.batch} />
            : <PaymentCard key={e.payment.id} payment={e.payment} />)}
        </div>
      )}
    </section>
  )
}

/**
 * One headline figure.
 *
 * ⚠️ A CLIENT WITH TWO CURRENCIES HAS NO SINGLE TOTAL. When the server says the bucket is
 * mixed, the tile shows each currency on its own line rather than one figure nobody could
 * reconcile against a bank statement.
 */
function Figure({ label, bucket }: { label: string; bucket: MorSummaryBucket }) {
  const { n, mixed, split } = bucket
  return (
    <div className="bg-white px-7 py-6 dark:bg-[#0b0b0d]">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <div className="mt-2 text-[26px] font-semibold leading-none tabular-nums tracking-[-0.02em]">
        {n === 0
          ? <span className="text-muted-foreground/60">None</span>
          : mixed
            ? (
              <div className="space-y-1">
                {split.map(part => (
                  <div key={part.currency} className="text-[18px] leading-tight">{part.label}</div>
                ))}
              </div>
            )
            : aed(bucket.aed, bucket.currency)}
      </div>
      <p className="mt-2 h-5 text-[13px] tabular-nums text-muted-foreground">
        {n > 0 && `${n} ${n === 1 ? 'payment' : 'payments'}`}
      </p>
    </div>
  )
}

/* The one loud thing on the page, and it disappears the moment it is spent. */
function FeeFreeBadge({ free }: { free: FeeFreeState }) {
  const until = free.valid_until
    ? new Date(free.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null
  return (
    <div
      className="mt-4 inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full px-4 py-2 text-[13px] font-medium"
      style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
    >
      <ShieldCheck className="size-[15px]" aria-hidden />
      <span className="tabular-nums">
        {free.remaining} fee-free {free.remaining === 1 ? 'creator' : 'creators'}
      </span>
      {until && <span className="opacity-70">until {until}</span>}
    </div>
  )
}

const DOT: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  awaiting_payment: 'bg-amber-400',
  submitted: 'bg-amber-400',
  funded: 'bg-sky-500',
  paid: 'bg-emerald-500',
  cancelled: 'bg-muted-foreground/40',
}

/**
 * Where this creator actually is, in a few words. The enrolment only speaks for the window
 * between the money arriving and the creator being paid, which "Paying the creator" hid.
 */
function rowLabel(payment: MorPayment): string {
  const who = (payment.creator_name || 'They').split(' ')[0]
  const e = payment.enrolment
  if (payment.status === 'paid' || payment.status === 'cancelled' || !e) return payment.status_label
  if (payment.status !== 'funded') return payment.status_label

  switch (e.stage) {
    case 'undeliverable': return `Cannot reach ${who}`
    case 'invited': return `Waiting on ${who}`
    case 'opened': return `${who} is filling in details`
    case 'signing': return `${who} signed`
    case 'checking': return 'Checking details'
    case 'ready': return `Ready to pay ${who}`
    case 'reported': return `${who} says not them`
    default: return payment.status_label
  }
}

const shortDay = (iso: string | null | undefined) =>
  !iso ? '' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const initials = (name: string | null | undefined) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const ICON_BTN = 'flex size-9 items-center justify-center rounded-full border border-black/[0.08] text-foreground/70 ' +
  'transition hover:border-black/20 hover:text-foreground dark:border-white/[0.12]'

/* One card: who, where it has got to, how much, and the invoice when there is one. */
function MorCard({
  href, tile, title, sub, dot, state, amount, foot, invoiceUrl, note,
}: {
  href: string; tile: React.ReactNode; title: string; sub: string; dot: string; state: string
  amount: string; foot: string; invoiceUrl?: string | null; note?: string | null
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6
                    shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition duration-200 hover:-translate-y-0.5
                    hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)] dark:border-white/[0.08] dark:bg-white/[0.03]">
      {/* The whole card opens it; the download button sits above this layer. */}
      <Link href={href} className="absolute inset-0 rounded-2xl" aria-label={`Open ${title}`} />
      <div className="flex items-start justify-between gap-3">
        {tile}
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />
          <span className="truncate">{state}</span>
        </span>
      </div>
      <p className="mt-8 text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{amount}</p>
      <h3 className="mt-2 truncate text-[15px]" title={sub}>{title}</h3>
      <div className="mt-auto flex items-center justify-between pt-8">
        <span className="text-[13px] text-muted-foreground">{note || foot}</span>
        <span className="relative flex items-center gap-1.5">
          {invoiceUrl && (
            <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" title="Download invoice"
               aria-label="Download invoice" className={ICON_BTN}>
              <Download className="size-4" />
            </a>
          )}
          <span className={cn(ICON_BTN, 'pointer-events-none')} aria-hidden>
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </div>
    </div>
  )
}

function PaymentCard({ payment }: { payment: MorPayment }) {
  return (
    <MorCard
      href={`/mor/${payment.id}`}
      tile={
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-[14px] font-medium">
          {initials(payment.creator_name)}
        </span>
      }
      title={payment.creator_name || 'Creator'}
      sub={payment.creator_handle ? `@${payment.creator_handle}` : 'One creator'}
      dot={DOT[payment.status] ?? DOT.draft}
      state={rowLabel(payment)}
      amount={aed(payment.total_aed, payment.currency)}
      note={payment.fee_waived ? 'No fee from us' : null}
      foot={shortDay(payment.created_at)}
      invoiceUrl={payment.invoice_url}
    />
  )
}

function BatchCard({ batch }: { batch: MorBatch }) {
  const live = batch.payments.filter((p) => p.status !== 'cancelled')
  return (
    <MorCard
      href={`/mor/batch/${batch.id}`}
      tile={
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d3ff02] text-[#111]">
          <Users className="size-5" strokeWidth={1.75} />
        </span>
      }
      title={batch.label || `${live.length} creators`}
      sub={`${live.length} creators, one invoice`}
      dot={DOT[batch.status] ?? DOT.draft}
      state={batch.status === 'funded' ? `${batch.creators_paid} of ${live.length} paid` : batch.status_label}
      amount={aed(batch.total_aed, batch.currency)}
      note={batch.status !== 'funded' && batch.waived_count > 0 ? `${batch.waived_count} fee-free` : null}
      foot={shortDay(batch.created_at)}
      invoiceUrl={batch.invoice_url}
    />
  )
}

/* Teaches the screen rather than announcing that it is empty. */
function Empty({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--mor-rule)] px-8 py-16 text-center">
      <Wallet className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <p className="mx-auto mt-5 max-w-[46ch] text-[14.5px] leading-relaxed text-muted-foreground">
        Nobody yet. Agree a creator, a fee and what they are posting, then tell us here. We
        contract them, you settle one invoice, and we pay them.
      </p>
      <Button onClick={onGo} variant="outline" className="mt-7 gap-1.5 rounded-full">
        <Plus className="size-4" />Pay a creator
      </Button>
    </div>
  )
}

/* For somebody who does not hold the module yet. */
function Offer({ offer }: { offer: MorOffer | null }) {
  if (!offer) {
    return (
      <p className="text-[14.5px] leading-relaxed text-muted-foreground">
        We could not load this just now. Reload the page and it should come back.
      </p>
    )
  }
  const fees = offer.fees
  return (
    <div className="max-w-[860px]">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
        {offer.label}
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-muted-foreground">
        {offer.description}
      </p>

      <ol className="mt-12 space-y-5">
        {offer.how_it_works?.map((step: string, i: number) => (
          <li key={i} className="flex gap-4">
            <span className="mt-[3px] size-[7px] shrink-0 rounded-full bg-foreground/25" aria-hidden />
            <span className="max-w-[56ch] text-[14.5px] leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-12 border-t border-[var(--mor-rule)] pt-8">
        <div className="text-[28px] font-semibold tabular-nums tracking-[-0.02em]">
          {/* Always the percentage. "Included" above an invoice charging 7% is the worst
              version of this screen being wrong. */}
          {`${fees.settlement_fee_pct}%`}
        </div>
        <p className="mt-2 max-w-[54ch] text-[13.5px] leading-relaxed text-muted-foreground">
          {fees.summary}
        </p>
      </div>

      <div className="mt-10">
        <Button asChild variant="outline">
          <Link href="/mor/payees">Your payee book<ArrowRight className="ml-1.5 size-4" /></Link>
        </Button>
      </div>
    </div>
  )
}
