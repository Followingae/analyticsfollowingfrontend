'use client'

/**
 * The Desk — what came in, and who it is from.
 *
 * This business runs in Gmail. A client asks for a change by replying to an account
 * manager; a creator sends their insights to whoever messaged them last; an enquiry arrives
 * and is answered or is not. None of it was in the platform, so the platform's version of a
 * client was always a few days behind the real one, and when somebody was away their inbox
 * was the single point of failure.
 *
 * Inbound WhatsApp was worse than absent. It arrived at the webhook, was checked for the
 * words STOP and START, and was then discarded — so every creator who ever replied to one
 * of our messages replied into nothing.
 *
 * WHAT THIS SCREEN IS, AND IS NOT.
 *
 * It is a landing strip, not an inbox. Nothing here sends a reply or threads a
 * conversation: replying still happens in Gmail and in WhatsApp, where the history is. What
 * this does is make sure the message exists somewhere the whole team can see, say who it is
 * probably from and what it is probably about, and let somebody take it so two people do
 * not both answer.
 *
 * UNPLACED MESSAGES SORT FIRST AND ARE NEVER HIDDEN. A message we cannot match is an
 * enquiry from somebody we have never met, which is the most valuable thing in the pile. An
 * account manager sees their own clients' messages plus every unplaced one, because an
 * unidentified enquiry belongs to whoever picks it up.
 *
 * A GUESS IS SHOWN AS A GUESS. The matcher says certain, likely or nothing, and the row
 * carries the word and the reason. Nothing in the platform changes state off one of those
 * guesses, and "Place it" is how a person overrules one.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import {
  ArrowUpRight, Check, Inbox, Loader2, Mail, MessageCircle, Paperclip, UserCheck, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { CARD, PageHead, Stat, StatGrid } from '@/components/console/primitives'
import {
  Dash, FilterBar, ReadState, type FilterChip,
} from '@/components/console/surfaces'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/desk`

async function api(path = '', init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

interface Message {
  id: string
  channel: 'email' | 'whatsapp'
  from_address: string | null
  from_name: string | null
  from_phone: string | null
  subject: string | null
  preview: string | null
  body_truncated: boolean
  attachments: { name?: string; url?: string; content_type?: string }[]
  matched_kind: 'client' | 'creator' | 'lead' | 'staff' | null
  matched_label: string | null
  match_confidence: 'certain' | 'likely' | 'none'
  match_why: string | null
  status: 'new' | 'open' | 'done' | 'ignored'
  note: string | null
  team_id: string | null
  team_name: string | null
  campaign_id: string | null
  campaign_name: string | null
  influencer_db_id: string | null
  enrolment_link_id: string | null
  received_at: string
  assigned_email: string | null
  handled_email: string | null
}

const when = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  if (mins < 2880) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const full = (iso: string | null) =>
  !iso ? '' : new Date(iso).toLocaleString('en-GB',
    { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/* Who the sender is, in one word. Colour never travels without it. */
const KIND_WORD: Record<string, string> = {
  client: 'Client', creator: 'Creator', lead: 'Enquiry', staff: 'Forwarded in',
}

const KIND_TONE: Record<string, string> = {
  client: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  creator: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  lead: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  staff: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

type Tab = 'open' | 'unplaced' | 'done' | 'all'

export default function DeskPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout>
        <Desk />
      </SuperadminLayout>
    </AuthGuard>
  )
}

