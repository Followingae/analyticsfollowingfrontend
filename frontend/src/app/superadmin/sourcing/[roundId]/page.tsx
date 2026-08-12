'use client'

/**
 * One sourcing round: the creators proposed, and the internal verdict on each.
 *
 * Approving or striking happens here. A strike always carries a reason, because that reason
 * is what stops the same creator being proposed to the same brand again — the platform
 * refuses to re-add anyone struck or client-rejected anywhere up the round chain.
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Check, X, Plus, Loader2, Send, RotateCcw, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  sourcingApi, STATUS_LABEL, type RoundItem, type RoundSummary, type RoundStatus,
} from '@/services/sourcingApi'
import { useAdminAccess } from '@/hooks/useAdminAccess'

const compact = (n: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`
const aed = (c: number | null) => (c == null ? null : `AED ${(c / 100).toLocaleString('en-AE')}`)

export default function RoundDetailPage() {
  const { roundId } = useParams<{ roundId: string }>()
  const router = useRouter()
  const { canSeeCost, canSeeSell } = useAdminAccess()

  const [round, setRound] = useState<RoundSummary | null>(null)
  const [items, setItems] = useState<RoundItem[]>([])
  const [excluded, setExcluded] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [handles, setHandles] = useState('')
  const [striking, setStriking] = useState<RoundItem | null>(null)
  const [reason, setReason] = useState('')

  const load = async () => {
    try {
      const res = await sourcingApi.getRound(roundId)
      setRound(res.data.round)
      setItems(res.data.items || [])
      setExcluded(res.data.excluded || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the round')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [roundId])

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true)
    try { await fn(); if (ok) toast.success(ok); await load() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'That did not work') }
    finally { setBusy(false) }
  }

  const addCreators = async () => {
    const list = handles.split(/[\s,]+/).map(s => s.trim().replace(/^@/, '')).filter(Boolean)
    if (!list.length) { toast.error('Paste at least one handle'); return }
    setBusy(true)
    try {
      const res = await sourcingApi.addItems(roundId, list)
      const d = res.data
      if (d.added?.length) toast.success(`${d.added.length} added`)
      if (d.excluded?.length) {
        toast.error(`${d.excluded.length} refused — already rejected for this client`, {
          description: d.excluded.map((u: string) => `@${u}`).join(', '),
        })
      }
      setHandles(''); setAddOpen(false); await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add creators')
    } finally { setBusy(false) }
  }

  const strike = async () => {
    if (!striking) return
    if (!reason.trim()) { toast.error('A strike needs a reason'); return }
    await run(() => sourcingApi.review(roundId, striking.id, 'struck', reason.trim()),
              `@${striking.username} struck`)
    setStriking(null); setReason('')
  }

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }
  if (!round) return <SuperadminLayout><p className="text-sm">Round not found.</p></SuperadminLayout>

  const approved = items.filter(i => i.internal_verdict === 'approved').length
  const struck = items.filter(i => i.internal_verdict === 'struck')
  const closed = round.status === 'locked' || round.status === 'dropped'
  const crit = (round.criteria || {}) as Record<string, string | number>

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/superadmin/sourcing')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All rounds
          </Button>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">Round {round.round_no}</Badge>
                <Badge variant="secondary">{STATUS_LABEL[round.status]}</Badge>
                {round.client_name && <Badge variant="outline">{round.client_name}</Badge>}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{round.title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {items.length} proposed · {approved} approved
                {round.target_count ? ` · target ${round.target_count}` : ''}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {!closed && (
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />Add creators
                </Button>
              )}
              {!closed && round.status !== 'sent_to_client' && (
                <Button size="sm" disabled={busy || approved === 0}
                        onClick={() => run(() => sourcingApi.setStatus(roundId, 'sent_to_client'),
                                           'Sent to the client')}>
                  <Send className="mr-1.5 h-4 w-4" />Send {approved} to client
                </Button>
              )}
              {!closed && (
                <>
                  <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => run(() => sourcingApi.reopen(roundId),
                                             'Next round opened, rejections excluded')}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />More requested
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => run(() => sourcingApi.lock(roundId), 'Round locked')}>
                    <Lock className="mr-1.5 h-4 w-4" />Lock
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {(Object.keys(crit).length > 0 || excluded.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What the client asked for</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {Object.entries(crit).map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</div>
                  <div className="font-medium">{String(v)}</div>
                </div>
              ))}
              {excluded.length > 0 && (
                <div className="ml-auto">
                  <div className="text-xs text-muted-foreground">Already excluded</div>
                  <div className="font-medium">{excluded.length} creators from earlier rounds</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <p className="text-sm font-medium">No creators yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add the first ones to get started.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.filter(i => i.internal_verdict !== 'struck').map(i => (
              <Card key={i.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="text-xs font-semibold">
                        {i.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">@{i.username}</CardTitle>
                      <CardDescription className="truncate">
                        {compact(i.followers_count)} followers
                        {i.engagement_rate != null && ` · ${Number(i.engagement_rate).toFixed(1)}%`}
                      </CardDescription>
                    </div>
                    {i.internal_verdict === 'approved' && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Approved
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(i.categories || []).map(c => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                    {i.country && <Badge variant="outline" className="text-xs">{i.country}</Badge>}
                    {i.creator_status !== 'active' && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        not yet sellable
                      </Badge>
                    )}
                  </div>
                  {(canSeeCost || canSeeSell) && (
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                      {canSeeCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost (reel)</span>
                          <span className="font-medium tabular-nums">
                            {aed(i.cost_reel_aed_cents) ?? '—'}
                          </span>
                        </div>
                      )}
                      {canSeeSell && (
                        <div className="mt-1 flex justify-between">
                          <span className="text-muted-foreground">Sell (reel)</span>
                          <span className="font-medium tabular-nums">
                            {aed(i.sell_reel_aed_cents) ?? '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {!closed && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" disabled={busy || i.internal_verdict === 'approved'}
                              onClick={() => run(() => sourcingApi.review(roundId, i.id, 'approved'),
                                                 `@${i.username} approved`)}>
                        <Check className="mr-1.5 h-4 w-4" />Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy}
                              onClick={() => { setStriking(i); setReason('') }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {struck.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Struck this round</CardTitle>
              <CardDescription>
                These reasons are kept on the creator and block them from coming back for this client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {struck.map(i => (
                <div key={i.id} className="flex items-center gap-3 border-t py-3 first:border-t-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">
                      {i.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">@{i.username}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      “{i.internal_reason}”{i.internal_by_email ? ` — ${i.internal_by_email}` : ''}
                    </div>
                  </div>
                  {!closed && (
                    <Button size="sm" variant="ghost" disabled={busy}
                            onClick={() => run(() => sourcingApi.review(roundId, i.id, 'pending'),
                                               'Put back')}>
                      Undo
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add creators to this round</DialogTitle>
            <DialogDescription>
              Paste handles. Anyone already rejected for this client in an earlier round is
              refused, and you will be told who.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Instagram handles</Label>
            <Textarea className="mt-1.5" rows={5} value={handles}
                      placeholder={'@handle\n@handle\n@handle'}
                      onChange={e => setHandles(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={addCreators} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!striking} onOpenChange={o => { if (!o) { setStriking(null); setReason('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strike @{striking?.username}?</DialogTitle>
            <DialogDescription>
              The reason is kept on the creator and stops them being proposed to this client
              again. They stay in the database for other brands.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Reason (required)</Label>
            <Input className="mt-1.5" value={reason} autoFocus
                   placeholder="e.g. audience mostly outside the GCC"
                   onChange={e => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStriking(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={strike} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Strike
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}
