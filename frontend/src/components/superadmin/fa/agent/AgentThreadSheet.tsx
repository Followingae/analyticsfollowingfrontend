'use client'

/**
 * One creator's conversation with the visit agent: the messages as bubbles, what the
 * agent flagged for the team, and what it will do next.
 */
import { useEffect, useRef, useState } from 'react'
import { CalendarClock, Flag, Loader2, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { faAgentApi, type AgentMessage, type AgentThread } from '@/services/faAgentApi'
import { Avatar, StatusPill, displayName, stamp, visitLine, triedLine } from './agentUi'

const WHO_LABEL: Record<AgentMessage['who'], string> = { agent: 'Agent', creator: 'Creator', team: 'Team' }

function Bubble({ m }: { m: AgentMessage }) {
  const ours = m.who !== 'creator'
  return (
    <div className={cn('flex flex-col gap-1', ours ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          m.who === 'creator' && 'rounded-bl-md border border-border bg-card',
          m.who === 'agent' && 'rounded-br-md bg-black/[0.05] dark:bg-white/[0.08]',
          m.who === 'team' && 'rounded-br-md bg-[var(--tone-info-wash)] text-foreground ring-1 ring-[var(--tone-info-dot)]/40',
        )}
      >
        {m.text}
      </div>
      <span className="px-1 text-[11px] text-muted-foreground">
        {m.who === 'creator' ? '' : `${WHO_LABEL[m.who]} · `}
        {stamp(m.at)}
      </span>
    </div>
  )
}

export function AgentThreadSheet({
  campaignId,
  thread,
  open,
  onOpenChange,
  onChanged,
}: {
  campaignId: string
  thread: AgentThread | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const count = thread?.history.length ?? 0

  // Open on the latest message, and follow new ones as the refetch brings them in.
  useEffect(() => {
    if (open) requestAnimationFrame(() => end.current?.scrollIntoView({ block: 'end' }))
  }, [open, count, thread?.id])

  const handled = async () => {
    if (!thread) return
    setBusy(true)
    try {
      await faAgentApi.markHandled(campaignId, thread.id)
      toast.success('Marked handled')
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not go through')
    } finally {
      setBusy(false)
    }
  }

  const flags = thread?.flags ?? []
  const openFlags = flags.filter((f) => !f.resolved_at)
  const visit = thread ? visitLine(thread) : null
  const tried = thread ? triedLine(thread.attempts) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="console-shell flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {thread ? (
          <>
            <SheetHeader className="space-y-0 border-b px-5 pb-4 pt-5 text-left">
              <div className="flex items-center gap-3 pr-6">
                <Avatar thread={thread} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-base leading-tight">{displayName(thread)}</SheetTitle>
                  <SheetDescription className="mt-0.5 truncate text-xs">
                    {[thread.handle && thread.name ? thread.name : null, tried].filter(Boolean).join(' · ') || 'WhatsApp'}
                  </SheetDescription>
                </div>
                <StatusPill thread={thread} />
              </div>
              {visit || thread.next_action ? (
                <div className="mt-3 flex flex-col gap-1.5 text-[13px]">
                  {visit ? (
                    <span className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      {visit}
                    </span>
                  ) : null}
                  {thread.next_action ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Next: {thread.next_action}
                      {thread.next_action_at ? ` (${stamp(thread.next_action_at)})` : ''}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </SheetHeader>

            {flags.length > 0 ? (
              <div className="space-y-2 border-b px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium">
                    <Flag className="h-3.5 w-3.5" />
                    For the team
                  </span>
                  {openFlags.length > 0 ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={handled}>
                      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                      Mark handled
                    </Button>
                  ) : null}
                </div>
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {flags.map((f, i) => (
                    <li key={`${f.at}-${i}`} className={cn('flex items-start gap-2 text-[13px]', f.resolved_at && 'opacity-50')}>
                      <span
                        aria-hidden
                        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', f.resolved_at ? 'bg-[var(--tone-neutral-dot)]' : 'bg-[var(--tone-bad-dot)]')}
                      />
                      <span className="min-w-0 flex-1">
                        {f.text}
                        <span className="block text-[11px] text-muted-foreground">
                          {stamp(f.at)}
                          {f.resolved_at ? ' · Handled' : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {thread.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                thread.history.map((m, i) => <Bubble key={`${m.at}-${i}`} m={m} />)
              )}
              <div ref={end} />
            </div>

            <p className="border-t px-5 py-3 text-[11.5px] text-muted-foreground">
              Anything the agent cannot answer goes to hello@following.ae.
            </p>
          </>
        ) : (
          <SheetHeader className="px-5 pt-5">
            <SheetTitle className="text-base">Conversation</SheetTitle>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}
