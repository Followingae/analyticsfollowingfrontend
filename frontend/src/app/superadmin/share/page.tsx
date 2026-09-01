'use client'

/**
 * Share Center — everything we have handed a client that is not a proposal or an invoice.
 *
 * The composer offers three kinds and no more. A file, a note, or a table whose columns the
 * operator names. That last one is what keeps this from turning into a pile of one-off
 * screens: "send them the creator addresses" is a table, not an addresses feature that
 * somebody has to build again the week the request is phone numbers instead.
 *
 * The list leads on whether it was OPENED rather than whether it was sent. Sending is the
 * easy half and we already know we did it; what an account manager actually needs to know on
 * a Monday is which client has not looked.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText, Loader2, Plus, Send, StickyNote, Table2, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { AuthGuard } from '@/components/AuthGuard'
import { SuperAdminInterface } from '@/components/admin/SuperAdminInterface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'
import { Empty, PageHead, Panel, Row } from '@/components/console/primitives'

export const dynamic = 'force-dynamic'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/shares`

type Kind = 'file' | 'note' | 'table'
type Share = {
  id: string; team_id: string; client: string; kind: Kind; title: string
  body?: string | null; file_name?: string | null; file_size?: number | null
  campaign_name?: string | null; proposal_name?: string | null
  created_at?: string | null; created_by?: string | null
  read_by: number; archived: boolean
}
type Targets = {
  teams: { id: string; name: string; campaigns: number }[]
  campaigns: { id: string; team_id: string; name: string; status: string }[]
  proposals: { id: string; team_id: string; name: string; status: string }[]
}

const ICON = { file: FileText, note: StickyNote, table: Table2 } as const
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

export default function ShareCenterPage() {
  const [items, setItems] = useState<Share[] | null>(null)
  const [targets, setTargets] = useState<Targets | null>(null)
  const [client, setClient] = useState<string>('all')
  const [composing, setComposing] = useState(false)

  /**
   * A refused read is not an empty share list.
   *
   * Both reads swallowed their failure into `{ data: [] }`, so a 500 rendered "Nothing has
   * been shared yet" with a button offering to start — telling an account manager that a
   * client they sent addresses to yesterday has never been sent anything. The failure is
   * held so the page can say the list did not come back.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailure(null)
    const [a, b] = await Promise.all([
      fetchWithAuth(BASE).then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || `The server answered ${r.status}`)
        return r.json()
      }).catch(e => ({ error: e instanceof Error ? e.message : 'Could not load what has been shared' })),
      fetchWithAuth(`${BASE}/targets`).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    if ((a as any).error) setFailure((a as any).error)
    else setItems((a as any).data)
    if (b) setTargets(b.data)
  }, [])

  useEffect(() => { load() }, [load])

  const shown = useMemo(
    () => (items ?? []).filter(i => client === 'all' || i.team_id === client),
    [items, client])

  const withdraw = async (s: Share) => {
    if (!confirm(`Withdraw “${s.title}”? ${s.client} will no longer see it.`)) return
    try {
      const res = await fetchWithAuth(`${BASE}/${s.id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not withdraw that')
      toast.success(j.message)
      load()
    } catch (e) { toast.error((e as Error).message) }
  }

  return (
    <AuthGuard requireAdmin>
      <SuperAdminInterface>
        <div className="space-y-ds-5 p-4 md:p-7">
          <PageHead
            title="Share Center"
            sub="Anything a client needs that is not a proposal, an invoice or a campaign. The list leads on whether they have opened it, because sending is the half we already know about."
            action={
              <Button onClick={() => setComposing(true)}>
                <Plus className="mr-1.5 size-4" />Share something
              </Button>
            }
          />

          {targets && targets.teams.length > 0 && (
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every client</SelectItem>
                {targets.teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {failure ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Could not load what has been shared.</p>
              <p className="text-sm text-muted-foreground">
                {failure}. Nothing here is known: this is not an empty list.
              </p>
              <Button variant="outline" size="sm" onClick={load}>Try again</Button>
            </div>
          ) : items === null ? (
            <Skeleton className="h-[320px] rounded-ds-2xl" />
          ) : (
            <Panel title="Shared with clients" description="Who has it, and whether they have opened it" flush>
              {shown.map(s => {
                const Icon = ICON[s.kind]
                return (
                  <div key={s.id} className={cn(s.archived && 'opacity-50')}>
                    <Row
                      /* Green once somebody has opened it. It was a hand-picked emerald-600,
                         a fourth green beside the three the console decides once; it names
                         the tone tokens now, and the dot carries the same state so it reads
                         without the colour. */
                      tone={s.read_by > 0 ? 'good' : 'neutral'}
                      title={
                        <span className="flex items-center gap-2">
                          <Icon className="size-3.5 flex-none text-muted-foreground" />
                          <span className="truncate">{s.title}</span>
                        </span>
                      }
                      meta={
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium text-foreground">{s.client}</span>
                          {(s.campaign_name || s.proposal_name) && (
                            <Badge variant="outline" className="text-[10px]">
                              {s.campaign_name || s.proposal_name}
                            </Badge>
                          )}
                          <span>{when(s.created_at)}</span>
                          {s.created_by && <span>· {s.created_by}</span>}
                        </span>
                      }
                      right={
                        /* Opened, not sent. Sending is the half we already know about. */
                        <Badge
                          variant="outline"
                          className={cn('shrink-0',
                            s.read_by > 0
                              ? 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
                              : 'text-muted-foreground')}
                        >
                          {s.read_by > 0 ? `Opened by ${s.read_by}` : 'Not opened'}
                        </Badge>
                      }
                      actions={!s.archived
                        ? <Button variant="ghost" size="icon" className="size-8 shrink-0"
                                  onClick={() => withdraw(s)} title="Withdraw">
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          </Button>
                        : undefined}
                    />
                  </div>
                )
              })}
              {shown.length === 0 && (
                <Empty>
                  {client === 'all' ? 'Nothing has been shared yet.' : 'Nothing shared with this client yet.'}
                </Empty>
              )}
            </Panel>
          )}
        </div>

        <Composer
          open={composing}
          targets={targets}
          onClose={() => setComposing(false)}
          onSent={() => { setComposing(false); load() }}
        />
      </SuperAdminInterface>
    </AuthGuard>
  )
}

