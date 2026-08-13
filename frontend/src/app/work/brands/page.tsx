'use client'

/**
 * Brand heartbeat.
 *
 * Two facts decide everything on this screen: how long a client has been silent, and whose
 * turn it is. Deals rarely die from a decision — they die because it was nobody's turn and
 * nobody noticed. So silence is the sort order, and "us" is the state to clear first.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Building2, HeartPulse, PhoneOff, Plus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, PageHead, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import { NewOpportunityDialog } from '@/components/superadmin/brands/NewOpportunityDialog'

const HEALTH: Record<string, { label: string; cls: string; tone: Tone }> = {
  healthy: { label: 'Healthy', cls: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600', tone: 'good' },
  quiet:   { label: 'Going quiet', cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600', tone: 'warn' },
  at_risk: { label: 'At risk', cls: 'border-destructive/20 bg-destructive/10 text-destructive', tone: 'bad' },
  unknown: { label: 'No activity', cls: 'bg-muted text-muted-foreground', tone: 'neutral' },
}

const quiet = (d: number | null) =>
  d === null ? 'never' : d === 0 ? 'today' : d === 1 ? '1 day' : `${d} days`

export default function BrandsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'attention' | 'ours'>('all')
  const [newOpen, setNewOpen] = useState(false)

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/brands/heartbeat`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load brands')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const brands = useMemo(() => (data?.brands || []).filter((b: any) =>
    tab === 'all' ? true
    : tab === 'ours' ? b.whose_move !== 'client'
    : b.health !== 'healthy'), [data, tab])

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[116px]" />)}
          </div>
          <Skeleton className="h-[340px]" />
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">Nothing to show.</p></SuperadminLayout>
  }

  const s = data.summary || {}
  const ours = (data.brands || []).filter((b: any) => b.whose_move !== 'client').length

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title="Brands"
          sub="How long since anything moved, and who owes the next step. Silence is measured from real activity in the platform, so a conversation you had off-platform has to be logged to count."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />New opportunity
            </Button>
          }
        />

        <StatGrid>
          <Stat label="Active clients" value={s.total ?? 0} icon={Building2}
                hint={`${ours} waiting on us`} onClick={() => setTab('all')} />
          <Stat label="Healthy" value={s.healthy ?? 0} tone="good" icon={HeartPulse}
                hint="Something moved in the last week" />
          <Stat label="Going quiet" value={s.quiet ?? 0} tone={s.quiet ? 'warn' : 'neutral'}
                icon={PhoneOff} hint="One to two weeks of silence"
                onClick={() => setTab('attention')} />
          <Stat label="At risk" value={s.at_risk ?? 0} tone={s.at_risk ? 'bad' : 'neutral'}
                icon={TriangleAlert} hint="Over a fortnight — call, do not email"
                onClick={() => setTab('attention')} />
        </StatGrid>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All brands</TabsTrigger>
            <TabsTrigger value="attention">Needs attention</TabsTrigger>
            <TabsTrigger value="ours">Waiting on us</TabsTrigger>
          </TabsList>
        </Tabs>

        <Panel title="Heartbeat" description="Longest silence first" flush>
          {brands.map((b: any) => {
            const h = HEALTH[b.health as keyof typeof HEALTH] || HEALTH.unknown
            const open: string[] = []
            if (b.live_campaigns) open.push(`${b.live_campaigns} live`)
            if (b.open_rounds) open.push(`${b.open_rounds} round${b.open_rounds === 1 ? '' : 's'}`)
            if (b.awaiting_client_verdict) open.push(`${b.awaiting_client_verdict} awaiting verdict`)
            if (b.agreements_out) open.push('agreement out')
            if (b.unpaid_invoices) open.push(`${b.unpaid_invoices} unpaid`)
            return (
              <Row
                key={b.id}
                tone={h.tone}
                title={
                  <span className="flex items-center gap-2">
                    {b.name}
                    <Badge variant="outline" className={h.cls}>{quiet(b.days_quiet)} quiet</Badge>
                    {b.whose_move === 'client'
                      ? <Badge variant="outline">Their move</Badge>
                      : <Badge>Our move</Badge>}
                  </span>
                }
                meta={
                  <>
                    {b.account_manager_email || 'unassigned'}
                    {open.length > 0 && ` · ${open.join(' · ')}`}
                    {b.last_feedback && ` · “${b.last_feedback}”`}
                  </>
                }
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={() => router.push(`/work/brands/${b.id}`)}
              />
            )
          })}
          {brands.length === 0 && (
            <Empty>
              {tab === 'attention' ? 'Nobody needs chasing — every brand is warm.'
               : tab === 'ours' ? 'Nothing is waiting on us.'
               : 'No clients yet.'}
            </Empty>
          )}
        </Panel>
      </div>

      <NewOpportunityDialog open={newOpen} onOpenChange={setNewOpen} onCreated={load} />
    </SuperadminLayout>
  )
}
