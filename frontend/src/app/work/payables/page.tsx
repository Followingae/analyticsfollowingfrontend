'use client'

/**
 * Creator payables: the book, not a ledger.
 *
 * Anyone internal can record a payment; only the founders approve one and only the founders
 * mark one paid. The amount agreed is frequently below the cost price we hold on a creator,
 * because rates get negotiated campaign by campaign, so when the two differ the screen says
 * so rather than hiding it.
 *
 * Three things this screen got wrong for a long time.
 *
 * A failed read drew an empty book. The three totals were taught to print a dash when they
 * did not arrive, and the table underneath them was not: it kept rendering "Nothing recorded
 * here yet" off an `items` array that a 403 or a 500 had left empty. So the top of the screen
 * said "we do not know" while the bottom said "we owe nobody anything", on the one page whose
 * whole job is saying what we owe creators. Failure is held apart from absence now.
 *
 * The due date was collected in the dialog, written to the CSV, and never once shown on
 * screen. A book you cannot sort by "who is overdue" is a ledger, not a worklist.
 *
 * And the rows were a hand-rolled table with their own borders, their own row height and their
 * own idea of what a missing figure looks like. They are now the console's shared surfaces:
 * the shadcn table inside `TableShell`, `FilterBar` chips named after who is blocking, `Age`
 * for the two clocks, `Dash` for the three kinds of nothing, and `BulkBar` for the thing a
 * founder actually comes here to do, which is clear several payments at once.
 *
 * The confirmation host is `src/app/work/layout.tsx`, which is above this page by
 * construction, so `useConfirm()` resolves here whatever shape this file takes. It did not
 * used to be: the shells mounted the provider around their own children, so a page that
 * called the hook and then rendered the shell sat above its own provider, the hook failed
 * closed, and a money dialog never opened. The split below is no longer load bearing. It is
 * kept because the wrapper is the right place for the layout and the density, and the screen
 * itself stays one component.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { BadgeCheck, CircleDollarSign, Wallet, Plus, Loader2, Check, Download } from 'lucide-react'
import { Aed, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import {
  Age,
  BulkBar,
  Dash,
  DENSITY,
  DensityProvider,
  DensityToggle,
  FilterBar,
  NoMatches,
  Owner,
  TableShell,
  useDensity,
  type FilterChip,
} from '@/components/console/surfaces'
import { EntityTile } from '@/components/console/Glyph'
import { useConfirm } from '@/components/console/confirm'
import { MoneyHubHeader } from '@/components/console/MoneyHubHeader'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

/**
 * The figure only. The dirham mark is the `Aed` primitive's job, in the font that carries it.
 *
 * This file used to build the mark itself, as a bare codepoint inside a template string. No
 * system font carries that codepoint and only the primitive names the face that does, so
 * every amount on the screen rendered the mark as an empty box.
 */
const aedNum = (n: number | null | undefined) =>
  n == null ? null : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })

/** Where a plain string is needed: a CSV cell, a tooltip, a dialog description. */
const aedText = (n: number | null | undefined) => (n == null ? '' : `AED ${aedNum(n)}`)

const day = (iso?: string | null) =>
  !iso ? '' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/* These were a fifth set of hand-picked palette steps, so "owed" was a slightly different
   amber here than the amber on Today. They now name the console tone tokens: decided once,
   and scoped to the console shell by construction. */
const TONE: Record<string, string> = {
  owed: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  approved: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  paid: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  cancelled: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

/** Colour never travels without the word, so the status is always spelled out beside it. */
const WORD: Record<string, string> = {
  owed: 'Owed', approved: 'Approved', paid: 'Paid', cancelled: 'Cancelled',
}

const INK: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-[var(--tone-good-ink)]',
  warn: 'text-[var(--tone-warn-ink)]',
  bad: 'text-[var(--tone-bad-ink)]',
  info: 'text-[var(--tone-info-ink)]',
}

type Filter = 'all' | 'owed' | 'approved' | 'paid'

/** A row is actionable while it is still moving. Paid and cancelled are finished. */
const OPEN = new Set(['owed', 'approved'])

const DAY_MS = 86_400_000
const midnight = () => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t.getTime()
}

