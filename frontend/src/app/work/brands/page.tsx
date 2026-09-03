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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ArrowRight, Building2, PhoneOff, Plus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import {
  Empty, Panel, ScoreDot, Stat, StatGrid, type Tone,
} from '@/components/console/primitives'
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
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => (
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
          note="Silence is measured from activity in here. If you spoke to them, log it."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />Log a new brand
            </Button>
          }
        />

        {/* Two figures, not four.
            "Active clients" is the count the hub header above already prints, and "Healthy"
            is the total minus the two below it: a number nobody has ever acted on, sitting
            in the second most prominent position on the screen. What is left is the two
            states somebody has to do something about. */}
        <StatGrid cols={3}>
          <Stat label="Gone quiet" value={num(s.quiet)} tone={s.quiet ? 'warn' : 'neutral'}
                icon={PhoneOff} hint="A week or more"
                onClick={() => switchTab('attention')} />
          <Stat label="At risk" value={num(s.at_risk)} tone={s.at_risk ? 'bad' : 'neutral'}
                icon={TriangleAlert} hint="Two weeks. Call them"
                onClick={() => switchTab('attention')} />
          <Stat label="Waiting on us" value={ours} tone={ours ? 'warn' : 'good'}
                icon={Building2} hint={`Of ${num(s.total)} on the books`}
                onClick={() => switchTab('ours')} />
        </StatGrid>

        {/* The filter used to be a second tab row underneath the hub's own, which is two
            identical-looking strips doing two different jobs. It belongs to the list, so it
            sits in the list's header. */}
        <Panel
          title="Brands"
          description="Longest silence first"
          action={
            <ToggleGroup type="single" value={tab} size="sm" variant="outline"
                         onValueChange={(v: string) => { if (v) switchTab(v as typeof tab) }}>
              <ToggleGroupItem value="all" aria-label="Every brand">All</ToggleGroupItem>
              <ToggleGroupItem value="attention" aria-label="Brands that need chasing">
                Needs chasing
              </ToggleGroupItem>
              <ToggleGroupItem value="ours" aria-label="Brands waiting on us">Ours</ToggleGroupItem>
            </ToggleGroup>
          }
          flush
        >
          {brands.length > 0 ? (
            /* Seven facts a row is not a sentence, it is a table. The run-on meta line put
               the account manager, up to five open items and the client's last words behind
               a middot each, so the one that matters was found by reading rather than by
               looking down a column. */
            <div className="overflow-x-auto px-3 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Silent</TableHead>
                    <TableHead>Whose move</TableHead>
                    <TableHead>Account manager</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead className="min-w-[180px]">Last word</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((b: any) => {
                    const h = HEALTH[b.health as keyof typeof HEALTH] || HEALTH.unknown
                    const open: string[] = []
                    if (b.live_campaigns) open.push(`${b.live_campaigns} live`)
                    if (b.open_rounds) open.push(`${b.open_rounds} roster${b.open_rounds === 1 ? '' : 's'}`)
                    if (b.awaiting_client_verdict) open.push(`${b.awaiting_client_verdict} awaiting verdict`)
                    if (b.agreements_out) open.push('agreement out')
                    if (b.unpaid_invoices) open.push(`${b.unpaid_invoices} unpaid`)
                    return (
                      <TableRow key={b.id} className="cursor-pointer"
                                onClick={() => router.push(`/work/brands/${b.id}`)}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>
                          {/* The number of days is the fact the whole screen is sorted on,
                              so it is the mark, not a phrase inside a badge. */}
                          <span className="flex items-center gap-2">
                            <ScoreDot
                              value={b.days_quiet == null ? '?' : b.days_quiet}
                              suffix={b.days_quiet == null ? undefined : 'd'}
                              tone={h.tone}
                              title={`${quiet(b.days_quiet)} since anything moved`}
                            />
                            <span className="hidden text-xs text-muted-foreground lg:inline">
                              {h.label}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          {b.whose_move === 'client'
                            ? <Badge variant="outline">Theirs</Badge>
                            : <Badge>Ours</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {b.account_manager_email || 'unassigned'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {open.length ? open.join(' · ') : '–'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="block max-w-[24rem] truncate"
                                title={b.last_feedback || undefined}>
                            {b.last_feedback ? `“${b.last_feedback}”` : '–'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              {tab === 'attention' ? 'Nobody needs chasing. Every brand is warm.'
               : tab === 'ours' ? 'Nothing is waiting on us.'
               : 'No brands logged yet.'}
            </Empty>
          )}
        </Panel>
      </div>

      <NewOpportunityDialog open={newOpen} onOpenChange={setNewOpen} onCreated={load} />
    </SuperadminLayout>
  )
}
