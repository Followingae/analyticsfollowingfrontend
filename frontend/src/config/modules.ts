/**
 * The module catalogue - what each module IS, in the words a brand would use.
 *
 * There are no prices in this file. Prices live in one place only,
 * src/config/planPricing.ts, which mirrors app/core/plan_pricing.py. Anything
 * here that needs a number imports it from there.
 *
 * Four modules, matching app/core/modules.py MODULES exactly. Two are add-ons:
 *
 *   find    Included in every plan, at every tier. Never sold separately, so
 *           it is never shown with a price and never has a buy button.
 *   run     An add-on with an agreed list price, sold on its own, monthly.
 *   mor     An add-on, QUOTED. Merchant of Record was missing from this file
 *           entirely, so a client could neither see nor ask for a module the
 *           backend gates a whole product area on (app/api/mor_routes.py), and
 *           the billing panel had to carry a hand-written fallback summary for
 *           it. Its price is quoted because BOTH halves of it are unagreed: the
 *           monthly fee is a placeholder in app/core/modules.py, and the
 *           settlement percentage on top of it lives in run_money/config.py.
 *           run_money/mor.py fee_structure() flags both `prices_are_provisional`.
 *   manage  Not an add-on - it is the Managed plan. Quoted, so its action is
 *           always "Talk to us", never a price. It is also invoice-only
 *           (INVOICE_ONLY_MODULES), so it can never go through card checkout;
 *           apply_entitlement raises on billing_method='stripe' for it.
 *
 * Manage INCLUDES MoR at no charge (PLAN_INCLUDED_MODULES['managed']), because
 * the 12.5% management service charge already covers us paying the creators.
 * Nothing here may offer MoR as a paid add-on to a Manage client: that is the
 * same work billed twice. `planIncludesModule()` in planPricing.ts is the check.
 */

import type { ModuleKey } from '@/config/planPricing'

export type ModuleAvailability =
  /** In the plan already. */
  | 'included'
  /** Sold as a monthly add-on line. */
  | 'addon'
  /** Only available by moving to the Managed plan. */
  | 'quoted'

export interface ModuleDefinition {
  key: ModuleKey
  name: string
  /** One line: what the module lets you do. */
  summary: string
  /** What it contains - spelled out, not implied. */
  contains: string[]
  availability: ModuleAvailability
  /** Where the module lives when you have it. */
  href: string
  /** The routes that belong to this module and are gated on it. */
  gatedRoutes: string[]
  /**
   * The sentence used on the locked card, phrased as the thing the brand was
   * about to do when they hit the wall.
   */
  wallHeadline: string
  wallBody: string
}

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  find: {
    key: 'find',
    name: 'Find',
    summary: 'Search creators, read their analytics, and build shortlists.',
    contains: [
      'Creator discovery across the full database',
      'Full creator analytics on any profile you unlock',
      'Shortlists you can name, sort and share internally',
      'Bulk export of a shortlist to CSV',
    ],
    availability: 'included',
    href: '/discover',
    gatedRoutes: [],
    wallHeadline: 'Find is in every plan',
    wallBody: 'You already have it. There is nothing to buy here.',
  },
  run: {
    key: 'run',
    name: 'Run',
    summary: 'Turn a shortlist into a campaign and run it to delivery.',
    contains: [
      'Campaigns built from a shortlist you already have',
      'Briefs sent to creators, with their replies in one place',
      'Deliverable tracking: submitted, approved, live',
      'Content collection and per-post performance',
      'Campaign insights, costed against what you actually paid',
    ],
    availability: 'addon',
    href: '/campaigns',
    gatedRoutes: ['/campaigns'],
    wallHeadline: 'Run turns this shortlist into a campaign',
    wallBody:
      'Campaigns, briefs, deliverables and content live in Run. Your shortlists stay exactly where they are - Run is what takes one of them and gets the posts made.',
  },
  mor: {
    key: 'mor',
    name: 'Merchant of Record',
    // The words app/services/run_money/mor.py uses to sell it.
    summary:
      'You pay us, we pay the creators, and you watch every payout move from awaiting funds to paid.',
    contains: [
      'We contract and pay the creators, so you raise one invoice instead of many',
      'Every payout tracked from awaiting funds through to paid',
      'Settlement reconciled against what each creator actually delivered',
      'The settlement rate fixed onto a campaign when it is awarded, so a later change never reprices work already running',
    ],
    availability: 'addon',
    href: '/campaigns',
    // Nothing is route-gated on MoR today. The backend gate is on the payout
    // and settlement endpoints (app/api/mor_routes.py), not on a page, so
    // claiming a route here would lock a screen nothing enforces.
    gatedRoutes: [],
    wallHeadline: 'Merchant of Record pays your creators for you',
    wallBody:
      'You pay us once, we contract and pay every creator, and you watch each payout move from awaiting funds to paid. There is a monthly fee and a percentage of what we settle, and both are agreed with you before anything is switched on.',
  },
  manage: {
    key: 'manage',
    name: 'Manage',
    summary: 'We run the campaign for you, end to end.',
    contains: [
      'A named account manager who runs the campaign',
      'Creator sourcing, negotiation and contracting done for you',
      'Payments to creators handled and reconciled',
      'Reporting prepared for you at the end of each campaign',
    ],
    availability: 'quoted',
    href: '/campaigns',
    gatedRoutes: [],
    wallHeadline: 'Manage is the Managed plan',
    wallBody:
      'Managed is not an add-on you switch on. It is a plan we quote against the work, so it starts with a conversation.',
  },
}

// Find first because everyone has it, then the two add-ons in the order they
// are bought, then the plan you move to rather than buy.
export const MODULE_ORDER: ModuleKey[] = ['find', 'run', 'mor', 'manage']

export function getModule(key: string): ModuleDefinition | null {
  return (MODULES as Record<string, ModuleDefinition>)[key] ?? null
}
