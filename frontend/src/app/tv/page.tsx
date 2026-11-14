'use client'

/**
 * The TV's front door: open following's /tv on any office TV.
 *
 * A TV that has paired before goes straight to its screen. A new TV shows a six-digit code
 * and a QR; a staff phone scans it (or opens /work/tv/pair and types the code), picks the
 * display and the version, and this page moves to the wall within seconds. The code lasts
 * 15 minutes and renews itself. Dark, huge, readable from the far end of the room.
 */
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'motion/react'
import { API_CONFIG } from '@/config/api'
import { readTv, tvState, useFullscreenOnPress, writeTv, type TvMemory } from '@/components/wall/screen'

const POLL_MS = 3_000

export default function TvDoor() {
  const [code, setCode] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [moving, setMoving] = useState(false)
  const mem = useRef<TvMemory | null>(null)
  const full = useFullscreenOnPress()

  useEffect(() => {
    setOrigin(window.location.origin)
    let stop = false
    const start = async () => {
      try {
        const r = await fetch(`${API_CONFIG.BASE_URL}/api/v1/display/tv/start`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_agent: navigator.userAgent }),
        })
        if (!r.ok) return
        const d = (await r.json()).data
        mem.current = { id: d.screen_id, key: d.device_key }
        writeTv(mem.current)
        setCode(d.code)
      } catch { /* try again on the next tick */ }
    }
    const tick = async () => {
      if (stop) return
      if (!mem.current) { await start(); return }
      const s = await tvState(mem.current)
      if (stop || !s) return
      if (s.paired && s.path) { setMoving(true); window.location.replace(s.path); return }
      if (s.code) setCode(s.code)
      else if (s.code === undefined && !s.paired) { mem.current = null; writeTv(null); await start() }
    }
    mem.current = readTv()
    tick()
    const t = setInterval(tick, POLL_MS)
    return () => { stop = true; clearInterval(t) }
  }, [])

  const pairUrl = code ? `${origin}/work/tv/pair?code=${code}` : ''

  return (
    <div className="relative flex h-screen w-screen select-none items-center justify-center overflow-hidden" style={{ background: '#15181A', color: '#F4F4F0' }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(211,255,2,0.08), transparent 70%)' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Following Logo Dark Mode.svg" alt="Following" className="absolute left-14 top-10 h-8 w-auto" />

      <AnimatePresence mode="wait">
        {moving ? (
          <motion.div key="moving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[40px] font-light tracking-tight">Here we go.</motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="grid w-[min(1500px,92vw)] grid-cols-[1.35fr_1fr] items-center gap-20">
            <div>
              <div className="text-[26px] font-light tracking-wide" style={{ color: 'rgba(244,244,240,0.55)' }}>Pair this TV</div>
              <div className="mt-3 text-[64px] font-light leading-[1.05] tracking-tight">Open Following on your phone<br />and enter this code</div>
              <div className="mt-12 flex gap-5">
                {(code ?? '······').split('').map((ch, i) => (
                  <motion.div key={`${i}-${ch}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="flex h-[150px] w-[112px] items-center justify-center rounded-[22px] text-[104px] font-medium tabular-nums leading-none"
                    style={{ background: 'rgba(244,244,240,0.06)', boxShadow: 'inset 0 0 0 1.5px rgba(244,244,240,0.14)' }}>
                    {ch}
                  </motion.div>
                ))}
              </div>
              <div className="mt-10 text-[24px]" style={{ color: 'rgba(244,244,240,0.55)' }}>
                {origin ? origin.replace(/^https?:\/\//, '') : ''}/work/tv/pair
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-[28px] bg-white p-7">
                {pairUrl ? <QRCodeSVG value={pairUrl} size={380} level="M" fgColor="#15181A" bgColor="#FFFFFF" /> : <div className="h-[380px] w-[380px]" />}
              </div>
              <div className="text-[22px]" style={{ color: 'rgba(244,244,240,0.55)' }}>or scan to pair</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!full && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[20px]" style={{ color: 'rgba(244,244,240,0.4)' }}>
          Press OK on the remote for full screen
        </div>
      )}
    </div>
  )
}
