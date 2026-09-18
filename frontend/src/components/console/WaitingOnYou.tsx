'use client'

/**
 * Waiting on you — grouped by the job, not listed by the row.
 *
 * The screen this replaces drew eleven table rows, seven of which said "Clear N creators"
 * against seven different brands with the identical sentence "the client cannot see them
 * until you do" repeated beside each one. That is one decision with seven brands attached,
 * drawn seven times, and the repetition was most of why a founder's morning read as noise:
 * the eye has to process seven rows to learn one fact.
 *
 * So the queue groups on `kind` — the stable machine name the server already sends for
 * exactly this purpose. One card per job: what the job is, how much of it there is, how long
 * the oldest piece has waited, and the brands it is spread across as chips. Open the card and
 * every original row is there, unchanged, with its own link and its own age.
 *
 * Nothing is dropped. The grouping is a lens over the same list, and a kind the map has never
 * heard of still gets a card of its own rather than being silently swallowed — a queue that
 * hides work because nobody taught it a name is worse than an ugly one.
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2, Layers, Users, Tag, ShieldCheck, Send, FileText, RotateCcw, ClipboardCheck,
  Megaphone, HandCoins, Banknote, Clock, ChevronDown, CheckCircle2, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = {
  urgency?: string
  title: string
  reason?: string
  href?: string | null
  age_days?: number
  where?: string | null
  kind?: string | null
  actions?: { label: string; href: string }[]
}

/** What each job is called when there are several of them, and the mark it carries. */
const JOB: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  brief:             { label: 'Start sourcing',        icon: Layers },
  cold_brand:        { label: 'Brands going cold',     icon: Building2 },
  stock:             { label: 'Rosters to stock',      icon: Users },
  stalled:           { label: 'Rosters that stalled',  icon: Clock },
  rate_ask:          { label: 'Rates to ask for',      icon: Users },
  rate:              { label: 'Rates to confirm',      icon: Tag },
  price:             { label: 'Prices to set',         icon: Tag },
  clear:             { label: 'Creators to clear',     icon: ShieldCheck },
  unopened:          { label: 'Links nobody opened',   icon: Send },
  picks:             { label: 'Picks to act on',       icon: Send },
  send:              { label: 'Quotes to send',        icon: FileText },
  proposal_silent:   { label: 'Quotes gone quiet',     icon: FileText },
  proposal_more:     { label: 'Clients asking for more', icon: RotateCcw },
  proposal_answered: { label: 'Quotes answered',       icon: CheckCircle2 },
  agreement:         { label: 'Agreements and advances', icon: ClipboardCheck },
  guide:             { label: 'Guides to send',        icon: FileText },
  ladder_rate:       { label: 'Rates on live campaigns', icon: Megaphone },
  content_due:       { label: 'Content due',           icon: Megaphone },
  content_late:      { label: 'Content late',          icon: Megaphone },
  post_link:         { label: 'Post links to collect', icon: Megaphone },
  delivery:          { label: 'Deliveries to chase',   icon: Megaphone },
  invoice:           { label: 'Invoices to chase',     icon: Banknote },
  pay:               { label: 'Creators to pay',       icon: HandCoins },
  payables:          { label: 'Creators to pay',       icon: HandCoins },
  signoff:           { label: 'Sign-offs',             icon: ShieldCheck },
  quiet:             { label: 'Gone quiet',            icon: Clock },
}

/** Old is a property of the wait, not of the job: one scale, so amber means one thing. */
const age = (d: number) =>
  d >= 21 ? 'bad' : d >= 7 ? 'warn' : 'neutral'

