'use client'

/**
 * Paying a creator: the form.
 *
 * Everything here is something the brand has ALREADY agreed with the creator. We are not
 * negotiating, we are recording, and the form should feel like writing it down rather than
 * filling anything in. So: one column, one question at a time, and no field asked for twice.
 *
 * THE FEE IS THE HINGE. The moment a number lands in it we quote the real total from the
 * server, including whether a fee waiver covers this one. That price is never computed in the
 * browser - a total assembled here and a total assembled on the invoice would eventually
 * disagree, and the client would be right and we would be wrong.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, CreditCard, Landmark, Plus, ShieldCheck, X } from 'lucide-react'
import { morPaymentsApi, aed, type MorQuote } from '@/services/morPaymentsApi'
import { BillingDetailsDialog, needsBillingDetails } from '@/components/mor/BillingDetailsDialog'
import { cn } from '@/lib/utils'

const TOKENS = `
  .mor-scope {
    --mor-lime: oklch(0.9354 0.2254 121.4851);
    --mor-lime-ink: oklch(0.2046 0 0);
    --mor-rule: color-mix(in oklch, var(--border) 70%, transparent);
  }
  .mor-choice { transition: border-color 160ms cubic-bezier(0.22,1,0.36,1), background-color 160ms cubic-bezier(0.22,1,0.36,1); }
  .mor-total-in { animation: morTotal 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  @keyframes morTotal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .mor-total-in { animation: none; } }
`

type Deliverable = { what: string; quantity: number }

export default function NewMorPaymentPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <NewPaymentForm />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function NewPaymentForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [deliverables, setDeliverables] = useState<Deliverable[]>([{ what: '', quantity: 1 }])
  const [dates, setDates] = useState('')
  const [usage, setUsage] = useState('')
  const [fee, setFee] = useState('')

  const [quote, setQuote] = useState<MorQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [method, setMethod] = useState<'card' | 'transfer' | null>('transfer')
  const [saving, setSaving] = useState(false)
  /* Their invoice details, asked for at the first lock and never again. Held here rather than
     inside the dialog so the order they were halfway through is not lost: the form appears,
     they fill it in, and the lock they already asked for carries on by itself. */
  const [askBilling, setAskBilling] = useState(false)


  const feeNumber = Number(fee.replace(/,/g, ''))
  const feeValid = Number.isFinite(feeNumber) && feeNumber > 0
  // The email is required now, because WE send the agreement rather than the brand pasting
  // a link into a DM. No email means no way to contract or pay this creator.
  const ready = name.trim().length > 0 && feeValid && !!method && email.trim().length > 0

  /* Quote on a pause in typing, not on every keystroke: a total that flickers while somebody
     is still typing the thousands reads as the price changing on them. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!feeValid) { setQuote(null); return }
    setQuoting(true)
    timer.current = setTimeout(async () => {
      try {
        const r = await morPaymentsApi.quote(feeNumber)
        setQuote(r.data)
      } catch {
        setQuote(null)   // a failed quote shows nothing rather than a number we cannot stand behind
      } finally {
        setQuoting(false)
      }
    }, 420)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [feeNumber, feeValid])

  const setDeliverable = useCallback((i: number, patch: Partial<Deliverable>) => {
    setDeliverables((prev) => prev.map((d, n) => (n === i ? { ...d, ...patch } : d)))
  }, [])

  const submit = async () => {
    if (!ready || !method) return
    // Asked before anything is created, so a brand who closes the form has not left a
    // half-made order behind them.
    if (await needsBillingDetails()) { setAskBilling(true); return }
    setSaving(true)
    try {
      const created = await morPaymentsApi.create({
        creator_name: name.trim(),
        creator_handle: handle.trim() || undefined,
        creator_email: email.trim() || undefined,
        creator_whatsapp: whatsapp.trim() || undefined,
        deliverables: deliverables.filter((d) => d.what.trim()),
        posting_dates: dates.trim() || undefined,
        usage_terms: usage.trim() || undefined,
        creator_fee_aed: feeNumber,
      })
      await morPaymentsApi.submit(created.data.id, method)
      router.push(`/mor/${created.data.id}`)
    } catch (e) {
      toast.error((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="mor-scope mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8 sm:py-16">
      <style>{TOKENS}</style>

      <BillingDetailsDialog
        open={askBilling}
        onCancel={() => setAskBilling(false)}
        onSaved={() => { setAskBilling(false); void submit() }}
      />

      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/mor')}>
        <ArrowLeft className="size-4" />Merchant of Record
      </Button>

      <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.02em]">
        Pay a creator
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-muted-foreground">
        Tell us what you have already agreed with them. We contract them on exactly this, so
        anything left out is hard to add once it is signed.
      </p>

      {/* Who */}
      <section className="mt-14">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          The creator
        </h2>
        <div className="mt-6 space-y-6">
          <Field label="Name" hint="As it should read on the agreement.">
            <Input value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Esraa Waly" autoComplete="off" />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Instagram handle">
              <Input value={handle} onChange={(e) => setHandle(e.target.value)}
                     placeholder="@esraawalyofficial" autoComplete="off" />
            </Field>
            <Field label="WhatsApp">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                     placeholder="+971 50 000 0000" inputMode="tel" autoComplete="off" />
            </Field>
          </div>
          <Field label="Email" hint="Where we send the agreement.">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="name@example.com" autoComplete="off" />
          </Field>
        </div>
      </section>

      {/* What */}
      <section className="mt-16">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          What they are making
        </h2>
        <div className="mt-6 space-y-3">
          {deliverables.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                value={d.what}
                onChange={(e) => setDeliverable(i, { what: e.target.value })}
                placeholder={i === 0 ? 'Reel, 30 to 45 seconds' : 'Another deliverable'}
                className="flex-1"
                autoComplete="off"
              />
              <Input
                type="number" min={1} value={d.quantity}
                onChange={(e) => setDeliverable(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="w-20 tabular-nums"
                aria-label="How many"
              />
              {deliverables.length > 1 && (
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"
                        onClick={() => setDeliverables((p) => p.filter((_, n) => n !== i))}
                        aria-label="Remove this deliverable">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
                  onClick={() => setDeliverables((p) => [...p, { what: '', quantity: 1 }])}>
            <Plus className="size-4" />Add another
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          <Field label="When they are posting" hint="Dates, or a window you have agreed.">
            <Input value={dates} onChange={(e) => setDates(e.target.value)}
                   placeholder="Week of 6 October" autoComplete="off" />
          </Field>
          <Field label="Usage rights and anything else"
                 hint="Exclusivity, whitelisting, how long you may run the content as an ad.">
            <Textarea value={usage} onChange={(e) => setUsage(e.target.value)} rows={3}
                      placeholder="Paid usage on Meta for 60 days from posting." />
          </Field>
        </div>
      </section>

      {/* Money */}
      <section className="mt-16">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          The fee
        </h2>
        <div className="mt-6">
          <Field
            label="What you agreed to pay them"
            hint="Final and all in. It is taken to include their own taxes and costs, and nothing can be added to it later."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">
                AED
              </span>
              <Input
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="10,000"
                inputMode="decimal"
                className="pl-[3.25rem] text-[15px] tabular-nums"
                autoComplete="off"
              />
            </div>
          </Field>
        </div>

        {quoting && !quote && (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-6 w-40" />
          </div>
        )}
        {quote && <Cost quote={quote} />}
      </section>

      {/* How they pay */}
      {quote && (
        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            How you would like to pay
          </h2>
          <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-muted-foreground">
            We pay the creator once your payment has cleared, so the sooner it is settled the
            sooner we can lock their dates.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Choice
              icon={CreditCard} title="Pay by card"
              body="We are building this. Bank transfer for now."
              selected={false} onSelect={() => {}} soon
            />
            <Choice
              icon={Landmark} title="Send me an invoice"
              body="We invoice you, you transfer, we pay the creator."
              selected={method === 'transfer'} onSelect={() => setMethod('transfer')}
            />
          </div>
        </section>
      )}

      <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-[var(--mor-rule)] pt-8">
        <Button onClick={submit} disabled={!ready || saving} className="min-w-[180px]">
          {saving ? 'Setting it up…'
            : method === 'card' ? 'Confirm and pay'
            : method === 'transfer' ? 'Confirm and invoice me'
            : 'Confirm'}
        </Button>
        {!ready && (
          <p className="text-[13px] text-muted-foreground">
            {!name.trim() ? 'We need the creator’s name.'
              : !feeValid ? 'We need the fee you agreed.'
              : !email.trim() ? 'We need their email so we can send them the agreement.'
              : 'Choose how you would like to pay.'}
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <Label className="text-[13.5px] font-medium">{label}</Label>
      {hint && (
        <p className="mt-1.5 max-w-[56ch] text-[12.5px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

/* The price, in the order an invoice reads it. The waived fee is shown struck through rather
   than hidden: a discount nobody can see is a discount nobody values. */
function Cost({ quote }: { quote: MorQuote }) {
  return (
    <div className="mor-total-in mt-8 rounded-[14px] border border-[var(--mor-rule)] px-6 py-5">
      <Line label="Creator’s fee" value={aed(quote.creator_fee_aed)} />
      <Line
        label="Our Merchant of Record fee"
        value={
          quote.fee_waived ? (
            <span className="inline-flex items-center gap-2.5">
              <span className="text-muted-foreground line-through">{quote.standard_fee_pct}%</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                style={{ background: 'var(--mor-lime)', color: 'var(--mor-lime-ink)' }}
              >
                <ShieldCheck className="size-3" aria-hidden />Waived
              </span>
            </span>
          ) : (
            `${aed(quote.our_fee_aed)}  ·  ${quote.our_fee_pct}%`
          )
        }
      />
      <Line label={quote.vat_label} value={aed(quote.vat_aed)} />
      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--mor-rule)] pt-4">
        <span className="text-[14px] font-medium">Total</span>
        <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
          {aed(quote.total_aed)}
        </span>
      </div>
      {quote.fee_waived && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          VAT still applies. The waiver takes off our fee, not the tax.
        </p>
      )}
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

function Choice({ icon: Icon, title, body, selected, onSelect, soon }: {
  icon: React.ComponentType<{ className?: string }>
  title: string; body: string; selected: boolean; onSelect: () => void; soon?: boolean
}) {
  /* `soon` shows the option and refuses it. Removing card altogether would say we do not take
     cards; showing it greyed says we are building it, and only one of those is true. */
  return (
    <button
      type="button"
      onClick={soon ? undefined : onSelect}
      disabled={soon}
      aria-pressed={selected}
      className={cn(
        'mor-choice relative rounded-[14px] border px-5 py-5 text-left',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        soon
          ? 'cursor-default border-dashed border-[var(--mor-rule)] opacity-60'
          : selected
            ? 'border-foreground/45 bg-muted/50'
            : 'border-[var(--mor-rule)] hover:border-foreground/25 hover:bg-muted/30',
      )}
    >
      {soon && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Coming soon
        </span>
      )}
      <Icon className={cn('size-[18px]', selected && !soon ? 'text-foreground' : 'text-muted-foreground')} />
      <div className="mt-3 text-[14.5px] font-medium tracking-[-0.01em]">{title}</div>
      <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{body}</div>
    </button>
  )
}
