'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Lock, Check, FileSignature, CreditCard, Users, Download, ArrowRight,
  ShieldCheck, Sparkles, Wallet, CalendarClock,
} from 'lucide-react'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/proposals`

// ---------- formatting ----------
const money = (n: number | null | undefined) =>
  n == null ? null : `AED ${Number(n).toLocaleString('en-AE')}`
const compact = (n: number | null | undefined) =>
  n == null ? null : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n))

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

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

// A blurred, locked placeholder creator card. Builds anticipation for the lineup.
function GhostCard({ i }: { i: number }) {
  const { grad } = avatarFor(`ghost-${i}`)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="p-5 select-none blur-[6px] pointer-events-none">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${grad} opacity-70`} />
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="h-3 w-20 rounded-full bg-muted" />
          <div className="h-4 w-14 rounded-full bg-muted" />
        </div>
      </div>
      <div className="absolute inset-0 grid place-items-center bg-background/40">
        <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background/90 shadow-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
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

  // The calm loading screen (kept as-is).
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
  const unlocked = !!gate?.unlocked
  const noInfluencers = total === 0
  const agreementDone = !!gate?.agreement_signed
  const advanceDone = !!gate?.advance_paid
  const value = proposal.total ?? advance_invoice?.amount_aed ?? null

  // 3-stage progress tracker.
  const stages = [
    { key: 'agreement', label: 'Agreement', done: agreementDone },
    { key: 'advance', label: 'Advance', done: advanceDone },
    { key: 'creators', label: 'Creators', done: unlocked },
  ]
  const doneCount = stages.filter((s) => s.done).length

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center gap-4">
          <Logo className="h-6 w-auto" />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {stages.map((s) => (
                <span key={s.key} title={s.label}
                  className={`h-1.5 w-6 rounded-full ${s.done ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {unlocked ? 'Complete' : `${doneCount}/3`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* ---------- cover hero ---------- */}
        <section className="pt-8 sm:pt-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted">
              {proposal.cover_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proposal.cover_image_url} alt={proposal.campaign_name || 'Campaign'}
                    className="h-[46vh] min-h-[320px] w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="h-[38vh] min-h-[280px] w-full bg-gradient-to-br from-primary/25 to-primary/5" />
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${proposal.cover_image_url ? 'bg-white/15 text-white backdrop-blur' : 'bg-primary/10 text-primary'}`}>
                  <Sparkles className="h-3 w-3" />Campaign proposal
                </div>
                <h1 className={`mt-4 max-w-3xl text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.03] ${proposal.cover_image_url ? 'text-white' : ''}`}>
                  {proposal.campaign_name || proposal.title}
                </h1>
                {proposal.description && (
                  <p className={`mt-3 max-w-2xl text-sm sm:text-[15px] leading-relaxed ${proposal.cover_image_url ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {proposal.description}
                  </p>
                )}
              </div>
            </div>
          </Reveal>

          {/* ---------- stat + progress bar ---------- */}
          <Reveal delay={0.06}>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
              <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
                <Stat icon={Wallet} label="Campaign value" value={money(value) ?? 'On request'} />
                <Stat icon={Users} label="Creators" value={noInfluencers ? 'Reserved' : String(total)} />
                <Stat icon={CalendarClock} label="Milestones" value={String(schedule.length || invoices?.length || 1)} />
              </div>
              <div className="flex items-center justify-between gap-6 rounded-2xl border border-border bg-card px-5 py-4 sm:min-w-[240px]">
                <div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="text-lg font-semibold">{unlocked ? 'All set' : `${doneCount} of 3 done`}</div>
                </div>
                <div className="relative h-11 w-11">
                  <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(doneCount / 3) * 97.4} 97.4`} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums">{Math.round((doneCount / 3) * 100)}%</div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- get started ---------- */}
        {!unlocked && (
          <section id="unlock" className="pt-14 sm:pt-20 scroll-mt-20">
            <Reveal>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs">1</span>Get started
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">Two quick steps to kick off</h2>
            </Reveal>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {/* Agreement */}
              <Reveal delay={0.05}>
                <ActionCard n="1" done={agreementDone} icon={FileSignature} title="Agreement"
                  status={agreementDone ? { tone: 'done', text: 'Signed by both parties' }
                    : agreement?.file_url ? { tone: 'wait', text: 'Awaiting your signature' }
                    : { tone: 'idle', text: 'Coming shortly' }}>
                  {agreementDone ? (
                    agreement?.file_url && (
                      <a href={agreement.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="gap-2 rounded-xl"><Download className="h-4 w-4" />Download agreement</Button>
                      </a>
                    )
                  ) : agreement?.file_url ? (
                    <>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Download the agreement, sign it, and email the signed copy back to us. We’ll update the status here once it’s received.
                      </p>
                      <a href={agreement.file_url} target="_blank" rel="noreferrer">
                        <Button className="gap-2 rounded-xl"><Download className="h-4 w-4" />Download to sign</Button>
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Your agreement will appear here shortly.</p>
                  )}
                </ActionCard>
              </Reveal>

              {/* Advance */}
              <Reveal delay={0.1}>
                <ActionCard n="2" done={advanceDone} icon={CreditCard} title="Advance payment"
                  status={advanceDone ? { tone: 'done', text: 'Payment received' }
                    : advance_invoice ? { tone: 'wait', text: 'Awaiting payment' }
                    : { tone: 'idle', text: 'Coming shortly' }}>
                  {advance_invoice ? (
                    advanceDone ? null : (
                      <>
                        {advance_invoice.amount_aed != null && (
                          <div className="text-3xl font-semibold tracking-tight">
                            {money(advance_invoice.amount_aed)}
                            {advance_invoice.payment_terms && <span className="ml-2 text-sm font-normal text-muted-foreground">{advance_invoice.payment_terms}</span>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {advance_invoice.invoice_file_url && (
                            <a href={advance_invoice.invoice_file_url} target="_blank" rel="noreferrer">
                              <Button className="gap-2 rounded-xl"><Download className="h-4 w-4" />Download invoice</Button>
                            </a>
                          )}
                          {advance_invoice.payment_link_url && (
                            <a href={advance_invoice.payment_link_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" className="gap-2 rounded-xl"><CreditCard className="h-4 w-4" />Pay online</Button>
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          The invoice includes our bank transfer and cheque details. Need a payment link instead? Just let your account manager know.
                        </p>
                      </>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Your advance invoice will appear here shortly.</p>
                  )}
                </ActionCard>
              </Reveal>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />Handled securely. Your details are never shared.
            </div>
          </section>
        )}

        {/* ---------- creators ---------- */}
        <section id="creators" className="pt-14 sm:pt-20 scroll-mt-20">
          <Reveal>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs">{unlocked ? <Check className="h-3.5 w-3.5" /> : '2'}</span>
                  The lineup
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                  {unlocked ? 'Your creators' : 'Your creators, unlocking soon'}
                </h2>
              </div>
              {!unlocked && (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  {noInfluencers ? 'Revealed after your advance' : `${lockedCount} more unlock after payment`}
                </div>
              )}
            </div>
          </Reveal>

          {!unlocked && (
            <Reveal delay={0.05}>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                {noInfluencers
                  ? 'We’re hand-picking creators for this campaign. The full lineup, with real profiles and pricing, is revealed the moment your advance is confirmed.'
                  : 'A preview is shown below. Complete the two steps above to reveal every creator in full, with pricing.'}
              </p>
            </Reveal>
          )}

          {/* grid: real cards (samples/unlocked) + ghost cards to fill anticipation */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {influencers.map((inf: any, idx: number) => {
              const { grad, initials } = avatarFor(inf.username || inf.full_name || '?')
              if (inf.locked) return <Reveal key={inf.id} delay={Math.min(idx * 0.03, 0.24)}><GhostCard i={idx} /></Reveal>
              return (
                <Reveal key={inf.id} delay={Math.min(idx * 0.03, 0.24)}>
                  <div className="rounded-2xl border border-border bg-card p-5 h-full transition-all hover:border-foreground/20 hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={inf.profile_image_url || undefined} alt={inf.username || ''} />
                        <AvatarFallback className={`bg-gradient-to-br ${grad} text-white text-sm font-bold`}>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">@{inf.username || 'creator'}</div>
                        {inf.full_name && <div className="text-sm text-muted-foreground truncate">{inf.full_name}</div>}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />{compact(inf.followers_count) ?? '0'} followers
                      </span>
                      {inf.sell_price != null && <span className="font-semibold">{money(inf.sell_price)}</span>}
                    </div>
                  </div>
                </Reveal>
              )
            })}
            {/* Commercial-first: no real rows yet, so tease with ghost cards. */}
            {noInfluencers && !unlocked && Array.from({ length: 6 }).map((_, i) => (
              <Reveal key={`ghost-${i}`} delay={Math.min(i * 0.03, 0.24)}><GhostCard i={i} /></Reveal>
            ))}
          </div>

          {noInfluencers && unlocked && (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border"><Users className="h-5 w-5 text-muted-foreground" /></div>
              <p className="mt-4 font-medium">Your lineup is being finalized</p>
              <p className="mt-1 text-sm text-muted-foreground">Your advance is confirmed. Your creators will appear here shortly.</p>
            </div>
          )}

          {!unlocked && (
            <Reveal delay={0.12}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-6 text-center sm:text-left">
                <div>
                  <div className="font-semibold">Ready to meet your creators?</div>
                  <p className="text-sm text-muted-foreground">Complete the agreement and advance to unlock the full lineup.</p>
                </div>
                <Button onClick={() => scrollTo('unlock')} className="gap-2 rounded-xl shrink-0"><ArrowRight className="h-4 w-4" />Get started</Button>
              </div>
            </Reveal>
          )}
        </section>

        {/* ---------- payment ---------- */}
        {(schedule.length > 0 || (invoices && invoices.length > 0)) && (
          <section id="payment" className="pt-14 sm:pt-20 scroll-mt-20">
            <Reveal>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10"><Wallet className="h-3.5 w-3.5" /></span>Payment plan
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">Clear, milestone-based pricing</h2>
            </Reveal>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {schedule.length > 0 && (
                <Reveal delay={0.05}>
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="text-sm font-semibold text-muted-foreground">Milestones</div>
                    <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                      {schedule.map((m: any, i: number) => (
                        <div key={i}>
                          <div className="text-2xl font-semibold tracking-tight tabular-nums">{m.pct}%</div>
                          <div className="text-sm text-muted-foreground">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
              {invoices && invoices.length > 0 && (
                <Reveal delay={0.08}>
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="text-sm font-semibold text-muted-foreground">Invoices</div>
                    <div className="mt-4 divide-y divide-border">
                      {invoices.map((inv: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                          <div className="min-w-0">
                            <div className="font-medium capitalize truncate">{inv.milestone_label || inv.invoice_type}</div>
                            {inv.amount_aed != null && <div className="text-sm text-muted-foreground">{money(inv.amount_aed)}</div>}
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <StatusDot tone={inv.status === 'paid' ? 'done' : inv.status === 'partial' ? 'wait' : 'idle'}>
                              {inv.status === 'paid' ? 'Paid' : inv.status === 'partial' ? 'Partial' : 'Unpaid'}
                            </StatusDot>
                            {inv.invoice_file_url && (
                              <a href={inv.invoice_file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />Invoice</a>
                            )}
                            {inv.status !== 'paid' && inv.payment_link_url && (
                              <a href={inv.payment_link_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Pay online</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ---------- footer ---------- */}
      <footer className="mt-16 border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo className="h-5 w-auto opacity-80" />
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Private and confidential. Shared only with you.</div>
        </div>
      </footer>
    </div>
  )
}

// ---------- small building blocks ----------
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-3 text-xl font-semibold tracking-tight truncate">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function StatusDot({ tone, children }: { tone: 'done' | 'wait' | 'idle'; children: React.ReactNode }) {
  const dot = tone === 'done' ? 'bg-emerald-500' : tone === 'wait' ? 'bg-amber-500' : 'bg-muted-foreground/50'
  const text = tone === 'done' ? 'text-emerald-600 dark:text-emerald-500' : tone === 'wait' ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'
  return <span className={`inline-flex items-center gap-2 text-sm font-medium ${text}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{children}</span>
}

function ActionCard({ n, done, icon: Icon, title, status, children }: {
  n: string; done: boolean; icon: any; title: string
  status: { tone: 'done' | 'wait' | 'idle'; text: string }; children: React.ReactNode
}) {
  return (
    <div className={`h-full rounded-2xl border bg-card p-6 transition-colors ${done ? 'border-emerald-500/30' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'}`}>
            {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Step {n}</div>
            <div className="font-semibold leading-tight">{title}</div>
          </div>
        </div>
        <StatusDot tone={status.tone}>{status.text}</StatusDot>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  )
}
