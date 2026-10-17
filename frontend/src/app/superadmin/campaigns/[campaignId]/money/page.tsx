'use client'

/**
 * What a campaign costs, what it earns, and whether we can afford to pay anybody yet.
 *
 * The whole rail behind this screen has been live for months and had no screen at all.
 * `/api/v1/admin/run-money/campaigns/{id}` has always answered with the cost of every
 * creator, the margin, what the client has actually paid and how much headroom is left —
 * and nothing in the product ever called it. Four decisions that only leadership can make
 * were therefore unmakeable outside a database client:
 *
 *   settlement on or off      whether we contract the creators and settle them ourselves
 *   working capital           paying creators ahead of the client, in writing, bounded
 *   brand-sourced             a creator the brand brought, who is not ours to be paid for
 *   who is unpriced           a creator on the campaign with no agreed rate, in no total
 *
 * Three things this screen refuses to do.
 *
 * IT NEVER INVENTS A FIGURE. Every number is sent by the server as an integer of fils and
 * rendered once. Nothing on this page divides, estimates, or fills a gap with a nought: a
 * creator with no agreed rate is listed under "No rate agreed" and is in no total, which is
 * what the API already says in its own `rule` line.
 *
 * IT NEVER SHOWS AN ALL CLEAR OVER A FAILED READ. A campaign whose money could not be
 * loaded says so. "Nothing owed" is a claim, and on this screen it is the claim somebody
 * would act on.
 *
 * IT IS LEADERSHIP ONLY, and by the money scope rather than a role string. The co-founder's
 * role is an ordinary 'user' and her authority comes from staff_role; a role check would
 * lock out the one person who signs off the money. The server already refuses everyone else
 * (`require_scope(SCOPE_LEADERSHIP)` on every route in run_money_routes.py), so the gate
 * here only stops us drawing a screen that would answer 403.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import {
  ArrowLeft, Banknote, HandCoins, Landmark, Loader2, Receipt, TrendingUp, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Aed, CARD, PageHead, Panel, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import {
  Dash, DENSITY, DensityProvider, DensityToggle, ReadState, SectionHead, TableShell,
  useDensity,
} from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/run-money`

async function api(path: string, init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

/** The figure only. The dirham mark is the `Aed` primitive's job, in the font that carries it. */
const num = (n: number | null | undefined) =>
  n == null ? null : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })

/** Where a plain string is needed: a dialog description, a tooltip. */
const text = (n: number | null | undefined) => (n == null ? '' : `AED ${num(n)}`)

const fils = (cents: number | null | undefined) =>
  cents == null ? null : Math.round(Number(cents)) / 100

/* The four states a creator's money can be in, named the way the API names them. Colour
   never travels without the word, so the state is always spelled out beside the dot. */
const STATE_WORD: Record<string, string> = {
  committed: 'Committed',
  owed: 'Owed',
  settled: 'Paid',
  unpriced: 'No rate',
  dropped: 'Dropped',
}

const STATE_TONE: Record<string, string> = {
  committed: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  owed: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  settled: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  unpriced: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
  dropped: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

/**
 * Where a creator came from, which decides whether we are paying them at all.
 *
 * `brand_sourced` is the one that costs money when it is wrong: a creator the brand brought
 * to the campaign themselves is on the roster and in the delivery board, but they are not
 * ours to pay, and counting them in cost understates the margin by their whole fee.
 */
const POPULATION_WORD: Record<string, string> = {
  brand_sourced: 'Brand brought them',
  catalogue: 'Our database',
  roster: 'Added by hand',
  app: 'Creator app',
}

export default function CampaignMoneyPage() {
  /* Dense by default: this is a money grid with five numeric columns, which is the tier
     dense exists for. The toggle remembers whatever the reader prefers. */
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout>
        <DensityProvider id="campaign-money" initial="dense">
          <CampaignMoney />
        </DensityProvider>
      </SuperadminLayout>
    </AuthGuard>
  )
}

