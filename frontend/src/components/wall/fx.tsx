'use client'

/**
 * The wall's moving parts: a living ground, a particle field, orbits, a ticker, a numeral
 * that counts, an arc that draws. Written in the shape of the Magic UI primitives of the same
 * names (OrbitingCircles, Marquee, NumberTicker, Particles) on motion/react, so there is no
 * new dependency and every piece runs at 60fps on a TV stick.
 */
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

export const LIME = '#D3FF02'

/** A slow gradient mesh: four colour fields drifting over near-black, with film grain. Replaces
 *  the sign-in video; it is never the same frame twice and it costs nothing to run. */
export function Mesh() {
  const blobs = [
    { c: 'rgba(211,255,2,0.55)', w: '70vw', x: ['-20vw', '10vw', '-20vw'], y: ['-30vw', '-10vw', '-30vw'], d: 38 },
    { c: 'rgba(170,230,200,0.55)', w: '60vw', x: ['60vw', '40vw', '60vw'], y: ['30vw', '45vw', '30vw'], d: 46 },
    { c: 'rgba(230,220,255,0.5)', w: '50vw', x: ['20vw', '45vw', '20vw'], y: ['40vw', '20vw', '40vw'], d: 52 },
    { c: 'rgba(255,240,200,0.5)', w: '45vw', x: ['70vw', '55vw', '70vw'], y: ['-20vw', '0vw', '-20vw'], d: 41 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: '#F6F6F2' }}>
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ width: b.w, height: b.w, background: `radial-gradient(circle, ${b.c} 0%, rgba(0,0,0,0) 62%)`, filter: 'blur(40px)' }}
          animate={{ x: b.x, y: b.y }} transition={{ duration: b.d, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22/></svg>")' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(246,246,242,0) 0%, rgba(246,246,242,0.6) 100%)' }} />
    </div>
  )
}

/** Dust in the air: a few hundred slow points on a canvas. */
export function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr }
    resize()
    const pts = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.00012, vy: -0.00004 - Math.random() * 0.00008, a: 0.15 + Math.random() * 0.45,
    }))
    const tick = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.02) p.x = -0.02
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(211,255,2,${p.a * 0.5})`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [count])
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />
}

/** A numeral that springs to its value and re-springs when the value changes. */
export function NumberTicker({ value, className = '', style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { damping: 42, stiffness: 90, mass: 1 })
  const text = useTransform(spring, v => Math.round(v).toLocaleString('en-GB'))
  useEffect(() => { mv.set(value) }, [mv, value])
  return <motion.span className={`tabular-nums ${className}`} style={style}>{text}</motion.span>
}

/** Children orbit a centre on a ring. Each child is counter-rotated so a face stays upright. */
export function Orbit({ radius, duration = 40, reverse = false, children, dashed = true, ringColour = 'rgba(255,255,255,0.16)' }: {
  radius: string; duration?: number; reverse?: boolean; children: React.ReactNode[]; dashed?: boolean; ringColour?: string
}) {
  const n = children.length
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: `calc(${radius} * 2)`, height: `calc(${radius} * 2)`, transform: 'translate(-50%, -50%)' }}>
      {dashed && <div className="absolute inset-0 rounded-full" style={{ border: `0.08vw dashed ${ringColour}` }} />}
      <motion.div className="absolute inset-0" animate={{ rotate: reverse ? -360 : 360 }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
        {children.map((child, i) => {
          const angle = (360 / Math.max(1, n)) * i
          return (
            <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg) translate(${radius}) rotate(${-angle}deg)` }}>
              <motion.div className="-translate-x-1/2 -translate-y-1/2" animate={{ rotate: reverse ? 360 : -360 }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
                {child}
              </motion.div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

/** An endless horizontal belt. Content is doubled so the loop never shows a seam. */
export function Marquee({ children, duration = 60, reverse = false, gap = '1.2vw', className = '' }: {
  children: React.ReactNode; duration?: number; reverse?: boolean; gap?: string; className?: string
}) {
  return (
    <div className={`flex overflow-hidden ${className}`} style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}>
      <motion.div className="flex shrink-0 items-center" style={{ gap }} animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
        <div className="flex shrink-0 items-center" style={{ gap }}>{children}</div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden>{children}</div>
      </motion.div>
    </div>
  )
}

/** A progress arc that draws itself, with room in the middle for a number. */
export function Arc({ pct, size = '12vw', stroke = '0.55vw', children, colour = LIME, track = 'rgba(255,255,255,0.10)' }: {
  pct: number; size?: string; stroke?: string; children?: React.ReactNode; colour?: string; track?: string
}) {
  const p = Math.max(0, Math.min(1, pct / 100))
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="6" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={colour} strokeWidth="6" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p) }} transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
