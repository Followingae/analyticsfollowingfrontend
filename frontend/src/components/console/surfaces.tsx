'use client'

/**
 * The console's surfaces: the pieces a screen is assembled FROM, above the level of a button.
 *
 * `primitives.tsx` holds the small vocabulary (a stat, a panel, a row, a tone). This file holds
 * the shapes that were being hand-rolled on every screen instead: the table shell, the filter
 * bar, the bulk bar, the section header, the progress rail, the timeline. Across 82 internal
 * pages only 17 used the shadcn table and 45 hand-rolled grid rows with their own borders and
 * their own idea of a row height. That is the reason the console is hard to teach: not that any
 * one screen is bad, but that no two agree.
 *
 * THE FOUR CAPS, which are the governing constraint and the reason this file is small:
 *
 *   2  levels of disclosure, and one route to a place.
 *   5  actions in a toolbar before the rest goes to an overflow menu.
 *   1  promoted row action. The others live in the row's menu.
 *   4  cards per section. A fifth means the section has two subjects and needs splitting.
 *
 * Those are from Nielsen Norman on progressive disclosure, Carbon's table guidance, Primer's
 * data table and Airtable's layout set. They are written here as numbers because a cap that is
 * not a number is a preference, and preferences drift.
 *
 * DENSITY. Three tiers, and the font size does NOT change between them. Ant Design's rule, and
 * it is the one that matters: density is bought with padding, row height, divider weight and
 * icon size. A table whose type shrinks a point per tier produces the failure already recorded
 * in `primitives.tsx`, where twenty hardcoded sizes between 11px and 12.5px meant the reader
 * could not tell which difference was supposed to mean something. Row heights are IBM Carbon's
 * published set.
 */

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { CARD, type Tone } from '@/components/console/primitives'

/* ══ The three kinds of nothing ═══════════════════════════════════════════════════════════ */

/**
 * A figure that is not there, and WHY it is not there.
 *
 * Three cases look identical on a screen and mean completely different things, and conflating
 * them is how this console taught people not to believe it:
 *
 *   unseen      you are not allowed to see this. The column stays so you know it exists.
 *   unset       nobody has set it yet. This is a job, not a blank.
 *   unmeasured  we tried to measure it and failed. NEVER render this as a zero. A creator with
 *               a failed scrape reading 0% engagement is a measurement that never happened.
 *
 * The glyph is an EN dash (U+2013), not an em dash, and not a hyphen. The house rule bans em
 * dashes in copy and this is copy.
 */
export function Dash({
  reason,
  what,
}: {
  reason: 'unseen' | 'unset' | 'unmeasured'
  /** What the missing thing is, for the tooltip. For example "sell price". */
  what?: string
}) {
  const why =
    reason === 'unseen'
      ? `Not visible to your role${what ? `: ${what}` : ''}`
      : reason === 'unset'
        ? `No ${what ?? 'value'} yet. Nobody has set it.`
        : `We could not measure ${what ?? 'this'}. Nothing is estimated.`
  return (
    <span
      title={why}
      aria-label={why}
      role="img"
      className={cn(
        'tabular-nums',
        reason === 'unseen' ? 'text-muted-foreground/50' : 'text-muted-foreground',
      )}
    >
      {'–'}
    </span>
  )
}

/** The words we use for "not agreed yet" where a dash would be too quiet to act on. */
export function NotAgreed() {
  return <span className="text-xs font-medium text-muted-foreground">Not agreed</span>
}

/* ══ Density ══════════════════════════════════════════════════════════════════════════════ */

export type Density = 'comfortable' | 'compact' | 'dense'

/** Carbon's row heights. The header row always matches the body. */
export const DENSITY: Record<
  Density,
  { row: string; cell: string; gap: string; icon: number; divider: string }
