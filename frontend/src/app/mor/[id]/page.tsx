'use client'

/**
 * One creator payment: what was agreed, what it costs, and where it has got to.
 *
 * The question this page answers is almost always "has it gone out yet", so the state is the
 * first thing on it and the paperwork is the last. The stages are shown as a plain vertical
 * run rather than a progress bar: a bar implies even steps and a predictable end, and waiting
 * on a bank transfer is neither.
 *
 * A card payment is opened from here and finished on Stripe. Nothing on this page marks it
 * paid - only the webhook does, because until Stripe says the money moved it has not.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowLeft, Check, CreditCard, ShieldCheck } from 'lucide-react'
import {
  morPaymentsApi, aed, BANK_DETAILS, type MorPayment,
} from '@/services/morPaymentsApi'
import { cn } from '@/lib/utils'

const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
`

export default function MorPaymentPage() {
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

  const [payment, setPayment] = useState<MorPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await morPaymentsApi.read(id)
      setPayment(r.data)
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
      const r = await morPaymentsApi.checkout(
        id, `${origin}/mor/${id}?paid=1`, `${origin}/mor/${id}`)
      window.location.href = r.data.checkout_url
    } catch (e) {
      toast.error((e as Error).message)
      setPaying(false)
    }
  }

  const cancel = async () => {
    try {
      const r = await morPaymentsApi.cancel(id)
      setPayment(r.data)
      setCancelOpen(false)
      toast.success('Cancelled')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="mor-scope mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8 sm:py-16">
      <style>{TOKENS}</style>

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Merchant of Record
      </Button>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-10 h-44 w-full rounded-[14px]" />
        </div>
      ) : !payment ? (
        <p className="mt-8 text-[14.5px] leading-relaxed text-muted-foreground">
          We could not find that payment on your account.
        </p>
      ) : (
        <>
          <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            {payment.creator_name}
          </h1>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            {payment.creator_handle && <span>@{payment.creator_handle} · </span>}
            <span className="tabular-nums">{payment.reference}</span>
          </p>

          {payment.status === 'cancelled' ? (
            <p className="mt-10 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5 text-[14px] leading-relaxed text-muted-foreground">
              Cancelled{payment.cancelled_reason ? `: ${payment.cancelled_reason}` : '.'} Nothing
              was charged and nobody was paid.
            </p>
          ) : (
            <>
              <Cost payment={payment} />
              <Action payment={payment} paying={paying} onPay={payByCard} />
              <Stages payment={payment} />
            </>
          )}

          <Agreed payment={payment} />

          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
            <div className="mt-14 border-t border-[var(--mor-rule)] pt-8">
              <Button variant="ghost" size="sm"
                      className="-ml-2.5 text-muted-foreground hover:text-destructive"
                      onClick={() => setCancelOpen(true)}>
                Cancel this payment
              </Button>
            </div>
          )}

          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel paying {payment.creator_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  We will stop the agreement and nobody will be paid. If you have already
                  settled the invoice we will refund it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={cancel}>Cancel the payment</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

function Cost({ payment }: { payment: MorPayment }) {
  return (
    <div className="mt-10 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
      <Line label="Creator’s fee" value={aed(payment.creator_fee_aed)} />
      <Line
        label="Our Merchant of Record fee"
        value={payment.fee_waived ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
            style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
          >
            <ShieldCheck className="size-3" aria-hidden />Waived
          </span>
        ) : `${aed(payment.our_fee_aed)}  ·  ${payment.our_fee_pct}%`}
      />
      <Line label="VAT" value={aed(payment.vat_aed)} />
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--mor-rule)] pt-4">
        <span className="text-[14px] font-medium">Total</span>
        <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
          {aed(payment.total_aed)}
        </span>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5 text-[14px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}

/* The one thing they might need to do, and nothing else competing with it. */
function Action({ payment, paying, onPay }: {
  payment: MorPayment; paying: boolean; onPay: () => void
}) {
  if (payment.status !== 'awaiting_payment') return null

  if (payment.payment_method === 'transfer') {
    /* This used to say "your invoice is on its way" and then show nothing: no account number,
       no IBAN, no reference. A brand who chose bank transfer could not pay us even if they
       wanted to. The details are the point of the block. */
    return (
      <div className="mt-6 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
        {payment.invoice_at ? (
          <p className="text-[14px] leading-relaxed">
            <span className="font-medium">Invoice {payment.invoice_number}</span> is with you by
            email{payment.invoice_url && (
              <>, and <a href={payment.invoice_url} target="_blank" rel="noreferrer"
                         className="underline underline-offset-2">here</a></>
            )}.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed">
            <span className="font-medium">Your invoice is being prepared.</span> We will email
            it and put it here. You can transfer now if you would rather not wait.
          </p>
        )}

        <dl className="mt-5 space-y-2.5">
          {[
            ['Account holder', BANK_DETAILS.accountHolder],
            ['IBAN', BANK_DETAILS.iban],
            ['BIC / SWIFT', BANK_DETAILS.swift],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-baseline justify-between gap-3">
              <dt className="text-[13px] text-muted-foreground">{k}</dt>
              <dd className="font-mono text-[13.5px] tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <dt className="text-[13px] text-muted-foreground">Reference</dt>
            <dd className="font-mono text-[13.5px]">{payment.reference}</dd>
          </div>
        </dl>

        <p className="mt-4 max-w-[54ch] text-[12.5px] leading-relaxed text-muted-foreground">
          Quote the reference so we can match it quickly. We contact{' '}
          {payment.creator_name} as soon as it lands.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <Button onClick={onPay} disabled={paying} className="gap-2">
        <CreditCard className="size-4" />
        {paying ? 'Opening…' : `Pay ${aed(payment.total_aed)}`}
      </Button>
      <p className="text-[13px] text-muted-foreground">Card, through Stripe.</p>
    </div>
  )
}

/* Where it has got to.
 *
 * WHAT THIS USED TO HIDE. Three steps, and between "your payment cleared" and "the creator
 * was paid" there was nothing at all: the longest part of the job, the part where the creator
 * is actually signing and giving us their account, was a blank. The middle step now says what
 * is really happening, named after the creator, because "awaiting payee verification" is our
 * language and "Sara is filling in her details" is theirs.
 *
 * The agreement is no longer a step of its own. It happens inside the creator's enrolment,
 * and a brand does not need a milestone for a document they never touch. */
function Stages({ payment }: { payment: MorPayment }) {
  const who = (payment.creator_name || 'They').split(' ')[0]
  const e = payment.enrolment

  const middle = () => {
    if (!payment.funded_at) return `We contact ${who} the moment your payment clears.`
    if (!e || e.stage === 'not_started') return `We are setting ${who} up now.`
    if (e.stage === 'undeliverable') return `We could not reach ${who}. Check the email you gave us.`
    if (e.stage === 'invited') return `We have emailed ${who}. Give them a nudge if you speak.`
    if (e.stage === 'opened') return `${who} has opened the link and is filling it in.`
    if (e.stage === 'signing') return `${who} has signed and is adding their bank details.`
    if (e.stage === 'checking') return `${who} is done. We are checking their details.`
    if (e.stage === 'reported') return `${who} told us this was not them. We have stopped.`
    return `${who} is ready to be paid.`
  }

  const stages = [
    {
      title: 'Your invoice',
      done: !!payment.invoice_at,
      at: payment.invoice_at,
      body: payment.invoice_at
        ? `Invoice ${payment.invoice_number}. Sent to you by email.`
        : 'Being prepared. We will email it and put it here.',
    },
    {
      title: 'Your payment cleared',
      done: !!payment.funded_at,
      at: payment.funded_at,
      body: payment.funded_at
        ? 'Thank you. Receipt below.'
        : 'We pay the creator out of this, never before it.',
    },
    {
      title: `${who} signs and gives us their account`,
      done: !!e && (e.stage === 'ready' || !!payment.creator_paid_at),
      at: e?.signed_at ?? null,
      body: middle(),
    },
    {
      title: `${who} paid`,
      done: !!payment.creator_paid_at,
      at: payment.creator_paid_at,
      body: payment.payment_reference
        ? `Bank reference ${payment.payment_reference}.`
        : 'As soon as their details are in.',
    },
  ]

  return (
    <ol className="mt-12">
      {stages.map((s, i) => (
        <li key={s.title} className="flex gap-4 pb-7 last:pb-0">
          <div className="flex flex-col items-center">
            <span className={cn(
              'flex size-[22px] shrink-0 items-center justify-center rounded-full border',
              s.done ? 'border-transparent bg-foreground text-background' : 'border-[var(--mor-rule)]',
            )}>
              {s.done && <Check className="size-3" aria-hidden />}
            </span>
            {i < stages.length - 1 && (
              <span className="mt-1.5 w-px flex-1 bg-[var(--mor-rule)]" aria-hidden />
            )}
          </div>
          <div className="-mt-0.5 min-w-0 pb-1">
            <div className={cn('text-[14.5px] font-medium tracking-[-0.01em]',
                               !s.done && 'text-muted-foreground')}>
              {s.title}
            </div>
            <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              {s.body}
              {s.at && (
                <span className="tabular-nums">
                  {' '}{new Date(s.at).toLocaleDateString('en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* What we are contracting them on. Read far less often than the state above, so it sits
   below it, and it is only rendered where there is something to show. */
function Agreed({ payment }: { payment: MorPayment }) {
  const rows: Array<[string, React.ReactNode]> = []
  if (payment.deliverables?.length) {
    rows.push(['Making', (
      <span>{payment.deliverables.map((d) =>
        d.quantity > 1 ? `${d.quantity} × ${d.what}` : d.what).join(', ')}</span>
    )])
  }
  if (payment.posting_dates) rows.push(['Posting', payment.posting_dates])
  if (payment.usage_terms) rows.push(['Usage', payment.usage_terms])
  if (payment.creator_email) rows.push(['Email', payment.creator_email])
  if (payment.creator_whatsapp) rows.push(['WhatsApp', payment.creator_whatsapp])
  if (!rows.length) return null

  return (
    <section className="mt-14">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        What you agreed
      </h2>
      <dl className="mt-5">
        {rows.map(([label, value], i) => (
          <div key={label}
               className={cn('flex flex-wrap gap-x-8 gap-y-1 py-3.5',
                             i > 0 && 'border-t border-[var(--mor-rule)]')}>
            <dt className="w-24 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
            <dd className="min-w-0 flex-1 text-[14px] leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
