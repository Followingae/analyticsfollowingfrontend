'use client'

/**
 * The management deal, on the screen, for the person who signs it.
 *
 * `client_management_terms` was a table nobody outside the code had ever seen, and it decides
 * two things that cost real money: whether Merchant of Record is free for this client, and
 * what percentage we take when their creators are settled. It was empty for every account,
 * which means both decisions were being made from a blank row.
 *
 * So this screen says, in words, what setting it does. The four figures at the top are the
 * deal as it stands today. The panel under them is what that deal means for this client, not
 * a description of a database row. The list at the bottom is every deal they have ever been
 * on, because a rate that changed in March must not rewrite what February was billed at.
 *
 * Three states, kept apart on purpose. A failed read renders as a failed read, never as
 * "this client has no terms": an operator told the second thing when the first is true goes
 * on to enter a duplicate deal, and then two percentages are both true at once.
 */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Handshake, Percent, CalendarClock, Coins, Loader2, Trash2 } from 'lucide-react'
import { Aed, Empty, Panel, Row, Stat, StatGrid } from '@/components/console/primitives'
import {
  managementTermsApi, type ManagementTerm, type ManagementTerms,
} from '@/services/managementTermsApi'

/** A date the way it is said out loud, not the way it is stored. */
const niceDate = (iso: string | null | undefined) => {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const today = () => new Date().toISOString().slice(0, 10)

/** Fils to a figure. The mark itself is the `Aed` primitive's job, in the font that has it. */
const fromCents = (cents: number) =>
  (cents / 100).toLocaleString('en-AE', { maximumFractionDigits: 2 })

/** A percentage with no trailing zero theatre: 12.5%, 10%, 0%. */
const pct = (n: number) => `${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 2 })}%`

const periodOf = (t: ManagementTerm) =>
  t.active_to
    ? `${niceDate(t.active_from)} to ${niceDate(t.active_to)}`
    : `From ${niceDate(t.active_from)}, open ended`

export function ClientManagementTermsTab({ teamId, clientName }: {
  teamId: string
  clientName: string
}) {
  const [terms, setTerms] = useState<ManagementTerms | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [ending, setEnding] = useState<ManagementTerm | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFailure(null)
    try {
      const res = await managementTermsApi.list(teamId)
      setTerms(res.data)
    } catch (e) {
      // The previous answer is thrown away with it. Showing a stale deal beside a failed
      // read is worse than showing nothing: it reads as confirmed.
      setTerms(null)
      setFailure(e instanceof Error ? e.message : 'The read did not answer')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { load() }, [load])

  const current = terms?.current || null

  /* ── Loading, and the two ways it can end ──────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-ds-4">
        <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-ds-2 px-ds-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-ds-2xl" />
      </div>
    )
  }

  if (failure) {
    return (
      <Panel
        title="The management deal could not be read"
        description="This says the read failed, not that the client has no deal. Do not enter one from here until it loads, or this client could end up with two."
        action={<Button variant="outline" size="sm" onClick={load}>Try again</Button>}
      >
        <p className="text-ds-body text-muted-foreground">{failure}</p>
      </Panel>
    )
  }

  /* ── The deal ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-ds-4">
      {current ? (
        <StatGrid>
          <Stat
            label="Monthly retainer"
            value={<Aed>{fromCents(current.monthly_fee_cents)}</Aed>}
            icon={Coins}
            hint={current.monthly_fee_cents === 0
              ? 'No retainer agreed. They pay the service charge only.'
              : 'Charged every month, whether or not a creator ran'}
          />
          <Stat
            label="Service charge"
            value={pct(current.service_charge_pct)}
            icon={Percent}
            hint="Taken on the sell price of each creator activated that month"
          />
          <Stat
            label="Running since"
            value={<span className="text-[30px]">{niceDate(current.active_from)}</span>}
            icon={CalendarClock}
            tone="good"
            hint={current.set_by ? `Set by ${current.set_by}` : 'On this client since this date'}
          />
          <Stat
            label={current.open_ended ? 'Ends' : 'Ends on'}
            value={current.open_ended
              ? <span className="text-[30px]">Open ended</span>
              : <span className="text-[30px]">{niceDate(current.active_to)}</span>}
            icon={Handshake}
            tone={current.open_ended ? 'neutral' : 'warn'}
            hint={current.open_ended
              ? 'Runs until somebody ends it'
              : 'After this date they are no longer a management client'}
          />
        </StatGrid>
      ) : null}

      {/* What turning this on actually does. The owner asked what this table was; this is
          the answer, on the screen, rather than in a migration comment. */}
      <Panel
        title={current ? `${clientName} is a management client` : 'What a management deal is'}
        description={current
          ? 'These are the three things that follow from the deal above.'
          : 'This client has no management deal on file. Here is what setting one would do.'}
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Handshake className="h-4 w-4" />
            {current ? 'Change the deal' : 'Set the management deal'}
          </Button>
        }
      >
        <ul className="space-y-ds-3">
          <li className="flex gap-ds-3">
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--tone-good-dot)]" aria-hidden />
            <div>
              <p className="text-ds-body font-medium">They bring the creators, we run them.</p>
              <p className="text-ds-body text-muted-foreground">
                A management client already has the creator relationships. We are paid for
                running the work, not for sourcing the creator, so nothing here is our
                catalogue markup and the two never mix.
              </p>
            </div>
          </li>
          <li className="flex gap-ds-3">
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--tone-good-dot)]" aria-hidden />
            <div>
              <p className="text-ds-body font-medium">Merchant of Record is included at no charge.</p>
              <p className="text-ds-body text-muted-foreground">
                While a management deal is running, this client pays neither the Merchant of
                Record monthly fee nor its percentage of payouts. The service charge below
                already covers the same work, and charging both would bill it twice.
              </p>
            </div>
          </li>
          <li className="flex gap-ds-3">
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[var(--tone-good-dot)]" aria-hidden />
            <div>
              <p className="text-ds-body font-medium">
                {current
                  ? `${pct(current.service_charge_pct)} is taken at settlement.`
                  : 'A percentage is taken at settlement.'}
              </p>
              <p className="text-ds-body text-muted-foreground">
                Charged on the sell price of every creator they activate in a live campaign
                that month, and never on cost. A creator sitting on a roster costs them
                nothing. Each month is frozen when it is billed, so a rate you change today
                cannot reach back into a month already invoiced.
              </p>
            </div>
          </li>
        </ul>

        {current?.notes ? (
          <p className="mt-ds-4 rounded-ds-lg bg-black/[0.03] px-ds-3 py-ds-3 text-ds-body text-muted-foreground dark:bg-white/[0.05]">
            {current.notes}
          </p>
        ) : null}

        {current ? (
          <div className="mt-ds-4 flex flex-wrap gap-ds-2">
            {current.open_ended ? (
              <Button variant="outline" size="sm" onClick={() => setEnding(current)}>
                End this deal on a date
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEnding(current)}>
                Change the end date
              </Button>
            )}
          </div>
        ) : null}
      </Panel>

      {/* Every deal they have ever been on. Present even when the current one is the only
          one, because the fact that it is versioned is itself the thing to know. */}
      <Panel
        title="Every deal on file"
        description="A rate change writes a new deal and closes the old one. Nothing already billed is repriced."
        flush
      >
        {terms && terms.history.length > 0 ? (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {terms.history.map((t) => (
              <Row
                key={t.id}
                tone={t.is_current ? 'good' : 'neutral'}
                title={
                  <span className="flex items-center gap-ds-2">
                    <Aed>{fromCents(t.monthly_fee_cents)}</Aed>
                    <span className="text-muted-foreground">a month at {pct(t.service_charge_pct)}</span>
                    {t.is_current ? <Badge variant="outline">Running now</Badge> : null}
                  </span>
                }
                meta={
                  <>
                    {periodOf(t)}
                    {t.billed_months > 0
                      ? `. Billed for ${t.billed_months} ${t.billed_months === 1 ? 'month' : 'months'}`
                      : '. Nothing billed on it yet'}
                    {t.set_by ? `. Set by ${t.set_by}` : ''}
                  </>
                }
                actions={
                  t.billed_months === 0 ? (
                    <RemoveTerm term={t} clientName={clientName} onDone={setTerms} />
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <Empty>
            No management deal has ever been set for {clientName}. They are billed as an
            ordinary client, and Merchant of Record, if they use it, is charged in full.
          </Empty>
        )}
      </Panel>

      <TermDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        teamId={teamId}
        clientName={clientName}
        current={current}
        onDone={setTerms}
      />
      <EndDialog
        term={ending}
        clientName={clientName}
        onOpenChange={(o) => { if (!o) setEnding(null) }}
        onDone={setTerms}
      />
    </div>
  )
}

/* ── Writing one ──────────────────────────────────────────────────────────────────── */

function TermDialog({ open, onOpenChange, teamId, clientName, current, onDone }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  teamId: string
  clientName: string
  current: ManagementTerm | null
  onDone: (t: ManagementTerms) => void
}) {
  const [fee, setFee] = useState('')
  const [charge, setCharge] = useState('12.5')
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')
  const [supersede, setSupersede] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFee(current ? String(current.monthly_fee_cents / 100) : '')
    setCharge(current ? String(current.service_charge_pct) : '12.5')
    setFrom(today())
    setTo('')
    setNotes('')
    setSupersede(Boolean(current?.open_ended))
    setErr(null)
  }, [open, current])

  // The same rules the server enforces, said before the request rather than after it. The
  // server is still the authority: this only saves a round trip and a rejection.
  const feeNum = Number(fee)
  const chargeNum = Number(charge)
  const localError =
    fee.trim() === '' ? 'Enter the monthly retainer. Enter 0 if there is no retainer.'
      : !Number.isFinite(feeNum) || feeNum < 0 ? 'The retainer cannot be negative.'
      : charge.trim() === '' ? 'Enter the service charge percentage.'
      : !Number.isFinite(chargeNum) || chargeNum < 0 || chargeNum > 100
        ? 'The service charge must be between 0 and 100 percent.'
      : !from ? 'Pick the date this deal starts.'
      : to && to < from ? 'The deal would end before it starts.'
      : null

  const save = async () => {
    if (localError) { setErr(localError); return }
    setSaving(true)
    setErr(null)
    try {
      const res = await managementTermsApi.create(teamId, {
        monthly_fee_cents: Math.round(feeNum * 100),
        service_charge_pct: chargeNum,
        active_from: from,
        active_to: to || null,
        notes: notes.trim() || null,
        supersede,
      })
      onDone(res.data)
      const closed = res.data.superseded
      toast.success(
        `${clientName}: ${fromCents(Math.round(feeNum * 100))} AED a month and ` +
        `${pct(chargeNum)} at settlement, from ${niceDate(from)}.`,
        { description: closed
          ? `The previous deal was closed on ${niceDate(closed.ended_on)}. Months already billed keep the rate they were billed at.`
          : 'Merchant of Record is now included at no charge for this client.' },
      )
      onOpenChange(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'The deal was not saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{current ? 'Change the deal' : 'Set the management deal'}</DialogTitle>
          <DialogDescription>
            {current
              ? `${clientName} is on a deal already. A new rate does not edit it: the old deal closes and this one starts, so months already billed keep the rate they were billed at.`
              : `What ${clientName} pays us for running their creators. Setting this also makes Merchant of Record free for them.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-ds-3">
          <div className="grid grid-cols-2 gap-ds-3">
            <div className="space-y-ds-2">
              <Label htmlFor="mt-fee">Monthly retainer, in AED</Label>
              <Input id="mt-fee" inputMode="decimal" value={fee} placeholder="0"
                     onChange={(e) => setFee(e.target.value)} />
              <p className="text-ds-caption text-muted-foreground">
                Charged every month. Leave it 0 if the deal is the percentage only.
              </p>
            </div>
            <div className="space-y-ds-2">
              <Label htmlFor="mt-pct">Service charge, percent</Label>
              <Input id="mt-pct" inputMode="decimal" value={charge}
                     onChange={(e) => setCharge(e.target.value)} />
              <p className="text-ds-caption text-muted-foreground">
                12.5 is the standard rate. Taken on sell price, never on cost.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-ds-3">
            <div className="space-y-ds-2">
              <Label htmlFor="mt-from">Starts</Label>
              <Input id="mt-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-ds-2">
              <Label htmlFor="mt-to">Ends, if it is fixed</Label>
              <Input id="mt-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              <p className="text-ds-caption text-muted-foreground">
                Leave it empty for an open ended deal.
              </p>
            </div>
          </div>

          <div className="space-y-ds-2">
            <Label htmlFor="mt-notes">Note, for whoever reads this next</Label>
            <Textarea id="mt-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="What was agreed, and with whom." />
          </div>

          {current?.open_ended ? (
            <label className="flex items-start gap-ds-3 rounded-ds-lg bg-black/[0.03] px-ds-3 py-ds-3 dark:bg-white/[0.05]">
              <Checkbox checked={supersede}
                        onCheckedChange={(v: boolean | 'indeterminate') => setSupersede(v === true)}
                        className="mt-0.5" />
              <span className="text-ds-body">
                <span className="font-medium">Close the deal running now.</span>
                <span className="block text-muted-foreground">
                  It ends the day before this one starts. Without this, a new deal covering the
                  same dates is refused: two live deals means two percentages are both true and
                  settlement would pick one of them by accident.
                </span>
              </span>
            </label>
          ) : null}

          {(err || localError) ? (
            <p className="text-ds-body text-[var(--tone-bad-ink)]">{err || localError}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || Boolean(localError)} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {current ? 'Start the new deal' : 'Set the deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Ending one ───────────────────────────────────────────────────────────────────── */

function EndDialog({ term, clientName, onOpenChange, onDone }: {
  term: ManagementTerm | null
  clientName: string
  onOpenChange: (o: boolean) => void
  onDone: (t: ManagementTerms) => void
}) {
  const [when, setWhen] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!term) return
    setWhen(term.active_to || today())
    setErr(null)
  }, [term])

  if (!term) return null

  const invalid = when && when < term.active_from
    ? `This deal started on ${niceDate(term.active_from)}, so it cannot end before that.`
    : null

  const save = async (clear = false) => {
    setSaving(true)
    setErr(null)
    try {
      const res = await managementTermsApi.amend(term.id, { active_to: clear ? null : when })
      onDone(res.data)
      toast.success(
        clear
          ? `${clientName}: the deal is open ended again.`
          : `${clientName}: the deal ends on ${niceDate(when)}.`,
        { description: clear
          ? 'It runs until somebody ends it.'
          : 'From the day after, they are no longer a management client and Merchant of Record is charged in full.' },
      )
      onOpenChange(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'The end date was not saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End this deal</DialogTitle>
          <DialogDescription>
            {fromCents(term.monthly_fee_cents)} AED a month at {pct(term.service_charge_pct)},
            running since {niceDate(term.active_from)}. Ending it does not change any month
            already billed on it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-ds-2">
          <Label htmlFor="mt-end">Last day of the deal</Label>
          <Input id="mt-end" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
          {term.billed_months > 0 ? (
            <p className="text-ds-caption text-muted-foreground">
              {term.billed_months} {term.billed_months === 1 ? 'month has' : 'months have'} been
              billed on this deal. An end date before the last billed month is refused.
            </p>
          ) : null}
          {(err || invalid) ? (
            <p className="text-ds-body text-[var(--tone-bad-ink)]">{err || invalid}</p>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          {term.active_to ? (
            <Button variant="ghost" onClick={() => save(true)} disabled={saving}>
              Make it open ended again
            </Button>
          ) : <span />}
          <div className="flex gap-ds-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={() => save(false)} disabled={saving || Boolean(invalid) || !when}
                    className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              End it
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Undoing a typo ───────────────────────────────────────────────────────────────── */

/** Only ever offered on a deal nothing has been billed on. Anything billed is the record. */
function RemoveTerm({ term, clientName, onDone }: {
  term: ManagementTerm
  clientName: string
  onDone: (t: ManagementTerms) => void
}) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      const res = await managementTermsApi.remove(term.id)
      onDone(res.data)
      toast.success(
        `${clientName}: the deal of ${fromCents(term.monthly_fee_cents)} AED at ` +
        `${pct(term.service_charge_pct)} from ${niceDate(term.active_from)} was removed.`,
        { description: 'Nothing had been billed on it.' },
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'It was not removed')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
          Keep it
        </Button>
        <Button size="sm" variant="destructive" onClick={remove} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
        </Button>
      </div>
    )
  }
  return (
    <Button size="sm" variant="ghost" title="Remove a deal entered by mistake"
            onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
