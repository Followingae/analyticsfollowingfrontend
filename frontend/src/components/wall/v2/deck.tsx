'use client'

/**
 * Wall v2 (founder, 13 Nov 2026): the inspiration's grammar, sized for a TV, with the
 * founder's own atmospheres instead of people.
 *
 * Every slide has the same bones:
 *   left   an atmosphere (ripple, wave, dreamscape, beach, forest, plant) bleeding into the
 *          ground; a title in a light geometric face; one huge number; three callouts pinned
 *          by a lime dot and a hairline
 *   right  a bento of gradient-mesh cards: a label, one big light number, a one-word verdict,
 *          a thin white line drawing (rings, wave, arc) or the faces and marks behind the number
 *
 * Nothing under 18px. Numbers at weight 300. Creators appear only as small faces inside a
 * card, never as the picture. No money, ever.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logoFor, type Moment } from '../moments'
import { timeAgo, useNow } from '../parts'

export const INK = '#15181A'
export const MUTED = '#6F746B'
export const LIME = '#D3FF02'

/* ── meshes ──────────────────────────────────────────────────────────────────────── */
const MESH: Record<string, string> = {
  sage: 'radial-gradient(80% 70% at 20% 10%, #DCE8C6 0%, rgba(220,232,198,0) 60%), radial-gradient(70% 60% at 90% 90%, #B9C9A3 0%, rgba(185,201,163,0) 60%), linear-gradient(160deg, #CFDDB8 0%, #A8B98F 100%)',
  amber: 'radial-gradient(70% 60% at 15% 20%, #F2E2B6 0%, rgba(242,226,182,0) 60%), radial-gradient(60% 60% at 85% 85%, #E6C979 0%, rgba(230,201,121,0) 60%), linear-gradient(160deg, #EBDDB4 0%, #D6B964 100%)',
  dusk: 'radial-gradient(70% 60% at 20% 20%, #F0D7CF 0%, rgba(240,215,207,0) 60%), radial-gradient(70% 60% at 80% 90%, #B9C6D6 0%, rgba(185,198,214,0) 60%), linear-gradient(160deg, #E8D3C9 0%, #A9B8CB 100%)',
  olive: 'radial-gradient(70% 60% at 25% 15%, #E3E7C8 0%, rgba(227,231,200,0) 60%), radial-gradient(60% 60% at 85% 80%, #C6C98F 0%, rgba(198,201,143,0) 60%), linear-gradient(160deg, #DADFBD 0%, #B4B984 100%)',
  rose: 'radial-gradient(70% 60% at 20% 20%, #F1D9CB 0%, rgba(241,217,203,0) 60%), radial-gradient(60% 60% at 85% 85%, #D9A98E 0%, rgba(217,169,142,0) 60%), linear-gradient(160deg, #ECD6C6 0%, #C79A80 100%)',
  sea: 'radial-gradient(70% 60% at 20% 20%, #CFE6E6 0%, rgba(207,230,230,0) 60%), radial-gradient(60% 60% at 85% 85%, #8FBFC4 0%, rgba(143,191,196,0) 60%), linear-gradient(160deg, #C6E0E0 0%, #7FAEB4 100%)',
  night: 'radial-gradient(70% 60% at 20% 20%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 60%), linear-gradient(160deg, #2A2D2B 0%, #121413 100%)',
}
const TONES = ['sage', 'amber', 'dusk', 'olive', 'rose', 'sea']

/* ── atoms ───────────────────────────────────────────────────────────────────────── */

