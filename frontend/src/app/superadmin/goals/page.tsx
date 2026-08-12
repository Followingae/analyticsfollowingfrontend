'use client'

/**
 * Goals.
 *
 * Leadership sets two numbers a month; every daily target derives from how many sourcing
 * rounds are actually open. Pace is shown against elapsed time of day, so being part-way
 * through at lunchtime reads as on track rather than behind.
 */
import { useEffect, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Minus, Plus, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/goals`

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
      const [t, tm, r] = await Promise.all([
        api('/today'), api('/team'), api('/rules'),
      ])
      setToday(t.data)
      setTeam(tm.data?.people || [])
      setRule((r.data?.rules || []).find((x: any) => x.role_key === 'talent_manager') || null)
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

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }

  const p = today?.has_rule ? pace(today.done, today.target) : null
  const max = Math.max(1, ...(today?.trail || []).map((d: any) => d.count))

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set the rules once a month. Daily targets compute themselves from open sourcing rounds.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
          {canSet && rule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sourcing rules</CardTitle>
                <CardDescription>Applies to every talent manager this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {([
                  ['per_open_campaign', 'Per open round, per day', 'Until that roster locks'],
                  ['baseline_daily', 'When nothing is open', 'Baseline into the database'],
                ] as const).map(([k, title, sub]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8"
                              onClick={() => bump(k, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                      <span className="w-8 text-center text-lg font-semibold tabular-nums">
                        {rule[k]}
                      </span>
                      <Button size="icon" variant="outline" className="h-8 w-8"
                              onClick={() => bump(k, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-4 border-t pt-4">
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
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    {today.open_rounds} round{today.open_rounds === 1 ? '' : 's'} open today →
                    target <strong className="text-foreground">{today.target}</strong> creators.
                  </p>
                )}

                <Button className="w-full" onClick={saveRule} disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          : <Save className="mr-1.5 h-4 w-4" />}Save rules
                </Button>
              </CardContent>
            </Card>
          )}

          {today?.has_rule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today</CardTitle>
                <CardDescription>Measured against time of day, not raw percentage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-4xl font-semibold tabular-nums">{today.done}</p>
                    <p className="text-sm text-muted-foreground">of {today.target} creators</p>
                  </div>
                  {p && (
                    <Badge className={
                      p.tone === 'good' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : p.tone === 'warn' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'}>
                      {p.label}
                    </Badge>
                  )}
                </div>
                <Progress value={p?.pct ?? 0} className="h-2" />

                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Last 14 days</p>
                  <div className="flex h-16 items-end gap-1">
                    {(today.trail || []).map((d: any, i: number) => (
                      <div key={i} className="flex-1 rounded-sm bg-primary/25"
                           style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
                           title={`${d.date}: ${d.count}`} />
                    ))}
                    {(today.trail || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nothing added yet.</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {today.month_done} added this month · {today.open_rounds} rounds open
                  {today.quality_required && ' · only complete records count'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">The team this month</CardTitle>
            <CardDescription>Everyone with an internal role</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 pb-2 text-left font-medium">Person</th>
                    <th className="px-3 pb-2 text-left font-medium">Role</th>
                    <th className="px-3 pb-2 text-left font-medium">Added</th>
                    <th className="px-3 pb-2 text-left font-medium">With a cost</th>
                    <th className="px-3 pb-2 text-left font-medium">Open rounds</th>
                    <th className="px-6 pb-2 text-left font-medium">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-2.5 font-medium">{m.email}</td>
                      <td className="px-3 py-2.5 capitalize text-muted-foreground">
                        {String(m.staff_role || '').replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{m.added}</td>
                      <td className="px-3 py-2.5 tabular-nums">{m.costed}</td>
                      <td className="px-3 py-2.5 tabular-nums">{m.open_rounds}</td>
                      <td className="px-6 py-2.5">
                        {m.overdue_rounds > 0
                          ? <Badge variant="destructive">{m.overdue_rounds}</Badge>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {team.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No internal staff accounts yet.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}
