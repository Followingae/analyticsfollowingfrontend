'use client'

/**
 * What this client is charged per payout, on their Setup tab.
 *
 * There was no way to set it. The house rate was the only rate, so a client sold at 6% on a
 * call was quoted 6% in their activation email — the one figure an operator could type —
 * and then invoiced at 7% by the order, because the email and the order read different
 * numbers. The email now sets this, and so does this field.
 *
 * Empty means the house rate, deliberately, rather than a copy of today's figure: a client
 * nobody negotiated with should follow the house rate when it moves.
 *
 * ⚠️ Only the next order moves. Every order carries the rate it was confirmed at.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { morAdminApi, type MorFeeRate as Rate } from '@/services/morAdminApi'

/** "6.00" reads as a price when it reads as "6". A half percent still shows as 6.5. */
const tidy = (v: string | null | undefined) =>
  v == null ? '' : String(v).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')

export function MorFeeRate({ teamId, clientName }: { teamId: string; clientName?: string }) {
  const [rate, setRate] = useState<Rate | null>(null)
  const [loading, setLoading] = useState(true)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = (await morAdminApi.feeRate(teamId)).data
      setRate(r)
      setValue(tidy(r.fee_pct))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { void load() }, [load])

  const save = async () => {
    const typed = value.trim().replace(/%$/, '')
    if (typed && !(Number(typed) >= 0 && Number(typed) <= 100)) {
      toast.error('A percentage is between 0 and 100.')
      return
    }
    setBusy(true)
    try {
      const r = await morAdminApi.setFeeRate(teamId, typed || null)
      toast.success(
        r.data.on_house_rate
          ? `Back on the house rate, ${tidy(r.data.effective_fee_pct)}%`
          : `Charged ${tidy(r.data.fee_pct)}% per payout`,
        { description: 'Orders already placed keep the rate they were confirmed at.' },
      )
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-20 w-full rounded-xl" />
  if (!rate) return null

  const dirty = tidy(value) !== tidy(rate.fee_pct)

  return (
    <section>
      <h2 className="text-ds-subheading">Our fee</h2>
      <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        What we charge {clientName || 'this client'} on every payout we settle for them.
        Leave it empty to follow the house rate, currently {tidy(rate.house_fee_pct)}%.
        Changing it only affects the next order.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-4 rounded-xl border p-5">
        <div className="w-[160px]">
          <Label htmlFor="mor-fee" className="text-[13px]">Their rate</Label>
          <div className="relative mt-2">
            <Input id="mor-fee" inputMode="decimal" value={value} className="pr-7 tabular-nums"
                   placeholder={tidy(rate.house_fee_pct)}
                   onChange={(e) => setValue(e.target.value)} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                             text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <p className="ml-auto text-[12.5px] text-muted-foreground">
          {rate.on_house_rate
            ? `On the house rate, ${tidy(rate.effective_fee_pct)}%`
            : `On their own rate, ${tidy(rate.effective_fee_pct)}% (house ${tidy(rate.house_fee_pct)}%)`}
        </p>
      </div>
    </section>
  )
}
