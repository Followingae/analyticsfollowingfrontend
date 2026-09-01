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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Trash2, Check, X, Plus, Loader2, Send, RotateCcw, Lock, UserCog } from 'lucide-react'
import { clientApi, type StaffUser } from '@/services/clientManagementApi'
import { toast } from 'sonner'
import {
  sourcingApi, STATUS_LABEL, type RoundItem, type RoundSummary, type RoundStatus,
} from '@/services/sourcingApi'
import { useAdminAccess } from '@/hooks/useAdminAccess'

const compact = (n: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`
const aed = (c: number | null) => (c == null ? null : `⃃ ${(c / 100).toLocaleString('en-AE')}`)

const csvList = (v: string) => v.split(',').map(x => x.trim()).filter(Boolean)
const toNum = (v: string) => (v.trim() ? Number(v) : undefined)

export default function RoundDetailPage() {
  const { roundId } = useParams<{ roundId: string }>()
  const router = useRouter()
  const { canSeeCost, canSeeSell, isSuperAdmin, isFullAccessStaff } = useAdminAccess()
  // Leadership: puts rounds in front of clients, and closes them.
  const canRelease = isSuperAdmin || isFullAccessStaff

  const [round, setRound] = useState<RoundSummary | null>(null)
  const [items, setItems] = useState<RoundItem[]>([])
  const [excluded, setExcluded] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [handles, setHandles] = useState('')
  const [striking, setStriking] = useState<RoundItem | null>(null)
  const [reason, setReason] = useState('')
  // Stepping in: a founder can re-own, re-date or re-target a round that is already running.
  const [stepIn, setStepIn] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [amend, setAmend] = useState({
    owner: '', due: '', target: '',
    categories: '', market: '', followersMin: '', followersMax: '',
    deliverables: '', budgetMin: '', budgetMax: '', notes: '',
  })

  const openStepIn = async () => {
    const c = (round?.criteria || {}) as Record<string, any>
    const csv = (v: any) => (Array.isArray(v) ? v.join(', ') : v ? String(v) : '')
    setAmend({
      owner: round?.owner_user_id || '',
      due: round?.due_at ? round.due_at.slice(0, 10) : '',
      target: round?.target_count != null ? String(round.target_count) : '',
      categories: csv(c.categories),
      market: c.market ? String(c.market) : '',
      followersMin: c.followers_min != null ? String(c.followers_min) : '',
      followersMax: c.followers_max != null ? String(c.followers_max) : '',
      deliverables: csv(c.deliverables),
      budgetMin: c.budget_per_creator_min != null ? String(c.budget_per_creator_min) : '',
      budgetMax: c.budget_per_creator_max != null ? String(c.budget_per_creator_max) : '',
      notes: c.notes ? String(c.notes) : '',
    })
    setStepIn(true)
    if (!staff.length) {
      try { setStaff((await clientApi.listStaff()).data || []) } catch { /* names only */ }
    }
  }

  const removeRound = async () => {
    setBusy(true)
    try {
      const res = await sourcingApi.deleteRound(roundId)
      toast.success(res.data?.message || 'Round deleted')
      router.push('/work/sourcing')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete the round')
    } finally { setBusy(false); setConfirmDelete(false) }
  }

  const saveStepIn = async () => {
    setBusy(true)
    try {
      const res = await sourcingApi.amendRound(roundId, {
        owner_user_id: amend.owner || null,
        due_at: amend.due || null,
        target_count: amend.target === '' ? null : Number(amend.target),
        // Sent whole: criteria is one jsonb column, so a partial object would drop the
        // fields it left out rather than leaving them alone.
        criteria: {
          categories: csvList(amend.categories),
          market: amend.market.trim() || undefined,
          followers_min: toNum(amend.followersMin),
          followers_max: toNum(amend.followersMax),
          deliverables: csvList(amend.deliverables),
          budget_per_creator_min: toNum(amend.budgetMin),
          budget_per_creator_max: toNum(amend.budgetMax),
          notes: amend.notes.trim() || undefined,
        },
      })
      const what = (res.data?.changed || []).join(', ')
      toast.success(what ? `Updated — ${what}` : 'Nothing changed')
      setStepIn(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change the round')
    } finally { setBusy(false) }
  }

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
  // The brief leadership wrote when they opened the round. Rendered field by field rather
  // than as raw key/value pairs, because "categories: food,family" is not a brief and the
  // ranges only mean anything as ranges.
  const crit = (round.criteria || {}) as Record<string, any>
  const arr = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : [])
  const kfmt = (n: any) => (Number(n) >= 1000 ? `${Math.round(Number(n) / 1000)}k` : String(n))
  const range = (lo: any, hi: any, f: (x: any) => string) =>
    lo && hi ? `${f(lo)} - ${f(hi)}` : lo ? `${f(lo)}+` : hi ? `up to ${f(hi)}` : null
  const aed = (n: any) => `⃃ ${Number(n).toLocaleString()}`
  const briefFields: { label: string; value: string }[] = [
    arr(crit.categories).length ? { label: 'Kind of creator', value: arr(crit.categories).join(', ') } : null,
    crit.market ? { label: 'Market', value: String(crit.market) } : null,
    range(crit.followers_min, crit.followers_max, kfmt)
      ? { label: 'Followers', value: range(crit.followers_min, crit.followers_max, kfmt)! } : null,
    arr(crit.deliverables).length ? { label: 'Deliverables', value: arr(crit.deliverables).join(' + ') } : null,
    range(crit.budget_per_creator_min, crit.budget_per_creator_max, aed)
      ? { label: 'Budget per creator', value: range(crit.budget_per_creator_min, crit.budget_per_creator_max, aed)! } : null,
  ].filter(Boolean) as { label: string; value: string }[]
  // Anything a older round stored under its own keys still shows, so nothing is hidden.
  const KNOWN = ['categories', 'market', 'followers_min', 'followers_max', 'deliverables',
                 'budget_per_creator_min', 'budget_per_creator_max', 'notes']
  const otherCrit = Object.entries(crit).filter(([k, v]) =>
    !KNOWN.includes(k) && v != null && String(v) !== '')

  return (
    <SuperadminLayout>
      {/* Cost and sell are on this page — stamp it so a screenshot is attributable. */}
      <div className="space-y-ds-5">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/work/sourcing')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All rounds
          </Button>
          <div className="flex flex-wrap items-start gap-ds-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">Round {round.round_no}</Badge>
                <Badge variant="secondary">{STATUS_LABEL[round.status]}</Badge>
                {round.client_name && (
                  round.team_id ? (
                    <button type="button"
                            onClick={() => router.push(`/work/brands/${round.team_id}`)}>
                      <Badge variant="outline" className="hover:bg-muted">
                        {round.client_name} →
                      </Badge>
                    </button>
                  ) : <Badge variant="outline">{round.client_name}</Badge>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{round.title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {items.length} proposed · {approved} approved
                {round.target_count ? ` · target ${round.target_count}` : ''}
                {round.owner_email ? ` · owned by ${round.owner_email}` : ' · unassigned'}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {!closed && (isSuperAdmin || isFullAccessStaff) && (
                <Button size="sm" variant="outline" onClick={openStepIn}>
                  <UserCog className="mr-1.5 h-4 w-4" />Step in
                </Button>
              )}
              {isSuperAdmin && (
                <Button size="sm" variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="mr-1.5 h-4 w-4" />Delete
                </Button>
              )}
              {!closed && (
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />Add creators
                </Button>
              )}
              {/* The talent step. Filling a round is one job and judging it is another, and
                  the person who sourced the names is not the person who decides which of
                  them a client sees. This hands it over and tells whoever reviews. */}
              {!closed && !canRelease && round.status !== 'internal_review' && (
                <Button size="sm" disabled={busy || items.length === 0}
                        onClick={() => run(() => sourcingApi.setStatus(roundId, 'internal_review'),
                                           'Submitted — leadership have been told')}>
                  <Send className="mr-1.5 h-4 w-4" />Submit {items.length} for review
                </Button>
              )}
              {!closed && !canRelease && round.status === 'internal_review' && (
                <Badge variant="secondary" className="h-8 px-3">With leadership for review</Badge>
              )}
              {/* Only leadership put a round in front of a client — they are the ones who
                  can mint the link the client opens. */}
              {!closed && canRelease && round.status !== 'sent_to_client' && (
                <Button size="sm" disabled={busy || approved === 0}
                        onClick={() => run(() => sourcingApi.setStatus(roundId, 'sent_to_client'),
                                           'Sent to the client')}>
                  <Send className="mr-1.5 h-4 w-4" />Send {approved} to client
                </Button>
              )}
              {!closed && canRelease && (
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

        {(briefFields.length > 0 || otherCrit.length > 0 || crit.notes || excluded.length > 0) ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">The brief</CardTitle>
              <CardDescription>What to look for. Written when this round was opened.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-ds-3 text-sm">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {briefFields.map(f => (
                  <div key={f.label}>
                    <div className="text-xs text-muted-foreground">{f.label}</div>
                    <div className="font-medium">{f.value}</div>
                  </div>
                ))}
                {otherCrit.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</div>
                    <div className="font-medium">{Array.isArray(v) ? v.join(', ') : String(v)}</div>
                  </div>
                ))}
                {excluded.length > 0 && (
                  <div className="ml-auto">
                    <div className="text-xs text-muted-foreground">Already excluded</div>
                    <div className="font-medium">{excluded.length} creators from earlier rounds</div>
                  </div>
                )}
              </div>
              {crit.notes && (
                <p className="border-t pt-3 text-muted-foreground">{String(crit.notes)}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          /* A round with no brief is a round nobody can work. Say so, and let whoever may
             edit it fix it on the spot rather than guessing. */
          <div className="flex flex-wrap items-center gap-ds-3 border-t py-ds-3 text-sm">
            <span className="font-medium">No brief on this round yet.</span>
            <span className="text-muted-foreground">
              Nobody can tell what to look for — kind of creator, market, deliverables, budget.
            </span>
            {(isSuperAdmin || isFullAccessStaff) && (
              <Button size="sm" variant="outline" className="ml-auto" onClick={openStepIn}>
                <UserCog className="mr-1.5 h-4 w-4" />Write it
              </Button>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">No creators yet</p>
            <p className="mt-ds-1 text-sm text-muted-foreground">Add the first ones to get started.</p>
          </div>
        ) : (
          <div className="grid gap-ds-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      <Badge className="border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">
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
                      <Badge variant="outline" className="border-transparent bg-[var(--tone-warn-wash)] text-xs text-[var(--tone-warn-ink)]">
                        not yet sellable
                      </Badge>
                    )}
                  </div>
                  {/* The money block was a bordered, filled tile inside a card: a box inside
                      a box, two edges to cross to read a rate. It keeps one hairline above
                      it, which is the line where the subject genuinely changes from who this
                      creator is to what they cost. Who may see which figure is untouched —
                      canSeeCost and canSeeSell gate exactly what they gated before. */}
                  {(canSeeCost || canSeeSell) && (
                    <div className="space-y-ds-1 border-t pt-ds-2 text-xs">
                      {canSeeCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost (reel)</span>
                          <span className="font-medium tabular-nums">
                            {aed(i.cost_reel_aed_cents) ?? '—'}
                          </span>
                        </div>
                      )}
                      {canSeeSell && (
                        <div className="flex justify-between">
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

      {/* Stepping in: re-own, re-date or re-target a round that is already running, so a
          founder never has to abandon one and start again when someone is away or behind. */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this round?</AlertDialogTitle>
            <AlertDialogDescription>
              The round, the creators listed on it, and its alerts go. The creators themselves
              stay in the database with everything researched on them. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={removeRound}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Delete the round
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={stepIn} onOpenChange={setStepIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Step into this round</DialogTitle>
            <DialogDescription>
              Change who owns it, when it is due, how many creators it needs, or what they
              should be looking for. The creators already proposed and the reasons already
              written are kept. Both the old and the new owner are told.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-ds-3">
            <div>
              <Label className="text-xs">Owner</Label>
              <Select value={amend.owner || 'unassigned'}
                      onValueChange={(v: string) => setAmend(a => ({ ...a, owner: v === 'unassigned' ? '' : v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name || m.email}
                      {m.staff_role ? ` · ${String(m.staff_role).replace(/_/g, ' ')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-ds-3">
              <div>
                <Label className="text-xs">Due</Label>
                <Input className="mt-1.5" type="date" value={amend.due}
                       onChange={e => setAmend(a => ({ ...a, due: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">How many creators</Label>
                <Input className="mt-1.5" type="number" value={amend.target} placeholder="12"
                       onChange={e => setAmend(a => ({ ...a, target: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-ds-3 border-t pt-ds-3">
              <div>
                <Label className="text-xs">What kind of creators</Label>
                <Input className="mt-1.5" value={amend.categories} placeholder="food, family"
                       onChange={e => setAmend(a => ({ ...a, categories: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Market</Label>
                <Input className="mt-1.5" value={amend.market} placeholder="UAE"
                       onChange={e => setAmend(a => ({ ...a, market: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-ds-3">
              <div>
                <Label className="text-xs">Followers</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input type="number" value={amend.followersMin} placeholder="min"
                         onChange={e => setAmend(a => ({ ...a, followersMin: e.target.value }))} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="number" value={amend.followersMax} placeholder="max"
                         onChange={e => setAmend(a => ({ ...a, followersMax: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Budget per creator (AED)</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input type="number" value={amend.budgetMin} placeholder="min"
                         onChange={e => setAmend(a => ({ ...a, budgetMin: e.target.value }))} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="number" value={amend.budgetMax} placeholder="max"
                         onChange={e => setAmend(a => ({ ...a, budgetMax: e.target.value }))} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Deliverables</Label>
              <Input className="mt-1.5" value={amend.deliverables} placeholder="reel, story"
                     onChange={e => setAmend(a => ({ ...a, deliverables: e.target.value }))} />
            </div>

            <div>
              <Label className="text-xs">Anything else they should know</Label>
              <Textarea className="mt-1.5" rows={2} value={amend.notes}
                        onChange={e => setAmend(a => ({ ...a, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStepIn(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveStepIn} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!striking} onOpenChange={(o: boolean) => { if (!o) { setStriking(null); setReason('') } }}>
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
