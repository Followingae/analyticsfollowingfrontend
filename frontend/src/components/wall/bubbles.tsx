'use client'

/**
 * Bubbles: every moment that is not a celebration floats onto whatever screen the wall is
 * showing, like something rising through an aquarium, and is gone ten seconds later.
 *
 * Only celebrations take the whole stage (stage.tsx). A client request, a note, a roster
 * burst, a creator replying, content moving: each becomes one card that drifts up from the
 * bottom, sways a little, and fades near the top. At most three at a time; the rest wait.
 * In lite mode (TV browsers) the card rises straight and does not sway.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Face, INK, Logo, MUTED } from './board'
import type { Moment } from './moments'

export const BUBBLE_MS = 10_000
export const BUBBLES_AT_ONCE = 3

export type Bubble = { m: Moment; at: number; x: number; sway: number }

/** A new bubble, with a lane that avoids the ones already afloat. */
export function newBubble(m: Moment, afloat: Bubble[]): Bubble {
  const lanes = [14, 38, 62, 86]
  const taken = new Set(afloat.map(b => b.x))
  const free = lanes.filter(l => !taken.has(l))
  const x = (free.length ? free : lanes)[Math.floor(Math.random() * (free.length ? free.length : lanes.length))]
  return { m, at: Date.now(), x, sway: (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 14) }
}

export function Bubbles({ items, lite }: { items: Bubble[]; lite: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {items.map(b => {
          const m = b.m
          const rise = typeof window !== 'undefined' ? window.innerHeight * 0.62 : 600
          return (
            <motion.div key={m.id} className="absolute bottom-[-180px] w-[440px] -translate-x-1/2" style={{ left: `${b.x}%` }}
              initial={{ y: 0, opacity: 0, scale: 0.86 }}
              animate={lite
                ? { y: -rise, opacity: [0, 1, 1, 1, 0], scale: 1 }
                : { y: -rise, x: [0, b.sway, -b.sway * 0.7, b.sway * 0.5, 0], rotate: [0, b.sway / 9, -b.sway / 11, b.sway / 14, 0], opacity: [0, 1, 1, 1, 0], scale: [0.86, 1, 1, 1, 0.94] }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{ duration: BUBBLE_MS / 1000, ease: 'linear', opacity: { duration: BUBBLE_MS / 1000, times: [0, 0.07, 0.78, 0.93, 1] }, scale: { duration: BUBBLE_MS / 1000, times: [0, 0.07, 0.8, 0.95, 1] } }}>
              <div className="flex items-center gap-4 rounded-[30px] bg-white px-5 py-4" style={{ boxShadow: lite ? '0 0 0 1px rgba(21,24,26,0.08)' : '0 24px 60px -24px rgba(21,24,26,0.35), 0 0 0 1px rgba(21,24,26,0.06)' }}>
                {m.avatar || !m.logo
                  ? <Face src={m.avatar} name={m.name} size={72} ring={m.tone} />
                  : <Logo src={m.logo} name={m.client ?? m.name} size={72} ring={m.tone} />}
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ background: m.tone, color: INK }}>{m.label}</span>
                  <div className="mt-1.5 truncate text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: INK }}>{m.name}</div>
                  <div className="line-clamp-2 text-[15px] leading-snug" style={{ color: MUTED }}>{m.quote ? `“${m.quote}”` : m.line}{m.client && !m.quote ? ` · ${m.client}` : ''}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
