'use client'

/**
 * One creator payment, as the brand sees it.
 *
 * THE QUESTION IS ALWAYS "WHERE IS IT". So the journey is the first thing on the page and
 * reads left to right in four moves, and directly under it one sentence names who we are
 * waiting on. Everything else is reference: what it costs, who it is for, what you can
 * download.
 *
 * WHAT THE BRAND COULD NOT SEE BEFORE. Whether the creator had actually signed, and the
 * agreement itself. Both are here now. The agreement is a redacted copy: the full one holds
 * the creator's mobile, date of birth, signing IP, device and drawn signature, and a brand
 * asked us to contract this person rather than to hold their file.
 *
 * A card payment is opened from here and finished on Stripe. Nothing on this page marks it
 * paid, only the webhook does, because until Stripe says the money moved it has not.
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
import {
  ArrowLeft, ArrowRight, Banknote, Check, CreditCard, Download, FileSignature, FileText,
  Hourglass, Landmark, Mail, MessageCircle, PenLine, Receipt, Wallet,
} from 'lucide-react'
import {
  morPaymentsApi, aed, BANK_DETAILS, type MorPayment,
} from '@/services/morPaymentsApi'
import { cn } from '@/lib/utils'

/* The page's own tokens, declared once. Lime is the theme's accent and is light enough that
   anything sitting on it has to be near-black to stay readable.

   The last three rules theme the surfaces the browser draws for us. Selection, the caret and
   the focus ring ship as platform defaults that belong to no design system, and on a page
   whose whole job is to be trusted with money they are the cheapest tell that nobody
   finished it. */
