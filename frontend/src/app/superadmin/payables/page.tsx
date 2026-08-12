'use client'

/**
 * Creator payables — the book, not a ledger.
 *
 * Anyone internal can record a payment; only the founders mark one paid. The amount agreed is
 * frequently below the cost price we hold on a creator, because rates get negotiated campaign
 * by campaign — so when the two differ, the screen says so rather than hiding it.
 */
import { useEffect, useMemo, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgeCheck, CircleDollarSign, Wallet } from 'lucide-react'
import { PageHead, Stat, StatGrid } from '@/components/console/primitives'
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
  : `AED ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`

const TONE: Record<string, string> = {
  owed: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-muted text-muted-foreground',
}

const TABS = ['all', 'owed', 'approved', 'paid'] as const

export default function PayablesPage() {
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
      toast.error(e instanceof Error ? e.message : 'Could not load payables')
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
      toast.success('Payment booked')
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
    const head = ['Title', 'Creator', 'For', 'Campaign', 'Agreed AED', 'Catalogue AED', 'Status', 'Due', 'Paid']
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

  const owed = totals.owed?.amount ?? 0
  const approved = totals.approved?.amount ?? 0
  const paid = totals.paid?.amount ?? 0

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title="Creator payments"
          sub="Book what we owe and track it to paid. Anyone internal can record a payment — recording is not paying, and only a founder marks it paid."
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

        <StatGrid cols={3}>
          <Stat label="Owed" value={aed(owed)} tone={owed ? 'warn' : 'good'} icon={CircleDollarSign}
                hint="Recorded, not yet approved" onClick={() => setTab('owed')} />
          <Stat label="Approved" value={aed(approved)} tone="info" icon={BadgeCheck}
                hint="Cleared, waiting to be paid" onClick={() => setTab('approved')} />
          <Stat label="Paid" value={aed(paid)} tone="good" icon={Wallet}
                hint="Money that has left the company" onClick={() => setTab('paid')} />
        </StatGrid>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            {TABS.map(t => (
              <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">The book</CardTitle>
            <CardDescription>
              Where an agreed amount differs from the cost we hold, both are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-6 pb-2 text-left font-medium">Payment</th>
                      <th className="px-3 pb-2 text-left font-medium">Creator</th>
                      <th className="px-3 pb-2 text-left font-medium">Agreed</th>
                      <th className="px-3 pb-2 text-left font-medium">Status</th>
                      <th className="px-6 pb-2 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(i => {
                      const cat = i.catalogue_cost_aed
                      const diff = cat != null && Number(cat) !== Number(i.agreed_amount_aed)
                      return (
                        <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-6 py-3">
                            <p className="font-medium">{i.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {[i.what_for, i.campaign_name].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {i.creator_username ? `@${i.creator_username}` : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-medium tabular-nums">{aed(i.agreed_amount_aed)}</span>
                            {diff && (
                              <p className="text-xs text-muted-foreground">
                                catalogue {aed(cat)}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={TONE[i.status]}>{i.status}</Badge>
                          </td>
                          <td className="px-6 py-3 text-right">
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
                              <span className="text-xs text-muted-foreground">awaiting payment</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                        Nothing booked here yet.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              What we agreed for this piece of work — which can be less than the rate we hold
              on the creator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="mt-1.5" value={form.title} placeholder="e.g. Boom Challenge — reel fee"
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
                        placeholder="Anything worth remembering — bank details go elsewhere"
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={record} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Book it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  )
}
