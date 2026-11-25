'use client'

/**
 * Creator payments, one row per creator.
 *
 * WHAT THIS REPLACED (25 Nov 2026). The screen was a flat book of payment rows under three
 * stat cards, a strip of four filter chips saying the same four words again, a density toggle
 * and a tick-box column. The founder's verdict: too much going on, and the one question he
 * opens it with, "what have we paid this creator and what is left", had no answer anywhere
 * on it, because a creator with two instalments was two unrelated rows.
 *
 * Now the creator is the row: what we agreed, what has gone out, what is left, a bar, and the
 * one next step (approve what is owed, then mark it paid). The payments themselves, with
 * their instalments, dates and single-row actions, open underneath the creator.
 *
 * The rules did not move. Recording is open to anyone internal; approving and paying are a
 * founder's, and the server refuses both to anybody else, so for anybody else no button is
 * drawn. Money leaving the account goes through the money dialog, which names every creator
 * and every amount. A failed read is not an empty book. Cost is never printed for a reader
 * who may not see it.
 */
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import {
  Banknote, BadgeCheck, CircleDollarSign, Wallet, Plus, Loader2, Check, Download,
  ChevronRight, CheckCircle2, X, Mail, Phone, MapPin, Landmark, FileText, ExternalLink,
} from 'lucide-react'
import { PayoutRunsPanel } from '@/components/money/PayoutRuns'
import { Aed, Stat, StatGrid } from '@/components/console/primitives'
import { Owner } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import { MoneyHubHeader } from '@/components/console/MoneyHubHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/payables`

async function api(path = '', init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

/** The figure only; the dirham mark is the `Aed` primitive's job. */
const aedNum = (n: number | null | undefined) =>
  n == null ? null : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })

const day = (iso?: string | null) =>
  !iso ? '' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const TONE: Record<string, string> = {
  owed: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  approved: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  paid: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  cancelled: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}
const WORD: Record<string, string> = {
  owed: 'To approve', approved: 'To pay', paid: 'Paid', cancelled: 'Cancelled',
}

const OPEN = new Set(['owed', 'approved'])
const DAY_MS = 86_400_000

/** Days past the due date, only while the payment is still open. */
function lateDays(row: any): number {
  if (!row.due_date || !OPEN.has(row.status)) return 0
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const due = new Date(`${String(row.due_date).slice(0, 10)}T00:00:00`).getTime()
  if (Number.isNaN(due)) return 0
  return Math.max(0, Math.floor((t.getTime() - due) / DAY_MS))
}

/** Days a still-open payment has sat in the book since it was recorded. */
function waitingDays(row: any): number {
  if (!OPEN.has(row.status) || !row.created_at) return 0
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const c = new Date(row.created_at).getTime()
  return Number.isNaN(c) ? 0 : Math.max(0, Math.floor((t.getTime() - c) / DAY_MS))
}

const amt = (r: any) => Number(r.agreed_amount_aed || 0)
const handleOf = (r: any) => (r.creator_username ? String(r.creator_username).replace(/^@/, '') : null)

type Creator = {
  key: string
  handle: string | null
  name: string
  campaigns: { id: string | null; name: string }[]
  rows: any[]
  agreed: number
  paid: number
  toApprove: number
  toPay: number
  left: number
  late: number
}

