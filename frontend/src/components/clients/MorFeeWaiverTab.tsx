'use client'

/**
 * Fee-free creators for one client, on the client's Setup tab.
 *
 * What this grants is OUR MARGIN, not the client's bill. They still pay the creator in full
 * and they still pay VAT on it, because we invoice in our own name and the whole amount is
 * our supply. The copy says so in as many words on both the form and the list, because
 * "2 free creators" is exactly what somebody will tell a client on the phone otherwise.
 *
 * An end date is required, not optional. A waiver with no expiry is a discount somebody has
 * to remember to withdraw, and nobody ever does.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, ShieldCheck } from 'lucide-react'
import { morAdminApi, type MorWaiver, type MorWaiverState } from '@/services/morAdminApi'
import { cn } from '@/lib/utils'

export function MorFeeWaiverTab({ teamId, clientName }: { teamId: string; clientName?: string }) {
  const [waivers, setWaivers] = useState<MorWaiver[]>([])
  const [state, setState] = useState<MorWaiverState | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [count, setCount] = useState('2')
  const [until, setUntil] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await morAdminApi.waivers(teamId)
      setWaivers(r.data.waivers)
      setState(r.data.state)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { void load() }, [load])

  const grant = async () => {
    const n = Number(count)
    if (!Number.isFinite(n) || n < 1) { toast.error('How many creators?'); return }
    if (!until) { toast.error('Give it an end date.'); return }
    setBusy(true)
    try {
      await morAdminApi.grantWaiver(teamId, n, until, note.trim() || undefined)
      toast.success(
        `${n} fee-free ${n === 1 ? 'creator' : 'creators'} granted`,
        { description: 'They still pay the creator in full, and still pay VAT.' },
      )
      setOpen(false); setNote(''); setCount('2'); setUntil('')
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (id: string) => {
    try {
      await morAdminApi.revokeWaiver(id)
      toast.success('Withdrawn')
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-ds-subheading">Merchant of Record fees</h2>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            Creators we take no fee on. {clientName || 'This client'} still pays the creator in
            full and still pays VAT: this waives our percentage, not their bill.
          </p>
        </div>
        {!open && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Grant fee-free creators
          </Button>
        )}
      </div>

      {state?.active && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">{state.remaining} left of {state.allowed}</span>
          {state.valid_until && (
            <span className="text-muted-foreground">
              until {new Date(state.valid_until).toLocaleDateString('en-GB',
                { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </p>
      )}

      {open && (
        <div className="mt-6 rounded-xl border p-5">
          <div className="grid gap-4 sm:grid-cols-[130px_190px_1fr]">
            <div>
              <Label className="text-[13px]">How many creators</Label>
              <Input type="number" min={1} value={count} className="mt-2 tabular-nums"
                     onChange={(e) => setCount(e.target.value)} />
            </div>
            <div>
              <Label className="text-[13px]">Valid until</Label>
              <Input type="date" value={until} className="mt-2"
                     min={new Date().toISOString().slice(0, 10)}
                     onChange={(e) => setUntil(e.target.value)} />
            </div>
            <div>
              <Label className="text-[13px]">Why (optional)</Label>
              <Input value={note} className="mt-2" placeholder="Agreed with the client on the call"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button size="sm" onClick={grant} disabled={busy}>
              {busy ? 'Granting…' : 'Grant'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((n) => <Skeleton key={n} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : waivers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No waiver has been given. Every creator carries our standard fee.
          </p>
        ) : (
          <ul>
            {waivers.map((w, i) => {
              const spent = w.remaining === 0
              const dead = w.revoked || w.expired || spent
              return (
                <li key={w.id}
                    className={cn('flex flex-wrap items-center justify-between gap-4 py-3.5',
                                  i > 0 && 'border-t')}>
                  <div className="min-w-0">
                    <div className={cn('text-sm font-medium tabular-nums',
                                       dead && 'text-muted-foreground')}>
                      {w.creators_allowed} {w.creators_allowed === 1 ? 'creator' : 'creators'}
                      <span className="font-normal text-muted-foreground">
                        {' · '}{w.used} used, {w.remaining} left
                      </span>
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">
                      {w.revoked ? 'Withdrawn'
                        : w.expired ? 'Expired'
                        : spent ? 'All used'
                        : `Until ${new Date(w.valid_until).toLocaleDateString('en-GB',
                            { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      {w.note && <span> · {w.note}</span>}
                      {w.granted_by_email && <span> · {w.granted_by_email}</span>}
                    </div>
                  </div>
                  {!dead && (
                    <Button size="sm" variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => revoke(w.id)}>
                      Withdraw
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
