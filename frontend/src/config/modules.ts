/**
 * The module catalogue - what each module IS, in the words a brand would use.
 *
 * There are no prices in this file. Prices live in one place only,
 * src/config/planPricing.ts, which mirrors app/core/plan_pricing.py. Anything
 * here that needs a number imports it from there.
 *
 * Three modules, and only one of them is an add-on:
 *
 *   find    Included in every plan, at every tier. Never sold separately, so
 *           it is never shown with a price and never has a buy button.
 *   run     The one add-on. Sold on its own, monthly.
 *   manage  Not an add-on - it is the Managed plan. Quoted, so its action is
 *           always "Talk to us", never a price.
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

export const MODULE_ORDER: ModuleKey[] = ['find', 'run', 'manage']

export function getModule(key: string): ModuleDefinition | null {
  return (MODULES as Record<string, ModuleDefinition>)[key] ?? null
}
