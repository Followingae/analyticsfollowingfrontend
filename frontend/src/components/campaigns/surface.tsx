'use client'

/**
 * The campaign surface: the language every brand-facing campaign screen is written in.
 *
 * These screens are one journey seen from four angles, so they have to read as one product.
 * What follows is the spec they are held to. It is written down because a document can be
 * enforced and a vibe cannot.
 *
 * ── Where the rules come from ─────────────────────────────────────────────────────────────
 *
 *   The spacing scale, the six type steps and the radius steps are `src/components/ui2/
 *   tokens.css`, already imported by globals.css. Nothing here invents a value.
 *
 *   The separation ladder, the density tiers and the table floor are section 3 of the plan.
 *   The console (`src/components/console/primitives.tsx`) is the operator dialect of the
 *   same idea; it is deliberately NOT imported here, because its tone tokens are scoped to
 *   `.console-shell` and a client page cannot reach them. Same grammar, different room.
 *
 *   `CampaignJourney` established that a campaign is a place, not a report. Everything here
 *   is built to sit beside it.
 *
 * ── The seven rules ───────────────────────────────────────────────────────────────────────
 *
 *   1. SEPARATION LADDER. Space, then a hairline, then a tint, then a card, and stop at the
 *      first one that works. A card is a promise that its contents are one object you could
 *      click, move or delete. A metric is not an object, so a metric never gets a card.
 *
 *   2. SPACING HAS MEANING. ds-1 glued, ds-2 paired, ds-3 siblings, ds-4 inside a panel,
 *      ds-5 a different subject, ds-6 a new section. Six values, no others, and gaps rather
 *      than `space-y` so two stacked components cannot double their margins.
 *
 *   3. EVERY SCREEN DECLARES ITS TIER. Reading, working or scanning, named at the top of the
 *      file. Campaign detail and the pool are `working`; the ledgers are `scanning`; the
 *      create form is `reading`. Air goes around a table, never inside it: a ledger row
 *      stays at 32 to 36 pixels and density there is a feature.
 *
 *   4. TEXT GETS A WIDTH. Prose caps near 65 characters (`max-w-prose`), a form caps at
 *      640px (`max-w-form`), a page caps at `Page`'s own max width. An unconstrained
 *      paragraph on a wide monitor is one unreadable line.
 *
 *   5. ERROR, LOADING AND EMPTY ARE THREE DIFFERENT STATES, and this codebase has a history
 *      of collapsing them. `Failed` says a read failed and offers the retry. `Waiting` is
 *      skeletons. `Empty` is a sentence and nothing else. A figure that did not load is
 *      `DASH`, never 0, and an alert may never be gated on `(x ?? 0) > 0`, because that
 *      shows no warning at all when the number failed to arrive.
 *
 *   6. MONEY IS `Money`. Always AED, spelled, in the font that actually carries the mark.
 *      Never a `$`, never a bare U+20C3 pasted into a string: no system font has that
 *      codepoint and it lands as an empty box, which is live on a payment screen right now.
 *
 *   7. NO EM DASH IN ANYTHING A CLIENT READS. Comma, colon, or a full stop and a new
 *      sentence. (Code comments are ours, not theirs, and are exempt.)
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/** A figure that did not arrive. Never 0, which is a claim we cannot support. */
export const DASH = '–'

/* ── the page frame ─────────────────────────────────────────────────────────────────────── */

/**
 * The outer frame. The brand shell supplies no padding of its own, so every page had to
 * remember its own and several simply forgot, which is why the pool and the FA screens run
 * flush into the sidebar today.
 *
 * `width` is the measure, not a look: `wide` for a grid of creators, `page` for a detail,
 * `form` for something being filled in, `prose` for something being read.
 */
