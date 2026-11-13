'use client'

/**
 * The office wall's screens (founder, 13 Nov 2026, sixth cut).
 *
 * Built around how the agency works, not around a dashboard: every button the team presses
 * in the product becomes a moment on the wall (see moments.ts), and the four screens answer
 * the four questions the room asks. What just happened (Live). Who is holding the work
 * (Lanes). Which creators have sat still and what for (Attention). What the week moved,
 * stop by stop (Week). Clients and Spotlight stay as they were.
 *
 * Faces and logos before words. Lime is a surface, never a text colour. No money, ever.
 * Magic UI (OrbitingCircles, NumberTicker, BorderBeam, BlurFade) via the shadcn CLI.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame } from 'motion/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BorderBeam } from '@/components/ui/border-beam'
import { BlurFade } from '@/components/ui/blur-fade'
import { timeAgo, useNow, type Slide } from './parts'
import { logoFor, type Moment } from './moments'

export const LIME = '#D3FF02'
export const INK = '#15181A'
export const MUTED = '#6F746B'
export const RED = '#E8503A'
export const AMBER = '#C98A00'
const SOFT = '#EEF0EA'

/* ── atoms ───────────────────────────────────────────────────────────────────────── */

export function Face({ src, name, size, ring }: { src?: string | null; name?: string | null; size: number; ring?: string }) {
  const initial = String(name ?? '?').replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <Avatar className="shrink-0 rounded-full bg-[#E9EBE4]" style={{ height: size, width: size, border: `${Math.max(2, size * 0.05)}px solid ${ring ?? '#fff'}`, boxShadow: '0 6px 16px rgba(21,24,26,0.16)' }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
      <AvatarFallback className="rounded-full bg-[#E9EBE4] font-semibold" style={{ fontSize: size * 0.38, color: MUTED }}>{initial}</AvatarFallback>
    </Avatar>
  )
}