const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
    --mor-wash: color-mix(in oklch, var(--muted) 45%, transparent);
    caret-color: var(--foreground);
  }
  .mor-scope ::selection {
    background: color-mix(in oklch, var(--mor-lime) 55%, transparent);
    color: var(--mor-lime-ink);
  }
  .mor-scope :focus-visible {
    outline: 2px solid color-mix(in oklch, var(--foreground) 55%, transparent);
    outline-offset: 2px;
    border-radius: 6px;
  }
  /* The one authored moment: the step we are actually waiting on keeps breathing. Everything
     else on the page is still, so it reads as the live one without a single other animation
     competing with it. */
  @keyframes mor-pulse {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--mor-lime) 70%, transparent); }
    60%      { box-shadow: 0 0 0 7px color-mix(in oklch, var(--mor-lime) 0%, transparent); }
  }
  .mor-now { animation: mor-pulse 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
  @media (prefers-reduced-motion: reduce) { .mor-now { animation: none; } }
`

const when = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
}

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
    <div className="mor-scope mx-auto w-full max-w-[920px] px-5 py-10 sm:px-8 sm:py-14">
      <style>{TOKENS}</style>

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Creator Contracting
      </Button>

      {loading ? (
        <div className="mt-6 space-y-5">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-24 w-full rounded-[14px]" />
          <Skeleton className="h-40 w-full rounded-[14px]" />
        </div>
      ) : !payment ? (
        <p className="mt-8 text-[14.5px] leading-relaxed text-muted-foreground">
          We could not find that payment on your account.
        </p>
      ) : (
        <>
          <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
                {payment.creator_name}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {payment.creator_handle && <span>@{payment.creator_handle} · </span>}
                <span className="tabular-nums">{payment.reference}</span>
              </p>
            </div>
            <StatusPill payment={payment} />
          </header>

          {payment.status === 'cancelled' ? (
            <p className="mt-9 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5 text-[14px] leading-relaxed text-muted-foreground">
              Cancelled{payment.cancelled_reason ? `: ${payment.cancelled_reason}` : '.'} Nothing
              was charged and nobody was paid.
            </p>
          ) : (
            <>
              <Journey payment={payment} />
              <Next payment={payment} paying={paying} onPay={payByCard} />

              <div className="mt-6 grid gap-5 md:grid-cols-[1.05fr_1fr]">
                <Money payment={payment} />
                <Creator payment={payment} />
              </div>

              <Documents payment={payment} id={id} />
            </>
          )}

          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
            <div className="mt-12 border-t border-[var(--mor-rule)] pt-7">
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

/* ── where it has got to ─────────────────────────────────────────────────────────────── */

type Step = {
  key: string
  label: string
  icon: typeof FileText
  done: boolean
  at: string | null
  /** Shown under the label when this is the step everyone is waiting on. */
  waiting: string
}

function steps(p: MorPayment): Step[] {
  const e = p.enrolment
  const signed = !!p.agreement_signed_at || !!e?.signed_at
  return [
    {
      key: 'invoice', label: 'Invoiced', icon: FileText,
      done: !!p.invoice_at, at: p.invoice_at ?? null,
      waiting: 'We are preparing it',
    },
    {
      key: 'funded', label: 'Payment in', icon: Landmark,
      done: !!p.funded_at, at: p.funded_at ?? null,
      waiting: 'Waiting on your transfer',
    },
    {
      key: 'signed', label: 'Creator signed', icon: PenLine,
      done: signed, at: p.agreement_signed_at ?? e?.signed_at ?? null,
      waiting: 'Waiting on the creator',
    },
    {
      key: 'paid', label: 'Creator paid', icon: Banknote,
      done: !!p.creator_paid_at, at: p.creator_paid_at ?? null,
      waiting: 'We are paying them',
    },
  ]
}

/**
 * The journey, left to right.
 *
 * Four moves, because that is how many there are. It reads as a run of marks rather than a
 * filling bar: a bar implies even steps and a predictable end, and waiting on a bank
 * transfer is neither of those.
 */
function Journey({ payment }: { payment: MorPayment }) {
  const all = steps(payment)
  const nowIndex = all.findIndex(s => !s.done)

  return (
    <ol className="mt-8 grid gap-x-3 gap-y-5 sm:grid-cols-4">
      {all.map((s, i) => {
        const now = i === nowIndex
        const Icon = s.done ? Check : s.icon
        return (
          <li key={s.key} className="relative flex items-start gap-3 sm:block">
            {/* The connector lives on the step it leads away from, so the last one has none. */}
            {i < all.length - 1 && (
              <span aria-hidden
                    className={cn(
                      'absolute hidden sm:block',
                      'left-[34px] right-[-12px] top-[16px] h-px',
                      s.done ? 'bg-foreground/25' : 'bg-[var(--mor-rule)]',
                    )} />
            )}
            <span className={cn(
              'relative z-10 flex size-[34px] shrink-0 items-center justify-center rounded-full border',
              s.done && 'border-transparent bg-foreground text-background',
              now && 'mor-now border-transparent',
              !s.done && !now && 'border-[var(--mor-rule)] text-muted-foreground',
            )}
              style={now ? { background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' } : undefined}>
              <Icon className="size-[15px]" strokeWidth={s.done ? 2.6 : 2} />
            </span>
            <span className="min-w-0 sm:mt-3 sm:block">
              <span className="block text-[13.5px] font-medium leading-tight">{s.label}</span>
              <span className="mt-1 block text-[12px] leading-tight text-muted-foreground">
                {s.done ? (when(s.at) ?? 'done') : now ? s.waiting : 'not yet'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function StatusPill({ payment }: { payment: MorPayment }) {
  const tone =
    payment.status === 'paid' ? 'bg-foreground text-background'
      : payment.status === 'cancelled' ? 'bg-muted text-muted-foreground'
        : 'border border-[var(--mor-rule)] text-foreground'
  return (
    <span className={cn('shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium', tone)}>
      {payment.status_label}
    </span>
  )
}

/* ── the one sentence that matters ───────────────────────────────────────────────────── */

/**
 * What happens next, named.
 *
 * A status word tells somebody where a thing is; it does not tell them whether they have to
 * do anything, which is the only question a brand actually has. So this says who we are
 * waiting on in a sentence, and carries the brand's action when the brand is the answer.
 */
function Next({ payment, paying, onPay }: {
  payment: MorPayment; paying: boolean; onPay: () => void
}) {
  const who = (payment.creator_name || 'They').split(' ').filter(w => !/^(dr|mr|mrs|ms)\.?$/i.test(w))[0] || 'They'
  const e = payment.enrolment
  const yours = !!payment.invoice_at && !payment.funded_at

  let body: string
  if (!payment.invoice_at) {
    body = 'We are preparing your invoice. It will arrive by email and appear below, and nothing is needed from you until then.'
  } else if (!payment.funded_at) {
    body = `Your invoice ${payment.invoice_number ? `(${payment.invoice_number}) ` : ''}is with you. We contact ${who} the moment it clears.`
  } else if (!payment.agreement_signed_at && !e?.signed_at) {
    body = `${who} has their link and is signing the agreement and adding their bank details. Nothing is needed from you.`
  } else if (!payment.creator_paid_at) {
    body = `${who} has signed. We are checking their details and paying them. Nothing is needed from you.`
  } else {
    body = `${who} has been paid${payment.payment_reference ? `, reference ${payment.payment_reference}` : ''}. This one is finished.`
  }

  return (
    <section className={cn(
      'mt-7 rounded-[14px] border px-6 py-5',
      yours ? 'border-foreground/15 bg-[var(--mor-wash)]' : 'border-[var(--mor-rule)]',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 max-w-[62ch]">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            {payment.creator_paid_at ? 'Done' : 'What happens next'}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
        </div>

        {yours && payment.payment_method !== 'transfer' && (
          <Button onClick={onPay} disabled={paying} className="gap-2">
            <CreditCard className="size-4" />
            {paying ? 'Opening…' : `Pay ${aed(payment.total_aed)}`}
          </Button>
        )}
      </div>

      {yours && payment.payment_method === 'transfer' && (
        <dl className="mt-5 grid gap-x-8 gap-y-2.5 border-t border-[var(--mor-rule)] pt-4 sm:grid-cols-2">
          {([
            ['Account holder', BANK_DETAILS.accountHolder],
            ['IBAN', BANK_DETAILS.iban],
            ['SWIFT', BANK_DETAILS.swift],
            ['Bank address', BANK_DETAILS.address],
          ] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-[12.5px] text-muted-foreground">{k}</dt>
              <dd className="text-right text-[13px] font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

/* ── the money ───────────────────────────────────────────────────────────────────────── */

function Money({ payment }: { payment: MorPayment }) {
  return (
    <section className="rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">What it costs</h2>
      <dl className="mt-4 space-y-2.5">
        <Row k={`${payment.creator_name.split(' ')[0]}'s fee`} v={aed(payment.creator_fee_aed)} />
        <Row k={`Our fee, ${payment.our_fee_pct}%`}
             v={payment.fee_waived ? 'waived' : aed(payment.our_fee_aed)}
             muted={payment.fee_waived} />
        {payment.vat_aed > 0 && (
          <Row k={payment.vat_label || 'VAT'} v={aed(payment.vat_aed)} />
        )}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--mor-rule)] pt-4">
        <span className="text-[13px] font-medium">Total</span>
        <span className="text-[19px] font-semibold tabular-nums tracking-[-0.01em]">
          {aed(payment.total_aed)}
        </span>
      </div>
    </section>
  )
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-muted-foreground">{k}</dt>
      <dd className={cn('text-[13.5px] tabular-nums', muted && 'text-muted-foreground')}>{v}</dd>
    </div>
  )
}

