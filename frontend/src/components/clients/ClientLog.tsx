'use client'

/**
 * Everything that has happened on one client, and the notes people leave on it.
 *
 * ASSEMBLED, NOT WRITTEN. The server derives this from the tables that already record each
 * act: a proposal is here because it has a `sent_at`, an access change because the
 * entitlement log holds it, a payment because the invoice is marked paid. Nothing had to be
 * backfilled and nothing can be forgotten, which is the property that matters: an action
 * nobody logged looks exactly like an action that never happened.
 *
 * WHO DID IT, OR NOTHING. Many rows genuinely have no actor, because the platform did them
 * or because the table never recorded one. Those say "the platform", which is true. Guessing
 * a colleague's name on a screen whose whole job is accountability would be the single worst
 * thing this component could do.
 *
 * A NOTE IS WITHDRAWN, NEVER DELETED. The text stays and the row says it was withdrawn. A
 * log you can quietly edit is not a log.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Banknote, Building2, FileText, Link2, Loader2, Mail, MessageSquare, Send,
  ShieldCheck, Sparkles, Undo2, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CARD } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

interface Entry {
  at: string
  kind: string
  title: string
  detail: string | null
  actor_email: string | null
  source: string
  ref_type: string | null
  ref_id: string | null
}

/* One glyph per kind. Never colour alone: the word is always beside it. */
const LOOK: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  campaign: { icon: Building2, tone: 'text-muted-foreground' },
  proposal: { icon: Send, tone: 'text-muted-foreground' },
  money: { icon: Banknote, tone: 'text-[var(--tone-good-ink)]' },
  sourcing: { icon: Users, tone: 'text-muted-foreground' },
  document: { icon: FileText, tone: 'text-muted-foreground' },
  share: { icon: Link2, tone: 'text-muted-foreground' },
  access: { icon: ShieldCheck, tone: 'text-[var(--tone-info-ink)]' },
  content: { icon: Sparkles, tone: 'text-muted-foreground' },
  results: { icon: Sparkles, tone: 'text-[var(--tone-good-ink)]' },
  email: { icon: Mail, tone: 'text-muted-foreground' },
  note: { icon: MessageSquare, tone: 'text-foreground' },
  retracted: { icon: Undo2, tone: 'text-muted-foreground' },
}

/** `hajar.m@following.ae` reads as "Hajar M". An address is not an answer to who did this. */
function person(email: string | null): string {
  if (!email) return 'the platform'
  const local = email.split('@')[0]
  if (!local) return email
  return local
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function ClientLog({ teamId }: { teamId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/clients/${teamId}/log`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || 'Could not read the record')
      setEntries(json.data?.entries || [])
      setMissing(json.data?.unavailable || [])
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read the record')
    } finally { setLoading(false) }
  }, [teamId])

  useEffect(() => { void load() }, [load])

  const write = async () => {
    const body = note.trim()
    if (!body) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/clients/${teamId}/log`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || 'Could not save that')
      setNote('')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save that')
    } finally { setSaving(false) }
  }

  /* Grouped by day, because "what happened on the 12th" is how people ask. */
  const grouped: { date: string; rows: Entry[] }[] = []
  for (const e of entries) {
    const d = day(e.at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) last.rows.push(e)
    else grouped.push({ date: d, rows: [e] })
  }

  return (
    <div className="space-y-5">
      <SectionHead
        title="The record"
        count={entries.length}
        note="Everything that has happened with this client, and who did it."
      />

      <div className={cn(CARD, 'bg-card p-4')}>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something on this client's record. It cannot be edited afterwards."
          className="text-ds-caption"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={write} disabled={saving || !note.trim()}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    : <MessageSquare className="mr-1.5 h-3.5 w-3.5" />}
            Add to the record
          </Button>
        </div>
      </div>

      {/* Part of the history could not be read. Said out loud, because a record that is
          quietly short is worse than one that admits it. */}
      {missing.length > 0 && (
        <p className="text-ds-caption text-muted-foreground">
          Some of this client&apos;s history could not be read and is missing from the list
          below.
        </p>
      )}

      <ReadState
        failed={failed}
        loading={loading}
        empty={entries.length === 0}
        what="this client’s record"
        onRetry={load}
        nothing="Nothing has happened on this client yet."
        skeleton={<div className="flex items-center gap-2 py-8 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the record
        </div>}
      >
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={g.date} className="space-y-2">
              <p className="text-ds-overline uppercase text-muted-foreground">{g.date}</p>
              <div className="space-y-1.5">
                {g.rows.map((e, i) => {
                  const look = LOOK[e.kind] || LOOK.campaign
                  const Icon = look.icon
                  const withdrawn = e.kind === 'retracted'
                  return (
                    <div key={`${e.at}-${i}`}
                         className={cn(CARD, 'flex items-start gap-3 bg-card px-4 py-2.5',
                                       withdrawn && 'opacity-60')}>
                      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', look.tone)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-ds-caption font-medium',
                                         withdrawn && 'line-through')}>
                          {e.title}
                        </p>
                        {e.detail && (
                          <p className="reading-width mt-0.5 text-ds-caption text-muted-foreground">
                            {e.detail}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {e.kind === 'note' && (
                          <Badge variant="outline" className="text-ds-overline">Note</Badge>
                        )}
                        <span className="text-ds-caption text-muted-foreground">
                          {person(e.actor_email)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </ReadState>
    </div>
  )
}
