'use client'

/**
 * Things the team has sent this client that are not a proposal, an invoice or a campaign.
 *
 * Creator addresses before a shipment, a note about the week, a report someone asked for.
 * All of it used to arrive on WhatsApp, where it is untagged, unsearchable, and impossible
 * to tell whether anyone opened it.
 *
 * The card is deliberately quiet. It sits beside the campaign, shows the newest few with an
 * unread count, and renders NOTHING when there is nothing to show — a dashboard should not
 * carry an empty box explaining what could one day be in it.
 */
import { useCallback, useEffect, useState } from 'react'
import { Download, FileText, Inbox, Loader2, StickyNote, Table2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/shares`

type Share = {
  id: string
  kind: 'file' | 'note' | 'table'
  title: string
  body?: string | null
  table_columns?: string[] | null
  table_rows?: string[][] | null
  file_name?: string | null
  file_size?: number | null
  tagged_to?: string | null
  created_at?: string | null
  read: boolean
}

const ICON = { file: FileText, note: StickyNote, table: Table2 } as const

const ago = (iso?: string | null) => {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  const d = Math.round(mins / 1440)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

const size = (n?: number | null) =>
  !n ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(Math.round(n / 1024), 1)} KB`

export function ShareCenterCard({ className, onHasItems }: {
  className?: string
  /* Told to the parent so the dashboard can widen the campaign chart when this card has
     nothing to show. The card hiding itself is not enough — its grid column would remain. */
  onHasItems?: (has: boolean) => void
}) {
  const [items, setItems] = useState<Share[] | null>(null)
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState<Share | null>(null)
  const [all, setAll] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(BASE)
      if (!res.ok) { setItems([]); return }
      const j = await res.json()
      setItems(j.data.items)
      setUnread(j.data.unread)
      onHasItems?.(j.data.items.length > 0)
    } catch { setItems([]); onHasItems?.(false) }
  }, [onHasItems])

  useEffect(() => { load() }, [load])

  const view = async (s: Share) => {
    setOpen(s)
    if (!s.read) {
      /* Marked read on open, not on arrival. Optimistic so the badge answers immediately;
         a failed write just means it stays unread, which is the safe direction. */
      setItems(prev => prev?.map(i => (i.id === s.id ? { ...i, read: true } : i)) ?? prev)
      setUnread(n => Math.max(0, n - 1))
      fetchWithAuth(`${BASE}/${s.id}/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }
  }

  const download = async (s: Share) => {
    setDownloading(true)
    try {
      const res = await fetchWithAuth(`${BASE}/${s.id}/download`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not open that file')
      window.open(j.data.url, '_blank', 'noopener')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  if (items === null) return <Skeleton className={cn('h-[320px] w-full rounded-2xl', className)} />
  /* Nothing shared yet is not an empty state to design — it is a card that should not exist. */
  if (items.length === 0) return null

  const shown = all ? items : items.slice(0, 3)

  return (
    <>
      <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            From your team
            {unread > 0 && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold normal-case tracking-normal">
                  {unread} new
                </span>
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <div className="divide-y">
            {shown.map(s => {
              const Icon = ICON[s.kind]
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => view(s)}
                  className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className={cn(
                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg',
                    s.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                  )}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[13.5px] leading-tight',
                      s.read ? 'font-medium' : 'font-semibold')}>
                      {s.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                      {s.tagged_to ? `${s.tagged_to} · ` : ''}{ago(s.created_at)}
                    </span>
                  </span>
                  {!s.read && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
        </CardContent>

        {items.length > 3 && (
          <div className="border-t px-5 py-2.5">
            <Button variant="ghost" size="sm" className="h-7 w-full text-xs"
                    onClick={() => setAll(v => !v)}>
              {all ? 'Show less' : `See all (${items.length})`}
            </Button>
          </div>
        )}
      </Card>

      <Sheet open={!!open} onOpenChange={o => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6 text-left leading-snug">{open.title}</SheetTitle>
                <SheetDescription className="text-left">
                  {open.tagged_to && <Badge variant="outline" className="mr-2">{open.tagged_to}</Badge>}
                  {ago(open.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-4 px-4 pb-6">
                {open.body && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{open.body}</p>
                )}

                {open.kind === 'file' && (
                  <Button onClick={() => download(open)} disabled={downloading} className="w-full">
                    {downloading ? <Loader2 className="mr-2 size-4 animate-spin" />
                                 : <Download className="mr-2 size-4" />}
                    {open.file_name || 'Download'}
                    {open.file_size ? <span className="ml-1.5 opacity-70">{size(open.file_size)}</span> : null}
                  </Button>
                )}

                {open.kind === 'table' && open.table_columns && (
                  /* Rendered rather than downloaded. The point of a table is that they can
                     read it on the spot without opening a spreadsheet. */
                  <ScrollArea className="max-h-[65vh] rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                        <tr>
                          {open.table_columns.map(c => (
                            <th key={c} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(open.table_rows ?? []).map((r, i) => (
                          <tr key={i} className="border-t">
                            {r.map((cell, j) => (
                              <td key={j} className="px-3 py-2 align-top leading-snug">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
