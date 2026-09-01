'use client'

/**
 * The brand language.
 *
 * The console got its own primitives file (`src/components/console/primitives.tsx`) and the
 * operator screens now read as one product. The brand screens did not, so a client opened
 * new features bolted onto old chrome. This is the same idea for the other audience.
 *
 *   PageHead   the title, one line of what the screen is for, one action
 *   Stat       a caption, one big number, a line of context — and NO box around it
 *   StatBand   a row of figures grouped by the space between them
 *   Panel      a titled card, for something that really is one object
 *   ListRow    a list line separated by a hairline, not by four borders
 *   Money      AED, through the one money primitive the app already has
 *   Figure     a number that knows the difference between zero and did-not-load
 *
 * Why it differs from the console file. The console has its own scoped palette
 * (`.console-shell`), which is deliberately unreachable from a client-facing page, so none
 * of the `--tone-*` tokens exist here. Brand status colour comes from the global semantic
 * tokens instead: --success, --warning, --info, --danger. No colour is invented.
 *
 * The spacing rule, which is the whole point:
 *
 *   4px   glued        an icon and its label
 *   8px   paired       a label above its input
 *   16px  grouped      rows in a list, cards in a grid
 *   24px  panel        the padding a shadcn Card already ships. Do not override it down.
 *   40px  sectioned    a different subject
 *   64px  banded       the major parts of a page
 *
 * They are the `ds-1 … ds-6` steps from `ui2/tokens.css`, used as flex GAPS rather than
 * `space-y`, because gaps do not collapse, do not leak past their container, and cannot
 * double up where two components meet.
 *
 * And the separation ladder. To separate two things, stop at the first of these that works:
 * space, then one shared hairline, then a background tint, then — only if the contents are
 * a real object you could click, move or delete — a card. A metric is not an object.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Aed } from '@/components/console/primitives'

/* ── Honesty ──────────────────────────────────────────────────────────────────────────
   This app has a long history of showing a failed fetch as a fact: "0 creators" over a
   500, "no results" over a 403. A number that did not load is not zero, and a creator with
   no followers or 0% engagement is a failed scrape, not a measurement.

   So there is exactly one mark for "we do not know", and it is an en dash. Everything that
   renders a figure goes through here, which makes the distinction impossible to forget. */

/** The one mark for a value we do not have. Never `0`, never "N/A", never blank. */
export const UNKNOWN = '–'

/** True when a scraped figure is missing or is the zero that means the scrape failed. */
export function unmeasured(n: number | null | undefined, zeroIsFailure = false): boolean {
  if (n == null || Number.isNaN(n)) return true
  return zeroIsFailure && n === 0
}

/**
 * A compact number, or an en dash.
 *
 * `zeroIsFailure` is for the two figures where a zero is never real: a creator with no
 * followers and a creator with 0% engagement have both failed to scrape. Counts that can
 * genuinely be zero (campaigns, notifications) leave it off.
 */
export function compact(n: number | null | undefined, zeroIsFailure = false): string {
  if (unmeasured(n, zeroIsFailure)) return UNKNOWN
  const v = n as number
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

/** A percentage, or an en dash. A 0% engagement rate is a failed measurement. */
export function percent(n: number | null | undefined, digits = 1): string {
  if (unmeasured(n, true)) return UNKNOWN
  return `${(n as number).toFixed(digits)}%`
}

/**
 * Sort key that puts what we could not measure LAST, in either direction.
 *
 * `-Infinity` would put unmeasured creators at the top of an ascending sort, which is the
 * same lie as rendering them as zero. This returns a comparator wrapper instead.
 */
export function unmeasuredLast<T>(
  get: (t: T) => number | null | undefined,
  dir: 'asc' | 'desc' = 'desc',
  zeroIsFailure = false,
) {
  return (a: T, b: T) => {
    const av = get(a)
    const bv = get(b)
    const am = unmeasured(av, zeroIsFailure)
    const bm = unmeasured(bv, zeroIsFailure)
    if (am && bm) return 0
    if (am) return 1
    if (bm) return -1
    return dir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number)
  }
}

