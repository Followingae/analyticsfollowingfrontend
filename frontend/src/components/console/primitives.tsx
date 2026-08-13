'use client'

/**
 * The console language.
 *
 * Every operator screen built for the internal OS is made of the same four pieces, so that
 * Today, Goals, Coverage and the rest read as one product rather than five people's ideas of
 * a dashboard. Each piece exists because the mockups used it on every screen:
 *
 *   Stat      a label, one big number, and a line of context underneath
 *   Panel     a titled card with an optional description and a right-hand action
 *   Row       a list line: a status dot, a title, a meta line, something on the right
 *   Tone      the one place a status colour is decided, so amber means the same everywhere
 *
 * Colour is only ever status, never decoration, and it always arrives with a word beside it.
 */
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info'

const DOT: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/40',
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-rose-500',
  info: 'bg-primary',
}

const TEXT: Record<Tone, string> = {
  neutral: 'text-foreground',
  good: 'text-emerald-600 dark:text-emerald-500',
  warn: 'text-amber-600 dark:text-amber-500',
  bad: 'text-rose-600 dark:text-rose-500',
  info: 'text-primary',
}

/** Page title, one line of what the screen is for, and the screen's single main action. */
export function PageHead({
  title, sub, action,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div data-tour="page-head"
         className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-[28px]">{title}</h1>
        {sub && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/**
 * One number, given room. The hint underneath is where the meaning lives — a bare figure on a
 * card tells you nothing you can act on, which was the whole complaint about plain dashboards.
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
  return (
    <Card
      onClick={onClick}
      className={cn('overflow-hidden', onClick && 'cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30')}
    >
      <CardContent className="space-y-2 py-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
        </div>
        <p className={cn('text-[28px] font-semibold leading-none tracking-tight tabular-nums', TEXT[tone])}>
          {value}
        </p>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
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

/** A titled card. `flush` drops the body padding so a list can run edge to edge. */
/** A panel's anchor is its own title, so a tour can name the panel it means. */
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
    <Card data-tour={`panel-${slug(title)}`} className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-[13px]">{description}</CardDescription>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn('flex-1', flush && 'px-0 pb-0')}>{children}</CardContent>
    </Card>
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
        'flex w-full items-center gap-3 border-t px-6 py-3.5 text-left first:border-t-0',
        onClick && 'transition-colors hover:bg-muted/50',
      )}
    >
      <span className={cn('mt-[3px] h-2 w-2 flex-none self-start rounded-full', DOT[tone])} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="truncate text-[13.5px] font-medium leading-snug">{title}</div>
        {meta && <div className="truncate text-xs text-muted-foreground">{meta}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </Tag>
  )
}

/** Nothing here — say so plainly, in the card, without an illustration or a pitch. */
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-10 text-center text-sm text-muted-foreground">{children}</p>
}

/** A thin bar for "9 of 12", where the fraction matters more than the number. */
export function MiniBar({ value, max, tone = 'info' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', DOT[tone])} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}/{max}</span>
    </div>
  )
}
