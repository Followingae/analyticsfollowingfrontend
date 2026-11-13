'use client'

/**
 * The wall's screens, third cut (13 Nov 2026).
 *
 * The founder's brief: the team must be able to tell at a glance whether they are on track,
 * client by client and campaign by campaign. The roster holds almost no deadlines, so "on
 * track" is measured from movement: who moved this week, who has sat untouched for five
 * days, how long a client has held content. Those three numbers are the whole wall.
 *
 * Light theme. Ink on warm white; lime is a surface (pills, rings, bars), never a text colour.
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LIME, NumberTicker, Orbit } from './fx'
import { type Slide } from './parts'

export const INK = '#15181A'
export const MUTED = '#6F746B'
export const RED = '#E8503A'
export const AMBER = '#C98A00'

const RING_OF: Record<string, number> = {
  confirmed: 0, briefed: 0, product_ready: 1, dispatched: 1, received: 1, content_in: 2, content_approved: 2, live: 3,
}
const STOP_WORD: Record<string, string> = {
  confirmed: 'on board', briefed: 'briefed', dispatch: 'with the courier', filming: 'filming', review: 'with the client', live: 'live', complete: 'wrapped',
}

export function Face({ src, name, size, ring, soft = false }: { src?: string | null; name?: string | null; size: string; ring?: string; soft?: boolean }) {
  const initial = String(name ?? '?').replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <Avatar className="shrink-0 rounded-full bg-[#E9EBE4]" style={{ height: size, width: size, border: `calc(${size} * 0.06) solid ${ring ?? '#fff'}`, boxShadow: soft ? '0 0.3vw 0.9vw rgba(21,24,26,0.10)' : '0 0.6vw 1.6vw rgba(21,24,26,0.18)' }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
      <AvatarFallback className="rounded-full bg-[#E9EBE4] font-semibold" style={{ fontSize: `calc(${size} * 0.36)`, color: MUTED }}>{initial}</AvatarFallback>
    </Avatar>
  )
}

export function Logo({ src, name, size }: { src?: string | null; name?: string | null; size: string }) {
  return (
    <Avatar className="shrink-0 overflow-hidden bg-white" style={{ height: size, width: size, borderRadius: `calc(${size} * 0.24)`, boxShadow: '0 0.8vw 2vw rgba(21,24,26,0.14), 0 0 0 1px rgba(21,24,26,0.06)' }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="h-full w-full object-cover" /> : null}
      <AvatarFallback className="bg-white" style={{ borderRadius: `calc(${size} * 0.24)`, fontSize: `calc(${size} * 0.3)`, fontWeight: 700, color: INK }}>
        {String(name ?? '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}

/** The one word that says whether a client or campaign is on track. */
export function Health({ h, days, size = 'md' }: { h: string; days?: number; size?: 'md' | 'lg' }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    moving: { label: 'On track', bg: LIME, fg: INK },
    done: { label: 'Done', bg: INK, fg: '#fff' },
    stalled: { label: 'Needs a push', bg: '#FFE3DD', fg: RED },
    waiting_client: { label: days ? `Waiting on client · ${days} days` : 'Waiting on client', bg: '#FFF0C7', fg: AMBER },
  }
  const m = map[h] ?? map.moving
  const pad = size === 'lg' ? 'px-[1vw] py-[0.45vw] text-[0.95vw]' : 'px-[0.75vw] py-[0.3vw] text-[0.72vw]'
  return <span className={`inline-flex items-center rounded-full font-semibold leading-none ${pad}`} style={{ background: m.bg, color: m.fg }}>{m.label}</span>
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-[1.2vw]">
      <h1 className="text-[1.9vw] font-semibold leading-none tracking-[-0.03em]" style={{ color: INK }}>{children}</h1>
      {sub && <div className="text-[1vw] leading-none" style={{ color: MUTED }}>{sub}</div>}
    </div>
  )
}

/* ── Clients ─────────────────────────────────────────────────────────────────────── */