/* ── the creator ─────────────────────────────────────────────────────────────────────── */

/**
 * Who it is for, and whether we have actually reached them.
 *
 * The brand gave us the address and the number, so the brand is the only one who can correct
 * a wrong one. They used to be told "we have emailed them" whether or not it arrived.
 */
function Creator({ payment }: { payment: MorPayment }) {
  const c = payment.enrolment?.contact
  const initials = (payment.creator_name || '?').split(' ')
    .filter(w => !/^(dr|mr|mrs|ms)\.?$/i.test(w)).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase()

  return (
    <section className="rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Who it is for</h2>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--mor-wash)] text-[13px] font-semibold">
          {initials || '?'}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">{payment.creator_name}</span>
          {payment.creator_handle && (
            <span className="block truncate text-[12.5px] text-muted-foreground">
              @{payment.creator_handle}
            </span>
          )}
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--mor-rule)] pt-4">
        <Reach icon={Mail} label="Email"
               sent={!!c?.email_sent_at} failed={!!c?.email_failed} state={null} />
        <Reach icon={MessageCircle} label="WhatsApp"
               sent={!!c?.whatsapp_sent_at} failed={!!c?.whatsapp_failed}
               state={c?.whatsapp_status ?? null} />
      </div>

      {payment.deliverables?.length > 0 && (
        <p className="mt-4 border-t border-[var(--mor-rule)] pt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          {payment.deliverables.map(d => d.what).filter(Boolean).join('; ')}
        </p>
      )}
    </section>
  )
}

