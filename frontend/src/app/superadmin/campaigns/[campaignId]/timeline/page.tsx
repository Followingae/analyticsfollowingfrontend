'use client'

/**
 * One campaign, whole story.
 *
 * Everyone opens this page. What differs is the columns: money is scrubbed server-side, so a
 * talent manager sees cost, an account manager sees sell, and leadership sees both. Nothing
 * is hidden with CSS — out-of-scope values never reach the browser.
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Loader2, FileText, Users, Search, ScrollText,
         Receipt, Camera, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface TEvent {
  kind: string; at: string | null; title: string; detail: string
  state: 'done' | 'active'; round_id?: string; proposal_id?: string
}
interface Timeline {
  campaign: Record<string, any>
  proposal: Record<string, any> | null
  rounds: any[]
  events: TEvent[]
  roster: any[]
  content: { posts: number; deliverables: Record<string, number> }
  money: Record<string, any>
  scope: string
}

const ICON: Record<string, typeof FileText> = {
  created: FileText, proposal: ScrollText, sourcing: Search,
  agreement: ScrollText, invoice: Receipt, content: Camera, payout: Wallet,
}

const aed = (n: number | null | undefined) =>
  n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function CampaignTimelinePage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const [t, setT] = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/admin/campaigns/${campaignId}/timeline`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load')
        setT((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load the timeline')
      } finally { setLoading(false) }
    })()
  }, [campaignId])

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }
  if (!t) return <SuperadminLayout><p className="text-sm">Campaign not found.</p></SuperadminLayout>

  const c = t.campaign
  const confirmed = t.roster.filter(r => r.selected_by_user).length
  const target = c.target_influencer_count || t.roster.length || 0
  const delivered = Object.entries(t.content.deliverables || {})
    .filter(([k]) => ['approved', 'posted', 'completed'].includes(k))
    .reduce((a, [, v]) => a + (v as number), 0)
  const totalDeliv = Object.values(t.content.deliverables || {})
    .reduce((a: number, v) => a + (v as number), 0)
  const showMoney = t.scope === 'leadership'

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/superadmin/campaigns')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All campaigns
          </Button>
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {c.client_name && (
                  c.team_id ? (
                    <button type="button" onClick={() => router.push(`/work/brands/${c.team_id}`)}>
                      <Badge variant="outline" className="hover:bg-muted">{c.client_name} →</Badge>
                    </button>
                  ) : <Badge variant="outline">{c.client_name}</Badge>
                )}
                <Badge variant="secondary" className="capitalize">{c.status}</Badge>
                {c.campaign_type && (
                  <Badge variant="outline" className="capitalize">{c.campaign_type}</Badge>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {c.brand_name}{c.start_date ? ` · from ${when(c.start_date)}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* headline numbers — delivery for everyone, money for leadership */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Creators confirmed</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{confirmed}
              <span className="text-base font-normal text-muted-foreground"> of {target}</span></p>
            <Progress className="mt-3 h-2" value={target ? (confirmed / target) * 100 : 0} />
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Content delivered</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{delivered}
              <span className="text-base font-normal text-muted-foreground"> of {totalDeliv || '—'}</span></p>
            <Progress className="mt-3 h-2" value={totalDeliv ? (delivered / totalDeliv) * 100 : 0} />
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Posts tracked</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{t.content.posts}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Report: {c.report_status || 'not sent'}
            </p>
          </CardContent></Card>

          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{showMoney ? 'Invoiced' : 'Payment'}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {showMoney ? aed(t.money.invoiced) : (c.payment_status || 'not paid')}
            </p>
            {showMoney && (
              <p className="mt-3 text-xs text-muted-foreground">
                {aed(t.money.collected)} collected
              </p>
            )}
          </CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
          {/* the spine */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">The whole story</CardTitle>
              <CardDescription>Nothing lives in an inbox</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 pl-6">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />
                {t.events.map((e, i) => {
                  const Icon = ICON[e.kind] || FileText
                  return (
                    <li key={i} className="relative">
                      <span className={`absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${
                        e.state === 'active' ? 'bg-primary' : 'bg-emerald-500'}`} />
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">{e.title}</p>
                          {e.detail && (
                            <p className="text-xs text-muted-foreground">{e.detail}</p>
                          )}
                          {e.at && <p className="mt-0.5 text-xs text-muted-foreground/70">{when(e.at)}</p>}
                        </div>
                      </div>
                    </li>
                  )
                })}
                {t.events.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nothing recorded yet.</li>
                )}
              </ol>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {t.rounds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sourcing</CardTitle>
                  <CardDescription>How this roster was found</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {t.rounds.map(r => (
                    <button key={r.id}
                      onClick={() => router.push(`/work/sourcing/${r.id}`)}
                      className="flex w-full items-center gap-3 border-t py-3 text-left first:border-t-0 hover:bg-muted/40">
                      <Badge variant="outline">Round {r.round_no}</Badge>
                      <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {r.proposed} proposed · {r.selected} picked
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {String(r.status).replace(/_/g, ' ')}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">Roster</CardTitle>
                  <CardDescription>
                    {t.scope === 'talent' ? 'Cost is what the creator charges us'
                      : t.scope === 'account' ? 'Sell is what the client is charged'
                      : 'Cost, sell and margin'}
                  </CardDescription>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 pb-2 text-left font-medium">Creator</th>
                        <th className="px-3 pb-2 text-left font-medium">Followers</th>
                        <th className="px-3 pb-2 text-left font-medium">Cost</th>
                        <th className="px-3 pb-2 text-left font-medium">Sell</th>
                        <th className="px-6 pb-2 text-left font-medium">Selected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.roster.map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-6 py-2.5 font-medium">
                            <button type="button"
                                    className="underline underline-offset-2 hover:text-primary"
                                    onClick={() => router.push(
                                      `/creator-analytics/${String(r.username).replace(/^@/, '')}`)}>
                              @{r.username}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                            {r.followers_count?.toLocaleString() ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {r.cost_reel_aed_cents != null ? aed(r.cost_reel_aed_cents / 100) : '—'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {r.sell_reel_aed_cents != null ? aed(r.sell_reel_aed_cents / 100) : '—'}
                          </td>
                          <td className="px-6 py-2.5">
                            {r.selected_by_user
                              ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Confirmed</Badge>
                              : <Badge variant="outline">Proposed</Badge>}
                          </td>
                        </tr>
                      ))}
                      {t.roster.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No creators on this campaign yet.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SuperadminLayout>
  )
}
