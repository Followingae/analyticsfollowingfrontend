'use client'

/**
 * Creator payables — the book, not a ledger.
 *
 * Anyone internal can record a payment; only the founders mark one paid. The amount agreed is
 * frequently below the cost price we hold on a creator, because rates get negotiated campaign
 * by campaign — so when the two differ, the screen says so rather than hiding it.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgeCheck, CircleDollarSign, Wallet } from 'lucide-react'
import { Stat, StatGrid } from '@/components/console/primitives'
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

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/payables`

async function api(path = '', init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

const aed = (n: any) => n == null ? '—'
  : `⃃ ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`

/* These were a fifth set of hand-picked palette steps, so "owed" was a slightly different
   amber here than the amber on Today. They now name the console tone tokens: decided once,
   and scoped to the console shell by construction. */
const TONE: Record<string, string> = {
  owed: 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  approved: 'border-transparent bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  paid: 'border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  cancelled: 'border-transparent bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const TABS = ['all', 'owed', 'approved', 'paid'] as const

export default function PayablesPage() {
  const router = useRouter()
  const { isSuperAdmin, isFullAccessStaff } = useAdminAccess()
  const canPay = isSuperAdmin || isFullAccessStaff

  const [items, setItems] = useState<any[]>([])
  const [totals, setTotals] = useState<Record<string, any>>({})
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', creator_username: '', what_for: '', agreed_amount_aed: '', due_date: '', notes: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api(tab === 'all' ? '' : `?status=${tab}`)
      setItems(res.data?.items || [])
      setTotals(res.data?.totals || {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load creator payments')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [tab])

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
      toast.error(e instanceof Error ? e.message : 'Could not record it')
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
    const rows = items.map(i => [
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
   * These three read `?? 0`, and `totals` is `res.data?.totals || {}`. A response that came
   * back without its totals block therefore printed a confident nought against Owed — on the
   * one screen whose whole job is to say how much we still owe creators. "We owe nobody
   * anything" and "we never managed to ask" must not look the same. A real zero still prints
   * as zero, because in that case the API sent the number.
   */
  const owed = totals.owed?.amount ?? null
  const approved = totals.approved?.amount ?? null
  const paid = totals.paid?.amount ?? null

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <MoneyHubHeader
          title="Creator payments"
          sub="Record what we owe a creator and follow it through to paid. Recording is not paying. A founder marks a payment paid."
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

        {/* A tone is a claim about the state of the money. With the figure unknown there is no
            claim to make, so an absent total is neutral rather than green. */}
        <StatGrid cols={3}>
          <Stat label="Owed" value={aed(owed)} icon={CircleDollarSign}
                tone={owed == null ? 'neutral' : owed ? 'warn' : 'good'}
                hint="Recorded, not yet approved" onClick={() => setTab('owed')} />
          <Stat label="Approved" value={aed(approved)} icon={BadgeCheck}
                tone={approved == null ? 'neutral' : 'info'}
                hint="Cleared, waiting to be paid" onClick={() => setTab('approved')} />
          <Stat label="Paid" value={aed(paid)} icon={Wallet}
                tone={paid == null ? 'neutral' : 'good'}
                hint="Money that has left the company" onClick={() => setTab('paid')} />
        </StatGrid>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            {TABS.map(t => (
              <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* The table used to sit inside a Card, which drew a rounded edge around a grid that
            already has rules of its own — a box around a box. The card comes off; the title
            and the row rule carry the same structure with two fewer edges, and the figures
            get the room the padding was using. */}
        <section data-tour="panel-all-payments" className="space-y-ds-3">
          <div className="space-y-ds-1">
            <h2 className="text-ds-subheading">All payments</h2>
            <p className="text-ds-body-sm text-muted-foreground">
              Where an agreed amount differs from the rate we hold, both are shown.
            </p>
          </div>
          <div>
            {loading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 text-left font-medium">Payment</th>
                      <th className="px-3 pb-2 text-left font-medium">Creator</th>
                      <th className="px-3 pb-2 text-left font-medium">Agreed</th>
                      <th className="px-3 pb-2 text-left font-medium">Status</th>
                      <th className="pb-2 pl-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(i => {
                      const cat = i.catalogue_cost_aed
                      const diff = cat != null && Number(cat) !== Number(i.agreed_amount_aed)
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
                          <td className="px-3 py-ds-3">
                            <span className="font-medium tabular-nums">{aed(i.agreed_amount_aed)}</span>
                            {diff && (
                              <p className="text-xs text-muted-foreground">
                                rate we hold {aed(cat)}
                              </p>
                            )}
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
                              <span className="text-xs text-muted-foreground">waiting to be paid</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">
                        Nothing recorded here yet.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              What we agreed for this piece of work, which can be less than the rate we hold
              on the creator.
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
                        placeholder="Anything worth remembering. Bank details go elsewhere"
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={record} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}