export function Page({
  children, width = 'page', className,
}: {
  children: React.ReactNode
  width?: 'wide' | 'page' | 'form' | 'prose'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-ds-3 pb-ds-6 pt-ds-5 sm:px-ds-5',
        width === 'wide' && 'max-w-7xl',
        width === 'page' && 'max-w-6xl',
        width === 'form' && 'max-w-2xl',
        width === 'prose' && 'max-w-prose',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The gap between the major parts of a page: ds-6, the step that is currently missing. */
export function Sections({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-ds-6', className)}>{children}</div>
}

/** A group inside a section: ds-5, a different subject but the same part of the page. */
export function Group({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-ds-5', className)}>{children}</div>
}

/** Title, one line saying what the screen is for, and the one action you came to do. */
export function PageHead({
  eyebrow, title, sub, action, back,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  action?: React.ReactNode
  /** A back link, rendered above the title so it never competes with the action. */
  back?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-ds-3">
      {back}
      <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-ds-2">
          {eyebrow && (
            <p className="text-ds-overline uppercase text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="text-ds-title text-balance">{title}</h1>
          {sub && <p className="max-w-prose text-ds-body text-muted-foreground">{sub}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-ds-2">{action}</div>}
      </div>
    </div>
  )
}

/**
 * A section heading. A hairline under it, not a box around what follows: one shared edge
 * instead of four, which is the second rung of the ladder and usually the last one needed.
 */
export function SectionHead({
  title, sub, action, rule = true,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  action?: React.ReactNode
  rule?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-ds-2 sm:flex-row sm:items-baseline sm:justify-between',
        rule && 'border-b pb-ds-3',
      )}
    >
      <div className="space-y-1">
        <h2 className="text-ds-subheading">{title}</h2>
        {sub && <p className="max-w-prose text-ds-body-sm text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-ds-2">{action}</div>}
    </div>
  )
}

/* ── figures ────────────────────────────────────────────────────────────────────────────── */

/**
 * One number, with no box around it.
 *
 * Four numbers in four cards puts eight edges between the first and the last and then asks
 * you to compare them anyway. The border carried nothing the layout was not already saying,
 * so it comes off and the space it was using goes into the figure.
 *
 * `value` takes `null` to mean "this did not load", which renders as a dash rather than a
 * zero. That distinction is the whole point of the component.
 */
export function Figure({
  label, value, hint, emphasis = 'normal',
}: {
  label: React.ReactNode
  value: React.ReactNode | null
  hint?: React.ReactNode
  emphasis?: 'normal' | 'lead' | 'quiet'
}) {
  return (
    <div className="min-w-0">
      <p className="text-ds-caption font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-ds-2 font-semibold tabular-nums leading-none tracking-[-0.025em]',
          emphasis === 'lead' && 'text-[40px]',
          emphasis === 'normal' && 'text-[30px]',
          emphasis === 'quiet' && 'text-[22px]',
          value == null && 'text-muted-foreground/60',
        )}
      >
        {value == null ? DASH : value}
      </p>
      {hint && <p className="mt-ds-2 text-ds-caption leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

/**
 * A band of figures. The separation is the gap, ds-5, which is wider than any gap inside a
 * figure and therefore reads as the break the border used to draw.
 */
export function Figures({
  children, cols = 4, className,
}: { children: React.ReactNode; cols?: 2 | 3 | 4 | 5; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2',
        cols === 2 && 'lg:grid-cols-2',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        cols === 5 && 'lg:grid-cols-3 xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── money ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Money, always AED.
 *
 * The mark is spelled rather than drawn. The new Dirham sign is one codepoint old enough to
 * be in Unicode and young enough that no shipped system font carries it, so pasted into a
 * plain string it renders as an empty rectangle. `.aed-currency` names the face that does
 * carry it and falls back to the system stack, so the word is legible either way. A brand
 * never sees `$` here: every figure on these screens is AED and saying so once per number
 * is cheaper than a footnote.
 *
 * `amount` takes `null` for a figure that failed to load, and gets a dash.
 */
export function Money({
  amount, decimals = 0, className,
}: { amount: number | null | undefined; decimals?: 0 | 2; className?: string }) {
  if (amount == null || !Number.isFinite(Number(amount))) {
    return <span className={cn('tabular-nums text-muted-foreground/70', className)}>{DASH}</span>
  }
  return (
    <span className={cn('inline-flex items-baseline gap-ds-1 tabular-nums', className)} dir="ltr">
      <span className="aed-currency text-[0.82em] font-medium text-muted-foreground">AED</span>
      <span>
        {Number(amount).toLocaleString('en-AE', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
    </span>
  )
}

/** The same, as a plain string, for a `title` attribute or a toast. */
export function moneyText(amount: number | null | undefined, decimals: 0 | 2 = 0) {
  if (amount == null || !Number.isFinite(Number(amount))) return DASH
  return `AED ${Number(amount).toLocaleString('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/* ── the three states ───────────────────────────────────────────────────────────────────── */

/**
 * A read failed. Not an empty state: the difference between "there is nothing here" and
 * "we could not find out" is the entire difference between a calm screen and a lie, and
 * this app has shipped "no posts yet" over a 500 more than once.
 */
export function Failed({
  what, detail, onRetry,
}: { what: string; detail?: string | null; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-ds-3 rounded-ds-lg border border-destructive/25 bg-destructive/[0.04] px-ds-4 py-ds-4">
      <div className="space-y-1">
        <p className="text-ds-label">{what}</p>
        <p className="max-w-prose text-ds-body-sm text-muted-foreground">
          {detail || 'Something went wrong at our end, so nothing on this section is showing its real figures.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-ds-control border px-ds-3 py-ds-2 text-ds-label transition-colors hover:bg-muted"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/** There is genuinely nothing here. One sentence, no illustration, and nothing to buy. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-prose py-ds-5 text-ds-body text-muted-foreground">{children}</p>
  )
}

/** Waiting. Shapes the size of what is coming, so the page does not jump when it lands. */
export function Waiting({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-ds-3', className)} aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-ds-md bg-muted" />
      ))}
    </div>
  )
}

/* ── lists ──────────────────────────────────────────────────────────────────────────────── */

/**
 * A ledger. Rows on hairlines rather than rows as cards: five rows fit where four did, and
 * the air moves out to the page margin where it belongs. Scanning tier, so the padding here
 * is deliberately tighter than anywhere else in this file and must not be raised.
 */
export function Ledger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('-mx-ds-2 overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-ds-body">{children}</table>
    </div>
  )
}

export function LedgerHead({ cols }: { cols: { key: string; label: string; align?: 'right' | 'center' }[] }) {
  return (
    <thead>
      <tr className="border-b">
        {cols.map(c => (
          <th
            key={c.key}
            scope="col"
            className={cn(
              'px-ds-3 pb-ds-2 text-ds-overline font-semibold uppercase text-muted-foreground',
              c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
            )}
          >
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/** One ledger cell. 10px vertical, 12px horizontal: the floor, and it does not move. */
export function Cell({
  children, align, className, ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: 'right' | 'center' }) {
  return (
    <td
      {...rest}
      className={cn(
        'px-ds-3 py-[10px] align-middle leading-[1.4]',
        align === 'right' ? 'text-right tabular-nums' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
    >
      {children}
    </td>
  )
}

/* ── state, said in a word ──────────────────────────────────────────────────────────────── */

export type StateTone = 'neutral' | 'good' | 'warn' | 'bad' | 'info'

const PILL: Record<StateTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  bad: 'bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

/**
 * Where something has got to. Colour never carries the meaning on its own: the word is
 * always there beside it, for anyone who cannot separate the colours and for anyone reading
 * a print-out of this screen in a meeting.
 */
export function State({ tone = 'neutral', children }: { tone?: StateTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-ds-full px-ds-2 py-[3px] text-ds-caption font-medium whitespace-nowrap',
        PILL[tone],
      )}
    >
      {children}
    </span>
  )
}

/**
 * A quiet callout: a tint, the third rung, for something genuinely set apart. Not an alert,
 * and never red for a routine fact. Red belongs to real errors.
 */
export function Note({
  children, tone = 'neutral',
}: { children: React.ReactNode; tone?: 'neutral' | 'warn' }) {
  return (
    <p
      className={cn(
        'max-w-prose rounded-ds-lg px-ds-3 py-ds-3 text-ds-body-sm',
        tone === 'warn'
          ? 'bg-amber-500/[0.09] text-amber-900 dark:text-amber-200'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}
