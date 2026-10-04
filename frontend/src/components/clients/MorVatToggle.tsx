'use client'

/**
 * Whether this client's Creator Payouts invoices carry VAT, on the client's Setup tab.
 *
 * It used to be a flat 5% on everybody, because the module was built for UAE brands buying
 * a service supplied in the UAE. Not every client is one. A brand established outside the
 * GCC is an export of services and is zero-rated, and charging them 5% puts tax on an
 * invoice that should not carry it, which we then hand to the FTA out of our own margin.
 *
 * It is a TAX decision, not a preference, so switching it OFF asks for the reason in
 * writing before it will save. That sentence is the only thing standing between us and an
 * auditor asking why this client paid no VAT.
 *
 * ⚠️ Only the NEXT order moves. Every order stamps its own rate when it is confirmed.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { morAdminApi, type MorBillingRecord } from '@/services/morAdminApi'

export function MorVatToggle({ teamId, clientName }: { teamId: string; clientName?: string }) {
  const [rec, setRec] = useState<MorBillingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setRec((await morAdminApi.billing(teamId)).data)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { void load() }, [load])

  const save = async (applies: boolean, why?: string) => {
    setBusy(true)
    try {
      const r = await morAdminApi.setVat(teamId, applies, why)
      setRec(r.data)
      setAsking(false)
      setReason('')
      toast.success(applies ? 'VAT is charged on this account' : 'This account is not charged VAT',
                    { description: 'Orders already placed keep the rate they were confirmed at.' })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-20 w-full rounded-xl" />
  if (!rec) return null

  const on = rec.vat_applies

  return (
    <section>
      <h2 className="text-ds-subheading">VAT</h2>
      <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        Whether Creator Payouts invoices to {clientName || 'this client'} carry 5% VAT. Leave it
        on unless their supply is genuinely zero-rated. Changing it only affects the next
        order: everything already confirmed keeps the rate it was priced at.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {on ? 'Charged 5% VAT' : 'Not charged VAT'}
          </div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {on
              ? 'The standard UAE rate, on the whole invoice.'
              : rec.vat_zero_reason || 'No reason on file.'}
            {rec.vat_set_at && (
              <span>{' · set '}{new Date(rec.vat_set_at).toLocaleDateString('en-GB',
                { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="mor-vat" className="text-[13px] text-muted-foreground">Charge VAT</Label>
          <Switch id="mor-vat" checked={on} disabled={busy}
                  onCheckedChange={(next) => {
                    // Turning it back on needs nothing. Turning it off needs the sentence.
                    if (next) void save(true)
                    else setAsking(true)
                  }} />
        </div>
      </div>

      {asking && (
        <div className="mt-4 rounded-xl border p-5">
          <Label className="text-[13px]">Why is this client not charged VAT?</Label>
          <Textarea value={reason} rows={2} className="mt-2"
                    placeholder="Business established outside the GCC, export of services, zero-rated"
                    onChange={(e) => setReason(e.target.value)} />
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            This goes on the record. It has to stand up to the FTA later, so write the actual
            reason rather than a note to yourself.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" disabled={busy || reason.trim().length < 8}
                    onClick={() => void save(false, reason.trim())}>
              {busy ? 'Saving…' : 'Stop charging VAT'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAsking(false); setReason('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