function Composer({ open, targets, onClose, onSent }: {
  open: boolean; targets: Targets | null; onClose: () => void; onSent: () => void
}) {
  const [kind, setKind] = useState<Kind>('note')
  const [team, setTeam] = useState('')
  const [tag, setTag] = useState('none')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cols, setCols] = useState('Creator, Address, Phone')
  const [rowsText, setRowsText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  /* Only what belongs to the chosen client. A campaign list spanning every brand is how
     something ends up tagged to the wrong one. */
  const taggable = useMemo(() => {
    if (!targets || !team) return []
    return [
      ...targets.campaigns.filter(c => c.team_id === team)
        .map(c => ({ id: `campaign:${c.id}`, label: c.name, group: 'Campaign' })),
      ...targets.proposals.filter(p => p.team_id === team)
        .map(p => ({ id: `proposal:${p.id}`, label: p.name, group: 'Proposal' })),
    ]
  }, [targets, team])

  const send = async () => {
    if (!team) return toast.error('Choose which client this goes to')
    if (!title.trim()) return toast.error('Give it a title — it is what they see first')
    setSending(true)
    try {
      const [tagKind, tagId] = tag !== 'none' ? tag.split(':') : [null, null]
      let res: Response
      if (kind === 'file') {
        if (!file) { setSending(false); return toast.error('Choose a file') }
        const fd = new FormData()
        fd.append('team_id', team); fd.append('title', title); fd.append('file', file)
        if (body.trim()) fd.append('body', body)
        if (tagKind === 'campaign') fd.append('campaign_id', tagId!)
        if (tagKind === 'proposal') fd.append('proposal_id', tagId!)
        /* No Content-Type: the browser must set the multipart boundary itself. */
        res = await fetchWithAuth(`${BASE}/upload`, { method: 'POST', body: fd })
      } else {
        const payload: Record<string, unknown> = {
          kind, team_id: team, title,
          body: body.trim() || null,
          campaign_id: tagKind === 'campaign' ? tagId : null,
          proposal_id: tagKind === 'proposal' ? tagId : null,
        }
        if (kind === 'table') {
          const columns = cols.split(',').map(c => c.trim()).filter(Boolean)
          const rows = rowsText.split('\n').map(l => l.trim()).filter(Boolean)
            .map(l => l.split(',').map(c => c.trim()))
          if (!columns.length || !rows.length) {
            setSending(false); return toast.error('A table needs columns and at least one row')
          }
          const bad = rows.findIndex(r => r.length !== columns.length)
          if (bad >= 0) {
            setSending(false)
            return toast.error(`Row ${bad + 1} has ${rows[bad].length} cells but there are ${columns.length} columns`)
          }
          payload.table_columns = columns
          payload.table_rows = rows
        }
        res = await fetchWithAuth(BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not share that')
      toast.success(j.message)
      setTitle(''); setBody(''); setRowsText(''); setFile(null); setTag('none')
      onSent()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Share something</SheetTitle>
          <SheetDescription className="text-left">
            It appears on their home page and stays tagged to whatever it is about.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4 px-4 pb-8">
          <Tabs value={kind} onValueChange={v => setKind(v as Kind)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="note"><StickyNote className="mr-1.5 size-3.5" />Note</TabsTrigger>
              <TabsTrigger value="table"><Table2 className="mr-1.5 size-3.5" />Table</TabsTrigger>
              <TabsTrigger value="file"><FileText className="mr-1.5 size-3.5" />File</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-xs">Client</Label>
            <Select value={team} onValueChange={v => { setTeam(v); setTag('none') }}>
              <SelectTrigger><SelectValue placeholder="Who is this for?" /></SelectTrigger>
              <SelectContent>
                {(targets?.teams ?? []).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">About (optional)</Label>
            <Select value={tag} onValueChange={setTag} disabled={!team}>
              <SelectTrigger>
                <SelectValue placeholder={team ? 'Not about anything specific' : 'Choose a client first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not about anything specific</SelectItem>
                {taggable.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.group}: {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
                   placeholder="e.g. Creator addresses for this week's shipment" />
          </div>

          {kind === 'file' && (
            <div className="space-y-1.5">
              <Label className="text-xs">File</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-[11px] text-muted-foreground">
                Stored privately and opened through a link that expires after fifteen minutes —
                these usually carry addresses and phone numbers. Up to 25MB.
              </p>
            </div>
          )}

          {kind === 'table' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Columns, comma separated</Label>
                <Input value={cols} onChange={e => setCols(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rows — one per line, cells comma separated</Label>
                <Textarea rows={8} value={rowsText} onChange={e => setRowsText(e.target.value)}
                          className="font-mono text-xs"
                          placeholder={'@dubai_mom_life, Villa 12 Al Barsha, +9715...\n@bil_baz, Marina Tower 4, +9715...'} />
                <p className="text-[11px] text-muted-foreground">
                  Paste straight from a spreadsheet. They read it on screen rather than
                  downloading anything.
                </p>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">
              {kind === 'note' ? 'Message' : 'Anything to say about it (optional)'}
            </Label>
            <Textarea rows={kind === 'note' ? 6 : 3} value={body}
                      onChange={e => setBody(e.target.value)} />
          </div>

          <Button className="w-full" onClick={send} disabled={sending}>
            {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Share it
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