export function Face({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = String(name ?? '?').replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <Avatar className="shrink-0 rounded-full bg-white/60" style={{ height: size, width: size, border: '2px solid rgba(255,255,255,0.85)' }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
      <AvatarFallback className="rounded-full bg-transparent font-normal" style={{ fontSize: size * 0.4, color: INK }}>{initial}</AvatarFallback>
    </Avatar>
  )
}
export function Mark({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  return (
    <Avatar className="shrink-0 overflow-hidden bg-white" style={{ height: size, width: size, borderRadius: size * 0.26 }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="h-full w-full object-cover" /> : null}
      <AvatarFallback className="bg-white" style={{ borderRadius: size * 0.26, fontSize: size * 0.34, fontWeight: 500, color: INK }}>{String(name ?? '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}</AvatarFallback>
    </Avatar>
  )
}
function Faces({ people, max = 5, size = 64 }: { people: any[]; max?: number; size?: number }) {
  const shown = people.slice(0, max)
  return (
    <div className="flex items-center" style={{ paddingLeft: 14 }}>
      {shown.map((p, i) => <div key={p.name + i} style={{ marginLeft: -14 }}><Face src={p.avatar} name={p.name} size={size} /></div>)}
      {people.length > max && <span className="ml-3 text-[28px]" style={{ color: 'rgba(21,24,26,0.7)' }}>+{people.length - max}</span>}
    </div>
  )
}

/* ── line drawings ───────────────────────────────────────────────────────────────── */

export function Rings({ pct, size = 220, dark = false }: { pct: number; size?: number; dark?: boolean }) {
  const r = size / 2, a = -Math.PI / 2 + pct * Math.PI * 2
  const st = dark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {[0.98, 0.82, 0.66, 0.5, 0.34].map((k, i) => <circle key={i} cx={r} cy={r} r={r * k} fill="none" stroke={st} strokeWidth={1} />)}
      {[0.98, 0.82, 0.66].map((k, i) => <ellipse key={'e' + i} cx={r} cy={r} rx={r * k} ry={r * k * 0.32} fill="none" stroke={st} strokeWidth={1} />)}
      <circle cx={r + Math.cos(a) * r * 0.98} cy={r + Math.sin(a) * r * 0.98} r={7} fill={LIME} />
      <circle cx={r + Math.cos(a) * r * 0.98} cy={r + Math.sin(a) * r * 0.98} r={15} fill={LIME} opacity={0.28} />
    </svg>
  )
}
export function Wave({ points, w = 320, h = 100, dark = false }: { points: number[]; w?: number; h?: number; dark?: boolean }) {
  const max = Math.max(1, ...points)
  const xs = points.map((_, i) => (i / Math.max(1, points.length - 1)) * (w - 24) + 12)
  const ys = points.map(v => h - 14 - (v / max) * (h - 34))
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x},${ys[i]}`).join(' ')
  const st = dark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.95)'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke={st} strokeWidth={1.6} />
      <path d={`${d} L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`} fill="rgba(255,255,255,0.14)" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3} fill={st} />)}
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={7} fill={LIME} />
    </svg>
  )
}
export function Arc({ pos, w = 320 }: { pos: number; w?: number }) {
  const h = 130, r = (w - 40) / 2, ry = h - 24, cx = w / 2, cy = h - 10
  const pt = (t: number) => ({ x: cx + Math.cos(Math.PI + t * Math.PI) * r, y: cy + Math.sin(Math.PI + t * Math.PI) * ry })
  const p = pt(Math.max(0, Math.min(1, pos)))
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={`M${cx - r},${cy} A${r},${ry} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.4} />
      {[0, 0.25, 0.5, 0.75, 1].map(t => { const q = pt(t); return <circle key={t} cx={q.x} cy={q.y} r={4} fill="rgba(255,255,255,0.95)" /> })}
      <circle cx={p.x} cy={p.y} r={8} fill={LIME} />
    </svg>
  )
}

/* ── the bones of a slide ────────────────────────────────────────────────────────── */

