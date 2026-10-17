'use client'

/**
 * Payout runs — the screen money actually leaves the building through.
 *
 * The rail underneath this has been complete for months: a run is a basket of approved
 * creator payments, the check tests every line against the funded balance, the bank details
 * and the self-billing agreement, the file is what somebody uploads to the bank, and marking
 * it executed writes the ledger and closes the payments. There were nought runs in production
 * for one reason only: there was no way to make one.
 *
 * Three things this screen is deliberate about.
 *
 * THE FULL IBAN IS IN THE BANK FILE AND NOWHERE ELSE. Nothing here renders an account number,
 * and anything that arrives looking like one is masked at the render site before it reaches
 * the DOM. The CSV is handed to the browser as a download; its contents are never drawn.
 *
 * A FIGURE IS NEVER INVENTED. The run list carries its own counted total, so nothing on this
 * page divides, estimates or fills in. Where the API did not send a number, the cell says so
 * with a dash that names the reason rather than printing a confident nought.
 *
 * A REFUSED READ IS NOT AN EMPTY LIST. "No payout runs yet" and "we could not ask" look
 * identical and mean opposite things, and on this screen the second one means a creator may
 * be owed money today that nobody can see. Failure is held apart from absence throughout.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { CARD, PageHead, Stat, StatGrid } from '@/components/console/primitives'
import {
  Age,
  BulkBar,
  Dash,
  FilterBar,
  NoMatches,
  Owner,
  TableShell,
  type FilterChip,
} from '@/components/console/surfaces'
import { EntityTile, Glyph } from '@/components/console/Glyph'
import { useConfirm } from '@/components/console/confirm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

const RUNS = `${API_CONFIG.BASE_URL}/api/v1/admin/run-money`
const PAYABLES = `${API_CONFIG.BASE_URL}/api/v1/admin/payables`

async function api(url: string, init?: RequestInit) {
  const res = await fetchWithAuth(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail || `The request failed (${res.status})`)
  }
  return res.json()
}

/* ── Money ──────────────────────────────────────────────────────────────────────────────── */

/** AED, thousands separated, no decimals. The only money format on this screen. */
const aed = (amount: number) => `AED ${Math.round(amount).toLocaleString('en-US')}`

/** An amount in integer fils. Unknown prints as a dash that says why, never as nought. */
function Money({ cents, what = 'total' }: { cents?: number | null; what?: string }) {
  if (cents == null || Number.isNaN(Number(cents))) return <Dash reason="unset" what={what} />
  return <span className="tabular-nums">{aed(Number(cents) / 100)}</span>
}

/**
 * NO ACCOUNT NUMBER IS DRAWN ON THIS SCREEN.
 *
 * Nothing it reads carries one: `/items` returns the boolean `has_bank_details` and never the
 * snapshot, the check returns a creator, an amount and a reason, and the CSV goes from the
 * response straight into a download. The bank file stays the only place a full IBAN appears, so
 * if a line ever starts carrying one, mask it to its last four digits here, at the render site,
 * rather than printing what arrived.
 */

/* ── Shapes, as the API actually sends them ─────────────────────────────────────────────── */

type RunStatus = 'draft' | 'file_generated' | 'executed' | 'cancelled'

interface Run {
  id: string
  reference: string
  status: RunStatus
  currency: string
  value_date: string | null
  bank_reference: string | null
  notes: string | null
  created_at: string | null
  file_generated_at: string | null
  executed_at: string | null
  created_by_email: string | null
  item_count: number
  blocked_count: number
  total_cents: number | null
}

interface CheckLine {
  payable_id: string
  creator_username: string | null
  amount_cents: number
  reason?: string
}

/**
 * One line in a run, as `/payout-runs/{id}/items` sends it. A plain read: no bank snapshot,
 * only `has_bank_details`, because the bank file stays the one place a full account number
 * appears and an endpoint that hands them to anything that asks is how that stops being true.
 */
interface RunItem {
  id: string
  payable_id: string | null
  campaign_id: string | null
  campaign_name: string | null
  creator_username: string | null
  amount_cents: number
  amount_aed: number | null
  status: 'included' | 'blocked' | 'paid'
  block_reason: string | null
  has_bank_details: boolean
  invoiced: boolean
  created_at: string | null
}