function CampaignMoney() {
  const router = useRouter()
  const params = useParams()
  const confirm = useConfirm()
  const campaignId = String(params?.campaignId || '')
  const { canSeeMargin, loading: accessLoading } = useAdminAccess()

  const [data, setData] = useState<any>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [wcOpen, setWcOpen] = useState(false)
  const [wc, setWc] = useState({ amount_aed: '', reason: '' })

  const load = useCallback(async () => {
    if (!campaignId) return
    setLoading(true)
    setFailed(false)
    try {
      const res = await api(`/campaigns/${campaignId}`)
      setData(res.data)
    } catch (e) {
      setFailed(true)
      setData(null)
      toast.error(e instanceof Error ? e.message : 'Could not load this campaign’s money')
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { if (canSeeMargin) load() }, [canSeeMargin, load])

  /**
   * Settlement on or off. Done once, at award time, and never silently repriced.
   *
   * Switching it ON lets the server resolve the rate for THIS client rather than sending
   * one from here: the house rate normally, and zero for a client already paying the
   * management service charge for the same work. A rate typed on this screen would be a
   * rate inherited by accident, which is the bug the server avoids by resolving it itself.
   */
  const toggleSettlement = async (enabled: boolean) => {
    const ok = await confirm(enabled ? {
      kind: 'routine',
      title: 'Settle this campaign ourselves?',
      body: (
        <>
          We contract the creators on this campaign and pay them, and the client is invoiced
          in our name. The rate is resolved for this client and stamped now; it is not
          repriced afterwards, so a campaign keeps the terms it was awarded on.
        </>
      ),
      confirmLabel: 'Turn settlement on',
    } : {
      kind: 'destructive',
      title: 'Stop settling this campaign?',
      body: <>Creators on this campaign stop being paid through us.</>,
      losses: [
        { label: 'The rate already stamped on this campaign is kept', kept: true },
        { label: 'Payments already made are untouched', kept: true },
        { label: 'New payout lines will no longer draw against this campaign', warn: true },
      ],
      confirmLabel: 'Turn settlement off',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api(`/campaigns/${campaignId}/settlement`, {
        method: 'POST', body: JSON.stringify({ enabled }),
      })
      toast.success(enabled ? 'Settlement is on for this campaign' : 'Settlement is off')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change settlement')
    } finally { setBusy(false) }
  }

  /**
   * Working capital: deciding, in writing, to pay creators before the client has paid us.
   *
   * An amount and not a switch, deliberately, so the decision is bounded — approving AED
   * 20,000 does not open the campaign to AED 200,000 of payouts. The reason is required by
   * the server and is the part that matters six weeks later.
   */
  const approveWorkingCapital = async () => {
    const amount = Number(wc.amount_aed)
    if (!Number.isFinite(amount) || amount < 0) { toast.error('How much, in AED?'); return }
    if (!wc.reason.trim()) {
      toast.error('Say why we are funding this ahead of the client'); return
    }
    const ok = await confirm({
      kind: 'money',
      title: 'Approve working capital',
      subtitle: `${data?.campaign?.name || 'This campaign'} · ${data?.campaign?.client_name || 'no client on record'}`,
      amountAed: amount,
      amountNote: 'The most this campaign may pay creators ahead of the client. It is a '
                + 'ceiling, not a transfer: nothing moves until a payout run is executed.',
      body: <>{wc.reason.trim()}</>,
      confirmLabel: 'Approve it',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api(`/campaigns/${campaignId}/working-capital`, {
        method: 'POST',
        body: JSON.stringify({ amount_aed: amount, reason: wc.reason.trim() }),
      })
      toast.success(`Working capital of ${text(amount)} approved`)
      setWcOpen(false)
      setWc({ amount_aed: '', reason: '' })
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not approve working capital')
    } finally { setBusy(false) }
  }

  /** A creator the brand brought. Not ours to pay, and not ours to count in cost. */
  const setBrandSourced = async (row: any, value: boolean) => {
    const who = row.username ? `@${row.username}` : 'this creator'
    const ok = await confirm(value ? {
      kind: 'routine',
      title: `Mark ${who} as brought by the brand`,
      body: (
        <>
          They stay on the campaign and on the delivery board, and they come out of what this
          campaign costs us. Use it when the brand introduced the creator and is paying them
          directly.
        </>
      ),
      confirmLabel: 'Mark them brand-brought',
    } : {
      kind: 'routine',
      title: `${who} is ours after all`,
      body: <>Their fee goes back into what this campaign costs.</>,
      confirmLabel: 'Put them back',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api(`/campaign-creators/${row.campaign_creator_id}/brand-sourced`, {
        method: 'POST', body: JSON.stringify({ brand_sourced: value }),
      })
      toast.success(value ? `${who} is marked as brought by the brand` : `${who} is ours again`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change that')
    } finally { setBusy(false) }
  }

  if (accessLoading) return null

  /* Not a 403 page. The server refuses this data to anybody but leadership, and a talent
     manager arriving here has not done anything wrong — they have followed a link. The cost
     of a campaign is in the payables book they already have; the margin is not theirs. */
  if (!canSeeMargin) {
    return (
      <div className="space-y-5">
        <PageHead
          title="Campaign money"
          sub="What a campaign costs, earns and can afford to pay out."
        />
        <div className={cn(CARD, 'bg-card p-5 text-ds-label')}>
          <p>This screen is margin, so it is leadership only.</p>
          <p className="mt-2 text-ds-caption text-muted-foreground">
            What we agreed to pay each creator is on the payables book, which you already
            have. Open the delivery board for where everybody has got to.
          </p>
          <Button variant="outline" size="sm" className="mt-4"
                  onClick={() => router.push(`/work/campaigns/${campaignId}/ladder`)}>
            Open the delivery board
          </Button>
        </div>
      </div>
    )
  }

  const c = data?.campaign
  const t = data?.totals
  const client = data?.client_money
  const f = data?.funding
  const bank = data?.bank_transfers
  const creators: any[] = data?.creators || []
  const unpriced: any[] = data?.unpriced || []

  /* Headroom is the one figure somebody acts on, so it carries the tone. Negative headroom
     is not an error: it is a campaign that has drawn more than it is funded for, which is a
     real position and the reason working capital has to be written down. */
  const headroom = fils(f?.headroom_cents)
  const headroomTone: Tone =
    headroom == null ? 'neutral' : headroom < 0 ? 'bad' : headroom === 0 ? 'warn' : 'good'

  return (
    <div className="space-y-6">
      <PageHead
        title={c?.name ? `${c.name}: the money` : 'Campaign money'}
        sub={
          c ? (
            <>
              {c.client_name || c.brand_name || 'No client on record'}
              {c.status ? ` · ${c.status}` : ''}
              {' · '}
              Approving a deliverable is what moves a creator from committed to owed.
            </>
          ) : 'What this campaign costs, earns and can afford to pay out.'
        }
        action={
          <>
            <DensityToggle />
            <Button variant="outline" size="sm"
                    onClick={() => router.push(`/work/campaigns/${campaignId}/timeline`)}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              The campaign
            </Button>
          </>
        }
      />

      <ReadState
        failed={failed}
        loading={loading}
        empty={!data}
        what="this campaign’s money"
        onRetry={load}
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the campaign
        </div>}
      >
        <StatGrid>
          <Stat
            label="Cost"
            value={<><Aed>{num(fils(t?.cost_cents))}</Aed></>}
            icon={Banknote}
            hint={`Committed ${text(fils(t?.committed_cents))}, owed ${text(fils(t?.owed_cents))}, paid ${text(fils(t?.settled_cents))}.`}
          />
          <Stat
            label="Sell"
            value={<><Aed>{num(fils(t?.sell_cents))}</Aed></>}
            icon={TrendingUp}
            hint="Summed over the creators still on the campaign. A dropped creator's sell price is not revenue."
          />
          <Stat
            label="Margin"
            value={<><Aed>{num(fils(t?.margin_cents))}</Aed></>}
            tone={(fils(t?.margin_cents) ?? 0) < 0 ? 'bad' : 'neutral'}
            hint="Sell less cost. Creators with no agreed rate are in neither."
          />
          <Stat
            label="Headroom"
            value={<><Aed>{num(headroom)}</Aed></>}
            tone={headroomTone}
            icon={Wallet}
            hint={
              headroom != null && headroom < 0
                ? 'This campaign has drawn more than it is funded for.'
                : 'Funded plus approved working capital, less what has been drawn.'
            }
          />
        </StatGrid>

        {/* ── The two decisions only leadership can make ───────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Settlement"
                 description="Whether we contract the creators on this campaign and settle them ourselves.">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-ds-label font-medium">
                    {f?.settlement_enabled
                      ? 'We contract and pay the creators on this campaign'
                      : 'The client pays the creators directly'}
                  </p>
                  <p className="max-w-prose text-ds-caption leading-relaxed text-muted-foreground">
                    {f?.settlement_enabled
                      ? 'Chosen at award time. The rate is stamped once and is not repriced.'
                      : 'Turning this on resolves the rate for this client and stamps it. Nothing is charged until a payout run executes.'}
                  </p>
                </div>
                <Switch
                  checked={!!f?.settlement_enabled}
                  disabled={busy}
                  onCheckedChange={(v: boolean) => toggleSettlement(v)}
                  aria-label="Settle this campaign ourselves"
                />
              </div>

              {f?.settlement_enabled && (
                <dl className="space-y-2 border-t pt-3 text-ds-caption">
                  <Line label="Our rate" value={f.fee_pct != null ? `${f.fee_pct}%` : null} />
                  <Line label="Fee so far" value={text(fils(f.settlement_fee_cents))} />
                  <Line
                    label={f.vat_label || 'VAT on the fee'}
                    value={text(fils(f.settlement_fee_vat_cents))}
                  />
                  {/* The one place VAT needs explaining, because two different VATs meet
                      here and only one of them is ours to add. The server sends the
                      sentence; this screen does not write its own tax advice. */}
                  {f.vat_basis && (
                    <p className="max-w-prose pt-1 leading-relaxed text-muted-foreground">
                      {f.vat_basis}
                    </p>
                  )}
                </dl>
              )}
            </div>
          </Panel>

          <Panel title="Funding"
                 description="What the client has paid, what has been drawn against it, and what is left.">
            <div className="space-y-4">
              <dl className="space-y-2 text-ds-caption">
                <Line label="Client invoiced" value={text(fils(client?.billed_cents))} />
                <Line label="Client paid, net of VAT" value={text(fils(f?.funded_cents))} />
                <Line label="Drawn by payouts and fees" value={text(fils(f?.drawn_cents))} />
                <Line
                  label="Working capital approved"
                  value={text(fils(f?.working_capital_approved_cents))}
                />
                <Line label="Left to draw" value={text(headroom)} strong />
              </dl>

              {bank?.count ? (
                <p className="border-t pt-3 text-ds-caption text-muted-foreground">
                  {bank.count} payment{bank.count === 1 ? '' : 's'} have left by bank transfer,
                  totalling {text(fils(bank.cents))}.
                </p>
              ) : null}

              <div className="border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => setWcOpen(true)} disabled={busy}>
                  <Receipt className="mr-1.5 h-3.5 w-3.5" />
                  {Number(f?.working_capital_approved_cents || 0) > 0
                    ? 'Change the working capital'
                    : 'Approve working capital'}
                </Button>
                <p className="mt-2 max-w-prose text-ds-caption leading-relaxed text-muted-foreground">
                  The only way to pay a creator before the client has paid us, and the amount
                  is the ceiling on how far past.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Who is on it, and what each one costs ────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHead
            title="Creators on this campaign"
            note={
              unpriced.length
                ? `${unpriced.length} of them have no agreed rate and are in none of the totals above.`
                : 'Every creator has an agreed rate, so the totals above are the whole campaign.'
            }
          />
          <CreatorTable
            rows={creators}
            failed={failed}
            loading={loading}
            busy={busy}
            onBrandSourced={setBrandSourced}
          />
        </section>
      </ReadState>

      {/* ── Working capital ─────────────────────────────────────────────────────────── */}
      <Dialog open={wcOpen} onOpenChange={setWcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve working capital</DialogTitle>
            <DialogDescription>
              How much this campaign may pay creators ahead of the client, and why. Both are
              kept against the campaign with your name on them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wc-amount">Amount, in AED</Label>
              <Input
                id="wc-amount"
                inputMode="decimal"
                value={wc.amount_aed}
                onChange={e => setWc(s => ({ ...s, amount_aed: e.target.value }))}
                placeholder="20000"
              />
              <p className="text-ds-caption text-muted-foreground">
                A ceiling, not a transfer. Nought removes the approval.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-reason">Why we are funding this ahead of the client</Label>
              <Textarea
                id="wc-reason"
                rows={3}
                value={wc.reason}
                onChange={e => setWc(s => ({ ...s, reason: e.target.value }))}
                placeholder="The client's PO is signed and their finance run is the 28th; the creators post next week."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWcOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={approveWorkingCapital} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Review it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** One labelled figure in a definition list. Dash, not nought, where nothing arrived. */
function Line({ label, value, strong }: { label: string; value: string | null; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('tabular-nums', strong && 'font-semibold text-foreground')}>
        {value ? value : <Dash reason="unmeasured" what="this figure" />}
      </dd>
    </div>
  )
}

/**
 * The roster, costed.
 *
 * `brand_sourced` is a real action on this table rather than a column of ticks, because it
 * changes what the campaign costs: it is the difference between a margin that is right and
 * one that is understated by somebody else's fee. It exists only for creators booked
 * through the managed roster — an app creator's money moves through the creator wallet and
 * is not ours to re-attribute.
 */
function CreatorTable({
  rows, failed, loading, busy, onBrandSourced,
}: {
  rows: any[]
  failed: boolean
  loading: boolean
  busy: boolean
  onBrandSourced: (row: any, value: boolean) => void
}) {
  const d = DENSITY[useDensity()]

  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creator</TableHead>
            <TableHead>Where from</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Sell</TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead className="text-right">Settles via</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading || failed || !rows.length ? (
            <TableRow>
              <TableCell colSpan={8} className="p-0">
                <div className="px-4">
                  <ReadState
                    failed={failed}
                    loading={loading}
                    empty={!rows.length}
                    what="the creators on this campaign"
                    nothing="Nobody is booked on this campaign yet."
                    skeleton={<div className="py-8" />}
                  >
                    <span />
                  </ReadState>
                </div>
              </TableCell>
            </TableRow>
          ) : rows.map((r, i) => {
            const cost = fils(r.cost_cents)
            const sell = fils(r.sell_cents)
            const margin = fils(r.margin_cents)
            const managed = !!r.campaign_creator_id
            const brandSourced = r.population === 'brand_sourced'
            return (
              <TableRow key={r.campaign_creator_id || r.participant_id || i} className={d.row}>
                <TableCell className="font-medium">
                  {r.username ? `@${String(r.username).replace(/^@/, '')}` : (r.full_name || '—')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {POPULATION_WORD[r.population] || r.population}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATE_TONE[r.state] || ''}>
                    {STATE_WORD[r.state] || r.state}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {brandSourced
                    /* Not a nought. They have a fee; it is simply not ours. */
                    ? <span className="text-muted-foreground">theirs</span>
                    : cost != null ? <Aed>{num(cost)}</Aed>
                    : <Dash reason="unset" what="agreed rate" />}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {sell != null ? <Aed>{num(sell)}</Aed> : <Dash reason="unset" what="sell price" />}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {margin != null ? <Aed>{num(margin)}</Aed> : <Dash reason="unset" what="cost or sell price" />}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {r.settles_via === 'creator_wallet' ? 'Creator wallet' : 'Bank transfer'}
                </TableCell>
                <TableCell className="text-right">
                  {managed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => onBrandSourced(r, !brandSourced)}
                    >
                      {brandSourced ? 'Ours after all' : 'Brand brought them'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableShell>
  )
}
