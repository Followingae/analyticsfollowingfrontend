'use client'

/**
 * Targets.
 *
 * Leadership sets two numbers a month; every daily target derives from how many brand
 * rosters are actually open. Pace is shown against elapsed time of day, so being part-way
 * through at lunchtime reads as on track rather than behind.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Minus, Plus, Loader2, Save, Target, CalendarDays, Users } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Empty, MiniBar, PageHead, Panel, ScoreDot, Stat, StatGrid,
} from '@/components/console/primitives'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/goals`
const CHART: ChartConfig = { count: { label: 'Creators added', color: 'var(--primary)' } }

async function api(path: string, init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

/** Working day assumed 09:00–18:00 — pace against elapsed hours, not raw percentage. */
function pace(done: number, target: number) {
  if (!target) return { pct: 0, label: 'No target', tone: 'muted' as const }
  const pct = Math.round((done / target) * 100)
  const h = new Date().getHours() + new Date().getMinutes() / 60
  const elapsed = Math.max(0, Math.min(1, (h - 9) / 9))
  const expected = Math.round(elapsed * 100)
  if (pct >= 100) return { pct, label: 'Done for today', tone: 'good' as const }
  if (pct >= expected - 12) return { pct, label: 'On track', tone: 'good' as const }
  if (pct >= expected - 30) return { pct, label: 'Slightly behind', tone: 'warn' as const }
  return { pct, label: 'Behind', tone: 'bad' as const }
}

