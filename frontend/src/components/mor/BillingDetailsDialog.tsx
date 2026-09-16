'use client'

/**
 * The one thing we ask a brand for, and the one moment we ask it.
 *
 * WHY IT IS HERE AND NOT ON A SETTINGS PAGE. It is asked at the first lock, because that is
 * the moment the information becomes necessary rather than merely useful: the TRN goes on the
 * invoice we are about to raise. A brand can open Merchant of Record, add creators and see a
 * total without ever being asked for a trade licence, which is the point.
 *
 * THIS IS NOT KYC AND MUST NEVER READ AS IF IT WERE. We are not verifying anybody. This is
 * their own invoicing setup, so the tax invoice we issue is valid and they can recover the VAT
 * on it. Nobody is screened, nothing is checked against a list. The wording matters: a UAE
 * marketing manager asked for "verification documents" assumes a bank-style process and stops.
 *
 * ASKED ONCE. After this it never appears again, unless we have asked for something more.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { morPaymentsApi, type MorBilling } from '@/services/morPaymentsApi'

/**
 * Ask, if we need to. Returns true when the order may go ahead.
 *
 * Callers use it as a gate before locking: if it resolves false the brand closed the form and
 * nothing has been committed on their behalf.
 */
export function BillingDetailsDialog({
  open, onCancel, onSaved,
}: {
  open: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const [state, setState] = useState<MorBilling | null>(null)
  const [trn, setTrn] = useState('')
  const [legal, setLegal] = useState('')
  const [addr, setAddr] = useState('')
  const [licence, setLicence] = useState<{ url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    void (async () => {
      try {
        const r = await morPaymentsApi.billing.read()
        setState(r.data)
        setTrn(r.data.trn || '')
        setLegal(r.data.legal_name || '')
        setAddr(r.data.invoice_address || '')
        if (r.data.has_trade_licence) {
          // Already on file. We keep the name to show it, and the url stays server-side:
          // re-attaching is optional, so the field is pre-satisfied rather than pre-filled.
          setLicence({ url: 'on-file', name: r.data.trade_licence_name || 'Trade licence' })
        }
      } catch { /* an empty form is the right fallback; they are filling it in anyway */ }
    })()
  }, [open])

  const pick = useCallback(async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const r = await morPaymentsApi.billing.uploadLicence(file)
      setLicence({ url: r.trade_licence_url, name: r.trade_licence_name || file.name })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }, [])

  // 15 digits, the same rule the server applies. Checked here too so a mistyped TRN is caught
  // while they are looking at the certificate, not after a round trip.
  const trnDigits = trn.replace(/\D/g, '')
  const ready = trnDigits.length === 15 && legal.trim() && addr.trim() && licence && !saving

  const save = async () => {
    if (!ready) return
    setSaving(true)
    try {
      await morPaymentsApi.billing.save({
        trn: trnDigits,
        legal_name: legal.trim(),
        invoice_address: addr.trim(),
        // Blank means they did not re-attach, and the server keeps the one it already holds.
        trade_licence_url: licence!.url === 'on-file' ? '' : licence!.url,
        trade_licence_name: licence!.name,
      })
      onSaved()
    } catch (e) {
      toast.error((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Your invoice details</DialogTitle>
          <DialogDescription>
            We invoice you in our own name, so we need your company details to make it a valid
            UAE tax invoice you can claim the VAT back on. Asked once, then never again.
          </DialogDescription>
        </DialogHeader>

        {state?.on_hold && state.hold_reason && (
          <p className="rounded-[10px] bg-[var(--tone-warn-bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--tone-warn-ink)]">
            {state.hold_reason}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mor-trn">TRN</Label>
            <Input id="mor-trn" value={trn} inputMode="numeric"
                   onChange={e => setTrn(e.target.value)}
                   placeholder="15 digits, from your VAT certificate" />
            {trn.trim() !== '' && trnDigits.length !== 15 && (
              <p className="text-[11.5px] text-muted-foreground">
                {trnDigits.length} of 15 digits.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mor-legal">Company name</Label>
            <Input id="mor-legal" value={legal} onChange={e => setLegal(e.target.value)}
                   placeholder="Exactly as it should appear on the invoice" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mor-addr">Invoice address</Label>
            <Textarea id="mor-addr" rows={3} value={addr}
                      onChange={e => setAddr(e.target.value)}
                      placeholder="Where the invoice should be addressed" />
          </div>

          <div className="space-y-1.5">
            <Label>Trade licence</Label>
            <input ref={fileRef} type="file" className="hidden"
                   accept="application/pdf,image/*"
                   onChange={e => void pick(e.target.files?.[0])} />
            <Button type="button" variant="outline" className="w-full justify-start gap-2"
                    onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" />
                : licence ? <CheckCircle2 className="size-4 text-[var(--tone-good-ink)]" />
                : <FileUp className="size-4" />}
              <span className="truncate">
                {uploading ? 'Uploading' : licence ? licence.name : 'Attach a PDF or a photo'}
              </span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Not now</Button>
          <Button onClick={save} disabled={!ready}>
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save and continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Whether we still need to ask. Kept beside the dialog so a caller cannot ask on the wrong
 * rule: never on a hold alone, because a hold stops our invoicing and not their ordering.
 */
export async function needsBillingDetails(): Promise<boolean> {
  try {
    const r = await morPaymentsApi.billing.read()
    return !r.data.complete
  } catch {
    // If we cannot tell, do not stand between the brand and their order. The invoice path
    // checks again on our side, where it actually matters.
    return false
  }
}
