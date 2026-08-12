'use client'

/**
 * The creator-team console.
 *
 * A queue you own instead of an inbox you drown in: what is waiting on you, who is moving,
 * and the few things that are genuinely off. Alerts fire on patterns, never on single events.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, AlertTriangle, Info, AlertCircle, ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Alert { level: 'critical' | 'warning' | 'info'; kind: string
                  title: string; detail: string; href: string | null }

const LEVEL = {
  critical: { Icon: AlertCircle, cls: 'text-destructive', badge: 'destructive' as const, label: 'Overdue' },
  warning:  { Icon: AlertTriangle, cls: 'text-amber-600', badge: 'secondary' as const, label: 'Watch' },
  info:     { Icon: Info, cls: 'text-muted-foreground', badge: 'outline' as const, label: 'Note' },
}

const initials = (email: string) => email.slice(0, 2).toUpperCase()
const ago = (iso: string | null) => {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return d < 1 ? 'today' : d === 1 ? '1 day' : `${d} days`
}

export default function TeamConsolePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/team-console`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load the console')
      } finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }
  if (!data) return <SuperadminLayout><p className="text-sm">Nothing to show.</p></SuperadminLayout>

  const overdue = (data.rounds || []).filter((r: any) =>
    r.due_at && new Date(r.due_at).getTime() < Date.now()).length

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Creator team</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            What is waiting on you, who is moving, and what is not.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Waiting on you</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{data.waiting.count}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.waiting.oldest ? `oldest ${ago(data.waiting.oldest)}` : 'nothing waiting'}
            </p>
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rounds open</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{data.rounds.length}</p>
            <p className="mt-2 text-xs">
              {overdue > 0
                ? <span className="font-medium text-destructive">{overdue} overdue</span>
                : <span className="text-muted-foreground">all on time</span>}
            </p>
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Added this week</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {data.people.reduce((a: number, p: any) => a + (p.added_week || 0), 0)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">across the team</p>
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Alerts</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{data.alerts.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">private to leadership</p>
          </CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alerts</CardTitle>
              <CardDescription>Raised on a pattern, never on one slow afternoon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-0">
              {data.alerts.map((a: Alert, i: number) => {
                const L = LEVEL[a.level]
                return (
                  <div key={i} className="flex items-start gap-3 border-t px-6 py-3 first:border-t-0">
                    <L.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${L.cls}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    {a.href && (
                      <Button size="sm" variant="ghost" onClick={() => router.push(a.href!)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
              {data.alerts.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nothing needs attention.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your people</CardTitle>
              <CardDescription>This month, and what is in their queue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-0">
              {data.people.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 border-t px-6 py-3.5 first:border-t-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[11px] font-semibold">
                      {initials(p.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {String(p.staff_role || '').replace(/_/g, ' ')} · {p.added_month} this month
                      {p.open_rounds > 0 && ` · ${p.open_rounds} round${p.open_rounds === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  {p.overdue_rounds > 0
                    ? <Badge variant="destructive">{p.overdue_rounds} overdue</Badge>
                    : p.added_week === 0 && p.staff_role === 'talent_manager'
                      ? <Badge variant="secondary" className="text-amber-600">Quiet week</Badge>
                      : <Badge variant="outline" className="text-emerald-600">Moving</Badge>}
                </div>
              ))}
              {data.people.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No internal staff accounts yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rounds open now</CardTitle>
            <CardDescription>Soonest due first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 px-0">
            {data.rounds.map((r: any) => {
              const late = r.due_at && new Date(r.due_at).getTime() < Date.now()
              const pct = r.target_count ? Math.min(100, (r.proposed / r.target_count) * 100) : 0
              return (
                <button key={r.id}
                  onClick={() => router.push(`/superadmin/sourcing/${r.id}`)}
                  className="flex w-full items-center gap-4 border-t px-6 py-3.5 text-left first:border-t-0 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Round {r.round_no} · {r.owner_email || 'unassigned'}
                      {r.awaiting_review > 0 && ` · ${r.awaiting_review} awaiting your review`}
                    </p>
                  </div>
                  <div className="hidden w-40 sm:block">
                    <Progress value={pct} className="h-2" />
                    <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
                      {r.proposed}{r.target_count ? ` of ${r.target_count}` : ''}
                    </p>
                  </div>
                  <Badge variant={late ? 'destructive' : 'outline'} className="gap-1">
                    <Clock className="h-3 w-3" />
                    {r.due_at ? new Date(r.due_at).toLocaleDateString('en-GB',
                      { day: 'numeric', month: 'short' }) : 'no date'}
                  </Badge>
                </button>
              )
            })}
            {data.rounds.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No rounds open.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}
