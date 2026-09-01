'use client'

/**
 * Goals.
 *
 * Leadership sets two numbers a month; every daily target derives from how many sourcing
 * rounds are actually open. Pace is shown against elapsed time of day, so being part-way
 * through at lunchtime reads as on track rather than behind.
 */
import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Minus, Plus, Loader2, Save, Target, Layers, CalendarDays, Users } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { Empty, MiniBar, PageHead, Panel, Row, Stat, StatGrid } from '@/components/console/primitives'

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
  const { isSuperAdmin, isFullAccessStaff } = useAdminAccess()
  const canSet = isSuperAdmin || isFullAccessStaff

  const [today, setToday] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [rule, setRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      // allSettled, not all: /team is leadership-only, so for a talent manager the 403
      // rejected the whole batch and the screen that tells them their daily target rendered
      // completely empty. One forbidden panel must not take the page with it.
      const [t, tm, r] = await Promise.allSettled([api('/today'), api('/team'), api('/rules')])
        .then(rs => rs.map(x => x.status === 'fulfilled' ? x.value : null))
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
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
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
          title="Goals"
          sub="Set the rules once a month. Daily targets compute themselves from how many sourcing rounds are actually open, so nobody is chasing an arbitrary number."
        />

        {today?.has_rule && (
          <StatGrid>
            <Stat label="Today's target" value={today.target} icon={Target}
                  hint={`${today.open_rounds} round${today.open_rounds === 1 ? '' : 's'} open right now`} />
            <Stat label="Added today" value={today.done} icon={Users}
                  tone={p?.tone === 'good' ? 'good' : p?.tone === 'warn' ? 'warn' : p?.tone === 'bad' ? 'bad' : 'neutral'}
                  hint={p?.label} />
            <Stat label="This month" value={today.month_done} icon={CalendarDays}
                  hint={today.quality_required ? 'Only complete records count' : 'All records count'} />
            <Stat label="Open rounds" value={today.open_rounds} icon={Layers}
                  hint="Each one raises today's target" />
          </StatGrid>
        )}

        <div className="grid items-start gap-ds-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Last 14 days" description="Creators added, against the daily target">
            {trail.length > 0 ? (
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
                  <Area dataKey="count" type="monotone" stroke="var(--color-count)"
                        strokeWidth={2} fill="url(#goalFill)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <Empty>Nothing added yet.</Empty>
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
                  ['per_open_campaign', 'Per open round, per day', 'Until that roster locks'],
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
                      Cost, category and market — stops bare handles counting
                    </p>
                  </div>
                  <Switch checked={!!rule.quality_required}
                          onCheckedChange={v => setRule((x: any) => ({ ...x, quality_required: v }))} />
                </div>

                {today?.has_rule && (
                  /* This sentence was in a dashed box inside a panel that is itself a card:
                     three edges deep for one line of arithmetic. The box comes off. */
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {today.open_rounds} round{today.open_rounds === 1 ? '' : 's'} open today →
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

        <Panel title="The team this month" description="Everyone with an internal role" flush>
          {team.map(m => (
            <Row
              key={m.id}
              tone={m.overdue_rounds > 0 ? 'bad' : m.added > 0 ? 'good' : 'neutral'}
              title={
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                    {initials(m.email)}
                  </span>
                  {m.email}
                  <span className="text-xs font-normal capitalize text-muted-foreground">
                    {String(m.staff_role || '').replace(/_/g, ' ')}
                  </span>
                </span>
              }
              meta={
                <span className="pl-[38px]">
                  {m.added} added this month · {m.costed} with a cost · {m.open_rounds} open round
                  {m.open_rounds === 1 ? '' : 's'}
                  {m.overdue_rounds > 0 && ` · ${m.overdue_rounds} overdue`}
                </span>
              }
              right={<MiniBar value={m.costed} max={Math.max(1, m.added)}
                              tone={m.overdue_rounds > 0 ? 'bad' : 'info'} />}
            />
          ))}
          {team.length === 0 && <Empty>No internal staff accounts yet.</Empty>}
        </Panel>
      </div>
    </SuperadminLayout>
  )
}
