'use client'

/**
 * /billing, rebuilt.
 *
 * What was here before was 1,083 lines that answered none of the five questions
 * a client opens this page with. It showed the plan you are on three times over
 * (a summary strip, a "Current Plan" card, and an itemised subscription list),
 * offered a "Manage Subscription" button and a "Payment Details" card to
 * accounts we invoice by bank transfer, listed no other plan and no way to move
 * to one, and answered a failed request with the words "No Active Subscription"
 * over a button to buy one.
 *
 * The page now answers five questions, in this order:
 *
 *   1. What am I on, what does it cost, when does it renew.  PlanSummaryCard
 *   2. Card, or do you invoice me.                           PlanSummaryCard
 *   3. What else could I be on, and how do I move.           ChangePlanPanel
 *   4. What have I switched on, and what does it cost.       ModulesPanel
 *   5. What have I been charged.                             InvoicesPanel
 *
 * The first two are above the tabs, so they are answered whichever tab is open.
 *
 * Three states, kept apart, everywhere on this page: loading, empty and failed.
 * A request that did not answer is never rendered as a fact. Money that did not
 * load is a dash, never a zero.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { billingManager, type BillingStatus } from '@/services/billingManager'
import { hydrateBillingCurrency } from '@/config/planPricing'
import { isManagedAccount } from '@/hooks/useCommercialAccount'
import { useBrandModules } from '@/hooks/useBrandModules'
import { fetchBillingStatus } from '@/services/brandBillingApi'

import { TrialBanner } from '@/components/billing/TrialBanner'
import { TrialDailyLimitsCard } from '@/components/billing/TrialDailyLimitsCard'
import { InvoicesPanel } from '@/components/billing/InvoicesPanel'
import { useAccountInvoices } from '@/components/billing/useAccountInvoices'
import { PlanSummaryCard } from '@/components/billing/PlanSummaryCard'
import { ChangePlanPanel } from '@/components/billing/ChangePlanPanel'
import { ModulesPanel } from '@/components/billing/ModulesPanel'
import { UsagePanel } from '@/components/billing/UsagePanel'
import { CashbackPoolPanel } from '@/components/billing/CashbackPoolPanel'

export default function BillingPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        {/* useSearchParams (the deep-linked tabs) needs a Suspense boundary. */}
        <Suspense>
          <BillingContent />
        </Suspense>
      </BrandUserInterface>
    </AuthGuard>
  )
}

/** 'plan' is kept as an alias of the first tab: it was a deep link people have. */
const TABS = ['plan', 'invoices', 'cashback-pool'] as const

