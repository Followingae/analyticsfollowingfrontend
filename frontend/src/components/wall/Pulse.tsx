'use client'

/**
 * The ticker and the takeover.
 *
 * What moved across the business runs along the bottom of the screen as one belt of faces
 * and short lines, the way a newsroom's wire runs under the picture. A card staff pushed
 * from the console takes the whole stage for a moment, then lives at the head of the belt
 * for the rest of the day.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Camera, CheckCircle2, Eye, FileText, Inbox, Megaphone, PackageCheck, PartyPopper, Radio, Sparkles, Truck, UserCheck, UserPlus, Zap } from 'lucide-react'
import { LIME, Marquee } from './fx'
import { Face } from './screens'
import { timeAgo, useNow } from './parts'

export type Push = { id: string; kind: 'request' | 'update' | 'win' | 'shout'; title: string; detail?: string | null; client?: string | null; campaign?: string | null; pushed_by_name?: string | null; created_at: string }
export type Event = { at: string; kind: string; text: string; campaign?: string | null; client?: string | null; who?: string | null; avatar?: string | null }

const AMBER = '#F5C451'
const KIND: Record<Push['kind'], { label: string; colour: string; Icon: any }> = {
  request: { label: 'Client asked', colour: AMBER, Icon: Inbox },
  update: { label: 'Update', colour: '#15181A', Icon: Radio },
  win: { label: 'Win', colour: '#6E8A00', Icon: PartyPopper },
  shout: { label: 'Shout', colour: '#1C7ED6', Icon: Megaphone },
}
const EVENT_ICON: Record<string, any> = {
  live: Sparkles, approved: CheckCircle2, content: Eye, received: Camera, dispatched: Truck, briefed: FileText,
  signed: UserCheck, review: Eye, request: Inbox, done: CheckCircle2, confirmed: PartyPopper, proposal: FileText, lead: Zap, applied: UserPlus,
}

export function PushCard({ p, big = false }: { p: Push; big?: boolean }) {
  const k = KIND[p.kind] ?? KIND.update
  const now = useNow()
  return (
    <motion.div layoutId={`push-${p.id}`} className="relative overflow-hidden rounded-[1.4vw]"
      style={{ background: '#fff', boxShadow: `0 2vw 5vw rgba(21,24,26,0.18), inset 0 0 0 0.12vw ${k.colour}` }}
      transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
      <div className={big ? 'px-[3vw] py-[2.6vw]' : 'px-[1.2vw] py-[0.8vw]'}>
        <div className="flex items-center gap-[0.5vw]">
          <k.Icon className={big ? 'h-[1.3vw] w-[1.3vw]' : 'h-[0.85vw] w-[0.85vw]'} style={{ color: k.colour }} />
          <span className={`${big ? 'text-[0.95vw]' : 'text-[0.66vw]'} font-semibold uppercase tracking-[0.16em]`} style={{ color: k.colour }}>{k.label}</span>
          <span className={`ml-auto ${big ? 'text-[0.85vw]' : 'text-[0.64vw]'} text-[#6F746B]`}>{p.pushed_by_name ? `${p.pushed_by_name} · ` : ''}{timeAgo(p.created_at, now)}</span>
        </div>
        <div className={`${big ? 'mt-[1vw] text-[3.2vw]' : 'mt-[0.35vw] text-[1vw]'} font-semibold leading-[1.05] tracking-[-0.025em] text-[#15181A]`}>{p.title}</div>
        {big && p.detail && <div className="mt-[1vw] text-[1.3vw] leading-snug text-[#3B3F3A]">{p.detail}</div>}
        {big && (p.client || p.campaign) && <div className="mt-[1.2vw] text-[1vw] text-[#6F746B]">{[p.client, p.campaign].filter(Boolean).join(' · ')}</div>}
      </div>
    </motion.div>
  )
}

function Tick({ e }: { e: Event }) {
  const now = useNow()
  const Icon = EVENT_ICON[e.kind] ?? Radio
  const hot = e.kind === 'live' || e.kind === 'confirmed'
  return (
    <div className="flex shrink-0 items-center gap-[0.7vw]">
      {e.avatar || e.who
        ? <Face src={e.avatar} name={e.who} size="2.4vw" ring={hot ? LIME : undefined} />
        : <span className="flex h-[2.4vw] w-[2.4vw] items-center justify-center rounded-full bg-white/[0.07]"><Icon className="h-[1vw] w-[1vw]" style={{ color: hot ? LIME : 'rgba(255,255,255,0.6)' }} /></span>}
      <span className="whitespace-nowrap text-[0.95vw] text-white/85">
        {e.who && <span className="font-semibold text-white">{e.who} </span>}{e.text}
        <span className="text-white/40"> · {e.client ?? e.campaign ?? ''} · {timeAgo(e.at, now)}</span>
      </span>
      <span className="mx-[0.6vw] h-[0.35vw] w-[0.35vw] rounded-full bg-white/20" />
    </div>
  )
}

/** The belt along the bottom. Pushes sit still at its head; events run past. */
export function Ticker({ pushes, events, hidden }: { pushes: Push[]; events: Event[]; hidden: Set<string> }) {
  const live = pushes.filter(p => !hidden.has(p.id)).slice(0, 3)
  return (
    <div className="flex h-[4.4vw] items-center gap-[1vw]">
      <AnimatePresence mode="popLayout">
        {live.map(p => <motion.div key={p.id} className="w-[22vw] shrink-0" exit={{ opacity: 0, scale: 0.95 }}><PushCard p={p} /></motion.div>)}
      </AnimatePresence>
      {events.length > 0 && (
        <Marquee duration={Math.max(60, events.length * 7)} gap="0" className="min-w-0 flex-1">
          {events.map((e, i) => <Tick key={`${e.kind}-${e.at}-${i}`} e={e} />)}
        </Marquee>
      )}
    </div>
  )
}

/** A push that just landed takes the whole stage. */
export function Takeover({ push }: { push: Push | null }) {
  return (
    <AnimatePresence>
      {push && (
        <motion.div key={push.id} className="absolute inset-0 z-40 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <motion.div className="absolute inset-0" style={{ background: 'rgba(246,246,242,0.72)', backdropFilter: 'blur(18px)' }} />
          <motion.div className="relative w-[48vw]" initial={{ scale: 0.88, y: '2vw' }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 130, damping: 18 }}>
            <PushCard p={push} big />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
