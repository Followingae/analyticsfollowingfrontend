'use client'

/**
 * What is held, waiting on you.
 *
 * Nothing in this list has happened. Somebody pressed a button, the gate stopped it, and
 * the whole request is sitting in a queue until you say yes. Approving replays it exactly
 * as it was submitted, on your authority rather than theirs.
 *
 * THE THING THIS SCREEN HAS TO GET RIGHT is that a row is a consequence, not a record. So:
 *
 *   - the class is a word, never only a colour, because "money" and "deletes something" are
 *     the two facts somebody decides on and they have to survive a print-out and a reader
 *     who cannot separate hues.
 *   - approving goes through the money dialog when it is money, and the destructive one
 *     when it deletes. A single "are you sure" in front of both is how people learn to
 *     click through it.
 *   - a refusal demands a reason, and the server agrees: an unexplained no comes back as
 *     the same request next week.
 *
 * Oldest first, deliberately. A queue read newest-first starves the thing that has been
 * waiting longest, which is the one somebody has given up on and worked around.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Ban, Check, Clock, Loader2, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CARD } from '@/components/console/primitives'
import { Dash, ReadState, SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import {
  CLASS_LABEL, ROLE_LABEL, pendingActionsApi,
  type ActionClass, type PendingAction,
} from '@/services/pendingActionsApi'
import { cn } from '@/lib/utils'

const TONE: Record<ActionClass, string> = {
  money: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  delete: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  client: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  access: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  internal: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const ICON: Record<ActionClass, React.ComponentType<{ className?: string }>> = {
  money: Wallet, delete: Trash2, client: ShieldCheck, access: ShieldCheck, internal: Clock,
}

const ago = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

/** AED out of a request body, where there is one, so the money dialog can state it. */
function amountIn(a: PendingAction): number | undefined {
  const m = (a.summary || '').match(/amount(?: aed)?:\s*([\d,.]+)/i)
  if (!m) return undefined
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

export function HeldActions({ onCount }: { onCount?: (n: number) => void }) {
  const confirm = useConfirm()
  const [actions, setActions] = useState<PendingAction[]>([])
  const [canAnswer, setCanAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await pendingActionsApi.list('pending')
      /* Oldest first: the longest wait is the one somebody has stopped believing in. */
      const rows = [...(res.data?.actions || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setActions(rows)
      setCanAnswer(!!res.data?.can_answer)
      onCount?.(rows.length)
    } catch (e) {
      setFailed(true)
      setActions([])
      toast.error(e instanceof Error ? e.message : 'Could not read the queue')
    } finally { setLoading(false) }
  }, [onCount])

  useEffect(() => { load() }, [load])

  const approve = async (a: PendingAction) => {
    const amount = amountIn(a)
    const ok = await confirm(
      a.action_class === 'money'
        ? {
            kind: 'money' as const,
            title: `Approve: ${a.label}`,
            subtitle: `Asked for by ${a.actor_email || 'a colleague'}`,
            amountAed: amount ?? 0,
            amountNote: amount === undefined
              ? 'This request carries no amount we could read. Open it before approving.'
              : 'This is what the request says. It happens the moment you approve.',
            body: <>{a.summary}</>,
            confirmLabel: 'Approve and do it',
          }
        : a.action_class === 'delete'
          ? {
              kind: 'destructive' as const,
              title: `Approve a deletion: ${a.label}`,
              body: <>{a.summary}</>,
              losses: [
                { label: `${a.method} ${a.path}`, detail: 'Runs exactly as submitted.' },
                { label: 'It runs on your authority, not theirs', warn: true },
              ],
              confirmLabel: 'Approve the deletion',
            }
          : {
              kind: 'routine' as const,
              title: `Approve: ${a.label}`,
              body: (
                <>
                  {a.summary}
                  <br />
                  <span className="text-muted-foreground">
                    Asked for by {a.actor_email || 'a colleague'}. It runs on your authority.
                  </span>
                </>
              ),
              confirmLabel: 'Approve',
            })
    if (!ok) return

    setBusy(a.id)
    try {
      await pendingActionsApi.approve(a.id, note[a.id])
      toast.success('Approved, and it has gone through')
      load()
    } catch (e) {
      /* A 409 means the approval was recorded and the thing underneath refused. Saying
         which matters: otherwise somebody goes looking in the wrong place. */
      toast.error(e instanceof Error ? e.message : 'Could not approve')
      load()
    } finally { setBusy(null) }
  }

  const reject = async (a: PendingAction) => {
    const why = (note[a.id] || '').trim()
    if (!why) {
      toast.error('Say why first. It stops the same request coming back next week.')
      return
    }
    setBusy(a.id)
    try {
      await pendingActionsApi.reject(a.id, why)
      toast.success('Turned down, and they have been told why')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not turn it down')
    } finally { setBusy(null) }
  }

  return (
    <section className="space-y-3">
      <SectionHead
        title={canAnswer ? 'Waiting on you' : 'Your requests, waiting on Zain'}
        count={actions.length}
        note={canAnswer
          ? 'Nothing here has happened yet. Approving runs it exactly as it was submitted.'
          : 'Held until Zain answers. You will be told either way.'}
      />

      <ReadState
        failed={failed}
        loading={loading}
        empty={actions.length === 0}
        what="the approval queue"
        onRetry={load}
        nothing={canAnswer
          ? 'Nothing is waiting on you.'
          : 'Nothing of yours is waiting.'}
        skeleton={<div className="flex items-center gap-2 py-6 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the queue
        </div>}
      >
        <div className="flex flex-col gap-2">
          {actions.map(a => {
            const Icon = ICON[a.action_class] || Clock
            return (
              <div key={a.id} className={cn(CARD, 'bg-card p-4')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-ds-label font-semibold">{a.label}</span>
                      <Badge variant="outline" className={TONE[a.action_class]}>
                        {CLASS_LABEL[a.action_class]}
                      </Badge>
                    </div>
                    <p className="reading-width text-ds-caption leading-relaxed text-muted-foreground">
                      {a.summary || <Dash reason="unset" what="detail" />}
                    </p>
                    <p className="text-ds-caption text-muted-foreground">
                      {a.actor_email || 'Somebody'}
                      {a.actor_role ? ` · ${ROLE_LABEL[a.actor_role] || a.actor_role}` : ''}
                      {' · '}{ago(a.created_at)}
                      {' · '}
                      <span className="font-mono text-[11px]">{a.method} {a.path}</span>
                    </p>
                  </div>

                  {canAnswer && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" disabled={busy === a.id} onClick={() => approve(a)}>
                        {busy === a.id
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <Check className="mr-1.5 h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy === a.id}
                              onClick={() => reject(a)}>
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        No
                      </Button>
                    </div>
                  )}
                </div>

                {canAnswer && (
                  <Textarea
                    rows={1}
                    className="mt-3 text-ds-caption"
                    placeholder="A note. Required to turn it down, optional to approve."
                    value={note[a.id] || ''}
                    onChange={e => setNote(n => ({ ...n, [a.id]: e.target.value }))}
                  />
                )}
              </div>
            )
          })}
        </div>
      </ReadState>

      {canAnswer && actions.length > 0 && (
        <p className="flex items-start gap-2 text-ds-caption text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Approving runs the request on your authority. Every permission check runs again,
            so you cannot approve somebody into doing something you could not do yourself.
          </span>
        </p>
      )}
    </section>
  )
}
