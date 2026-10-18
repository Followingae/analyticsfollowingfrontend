'use client'

/**
 * Everything somebody is waiting on, in one list.
 *
 * ONE QUEUE, TWO REASONS. A client asking through Sana and "send me sports creators for the
 * event tomorrow" are the same object: somebody needs something, by a date, and the person
 * who owes it should find it in ONE place. Splitting them gives talent two inboxes, and a
 * second inbox is one that stops being read. Where it came from is a chip, not a screen.
 *
 * OLDEST FIRST, with no date last. A queue read newest-first starves the thing that has been
 * waiting longest, and that is always the one somebody gave up on and worked around.
 *
 * UNCLAIMED IS A STATE, NOT A GAP. A request with no owner means nobody has picked it up,
 * which is the single most useful thing this screen can show. Forcing an owner at creation
 * would just mean everything is assigned to whoever happened to be nearest.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Building2, Calendar, Check, Hand, Loader2, MessageSquare, Plus, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { person, requestsApi, type WorkRequest } from '@/services/crmApi'
import { cn } from '@/lib/utils'

const dayOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null

/** Late is the only thing on this screen worth a colour. */
function lateness(due: string | null): { tone: string; word: string | null } {
  if (!due) return { tone: 'text-muted-foreground', word: null }
  const d = new Date(due); d.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { tone: 'font-medium text-[var(--tone-bad-ink)]',
                         word: days === -1 ? 'a day late' : `${-days} days late` }
  if (days === 0) return { tone: 'font-medium text-[var(--tone-warn-ink)]', word: 'today' }
  if (days === 1) return { tone: 'font-medium text-[var(--tone-warn-ink)]', word: 'tomorrow' }
  return { tone: 'text-muted-foreground', word: dayOf(due) }
}

export default function RequestsPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Requests /></SuperadminLayout>
    </AuthGuard>
  )
}

