'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Lock, CheckCircle2, Download, CreditCard, ArrowRight, ShieldCheck, Users } from 'lucide-react'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

// ---------- formatting ----------
const money = (n: number | null | undefined) =>
  n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE')}`
const compact = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))

// Deterministic gradient + initials — avatar fallback when a creator has no photo.
const AV_GRADIENTS = [
  'from-violet-500 to-fuchsia-500', 'from-sky-500 to-indigo-500', 'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-cyan-500 to-blue-500',
]
const avatarFor = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const initials = (seed || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
  return { grad: AV_GRADIENTS[h % AV_GRADIENTS.length], initials }
}

function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/followinglogo.svg" alt="Following" className={`${className} block dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Following Logo Dark Mode.svg" alt="Following" className={`${className} hidden dark:block`} />
    </>
  )
}

// Quiet status — a dot + label, never a loud pill.
function Status({ tone = 'muted', children }: { tone?: 'muted' | 'done' | 'wait'; children: React.ReactNode }) {
  const dot = tone === 'done' ? 'bg-emerald-500' : tone === 'wait' ? 'bg-amber-500' : 'bg-muted-foreground/50'
  const text = tone === 'done' ? 'text-emerald-600 dark:text-emerald-500'
    : tone === 'wait' ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{children}
    </span>
  )
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{children}</div>
)

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