> = {
  comfortable: { row: 'h-12', cell: 'px-3 py-3', gap: 'gap-4', icon: 16, divider: 'border-border/60' },
  compact: { row: 'h-10', cell: 'px-3 py-2', gap: 'gap-2', icon: 16, divider: 'border-border/50' },
  dense: { row: 'h-8', cell: 'px-2 py-1', gap: 'gap-2', icon: 14, divider: 'border-transparent' },
}

const DensityCtx = React.createContext<Density>('compact')
export const useDensity = () => React.useContext(DensityCtx)

/**
 * Density is a property of the VIEW, not a global preference buried in settings. Notion's
 * model, and the right one: a 500 row creator database wants 32px rows, an 11 client list
 * wants 48px rows with a logo and two lines, and the same component serves both.
 *
 * Persisted per table id, read after mount so the server pass and the first client pass agree
 * and the preference cannot cause a hydration mismatch.
 */
export function DensityProvider({
  id,
  initial = 'compact',
  children,
}: {
  id: string
  initial?: Density
  children: React.ReactNode
}) {
  const [density, setDensity] = React.useState<Density>(initial)
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`console.density.${id}`)
      if (saved === 'comfortable' || saved === 'compact' || saved === 'dense') setDensity(saved)
    } catch {
      /* Private window, blocked site data, or a thumbnail pass. The default is correct. */
    }
  }, [id])
  const set = React.useCallback(
    (d: Density) => {
      setDensity(d)
      try {
        window.localStorage.setItem(`console.density.${id}`, d)
      } catch {
        /* Not worth telling anyone about: the view still works, it just will not be remembered. */
      }
    },
    [id],
  )
  return (
    <DensityCtx.Provider value={density}>
      <DensitySetCtx.Provider value={set}>{children}</DensitySetCtx.Provider>
    </DensityCtx.Provider>
  )
}

const DensitySetCtx = React.createContext<(d: Density) => void>(() => {})