type Load = 'loading' | 'loaded' | 'empty' | 'failed'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-ds-4 sm:p-ds-5">
      <div className="space-y-ds-4">
        <div className="space-y-ds-1">
          <h1 className="text-ds-title">Billing</h1>
          <p className="text-ds-body text-muted-foreground">
            What you are on, how you pay for it, and everything we have charged you.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useEnhancedAuth()

  const [load, setLoad] = useState<Load>('loading')
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)

  // Both invoice sources, fetched once for the whole page: the outstanding
  // figure at the top and the Invoices tab are the same numbers, so they are
  // the same request.
  const invoices = useAccountInvoices(!!user)

  // Read once, here, because one field on it decides what the whole page looks
  // like. `payment.invoiced` is the ONLY correct answer to "card or invoice":
  // it is read from the team owner's row, so a member of an invoiced client
  // whose own billing_type is unset is never shown a card form.
  const modules = useBrandModules(!!user)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const result = await fetchBillingStatus<BillingStatus>()
      if (!result || !result.plan) {
        setStatus(result)
        setLoad('empty')
        return
      }
      // Adopt the currency the backend actually charges in, so nothing static
      // on this page can quote a different one from the invoice.
      hydrateBillingCurrency(result.plan?.currency)
      setStatus(result)
      setLoad('loaded')
    } catch {
      setStatus(null)
      setLoad('failed')
    }
  }, [user])

  useEffect(() => {
    void refresh()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onCredits = () => void refresh()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('credit-balance-changed', onCredits)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('credit-balance-changed', onCredits)
    }
  }, [refresh])

  // Returns from Stripe land back here.
  useEffect(() => {
    const topup = searchParams.get('topup')
    if (topup === 'success') toast.success('Your pool has been topped up.')
    if (topup === 'cancelled') toast.info('Top up cancelled. Nothing was charged.')

    const plan = searchParams.get('plan')
    if (plan === 'changed') toast.success('Your plan is updated.')
    if (plan === 'cancelled') toast.info('Nothing was changed and nothing was charged.')
  }, [searchParams])

  const tabParam = searchParams.get('tab') ?? 'plan'
  const activeTab = (TABS as readonly string[]).includes(tabParam) ? tabParam : 'plan'
  const goTab = (tab: string) =>
    router.replace(tab === 'plan' ? '/billing' : `/billing?tab=${tab}`, { scroll: false })

  const openPortal = async () => {
    try {
      setPortalBusy(true)
      await billingManager.openCustomerPortal(status?.portal_url ?? undefined)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'We could not open the billing portal')
    } finally {
      setPortalBusy(false)
      setPortalOpen(false)
    }
  }

  // Both reads are waited on together. Rendering the summary card before the
  // entitlements answer would mean showing an "Update card" button and then
  // taking it away from a client we invoice.
  if (load === 'loading' || !modules.settled) {
    return (
      <Shell>
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[320px]" />
      </Shell>
    )
  }

  // The request did not answer. This is NOT "you have no subscription", and it
  // no longer says so.
  if (load === 'failed') {
    return (
      <Shell>
        <Card>
          <CardContent className="space-y-ds-2 py-ds-5 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-ds-body font-medium">We could not load your billing</p>
            <p className="text-ds-body-sm text-muted-foreground">
              Your plan and everything on it are unchanged. This is our side, not yours.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  // The server answered, and there is genuinely no billing record yet.
  if (load === 'empty' || !status) {
    return (
      <Shell>
        <Card>
          <CardContent className="space-y-ds-2 py-ds-5 text-center">
            <p className="text-ds-body font-medium">There is no billing on this account yet</p>
            <p className="text-ds-body-sm text-muted-foreground">
              Nothing has been charged and no card is held. Your account manager can set up a plan
              whenever you are ready.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@following.ae?subject=Setting%20up%20a%20plan">
                Ask your account manager
              </a>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  // The server's own flag when we have it. The older derivation (billing_type
  // on the signed-in user, or an 'admin_managed' subscription status) is only
  // the fallback for an account the entitlements route does not cover yet.
  const managed = modules.snapshot
    ? modules.snapshot.payment.invoiced
    : isManagedAccount(status)
  const paymentState = modules.snapshot?.payment.state ?? null
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin'
  const trial = status.trial_info
  const trialing = billingManager.isTrialing(status)

  return (
    <Shell>
      {/* Questions 1 and 2, above the tabs, so they are answered whichever tab
          is open. */}
      <PlanSummaryCard
        status={status}
        managed={managed}
        invoices={invoices}
        paymentState={paymentState}
        graceEndsAt={modules.snapshot?.payment.grace_ends_at ?? null}
        onOpenPortal={() => setPortalOpen(true)}
        onSeeInvoices={() => goTab('invoices')}
      />

      {trialing && trial ? (
        <TrialBanner
          trialEnd={trial.trial_end ? String(trial.trial_end) : null}
          trialDurationDays={trial.trial_duration_days}
          dailyUsage={trial.limits}
          dailyCreditLimit={trial.daily_credit_limit}
        />
      ) : null}

      <Tabs value={activeTab} onValueChange={goTab} className="space-y-ds-3">
        <TabsList>
          <TabsTrigger value="plan">Plan and modules</TabsTrigger>
          {/* Invoices is for everyone. It used to be hidden from admin-managed
              accounts, which meant the only clients we actually invoice were
              the only ones who could not see their invoices. */}
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          {/* The cashback tab is gated on the same thing it has always been
              gated on: an account we invoice does not see it. Stated plainly
              because `invoiced` means only "no card, we raise invoices" and
              carries no information about cashback, merchants or FA. It is a
              proxy that holds today because our invoiced clients are the
              managed ones, and it will drift the first time a card paying
              client gets cashback. The real gate is a module or whether the
              client has merchants at all, and neither is wired yet. */}
          {!managed && <TabsTrigger value="cashback-pool">Cashback pool</TabsTrigger>}
        </TabsList>

        <TabsContent value="plan" className="space-y-ds-3">
          {/* 3. What can I move to. */}
          <ChangePlanPanel status={status} managed={managed} onChanged={() => void refresh()} />

          {/* 4. What have I switched on, and what does it cost. */}
          <ModulesPanel
            status={status}
            managed={managed}
            isSuperAdmin={isSuperAdmin}
            modules={modules}
          />

          <UsagePanel status={status} managed={managed} />

          {trialing && trial?.limits ? (
            <TrialDailyLimitsCard
              limits={trial.limits}
              totalCreditsAllowed={trial.total_credits_allowed}
              dailyCreditLimit={trial.daily_credit_limit}
            />
          ) : null}

          <p className="text-ds-caption text-muted-foreground">
            Questions about any of this: support@following.ae, Monday to Friday, 9am to 6pm GST.
          </p>
        </TabsContent>

        {/* 5. What have I been charged. One list, both sources, every account. */}
        <TabsContent value="invoices" className="space-y-ds-3">
          <InvoicesPanel data={invoices} />
        </TabsContent>

        {!managed && (
          <TabsContent value="cashback-pool" className="space-y-ds-3">
            <CashbackPoolPanel />
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={portalOpen} onOpenChange={setPortalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open the billing portal?</AlertDialogTitle>
            <AlertDialogDescription>
              This opens Stripe, where your card is held. Nothing is charged and nothing changes
              until you confirm it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction disabled={portalBusy} onClick={() => void openPortal()}>
              {portalBusy ? 'Opening' : 'Open the portal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  )
}
