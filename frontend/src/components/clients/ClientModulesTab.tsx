'use client'

/**
 * What this client can use, and how each part of it is billed.
 *
 * The screen the console did not have: an operator could see a client's plan, their
 * invoices and their campaigns, but not which of the four product modules they actually
 * hold, and had no way to switch one on without going to the database.
 *
 * Four things this screen has to say correctly, because saying them wrongly is worse than
 * not having the screen at all:
 *
 *   Ending a module is a schedule, not a deletion. It runs in full until the date the
 *   client has paid to, and campaigns already running stay approvable and settleable after
 *   that. So the date is always on screen and the word "remove" is never used.
 *
 *   Adding one is immediate and charged prorated for the rest of the cycle. The operator is
 *   told that before they confirm, not after.
 *
 *   Billing method is per module. A managed client can hold one module on a card while
 *   everything else is invoiced, which is the entire reason the entitlement table exists.
 *
 *   Merchant of Record is included in Manage. A Manage client is never offered it at a
 *   price, because the management service charge already pays for the same work.
 *
 * `usable` and `read_only` come from the server and are never recomputed here: the list of
 * statuses that count as working lives in app/services/entitlements.py and will grow.
 */
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Aed, Empty, Panel, Row, type Tone } from '@/components/console/primitives'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import {
  accountModulesApi,
  type AccountModule,
  type AccountModulesResponse,
  type AddModulePayload,
  type AvailableModule,
  type BillingMethod,
  type DunningState,
} from '@/services/accountModulesApi'

/* ------------------------------------------------------------------ words */

/** The status the server sent, in a word. Unknown statuses print as they arrived. */
const STATUS_WORD: Record<string, string> = {
  active: 'Active',
  trialing: 'On trial',
  grace: 'Payment overdue',
  cancelling: 'Ending at period end',
  locked: 'Locked, read only',
  cancelled: 'Ended',
}

const BILLING_WORD: Record<BillingMethod, string> = {
  stripe: 'On a card',
  invoiced: 'Invoiced',
  granted: 'No charge',
}

const BILLING_HELP: Record<BillingMethod, string> = {
  invoiced: 'We raise an invoice for it. Nothing is charged to a card.',
  stripe: 'Billed on the card already on the account, against a Stripe subscription.',
  granted: 'On, and never billed. Any price is forced to zero.',
}

/* The dot classes are written out rather than composed from the tone, because Tailwind only
   emits the classes it can read in the source and a template literal is invisible to it. */
const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-[var(--tone-neutral-dot)]',
  good: 'bg-[var(--tone-good-dot)]',
  warn: 'bg-[var(--tone-warn-dot)]',
  bad: 'bg-[var(--tone-bad-dot)]',
  info: 'bg-[var(--tone-info-dot)]',
}

const PAYMENT_COPY: Record<string, { tone: Tone; label: string; line: string }> = {
  current: { tone: 'good', label: 'Up to date', line: 'Nothing outstanding on this account.' },
  past_due: {
    tone: 'warn', label: 'A charge failed',
    line: 'Stripe is still retrying on its own schedule. The account is fully usable and most of these fix themselves.',
  },
  grace: {
    tone: 'warn', label: 'In grace',
    line: 'Still fully usable. The clock is running and the client has been told in writing when it runs out.',
  },
  locked: {
    tone: 'bad', label: 'Locked',
    line: 'Paid modules are read only. Find stays readable, and campaigns already running can still be approved and settled.',
  },
}

/* ------------------------------------------------------------- formatting */

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** A figure we were not given is a dash, never a zero. */
const fmtMoney = (v: number | string | null | undefined) => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('en-AE', { maximumFractionDigits: 2 }) : null
}

const MoneyAed = ({ value }: { value: number | string | null | undefined }) => {
  const n = fmtMoney(value)
  return n === null ? <>&mdash;</> : <Aed>{n}</Aed>
}

const cycleWord = (interval: string | null | undefined) => (interval === 'year' ? 'a year' : 'a month')

/** Working, ending, locked. Drawn from what the server said, not from the status string. */
const moduleTone = (m: AccountModule): Tone => {
  if (m.read_only) return 'bad'
  if (m.cancel_at_period_end) return 'warn'
  if (m.usable) return 'good'
  return 'neutral'
}

