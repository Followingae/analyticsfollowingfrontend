'use client'

/**
 * Wall v2, the field book (founder, 13 Nov 2026). Same data as the wall, a different idea:
 * pages with one of the founder's atmospheres, one sentence, one ledger. v1 stays at
 * /tv/{token}. Celebrations still take the stage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Outfit } from 'next/font/google'
import { AnimatePresence, motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { OFF_TV, toMoment, type Moment } from '@/components/wall/moments'
import type { Event } from '@/components/wall/Pulse'
import { Stage } from '@/components/wall/stage'
import { useFullscreenOnPress, useTvFollow } from '@/components/wall/screen'
import { CampaignSlide, ClientsSlide, MoveSlide, NowSlide, Spine, StillSlide, WeekSlide } from '@/components/wall/v2/deck'

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500'], display: 'swap' })
const PAGE_MS: Record<string, number> = { live: 30_000, campaign: 15_000 }
const DEFAULT_MS = 20_000
const STAGE_MS = 9_000

export default function WallV2Page() {
  const { token } = useParams<{ token: string }>()
  useTvFollow(`/tv/${token}/v2`)
  const full = useFullscreenOnPress()
  const [data, setData] = useState<any>(null)
  const [moments, setMoments] = useState<Moment[]>([])
  const [index, setIndex] = useState(0)
  const [stage, setStage] = useState<Moment | null>(null)
  const [head, setHead] = useState('')
  const logos = useRef<Record<string, string>>({})
  const seen = useRef<Set<string> | null>(null)
  const queue = useRef<Moment[]>([])
  const base = API_CONFIG.BASE_URL

  const load = useCallback(async () => {
    try { const r = await fetch(`${base}/api/v1/display/${token}`); if (r.ok) setData((await r.json()).data) } catch { /* keep */ }
  }, [base, token])
  const loadPulse = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/v1/display/${token}/pulse`)
      if (!r.ok) return
      const d = (await r.json()).data
      logos.current = d.logos ?? {}
      const ms = ((d.events ?? []) as Event[]).filter(e => !OFF_TV.has(e.kind)).map(e => toMoment(e as any, logos.current)).sort((a, b) => (a.at < b.at ? 1 : -1))
      if (seen.current == null) seen.current = new Set(ms.map(m => m.id))
      else for (const m of ms) if (!seen.current.has(m.id)) { seen.current.add(m.id); if (m.tier === 'celebrate' || m.tier === 'stage') queue.current.push(m) }
      setMoments(ms)
    } catch { /* keep */ }
  }, [base, token])
  useEffect(() => { load(); loadPulse(); const a = setInterval(load, 60_000), b = setInterval(loadPulse, 6_000); return () => { clearInterval(a); clearInterval(b) } }, [load, loadPulse])
  useEffect(() => { if (!stage) { const next = queue.current.shift(); if (next) setStage(next) } }, [stage, moments])
  useEffect(() => { if (!stage) return; const t = setTimeout(() => setStage(null), STAGE_MS); return () => clearTimeout(t) }, [stage])
  useEffect(() => {
    const t = () => { const n = new Date(); setHead(`${n.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`) }
    t(); const i = setInterval(t, 20_000); return () => clearInterval(i)
  }, [])

  const slides: any[] = data?.slides ?? []
  const by = (k: string) => slides.find(s => s.key === k)
  const journeys: any[] = useMemo(() => (by('journey')?.rows ?? []).filter((r: any) => r.health !== 'done'), [data])
  const days = useMemo(() => { const out = new Array(7).fill(0); const now = Date.now(); for (const m of moments) { const d = Math.floor((now - new Date(m.at).getTime()) / 86400000); if (d >= 0 && d < 7) out[6 - d] += 1 } return out }, [moments])
  const creatorsAll = useMemo(() => (by('clients')?.rows ?? []).reduce((n: number, r: any) => n + (r.creators ?? 0), 0), [data])
  const pages = useMemo(() => {
    const out: { key: string; name: string; kind: string; dark: boolean; node: React.ReactNode }[] = []
    out.push({ key: 'live', name: 'Now', kind: 'live', dark: true, node: <NowSlide moments={moments} logos={logos.current} days={days} /> })
    journeys.slice(0, 3).forEach((c, i) => out.push({ key: `c-${c.id}`, name: i === 0 ? 'Campaigns' : '', kind: 'campaign', dark: false, node: <CampaignSlide c={c} i={i} n={Math.min(3, journeys.length)} /> }))
    if (by('ball')) out.push({ key: 'move', name: 'Whose move', kind: 'move', dark: false, node: <MoveSlide ball={by('ball')} /> })
    if (by('clients')) out.push({ key: 'clients', name: 'Clients', kind: 'clients', dark: false, node: <ClientsSlide rows={by('clients').rows ?? []} /> })
    if (by('stuck')) out.push({ key: 'still', name: 'Sat still', kind: 'still', dark: false, node: <StillSlide stuck={by('stuck')} creators={creatorsAll} /> })
    if (by('week')) out.push({ key: 'week', name: 'This week', kind: 'week', dark: false, node: <WeekSlide week={by('week')} days={days} /> })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, moments, days, creatorsAll])
  const current = pages.length ? pages[index % pages.length] : null
  const ms = current ? (PAGE_MS[current.kind] ?? DEFAULT_MS) : DEFAULT_MS
  useEffect(() => { if (pages.length < 2) return; const t = setTimeout(() => setIndex(i => (i + 1) % pages.length), ms); return () => clearTimeout(t) }, [pages.length, index, ms])

  return (
    <div className={`${outfit.className} relative h-screen w-screen overflow-hidden`} style={{ background: '#F4F4F0' }}>
      <AnimatePresence mode="wait">
        {current && (
          <motion.div key={current.key} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: 'easeInOut' }}>
            {current.node}
          </motion.div>
        )}
      </AnimatePresence>
      {current && <Spine pages={pages.filter(p => p.name)} index={pages.filter(p => p.name).findIndex(p => p.kind === current.kind)} dark={current.dark} />}
      <div className="absolute right-14 bottom-5 z-10 flex items-center gap-5">
        <span className="text-[18px]" style={{ color: current?.dark ? 'rgba(244,244,240,0.6)' : '#6F746B' }}>{head}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current?.dark ? '/Following Logo Dark Mode.svg' : '/followinglogo.svg'} alt="Following" className="h-6 w-auto" />
      </div>
      <Stage m={stage} />
      {!full && <span className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-[15px]" style={{ color: current?.dark ? 'rgba(244,244,240,0.5)' : '#6F746B' }}>Press OK on the remote for full screen</span>}
    </div>
  )
}
