'use client';

/**
 * Operations OS — per-type production tab.
 * Renders the right production entity for the workstream type, all wired to the
 * live /operations production endpoints:
 *   shoots   → ops_production_batches (video_shoot / photo_shoot)
 *   events   → ops_events            (event_activation)
 *   payouts  → ops_payouts           (influencer_paid)
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash, Calendar, MapPin, Coins, CheckCircle, Package } from 'lucide-react';
import { operationsApi } from '@/services/operationsApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Mode = 'shoots' | 'events' | 'payouts';

const CONFIG: Record<Mode, { title: string; desc: string; addLabel: string }> = {
  shoots: { title: 'Shoots', desc: 'Production days, locations and call sheets', addLabel: 'Add Shoot' },
  events: { title: 'Events', desc: 'Activations and on-ground events', addLabel: 'Add Event' },
  payouts: { title: 'Payouts', desc: 'Creator payments for this campaign', addLabel: 'Add Payout' },
};

export function ProductionTab({
  mode, workstreamId, campaignId, isInternal,
}: { mode: Mode; workstreamId: string; campaignId: string; isInternal: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = mode === 'shoots'
        ? await operationsApi.getProductionBatches(campaignId)
        : mode === 'events'
          ? await operationsApi.getEvents(campaignId)
          : await operationsApi.getPayouts(campaignId);
      setRows((res?.data ?? res) || []);
    } catch {
      toast.error(`Failed to load ${CONFIG[mode].title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mode, campaignId]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (mode === 'shoots') {
        if (!form.name) { toast.error('Name required'); setSaving(false); return; }
        await operationsApi.createProductionBatch(workstreamId, form);
      } else if (mode === 'events') {
        if (!form.name) { toast.error('Name required'); setSaving(false); return; }
        await operationsApi.createEvent(campaignId, { ...form, workstream_id: workstreamId });
      } else {
        if (!form.creator_name) { toast.error('Creator required'); setSaving(false); return; }
        await operationsApi.createPayout(campaignId, form);
      }
      setOpen(false); setForm({});
      load();
      toast.success('Added');
    } catch {
      toast.error('Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (mode === 'shoots') await operationsApi.deleteProductionBatch(id);
      else if (mode === 'events') await operationsApi.deleteEvent(id);
      else return;
      setRows(prev => prev.filter(r => r.id !== id));
      toast.success('Removed');
    } catch { toast.error('Failed to remove'); }
  };

  const markPaid = async (id: string) => {
    try {
      await operationsApi.updatePayout(id, { status: 'paid' });
      setRows(prev => prev.map(r => (r.id === id ? { ...r, status: 'paid' } : r)));
      toast.success('Marked paid');
    } catch { toast.error('Failed'); }
  };

  const fmtDate = (v?: string) => (v ? format(new Date(v), 'MMM d, yyyy') : '—');

  if (loading) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{CONFIG[mode].title}</h3>
          <p className="text-sm text-muted-foreground">{CONFIG[mode].desc}</p>
        </div>
        {isInternal && (
          <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setForm({}); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{CONFIG[mode].addLabel}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{CONFIG[mode].addLabel}</DialogTitle>
                <DialogDescription>Wired to the live operations endpoint.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {mode === 'payouts' ? (
                  <>
                    <Field label="Creator"><Input value={form.creator_name || ''} onChange={e => setForm((f: any) => ({ ...f, creator_name: e.target.value }))} placeholder="@creator or name" /></Field>
                    <Field label="Amount (AED)"><Input type="number" value={form.amount || ''} onChange={e => setForm((f: any) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></Field>
                    <Field label="Payment method"><Input value={form.payment_method || ''} onChange={e => setForm((f: any) => ({ ...f, payment_method: e.target.value }))} placeholder="bank_transfer" /></Field>
                  </>
                ) : (
                  <>
                    <Field label="Name"><Input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder={mode === 'shoots' ? 'e.g., Day 1 — Studio' : 'e.g., Launch night'} /></Field>
                    <Field label="Date"><Input type="date" value={form.date || ''} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} /></Field>
                    {mode === 'shoots'
                      ? <Field label="Location"><Input value={form.location || ''} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} /></Field>
                      : <Field label="Venue"><Input value={form.venue || ''} onChange={e => setForm((f: any) => ({ ...f, venue: e.target.value }))} /></Field>}
                    {mode === 'events' && (
                      <Field label="Barter inventory"><Input type="number" value={form.barter_inventory || ''} onChange={e => setForm((f: any) => ({ ...f, barter_inventory: parseInt(e.target.value) || 0 }))} /></Field>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => { setOpen(false); setForm({}); }}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rows.length === 0 ? (
        <Alert><Package className="h-4 w-4" /><AlertDescription>No {CONFIG[mode].title.toLowerCase()} yet.</AlertDescription></Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {mode === 'payouts' ? (
                  <><TableHead>Creator</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead /></>
                ) : (
                  <><TableHead>Name</TableHead><TableHead>Date</TableHead><TableHead>{mode === 'shoots' ? 'Location' : 'Venue'}</TableHead><TableHead /></>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  {mode === 'payouts' ? (
                    <>
                      <TableCell className="font-medium">{r.creator_name}</TableCell>
                      <TableCell className="tabular-nums">AED {Number(r.amount || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={r.status === 'paid' ? 'default' : 'secondary'} className="capitalize">{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {isInternal && r.status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}><CheckCircle className="h-3.5 w-3.5 mr-1" />Mark paid</Button>
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{fmtDate(r.date)}</TableCell>
                      <TableCell><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{r.location || r.venue || '—'}</span></TableCell>
                      <TableCell className="text-right">
                        {isInternal && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
