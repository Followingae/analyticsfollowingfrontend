'use client'

/**
 * The priced add-on: who took it, and putting it on or taking it off by hand.
 *
 * A proposal can carry one priced extra — "With Ad Boosting Rights +20%", "With MEFCC visit"
 * — offered per line, so a reel with the uplift and a reel without can sit on the same quote
 * at different prices. The client's answer was recorded per deliverable and shown nowhere:
 * the operator screen never even received the offer, so the only way to know whether a
 * confirmed proposal included the uplift was to read the database.
 *
 * It also could not be answered here, which is not how these deals are agreed — "yes,
 * include boosting on Lina" arrives on a call, not as a click. Each creator gets a switch,
 * and flipping one re-prices the proposal and, if they are already booked, the campaign.
 * The new total is shown against the old one before anything is saved, because this moves
 * money on a deal that may already be signed.
 */
import { useMemo, useState } from 'react'
import { BadgePercent, Check, Loader2, Minus, PenLine } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { adminProposalApi, type AdminProposalDetail, type AdminProposalInfluencer } from '@/services/adminProposalMasterApi'
import { sellFor } from '@/components/proposals/proposal-utils'

type Modifier = NonNullable<AdminProposalDetail['proposal']['price_modifier']>

const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`

export function AddOnUptake({
  proposalId, modifier, influencers, onDone,
}: {
  proposalId: string
  modifier?: Modifier | null
  influencers: AdminProposalInfluencer[]
  onDone: () => void
}) {
  const [pending, setPending] = useState<AdminProposalInfluencer | null>(null)
  const [nextState, setNextState] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const price = modifier
    ? modifier.kind === 'percent'
      ? `+${modifier.percent_value}%`
      : `+${aed(modifier.amount_aed || 0)}`
    : ''

  /* Only creators actually in play. Somebody the client passed on has no price to uplift,
     and listing all 21 would bury the two that matter behind nineteen that do not. */
  const inPlay = useMemo(
    () => influencers.filter(i => i.selected_by_user || i.locked),
    [influencers],
  )

  if (!modifier) return null

  const taken = modifier.taken_by
  const uplifted = (base: number) =>
    modifier.kind === 'percent'
      ? base * (1 + (modifier.percent_value || 0) / 100)
      : base + (modifier.amount_aed || 0)

  const ask = (inf: AdminProposalInfluencer, on: boolean) => {
    setPending(inf)
    setNextState(on)
    setReason('')
  }

  const submit = async () => {
    if (!pending) return
    setSaving(true)
    try {
      const res = await adminProposalApi.setAddOn(proposalId, pending.id, {
        applied: nextState,
        reason: reason.trim() || undefined,
      })
      toast.success(res.message)
      setPending(null)
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const base = pending ? sellFor(pending) : 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <BadgePercent className="size-4 text-muted-foreground" />
            {modifier.label}
            <Badge variant="outline" className="font-mono text-xs">{price}</Badge>
          </CardTitle>
          <CardDescription>
            {taken.length > 0
              ? `Taken on ${taken.length} of the ${modifier.offered_on.length} creators it was offered on.`
              : `Offered on ${modifier.offered_on.length} creator${modifier.offered_on.length === 1 ? '' : 's'}. Not taken.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {taken.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Minus className="size-3.5" />
              The client priced without it, so the totals on this page carry no uplift.
            </p>
          )}

          {inPlay.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody is selected yet, so there is nothing to price it on.
            </p>
          ) : (
            <div className="rounded-lg border">
              {inPlay.map(inf => {
                const on = !!inf.modifier_taken
                const b = sellFor(inf)
                return (
                  <div key={inf.id} className="flex items-center gap-3 border-b p-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {inf.username}
                        {inf.locked && (
                          <Badge className="bg-emerald-600 text-[10px] hover:bg-emerald-600">Confirmed</Badge>
                        )}
                        {inf.modifier_overridden && (
                          <span title={inf.modifier_override_reason || 'Set by an operator'}>
                            <PenLine className="size-3 text-muted-foreground" />
                          </span>
                        )}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {on ? (
                          <>
                            {aed(b)} <span className="text-emerald-600">→ {aed(uplifted(b))}</span>
                          </>
                        ) : (
                          <>{aed(b)} · with add-on {aed(uplifted(b))}</>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={on}
                      onCheckedChange={next => ask(inf, next)}
                      aria-label={`${modifier.label} for ${inf.username}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={o => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nextState ? `Add ${modifier.label}` : `Remove ${modifier.label}`}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {pending?.username} goes from <b>{aed(base)}</b> to{' '}
                  <b>{aed(nextState ? uplifted(base) : base)}</b>
                  {nextState
                    ? `, ${aed(uplifted(base) - base)} more.`
                    : `, ${aed(uplifted(base) - base)} less.`}
                </p>
                {pending?.locked && (
                  <p className="rounded-md bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400">
                    This creator is already confirmed and running. The campaign and its budget
                    are re-priced too, so what we invoice matches what you set here.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="addon-reason">Why? (optional, kept on the record)</Label>
            <Input
              id="addon-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. agreed with Sara on the call, 26 Aug"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {nextState ? 'Add it' : 'Remove it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