const initials = (email: string) =>
  (email || '?').split('@')[0].split(/[._-]/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')

export default function GoalsPage() {
  const router = useRouter()
  const { isSuperAdmin, isFullAccessStaff } = useAdminAccess()
  const canSet = isSuperAdmin || isFullAccessStaff

  const [today, setToday] = useState<any>(null)
  /** Why today's figures are absent, when they are. Null means they simply are not. */
  const [todayFailure, setTodayFailure] = useState<string | null>(null)
  const [team, setTeam] = useState<any[]>([])
  const [rule, setRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      // allSettled, not all: /team is leadership-only, so for a talent manager the 403
      // rejected the whole batch and the screen that tells them their daily target rendered
      // completely empty. One forbidden panel must not take the page with it.
      //
      // But a settled rejection is not a quiet day. `today` coming back null used to render
      // "Nothing added yet." over the chart, which is a sentence about the business printed
      // from a fact about the network. The refusal is kept so the screen can say which it is.
      const settled = await Promise.allSettled([api('/today'), api('/team'), api('/rules')])
      const [t, tm, r] = settled.map(x => x.status === 'fulfilled' ? x.value : null)
      const todayFailed = settled[0].status === 'rejected'
      setTodayFailure(todayFailed
        ? ((settled[0] as PromiseRejectedResult).reason instanceof Error
            ? (settled[0] as PromiseRejectedResult).reason.message
            : 'The read did not come back')
        : null)
      setToday(t?.data ?? null)
      setTeam(tm?.data?.people || [])
      setRule((r?.data?.rules || []).find((x: any) => x.role_key === 'talent_manager') || null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load goals')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const saveRule = async () => {
    if (!rule) return
    setSaving(true)
    try {
      await api('/rules', { method: 'PUT', body: JSON.stringify({
        role_key: 'talent_manager',
        per_open_campaign: rule.per_open_campaign,
        baseline_daily: rule.baseline_daily,
        quality_required: rule.quality_required,
      }) })
      toast.success('Rules saved')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    } finally { setSaving(false) }
  }

  const bump = (k: 'per_open_campaign' | 'baseline_daily', by: number) =>
    setRule((p: any) => ({ ...p, [k]: Math.max(0, (p?.[k] ?? 0) + by) }))

  /** Overdue first: it is the only line on this table anybody has to act on. */
  const teamRanked = useMemo(
    () => [...team].sort((a, b) => (b.overdue_rounds || 0) - (a.overdue_rounds || 0)
                                || (b.added || 0) - (a.added || 0)),
    [team])

  const trail = useMemo(() => (today?.trail || []).map((d: any) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  })), [today])

  if (loading) {
    return (
      <SuperadminLayout>
        {/* The loaded band draws no box per figure, so the skeleton does not promise one. */}
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-40 rounded-ds-lg" />
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-9 w-20 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[300px] rounded-ds-2xl" />
        </div>
      </SuperadminLayout>
    )
  }

  const p = today?.has_rule ? pace(today.done, today.target) : null

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="Targets"
          sub="The daily number comes from how many rosters are open, so nobody is chasing an arbitrary one."
        />

        {/* A refusal says so. It used to be indistinguishable from a day on which nobody had
            added anybody. */}
        {todayFailure && (
          <div className="flex flex-col items-start gap-ds-2 border-t pt-ds-3">
            <p className="text-ds-label">Today&apos;s figures did not load.</p>
            <p className="text-ds-caption text-muted-foreground">
              {todayFailure}. Your target and what has been added today are unknown, not zero.
            </p>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        )}

        {today?.has_rule && (
          /* Three figures, not four. "Open rosters" and "Today's target" were the same fact
             twice: one tile said "3 rosters open right now" and the tile beside it said
             "each one raises today's target". The click that only the second one carried
             moves onto the first. */
          <StatGrid cols={3}>
            <Stat label="Today's target" value={today.target} icon={Target}
                  hint={`${today.open_rounds} roster${today.open_rounds === 1 ? '' : 's'} open, plus the baseline`}
                  onClick={() => router.push('/work/areas')} />
            <Stat label="Added today" value={today.done} icon={Users}
                  tone={p?.tone === 'good' ? 'good' : p?.tone === 'warn' ? 'warn' : p?.tone === 'bad' ? 'bad' : 'neutral'}
                  hint={p?.label} />
            <Stat label="This month" value={today.month_done} icon={CalendarDays}
                  hint={today.quality_required ? 'Only complete records count' : 'All records count'} />
          </StatGrid>
        )}

        <div className="grid items-start gap-ds-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Last 14 days" description="Creators added, against the daily target">
            {todayFailure && trail.length === 0 ? (
              <p className="text-ds-caption text-muted-foreground">
                The last fourteen days did not load, so nothing is known about them.
              </p>
            ) : trail.length > 0 ? (
              <ChartContainer config={CHART} className="h-[240px] w-full">
                <AreaChart data={trail} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="goalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10}
                         className="text-xs" interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}
                         className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {/* The panel promised "against the daily target" and then drew one series,
                      so the comparison the chart exists for was left to the reader. This is
                      the line the area is supposed to be read against, and it is the one
                      thing a number cannot show: fourteen days of clearing it or not. */}
                  {today?.has_rule && today.target > 0 && (
                    <ReferenceLine
                      y={today.target}
                      stroke="var(--tone-warn-dot)"
                      strokeDasharray="4 4"
                      label={{ value: `Target ${today.target}`, position: 'insideTopRight',
                               fontSize: 11, fill: 'var(--tone-warn-ink)' }}
                    />
                  )}
                  <Area dataKey="count" type="monotone" stroke="var(--color-count)"
                        strokeWidth={2} fill="url(#goalFill)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <Empty>Nobody has added a creator in the last fortnight.</Empty>
            )}

            {p && (
              /* The pace badge was a third set of hand-picked palette steps, so "on track"
                 was a slightly different green here than on the brand heartbeat. It names
                 the console tone tokens now. */
              <div className="mt-ds-3 space-y-ds-2 border-t pt-ds-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground tabular-nums">{today.done}</strong> of {today.target} today
                  </span>
                  <Badge className={
                    p.tone === 'good' ? 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
                    : p.tone === 'warn' ? 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]'
                    : 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]'}>
                    {p.label}
                  </Badge>
                </div>
                <Progress value={p.pct} className="h-2" />
              </div>
            )}
          </Panel>

          {canSet && rule && (
            <Panel title="Sourcing rules" description="Applies to every talent manager this month">
              <div className="space-y-ds-4">
                {([
                  ['per_open_campaign', 'Per open roster, per day', 'Until that roster closes'],
                  ['baseline_daily', 'When nothing is open', 'Creators to add to the database each day'],
                ] as const).map(([k, title, sub]) => (
                  <div key={k} className="flex items-center justify-between gap-ds-3">
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8"
                              onClick={() => bump(k, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                      <span className="w-8 text-center text-lg font-semibold tabular-nums">{rule[k]}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8"
                              onClick={() => bump(k, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-ds-3 border-t pt-ds-3">
                  <div>
                    <p className="text-sm font-medium">Only count complete records</p>
                    <p className="text-xs text-muted-foreground">
                      Cost, category and market: stops bare handles counting
                    </p>
                  </div>
                  <Switch checked={!!rule.quality_required}
                          onCheckedChange={v => setRule((x: any) => ({ ...x, quality_required: v }))} />
                </div>

                {today?.has_rule && (
                  /* This sentence was in a dashed box inside a panel that is itself a card:
                     three edges deep for one line of arithmetic. The box comes off. */
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {today.open_rounds} roster{today.open_rounds === 1 ? '' : 's'} open today,
                    target <strong className="text-foreground">{today.target}</strong> creators.
                  </p>
                )}

                <Button className="w-full" onClick={saveRule} disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          : <Save className="mr-1.5 h-4 w-4" />}Save rules
                </Button>
              </div>
            </Panel>
          )}
        </div>

        {/* Four numbers per person were packed into one line of prose under their address,
            which is four facts the eye has to parse a sentence to reach. They are columns:
            the same four numbers, in line with each other down the page, so "who is behind"
            is a glance rather than a read. Overdue first, because that is the only row on
            this table anybody has to do something about. */}
        <Panel title="The team this month" flush>
          {team.length > 0 ? (
            <div className="overflow-x-auto px-3 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Added</TableHead>
                    <TableHead>With a cost</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRanked.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                            {initials(m.email)}
                          </span>
                          <span className="font-medium">{m.email}</span>
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {String(m.staff_role || '').replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.added}</TableCell>
                      <TableCell>
                        <MiniBar value={m.costed} max={Math.max(1, m.added)}
                                 tone={m.overdue_rounds > 0 ? 'bad' : 'info'} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.open_rounds}</TableCell>
                      <TableCell className="text-right">
                        {m.overdue_rounds > 0
                          ? <ScoreDot value={m.overdue_rounds} tone="bad"
                                      title={`${m.overdue_rounds} overdue`} />
                          : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>Nobody has a staff role yet.</Empty>
          )}
        </Panel>
      </div>
    </SuperadminLayout>
  )
}
