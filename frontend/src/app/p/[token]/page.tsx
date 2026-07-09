'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Lock, CheckCircle2, FileText, CreditCard, Users, TrendingUp,
  Wallet, ArrowRight, ShieldCheck, Download, Clock,
} from 'lucide-react'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

// ---------- formatting helpers ----------
const money = (n: number | null | undefined) =>
  n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE')}`
const compact = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))

// Deterministic gradient + initials — used only as an avatar fallback when there's no photo.
const AV_GRADIENTS = [
  'from-violet-500 to-fuchsia-500', 'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500', 'from-cyan-500 to-blue-500',
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

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
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

  // scrollspy for the sticky section nav
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

  const previewReach = useMemo(() => {
    if (!data) return 0
    return (data.influencers || []).filter((i: any) => !i.locked)
      .reduce((s: number, i: any) => s + (Number(i.followers_count) || 0), 0)
  }, [data])

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
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
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-3">
        <Logo className="h-6 w-auto mx-auto" />
        <Lock className="h-7 w-7 mx-auto text-muted-foreground" />
        <div className="font-semibold">This link isn’t available</div>
        <p className="text-sm text-muted-foreground">{err}</p>
      </CardContent></Card>
    </div>
  )
  if (!data) return null

  const { proposal, gate, agreement, advance_invoice, influencers, invoices } = data
  const schedule = proposal?.payment_schedule || []
  const total = gate?.total_influencers ?? influencers.length
  const shown = gate?.shown ?? influencers.filter((i: any) => !i.locked).length
  const lockedCount = Math.max(0, total - shown)
  const hasGate = !gate?.unlocked
  const noInfluencers = total === 0 // commercial-first share — creators curated + revealed after payment
  const stepsDone = (gate?.agreement_signed ? 1 : 0) + (gate?.advance_paid ? 1 : 0)

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'creators', label: 'Creators' },
    ...(hasGate ? [{ id: 'unlock', label: 'Unlock' }] : []),
    ...((schedule.length || (invoices?.length)) ? [{ id: 'payment', label: 'Payment' }] : []),
  ]
  const setRef = (id: string) => (el: HTMLElement | null) => { sections.current[id] = el }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================= STICKY NAV ================= */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center gap-4">
          <Logo className="h-6 w-auto" />
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${active === n.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto md:ml-0">
            {gate?.unlocked ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Full access</Badge>
            ) : noInfluencers ? (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Step 1 of 2</Badge>
            ) : (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />{shown} of {total} unlocked</Badge>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="overview" ref={setRef('overview')} className="relative overflow-hidden border-b">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <Reveal>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Campaign proposal</div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-4 text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
              {proposal.campaign_name || proposal.title}
            </h1>
          </Reveal>
          {proposal.description && (
            <Reveal delay={0.1}>
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">{proposal.description}</p>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {hasGate ? (
                <Button size="lg" onClick={() => scrollTo('unlock')} className="gap-2">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => scrollTo('creators')} className="gap-2">
                  View the creators <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {!noInfluencers && (
                <Button size="lg" variant="outline" onClick={() => scrollTo('creators')} className="gap-2">
                  <Users className="h-4 w-4" />See the lineup
                </Button>
              )}
            </div>
          </Reveal>

          {/* stat strip */}
          <Reveal delay={0.2}>
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border bg-border">
              {[
                { icon: Users, label: 'Creators', value: noInfluencers ? 'Soon' : String(total), sub: noInfluencers ? 'curated after payment' : `${shown} shown now` },
                { icon: TrendingUp, label: 'Preview reach', value: noInfluencers ? '—' : compact(previewReach), sub: noInfluencers ? 'revealed after payment' : 'across shown creators' },
                { icon: Wallet, label: 'Campaign value', value: proposal.total != null ? money(proposal.total) : '—', sub: 'total' },
                { icon: CreditCard, label: 'Payment milestones', value: String(schedule.length || (invoices?.length || 0)), sub: 'flexible schedule' },
              ].map((s, i) => (
                <div key={i} className="bg-card p-5">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= UNLOCK GATE ================= */}
      {hasGate && (
        <section id="unlock" ref={setRef('unlock')} className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
          <Reveal>
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-primary"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">1</span>Step 1 — Agreement &amp; advance</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Confirm the agreement and advance</h2>
              <p className="mt-2 text-muted-foreground">
                {noInfluencers ? (
                  <>Complete these two steps to kick off your campaign — once your advance is confirmed, your curated creator lineup is revealed with full pricing.</>
                ) : (
                  <>You’re previewing <strong className="text-foreground">{shown}</strong> of <strong className="text-foreground">{total}</strong> creators.
                  Once the agreement is in place and the advance is settled, all {lockedCount} remaining creators are revealed with full pricing.</>
                )}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="mt-8 overflow-hidden">
              <CardContent className="p-0">
                {/* progress */}
                <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(stepsDone / 2) * 100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">{stepsDone}/2 complete</span>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                  {/* STEP 1 — agreement (superadmin-controlled; no in-app signing) */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <StepDot done={gate.agreement_signed} n={1} />
                      <div>
                        <div className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Agreement</div>
                        <div className="text-xs text-muted-foreground">The campaign agreement</div>
                      </div>
                    </div>

                    {gate.agreement_signed ? (
                      <>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Signed by both parties</Badge>
                        {agreement?.file_url && (
                          <a href={agreement.file_url} target="_blank" rel="noreferrer" className="block">
                            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Download agreement</Button>
                          </a>
                        )}
                      </>
                    ) : agreement?.file_url ? (
                      <>
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="h-3 w-3" />Awaiting your signature</Badge>
                        <p className="text-sm text-muted-foreground">
                          Please download the agreement, sign it, and email the signed copy back to us. We’ll update the status here once it’s received.
                        </p>
                        <a href={agreement.file_url} target="_blank" rel="noreferrer" className="block">
                          <Button className="gap-2"><Download className="h-4 w-4" />Download to sign</Button>
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">The agreement will appear here shortly.</p>
                    )}
                  </div>

                  {/* STEP 2 — advance */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <StepDot done={gate.advance_paid} n={2} />
                      <div>
                        <div className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Advance payment</div>
                        <div className="text-xs text-muted-foreground">Secures the campaign</div>
                      </div>
                    </div>
                    {advance_invoice ? (
                      <>
                        {advance_invoice.amount_aed != null && (
                          <div className="text-2xl font-semibold tracking-tight">
                            {money(advance_invoice.amount_aed)}
                            {advance_invoice.payment_terms && <span className="ml-2 text-sm font-normal text-muted-foreground">{advance_invoice.payment_terms}</span>}
                          </div>
                        )}
                        {gate.advance_paid ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Payment received</Badge>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {advance_invoice.invoice_file_url && (
                                <a href={advance_invoice.invoice_file_url} target="_blank" rel="noreferrer">
                                  <Button className="gap-2"><Download className="h-4 w-4" />Download invoice</Button>
                                </a>
                              )}
                              {advance_invoice.payment_link_url && (
                                <a href={advance_invoice.payment_link_url} target="_blank" rel="noreferrer">
                                  <Button variant="outline" className="gap-2"><CreditCard className="h-4 w-4" />Pay online</Button>
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              The invoice includes our bank-transfer &amp; cheque details. Prefer a payment link? Just let your account manager know.
                            </p>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">The advance invoice will appear here shortly.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />Payments are handled securely. Your details are never shared.
            </div>
          </Reveal>
        </section>
      )}

      {/* ================= CREATORS ================= */}
      <section id="creators" ref={setRef('creators')} className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16 border-t">
        <Reveal>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">2</span>Step 2 — Your creators</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Creators in this campaign</h2>
            </div>
            {gate?.unlocked
              ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />{noInfluencers ? 'Being finalized' : 'Full list unlocked'}</Badge>
              : noInfluencers
                ? <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Curated after payment</Badge>
                : <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />{lockedCount} locked</Badge>}
          </div>
        </Reveal>

        {noInfluencers ? (
          <Reveal delay={0.05}>
            <Card className="mt-8 border-dashed">
              <CardContent className="p-10 text-center flex flex-col items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full border bg-muted/40">
                  {gate?.unlocked ? <Users className="h-5 w-5 text-muted-foreground" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="text-lg font-semibold">
                  {gate?.unlocked ? 'Your lineup is being finalized' : 'Your curated creator lineup is being prepared'}
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                  {gate?.unlocked
                    ? 'Thanks — your advance is confirmed. Your creators will appear here shortly as we finalize the lineup.'
                    : 'We’re curating creators for this campaign. They’re revealed here in full — with pricing — once your advance is confirmed.'}
                </p>
                {hasGate && (
                  <Button onClick={() => scrollTo('unlock')} className="mt-1 gap-2"><Lock className="h-4 w-4" />Complete Step 1</Button>
                )}
              </CardContent>
            </Card>
          </Reveal>
        ) : (
        <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf: any, idx: number) => {
            const { grad, initials } = avatarFor(inf.username || inf.full_name || '?')
            return (
              <Reveal key={inf.id} delay={Math.min(idx * 0.04, 0.3)}>
                {inf.locked ? (
                  <Card className="relative overflow-hidden h-full">
                    <CardContent className="p-5">
                      <div className="select-none blur-md pointer-events-none">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-muted" />
                          <div className="space-y-2">
                            <div className="h-3.5 w-24 rounded bg-muted" />
                            <div className="h-3 w-16 rounded bg-muted" />
                          </div>
                        </div>
                        <div className="mt-4 h-3 w-28 rounded bg-muted" />
                      </div>
                      <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <div className="grid h-9 w-9 place-items-center rounded-full border bg-background/80"><Lock className="h-4 w-4" /></div>
                          <span className="text-xs font-medium">Locked</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={inf.profile_image_url || undefined} alt={inf.username || ''} />
                          <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-sm font-bold`}>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">@{inf.username || '—'}</div>
                          {inf.full_name && <div className="text-sm text-muted-foreground truncate">{inf.full_name}</div>}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {inf.followers_count ? `${compact(inf.followers_count)} followers` : '—'}
                        </div>
                        {inf.sell_price != null && (
                          <div className="text-sm font-semibold">{money(inf.sell_price)}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Reveal>
            )
          })}
        </div>

        {hasGate && lockedCount > 0 && (
          <Reveal delay={0.1}>
            <Card className="mt-6 border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <div className="font-semibold">{lockedCount} more {lockedCount === 1 ? 'creator' : 'creators'} in the full list</div>
                  <p className="text-sm text-muted-foreground">Complete the agreement and advance to reveal everyone with pricing.</p>
                </div>
                <Button onClick={() => scrollTo('unlock')} className="gap-2 shrink-0"><Lock className="h-4 w-4" />See how to unlock</Button>
              </CardContent>
            </Card>
          </Reveal>
        )}
        </>
        )}
      </section>

      {/* ================= PAYMENT ================= */}
      {(schedule.length > 0 || (invoices && invoices.length > 0)) && (
        <section id="payment" ref={setRef('payment')} className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16 border-t">
          <Reveal>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><Wallet className="h-4 w-4" />Transparent pricing</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your payment plan</h2>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {schedule.length > 0 && (
              <Reveal>
                <Card className="h-full"><CardContent className="p-6">
                  <div className="text-sm font-semibold mb-4">Milestones</div>
                  <ol className="relative border-l pl-6 space-y-5">
                    {schedule.map((m: any, i: number) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border bg-background">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.label}</span>
                          <Badge variant="outline">{m.pct}%</Badge>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent></Card>
              </Reveal>
            )}

            {invoices && invoices.length > 0 && (
              <Reveal delay={0.05}>
                <Card className="h-full"><CardContent className="p-6">
                  <div className="text-sm font-semibold mb-4">Invoices</div>
                  <div className="space-y-3">
                    {invoices.map((inv: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0">
                          <div className="font-medium capitalize truncate">{inv.milestone_label || inv.invoice_type}</div>
                          {inv.amount_aed != null && <div className="text-sm text-muted-foreground">{money(inv.amount_aed)}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {inv.status === 'paid'
                            ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>
                            : inv.status === 'partial'
                              ? <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>
                              : <Badge variant="outline">Unpaid</Badge>}
                          {inv.invoice_file_url && (
                            <a href={inv.invoice_file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                              <Download className="h-3 w-3" />Invoice
                            </a>
                          )}
                          {inv.status !== 'paid' && inv.payment_link_url && (
                            <a href={inv.payment_link_url} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline">Pay online</Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent></Card>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <Logo className="h-5 w-auto" />
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Private &amp; confidential — shared only with you.</div>
        </div>
      </footer>
    </div>
  )
}

function StepDot({ done, n }: { done: boolean; n: number }) {
  return done ? (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
      <CheckCircle2 className="h-4 w-4" />
    </span>
  ) : (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-primary/40 text-primary font-semibold text-sm">
      {n}
    </span>
  )
}
