'use client'

/**
 * "I spoke to them."
 *
 * The brands screen has always told people that a conversation off the platform has to be
 * logged to count, and then offered nothing to log one with — so "gone quiet" was measured
 * from everybody else's work, and the person who actually owns the relationship had no way
 * to say they rang yesterday.
 *
 * Deliberately short: who you spoke to is already known, when is now unless you say
 * otherwise, and the only field that really matters is what happens next.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

const CHANNELS = [
  { key: 'call', label: 'Call' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'other', label: 'Something else' },
] as const

export function LogTouchDialog({
  teamId, brandName, open, onOpenChange, onLogged,
}: {
  teamId: string
  brandName?: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onLogged?: () => void
}) {
  const [channel, setChannel] = useState<string>('call')
  const [note, setNote] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [nextAt, setNextAt] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/brands/${teamId}/touches`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            note: note.trim() || undefined,
            next_step: nextStep.trim() || undefined,
            next_step_at: nextAt || undefined,
          }),
        })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not save')
      toast.success(`Logged: ${brandName || 'this brand'} counts as spoken to today`)
      setNote(''); setNextStep(''); setNextAt(''); setChannel('call')
      onOpenChange(false)
      onLogged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You spoke to {brandName || 'this brand'}</DialogTitle>
          <DialogDescription>
            Logging it stops them showing as gone quiet, and keeps the next step somewhere
            other than your head.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label className="text-xs">How</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CHANNELS.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChannel(c.key)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                  channel === c.key
                    ? 'border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border-black/[0.08] hover:bg-black/[0.03] dark:border-white/[0.1] dark:hover:bg-white/[0.06]',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">What was said (optional)</Label>
          <Textarea
            className="mt-1.5" rows={3} value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. budget confirmed for October, wants food creators first"
          />
        </div>

        <div className="grid grid-cols-2 gap-ds-3">
          <div>
            <Label className="text-xs">What happens next (optional)</Label>
            <Input
              className="mt-1.5" value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g. send the shortlist"
            />
          </div>
          <div>
            <Label className="text-xs">By when</Label>
            <Input className="mt-1.5" type="date" value={nextAt}
                   onChange={(e) => setNextAt(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Log it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
