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
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ArrowRight, Layers, PhoneCall } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import {
  Aed, Empty, FieldStrip, PageHead, Panel, Row, type Tone,
} from '@/components/console/primitives'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { LogTouchDialog } from '@/components/superadmin/brands/LogTouchDialog'

/**
 * Money on this record: the mark and the figure, or a dash where we were told nothing.
 *
 * The console has one way to write a dirham and this screen was not using it: the figure was
 * assembled into a plain string, which is how a bare U+20C3 came to ship here and render as
 * an empty box. `Aed` names the Dirham face on the element itself, which is the only
 * arrangement that survives a page with its own font stack.
 */
const Money = ({ value }: { value: number | null | undefined }) => {
  if (value == null) return <>—</>
  const n = Number(value)
  return <Aed>{n >= 10000 ? `${Math.round(n / 1000)}K` : Math.round(n).toLocaleString()}</Aed>
}

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
          {/* The loaded record opens with a strip of labelled facts, so the skeleton
              stands in for that rather than for a band of big numbers. */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-ds-1">
                <Skeleton className="h-3 w-20 rounded-ds-sm" />
                <Skeleton className="h-4 w-28 rounded-ds-sm" />
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
            {failure}. This is not an all clear. No campaign, round, proposal or invoice
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

  const { brand, campaigns = [], areas = [], proposals = [], invoices = [] } = data
  const live = campaigns.filter((c: any) => LIVE.includes(String(c.status)))
  const openAreas = areas.filter((r: any) => !r.locked_at && !r.archived_at)
  const openArea = openAreas[0]
  /**
   * Everything the sourcing screen needs to open on this brand instead of asking who it is.
   * The id does the work; the name is carried only so Areas can say the brand's name before
   * its own client list has come back.
   */
  const areasHref = (extra = '') =>
    `/work/areas?team=${encodeURIComponent(String(teamId))}` +
    `&brand=${encodeURIComponent(String(brand.name ?? ''))}${extra}`
  const out = proposals.filter((p: any) => p.status === 'sent')
  const unpaid = invoices.filter((i: any) => i.status !== 'paid')

  /**
   * Everything on this client that is past a date, from all five lists at once.
   *
   * Each of these already existed somewhere below, carried by a tone dot inside whichever
   * panel owned it, so reading "is anything late on this client" meant scanning five lists
   * and knowing which colour meant what. The lists keep every row they had; this only lifts
   * the late ones to the top.
   */
  const overdueItems: {
    tone: Tone; title: React.ReactNode; meta: React.ReactNode; onClick?: () => void
  }[] = []
  for (const t of touches) {
    if (t.next_step_at && new Date(t.next_step_at).getTime() < Date.now()) {
      overdueItems.push({
        tone: 'warn',
        title: t.next_step || 'A next step we promised',
        meta: `Owed since ${when(t.next_step_at)}${t.by_email ? ` · ${String(t.by_email).split('@')[0]}` : ''}`,
      })
    }
  }
  for (const r of areas) {
    const closed = !!r.locked_at || !!r.archived_at
    if (!closed && r.due_at && new Date(r.due_at).getTime() < Date.now()) {
      overdueItems.push({
        tone: 'bad',
        title: `${r.title} was wanted by ${when(r.due_at)}`,
        meta: `${r.proposed}${r.target_count ? ` of ${r.target_count}` : ''} found · ${r.owner_email || 'unassigned'}`,
        onClick: canSource ? () => router.push(`/work/areas/${r.id}`) : undefined,
      })
    }
  }
  for (const i of invoices) {
    if (i.status !== 'paid' && i.due_date && new Date(i.due_date).getTime() < Date.now()) {
      overdueItems.push({
        tone: 'bad',
        title: <span className="flex items-center gap-2"><Money value={i.amount_aed} /> overdue</span>,
        meta: `Was due ${when(i.due_date)}`,
        onClick: () => router.push(`/work/clients/${teamId}?tab=commercial`),
      })
    }
  }

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
                    module opened, so business development, who log most of these brands, were
                    bounced straight back off it. Sourcing rounds are retired anyway; the
                    roster (Areas) is where this now happens, and Areas is opened by the
                    clients module as well, so nobody is thrown out of it.
                    Releasing a brand to the talent team is still a founder's call, which is
                    what the dialog on Areas is gated on, so the button that promises it is
                    only shown to a founder. Everyone else gets the roster itself, which is
                    a real destination rather than a promise the screen cannot keep. */}
                {openArea ? (
                  /* One area per brand: the server refuses a second one. Offering "Start
                     sourcing" here was offering a 409 — the brand is already released and
                     the only thing anyone wants is the roster itself. */
                  <Button variant="outline" onClick={() => router.push(`/work/areas/${openArea.id}`)}>
                    <Layers className="mr-1.5 h-4 w-4" />Open the sourcing area
                  </Button>
                ) : canDestroy ? (
                  <Button variant="outline" onClick={() => router.push(areasHref('&start=1'))}>
                    <Layers className="mr-1.5 h-4 w-4" />Start sourcing
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => router.push(areasHref())}>
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

        {/* A record opens with facts about the record, not with four dashboard tiles.
            Each tile here was a count with a hint restating the panel directly underneath
            it: "Campaigns 7 / 2 live right now" sat above a Campaigns panel whose rows each
            say whether they are live. Five labelled facts in one line, and the lists below
            keep every click the tiles carried. */}
        <FieldStrip fields={[
          { label: 'Account manager', value: brand.account_manager_email || 'Unassigned' },
          { label: 'Live', value: `${live.length} of ${campaigns.length}` },
          { label: 'Rosters', value: openAreas.length ? `${openAreas.length} open` : 'None open' },
          { label: 'Quotes out', value: out.length },
          {
            label: 'Unpaid',
            value: invoices.length === 0
              ? '—'
              : unpaid.length
                ? <span className="text-[var(--tone-bad-ink)]">{unpaid.length}</span>
                : 'All settled',
          },
        ]} />

        {/* What is actually late, gathered from the five lists below it. Every one of these
            facts was already on the screen, each buried in the third or fourth panel behind
            a tone dot. Not drawn at all when nothing is late. */}
        {overdueItems.length > 0 && (
          <Panel title="Needs you" className="bg-[var(--tone-warn-wash)]" flush>
            {overdueItems.map((o, i) => (
              <Row key={i} tone={o.tone} title={o.title} meta={o.meta}
                   right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                   onClick={o.onClick} />
            ))}
          </Panel>
        )}

        <div className="grid items-start gap-ds-4 lg:grid-cols-2">
          {/* Conversations first: on most brands, most days, the last thing that happened
              was somebody talking to them — and until now that was the one thing the record
              could not show. Absent when there are none, like every other section here. */}
          {touches.length > 0 && (
            <Panel
              title="Conversations"
              description="What we owe them next"
              action={
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs"
                        onClick={() => setTouchOpen(true)}>
                  <PhoneCall className="h-3 w-3" />Log a call
                </Button>
              }
              flush
            >
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

          {/* The tile that used to sit above this list carried one destination the rows do
              not: the client record's own campaigns tab. It moves here rather than going. */}
          <Panel
            title="Campaigns"
            action={canCampaigns && campaigns.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                      onClick={() => router.push(`/work/clients/${teamId}?tab=campaigns`)}>
                All {campaigns.length}
              </Button>
            ) : undefined}
            flush
          >
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
            {campaigns.length === 0 && <Empty>Nothing running for them yet.</Empty>}
          </Panel>

          <Panel
            title="Rosters"
            action={canSource ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                      onClick={() => router.push(areasHref())}>
                Open the grid
              </Button>
            ) : undefined}
            flush
          >
            {areas.map((r: any) => {
              const closed = !!r.locked_at || !!r.archived_at
              const late = r.due_at && !closed && new Date(r.due_at).getTime() < Date.now()
              return (
                <Row
                  key={r.id}
                  tone={late ? 'bad' : closed ? 'neutral' : 'info'}
                  title={(r.round_no || 1) > 1 ? `${r.title} · round ${r.round_no}` : r.title}
                  meta={
                    <>
                      {r.archived_at ? 'archived' : r.locked_at ? 'closed' : 'open'}
                      {` · ${r.proposed}${r.target_count ? ` of ${r.target_count}` : ''} proposed`}
                      {/* How many this brand has turned down is the number that says whether
                          the brief is working, so it belongs on the line, not behind a click. */}
                      {r.dropped > 0 ? ` · ${r.dropped} turned down` : ''}
                      {r.owner_email ? ` · ${r.owner_email}` : ' · unassigned'}
                      {r.due_at ? ` · due ${when(r.due_at)}` : ''}
                    </>
                  }
                  right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  onClick={canSource ? () => router.push(`/work/areas/${r.id}`) : undefined}
                />
              )
            })}
            {areas.length === 0 && <Empty>No roster yet.</Empty>}
          </Panel>

          <Panel
            title="Quotes"
            action={can('proposals') && proposals.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                      onClick={() => router.push(`/work/clients/${teamId}?tab=proposals`)}>
                All {proposals.length}
              </Button>
            ) : undefined}
            flush
          >
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
                    {p.total_sell_amount != null
                      ? <> · <Money value={p.total_sell_amount} /></>
                      : null}
                    {` · updated ${when(p.updated_at)}`}
                  </>
                }
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={can('proposals') ? () => router.push(`/work/proposals/${p.id}`) : undefined}
              />
            ))}
            {proposals.length === 0 && <Empty>No quotes sent.</Empty>}
          </Panel>

          <Panel title="Invoices" flush>
            {invoices.map((i: any) => {
              const overdue = i.status !== 'paid' && i.due_date &&
                new Date(i.due_date).getTime() < Date.now()
              return (
                <Row
                  key={i.id}
                  tone={i.status === 'paid' ? 'good' : overdue ? 'bad' : 'warn'}
                  title={
                  <span className="flex items-center gap-2">
                    <Money value={i.amount_aed} />
                    <span className="text-muted-foreground">
                      {String(i.status || '').replace(/_/g, ' ')}
                    </span>
                  </span>
                }
                  meta={
                    <>
                      {i.due_date ? `due ${when(i.due_date)}` : 'no due date'}
                      {i.paid_at ? ` · paid ${when(i.paid_at)}` : ''}
                      {overdue ? ' · overdue' : ''}
                    </>
                  }
                  right={<Badge variant="outline">{i.status === 'paid' ? 'Paid' : 'Open'}</Badge>}
                  // "Agreement & invoices" is the tab this row is a line of. Landing on the
                  // client's Scope tab meant finding the invoice again by hand.
                  onClick={() => router.push(`/work/clients/${teamId}?tab=commercial`)}
                />
              )
            })}
            {/* Two different facts in one sentence: "there are none" and "you may not see
                them" needed the reader to know which. The list is only drawn for a role that
                may read it, so an empty one now means exactly what it says. */}
            {invoices.length === 0 && <Empty>Nothing invoiced yet.</Empty>}
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
