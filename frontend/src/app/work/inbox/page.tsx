'use client'

/**
 * Inbox — everything waiting on a decision from you.
 *
 * The same job used to be spread over seven screens: content review, cashback receipts,
 * creator payouts, new app creators, the waiting room, sourcing rounds and proposals in the
 * approval chain. Nobody can hold seven queues in their head, so things sat for a week and
 * the only way to find out was to be asked.
 *
 * This is one list of the things that are stopped until a person decides, grouped by kind and
 * ordered by how long each has been stopped. Three rules keep it honest:
 *
 *   1. Only the queues this person can actually act on are fetched. The role gate here is the
 *      same one the endpoints enforce — a talent manager is not shown a payout they would be
 *      refused, and a queue they cannot open is not a tab.
 *   2. Every fetch is settled independently. One queue returning 403 or falling over costs you
 *      that queue, never the page.
 *   3. Nothing is decided here. A row opens the screen that owns the decision, with its own
 *      context, evidence and audit trail — this screen only says where to go first.
 *
 * Somebody with no queues at all (business development) is told so plainly rather than being
 * handed an empty shell that looks broken.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, ArrowUpDown, CheckCircle2, Clock, Layers, TimerOff } from 'lucide-react'
import { Hub, type HubTab } from '@/components/console/Hub'
import { Empty, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { API_CONFIG } from '@/config/api'
import {
  faDeliverableApi, faMemberApi, faReceiptClaimApi, faWithdrawalApi,
} from '@/services/faAdminApi'
import { creatorIntakeApi } from '@/services/creatorIntakeApi'
import { sourcingApi } from '@/services/sourcingApi'
import { adminProposalApi } from '@/services/adminProposalMasterApi'

// ── reading the answers ──────────────────────────────────────────────────────────────
/** Every one of these endpoints wraps its list differently; this is the one place that knows. */
const unwrap = (res: any, ...keys: string[]): any[] => {
  const d = res?.data ?? res
  for (const k of keys) if (d && Array.isArray(d[k])) return d[k]
  return Array.isArray(d) ? d : []
}

const DAY = 86_400_000

/** How long it has been stopped, in words. A queue measured in hours is not yet a problem. */
function waited(iso?: string | null): { days: number | null; text: string } {
  if (!iso) return { days: null, text: 'no date' }
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return { days: null, text: 'no date' }
  const days = Math.floor((Date.now() - t) / DAY)
  if (days < 1) return { days: 0, text: 'today' }
  return { days, text: days === 1 ? '1 day' : `${days} days` }
}

/** Colour is the age of the wait, and the number of days is always printed beside it. */
const toneFor = (days: number | null): Tone =>
  days == null ? 'neutral' : days >= 7 ? 'bad' : days >= 3 ? 'warn' : 'info'

const aed = (v: any) =>
  `⃃ ${Math.round(parseFloat(v || 0)).toLocaleString('en-AE')}`

const compact = (n: any) => {
  const v = Number(n || 0)
  return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : `${v}`
}

interface InboxItem {
  id: string
  /** What it is, in the words the person would use. */
  title: string
  /** What it is waiting for — the decision, not the feature name. */
  waitingFor: string
  /** When the wait started. */
  since?: string | null
  /** Extra fact worth carrying (amount, followers) — never money a role may not see. */
  right?: string
  href: string
}

interface InboxGroup {
  key: string
  /** The tab label and the panel title: the job, not the table. */
  label: string
  /** One line of what a decision here means. */
  description: string
  /** The screen that owns the decision. */
  href: string
  items: InboxItem[]
}