const AGE_CLASS: Record<string, string> = {
  bad: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  warn: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  neutral: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

type Group = {
  kind: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: Item[]
  oldest: number
  wheres: string[]
}

export function WaitingOnYou({ items }: { items: Item[] }) {
  const groups = useMemo<Group[]>(() => {
    const by = new Map<string, Item[]>()
    for (const it of items) {
      // An unnamed item is its own group rather than a bucket of odds and ends: "Other (3)"
      // is a place work goes to be forgotten.
      const k = it.kind || `one:${it.title}`
      const list = by.get(k)
      if (list) list.push(it)
      else by.set(k, [it])
    }
    return [...by.entries()]
      .map(([kind, list]) => ({
        kind,
        label: JOB[kind]?.label ?? list[0].title,
        icon: JOB[kind]?.icon ?? ListChecks,
        items: list,
        oldest: Math.max(...list.map(i => i.age_days ?? 0)),
        wheres: [...new Set(list.map(i => i.where).filter(Boolean) as string[])],
      }))
      // Longest wait first. A founder's morning is a queue of oldest-first, always.
      .sort((a, b) => b.oldest - a.oldest)
  }, [items])

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-ds-2 py-ds-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-[var(--tone-good-dot)]" />
        <p className="text-ds-label">Nothing is waiting on you</p>
      </div>
    )
  }

  return (
    <div className="space-y-ds-2">
      {groups.map(g => <JobCard key={g.kind} group={g} />)}
    </div>
  )
}

function JobCard({ group }: { group: Group }) {
  const [open, setOpen] = useState(false)
  const Icon = group.icon
  const many = group.items.length > 1
  const tone = age(group.oldest)

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border bg-card transition-shadow',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover,var(--shadow-card))]',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-ds-3 rounded-[var(--radius-card)] p-ds-3 text-left
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn(
          'grid h-10 w-10 flex-none place-items-center rounded-ds-md',
          tone === 'bad' ? 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]'
          : tone === 'warn' ? 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]'
          : 'bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]',
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-ds-2">
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">
              {group.label}
            </span>
            {many && (
              <span className="flex-none text-ds-caption tabular-nums text-muted-foreground">
                {group.items.length}
              </span>
            )}
          </span>

          {/* The brands it is spread across, which is the fact the seven repeated rows were
              really carrying. Four, then a count — a wall of chips is the same noise wearing
              a different shape. */}
          {group.wheres.length > 0 ? (
            <span className="mt-1 flex flex-wrap items-center gap-1">
              {group.wheres.slice(0, 4).map(w => (
                <span key={w}
                      className="rounded-ds-xs bg-black/[0.04] px-1.5 py-0.5 text-[11px]
                                 leading-tight text-muted-foreground dark:bg-white/[0.07]">
                  {w}
                </span>
              ))}
              {group.wheres.length > 4 && (
                <span className="text-[11px] text-muted-foreground">
                  +{group.wheres.length - 4} more
                </span>
              )}
            </span>
          ) : (
            group.items[0].reason && (
              <span className="mt-1 block truncate text-ds-caption text-muted-foreground">
                {group.items[0].reason}
              </span>
            )
          )}
        </span>

        <span className={cn('flex-none rounded-ds-full px-2 py-1 text-[11.5px] font-medium tabular-nums',
                            AGE_CLASS[tone])}>
          {group.oldest}d
        </span>

        <ChevronDown className={cn('h-4 w-4 flex-none text-muted-foreground transition-transform',
                                   open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="border-t px-ds-3 pb-ds-2">
          {group.items.map((it, i) => (
            <li key={`${it.title}-${i}`}
                className="flex items-center gap-ds-3 border-b py-ds-2 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ds-label">{it.title}</span>
                {it.reason && (
                  <span className="block truncate text-ds-caption text-muted-foreground">
                    {it.reason}
                  </span>
                )}
              </span>
              <span className="flex-none text-ds-caption tabular-nums text-muted-foreground">
                {it.age_days ?? 0}d
              </span>
              {it.href && (
                <Link
                  href={it.href}
                  className="flex-none rounded-ds-full border px-2.5 py-1 text-[11.5px]
                             font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Open
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