export function Card({ tone, children, className = '' }: { tone: string; children: React.ReactNode; className?: string }) {
  return <div className={`relative flex flex-col overflow-hidden rounded-[30px] p-7 ${className}`} style={{ background: MESH[tone] ?? MESH.sage }}>{children}</div>
}
/** label, big number, verdict: the reference's card head, at TV size */
export function Head({ label, value, unit, verdict, dark = false }: { label: string; value: React.ReactNode; unit?: string; verdict?: string; dark?: boolean }) {
  const fg = dark ? '#F4F4F0' : INK, dim = dark ? 'rgba(244,244,240,0.6)' : 'rgba(21,24,26,0.62)'
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[24px]" style={{ color: dim }}>{label}</div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-[120px] font-light leading-none tracking-[-0.04em]" style={{ color: fg }}>{value}</span>
          {unit && <span className="text-[22px]" style={{ color: dim }}>{unit}</span>}
        </div>
      </div>
      {verdict && <span className="shrink-0 rounded-full px-4 py-2 text-[20px] font-medium" style={{ background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)', color: fg }}>{verdict}</span>}
    </div>
  )
}
function Callout({ value, unit, label, verdict, dark = false }: { value: React.ReactNode; unit?: string; label: string; verdict?: string; dark?: boolean }) {
  const fg = dark ? '#F4F4F0' : INK, dim = dark ? 'rgba(244,244,240,0.6)' : MUTED
  return (
    <div className="flex items-center gap-4">
      <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: LIME, boxShadow: '0 0 0 7px rgba(211,255,2,0.25)' }} />
      <span className="h-px w-12 shrink-0" style={{ background: dark ? 'rgba(255,255,255,0.35)' : 'rgba(21,24,26,0.35)' }} />
      <div>
        <div className="flex items-baseline gap-2"><span className="text-[48px] font-light leading-none tracking-[-0.02em]" style={{ color: fg }}>{value}</span>{unit && <span className="text-[18px]" style={{ color: dim }}>{unit}</span>}</div>
        <div className="mt-1 text-[20px]" style={{ color: fg }}>{label}</div>
        {verdict && <span className="mt-1.5 inline-block rounded-full px-3 py-1 text-[15px]" style={{ background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.8)', color: dim }}>{verdict}</span>}
      </div>
    </div>
  )
}

export function Slide({ image, dark = false, kicker, title, big, bigUnit, callouts, children }: {
  image: string; dark?: boolean; kicker: string; title: React.ReactNode; big: React.ReactNode; bigUnit?: string
  callouts: { value: React.ReactNode; unit?: string; label: string; verdict?: string }[]; children: React.ReactNode
}) {
  const ground = dark ? '#0E0F0F' : '#F4F4F0', fg = dark ? '#F4F4F0' : INK, dim = dark ? 'rgba(244,244,240,0.6)' : MUTED
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: ground, color: fg }}>
      <div className="absolute inset-y-0 left-0 w-[58%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${ground} 0%, ${ground} 18%, rgba(0,0,0,0) 58%, rgba(0,0,0,0) 72%, ${ground} 100%)` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${ground} 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, ${ground} 100%)` }} />
      </div>
      <div className="relative grid h-full grid-cols-12 gap-6 px-14 pb-10 pt-9">
        <div className="col-span-6 flex min-h-0 flex-col justify-center">
          <div className="text-[26px]" style={{ color: dim }}>{kicker}</div>
          <div className="mt-3 max-w-[760px] text-[72px] font-light leading-[1.04] tracking-[-0.025em]" style={{ color: fg }}>{title}</div>
          <div className="mt-8 text-[300px] font-light leading-[0.9] tracking-[-0.06em]" style={{ color: fg }}>{big}</div>
          {bigUnit && <div className="mt-6 max-w-[640px] text-[34px] leading-tight" style={{ color: dim }}>{bigUnit}</div>}
          {callouts.length > 0 && <div className="mt-10 flex items-center gap-4"><span className="h-3.5 w-3.5 rounded-full" style={{ background: LIME, boxShadow: '0 0 0 7px rgba(211,255,2,0.25)' }} /><span className="text-[26px]" style={{ color: fg }}>{callouts[0].label}</span></div>}
        </div>
        <div className="col-span-6 grid min-h-0 grid-cols-2 grid-rows-2 gap-5">{children}</div>
      </div>
    </div>
  )
}