/** Payments folded into one line per creator. A payment with no creator stands alone. */
function byCreator(items: any[]): Creator[] {
  const map = new Map<string, Creator>()
  for (const r of items) {
    const handle = handleOf(r)
    const key = handle ? handle.toLowerCase() : `row:${r.id}`
    let c = map.get(key)
    if (!c) {
      c = { key, handle, name: handle ? `@${handle}` : (r.title || 'Unnamed payment'), campaigns: [],
            rows: [], agreed: 0, paid: 0, toApprove: 0, toPay: 0, left: 0, late: 0 }
      map.set(key, c)
    }
    c.rows.push(r)
    if (r.campaign_name && !c.campaigns.some(x => x.name === r.campaign_name)) {
      c.campaigns.push({ id: r.campaign_id || null, name: r.campaign_name })
    }
    if (r.status === 'cancelled') continue
    c.agreed += amt(r)
    if (r.status === 'paid') c.paid += amt(r)
    if (r.status === 'owed') c.toApprove += amt(r)
    if (r.status === 'approved') c.toPay += amt(r)
    c.late = Math.max(c.late, lateDays(r))
  }
  for (const c of map.values()) {
    c.left = c.toApprove + c.toPay
    const rank = (s: string) => (s === 'owed' ? 0 : s === 'approved' ? 1 : s === 'paid' ? 2 : 3)
    c.rows.sort((a, b) => rank(a.status) - rank(b.status)
      || String(a.due_date || a.created_at || '').localeCompare(String(b.due_date || b.created_at || '')))
  }
  /* Late first, then whoever we owe most, then the settled ones by name. */
  return [...map.values()].sort((a, b) =>
    (b.late > 0 ? 1 : 0) - (a.late > 0 ? 1 : 0)
    || (b.left > 0 ? 1 : 0) - (a.left > 0 ? 1 : 0)
    || b.left - a.left
    || a.name.localeCompare(b.name))
}

export default function PayablesPage() {
  return (
    <SuperadminLayout>
      <Payables />
    </SuperadminLayout>
  )
}

