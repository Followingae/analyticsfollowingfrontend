'use client'

/**
 * The composer, as a mode of the page rather than a drawer beside it.
 *
 * Composing a share is a task with real content in it: a table of thirty addresses, a note
 * somebody will read as a message from us, a file that carries phone numbers. A side sheet is
 * the shape for a setting, not for that, and the table kind in particular was unusable in one:
 * naming columns in a comma separated text box and typing rows into a textarea is not a table
 * editor, it is a request that the operator serialise the table themselves.
 *
 * So the page switches into compose mode and gives the work the whole width. A dialog would
 * have kept the list visible behind a scrim and then capped the table at the dialog's width,
 * which is the same cramp with a bigger box around it, and a separate route would have needed
 * a matching entry in the /work rewrite that lives outside this feature. Compose mode costs
 * neither, and the list is one Cancel away.
 *
 * Density: comfortable. ds-3 between fields that belong together, ds-5 where a genuinely
 * different subject starts, which here is the content lane against the delivery lane. The
 * separation ladder is walked in order: space does the grouping, the two hairlines are the
 * grid's own edges, and the only cards on screen are the three kind tiles, which are real
 * objects you pick between.
 */
import { useMemo, useState } from 'react'
import { ArrowLeft, FileText, Loader2, Send, StickyNote, Table2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldDescription, FieldLabel } from '@/components/ui2/field'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui2/item'
import { RecordTabs } from '@/components/console/primitives'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'
import { Grid, TableGrid, TablePreview, emptyGrid, harvest } from './TableGrid'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/shares`

export type Kind = 'file' | 'note' | 'table'
export type Targets = {
  teams: { id: string; name: string; campaigns: number }[]
  campaigns: { id: string; team_id: string; name: string; status: string }[]
  proposals: { id: string; team_id: string; name: string; status: string }[]
}

const KINDS: { kind: Kind; label: string; blurb: string; icon: typeof FileText }[] = [
  { kind: 'note', label: 'A note', blurb: 'A message they read on their home page.', icon: StickyNote },
  { kind: 'table', label: 'A table', blurb: 'Columns you name. Addresses, phone numbers, sizes.', icon: Table2 },
  { kind: 'file', label: 'A file', blurb: 'Stored privately, opened through a link that expires.', icon: FileText },
]

const size = (b: number) =>
  b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export function ShareComposer({ targets, onCancel, onSent }: {
  targets: Targets | null
  onCancel: () => void
  onSent: () => void
}) {
  const [kind, setKind] = useState<Kind>('note')
  const [team, setTeam] = useState('')
  const [tag, setTag] = useState('none')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [view, setView] = useState('edit')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
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
    if (!title.trim()) return toast.error('Give it a title, it is what they see first')
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
          /* The grid is rectangular by construction, so the only thing left to check is that
             somebody put something in it. */
          const clean = harvest(grid)
          if (!clean.columns.length || !clean.rows.length) {
            setSending(false)
            return toast.error('A table needs a named column and at least one filled row')
          }
          payload.table_columns = clean.columns
          payload.table_rows = clean.rows
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
      onSent()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const started = Boolean(title.trim() || body.trim() || file || harvest(grid).rows.length)
  const leave = () => {
    if (started && !confirm('Leave this? What you have typed will not be kept.')) return
    onCancel()
  }

  return (
    <div className="flex flex-col gap-ds-5">
      <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-ds-2">
          <button
            type="button" onClick={leave}
            className="flex w-fit items-center gap-1.5 text-ds-caption text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />Back to what has been shared
          </button>
          <h1 className="text-ds-title">Share something</h1>
          <p className="max-w-2xl text-ds-body text-muted-foreground">
            It appears on their home page and stays tagged to whatever it is about.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-ds-2">
          <Button variant="ghost" onClick={leave}>Cancel</Button>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Share it
          </Button>
        </div>
      </div>

      {/* The three kinds, as three things you pick between. A card each, because each one is a
          real object with a name and a consequence, not a segment of one control. */}
      <ItemGroup className="grid gap-ds-3 sm:grid-cols-3">
        {KINDS.map(k => (
          <Item
            key={k.kind} asChild variant={kind === k.kind ? 'muted' : 'outline'}
            className={cn('cursor-pointer text-left transition-colors',
              kind === k.kind && 'border-foreground/25')}
          >
            <button type="button" onClick={() => setKind(k.kind)} aria-pressed={kind === k.kind}>
              <ItemMedia variant="icon"><k.icon /></ItemMedia>
              <ItemContent>
                <ItemTitle>{k.label}</ItemTitle>
                <ItemDescription>{k.blurb}</ItemDescription>
              </ItemContent>
            </button>
          </Item>
        ))}
      </ItemGroup>

      <div className="grid gap-ds-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* The content lane. Whatever the operator actually came here to write. */}
        <div className="flex min-w-0 flex-col gap-ds-4">
          <Field>
            <FieldLabel htmlFor="share-title">Title</FieldLabel>
            <Input
              id="share-title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Creator addresses for this week's shipment"
            />
            <FieldDescription>The one line they see before they open it.</FieldDescription>
          </Field>

          {kind === 'table' && (
            <div className="flex flex-col gap-ds-3">
              <div className="flex flex-wrap items-center justify-between gap-ds-2">
                <p className="text-ds-label">The table</p>
                <RecordTabs
                  tabs={[{ key: 'edit', label: 'Edit' }, { key: 'preview', label: 'As they see it' }]}
                  value={view} onChange={setView}
                />
              </div>
              {view === 'edit'
                ? <TableGrid grid={grid} onChange={setGrid} />
                : <TablePreview grid={grid} />}
            </div>
          )}

          {kind === 'file' && (
            <Field>
              <FieldLabel htmlFor="share-file">File</FieldLabel>
              {file ? (
                <div className="flex items-center gap-ds-3 rounded-ds-lg border px-4 py-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-ds-body">{file.name}</span>
                  <span className="shrink-0 text-ds-caption tabular-nums text-muted-foreground">
                    {size(file.size)}
                  </span>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0"
                          onClick={() => setFile(null)} title="Choose a different file">
                    <X className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="share-file"
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragging(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) setFile(f)
                  }}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-ds-2 rounded-ds-lg',
                    'border border-dashed px-4 py-12 text-center transition-colors',
                    dragging ? 'border-foreground/40 bg-muted/60' : 'hover:bg-muted/40',
                  )}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-ds-body">Drop a file here, or choose one</span>
                  <span className="text-ds-caption text-muted-foreground">Up to 25MB</span>
                </label>
              )}
              <input
                id="share-file" type="file" className="sr-only"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Stored privately and opened through a link that expires after fifteen minutes.
                These usually carry addresses and phone numbers.
              </FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="share-body">
              {kind === 'note' ? 'Message' : 'Anything to say about it (optional)'}
            </FieldLabel>
            <Textarea
              id="share-body" rows={kind === 'note' ? 14 : 4}
              value={body} onChange={e => setBody(e.target.value)}
              placeholder={kind === 'note'
                ? 'Write it as they will read it. It arrives from us, with your name on it.'
                : undefined}
            />
          </Field>
        </div>

        {/* The delivery lane. Short, fixed, and the same three questions whatever the kind is. */}
        <div className="flex flex-col gap-ds-4 lg:border-l lg:pl-ds-5">
          <p className="text-ds-overline uppercase text-muted-foreground">Who gets it</p>

          <Field>
            <FieldLabel htmlFor="share-client">Client</FieldLabel>
            <Select value={team} onValueChange={v => { setTeam(v); setTag('none') }}>
              <SelectTrigger id="share-client"><SelectValue placeholder="Who is this for?" /></SelectTrigger>
              <SelectContent>
                {(targets?.teams ?? []).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targets === null && (
              <FieldDescription>
                The client list did not come back. Try the page again before you send.
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="share-about">About (optional)</FieldLabel>
            <Select value={tag} onValueChange={setTag} disabled={!team}>
              <SelectTrigger id="share-about">
                <SelectValue placeholder={team ? 'Not about anything specific' : 'Choose a client first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not about anything specific</SelectItem>
                {taggable.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.group}: {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Tag it to a campaign or a proposal and it sits with that work rather than on its own.
            </FieldDescription>
          </Field>
        </div>
      </div>
    </div>
  )
}
