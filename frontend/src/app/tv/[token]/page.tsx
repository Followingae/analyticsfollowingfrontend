'use client'

/**
 * The office wall: a deck of screens, each one picture, turning every 20 seconds.
 *
 * Live (the feed of the last seven days with a name on every line, plus the campaign in
 * the spotlight), Clients (on track or not, one card each), Needs attention (who has sat
 * untouched and what for), This week (the pace against last week). Clients also sit in
 * the header on every screen with a ring that says on track, needs a push, or waiting.
 *
 * For the Karachi office TV (founder, 13 Nov 2026): people and movement, never money. Every
 * action the team takes in the product arrives as a moment (moments.ts); the big ones (a
 * signature, a client's yes, a confirmed proposal, a post live) take the stage with confetti
 * for nine seconds; a client asking for something takes it without. Nothing is pushed by
 * hand. Light, 1080p, runs 24/7 with no keyboard.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { DotPattern } from '@/components/ui/dot-pattern'
import { type Slide } from '@/components/wall/parts'
import { AttentionScreen, BallScreen, ClientsScreen, ClientsStrip, Feed, INK, LIME, MUTED, Spotlight, WeekScreen } from '@/components/wall/board'
import { Stage } from '@/components/wall/stage'
import { OFF_TV, toMoment, type Moment } from '@/components/wall/moments'
import { previewMoment } from '@/components/wall/previews'
import type { Event } from '@/components/wall/Pulse'
import { useFullscreenOnPress, useTvFollow } from '@/components/wall/screen'

const FALLBACK_REFRESH_MS = 60_000
const PULSE_MS = 6_000
const SLIDE_MS = 20_000
/** Some screens need longer: Live to be read, Campaigns to turn through three. */
const SLIDE_MS_BY_KEY: Record<string, number> = { live: 30_000, spotlight: 45_000 }
const STAGE_MS = 9_000

