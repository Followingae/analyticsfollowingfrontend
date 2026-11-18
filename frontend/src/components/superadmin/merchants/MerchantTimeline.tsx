'use client'

/**
 * A merchant's log, as a list: every recorded moment with its date.
 *
 * Read off merchant_events on the server (founder, 18 Nov 2026: an accurate log, not a
 * last-sign-in guess). When the server has no rows for an older merchant, the eight log
 * timestamps stand in so the list is never empty for someone who is plainly past "invited".
 *
 * Used by the merchants table (inside the stage chip's popover) and by the lead panel on
 * Partners (as the Onboarding section).
 */

import type { MerchantEvent, MerchantLog } from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

export interface TimelineItem {
  kind: string
  at: string | null
  note: string | null
}

/** What each logged moment is called. */
export const EVENT_LABEL: Record<string, string> = {
  invited: 'Invited',
  welcome_resent: 'Welcome sent again',
  reminder_sent: 'Reminder sent',
  password_set: 'Password set',
  first_login: 'First sign-in',
  campaign_submitted: 'Campaign submitted',
  campaign_approved: 'Campaign approved',
  campaign_sent_back: 'Campaign sent back',
  quote_requested: 'Quote requested',
}

export const eventLabel = (kind: string) => EVENT_LABEL[kind] || kind.replace(/_/g, ' ')

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

export const fullDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null

/** "2d ago", or the date once it is a month old. */
export const ago = (iso: string | null | undefined) => {
  if (!iso) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(mins)) return null
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  const d = Math.floor(mins / 1440)
  return d < 30 ? `${d}d ago` : shortDate(iso)
}

/** Logged events first; the log's timestamps when there are none. Oldest first. */
export function timelineItems(timeline: MerchantEvent[], log: MerchantLog): TimelineItem[] {
  if (timeline.length) {
    return timeline.map((e: MerchantEvent) => {
      const p = e.payload || {}
      let note: string | null = null
      if (e.kind === 'invited' || e.kind === 'welcome_resent' || e.kind === 'reminder_sent') {
        if (p.email_sent === false) note = p.held_back ? 'No email sent, link held back' : 'Email did not go'
        else if (typeof p.to === 'string') note = `to ${p.to}`
      } else if (e.kind === 'campaign_sent_back' && typeof p.reason === 'string') {
        note = p.reason
      } else if ((e.kind === 'campaign_submitted' || e.kind === 'campaign_approved') && typeof p.name === 'string') {
        note = p.name
      } else if (e.kind === 'quote_requested' && typeof p.offering === 'string') {
        note = String(p.offering).replace(/-/g, ' ')
      }
      return { kind: e.kind, at: e.at, note }
    })
  }
  const l = log
  return ([
    ['invited', l.invited_at], ['welcome_resent', l.welcome_resent_at], ['reminder_sent', l.reminder_sent_at],
    ['password_set', l.password_set_at], ['first_login', l.first_login_at],
    ['campaign_submitted', l.campaign_submitted_at], ['campaign_sent_back', l.campaign_sent_back_at],
    ['campaign_approved', l.campaign_approved_at],
  ] as [string, string | null][])
    .filter(([, at]) => !!at)
    .sort((a, b) => new Date(a[1] as string).getTime() - new Date(b[1] as string).getTime())
    .map(([kind, at]) => ({ kind, at, note: null }))
}

/**
 * The list itself. `relative` shows "2d ago" with the full date on hover (the panel);
 * without it the full date is shown (the popover, where there is room).
 */
export function MerchantTimeline({ items, relative, className, emptyText = 'Nothing logged yet.' }: {
  items: TimelineItem[]
  relative?: boolean
  className?: string
  emptyText?: string
}) {
  if (items.length === 0) {
    return <p className={cn('px-3 py-3 text-[12.5px] text-muted-foreground', className)}>{emptyText}</p>
  }
  return (
    <ol className={cn('m-0 list-none p-0', className)}>
      {items.map((e, i) => (
        <li key={`${e.kind}-${e.at}-${i}`} className="flex gap-2.5 border-b px-3 py-2 last:border-0">
          <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[var(--tone-info-ink)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] font-medium">{eventLabel(e.kind)}</span>
              <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground" title={fullDate(e.at) || undefined}>
                {(relative ? ago(e.at) : fullDate(e.at)) || 'No date'}
              </span>
            </div>
            {e.note && <div className="truncate text-[11.5px] text-muted-foreground" title={e.note}>{e.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