function ClientCard({ r, i }: { r: any; i: number }) {
  const total = Math.max(1, r.creators)
  const seg = (n: number, bg: string) => n > 0 ? <div className="h-full" style={{ width: `${(n / total) * 100}%`, background: bg }} /> : null
  const working = Math.max(0, r.creators - r.live)
  return (
    <motion.div className="flex min-h-0 flex-col justify-between rounded-[1.4vw] bg-white px-[1.5vw] py-[1.4vw]" style={{ boxShadow: '0 0.8vw 2.4vw rgba(21,24,26,0.08), 0 0 0 1px rgba(21,24,26,0.05)' }}
      initial={{ opacity: 0, y: '1.2vw' }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
      <div className="flex items-center gap-[0.9vw]">
        <Logo src={r.logo} name={r.name} size="3.4vw" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[1.25vw] font-semibold leading-tight tracking-tight" style={{ color: INK }}>{r.name}</div>
          <div className="truncate text-[0.78vw]" style={{ color: MUTED }}>
            {r.campaigns ? `${r.campaigns} campaign${r.campaigns === 1 ? '' : 's'}` : ''}{r.campaigns && r.app_campaigns ? ' · ' : ''}{r.app_campaigns ? `${r.app_campaigns} on the app` : ''}
          </div>
        </div>
      </div>
      <div className="mt-[0.9vw]"><Health h={r.health} days={r.review_days} /></div>
      {r.creators > 0 ? (
        <>
          <div className="mt-[1.3vw] flex items-baseline gap-[0.4vw]">
            <NumberTicker value={working} className="text-[4.6vw] font-semibold leading-none tracking-[-0.04em]" style={{ color: INK }} />
            <span className="text-[0.95vw]" style={{ color: MUTED }}>creators working{r.live ? `, ${r.live} live` : ''}</span>
          </div>
          <div className="mt-[0.9vw] flex h-[0.7vw] w-full overflow-hidden rounded-full" style={{ background: '#EEF0EA' }}>
            {seg(r.live, INK)}{seg(r.moved_7d, LIME)}{seg(r.stuck, '#FFB3A6')}
          </div>
          <div className="mt-[0.6vw] flex flex-wrap gap-x-[1vw] gap-y-[0.2vw] whitespace-nowrap text-[0.76vw]" style={{ color: MUTED }}>
            <span><b style={{ color: INK }}>{r.moved_7d}</b> moved this week</span>
            <span><b style={{ color: r.stuck ? RED : INK }}>{r.stuck}</b> need attention</span>
            {r.in_review > 0 && <span><b style={{ color: INK }}>{r.in_review}</b> with the client</span>}
          </div>
        </>
      ) : (
        <div className="mt-[1.3vw] flex items-baseline gap-[0.4vw]">
          <NumberTicker value={r.app_creators} className="text-[4.6vw] font-semibold leading-none tracking-[-0.04em]" style={{ color: INK }} />
          <span className="text-[0.95vw]" style={{ color: MUTED }}>creators on the app</span>
        </div>
      )}
    </motion.div>
  )
}

export function ClientsScreen({ slide }: { slide: Slide }) {
  const rows: any[] = (slide.rows ?? []).slice(0, 8)
  const moving = rows.filter(r => r.health === 'moving').length
  const stalled = rows.filter(r => r.health === 'stalled').length
  const waiting = rows.filter(r => r.health === 'waiting_client').length
  return (
    <div className="flex h-full flex-col">
      <Title sub={<>{moving} on track · {stalled} need a push · {waiting} waiting on the client</>}>Clients</Title>
      <div className="mt-[1.1vw] grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-[1.1vw]">
        {rows.map((r, i) => <ClientCard key={r.id} r={r} i={i} />)}
      </div>
    </div>
  )
}

/* ── Campaigns as orbits ─────────────────────────────────────────────────────────── */

function OrbitSystem({ c, scale = 1 }: { c: any; scale?: number }) {
  const rings: any[][] = [[], [], [], []]
  for (const p of c.people) rings[RING_OF[p.state] ?? 0].push(p)
  const step = c.steps.find((s: any) => s.active)
  const radii = [7.2, 10.4, 13.6, 16.8].map(r => `${r * scale}vw`)
  const face = `${3.1 * scale}vw`
  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      <div className="relative" style={{ width: `${36 * scale}vw`, height: `${36 * scale}vw` }}>
        {rings.map((people, i) => people.length > 0 && (
          <Orbit key={i} radius={radii[i]} duration={55 + i * 25} reverse={i % 2 === 1} dashed ringColour="rgba(21,24,26,0.14)">
            {people.slice(0, 8).map((p, j) => (
              <div key={p.name + j} title={p.name}>
                <Face src={p.avatar} name={p.name} size={face} ring={i === 3 ? LIME : i === 2 ? '#F3FFB0' : '#fff'} />
              </div>
            ))}
          </Orbit>
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo src={c.logo} name={c.client ?? c.name} size={`${7.4 * scale}vw`} />
        </div>
      </div>
      <div className="mt-[0.2vw] flex flex-col items-center text-center">
        <div className="text-[1.15vw] font-semibold tracking-tight" style={{ color: INK }}>{c.name}</div>
        <div className="mt-[0.35vw] flex items-baseline gap-[0.45vw]">
          <span className="text-[2.6vw] font-semibold leading-none tracking-[-0.03em]" style={{ color: INK }}>{step?.count ?? c.total}</span>
          <span className="text-[1.05vw]" style={{ color: MUTED }}>of {c.total} {step ? STOP_WORD[step.key] ?? step.label.toLowerCase() : 'on board'}</span>
        </div>
        <div className="mt-[0.6vw] flex items-center gap-[0.5vw]">
          <Health h={c.health} days={c.oldest_review_days} />
          <span className="text-[0.78vw]" style={{ color: MUTED }}>{c.moved_7d} moved this week{c.stuck ? ` · ${c.stuck} need attention` : ''}</span>
        </div>
      </div>
    </div>
  )
}

export function OrbitsScreen({ slide }: { slide: Slide }) {
  const rows: any[] = slide.rows ?? []
  const per = 2
  const pages = Math.max(1, Math.ceil(rows.length / per))
  const [page, setPage] = useState(0)
  useEffect(() => {
    if (pages < 2) return
    const t = setInterval(() => setPage(p => (p + 1) % pages), 12000)
    return () => clearInterval(t)
  }, [pages])
  const shown = rows.slice(page * per, page * per + per)
  return (
    <div className="flex h-full flex-col">
      <Title sub={<>{rows.length} running · outer ring is furthest along · lime ring is live</>}>Campaigns</Title>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={page} className="grid h-full grid-cols-2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.8 }}>
            {shown.map(c => <OrbitSystem key={c.id} c={c} scale={1.02} />)}
          </motion.div>
        </AnimatePresence>
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-[0.4vw]">
          {Array.from({ length: pages }).map((_, i) => <span key={i} className="h-[0.3vw] rounded-full transition-all duration-700" style={{ width: i === page ? '1.8vw' : '0.3vw', background: i === page ? INK : 'rgba(21,24,26,0.2)' }} />)}
        </div>
      )}
    </div>
  )
}

/* ── Stuck ───────────────────────────────────────────────────────────────────────── */

const ACTION: Record<string, string> = {
  'the brief': 'Need a brief', 'the package': 'Package not shipped', 'the courier': 'Package not delivered',
  'delivery': 'Package not delivered', 'their content': 'Content overdue', "the client's yes": 'Awaiting client approval',
  'the post going live': 'Not posted yet', 'the next step': 'No next step',
}
const act = (w: string) => ACTION[w] ?? w

export function StuckScreen({ slide }: { slide: Slide }) {
  const rows: any[] = slide.rows ?? []
  const by: [string, number][] = slide.by_waiting ?? []
  const top = Math.max(1, ...by.map(b => b[1]))
  const total = slide.total ?? rows.length
  return (
    <div className="flex h-full flex-col">
      <Title sub={<>{total} creators with no movement for 5 days or more</>}>Needs attention</Title>
      <div className="mt-[1.1vw] grid min-h-0 flex-1 grid-cols-12 gap-[2vw]">
        <div className="col-span-4 flex flex-col justify-center gap-[1vw]">
          {by.map(([what, n], i) => (
            <motion.div key={what} initial={{ opacity: 0, x: '-1vw' }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-baseline justify-between">
                <span className="text-[1.05vw] font-semibold" style={{ color: INK }}>{act(what)}</span>
                <span className="text-[1.4vw] font-semibold tabular-nums" style={{ color: INK }}>{n}</span>
              </div>
              <div className="mt-[0.4vw] h-[0.8vw] w-full overflow-hidden rounded-full" style={{ background: '#EEF0EA' }}>
                <motion.div className="h-full rounded-full" style={{ background: what === "the client's yes" ? '#FFD66B' : '#FFB3A6' }} initial={{ width: 0 }} animate={{ width: `${(n / top) * 100}%` }} transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }} />
              </div>
            </motion.div>
          ))}
        </div>
        <div className="col-span-8 grid grid-cols-6 content-start gap-x-[1vw] gap-y-[1.2vw]">
          {rows.slice(0, 18).map((r, i) => (
            <motion.div key={r.name + i} className="flex flex-col items-center text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 220, damping: 20 }}>
              <div className="relative">
                <Face src={r.avatar} name={r.name} size="6vw" />
                <span className="absolute -right-[0.2vw] -top-[0.2vw] rounded-full px-[0.55vw] py-[0.25vw] text-[0.72vw] font-semibold tabular-nums" style={{ background: INK, color: '#fff' }}>{r.days}d</span>
              </div>
              <div className="mt-[0.6vw] w-full truncate text-[0.95vw] font-semibold" style={{ color: INK }}>{r.name}</div>
              <div className="w-full truncate text-[0.72vw]" style={{ color: MUTED }}>{r.client ?? r.campaign}</div>
              <div className="w-full truncate text-[0.72vw]" style={{ color: RED }}>{act(r.waiting_for)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── This week ───────────────────────────────────────────────────────────────────── */

const WEEK_LABEL: Record<string, string> = {
  live: 'Went live', approved: 'Approved by client', content: 'Content delivered', received: 'Received package',
  dispatched: 'Package shipped', briefed: 'Briefed', signed: 'Signed on',
}

export function WeekScreen({ slide }: { slide: Slide }) {
  const groups: any[] = slide.groups ?? []
  const tw = slide.this_week ?? 0, lw = slide.last_week ?? 0
  return (
    <div className="flex h-full flex-col">
      <Title sub={<>{tw} moves · {lw} the week before{tw > lw ? ' · faster' : tw < lw ? ' · slower' : ''}</>}>This week</Title>
      <div className="mt-[1.1vw] flex min-h-0 flex-1 flex-col gap-[0.9vw]">
        {groups.map((g, i) => (
          <motion.div key={g.kind} className="flex min-h-0 flex-1 items-center gap-[1.4vw] rounded-[1.2vw] bg-white px-[1.6vw] py-[0.8vw]" style={{ boxShadow: '0 0.5vw 1.6vw rgba(21,24,26,0.06), 0 0 0 1px rgba(21,24,26,0.05)' }}
            initial={{ opacity: 0, x: '1vw' }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="w-[13vw] shrink-0">
              <div className="text-[1.15vw] font-semibold leading-tight" style={{ color: INK }}>{WEEK_LABEL[g.kind] ?? g.label}</div>
              <div className="text-[0.78vw]" style={{ color: MUTED }}>{g.last_week} last week</div>
            </div>
            <div className="w-[5vw] shrink-0 text-[3.2vw] font-semibold leading-none tabular-nums tracking-[-0.03em]" style={{ color: g.this_week ? INK : 'rgba(21,24,26,0.25)' }}>{g.this_week}</div>
            <div className="flex min-w-0 flex-1 items-center">
              {g.people.map((p: any, j: number) => (
                <div key={p.name + j} className={j > 0 ? '-ml-[0.6vw]' : ''} title={`${p.name} · ${p.campaign}`}>
                  <Face src={p.avatar} name={p.name} size="4vw" soft />
                </div>
              ))}
              {g.this_week > g.people.length && <span className="ml-[0.8vw] text-[0.85vw]" style={{ color: MUTED }}>+{g.this_week - g.people.length}</span>}
              {g.people.length > 0 && <span className="ml-[1.2vw] truncate text-[0.85vw]" style={{ color: MUTED }}>{Array.from(new Set(g.people.map((p: any) => p.client ?? p.campaign))).slice(0, 3).join(' · ')}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
