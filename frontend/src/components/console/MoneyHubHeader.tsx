'use client'

/**
 * Money: what comes in, and what goes out.
 *
 * Three screens were living in three different corners of the nav — client revenue, what we
 * owe creators, and the balances sitting in creator wallets. They are one job seen from three
 * sides, so they become one hub, listed as the Money submenu in the sidebar. The pages themselves are untouched; this is
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
import { Hub, visibleTabs, type HubTab, type TabAccess } from './Hub'
import { useAdminAccess } from '@/hooks/useAdminAccess'

/** The screens of the money hub, filtered for one viewer. Shared with /work/money's router
    and with the sidebar, which lists them as the Money submenu. */
export function useMoneyTabs(): HubTab[] {
  return moneyTabs(useAdminAccess())
}

/** The same list, for a caller that already holds the viewer's access (the sidebar). */
export function moneyTabs(access: TabAccess): HubTab[] {
  const { canSeeCost, canSeeMargin } = access
  return visibleTabs([
    /* "Client invoices" is what this tab promised and what the screen behind it cannot
       deliver: the billing endpoints serve the credit wallet ledger, not invoices. Client
       invoice money lives on the campaign timeline, against the instalment it settles. The
       tab is named for what is actually there. */
    { label: 'Client credits', href: '/work/billing', module: 'billing' },
    /* Creator Contracting. Sits under Money because that is all it is: a brand pays us, we pay
       creators, and every action on it moves money. It carries its own invoices, receipts and
       payouts, so it is a destination rather than a view of something else.
       `canSeeCost` includes talent, and for a long time that was wrong: every route was
       leadership-only, so a talent manager was offered a tab that answered 403. The three
       reads are now open to them, scrubbed of our fee and the client's invoice, because
       chasing a creator to sign is their job and they were being asked to do it from a screen
       they could not open. */
    { label: 'Creator Contracting', href: '/work/mor', module: 'billing', when: canSeeCost },
    // Cost, not just creators — see the note above.
    { href: '/work/payables', module: 'influencers', when: canSeeCost },
    /* Paying what is owed: approved payments gathered into one bank file. It had a screen
       and no way to reach it except by typing the URL. */
    { href: '/work/payouts', module: 'influencers', when: canSeeCost },
    /* Named from destinations.ts like every other tab; it said "Creator app balances" here
       and "Creator wallets" on the page itself. */
    { href: '/work/fa/wallets', module: 'fa', when: canSeeCost },
    /* Enrolments moved to the Campaigns hub (2026-11-03): they are the paperwork for a
       booking. Creator payments stay here, and each one links back to its enrolment. */
    /* The founders' desk: prices to set, creators to release, payments to approve. Every
       action on it moves money, which is why it is here and not a destination of its own.
       Leadership only, by the same test that gates margin. */
    /* Every creator waiting on a negotiated rate, across all proposals. The step existed
       and lived inside one proposal's page, so the work could only be found by remembering
       which proposal had it. */
    { href: '/work/negotiations', when: canSeeMargin },
    { href: '/work/approvals', when: canSeeMargin },
  ], access)
}

export function MoneyHubHeader({
  title = 'Money',
  sub = 'What comes in, and what goes out.',
  action,
  bare,
}: {
  title?: string
  sub?: string
  action?: React.ReactNode
  /** No hub title: for a screen that keeps its own heading and buttons. */
  bare?: boolean
}) {
  // The hub's screens are the sidebar's Money submenu now; the header keeps the title.
  return (
    <Hub title={title} sub={sub} action={action} bare={bare}>
      {null}
    </Hub>
  )
}