/**
 * A figure with three states rather than one.
 *
 * `error` beats `loading` beats a value. The important case is the third argument: when a
 * fetch failed we render an en dash and say so on hover, rather than printing the `0` that
 * a `?? 0` fallback would have produced.
 */
export function Figure({
  value, loading, error, className,
}: {
  value: React.ReactNode
  loading?: boolean
  error?: boolean
  className?: string
}) {
  if (error) {
    return (
      <span className={cn('text-muted-foreground', className)} title="This did not load">
        {UNKNOWN}
      </span>
    )
  }
  if (loading) {
    return <span className={cn('inline-block h-[0.7em] w-10 animate-pulse rounded bg-muted align-middle', className)} />
  }
  return <span className={className}>{value}</span>
}

/* ── Money ────────────────────────────────────────────────────────────────────────────
   Re-exported rather than reimplemented. `Aed` names the Dirham face on the element itself,
   which is the whole reason U+20C3 renders as a sign here and as an empty box wherever
   somebody typed the codepoint into a string. There is no second money component. */

export function Money({ amount, decimals = 2 }: { amount: number | null | undefined; decimals?: number }) {
  if (amount == null || Number.isNaN(amount)) return <span className="text-muted-foreground">{UNKNOWN}</span>
  return (
    <Aed>
      <span className="tabular-nums">
        {amount.toLocaleString('en-AE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </span>
    </Aed>
  )
}

/* ── Page furniture ───────────────────────────────────────────────────────────────────*/

/**
 * The page shell. `tier` is declared rather than felt.
 *
 * reading  a profile, a brief, an onboarding step. 64px between sections, text capped.
 * working  a dashboard, a detail panel, a form. 40px between groups.
 * scanning a list, a table, a queue. Air goes AROUND the rows, never inside them.
 */
export function Page({
  tier = 'working', children, className,
}: { tier?: 'reading' | 'working' | 'scanning'; children: React.ReactNode; className?: string }) {
  return (
    <div
      data-density={tier}
      className={cn(
        'flex w-full flex-1 flex-col px-4 py-6 md:px-8 md:py-8',
        tier === 'reading' ? 'gap-ds-6' : 'gap-ds-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Page title, one line of what the screen is for, and the screen's single main action. */
export function PageHead({
  title, sub, action, back,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  action?: React.ReactNode
  back?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-ds-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-ds-2">
        {back}
        <h1 className="text-ds-title text-foreground">{title}</h1>
        {sub && <p className="max-w-[65ch] text-ds-body text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-ds-2">{action}</div>}
    </header>
  )
}

/**
 * A band of figures, grouped by the space around them rather than by a border each.
 *
 * Four numbers in four cards puts eight edges between the first figure and the last, and
 * tells the reader they are four separate objects before asking them to compare them. The
 * borders come off, the gap goes up to 40px — wider than any gap inside a tile, so it reads
 * as the separation the border was drawing — and the figures take the room back.
 */
export function StatBand({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        'grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2',
        cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2',
      )}
    >
      {children}
    </div>
  )
}

export type StatTone = 'neutral' | 'good' | 'warn' | 'bad' | 'info'

/** The one place a brand status colour is decided, using the global semantic tokens. */
const STAT_DOT: Record<StatTone, string> = {
  neutral: 'bg-muted-foreground/50',
  good: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-danger',
  info: 'bg-info',
}

/**
 * One number, given room.
 *
 * The caption sits above it, the meaning underneath, and there is no box. Tone arrives as a
 * dot beside the label rather than as a wash across a tile, so the state survives for anyone
 * who cannot separate the colours and for anyone reading this printed.
 */
export function Stat({
  label, value, hint, tone = 'neutral', href, onClick, loading, error,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: StatTone
  href?: string
  onClick?: () => void
  loading?: boolean
  error?: boolean
}) {
  const body = (
    <>
      <div className="flex items-center gap-ds-2">
        {tone !== 'neutral' && (
          <span className={cn('h-1.5 w-1.5 flex-none rounded-full', STAT_DOT[tone])} aria-hidden />
        )}
        <p className="text-ds-caption font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-ds-2 text-[38px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
        <Figure value={value} loading={loading} error={error} />
      </p>
      {hint && <p className="mt-ds-2 text-ds-caption text-muted-foreground">{hint}</p>}
      {error && (
        <p className="mt-ds-2 text-ds-caption text-muted-foreground">This did not load, so it is not a zero.</p>
      )}
    </>
  )

  const shell =
    'block rounded-ds-md -mx-2 px-2 py-2 text-left transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  if (href) {
    // next/link is not imported here on purpose: a Stat is sometimes a router push and
    // sometimes an anchor, and an <a> keeps middle-click working.
    return (
      <a href={href} aria-label={`${label}: ${typeof value === 'string' ? value : ''}`}
         className={cn(shell, 'hover:bg-muted/60')}>
        {body}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shell, 'w-full hover:bg-muted/60')}>
        {body}
      </button>
    )
  }
  return <div className={cn(shell, 'cursor-default')}>{body}</div>
}

/**
 * A titled card, for something that genuinely is one object.
 *
 * The body padding is the 24px a shadcn Card already ships. Shrinking it is the single most
 * common change in this product and the reason the app reads as tight; it is not done here.
 * `flush` drops it only so a list can run edge to edge and keep its own hairlines.
 */
export function Panel({
  title, description, action, children, flush, className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  flush?: boolean
  className?: string
}) {
  return (
    <section className={cn('flex flex-col rounded-ds-lg border border-border bg-card text-card-foreground', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-ds-3 px-6 pb-ds-3 pt-5">
          <div className="flex min-w-0 flex-col gap-ds-1">
            {title && <h2 className="text-ds-subheading">{title}</h2>}
            {description && <p className="text-ds-body-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('flex-1', flush ? 'pb-ds-2' : 'px-6 pb-6', !title && !action && !flush && 'pt-6')}>
        {children}
      </div>
    </section>
  )
}

/** The small grey heading that breaks a list into parts. */
export function GroupLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-ds-overline uppercase text-muted-foreground', className)}>{children}</p>
  )
}

/**
 * A list line.
 *
 * One shared hairline between siblings, not a border around each. Four bordered boxes fit
 * four rows where a real list fits eight, and the borders claim each row is a separate
 * object rather than one list.
 */
export function ListRow({
  children, onClick, className, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  return (
    <div
      {...rest}
      {...(onClick
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              // Only when the ROW itself has focus. A row often carries its own buttons
              // (a menu trigger, a link), and without this guard pressing Enter on one of
              // them would open the menu AND navigate the row underneath it.
              if (e.target !== e.currentTarget) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            },
          }
        : {})}
      className={cn(
        'flex items-center gap-ds-3 border-b border-border/70 px-2 py-ds-3 last:border-b-0',
        onClick &&
          'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none ' +
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── The three states ─────────────────────────────────────────────────────────────────
   Error, loading and empty are different things and get different components, so a failed
   fetch can never fall through into the empty copy. */

/** A failed fetch. Says it failed, says it is not a zero, and offers the retry. */
export function LoadFailed({
  what, detail, onRetry,
}: { what: string; detail?: string | null; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-ds-3 rounded-ds-lg border border-border bg-muted/40 px-6 py-5">
      <div className="flex flex-col gap-ds-1">
        <p className="text-ds-label text-foreground">{what} did not load</p>
        <p className="max-w-[65ch] text-ds-body-sm text-muted-foreground">
          {detail || 'Something went wrong on our side. This is a display problem, not a count of zero.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-ds-control border border-border px-3 py-1.5 text-ds-label transition-colors hover:bg-muted"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/** Genuinely nothing here. Said plainly, in one line, with no illustration and no pitch. */
export function Nothing({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-ds-3 py-ds-5">
      <p className="max-w-[65ch] text-ds-body text-muted-foreground">{children}</p>
      {action}
    </div>
  )
}

/** A skeleton block, for the state where the answer is still on its way. */
export function Loading({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-ds-3', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded-ds-md bg-muted" />
      ))}
    </div>
  )
}
