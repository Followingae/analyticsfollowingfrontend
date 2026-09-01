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
import { ArrowLeft, ArrowRight, Building2, FileText, Layers, Megaphone, PhoneCall, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, PageHead, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { LogTouchDialog } from '@/components/superadmin/brands/LogTouchDialog'

const aed = (n: number | null | undefined) =>
  n == null ? '—' : `⃃ ${Number(n) >= 10000 ? `${Math.round(Number(n) / 1000)}K` : Math.round(Number(n)).toLocaleString()}`

const when = (iso: string | null) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// campaigns_status_check permits draft|active|completed|paused|cancelled only; 'in_progress'
// and 'live' were dead values that could never match a row.
const LIVE = ['active']

export default function BrandBrowsePage() {
  const { teamId } = useParams<{ teamId: string }>()
  const router = useRouter()
  const { canDestroy, can } = useAdminAccess()
  const canSource = can('influencers')
  const canCampaigns = can('campaigns')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [touchOpen, setTouchOpen] = useState(false)
  const [touches, setTouches] = useState<any[]>([])
  // A refused request and a client with nothing on them are different facts and must not
  // render the same sentence. Failure is held here so the screen can say the read failed,
  // rather than falling through to "Nothing to show." — which reads as a verdict on the
  // client every time the endpoint 500s.
  const [failure, setFailure] = useState<string | null>(null)

  const loadTouches = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/brands/${teamId}/touches`)
      if (res.ok) setTouches((await res.json()).data?.items || [])
    } catch { /* the record still reads without its conversations */ }
  }
  useEffect(() => { loadTouches() }, [teamId])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/admin/brands/${teamId}/browse`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not load this client'
        setFailure(msg)
        toast.error(msg)
      } finally { setLoading(false) }
    })()
  }, [teamId])

  if (loading) {
    return (
      <SuperadminLayout>
        {/* The loaded band draws no box per figure, so the skeleton does not promise one. */}
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-56 rounded-ds-lg" />
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
  if (failure) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-2">
          <p className="text-sm font-medium">Could not load this client.</p>
          <p className="text-sm text-muted-foreground">
            {failure}. This is not an all clear — no campaign, round, proposal or invoice
            below is known.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
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
      <div className="space-y-ds-5">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/work/brands')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All brands
          </Button>
          <PageHead
            title={brand.name}
            sub={`${brand.account_manager_email
              ? `Looked after by ${brand.account_manager_email}.`
              : 'No account manager assigned.'} Everything below opens where it lives.${
              canDestroy ? '' : ' A founder releases a brand to the talent team; the roster is open to you either way.'}`}
            action={
              <>
                {/* Recording that you spoke to them. The screen has always asked people to
                    do this and never had anywhere to do it. */}
                <Button onClick={() => setTouchOpen(true)}>
                  <PhoneCall className="mr-1.5 h-4 w-4" />I spoke to them
                </Button>
                {/* The next step after logging a brand is asking for creators, so it is a
                    button rather than something to go and find.
                    It used to send everybody to /work/sourcing, which only the influencers
                    module opens — business development, who log most of these brands, were
                    bounced straight back off it. Sourcing rounds are retired anyway; the
                    roster (Areas) is where this now happens, and Areas is opened by the
                    clients module as well, so nobody is thrown out of it.
                    Releasing a brand to the talent team is still a founder's call — that is
                    what the dialog on Areas is gated on — so the button that promises it is
                    only shown to a founder. Everyone else gets the roster itself, which is
                    a real destination rather than a promise the screen cannot keep. */}
                {canDestroy ? (
                  <Button variant="outline" onClick={() => router.push('/work/areas')}>
                    <Layers className="mr-1.5 h-4 w-4" />Start sourcing
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => router.push('/work/areas')}>
                    <Layers className="mr-1.5 h-4 w-4" />Open the brand roster
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.push(`/work/clients/${teamId}`)}>
                  Open client record
                </Button>
              </>
            }
          />
        </div>

        <StatGrid>
          <Stat label="Campaigns" value={campaigns.length} icon={Megaphone}
                hint={`${live.length} live right now`}
                // Same reason as the tile below: the campaign timeline is the campaigns
                // module, which business development do not hold.
                onClick={canCampaigns && campaigns[0]
                  ? () => router.push(`/work/campaigns/${campaigns[0].id}/timeline`) : undefined} />
          <Stat label="Sourcing rounds" value={rounds.length} icon={Layers}
                tone={openRounds.length ? 'info' : 'neutral'}
                hint={openRounds.length ? `${openRounds.length} still open` : 'None open'}
                // /work/sourcing is opened by the influencers module only, so for business
                // development this tile was a click into a bounce. No link is better than one
                // that throws you out.
                onClick={canSource ? () => router.push('/work/sourcing') : undefined} />
          <Stat label="Proposals" value={proposals.length} icon={FileText}
                hint={out.length ? `${out.length} with the client` : 'None waiting on them'}
                onClick={can('proposals') ? () => router.push('/work/proposals') : undefined} />
          <Stat label="Invoices" value={invoices.length} icon={Receipt}
                tone={unpaid.length ? 'warn' : 'good'}
                hint={invoices.length === 0 ? 'Not visible to your role, or none raised'
                      : unpaid.length ? `${unpaid.length} unpaid` : 'All settled'} />
        </StatGrid>

        <div className="grid items-start gap-ds-4 lg:grid-cols-2">
          {/* Conversations first: on most brands, most days, the last thing that happened
              was somebody talking to them — and until now that was the one thing the record
              could not show. Absent when there are none, like every other section here. */}
          {touches.length > 0 && (
            <Panel title="Conversations" description="What was said, and what we owe them next" flush>
              {touches.slice(0, 8).map((t: any) => (
                <Row
                  key={t.id}
                  tone={t.next_step_at && new Date(t.next_step_at).getTime() < Date.now() ? 'warn' : 'neutral'}
                  title={
                    <span className="flex items-center gap-2">
                      {String(t.channel || 'call').replace('whatsapp', 'WhatsApp')}
                      <span className="text-muted-foreground">· {when(t.happened_at)}</span>
                    </span>
                  }
                  meta={
                    <>
                      {t.by_email ? `${String(t.by_email).split('@')[0]}` : 'someone'}
                      {t.note ? ` · “${t.note}”` : ''}
                      {t.next_step ? ` · next: ${t.next_step}${t.next_step_at ? ` by ${when(t.next_step_at)}` : ''}` : ''}
                    </>
                  }
                />
              ))}
            </Panel>
          )}

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
                onClick={canCampaigns ? () => router.push(`/work/campaigns/${c.id}/timeline`) : undefined}
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
                  onClick={canSource ? () => router.push(`/work/sourcing/${r.id}`) : undefined}
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
                onClick={can('proposals') ? () => router.push(`/work/proposals/${p.id}`) : undefined}
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
                  onClick={() => router.push(`/work/clients/${teamId}`)}
                />
              )
            })}
            {invoices.length === 0 && (
              <Empty>No invoices — or your role does not see them.</Empty>
            )}
          </Panel>
        </div>
      </div>

      <LogTouchDialog
        teamId={String(teamId)}
        brandName={brand.name}
        open={touchOpen}
        onOpenChange={setTouchOpen}
        onLogged={loadTouches}
      />
    </SuperadminLayout>
  )
}
