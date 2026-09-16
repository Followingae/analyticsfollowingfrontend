'use client'

/**
 * Merchant of Record — the one screen.
 *
 * A brand arrives here having already agreed terms with a creator, and wants us to contract
 * that creator and pay them. There is no campaign, no brief and no proposal in that
 * sentence, so there is none on this page. One list, one button, one badge.
 *
 * WHAT THIS PAGE REFUSES TO BE. The obvious version is a dashboard: tiles, charts, tabs, a
 * table with nine columns. Nobody comes here to browse. They come to start a payment or to
 * check whether one has gone out, and both answers should be readable without reading. So
 * the figures are a quiet line rather than three cards, the payments are rows rather than
 * cards, and everything else is space.
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
import { ArrowRight, Plus, ShieldCheck, Users, Wallet } from 'lucide-react'
import { morApi, type MorOffer } from '@/services/morApi'
import {
  morPaymentsApi, aed,
  type MorOverview, type MorPayment, type MorBatch, type FeeFreeState,
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

/* The page's own tokens. Lime is the theme's own accent - chart-3 in light, the brand hue in
   dark - and it is light enough that anything on it has to be near-black to stay readable.
   Declared once here rather than inlined at each use so the two cannot drift apart. */
const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
  .mor-row { transition: background-color 160ms cubic-bezier(0.22, 1, 0.36, 1); }
  .mor-row:hover { background-color: color-mix(in oklch, var(--muted) 55%, transparent); }
  .mor-row:focus-visible {
    outline: 2px solid var(--ring); outline-offset: -2px; border-radius: 10px;
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
    <div className="mor-scope mx-auto w-full max-w-[860px] px-5 py-12 sm:px-8 sm:py-16">
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

/* Loading. The shape of the answer, not a spinner: the header, the figures and three rows
   land where they will actually be. */
function LoadingShape() {
  return (
    <div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-14 flex gap-12">
        {[0, 1, 2].map((n) => (
          <div key={n}>
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-2.5 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-14 space-y-1">
        {[0, 1, 2].map((n) => <Skeleton key={n} className="h-[68px] w-full rounded-[10px]" />)}
      </div>
    </div>
  )
}

function Live({ data, onGo, onGoMany }: {
  data: MorOverview | null; onGo: () => void; onGoMany: () => void
}) {
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

  /* One list, in the order things were instructed. A batch is ONE entry carrying its
     creators, not N entries that happen to share a date: the brand gave us one instruction
     and six rows claiming to be separate would misrepresent what they did and what they owe. */
  const entries = [
    ...batches.map((b) => ({ kind: 'batch' as const, at: b.created_at ?? '', batch: b })),
    ...payments
      .filter((p) => !p.batch_id)
      .map((p) => ({ kind: 'one' as const, at: p.created_at ?? '', payment: p })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            Merchant of Record
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-muted-foreground">
            You tell us who you have agreed with. We contract them, you pay us once, and we
            pay them.
          </p>
          {free.remaining > 0 && <FeeFreeBadge free={free} />}
        </div>
        {/* Two ways in, because they are genuinely different jobs. One creator is a short
            form; a list is a table you can paste into. Offering only the first makes anybody
            with six creators do the short form six times. */}
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Button variant="outline" onClick={onGoMany} className="gap-1.5">
            <Users className="size-4" />Pay several
          </Button>
          <Button onClick={onGo} className="gap-1.5">
            <Plus className="size-4" />Pay a creator
          </Button>
        </div>
      </header>

      {payments.length > 0 && (
        <div className="mt-14 flex flex-wrap gap-x-14 gap-y-8">
          <Figure label="Waiting on you" value={aed(summary.awaiting_payment.aed)}
                  count={summary.awaiting_payment.n} />
          <Figure label="Paying the creator" value={aed(summary.paying_creator.aed)}
                  count={summary.paying_creator.n} />
          <Figure label="Paid" value={aed(summary.paid.aed)} count={summary.paid.n} />
        </div>
      )}

      <section className="mt-14">
        {entries.length === 0 ? (
          <Empty onGo={onGo} />
        ) : (
          <ul className="-mx-3">
            {entries.map((e, i) =>
              e.kind === 'batch'
                ? <BatchRow key={e.batch.id} batch={e.batch} first={i === 0} />
                : <Row key={e.payment.id} payment={e.payment} first={i === 0} />,
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

function Figure({ label, value, count }: { label: string; value: string; count: number }) {
  return (
    <div>
      <div className="text-[21px] font-semibold tabular-nums tracking-[-0.02em]">
        {count === 0 ? <span className="text-muted-foreground">None</span> : value}
      </div>
      <div className="mt-1.5 text-[12.5px] text-muted-foreground">
        {label}
        {count > 0 && <span className="tabular-nums"> · {count}</span>}
      </div>
    </div>
  )
}

/* The badge. Lime, because it is the one genuinely good piece of news on the page and the
   only thing here allowed to be loud. It disappears the moment it is spent rather than
   turning into a reminder that they are now being charged. */
function FeeFreeBadge({ free }: { free: FeeFreeState }) {
  const until = free.valid_until
    ? new Date(free.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null
  return (
    <div
      className="mt-6 inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full px-4 py-2 text-[13px] font-medium"
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
  awaiting_payment: 'bg-amber-500',
  funded: 'bg-sky-500',
  paid: 'bg-emerald-600',
  cancelled: 'bg-muted-foreground/40',
}

/**
 * One line saying where this creator actually is.
 *
 * Falls back to the payment's own status wherever the enrolment has nothing to add, so a
 * draft still reads "Not sent yet" and a cancelled one still reads cancelled. The enrolment
 * only speaks for the window between the money arriving and the creator being paid, which is
 * precisely the window that used to say nothing.
 */
function rowLabel(payment: MorPayment): string {
  const who = (payment.creator_name || 'They').split(' ')[0]
  const e = payment.enrolment
  if (payment.status === 'paid' || payment.status === 'cancelled' || !e) return payment.status_label
  if (payment.status !== 'funded') return payment.status_label

  switch (e.stage) {
    case 'undeliverable': return `We could not reach ${who}`
    case 'invited': return `Waiting on ${who}`
    case 'opened': return `${who} is filling in their details`
    case 'signing': return `${who} signed, adding their account`
    case 'checking': return `Checking ${who}'s details`
    case 'ready': return `Ready to pay ${who}`
    case 'reported': return `${who} says this is not them`
    default: return payment.status_label
  }
}

function Row({ payment, first }: { payment: MorPayment; first: boolean }) {
  return (
    <li>
      <Link
        href={`/mor/${payment.id}`}
        className={cn(
          'mor-row flex items-center justify-between gap-6 rounded-[10px] px-3 py-4',
          !first && 'border-t border-[var(--mor-rule)]',
        )}
      >
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium tracking-[-0.01em]">
            {payment.creator_name}
          </div>
          {/* The label says where the CREATOR has got to once the money is in, not just where
              the money is. "Paying the creator" was true for the whole window in which a
              creator was signing, entering their account, or had gone quiet, which is most of
              the elapsed time and the only part a brand can do anything about. */}
          <div className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className={cn('size-[6px] shrink-0 rounded-full', DOT[payment.status])} aria-hidden />
            <span className="truncate">{rowLabel(payment)}</span>
            {payment.creator_handle && (
              <span className="truncate opacity-70">@{payment.creator_handle}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="text-[15px] font-medium tabular-nums tracking-[-0.01em]">
              {aed(payment.total_aed)}
            </div>
            {payment.fee_waived && (
              <div className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                No fee from us
              </div>
            )}
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </Link>
    </li>
  )
}

/* A batch, as one row. It names the creators rather than saying "6 creators", because the
   names are how somebody recognises which list this is, and a count tells them nothing they
   could not see from the total. Truncated after three: past that the row stops being
   scannable, which is the only thing it is for. */
function BatchRow({ batch, first }: { batch: MorBatch; first: boolean }) {
  const live = batch.payments.filter((p) => p.status !== 'cancelled')
  const names = live.slice(0, 3).map((p) => p.creator_name).join(', ')
  const rest = live.length - 3

  return (
    <li>
      <Link
        href={`/mor/batch/${batch.id}`}
        className={cn(
          'mor-row flex items-center justify-between gap-6 rounded-[10px] px-3 py-4',
          !first && 'border-t border-[var(--mor-rule)]',
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="size-[15px] shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-[15px] font-medium tracking-[-0.01em]">
              {batch.label || `${live.length} creators`}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className={cn('size-[6px] shrink-0 rounded-full', DOT[batch.status])} aria-hidden />
            <span className="shrink-0">{batch.status_label}</span>
            {names && (
              <span className="truncate opacity-70">
                {names}{rest > 0 && ` and ${rest} more`}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="text-[15px] font-medium tabular-nums tracking-[-0.01em]">
              {aed(batch.total_aed)}
            </div>
            {batch.status === 'funded' && (
              <div className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
                {batch.creators_paid} of {live.length} paid
              </div>
            )}
            {batch.status !== 'funded' && batch.waived_count > 0 && (
              <div className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                {batch.waived_count} fee-free
              </div>
            )}
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </Link>
    </li>
  )
}

/* Teaches the screen rather than announcing that it is empty. */
function Empty({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[var(--mor-rule)] px-8 py-14 text-center">
      <Wallet className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <p className="mx-auto mt-5 max-w-[46ch] text-[14.5px] leading-relaxed text-muted-foreground">
        Nobody yet. When you have agreed a creator, a fee and what they are posting, tell us
        here. We draw up the agreement in our name, you settle one invoice, and we pay them.
        A whole list works the same way, and still settles once.
      </p>
      <Button onClick={onGo} variant="outline" className="mt-7 gap-1.5">
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
    <div>
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
          {fees.included_in_manage ? 'Included' : `${fees.settlement_fee_pct}%`}
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
