'use client'

/**
 * Tell a client Creator Payouts is switched on, with the guide attached.
 *
 * WHY IT LIVES WITH THE OTHER CLIENT EMAILS. It started as a button on the Creator Payouts
 * row in the Modules tab, on the reasoning that it belonged where somebody had just switched
 * the module on. The client screen already had an "Email them" menu holding every other mail
 * we send a client, so that put a third way to email somebody somewhere nobody would look
 * for it. One menu, one place.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Row } from '@/components/console/primitives'
import { morOpsApi } from '@/services/morOpsApi'

/**
 * Tell a client Creator Payouts is switched on.
 *
 * WHY IT IS A DIALOG AND NOT A BUTTON THAT JUST SENDS. This is an email to a real customer
 * carrying a document and a price. It opens on a dry run, so the operator sees who it is
 * going to, what percentage it will quote and how big the attachment is, before anything
 * leaves. Sending from a single click is how the wrong client finds out they have a module.
 *
 * The percentage is resolved per client, and is zero for a Manage client whose management
 * service charge already covers the module. The override exists for a rate agreed in a
 * conversation rather than set in config, and the dialog says which of the two it is about
 * to use.
 */
export function TellThemPayoutsDialog({ teamId, clientName, onClose }: {
  teamId: string; clientName: string; onClose: () => void
}) {
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof morOpsApi.sendActivationEmail>>['data'] | null>(null)
  const [to, setTo] = useState('')
  const [fee, setFee] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  const load = useCallback(async () => {
    setBusy(true); setFailed(null)
    try {
      const r = await morOpsApi.sendActivationEmail(teamId, {
        dry_run: true,
        to: to.trim() ? to.split(',').map(x => x.trim()).filter(Boolean) : undefined,
        fee_pct: fee.trim() || undefined,
      })
      setPreview(r.data)
    } catch (e) { setFailed((e as Error).message) }
    finally { setBusy(false) }
  }, [teamId, to, fee])

  useEffect(() => { void load() }, [load])

  const send = async () => {
    setBusy(true)
    try {
      const r = await morOpsApi.sendActivationEmail(teamId, {
        to: to.trim() ? to.split(',').map(x => x.trim()).filter(Boolean) : undefined,
        fee_pct: fee.trim() || undefined,
      })
      const n = r.data.sent ?? 0
      if (n > 0) toast.success(`Sent to ${n === 1 ? 'one person' : `${n} people`}`,
                               { description: r.data.subject })
      else toast.error('Nothing sent', { description: r.data.failed?.[0]?.why })
      onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  const who = preview?.would_send_to ?? []

  return (
    <AlertDialog open onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tell {clientName} it is switched on</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-ds-3 text-[13px]">
              <p>
                They get an email with the Creator Payouts guide attached. Nothing about
                their account changes; this only tells them.
              </p>

              {failed && <p className="text-destructive">{failed}</p>}

              {preview && (
                <div className="rounded-ds-lg border border-black/[0.06] p-3 dark:border-white/[0.08]">
                  <Row
                    tone="neutral"
                    title={<span className="text-[13px]">{preview.subject}</span>}
                    meta={
                      (who.length
                        ? `To ${who.join(', ')}`
                        : 'Nobody on this client has an email address')
                      /* Manage includes the module, not the percentage, so every client
                         is quoted a rate. Typing one here also puts them on it. */
                      + `  ·  Quotes ${preview.fee_pct}%`
                      + (preview.guide_bytes
                        ? `  ·  Guide ${Math.round(preview.guide_bytes / 1024)} KB`
                        : '')
                    }
                  />
                </div>
              )}

              <div className="grid gap-ds-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tell-to" className="text-[12.5px]">Send to</Label>
                  <Input id="tell-to" value={to} onChange={(e) => setTo(e.target.value)}
                         placeholder="Leave blank for their team"
                         className="mt-1.5" onBlur={load} />
                </div>
                <div>
                  <Label htmlFor="tell-fee" className="text-[12.5px]">Percentage</Label>
                  <Input id="tell-fee" value={fee} onChange={(e) => setFee(e.target.value)}
                         placeholder={preview?.resolved_fee_pct ?? 'Their rate'}
                         className="mt-1.5" onBlur={load} inputMode="decimal" />
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                    Blank uses the rate on their account. Typing one puts them on it, so the
                    email and their invoices cannot disagree.
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Not yet</AlertDialogCancel>
          <Button onClick={send} disabled={busy || !who.length}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Send it
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
