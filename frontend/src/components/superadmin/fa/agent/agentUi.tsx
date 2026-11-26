'use client'

/**
 * Small shared pieces for the visit agent panel: status tones, the avatar, and times.
 */
import { cn } from '@/lib/utils'
import { TONE_BADGE, type Tone } from '@/app/superadmin/fa/_ui'
import type { AgentThread, AgentThreadStatus } from '@/services/faAgentApi'

/** Confirmed is green, waiting is plain, a question is amber, a lost spot is red, a visit is done and quiet. */
const STATUS_TONE: Record<AgentThreadStatus, { tone: Tone; quiet?: boolean }> = {
  queued: { tone: 'neutral' },
  sent: { tone: 'neutral' },
  confirmed: { tone: 'good' },
  question: { tone: 'warn' },
  reschedule: { tone: 'warn' },
  declined: { tone: 'bad' },
  no_reply: { tone: 'bad' },
  failed: { tone: 'bad' },
  visited: { tone: 'neutral', quiet: true },
  closed: { tone: 'neutral', quiet: true },
}

const FALLBACK_LABEL: Record<AgentThreadStatus, string> = {
  queued: 'Queued',
  sent: 'Waiting',
  confirmed: 'Confirmed',
  question: 'Question',
  reschedule: 'Wants another day',
  declined: "Can't make it",
  no_reply: 'No reply',
  failed: 'Not delivered',
  visited: 'Visited',
  closed: 'Closed',
}

export function StatusPill({ thread, className }: { thread: Pick<AgentThread, 'status' | 'status_label'>; className?: string }) {
  const meta = STATUS_TONE[thread.status] ?? { tone: 'neutral' as Tone }
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium',
        TONE_BADGE[meta.tone],
        meta.quiet && 'opacity-60',
        className,
      )}
    >
      {thread.status_label || FALLBACK_LABEL[thread.status] || thread.status}
    </span>
  )
}

export function Avatar({ thread, className }: { thread: Pick<AgentThread, 'avatar_url' | 'handle' | 'name'>; className?: string }) {
  if (thread.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thread.avatar_url} alt="" className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)} />
  }
  const letter = (thread.handle || thread.name || '?').replace(/^@/, '').charAt(0).toUpperCase()
  return (
    <span aria-hidden className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-xs font-medium text-muted-foreground dark:bg-white/[0.08]', className)}>
      {letter}
    </span>
  )
}

export function displayName(t: Pick<AgentThread, 'handle' | 'name'>): string {
  return t.handle ? `@${t.handle.replace(/^@/, '')}` : t.name || 'Creator'
}

/** "5m ago", "3h ago", "2d ago", then a date. */
export function ago(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** "Wed 26 Nov, 14:05" */
export function stamp(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function lastActivity(t: Pick<AgentThread, 'last_inbound_at' | 'last_outbound_at'>): string | null {
  const a = t.last_inbound_at ? new Date(t.last_inbound_at).getTime() : 0
  const b = t.last_outbound_at ? new Date(t.last_outbound_at).getTime() : 0
  if (!a && !b) return null
  return a >= b ? t.last_inbound_at : t.last_outbound_at
}

export function triedLine(n: number): string | null {
  if (!n) return null
  return n === 1 ? 'Tried once' : `Tried ${n} times`
}

export function visitLine(t: Pick<AgentThread, 'when_label' | 'visit_time'>): string | null {
  return t.when_label || (t.visit_time ? stamp(t.visit_time) : null)
}