interface CheckResult {
  ready: CheckLine[]
  blocked: CheckLine[]
  ready_cents: number
}

interface Payable {
  id: string
  title: string
  creator_username: string | null
  campaign_name: string | null
  agreed_amount_aed: number | null
  payment_method: string | null
  due_date: string | null
}

const STATUS_WORD: Record<RunStatus, string> = {
  draft: 'Being built',
  file_generated: 'In flight',
  executed: 'Executed',
  cancelled: 'Cancelled',
}

const STATUS_SKIN: Record<RunStatus, string> = {
  draft: 'border-transparent bg-[var(--tone-neutral-wash)] text-foreground',
  file_generated: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  executed: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  cancelled: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

function StatusChip({ status }: { status: RunStatus }) {
  return (
    <Badge className={cn('rounded-full font-medium', STATUS_SKIN[status])}>
      {STATUS_WORD[status]}
    </Badge>
  )
}

const daysSince = (iso?: string | null) => {
  if (!iso) return 0
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.round((Date.now() - then) / 86_400_000))
}

const person = (email?: string | null) => (email ? email.split('@')[0] : null)

/** The one failure voice on this screen. Nothing below it is drawn. */
function ReadFailed({
  what,
  detail,
  onRetry,
}: {
  what: string
  detail: string
  onRetry: () => void
}) {
  return (
    <div className="space-y-3" role="alert">
      <p className="text-sm font-medium">Could not load {what}.</p>
      <p className="max-w-[65ch] text-sm text-muted-foreground">
        {detail}. This is not an empty list and nothing here is known: there may be money
        waiting to go out that is not on screen.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

/* ══ The screen ═══════════════════════════════════════════════════════════════════════════ */

export default function PayoutRunsPage() {
  const confirmAction = useConfirm()

  const [runs, setRuns] = useState<Run[]>([])
  const [runsFailure, setRunsFailure] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadRuns = useCallback(async () => {
    setLoading(true)
    setRunsFailure(null)
    try {
      const res = await api(`${RUNS}/payout-runs`)
      setRuns((res?.data?.runs || []) as Run[])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'The read was refused'
      setRunsFailure(msg)
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

  const open = useMemo(() => runs.find((r) => r.id === openId) || null, [runs, openId])

  /* Three figures, each summed only from runs the API actually sent. */
  const sums = useMemo(() => {
    const by = (s: RunStatus) =>
      runs.filter((r) => r.status === s).reduce((a, r) => a + (r.total_cents || 0), 0)
    return {
      draft: by('draft'),
      inFlight: by('file_generated'),
      executed: by('executed'),
      drafts: runs.filter((r) => r.status === 'draft').length,
    }
  }, [runs])

  const chips: FilterChip[] = useMemo(
    () => [
      { key: 'all', label: 'Every run', n: runs.length },
      { key: 'draft', label: 'Being built', n: runs.filter((r) => r.status === 'draft').length },
      {
        key: 'file_generated',
        label: 'In flight',
        n: runs.filter((r) => r.status === 'file_generated').length,
      },
      {
        key: 'executed',
        label: 'Executed',
        n: runs.filter((r) => r.status === 'executed').length,
      },
    ],
    [runs],
  )

  const shown = useMemo(
    () => (filter === 'all' ? runs : runs.filter((r) => r.status === filter)),
    [runs, filter],
  )

  if (open) {
    return (
      <SuperadminLayout>
        <RunDetail
          run={open}
          confirmAction={confirmAction}
          onBack={() => setOpenId(null)}
          onChanged={loadRuns}
        />
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="Payout runs"
          sub="A run is a basket of approved creator payments, checked line by line, turned into one file for the bank, and closed once the bank has taken it."
          action={
            runsFailure ? null : (
              <Button onClick={() => setCreating((v) => !v)}>
                <Plus className="mr-1.5 h-4 w-4" />
                {creating ? 'Close the basket' : 'Build a run'}
              </Button>
            )
          }
        />

        {runsFailure ? (
          <ReadFailed what="payout runs" detail={runsFailure} onRetry={loadRuns} />
        ) : loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Reading the payout runs.
          </p>
        ) : (
          <>
            {creating && (
              <BuildRun
                confirmAction={confirmAction}
                onCreated={async (id) => {
                  setCreating(false)
                  await loadRuns()
                  setOpenId(id)
                }}
              />
            )}

            {runs.length > 0 && (
              <StatGrid cols={3}>
                <Stat
                  label="Sitting in draft runs"
                  value={<Money cents={sums.draft} what="draft total" />}
                  hint={`${sums.drafts} run${sums.drafts === 1 ? '' : 's'} still being built. Nothing has left.`}
                />
                <Stat
                  label="In flight"
                  tone={sums.inFlight > 0 ? 'warn' : 'neutral'}
                  value={<Money cents={sums.inFlight} what="in-flight total" />}
                  hint="The file exists and may already be with the bank."
                />
                <Stat
                  label="Executed"
                  tone="good"
                  value={<Money cents={sums.executed} what="executed total" />}
                  hint="The bank took it and the payments are closed."
                />
              </StatGrid>
            )}

            {runs.length > 0 && (
              <TableShell
                toolbar={<FilterBar chips={chips} value={filter} onChange={setFilter} />}
                footer={
                  <span className="text-ds-caption tabular-nums">
                    {shown.length} of {runs.length} run{runs.length === 1 ? '' : 's'}
                  </span>
                }
              >
                {shown.length === 0 ? (
                  <NoMatches onClear={() => setFilter('all')} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run</TableHead>
                        <TableHead>Made</TableHead>
                        <TableHead>Built by</TableHead>
                        <TableHead className="text-right">Creators</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Where it stands</TableHead>
                        <TableHead className="w-0" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shown.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <EntityTile kind="payout" size="row" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{r.reference}</p>
                                {r.value_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Value date {r.value_date}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Age days={daysSince(r.created_at)} />
                          </TableCell>
                          <TableCell>
                            <Owner name={person(r.created_by_email)} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.item_count}
                            {r.blocked_count > 0 && (
                              <span
                                className="ml-1.5 text-xs text-[var(--tone-bad-ink)]"
                                title={`${r.blocked_count} line${r.blocked_count === 1 ? '' : 's'} blocked and not in the file`}
                              >
                                {r.blocked_count} blocked
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Money cents={r.total_cents} what="run total" />
                          </TableCell>
                          <TableCell>
                            <StatusChip status={r.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setOpenId(r.id)}>
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableShell>
            )}
          </>
        )}
      </div>
    </SuperadminLayout>
  )
}

/* ══ Building a run ═══════════════════════════════════════════════════════════════════════ */

/**
 * The basket: approved payments, ticked, turned into a run.
 *
 * A payment already sitting in a live run cannot be added twice — the backend refuses it with
 * a reason per line, and those reasons are printed here rather than swallowed, because "nine
 * of your eleven went in" is the only honest thing to say when that happens.
 */
function BuildRun({
  confirmAction,
  onCreated,
}: {
  confirmAction: ReturnType<typeof useConfirm>
  onCreated: (runId: string) => void
}) {
  const [payables, setPayables] = useState<Payable[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [skipped, setSkipped] = useState<{ payable_id: string; why: string }[]>([])
  const [valueDate, setValueDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setFailure(null)
    try {
      const res = await api(`${PAYABLES}?status=approved`)
      setPayables((res?.data?.items || []) as Payable[])
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'The read was refused')
      setPayables([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (id: string) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const chosen = payables.filter((p) => ticked.has(p.id))
  const totalAed = chosen.reduce((a, p) => a + Number(p.agreed_amount_aed || 0), 0)

  const create = async () => {
    if (chosen.length === 0) return
    const ok = await confirmAction({
      kind: 'routine',
      title: `Build a run of ${chosen.length} payment${chosen.length === 1 ? '' : 's'}`,
      body: (
        <>
          Nothing leaves yet. The run opens as a basket worth {aed(totalAed)}; it still has to
          be checked, turned into a file and marked executed before any money moves.
        </>
      ),
      confirmLabel: 'Build the run',
    })
    if (!ok) return

    setBusy(true)
    setSkipped([])
    try {
      const made = await api(`${RUNS}/payout-runs`, {
        method: 'POST',
        body: JSON.stringify({ value_date: valueDate || undefined }),
      })
      const runId: string = made?.data?.id
      const added = await api(`${RUNS}/payout-runs/${runId}/items`, {
        method: 'POST',
        body: JSON.stringify({ payable_ids: chosen.map((p) => p.id) }),
      })
      const refused = (added?.data?.skipped || []) as { payable_id: string; why: string }[]
      setSkipped(refused)
      const n = (added?.data?.added || []).length
      toast.success(
        refused.length > 0
          ? `${made?.data?.reference}: ${n} in, ${refused.length} refused.`
          : `${made?.data?.reference} built with ${n} payment${n === 1 ? '' : 's'}.`,
      )
      if (refused.length === 0) onCreated(runId)
      else setTicked(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not build the run')
    } finally {
      setBusy(false)
    }
  }

  if (failure) {
    return (
      <div className={cn(CARD, 'bg-card p-5')}>
        <ReadFailed what="approved payments" detail={failure} onRetry={load} />
      </div>
    )
  }
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Reading what has been approved for payment.
      </p>
    )
  }
  if (payables.length === 0) {
    return (
      <div className={cn(CARD, 'bg-card p-5')}>
        <p className="text-sm font-medium">A run cannot be built right now.</p>
        <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
          A run is made of payments somebody has approved, and nothing is sitting at approved
          today. Approve a payment in Creator payments first and it will appear here.
        </p>
      </div>
    )
  }

  return (
    <TableShell
      toolbar={
        <>
          <Glyph icon={Banknote} name="Approved payments" />
          <div>
            <p className="text-sm font-medium">What is approved and not yet in a run</p>
            <p className="text-ds-caption">
              Tick the payments this run should carry. A payment already in a live run is
              refused when the run is built, and the reason is printed below.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="value-date" className="text-ds-caption">
              Value date
            </Label>
            <Input
              id="value-date"
              type="date"
              value={valueDate}
              onChange={(e) => setValueDate(e.target.value)}
              className="h-8 w-[150px]"
            />
          </div>
        </>
      }
      bulk={
        <BulkBar
          count={ticked.size}
          summary={<span className="tabular-nums">{aed(totalAed)}</span>}
          idleHint="Tick the payments this run should carry"
        >
          <Button size="sm" variant="secondary" onClick={create} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Build the run
          </Button>
        </BulkBar>
      }
      footer={
        skipped.length > 0 ? (
          <div className="py-1">
            <p className="text-ds-label font-semibold">
              {skipped.length} payment{skipped.length === 1 ? ' was' : 's were'} refused
            </p>
            <ul className="mt-1 space-y-0.5">
              {skipped.map((s) => (
                <li key={s.payable_id} className="text-ds-caption">
                  {payables.find((p) => p.id === s.payable_id)?.creator_username ||
                    s.payable_id.slice(0, 8)}
                  : {s.why}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-ds-caption tabular-nums">
            {payables.length} approved payment{payables.length === 1 ? '' : 's'}
          </span>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0" />
            <TableHead>Payment</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payables.map((p) => (
            <TableRow key={p.id} data-state={ticked.has(p.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={ticked.has(p.id)}
                  onCheckedChange={() => toggle(p.id)}
                  aria-label={`Put ${p.title} in this run`}
                />
              </TableCell>
              <TableCell className="text-sm font-medium">{p.title}</TableCell>
              <TableCell className="text-sm">
                {p.creator_username ? (
                  `@${p.creator_username}`
                ) : (
                  <Dash reason="unset" what="creator" />
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {p.campaign_name || <Dash reason="unset" what="campaign" />}
              </TableCell>
              <TableCell className="text-right">
                {p.agreed_amount_aed == null ? (
                  <Dash reason="unset" what="amount" />
                ) : (
                  <span className="tabular-nums">{aed(Number(p.agreed_amount_aed))}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  )
}

/* ══ One run ══════════════════════════════════════════════════════════════════════════════ */

/**
 * The three steps, in the order money moves: check it, generate the file, mark it executed.
 *
 * Each step that cannot be taken yet says WHY in a sentence. A greyed button with no reason
 * is the thing operators ask about in a WhatsApp message instead of reading the screen.
 *
 * A run is READ before it is touched. The lines come from `/items`, which is a plain read, so
 * opening a run shows what is in it without doing anything to it. `/check` stays step 1 but it
 * is now a verify: it tests every line against the funding, the bank details and the
 * self-billing agreement, raises the invoices for the lines that pass, and this screen then
 * re-reads the lines and marks the ones its verdict changed.
 */
function RunDetail({
  run,
  confirmAction,
  onBack,
  onChanged,
}: {
  run: Run
  confirmAction: ReturnType<typeof useConfirm>
  onBack: () => void
  onChanged: () => Promise<void> | void
}) {
  const [items, setItems] = useState<RunItem[]>([])
  const [itemsFailure, setItemsFailure] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [checkFailure, setCheckFailure] = useState<string | null>(null)
  /** Each line's status at the moment the check was pressed, so the verdict can be read as a change. */
  const [before, setBefore] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState<'check' | 'file' | 'execute' | null>(null)
  const [bankRef, setBankRef] = useState('')

  const loadItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsFailure(null)
    try {
      const res = await api(`${RUNS}/payout-runs/${run.id}/items`)
      setItems((res?.data?.items || []) as RunItem[])
    } catch (e) {
      setItemsFailure(e instanceof Error ? e.message : 'The read was refused')
      setItems([])
    } finally {
      setItemsLoading(false)
    }
  }, [run.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const included = items.filter((i) => i.status === 'included')
  const blocked = items.filter((i) => i.status === 'blocked')
  const paid = items.filter((i) => i.status === 'paid')
  const goingOut = [...included, ...paid]
  const goingOutCents = goingOut.reduce((a, i) => a + (i.amount_cents || 0), 0)

  const recipientsFrom = (lines: RunItem[]) =>
    lines.map((l) => ({
      name: l.creator_username ? `@${l.creator_username}` : 'Creator',
      detail: l.campaign_name ? `Bank transfer, ${l.campaign_name}` : 'Bank transfer',
      amountAed: l.amount_cents / 100,
      ...(l.has_bank_details ? {} : { warn: 'Bank details not confirmed on this line yet' }),
    }))

  const runCheck = async () => {
    const ok = await confirmAction({
      kind: 'routine',
      title: `Check ${run.reference}`,
      body: (
        <>
          Every line is tested against the campaign funding, the creator&apos;s bank details and
          their self-billing agreement. Lines that pass have their self-billed invoice raised.
          No money moves.
        </>
      ),
      confirmLabel: 'Check the run',
    })
    if (!ok) return
    setBusy('check')
    setCheckFailure(null)
    setBefore(Object.fromEntries(items.map((i) => [i.id, i.status])))
    try {
      const res = await api(`${RUNS}/payout-runs/${run.id}/check`)
      setCheck(res?.data as CheckResult)
      await loadItems()
      await onChanged()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'The check was refused'
      setCheckFailure(msg)
      toast.error(msg)
    } finally {
      setBusy(null)
    }
  }

  const generateFile = async () => {
    if (!check) return
    const ok = await confirmAction({
      kind: 'money',
      title: `Generate the bank file for ${run.reference}`,
      subtitle:
        'This file is what somebody uploads to the bank. From this moment the money counts as in flight and a second run cannot spend it again.',
      amountAed: check.ready_cents / 100,
      amountNote: `${check.ready.length} creator${check.ready.length === 1 ? '' : 's'}${
        check.blocked.length > 0
          ? `, ${check.blocked.length} blocked line${check.blocked.length === 1 ? '' : 's'} left out`
          : ''
      }`,
      recipients: check.ready.map((l) => ({
        name: l.creator_username ? `@${l.creator_username}` : 'Creator',
        detail: 'Bank transfer',
        amountAed: l.amount_cents / 100,
      })),
      confirmLabel: 'Generate the file',
    })
    if (!ok) return
    setBusy('file')
    try {
      const res = await api(`${RUNS}/payout-runs/${run.id}/file`, { method: 'POST' })
      const csv: string = res?.data?.csv || ''
      /* The CSV holds the only full IBANs in the product, so it goes straight to disk and is
         never drawn on screen. */
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${res?.data?.reference || run.reference}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${res?.data?.reference || run.reference} downloaded. Upload it to the bank.`)
      await loadItems()
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the file')
    } finally {
      setBusy(null)
    }
  }

  const markExecuted = async () => {
    const ok = await confirmAction({
      kind: 'money',
      title: `Mark ${run.reference} executed`,
      subtitle:
        'Say this only once the bank has taken the file. The payments close, the ledger is written, and it cannot be taken back.',
      amountAed: goingOutCents / 100,
      amountNote: `${goingOut.length} creator${goingOut.length === 1 ? '' : 's'}, paid by bank transfer`,
      recipients: recipientsFrom(goingOut),
      confirmLabel: 'Mark the run executed',
    })
    if (!ok) return
    setBusy('execute')
    try {
      const res = await api(`${RUNS}/payout-runs/${run.id}/executed`, {
        method: 'POST',
        body: JSON.stringify({ bank_reference: bankRef || undefined }),
      })
      const refused = (res?.data?.refused || []) as { creator_username: string; reason: string }[]
      toast.success(
        refused.length > 0
          ? `${run.reference} executed. ${refused.length} line${refused.length === 1 ? '' : 's'} refused at the last check.`
          : `${run.reference} executed.`,
      )
      if (refused.length > 0) {
        setCheckFailure(refused.map((r) => `${r.creator_username}: ${r.reason}`).join(' · '))
      }
      await loadItems()
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not mark the run executed')
    } finally {
      setBusy(null)
    }
  }

  /* Why each step cannot be taken, in the words the operator needs. Null means it can. */
  const fileBlockedBecause =
    run.status === 'executed'
      ? 'This run has already been executed. Its file cannot be regenerated.'
      : run.status === 'cancelled'
        ? 'This run was cancelled, so no file can be made from it.'
        : !check
          ? 'The file is made from the lines that pass the check, so step 1 has to run first. The lines below are what is in the run, not what has passed.'
          : check.ready.length === 0
            ? 'Every line in this run is blocked, so there is nothing the bank could be asked to pay. Clear the reasons below and check it again.'
            : null

  const executeBlockedBecause =
    run.status === 'executed'
      ? 'Already executed. The payments are closed and the ledger is written.'
      : run.status === 'draft'
        ? 'Generate the bank file first. A run is only executed once a file has gone to the bank.'
        : run.status === 'cancelled'
          ? 'This run was cancelled.'
          : null

  return (
    <div className="space-y-ds-5">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          All payout runs
        </Button>
        <PageHead
          title={run.reference}
          sub={
            <>
              {run.item_count} creator{run.item_count === 1 ? '' : 's'},{' '}
              <Money cents={run.total_cents} what="run total" />. {STATUS_WORD[run.status]}
              {run.created_by_email ? `, built by ${person(run.created_by_email)}` : ''}.
            </>
          }
          action={<StatusChip status={run.status} />}
        />
      </div>

      {/* The three steps, in order. */}
      <div className={cn(CARD, 'bg-card p-5')}>
        <ol className="space-y-5">
          <Step
            n={1}
            icon={ShieldCheck}
            title="Check the run"
            body="Tests every line against the campaign funding, the creator's bank details and their self-billing agreement, and raises the self-billed invoice for the lines that pass. Nothing leaves."
          >
            <Button onClick={runCheck} disabled={busy !== null || run.status === 'executed'}>
              {busy === 'check' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {check ? 'Check it again' : 'Check the run'}
            </Button>
          </Step>

          <Step
            n={2}
            icon={Download}
            title="Generate the bank file"
            body="One CSV, downloaded to this machine, carrying only the lines that passed. It is the only place a full account number appears."
            reason={fileBlockedBecause}
          >
            <Button onClick={generateFile} disabled={busy !== null}>
              {busy === 'file' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Generate the file
            </Button>
          </Step>

          <Step
            n={3}
            icon={CheckCircle2}
            title="Mark it executed"
            body="Once the bank has taken the file. Writes the ledger and closes every payment in the run."
            reason={executeBlockedBecause}
          >
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="bank-ref" className="text-ds-caption">
                  The bank&apos;s reference, if you have it
                </Label>
                <Input
                  id="bank-ref"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 h-9 w-[220px]"
                />
              </div>
              <Button onClick={markExecuted} disabled={busy !== null}>
                {busy === 'execute' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Mark it executed
              </Button>
            </div>
          </Step>
        </ol>
      </div>

      {/* The check's verdict, stated once, above the lines it changed. */}
      {check && (
        <div className={cn(CARD, 'bg-card p-4')}>
          <p className="text-sm font-medium">
            Checked: {check.ready.length} line{check.ready.length === 1 ? '' : 's'} would be paid,{' '}
            {check.blocked.length} held back.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="tabular-nums">{aed(check.ready_cents / 100)}</span> would go out in
            the file. Anything the check moved is marked below.
          </p>
        </div>
      )}

      {checkFailure && (
        <div className={cn(CARD, 'bg-card p-5')} role="alert">
          <p className="text-sm font-medium">The last step did not come back clean.</p>
          <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{checkFailure}</p>
        </div>
      )}

      {itemsFailure ? (
        <ReadFailed
          what={`the lines in ${run.reference}`}
          detail={itemsFailure}
          onRetry={loadItems}
        />
      ) : itemsLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Reading what is in this run.
        </p>
      ) : (
        items.length > 0 && (
          <TableShell
            toolbar={
              <>
                <Glyph icon={Banknote} name="The lines in this run" />
                <div>
                  <p className="text-sm font-medium">What is in this run</p>
                  <p className="text-ds-caption">
                    Read straight from the run. Blocked lines stay in it and stay out of the file.
                  </p>
                </div>
                <span className="ml-auto text-ds-label font-semibold tabular-nums">
                  {aed(goingOutCents / 100)} on the paying lines
                </span>
              </>
            }
            footer={
              <span className="text-ds-caption tabular-nums">
                {included.length} to pay, {blocked.length} blocked
                {paid.length > 0 ? `, ${paid.length} already paid` : ''}
              </span>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Standing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((l) => {
                  const moved = before && before[l.id] && before[l.id] !== l.status
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm font-medium">
                        {l.creator_username ? (
                          `@${l.creator_username}`
                        ) : (
                          <Dash reason="unset" what="creator" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.campaign_name || <Dash reason="unset" what="campaign" />}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {/* `has_bank_details` is read off the snapshot the FILE writes, so a line
                            that has not been through a generated file says nothing either way
                            rather than claiming we hold nothing. */}
                        {l.has_bank_details ? (
                          <span className="flex items-center gap-1.5">
                            Bank transfer
                            <span className="text-xs">Details on file</span>
                          </span>
                        ) : (
                          <Dash reason="unset" what="bank details" />
                        )}
                      </TableCell>
                      <TableCell>
                        {l.invoiced ? (
                          <Badge className="rounded-full border-transparent bg-[var(--tone-info-wash)] font-medium text-foreground">
                            Raised
                          </Badge>
                        ) : (
                          <Dash reason="unset" what="self-billed invoice" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money cents={l.amount_cents} what="amount" />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <ItemStanding status={l.status} />
                            {moved && (
                              <span className="text-xs text-muted-foreground">
                                was {ITEM_WORD[before![l.id] as RunItem['status']] ?? before![l.id]}
                              </span>
                            )}
                          </span>
                          {l.block_reason && (
                            <span className="max-w-[46ch] text-xs text-muted-foreground">
                              {l.block_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableShell>
        )
      )}
    </div>
  )
}

const ITEM_WORD: Record<RunItem['status'], string> = {
  included: 'to pay',
  blocked: 'blocked',
  paid: 'paid',
}

const ITEM_SKIN: Record<RunItem['status'], string> = {
  included: 'bg-[var(--tone-neutral-wash)] text-foreground',
  blocked: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  paid: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
}

/** Where one line stands: in the file, held back, or already paid. */
function ItemStanding({ status }: { status: RunItem['status'] }) {
  return (
    <Badge className={cn('w-fit rounded-full border-transparent font-medium', ITEM_SKIN[status])}>
      {status === 'included' ? 'To pay' : status === 'blocked' ? 'Blocked' : 'Paid'}
    </Badge>
  )
}

/** One numbered step: what it does, and either the control or the reason it cannot be used. */
function Step({
  n,
  icon,
  title,
  body,
  reason,
  children,
}: {
  n: number
  icon: LucideIcon
  title: string
  body: string
  /** Why this step cannot be taken. When set, the control is replaced by this sentence. */
  reason?: string | null
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Glyph icon={icon} name={title} />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <p className="max-w-[70ch] text-sm text-muted-foreground">{body}</p>
        {reason ? (
          <p className="max-w-[70ch] rounded-ds-lg bg-[var(--tone-warn-wash)] px-3 py-2 text-sm text-[var(--tone-warn-ink)]">
            {reason}
          </p>
        ) : (
          children
        )}
      </div>
    </li>
  )
}
