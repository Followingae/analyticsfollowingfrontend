'use client'

/**
 * Surface 3 - billing, itemised.
 *
 * One list. Every line the account pays for, each cancellable on its own, and
 * the modules they do not have sitting in the same list carrying a price and a
 * button. That last part is the reason there is no upgrade page anywhere in
 * this product: the place you buy a module is the place you can see what you
 * already pay for.
 *
 * Boundary cases are lines in this list, not banners somewhere else:
 *   failed card    the plan line says the payment failed and offers the portal
 *   cancellation   the line says what date access ends, and stays until then
 *   downgrade      a scheduled change is shown on the line it will change
 *   mid-cycle add  the module line says it is prorated onto the next invoice
 *
 * Managed accounts get this same list, with Request instead of a price, and no
 * card form anywhere on it.
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui2/item'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, Building2, CreditCard, Package } from 'lucide-react'
import { toast } from 'sonner'
import { billingManager, type BillingStatus } from '@/services/billingManager'
import { MODULE_ORDER, MODULES } from '@/config/modules'
import {
  formatModulePrice,
  formatPlanPrice,
  resolveCurrency,
  type ModuleAddonKey,
  type ModuleKey,
} from '@/config/planPricing'
import { RequestModuleDialog } from './RequestModuleDialog'
import { ModuleRow } from './ModuleRow'

interface SubscriptionLinesProps {
  status: BillingStatus
  managed: boolean
  owns: Record<ModuleKey, boolean>
}

function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SubscriptionLines({ status, managed, owns }: SubscriptionLinesProps) {
  const [portalOpen, setPortalOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelModule, setCancelModule] = useState<ModuleKey | null>(null)

  const plan = status.plan
  const stripe = status.stripe
  const currency = resolveCurrency(plan?.currency)
  const tier = (plan?.tier || 'free').toLowerCase()
  const isFree = tier === 'free'

  const pastDue = plan?.status === 'past_due'
  const cancelling = Boolean(stripe?.cancel_at_period_end)
  // Some accounts carry a scheduled tier change; render it only if it is there.
  const scheduled = (stripe as unknown as { scheduled_tier?: string } | null)?.scheduled_tier

  const openPortal = async () => {
    try {
      setPortalLoading(true)
      await billingManager.openCustomerPortal(status.portal_url ?? undefined)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not open the billing portal')
    } finally {
      setPortalLoading(false)
      setPortalOpen(false)
    }
  }

  const ownedAddons = MODULE_ORDER.filter(
    (key) => owns[key] && MODULES[key].availability === 'addon'
  )
  const unownedModules = MODULE_ORDER.filter((key) => !owns[key])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            What you pay for
          </CardTitle>
          <CardDescription>
            {managed
              ? 'We invoice this account directly. Each line is cancellable through your account manager.'
              : 'Each line is cancellable on its own.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ItemGroup className="gap-3">
            {/* ── The plan ─────────────────────────────────────────────── */}
            <Item variant="outline" className="items-start">
              <ItemContent>
                <ItemTitle className="flex flex-wrap items-center gap-2">
                  <span className="capitalize">{plan?.tier ?? '—'} plan</span>
                  {managed && (
                    <Badge variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      Managed
                    </Badge>
                  )}
                  {pastDue && <Badge variant="destructive">Payment failed</Badge>}
                  {cancelling && <Badge variant="outline">Cancelling</Badge>}
                </ItemTitle>

                <ItemDescription>
                  {managed ? (
                    'Billed on your invoice, not by card.'
                  ) : isFree ? (
                    'Free. Nothing is charged.'
                  ) : (
                    <>
                      {typeof plan?.price_per_month === 'number'
                        ? `${formatPlanPrice(plan.price_per_month, currency)}/month`
                        : '—'}
                      {stripe?.billing_interval ? ` · billed ${stripe.billing_interval}` : ''}
                    </>
                  )}
                </ItemDescription>

                {/* Boundary cases, on the line they belong to. */}
                {pastDue && (
                  <p className="text-ds-body-sm text-destructive flex items-start gap-2 mt-1">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Your last payment did not go through. Your plan stays on while we retry -
                    update the card and it settles on the next attempt.
                  </p>
                )}

                {cancelling && !pastDue && (
                  <p className="text-ds-body-sm text-muted-foreground mt-1">
                    Cancelled. You keep everything on this plan until{' '}
                    {formatDate(stripe?.current_period_end)}, and nothing is charged after that.
                  </p>
                )}

                {scheduled && !cancelling && (
                  <p className="text-ds-body-sm text-muted-foreground mt-1">
                    Changing to the {scheduled} plan on {formatDate(stripe?.current_period_end)}.
                    Until then this plan and its limits are unchanged.
                  </p>
                )}

                {!cancelling && !scheduled && !managed && !isFree && stripe?.current_period_end && (
                  <p className="text-ds-caption text-muted-foreground mt-1">
                    Renews {formatDate(stripe.current_period_end)}
                  </p>
                )}
              </ItemContent>

              <ItemActions className="self-center">
                {managed ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:support@following.ae?subject=Plan%20change%20request">
                      Ask your account manager
                    </a>
                  </Button>
                ) : isFree ? (
                  <span className="text-ds-caption text-muted-foreground">Nothing to cancel</span>
                ) : (
                  <Button
                    variant={pastDue ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setPortalOpen(true)}
                    disabled={portalLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {pastDue ? 'Update card' : cancelling ? 'Reactivate' : 'Change or cancel'}
                  </Button>
                )}
              </ItemActions>
            </Item>

            {/* ── Add-ons they pay for ─────────────────────────────────── */}
            {ownedAddons.map((key) => (
              <Item key={key} variant="outline" className="items-start">
                <ItemContent>
                  <ItemTitle>{MODULES[key].name}</ItemTitle>
                  <ItemDescription>
                    {managed
                      ? 'On your invoice.'
                      : `${formatModulePrice(key as ModuleAddonKey)} · added to the same invoice as your plan`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="self-center">
                  <Button variant="outline" size="sm" onClick={() => setCancelModule(key)}>
                    Cancel {MODULES[key].name}
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>

      {/* ── The modules they do not have, in the same list ───────────── */}
      {unownedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not on your account</CardTitle>
            <CardDescription>
              {managed
                ? 'Request one and your account manager adds it to your invoice.'
                : 'Added mid-cycle and prorated onto your next invoice. There is no separate upgrade page - this is it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-3">
              {unownedModules.map((key) => (
                <ModuleRow
                  key={key}
                  module={key}
                  owned={false}
                  managed={managed}
                  accountEmail={status.user?.email}
                  compact
                />
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}

      {/* Cancelling an add-on is a note, because the add-on has no Stripe
          price object yet and we will not pretend to cancel something Stripe
          does not know about. */}
      {cancelModule && (
        <RequestModuleDialog
          module={cancelModule}
          open={cancelModule !== null}
          onOpenChange={(open) => !open && setCancelModule(null)}
          managed={managed}
          accountEmail={status.user?.email}
          context={`cancel ${MODULES[cancelModule].name} at the end of the current period`}
        />
      )}

      <AlertDialog open={portalOpen} onOpenChange={setPortalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open the billing portal?</AlertDialogTitle>
            <AlertDialogDescription>
              This opens Stripe, where you can update your card, change your plan or cancel.
              Nothing changes until you confirm it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={openPortal}>Open portal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
