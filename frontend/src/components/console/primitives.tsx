'use client'

/**
 * The console language.
 *
 * Every operator screen is made of the same few pieces, so Today, Inbox, Goals, Coverage and
 * the rest read as one product rather than five people's ideas of a dashboard.
 *
 *   Stat      a caption, one big number, and a line of context underneath
 *   Panel     a soft card with a title row and room for an action
 *   Row       a list line: a state dot, a title, a meta line, something on the right
 *   Tone      the one place a status colour is decided, so amber means the same everywhere
 *
 * The look is the CRM language the founder picked: a light ground, generously rounded cards
 * layered on it, pastel washes that carry state as *surface* rather than as coloured text,
 * and one black pill per screen for the action you actually came to do. Colour is only ever
 * status, never decoration, and it always arrives with a word beside it.
 *
 * Washes are deliberately desaturated. Our lime is a headline colour at full strength and
 * unreadable as a background, so surfaces get a pale version of it and the full strength is
 * saved for the one thing that matters on the screen.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info'

const DOT: Record<Tone, string> = {
  neutral: 'bg-neutral-400 dark:bg-neutral-500',
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-rose-500',
  info: 'bg-[#A6C520] dark:bg-[#C7E63F]',
}

/** The card surface for a tone. Pastel in light, a deep tint in dark. */
const WASH: Record<Tone, string> = {
  neutral: 'bg-white dark:bg-neutral-900/70',
  good: 'bg-[#EDF6EC] dark:bg-emerald-950/40',
  warn: 'bg-[#FDF0DF] dark:bg-amber-950/40',
  bad: 'bg-[#FBE7E5] dark:bg-rose-950/40',
  info: 'bg-[#F2F8DA] dark:bg-lime-950/30',
}

const TEXT: Record<Tone, string> = {
  neutral: 'text-foreground',
  good: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-rose-700 dark:text-rose-400',
  info: 'text-foreground',
}

/**
 * Money, in the new Dirham sign.
 *
 * The old mark was Arabic text — right-to-left, so beside Latin digits it dragged them into
 * its own run and "1.68M" came out reversed. U+20C3 is a currency sign with no direction of
 * its own, which removes the problem rather than working around it. No system font carries
 * it yet, so the face that does is loaded scoped to that single codepoint.
 */
export function Aed({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1.5" dir="ltr">
      {/* The face is named on the element itself. Leaving it to the cascade means one
          screen with its own font stack silently loses the glyph and shows a box. */}
      <span
        className="text-[0.74em] font-medium text-muted-foreground"
        style={{ fontFamily: '"Dirham-Sans", "Dirham", sans-serif' }}
      >⃃</span>
      <span>{children}</span>
    </span>
  )
}

/** The shared card shell: generous radius, hairline edge, a shadow you feel more than see. */
export const CARD =
  'rounded-[22px] border border-black/[0.06] shadow-[0_1px_2px_rgba(16,20,12,0.04),0_12px_28px_-16px_rgba(16,20,12,0.18)] ' +
  'dark:border-white/[0.07] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_28px_-16px_rgba(0,0,0,0.7)]'

