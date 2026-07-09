'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Lock, CheckCircle2, FileText, CreditCard, Sparkles, Users, TrendingUp,
  Wallet, ArrowRight, ShieldCheck,
} from 'lucide-react'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

// ---------- formatting helpers ----------
const money = (n: number | null | undefined) =>
  n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE')}`
const compact = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))

// Deterministic gradient + initials for a creator avatar (no photo in payload).
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

// ---------- small reveal wrapper ----------
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
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
  const [accepting, setAccepting] = useState(false)
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

  const acceptAgreement = async () => {
    setAccepting(true)
    try {
      const res = await fetch(`${PUBLIC}/${token}/accept-agreement`, { method: 'POST' })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed') }
      await load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setAccepting(false) }
  }

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
      <div className="flex items-center gap-3 text-muted-foreground">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Sparkles className="h-5 w-5" />
        </motion.div>
        Preparing your proposal…
      </div>
    </div>
  )
  if (err) return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-2">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
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
  const steps = (gate?.agreement_signed ? 1 : 0) + (gate?.advance_paid ? 1 : 0)
  const hasGate = !gate?.unlocked

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
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">F</span>
            <span>Following</span>
          </div>
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
            ) : (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />{shown} of {total} unlocked</Badge>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="overview" ref={setRef('overview')} className="relative overflow-hidden">
        {/* ambient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-10 right-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute top-0 left-1/2 h-40 w-[120%] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <Reveal>
            <Badge variant="outline" className="mb-5 gap-1 bg-background/60 backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" />Curated proposal, prepared for you
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-[1.05]">
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
              <Button size="lg" onClick={() => scrollTo('creators')} className="gap-2">
                Explore creators <ArrowRight className="h-4 w-4" />
              </Button>
              {hasGate && (
                <Button size="lg" variant="outline" onClick={() => scrollTo('unlock')} className="gap-2 bg-background/60 backdrop-blur">
                  <Lock className="h-4 w-4" />Unlock full list
                </Button>
              )}
            </div>
          </Reveal>

          {/* stat strip */}
          <Reveal delay={0.2}>
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Creators curated', value: String(total), sub: `${shown} previewing now` },
                { icon: TrendingUp, label: 'Combined reach (preview)', value: compact(previewReach), sub: 'across sample creators' },
                { icon: Wallet, label: 'Campaign value', value: proposal.total != null ? money(proposal.total) : '—', sub: 'total sell' },
                { icon: CreditCard, label: 'Payment milestones', value: String(schedule.length || (invoices?.length || 0)), sub: 'flexible schedule' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border bg-card/60 backdrop-blur p-5">
                  <s.icon className="h-5 w-5 text-primary" />
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
              <div className="flex items-center gap-2 text-sm font-medium text-primary"><Lock className="h-4 w-4" />Two steps to full access</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Unlock the complete influencer list</h2>
              <p className="mt-2 text-muted-foreground">
                You’re previewing <strong className="text-foreground">{shown}</strong> of <strong className="text-foreground">{total}</strong> creators.
                Sign the agreement and clear the advance to reveal all {lockedCount} remaining creators with full pricing.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="mt-8 overflow-hidden">
              <CardContent className="p-0">
                {/* progress */}
                <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(steps / 2) * 100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums">{steps}/2 complete</span>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                  {/* STEP 1 — agreement */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <StepDot done={gate.agreement_signed} n={1} />
                      <div>
                        <div className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Sign the agreement</div>
                        <div className="text-xs text-muted-foreground">Review and accept the campaign terms</div>
                      </div>
                    </div>
                    {agreement?.file_url && (
                      <a href={agreement.file_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" />View agreement document
                      </a>
                    )}
                    <div>
                      {gate.agreement_signed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Signed &amp; countersigned</Badge>
                      ) : agreement?.accepted_at ? (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Accepted — awaiting our countersign</Badge>
                      ) : agreement ? (
                        <Button disabled={accepting} onClick={acceptAgreement} className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />{accepting ? 'Submitting…' : 'Accept agreement'}
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">The agreement will appear here shortly.</p>
                      )}
                    </div>
                  </div>

                  {/* STEP 2 — advance */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <StepDot done={gate.advance_paid} n={2} />
                      <div>
                        <div className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Clear the advance</div>
                        <div className="text-xs text-muted-foreground">Secure the campaign with the advance payment</div>
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
                        ) : advance_invoice.payment_link_url ? (
                          <a href={advance_invoice.payment_link_url} target="_blank" rel="noreferrer">
                            <Button className="gap-2"><CreditCard className="h-4 w-4" />Pay advance securely</Button>
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">A secure payment link will be added shortly.</p>
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
              <ShieldCheck className="h-3.5 w-3.5" />Payments handled securely. Your details are never shared.
            </div>
          </Reveal>
        </section>
      )}

      {/* ================= CREATORS ================= */}
      <section id="creators" ref={setRef('creators')} className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary"><Users className="h-4 w-4" />The lineup</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Creators in this campaign</h2>
            </div>
            {gate?.unlocked
              ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Full list unlocked</Badge>
              : <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />{lockedCount} locked</Badge>}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf: any, idx: number) => (
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
                      <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${avatarFor(inf.username || inf.full_name || '?').grad} text-white text-sm font-bold`}>
                        {avatarFor(inf.username || inf.full_name || '?').initials}
                      </div>
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
          ))}
        </div>

        {hasGate && lockedCount > 0 && (
          <Reveal delay={0.1}>
            <Card className="mt-6 border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <div className="font-semibold">{lockedCount} more {lockedCount === 1 ? 'creator' : 'creators'} waiting</div>
                  <p className="text-sm text-muted-foreground">Complete the two quick steps to reveal the full curated list with pricing.</p>
                </div>
                <Button onClick={() => scrollTo('unlock')} className="gap-2 shrink-0"><Lock className="h-4 w-4" />Unlock now</Button>
              </CardContent>
            </Card>
          </Reveal>
        )}
      </section>

      {/* ================= PAYMENT ================= */}
      {(schedule.length > 0 || (invoices && invoices.length > 0)) && (
        <section id="payment" ref={setRef('payment')} className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
          <Reveal>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><Wallet className="h-4 w-4" />Transparent pricing</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Your payment plan</h2>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* schedule timeline */}
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

            {/* invoices */}
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
                          {inv.status !== 'paid' && inv.payment_link_url && (
                            <a href={inv.payment_link_url} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline">Pay</Button>
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
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-primary text-primary-foreground text-[10px] font-bold">F</span>
            Powered by Following
          </div>
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