/* ── slides ───────────────────────────────────────────────────────────────────────── */

const WORD: Record<string, string> = { confirmed: 'On board', briefed: 'Briefed', product_ready: 'Packing', dispatched: 'Shipped', received: 'Filming', content_in: 'With client', content_approved: 'Approved', live: 'Live' }

export function NowSlide({ moments, logos, days }: { moments: Moment[]; logos: Record<string, string>; days: number[] }) {
  const now = useNow(10_000)
  const m0 = moments[0]
  return (
    <Slide image="/wall/ripple.jpg" dark kicker="Right now" title={m0 ? <>{m0.actor ?? m0.name}<br /><span style={{ color: 'rgba(244,244,240,0.55)' }}>{m0.verb.toLowerCase()}</span></> : 'Quiet'} big={days[6] ?? 0} bigUnit="moves today"
      callouts={m0 ? [{ value: '', label: `${m0.campaign ?? m0.client ?? ''} · ${timeAgo(m0.at, now)}` }] : []}>
      {moments.slice(1, 5).map(m => (
        <Card key={m.id} tone="night">
          <div className="flex items-center justify-between"><span className="text-[24px]" style={{ color: 'rgba(244,244,240,0.6)' }}>{m.label}</span><span className="text-[22px]" style={{ color: 'rgba(244,244,240,0.45)' }}>{timeAgo(m.at, now)}</span></div>
          <div className="mt-auto flex items-end gap-5">
            {m.avatar ? <Face src={m.avatar} name={m.name} size={76} /> : <Mark src={m.logo ?? logoFor(m.campaign, logos)} name={m.client ?? m.campaign ?? m.name} size={76} />}
            <div className="min-w-0">
              <div className="truncate text-[44px] font-light leading-tight" style={{ color: '#F4F4F0' }}>{m.actor ?? m.name}</div>
              <div className="truncate text-[24px]" style={{ color: 'rgba(244,244,240,0.65)' }}>{m.verb}</div>
            </div>
          </div>
        </Card>
      ))}
    </Slide>
  )
}

export function CampaignSlide({ c, i, n }: { c: any; i: number; n: number }) {
  const step = c.steps.find((s: any) => s.active)
  const STOP: Record<string, string> = { confirmed: 'on board', briefed: 'briefed', dispatch: 'packed', filming: 'filming', review: 'with the client', live: 'live', complete: 'wrapped' }
  const STATE: Record<string, string> = { confirmed: 'confirmed', briefed: 'briefed', dispatch: 'dispatched', filming: 'received', review: 'content_in', live: 'live' }
  const at = (key: string) => c.people.filter((p: any) => STATE[key] === p.state)
  const all = c.steps.filter((s: any) => s.key !== 'complete')
  const ai = Math.max(0, all.findIndex((s: any) => s.active))
  const from = Math.max(0, Math.min(ai - 1, all.length - 4))
  const steps = all.slice(from, from + 4)
  return (
    <Slide image="/wall/wave.jpg" kicker={`${c.client ?? 'Campaign'} · ${i + 1} of ${n}`} title={c.name} big={step?.count ?? c.total} bigUnit={`of ${c.total} creators ${step ? STOP[step.key] ?? step.label.toLowerCase() : 'on board'}`}
      callouts={[{ value: '', label: c.health === 'moving' ? 'On track' : c.health === 'waiting_client' ? `Waiting on the client for ${c.oldest_review_days} days` : 'Needs a push' }]}>
      {steps.map((s: any, j: number) => (
        <Card key={s.key} tone={TONES[(from + j) % TONES.length]}>
          <Head label={s.key === 'review' ? 'With the client' : s.label} value={s.count} verdict={s.active ? 'Now' : undefined} />
          <div className="mt-auto"><Faces people={at(s.key)} /></div>
        </Card>
      ))}
    </Slide>
  )
}

