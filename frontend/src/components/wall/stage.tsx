'use client'

/**
 * The stage: a moment that deserves the whole screen.
 *
 * A creator signing, the client saying yes, a proposal confirmed, a post going live, a deal
 * won. Confetti from both wings in the brand's own colours,
 * ripples behind the face or the logo, one big line, one small one. Nine seconds, then the
 * deck comes back and the moment sits at the head of the feed with a beam on it.
 *
 * A client asking for something takes the stage without confetti: the room should know.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { Ripple } from '@/components/ui/ripple'
import { SparklesText } from '@/components/ui/sparkles-text'
import { Face, INK, LIME, Logo, MUTED } from './board'
import type { Moment } from './moments'

function fire() {
  const colors = [LIME, INK, '#FFFFFF', '#7BD36A']
  const base = { particleCount: 90, spread: 70, startVelocity: 55, ticks: 170, gravity: 1.1, scalar: 1.25, colors, zIndex: 60 }
  confetti({ ...base, angle: 60, origin: { x: 0, y: 0.7 } })
  confetti({ ...base, angle: 120, origin: { x: 1, y: 0.7 } })
  setTimeout(() => confetti({ ...base, particleCount: 60, spread: 120, startVelocity: 40, origin: { x: 0.5, y: 0.35 } }), 500)
  setTimeout(() => { confetti({ ...base, angle: 60, origin: { x: 0, y: 0.6 } }); confetti({ ...base, angle: 120, origin: { x: 1, y: 0.6 } }) }, 1600)
}

export function Stage({ m }: { m: Moment | null }) {
  useEffect(() => { if (m?.tier === 'celebrate') fire(); return () => { confetti.reset() } }, [m?.id, m?.tier])
  const title = m?.cheer?.title ?? m?.name ?? ''
  const sub = m?.cheer?.sub ?? m?.line ?? ''
  const big = m?.tier === 'celebrate'
  return (
    <AnimatePresence>
      {m && (
        <motion.div key={m.id} className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <motion.div className="absolute inset-0" style={{ background: 'rgba(246,246,242,0.86)', backdropFilter: 'blur(22px)' }} />
          {big && <Ripple mainCircleSize={340} mainCircleOpacity={0.22} numCircles={7} className="[mask-image:radial-gradient(60%_60%_at_50%_45%,white,transparent)]" />}
          <motion.div className="relative flex flex-col items-center text-center" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.1 }}>
              {m.avatar || !m.logo
                ? <Face src={m.avatar} name={m.name} size={big ? 232 : 160} ring={big ? LIME : '#fff'} />
                : m.logo
                  ? <Logo src={m.logo} name={m.client ?? m.name} size={big ? 200 : 150} ring={big ? LIME : undefined} />
                  : <span className="inline-flex items-center rounded-full px-5 py-2 text-[18px] font-semibold uppercase tracking-[0.14em]" style={{ background: m.tone, color: INK }}>{m.label}</span>}
            </motion.div>
            <div className="mt-9 max-w-[76vw]">
              {big
                ? <div style={{ color: INK }}><SparklesText sparklesCount={14} colors={{ first: LIME, second: INK }} className="text-[92px] font-semibold leading-[1.02] tracking-[-0.045em] [&_strong]:font-semibold">{title}</SparklesText></div>
                : <div className="text-[72px] font-semibold leading-[1.04] tracking-[-0.04em]" style={{ color: INK }}>{title}</div>}
            </div>
            {sub && <motion.div className="mt-5 max-w-[60vw] text-[28px] leading-snug" style={{ color: MUTED }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>{sub}</motion.div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
