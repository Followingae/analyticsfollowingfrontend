'use client'

/**
 * Creator payables — the book, not a ledger.
 *
 * Anyone internal can record a payment; only the founders mark one paid. The amount agreed is
 * frequently below the cost price we hold on a creator, because rates get negotiated campaign
 * by campaign — so when the two differ, the screen says so rather than hiding it.
 *
 * Two things this screen got wrong for a long time.
 *
 * A failed read drew an empty book. The three totals were taught to print a dash when they
 * did not arrive, and the table underneath them was not: it kept rendering "Nothing recorded
 * here yet" off an `items` array that a 403 or a 500 had left empty. So the top of the screen
 * said "we do not know" while the bottom said "we owe nobody anything", on the one page whose
 * whole job is saying what we owe creators. Failure is held apart from absence now, the way
 * the campaign list and the delivery board already do it.
 *
 * And the due date was collected in the dialog, written to the CSV, and never once shown on
 * screen. A book you cannot sort by "who is overdue" is a ledger, not a worklist.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { BadgeCheck, CircleDollarSign, Wallet } from 'lucide-react'
import { Aed, Empty, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import { MoneyHubHeader } from '@/components/console/MoneyHubHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Loader2, Check, Download } from 'lucide-react'
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
 * This file used to build the mark itself, as a bare U+20C3 inside a template string. No
 * system font carries that codepoint and only the primitive names the face that does, so
 * every amount on the screen rendered the mark as an empty box.
 */
const aedNum = (n: number | null | undefined) =>
  n == null ? null : Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })
const Money = ({ value }: { value: number | null | undefined }) => {
  const n = aedNum(value)
  return n === null ? <>—</> : <Aed>{n}</Aed>
}
/** Where a plain string is needed: a CSV cell, a dialog description. */
const aedText = (n: number | null | undefined) =>
  n == null ? '' : `AED ${aedNum(n)}`

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

const INK: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-[var(--tone-good-ink)]',
  warn: 'text-[var(--tone-warn-ink)]',
  bad: 'text-[var(--tone-bad-ink)]',
  info: 'text-[var(--tone-info-ink)]',
}

type Filter = 'all' | 'owed' | 'approved' | 'paid'

const FILTER_LABEL: Record<Filter, string> = {
  all: 'everything',
  owed: 'what is owed',
  approved: 'what is approved',
  paid: 'what has been paid',
}

/**
 * How the due date reads today: the thing the person chasing is counting down to.
 * Same vocabulary as the delivery board, so "3d late" means the same on both screens.
 */