const SHORT: Record<string, string> = {
  'rosters below target': 'Rosters to fill', 'creators to agree a rate with': 'Rates to agree', 'creators to brief': 'To brief', 'content to chase': 'Content to chase', 'post links to get': 'Links to get',
  'content to send to the client': 'Content to send', 'open requests': 'Open requests', 'pieces of content to approve': 'Content to approve', 'proposals to answer': 'Proposals to answer',
}
export function MoveSlide({ ball }: { ball: any }) {
  const roles: any[] = (ball?.roles ?? []).filter((r: any) => r.key !== 'bd' && r.key !== 'founders')
  const logos: Record<string, string> = ball?.logos ?? {}
  const total = roles.reduce((n, r) => n + r.total, 0)
  const ROLE: Record<string, string> = { talent: 'Talent', am: 'Account managers', client: 'Clients' }
  const TONE: Record<string, string> = { talent: 'sage', am: 'amber', client: 'rose' }
  const biggest = roles.flatMap(r => r.items.map((it: any) => ({ ...it, role: r.key }))).sort((a, b) => b.n - a.n)[0]
  const talent = roles.find(r => r.key === 'talent')?.total ?? 0
  return (
    <Slide image="/wall/dream.jpg" kicker="Whose move" title="Waiting on someone" big={total} bigUnit="things sit with a person right now"
      callouts={biggest ? [{ value: '', label: `Biggest pile: ${SHORT[biggest.label] ?? biggest.label}, ${biggest.n}` }] : []}>
      {roles.map(r => {
        const people = r.items.flatMap((it: any) => it.people ?? [])
        const marks = r.items.flatMap((it: any) => it.rows ?? [])
        return (
          <Card key={r.key} tone={TONE[r.key] ?? 'sage'}>
            <Head label={ROLE[r.key] ?? r.role} value={r.total} />
            <div className="mt-auto">{people.length ? <Faces people={people} /> : <div className="flex items-center gap-2">{marks.slice(0, 5).map((x: any, q: number) => <Mark key={x.name + q} src={logoFor(x.client, logos) ?? logoFor(x.name, logos)} name={x.client ?? x.name} size={56} />)}</div>}</div>
          </Card>
        )
      })}
      <Card tone="dusk">
        <Head label="Share with talent" value={total ? Math.round((talent / total) * 100) : 0} unit="%" />
        <div className="mt-auto flex justify-end"><Rings pct={total ? talent / total : 0} size={170} /></div>
      </Card>
    </Slide>
  )
}

export function ClientsSlide({ rows }: { rows: any[] }) {
  const moving = rows.filter(r => r.health === 'moving').length
  const HEALTH: Record<string, string> = { moving: 'On track', stalled: 'Needs a push', waiting_client: 'Waiting on them', done: 'Done' }
  const top = [...rows].sort((a, b) => (b.creators || b.app_creators) - (a.creators || a.app_creators)).slice(0, 4)
  return (
    <Slide image="/wall/beach.jpg" kicker="Clients" title="On track, or not" big={rows.length} bigUnit={`clients · ${moving} on track`}
      callouts={rows.length > 4 ? [{ value: '', label: `and ${rows.slice(4).map(r => r.name).join(', ')}` }] : []}>
      {top.map(r => (
        <Card key={r.id} tone={r.health === 'waiting_client' ? 'amber' : r.health === 'stalled' ? 'rose' : 'sea'}>
          <div className="flex items-center justify-between gap-3"><Mark src={r.logo} name={r.name} size={64} /><span className="rounded-full bg-white/75 px-4 py-2 text-[20px] font-medium" style={{ color: INK }}>{HEALTH[r.health] ?? r.health}{r.health === 'waiting_client' && r.review_days ? ` · ${r.review_days}d` : ''}</span></div>
          <div className="mt-4 truncate text-[36px] leading-tight" style={{ color: INK }}>{r.name}</div>
          <div className="mt-auto flex items-baseline gap-3"><span className="text-[110px] font-light leading-none tracking-[-0.04em]" style={{ color: INK }}>{r.creators || r.app_creators}</span><span className="text-[22px]" style={{ color: 'rgba(21,24,26,0.65)' }}>creators</span></div>
        </Card>
      ))}
    </Slide>
  )
}

