'use client'

/**
 * One brand, everything under it.
 *
 * The heartbeat could tell you a client had "2 live, 1 unpaid" and then left you to go and
 * find them — every screen owned its own slice, so reading a client meant already knowing
 * which screen to open. This is the other half: each count becomes a list, and each row
 * opens the screen that owns it. Campaigns go to the timeline, rounds to the round, invoices
 * to the client's commercial tab.
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ArrowRight, Building2, FileText, Layers, Megaphone, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, PageHead, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'

const aed = (n: number | null | undefined) =>
  n == null ? '—' : `د.إ ${Number(n) >= 10000 ? `${Math.round(Number(n) / 1000)}K` : Math.round(Number(n)).toLocaleString()}`

const when = (iso: string | null) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const LIVE = ['active', 'in_progress', 'live']

export default function BrandBrowsePage() {
  const { teamId } = useParams<{ teamId: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/admin/brands/${teamId}/browse`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load this client')
      } finally { setLoading(false) }
    })()
  }, [teamId])

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[116px]" />)}
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">Nothing to show.</p></SuperadminLayout>
  }

  const { brand, campaigns = [], rounds = [], proposals = [], invoices = [] } = data
  const live = campaigns.filter((c: any) => LIVE.includes(String(c.status)))
  const openRounds = rounds.filter((r: any) => !['locked', 'dropped'].includes(String(r.status)))
  const out = proposals.filter((p: any) => p.status === 'sent')
  const unpaid = invoices.filter((i: any) => i.status !== 'paid')

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/work/brands')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All brands
          </Button>
          <PageHead
            title={brand.name}
            sub={brand.account_manager_email
              ? `Looked after by ${brand.account_manager_email}. Everything below opens where it lives.`
              : 'No account manager assigned. Everything below opens where it lives.'}
            action={
              <Button variant="outline" onClick={() => router.push(`/superadmin/clients/${teamId}`)}>
                Open client record
              </Button>
            }
          />
        </div>

        <StatGrid>
          <Stat label="Campaigns" value={campaigns.length} icon={Megaphone}
                hint={`${live.length} live right now`} />
          <Stat label="Sourcing rounds" value={rounds.length} icon={Layers}
                tone={openRounds.length ? 'info' : 'neutral'}
                hint={openRounds.length ? `${openRounds.length} still open` : 'None open'} />
          <Stat label="Proposals" value={proposals.length} icon={FileText}
                hint={out.length ? `${out.length} with the client` : 'None waiting on them'} />
          <Stat label="Invoices" value={invoices.length} icon={Receipt}
                tone={unpaid.length ? 'warn' : 'good'}
                hint={invoices.length === 0 ? 'Not visible to your role, or none raised'
                      : unpaid.length ? `${unpaid.length} unpaid` : 'All settled'} />
        </StatGrid>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel title="Campaigns" description="Newest first — opens the campaign's whole story" flush>
            {campaigns.map((c: any) => (
              <Row
                key={c.id}
                tone={LIVE.includes(String(c.status)) ? 'good' : 'neutral'}
                title={c.name}
                meta={
                  <>
                    {String(c.status || '').replace(/_/g, ' ')}
                    {c.campaign_type ? ` · ${c.campaign_type}` : ''}
                    {` · ${c.posts} post${c.posts === 1 ? '' : 's'}`}
                    {` · updated ${when(c.updated_at)}`}
                  </>
                }
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={() => router.push(`/superadmin/campaigns/${c.id}/timeline`)}
              />
            ))}
            {campaigns.length === 0 && <Empty>No campaigns yet.</Empty>}
          </Panel>

          <Panel title="Sourcing rounds" description="Every request for creators on this brand" flush>
            {rounds.map((r: any) => {
              const closed = ['locked', 'dropped'].includes(String(r.status))
              const late = r.due_at && !closed && new Date(r.due_at).getTime() < Date.now()
              return (
                <Row
                  key={r.id}
                  tone={late ? 'bad' : closed ? 'neutral' : 'info'}
                  title={`${r.title} · round ${r.round_no}`}
                  meta={
                    <>
                      {String(r.status || '').replace(/_/g, ' ')}
                      {` · ${r.proposed}${r.target_count ? ` of ${r.target_count}` : ''} proposed`}
                      {r.owner_email ? ` · ${r.owner_email}` : ' · unassigned'}
                      {r.due_at ? ` · due ${when(r.due_at)}` : ''}
                    </>
                  }
                  right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  onClick={() => router.push(`/work/sourcing/${r.id}`)}
                />
              )
            })}
            {rounds.length === 0 && <Empty>No sourcing rounds for this brand.</Empty>}
          </Panel>

          <Panel title="Proposals" description="What we have sent, and how it ended" flush>
            {proposals.map((p: any) => (
              <Row
                key={p.id}
                tone={p.status === 'sent' ? 'info'
                      : p.status === 'approved' || p.status === 'internally_approved' ? 'good'
                      : p.status === 'rejected' ? 'bad' : 'neutral'}
                title={p.title || 'Untitled proposal'}
                meta={
                  <>
                    {String(p.status || '').replace(/_/g, ' ')}
                    {p.total_sell_amount != null ? ` · ${aed(p.total_sell_amount)}` : ''}
                    {` · updated ${when(p.updated_at)}`}
                  </>
                }
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={() => router.push(`/superadmin/proposals/${p.id}`)}
              />
            ))}
            {proposals.length === 0 && <Empty>Nothing sent to this brand yet.</Empty>}
          </Panel>

          <Panel title="Invoices" description="Raised against this client" flush>
            {invoices.map((i: any) => {
              const overdue = i.status !== 'paid' && i.due_date &&
                new Date(i.due_date).getTime() < Date.now()
              return (
                <Row
                  key={i.id}
                  tone={i.status === 'paid' ? 'good' : overdue ? 'bad' : 'warn'}
                  title={`${aed(i.amount_aed)} · ${String(i.status || '').replace(/_/g, ' ')}`}
                  meta={
                    <>
                      {i.due_date ? `due ${when(i.due_date)}` : 'no due date'}
                      {i.paid_at ? ` · paid ${when(i.paid_at)}` : ''}
                      {overdue ? ' · overdue' : ''}
                    </>
                  }
                  right={<Badge variant="outline">{i.status === 'paid' ? 'Paid' : 'Open'}</Badge>}
                  onClick={() => router.push(`/superadmin/clients/${teamId}`)}
                />
              )
            })}
            {invoices.length === 0 && (
              <Empty>No invoices — or your role does not see them.</Empty>
            )}
          </Panel>
        </div>
      </div>
    </SuperadminLayout>
  )
}