function Reach({ icon: Icon, label, sent, failed, state }: {
  icon: typeof Mail; label: string; sent: boolean; failed: boolean; state: string | null
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-medium">{label}</span>
      <span className={cn('ml-auto', failed ? 'text-destructive' : 'text-muted-foreground')}>
        {failed ? 'did not arrive' : sent ? (state === 'read' ? 'read' : state === 'delivered' ? 'delivered' : 'sent') : 'not sent'}
      </span>
    </div>
  )
}

/* ── the paperwork ───────────────────────────────────────────────────────────────────── */

/**
 * Everything the brand can keep.
 *
 * The signed agreement is the one that was missing, and it is a redacted copy: the creator's
 * mobile, date of birth, signing IP, device and drawn signature are not in it. A brand asked
 * us to contract this person, not to hold their file.
 *
 * A document that does not exist yet still gets a line, because "where is my receipt" is
 * answered better by "it arrives when the money lands" than by an absence.
 */
function Documents({ payment, id }: { payment: MorPayment; id: string }) {
  const e = payment.enrolment
  const signed = !!payment.agreement_signed_at || !!e?.signed_at

  const docs: {
    key: string; icon: typeof FileText; title: string; sub: string
    href?: string | null; onClick?: () => void; pending: string
  }[] = [
    {
      key: 'invoice', icon: FileText, title: 'Invoice',
      sub: payment.invoice_number ? `${payment.invoice_number} · ${when(payment.invoice_at) ?? ''}` : 'Being prepared',
      href: payment.invoice_url ?? null,
      pending: 'We email it the moment it is raised.',
    },
    {
      key: 'receipt', icon: Receipt, title: 'Payment receipt',
      sub: payment.funded_at ? `Received ${when(payment.funded_at)}` : 'Not paid yet',
      href: payment.receipt_url ?? null,
      pending: 'Arrives once your transfer reaches us.',
    },
    {
      key: 'agreement', icon: FileSignature, title: 'Signed agreement',
      sub: signed ? `Signed ${when(payment.agreement_signed_at ?? e?.signed_at) ?? ''}` : 'Not signed yet',
      onClick: signed
        ? () => { void morPaymentsApi.agreementPdf(id).catch(err => toast.error((err as Error).message)) }
        : undefined,
      pending: 'Available the moment the creator signs.',
    },
    {
      key: 'payout', icon: Wallet, title: 'Payout confirmation',
      sub: payment.creator_paid_at
        ? `Paid ${when(payment.creator_paid_at)}${payment.payment_reference ? ` · ${payment.payment_reference}` : ''}`
        : 'Not paid out yet',
      href: null,
      pending: 'We attach the proof of payment once it leaves our bank.',
    },
  ]

  return (
    <section className="mt-6 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Your paperwork</h2>
      <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {docs.map((d, i) => {
          const ready = !!d.href || !!d.onClick
          /* A link where there is a URL, a real button where the file has to be fetched with
             the token. Never a div with a click handler: the keyboard skips those. */
          const Row: 'a' | 'button' | 'div' = d.href ? 'a' : d.onClick ? 'button' : 'div'
          return (
            <Row key={d.key}
                 {...(d.href ? { href: d.href, target: '_blank', rel: 'noreferrer' } : {})}
                 {...(d.onClick ? { type: 'button' as const, onClick: d.onClick } : {})}
                 className={cn(
                   'group flex w-full items-start gap-3 py-3.5 text-left',
                   i < docs.length - 2 && 'border-b border-[var(--mor-rule)]',
                   ready ? 'cursor-pointer' : 'cursor-default',
                 )}>
              <span className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[9px]',
                ready ? 'bg-[var(--mor-wash)] text-foreground' : 'text-muted-foreground/60',
              )}>
                {ready ? <d.icon className="size-4" /> : <Hourglass className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[13.5px] font-medium',
                                    !ready && 'text-muted-foreground')}>
                  {d.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                  {ready ? d.sub : d.pending}
                </span>
              </span>
              {ready && (
                <Download className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </Row>
          )
        })}
      </div>
    </section>
  )
}