// One numbered step in the get-started flow.
function Step({ n, done, title, children }: { n: string; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-x-5 sm:gap-x-8 border-t border-border py-10">
      <div className={`text-2xl font-light tabular-nums leading-none pt-0.5 transition-colors ${done ? 'text-primary' : 'text-muted-foreground/40'}`}>{n}</div>
      <div>
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-medium tracking-tight">{title}</h3>
          {done && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
        <div className="mt-5 space-y-3">{children}</div>
      </div>
    </div>
  )
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function PublicProposalPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('overview')
  const sections = useRef<Record<string, HTMLElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch(`${PUBLIC}/${token}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(e.detail || 'Unable to load proposal')
      }
      setData((await res.json()).data)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  useEffect(() => {
    if (!data) return
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    Object.values(sections.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [data])

  // The calm loading screen (kept — this is the moment that feels right).
  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-5 text-muted-foreground">
        <Logo className="h-7 w-auto opacity-90" />
        <div className="flex items-center gap-2 text-sm">
          <motion.span className="h-1.5 w-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
          Preparing your proposal
        </div>
      </div>
    </div>
  )
  if (err) return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <Logo className="h-6 w-auto mx-auto" />
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border"><Lock className="h-5 w-5 text-muted-foreground" /></div>
        <div className="font-medium">This link isn’t available</div>
        <p className="text-sm text-muted-foreground">{err}</p>
      </div>
    </div>
  )
  if (!data) return null

  const { proposal, gate, agreement, advance_invoice, influencers, invoices } = data
  const schedule = proposal?.payment_schedule || []
  const total = gate?.total_influencers ?? influencers.length
  const shown = gate?.shown ?? influencers.filter((i: any) => !i.locked).length
  const lockedCount = Math.max(0, total - shown)
  const hasGate = !gate?.unlocked
  const noInfluencers = total === 0 // commercial-first — creators curated + revealed after payment

  const navItems = [
    { id: 'overview', label: 'Overview' },
    ...(hasGate ? [{ id: 'unlock', label: 'Get started' }] : []),
    { id: 'creators', label: 'Creators' },
    ...((schedule.length || invoices?.length) ? [{ id: 'payment', label: 'Payment' }] : []),
  ]
  const setRef = (id: string) => (el: HTMLElement | null) => { sections.current[id] = el }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center">
          <Logo className="h-6 w-auto" />
          <nav className="ml-auto hidden md:flex items-center gap-6">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`text-sm transition-colors ${active === n.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto md:ml-8">
            {gate?.unlocked
              ? <Status tone="done">Full access</Status>
              : noInfluencers ? <Status>Step 1 of 2</Status> : <Status>{shown} of {total} unlocked</Status>}
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section id="overview" ref={setRef('overview')}>
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24">
          <Reveal><Eyebrow>Campaign proposal</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-6 text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.02]">
              {proposal.campaign_name || proposal.title}
            </h1>
          </Reveal>
          {proposal.description && (
            <Reveal delay={0.12}>
              <p className="mt-7 text-lg sm:text-xl text-muted-foreground leading-relaxed">{proposal.description}</p>
            </Reveal>
          )}
          <Reveal delay={0.18}>
            <div className="mt-10 flex items-center gap-5">
              <Button size="lg" className="gap-2 rounded-full px-6"
                onClick={() => scrollTo(hasGate ? 'unlock' : 'creators')}>
                {hasGate ? 'Get started' : 'View the creators'} <ArrowRight className="h-4 w-4" />
              </Button>
              {(proposal.total != null || advance_invoice?.amount_aed != null) && (
                <div className="text-sm text-muted-foreground">
                  {proposal.total != null
                    ? <><span className="text-foreground font-medium">{money(proposal.total)}</span> campaign value</>
                    : <><span className="text-foreground font-medium">{money(advance_invoice.amount_aed)}</span> advance</>}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- get started (gate) ---------- */}
      {hasGate && (
        <section id="unlock" ref={setRef('unlock')} className="border-t border-border scroll-mt-16">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
            <Reveal>
              <Eyebrow>Get started</Eyebrow>
              <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">Two steps to begin</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {noInfluencers
                  ? 'Confirm the agreement and advance to kick off your campaign. Your curated creator lineup is revealed — in full, with pricing — once your advance is confirmed.'
                  : `You’re previewing ${shown} of ${total} creators. Once the agreement is in place and the advance is settled, all ${lockedCount} remaining creators are revealed with full pricing.`}
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="mt-10">
                <Step n="01" done={!!gate.agreement_signed} title="Agreement">
                  {gate.agreement_signed ? (
                    <>
                      <Status tone="done">Signed by both parties</Status>
                      {agreement?.file_url && (
                        <a href={agreement.file_url} target="_blank" rel="noreferrer" className="block">
                          <Button variant="outline" className="gap-2 rounded-full"><Download className="h-4 w-4" />Download agreement</Button>
                        </a>
                      )}
                    </>
                  ) : agreement?.file_url ? (
                    <>
                      <Status tone="wait">Awaiting your signature</Status>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Download the agreement, sign it, and email the signed copy back to us — we’ll update the status here once it’s received.
                      </p>
                      <a href={agreement.file_url} target="_blank" rel="noreferrer" className="block">
                        <Button className="gap-2 rounded-full"><Download className="h-4 w-4" />Download to sign</Button>
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">The agreement will appear here shortly.</p>
                  )}
                </Step>

                <Step n="02" done={!!gate.advance_paid} title="Advance payment">
                  {advance_invoice ? (
                    gate.advance_paid ? (
                      <Status tone="done">Payment received</Status>
                    ) : (
                      <>
                        {advance_invoice.amount_aed != null && (
                          <div className="text-3xl font-semibold tracking-tight">
                            {money(advance_invoice.amount_aed)}
                            {advance_invoice.payment_terms && <span className="ml-2 text-sm font-normal text-muted-foreground">{advance_invoice.payment_terms}</span>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {advance_invoice.invoice_file_url && (
                            <a href={advance_invoice.invoice_file_url} target="_blank" rel="noreferrer">
                              <Button className="gap-2 rounded-full"><Download className="h-4 w-4" />Download invoice</Button>
                            </a>
                          )}
                          {advance_invoice.payment_link_url && (
                            <a href={advance_invoice.payment_link_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" className="gap-2 rounded-full"><CreditCard className="h-4 w-4" />Pay online</Button>
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                          The invoice includes our bank-transfer &amp; cheque details. Prefer a payment link? Just let your account manager know.
                        </p>
                      </>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">The advance invoice will appear here shortly.</p>
                  )}
                </Step>
                <div className="border-t border-border" />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />Handled securely. Your details are never shared.
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- creators ---------- */}
      <section id="creators" ref={setRef('creators')} className="border-t border-border scroll-mt-16">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <Reveal>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <Eyebrow>The lineup</Eyebrow>
                <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">Your creators</h2>
              </div>
              {gate?.unlocked
                ? <Status tone="done">{noInfluencers ? 'Being finalized' : 'Full list unlocked'}</Status>
                : noInfluencers ? <Status>Curated after payment</Status> : <Status>{lockedCount} locked</Status>}
            </div>
          </Reveal>

          {noInfluencers ? (
            <Reveal delay={0.06}>
              <div className="mt-16 flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-border">
                  {gate?.unlocked ? <Users className="h-6 w-6 text-muted-foreground" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <p className="mt-6 text-xl font-medium tracking-tight">
                  {gate?.unlocked ? 'Your lineup is being finalized' : 'Your lineup is being curated'}
                </p>
                <p className="mt-2 max-w-md text-muted-foreground leading-relaxed">
                  {gate?.unlocked
                    ? 'Your advance is confirmed — your creators will appear here shortly as we finalize the lineup.'
                    : 'We’re hand-picking creators for this campaign. They’re revealed here in full, with pricing, once your advance is confirmed.'}
                </p>
                {hasGate && (
                  <Button onClick={() => scrollTo('unlock')} className="mt-7 gap-2 rounded-full"><ArrowRight className="h-4 w-4" />Get started</Button>
                )}
              </div>
            </Reveal>
          ) : (
            <>
              <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {influencers.map((inf: any, idx: number) => {
                  const { grad, initials } = avatarFor(inf.username || inf.full_name || '?')
                  return (
                    <Reveal key={inf.id} delay={Math.min(idx * 0.035, 0.28)}>
                      {inf.locked ? (
                        <div className="relative overflow-hidden rounded-xl border border-border h-full">
                          <div className="p-5 select-none blur-md pointer-events-none">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-full bg-muted" />
                              <div className="space-y-2"><div className="h-3.5 w-24 rounded bg-muted" /><div className="h-3 w-16 rounded bg-muted" /></div>
                            </div>
                            <div className="mt-4 h-3 w-28 rounded bg-muted" />
                          </div>
                          <div className="absolute inset-0 grid place-items-center bg-background/50">
                            <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background/80"><Lock className="h-4 w-4 text-muted-foreground" /></div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border p-5 h-full transition-colors hover:border-foreground/20">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={inf.profile_image_url || undefined} alt={inf.username || ''} />
                              <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-sm font-bold`}>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">@{inf.username || '—'}</div>
                              {inf.full_name && <div className="text-sm text-muted-foreground truncate">{inf.full_name}</div>}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{inf.followers_count ? `${compact(inf.followers_count)} followers` : '—'}</span>
                            {inf.sell_price != null && <span className="font-medium">{money(inf.sell_price)}</span>}
                          </div>
                        </div>
                      )}
                    </Reveal>
                  )
                })}
              </div>

              {hasGate && lockedCount > 0 && (
                <Reveal delay={0.1}>
                  <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-8 text-center sm:text-left">
                    <div>
                      <div className="font-medium">{lockedCount} more {lockedCount === 1 ? 'creator' : 'creators'} in the full list</div>
                      <p className="text-sm text-muted-foreground">Complete the two steps to reveal everyone with pricing.</p>
                    </div>
                    <Button onClick={() => scrollTo('unlock')} className="gap-2 rounded-full shrink-0"><ArrowRight className="h-4 w-4" />Get started</Button>
                  </div>
                </Reveal>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------- payment ---------- */}
      {(schedule.length > 0 || (invoices && invoices.length > 0)) && (
        <section id="payment" ref={setRef('payment')} className="border-t border-border scroll-mt-16">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
            <Reveal>
              <Eyebrow>Transparent pricing</Eyebrow>
              <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">Payment plan</h2>
            </Reveal>

            {schedule.length > 0 && (
              <Reveal delay={0.05}>
                <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
                  {schedule.map((m: any, i: number) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">{m.pct}%</span>
                      <span className="text-sm text-muted-foreground">{m.label}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {invoices && invoices.length > 0 && (
              <Reveal delay={0.08}>
                <div className="mt-12">
                  {invoices.map((inv: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 border-t border-border py-4">
                      <div className="min-w-0">
                        <div className="font-medium capitalize truncate">{inv.milestone_label || inv.invoice_type}</div>
                        {inv.amount_aed != null && <div className="text-sm text-muted-foreground">{money(inv.amount_aed)}</div>}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {inv.status === 'paid' ? <Status tone="done">Paid</Status>
                          : inv.status === 'partial' ? <Status tone="wait">Partial</Status>
                          : <Status>Unpaid</Status>}
                        {inv.invoice_file_url && (
                          <a href={inv.invoice_file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />Invoice
                          </a>
                        )}
                        {inv.status !== 'paid' && inv.payment_link_url && (
                          <a href={inv.payment_link_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Pay online</a>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border" />
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ---------- footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo className="h-5 w-auto opacity-80" />
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Private &amp; confidential — shared only with you.</div>
        </div>
      </footer>
    </div>
  )
}