/* ------------------------------------------------------------------ types */

type AddTarget = { module: string; label: string; description: string; listPrice: string }

/** The cycle the rest of the account is already on, if there is exactly one. */
type Cycle = { start: string; end: string }

/**
 * A new module is meant to renew on the same day as everything else, so the client gets one
 * invoice a month instead of two on different dates. The endpoint takes the cycle for that
 * reason, and the part-cycle charge is worked out from it.
 *
 * Only offered when the answer is unambiguous: every billed module the account already has
 * agrees on the same start and end. If they disagree there is no single right answer, so
 * nothing is guessed and the server starts a fresh cycle today instead.
 */
const accountCycle = (modules: AccountModule[]): Cycle | null => {
  const billed = modules.filter(m =>
    m.billing_method !== 'granted' && m.current_period_start && m.current_period_end)
  if (billed.length === 0) return null
  const starts = new Set(billed.map(m => m.current_period_start as string))
  const ends = new Set(billed.map(m => m.current_period_end as string))
  if (starts.size !== 1 || ends.size !== 1) return null
  return { start: [...starts][0], end: [...ends][0] }
}

export function ClientModulesTab({ teamId, clientName }: { teamId: string; clientName: string }) {
  const { isSuperAdmin, isFullAccessStaff, role, canSeeSell } = useAdminAccess()
  // Who may change an entitlement, in the same shape the rest of the console uses. Never an
  // "is admin" test: the co-founder is role='user' with staff_role='cofounder' and has been
  // locked out of money screens by exactly that mistake before.
  const canChange = isSuperAdmin || role === 'admin' || isFullAccessStaff

  const [data, setData] = useState<AccountModulesResponse | null>(null)
  const [payment, setPayment] = useState<DunningState | null>(null)
  const [loading, setLoading] = useState(true)
  /**
   * A failed read is not "no modules". Rendering an empty list over a 500 tells the operator
   * this client holds nothing, which is how someone grants a module the client already pays
   * for. Failure, loading and genuinely empty are three separate states here.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const [busy, setBusy] = useState<string | null>(null)
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null)
  const [methodTarget, setMethodTarget] = useState<AccountModule | null>(null)
  const [endTarget, setEndTarget] = useState<AccountModule | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<AccountModule | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  const load = useCallback(async (opts: { quiet?: boolean } = {}) => {
    if (!opts.quiet) setLoading(true)
    setFailure(null)
    try {
      const res = await accountModulesApi.list(teamId)
      setData(res)
      // The detail behind the payment state is a nice to have. If only this read fails the
      // screen still knows the state from the list above, so it must not blank the section.
      accountModulesApi.paymentState(teamId).then(setPayment).catch(() => setPayment(null))
    } catch (e) {
      setData(null)
      setFailure(e instanceof Error ? e.message : 'The module list could not be read')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { load() }, [load])

  const run = async (key: string, fn: () => Promise<string | void>) => {
    setBusy(key)
    try {
      const message = await fn()
      if (message) toast.success(message)
      await load({ quiet: true })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not go through')
    } finally {
      setBusy(null)
    }
  }

  /* ----------------------------------------------------------- three states */

  if (loading) {
    return (
      <div className="space-y-ds-4">
        <Skeleton className="h-[104px] rounded-ds-2xl" />
        <Skeleton className="h-[260px] rounded-ds-2xl" />
      </div>
    )
  }

  if (failure || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Could not read this client&apos;s modules.</p>
        <p className="text-sm text-muted-foreground">
          {failure || 'The read did not answer'}. This is not a statement that the client has
          nothing: it says the read failed. Do not switch anything on from this screen until
          it loads.
        </p>
        <Button variant="outline" size="sm" onClick={() => load()}>Try again</Button>
      </div>
    )
  }

  const state = data.payment_state || 'current'
  const copy = PAYMENT_COPY[state] || {
    tone: 'neutral' as Tone, label: state, line: 'The payment state came back as something this screen does not know.',
  }
  const graceEnds = fmtDate(data.grace_ends_at)
  const manageHeld = data.modules.some(m => m.module === 'manage' && m.usable)

  return (
    <div className="space-y-ds-4">
      {/* PAYMENTS ------------------------------------------------------- */}
      <Panel
        title="Payments"
        description="Where this account stands, and the one lever for a transfer that landed without a webhook."
        action={canChange && state !== 'current' ? (
          <Button size="sm" variant="outline" onClick={() => setClearOpen(true)} disabled={busy === 'clear'}>
            {busy === 'clear' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Record payment received
          </Button>
        ) : undefined}
      >
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">State</p>
            <p className="mt-1 flex items-center gap-2 text-[14px] font-medium">
              <span className={`h-2 w-2 rounded-full ${TONE_DOT[copy.tone]}`} aria-hidden />
              {copy.label}
            </p>
          </div>
          {graceEnds && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Grace ends</p>
              <p className="mt-1 text-[14px] font-medium">{graceEnds}</p>
            </div>
          )}
          {canSeeSell && payment?.amount_due_aed != null && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Owed</p>
              <p className="mt-1 text-[14px] font-medium"><MoneyAed value={payment.amount_due_aed} /></p>
            </div>
          )}
          {payment?.last_failure_reason && (
            <div className="min-w-[180px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Last failure</p>
              <p className="mt-1 text-[14px] font-medium">{payment.last_failure_reason}</p>
            </div>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{copy.line}</p>
      </Panel>

      {/* WHAT THEY HAVE ------------------------------------------------- */}
      <Panel
        title="Modules this client has"
        description="What is switched on, how each one is billed, and when it renews."
        flush
      >
        {data.modules.length === 0 ? (
          <Empty>No modules are on record for this client yet.</Empty>
        ) : (
          <div className="space-y-0.5">
            {data.modules.map(m => {
              const ends = fmtDate(m.current_period_end)
              const price = fmtMoney(m.price_aed)
              const bits: string[] = [BILLING_WORD[m.billing_method] || m.billing_method]
              if (canSeeSell && m.billing_method !== 'granted' && price) {
                bits.push(`${price} ${cycleWord(m.billing_interval)}`)
              }
              if (ends) bits.push(m.cancel_at_period_end ? `Runs until ${ends}` : `Renews ${ends}`)
              return (
                <Row
                  key={m.module}
                  tone={moduleTone(m)}
                  title={
                    <span className="flex items-center gap-2">
                      {m.label}
                      <Badge variant="outline" className="font-normal">
                        {STATUS_WORD[m.status] || m.status}
                      </Badge>
                      {m.read_only && (
                        <span className="text-[11.5px] text-muted-foreground">read only</span>
                      )}
                    </span>
                  }
                  meta={bits.join('  ·  ')}
                  actions={canChange ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-8 text-[12.5px]"
                              onClick={() => setMethodTarget(m)}>
                        Billing
                      </Button>
                      {m.cancel_at_period_end ? (
                        <Button size="sm" variant="outline" className="h-8 text-[12.5px]"
                                onClick={() => setRestoreTarget(m)}>
                          Keep it on
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 text-[12.5px] text-muted-foreground"
                                onClick={() => setEndTarget(m)}>
                          Stop at period end
                        </Button>
                      )}
                    </>
                  ) : undefined}
                />
              )
            })}
          </div>
        )}
      </Panel>

      {/* WHAT THEY COULD ADD -------------------------------------------- */}
      {data.available_to_add.length > 0 && (
        <Panel
          title="Not switched on"
          description="Adding one takes effect immediately and is charged for the rest of this cycle."
          flush
        >
          <div className="space-y-0.5">
            {data.available_to_add.map((a: AvailableModule) => {
              const included = a.module === 'mor' && manageHeld
              const price = fmtMoney(a.price_aed_per_month)
              return (
                <Row
                  key={a.module}
                  tone="neutral"
                  title={a.label}
                  meta={
                    included
                      ? 'Included in Manage, so it goes on at no charge'
                      : canSeeSell && price
                        ? `${a.description}  ·  ${price} a month at list`
                        : a.description
                  }
                  actions={canChange ? (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[12.5px]"
                            onClick={() => setAddTarget({
                              module: a.module, label: a.label,
                              description: a.description, listPrice: a.price_aed_per_month,
                            })}>
                      <Plus className="h-3.5 w-3.5" />Turn on
                    </Button>
                  ) : undefined}
                />
              )
            })}
          </div>
        </Panel>
      )}

      {!canChange && (
        <p className="px-1 text-[13px] text-muted-foreground">
          You can see what this client holds. Changing it is a leadership action.
        </p>
      )}

      {/* DIALOGS --------------------------------------------------------- */}
      {addTarget && (
        <AddModuleDialog
          target={addTarget}
          clientName={clientName}
          manageHeld={manageHeld}
          cycle={accountCycle(data.modules)}
          busy={busy === `add:${addTarget.module}`}
          onClose={() => setAddTarget(null)}
          onConfirm={(payload) => {
            const t = addTarget
            setAddTarget(null)
            return run(`add:${t.module}`, async () => {
              const res = await accountModulesApi.add(teamId, t.module, payload)
              return res.message
            })
          }}
        />
      )}

      {methodTarget && (
        <BillingMethodDialog
          module={methodTarget}
          clientName={clientName}
          busy={busy === `method:${methodTarget.module}`}
          onClose={() => setMethodTarget(null)}
          onConfirm={(payload) => {
            const m = methodTarget
            setMethodTarget(null)
            return run(`method:${m.module}`, async () => {
              await accountModulesApi.setBillingMethod(teamId, m.module, payload)
              return `${m.label} is now billed as: ${BILLING_WORD[payload.billing_method]}.`
            })
          }}
        />
      )}

      {endTarget && (
        <EndModuleDialog
          module={endTarget}
          clientName={clientName}
          busy={busy === `end:${endTarget.module}`}
          onClose={() => setEndTarget(null)}
          onConfirm={(reason) => {
            const m = endTarget
            setEndTarget(null)
            return run(`end:${m.module}`, async () => {
              const res = await accountModulesApi.scheduleEnding(teamId, m.module, reason || undefined)
              return res.message
            })
          }}
        />
      )}

      <AlertDialog open={!!restoreTarget} onOpenChange={(v: boolean) => { if (!v) setRestoreTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keep {restoreTarget?.label} on for {clientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This undoes the scheduled ending. {restoreTarget?.label} goes back to active and
              keeps billing as it was
              {restoreTarget?.current_period_end
                ? `, renewing on ${fmtDate(restoreTarget.current_period_end)}.`
                : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Leave it ending</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const m = restoreTarget
              setRestoreTarget(null)
              if (!m) return
              run(`restore:${m.module}`, async () => {
                await accountModulesApi.restore(teamId, m.module)
                return `${m.label} stays on. The ending is undone.`
              })
            }}>
              Keep it on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record that {clientName} has paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This records the outstanding balance as received and unlocks anything locked,
              immediately. It moves money in our records, so only do it once the transfer has
              actually landed. It does not take a payment and it does not tell Stripe anything.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setClearOpen(false)
              run('clear', async () => {
                const res = await accountModulesApi.recordPaymentReceived(teamId)
                return res.message
              })
            }}>
              Payment received
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* =================================================================== add
 *
 * The dialogs below use theme tokens rather than the console tone tokens. A dialog renders
 * through a portal at the top of the document, outside `.console-shell`, and the tone
 * variables are scoped to that shell: naming one here resolves to nothing, which is a panel
 * with no background at all rather than a wrong colour.
 */

function AddModuleDialog({
  target, clientName, manageHeld, cycle, busy, onClose, onConfirm,
}: {
  target: AddTarget
  clientName: string
  manageHeld: boolean
  cycle: Cycle | null
  busy: boolean
  onClose: () => void
  onConfirm: (payload: AddModulePayload & {
    billing_method: BillingMethod; billing_interval: 'month' | 'year'
  }) => void
}) {
  // Manage is quoted per client and invoiced. It can never sit on a card, and it has no list
  // price, so the amount from the signed quote has to be typed in or it goes on at zero.
  const isManage = target.module === 'manage'
  // Merchant of Record for a Manage client is granted at zero: Manage already charges the
  // management service fee for the same work. There is nothing to decide, so nothing is asked.
  const includedInManage = target.module === 'mor' && manageHeld

  const [method, setMethod] = useState<BillingMethod>(includedInManage ? 'granted' : 'invoiced')
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [price, setPrice] = useState(isManage || includedInManage ? '' : target.listPrice)
  const [subscription, setSubscription] = useState('')
  const [reason, setReason] = useState('')
  const [align, setAlign] = useState(true)
  const [problem, setProblem] = useState<string | null>(null)

  const options: BillingMethod[] = includedInManage
    ? ['granted']
    : isManage ? ['invoiced', 'granted'] : ['invoiced', 'stripe', 'granted']

  // Only worth asking about on a monthly module that is actually billed.
  const canAlign = !!cycle && !includedInManage && method !== 'granted' && interval === 'month'

  const submit = () => {
    if (method === 'stripe' && !subscription.trim()) {
      setProblem('A card billed module needs the Stripe subscription it is billed on, or the next webhook will not find it.')
      return
    }
    if (isManage && method !== 'granted' && !price.trim()) {
      setProblem('Manage is quoted per client, so it has no list price. Enter the amount from the signed quote.')
      return
    }
    onConfirm({
      billing_method: method,
      billing_interval: interval,
      ...(method !== 'granted' && price.trim() ? { price_aed: price.trim() } : {}),
      ...(method === 'stripe' ? { stripe_subscription_id: subscription.trim() } : {}),
      ...(canAlign && align && cycle
        ? { current_period_start: cycle.start, current_period_end: cycle.end }
        : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    })
  }

  return (
    <Dialog open onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Turn on {target.label} for {clientName}</DialogTitle>
          <DialogDescription>{target.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="rounded-ds-lg bg-muted px-3 py-2.5 text-[13px] leading-relaxed">
            {includedInManage
              ? 'This client is on Manage, which already includes Merchant of Record. It goes on at no charge: the management service charge covers us paying their creators, and charging for it again would bill the same work twice.'
              : 'It works the moment you confirm. The client is charged for the rest of this cycle only, so it renews on the same day as everything else on the account.'}
          </p>

          {!includedInManage && (
            <div className="space-y-2">
              <Label>How is it billed</Label>
              <div className="space-y-1.5">
                {options.map(o => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => { setMethod(o); setProblem(null) }}
                    className={`flex w-full flex-col items-start gap-0.5 rounded-ds-lg border px-3 py-2.5 text-left transition-colors ${
                      method === o
                        ? 'border-foreground/30 bg-black/[0.04] dark:bg-white/[0.06]'
                        : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="text-[13.5px] font-medium">{BILLING_WORD[o]}</span>
                    <span className="text-[12.5px] text-muted-foreground">{BILLING_HELP[o]}</span>
                  </button>
                ))}
              </div>
              {isManage && (
                <p className="text-[12.5px] text-muted-foreground">
                  Manage is quoted and invoiced, so it cannot be put on a card.
                </p>
              )}
            </div>
          )}

          {!includedInManage && method === 'stripe' && (
            <div className="space-y-1.5">
              <Label htmlFor="mod-sub">Stripe subscription id</Label>
              <Input id="mod-sub" value={subscription} placeholder="sub_..."
                     onChange={e => { setSubscription(e.target.value); setProblem(null) }} />
            </div>
          )}

          {!includedInManage && method !== 'granted' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mod-price">Price for a cycle, in AED</Label>
                <Input id="mod-price" inputMode="decimal" value={price}
                       placeholder={isManage ? 'From the signed quote' : target.listPrice}
                       onChange={e => { setPrice(e.target.value); setProblem(null) }} />
              </div>
              <div className="space-y-1.5">
                <Label>Cycle</Label>
                <Select value={interval} onValueChange={(v: string) => setInterval(v as 'month' | 'year')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {canAlign && cycle && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-ds-lg border border-black/[0.08] px-3 py-2.5 dark:border-white/[0.08]">
              <Checkbox checked={align} onCheckedChange={(v: boolean | 'indeterminate') => setAlign(v === true)}
                        className="mt-0.5" />
              <span className="space-y-0.5">
                <span className="block text-[13.5px] font-medium">
                  Put it on the same cycle as the rest of the account
                </span>
                <span className="block text-[12.5px] text-muted-foreground">
                  Renews with everything else on {fmtDate(cycle.end)}, and only the part of this
                  cycle they are actually getting is charged. Untick to start a fresh cycle today,
                  which bills a full one and gives them a second renewal date.
                </span>
              </span>
            </label>
          )}

          {target.module === 'mor' && !includedInManage && (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Merchant of Record also charges a percentage of every payout we settle, on top of
              this fee. The monthly figure is provisional until it is agreed commercially, and
              whatever is in force when you confirm is the number stamped onto this account. If
              this client turns out to be on Manage, it is granted at no charge instead.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mod-reason">Why, for the audit log</Label>
            <Textarea id="mod-reason" rows={2} value={reason}
                      placeholder="Optional. Read later by whoever asks why this went on."
                      onChange={e => setReason(e.target.value)} />
          </div>

          {problem && (
            <p className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {problem}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Turn on {target.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ======================================================== billing method */

function BillingMethodDialog({
  module: m, clientName, busy, onClose, onConfirm,
}: {
  module: AccountModule
  clientName: string
  busy: boolean
  onClose: () => void
  onConfirm: (payload: { billing_method: BillingMethod; stripe_subscription_id?: string; reason?: string }) => void
}) {
  const isManage = m.module === 'manage'
  const [method, setMethod] = useState<BillingMethod>(m.billing_method)
  const [subscription, setSubscription] = useState(m.stripe_subscription_id || '')
  const [reason, setReason] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  const options: BillingMethod[] = isManage ? ['invoiced', 'granted'] : ['invoiced', 'stripe', 'granted']

  const submit = () => {
    if (method === 'stripe' && !subscription.trim()) {
      setProblem('A card billed module needs the Stripe subscription it is billed on.')
      return
    }
    onConfirm({
      billing_method: method,
      ...(method === 'stripe' ? { stripe_subscription_id: subscription.trim() } : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    })
  }

  return (
    <Dialog open onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>How {clientName} pays for {m.label}</DialogTitle>
          <DialogDescription>
            This is set on this module alone. The rest of the account keeps whatever it has, so
            one module can sit on a card while everything else is invoiced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            {options.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => { setMethod(o); setProblem(null) }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-ds-lg border px-3 py-2.5 text-left transition-colors ${
                  method === o
                    ? 'border-foreground/30 bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[13.5px] font-medium">
                  {BILLING_WORD[o]}
                  {o === m.billing_method && (
                    <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">current</span>
                  )}
                </span>
                <span className="text-[12.5px] text-muted-foreground">{BILLING_HELP[o]}</span>
              </button>
            ))}
          </div>

          {method === 'granted' && m.billing_method !== 'granted' && (
            <p className="rounded-ds-lg bg-muted px-3 py-2 text-[13px] font-medium">
              No charge sets the price to zero. This client stops being billed for {m.label}.
            </p>
          )}

          {method === 'stripe' && (
            <div className="space-y-1.5">
              <Label htmlFor="bm-sub">Stripe subscription id</Label>
              <Input id="bm-sub" value={subscription} placeholder="sub_..."
                     onChange={e => { setSubscription(e.target.value); setProblem(null) }} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="bm-reason">Why, for the audit log</Label>
            <Textarea id="bm-reason" rows={2} value={reason}
                      placeholder="Optional."
                      onChange={e => setReason(e.target.value)} />
          </div>

          {problem && (
            <p className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {problem}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || method === m.billing_method}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save how it is billed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ================================================================== end */

function EndModuleDialog({
  module: m, clientName, busy, onClose, onConfirm,
}: {
  module: AccountModule
  clientName: string
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const ends = fmtDate(m.current_period_end)

  return (
    <Dialog open onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Stop {m.label} for {clientName} at the end of the period?</DialogTitle>
          <DialogDescription>
            {ends
              ? `${m.label} keeps working in full until ${ends}. Nothing changes for them before that date.`
              : `${m.label} keeps working in full until the end of the period they have paid for.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Nothing is taken away. After that date the module becomes read only rather than
            disappearing, and campaigns that are already running can still be approved and
            settled, because creators have done the work and are owed for it. You can undo this
            at any point before the date.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="end-reason">Why, for the audit log</Label>
            <Textarea id="end-reason" rows={2} value={reason}
                      placeholder="Optional. The first thing anyone reads when the client asks."
                      onChange={e => setReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Leave it running</Button>
          <Button onClick={() => onConfirm(reason)} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {ends ? `Stop it on ${ends}` : 'Stop it at period end'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
