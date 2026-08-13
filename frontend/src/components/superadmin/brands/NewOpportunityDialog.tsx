'use client'

/**
 * Log a brand on the day the conversation starts.
 *
 * A new client takes two to four months to close, and until now the only way to get one
 * into the platform was to create a full user account — logins and all — which nobody does
 * for a brand that has not signed anything. So the first months of every relationship lived
 * in somebody's inbox, and the talent team could not source against it because as far as the
 * platform was concerned it did not exist.
 *
 * No login is created here and no email is sent. Their people are invited later from Manage
 * access, when there is something to show them.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const SOURCES = ['Referral', 'Inbound', 'Event', 'Outbound']

export function NewOpportunityDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '', primary_contact_name: '', primary_contact_email: '', source: '', notes: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { toast.error('Give the brand a name'); return }
    setBusy(true)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          primary_contact_name: form.primary_contact_name.trim() || undefined,
          primary_contact_email: form.primary_contact_email.trim() || undefined,
          source: form.source || undefined,
          notes: form.notes.trim() || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.detail || 'Could not log the brand')
      toast.success(`${form.name.trim()} logged`, {
        action: { label: 'Open', onClick: () => router.push(`/work/brands/${body.data.id}`) },
      })
      setForm({ name: '', primary_contact_name: '', primary_contact_email: '', source: '', notes: '' })
      onOpenChange(false)
      onCreated?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not log the brand')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New opportunity</DialogTitle>
          <DialogDescription>
            A brand you have started talking to. Only the name is required — log it now and
            fill the rest in as you learn it. No login is created and nothing is sent to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Brand</Label>
            <Input className="mt-1.5" autoFocus value={form.name}
                   placeholder="e.g. Barakat Fresh"
                   onChange={e => set('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Contact</Label>
              <Input className="mt-1.5" value={form.primary_contact_name}
                     placeholder="Their name or role"
                     onChange={e => set('primary_contact_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1.5" type="email" value={form.primary_contact_email}
                     placeholder="name@brand.com"
                     onChange={e => set('primary_contact_email', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Where they came from</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <Button key={s} type="button" size="sm"
                        variant={form.source === s ? 'default' : 'outline'}
                        onClick={() => set('source', form.source === s ? '' : s)}>
                  {s}
                </Button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              This is how we learn which channels actually produce clients.
            </p>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={form.notes}
                      placeholder="What they want, who introduced you, anything useful later"
                      onChange={e => set('notes', e.target.value)} />
          </div>

          <p className="rounded-lg border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
            No budget field on purpose. Nobody knows it on day one, and a guess recorded now
            gets quoted back as fact three months later.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Log the brand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
