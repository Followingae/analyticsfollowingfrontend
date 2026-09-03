'use client'

/**
 * How work moves — the deck you walk the team through.
 *
 * One brand, end to end, one stop per screen: who, what they do, where they do it, what the
 * platform carries for them, and whose desk it lands on next. It is a deck rather than a
 * page because it is presented, not read — a long scroll is a document, and nobody has ever
 * narrated a scrollbar.
 *
 * A note on tone, because it was wrong the first time. This is shown to the people who do
 * the work, so it says what the platform does FOR them. It does not list what each role may
 * not see or may not press: those rules exist, they are enforced in the code, and reading
 * them aloud to your own team makes an argument out of a floor plan.
 *
 * Arrow keys move it.
 *
 * Density tier: READING, and the one screen in the console that is projected rather than
 * worked in. So the type is fluid (clamped against the viewport) rather than drawn from the
 * six-step scale, which tops out at a size nobody can read from the back of a room, and the
 * lime is a literal because the deck sits on its own dark ground outside `.console-shell`
 * where the tone tokens are not defined. Everything else follows the spec: 65 characters of
 * measure, one action per slide, and space rather than boxes doing the separating.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { AuthGuard } from '@/components/AuthGuard'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Building2, CheckCircle2, ClipboardCheck,
  FileText, HandCoins, Layers, RotateCcw, Send, ShieldCheck, Sparkles, Tag, Users, X,
} from 'lucide-react'

const LIME = '#D3FF02'

/* ────────────────────────────────────────────────────────────────── the glass ── */

function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden>
      <defs>
        <filter id="manual-glass" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.008" numOctaves="1" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

/**
 * The office wall's glass: a bend layer that blurs and refracts what is behind it, a face
 * carrying the outer glow, an edge with the inner highlight. The bend layer is grown past
 * the panel because a displacement map ripples its own edge — the rounded clip then cuts a
 * clean edge out of the middle of it.
 */
