'use client'

/**
 * The small pieces every merchant screen is built from.
 *
 * Tiles, dots, pills, money and dates. Nothing here reads data; everything is
 * handed what it shows. Colours are theme tokens, with two deliberate surfaces
 * named here once: the lime field (the brand's surface, never a text colour)
 * and the forest results panel.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Aed } from '@/components/console/primitives'
import { Skeleton } from '@/components/ui/skeleton'

/** Lime is a surface. Text on it is near-black, never the other way round. */
export const LIME = 'bg-[oklch(0.9354_0.2254_121.5)] text-[oklch(0.2_0.03_140)]'
/** The forest panel that closes the trial. */
export const FOREST = 'bg-[oklch(0.33_0.06_150)] text-[oklch(0.97_0.005_100)]'

export const DOT: Record<'done' | 'posting' | 'coming' | 'applied', string> = {
  done: 'bg-[var(--tone-good-dot)]',
  posting: 'bg-[var(--tone-warn-dot)]',
  coming: 'bg-primary',
  applied: 'bg-muted-foreground/40',
}

export const DOT_LABEL: Record<'done' | 'posting' | 'coming' | 'applied', string> = {
  done: 'Done',
  posting: 'Posting',
  coming: 'Coming',
  applied: 'Applied',
}

/* ── Tile ────────────────────────────────────────────────────────────────── */

export function Tile({
  className,
  children,
  as: Tag = 'article',
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'article' | 'div' | 'section' }) {
  return (
    <Tag
      className={cn(
        'flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-[20px] border border-border bg-card p-5 text-card-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function TileTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold leading-none text-foreground">{children}</h2>
      {aside ? <div className="text-xs text-muted-foreground">{aside}</div> : null}
    </div>
  )
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground', className)}>
      {children}
    </span>
  )
}

/* ── Dots and pills ──────────────────────────────────────────────────────── */

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', className)} />
}

export type PillTone = 'live' | 'review' | 'draft' | 'done' | 'change'

const PILL_DOT: Record<PillTone, string> = {
  live: 'bg-[var(--tone-good-dot)]',
  review: 'bg-[var(--tone-warn-dot)]',
  draft: 'bg-muted-foreground/50',
  done: 'bg-foreground',
  change: 'bg-destructive',
}

export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[34px] items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium text-foreground">
      <Dot className={PILL_DOT[tone]} />
      {children}
    </span>
  )
}

/* ── Money and numbers ───────────────────────────────────────────────────── */

export function Money({ amount, className, decimals = 0 }: { amount: number | null | undefined; className?: string; decimals?: 0 | 2 }) {
  if (amount == null || !Number.isFinite(Number(amount))) {
    return <span className={cn('text-muted-foreground', className)}>–</span>
  }
  return (
    <span className={cn('tabular-nums', className)}>
      <Aed>
        {Number(amount).toLocaleString('en-AE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </Aed>
    </span>
  )
}

/** Just the sign, for the left edge of a money input. The face is named on the element. */
export function DirhamSign({ className }: { className?: string }) {
  return (
    <span aria-label="dirhams" className={cn('font-medium', className)} style={{ fontFamily: '"Dirham-Sans", "Dirham", sans-serif' }}>
      {'⃃'}
    </span>
  )
}

export function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return '–'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n)).toLowerCase()
}

/* ── Dates ───────────────────────────────────────────────────────────────── */

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

export function todayLine(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function greetingWord(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ── Avatars ─────────────────────────────────────────────────────────────── */

export function Face({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn('size-[30px] shrink-0 rounded-full object-cover', className)} />
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground',
        className,
      )}
    >
      {initials}
    </span>
  )
}

/** A photo or, when there is none, a soft placeholder. Never a broken image. */
export function Cover({ src, className, alt = '' }: { src?: string | null; className?: string; alt?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} />
  }
  return <div aria-hidden="true" className={cn('h-full w-full bg-[linear-gradient(160deg,var(--muted)_0%,var(--accent)_100%)]', className)} />
}

/* ── Empty and loading ───────────────────────────────────────────────────── */

export function Quiet({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[13px] leading-relaxed text-muted-foreground', className)}>{children}</p>
}

/** A small mark for an empty tile: one icon on a lime disc on a soft ring. Never a sentence alone. */
export function EmptyMark({ icon: Icon, className, size = 'md' }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const outer = size === 'lg' ? 'size-24' : size === 'sm' ? 'size-11' : 'size-16'
  const inner = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-7' : 'size-10'
  const glyph = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-3.5' : 'size-[18px]'
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-muted/70', outer, className)}>
      <span className={cn('inline-flex items-center justify-center rounded-full', LIME, inner)}>
        <Icon className={glyph} strokeWidth={1.75} />
      </span>
    </span>
  )
}

/** An empty tile body: a mark, a short line, an optional action. Fills the tile and centres. */
export function TileEmpty({
  icon,
  title,
  line,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  line?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5 py-2 text-center', className)}>
      <EmptyMark icon={icon} size="sm" />
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        {line ? <span className="max-w-[28ch] text-xs leading-relaxed text-muted-foreground">{line}</span> : null}
      </div>
      {action}
    </div>
  )
}

/** A full empty page: big mark, headline, one sentence, one button. */
export function EmptyState({
  icon,
  title,
  line,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  line?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col items-center justify-center gap-5 rounded-[20px] border border-border bg-card px-6 py-14 text-center', className)}>
      <EmptyMark icon={icon} size="lg" />
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {line ? <p className="m-0 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">{line}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function TileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-3 rounded-[20px] border border-border bg-card p-5', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="mt-auto h-3 w-2/3" />
    </div>
  )
}