export default function InboxPage() {
  const router = useRouter()
  const { can, isSuperAdmin, loading: accessLoading } = useAdminAccess()

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<'oldest' | 'newest'>('oldest')

  const [deliverables, setDeliverables] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [newMembers, setNewMembers] = useState<any[]>([])
  const [unpriced, setUnpriced] = useState<any[]>([])
  const [rounds, setRounds] = useState<any[]>([])
  const [toSource, setToSource] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])

  // Which queues this person may open at all. Mirrors the endpoint guards:
  //   deliverables  → module "fa"           (require_module_or_staff("fa"))
  //   receipts / payouts / new app creators → superadmin only (fa_admin_routes.require_admin)
  //   waiting room / sourcing → module "influencers"
  //   proposals     → module "proposals"
  // Asking for a queue we would be refused is how a page ends up half-blank, so we do not ask.
  const mayFa = can('fa')
  const mayMoney = isSuperAdmin
  const mayCreators = can('influencers')
  const mayProposals = can('proposals')
  const hasAnyQueue = mayFa || mayMoney || mayCreators || mayProposals

  const load = useCallback(async () => {
    if (accessLoading) return
    if (!hasAnyQueue) { setLoading(false); return }
    setLoading(true)

    // One settled batch: a refused or broken queue must cost only itself.
    const todayReq = fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      .then(r => r.json())
    const [d, r, w, m, p, s, pir, pcr, td] = await Promise.allSettled([
      mayFa ? faDeliverableApi.listPending() : Promise.resolve(null),
      mayMoney ? faReceiptClaimApi.list('pending_review') : Promise.resolve(null),
      mayMoney ? faWithdrawalApi.listPending() : Promise.resolve(null),
      mayMoney ? faMemberApi.list({ is_approved: 0, limit: 50 }) : Promise.resolve(null),
      mayCreators ? creatorIntakeApi.reviewQueue() : Promise.resolve(null),
      mayCreators ? sourcingApi.listRounds({ status: 'internal_review' }) : Promise.resolve(null),
      mayProposals ? adminProposalApi.listProposals({ status: 'pending_internal_review', limit: 50 })
                   : Promise.resolve(null),
      mayProposals ? adminProposalApi.listProposals({ status: 'internal_changes_requested', limit: 50 })
                   : Promise.resolve(null),
      todayReq,
    ])

    setDeliverables(d.status === 'fulfilled' && d.value ? unwrap(d.value, 'deliverables') : [])
    setReceipts(r.status === 'fulfilled' && r.value ? unwrap(r.value, 'claims') : [])
    setWithdrawals(w.status === 'fulfilled' && w.value ? unwrap(w.value, 'withdrawals') : [])
    setNewMembers(m.status === 'fulfilled' && m.value ? unwrap(m.value, 'members') : [])
    setUnpriced(p.status === 'fulfilled' && p.value ? unwrap(p.value, 'items') : [])
    setRounds(s.status === 'fulfilled' && s.value ? unwrap(s.value, 'items') : [])
    // Today already works out, per role, which brands are still waiting on a brief. Only
    // leadership get these back, so no extra gate is needed here.
    setToSource(td.status === 'fulfilled' && td.value
      ? ((td.value as any)?.data?.needs || []).filter((n: any) =>
          typeof n.title === 'string' && n.title.startsWith('Write the sourcing brief for'))
      : [])
    setProposals([
      ...(pir.status === 'fulfilled' && pir.value ? (pir.value as any).proposals || [] : []),
      ...(pcr.status === 'fulfilled' && pcr.value ? (pcr.value as any).proposals || [] : []),
    ])
    setLoading(false)
  }, [accessLoading, hasAnyQueue, mayFa, mayMoney, mayCreators, mayProposals])

  useEffect(() => { load() }, [load])
  // Coming back from the screen that owns a decision should not show the thing you just did.
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  // ── the queues, in one shape ───────────────────────────────────────────────────────
  const groups: InboxGroup[] = useMemo(() => {
    const g: InboxGroup[] = []

    // A brand somebody logged that has no sourcing brief yet. It is the first link in the
    // chain and it was invisible: the alert was the only place it ever existed, and nobody
    // can start sourcing until someone says what to look for.
    if (toSource.length) g.push({
      key: 'to-source',
      label: 'Briefs to write',
      description: 'A client is logged but nobody can source for them yet. Open a round and say what to look for.',
      href: '/work/sourcing',
      items: toSource.map((n: any, i: number) => ({
        id: `to-source-${i}`,
        title: String(n.title || '').replace(/^Write the sourcing brief for /, ''),
        waitingFor: n.detail || 'no brief yet',
        since: undefined,
        href: n.href || '/work/sourcing',
      })),
    })

    if (mayFa) g.push({
      key: 'deliverables',
      label: 'Content to check',
      description: 'A creator says the post is live. Nobody is paid until someone confirms it.',
      href: '/work/fa/deliverables',
      items: deliverables.map((x: any) => ({
        id: String(x.id),
        title: x.member_name || x.instagram_username || 'Creator',
        waitingFor: `${String(x.type || 'content').replace(/_/g, ' ')}${x.quantity > 1 ? ` ×${x.quantity}` : ''} — confirm it went live`,
        since: x.submitted_at || x.created_at,
        href: '/work/fa/deliverables',
      })),
    })

    if (mayMoney) g.push({
      key: 'receipts',
      label: 'Cashback receipts',
      description: 'A creator spent their own money at a venue and is waiting to be paid back.',
      href: '/work/fa/receipt-claims',
      items: receipts.map((x: any) => ({
        id: String(x.id),
        title: x.member?.full_name || x.member?.instagram_username || 'Creator',
        waitingFor: `${x.ai_extracted_merchant || 'Receipt'} — approve or turn down`,
        since: x.created_at,
        href: '/work/fa/receipt-claims',
      })),
    })

    if (mayMoney) g.push({
      key: 'withdrawals',
      label: 'What we owe creators',
      description: 'Money already earned, sitting in a wallet until someone releases the transfer.',
      href: '/work/fa/withdrawals',
      items: withdrawals.map((x: any) => ({
        id: String(x.id),
        title: x.member_name || x.account_holder || 'Creator',
        waitingFor: `${x.bank_name || 'Bank transfer'} — release the payout`,
        since: x.requested_at,
        right: x.amount != null ? aed(x.amount) : undefined,
        href: '/work/fa/withdrawals',
      })),
    })

    if (mayMoney) g.push({
      key: 'members',
      label: 'New creators on the app',
      description: 'Signed up and waiting to be let in. Until then they cannot apply to anything.',
      href: '/work/fa/members',
      items: newMembers.map((x: any) => ({
        id: String(x.id),
        title: x.full_name || `@${x.instagram_username || 'creator'}`,
        waitingFor: 'Let them in, or turn them down',
        since: x.created_at,
        right: x.followers_count ? `${compact(x.followers_count)} followers` : undefined,
        href: '/work/fa/members',
      })),
    })

    if (mayCreators) g.push({
      key: 'price',
      label: 'Creators waiting on a price',
      description: 'Found by the team. Invisible to clients and unusable in a proposal until priced.',
      href: '/work/influencers/review',
      items: unpriced.map((x: any) => ({
        id: String(x.id),
        title: `@${x.username}`,
        waitingFor: x.submitted_by_email
          ? `Set a sell price — added by ${x.submitted_by_email}`
          : 'Set a sell price and approve',
        since: x.submitted_at,
        right: x.followers_count ? `${compact(x.followers_count)} followers` : undefined,
        href: '/work/influencers/review',
      })),
    })

    if (mayCreators) g.push({
      key: 'rounds',
      label: 'Sourcing waiting on a verdict',
      description: 'A list of creators is built and cannot go to the client until it is cleared.',
      href: '/work/sourcing',
      items: rounds.map((x: any) => ({
        id: String(x.id),
        title: `${x.title}${x.round_no ? ` · round ${x.round_no}` : ''}`,
        waitingFor: `${x.client_name || 'No client linked'} — approve or strike the ${x.proposed || 0} found`,
        since: x.created_at,
        right: x.approved ? `${x.approved} cleared` : undefined,
        href: `/work/sourcing/${x.id}`,
      })),
    })

    if (mayProposals) g.push({
      key: 'proposals',
      label: 'Proposals waiting on sign-off',
      description: 'Built internally and stopped: nothing reaches the client until it is approved.',
      href: '/work/proposals',
      items: proposals.map((x: any) => ({
        id: String(x.id),
        title: x.campaign_name || x.title || 'Proposal',
        waitingFor: x.status === 'internal_changes_requested'
          ? `${x.brand_name || x.user_email || 'Client'} — changes asked for, back with the talent manager`
          : `${x.brand_name || x.user_email || 'Client'} — your approval before it can be sent`,
        since: x.created_at,
        right: x.total_influencers ? `${x.total_influencers} creators` : undefined,
        // The approval workspace, not the proposal page — that is where the decision is taken.
        href: `/work/proposals/${x.id}/approval`,
      })),
    })

    // Longest stopped first, because that is the one somebody is chasing.
    const dir = order === 'oldest' ? 1 : -1
    for (const grp of g) {
      grp.items.sort((a, b) => {
        const ta = a.since ? new Date(a.since).getTime() : 0
        const tb = b.since ? new Date(b.since).getTime() : 0
        return (ta - tb) * dir
      })
    }
    return g
  }, [mayFa, mayMoney, mayCreators, mayProposals, order,
      deliverables, receipts, withdrawals, newMembers, unpriced, rounds, proposals])

  const all = useMemo(() => groups.flatMap(g => g.items), [groups])
  const total = all.length
  const liveGroups = groups.filter(g => g.items.length > 0)

  const oldest = useMemo(() => {
    let best: { item: InboxItem; group: string; days: number } | null = null
    for (const g of groups) for (const it of g.items) {
      const d = waited(it.since).days
      if (d == null) continue
      if (!best || d > best.days) best = { item: it, group: g.label, days: d }
    }
    return best
  }, [groups])

  const stale = all.filter(i => (waited(i.since).days ?? 0) >= 3).length

  // Tabs are the screens that own these decisions — the inbox tells you where to go, they are
  // still where the work happens, and each stays reachable whether or not it has anything in it.
  const tabs: HubTab[] = [
    { label: 'Waiting on you', href: '/work/inbox' },
    { label: 'Content', href: '/work/fa/deliverables', module: 'fa',
      count: deliverables.length },
    { label: 'Receipts', href: '/work/fa/receipt-claims', module: 'fa', when: mayMoney,
      count: receipts.length },
    { label: 'Payouts', href: '/work/fa/withdrawals', module: 'fa', when: mayMoney,
      count: withdrawals.length },
    { label: 'New app creators', href: '/work/fa/members', module: 'fa', when: mayMoney,
      count: newMembers.length },
    { label: 'Waiting room', href: '/work/influencers/review', module: 'influencers',
      count: unpriced.length },
    { label: 'Sourcing', href: '/work/sourcing', module: 'influencers', count: rounds.length },
    { label: 'Proposals', href: '/work/proposals', module: 'proposals', count: proposals.length },
    { label: 'Everything in flight', href: '/work/operations', module: 'operations' },
  ]

  const head = (
    <Hub
      title="Inbox"
      sub="Everything waiting on a decision from you, wherever it came from. Longest stopped first — each row opens the screen where the decision is actually made."
      tabs={tabs}
      action={
        <>
          <Button variant="outline" size="sm" onClick={() => setOrder(o => o === 'oldest' ? 'newest' : 'oldest')}>
            <ArrowUpDown className="mr-1.5 h-4 w-4" />
            {order === 'oldest' ? 'Longest waiting first' : 'Newest first'}
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>Refresh</Button>
        </>
      }
    >
      {null}
    </Hub>
  )

  if (accessLoading || loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-[116px]" />)}
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </SuperadminLayout>
    )
  }

  // Some people genuinely have nothing that stops on them — business development sells, it does
  // not approve. Saying so is kinder than a screen of empty cards that reads as broken.
  if (!hasAnyQueue) {
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          {head}
          <Panel title="Nothing stops on you" flush>
            <div className="space-y-3 px-6 py-12 text-center">
              <p className="text-sm font-medium">No decisions are routed to your role.</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Approvals for content, payouts, creator pricing and proposals sit with other
                roles. Your work is on Today and with your brands.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => router.push('/work/today')}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/work/brands')}>
                  Brands
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        {head}

        <StatGrid cols={3}>
          <Stat
            label="Waiting on you"
            value={total}
            icon={Layers}
            tone={total ? 'warn' : 'good'}
            hint={total
              ? `across ${liveGroups.length} of your ${groups.length} queues`
              : `all ${groups.length} of your queues are clear`}
          />
          <Stat
            label="Longest wait"
            value={oldest ? (oldest.days === 0 ? 'today' : `${oldest.days}d`) : '—'}
            icon={TimerOff}
            tone={oldest ? toneFor(oldest.days) : 'good'}
            hint={oldest ? `${oldest.group} · ${oldest.item.title}` : 'Nothing has been sitting'}
          />
          <Stat
            label="Sitting over three days"
            value={stale}
            icon={Clock}
            tone={stale ? 'bad' : 'good'}
            hint={stale ? 'Someone is almost certainly chasing these' : 'Nothing has gone stale'}
          />
        </StatGrid>

        {total === 0 ? (
          <Panel title="You are clear" flush>
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
              <p className="text-sm font-medium">Nothing is waiting on a decision from you.</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Your queues are listed above — open any of them to see what has already been
                decided, or what is moving.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="space-y-6">
            {groups.map(g => (
              <Panel
                key={g.key}
                title={g.label}
                description={g.description}
                action={
                  <div className="flex items-center gap-2">
                    {g.items.length > 0 && <Badge>{g.items.length}</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => router.push(g.href)}>
                      Open<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                }
                flush
              >
                {g.items.slice(0, 8).map(it => {
                  const w = waited(it.since)
                  return (
                    <Row
                      key={`${g.key}-${it.id}`}
                      tone={toneFor(w.days)}
                      title={it.title}
                      meta={it.waitingFor}
                      right={
                        <>
                          {it.right && (
                            <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
                              {it.right}
                            </span>
                          )}
                          <Badge variant="outline" className="tabular-nums">
                            {w.days == null ? 'no date' : `waited ${w.text}`}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </>
                      }
                      onClick={() => router.push(it.href)}
                    />
                  )
                })}
                {g.items.length > 8 && (
                  <button
                    type="button"
                    onClick={() => router.push(g.href)}
                    className="w-full border-t px-6 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {g.items.length - 8} more waiting — open {g.label.toLowerCase()}
                  </button>
                )}
                {g.items.length === 0 && <Empty>Nothing waiting here.</Empty>}
              </Panel>
            ))}
          </div>
        )}
      </div>
    </SuperadminLayout>
  )
}