function Glass({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[28px]', className)}>
      <div className="absolute -inset-16 z-0 backdrop-blur-2xl"
           style={{ filter: 'url(#manual-glass)', background: 'rgba(9,14,12,0.58)' }} />
      <div className="absolute inset-0 z-10 rounded-[28px]"
           style={{ boxShadow: '0 4px 4px rgba(0,0,0,0.15), 0 0 28px rgba(255,255,255,0.06)' }} />
      <div className="absolute inset-0 z-20 rounded-[28px]"
           style={{ boxShadow: 'inset 2px 2px 2px 0 rgba(255,255,255,0.18), inset -2px -2px 2px 0 rgba(255,255,255,0.10)' }} />
      <div className="relative z-30 h-full">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────── the story ── */

type Slide = {
  id: string
  kind: 'title' | 'stop' | 'desks' | 'rules'
  who?: string
  role?: string
  title: string
  lede?: string
  does?: string[]
  where?: { label: string; href: string }[]
  helps?: string[]
  handover?: string
  icon?: any
}

const DESKS = [
  { who: 'Aisha', role: 'Business development',
    sees: 'Brands you’re on · logged this month · out with the client · sample packs',
    first: 'A brand you logged that nobody has started sourcing for.' },
  { who: 'Aqsa', role: 'Talent',
    sees: 'Added today against your target · rates to get · creators you’re chasing · areas short',
    first: 'The oldest creator nobody has asked for a rate.' },
  { who: 'Sana', role: 'Account management',
    sees: 'Your clients · out with the client · content due this week · gone quiet',
    first: 'A proposal the client has answered, or one they have not.' },
  { who: 'Hajar & Zain', role: 'Founders',
    sees: 'Open pipeline · collected this month · owed to us · owed to creators',
    first: 'Creators to price, creators to clear, rates to confirm, people to pay.' },
]

const RULES = [
  'Nothing you research is ever lost. A creator turned down keeps every rate you found.',
  'Adding and researching creators costs us nothing: we only spend once one is approved.',
  'Prices freeze when a proposal is built, so no client conversation is undercut by a later change.',
  'What a creator is paid is the rate that was agreed, written straight from the board.',
  'The platform does the chasing: creators, deadlines and dates, so you can spend the day on the work.',
  'Every screen shows you your own day. Nobody has to read around somebody else\u2019s.',
]

const SLIDES: Slide[] = [
  { id: 'start', kind: 'title', title: 'How work moves at Following',
    lede: 'One brand, end to end, from the first conversation to the money leaving for a creator. Ten stops, each one somebody’s job, in the order they happen.' },

  {
    id: 'logged', kind: 'stop', who: 'Aisha', role: 'Business development', icon: Building2,
    title: 'A brand says maybe',
    lede: 'Everything starts with a conversation, and the platform wants it the day it happens, not the day it turns into money.',
    does: [
      'Log the brand the day you speak to them. A name and a line about what they want is enough.',
      'Keep them warm. A brand nobody has touched for two weeks shows on your Today as gone quiet.',
      'Send a sample pack while they are deciding: a ready-made list of creators in their world.',
    ],
    where: [{ label: 'Brands', href: '/work/brands' }, { label: 'Sample packs', href: '/work/areas' }],
    helps: [
      'Logging the brand is what asks a founder to open the area, so you do not have to chase anyone for it.',
      'A brand nobody has touched in two weeks resurfaces on your Today, so none of your work goes cold quietly.',
      'A brand you have logged is not a client yet, and it is not in the client list. It becomes one when a superadmin creates its account, it pays, or it is sent a proposal. Until then it lives here, on Brands.',
    ],
    handover: 'It lands on the founders’ Today as “Start sourcing for {brand}”, and turns urgent after three days.',
  },
  {
    id: 'area', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: Layers,
    title: 'The founder opens the area',
    lede: 'An area is one brand’s working roster: the brief, an owner, a number and a date. It is the only place creators are gathered for that brand.',
    does: [
      'Write the brief in fields, not prose: categories, market, follower band, deliverables, budget each.',
      'Give it a number and a date, and name who is stocking it.',
      'One area per brand. It grows over months instead of being rebuilt per campaign.',
    ],
    where: [{ label: 'Areas', href: '/work/areas' }],
    helps: [
      'One area per brand keeps the whole roster in one place, so nothing is researched twice.',
      'The brief travels with the alert, so whoever picks it up knows what to look for before opening anything.',
    ],
    handover: 'The talent team are told, with the brief in the message, and it appears on their Today.',
  },
  {
    id: 'stock', kind: 'stop', who: 'Aqsa', role: 'Talent', icon: Users,
    title: 'Stocking the area',
    lede: 'Find people the day you find them. Adding costs nothing: we only spend on a creator once a founder releases them.',
    does: [
      'Add creators against the area you found them for. Paste a whole list if you have one.',
      'Ring them, and record what they charge us per deliverable, with a note if the rate has conditions.',
      'Work the “Needs a cost” lane, one creator at a time when the list is long.',
    ],
    where: [
      { label: 'Waiting room', href: '/work/influencers/review' },
      { label: 'Add creators', href: '/work/influencers/add' },
      { label: 'Coverage', href: '/work/coverage' },
    ],
    helps: [
      'Adding is free: analytics only run once a creator is approved, so nothing you research costs us.',
      'A rate you record is kept forever, even if this brand goes quiet. Next time it is a week you do not repeat.',
    ],
    handover: 'Saving a cost moves that creator into the founders’ lane and tells them a price is waiting.',
  },
  {
    id: 'price', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: Tag,
    title: 'Price them, and let them in',
    lede: 'The waiting room is two lists because it is two jobs. The second is the founders’: turn what a creator charges us into what we charge a client.',
    does: [
      'Open “Needs a sell price”. Each card carries their cost and who got it.',
      'Type our price and the margin appears beside it as you type.',
      'Approve, and they are in the master database, ready for a proposal.',
    ],
    where: [{ label: 'Waiting room', href: '/work/influencers/review' }],
    helps: [
      'The margin appears as you type, so the decision is made with the number in front of you.',
      'Turning someone down keeps the row and every rate on it, right for the next brand, often.',
    ],
    handover: 'Approving starts their analytics, the first money we spend on them, and drops them back into the brand’s area.',
  },
  {
    id: 'clear', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: ShieldCheck,
    title: 'Decide who the client may see',
    lede: 'Being in the database and being shown to a brand are two decisions, made on different days. This is the gate.',
    does: [
      'Open the area and tick who may leave the building.',
      'Strike anyone wrong for this brand, with the reason, so they are not shown again next quarter.',
      'Talent keep stocking underneath; the client only ever sees what is cleared.',
    ],
    where: [{ label: 'Areas', href: '/work/areas' }],
    helps: [
      'The link updates itself, so the team can keep stocking while the client is still reading.',
      'A reason on a strike means the same person is not put in front of the same brand next quarter.',
    ],
    handover: 'The share link updates itself. Nothing uncleared appears in it, even while it is open.',
  },
  {
    id: 'share', kind: 'stop', who: 'Aisha or Sana', role: 'Client-facing', icon: Send,
    title: 'The client picks',
    lede: 'One link, no login. They see the cleared roster and answer creator by creator.',
    does: [
      'Send the link. Opens are counted, so “they haven’t looked” is a fact rather than a feeling.',
      'They pick or pass on each creator, and can leave a note.',
      'Answers come back onto the same rows. Nothing is retyped.',
    ],
    where: [{ label: 'Areas', href: '/work/areas' }],
    handover: 'Their picks land on the account manager’s Today the same day.',
  },
  {
    id: 'proposal', kind: 'stop', who: 'Sana', role: 'Account management', icon: FileText,
    title: 'The proposal',
    lede: 'What they picked becomes what we quote. Prices freeze the moment it is built, so a rate moving later cannot change a number the client has seen.',
    does: [
      'Build it from the picks, with deliverables per creator.',
      'Mark the ones you would put forward: the row menu, “Recommend to client”, and one line saying why. They go to the front of the client’s wall wearing a green badge.',
      'Send it for internal approval; a founder sends it out.',
      'If they ask for more, that comes back as a job on your Today.',
    ],
    where: [{ label: 'Proposals', href: '/work/proposals' }],
    helps: [
      'Prices freeze when the proposal is built, so nobody is caught out by a rate that moved afterwards.',
      'A client staring at twenty equal faces picks slowly. Two of them wearing our name, with a reason, is the advice they asked us for.',
      'The client\u2019s answer comes back as a job on your Today rather than an email you have to spot.',
    ],
    handover: 'Yes, no, or “show me more”: all three arrive on the account manager’s Today.',
  },
  {
    id: 'confirm', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: ShieldCheck,
    title: 'They say yes',
    lede: 'Most clients confirm by email or on a call rather than in the platform. That yes can be locked here, and the campaign opens the moment it is.',
    does: [
      'Confirm on their behalf: tick who they took, say how they told us, paste what they said.',
      'The campaign opens exactly as their own confirmation would have opened it.',
      'Then the real costs: what we actually pay each creator after negotiating, against what we quoted.',
    ],
    where: [{ label: 'Proposals', href: '/work/proposals' }],
    helps: [
      'A proposal stops sitting at “sent” while the work has already started.',
      'The margin on the campaign becomes a real number rather than a guess built on quotes.',
    ],
    handover: 'Their copy of the proposal keeps the roster and the agreed total. The per-creator prices come off once it is locked.',
  },
  {
    id: 'partial', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: RotateCcw,
    title: 'They only took some of them',
    lede: 'Clients read a proposal as a menu. They take the two they are sure about, see how it goes, and come back for the rest, which is not a rejection of the other nineteen, and their budget has not gone anywhere.',
    does: [
      'Re-open the proposal. The ones they confirmed stay booked on the running campaign.',
      'Everyone else goes back on the table at the price they were quoted, with the rest of the budget still to spend.',
      'Add more names first if you have them, or send it straight back. Both are fine.',
    ],
    where: [{ label: 'Proposals', href: '/work/proposals' }],
    helps: [
      'A partial yes stops closing the conversation and stranding the rest of the budget.',
      'Confirmed creators cannot be unticked by the client or removed by us. Nobody who is already briefed quietly falls off.',
      'The second round joins the same campaign, so there is one campaign and one invoice trail, not two.',
    ],
    handover: 'The client is told the proposal is open again, and their budget bar starts part-full with what they have already spent.',
  },
  {
    id: 'paper', kind: 'stop', who: 'Sana with a founder', role: 'Account management', icon: ClipboardCheck,
    title: 'Agreement and invoice',
    lede: 'The commercial half. This is the client’s money, which makes it leadership’s to confirm.',
    does: [
      'Send the agreement, or record one signed elsewhere.',
      'Raise the invoice against the agreed total, with terms.',
      'Chase it. An unsigned agreement and an overdue invoice are jobs, not states.',
    ],
    where: [{ label: 'Clients', href: '/work/clients' }, { label: 'Money', href: '/work/money' }],
    handover: 'Anything overdue shows as “Owed to us” on the founders’ Today, oldest first.',
  },
  {
    id: 'ladder', kind: 'stop', who: 'Aqsa, with founder confirmations', role: 'Talent + Founder', icon: Sparkles,
    title: 'Delivering the campaign',
    lede: 'Eight rungs in order, one row per creator. The board is the truth: a creator is wherever the platform says they are.',
    does: [
      'Booked → rate agreed → a founder confirms it → agreement back → guide sent → content in → approved → posted.',
      'If anything ships: mark the batch packed, then per creator when it goes out and when they have it.',
      'The platform chases the creator for you: four days out, two, one, on the day, then overdue.',
      'Someone who never delivers is marked missed, and it counts against their reliability score.',
    ],
    where: [{ label: 'Campaigns', href: '/work/campaigns' }],
    helps: [
      'The chasing is automatic: four days out, two, one, on the day, then overdue.',
      'The payable is written from the confirmed rate, so nobody has to reconcile it later.',
    ],
    handover: 'Everything you mark here is what the client sees on their own campaign page, in their words.',
  },
  {
    id: 'pay', kind: 'stop', who: 'Hajar or Zain', role: 'Founder', icon: HandCoins,
    title: 'Money out',
    lede: 'The last decision, and deliberately a person’s rather than a rule’s.',
    does: [
      'Approve what is owed, then release it.',
      'The amount comes from the confirmed rate, never retyped.',
      '“Owed to creators” on Today is the total waiting on you.',
    ],
    where: [{ label: 'Payables', href: '/work/payables' }],
    handover: 'Paid closes that creator’s row, and a campaign is done when every row is closed.',
  },

  { id: 'desks', kind: 'desks', title: 'Where each of you starts the day',
    lede: 'Everyone opens the same screen and sees a different day. Today is your work, not the company’s.' },
  { id: 'rules', kind: 'rules', title: 'Six things you can count on',
    lede: 'These hold on their own, so they are never something you have to keep track of.' },
]

export default function ManualDeck() {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const s = SLIDES[i]

  const go = useCallback((n: number) => {
    setDir(n > i ? 1 : -1)
    setI(Math.max(0, Math.min(n, SLIDES.length - 1)))
  }, [i])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(i + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1) }
      if (e.key === 'Home') go(0)
      if (e.key === 'End') go(SLIDES.length - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, go])

  return (
    <AuthGuard>
      <GlassFilter />
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0B1410] text-white">
        {/* the room the glass sits in */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1A12] via-[#16241A] to-[#0A1210]" />
        <div className="absolute -right-32 -top-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
             style={{ background: LIME }} />
        <div className="absolute -bottom-48 -left-24 h-[32rem] w-[32rem] rounded-full bg-sky-400/15 blur-3xl" />

        {/* the way out */}
        <button
          type="button"
          onClick={() => router.push('/work/today')}
          className="absolute right-5 top-5 z-40 grid h-10 w-10 place-items-center rounded-full
                     border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:text-white"
          aria-label="Close the deck"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-30 flex min-h-0 flex-1 items-center justify-center p-5 sm:p-8">
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={s.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * 60 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full max-w-6xl"
            >
              <Glass className="h-full">
                <div className="flex h-full flex-col overflow-y-auto px-8 py-9 sm:px-14 sm:py-12">

                  {s.kind === 'title' && (
                    <div className="m-auto max-w-3xl text-center">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: LIME }}>
                        The team manual
                      </p>
                      <h1 className="mt-6 text-[clamp(36px,5.4vw,68px)] font-semibold leading-[1.02] tracking-[-0.03em]">
                        {s.title}
                      </h1>
                      <p className="mx-auto mt-6 max-w-2xl text-[clamp(15px,1.5vw,20px)] leading-relaxed text-white/70">
                        {s.lede}
                      </p>
                      <div className="mt-9 flex flex-wrap justify-center gap-2">
                        {DESKS.map(d => (
                          <span key={d.who}
                                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13.5px] text-white/85">
                            {d.who} · {d.role}
                          </span>
                        ))}
                      </div>
                      <p className="mt-10 text-[13px] text-white/40">Press → to begin</p>
                    </div>
                  )}

                  {s.kind === 'stop' && (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.07]">
                          {s.icon && <s.icon className="h-[19px] w-[19px]" style={{ color: LIME }} />}
                        </span>
                        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/55">
                          Stop {i} of {SLIDES.length - 3} · {s.who} · {s.role}
                        </p>
                      </div>

                      <h2 className="mt-5 max-w-3xl text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em]">
                        {s.title}
                      </h2>
                      <p className="mt-4 max-w-3xl text-[clamp(14.5px,1.35vw,18px)] leading-relaxed text-white/65">
                        {s.lede}
                      </p>

                      <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-5">
                        <ul className="space-y-4 lg:col-span-3">
                          {s.does?.map(d => (
                            <li key={d} className="flex gap-3 text-[clamp(14px,1.25vw,17px)] leading-relaxed">
                              <CheckCircle2 className="mt-[4px] h-[18px] w-[18px] shrink-0" style={{ color: LIME }} />
                              <span className="text-white/90">{d}</span>
                            </li>
                          ))}
                        </ul>

                        {s.helps && (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 lg:col-span-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                              What the platform does for you here
                            </p>
                            <ul className="mt-3 space-y-3">
                              {s.helps.map(r => (
                                <li key={r} className="flex gap-2.5 text-[14px] leading-relaxed text-white/75">
                                  <Sparkles className="mt-[3px] h-[15px] w-[15px] shrink-0 text-white/40" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-2">
                        {s.where?.map(w => (
                          <button
                            key={w.href + w.label}
                            type="button"
                            onClick={() => router.push(w.href)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07]
                                       px-4 py-2 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.14]"
                          >
                            {w.label}<ArrowUpRight className="h-3.5 w-3.5 text-white/50" />
                          </button>
                        ))}
                      </div>

                      <p className="mt-6 border-t border-white/10 pt-5 text-[clamp(14px,1.25vw,16.5px)] leading-relaxed">
                        <span className="font-medium" style={{ color: LIME }}>Then: </span>
                        <span className="text-white/70">{s.handover}</span>
                      </p>
                    </>
                  )}

                  {s.kind === 'desks' && (
                    <>
                      <h2 className="text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em]">
                        {s.title}
                      </h2>
                      <p className="mt-4 max-w-3xl text-[clamp(14.5px,1.35vw,18px)] leading-relaxed text-white/65">
                        {s.lede}
                      </p>
                      <div className="mt-8 grid flex-1 content-start gap-4 sm:grid-cols-2">
                        {DESKS.map(d => (
                          <div key={d.who} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                            <p className="text-[16px] font-semibold">{d.who}</p>
                            <p className="text-[12.5px] text-white/50">{d.role}</p>
                            <p className="mt-3 text-[14px] leading-relaxed text-white/85">{d.sees}</p>
                            <p className="mt-2 text-[13.5px] text-white/55">First job: {d.first}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/work/today')}
                        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-5 py-2.5
                                   text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
                      >
                        Open Today <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {s.kind === 'rules' && (
                    <>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: LIME }}>
                        What the platform carries for you
                      </p>
                      <h2 className="mt-4 text-[clamp(28px,3.6vw,46px)] font-semibold leading-[1.05] tracking-[-0.025em]">
                        {s.title}
                      </h2>
                      <ul className="mt-8 grid flex-1 content-start gap-5 sm:grid-cols-2">
                        {RULES.map(r => (
                          <li key={r} className="flex gap-3 text-[clamp(13.5px,1.2vw,16px)] leading-relaxed text-white/85">
                            <ShieldCheck className="mt-[3px] h-[17px] w-[17px] shrink-0" style={{ color: LIME }} />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => router.push('/how')}
                        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-5 py-2.5
                                   text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
                      >
                        Take the walkthroughs <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </Glass>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── the rail: where we are, and the way forward ───────────────────────── */}
        <div className="relative z-30 flex items-center justify-between gap-4 px-6 pb-6 sm:px-10">
          <button
            type="button"
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06]
                       px-4 py-2.5 text-[13px] font-medium text-white/80 transition-colors
                       hover:bg-white/[0.12] disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />Back
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            {SLIDES.map((sl, n) => (
              <button
                key={sl.id}
                type="button"
                onClick={() => go(n)}
                title={sl.title}
                aria-label={sl.title}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  n === i ? 'w-8' : 'w-1.5 bg-white/25 hover:bg-white/50',
                )}
                style={n === i ? { background: LIME } : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(i + 1)}
            disabled={i === SLIDES.length - 1}
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[13px]
                       font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-30"
          >
            Next<ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
