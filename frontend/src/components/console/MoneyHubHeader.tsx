'use client'

/**
 * Money: what comes in, and what goes out.
 *
 * Three screens were living in three different corners of the nav — client revenue, what we
 * owe creators, and the balances sitting in creator wallets. They are one job seen from three
 * sides, so they become one hub with three tabs. The pages themselves are untouched; this is
 * only the header they now share, which is what lets a screen join a hub without a rewrite.
 *
 * The gate here is deliberately stricter than the module gate. `can('influencers')` is about
 * whether you work with creators at all; seeing what we agreed to pay one is cost, and an
 * account manager or business developer must never learn cost. The server already refuses
 * them outright (app/core/field_policy.py, SCOPE_ACCOUNT; payables_routes.py demands
 * leadership or talent), so gating on `canSeeCost` simply stops us offering a tab that would
 * answer 403 — and stops the tab strip itself hinting at a number they may not have.
 */
import * as React from 'react'
import { Hub, type HubTab } from './Hub'
import { useAdminAccess } from '@/hooks/useAdminAccess'

/** The tabs of the money hub, filtered for one viewer. Shared with /work/money's router. */
export function useMoneyTabs(): HubTab[] {
  const { can, canSeeCost, loading } = useAdminAccess()
  const all: HubTab[] = [
    { label: 'Client invoices', href: '/work/billing', module: 'billing' },
    // Cost, not just creators — see the note above.
    { label: 'Creator payments', href: '/work/payables', module: 'influencers', when: canSeeCost },
    { label: 'Creator app balances', href: '/work/fa/wallets', module: 'fa', when: canSeeCost },
  ]
  if (loading) return []
  return all.filter(t => (t.module ? can(t.module) : true) && t.when !== false)
}

export function MoneyHubHeader({
  title = 'Money',
  sub = 'What comes in, and what goes out.',
  action,
}: {
  title?: string
  sub?: string
  action?: React.ReactNode
}) {
  const tabs = useMoneyTabs()
  return (
    <Hub title={title} sub={sub} tabs={tabs} action={action}>
      {null}
    </Hub>
  )
}
