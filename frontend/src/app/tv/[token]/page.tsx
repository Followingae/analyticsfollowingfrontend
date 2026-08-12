'use client'

/**
 * The office wall.
 *
 * Full-bleed, no chrome, no login. Cycles delivery slides and refreshes quietly in the
 * background. Sized in container units so it reads the same on a 1080p screen and a 4K one.
 *
 * Nothing commercial appears here — the server does not even send money to a team display.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'

const SLIDE_MS = 18_000
const REFRESH_MS = 60_000

const COLOURS = ['#2a5fd6', '#dd5f2a', '#0f9d6e', '#5b3fbf', '#c2408c', '#b8860b']
const colourFor = (s: string) => COLOURS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLOURS.length]

const compact = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

const dayLabel = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const same = d.toDateString() === today.toDateString()
  const tmr = new Date(today.getTime() + 86_400_000).toDateString() === d.toDateString()
  return same ? 'Today' : tmr ? 'Tomorrow'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function WallPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const [clock, setClock] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/display/${token}`)
      if (!res.ok) { setError(res.status === 404 ? 'Unknown screen' : 'This screen has expired'); return }
      setData((await res.json()).data)
      setError(null)
    } catch {
      // A dropped connection must not blank the wall — keep showing the last good data.
    }
  }, [token])

  useEffect(() => { load(); const t = setInterval(load, REFRESH_MS); return () => clearInterval(t) }, [load])

  useEffect(() => {
    const t = setInterval(() =>
      setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })), 1000)
    return () => clearInterval(t)
  }, [])

  const slides = data?.slides?.filter((s: any) => (s.rows?.length ?? 0) > 0) || []

  useEffect(() => {
    if (!slides.length) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setI(v => (v + 1) % slides.length), SLIDE_MS)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [i, slides.length])

  if (error) {
    return <div style={S.shell}><div style={{ ...S.pad, justifyContent: 'center' }}>
      <p style={S.h2}>{error}</p></div></div>
  }
  if (!slides.length) {
    return <div style={S.shell}><div style={{ ...S.pad, justifyContent: 'center' }}>
      <p style={S.h2}>Nothing to show yet</p></div></div>
  }

  const s = slides[i % slides.length]

  return (
    <div style={S.shell}>
      <div style={S.pad}>
        <div style={S.top}>
          <span style={S.live}><span style={S.dot} />LIVE</span>
          <span>{s.title}</span>
          <span style={{ marginLeft: 'auto' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {clock}
          </span>
        </div>

        <div style={S.body}>
          {s.key === 'live_campaigns' && s.rows.map((r: any) => (
            <Row key={r.id} tag={r.brand_name || r.name} colour={colourFor(r.name || '')}
                 title={r.name} sub={`${r.brand_name || ''} · ${r.campaign_type || ''}`}
                 midLabel="Posts tracked" midValue={r.posts}
                 chip={dayLabel(r.end_date)} />
          ))}

          {s.key === 'due' && s.rows.map((r: any) => (
            <Row key={r.id} tag={r.campaign_name || '—'} colour={colourFor(r.campaign_name || 'x')}
                 title={r.campaign_name || 'Deliverable'} sub={String(r.status || '').replace(/_/g, ' ')}
                 chip={dayLabel(r.due_at)} />
          ))}

          {s.key === 'sourcing' && s.rows.map((r: any, n: number) => (
            <Row key={n} tag={r.title} colour={colourFor(r.title || '')}
                 title={r.title} sub={`Round ${r.round_no}`}
                 bar={{ v: r.found, t: r.target || r.found || 1 }}
                 chip={dayLabel(r.due_at)} />
          ))}

          {s.key === 'creators' && s.rows.map((r: any, n: number) => (
            <Row key={n} tag={r.username} colour={colourFor(r.username || '')} round
                 title={`@${r.username}`}
                 sub={[(r.categories || [])[0], r.country].filter(Boolean).join(' · ')}
                 midLabel="Followers" midValue={compact(r.followers_count)} />
          ))}

          {s.key === 'growth' && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.6cqi',
                          height: '100%', width: '100%' }}>
              {s.rows.map((g: any, n: number) => {
                const max = Math.max(...s.rows.map((x: any) => x.n), 1)
                return (
                  <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'flex-end',
                                        height: '100%', gap: '.8cqi' }}>
                    <span style={{ fontSize: '1.8cqi', fontWeight: 600 }}>{g.n}</span>
                    <span style={{ width: '100%', borderRadius: '.8cqi .8cqi .2cqi .2cqi',
                                   background: n === s.rows.length - 1 ? '#4ade80' : '#2f333c',
                                   height: `${Math.max((g.n / max) * 100, 4)}%` }} />
                    <span style={{ fontSize: '1.1cqi', color: '#8b8f9a' }}>
                      {new Date(g.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {s.key === 'growth' && s.totals && (
          <div style={S.strip}>
            <Stat v={s.totals.total} l="creators in the database" />
            <Stat v={s.totals.live} l="ready to book" good />
          </div>
        )}

        <div style={S.prog}>
          {slides.map((_: any, n: number) => (
            <i key={n} style={{ ...S.progBar, background: n === i ? '#fff' : '#2a2e37' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ tag, colour, title, sub, midLabel, midValue, bar, chip, round }: any) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1cqi', flex: '1 1 34%', minWidth: 0 }}>
        <span style={{ ...S.sq, background: colour, borderRadius: round ? '50%' : '.8cqi' }}>
          {String(tag || '?').replace('@', '').slice(0, 2).toUpperCase()}
        </span>
        <span style={{ minWidth: 0 }}>
          <b style={S.cardTitle}>{title}</b>
          <span style={S.cardSub}>{sub}</span>
        </span>
      </div>

      <div style={{ flex: '1 1 30%', minWidth: 0 }}>
        {bar && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: '1.3cqi', color: '#8b8f9a', marginBottom: '.6cqi' }}>
              <span>Found</span><b style={{ color: '#fff' }}>{bar.v} / {bar.t}</b>
            </div>
            <span style={S.track}>
              <i style={{ display: 'block', height: '100%', borderRadius: 99,
                          width: `${Math.min((bar.v / bar.t) * 100, 100)}%`,
                          background: bar.v >= bar.t ? '#4ade80' : '#fbbf24' }} />
            </span>
          </>
        )}
        {!bar && midLabel && (
          <>
            <div style={{ fontSize: '1.3cqi', color: '#8b8f9a' }}>{midLabel}</div>
            <b style={{ fontSize: '1.9cqi' }}>{midValue}</b>
          </>
        )}
      </div>

      {chip && <span style={S.chip}>{chip}</span>}
    </div>
  )
}

function Stat({ v, l, good }: { v: any; l: string; good?: boolean }) {
  return (
    <div>
      <b style={{ display: 'block', fontSize: '3.2cqi', fontWeight: 650,
                  color: good ? '#4ade80' : '#fff', lineHeight: 1 }}>{v}</b>
      <span style={{ fontSize: '1.3cqi', color: '#8b8f9a' }}>{l}</span>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  shell: { position: 'fixed', inset: 0, background: '#08090c', color: '#fff', containerType: 'inline-size',
           fontFamily: 'system-ui,-apple-system,"Segoe UI",sans-serif', overflow: 'hidden' },
  pad: { position: 'absolute', inset: 0, padding: '2.3cqi 2.6cqi', display: 'flex', flexDirection: 'column' },
  top: { display: 'flex', alignItems: 'center', gap: '1.4cqi', color: '#8b8f9a',
         fontSize: '1.2cqi', letterSpacing: '.04em', textTransform: 'uppercase' },
  live: { display: 'flex', alignItems: 'center', gap: '.7cqi', color: '#4ade80' },
  dot: { width: '.8cqi', height: '.8cqi', borderRadius: '50%', background: '#4ade80' },
  h2: { fontSize: '3cqi', fontWeight: 600 },
  body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '.75cqi',
          marginTop: '1.6cqi', overflow: 'hidden' },
  card: { display: 'flex', alignItems: 'center', gap: '2cqi', background: '#0f1117',
          border: '1px solid #1c1e26', borderRadius: '1cqi', padding: '.9cqi 1.5cqi', minWidth: 0 },
  sq: { width: '2.9cqi', height: '2.9cqi', display: 'grid', placeItems: 'center',
        fontSize: '1.5cqi', fontWeight: 700, color: '#fff', flex: 'none' },
  cardTitle: { display: 'block', fontSize: '1.7cqi', fontWeight: 600, whiteSpace: 'nowrap',
               overflow: 'hidden', textOverflow: 'ellipsis' },
  cardSub: { display: 'block', color: '#8b8f9a', fontSize: '1.2cqi', whiteSpace: 'nowrap',
             overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' },
  track: { display: 'block', height: '1cqi', background: '#181b22', borderRadius: 99, overflow: 'hidden' },
  chip: { flex: 'none', padding: '.4cqi 1.1cqi', borderRadius: 99, fontSize: '1.35cqi',
          fontWeight: 600, background: 'rgba(96,165,250,.15)', color: '#60a5fa', whiteSpace: 'nowrap' },
  strip: { display: 'flex', gap: '4cqi', paddingTop: '1.4cqi', borderTop: '1px solid #1c1e26' },
  prog: { display: 'flex', gap: '.6cqi', marginTop: 'auto', paddingTop: '1.4cqi' },
  progBar: { height: '.3cqi', flex: 1, borderRadius: 99 },
}