/**
 * The two clocks, kept apart the way `Age` keeps them apart.
 *
 * `ageDays` is how long the row has sat in the book. `lateDays` is how far past the date we
 * promised, and it only exists while the payment is still open: a payment that has gone out
 * is not late, whatever its due date said. Amber at four days and red when late are the
 * component's business, not this file's.
 */
function clocks(row: any): { ageDays: number; lateDays?: number } {
  const created = row.created_at ? new Date(row.created_at).getTime() : NaN
  const age = Number.isNaN(created) ? 0 : Math.max(0, Math.floor((midnight() - created) / DAY_MS))
  if (!row.due_date || !OPEN.has(row.status)) return { ageDays: age }
  const due = new Date(`${String(row.due_date).slice(0, 10)}T00:00:00`).getTime()
  if (Number.isNaN(due)) return { ageDays: age }
  const late = Math.floor((midnight() - due) / DAY_MS)
  return { ageDays: age, lateDays: late > 0 ? late : undefined }
}

export default function PayablesPage() {
  /* Dense by default. This is a money grid with several numeric columns, which is the tier
     dense exists for; the toggle in the toolbar remembers whatever the reader prefers. */
  return (
    <SuperadminLayout>
      <DensityProvider id="payables" initial="dense">
        <Payables />
      </DensityProvider>
    </SuperadminLayout>
  )
}

