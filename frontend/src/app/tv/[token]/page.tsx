'use client'

/**
 * The office wall.
 *
 * A rotating deck, not one dense page. Each kind of work finishes differently — barter ends
 * when the content is verified, a managed campaign when the posts are live, UGC when the
 * video is delivered — so each gets its own slide and its own completion. One shared
 * progress bar across all of them would mean nothing.
 *
 * The look follows the reference: a full-bleed photograph as the ground, dark glass cards
 * floating over it, the headline sitting on the picture rather than in a box, and lime used
 * once or twice per screen rather than everywhere. The photograph is real — it is the hero
 * image of the campaign the slide is about — so the wall shows the work, not a texture.
 *
 * It runs 24/7 on a TV with no keyboard, so: viewport units throughout (one build fits 1080p
 * and 4K), slow crossfades and nothing that blinks, and a dropped connection holds the last
 * good deck instead of blanking.
 *
 * shadcn/ui only: Card, Badge, Progress, Avatar, Separator, and the shadcn chart wrapper.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clapperboard, Clock, Film,
  Gauge, Inbox, Search, Sparkles, Users,
} from 'lucide-react'

const FALLBACK_REFRESH_MS = 60_000
const SLIDE_MS = 20_000

/** Brand lime. Pinned, not inherited: the product's dark `--primary` is lavender. */
const LIME = '#D3FF02'

