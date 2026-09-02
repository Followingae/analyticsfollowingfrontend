'use client'

/**
 * What this account has switched on, what it costs, and how to add or end one.
 *
 * Where the truth comes from
 * --------------------------
 * GET /api/v1/billing/account-modules, read once by the page and passed in. It
 * is the server's own answer: `usable`, `read_only`, `billing_method`, the
 * period end, and whether an ending is already scheduled. None of it is
 * recomputed here, and in particular nothing is derived from `status`, because
 * `usable` also folds in the account-level payment lock: a billed module on a
 * locked account is usable:false while its own row still says "active".
 *
 * The shape of the live data
 * --------------------------
 * Today every account in production has exactly one module, Find, granted, with
 * Run, Merchant of Record and Manage in `available_to_add`. That is the normal
 * case, not an error, so the panel is built as two plain groups: what you have,
 * and what you can add. One row above three reads as a price list, which is
 * what it is, rather than as a wall of "Off" badges.
 *
 * An empty `modules` list is rendered as the truth rather than as a failure, but
 * it should no longer occur: `teams` now carries an AFTER INSERT trigger that
 * grants `find`, and the teams the original backfill missed have been caught up.
 * All 16 live teams have a `find` row, so the Find promotion below is inert.
 *
 * The RULE it implements is permanent even though the branch is: Find never
 * carries a price or an Add button, in either array. Three reasons, none of
 * which depend on an entitlement row existing.
 *
 *   `module_price("find")` is 0. It is not sold, the plan pays for it, so an
 *   Add button would offer to sell something at nothing.
 *   It is in PLAN_INCLUDED_MODULES for every tier, Free included.
 *   It is in ALWAYS_READABLE_MODULES, so it is never gated and never locked,
 *   even for an account in dunning. Its access does not depend on the row.
 *
 * So "Find, on, included at no extra charge" is the honest line wherever the
 * server puts it, and it stays honest now the backfill has landed. The branch is
 * left as a cheap defensive rendering rule over the same payload, not something
 * to design around: if it ever fired it would render something true.
 *
 * Words that are not used here
 * ----------------------------
 * Remove, delete, revoke. Ending a module is a schedule: it runs, in full, to
 * the end of the period already paid for, and the date is on screen. Adding one
 * is immediate and prorated onto the current cycle, and the panel says so before
 * anyone commits.
 *
 * Merchant of Record is included with Manage at no charge, and a Manage client
 * is never shown a price for it. `invoice_only` carries the same idea for a
 * module that can never go on a card: the action there is a conversation.
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui2/item'
import { AlertCircle, Check, Lock } from 'lucide-react'
import type { BillingStatus } from '@/services/billingManager'
import type { BrandModulesResult } from '@/hooks/useBrandModules'
import { resolveModules } from '@/hooks/useCommercialAccount'
import { MODULES, MODULE_ORDER } from '@/config/modules'
import {
  MODULE_PRICING,
  formatPlanPrice,
  type AnyModuleKey,
  type ModuleKey,
} from '@/config/planPricing'
import { RequestModuleDialog } from '@/components/commercial/RequestModuleDialog'
import type { BrandModule, BrandModuleOffer } from '@/services/brandBillingApi'
import { longDate } from './PlanSummaryCard'

/** The server's own words win, because it reads app/core/modules.py directly
 *  and cannot fall behind it. The catalogue is the fallback, and it now has an
 *  entry for every module the backend knows, `mor` included, so there is no
 *  longer a hand-written line living here for a module the catalogue missed. */
function summaryFor(key: string, fromServer: string | null): string {
  if (fromServer) return fromServer
  const known = (MODULES as Record<string, { summary: string }>)[key]
  return known?.summary ?? ''
}

interface ModulesPanelProps {
  status: BillingStatus
  /** Following invoices this account. Decided once, upstream, from payment.invoiced. */
  managed: boolean
  isSuperAdmin: boolean
  modules: BrandModulesResult
}

