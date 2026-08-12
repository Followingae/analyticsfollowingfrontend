'use client'

/**
 * Sourcing rounds board.
 *
 * Every client request for sample creators is a round with an owner, a due date and a state.
 * If a round is open the talent team keeps sourcing; if it is locked they stop. Nobody has to
 * send an email either way — which is the whole reason this screen exists.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2, Search, Clock, Layers, TimerOff, Users, CheckCheck } from 'lucide-react'
import { PageHead, Stat, StatGrid } from '@/components/console/primitives'
import { toast } from 'sonner'
import { sourcingApi, STATUS_LABEL, type RoundSummary, type RoundStatus } from '@/services/sourcingApi'

const TABS: { key: string; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'mine', label: 'Mine' },
  { key: 'locked', label: 'Locked' },
  { key: 'dropped', label: 'Dropped' },
]

const tone = (s: RoundStatus) =>
  s === 'internal_review' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  : s === 'sent_to_client' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  : s === 'more_requested' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20'
  : s === 'locked' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
  : s === 'dropped' ? 'bg-muted text-muted-foreground'
  : 'bg-muted text-foreground'

/** Due dates are the whole point of a round, so they read as words, not timestamps. */
function due(iso: string | null) {
  if (!iso) return { text: 'No due date', late: false, soon: false }
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, late: true, soon: false }
  if (days === 0) return { text: 'Due today', late: false, soon: true }
  if (days === 1) return { text: 'Due tomorrow', late: false, soon: true }
  return { text: `Due in ${days} days`, late: false, soon: days <= 3 }
}

export default function SourcingBoardPage() {
  const router = useRouter()
  const [rounds, setRounds] = useState<RoundSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('open')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: '', target: '', dueAt: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await sourcingApi.listRounds(
        tab === 'mine' ? { status: 'open', mine: true } : { status: tab })
      setRounds(res.data?.items || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load rounds')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [tab])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rounds
    return rounds.filter(r =>
      r.title.toLowerCase().includes(t) || (r.client_name || '').toLowerCase().includes(t))
  }, [rounds, q])

  // Board-level totals: the point of the header is "what is this board asking of us today".
  const summary = useMemo(() => rounds.reduce((a, r) => {
    const target = r.target_count || 0
    a.short += Math.max(0, target - r.proposed)
    a.approved += r.approved || 0
    if (r.due_at && new Date(r.due_at).getTime() < Date.now()) a.late += 1
    return a
  }, { short: 0, approved: 0, late: 0 }), [rounds])

  const create = async () => {
    if (!form.title.trim()) { toast.error('Give the round a title'); return }
    setBusy(true)
    try {
      const res = await sourcingApi.createRound({
        title: form.title.trim(),
        target_count: form.target ? Number(form.target) : undefined,
        due_at: form.dueAt || undefined,
      })
      toast.success('Round opened')
      setOpen(false); setForm({ title: '', target: '', dueAt: '' })
      router.push(`/superadmin/sourcing/${res.data.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open the round')
    } finally { setBusy(false) }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title="Sourcing"
          sub="Each client request for sample creators, with an owner, a target and a due date. If a round is open the talent team keeps sourcing; if it is locked they stop."
          action={
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 w-56 pl-8" placeholder="Search rounds…"
                       value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <Button data-tour="new-round" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />New round
              </Button>
            </>
          }
        />

        <StatGrid>
          <Stat label="Rounds on this board" value={rounds.length} icon={Layers}
                hint={tab === 'open' ? 'Open right now' : TABS.find(t => t.key === tab)?.label} />
          <Stat label="Creators still needed" value={summary.short} icon={Users}
                tone={summary.short ? 'warn' : 'good'}
                hint={summary.short ? 'Across every round on this board' : 'Every round is at target'} />
          <Stat label="Overdue" value={summary.late} icon={TimerOff}
                tone={summary.late ? 'bad' : 'good'}
                hint={summary.late ? 'Past the date the client was given' : 'Nothing has slipped'} />
          <Stat label="Approved so far" value={summary.approved} icon={CheckCheck}
                hint="Cleared internally and ready for a client" />
        </StatGrid>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map(t => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-[188px]" />)}
          </div>
        ) : shown.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium">No rounds here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open one when a client asks to see creators.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map(r => {
              const d = due(r.due_at)
              const target = r.target_count || 0
              const pct = target ? Math.min(100, Math.round((r.proposed / target) * 100)) : 0
              return (
                <Card key={r.id}
                      className={`cursor-pointer transition-all hover:border-primary/40 hover:shadow-md ${
                        d.late ? 'border-destructive/30' : ''}`}
                      onClick={() => router.push(`/superadmin/sourcing/${r.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{r.title}</CardTitle>
                        <CardDescription className="truncate">
                          {r.client_name || 'No client linked'} · round {r.round_no}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={tone(r.status)}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {target > 0 && (
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted-foreground">Found</span>
                          <span className="font-medium tabular-nums">{r.proposed} of {target}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className={`inline-flex items-center gap-1 ${
                        d.late ? 'font-medium text-destructive'
                        : d.soon ? 'font-medium text-amber-600' : ''}`}>
                        <Clock className="h-3.5 w-3.5" />{d.text}
                      </span>
                      {r.approved > 0 && <span>· {r.approved} approved</span>}
                      {r.selected > 0 && <span>· {r.selected} picked</span>}
                    </div>
                    {r.owner_email && (
                      <p className="truncate text-xs text-muted-foreground">{r.owner_email}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New sourcing round</DialogTitle>
            <DialogDescription>
              A round is one client request. Give it a target and a due date so everyone can see
              what is still needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="mt-1.5" value={form.title} placeholder="e.g. Boom Challenge — family creators"
                     onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">How many creators</Label>
                <Input className="mt-1.5" type="number" value={form.target} placeholder="12"
                       onChange={e => setForm(p => ({ ...p, target: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Due</Label>
                <Input className="mt-1.5" type="date" value={form.dueAt}
                       onChange={e => setForm(p => ({ ...p, dueAt: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={create} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Open round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}
