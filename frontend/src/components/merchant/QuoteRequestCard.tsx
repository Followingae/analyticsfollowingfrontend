'use client'

/**
 * The "keep going" card after the trial: no prices, a quote instead.
 *
 * Founder decision, 18 Nov 2026. The merchant says what they want next, answers the
 * same three questions the website's contact form asks for that offering, leaves their
 * contact, and we email a quote within two business days. Three short steps that slide
 * inside one tile, then a quiet confirmation with a way back in to change the answers.
 *
 * The questions come from content/merchantQuoteQuestions.ts, word for word from the
 * marketing site, so the people writing quotes read one shape wherever the ask came from.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Camera, Gift, Loader2, Megaphone, Percent, Sparkles, Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  merchantApi, NotMerchantError,
  type QuoteAnswers, type QuoteRequest, type QuotePrefill,
} from '@/services/merchantApi'
import {
  quoteOfferingLabel, quoteOfferingPicker, quoteQuestionsFor, type QuoteField, type QuoteOffering,
} from '@/content/merchantQuoteQuestions'
import { Eyebrow } from './bits'
import { INPUT, TextInput, TextArea } from './wizard/ui'

/** What the merchant taps on the first screen. Managed is paid campaigns we run for them. */
type PickKey = QuoteOffering | 'managed'

const PICK: { key: PickKey; title: string; sub: string; icon: LucideIcon }[] = [
  { key: 'campaigns-barter', title: quoteOfferingLabel('campaigns-barter'), sub: 'Creators keep coming for what you offer', icon: Gift },
  { key: 'campaigns-paid', title: quoteOfferingLabel('campaigns-paid'), sub: 'Bigger names, with a budget you set', icon: Megaphone },
  { key: 'influencer-cashback', title: quoteOfferingLabel('influencer-cashback'), sub: 'Creators spend with you and earn some back', icon: Percent },
  { key: 'ugc', title: quoteOfferingLabel('ugc'), sub: 'Content made for your ads and channels', icon: Camera },
  { key: 'managed', title: 'Managed by Following', sub: 'We run it. You see the results.', icon: Sparkles },
]

const offeringFor = (k: PickKey): QuoteOffering => (k === 'managed' ? 'campaigns-paid' : k)

type Step = 0 | 1 | 2