function Payables() {
  const router = useRouter()
  const confirm = useConfirm()
  const { isSuperAdmin, isFullAccessStaff, canSeeCost, canSeeMargin } = useAdminAccess()
  const canPay = isSuperAdmin || isFullAccessStaff

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /* Still owed and All are the switch; the three figures above narrow it further. */
  const [view, setView] = useState<'open' | 'all' | 'approve' | 'pay' | 'paid'>('open')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  /* Creators ticked for a bulk approve or pay. Founders only. */
  const [picked, setPicked] = useState<Set<string>>(new Set())
  /* Each creator's card (contact, enrolment, bank, payout lines), read the first time the
     row is opened and kept for the visit. */
  const [cards, setCards] = useState<Record<string, any>>({})
  const loadCard = async (handle: string) => {
    setCards(c => ({ ...c, [handle]: 'loading' }))
    try {
      const res = await api(`/creator/${encodeURIComponent(handle)}`)
      setCards(c => ({ ...c, [handle]: res.data }))
    } catch {
      setCards(c => ({ ...c, [handle]: 'error' }))
    }
  }
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', creator_username: '', what_for: '', agreed_amount_aed: '', due_date: '', notes: '',
  })

  /* The whole book in one read: per-creator totals need every status at once. */
  const load = async () => {
    setLoading(true)
    setFailure(null)
    try {
      const res = await api('')
      setItems(res.data?.items || [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load creator payments'
      setFailure(msg)
      setItems([])
      toast.error(msg)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const creators = useMemo(() => byCreator(items), [items])
  const shown = creators.filter(c =>
    view === 'open' ? c.left > 0
    : view === 'approve' ? c.toApprove > 0
    : view === 'pay' ? c.toPay > 0
    : view === 'paid' ? c.paid > 0
    : true)
  useEffect(() => { setPicked(new Set()) }, [items])
  const pickedCreators = creators.filter(c => picked.has(c.key))
  const pickedOwed = pickedCreators.flatMap(c => c.rows.filter(r => r.status === 'owed'))
  const pickedApproved = pickedCreators.flatMap(c => c.rows.filter(r => r.status === 'approved'))
  const pickTotal = (rows: any[]) => rows.reduce((a, r) => a + amt(r), 0)
  const togglePick = (k: string) => setPicked(p => {
    const n = new Set(p)
    if (n.has(k)) n.delete(k); else n.add(k)
    return n
  })
  const VIEW_NAME: Record<string, string> = {
    approve: 'creators with payments to approve',
    pay: 'creators with payments to pay',
    paid: 'creators we have paid',
  }

  const sum = (s: string) => items.filter(r => r.status === s).reduce((a, r) => a + amt(r), 0)
  const count = (s: string) => items.filter(r => r.status === s).length
  const owedRows = items.filter(r => r.status === 'owed')
  const approvedRows = items.filter(r => r.status === 'approved')

  const who = (r: any) => (handleOf(r) ? `@${handleOf(r)}` : r.title)

  /** Approve or pay several payments through the money dialog, one request per row. */
  const clear = async (rows: any[], status: 'approved' | 'paid') => {
    if (!rows.length) return
    const many = rows.length !== 1
    const total = rows.reduce((a, r) => a + amt(r), 0)
    const people = new Set(rows.map(who)).size
    const ok = await confirm({
      kind: 'money',
      title: status === 'paid'
        ? `Mark ${rows.length} payment${many ? 's' : ''} paid`
        : `Approve ${rows.length} payment${many ? 's' : ''}`,
      subtitle: status === 'paid'
        ? 'Only once the bank transfer has gone. This cannot be taken back.'
        : 'Approving clears these for payment. It does not pay them.',
      amountAed: total,
      amountNote: `${rows.length} payment${many ? 's' : ''} to ${people} creator${people === 1 ? '' : 's'}`,
      recipients: rows.map(r => ({
        name: who(r),
        detail: [r.what_for || r.title, r.campaign_name].filter(Boolean).join(' · ') || undefined,
        amountAed: amt(r),
        warn: lateDays(r) ? `${lateDays(r)}d past its due date` : undefined,
      })),
      confirmLabel: status === 'paid' ? `Mark ${rows.length} paid` : `Approve ${rows.length}`,
    })
    if (!ok) return
    setBusy(true)
    const failed: string[] = []
    let done = 0
    for (const r of rows) {
      try {
        await api(`/${r.id}/status`, { method: 'POST', body: JSON.stringify({ status }) })
        done += 1
      } catch (e) {
        failed.push(`${who(r)}: ${e instanceof Error ? e.message : 'refused'}`)
      }
    }
    setBusy(false)
    if (done) toast.success(status === 'paid' ? `${done} marked paid` : `${done} approved`)
    if (failed.length) toast.error(`${failed.length} did not move. ${failed.join(' · ')}`)
    load()
  }

  const record = async () => {
    if (!form.title.trim()) { toast.error('Give the payment a title'); return }
    if (!form.agreed_amount_aed) { toast.error('Enter the amount agreed'); return }
    setBusy(true)
    try {
      await api('', { method: 'POST', body: JSON.stringify({
        ...form, agreed_amount_aed: Number(form.agreed_amount_aed), due_date: form.due_date || undefined,
      }) })
      toast.success('Payment recorded. A founder approves it next.')
      setOpen(false)
      setForm({ title: '', creator_username: '', what_for: '', agreed_amount_aed: '', due_date: '', notes: '' })
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record the payment')
    } finally { setBusy(false) }
  }

  const download = (name: string, head: string[], lines: any[][]) => {
    const csv = [head, ...lines]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  /** One line per creator, the way the question is asked: agreed, paid, left. */
  const exportByCreator = () => download('creator-payments-by-creator',
    ['Creator', 'Campaigns', 'Agreed AED', 'Paid AED', 'To approve AED', 'To pay AED', 'Left AED'],
    creators.map(c => [c.name, c.campaigns.map(x => x.name).join('; '),
                       c.agreed, c.paid, c.toApprove, c.toPay, c.left]))

  /** Every payment, as the monthly sheet had it. The rate we hold only goes in for a reader
      the policy already lets see it on screen. */
  const exportEveryPayment = () => download('creator-payments',
    ['Title', 'Creator', 'For', 'Campaign', 'Instalment', 'Agreed AED', 'Rate we hold AED', 'Status', 'Due', 'Paid'],
    items.map(i => [
      i.title, i.creator_username || '', i.what_for || '', i.campaign_name || '', i.instalment_seq || '',
      i.agreed_amount_aed, canSeeCost ? (i.catalogue_cost_aed ?? '') : '',
      WORD[i.status] ?? i.status, i.due_date || '',
      i.paid_at ? new Date(i.paid_at).toLocaleDateString('en-GB') : '',
    ]))

  const toggle = (k: string) => {
    const c = creators.find(x => x.key === k)
    if (c?.handle && !expanded.has(k) && cards[c.handle] === undefined) loadCard(c.handle)
    setExpanded(p => {
      const n = new Set(p)
      if (n.has(k)) n.delete(k); else n.add(k)
      return n
    })
  }

  /* /work/payouts forwards to #runs: land on the runs once the page has drawn them. */
  useEffect(() => {
    if (loading || typeof window === 'undefined' || window.location.hash !== '#runs') return
    document.getElementById('runs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])
  const showRuns = canPay && canSeeMargin

  const openCount = creators.filter(c => c.left > 0).length

  return (
    <>
      <div className="space-y-ds-5">
        <MoneyHubHeader
          title="Creator payments"
          sub="What we agreed with each creator, what has gone out, and what is left."
          action={
            <>
              {showRuns && (
                <Button variant="outline"
                        onClick={() => document.getElementById('runs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <Banknote className="mr-1.5 h-4 w-4" />Payout runs
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!items.length}>
                    <Download className="mr-1.5 h-4 w-4" />Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportByCreator}>One line per creator</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportEveryPayment}>Every payment</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />Record a payment
              </Button>
            </>
          }
        />

        {failure ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Could not load creator payments.</p>
            <p className="max-w-[65ch] text-sm text-muted-foreground">
              {failure}. This is not an empty book: there may be a creator owed money today who
              is not on screen.
            </p>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        ) : loading ? (
          <p className="py-8 text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <StatGrid cols={3}>
              <Stat label="To approve" icon={CircleDollarSign}
                    value={<Aed>{aedNum(sum('owed'))}</Aed>}
                    tone={count('owed') ? 'warn' : 'good'}
                    onClick={() => setView(v => (v === 'approve' ? 'open' : 'approve'))}
                    hint={count('owed')
                      ? `${count('owed')} payment${count('owed') === 1 ? '' : 's'}, recorded and waiting`
                      : 'Nothing waiting'} />
              <Stat label="To pay" icon={BadgeCheck}
                    value={<Aed>{aedNum(sum('approved'))}</Aed>}
                    tone="info"
                    onClick={() => setView(v => (v === 'pay' ? 'open' : 'pay'))}
                    hint={count('approved')
                      ? `${count('approved')} approved, not yet sent`
                      : 'Nothing approved and unpaid'} />
              <Stat label="Paid" icon={Wallet}
                    value={<Aed>{aedNum(sum('paid'))}</Aed>}
                    tone="good"
                    onClick={() => setView(v => (v === 'paid' ? 'all' : 'paid'))}
                    hint={`${count('paid')} payment${count('paid') === 1 ? '' : 's'} sent`} />
            </StatGrid>

            {canPay && (owedRows.length > 0 || approvedRows.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {owedRows.length > 0 && (
                  <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => clear(owedRows, 'approved')}>
                    Approve all {owedRows.length} · <Aed>{aedNum(sum('owed'))}</Aed>
                  </Button>
                )}
                {approvedRows.length > 0 && (
                  <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => clear(approvedRows, 'paid')}>
                    <Check className="mr-1 h-3.5 w-3.5" />Mark all {approvedRows.length} paid ·{' '}
                    <Aed>{aedNum(sum('approved'))}</Aed>
                  </Button>
                )}
              </div>
            )}

            {items.length > 0 && (
              <div className="rounded-ds-2xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                  <div className="inline-flex rounded-full bg-muted p-0.5 text-sm">
                    {([['open', `Still owed (${openCount})`], ['all', `All creators (${creators.length})`]] as const)
                      .map(([k, label]) => (
                        <button key={k} type="button" onClick={() => setView(k)}
                                className={cn('rounded-full px-3.5 py-1.5 font-medium transition-colors',
                                  view === k ? 'bg-background text-foreground shadow-sm'
                                             : 'text-muted-foreground hover:text-foreground')}>
                          {label}
                        </button>
                      ))}
                  </div>
                  {VIEW_NAME[view] ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      Showing {VIEW_NAME[view]}
                      <button type="button" aria-label="Clear the filter"
                              className="rounded-full p-0.5 hover:bg-muted hover:text-foreground"
                              onClick={() => setView('open')}><X className="h-3.5 w-3.5" /></button>
                    </span>
                  ) : (
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      Click a creator to see each payment
                    </span>
                  )}
                </div>

                {canPay && picked.size > 0 && (
                  <div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-5 py-3 text-sm">
                    <span className="font-medium">{picked.size} creator{picked.size === 1 ? '' : 's'} ticked</span>
                    {pickedOwed.length > 0 && (
                      <Button size="sm" variant="outline" disabled={busy}
                              onClick={() => clear(pickedOwed, 'approved')}>
                        Approve <span className="ml-1"><Aed>{aedNum(pickTotal(pickedOwed))}</Aed></span>
                      </Button>
                    )}
                    {pickedApproved.length > 0 && (
                      <Button size="sm" disabled={busy} onClick={() => clear(pickedApproved, 'paid')}>
                        <Check className="mr-1 h-3.5 w-3.5" />Pay <span className="ml-1"><Aed>{aedNum(pickTotal(pickedApproved))}</Aed></span>
                      </Button>
                    )}
                    <button type="button" className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                            onClick={() => setPicked(new Set())}>Clear</button>
                  </div>
                )}

                <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_120px_minmax(150px,170px)] gap-6 border-b px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Creator</span>
                  <span className="text-right">Agreed</span>
                  <span className="text-right">Paid</span>
                  <span className="text-right">Left to pay</span>
                  <span className="text-right">Next step</span>
                </div>

                {shown.length === 0 ? (
                  <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[var(--tone-good-ink)]" />
                    Every creator is paid in full.
                    <button type="button" className="underline underline-offset-2 hover:text-foreground"
                            onClick={() => setView('all')}>Show all creators</button>
                  </div>
                ) : shown.map(c => {
                  const isOpen = expanded.has(c.key)
                  const pct = c.agreed > 0 ? Math.round((c.paid / c.agreed) * 100) : 0
                  const owed = c.rows.filter(r => r.status === 'owed')
                  const approved = c.rows.filter(r => r.status === 'approved')
                  return (
                    <Fragment key={c.key}>
                      <div
                        role="button" tabIndex={0}
                        onClick={() => toggle(c.key)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.key) } }}
                        className={cn('grid cursor-pointer grid-cols-1 gap-3 border-b px-5 py-4 last:border-b-0 hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_110px_110px_120px_minmax(150px,170px)] md:items-center md:gap-6',
                          isOpen && 'bg-muted/30')}>
                        <div className="flex min-w-0 items-center gap-3">
                          {canPay && (
                            <span className="flex w-4 shrink-0" onClick={e => e.stopPropagation()}>
                              {c.left > 0 && (
                                <Checkbox aria-label={`Tick ${c.name}`} checked={picked.has(c.key)}
                                          onCheckedChange={() => togglePick(c.key)} />
                              )}
                            </span>
                          )}
                          <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold uppercase">
                            {c.name.replace(/^@/, '').slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.campaigns.map(x => x.name).join(', ') || 'No campaign'}
                              {' · '}{c.rows.length} payment{c.rows.length === 1 ? '' : 's'}
                              {c.late > 0 && (
                                <span className="text-[var(--tone-bad-ink)]"> · {c.late}d late</span>
                              )}
                            </p>
                            <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-[var(--tone-good-ink)]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <Money label="Agreed" value={c.agreed} />
                        <Money label="Paid" value={c.paid} className="text-[var(--tone-good-ink)]" />
                        <Money label="Left to pay" value={c.left} strong
                               className={c.left > 0 ? (c.late > 0 ? 'text-[var(--tone-bad-ink)]' : '') : 'text-muted-foreground'} />
                        <div className="flex justify-start md:justify-end" onClick={e => e.stopPropagation()}>
                          {c.left === 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--tone-good-ink)]">
                              <CheckCircle2 className="h-4 w-4" />Paid in full
                            </span>
                          ) : !canPay ? (
                            <Owner name="a founder" waiting />
                          ) : owed.length ? (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => clear(owed, 'approved')}>
                              Approve <span className="ml-1"><Aed>{aedNum(c.toApprove)}</Aed></span>
                            </Button>
                          ) : (
                            <Button size="sm" disabled={busy} onClick={() => clear(approved, 'paid')}>
                              <Check className="mr-1 h-3.5 w-3.5" />Pay <span className="ml-1"><Aed>{aedNum(c.toPay)}</Aed></span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className={cn('border-b bg-muted/20 px-5 py-3 last:border-b-0', canPay ? 'md:pl-[5.75rem]' : 'md:pl-[4.5rem]')}>
                          {c.handle && <CreatorCard card={cards[c.handle]} onRetry={() => loadCard(c.handle!)} />}
                          <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Payments</p>
                          {c.rows.map(r => (
                            <div key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-dashed py-2.5 text-sm last:border-b-0">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {r.what_for || r.title}
                                  {r.instalment_seq ? (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">Instalment {r.instalment_seq}</span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {r.campaign_name && (r.campaign_id ? (
                                    <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                            onClick={() => router.push(`/work/campaigns/${r.campaign_id}/timeline`)}>
                                      {r.campaign_name}
                                    </button>
                                  ) : r.campaign_name)}
                                  {r.campaign_name ? ' · ' : ''}
                                  {r.status === 'paid'
                                    ? `Paid ${day(r.paid_at)}`
                                    : lateDays(r) ? <span className="text-[var(--tone-bad-ink)]">{lateDays(r)}d past due ({day(r.due_date)})</span>
                                    : r.due_date ? `Due ${day(r.due_date)}` : 'No due date'}
                                  {waitingDays(r) > 0 && ` · waiting ${waitingDays(r)}d`}
                                  {canSeeCost && r.catalogue_cost_aed != null && Number(r.catalogue_cost_aed) !== amt(r) && (
                                    <> · our rate <Aed>{aedNum(r.catalogue_cost_aed)}</Aed></>
                                  )}
                                </p>
                              </div>
                              <span className="w-24 text-right font-medium tabular-nums"><Aed>{aedNum(amt(r))}</Aed></span>
                              <Badge variant="outline" className={cn('w-24 justify-center whitespace-nowrap', TONE[r.status])}>
                                {WORD[r.status] ?? r.status}
                              </Badge>
                              <div className="w-28 text-right">
                                {canPay && r.status === 'owed' && (
                                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => clear([r], 'approved')}>Approve</Button>
                                )}
                                {canPay && r.status === 'approved' && (
                                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => clear([r], 'paid')}>Mark paid</Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {c.handle && (
                            <button type="button" className="mt-1 py-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                                    onClick={() => router.push(`/creator-analytics/${c.handle}`)}>
                              Open {c.name}&apos;s profile
                            </button>
                          )}
                        </div>
                      )}
                    </Fragment>
                  )
                })}
              </div>
            )}

            {showRuns && (
              <section id="runs" className="scroll-mt-6 border-t pt-ds-5">
                <PayoutRunsPanel onChanged={load} />
              </section>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              What we agreed for this piece of work. A founder approves it, then marks it paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="mt-1.5" value={form.title} placeholder="e.g. Boom Challenge, reel fee"
                     onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Creator</Label>
                <Input className="mt-1.5" value={form.creator_username} placeholder="@handle"
                       onChange={e => setForm(p => ({ ...p, creator_username: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Amount agreed (AED)</Label>
                <Input className="mt-1.5" type="number" value={form.agreed_amount_aed}
                       onChange={e => setForm(p => ({ ...p, agreed_amount_aed: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">What for</Label>
                <Input className="mt-1.5" value={form.what_for} placeholder="1 reel + 3 stories"
                       onChange={e => setForm(p => ({ ...p, what_for: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Due</Label>
                <Input className="mt-1.5" type="date" value={form.due_date}
                       onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="mt-1.5" rows={2} value={form.notes}
                        placeholder="Anything worth remembering. Not bank details"
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={record} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Record it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** A money cell: right-aligned on wide screens, labelled on narrow ones. */
function Money({ label, value, strong, className }: {
  label: string; value: number; strong?: boolean; className?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 md:block md:text-right">
      <span className="text-xs text-muted-foreground md:hidden">{label}</span>
      <span className={cn('tabular-nums', strong ? 'text-base font-semibold' : 'text-sm', className)}>
        <Aed>{aedNum(value)}</Aed>
      </span>
    </div>
  )
}

const ENROL_WORD: Record<string, string> = {
  pending_approval: 'Waiting for approval', live: 'Sent, not signed yet', completed: 'Signed',
  rejected: 'Rejected', retracted: 'Withdrawn', expired: 'Expired',
}
const BANK_TONE: Record<string, string> = {
  confirmed: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  pending: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  rejected: 'border-transparent bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
}
const RUN_WORD: Record<string, string> = {
  draft: 'Run being built', file_generated: 'Bank file made', executed: 'Paid out', cancelled: 'Run cancelled',
}

/**
 * One creator: who they are, how to reach them, their paperwork, and where we pay them.
 * The bank block never carries a full account number, only the last four digits; the bank
 * file stays the one place the whole IBAN appears.
 */
function CreatorCard({ card, onRetry }: { card: any; onRetry: () => void }) {
  if (card === undefined || card === 'loading') {
    return (
      <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />Reading their details
      </p>
    )
  }
  if (card === 'error') {
    return (
      <p className="py-3 text-sm text-muted-foreground">
        Could not read this creator&apos;s details.{' '}
        <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={onRetry}>Try again</button>
      </p>
    )
  }
  const bank = card.bank
  const where = [card.city, card.country].filter(Boolean).join(', ')
  return (
    <div className="grid gap-4 pt-2 md:grid-cols-3">
      <div className="rounded-ds-xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Creator</p>
        <p className="mt-2 text-sm font-semibold">{card.name || `@${card.handle}`}</p>
        <p className="text-xs text-muted-foreground">
          @{card.handle}{card.followers != null ? ` · ${Number(card.followers).toLocaleString('en')} followers` : ''}
        </p>
        <div className="mt-3 space-y-1.5 text-sm">
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-2 hover:underline">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />{card.email}
            </a>
          )}
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-2 hover:underline">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />{card.phone}
            </a>
          )}
          {where && (
            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{where}</p>
          )}
          {!card.email && !card.phone && !where && (
            <p className="text-xs text-muted-foreground">No contact details on file yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-ds-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bank details</p>
          {bank && (
            <Badge variant="outline" className={cn('capitalize', BANK_TONE[bank.status] || BANK_TONE.pending)}>
              {bank.status === 'confirmed' ? 'Confirmed' : bank.status === 'rejected' ? 'Sent back' : 'Not confirmed'}
            </Badge>
          )}
        </div>
        {bank ? (
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />{bank.holder || 'No account holder name'}
            </p>
            <p className="font-mono tabular-nums tracking-wide">IBAN •••• {bank.last4 || '----'}</p>
            <p className="text-xs text-muted-foreground">
              {[bank.bank_name, bank.country, bank.swift ? `SWIFT ${bank.swift}` : null].filter(Boolean).join(' · ') || 'Bank not named'}
            </p>
            <p className="text-xs text-muted-foreground">From their {String(bank.source).toLowerCase()}</p>
            {bank.rejected_reason && (
              <p className="text-xs text-[var(--tone-bad-ink)]">{bank.rejected_reason}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--tone-warn-ink)]">
            No bank details yet. They give them in their enrolment link.
          </p>
        )}
      </div>

      <div className="rounded-ds-xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agreement and payouts</p>
        <div className="mt-2 space-y-2 text-sm">
          {(card.enrolments || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No enrolment link raised for them.</p>
          )}
          {(card.enrolments || []).map((e: any) => (
            <div key={e.link_id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.campaign || 'Enrolment'}</p>
                <p className="text-xs text-muted-foreground">
                  {ENROL_WORD[e.status] || e.status}
                  {e.signed_at ? ` · signed ${day(e.signed_at)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {e.agreement_url && (
                  <a href={e.agreement_url} target="_blank" rel="noreferrer" title="The signed agreement"
                     className="text-muted-foreground hover:text-foreground"><FileText className="h-4 w-4" /></a>
                )}
                <a href={`/work/enrolments/${e.link_id}`} title="Open the enrolment"
                   className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
              </div>
            </div>
          ))}
          {(card.payout_lines || []).map((l: any, i: number) => (
            <p key={`${l.run_id}-${i}`} className="text-xs text-muted-foreground">
              {RUN_WORD[l.run_status] || l.run_status} · {l.reference} · <Aed>{aedNum(l.amount_aed)}</Aed>
              {l.line_status === 'blocked' && l.block_reason && (
                <span className="text-[var(--tone-bad-ink)]"> · blocked: {l.block_reason}</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