/** Three segments, icons with a real accessible name. Offered on table screens only. */
export function DensityToggle() {
  const density = useDensity()
  const set = React.useContext(DensitySetCtx)
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={density}
      onValueChange={(v: string) => v && set(v as Density)}
      aria-label="Row height"
    >
      <ToggleGroupItem value="comfortable" aria-label="Comfortable rows">
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="block h-[3px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[3px] w-3.5 rounded-sm bg-current" />
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact rows">
        <span className="flex flex-col gap-[2px]" aria-hidden>
          <span className="block h-[2px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[2px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[2px] w-3.5 rounded-sm bg-current" />
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="dense" aria-label="Dense rows">
        <span className="flex flex-col gap-[1px]" aria-hidden>
          <span className="block h-[1.5px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[1.5px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[1.5px] w-3.5 rounded-sm bg-current" />
          <span className="block h-[1.5px] w-3.5 rounded-sm bg-current" />
        </span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/* ══ Section header ═══════════════════════════════════════════════════════════════════════ */

/**
 * Every section is named, carries its module glyph, and carries its count when it is a
 * collection. No uppercase eyebrow: tracked small caps above a heading is the single most
 * "admin template" mark a screen can wear, and the reason is already written down in
 * `primitives.tsx` where `GroupLabel` says so.
 *
 * The heading is an h2. The page title is the only h1. Card titles are h3. Strict, no skipping,
 * because a screen reader's heading list is the fastest way around a dense screen and it is
 * useless if the levels are decorative.
 */
export function SectionHead({
  icon: Icon,
  title,
  count,
  note,
  action,
}: {
  icon?: LucideIcon
  title: string
  count?: number
  /** One line under the heading. A sentence, where the section needs explaining. */
  note?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
          <h2 className="text-ds-heading">{title}</h2>
          {typeof count === 'number' && count > 0 && (
            <span className="text-ds-caption font-semibold tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {note && <p className="text-ds-caption mt-0.5">{note}</p>}
      </div>
      {action}
    </div>
  )
}

/* ══ Filters ══════════════════════════════════════════════════════════════════════════════ */

export interface FilterChip {
  key: string
  label: string
  /** The size of the filtered set. A count is a fact and is shown even at zero. */
  n: number
  /** When true the chip is not rendered at all. See the self-pruning note below. */
  hidden?: boolean
}

/**
 * Filters named after WHO IS BLOCKING, not after a state. "Waiting on a founder" rather than
 * "status: pending", because the first one tells you whether to chase somebody.
 *
 * And they prune themselves. "Waiting on a founder" does not exist for a founder, because for
 * her that set is identical to "Needs me", and a filter that is a tautology for you is just
 * another thing to read. Pass `hidden` from the caller's role.
 *
 * A count here is a FACT and renders at zero. That is the opposite of a sidebar badge, which is
 * a DEMAND and disappears at zero. The two are deliberately different.
 */
export function FilterBar({
  chips,
  value,
  onChange,
  right,
}: {
  chips: FilterChip[]
  value: string
  onChange: (key: string) => void
  right?: React.ReactNode
}) {
  const shown = chips.filter((c) => !c.hidden)
  if (shown.length <= 1 && !right) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((c) => {
        const on = c.key === value
        return (
          <Button
            key={c.key}
            type="button"
            size="sm"
            variant={on ? 'default' : 'outline'}
            aria-pressed={on}
            onClick={() => onChange(c.key)}
            className="h-8 rounded-lg"
          >
            {c.label}
            <span className={cn('ml-1.5 tabular-nums', on ? 'opacity-70' : 'text-muted-foreground')}>
              {c.n}
            </span>
          </Button>
        )
      })}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}

/* ══ Bulk bar ═════════════════════════════════════════════════════════════════════════════ */

/**
 * Present at rest and explaining itself, dark and live once something is ticked.
 *
 * The reason it is drawn when nothing is selected: what is possible becomes learnable without
 * having to do it first. A bulk bar that only appears after you discover multi-select is a
 * feature most of the team will never find.
 *
 * `summary` is where the consequence goes, and on a money screen it should name the figure on
 * the ticked rows. Scrub it by role at the call site: the component does not know who is looking.
 */
export function BulkBar({
  count,
  summary,
  children,
  idleHint = 'Tick rows to act on several at once',
}: {
  count: number
  summary?: React.ReactNode
  children?: React.ReactNode
  idleHint?: string
}) {
  const live = count > 0
  return (
    <div
      className={cn(
        'flex min-h-[52px] flex-wrap items-center gap-3 border-t px-3.5 py-2 transition-colors',
        live ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/40',
      )}
      role="region"
      aria-label="Bulk actions"
    >
      {live ? (
        <>
          <span className="text-ds-label font-semibold tabular-nums">{count} ticked</span>
          {summary && <span className="text-ds-caption opacity-80">{summary}</span>}
          <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
        </>
      ) : (
        <span className="text-ds-caption">{idleHint}</span>
      )}
    </div>
  )
}

/* ══ Progress ═════════════════════════════════════════════════════════════════════════════ */

export interface RailSegment {
  key: string
  label: string
  n: number
  tone: Tone | 'done' | 'current'
}

const SEG_BG: Record<string, string> = {
  done: 'bg-foreground',
  current: 'bg-[var(--console-lime)]',
  neutral: 'bg-border',
  good: 'bg-[var(--tone-good-dot)]',
  warn: 'bg-[var(--tone-warn-dot)]',
  bad: 'bg-[var(--tone-bad-dot)]',
  info: 'bg-[var(--tone-info-dot)]',
}

/**
 * The campaign's progress, as one bar whose size is the NUMBER OF STAGES and not the number of
 * creators. That is the whole trick, borrowed from monday.com's battery widget: it reads
 * identically on a campaign of 10 and a campaign of 200, which no board or card grid does.
 *
 * Nobody in this industry visualises 200 creators, and we checked eleven products. They all use
 * the same four mechanisms: this rail, a ribbon of per-stage counts that filters the table, bulk
 * advance, and automation on the transitions.
 */
export function StageRail({
  segments,
  className,
}: {
  segments: RailSegment[]
  className?: string
}) {
  const total = segments.reduce((a, s) => a + s.n, 0)
  return (
    <div
      className={cn('flex h-2.5 gap-[3px]', className)}
      role="img"
      aria-label={
        total > 0
          ? segments.filter((s) => s.n > 0).map((s) => `${s.n} ${s.label}`).join(', ')
          : 'Nobody on this campaign yet'
      }
    >
      {segments.map((s) => (
        <span
          key={s.key}
          className={cn('rounded-full', SEG_BG[s.tone] ?? SEG_BG.neutral)}
          style={{ flex: Math.max(s.n, 0.35) }}
        />
      ))}
    </div>
  )
}

/**
 * The per-stage counts, as buttons that filter the roster underneath. This is the "where is
 * everyone" answer, and it is a row of numbers rather than a chart because every product that
 * has solved this problem settled on a row of numbers.
 */
export function StageRibbon({
  segments,
  value,
  onChange,
}: {
  segments: RailSegment[]
  /** The selected stage key, or null for everything. */
  value: string | null
  onChange: (key: string | null) => void
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}>
      {segments.map((s) => {
        const on = s.key === value
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : s.key)}
            className={cn(
              'rounded-xl border px-1.5 py-2 text-center transition-colors',
              on
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card hover:bg-muted/50',
            )}
          >
            <span className="block text-lg font-semibold tabular-nums leading-tight">{s.n}</span>
            <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
              {s.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ══ Timeline ═════════════════════════════════════════════════════════════════════════════ */

export interface TimelineEntry {
  id: string
  /** Where it came from. Email, WhatsApp and the platform are equal citizens here. */
  source: React.ReactNode
  when: string
  title: string
  /** What it DID. The consequence, not a restatement of the title. */
  body?: string
  /** Significant events are filled. Everything else is hollow. */
  significant?: boolean
}

/**
 * One merged line of everything that happened to a record.
 *
 * Every entry says what it did to the rest of the system ("Moved her to Agreement on file",
 * "Payment request sent to Hajar") and who decided it ("Rate confirmed by Hajar, from her
 * email"). An event log that only says what changed makes you reconstruct the consequence
 * yourself, every time.
 */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null
  return (
    <ol className="flex flex-col">
      {entries.map((e, i) => (
        <li key={e.id} className="grid grid-cols-[16px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'mt-1.5 size-2.5 shrink-0 rounded-full',
                e.significant ? 'bg-foreground' : 'border-[1.5px] border-muted-foreground/40 bg-card',
              )}
              aria-hidden
            />
            {i < entries.length - 1 && <span className="my-1 w-px flex-1 bg-border" aria-hidden />}
          </div>
          <div className={cn(i < entries.length - 1 && 'pb-4')}>
            <div className="flex flex-wrap items-center gap-2">
              {e.source}
              <span className="text-[11px] text-muted-foreground">{e.when}</span>
            </div>
            <p className="text-ds-label mt-1 font-semibold">{e.title}</p>
            {e.body && <p className="text-ds-caption">{e.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ══ Table shell ══════════════════════════════════════════════════════════════════════════ */

/**
 * The shell a list screen sits in: a toolbar, the rows, and the bulk bar, with one border round
 * the lot. The table itself stays the caller's, because a creator roster and a payables grid
 * genuinely want different columns, but the chrome, the density and the footer are shared.
 *
 * 200 rows render without pagination. The footer carries the count and the selection, not page
 * numbers: for someone scanning a roster, pagination hides the thing they are counting.
 */
export function TableShell({
  toolbar,
  children,
  footer,
  bulk,
}: {
  toolbar?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  bulk?: React.ReactNode
}) {
  return (
    <div className={cn(CARD, 'overflow-hidden bg-card')}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3.5 py-3">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
      {footer && (
        <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-3.5 py-2">
          {footer}
        </div>
      )}
      {bulk}
    </div>
  )
}

/**
 * The one line a table is allowed to show when it has no rows.
 *
 * The house rule is that a section with no data is not rendered at all, and that still holds.
 * This is the single exception, and it is narrow: when the USER has filtered a table down to
 * nothing, the table vanishing is worse than a line of text, because they caused it and need to
 * know it was the filter rather than the data. So this renders only on a filtered-to-zero view,
 * never on an empty screen, and never as an invitation to create something.
 */
export function NoMatches({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-10 text-ds-caption">
      <span>Nothing here right now. Every row in this view has moved on.</span>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="h-7">
          Clear the filter
        </Button>
      )}
    </div>
  )
}

/* ══ Did the question get answered ═══════════════════════════════════════════════════════ */

/**
 * The request broke.
 *
 * Copy lifted from `superadmin/fa/_ui.tsx`, which already had this right, and promoted here
 * so the console has ONE of these instead of three near-duplicates, one of which is shared
 * with the brand-facing campaign screens and therefore not ours to change.
 */
export function Failed({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div className="space-y-3 py-5">
      <div className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full bg-[var(--tone-bad-dot)]" aria-hidden />
        <p className="text-ds-label font-medium">Could not load {what}</p>
      </div>
      <p className="text-ds-caption max-w-lg">
        The request did not come back. Nothing below is a measurement, so do not read it as one.
        Try again, and if it keeps failing the API is down.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/**
 * Loading, then failed, then empty, then the data. In that order, and the order is not the
 * caller's to get wrong.
 *
 * WHY THIS EXISTS, AND WHY `failed` IS REQUIRED.
 *
 * A sweep of 111 internal files found EIGHT screens that render an all clear over a failed
 * read. Not an empty state: a claim. The pipeline says "No creators booked yet" and, with the
 * late filter on, "Nothing is late. That is the whole list." A broadcast that may have gone to
 * 1,308 people says "No recipients." A proposal says "Nobody is confirmed on this proposal
 * yet. This screen fills in once the client has picked their creators", which is a statement
 * about what a CLIENT did, manufactured from a 500. One offers an "Add a merchant first"
 * button, so a failed read invites somebody to create a duplicate merchant.
 *
 * Every one of those is the same two-line mistake: a `catch` that toasts and leaves the rows
 * at `[]`, and an empty branch keyed on `length === 0` with no flag between them. None of them
 * looks like a bug. They all look like information, which is why they survived, and it is most
 * of why this team stopped believing these screens and went back to the spreadsheet.
 *
 * Fixing eight call sites fixes eight call sites. Making `failed` a REQUIRED prop means
 * TypeScript asks every present and future caller the only question that matters: did the
 * request actually come back? There is no way to render the empty branch without having
 * answered it.
 *
 * `nothing` is optional because the house rule is that a section with no data renders nothing
 * at all. Pass it only where the absence is itself the answer somebody came for, or where the
 * user filtered the list down themselves.
 */
export function ReadState({
  failed,
  loading = false,
  empty,
  what,
  onRetry,
  nothing,
  skeleton,
  children,
}: {
  /** Did the read fail. Required: this is the question the bug was caused by not asking. */
  failed: boolean
  loading?: boolean
  /** Did it come back with nothing. Only consulted once we know it came back at all. */
  empty: boolean
  /** What could not be loaded, as a noun phrase: "your pipeline", "this broadcast's recipients". */
  what: string
  onRetry?: () => void
  /** What to say when the answer genuinely is none. Omit to render nothing, which is the default. */
  nothing?: React.ReactNode
  skeleton?: React.ReactNode
  children: React.ReactNode
}) {
  if (loading) return <>{skeleton ?? null}</>
  if (failed) return <Failed what={what} onRetry={onRetry} />
  if (empty) {
    if (!nothing) return null
    // A div, not a paragraph. A genuine empty state is sometimes a sentence and sometimes a
    // sentence plus the one control that fills it, and forcing a caller to express that as
    // phrasing content inside a `p` is the component being narrow rather than the caller
    // being wrong.
    return <div className="text-ds-caption py-5">{nothing}</div>
  }
  return <>{children}</>
}

/**
 * The same three questions, for a screen whose list is a real table.
 *
 * `ReadState`'s empty branch is a paragraph, and a paragraph cannot live inside a `tbody`.
 * Two of the eight screens converted away from reporting failures as good news hit exactly
 * that, and both reached for `Failed` by hand inside a colspan cell, which works and loses
 * the compiler's insistence that somebody answer whether the read came back.
 *
 * So the table shape gets the guarantee too. Same required `failed`, same branch order, one
 * extra prop for the span.
 */
export function ReadStateRow({
  failed,
  loading = false,
  empty,
  what,
  onRetry,
  nothing,
  colSpan,
  children,
}: {
  failed: boolean
  loading?: boolean
  empty: boolean
  what: string
  onRetry?: () => void
  nothing?: React.ReactNode
  /** How many columns the message spans. The table knows this; the component cannot guess it. */
  colSpan: number
  children: React.ReactNode
}) {
  if (loading) return null
  if (failed || empty) {
    if (empty && !failed && !nothing) return null
    return (
      <tr>
        <td colSpan={colSpan} className="px-3">
          {failed ? (
            <Failed what={what} onRetry={onRetry} />
          ) : (
            <div className="text-ds-caption py-5">{nothing}</div>
          )}
        </td>
      </tr>
    )
  }
  return <>{children}</>
}

/* ══ Owner ════════════════════════════════════════════════════════════════════════════════ */

/**
 * Who is holding this, written as a sentence rather than a label.
 *
 * "Aqsa has it" and "Waiting on Hajar" say something that "Assignee: Aqsa" does not: whether
 * the ball is in our court. And `Nobody yet` is a first class value, not an empty cell, because
 * until this month no row in this system had a person's name on it and work addressed to a role
 * was work addressed to nobody.
 */
export function Owner({
  name,
  waiting,
  initials,
}: {
  name?: string | null
  /** True when we are waiting ON them rather than they are doing it. */
  waiting?: boolean
  initials?: string
}) {
  if (!name) {
    return (
      <Badge variant="outline" className="rounded-full font-medium text-muted-foreground">
        Nobody yet
      </Badge>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-ds-caption">
      {initials && (
        <span
          aria-hidden
          className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9.5px] font-semibold"
        >
          {initials}
        </span>
      )}
      <span className="text-foreground">{waiting ? `Waiting on ${name}` : `${name} has it`}</span>
    </span>
  )
}

/* ══ Age ══════════════════════════════════════════════════════════════════════════════════ */

/**
 * How long this has sat, and separately whether it is late.
 *
 * These are two different clocks and the model keeps them apart: `days` is how long the row has
 * been with its current owner, `lateDays` is how far past a date we promised. A row can be two
 * days old and four days late. Collapsing them into one number loses the fact that matters.
 *
 * Amber at four days, red whenever late. Nothing else earns a colour.
 */
export function Age({ days, lateDays }: { days: number; lateDays?: number }) {
  if (lateDays && lateDays > 0) {
    return (
      <Badge
        className="rounded-md bg-[var(--tone-bad-wash)] font-semibold tabular-nums text-[color:var(--tone-bad-ink)] hover:bg-[var(--tone-bad-wash)]"
        title={`Due ${lateDays} day${lateDays === 1 ? '' : 's'} ago`}
      >
        {lateDays}d late
      </Badge>
    )
  }
  if (days <= 0) return <span className="text-ds-caption">Today</span>
  const warn = days >= 4
  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-md font-medium tabular-nums',
        warn &&
          'bg-[var(--tone-warn-wash)] font-semibold text-[color:var(--tone-warn-ink)] hover:bg-[var(--tone-warn-wash)]',
      )}
      title={`Waiting ${days} day${days === 1 ? '' : 's'}`}
    >
      {days}d
    </Badge>
  )
}
