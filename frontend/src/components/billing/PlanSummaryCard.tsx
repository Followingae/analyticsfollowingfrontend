'use client'

/**
 * The top of /billing, and the answer to the first two questions anyone opens
 * this page with:
 *
 *   1. What am I on, what does it cost, and when does it renew.
 *   2. Am I paying by card, or does Following invoice me.
 *
 * The second one is the reason this component exists. A managed client used to
 * be shown a "Payment Details" card, a "Manage Subscription" button and a
 * portal that refuses them, none of which is true of an account we invoice.
 * Here, an invoiced account is told, in one sentence, that we invoice them, and
 * no card control is rendered at all. Not disabled: absent.
 *
 * Money that did not load is a dash, never a zero. "You owe nothing" is a claim,
 * and we do not get to make it on behalf of a request that never came back.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Building2, CreditCard, Clock } from 'lucide-react'
import type { BillingStatus } from '@/services/billingManager'
import { formatPlanPrice, normalizePlanTier, resolveCurrency } from '@/config/planPricing'
import { money, type AccountInvoicesResult } from './useAccountInvoices'

/** The one glyph this page uses for a figure it does not have. */
export const NO_FIGURE = '–'

export function longDate(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Field({
  label,
  children,
  note,
}: {
  label: string
  children: React.ReactNode
  note?: React.ReactNode
}) {
  return (
    <div className="space-y-ds-1">
      <p className="text-ds-overline uppercase text-muted-foreground">{label}</p>
      <div className="text-ds-subheading">{children}</div>
      {note ? <p className="text-ds-body-sm text-muted-foreground">{note}</p> : null}
    </div>
  )
}

interface PlanSummaryCardProps {
  status: BillingStatus
  /** Following invoices this account. Decided once, upstream, and passed in. */
  managed: boolean
  invoices: AccountInvoicesResult
  /**
   * Where the account's payments stand, from the entitlements read. This is the
   * dunning state the server actually locks modules on, so it outranks
   * `plan.status` when the two disagree. Null when we do not have it.
   */
  paymentState: 'current' | 'past_due' | 'grace' | 'locked' | null
  graceEndsAt: string | null
  onOpenPortal: () => void
  onSeeInvoices: () => void
}

export function PlanSummaryCard({
  status,
  managed,
  invoices,
  paymentState,
  graceEndsAt,
  onOpenPortal,
  onSeeInvoices,
}: PlanSummaryCardProps) {
  const plan = status.plan
  const stripe = status.stripe
  const tier = normalizePlanTier(plan?.tier)
  const currency = resolveCurrency(plan?.currency)
  const isFree = tier === 'free'

  // The dunning state wins where we have it: it is what the server locks
  // modules on. `plan.status` is the fallback for an account the entitlements
  // read does not cover yet.
  const behind = paymentState
    ? paymentState !== 'current'
    : plan?.status === 'past_due'
  const locked = paymentState === 'locked'
  const graceUntil = longDate(graceEndsAt)
  const pastDue = behind
  const cancelling = Boolean(stripe?.cancel_at_period_end)
  const trialEnd = status.trial_info?.trial_active ? longDate(status.trial_info.trial_end) : null
  const renews = longDate(stripe?.current_period_end)
  const card = stripe?.payment_method

  // What is owed, across both invoice sources. Three outcomes, kept apart.
  const owed = invoices.outstandingByCurrency
  const owedEntries = owed ? Object.entries(owed) : []
  const overdue = invoices.invoices.filter((i) => i.status === 'overdue').length

  const priceLine = managed
    ? 'On your invoice'
    : isFree
      ? 'Free'
      : typeof plan?.price_per_month === 'number'
        ? `${formatPlanPrice(plan.price_per_month, currency)} a month`
        : NO_FIGURE

  const whenLine = trialEnd
    ? `Trial ends ${trialEnd}`
    : cancelling && renews
      ? `Ends ${renews}, and does not renew`
      : renews
        ? `Renews ${renews}`
        : managed
          ? 'Renewal is set by your agreement'
          : isFree
            ? 'Nothing to renew'
            : 'Renewal date unavailable'

  return (
    <Card>
      <CardContent className="p-ds-4 sm:p-ds-5">
        <div className="grid gap-ds-4 sm:grid-cols-3 sm:gap-ds-5">
          {/* 1. What am I on, what does it cost, when does it renew. */}
          <Field label="Your plan" note={whenLine}>
            <span className="flex flex-wrap items-center gap-ds-2">
              <span className="text-ds-title capitalize">{plan?.tier ?? NO_FIGURE}</span>
              {trialEnd ? <Badge variant="secondary">Trial</Badge> : null}
              {pastDue ? <Badge variant="destructive">Payment failed</Badge> : null}
              {cancelling && !pastDue ? <Badge variant="outline">Ending</Badge> : null}
            </span>
            <span className="mt-ds-1 block text-ds-body text-muted-foreground">{priceLine}</span>
          </Field>

          {/* 2. Card, or invoice. The whole point of this row. */}
          <Field
            label="How you pay"
            note={
              managed
                ? 'Following raises the invoice. No card is held on this account.'
                : card
                  ? `Expires ${String(card.exp_month).padStart(2, '0')}/${card.exp_year}`
                  : isFree
                    ? 'Nothing is charged on the Free plan.'
                    : 'No card is on file yet.'
            }
          >
            {managed ? (
              <span className="flex items-center gap-ds-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                We invoice you
              </span>
            ) : card ? (
              <span className="flex items-center gap-ds-2">
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="capitalize">{card.brand || 'Card'}</span> ending {card.last4}
              </span>
            ) : (
              <span className="flex items-center gap-ds-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                No card
              </span>
            )}
          </Field>

          {/* 3. What is outstanding right now. */}
          <Field
            label="Outstanding"
            note={
              invoices.loading
                ? undefined
                : owed === null
                  ? 'Some invoices did not load, so this is not a total'
                  : overdue > 0
                    ? `${overdue} invoice${overdue === 1 ? '' : 's'} overdue`
                    : owedEntries.length === 0
                      ? 'Nothing outstanding'
                      : 'Across your open invoices'
            }
          >
            {invoices.loading ? (
              <Skeleton className="h-6 w-28" />
            ) : owed === null ? (
              <span className="text-muted-foreground">{NO_FIGURE}</span>
            ) : owedEntries.length === 0 ? (
              <span>{money(0, 'AED')}</span>
            ) : (
              <span className={overdue > 0 ? 'text-destructive' : undefined}>
                {owedEntries.map(([ccy, amount]) => money(amount, ccy)).join(', ')}
              </span>
            )}
          </Field>
        </div>

        {/* Boundary cases sit under the fact they qualify, not in a banner
            somewhere else on the page. */}
        {behind ? (
          <p className="mt-ds-4 flex items-start gap-ds-2 text-ds-body-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {locked
              ? 'There is an unpaid balance, so the paid parts of your account are read only for now. Everything you have is still here and nothing has been deleted. Settling the balance switches it all back on the same day.'
              : managed
                ? `There is an unpaid balance on this account.${graceUntil ? ` Everything stays on until ${graceUntil}.` : ''} Your account manager can tell you what is outstanding and how to settle it.`
                : `Your last payment did not go through.${graceUntil ? ` Everything stays on until ${graceUntil}.` : ' Your plan stays on while we retry.'} It settles on the next attempt once the card is updated.`}
          </p>
        ) : null}

        {cancelling && !pastDue && renews ? (
          <p className="mt-ds-4 flex items-start gap-ds-2 text-ds-body-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            You keep everything on this plan until {renews}. Nothing is charged after that, and
            the creators you have already unlocked stay unlocked.
          </p>
        ) : null}

        <Separator className="my-ds-3" />

        <div className="flex flex-wrap items-center gap-ds-2">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onSeeInvoices}>
            See every invoice
          </Button>

          {/* A managed account gets no card control at all. Not a disabled one. */}
          {!managed && !isFree ? (
            <Button
              variant={pastDue ? 'destructive' : 'outline'}
              size="sm"
              className="h-8"
              onClick={onOpenPortal}
            >
              <CreditCard className="mr-ds-1 h-4 w-4" />
              {pastDue ? 'Update card' : card ? 'Update card' : 'Add a card'}
            </Button>
          ) : null}

          {managed ? (
            <Button variant="outline" size="sm" className="h-8" asChild>
              <a href="mailto:support@following.ae?subject=Billing%20question">
                Ask your account manager
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