function dueState(due?: string | null, status?: string): { text: string; tone: Tone } | null {
  if (!due || status === 'paid' || status === 'cancelled') return null
  const at = new Date(due + 'T00:00:00')
  if (Number.isNaN(at.getTime())) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((at.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { text: `${Math.abs(days)}d late`, tone: 'bad' }
  if (days === 0) return { text: 'Due today', tone: 'warn' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'warn' }
  return { text: day(due), tone: 'neutral' }
}

export default function PayablesPage() {
  const router = useRouter()
  const { isSuperAdmin, isFullAccessStaff } = useAdminAccess()
  const canPay = isSuperAdmin || isFullAccessStaff

  const [items, setItems] = useState<any[]>([])
  const [totals, setTotals] = useState<Record<string, any> | null>(null)
  const [tab, setTab] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
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

  /** A plain CSV of what is on screen — the thing that replaces the monthly sheet. */
  const exportCsv = () => {
    const head = ['Title', 'Creator', 'For', 'Campaign', 'Agreed AED', 'Rate we hold AED', 'Status', 'Due', 'Paid']
    const rows = ordered.map(i => [
      i.title, i.creator_username || '', i.what_for || '', i.campaign_name || '',
      i.agreed_amount_aed, i.catalogue_cost_aed ?? '', i.status, i.due_date || '',
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

  const lateCount = useMemo(
    () => items.filter(i => dueState(i.due_date, i.status)?.tone === 'bad').length, [items])

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <MoneyHubHeader
          title="Creator payments"
          sub="Recording a payment is not paying it. A founder marks it paid."
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
                once as a tab strip directly underneath saying the same four words. One
                control now, with the selected one marked and a way back to everything. */}
            <StatGrid cols={3}>
              <Stat label="Owed" value={<Money value={owed} />} icon={CircleDollarSign}
                    tone={owed == null ? 'neutral' : owed ? 'warn' : 'good'}
                    hint={tab === 'owed' ? 'Showing these' : 'Recorded, not yet approved'}
                    onClick={() => setTab('owed')} />
              <Stat label="Approved" value={<Money value={approved} />} icon={BadgeCheck}
                    tone={approved == null ? 'neutral' : 'info'}
                    hint={tab === 'approved' ? 'Showing these' : 'Cleared, not yet sent'}
                    onClick={() => setTab('approved')} />
              <Stat label="Paid" value={<Money value={paid} />} icon={Wallet}
                    tone={paid == null ? 'neutral' : 'good'}
                    hint={tab === 'paid' ? 'Showing these' : 'Out of the account'}
                    onClick={() => setTab('paid')} />
            </StatGrid>

            <div className="flex flex-wrap items-center gap-ds-3">
              <p className="text-ds-caption text-muted-foreground">
                Showing {FILTER_LABEL[tab]}
                {lateCount > 0 && (
                  <span className={cn('ml-1', INK.bad)}>
                    · {lateCount} past its due date
                  </span>
                )}
              </p>
              {tab !== 'all' && (
                <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs"
                        onClick={() => setTab('all')}>
                  Show everything
                </Button>
              )}
            </div>

            {loading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading...</p>
            ) : ordered.length === 0 ? (
              <Empty>Nothing here yet.</Empty>
            ) : (
              /* The table used to sit inside a Card, which drew a rounded edge around a grid
                 that already has rules of its own, a box around a box. The card comes off;
                 the row rule carries the same structure with two fewer edges, and the figures
                 get the room the padding was using. */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 text-left font-medium">Payment</th>
                      <th className="px-3 pb-2 text-left font-medium">Creator</th>
                      <th className="px-3 pb-2 text-right font-medium">Agreed</th>
                      <th className="px-3 pb-2 text-left font-medium">Due</th>
                      <th className="px-3 pb-2 text-left font-medium">Status</th>
                      <th className="pb-2 pl-3 text-right font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map(i => {
                      const cat = i.catalogue_cost_aed
                      const delta = cat != null && Number(cat) !== Number(i.agreed_amount_aed)
                        ? Number(i.agreed_amount_aed) - Number(cat)
                        : null
                      const d = dueState(i.due_date, i.status)
                      return (
                        <tr key={i.id} className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]">
                          <td className="py-ds-3 pr-3">
                            <p className="font-medium">{i.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {i.what_for}
                              {i.what_for && i.campaign_name ? ' · ' : ''}
                              {i.campaign_name && (
                                i.campaign_id ? (
                                  <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                          onClick={() => router.push(`/work/campaigns/${i.campaign_id}/timeline`)}>
                                    {i.campaign_name}
                                  </button>
                                ) : i.campaign_name
                              )}
                              {!i.what_for && !i.campaign_name ? '—' : ''}
                            </p>
                          </td>
                          <td className="px-3 py-ds-3">
                            {i.creator_username ? (
                              <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                      onClick={() => router.push(
                                        `/creator-analytics/${String(i.creator_username).replace(/^@/, '')}`)}>
                                @{String(i.creator_username).replace(/^@/, '')}
                              </button>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-ds-3 text-right">
                            <span className="font-medium tabular-nums">
                              <Money value={i.agreed_amount_aed} />
                            </span>
                            {/* Three lines of prose became a badge. The rate we hold is only
                                interesting where it differs, and what makes it interesting is
                                the gap, not the second figure. */}
                            {delta != null && (
                              <span
                                title={`We hold ${aedText(cat)} for this creator`}
                                className={cn(
                                  'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
                                  delta < 0
                                    ? 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]'
                                    : 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
                                )}
                              >
                                {delta > 0 ? '+' : ''}{aedNum(delta)} vs our rate
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-ds-3">
                            {d ? (
                              <span className={cn('inline-flex items-center gap-1.5 text-xs', INK[d.tone])}>
                                {d.tone !== 'neutral' && (
                                  <span aria-hidden className={cn('h-1.5 w-1.5 flex-none rounded-full',
                                    d.tone === 'bad' ? 'bg-[var(--tone-bad-dot)]' : 'bg-[var(--tone-warn-dot)]')} />
                                )}
                                {d.text}
                              </span>
                            ) : i.paid_at ? (
                              <span className="text-xs text-muted-foreground">
                                Paid {day(i.paid_at)}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-ds-3">
                            <Badge variant="outline" className={TONE[i.status]}>{i.status}</Badge>
                          </td>
                          <td className="py-ds-3 pl-3 text-right">
                            {i.status === 'owed' && (
                              <Button size="sm" variant="outline" disabled={busy}
                                      onClick={() => move(i.id, 'approved')}>Approve</Button>
                            )}
                            {i.status === 'approved' && canPay && (
                              <Button size="sm" disabled={busy} onClick={() => move(i.id, 'paid')}>
                                <Check className="mr-1 h-3.5 w-3.5" />Mark paid
                              </Button>
                            )}
                            {i.status === 'approved' && !canPay && (
                              <span className="text-xs text-muted-foreground">With a founder</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
    </SuperadminLayout>
  )
}