function Desk() {
  const [messages, setMessages] = useState<Message[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<Tab>('open')
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<Message | null>(null)
  const [openBody, setOpenBody] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const q = new URLSearchParams()
      if (tab === 'unplaced') q.set('unmatched', 'true')
      else if (tab === 'done') q.set('status', 'done')
      const res = await api(q.toString() ? `?${q.toString()}` : '')
      setMessages(res.data?.messages || [])
      setCounts(res.data?.counts || {})
    } catch (e) {
      setFailed(true)
      setMessages([])
      setCounts({})
      toast.error(e instanceof Error ? e.message : 'Could not read the Desk')
    } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { load() }, [load])

  /* The "open" tab is the working view: anything nobody has finished with. Done and
     ignored are filtered server-side only for the Done tab, so this handles the rest. */
  const shown = useMemo(() => {
    const rows = tab === 'open'
      ? messages.filter(m => m.status === 'new' || m.status === 'open')
      : messages
    /* Unplaced first, then newest. A message we could not identify is an enquiry from
       somebody we have never met, and it is the one that costs us money to miss. */
    return [...rows].sort((a, b) => {
      const au = a.matched_kind ? 1 : 0
      const bu = b.matched_kind ? 1 : 0
      if (au !== bu) return au - bu
      return new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
    })
  }, [messages, tab])

  /* Named after who is blocking rather than after a status, and the counts are counts of
     what this person can see rather than of what they are looking at — a "needs somebody"
     number that changes when you click Dealt with is a number nobody can use. */
  const chips: FilterChip[] = [
    { key: 'open', label: 'Needs somebody', n: (counts.new || 0) + (counts.open || 0) },
    { key: 'unplaced', label: 'We cannot place these', n: counts.unplaced || 0 },
    { key: 'done', label: 'Dealt with', n: counts.done || 0 },
    { key: 'all', label: 'Everything', n: messages.length },
  ]

  const act = async (m: Message, body: Record<string, unknown>, said: string) => {
    setBusy(true)
    try {
      await api(`/${m.id}`, { method: 'POST', body: JSON.stringify(body) })
      toast.success(said)
      setOpen(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update that')
    } finally { setBusy(false) }
  }

  const openOne = async (m: Message) => {
    setOpen(m)
    setNote(m.note || '')
    setOpenBody(null)
    /* The list carries a 400-character preview, because fifty twenty-thousand-character
       bodies is a megabyte of payload for a screen showing two lines of each. */
    if (m.body_truncated) {
      try {
        const res = await api(`/${m.id}`)
        setOpenBody(res.data?.body || null)
      } catch {
        setOpenBody(null)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="The Desk"
        sub={
          <>
            Email to desk@following.ae and WhatsApp replies on our own numbers, landed where
            everybody can see them. Replying still happens where you reply; this is so a
            message is never only in one person&rsquo;s inbox.
          </>
        }
      />

      <StatGrid cols={3}>
        <Stat
          label="Waiting on somebody"
          value={(counts.new || 0) + (counts.open || 0)}
          tone={(counts.new || 0) > 0 ? 'warn' : 'neutral'}
          icon={Inbox}
          hint="Nobody has marked these dealt with."
        />
        <Stat
          label="We cannot place"
          value={counts.unplaced || 0}
          tone={(counts.unplaced || 0) > 0 ? 'bad' : 'good'}
          hint="Nothing on file matches the sender, so this is somebody new."
        />
        <Stat
          label="Dealt with"
          value={counts.done || 0}
          hint="Closed, with the name of whoever closed it."
        />
      </StatGrid>

      <FilterBar
        chips={chips}
        value={tab}
        onChange={(k) => setTab(k as Tab)}
      />

      <ReadState
        failed={failed}
        loading={loading}
        empty={shown.length === 0}
        what="the Desk"
        onRetry={load}
        nothing={
          tab === 'open'
            ? 'Nothing is waiting. Every message that has come in has been dealt with.'
            : tab === 'unplaced'
              ? 'Every message we have received matched somebody we already know.'
              : 'Nothing here yet.'
        }
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the Desk
        </div>}
      >
        <div className="flex flex-col border-t">
          {shown.map(m => {
            const Icon = m.channel === 'whatsapp' ? MessageCircle : Mail
            const who = m.matched_label || m.from_name || m.from_address || 'Unknown sender'
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => openOne(m)}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-2 py-3 text-left transition-colors',
                  'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ring focus-visible:ring-inset',
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-ds-body',
                                        m.status === 'new' ? 'font-semibold' : 'font-medium')}>
                      {who}
                    </span>
                    {m.matched_kind ? (
                      <Badge variant="outline" className={KIND_TONE[m.matched_kind]}>
                        {KIND_WORD[m.matched_kind]}
                      </Badge>
                    ) : (
                      <Badge variant="outline"
                             className="border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]">
                        Nobody we know
                      </Badge>
                    )}
                    {/* A guess is labelled a guess. */}
                    {m.match_confidence === 'likely' && (
                      <span className="text-ds-caption text-muted-foreground">probably</span>
                    )}
                    {m.attachments?.length > 0 && (
                      <span className="flex items-center gap-1 text-ds-caption text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {m.attachments.length}
                      </span>
                    )}
                    {m.assigned_email && (
                      <span className="flex items-center gap-1 text-ds-caption text-muted-foreground">
                        <UserCheck className="h-3 w-3" />
                        {m.assigned_email.split('@')[0]}
                      </span>
                    )}
                  </span>
                  {m.subject && (
                    <span className="truncate text-ds-body-sm">{m.subject}</span>
                  )}
                  {m.preview && (
                    <span className="line-clamp-2 text-ds-caption leading-relaxed text-muted-foreground">
                      {m.preview}
                    </span>
                  )}
                  <span className="text-ds-caption text-muted-foreground">
                    {when(m.received_at)}
                    {m.campaign_name ? ` · about ${m.campaign_name}` : ''}
                    {m.status === 'done' && m.handled_email
                      ? ` · closed by ${m.handled_email.split('@')[0]}`
                      : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </ReadState>

      {/* ── One message ─────────────────────────────────────────────────────────────── */}
      <Sheet open={!!open} onOpenChange={(v: boolean) => { if (!v) setOpen(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8">
                  {open.subject || (open.channel === 'whatsapp'
                    ? 'WhatsApp message'
                    : 'Email with no subject')}
                </SheetTitle>
                <SheetDescription>
                  From {open.from_name ? `${open.from_name}, ` : ''}
                  {open.from_address || <Dash reason="unset" what="sender" />}
                  {' · '}{full(open.received_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">

                {/* What we think it is, and why. Stated as a guess where it is one. */}
                <div className={cn(CARD, 'space-y-2 bg-card p-4')}>
                  <div className="flex flex-wrap items-center gap-2">
                    {open.matched_kind ? (
                      <Badge variant="outline" className={KIND_TONE[open.matched_kind]}>
                        {KIND_WORD[open.matched_kind]}
                      </Badge>
                    ) : (
                      <Badge variant="outline"
                             className="border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]">
                        Nobody we know
                      </Badge>
                    )}
                    <span className="text-ds-label font-medium">
                      {open.matched_label || 'Unidentified'}
                    </span>
                  </div>
                  {open.match_why && (
                    <p className="text-ds-caption leading-relaxed text-muted-foreground">
                      {open.match_why}
                    </p>
                  )}
                  {!open.matched_kind && (
                    <p className="text-ds-caption leading-relaxed text-muted-foreground">
                      Nothing on file matches this sender. If it is an enquiry, it is the
                      most valuable message on this screen.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {open.team_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/work/brands/${open.team_id}`}>
                          {open.team_name || 'The client'}
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    {open.campaign_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/work/campaigns/${open.campaign_id}/timeline`}>
                          {open.campaign_name || 'The campaign'}
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    {open.enrolment_link_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/work/enrolments/${open.enrolment_link_id}`}>
                          Their paperwork
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* The message. Plain text, pre-wrapped: a forwarded thread carries its own
                    shape and reflowing it makes the quoted parts unreadable. */}
                <div className="space-y-2">
                  <p className="text-ds-label font-medium">What they said</p>
                  <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap break-words
                                  rounded-ds-lg border bg-muted/30 p-3 text-ds-body-sm leading-relaxed">
                    {openBody ?? open.preview ?? 'Nothing in the body.'}
                    {open.body_truncated && openBody === null && (
                      <span className="text-muted-foreground"> …</span>
                    )}
                  </div>
                </div>

                {open.attachments?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-ds-label font-medium">
                      Attachments ({open.attachments.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {open.attachments.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-ds-body-sm underline underline-offset-2"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          {a.name || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                    {open.channel === 'whatsapp' && (
                      <p className="text-ds-caption leading-relaxed text-muted-foreground">
                        WhatsApp media sits on Twilio and needs our account credentials to
                        open, so these links will ask you to sign in.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-ds-label font-medium">Note</p>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="What you did about it, or what it is actually about."
                  />
                </div>

                {/* No confirmation in front of any of these. None of them sends anything,
                    none of them is hard to undo, and a dialog in front of "I have this" is
                    how people stop pressing it. */}
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {!open.assigned_email && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => act(open, { take: true, note }, 'It is yours')}
                    >
                      <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                      I have this
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => act(open, { status: 'done', note }, 'Marked dealt with')}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Dealt with
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => act(open, { status: 'ignored', note }, 'Set aside')}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Nothing to do
                  </Button>
                  {note !== (open.note || '') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => act(open, { note }, 'Note saved')}
                    >
                      Save the note
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