export function QuoteRequestCard({ businessName }: { businessName?: string | null }) {
  const [loading, setLoading] = useState(true)
  const [sent, setSent] = useState<QuoteRequest | null>(null)
  const [prefill, setPrefill] = useState<QuotePrefill>({ contact_name: null, contact_email: null, contact_phone: null })
  const [editing, setEditing] = useState(false)

  const [step, setStep] = useState<Step>(0)
  const [dir, setDir] = useState(1)
  const [pick, setPick] = useState<PickKey | null>(null)
  const [answers, setAnswers] = useState<QuoteAnswers>({})
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const state = await merchantApi.getQuoteRequest()
      if (state?.prefill) setPrefill(state.prefill)
      if (state?.request) setSent(state.request)
    } catch {
      // A read that fails leaves the form, which is the useful thing to show either way.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Contact fields start from what we know. The merchant can type over any of them.
  useEffect(() => {
    setName((n) => n || prefill.contact_name || '')
    setEmail((e) => e || prefill.contact_email || '')
    setPhone((p) => p || prefill.contact_phone || '')
  }, [prefill])

  const go = (next: Step) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
    setError(null)
  }

  const reopen = () => {
    if (sent) {
      const managed = sent.answers?.managed === 'yes'
      setPick(managed ? 'managed' : ((sent.offering as QuoteOffering) || null))
      setAnswers(Object.fromEntries(Object.entries(sent.answers || {}).filter(([k]) => k !== 'managed')))
      setNotes(sent.notes || '')
      setName(sent.contact_name || prefill.contact_name || '')
      setEmail(sent.contact_email || prefill.contact_email || '')
      setPhone(sent.contact_phone || prefill.contact_phone || '')
    }
    setEditing(true)
    setDir(-1)
    setStep(0)
  }

  const offering = pick ? offeringFor(pick) : null
  const fields = useMemo<QuoteField[]>(() => (offering ? quoteQuestionsFor[offering] : []), [offering])

  const answered = useMemo(
    () => fields.every((f) => {
      if (f.type === 'text') return true
      const v = answers[f.id]
      return Array.isArray(v) ? v.length > 0 : !!v
    }) && fields.some((f) => {
      const v = answers[f.id]
      return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim())
    }),
    [fields, answers],
  )

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = async () => {
    if (!offering || sending) return
    setSending(true)
    setError(null)
    const body: QuoteAnswers = {}
    for (const f of fields) {
      const v = answers[f.id]
      if (Array.isArray(v) ? v.length : v && String(v).trim()) body[f.id] = v
    }
    if (pick === 'managed') body.managed = 'yes'
    try {
      const state = await merchantApi.submitQuoteRequest({
        offering,
        answers: body,
        notes: notes.trim() || undefined,
        contact_name: name.trim() || undefined,
        contact_email: email.trim(),
        contact_phone: phone.trim() || undefined,
      })
      if (state?.request) setSent(state.request)
      setEditing(false)
    } catch (e) {
      setError(e instanceof NotMerchantError ? 'Quotes are not switched on for this account yet.' : (e as Error).message || 'That did not go through')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <>
        <Eyebrow>Keep going</Eyebrow>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="mt-2 flex flex-1 flex-col gap-2.5">
          {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[58px] w-full rounded-[14px]" />)}
        </div>
      </>
    )
  }

  if (sent && !editing) {
    return <Sent request={sent} onChange={reopen} />
  }

  const heading = step === 0 ? quoteOfferingPicker.label : step === 1 ? PICK.find((p) => p.key === pick)?.title : 'Where should the quote go?'
  const lead = step === 0
    ? 'Tell us what you have in mind and we will send you a quote. No prices to pick from, nothing to pay today.'
    : step === 1
      ? 'Three quick questions so the quote fits.'
      : `We reply within two business days${businessName ? ` with a quote for ${businessName}` : ''}.`

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Eyebrow>Keep going</Eyebrow>
          <span className="text-[11px] tabular-nums text-muted-foreground">Step {step + 1} of 3</span>
        </div>
        <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{heading}</h2>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{lead}</p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -32 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pr-0.5"
          >
            {step === 0 && (
              <div role="radiogroup" aria-label={quoteOfferingPicker.label} className="flex flex-col gap-2">
                {PICK.map((p) => {
                  const selected = pick === p.key
                  const Icon = p.icon
                  return (
                    <button
                      key={p.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        if (pick !== p.key) setAnswers({})
                        setPick(p.key)
                        go(1)
                      }}
                      className={cn(
                        'flex w-full items-center gap-3.5 rounded-[14px] border bg-card px-4 py-3 text-left transition-colors',
                        selected ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-foreground text-background' : 'bg-muted text-foreground')}>
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold">{p.title}</span>
                        <span className="text-xs text-muted-foreground">{p.sub}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                {fields.map((f) => (
                  <QuestionField key={f.id} field={f} value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">Anything else we should know? Optional.</span>
                  <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dates, locations, what worked in the trial" className="min-h-[72px] text-sm" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">Your name</span>
                  <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-[42px] text-sm" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">Email for the quote</span>
                  <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="min-h-[42px] text-sm" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">Phone, if you would rather we call</span>
                  <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="min-h-[42px] text-sm" />
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2.5">
        {error ? <p className="m-0 text-xs text-destructive">{error}</p> : null}
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => go((step - 1) as Step)}
              className="inline-flex h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </button>
          ) : null}
          {step === 1 ? (
            <button
              type="button"
              disabled={!answered}
              onClick={() => go(2)}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Continue
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              disabled={!emailOk || sending}
              onClick={submit}
              className="inline-flex h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Send my requirements
            </button>
          ) : editing && sent ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-full border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
            >
              Keep my answers as they are
            </button>
          ) : null}
        </div>
        <span className="text-center text-xs text-muted-foreground">
          {step === 0 ? 'Pick one to start. You can change it at any point.' : step === 1 ? (answered ? 'Next, where the quote should go.' : 'Answer these to continue.') : 'Nothing is booked and nothing is charged. A person writes back.'}
        </span>
      </div>
    </>
  )
}

/* ── One question, three shapes ───────────────────────────────────────────── */

function QuestionField({ field, value, onChange }: { field: QuoteField; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  if (field.type === 'text') {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{field.label}</span>
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(INPUT, 'min-h-[42px] text-sm')}
        />
      </label>
    )
  }
  const multi = field.type === 'multi'
  const chosen = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{field.label}</span>
      <div role={multi ? 'group' : 'radiogroup'} aria-label={field.label} className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => {
          const selected = chosen.includes(opt)
          const toggle = () => {
            if (!multi) return onChange(opt)
            onChange(selected ? chosen.filter((c) => c !== opt) : [...chosen, opt])
          }
          return (
            <button
              key={opt}
              type="button"
              role={multi ? undefined : 'radio'}
              aria-pressed={multi ? selected : undefined}
              aria-checked={multi ? undefined : selected}
              onClick={toggle}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
                selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted/50',
              )}
            >
              {multi && selected ? <Check className="size-3.5" aria-hidden /> : null}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── After sending ────────────────────────────────────────────────────────── */

function Sent({ request, onChange }: { request: QuoteRequest; onChange: () => void }) {
  const managed = request.answers?.managed === 'yes'
  const label = managed ? 'Managed by Following' : request.offering_label || quoteOfferingLabel(request.offering)
  const quoted = request.status !== 'new'
  const when = new Date(request.created_at)
  const sentOn = Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Keep going</Eyebrow>
        <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-[-0.02em]">
          {quoted ? 'Your quote has been sent.' : 'Your quote is on its way.'}
        </h2>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {quoted
            ? `Check your inbox${request.contact_email ? ` at ${request.contact_email}` : ''}. Reply to it with any questions.`
            : 'We reply within two business days. Nothing is booked and nothing is charged until you say so.'}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
        <div className="flex items-center gap-3.5 rounded-[14px] border border-border bg-muted/30 px-4 py-3.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
            <Check className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">
              {sentOn ? `Requirements sent ${sentOn}` : 'Requirements sent'}
              {request.contact_email ? ` to ${request.contact_email}` : ''}
            </span>
          </span>
        </div>
        <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px]">
          {Object.entries(request.answers || {}).filter(([k]) => k !== 'managed').map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0">
              <dt className="m-0 shrink-0 text-muted-foreground">{labelFor(request.offering, k)}</dt>
              <dd className="m-0 truncate text-right font-medium">{Array.isArray(v) ? v.join(', ') : v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onChange}
          className="inline-flex h-[46px] items-center justify-center rounded-full border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
        >
          Change my answers
        </button>
        <span className="text-center text-xs text-muted-foreground">Changing them sends us a fresh set. We quote on the latest.</span>
      </div>
    </>
  )
}

function labelFor(offering: string, id: string): string {
  const fields = quoteQuestionsFor[offering as QuoteOffering] || []
  const f = fields.find((q) => q.id === id)
  if (f) return shortLabel(f.label)
  return id.replace(/_/g, ' ')
}

/** The question, trimmed to a dt-sized label. */
function shortLabel(label: string): string {
  const map: Record<string, string> = {
    'What can you offer a creator?': 'You can offer',
    'How many outlets or brands?': 'Outlets',
    'When would you want it running?': 'Timing',
    'What are you launching?': 'Launching',
    'Budget': 'Budget',
    'When does it go live?': 'Timing',
    'How many locations?': 'Locations',
    'What kind of place is it?': 'Kind of place',
    'Roughly what does a customer spend per visit?': 'Spend per visit',
    'How many assets do you need?': 'Assets',
    'Where will they run?': 'Runs on',
    'Do you need paid usage rights?': 'Paid usage rights',
  }
  return map[label] || label.replace(/\?$/, '')
}
