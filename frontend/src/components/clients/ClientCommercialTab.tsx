'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Send, CheckCircle2, XCircle, Receipt, FileText, Plus, ExternalLink } from 'lucide-react'
import { clientCommercialApi, type ClientDocument, type CampaignInvoice } from '@/services/clientCommercialApi'

const agreementBadge = (s: string | null) => {
  const map: Record<string, string> = {
    draft: 'bg-muted text-foreground', sent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    signed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    superseded: 'bg-muted text-muted-foreground', void: 'bg-destructive/10 text-destructive',
  }
  return <Badge className={map[s || ''] || 'bg-muted'}>{s || '—'}</Badge>
}
const payBadge = (s: string) => {
  if (s === 'paid') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Paid</Badge>
  if (s === 'partial') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>
  return <Badge variant="destructive">Unpaid</Badge>
}
const aed = (n: number | null) => (n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE')}`)

export function ClientCommercialTab({ teamId }: { teamId: string }) {
  const [docs, setDocs] = useState<ClientDocument[]>([])
  const [invoices, setInvoices] = useState<CampaignInvoice[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [newInv, setNewInv] = useState({ invoice_type: 'advance', amount_aed: '', advance_pct: '', payment_terms: '', due_date: '', payment_link_url: '' })

  const agrInput = useRef<HTMLInputElement>(null)
  const signInput = useRef<HTMLInputElement>(null)
  const invFileInput = useRef<HTMLInputElement>(null)
  const receiptInput = useRef<HTMLInputElement>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = async () => {
    setErr(null)
    try {
      const [d, i] = await Promise.all([
        clientCommercialApi.listDocuments(teamId),
        clientCommercialApi.listInvoices(teamId),
      ])
      setDocs(d.data || [])
      setInvoices(i.data || [])
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to load') }
  }
  useEffect(() => { load() }, [teamId])

  const run = async (fn: () => Promise<any>) => {
    setBusy(true); setErr(null)
    try { await fn(); await load() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Action failed') }
    finally { setBusy(false); setActingId(null) }
  }

  const agreements = docs.filter((d) => d.doc_type === 'agreement' || d.doc_type === 'signed_agreement')

  return (
    <div className="space-y-6">
      {err && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {/* AGREEMENTS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Agreements</CardTitle>
            <CardDescription>Upload, send, and attach signed copies. New uploads supersede the prior version.</CardDescription>
          </div>
          <Button size="sm" disabled={busy} onClick={() => agrInput.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />Upload agreement
          </Button>
          <input ref={agrInput} type="file" className="hidden" accept=".pdf,.doc,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => clientCommercialApi.uploadAgreement(teamId, f)); if (agrInput.current) agrInput.current.value = '' }} />
          <input ref={signInput} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f && actingId) run(() => clientCommercialApi.signAgreement(teamId, actingId, f)); if (signInput.current) signInput.current.value = '' }} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Document</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {agreements.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">{d.file_name || d.doc_type}<ExternalLink className="h-3 w-3" /></a> : (d.file_name || d.doc_type)}
                    {d.doc_type === 'signed_agreement' && <Badge variant="outline" className="ml-2">signed copy</Badge>}
                  </TableCell>
                  <TableCell>v{d.version}</TableCell>
                  <TableCell>{agreementBadge(d.status)}</TableCell>
                  <TableCell className="text-right">
                    {d.doc_type === 'agreement' && d.status !== 'void' && d.status !== 'superseded' && (
                      <div className="flex justify-end gap-1">
                        {d.status === 'draft' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => clientCommercialApi.sendAgreement(teamId, d.id))}><Send className="h-4 w-4" /></Button>}
                        {d.status !== 'signed' && <Button size="sm" variant="ghost" disabled={busy} title="Mark signed / attach copy" onClick={() => { setActingId(d.id); signInput.current?.click() }}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>}
                        <Button size="sm" variant="ghost" disabled={busy} title="Void" onClick={() => run(() => clientCommercialApi.voidAgreement(teamId, d.id))}><XCircle className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {agreements.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">No agreements yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* INVOICES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" />Invoices</CardTitle>
          <CardDescription>Manual invoicing — paste a Stripe link, upload the QuickBooks PDF, mark paid, attach receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* create */}
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={newInv.invoice_type} onValueChange={(v) => setNewInv((p) => ({ ...p, invoice_type: v }))}>
                <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="advance">Advance</SelectItem><SelectItem value="interim">Interim</SelectItem><SelectItem value="final">Final</SelectItem></SelectContent>
              </Select></div>
            <div><Label className="text-xs">Amount (AED)</Label><Input className="h-8 w-32" type="number" value={newInv.amount_aed} onChange={(e) => setNewInv((p) => ({ ...p, amount_aed: e.target.value }))} /></div>
            <div><Label className="text-xs">Advance %</Label><Input className="h-8 w-24" type="number" value={newInv.advance_pct} onChange={(e) => setNewInv((p) => ({ ...p, advance_pct: e.target.value }))} /></div>
            <div className="flex-1 min-w-[160px]"><Label className="text-xs">Payment link</Label><Input className="h-8" placeholder="https://…" value={newInv.payment_link_url} onChange={(e) => setNewInv((p) => ({ ...p, payment_link_url: e.target.value }))} /></div>
            <div><Label className="text-xs">Terms</Label><Input className="h-8 w-32" value={newInv.payment_terms} onChange={(e) => setNewInv((p) => ({ ...p, payment_terms: e.target.value }))} /></div>
            <Button size="sm" disabled={busy} onClick={() => run(async () => {
              await clientCommercialApi.createInvoice(teamId, {
                invoice_type: newInv.invoice_type,
                amount_aed: newInv.amount_aed ? Number(newInv.amount_aed) : undefined,
                advance_pct: newInv.advance_pct ? Number(newInv.advance_pct) : undefined,
                payment_terms: newInv.payment_terms || undefined,
                payment_link_url: newInv.payment_link_url || undefined,
              } as any)
              setNewInv({ invoice_type: 'advance', amount_aed: '', advance_pct: '', payment_terms: '', due_date: '', payment_link_url: '' })
            })}><Plus className="mr-1 h-4 w-4" />Create</Button>
          </div>

          <input ref={invFileInput} type="file" className="hidden" accept=".pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f && actingId) run(() => clientCommercialApi.uploadInvoiceFile(teamId, actingId, f)); if (invFileInput.current) invFileInput.current.value = '' }} />
          <input ref={receiptInput} type="file" className="hidden" accept=".pdf,image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f && actingId) run(() => clientCommercialApi.addReceipt(teamId, actingId, f)); if (receiptInput.current) receiptInput.current.value = '' }} />

          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Receipts</TableHead><TableHead>Link / PDF</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="capitalize">{inv.invoice_type}</TableCell>
                  <TableCell>{aed(inv.amount_aed)}{inv.amount_paid ? <span className="text-xs text-muted-foreground"> ({aed(inv.amount_paid)} paid)</span> : null}</TableCell>
                  <TableCell>{payBadge(inv.status)}</TableCell>
                  <TableCell>{inv.receipt_count || 0}</TableCell>
                  <TableCell className="space-x-2">
                    {inv.payment_link_url && <a href={inv.payment_link_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">link</a>}
                    {inv.invoice_file_url && <a href={inv.invoice_file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">PDF</a>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="ghost" disabled={busy} title="Upload invoice PDF" onClick={() => { setActingId(inv.id); invFileInput.current?.click() }}><Upload className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" disabled={busy} title="Add receipt" onClick={() => { setActingId(inv.id); receiptInput.current?.click() }}><Receipt className="h-4 w-4" /></Button>
                      {inv.status !== 'paid' && (
                        <>
                          <Button size="sm" variant="ghost" disabled={busy} title="Mark partial" onClick={() => { const ref = window.prompt('Payment reference (optional):') || undefined; const amt = window.prompt('Amount paid (AED):'); run(() => clientCommercialApi.markInvoice(teamId, inv.id, { status: 'partial', amount_paid: amt ? Number(amt) : undefined, payment_reference: ref })) }}>½</Button>
                          <Button size="sm" variant="ghost" disabled={busy} title="Mark paid" onClick={() => { const ref = window.prompt('Payment reference (optional):') || undefined; run(() => clientCommercialApi.markInvoice(teamId, inv.id, { status: 'paid', amount_paid: inv.amount_aed || undefined, payment_reference: ref })) }}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
