'use client'

/**
 * The Following App console language.
 *
 * These seventeen screens are the staff side of creator campaigns. They were built one at a
 * time over a year, so every one of them invented its own page header, its own status
 * colours and its own way of saying "nothing here" - forty-odd hand-picked palette steps
 * across the section, none of which agreed with the rest of the console.
 *
 * Nothing here is new design. It is the console language from
 * `@/components/console/primitives` (PageHead, Stat, StatGrid, CARD, the tone tokens),
 * plus the four small pieces those screens need that the shared file does not carry:
 * the page shell, a headed section without a box, and an honest pair of loading and
 * error states.
 *
 * Two rules run through all of it.
 *
 *   Colour is status, never decoration. A tone always names a token from the
 *   `.console-shell` block, so amber here is the same amber as on Today.
 *
 *   A failed request is not an empty list. `Failed` says the fetch broke and offers the
 *   retry; `Nothing` says we asked and the answer was none. A screen must never show the
 *   second when it means the first, because "no withdrawals pending" is exactly the
 *   reading that sends somebody away from the screen.
 */
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tone } from '@/components/console/primitives'

export type { Tone }

/**
 * The page shell.
 *
 * SuperAdminInterface renders its main with no padding of its own, so every screen on it
 * sat flush against the panel edge while the rest of the console breathed. ds-3/ds-4 is
 * that same measure taken from the scale rather than by eye, and ds-5 is the gap between
 * subjects on the page.
 */
export function FaPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-ds-5 p-ds-3 md:p-ds-4', className)}>{children}</div>
}

/**
 * A headed group of content, fenced by its heading and the space around it rather than by
 * a border. The gap above a section is wider than any gap inside one, which is the entire
 * message a card outline was carrying on these screens.
 */
export function Section({
  title, description, action, children, className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-ds-3', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-ds-3">
          <div className="space-y-ds-1">
            {title && <h2 className="text-ds-subheading">{title}</h2>}
            {description && (
              <p className="max-w-2xl text-ds-body-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-ds-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** A numbered step in a create form, so a long form still reads as a sequence. */
export function Step({
  n, title, description, done, action, children,
}: {
  n: number
  title: string
  description?: string
  done?: boolean
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-ds-3">
      <div className="flex flex-wrap items-start justify-between gap-ds-3">
        <div className="space-y-ds-1">
          <div className="flex items-center gap-ds-2">
            <span
              className={cn(
                'grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-semibold tabular-nums',
                done
                  ? 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
                  : 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
              )}
            >
              {n}
            </span>
            <h2 className="text-ds-subheading">{title}</h2>
          </div>
          {description && (
            <p className="max-w-2xl text-ds-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

/** Waiting. One line, no illustration, no promise about what will land. */
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-ds-2 py-ds-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

/**
 * The request broke.
 *
 * Never reachable from the same branch as `Nothing`: the caller has to have tracked that
 * the fetch actually failed. Says what could not be loaded and gives the one control that
 * fixes it.
 */
export function Failed({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div className="space-y-ds-3 py-ds-5">
      <div className="flex items-center gap-ds-2">
        <span className="h-2 w-2 flex-none rounded-full bg-[var(--tone-bad-dot)]" aria-hidden />
        <p className="text-sm font-medium">Could not load {what}</p>
      </div>
      <p className="max-w-lg text-ds-body-sm text-muted-foreground">
        The request did not come back. Nothing below is a measurement, so do not read it as
        one. Try again, and if it keeps failing the API is down.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  )
}

/** We asked and the answer was none. Said plainly, with no illustration and no pitch. */
export function Nothing({ children }: { children: React.ReactNode }) {
  return <p className="py-ds-5 text-sm text-muted-foreground">{children}</p>
}

/* ── Status, in the console's tones ──────────────────────────────────────────────────
   Every FA screen kept its own palette map: rose here, red there, sky on one page and
   blue on the next for the same state. These are the console tone tokens, so a state
   looks the same wherever a staff member meets it, and the word is always beside the
   colour. */

export const TONE_BADGE: Record<Tone, string> = {
  neutral: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
  good: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  warn: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  bad: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  info: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
}

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-[var(--tone-good-ink)]',
  warn: 'text-[var(--tone-warn-ink)]',
  bad: 'text-[var(--tone-bad-ink)]',
  info: 'text-foreground',
}

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-[var(--tone-neutral-dot)]',
  good: 'bg-[var(--tone-good-dot)]',
  warn: 'bg-[var(--tone-warn-dot)]',
  bad: 'bg-[var(--tone-bad-dot)]',
  info: 'bg-[var(--tone-info-dot)]',
}

/**
 * A figure that never arrived is a dash.
 *
 * The single most common bug across these screens: `count ?? 0` over an object that stays
 * null when its request fails, printing a confident nought where the honest answer is
 * "we never managed to ask". A real zero still prints, in the lighter weight, because in
 * that case the API sent the number.
 */
export function figure(v: number | null | undefined): React.ReactNode {
  if (v == null) return '—'
  if (v > 0) return v
  return <span className="text-muted-foreground/70">0</span>
}

/** Tone for a queue: amber while somebody is actually waiting in it, neutral otherwise. */
export const queueTone = (v: number | null | undefined): Tone => (v ? 'warn' : 'neutral')

/** Creator tier. Four steps of one scale, so they are shades of the same idea, not a rainbow. */
export const TIER_BADGE: Record<string, string> = {
  MEGA: 'border-transparent bg-black/[0.08] font-semibold text-foreground dark:bg-white/[0.12]',
  MACRO: 'border-transparent bg-black/[0.06] text-foreground dark:bg-white/[0.09]',
  MICRO: 'border-transparent bg-black/[0.04] text-muted-foreground dark:bg-white/[0.07]',
  NANO: 'border-transparent bg-black/[0.03] text-muted-foreground dark:bg-white/[0.05]',
}