/** Page title, one line of what the screen is for, and the screen's single main action. */
export function PageHead({
  title, sub, action,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div data-tour="page-head"
         className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
          {title}
        </h1>
        {sub && <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/**
 * One number, given room. The caption sits above it and the meaning underneath — a bare
 * figure on a card tells you nothing you can act on, which was the whole complaint about
 * plain dashboards.
 */
export function Stat({
  label, value, hint, tone = 'neutral', icon: Icon, onClick,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: Tone
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        CARD, WASH[tone], 'w-full p-5 text-left transition-all',
        onClick && 'hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,20,12,0.05),0_18px_36px_-18px_rgba(16,20,12,0.25)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <p className={cn('mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums', TEXT[tone])}>
        {value}
      </p>
      {hint && <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </Tag>
  )
}

export function StatGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 }) {
  return (
    <div data-tour="stats"
         className={cn('grid gap-4 sm:grid-cols-2', cols === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
      {children}
    </div>
  )
}

/** A panel's anchor is its own title, so a tour can name the panel it means. */
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** A titled card. `flush` drops the body padding so a list can run edge to edge. */
export function Panel({
  title, description, action, children, flush, className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  flush?: boolean
  className?: string
}) {
  return (
    <section
      data-tour={`panel-${slug(title)}`}
      className={cn(CARD, 'flex flex-col bg-white dark:bg-neutral-900/70', className)}
    >
      <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
        <div className="space-y-1">
          <h2 className="text-[15.5px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn('flex-1', flush ? 'pb-2' : 'px-6 pb-6')}>{children}</div>
    </section>
  )
}

/**
 * A list line. The dot carries state at a glance; the word beside it carries it for anyone
 * who cannot separate the colours, and for anyone reading a print-out.
 */
export function Row({
  tone = 'neutral', title, meta, right, onClick,
}: {
  tone?: Tone
  title: React.ReactNode
  meta?: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'mx-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl px-3 py-3 text-left',
        onClick && 'transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05]',
      )}
    >
      <span className={cn('mt-[3px] h-2 w-2 flex-none self-start rounded-full', DOT[tone])} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="truncate text-[14px] font-medium leading-snug">{title}</div>
        {meta && <div className="truncate text-[12.5px] text-muted-foreground">{meta}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </Tag>
  )
}

/** Nothing here — say so plainly, in the card, without an illustration or a pitch. */
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-12 text-center text-sm text-muted-foreground">{children}</p>
}

/** A thin bar for "9 of 12", where the fraction matters more than the number. */
export function MiniBar({ value, max, tone = 'info' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
        <div className={cn('h-full rounded-full', DOT[tone])} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}/{max}</span>
    </div>
  )
}

/**
 * Completion as a ring — the one big number on a screen that has one.
 * Drawn rather than charted: it is a single value, and a chart library rounds the cap badly
 * at this stroke width.
 */
export function Ring({
  pct, caption, size = 132,
}: { pct: number | null; caption?: string; size?: number }) {
  const v = Math.max(0, Math.min(100, pct ?? 0))
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8"
                  className="stroke-black/[0.07] dark:stroke-white/10" />
          {v > 0 && (
            <circle
              cx="60" cy="60" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
              className="stroke-[#A6C520] dark:stroke-[#C7E63F]"
              strokeDasharray={`${(v / 100) * c} ${c}`}
              style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
            {pct == null ? '—' : `${Math.round(pct)}%`}
          </span>
        </div>
      </div>
      {caption && <span className="text-center text-xs text-muted-foreground">{caption}</span>}
    </div>
  )
}

/** Where something sits in a sequence, as one pill of segments. */
export function StageBar({
  stages, current,
}: { stages: { key: string; label: string }[]; current: string }) {
  const at = Math.max(0, stages.findIndex(s => s.key === current))
  return (
    <div className="flex flex-wrap items-center gap-1">
      {stages.map((s, i) => (
        <span
          key={s.key}
          className={cn(
            'rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
            i < at && 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.07]',
            i === at && 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
            i > at && 'text-muted-foreground/60',
          )}
        >
          {s.label}
        </span>
      ))}
    </div>
  )
}

/**
 * A score circle, the way the reference marks every row.
 *
 * The number is the point — how long something has waited, how far along it is — and the
 * ring around it turns that into something you can scan without reading. Colour is earned:
 * green while it is fine, amber once it is old, rose once somebody is chasing it.
 */
export function ScoreDot({
  value, suffix, tone = 'neutral', title,
}: { value: number | string; suffix?: string; tone?: Tone; title?: string }) {
  const skin: Record<Tone, string> = {
    neutral: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
    good: 'bg-[#E9F5E5] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    warn: 'bg-[#FCEFDC] text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    bad: 'bg-[#FBE3E0] text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    info: 'bg-[#EFF7D4] text-[#5C7211] dark:bg-lime-950/40 dark:text-lime-300',
  }
  const text = `${value}${suffix ?? ''}`
  // A circle only holds a character or two. "14d" in a fixed circle wrapped onto a second
  // line, so anything longer grows sideways into a pill instead — same shape language, and
  // the label stays on one line whatever it says.
  const round = text.length <= 2
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full',
        'text-[12px] font-semibold leading-none tabular-nums',
        round ? 'w-7' : 'px-2.5',
        skin[tone],
      )}
    >
      {text}
    </span>
  )
}

/** A quiet round button — the reference puts one on every row and card header. */
export function RoundButton({
  icon: Icon, label, onClick, className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button" onClick={onClick} title={label} aria-label={label}
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/[0.06] bg-white',
        'text-muted-foreground transition-colors hover:text-foreground',
        'dark:border-white/[0.08] dark:bg-neutral-900/70', className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

/** The little grey heading a list uses to break itself into "Today" and "Earlier". */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground first:pt-1">
      {children}
    </p>
  )
}

/**
 * The record header strip the reference puts under a record's name: four or five short
 * facts, labelled, in a row. It is what stops a detail page opening with a title and
 * nothing else.
 */
export function FieldStrip({
  fields,
}: { fields: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      {fields.map(f => (
        <div key={f.label} className="min-w-[92px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {f.label}
          </p>
          <p className="mt-1 text-[14px] font-medium">{f.value ?? '—'}</p>
        </div>
      ))}
    </div>
  )
}

/** Record tabs — Summary · Details · Related, as the reference lays them out. */
export function RecordTabs({
  tabs, value, onChange,
}: { tabs: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            'rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
            value === t.key
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-muted-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