export default function WallPage() {
  const { token } = useParams<{ token: string }>()
  const full = useFullscreenOnPress()
  // Read from the URL by hand: useSearchParams would need a Suspense boundary at build time.
  const [preview, setPreview] = useState<string | null>(null)
  const [previewed, setPreviewed] = useState<Moment | null>(null)
  useEffect(() => { setPreview(new URLSearchParams(window.location.search).get('preview')) }, [])
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [clock, setClock] = useState('')
  const [today, setToday] = useState('')
  const [index, setIndex] = useState(0)
  const [moments, setMoments] = useState<Moment[]>([])
  const [stage, setStage] = useState<Moment | null>(null)
  const seen = useRef<Set<string> | null>(null)
  const fresh = useRef<Map<string, number>>(new Map())
  const queue = useRef<Moment[]>([])
  const previewOnce = useRef(false)
  const logosRef = useRef<Record<string, string>>({})
  const [logosReady, setLogosReady] = useState(false)

  // A preview (?preview=signed and the like, from the buttons on /work/tv) is one made-up
  // moment played once, two seconds after the wall is up, as if it had just landed. It is
  // never written anywhere.
  const play = useCallback((key: string) => {
    const pm = previewMoment(key, logosRef.current)
    if (!pm) return
    setPreviewed(pm)
    fresh.current.set(pm.id, Date.now())
    seen.current?.add(pm.id)
    if (pm.tier === 'celebrate' || pm.tier === 'stage') queue.current.push(pm)
    setMoments(ms => ms.some(x => x.id === pm.id) ? ms : [pm, ...ms])
  }, [])
  useEffect(() => {
    if (!preview || !logosReady || previewOnce.current) return
    previewOnce.current = true
    const t = setTimeout(() => play(preview), 1800)
    return () => clearTimeout(t)
  }, [preview, logosReady, play])
  // A preview asked for from a phone (/work/tv, Play on TV) lands here and plays at once.
  useTvFollow(`/tv/${token}`, play)
  const base = API_CONFIG.BASE_URL

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/v1/display/${token}`)
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) setError(res.status === 404 ? 'Unknown screen' : 'This screen was switched off')
        else setStale(true)
        return
      }
      setData((await res.json()).data)
      setError(null)
      setStale(false)
    } catch { setStale(true) }
  }, [base, token])

  const loadPulse = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/v1/display/${token}/pulse`)
      if (!res.ok) return
      const d = (await res.json()).data
      const logos: Record<string, string> = d.logos ?? {}
      logosRef.current = logos
      setLogosReady(true)
      const ordered: Moment[] = ((d.events ?? []) as Event[]).filter(e => !OFF_TV.has(e.kind)).map(e => toMoment(e as any, logos))
        .sort((a, b) => (a.at < b.at ? 1 : -1))
      if (seen.current == null) seen.current = new Set(ordered.map(m => m.id))
      else for (const m of ordered) if (!seen.current.has(m.id)) {
        seen.current.add(m.id)
        fresh.current.set(m.id, Date.now())
        // Only the big moments take the stage; the rest land in the feed.
        if (m.tier === 'celebrate' || m.tier === 'stage') queue.current.push(m)
      }
      setMoments(previewed && !ordered.some(m => m.id === previewed.id) ? [previewed, ...ordered] : ordered)
    } catch { /* the last feed stays up */ }
  }, [base, token, previewed])

  useEffect(() => { load(); loadPulse() }, [load, loadPulse])
  useEffect(() => {
    const ms = data?.refresh_seconds ? data.refresh_seconds * 1000 : FALLBACK_REFRESH_MS
    const t = setInterval(load, ms)
    return () => clearInterval(t)
  }, [load, data?.refresh_seconds])
  useEffect(() => { const t = setInterval(loadPulse, PULSE_MS); return () => clearInterval(t) }, [loadPulse])
  useEffect(() => { if (!stage) { const next = queue.current.shift(); if (next) setStage(next) } }, [stage, moments])
  useEffect(() => { if (!stage) return; const t = setTimeout(() => setStage(null), STAGE_MS); return () => clearTimeout(t) }, [stage])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      setToday(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    tick()
    const t = setInterval(tick, 20_000)
    return () => clearInterval(t)
  }, [])

  const slides: Slide[] = data?.slides ?? []
  const by = (k: string) => slides.find(s => s.key === k)
  const clients = by('clients')?.rows ?? []
  const journeys = useMemo(() => (by('journey')?.rows ?? []).filter((r: any) => r.health !== 'done'), [data])
  const creators = clients.reduce((n: number, r: any) => n + (r.creators ?? 0), 0)

  const deck = useMemo(() => {
    const out: { key: string; node: React.ReactNode }[] = []
    out.push({ key: 'live', node: <Feed moments={moments} fresh={fresh.current} logos={logosRef.current} /> })
    if (journeys.length) out.push({ key: 'spotlight', node: <Spotlight rows={journeys} /> })
    if (by('ball')) out.push({ key: 'ball', node: <BallScreen ball={by('ball')} /> })
    if (clients.length) out.push({ key: 'clients', node: <ClientsScreen rows={clients} /> })
    if (by('stuck')) out.push({ key: 'attention', node: <AttentionScreen stuck={by('stuck')} /> })
    if (by('week')) out.push({ key: 'week', node: <WeekScreen week={by('week')} creators={creators} /> })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, moments])

  const currentKey = deck.length ? deck[index % deck.length].key : ''
  const currentMs = SLIDE_MS_BY_KEY[currentKey] ?? SLIDE_MS
  useEffect(() => {
    if (deck.length < 2) return
    const t = setTimeout(() => setIndex(i => (i + 1) % deck.length), currentMs)
    return () => clearTimeout(t)
  }, [deck.length, index, currentMs])

  if (error) {
    return <div className="flex h-screen w-screen items-center justify-center bg-[#F6F6F2]" style={{ color: MUTED }}><span className="text-[22px] tracking-tight">{error}</span></div>
  }
  const current = deck.length ? deck[index % deck.length] : null

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F6F6F2]" style={{ color: INK, fontFeatureSettings: '"ss01", "cv11"' }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 0% 0%, rgba(211,255,2,0.35) 0%, rgba(246,246,242,0) 60%), radial-gradient(60% 50% at 100% 100%, rgba(170,230,200,0.35) 0%, rgba(246,246,242,0) 60%)' }} />
      <DotPattern width={22} height={22} cr={1.1} className="pointer-events-none absolute inset-0 fill-[#15181A]/[0.07] [mask-image:radial-gradient(60%_50%_at_100%_0%,#000,transparent)]" />

      <div className="relative flex h-full flex-col gap-4 px-10 pb-8 pt-6">
        <header className="flex h-12 items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/followinglogo.svg" alt="Following" className="h-6 w-auto" />
          <div className="flex items-center gap-1.5">
            {deck.map((s, i) => {
              const active = i === index % Math.max(1, deck.length)
              return (
                <span key={s.key} className="relative h-1.5 overflow-hidden rounded-full transition-all duration-700" style={{ width: active ? 44 : 6, background: 'rgba(21,24,26,0.14)' }}>
                  {active && <motion.span key={`${s.key}-${index}`} className="absolute inset-y-0 left-0 rounded-full" style={{ background: INK }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: deck.length > 1 ? currentMs / 1000 : 0, ease: 'linear' }} />}
                </span>
              )
            })}
          </div>
          <ClientsStrip rows={clients} />
          <div className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-2 text-[14px]" style={{ color: MUTED }}>
              <motion.span className="h-2.5 w-2.5 rounded-full" style={{ background: stale ? '#F5C451' : LIME, boxShadow: '0 0 0 2px rgba(21,24,26,0.15)' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
              {stale ? 'reconnecting' : 'live'}
            </span>
            {preview && <span className="rounded-full px-3 py-1 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ background: INK, color: '#fff' }}>preview</span>}
            <span className="text-[16px]" style={{ color: MUTED }}>{today}</span>
            <span className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em]" style={{ color: INK }}>{clock}</span>
          </div>
        </header>

        <main className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.key} className="h-full" initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.985, filter: 'blur(8px)' }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
                {current.node}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Stage m={stage} />
      {!full && <FullscreenHint dark={false} />}
    </div>
  )
}

/** Shown until the TV is full screen: a press on the remote gets it there. Fades after a while. */
function FullscreenHint({ dark }: { dark: boolean }) {
  const [show, setShow] = useState(true)
  useEffect(() => { const t = setTimeout(() => setShow(false), 40_000); return () => clearTimeout(t) }, [])
  if (!show) return null
  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-[15px]"
      style={{ background: dark ? 'rgba(244,244,240,0.12)' : 'rgba(21,24,26,0.08)', color: dark ? 'rgba(244,244,240,0.7)' : 'rgba(21,24,26,0.6)' }}>
      Press OK on the remote for full screen
    </div>
  )
}