function Payables() {
  const router = useRouter()
  const confirm = useConfirm()
  const { isSuperAdmin, isFullAccessStaff, canSeeCost } = useAdminAccess()
  const canPay = isSuperAdmin || isFullAccessStaff

  const [items, setItems] = useState<any[]>([])
  const [totals, setTotals] = useState<Record<string, any> | null>(null)
  const [tab, setTab] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    title: '', creator_username: '', what_for: '', agreed_amount_aed: '', due_date: '', notes: '',
  })

  /**
   * A refused read and an empty book are different facts, and on this screen the difference
   * is the difference between "we owe nobody" and "we never managed to ask".
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setFailure(null)
    try {
      const res = await api(tab === 'all' ? '' : `?status=${tab}`)
      setItems(res.data?.items || [])
      setTotals(res.data?.totals || {})
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load creator payments'
      setFailure(msg)
      setItems([])
      setTotals(null)
      toast.error(msg)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [tab])   // eslint-disable-line react-hooks/exhaustive-deps

  /* A tick means nothing once the rows underneath it have been replaced. */
  useEffect(() => { setPicked(new Set()) }, [items])

  const record = async () => {
    if (!form.title.trim()) { toast.error('Give the payment a title'); return }
    if (!form.agreed_amount_aed) { toast.error('Enter the amount agreed'); return }
    setBusy(true)
    try {
      await api('', { method: 'POST', body: JSON.stringify({
        ...form,
        agreed_amount_aed: Number(form.agreed_amount_aed),
        due_date: form.due_date || undefined,
      }) })
      toast.success('Payment recorded')
      setOpen(false)
      setForm({ title: '', creator_username: '', what_for: '', agreed_amount_aed: '', due_date: '', notes: '' })
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record the payment')
    } finally { setBusy(false) }
  }

  const move = async (id: string, status: string) => {
    setBusy(true)
    try {
      await api(`/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })
      toast.success(status === 'paid' ? 'Marked paid' : `Marked ${status}`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update')
    } finally { setBusy(false) }
  }

  const who = (r: any) =>
    r.creator_username ? `@${String(r.creator_username).replace(/^@/, '')}` : r.title

  /**
   * Several payments at once, through the money dialog.
   *
   * The dialog restates the total and NAMES every creator, because "approve 9" is not a fact
   * anybody can check and "Aisha 4,000, Noor 2,500, and seven more" is. One request per row
   * rather than a bulk endpoint: the server refuses individually, for an unconfirmed payee or
   * an unfunded campaign, and those refusals have to survive as "seven went, two did not, and
   * here is why" rather than as one failed call.
   */
  const clear = async (rows: any[], status: 'approved' | 'paid') => {
    if (!rows.length) return
    const many = rows.length !== 1
    const total = rows.reduce((a, r) => a + Number(r.agreed_amount_aed || 0), 0)
    const creators = new Set(rows.map(r => who(r))).size
    const ok = await confirm({
      kind: 'money',
      title: status === 'paid'
        ? `Mark ${rows.length} payment${many ? 's' : ''} paid`
        : `Approve ${rows.length} payment${many ? 's' : ''}`,
      subtitle: status === 'paid'
        ? 'The bank has already moved, so this cannot be taken back.'
        : 'Approving clears these for payment. It does not pay them.',
      amountAed: total,
      amountNote: `${rows.length} payment${many ? 's' : ''} to ${creators} creator${creators === 1 ? '' : 's'}`,
      recipients: rows.map(r => {
        const late = clocks(r).lateDays
        return {
          name: who(r),
          detail: [r.what_for, r.campaign_name].filter(Boolean).join(' · ') || undefined,
          amountAed: Number(r.agreed_amount_aed || 0),
          warn: late ? `${late}d past its due date` : undefined,
        }
      }),
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
    setPicked(new Set())
    if (done) {
      toast.success(status === 'paid'
        ? `${done} payment${done === 1 ? '' : 's'} marked paid`
        : `${done} payment${done === 1 ? '' : 's'} approved`)
    }
    /* Named, not counted. A row that did not move is the only thing worth reading here. */
    if (failed.length) toast.error(`${failed.length} did not move. ${failed.join(' · ')}`)
    load()
  }

  /** A plain CSV of what is on screen, the thing that replaces the monthly sheet. */
  const exportCsv = () => {
    const head = ['Title', 'Creator', 'For', 'Campaign', 'Agreed AED', 'Rate we hold AED', 'Status', 'Due', 'Paid']
    const rows = ordered.map(i => [
      i.title, i.creator_username || '', i.what_for || '', i.campaign_name || '',
      i.agreed_amount_aed,
      /* Cost leaves the building in a file nobody can scrub afterwards, so it only goes in
         for a reader the policy already allows to see it on screen. */
      canSeeCost ? (i.catalogue_cost_aed ?? '') : '',
      i.status, i.due_date || '',
      i.paid_at ? new Date(i.paid_at).toLocaleDateString('en-GB') : '',
    ])
    const csv = [head, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `creator-payments-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  /**
   * A total that never arrived is a dash, not a zero.
   *
   * `totals` is null until a read succeeds, so a response that came back without its totals
   * block cannot print a confident nought against Owed. "We owe nobody anything" and "we
   * never managed to ask" must not look the same. A real zero still prints as zero, because
   * in that case the API sent the number.
   */
  const owed = totals?.owed?.amount ?? null
  const approved = totals?.approved?.amount ?? null
  const paid = totals?.paid?.amount ?? null

  /* Whoever is waiting longest, first. The book arrived in whatever order the query gave it,
     which meant the row that needed chasing could be anywhere on the page. */
  const ordered = useMemo(() => {
    const rank = (s: string) => (s === 'owed' ? 0 : s === 'approved' ? 1 : 2)
    return [...items].sort((a, b) => {
      const byStatus = rank(a.status) - rank(b.status)
      if (byStatus) return byStatus
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0
    })
  }, [items])

  const lateCount = useMemo(() => items.filter(i => clocks(i).lateDays).length, [items])

  /**
   * The chips are named after who is blocking, which on this screen is always a founder: the
   * server refuses both the approval and the payment to anybody else. So the words change with
   * the viewer. For a founder these are two queues of her own; for everyone else they are two
   * ways of saying "chase a founder", and which rung it is stuck on is the useful part.
   *
   * Counts come from `totals`, not from `items`, because `items` is already filtered to the
   * selected status and counting it would make every chip read the size of the current view.
   * A count is a fact, so it shows at zero.
   */
  const n = (k: string) => Number(totals?.[k]?.count ?? 0)
  const chips: FilterChip[] = [
    { key: 'all', label: 'Everything', n: n('owed') + n('approved') + n('paid') + n('cancelled') },
    { key: 'owed', label: canPay ? 'For you to approve' : 'Waiting on a founder to approve', n: n('owed') },
    { key: 'approved', label: canPay ? 'For you to pay' : 'Waiting on a founder to pay', n: n('approved') },
    { key: 'paid', label: 'Paid', n: n('paid') },
  ]

  /* Only a founder can move a row, so only a founder has anything to tick. */
  const selectable = canPay ? ordered.filter(r => OPEN.has(r.status)) : []
  const selected = ordered.filter(r => picked.has(r.id))
  const selectedOwed = selected.filter(r => r.status === 'owed')
  const selectedApproved = selected.filter(r => r.status === 'approved')
  const selectedTotal = selected.reduce((a, r) => a + Number(r.agreed_amount_aed || 0), 0)

  const toggle = (id: string) => setPicked(p => {
    const next = new Set(p)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleAll = () => setPicked(p =>
    p.size === selectable.length ? new Set() : new Set(selectable.map(r => r.id)))

  return (
    <>
      <div className="space-y-ds-5">
        <MoneyHubHeader
          title="Creator payments"
          sub="Recording a payment is not paying it. A founder approves it, and a founder marks it paid."
          action={
            <>
              <Button variant="outline" onClick={exportCsv} disabled={!items.length}>
                <Download className="mr-1.5 h-4 w-4" />Export
              </Button>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />Record a payment
              </Button>
            </>
          }
        />

        {failure ? (
          /* An error is not an empty book. Nothing below is known, so nothing below is drawn:
             no totals, no list, and above all no "nothing recorded here yet". */
          <div className="space-y-3">
            <p className="text-sm font-medium">Could not load creator payments.</p>
            <p className="max-w-[65ch] text-sm text-muted-foreground">
              {failure}. This is not an empty book, and nothing here is known: there may be a
              creator owed money today who is not on screen.
            </p>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        ) : (
          <>
            {/* The three figures ARE the filter, and used to be drawn twice: once here and
                once as a tab strip underneath saying the same four words. The chips in the
                table's toolbar are the one control now; these stay as the figures. */}
            <StatGrid cols={3}>
              <Stat label="Owed" value={<Total value={owed} />} icon={CircleDollarSign}
                    tone={owed == null ? 'neutral' : owed ? 'warn' : 'good'}
                    hint={tab === 'owed' ? 'Showing these' : 'Recorded, not yet approved'}
                    onClick={() => setTab('owed')} />
              <Stat label="Approved" value={<Total value={approved} />} icon={BadgeCheck}
                    tone={approved == null ? 'neutral' : 'info'}
                    hint={tab === 'approved' ? 'Showing these' : 'Cleared, not yet sent'}
                    onClick={() => setTab('approved')} />
              <Stat label="Paid" value={<Total value={paid} />} icon={Wallet}
                    tone={paid == null ? 'neutral' : 'good'}
                    hint={tab === 'paid' ? 'Showing these' : 'Out of the account'}
                    onClick={() => setTab('paid')} />
            </StatGrid>

            {loading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading...</p>
            ) : items.length === 0 && tab === 'all' ? (
              /* Genuinely nothing in the book: no table, no placeholder and no invitation.
                 The way to add the first payment is already in the header. */
              null
            ) : (
              <TableShell
                toolbar={
                  /* A grid child stretches, so the chips get the full width and the density
                     toggle keeps the right edge the FilterBar reserves for it. */
                  <div className="grid w-full">
                    <FilterBar chips={chips} value={tab} onChange={k => setTab(k as Filter)}
                               right={<DensityToggle />} />
                  </div>
                }
                footer={
                  <span className="text-ds-caption tabular-nums">
                    {ordered.length} payment{ordered.length === 1 ? '' : 's'} here
                    {lateCount > 0 && (
                      <span className={cn('ml-1', INK.bad)}>
                        · {lateCount} past its due date
                      </span>
                    )}
                  </span>
                }
                bulk={
                  <BulkBar
                    count={selected.length}
                    summary={<>Worth <Aed>{aedNum(selectedTotal)}</Aed> together</>}
                    /* Nothing to tick for anyone who cannot approve or pay, so the bar says
                       who can rather than inviting a selection that leads nowhere. */
                    idleHint={canPay
                      ? 'Tick rows to approve or pay several at once'
                      : 'Only a founder can approve or pay these'}
                  >
                    {canPay && selectedOwed.length > 0 && (
                      <Button size="sm" variant="secondary" disabled={busy}
                              onClick={() => clear(selectedOwed, 'approved')}>
                        Approve {selectedOwed.length}
                      </Button>
                    )}
                    {canPay && selectedApproved.length > 0 && (
                      <Button size="sm" variant="secondary" disabled={busy}
                              onClick={() => clear(selectedApproved, 'paid')}>
                        <Check className="mr-1 h-3.5 w-3.5" />Mark {selectedApproved.length} paid
                      </Button>
                    )}
                  </BulkBar>
                }
              >
                {ordered.length === 0 ? (
                  <NoMatches onClear={() => setTab('all')} />
                ) : (
                  <Rows
                    rows={ordered}
                    canPay={canPay}
                    canSeeCost={canSeeCost}
                    busy={busy}
                    picked={picked}
                    selectableCount={selectable.length}
                    onToggle={toggle}
                    onToggleAll={toggleAll}
                    onApprove={id => move(id, 'approved')}
                    onPay={row => clear([row], 'paid')}
                    onCampaign={id => router.push(`/work/campaigns/${id}/timeline`)}
                    onCreator={u => router.push(`/creator-analytics/${u}`)}
                  />
                )}
              </TableShell>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              What we agreed for this piece of work. It can differ from the rate we hold.
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

/** A headline figure that did not arrive. Never a zero: the API did not send a number. */
function Total({ value }: { value: number | null }) {
  return value == null
    ? <Dash reason="unmeasured" what="this total" />
    : <Aed>{aedNum(value)}</Aed>
}

/* ══ The rows ═════════════════════════════════════════════════════════════════════════════ */

/**
 * A payments list is tabular data, so it is a table: a screen reader is told how many columns
 * there are and which header each figure sits under, which a grid of divs cannot say. Density
 * is read from the view rather than passed down, and only padding and row height move with it.
 */
function Rows({
  rows, canPay, canSeeCost, busy, picked, selectableCount,
  onToggle, onToggleAll, onApprove, onPay, onCampaign, onCreator,
}: {
  rows: any[]
  canPay: boolean
  canSeeCost: boolean
  busy: boolean
  picked: Set<string>
  selectableCount: number
  onToggle: (id: string) => void
  onToggleAll: () => void
  onApprove: (id: string) => void
  onPay: (row: any) => void
  onCampaign: (id: string) => void
  onCreator: (username: string) => void
}) {
  const d = DENSITY[useDensity()]
  const head = cn(d.cell, 'sticky top-0 z-10 h-auto whitespace-nowrap bg-card')

  return (
    <Table>
      <TableHeader>
        <TableRow className={d.row}>
          <TableHead className={cn(head, 'w-0')}>
            <Checkbox
              aria-label="Tick every payment that can still move"
              checked={selectableCount > 0 && picked.size === selectableCount}
              disabled={selectableCount === 0}
              onCheckedChange={onToggleAll}
            />
          </TableHead>
          <TableHead className={head}>Payment</TableHead>
          <TableHead className={head}>Creator</TableHead>
          <TableHead className={cn(head, 'text-right')}>Agreed</TableHead>
          <TableHead className={head}>Waiting</TableHead>
          <TableHead className={head}>Status</TableHead>
          <TableHead className={cn(head, 'w-0 text-right')}>
            <span className="sr-only">What you can do</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(i => {
          const { ageDays, lateDays } = clocks(i)
          const cat = i.catalogue_cost_aed
          const delta = cat != null && Number(cat) !== Number(i.agreed_amount_aed)
            ? Number(i.agreed_amount_aed) - Number(cat)
            : null
          const movable = OPEN.has(i.status)
          const handle = i.creator_username ? String(i.creator_username).replace(/^@/, '') : null
          const ticked = picked.has(i.id)

          return (
            <TableRow key={i.id} className={d.row} data-state={ticked ? 'selected' : undefined}>
              <TableCell className={cn(d.cell, 'w-0')}>
                {movable && canPay ? (
                  <Checkbox
                    aria-label={`Tick ${i.title}`}
                    checked={ticked}
                    onCheckedChange={() => onToggle(i.id)}
                  />
                ) : null}
              </TableCell>

              <TableCell className={d.cell}>
                <div className={cn('flex items-center', d.gap)}>
                  <EntityTile kind="payout" size="row" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{i.title}</p>
                    <p className="truncate text-xs leading-tight text-muted-foreground">
                      {i.what_for}
                      {i.what_for && i.campaign_name ? ' · ' : ''}
                      {i.campaign_name && (
                        i.campaign_id ? (
                          <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                  onClick={() => onCampaign(i.campaign_id)}>
                            {i.campaign_name}
                          </button>
                        ) : i.campaign_name
                      )}
                      {!i.what_for && !i.campaign_name && (
                        <Dash reason="unset" what="what this payment is for" />
                      )}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className={d.cell}>
                {handle ? (
                  <button type="button"
                          className="whitespace-nowrap text-sm underline underline-offset-2 hover:text-foreground"
                          onClick={() => onCreator(handle)}>
                    @{handle}
                  </button>
                ) : <Dash reason="unset" what="a creator" />}
              </TableCell>

              <TableCell className={cn(d.cell, 'text-right tabular-nums')}>
                <span className="whitespace-nowrap font-medium">
                  {i.agreed_amount_aed == null
                    ? <Dash reason="unset" what="the amount agreed" />
                    : <Aed>{aedNum(i.agreed_amount_aed)}</Aed>}
                </span>
                {/* The rate we hold is cost, and it is only interesting where it differs from
                    what we agreed. What makes it interesting is the gap rather than the second
                    figure, so it stays one badge and never becomes a column. A reader who may
                    not see cost gets the dash instead: that gap IS the cost, reached by
                    subtraction, so printing it would hand over the figure the policy hides. */}
                {cat != null && !canSeeCost && (
                  <span className="ml-2"><Dash reason="unseen" what="the rate we hold" /></span>
                )}
                {delta != null && canSeeCost && (
                  <span
                    title={`We hold ${aedText(cat)} for this creator`}
                    className={cn(
                      'ml-2 inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
                      delta < 0
                        ? 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
                        : 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
                    )}
                  >
                    {delta > 0 ? '+' : ''}{aedNum(delta)} vs our rate
                  </span>
                )}
              </TableCell>

              <TableCell className={d.cell}>
                {movable ? (
                  <span className={cn('flex items-center whitespace-nowrap', d.gap)}>
                    <Age days={ageDays} lateDays={lateDays} />
                    {!lateDays && (
                      i.due_date
                        ? <span className="text-xs text-muted-foreground">due {day(i.due_date)}</span>
                        : <Dash reason="unset" what="a due date" />
                    )}
                  </span>
                ) : i.paid_at ? (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    Paid {day(i.paid_at)}
                  </span>
                ) : <Dash reason="unset" what="a payment date" />}
              </TableCell>

              <TableCell className={d.cell}>
                <Badge variant="outline" className={cn('whitespace-nowrap', TONE[i.status])}>
                  {WORD[i.status] ?? i.status}
                </Badge>
              </TableCell>

              <TableCell className={cn(d.cell, 'w-0 text-right')}>
                {/* One promoted action per row. Marking paid is money leaving the account, so
                    it goes through the money dialog even for a single row; approving does not,
                    because approving is a step towards paying and not the payment.

                    BOTH are a founder's act: the server refuses `approved` and `paid` to
                    anyone else. So for anyone else neither button is drawn, and the cell says
                    where the ball is instead. Approve used to be drawn for everybody and
                    answered 403, which is the worst of the three options: a control that
                    exists only to refuse you teaches people the screen is lying. */}
                {movable && canPay && (
                  i.status === 'owed' ? (
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => onApprove(i.id)}>Approve</Button>
                  ) : (
                    <Button size="sm" disabled={busy} onClick={() => onPay(i)}>
                      <Check className="mr-1 h-3.5 w-3.5" />Mark paid
                    </Button>
                  )
                )}
                {movable && !canPay && <Owner name="a founder" waiting />}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