const dayLabel = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (new Date(today.getTime() + 86_400_000).toDateString() === d.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Slide = { key: string; title: string; rows?: any[]; totals?: Record<string, any> }

/* ── the parts everything is built from ────────────────────────────────────────────── */

/** The distortion the liquid-glass panels refract their backdrop through. Declared once for
 *  the whole screen; every panel points its bend layer at it. */
function GlassFilter() {
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
 * Liquid glass over the photograph, built the way ui-layouts layers it: a bend layer that
 * blurs and refracts whatever is behind it, a face layer carrying the outer glow, and an
 * edge layer with the inner highlight that gives the panel a lit rim.
 *
 * The tint on the bend layer is ours, and it is deliberately heavy — the picture behind is
 * atmosphere, and the numbers on top have to stay readable from across the room.
 */
function Glass({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const radius = '1.5vw'
  return (
    <Card className={`relative h-full overflow-hidden border-0 bg-transparent shadow-none ${className}`} style={{ borderRadius: radius }}>
      <div
        className="absolute inset-0 z-0 backdrop-blur-xl"
        style={{ borderRadius: radius, filter: 'url(#wall-glass)', background: 'rgba(9,14,12,0.72)' }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{ borderRadius: radius, boxShadow: '0 4px 4px rgba(0,0,0,0.15), 0 0 12px rgba(0,0,0,0.08), 0 0 28px rgba(255,255,255,0.06)' }}
      />
      <div
        className="absolute inset-0 z-20"
        style={{ borderRadius: radius, boxShadow: 'inset 2px 2px 2px 0 rgba(255,255,255,0.18), inset -2px -2px 2px 0 rgba(255,255,255,0.12)' }}
      />
      <CardContent className="relative z-30 flex h-full flex-col p-[1.35vw]">{children}</CardContent>
    </Card>
  )
}

function GlassTitle({ icon: Icon, children, right }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="mb-[1.1vw] flex items-center gap-[0.55vw]">
      <Icon className="h-[1.05vw] w-[1.05vw]" style={{ color: LIME }} />
      <span className="text-[1.05vw] font-semibold leading-none tracking-tight text-white">{children}</span>
      <div className="ml-auto">{right}</div>
    </div>
  )
}

/** Caption above, number below — the reference's stat block. */
function Stat({ caption, value, unit, tone = 'plain', size = 'md' }: {
  caption: string
  value: React.ReactNode
  unit?: string
  tone?: 'plain' | 'accent' | 'warn'
  size?: 'md' | 'xl'
}) {
  const ink = tone === 'warn' ? 'text-[#FF8A7A]' : 'text-white'
  return (
    <div className="flex flex-1 flex-col justify-center rounded-[1vw] bg-white/[0.055] px-[1.05vw] py-[0.95vw] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]">
      <span className={`${size === 'xl' ? 'text-[0.95vw]' : 'text-[0.72vw]'} font-medium leading-none text-white/60`}>{caption}</span>
      <div className="mt-[0.6vw] flex items-baseline gap-[0.3vw]">
        <span className={`${size === 'xl' ? 'text-[4.4vw]' : 'text-[2.3vw]'} font-semibold leading-none tracking-tight tabular-nums ${ink}`}
              style={tone === 'accent' ? { color: LIME } : undefined}>{value}</span>
        {unit && <span className="text-[0.8vw] text-white/55">{unit}</span>}
      </div>
    </div>
  )
}

/** The brand, as row identity — a logo where we have one, initials where we do not. */
function BrandMark({ src, name, size = '2.7vw' }: { src?: string | null; name?: string | null; size?: string }) {
  return (
    <Avatar className="shrink-0 rounded-[0.7vw] border border-white/[0.12] bg-white/[0.07]" style={{ height: size, width: size }}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-contain p-[0.18vw]" /> : null}
      <AvatarFallback className="rounded-[0.7vw] bg-white/[0.07] text-[0.75vw] font-semibold text-white/80">
        {String(name ?? '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}

/** Completion, drawn as a thin ring. Hand-drawn in SVG rather than charted: it is one
 *  number, and a chart library's radial bar rounds the cap badly at this stroke width. */
function Ring({ pct, caption }: { pct: number | null; caption: string }) {
  const r = 46
  const c = 2 * Math.PI * r
  const value = Math.max(0, Math.min(100, pct ?? 0))
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-[13.5vw] w-[13.5vw] -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7" />
        {value > 0 && (
          <circle
            cx="60" cy="60" r={r} fill="none" stroke={LIME} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * c} ${c}`}
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[3.5vw] font-semibold leading-none tracking-tight tabular-nums text-white">
          {pct == null ? '—' : `${pct}%`}
        </span>
        <span className="mt-[0.6vw] max-w-[9vw] text-center text-[0.8vw] leading-snug text-white/65">{caption}</span>
      </div>
    </div>
  )
}

/** The stand-in for a ring on work that has not started: the stage it is actually stuck at,
 *  as one number the room can read. */
function BigWait({ value, caption }: { value: number; caption: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span className="text-[6vw] font-semibold leading-none tracking-tight tabular-nums" style={{ color: LIME }}>
        {value}
      </span>
      <span className="mt-[0.9vw] max-w-[13vw] text-center text-[0.95vw] leading-snug text-white/70">{caption}</span>
    </div>
  )
}

/** Where one campaign's content has got to: verified, being checked, still owed. */
function WorkBar({ done, checking, owed }: { done: number; checking: number; owed: number }) {
  const total = Math.max(1, done + checking + owed)
  const seg = (n: number, cls: string) =>
    n > 0 ? <div className={cls} style={{ width: `${(n / total) * 100}%` }} /> : null
  return (
    <div className="flex h-[0.5vw] w-full overflow-hidden rounded-full bg-white/[0.10]">
      {done > 0 ? <div style={{ width: `${(done / total) * 100}%`, background: LIME }} /> : null}
      {seg(checking, 'bg-[#F5C451]')}
      {seg(owed, 'bg-white/22')}
    </div>
  )
}

/** Dot legend with the count under each label, the way the reference labels its bars. */
function Legend({ items }: { items: { dot: string; label: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex items-center gap-[1.4vw]">
      {items.map(i => (
        <div key={i.label}>
          <span className="flex items-center gap-[0.35vw] text-[0.68vw] text-white/60">
            <span className={`h-[0.42vw] w-[0.42vw] rounded-full ${i.dot}`}
                style={i.dot ? undefined : { background: LIME }} />{i.label}
          </span>
          <div className="mt-[0.2vw] pl-[0.77vw] text-[0.95vw] font-semibold leading-none tabular-nums text-white">{i.value}</div>
        </div>
      ))}
    </div>
  )
}

function Pill({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'warn' | 'quiet' }) {
  const skin = tone === 'warn' ? 'bg-[#FF6B57] text-white'
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

/** The headline sits on the photograph, not in a card — straight from the reference. */
function Headline({ eyebrow, title, meta }: { eyebrow: React.ReactNode; title: string; meta?: string }) {
  return (
    <div className="pb-[0.4vw]">
      <div className="flex items-center gap-[0.5vw]">{eyebrow}</div>
      <h1 className="mt-[0.7vw] text-[3.1vw] font-semibold leading-[1.02] tracking-[-0.02em] text-white">{title}</h1>
      {meta && <div className="mt-[0.55vw] text-[0.85vw] text-white/65">{meta}</div>}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center text-[1vw] text-white/55">{children}</div>
}

/* ── slides ────────────────────────────────────────────────────────────────────────── */

/**
 * App campaigns. Barter and paid share a shape — people apply, the brand decides, content
 * comes in, we verify it — but they are separate slides because they stall in different
 * places and different people chase them.
 */
function AppSlide({ slide, paid }: { slide: Slide; paid: boolean }) {
  const t = slide.totals ?? {}
  const rows = slide.rows ?? []
  const measurable = (t.total_work ?? 0) > 0
  return (
    <div className="grid h-full grid-cols-12 gap-[1.2vw]">
      <div className="col-span-4 flex min-h-0 flex-col gap-[1.2vw]">
        <Headline
          eyebrow={<><Pill>Live now</Pill><Pill tone="quiet">{paid ? 'Paid' : 'Barter'}</Pill></>}
          title="Mobile app"
          meta={`${rows.length} campaign${rows.length === 1 ? '' : 's'} running · ${t.creators_active ?? 0} creators working on them`}
        />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Gauge}>{measurable ? 'Content verified' : 'Waiting to start'}</GlassTitle>
            {measurable
              ? <Ring pct={t.pct ?? null} caption={`${t.verified ?? 0} of ${t.total_work ?? 0} deliverables`} />
              : <BigWait value={t.awaiting_brand ?? 0} caption="creators waiting on the brand before any content is owed" />}
          </Glass>
        </div>
        <Glass className="!h-auto">
            <div className="grid grid-cols-2 gap-[0.7vw]">
              <Stat caption="Brand to decide" value={t.awaiting_brand ?? 0} tone={t.awaiting_brand ? 'accent' : 'plain'} />
              <Stat caption="Applications" value={t.applications_pending ?? 0} />
              <Stat caption="Content to check" value={t.to_check ?? 0} />
              <Stat caption="Missed" value={t.missed ?? 0} tone={t.missed ? 'warn' : 'plain'} />
            </div>
        </Glass>
      </div>

      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle
            icon={Sparkles}
            right={<Legend items={[
              { dot: '', label: 'Verified', value: t.verified ?? 0 },
              { dot: 'bg-[#F5C451]', label: 'To check', value: t.to_check ?? 0 },
              { dot: 'bg-white/25', label: 'Owed', value: t.pending ?? 0 },
            ]} />}
          >
            {paid ? 'Paid campaigns' : 'Barter campaigns'}
          </GlassTitle>
          <div className="flex min-h-0 flex-1 flex-col content-start gap-[0.7vw] overflow-hidden">
            {rows.map((c: any) => (
              <div key={c.id} className="flex min-h-0 max-h-[11vw] flex-1 flex-col justify-center rounded-[1.1vw] bg-white/[0.05] px-[1.1vw] py-[0.95vw] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]">
                <div className="flex items-center gap-[0.9vw]">
                  <BrandMark src={c.brand_logo_url} name={c.brand_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2vw] font-semibold leading-tight tracking-tight text-white">{c.name}</div>
                    <div className="truncate text-[0.78vw] text-white/60">{c.brand_name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-[0.6vw]">
                    {c.awaiting_brand > 0 && <Pill>{c.awaiting_brand} for brand</Pill>}
                    {c.missed > 0 && <Pill tone="warn">{c.missed} missed</Pill>}
                    <span className="w-[4vw] text-right text-[1.8vw] font-semibold leading-none tabular-nums text-white">
                      {c.pct == null ? '—' : `${c.pct}%`}
                    </span>
                  </div>
                </div>
                <div className="mt-[0.75vw] flex items-center gap-[1vw]">
                  <WorkBar done={c.verified} checking={c.to_check} owed={c.pending} />
                  <span className="shrink-0 text-[0.78vw] tabular-nums text-white/60">
                    {c.verified}/{c.total_work} done · {c.creators_active} creators
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

/** Managed campaigns. Booked from proposals, so completion is people booked and posts live —
 *  counting verified deliverables here would read 0% forever. */
function ManagedSlide({ slide }: { slide: Slide }) {
  const t = slide.totals ?? {}
  const rows = slide.rows ?? []
  return (
    <div className="grid h-full grid-cols-12 gap-[1.2vw]">
      <div className="col-span-4 flex min-h-0 flex-col gap-[1.2vw]">
        <Headline
          eyebrow={<><Pill>Live now</Pill><Pill tone="quiet">Proposals</Pill></>}
          title="Managed"
          meta={`${rows.length} campaign${rows.length === 1 ? '' : 's'} we run for clients`}
        />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Users}>Roster booked</GlassTitle>
            <Ring pct={t.pct ?? null} caption={`${t.booked_against_target ?? 0} of ${t.target ?? 0} creators booked`} />
          </Glass>
        </div>
        <Glass className="!h-auto">
          <div className="grid grid-cols-2 gap-[0.7vw]">
            <Stat caption="Creators booked" value={t.booked ?? 0} tone="accent" />
            <Stat caption="Posts live" value={t.posts ?? 0} />
          </div>
        </Glass>
      </div>
      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle icon={CheckCircle2}>Campaigns</GlassTitle>
          <div className="flex min-h-0 flex-1 flex-col content-start gap-[0.7vw] overflow-hidden">
            {rows.map((c: any) => (
              <div key={c.id} className="flex min-h-0 max-h-[11vw] flex-1 flex-col justify-center rounded-[1.1vw] bg-white/[0.05] px-[1.1vw] py-[1vw] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]">
                <div className="flex items-center gap-[0.9vw]">
                  <BrandMark src={c.brand_logo_url} name={c.brand_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2vw] font-semibold leading-tight tracking-tight text-white">{c.name}</div>
                    <div className="truncate text-[0.78vw] text-white/60">{c.brand_name}</div>
                  </div>
                  <span className="shrink-0 text-[0.85vw] tabular-nums text-white/70">
                    {c.booked}{c.target ? ` / ${c.target}` : ''} creators
                  </span>
                  <span className="w-[6.5vw] shrink-0 text-right text-[0.85vw] tabular-nums text-white/70">
                    {c.posts} posts live
                  </span>
                </div>
                {c.pct == null ? (
                  <div className="mt-[0.8vw] text-[0.78vw] text-white/50">No roster target set</div>
                ) : (
                  <Progress
                    value={c.pct}
                    className="mt-[0.8vw] h-[0.5vw] bg-white/[0.10] [&>div]:bg-[#D3FF02]"
                  />
                )}
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

/** UGC. No creators and no deadlines — concepts become videos, so the slide is that funnel. */
function UgcSlide({ slide }: { slide: Slide }) {
  const t = slide.totals ?? {}
  const funnel = [
    { stage: 'Proposed', v: t.proposed ?? 0 },
    { stage: 'Approved', v: t.approved ?? 0 },
    { stage: 'In production', v: t.in_production ?? 0 },
    { stage: 'Delivered', v: t.delivered ?? 0 },
  ]
  return (
    <div className="grid h-full grid-cols-12 gap-[1.2vw]">
      <div className="col-span-4 flex min-h-0 flex-col gap-[1.2vw]">
        <Headline
          eyebrow={<><Pill>Live now</Pill><Pill tone="quiet">Studio</Pill></>}
          title="UGC"
          meta="Concepts we write, shoot and hand over"
        />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Film}>Approved work delivered</GlassTitle>
            <Ring pct={t.pct ?? null} caption={`${t.delivered ?? 0} of ${t.approved ?? 0} approved concepts`} />
          </Glass>
        </div>
        <Glass className="!h-auto">
          <div className="grid grid-cols-2 gap-[0.7vw]">
            <Stat caption="In production" value={t.in_production ?? 0} tone="accent" />
            <Stat caption="Videos delivered" value={t.delivered ?? 0} />
          </div>
        </Glass>
      </div>
      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle icon={Clapperboard}>Concept through to video</GlassTitle>
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-[1.1vw] py-[0.5vw]">
            {funnel.map((f, i) => {
              const top = Math.max(1, funnel[0].v)
              const last = i === funnel.length - 1
              return (
                <div key={f.stage} className="flex min-h-0 flex-1 items-center gap-[1.1vw]">
                  <span className="w-[9vw] shrink-0 text-[0.95vw] text-white/70">{f.stage}</span>
                  <div className="h-[2.6vw] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000"
                      style={{
                        width: `${Math.max(2, (f.v / top) * 100)}%`,
                        background: last ? LIME : `rgba(255,255,255,${0.14 + i * 0.06})`,
                      }}
                    />
                  </div>
                  <span
                    className="w-[4vw] shrink-0 text-right text-[1.6vw] font-semibold leading-none tabular-nums"
                    style={last ? { color: LIME } : { color: '#fff' }}
                  >{f.v}</span>
                </div>
              )
            })}
          </div>
        </Glass>
      </div>
    </div>
  )
}

/** Everything sitting on us right now, across every campaign type — the one slide that is a
 *  to-do list rather than a status. */
function WaitingSlide({ slide }: { slide: Slide }) {
  const t = slide.totals ?? {}
  const rows = slide.rows ?? []
  return (
    <div className="grid h-full grid-cols-12 gap-[1.2vw]">
      <div className="col-span-6 flex min-h-0 flex-col gap-[1.2vw]">
        <Headline
          eyebrow={<><Pill>Right now</Pill><Pill tone="quiet">Everyone</Pill></>}
          title="Waiting on us"
          meta="Nothing here moves until somebody in this room touches it"
        />
        <div className="min-h-0 flex-1">
          <Glass>
            <GlassTitle icon={Inbox}>The queue</GlassTitle>
            <div className="grid flex-1 grid-cols-3 gap-[0.8vw]">
              <Stat size="xl" caption="Applications to review" value={t.applications ?? 0} tone={t.applications ? 'accent' : 'plain'} />
              <Stat size="xl" caption="Waiting on the brand" value={t.brand_approvals ?? 0} />
              <Stat size="xl" caption="Content to check" value={t.content_to_check ?? 0} />
              <Stat size="xl" caption="Due today" value={t.due_today ?? 0} />
              <Stat size="xl" caption="Due tomorrow" value={t.due_tomorrow ?? 0} />
              <Stat size="xl" caption="Missed" value={t.missed ?? 0} tone={t.missed ? 'warn' : 'plain'} />
            </div>
          </Glass>
        </div>
      </div>
      <div className="col-span-6 min-h-0">
        <Glass>
          <GlassTitle
            icon={CalendarClock}
            right={<span className="text-[1.3vw] font-semibold leading-none tabular-nums text-white">{rows.length}</span>}
          >
            Due today and tomorrow
          </GlassTitle>
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-[0.7vw]">
              <CheckCircle2 className="h-[3vw] w-[3vw]" style={{ color: LIME }} />
              <span className="text-[2.2vw] font-semibold leading-none tracking-tight text-white">All clear</span>
              <span className="text-[0.9vw] text-white/60">Nothing due today or tomorrow</span>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-[0.6vw] overflow-hidden">
              {rows.map((d: any) => (
                <div key={d.id} className="flex min-h-0 max-h-[8vw] flex-1 items-center gap-[0.85vw] rounded-[1vw] bg-white/[0.05] px-[1vw] py-[0.8vw] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]">
                  <BrandMark src={d.brand_logo_url} name={d.campaign_name} size="2.2vw" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.02vw] font-semibold leading-tight text-white">
                      {d.creator ? `@${d.creator}` : 'Unassigned'}
                    </div>
                    <div className="truncate text-[0.75vw] text-white/60">
                      {d.campaign_name ?? '—'}{d.deliverable_type ? ` · ${d.deliverable_type}` : ''}
                    </div>
                  </div>
                  {d.missed
                    ? <Pill tone="warn">Missed</Pill>
                    : dayLabel(d.due_at) === 'Today'
                      ? <Pill>Today</Pill>
                      : <Pill tone="quiet">{dayLabel(d.due_at)}</Pill>}
                </div>
              ))}
            </div>
          )}
        </Glass>
      </div>
    </div>
  )
}

function SourcingSlide({ slide }: { slide: Slide }) {
  const rows = slide.rows ?? []
  return (
    <div className="grid h-full grid-cols-12 gap-[1.2vw]">
      <div className="col-span-4 flex min-h-0 flex-col justify-start gap-[1.2vw]">
        <Headline
          eyebrow={<><Pill>Right now</Pill><Pill tone="quiet">Talent</Pill></>}
          title="Sourcing"
          meta={`${rows.length} round${rows.length === 1 ? '' : 's'} open`}
        />
      </div>
      <div className="col-span-8 min-h-0">
        <Glass>
          <GlassTitle icon={Search}>Rounds open</GlassTitle>
          {rows.length === 0 ? <Empty>No rounds open</Empty> : (
            <div className="grid flex-1 grid-cols-2 content-start gap-[0.8vw]">
              {rows.map((r: any) => {
                const pct = r.target > 0 ? Math.min(100, Math.round((r.found / r.target) * 100)) : null
                return (
                  <div key={r.id} className="flex min-h-0 max-h-[11vw] flex-1 flex-col justify-center rounded-[1.1vw] bg-white/[0.05] px-[1.1vw] py-[1vw] shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.16),inset_-1px_-1px_1px_0_rgba(255,255,255,0.10)]">
                    <div className="flex items-baseline gap-[0.6vw]">
                      <span className="truncate text-[1.15vw] font-semibold leading-tight tracking-tight text-white">{r.title}</span>
                      <span className="ml-auto shrink-0 text-[0.9vw] tabular-nums text-white/70">
                        {r.found}/{r.target || '—'}
                      </span>
                    </div>
                    <div className="mt-[0.4vw] truncate text-[0.76vw] text-white/60">
                      {r.client_name ?? '—'} · Round {r.round_no}
                    </div>
                    <Progress value={pct ?? 0} className="mt-[0.8vw] h-[0.45vw] bg-white/[0.10] [&>div]:bg-[#D3FF02]" />
                  </div>
                )
              })}
            </div>
          )}
        </Glass>
      </div>
    </div>
  )
}

function renderSlide(s: Slide) {
  switch (s.key) {
    case 'app_barter': return <AppSlide slide={s} paid={false} />
    case 'app_paid': return <AppSlide slide={s} paid />
    case 'managed': return <ManagedSlide slide={s} />
    case 'ugc': return <UgcSlide slide={s} />
    case 'waiting': return <WaitingSlide slide={s} />
    case 'sourcing': return <SourcingSlide slide={s} />
    default: return null
  }
}

const KNOWN = new Set(['app_barter', 'app_paid', 'managed', 'ugc', 'waiting', 'sourcing'])

/** The photograph behind a slide: the hero image of the campaign it is about. */
const heroOf = (s: Slide | null) =>
  s?.rows?.map((r: any) => r.hero_image_url).find(Boolean) ?? null

/* ── the wall ──────────────────────────────────────────────────────────────────────── */

export default function WallPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [clock, setClock] = useState('')
  const [today, setToday] = useState('')
  const [index, setIndex] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/display/${token}`)
      if (!res.ok) {
        // 404/410 are terminal: the screen is unknown or switched off, and no amount of
        // waiting will fix it. Anything else is treated as a blip.
        if (res.status === 404 || res.status === 410) {
          setError(res.status === 404 ? 'Unknown screen' : 'This screen was switched off')
        } else setStale(true)
        return
      }
      setData((await res.json()).data)
      setError(null)
      setStale(false)
    } catch {
      setStale(true)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  // The server decides how often the screen comes back, so a wall can be slowed down
  // without a deploy.
  useEffect(() => {
    const ms = data?.refresh_seconds ? data.refresh_seconds * 1000 : FALLBACK_REFRESH_MS
    const t = setInterval(load, ms)
    return () => clearInterval(t)
  }, [load, data?.refresh_seconds])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      setToday(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const t = setInterval(tick, 20_000)
    return () => clearInterval(t)
  }, [])

  const slides: Slide[] = useMemo(
    () => (data?.slides ?? []).filter((s: Slide) => KNOWN.has(s.key)),
    [data],
  )

  // Rotation is modulo the live count, so a deck that shrinks between refreshes keeps
  // turning instead of parking on an index that no longer exists.
  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [slides.length])

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070A09] text-white/70">
        <span className="text-[1.4vw] tracking-tight">{error}</span>
      </div>
    )
  }

  const current = slides.length ? slides[index % slides.length] : null
  const hero = heroOf(current)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070A09] text-white">
      <GlassFilter />
      {/* The ground. A campaign's own hero photograph where the slide has one, our brand loop
          where it does not — and always a heavy scrim, because the picture is atmosphere and
          the numbers on top of it are the point. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(80% 60% at 15% 0%, rgba(150,190,45,0.40) 0%, rgba(7,10,9,0) 60%), radial-gradient(70% 70% at 90% 100%, rgba(60,120,85,0.38) 0%, rgba(7,10,9,0) 55%), #070A09' }}
      />
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={hero} src={hero} alt="" className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-[2000ms]" />
      ) : (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src="/abstract-green-gradient-glass-background-following-influencers-platform.mp4"
          autoPlay muted loop playsInline
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(105deg, rgba(4,8,6,0.94) 0%, rgba(4,8,6,0.86) 42%, rgba(4,8,6,0.62) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 80% at 50% 100%, rgba(4,8,6,0.75) 0%, rgba(4,8,6,0) 60%)' }}
      />

      <div className="relative flex h-full flex-col gap-[1.3vw] p-[1.6vw]">
        <header className="flex items-center gap-[1vw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Following Logo Dark Mode.svg" alt="Following" className="h-[1.5vw] w-auto" />

          <div className="ml-auto flex items-center gap-[1.1vw]">
            {/* Where we are in the deck — slow, quiet, the only moving chrome. */}
            <div className="flex items-center gap-[0.4vw]">
              {slides.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-[0.38vw] rounded-full transition-all duration-700 ${
                    i === index % Math.max(1, slides.length) ? 'w-[2.2vw] bg-[#D3FF02]' : 'w-[0.38vw] bg-white/25'
                  }`}
                />
              ))}
            </div>
            <Badge className="gap-[0.45vw] rounded-full border border-white/[0.14] bg-white/[0.08] px-[0.9vw] py-[0.35vw] text-[0.72vw] font-medium text-white/85">
              {stale
                ? <><AlertTriangle className="h-[0.75vw] w-[0.75vw] text-[#F5C451]" />Reconnecting</>
                : <><span className="h-[0.45vw] w-[0.45vw] rounded-full" style={{ background: LIME }} />Live</>}
            </Badge>
            <span className="flex items-center gap-[0.45vw] text-[0.82vw] text-white/65">
              <Clock className="h-[0.85vw] w-[0.85vw]" />
              {today}
            </span>
            <span className="text-[1.4vw] font-semibold tabular-nums tracking-tight text-white">{clock}</span>
          </div>
        </header>

        {/* One slide at a time. The key restarts the crossfade on every change. */}
        <main className="min-h-0 flex-1">
          {current ? (
            <div key={current.key} className="h-full animate-in fade-in duration-[1200ms]">
              {renderSlide(current)}
            </div>
          ) : (
            <Glass><Empty>{data ? 'Nothing running right now' : 'Loading'}</Empty></Glass>
          )}
        </main>
      </div>
    </div>
  )
}