function Requests() {
  const [rows, setRows] = useState<WorkRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [mine, setMine] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [noting, setNoting] = useState<WorkRequest | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await requestsApi.list({
        mine: mine || undefined,
        status: showDone ? 'done' : undefined,
      })
      setRows(d.requests || [])
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read the queue')
    } finally { setLoading(false) }
  }, [mine, showDone])

  useEffect(() => { void load() }, [load])

  const act = async (r: WorkRequest, body: Record<string, unknown>, said: string) => {
    setBusy(r.id)
    try {
      await requestsApi.update(r.id, body)
      toast.success(said)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not work')
    } finally { setBusy(null) }
  }

  const { unclaimed, late } = useMemo(() => ({
    unclaimed: rows.filter((r) => !r.owner_email).length,
    late: rows.filter((r) => r.due_on && new Date(r.due_on) < new Date(
      new Date().setHours(0, 0, 0, 0))).length,
  }), [rows])

  return (
    <div className="space-y-6">
      <PageHead
        title="Waiting on us"
        sub="What clients and colleagues have asked for, and who owes it."
        action={<Button onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Raise one
        </Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={mine ? 'default' : 'outline'} onClick={() => setMine((v) => !v)}>
          Only mine
        </Button>
        <Button size="sm" variant={showDone ? 'default' : 'outline'}
                onClick={() => setShowDone((v) => !v)}>
          {showDone ? 'Showing finished' : 'Show finished'}
        </Button>
        {!showDone && (unclaimed > 0 || late > 0) && (
          <p className="ml-auto flex items-center gap-1.5 text-ds-caption text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            {late > 0 && <><span className="font-medium text-[var(--tone-bad-ink)]">{late} late</span></>}
            {late > 0 && unclaimed > 0 && ' · '}
            {unclaimed > 0 && <>{unclaimed} nobody has taken</>}
          </p>
        )}
      </div>

      <ReadState
        failed={failed} loading={loading} empty={rows.length === 0}
        what="the queue" onRetry={load}
        nothing={showDone ? 'Nothing finished yet.' : 'Nothing is waiting. Genuinely.'}
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the queue
        </div>}
      >
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const l = lateness(r.due_on)
            const done = r.status === 'done' || r.status === 'dropped'
            return (
              <article key={r.id} className={cn(CARD, 'bg-card p-4', done && 'opacity-70')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('text-ds-label font-semibold', done && 'line-through')}>
                        {r.title}
                      </span>
                      {/* Where it came from is a chip. A client asking carries weight a
                          colleague's ask does not, and that is the whole difference. */}
                      {r.source === 'client' && (
                        <Badge variant="outline"
                               className="border-transparent bg-[var(--tone-info-wash)]
                                          text-[var(--tone-info-ink)] text-ds-overline">
                          A client asked
                        </Badge>
                      )}
                      {!r.owner_email && !done && (
                        <Badge variant="outline" className="text-ds-overline">
                          Nobody has this
                        </Badge>
                      )}
                    </div>

                    {r.detail && (
                      <p className="reading-width text-ds-caption leading-relaxed text-muted-foreground">
                        {r.detail}
                      </p>
                    )}

                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ds-caption
                                  text-muted-foreground">
                      {r.client && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />{r.client}
                        </span>
                      )}
                      <span>{person(r.raised_by_email)} asked</span>
                      {r.owner_email && <span>· {person(r.owner_email)} has it</span>}
                      {l.word && (
                        <span className={cn('inline-flex items-center gap-1', l.tone)}>
                          <Calendar className="h-3 w-3" />{l.word}
                        </span>
                      )}
                      {r.notes > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />{r.notes}
                        </span>
                      )}
                    </p>

                    {done && r.close_note && (
                      <p className="text-ds-caption text-muted-foreground">{r.close_note}</p>
                    )}
                  </div>

                  {!done && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {!r.owner_email && (
                        <Button size="sm" variant="outline" disabled={busy === r.id}
                                onClick={() => act(r, { take: true }, 'It is yours')}>
                          <Hand className="mr-1.5 h-3.5 w-3.5" /> I have this
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={busy === r.id}
                              onClick={() => setNoting(r)}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" disabled={busy === r.id}
                              onClick={() => act(r, { status: 'done' }, 'Done, and they have been told')}>
                        {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                       : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === r.id}
                              onClick={() => act(r, { status: 'dropped' }, 'Dropped')}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </ReadState>

      <Raise open={adding} onOpenChange={setAdding} onDone={load} />
      <Notes request={noting} onClose={() => setNoting(null)} />
    </div>
  )
}

function Raise({ open, onOpenChange, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void
}) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [due, setDue] = useState('')
  const [fromClient, setFromClient] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setTitle(''); setDetail(''); setDue(''); setFromClient(false) }
  }, [open])

  const go = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      await requestsApi.raise({
        title: title.trim(), detail: detail.trim() || null,
        source: fromClient ? 'client' : 'internal', due_on: due || null,
      })
      toast.success('Raised')
      onOpenChange(false); onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not raise it')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Something somebody needs</DialogTitle>
          <DialogDescription>
            Leave it unassigned if you do not know who should do it. Unclaimed is visible,
            which is the point.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rt">What is needed</Label>
            <Input id="rt" autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                   placeholder="Three more KSA creators for Lago" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rd">Any detail</Label>
            <Textarea id="rd" rows={3} value={detail}
                      onChange={(e) => setDetail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rdue">Needed by</Label>
            <Input id="rdue" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <button type="button" onClick={() => setFromClient((v) => !v)}
                  aria-pressed={fromClient}
                  className={cn('rounded-full border px-3 py-1.5 text-ds-caption transition-colors',
                                'focus-visible:outline focus-visible:outline-2',
                                'focus-visible:outline-offset-2 focus-visible:outline-primary',
                                fromClient ? 'border-transparent bg-foreground text-background'
                                           : 'bg-background hover:bg-muted')}>
            A client asked for this
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={go} disabled={busy || !title.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Raise it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Notes({ request, onClose }: { request: WorkRequest | null; onClose: () => void }) {
  const [notes, setNotes] = useState<{ body: string; created_at: string; actor: string | null }[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!request) return
    try {
      const d = await requestsApi.notes(request.id)
      setNotes(d.notes || [])
    } catch { /* an empty thread is not worth a toast */ }
  }, [request])

  useEffect(() => { setBody(''); void load() }, [load])

  const add = async () => {
    if (!request || !body.trim()) return
    setBusy(true)
    try {
      await requestsApi.addNote(request.id, body.trim())
      setBody('')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save that')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={!!request} onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>
            What has been said about it, so the conversation lives with the request.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[40vh] space-y-2 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="py-6 text-center text-ds-caption text-muted-foreground">
              Nothing said yet.
            </p>
          ) : notes.map((n, i) => (
            <div key={i} className={cn(CARD, 'bg-muted/30 px-3 py-2')}>
              <p className="text-ds-caption leading-relaxed">{n.body}</p>
              <p className="mt-1 text-ds-caption text-muted-foreground">
                {person(n.actor)} · {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Add something" className="text-ds-caption" />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={add} disabled={busy || !body.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
