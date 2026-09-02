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
 *
 * The screen has two modes. The list, and the composer, which takes the whole width rather
 * than a drawer down the side: see `components/share/ShareComposer.tsx` for why the sheet was
 * the wrong shape for a job that involves building a table.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Plus, StickyNote, Table2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AuthGuard } from '@/components/AuthGuard'
import { SuperAdminInterface } from '@/components/admin/SuperAdminInterface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'
import { Empty, PageHead, Panel, Row } from '@/components/console/primitives'
import { ShareComposer, type Kind, type Targets } from '@/components/share/ShareComposer'

export const dynamic = 'force-dynamic'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/shares`

type Share = {
  id: string; team_id: string; client: string; kind: Kind; title: string
  body?: string | null; file_name?: string | null; file_size?: number | null
  campaign_name?: string | null; proposal_name?: string | null
  created_at?: string | null; created_by?: string | null
  read_by: number; archived: boolean
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
        <div className="flex flex-col gap-ds-5 p-4 md:p-7">
          {composing ? (
            <ShareComposer
              targets={targets}
              onCancel={() => setComposing(false)}
              onSent={() => { setComposing(false); load() }}
            />
          ) : (
            <>
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
                <div className="flex flex-col items-start gap-ds-2">
                  <p className="text-ds-label">Could not load what has been shared.</p>
                  <p className="text-ds-body text-muted-foreground">
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
            </>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
