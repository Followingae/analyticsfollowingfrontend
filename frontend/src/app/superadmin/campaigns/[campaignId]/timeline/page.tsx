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
import { CARD, FieldStrip, StageBar } from '@/components/console/primitives'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Loader2, FileText, Users, Search, ScrollText,
         Receipt, Camera, Wallet, PackageCheck, Truck, Paperclip, Check,
         Mail, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
         DialogDescription } from '@/components/ui/dialog'
import { ladderApi } from '@/services/ladderApi'
import { cdnAvatar } from '@/lib/avatar'
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
  roster_note?: { booked: number; pitched: number; proposal_id: string | null }
  instalments?: Instalment[]
  agreements?: any[]
  scope: string
}

interface Instalment {
  id: string; seq: number; label: string; period_label: string | null
  due_date: string | null; amount_aed: number; pct: number | null
  invoice_number: string | null; invoice_file_url: string | null; invoice_file_name: string | null
  invoice_issued_at: string | null; invoice_sent_at: string | null
  paid_at: string | null; amount_paid: number | null
}

const ICON: Record<string, typeof FileText> = {
  created: FileText, proposal: ScrollText, sourcing: Search,
  agreement: ScrollText, invoice: Receipt, content: Camera, payout: Wallet,
}

const aed = (n: number | null | undefined) =>
  n == null ? '—' : `⃃ ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function CampaignTimelinePage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const [t, setT] = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [invoiceFor, setInvoiceFor] = useState<Instalment | null>(null)
  const [invNumber, setInvNumber] = useState('')
  const [invUrl, setInvUrl] = useState('')

  const load = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/campaigns/${campaignId}/timeline`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load')
      setT((await res.json()).data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the timeline')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [campaignId])   // eslint-disable-line react-hooks/exhaustive-deps

  /** Run something, say what happened, and re-read the page. */
  const act = async (fn: () => Promise<any>, done: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(done)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not go through')
    } finally { setBusy(false) }
  }

  const api = async (path: string, init: RequestInit) => {
    const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
    return res.json()
  }

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

  // Getting the product there. Read off the roster, which is the campaign's own creators.
  const live = t.roster.filter(r => r.stage !== 'dropped')
  const ship = {
    packed: live.filter(r => r.product_ready_at).length,
    sent: live.filter(r => r.dispatched_at).length,
    got: live.filter(r => r.received_at).length,
    total: live.length,
  }
  const shipsAnswered = c.fulfilment_mode != null
  const ships = c.fulfilment_mode === 'delivery' || ship.packed + ship.sent + ship.got > 0
  const dineIn = c.fulfilment_mode === 'dine_in'

  const instalments = t.instalments || []
  const nextDue = instalments.find(i => !i.paid_at)

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2"
                  onClick={() => router.push('/superadmin/campaigns')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />All campaigns
          </Button>
          <div className={cn(CARD, 'relative overflow-hidden bg-white dark:bg-neutral-900/70')}>
            {/* A pane of glass over a soft wash, the way the reference opens a record. */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F1F7DC] via-[#FAFBF4] to-[#EFF4FA]
                              dark:from-lime-950/40 dark:via-neutral-900 dark:to-sky-950/30" />
              <div className="absolute inset-0 backdrop-blur-2xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {c.client_name && (
                      c.team_id ? (
                        <button type="button" onClick={() => router.push(`/work/brands/${c.team_id}`)}>
                          <Badge variant="outline" className="rounded-full hover:bg-muted">{c.client_name} →</Badge>
                        </button>
                      ) : <Badge variant="outline" className="rounded-full">{c.client_name}</Badge>
                    )}
                    <Badge variant="secondary" className="rounded-full capitalize">{c.status}</Badge>
                    {c.campaign_type && (
                      <Badge variant="outline" className="rounded-full capitalize">{c.campaign_type}</Badge>
                    )}
                  </div>
                  <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{c.name}</h1>
                </div>
                <Button
                  className="rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800
                             dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  onClick={() => router.push(`/work/campaigns/${campaignId}/ladder`)}
                >
                  Delivery board
                </Button>
              </div>
            </div>

            {/* The facts strip — a record that opens with a title and nothing else makes you
                go looking for what you already came to check. */}
            <div className="border-t border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
              <FieldStrip fields={[
                { label: 'Brand', value: c.brand_name || '—' },
                { label: 'Starts', value: c.start_date ? when(c.start_date) : '—' },
                { label: 'Ends', value: c.end_date ? when(c.end_date) : '—' },
                { label: 'Creators', value: `${confirmed} of ${target}` },
                { label: 'Posts', value: t.content?.posts ?? 0 },
              ]} />
            </div>

            {/* Where the campaign sits, as one pill bar. */}
            <div className="border-t border-black/[0.05] px-6 py-4 dark:border-white/[0.07]">
              <StageBar
                stages={[
                  { key: 'booked', label: 'Roster booked' },
                  { key: 'briefed', label: 'Briefed' },
                  { key: 'content', label: 'Content in' },
                  { key: 'live', label: 'Live' },
                  { key: 'reported', label: 'Reported' },
                ]}
                current={
                  (t.content?.posts ?? 0) > 0 ? 'live'
                  : confirmed >= target && target > 0 ? 'briefed'
                  : 'booked'
                }
              />
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

            {/* ── Products ────────────────────────────────────────────────────────────
                On a campaign that ships, this is the question everyone asks first — the
                client most of all — and it belongs on the page people actually open. */}
            {!dineIn && (
              ships ? (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">Products</CardTitle>
                      <CardDescription>
                        {ship.got === ship.total && ship.total > 0
                          ? 'Every creator has their product.'
                          : ship.sent
                            ? `${ship.sent} sent, ${ship.got} received of ${ship.total}.`
                            : ship.packed
                              ? `${ship.packed} packed and waiting on a courier.`
                              : 'Nothing packed yet.'}
                      </CardDescription>
                    </div>
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[['Packed', ship.packed], ['Sent', ship.sent], ['Received', ship.got]].map(
                        ([label, n]) => (
                          <div key={label as string} className="rounded-xl bg-muted/50 px-3 py-2.5">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                            <div className="text-lg font-semibold tabular-nums">{n as number}
                              <span className="text-sm font-normal text-muted-foreground"> / {ship.total}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="gap-1.5 rounded-xl" disabled={busy}
                              variant={ship.packed ? 'outline' : 'default'}
                              onClick={() => act(() => ladderApi.productReady(campaignId),
                                                 'Everyone marked packed')}>
                        <PackageCheck className="h-3.5 w-3.5" />Mark everyone packed
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"
                              onClick={() => router.push(`/work/campaigns/${campaignId}/ladder`)}>
                        <Truck className="h-3.5 w-3.5" />Send them out, one by one
                      </Button>
                    </div>
                    <p className="text-[12.5px] text-muted-foreground">
                      Dispatch and receipt are per creator, on the delivery board. Everything
                      marked here is what the client sees on their own campaign page.
                    </p>
                  </CardContent>
                </Card>
              ) : !shipsAnswered ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <div className="font-medium">Does this campaign send product to the creators?</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        If it does, we track it per creator — packed, sent, received.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1.5 rounded-xl" disabled={busy}
                              onClick={() => act(() => ladderApi.setFulfilmentMode(campaignId, 'delivery'),
                                                 'Product tracking on')}>
                        <Truck className="h-3.5 w-3.5" />Yes
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" disabled={busy}
                              onClick={() => act(() => ladderApi.setFulfilmentMode(campaignId, 'none'),
                                                 'No product on this campaign')}>
                        No
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )}

            {/* ── Payments ────────────────────────────────────────────────────────────
                The plan was written on the proposal, but by the time the second invoice
                is due nobody goes back there — the deal is a campaign now. Same controls,
                where the work is. */}
            {showMoney && instalments.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Payments</CardTitle>
                    <CardDescription>
                      {nextDue
                        ? `Next: ${nextDue.period_label || nextDue.label} · ${aed(nextDue.amount_aed)}`
                        : 'Everything on this plan is paid.'}
                    </CardDescription>
                  </div>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-6 pb-2 text-left font-medium">Payment</th>
                          <th className="px-3 pb-2 text-left font-medium">Due</th>
                          <th className="px-3 pb-2 text-right font-medium">Amount</th>
                          <th className="px-3 pb-2 text-left font-medium">Invoice</th>
                          <th className="px-6 pb-2 text-right font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {instalments.map(i => (
                          <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-6 py-2.5">
                              <div className="font-medium">{i.period_label || i.label}</div>
                              {i.period_label && (
                                <div className="text-xs text-muted-foreground">{i.label}</div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {i.due_date ? when(i.due_date) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{aed(i.amount_aed)}</td>
                            <td className="px-3 py-2.5">
                              {i.invoice_file_url || i.invoice_number ? (
                                <div className="flex items-center gap-2">
                                  {i.invoice_file_url ? (
                                    <a href={i.invoice_file_url} target="_blank" rel="noreferrer"
                                       className="inline-flex items-center gap-1 text-primary hover:underline">
                                      {i.invoice_number || 'Invoice'}<ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : <span>{i.invoice_number}</span>}
                                  {i.invoice_sent_at
                                    ? <Badge variant="outline" className="text-[10.5px]">Sent</Badge>
                                    : <Badge variant="secondary" className="text-[10.5px]">Not sent</Badge>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-2.5">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                {i.paid_at ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Paid {when(i.paid_at)}
                                  </Badge>
                                ) : (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                                            onClick={() => { setInvoiceFor(i)
                                                             setInvNumber(i.invoice_number || '')
                                                             setInvUrl(i.invoice_file_url || '') }}>
                                      <Paperclip className="h-3 w-3" />
                                      {i.invoice_file_url || i.invoice_number ? 'Edit invoice' : 'Attach invoice'}
                                    </Button>
                                    {(i.invoice_file_url || i.invoice_number) && !i.invoice_sent_at && (
                                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={busy}
                                              onClick={() => act(
                                                () => api(`/proposals/instalments/${i.id}/invoice-email/send`,
                                                          { method: 'POST', body: '{}' }),
                                                'Invoice email sent')}>
                                        <Mail className="h-3 w-3" />Send to client
                                      </Button>
                                    )}
                                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={busy}
                                            onClick={() => act(
                                              () => api(`/proposals/instalments/${i.id}/paid`,
                                                        { method: 'PUT', body: '{}' }),
                                              'Marked paid')}>
                                      <Check className="h-3 w-3" />Mark paid
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">Roster</CardTitle>
                  <CardDescription>
                    {t.roster_note && t.roster_note.pitched > t.roster_note.booked ? (
                      <>
                        The {t.roster_note.booked} the client locked.{' '}
                        <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                onClick={() => router.push(`/superadmin/proposals/${t.roster_note?.proposal_id}`)}>
                          All {t.roster_note.pitched} we pitched →
                        </button>
                      </>
                    ) : 'Everyone on this campaign'}
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
                        {ships && <th className="px-3 pb-2 text-left font-medium">Product</th>}
                        <th className="px-6 pb-2 text-left font-medium">Where they are</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.roster.map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-6 py-2.5 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={cdnAvatar(r.avatar) || undefined} className="object-cover" />
                                <AvatarFallback className="text-[10px]">
                                  {String(r.username || '?').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <button type="button"
                                      className="underline underline-offset-2 hover:text-primary"
                                      onClick={() => router.push(
                                        `/creator-analytics/${String(r.username).replace(/^@/, '')}`)}>
                                @{r.username}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                            {r.followers_count?.toLocaleString() ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {/* What we actually pay once it is confirmed; the quote until then. */}
                            {r.agreed_rate_cents != null
                              ? <span className={r.rate_agreed_at ? '' : 'text-muted-foreground'}>
                                  {aed(r.agreed_rate_cents / 100)}{!r.rate_agreed_at && ' ·'}
                                </span>
                              : r.deliverable_total_cost != null ? aed(r.deliverable_total_cost) : '—'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {r.deliverable_total_sell != null ? aed(r.deliverable_total_sell) : '—'}
                          </td>
                          {ships && (
                            <td className="px-3 py-2.5">
                              {r.received_at
                                ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Received</Badge>
                                : r.dispatched_at
                                  ? <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">On its way</Badge>
                                  : r.product_ready_at
                                    ? <Badge variant="secondary">Packed</Badge>
                                    : <Badge variant="outline" className="text-muted-foreground">Not packed</Badge>}
                            </td>
                          )}
                          <td className="px-6 py-2.5">
                            <Badge variant={r.posted_at ? 'default' : 'outline'} className="capitalize">
                              {r.posted_at ? 'Posted'
                                : r.content_approved_at ? 'Content approved'
                                : r.content_at ? 'Content in'
                                : r.guide_sent_at ? 'Briefed'
                                : r.rate_agreed_at ? 'Rate agreed'
                                : 'Booked'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {t.roster.length === 0 && (
                        <tr><td colSpan={ships ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
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

      {/* Filing the QuickBooks copy against the payment it settles. We do not raise
          invoices; we hold the copy so "where is October's" has an answer. */}
      <Dialog open={!!invoiceFor} onOpenChange={(v: boolean) => { if (!v) setInvoiceFor(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach the invoice</DialogTitle>
            <DialogDescription>
              {invoiceFor?.period_label || invoiceFor?.label} · {aed(invoiceFor?.amount_aed)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Invoice number</Label>
              <Input value={invNumber} onChange={e => setInvNumber(e.target.value)}
                     placeholder="INV-1042" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link to the file</Label>
              <Input value={invUrl} onChange={e => setInvUrl(e.target.value)}
                     placeholder="https://…" />
              <p className="text-[11.5px] text-muted-foreground">
                The client sees it on their proposal once you send it — filing it tells nobody.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceFor(null)}>Cancel</Button>
            <Button disabled={busy || (!invNumber.trim() && !invUrl.trim())}
                    onClick={() => {
                      const id = invoiceFor?.id
                      setInvoiceFor(null)
                      act(() => api(`/proposals/instalments/${id}/invoice`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          invoice_number: invNumber.trim() || undefined,
                          file_url: invUrl.trim() || undefined,
                        }),
                      }), 'Invoice filed')
                    }}>
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}
