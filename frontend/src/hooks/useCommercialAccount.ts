'use client'

/**
 * One reader for "what does this account actually have, and how does it pay".
 *
 * Every commercial surface - the plan screen, the locked-module card, the
 * billing list, the pricing basket - asks this hook and nothing else. That is
 * what makes the four surfaces agree with each other.
 *
 * Three states, kept distinct on purpose:
 *   loading   the request is in flight
 *   failed    the request came back wrong, or not at all
 *   loaded    we have an answer (which may legitimately be "no subscription")
 *
 * A failed request must never be rendered as a zero. Callers read `failed` and
 * show an em-dash. See `fmtCount()` at the bottom.
 */

import { useCallback, useEffect, useState } from 'react'
import { billingManager, type BillingStatus } from '@/services/billingManager'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import {
  hydrateBillingCurrency,
  normalizePlanTier,
  planIncludesModule,
  type ModuleKey,
} from '@/config/planPricing'
import { MODULES } from '@/config/modules'

export type AccountLoadState = 'loading' | 'loaded' | 'failed'

/** How the account pays. Determines whether a card form is ever shown. */
export type BillingMode = 'self_serve' | 'managed'

export interface CommercialAccount {
  state: AccountLoadState
  /** Null when the request failed, or when the account has no billing record. */
  status: BillingStatus | null
  /** True when the account answered but has nothing to show yet. */
  isEmpty: boolean
  billingMode: BillingMode
  isManaged: boolean
  tier: 'free' | 'standard' | 'premium'
  /** Which modules this account has. */
  owns: Record<ModuleKey, boolean>
  refresh: () => void
}

/**
 * How a managed account is detected.
 *
 * The backend has said this two ways since managed accounts existed, and both
 * are live in production data:
 *   users.billing_type = 'admin_managed'   (set by the superadmin create flows)
 *   subscription status = 'admin_managed'  (older accounts, and the Stripe-less
 *                                           path in stripe_subscription_service)
 * Either one means: no card, no portal, no checkout. Ever.
 */
export function isManagedAccount(status: BillingStatus | null): boolean {
  if (!status) return false
  return (
    status.user?.billing_type === 'admin_managed' ||
    status.plan?.status === 'admin_managed'
  )
}

/**
 * Which modules an account has.
 *
 * If the backend reports modules explicitly, that is the answer. It does not
 * today, so we fall back to the entitlement that is live right now - and the
 * fallback deliberately grants Run to every paying and every managed account,
 * because this is a production app with real subscribers and shipping a
 * paywall in front of a page they already use is not a pricing change, it is
 * an outage.
 */
export function resolveModules(
  status: BillingStatus | null,
  opts: { isSuperAdmin?: boolean } = {}
): Record<ModuleKey, boolean> {
  const all: Record<ModuleKey, boolean> = { find: true, run: true, mor: true, manage: true }
  if (opts.isSuperAdmin) return all

  const reported = (status as unknown as { modules?: unknown })?.modules
  if (Array.isArray(reported)) {
    const set = new Set(reported.map((m) => String(m).toLowerCase()))
    return {
      find: true, // Find is in every plan, at every tier, always.
      run: set.has('run'),
      mor: set.has('mor'),
      manage: set.has('manage'),
    }
  }

  const managed = isManagedAccount(status)
  const tier = normalizePlanTier(status?.plan?.tier)
  // The server already ships a per-tier feature list (teams.py
  // SUBSCRIPTION_TIER_LIMITS: Standard and Premium carry "campaigns", Free
  // does not) and puts it on the billing status. That is the closest thing to
  // a server-side entitlement, so it wins over a guess from the tier name.
  const features = Array.isArray(status?.plan?.features)
    ? status.plan.features.map((f) => String(f).toLowerCase())
    : null
  const hasCampaignsFeature = features ? features.includes('campaigns') : null

  return {
    find: true,
    // Grandfathered: everyone who has Run today keeps it.
    run: managed || (hasCampaignsFeature ?? tier !== 'free'),
    // NOT grandfathered, and deliberately not derived from the tier. Merchant
    // of Record is in PLAN_INCLUDED_MODULES only for 'managed', and nothing
    // else grants it: a self-serve account gets it by buying it, not by being
    // on Premium. Read through planIncludesModule so this mirrors
    // app/core/modules.py rather than repeating its judgement in a boolean.
    // Guessing it on would open a module nobody has bought, which is the mirror
    // of the outage this fallback exists to avoid.
    mor: managed && planIncludesModule('managed', 'mor'),
    manage: managed,
  }
}

export function useCommercialAccount(): CommercialAccount {
  const { user } = useEnhancedAuth()
  const [state, setState] = useState<AccountLoadState>('loading')
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [nonce, setNonce] = useState(0)

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin'

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) {
        // Not signed in yet - still loading, not failed and not empty.
        setState('loading')
        return
      }
      setState('loading')
      try {
        const result = await billingManager.getBillingStatus()
        if (cancelled) return
        if (!result) {
          setStatus(null)
          setState('loaded')
          return
        }
        hydrateBillingCurrency(result.plan?.currency)
        setStatus(result)
        setState('loaded')
      } catch {
        if (cancelled) return
        setStatus(null)
        setState('failed')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  const managed = isManagedAccount(status)

  return {
    state,
    status,
    isEmpty: state === 'loaded' && (!status || !status.plan),
    billingMode: managed ? 'managed' : 'self_serve',
    isManaged: managed,
    tier: normalizePlanTier(status?.plan?.tier),
    owns: resolveModules(status, { isSuperAdmin }),
    refresh,
  }
}

/** The module a route belongs to, or null if the route is not module-gated. */
export function moduleForRoute(pathname: string): ModuleKey | null {
  for (const mod of Object.values(MODULES)) {
    if (mod.gatedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return mod.key
    }
  }
  return null
}

/**
 * Render a number that came from a request.
 *
 * A request that did not answer is an em-dash, never a zero. A real zero is
 * still a zero - the difference is the point.
 */
export function fmtCount(value: number | null | undefined, ok: boolean = true): string {
  if (!ok) return '—'
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString()
}
