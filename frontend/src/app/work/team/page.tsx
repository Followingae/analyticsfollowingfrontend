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
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, Inbox, Layers as LayersIcon, UserRound } from 'lucide-react'
import { Empty, MiniBar, PageHead, Panel, Row, Stat, StatGrid } from '@/components/console/primitives'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Alert { level: 'critical' | 'warning' | 'info'; kind: string
                  title: string; detail: string; href: string | null }

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
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[116px]" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[280px]" /><Skeleton className="h-[280px]" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">Nothing to show.</p></SuperadminLayout>
  }

  const overdue = (data.rounds || []).filter((r: any) =>
    r.due_at && new Date(r.due_at).getTime() < Date.now()).length

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title="Creator team"
          sub="What is waiting on you, who is moving, and who is not. Alerts here are raised on a pattern rather than one slow afternoon, and they are private to leadership."
        />

        <StatGrid>
          <Stat label="Waiting on you" value={data.waiting.count} icon={Inbox}
                tone={data.waiting.count ? 'warn' : 'good'}
                hint={data.waiting.oldest ? `Oldest ${ago(data.waiting.oldest)}` : 'Nothing waiting'}
                onClick={() => router.push('/work/influencers/review')} />
          <Stat label="Rounds open" value={data.rounds.length} icon={LayersIcon}
                tone={overdue ? 'bad' : 'neutral'}
                hint={overdue ? `${overdue} overdue` : 'All on time'}
                onClick={() => router.push('/work/sourcing')} />
          <Stat label="Added this week" value={data.people.reduce((a: number, p: any) => a + (p.added_week || 0), 0)}
                icon={UserRound} hint="Across the whole team" />
          <Stat label="Alerts" value={data.alerts.length} icon={Bell}
                tone={data.alerts.length ? 'warn' : 'good'}
                hint="Private to leadership — the team never sees these" />
        </StatGrid>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel title="Alerts" description="Raised on a pattern, never on one slow afternoon" flush>
            {data.alerts.map((a: Alert, i: number) => (
              <Row
                key={i}
                tone={a.level === 'critical' ? 'bad' : a.level === 'warning' ? 'warn' : 'info'}
                title={a.title}
                meta={a.detail}
                right={a.href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : undefined}
                onClick={a.href ? () => router.push(a.href!) : undefined}
              />
            ))}
            {data.alerts.length === 0 && <Empty>Nothing needs attention.</Empty>}
          </Panel>

          <Panel title="Your people" description="This month, and what is in their queue" flush>
            {data.people.map((p: any) => (
              <Row
                key={p.id}
                tone={p.overdue_rounds > 0 ? 'bad'
                      : p.added_week === 0 && p.staff_role === 'talent_manager' ? 'warn' : 'good'}
                title={
                  <span className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[11px] font-semibold">
                        {initials(p.email)}
                      </AvatarFallback>
                    </Avatar>
                    {p.email}
                  </span>
                }
                meta={
                  <span className="pl-[38px] capitalize">
                    {String(p.staff_role || '').replace(/_/g, ' ')} · {p.added_month} this month
                    {p.open_rounds > 0 && ` · ${p.open_rounds} round${p.open_rounds === 1 ? '' : 's'}`}
                  </span>
                }
                right={
                  p.overdue_rounds > 0
                    ? <Badge variant="destructive">{p.overdue_rounds} overdue</Badge>
                    : p.added_week === 0 && p.staff_role === 'talent_manager'
                      ? <Badge variant="secondary" className="text-amber-600">Quiet week</Badge>
                      : <Badge variant="outline" className="text-emerald-600">Moving</Badge>
                }
              />
            ))}
            {data.people.length === 0 && <Empty>No internal staff accounts yet.</Empty>}
          </Panel>
        </div>

        <Panel title="Rounds open now" description="Soonest due first" flush>
          {data.rounds.map((r: any) => {
            const late = r.due_at && new Date(r.due_at).getTime() < Date.now()
            return (
              <Row
                key={r.id}
                tone={late ? 'bad' : r.awaiting_review > 0 ? 'warn' : 'info'}
                title={r.title}
                meta={
                  <>
                    Round {r.round_no} · {r.owner_email || 'unassigned'}
                    {r.awaiting_review > 0 && ` · ${r.awaiting_review} awaiting your review`}
                  </>
                }
                right={
                  <>
                    <span className="hidden sm:block">
                      <MiniBar value={r.proposed} max={r.target_count || r.proposed || 1}
                               tone={late ? 'bad' : 'info'} />
                    </span>
                    <Badge variant={late ? 'destructive' : 'outline'} className="gap-1">
                      <Clock className="h-3 w-3" />
                      {r.due_at ? new Date(r.due_at).toLocaleDateString('en-GB',
                        { day: 'numeric', month: 'short' }) : 'no date'}
                    </Badge>
                  </>
                }
                onClick={() => router.push(`/work/sourcing/${r.id}`)}
              />
            )
          })}
          {data.rounds.length === 0 && <Empty>No rounds open.</Empty>}
        </Panel>
      </div>
    </SuperadminLayout>
  )
}