export function ModulesPanel({ status, managed, isSuperAdmin, modules }: ModulesPanelProps) {
  const [request, setRequest] = useState<{ module: ModuleKey; ending: boolean } | null>(null)

  // `RequestModuleDialog` knows every module in src/config/modules.ts, which is
  // now all four including Merchant of Record, so MoR gets the same dialog as
  // the rest rather than a bare mailto. The mailto stays as the fallback for a
  // module the SERVER offers that this catalogue has never heard of: that is
  // the drift this endpoint is designed to survive, and a dialog keyed on a
  // missing definition would throw.
  const ask = (module: string, label: string, ending: boolean) => {
    const key = module as ModuleKey
    if (MODULES[key]) {
      setRequest({ module: key, ending })
      return
    }
    const subject = ending ? `End ${label}` : `Add ${label}`
    window.location.href = `mailto:support@following.ae?subject=${encodeURIComponent(subject)}`
  }

  if (modules.state === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-ds-subheading">Modules and add ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-ds-2">
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
        </CardContent>
      </Card>
    )
  }

  if (modules.state === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-ds-subheading">Modules and add ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-ds-2 py-ds-4 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-ds-body font-medium">We could not load what you have switched on</p>
          <p className="text-ds-body-sm text-muted-foreground">
            Nothing here is guessed at, so the list is left off rather than shown wrong. What you
            have is unchanged either way.
          </p>
          <Button variant="outline" size="sm" onClick={modules.reload}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (modules.state === 'no_team') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-ds-subheading">Modules and add ons</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-ds-body-sm text-muted-foreground">
            This sign in is not attached to a billing account, so there is nothing switched on
            and nothing to add. Your account manager can attach it to your team.
          </p>
        </CardContent>
      </Card>
    )
  }

  const snapshot = modules.state === 'loaded' ? modules.snapshot : null

  // 'absent': the route is not deployed, so the panel falls back to what the
  // product enforces today, and shows nothing about a period end or a scheduled
  // ending, because that is exactly the part it cannot know. This is NOT the
  // path for an account that answered with an empty list: that answer is real.
  const owns = snapshot ? null : resolveModules(status, { isSuperAdmin })

  // Find belongs in "on your account" whichever array it arrives in. See the
  // note at the top of the file: the rule is permanent, the branch is inert.
  const ALWAYS_ON = 'find'

  const fromServerHeld = snapshot?.modules ?? []
  const fromServerOffered = snapshot?.availableToAdd ?? []
  const findIsOffered =
    snapshot !== null &&
    !fromServerHeld.some((m) => m.module === ALWAYS_ON) &&
    fromServerOffered.some((o) => o.module === ALWAYS_ON)

  const held: BrandModule[] = snapshot
    ? [
        ...(findIsOffered
          ? [
              {
                module: ALWAYS_ON,
                label: fromServerOffered.find((o) => o.module === ALWAYS_ON)!.label,
                description:
                  fromServerOffered.find((o) => o.module === ALWAYS_ON)!.description ?? null,
                status: null,
                usable: true,
                read_only: false,
                billing_method: 'granted' as const,
                current_period_end: null,
                cancels_on: null,
                cancel_at_period_end: false,
              },
            ]
          : []),
        ...fromServerHeld,
      ]
    : MODULE_ORDER.filter((key) => owns![key]).map((key) => ({
        module: key,
        label: MODULES[key].name,
        description: MODULES[key].summary,
        status: null,
        usable: true,
        read_only: false,
        billing_method: null,
        current_period_end: null,
        cancels_on: null,
        cancel_at_period_end: false,
      }))

  const offered: BrandModuleOffer[] = snapshot
    ? fromServerOffered.filter((o) => o.module !== ALWAYS_ON)
    : MODULE_ORDER.filter((key) => !owns![key]).map((key) => ({
        module: key,
        label: MODULES[key].name,
        description: MODULES[key].summary,
        price_aed_per_month: null,
        invoice_only: managed || MODULES[key].availability === 'quoted',
      }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-ds-subheading">Modules and add ons</CardTitle>
          <CardDescription>
            {managed
              ? 'Each one is on your invoice. Your account manager adds or ends any of them.'
              : 'Adding one starts straight away and is prorated onto this cycle. Ending one runs to the date you have paid up to.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-ds-4">
          {held.length > 0 ? (
            <div className="space-y-ds-2">
              <p className="text-ds-overline uppercase text-muted-foreground">On your account</p>
              <ItemGroup className="gap-ds-2">
                {held.map((row) => (
                  <HeldModule
                    key={row.module}
                    row={row}
                    managed={managed}
                    onEnd={() => ask(row.module, row.label, true)}
                  />
                ))}
              </ItemGroup>
            </div>
          ) : null}

          {held.length > 0 && offered.length > 0 ? <Separator /> : null}

          {offered.length > 0 ? (
            <div className="space-y-ds-2">
              <p className="text-ds-overline uppercase text-muted-foreground">Available to add</p>
              <ItemGroup className="gap-ds-2">
                {offered.map((offer) => (
                  <OfferedModule
                    key={offer.module}
                    offer={offer}
                    onAdd={() => ask(offer.module, offer.label, false)}
                  />
                ))}
              </ItemGroup>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {request ? (
        <RequestModuleDialog
          module={request.module}
          open
          onOpenChange={(open) => !open && setRequest(null)}
          managed={managed}
          accountEmail={status.user?.email}
          context={
            request.ending
              ? `end ${MODULES[request.module].name} at the close of the period we have paid for`
              : undefined
          }
        />
      ) : null}
    </>
  )
}

// ─── A module the account has ────────────────────────────────────────────────

function HeldModule({
  row,
  managed,
  onEnd,
}: {
  row: BrandModule
  managed: boolean
  onEnd: () => void
}) {
  const endsOn = longDate(row.cancels_on ?? row.current_period_end)
  const ending = row.cancel_at_period_end

  // Granted means it is on at no charge: Find in every plan, and everything
  // Manage already pays for. There is nothing to end and no price to quote.
  const granted = row.billing_method === 'granted'

  const how =
    row.billing_method === 'invoiced'
      ? 'On your invoice'
      : row.billing_method === 'stripe'
        ? 'On your card, with your plan'
        : null

  return (
    <Item variant="outline" className="items-start">
      <ItemContent>
        <ItemTitle className="flex flex-wrap items-center gap-ds-2">
          {row.label}
          {row.usable ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              On
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Read only
            </Badge>
          )}
          {ending ? <Badge variant="outline">Ending</Badge> : null}
        </ItemTitle>

        <ItemDescription>{summaryFor(row.module, row.description)}</ItemDescription>

        {granted ? (
          <p className="mt-ds-1 text-ds-caption text-muted-foreground">
            Included at no extra charge
          </p>
        ) : how ? (
          <p className="mt-ds-1 text-ds-caption text-muted-foreground">{how}</p>
        ) : null}

        {ending && endsOn ? (
          <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
            It keeps working in full until {endsOn}, and nothing is charged after that.
          </p>
        ) : row.usable && !granted && endsOn ? (
          <p className="mt-ds-1 text-ds-caption text-muted-foreground">Renews {endsOn}</p>
        ) : null}

        {!row.usable ? (
          <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
            You can open it and read everything already there. Settling the outstanding balance
            switches it back on.
          </p>
        ) : null}
      </ItemContent>

      <ItemActions className="self-center">
        {granted ? null : ending ? (
          <span className="text-ds-caption text-muted-foreground">
            Ends {endsOn ?? 'this period'}
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={onEnd}>
            {managed ? `Ask to end ${row.label}` : `End ${row.label}`}
          </Button>
        )}
      </ItemActions>
    </Item>
  )
}

// ─── A module the account could add ──────────────────────────────────────────

function OfferedModule({ offer, onAdd }: { offer: BrandModuleOffer; onAdd: () => void }) {
  const amount = offer.price_aed_per_month ? Number(offer.price_aed_per_month) : NaN
  // Whether this module has a price we are allowed to publish at all.
  //
  // GET /billing/account-modules sends `price_aed_per_month` for EVERY module
  // it offers, straight out of app/core/modules.py module_price(). For
  // Merchant of Record that number is MOR_ADDON_AED_PER_MONTH, which that file
  // labels a PLACEHOLDER that has not been agreed commercially, and MoR is not
  // in INVOICE_ONLY_MODULES, so `invoice_only` does not stop it. Rendering the
  // response as it arrives would quote a customer a price nobody has set.
  // app/core/plans.py addon_catalogue() carries the right flag as
  // `price_agreed: False`; until that reaches this endpoint, MODULE_PRICING is
  // the frontend's copy of the same judgement.
  const publishable = MODULE_PRICING[offer.module as AnyModuleKey] === 'listed'
  // A quoted module carries no list price. Zero here means "there is no price
  // to show", not "it is free", so it is never rendered as an amount.
  const price =
    publishable && !offer.invoice_only && Number.isFinite(amount) && amount > 0
      ? // The field is `price_aed_per_month`: the server states this one in AED
        // by name, so AED is the currency, not an assumption.
        `${formatPlanPrice(Math.round(amount), 'AED')} a month`
      : null
  const quoted = !publishable && !offer.invoice_only

  return (
    <Item variant="outline" className="items-start">
      <ItemContent>
        <ItemTitle>{offer.label}</ItemTitle>
        <ItemDescription>{summaryFor(offer.module, offer.description)}</ItemDescription>
        {offer.invoice_only ? (
          <p className="mt-ds-1 text-ds-caption text-muted-foreground">
            Priced against the work and put on your invoice, never on a card.
          </p>
        ) : quoted ? (
          <p className="mt-ds-1 text-ds-caption text-muted-foreground">
            There is a monthly fee and a percentage of what we settle, and both are agreed with
            you before it goes on.
          </p>
        ) : null}
      </ItemContent>

      <ItemActions className="self-center">
        <div className="space-y-ds-1 text-right">
          {price ? (
            <p className="text-ds-body-sm font-medium">{price}</p>
          ) : quoted ? (
            <p className="text-ds-body-sm font-medium">Quoted</p>
          ) : null}
          <Button
            variant={offer.invoice_only || quoted ? 'outline' : 'default'}
            size="sm"
            onClick={onAdd}
          >
            {offer.invoice_only || quoted ? 'Talk to us' : `Add ${offer.label}`}
          </Button>
        </div>
      </ItemActions>
    </Item>
  )
}
