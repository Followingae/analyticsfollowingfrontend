'use client'

/**
 * Brand heartbeat.
 *
 * Two facts decide everything on this screen: how long a client has been silent, and whose
 * turn it is. Deals rarely die from a decision — they die because it was nobody's turn and
 * nobody noticed. So silence is the sort order, and "us" is the state to clear first.
 */
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Building2, HeartPulse, PhoneOff, Plus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import { ClientsHubHeader } from '@/components/console/ClientsHubHeader'
import { NewOpportunityDialog } from '@/components/superadmin/brands/NewOpportunityDialog'

/* The badge skins were a fourth set of hand-picked palette steps — emerald-500/10 here,
   #E9F5E5 on Today, emerald-950/50 elsewhere — so "healthy" was three slightly different
   greens depending which screen you were standing on. They now name the console tone
   tokens, which are decided once and are scoped to the console shell by construction. */
const HEALTH: Record<string, { label: string; cls: string; tone: Tone }> = {
  healthy: { label: 'Healthy', cls: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]', tone: 'good' },
  quiet:   { label: 'Going quiet', cls: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]', tone: 'warn' },
  at_risk: { label: 'At risk', cls: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]', tone: 'bad' },
  unknown: { label: 'No activity', cls: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]', tone: 'neutral' },
}

/**
 * A summary figure that never arrived is a dash, not a zero.
 *
 * The four tiles read `s.total ?? 0`, and `s` is `data.summary || {}`. So a response that
 * came back without a summary block — or missing one field of it — printed confident
 * zeroes: no active clients, none healthy, none at risk. "Nothing is wrong" and "we never
 * managed to ask" looked identical, on a screen whose entire job is to be glanced at and
 * believed. A real zero still prints 0.
 */
const num = (v: number | null | undefined) => (v == null ? '—' : v)

const quiet = (d: number | null) =>
  d === null ? 'never' : d === 0 ? 'today' : d === 1 ? '1 day' : `${d} days`

/** Reading the query needs a boundary in Next 15; the page itself is unchanged. */
export default function BrandsPageWrapper() {
  return <Suspense fallback={null}><BrandsPage /></Suspense>
}

function BrandsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // "Log a brand" on Today used to land here and stop — the actual form was a second button
  // called something else. Arriving with ?new=1 opens it.
  const params = useSearchParams()
  const [newOpen, setNewOpen] = useState(params?.get('new') === '1')
  // Which slice you were reading. It lived in state only, so opening a brand and pressing
  // "All brands" put you back on All every time, however you had filtered.
  const asked = params?.get('tab')
  const [tab, setTab] = useState<'all' | 'attention' | 'ours'>(
    asked === 'attention' || asked === 'ours' ? asked : 'all')

  /** The slice you were reading, kept in the URL so returning from a brand restores it. */
  const switchTab = (v: 'all' | 'attention' | 'ours') => {
    setTab(v)
    router.replace(v === 'all' ? '/work/brands' : `/work/brands?tab=${v}`, { scroll: false })
  }

  // A refused request and an empty client list are different facts and must not
  // render the same. Failure is held here so the page can say the read failed,
  // rather than falling through to "Nothing to show." — which would report an
  // agency with no clients every time the endpoint 500s.
  const [failure, setFailure] = useState<string | null>(null)

  const load = async () => {
    setFailure(null)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/brands/heartbeat`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load brands'
      setFailure(msg)
      toast.error(msg)
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
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-40 rounded-ds-lg" />
          {/* The band this stands in for no longer draws a box per figure, so neither does
              the skeleton: label, number and hint at the gap the real StatGrid uses, rather
              than four filled tiles promising an edge the loaded screen never draws. */}
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-9 w-20 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[340px] rounded-ds-2xl" />
        </div>
      </SuperadminLayout>
    )
  }
  if (failure) {
    return (
      <SuperadminLayout>
        <div className="space-y-3">
          <p className="text-sm font-medium">Could not load the client list.</p>
          <p className="text-sm text-muted-foreground">
            {failure}. This is not an all clear, and nothing below is known.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
            Try again
          </Button>
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">No clients yet.</p></SuperadminLayout>
  }

  const s = data.summary || {}
  const ours = (data.brands || []).filter((b: any) => b.whose_move !== 'client').length

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <ClientsHubHeader
          note="How long since anything moved, and who owes the next step. Silence is measured from real activity in the platform, so a conversation you had off-platform has to be logged to count."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />Log a new brand
            </Button>
          }
        />

        <StatGrid>
          <Stat label="Active clients" value={num(s.total)} icon={Building2}
                hint={`${ours} waiting on us`} onClick={() => setTab('all')} />
          <Stat label="Healthy" value={num(s.healthy)} tone="good" icon={HeartPulse}
                hint="Something moved in the last week" />
          <Stat label="Going quiet" value={num(s.quiet)} tone={s.quiet ? 'warn' : 'neutral'}
                icon={PhoneOff} hint="One to two weeks of silence"
                onClick={() => setTab('attention')} />
          <Stat label="At risk" value={num(s.at_risk)} tone={s.at_risk ? 'bad' : 'neutral'}
                icon={TriangleAlert} hint="Over a fortnight: call, do not email"
                onClick={() => setTab('attention')} />
        </StatGrid>

        <Tabs value={tab} onValueChange={v => switchTab(v as typeof tab)}>
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
              {tab === 'attention' ? 'Nobody needs chasing. Every brand is warm.'
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