const WAIT: Record<string, string> = { 'the brief': 'No brief yet', 'the package': 'Package not sent', 'the courier': 'With the courier', 'delivery': 'Not delivered', 'their content': 'Content overdue', "the client's yes": 'Client to approve', 'the post going live': 'Not posted yet' }
export function StillSlide({ stuck }: { stuck: any; creators?: number }) {
  const rows: any[] = stuck?.rows ?? []
  const by: [string, number][] = stuck?.by_waiting ?? []
  const longest = rows[0]?.days ?? 0
  return (
    <Slide image="/wall/forest.jpg" kicker="Sat still" title="Nobody has touched them in five days" big={stuck?.total ?? 0} bigUnit="creators with no movement"
      callouts={[{ value: '', label: `The longest: ${longest} days` }]}>
      {by.slice(0, 4).map(([what, n], j) => (
        <Card key={what} tone={what === "the client's yes" ? 'amber' : TONES[(j + 4) % TONES.length]}>
          <Head label={WAIT[what] ?? what} value={n} verdict={what === "the client's yes" ? 'Client' : 'Ours'} />
          <div className="mt-auto"><Faces people={rows.filter(r => r.waiting_for === what)} /></div>
        </Card>
      ))}
    </Slide>
  )
}

const STOPS: { key: string; label: string }[] = [
  { key: 'signed', label: 'Signed' }, { key: 'briefed', label: 'Briefed' }, { key: 'dispatched', label: 'Shipped' }, { key: 'received', label: 'Received' }, { key: 'content', label: 'Content in' }, { key: 'approved', label: 'Approved' }, { key: 'live', label: 'Live' },
]
export function WeekSlide({ week }: { week: any; days?: number[] }) {
  const tw = week?.this_week ?? 0, lw = week?.last_week ?? 0, d = tw - lw
  const byKey: Record<string, any> = Object.fromEntries((week?.groups ?? []).map((g: any) => [g.kind, g]))
  const top = STOPS.map(s => ({ s, g: byKey[s.key] })).filter(x => (x.g?.this_week ?? 0) > 0).sort((a, b) => b.g.this_week - a.g.this_week).slice(0, 4)
  return (
    <Slide image="/wall/plant.jpg" kicker="This week" title="Steps taken" big={tw} bigUnit={d === 0 ? 'the same as last week' : d > 0 ? `${d} more than last week` : `${-d} fewer than last week`}
      callouts={[{ value: '', label: `${byKey.live?.this_week ?? 0} posts went live` }]}>
      {top.map(({ s, g }, j) => (
        <Card key={s.key} tone={s.key === 'live' || s.key === 'approved' ? 'olive' : TONES[j % TONES.length]}>
          <Head label={s.label} value={g.this_week} verdict={`${g.last_week} last week`} />
          <div className="mt-auto"><Faces people={g.people ?? []} /></div>
        </Card>
      ))}
    </Slide>
  )
}

/** A quiet strip of chapter names along the bottom, the lime dot on the one that is up. */
export function Spine({ pages, index, dark }: { pages: { key: string; name: string }[]; index: number; dark: boolean }) {
  return (
    <div className="absolute bottom-6 left-14 z-10 flex items-center gap-4">
      {pages.map((p, i) => <span key={p.key} className="rounded-full transition-all duration-700" style={{ height: 10, width: i === index ? 40 : 10, background: i === index ? LIME : dark ? 'rgba(255,255,255,0.3)' : 'rgba(21,24,26,0.22)' }} />)}
    </div>
  )
}
export { AnimatePresence, motion }