export function Logo({ src, name, size, ring }: { src?: string | null; name?: string | null; size: number; ring?: string }) {
  return (
    <Avatar className="shrink-0 overflow-hidden bg-white" style={{ height: size, width: size, borderRadius: size * 0.24, boxShadow: `0 8px 20px rgba(21,24,26,0.14), 0 0 0 ${ring ? 3 : 1}px ${ring ?? 'rgba(21,24,26,0.06)'}` }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="h-full w-full object-cover" /> : null}
      <AvatarFallback className="bg-white" style={{ borderRadius: size * 0.24, fontSize: size * 0.3, fontWeight: 700, color: INK }}>
        {String(name ?? '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}

/** Overlapping logos or faces, the way a group chat shows its members. */
function Pile({ items, size = 30, max = 5, logos = false }: { items: { src?: string | null; name: string }[]; size?: number; max?: number; logos?: boolean }) {
  const shown = items.slice(0, max)
  const more = items.length - shown.length
  return (
    <div className="flex items-center" style={{ paddingLeft: size * 0.3 }}>
      {shown.map((it, i) => (
        <div key={it.name + i} style={{ marginLeft: -size * 0.3, zIndex: shown.length - i }}>
          {logos ? <Logo src={it.src} name={it.name} size={size} /> : <Face src={it.src} name={it.name} size={size} />}
        </div>
      ))}
      {more > 0 && <span className="ml-2 text-[13px] font-semibold tabular-nums" style={{ color: MUTED }}>+{more}</span>}
    </div>
  )
}

const HEALTH: Record<string, { label: (d?: number) => string; bg: string; fg: string }> = {
  moving: { label: () => 'On track', bg: LIME, fg: INK },
  done: { label: () => 'Done', bg: INK, fg: '#fff' },
  stalled: { label: () => 'Needs a push', bg: '#FFE3DD', fg: RED },
  waiting_client: { label: d => d ? `Waiting on client · ${d} days` : 'Waiting on client', bg: '#FFF0C7', fg: AMBER },
}
export function Health({ h, days, big = false }: { h: string; days?: number; big?: boolean }) {
  const m = HEALTH[h] ?? HEALTH.moving
  return <span className={`inline-flex items-center rounded-full font-semibold leading-none ${big ? 'px-4 py-2 text-[17px]' : 'px-3 py-1.5 text-[13px]'}`} style={{ background: m.bg, color: m.fg }}>{m.label(days)}</span>
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`relative flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-white ${className}`} style={{ boxShadow: '0 12px 40px rgba(21,24,26,0.07), 0 0 0 1px rgba(21,24,26,0.05)', ...style }}>{children}</div>
}

function Kicker({ children, right, className = '' }: { children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between px-8 pt-7 pb-4 ${className}`}>
      <div className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>{children}</div>
      {right && <div className="text-[15px]" style={{ color: MUTED }}>{right}</div>}
    </div>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] leading-none" style={{ background: tone, color: INK }}>{children}</span>
}

/* ── live: one row per campaign, faces with one word each ────────────────────────── */

type Row = { key: string; title: string; sub?: string | null; logo?: string | null; at: string; items: Moment[]; kind: 'campaign' | 'applied' }

function groupRows(moments: Moment[], logos: Record<string, string>): Row[] {
  const rows = new Map<string, Row>()
  for (const m of moments) {
    const kind: Row['kind'] = m.kind === 'applied' || m.kind === 'reply' ? 'applied' : 'campaign'
    const key = kind === 'applied' ? 'applied' : (m.campaign ?? m.client ?? 'elsewhere')
    let r = rows.get(key)
    if (!r) {
      r = { key, kind, at: m.at, items: [], logo: m.logo,
            title: kind === 'applied' ? 'Creators coming in' : (m.campaign ?? m.client ?? 'Elsewhere'),
            sub: kind === 'applied' ? 'applied on WhatsApp, the app or replied on Instagram' : (m.client && m.client !== m.campaign ? m.client : null) }
      rows.set(key, r)
    }
    if (!r.logo && m.logo) r.logo = m.logo
    if (!r.logo) r.logo = logoFor(m.campaign, logos) ?? logoFor(m.client, logos)
    r.items.push(m)
  }
  // Staff bursts on one row merge: six "+1 to roster" chips become "+6 to roster".
  for (const r of rows.values()) {
    const merged: Moment[] = []
    const idx = new Map<string, number>()
    for (const m of r.items) {
      const k = m.kind === 'roster' && !/opened/i.test(m.line) ? 'roster' : m.kind === 'rate' ? 'rate' : null
      if (!k) { merged.push(m); continue }
      const n = parseInt((m.line.match(/\d+/) || ['1'])[0], 10)
      const at = idx.get(k)
      if (at == null) { idx.set(k, merged.length); merged.push({ ...m, verb: k === 'roster' ? `+${n} to roster` : `Rates · ${n}`, line: String(n) }) }
      else { const t = parseInt(merged[at].line, 10) + n; merged[at] = { ...merged[at], line: String(t), verb: k === 'roster' ? `+${t} to roster` : `Rates · ${t}` } }
    }
    r.items = merged
  }
  return [...rows.values()].sort((a, b) => (a.at < b.at ? 1 : -1))
}

const CHIP_TONE: Record<string, string> = { live: LIME, approved: LIME, confirmed: LIME, signed: LIME, content: '#E4F7EA', review: '#E4F7EA', done: '#E4F7EA', request: '#FFF0C7', note: '#FFF0C7', agreement: '#FFF0C7', reply: '#CFE8FF', applied: '#CFE8FF' }

/** A creator's face and one word; or, for something staff did, the staff name and the word. */
function Chip({ m, now, beam }: { m: Moment; now: number; beam: boolean }) {
  const creator = !!(m.avatar || (!m.actor && m.name))
  const tone = CHIP_TONE[m.kind] ?? '#F1F2ED'
  const mark = m.avatar ? <Face src={m.avatar} name={m.name} size={50} /> : (!m.actor && m.logo) ? <Logo src={m.logo} name={m.client ?? m.name} size={50} /> : null
  return (
    <motion.div className="relative flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4" style={{ background: tone }}
      animate={{ boxShadow: beam ? `0 0 0 4px ${LIME}` : `0 0 0 0px ${LIME}` }} transition={{ duration: 0.8 }}>
      {creator ? (mark ?? <Face src={m.avatar} name={m.name} size={50} />) : <span className="inline-flex h-[50px] items-center rounded-full bg-white px-3.5 text-[15px] font-semibold" style={{ color: INK }}>{m.actor ?? m.name}</span>}
      <div className="min-w-0">
        <div className={`${m.kind === 'note' || m.kind === 'request' || m.kind === 'done' ? 'max-w-[520px]' : 'max-w-[220px]'} truncate text-[18px] font-semibold leading-tight`} style={{ color: INK }}>{creator ? String(m.name).replace(/^@/, '') : m.verb}</div>
        <div className="truncate text-[13px] leading-tight" style={{ color: MUTED }}>{creator ? m.verb : timeAgo(m.at, now)}{creator ? ` · ${timeAgo(m.at, now)}` : ''}</div>
      </div>
    </motion.div>
  )
}

/**
 * Live: one row per campaign, newest first. The client's mark and the campaign name on the
 * left, then every creator who moved this week as a face with one word (Signed, Briefed,
 * Shipped, Filming, Content in, Approved, Live) and what staff did on it (+3 to roster,
 * Rates · 2, a request, a note). Creators coming in through Scout share one row. A moment
 * that lands while the wall is up gets a ring for a minute.
 */
export function Feed({ moments, fresh, logos }: { moments: Moment[]; fresh: Map<string, number>; logos: Record<string, string> }) {
  const now = useNow(10_000)
  const rows = useMemo(() => groupRows(moments, logos).slice(0, 5), [moments, logos])
  const beam = (id: string) => { const t = fresh.get(id); return t != null && now - t < 60_000 }
  return (
    <Card className="h-full">
      <Kicker right={<span className="inline-flex items-center gap-2"><motion.span className="h-2.5 w-2.5 rounded-full" style={{ background: LIME, boxShadow: '0 0 0 2px rgba(21,24,26,0.15)' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />this week, newest first</span>}>Live</Kicker>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 pb-6">
        <AnimatePresence initial={false}>
          {rows.map(r => (
            <motion.div key={r.key} layout className="flex min-h-0 flex-1 items-center gap-6 rounded-[24px] px-6 py-4" style={{ background: '#F7F8F4' }}
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
              <div className="flex w-[380px] shrink-0 items-center gap-4">
                {r.kind === 'applied' ? <span className="inline-flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-white text-[24px] font-semibold" style={{ color: INK, boxShadow: '0 0 0 1px rgba(21,24,26,0.06)' }}>+{r.items.length}</span> : <Logo src={r.logo} name={r.title} size={72} />}
                <div className="min-w-0">
                  <div className="line-clamp-2 text-[21px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: INK }}>{r.title}</div>
                  {r.sub && <div className="mt-0.5 line-clamp-2 text-[13px] leading-tight" style={{ color: MUTED }}>{r.sub}</div>}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 py-1">
                {r.items.slice(0, 5).map(m => <Chip key={m.id} m={m} now={now} beam={beam(m.id)} />)}
                {r.items.length > 5 && <span className="shrink-0 text-[15px] font-semibold" style={{ color: MUTED }}>+{r.items.length - 5}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}

/* ── the spotlight ───────────────────────────────────────────────────────────────── */

const RING_OF: Record<string, number> = { confirmed: 0, briefed: 0, product_ready: 1, dispatched: 1, received: 1, content_in: 2, content_approved: 2, live: 2 }
const STOP: Record<string, string> = { confirmed: 'on board', briefed: 'briefed', dispatch: 'with the courier', filming: 'filming', review: 'with the client', live: 'live', complete: 'wrapped' }

const WORD: Record<string, string> = { confirmed: 'On board', briefed: 'Briefed', product_ready: 'Packing', dispatched: 'Shipped', received: 'Filming', content_in: 'With client', content_approved: 'Approved', live: 'Live' }
const RADII = [140, 216, 296]
const SPEED = [1 / 46, -1 / 64, 1 / 82] // turns per second, the middle ring the other way

/**
 * Creators circle the client. As each one passes the top of its ring it grows a little and
 * says where it is in the campaign in a word or two (founder, 13 Nov 2026: "once they near
 * the focal point they should have a 1-2 word current status"). Drawn by hand with one
 * animation frame loop writing transforms straight to the nodes, no re-render per frame.
 */
function Orbit({ c, words = true }: { c: any; words?: boolean }) {
  const rings: any[][] = [[], [], []]
  for (const p of c.people) rings[RING_OF[p.state] ?? 0].push(p)
  const nodes = useRef<Map<string, HTMLDivElement>>(new Map())
  const labels = useRef<Map<string, HTMLDivElement>>(new Map())
  const t0 = useRef<number>(0)
  useAnimationFrame(t => {
    if (!t0.current) t0.current = t
    const sec = (t - t0.current) / 1000
    rings.forEach((people, r) => {
      const n = people.length
      if (!n) return
      people.slice(0, 14).forEach((p, j) => {
        const key = `${r}-${j}`
        const el = nodes.current.get(key), lb = labels.current.get(key)
        if (!el) return
        // angle from the top, clockwise, in turns
        let a = (j / Math.min(n, 14) + sec * SPEED[r]) % 1
        if (a < 0) a += 1
        const rad = a * Math.PI * 2
        const x = Math.sin(rad) * RADII[r], y = -Math.cos(rad) * RADII[r]
        // how close to the top: 1 at the top, 0 beyond 7% of a turn either side
        const d = Math.min(a, 1 - a)
        const near = Math.max(0, 1 - d / 0.07)
        const sc = 1 + near * 0.3
        el.style.transform = `translate(${x}px, ${y}px) scale(${sc})`
        el.style.zIndex = near > 0 ? '3' : '1'
        if (lb) { lb.style.opacity = words ? String(Math.min(1, near * 1.6)) : '0'; lb.style.transform = `translate(${x}px, ${y - (r === 2 ? 66 : 56) * sc / 2 - 24}px) scale(${0.85 + near * 0.15})` }
      })
    })
  })
  return (
    <div className="relative flex h-[640px] w-[640px] shrink-0 items-center justify-center">
      {RADII.map((rad, r) => rings[r].length > 0 && <div key={r} className="absolute rounded-full" style={{ width: rad * 2, height: rad * 2, border: '1px solid rgba(21,24,26,0.08)' }} />)}
      {rings.map((people, r) => people.slice(0, 14).map((p, j) => {
        const key = `${r}-${j}`
        const size = r === 2 ? 66 : 56
        return (
          <div key={key}>
            <div ref={el => { if (el) nodes.current.set(key, el) }} className="absolute left-1/2 top-1/2 will-change-transform" style={{ marginLeft: -size / 2, marginTop: -size / 2 }}>
              <Face src={p.avatar} name={p.name} size={size} ring={r === 2 ? LIME : '#fff'} />
            </div>
            <div ref={el => { if (el) labels.current.set(key, el) }} className="pointer-events-none absolute left-1/2 top-1/2 z-[4] will-change-transform" style={{ opacity: 0, transform: 'translate(0,-9999px)' }}>
              <div className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[15px] font-semibold leading-none" style={{ color: INK, boxShadow: '0 6px 18px rgba(21,24,26,0.14), 0 0 0 1px rgba(21,24,26,0.06)' }}>
                <span style={{ color: MUTED }}>{String(p.name).replace(/^@/, '').split(' ')[0]}</span> · {WORD[p.state] ?? p.state}
              </div>
            </div>
          </div>
        )
      }))}
      <Logo src={c.logo} name={c.client ?? c.name} size={156} />
    </div>
  )
}

/** How much the 640px orbit has to shrink to fit the screen it is on, with room for the caption. */
function useFit() {
  const [k, setK] = useState(1)
  useEffect(() => {
    const f = () => setK(Math.max(0.5, Math.min(1, (window.innerHeight - 400) / 640, (window.innerWidth - 200) / 1700)))
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [])
  return k
}

/**
 * Three campaigns on screen: the one in the spotlight big in the middle, the one before it
 * and the one after it small on either side. On each turn the left one leaves, the middle
 * one slides left and shrinks, the right one slides into the middle and grows, and the next
 * campaign arrives on the right. One spring moves all of them together, and the whole thing
 * scales to the screen it is on (founder, 13 Nov 2026: "one big, two small").
 */
export function Spotlight({ rows }: { rows: any[] }) {
  const [i, setI] = useState(0)
  const k = useFit()
  useEffect(() => {
    if (rows.length < 2) return
    const t = setInterval(() => setI(x => (x + 1) % rows.length), 15000)
    return () => clearInterval(t)
  }, [rows.length])
  const n = rows.length
  if (!n) return <Card className="h-full"><Kicker>Campaigns</Kicker></Card>
  const at = (j: number) => rows[((j % n) + n) % n]
  const slots: { pos: -1 | 0 | 1; c: any }[] = n >= 3
    ? [{ pos: -1, c: at(i - 1) }, { pos: 0, c: at(i) }, { pos: 1, c: at(i + 1) }]
    : n === 2 ? [{ pos: 0, c: at(i) }, { pos: 1, c: at(i + 1) }] : [{ pos: 0, c: at(i) }]
  const step = (c: any) => c.steps.find((x: any) => x.active)
  const X = 640 * k * 1.02
  const spring = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.1 }
  return (
    <Card className="h-full">
      <Kicker right={<>{i + 1} of {n}</>}>Campaigns</Kicker>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {slots.map(({ pos, c }) => {
            const big = pos === 0
            return (
              <motion.div key={c.id} className="absolute left-1/2 top-1/2 flex flex-col items-center" style={{ width: 640, marginLeft: -320, marginTop: -380 }}
                initial={{ x: X * 1.9, scale: 0.2 * k, opacity: 0 }}
                animate={{ x: pos * X, scale: (big ? 1 : 0.46) * k, opacity: big ? 1 : 0.8 }}
                exit={{ x: -X * 1.9, scale: 0.2 * k, opacity: 0 }}
                transition={spring}>
                <Orbit c={c} words={big} />
                <div className="mt-2 text-center" style={{ width: big ? 640 : 900 }}>
                  <div className={`${big ? 'text-[26px]' : 'text-[42px]'} font-semibold leading-tight tracking-tight`} style={{ color: INK }}>{c.name}</div>
                  {big ? (
                    <>
                      <div className="mt-1 flex items-baseline justify-center gap-2">
                        <span className="text-[46px] font-semibold leading-none tracking-[-0.03em]" style={{ color: INK }}>{step(c)?.count ?? c.total}</span>
                        <span className="text-[19px]" style={{ color: MUTED }}>of {c.total} {step(c) ? STOP[step(c).key] ?? step(c).label.toLowerCase() : 'on board'}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <Health h={c.health} days={c.oldest_review_days} />
                        <span className="text-[15px]" style={{ color: MUTED }}>{c.moved_7d} moved this week{c.stuck ? ` · ${c.stuck} need attention` : ''}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 flex items-center justify-center gap-4 text-[32px]" style={{ color: MUTED }}><span style={{ transform: 'scale(2)', transformOrigin: 'right center' }}><Health h={c.health} days={c.oldest_review_days} /></span><span>{c.total} creators</span></div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Card>
  )
}

/* ── the clients strip in the header ─────────────────────────────────────────────── */

export function ClientsStrip({ rows }: { rows: any[] }) {
  const ring: Record<string, string> = { moving: LIME, stalled: '#FFB3A6', waiting_client: '#FFD66B', done: INK }
  return (
    <div className="flex items-center gap-3">
      {rows.slice(0, 8).map(r => (
        <BlurFade key={r.id} delay={0.05} inView>
          <div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3" style={{ boxShadow: '0 0 0 1px rgba(21,24,26,0.06)' }} title={r.name}>
            <Logo src={r.logo} name={r.name} size={28} ring={ring[r.health]} />
            <span className="text-[13px] font-medium" style={{ color: INK }}>{r.name.split(' ')[0]}</span>
            <span className="text-[13px] tabular-nums" style={{ color: MUTED }}>{r.creators || r.app_creators}</span>
          </div>
        </BlurFade>
      ))}
    </div>
  )
}

/* ── clients: one card each, four to a screen ────────────────────────────────────── */

export function ClientsScreen({ rows }: { rows: any[] }) {
  const per = 4
  const pages = Math.max(1, Math.ceil(rows.length / per))
  const [page, setPage] = useState(0)
  useEffect(() => {
    if (pages < 2) return
    const t = setInterval(() => setPage(p => (p + 1) % pages), 10000)
    return () => clearInterval(t)
  }, [pages])
  const shown = rows.slice(page * per, page * per + per)
  return (
    <AnimatePresence mode="wait">
      <motion.div key={page} className="grid h-full grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        {shown.map((r, i) => {
          const working = Math.max(0, (r.creators ?? 0) - (r.live ?? 0))
          const total = Math.max(1, r.creators ?? 0)
          return (
            <BlurFade key={r.id} delay={i * 0.08} inView className="min-h-0">
              <Card className="h-full">
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-8 py-10 text-center">
                  <Logo src={r.logo} name={r.name} size={132} />
                  <div className="mt-7 text-[28px] font-semibold leading-tight tracking-[-0.02em]" style={{ color: INK }}>{r.name}</div>
                  <div className="mt-1 text-[15px]" style={{ color: MUTED }}>
                    {r.campaigns ? `${r.campaigns} campaign${r.campaigns === 1 ? '' : 's'}` : ''}{r.campaigns && r.app_campaigns ? ' · ' : ''}{r.app_campaigns ? `${r.app_campaigns} on the app` : ''}
                  </div>
                  <div className="mt-4"><Health h={r.health} days={r.review_days} big /></div>
                  <div className="mt-12 w-full">
                    {r.creators > 0 ? (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <NumberTicker value={working} className="text-[88px] font-semibold leading-none tracking-[-0.05em]" style={{ color: INK }} />
                          <span className="text-[18px]" style={{ color: MUTED }}>creators working</span>
                        </div>
                        <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full" style={{ background: SOFT }}>
                          {r.live > 0 && <div style={{ width: `${(r.live / total) * 100}%`, background: INK }} />}
                          {r.moved_7d > 0 && <div style={{ width: `${(r.moved_7d / total) * 100}%`, background: LIME }} />}
                          {r.stuck > 0 && <div style={{ width: `${(r.stuck / total) * 100}%`, background: '#FFB3A6' }} />}
                        </div>
                        <div className="mt-3 flex justify-center gap-5 text-[14px]" style={{ color: MUTED }}>
                          <span><b style={{ color: INK }}>{r.moved_7d}</b> moved this week</span>
                          <span><b style={{ color: r.stuck ? RED : INK }}>{r.stuck}</b> need attention</span>
                        </div>
                        {r.in_review > 0 && <div className="mt-1 text-[14px]" style={{ color: AMBER }}>{r.in_review} pieces with the client for {r.review_days} days</div>}
                      </>
                    ) : (
                      <div className="flex items-baseline justify-center gap-2">
                        <NumberTicker value={r.app_creators} className="text-[88px] font-semibold leading-none tracking-[-0.05em]" style={{ color: INK }} />
                        <span className="text-[18px]" style={{ color: MUTED }}>creators on the app</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </BlurFade>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}

/* ── whose move: the work waiting on each role, with the faces behind it ─────────── */

const ROLE_NAME: Record<string, string> = { talent: 'Talent', am: 'Account managers', client: 'Clients' }
const SHORT: Record<string, string> = {
  'rosters below target': 'Rosters to fill',
  'creators to agree a rate with': 'Rates to agree',
  'creators to brief': 'To brief',
  'content to chase': 'Content to chase',
  'post links to get': 'Links to get',
  'content to send to the client': 'Content to send',
  'open requests': 'Open requests',
  'pieces of content to approve': 'Content to approve',
  'proposals to answer': 'Proposals to answer',
}

function Mini({ p, logos, badge }: { p: any; logos: Record<string, string>; badge?: string }) {
  const logo = logoFor(p.client, logos) ?? logoFor(p.campaign, logos)
  return (
    <div className="flex w-[78px] flex-col items-center text-center">
      <div className="relative">
        <Face src={p.avatar} name={p.name} size={60} />
        {logo && <span className="absolute -bottom-1 -left-1"><Logo src={logo} name={p.client} size={22} /></span>}
        {badge && <span className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums" style={{ background: INK, color: '#fff' }}>{badge}</span>}
      </div>
      <div className="mt-1.5 w-full truncate text-[12px] font-semibold" style={{ color: INK }}>{String(p.name).replace(/^@/, '').split(' ')[0]}</div>
    </div>
  )
}

/** One kind of work: a title, the count, then the people (faces) or the things (rows). */
function Work({ it, logos, dense }: { it: any; logos: Record<string, string>; dense: boolean }) {
  const people: any[] = it.people ?? []
  const cap = dense ? 6 : 12
  const rows: any[] = it.rows ?? []
  return (
    <div className="rounded-[22px] bg-white p-4" style={{ boxShadow: '0 0 0 1px rgba(21,24,26,0.06)' }}>
      <div className="flex items-baseline justify-between">
        <div className="text-[19px] font-semibold tracking-[-0.01em]" style={{ color: INK }}>{SHORT[it.label] ?? it.label}</div>
        <div className="text-[26px] font-semibold tabular-nums leading-none tracking-[-0.03em]" style={{ color: INK }}>{it.n}</div>
      </div>
      {people.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-1 gap-y-3">
          {people.slice(0, people.length > cap ? cap - 1 : cap).map((p, i) => <Mini key={p.name + i} p={p} logos={logos} badge={p.days != null ? `${p.days}d` : undefined} />)}
          {people.length > cap && <div className="flex h-[60px] w-[78px] items-center justify-center text-[15px] font-semibold" style={{ color: MUTED }}>+{people.length - cap + 1}</div>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {rows.slice(0, 6).map((r, i) => {
            const logo = logoFor(r.client, logos) ?? logoFor(r.name, logos)
            const pct = r.target ? Math.min(100, Math.round(((r.shortlisted ?? 0) / r.target) * 100)) : null
            return (
              <div key={r.name + i} className="flex items-center gap-3">
                <Logo src={logo} name={r.client ?? r.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight" style={{ color: INK }}>{r.name}</div>
                  {pct != null
                    ? <div className="mt-1.5 flex items-center gap-2"><div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: SOFT }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: INK }} /></div><span className="text-[12px] tabular-nums" style={{ color: MUTED }}>{r.shortlisted ?? 0} of {r.target}</span></div>
                    : <div className="truncate text-[12px]" style={{ color: MUTED }}>{[r.client && r.client !== r.name ? r.client : null, r.n ? `${r.n} creators` : null, r.days ? `${r.days} days` : null].filter(Boolean).join(' · ')}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Whose move it is: three columns, one per role, each kind of work with the faces of the
 * creators it is about, wearing the client's mark. No bars, no bubbles: people and marks.
 */
export function BallScreen({ ball }: { ball?: Slide }) {
  const roles: any[] = (ball?.roles ?? []).filter((r: any) => r.key !== 'bd' && r.key !== 'founders')
  const logos: Record<string, string> = ball?.logos ?? {}
  return (
    <Card className="h-full">
      <Kicker right="what is waiting on whom, right now">Whose move</Kicker>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 px-6 pb-6">
        {roles.map((r, i) => (
          <BlurFade key={r.key} delay={i * 0.08} inView className="min-h-0">
            <div className="flex h-full flex-col overflow-hidden rounded-[24px] p-3" style={{ background: '#F7F8F4' }}>
              <div className="flex items-baseline justify-between px-2 pb-3 pt-1">
                <div className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>{ROLE_NAME[r.key] ?? r.role}</div>
                <div className="text-[15px]" style={{ color: MUTED }}>{r.total ? `${r.total} waiting` : 'all clear'}</div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                {r.items.map((it: any) => <Work key={it.key ?? it.label} it={it} logos={logos} dense={r.items.length >= 4} />)}
              </div>
            </div>
          </BlurFade>
        ))}
      </div>
    </Card>
  )
}

/* ── attention: who has sat still, grouped by what they wait for ─────────────────── */

const WAIT: Record<string, { label: string; ours: boolean }> = {
  'the brief': { label: 'No brief yet', ours: true },
  'the package': { label: 'Package not sent', ours: true },
  'the courier': { label: 'With the courier', ours: true },
  'delivery': { label: 'Not delivered', ours: true },
  'their content': { label: 'Content overdue', ours: true },
  "the client's yes": { label: 'Client to approve', ours: false },
  'the post going live': { label: 'Not posted yet', ours: true },
}

/**
 * One column per thing people are waiting for, widest first. The faces are the creators,
 * each with how many days it has been. Red headers are ours to fix; amber is the client's.
 */
export function AttentionScreen({ stuck }: { stuck?: Slide }) {
  const rows: any[] = stuck?.rows ?? []
  const by: [string, number][] = stuck?.by_waiting ?? []
  const logos: Record<string, string> = stuck?.logos ?? {}
  const total = stuck?.total ?? rows.length
  const cols = by.slice(0, 5)
  return (
    <Card className="h-full">
      <Kicker right={<span>still for five days or more · longest wait first</span>}>
        <span className="inline-flex items-baseline gap-3"><span style={{ color: total ? RED : INK }}>{total}</span> creators need attention</span>
      </Kicker>
      <div className="flex min-h-0 flex-1 gap-3 px-6 pb-6">
        {cols.map(([what, n], ci) => {
          const w = WAIT[what] ?? { label: what, ours: true }
          const people = rows.filter(r => r.waiting_for === what)
          return (
            <BlurFade key={what} delay={ci * 0.08} inView className="min-h-0" style={{ flex: `${Math.max(1, n)} 1 200px` }}>
              <div className="flex h-full flex-col overflow-hidden rounded-[22px]" style={{ background: w.ours ? '#FFF1EE' : '#FFF6E0' }}>
                <div className="flex items-baseline justify-between px-5 pt-5">
                  <div className="text-[18px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: w.ours ? RED : AMBER }}>{w.label}</div>
                  <div className="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.04em]" style={{ color: INK }}>{n}</div>
                </div>
                <div className="mt-1 px-5 text-[13px]" style={{ color: MUTED }}>{w.ours ? 'ours to move' : "the client's move"}</div>
                <div className="mt-4 flex min-h-0 flex-1 flex-wrap content-start gap-x-3 gap-y-4 overflow-hidden px-5 pb-4">
                  {people.slice(0, 16).map((r, i) => (
                    <div key={r.name + i} className="flex w-[84px] flex-col items-center text-center">
                      <div className="relative">
                        <Face src={r.avatar} name={r.name} size={68} />
                        <span className="absolute -right-1 -top-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums" style={{ background: INK, color: '#fff' }}>{r.days}d</span>
                        {logos[r.client] && <span className="absolute -bottom-1 -left-1"><Logo src={logos[r.client]} name={r.client} size={24} /></span>}
                      </div>
                      <div className="mt-2 w-full truncate text-[13px] font-semibold" style={{ color: INK }}>{String(r.name).replace(/^@/, '').split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </BlurFade>
          )
        })}
      </div>
    </Card>
  )
}

/* ── the week: the pipeline, stop by stop, this week against last ────────────────── */

const STOPS: { key: string; label: string }[] = [
  { key: 'signed', label: 'Signed' }, { key: 'briefed', label: 'Briefed' }, { key: 'dispatched', label: 'Shipped' }, { key: 'received', label: 'Received' },
  { key: 'content', label: 'Content in' }, { key: 'approved', label: 'Approved' }, { key: 'live', label: 'Live' },
]

export function WeekScreen({ week }: { week?: Slide; creators?: number }) {
  const tw = week?.this_week ?? 0, lw = week?.last_week ?? 0
  const groups: any[] = week?.groups ?? []
  const byKey: Record<string, any> = Object.fromEntries(groups.map(g => [g.kind, g]))
  const d = tw - lw
  const logos: Record<string, string> = week?.logos ?? {}
  return (
    <Card className="h-full">
      <Kicker right={<span><b className="font-semibold" style={{ color: INK }}>{tw} moves</b> this week · {d === 0 ? 'same as last week' : d > 0 ? `${d} more than last week` : `${-d} fewer than last week`}</span>}>This week</Kicker>
      <div className="relative flex min-h-0 flex-1 gap-3 px-6 pb-6">
        <div className="pointer-events-none absolute left-10 right-10 top-[52px] h-[3px] rounded-full" style={{ background: SOFT }}>
          <motion.div className="absolute top-[-4px] h-[11px] w-[11px] rounded-full" style={{ background: INK }} animate={{ left: ['0%', '100%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        {STOPS.map((st, i) => {
          const g = byKey[st.key]
          const n = g?.this_week ?? 0, l = g?.last_week ?? 0
          const dd = n - l
          const people: any[] = g?.people ?? []
          const hot = st.key === 'live' || st.key === 'approved'
          return (
            <BlurFade key={st.key} delay={i * 0.07} inView className="min-h-0 flex-1">
              <div className="flex h-full flex-col rounded-[22px] px-3 pt-3" style={{ background: n ? '#F7F8F4' : 'transparent' }}>
                <div className="flex flex-col items-center">
                  <div className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-full" style={{ background: n ? (hot ? LIME : INK) : SOFT, boxShadow: '0 0 0 6px #fff' }}>
                    <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em]" style={{ color: n ? (hot ? INK : '#fff') : MUTED }}>{n}</span>
                  </div>
                  <div className="mt-3 whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.12em]" style={{ color: n ? INK : MUTED }}>{st.label}</div>
                  <div className="mt-1 text-[13px] tabular-nums" style={{ color: dd < 0 ? RED : MUTED }}>{dd === 0 ? (n ? 'same as last week' : 'none this week') : dd > 0 ? `${dd} more than last week` : `${-dd} fewer than last week`}</div>
                </div>
                <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                  {people.slice(0, 7).map((p, j) => {
                    const logo = logoFor(p.client, logos) ?? logoFor(p.campaign, logos)
                    return (
                      <div key={p.name + j} className="flex items-center gap-2.5 rounded-2xl bg-white px-2.5 py-2" style={{ boxShadow: '0 0 0 1px rgba(21,24,26,0.05)' }}>
                        <Face src={p.avatar} name={p.name} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold leading-tight" style={{ color: INK }}>{String(p.name).replace(/^@/, '')}</div>
                          <div className="truncate text-[12px] leading-tight" style={{ color: MUTED }}>{p.campaign ?? p.client}</div>
                        </div>
                        {logo && <Logo src={logo} name={p.client ?? p.campaign} size={26} />}
                      </div>
                    )
                  })}
                  {people.length > 7 && <div className="text-center text-[13px] font-semibold" style={{ color: MUTED }}>+{people.length - 7} more</div>}
                </div>
              </div>
            </BlurFade>
          )
        })}
      </div>
    </Card>
  )
}
