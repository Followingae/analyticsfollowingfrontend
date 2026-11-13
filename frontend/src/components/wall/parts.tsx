'use client'

/**
 * The parts every wall screen is built from.
 *
 * Lifted out of the page on 13 Nov 2026 when the wall gained a pulse column, pushed cards
 * and three new screens; one 800-line page was the wrong shape for that. Nothing here knows
 * about data: these are the glass, the numbers that settle, the faces and the pills.
 *
 * It runs 24/7 on a TV with no keyboard, so: viewport units throughout (one build fits
 * 1080p and 4K), slow motion, nothing that blinks, and never a number with a currency.
 */
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

/** Brand lime. Pinned, not inherited: the product's dark `--primary` is lavender. */
export const LIME = '#D3FF02'
export const WARN = '#FF8A7A'
export const AMBER = '#F5C451'

const ringConfig = { v: { label: 'Done', color: LIME } } satisfies ChartConfig

export const dayLabel = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (new Date(today.getTime() + 86_400_000).toDateString() === d.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** "just now", "4m", "2h", "Tue". Short enough to sit at the end of one line. */
export const timeAgo = (iso: string | null | undefined, now = Date.now()) => {
  if (!iso) return ''
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86_400) return `${Math.floor(s / 3600)}h`
  if (s < 7 * 86_400) return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' })
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export type Slide = { key: string; title: string; rows?: any[]; totals?: Record<string, any>; [k: string]: any }

/**
 * Eases a number towards its target, from wherever it currently is.
 *
 * Everything that carries a value on this screen goes through here, so a slide arriving and
 * a refresh landing under a slide that is already up both read as the same slow settle
 * rather than a jump. Ease-out, over about a second: on a wall in peripheral vision, motion
 * that decelerates is calm and motion that snaps is a distraction.
 */
export function useEased(target: number, ms = 1100) {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const start = from.current
    const delta = target - start
    if (delta === 0) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      const next = start + delta * eased
      from.current = next
      setValue(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

/** A clock that ticks once a minute, for "4m ago" captions that must not go stale. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/** The distortion the liquid-glass panels refract their backdrop through. Declared once for
 *  the whole screen; every panel points its bend layer at it. */
export function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden>
      <defs>
        <filter id="wall-glass" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="90" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

/**
 * Liquid glass over the ground: a bend layer that blurs and refracts whatever is behind it,
 * a face layer carrying the outer glow, and an edge layer with the inner highlight that
 * gives the panel a lit rim. The tint is deliberately heavy; the numbers on top have to
 * stay readable from across the room.
 */
export function Glass({ className = '', children, pad = '2vw' }: { className?: string; children: React.ReactNode; pad?: string }) {
  const radius = '1.5vw'
  return (
    <Card className={`relative h-full overflow-hidden border-0 bg-transparent shadow-none ${className}`} style={{ borderRadius: radius }}>
      <div
        className="absolute -inset-[3vw] z-0 backdrop-blur-xl"
        style={{ filter: 'url(#wall-glass)', background: 'rgba(9,14,12,0.72)' }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{ borderRadius: radius, boxShadow: '0 4px 4px rgba(0,0,0,0.15), 0 0 12px rgba(0,0,0,0.08), 0 0 28px rgba(255,255,255,0.06)' }}
      />
      <div
        className="absolute inset-0 z-20"
        style={{ borderRadius: radius, boxShadow: 'inset 2px 2px 2px 0 rgba(255,255,255,0.18), inset -2px -2px 2px 0 rgba(255,255,255,0.12)' }}
      />
      <CardContent className="relative z-30 flex h-full flex-col" style={{ padding: pad }}>{children}</CardContent>
    </Card>
  )
}

export function GlassTitle({ icon: Icon, children, right }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="mb-[1.4vw] flex items-center gap-[0.6vw]">
      <Icon className="h-[1.05vw] w-[1.05vw]" style={{ color: LIME }} />
      <span className="text-[1.05vw] font-semibold leading-none tracking-tight text-white">{children}</span>
      <div className="ml-auto">{right}</div>
    </div>
  )
}

/** The inset tile every list row and stat sits on. */
export const TILE = 'rounded-[1.2vw] bg-white/[0.05] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]'

/** Caption above, number below. */
export function Stat({ caption, value, unit, tone = 'plain', size = 'md' }: {
  caption: string
  value: React.ReactNode
  unit?: string
  tone?: 'plain' | 'accent' | 'warn'
  size?: 'md' | 'xl'
}) {
  const ink = tone === 'warn' ? 'text-[#FF8A7A]' : 'text-white'
  const numeric = typeof value === 'number' ? value : null
  const eased = useEased(numeric ?? 0)
  const shown = numeric == null ? value : Math.round(eased)
  return (
    <div className={`flex flex-1 flex-col justify-center px-[1.3vw] py-[1.25vw] ${TILE}`}>
      <span className={`${size === 'xl' ? 'text-[0.95vw]' : 'text-[0.72vw]'} font-medium leading-none text-white/60`}>{caption}</span>
      <div className="mt-[0.6vw] flex items-baseline gap-[0.3vw]">
        <span className={`${size === 'xl' ? 'text-[4.4vw]' : 'text-[2.3vw]'} font-semibold leading-none tracking-tight tabular-nums ${ink}`}
              style={tone === 'accent' ? { color: LIME } : undefined}>{shown}</span>
        {unit && <span className="text-[0.8vw] text-white/55">{unit}</span>}
      </div>
    </div>
  )
}

/** The brand, as row identity: a logo where we have one, initials where we do not. */
export function BrandMark({ src, name, size = '2.7vw' }: { src?: string | null; name?: string | null; size?: string }) {
  return (
    <Avatar className="shrink-0 rounded-[0.7vw] border border-white/[0.12] bg-white/[0.9]" style={{ height: size, width: size }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-contain p-[0.18vw]" /> : null}
      <AvatarFallback className="rounded-[0.7vw] bg-white/[0.07] text-[0.75vw] font-semibold text-white/80">
        {String(name ?? '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}

/** A creator's face: round, from our CDN only, with their initial on a soft disc when we
 *  have no mirrored photo. Never an Instagram link; those die within hours. */
export function Face({ src, name, size = '3vw', ring }: { src?: string | null; name?: string | null; size?: string; ring?: string }) {
  const initial = String(name ?? '?').replace(/^@/, '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <Avatar
      className="shrink-0 rounded-full border-[0.15vw] bg-white/[0.08]"
      style={{ height: size, width: size, borderColor: ring ?? 'rgba(255,255,255,0.14)' }}
    >
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
      <AvatarFallback className="rounded-full bg-white/[0.08] font-semibold text-white/80" style={{ fontSize: `calc(${size} * 0.38)` }}>
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}

/** Completion, as shadcn's radial chart: a rounded bar sweeping its own full-circle track,
 *  with the reading in the hole. */
export function Ring({ pct, caption, size = '13vw' }: { pct: number | null; caption: string; size?: string }) {
  const value = useEased(Math.max(0, Math.min(100, pct ?? 0)))
  const data = [{ name: 'v', v: value }]
  const label = pct == null ? '—' : `${Math.round(value)}%`
  const fontSize = Math.min(28, 42 / (0.6 * Math.max(2, label.length)))
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[0.9vw]">
      <div className="relative aspect-square max-h-full" style={{ height: size }}>
        <ChartContainer config={ringConfig} className="h-full w-full [&_.recharts-radial-bar-background-sector]:fill-white/10">
          <RadialBarChart data={data} innerRadius="79%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <RadialBar dataKey="v" cornerRadius={999} fill={LIME} background={{ fill: 'rgba(255,255,255,0.10)' }} isAnimationActive={false} />
          </RadialBarChart>
        </ChartContainer>
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={fontSize} fontWeight={600} letterSpacing="-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {label}
          </text>
        </svg>
      </div>
      <span className="whitespace-nowrap text-center text-[0.85vw] text-white/65">{caption}</span>
    </div>
  )
}

export function BigWait({ value, caption }: { value: number; caption: string }) {
  const eased = useEased(value)
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span className="text-[6vw] font-semibold leading-none tracking-tight tabular-nums" style={{ color: LIME }}>
        {Math.round(eased)}
      </span>
      <span className="mt-[0.9vw] max-w-[13vw] text-center text-[0.95vw] leading-snug text-white/70">{caption}</span>
    </div>
  )
}

/** Where one campaign's content has got to: verified, being checked, still owed. */
export function WorkBar({ done, checking, owed }: { done: number; checking: number; owed: number }) {
  const total = Math.max(1, done + checking + owed)
  const grown = useEased(1)
  const seg = (n: number, cls: string, style?: React.CSSProperties) =>
    n > 0 ? <div className={cls} style={{ width: `${(n / total) * 100 * grown}%`, ...style }} /> : null
  return (
    <div className="flex h-[0.5vw] w-full overflow-hidden rounded-full bg-white/[0.10]">
      {seg(done, '', { background: LIME })}
      {seg(checking, 'bg-[#F5C451]')}
      {seg(owed, 'bg-white/22')}
    </div>
  )
}

export function EasedProgress({ value, className }: { value: number; className?: string }) {
  return <Progress value={useEased(value)} className={className} />
}

export function Legend({ items }: { items: { dot: string; label: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex items-center gap-[1.4vw]">
      {items.map(i => (
        <div key={i.label}>
          <span className="flex items-center gap-[0.35vw] text-[0.68vw] text-white/60">
            <span className={`h-[0.42vw] w-[0.42vw] rounded-full ${i.dot}`} style={i.dot ? undefined : { background: LIME }} />{i.label}
          </span>
          <div className="mt-[0.2vw] pl-[0.77vw] text-[0.95vw] font-semibold leading-none tabular-nums text-white">{i.value}</div>
        </div>
      ))}
    </div>
  )
}

export function Pill({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'warn' | 'quiet' | 'amber' }) {
  const skin = tone === 'warn' ? 'bg-[#FF6B57] text-white'
    : tone === 'amber' ? 'bg-[#F5C451] text-black'
      : tone === 'quiet' ? 'border border-white/[0.14] bg-white/[0.08] text-white/80'
        : 'text-black'
  return (
    <Badge
      className={`rounded-full border-0 px-[0.85vw] py-[0.32vw] text-[0.72vw] font-semibold leading-none ${skin}`}
      style={tone === 'accent' ? { background: LIME } : undefined}
    >
      {children}
    </Badge>
  )
}

/** The headline sits on the ground, not in a card. */
export function Headline({ eyebrow, title, meta }: { eyebrow: React.ReactNode; title: string; meta?: string }) {
  return (
    <div className="pb-[0.4vw]">
      <div className="flex items-center gap-[0.5vw]">{eyebrow}</div>
      <h1 className="mt-[0.7vw] text-[3.1vw] font-semibold leading-[1.02] tracking-[-0.02em] text-white">{title}</h1>
      {meta && <div className="mt-[0.55vw] text-[0.85vw] text-white/65">{meta}</div>}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center text-[1vw] text-white/55">{children}</div>
}
