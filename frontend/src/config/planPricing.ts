/**
 * Plan pricing and plan LIMITS - the ONE place the frontend is allowed to know
 * either.
 *
 * The backend now has one definition of each, and this file mirrors those three
 * files and nothing else:
 *
 *   app/core/plan_pricing.py   what a plan COSTS, and its Stripe price IDs
 *   app/core/plans.py          what a plan ALLOWS: credits, unlocks, posts, seats
 *   app/core/modules.py        what a module IS, and what it costs
 *
 * Prices used to be hardcoded in eight components; the billing page said
 * "AED 199" while Stripe charged USD 199 (~AED 731). Limits were worse: four
 * places disagreed, and the one that was enforced was none of them.
 *
 * WHAT LIMITS AN UNLOCK, and why this is now one story and not two
 * -----------------------------------------------------------------
 * An unlock used to pass two independent gates: a count cap on the team, and 25
 * credits in the wallet. As of the owner's decision on 2026-09-02 the count cap
 * is REMOVED above the included allowance on every paid tier, so on Standard,
 * Premium and Managed the wallet is the only thing that limits an unlock. Spend
 * your included allowance, buy credits, keep going.
 *
 * FREE is the one exception and keeps a real cap of 5. It is the trial boundary,
 * and there is no top-up path on Free to open.
 *
 * So a tier has an included allowance, and either a ceiling or none:
 *
 *   includedUnlocks  what the plan funds: monthlyCredits / CREDITS_PER_UNLOCK
 *   unlockCap        the ceiling, or NULL where there is none
 *
 * The old two-gate framing survives ONLY on Free, and no screen should keep it
 * for the paid tiers: "350 included, buy more at 25 credits each" is the whole
 * truth there. Every surface that quotes unlocks calls `unlockSentence()`.
 *
 * Nothing in this file may say what a top-up CANNOT do. That copy is false on
 * every paid tier now, and it was always the sentence that stopped someone
 * buying.
 *
 * CURRENCY COMES FROM THE SERVER
 * ------------------------------
 * There is no build-time default any more. `getBillingCurrency()` returns null
 * until `hydrateBillingCurrency()` has been handed the currency a live response
 * named, and every formatter renders NO_PRICE rather than guessing. A
 * NEXT_PUBLIC_ env var that was never redeployed quoted USD to a business that
 * charges in AED, and a module-scope constant froze it before hydration could
 * correct it.
 *
 * NEVER compute a price at module scope. A module-level constant is evaluated
 * at import time, which is before any response has landed.
 */

export type PlanTier = 'free' | 'standard' | 'premium'
export type BillingInterval = 'monthly' | 'annual'
export type BillingCurrency = 'USD' | 'AED'

/**
 * The one mark for a figure we do not have. The same en dash the billing
 * panels use (NO_FIGURE in PlanSummaryCard, UNKNOWN in brand primitives).
 * Never a zero, never a stale guess.
 */
export const NO_PRICE = '–'

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------
// Mirrors PLAN_AMOUNTS in app/core/plan_pricing.py. Anything rendered from a
// live response (GET /checkout/pricing, GET /billing/subscription-status)
// already carries its own amount and currency: prefer those. This table is the
// fallback for a surface that has no request behind it.

export interface PlanAmounts {
  monthly: number
  annual: number
  /** Monthly-equivalent price when billed annually (20% off). */
  annualMonthlyEquivalent: number
}

export const PLAN_AMOUNTS: Record<BillingCurrency, Record<PlanTier, PlanAmounts>> = {
  // app/core/plan_pricing.py PLAN_AMOUNTS['USD'] - what the live Stripe price
  // objects charge today.
  USD: {
    free: { monthly: 0, annual: 0, annualMonthlyEquivalent: 0 },
    standard: { monthly: 199, annual: 1908, annualMonthlyEquivalent: 159 },
    premium: { monthly: 499, annual: 4788, annualMonthlyEquivalent: 399 },
  },
  // app/core/plan_pricing.py PLAN_AMOUNTS['AED'] - the canonical business prices.
  AED: {
    free: { monthly: 0, annual: 0, annualMonthlyEquivalent: 0 },
    standard: { monthly: 730, annual: 7020, annualMonthlyEquivalent: 585 },
    premium: { monthly: 1830, annual: 17580, annualMonthlyEquivalent: 1465 },
  },
}

const CURRENCY_PREFIX: Record<BillingCurrency, string> = {
  USD: '$',
  AED: 'AED ',
}

/** Mirrors ANNUAL_DISCOUNT in app/core/plan_pricing.py. */
export const ANNUAL_DISCOUNT = 0.2

// ---------------------------------------------------------------------------
// Currency, which only the server may decide
// ---------------------------------------------------------------------------

let activeCurrency: BillingCurrency | null = null

/**
 * Adopt the currency a live response named. Called by /pricing, /checkout, the
 * billing page and useCommercialAccount as soon as their fetch lands.
 */
export function hydrateBillingCurrency(currency?: string | null): void {
  const normalized = (currency || '').toUpperCase()
  if (normalized === 'AED' || normalized === 'USD') {
    activeCurrency = normalized
  }
}

/** The currency the server told us to quote in, or null before it has. */
export function getBillingCurrency(): BillingCurrency | null {
  return activeCurrency
}

/**
 * The currency to render in: what this response said, else what an earlier one
 * said, else null. Call sites pass their own plan.currency and get back a value
 * they can hand to a formatter, with no fallback literal anywhere.
 */
export function resolveCurrency(fromServer?: string | null): BillingCurrency | null {
  const normalized = (fromServer || '').toUpperCase()
  if (normalized === 'AED' || normalized === 'USD') return normalized
  return activeCurrency
}

export function normalizePlanTier(tier?: string | null): PlanTier {
  const key = (tier || '').toLowerCase()
  if (key === 'standard') return 'standard'
  if (key === 'premium' || key === 'professional' || key === 'enterprise') return 'premium'
  return 'free'
}

/** Plan price as a number, or null when the currency is not yet known. */
export function getPlanAmount(
  tier: string,
  interval: BillingInterval = 'monthly',
  currency: BillingCurrency | null = getBillingCurrency()
): number | null {
  if (!currency) return null
  return PLAN_AMOUNTS[currency][normalizePlanTier(tier)][interval]
}

/**
 * Render any price the same way everywhere: "$199", "AED 730", or the one mark
 * for a figure we do not have.
 */
export function formatPlanPrice(
  amount: number | null | undefined,
  currency: string | null = getBillingCurrency()
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return NO_PRICE
  const key = (currency || '').toUpperCase()
  if (!key) return NO_PRICE
  const prefix = key === 'AED' || key === 'USD' ? CURRENCY_PREFIX[key as BillingCurrency] : `${key} `
  return `${prefix}${amount.toLocaleString('en-US')}`
}

/** e.g. "$199/month". NO_PRICE with no suffix when the price is not known. */
export function formatMonthlyPlanPrice(
  tier: string,
  currency: BillingCurrency | null = getBillingCurrency(),
  suffix: string = '/month'
): string {
  const amount = getPlanAmount(tier, 'monthly', currency)
  if (amount === null) return NO_PRICE
  return `${formatPlanPrice(amount, currency)}${suffix}`
}

/**
 * e.g. "Standard ($199/month)".
 *
 * Drops the parenthetical entirely when there is no price to put in it, rather
 * than rendering "Standard (–)". A dash inside brackets reads as a broken
 * label; the plan name on its own reads as a plan name, which is the true and
 * useful half of the string. Callers pass their own suffix, including an empty
 * one, so this must be right for every shape.
 */
export function formatPlanLabel(tier: string, suffix: string = '/month'): string {
  const key = normalizePlanTier(tier)
  const name = key.charAt(0).toUpperCase() + key.slice(1)
  const price = formatMonthlyPlanPrice(key, getBillingCurrency(), suffix)
  if (price === NO_PRICE) return name
  return `${name} (${price})`
}

/** Monthly-equivalent price when a basket is billed annually. */
export function annualMonthlyEquivalent(monthlyAmount: number): number {
  return Math.round(monthlyAmount * (1 - ANNUAL_DISCOUNT))
}

// ---------------------------------------------------------------------------
// Modules and add-ons
// ---------------------------------------------------------------------------
// app/core/modules.py defines FOUR modules:
//
//   find    Discovery, creator analytics, lists, unlocks. In EVERY plan,
//           including Free. Never sold separately, never has a price.
//   run     Campaigns, proposals, deliverables, settlement. An add-on, and the
//           only module with an agreed list price: RUN_ADDON_AED_PER_MONTH,
//           AED 1,200 a month.
//   mor     Merchant of record. An add-on with TWO prices, not one: a monthly
//           fee AND a percentage of every payout settled, stamped onto a
//           campaign at award time. Neither is agreed. The monthly fee in
//           modules.py (MOR_ADDON_AED_PER_MONTH) is labelled a PLACEHOLDER by
//           that file itself; the percentage lives in run_money/config.py and
//           is likewise unagreed; and run_money/mor.py fee_structure() returns
//           `prices_are_provisional: True` over both. So MoR is QUOTED here, no
//           number for it is ever printed, and any copy that describes it must
//           mention BOTH halves, or the first quote a client sees is missing
//           half the commercial model. app/core/plans.py addon_catalogue()
//           carries the same judgement as price_agreed: False.
//           Included free in Managed: see PLAN_INCLUDED_MODULES below.
//   manage  The Managed plan, not an add-on. Quoted per client and invoiced,
//           with a service charge set per client, so it never carries a price.
//
// All four are in the frontend catalogue (src/config/modules.ts). MoR was
// missing from it, which meant a client could not see or ask for a module the
// backend gates a whole product area on (app/api/mor_routes.py).

export type ModuleKey = 'find' | 'run' | 'mor' | 'manage'
/** Modules sold as a recurring add-on line on top of a plan. */
export type ModuleAddonKey = 'run' | 'mor'
/** Kept as an alias: ModuleKey now covers every module the backend knows. */
export type AnyModuleKey = ModuleKey

/**
 * Whether a module price may be shown to a customer.
 *
 *   'included'  in the plan already; no price, ever
 *   'listed'    an agreed price we publish
 *   'quoted'    no publishable number. Render "we quote it", never a figure.
 */
export type ModulePricing = 'included' | 'listed' | 'quoted'

export const MODULE_PRICING: Record<ModuleKey, ModulePricing> = {
  find: 'included',
  run: 'listed',
  // PLACEHOLDER upstream, so nothing to publish. See the note above.
  mor: 'quoted',
  manage: 'quoted',
}

/**
 * Modules a plan already pays for, so they are never offered as a paid add-on
 * to an account on that plan.
 *
 * Mirrors PLAN_INCLUDED_MODULES in app/core/modules.py. The one that matters is
 * Managed: it includes MoR, and app/services/run_money/mor.py fee_structure()
 * returns a zero monthly fee and no settlement percentage for a Manage client,
 * because the 12.5% management service charge already covers us paying their
 * creators. Offering MoR as a paid add-on beside Manage would bill the same
 * work twice, and app/api/admin/entitlement_routes.py forces the entitlement to
 * billing_method='granted' at price 0 to stop exactly that.
 */
export const PLAN_INCLUDED_MODULES: Record<PlanTier | 'managed', readonly ModuleKey[]> = {
  free: ['find'],
  standard: ['find'],
  premium: ['find'],
  managed: ['find', 'run', 'mor', 'manage'],
}

/** True when this plan already pays for the module, so it is not for sale. */
export function planIncludesModule(tier: string | null | undefined, module: ModuleKey): boolean {
  const key = (tier || '').toLowerCase() === 'managed' ? 'managed' : normalizePlanTier(tier)
  return PLAN_INCLUDED_MODULES[key].includes(module)
}

// Canonical in AED. The USD figure is the AED amount at the 3.6725 peg that
// app/core/modules.py uses (_AED_PER_USD), rounded to a whole unit, so a
// USD-quoting account is never shown a different commercial decision.
export const MODULE_AMOUNTS: Record<BillingCurrency, Record<'run', number>> = {
  AED: { run: 1200 }, // app/core/modules.py RUN_ADDON_AED_PER_MONTH
  USD: { run: 327 },  // 1200 / 3.6725, rounded
}

// <<< CONFIG POINT >>> There is no Stripe price object for any add-on in either
// currency yet, so this is empty and every "add" button routes through the
// account-manager request flow instead of checkout. The day those price objects
// exist, fill these in: hasModuleCheckout() flips the buttons over.
export const MODULE_STRIPE_PRICE_IDS: Record<BillingCurrency, Partial<Record<ModuleAddonKey, string>>> = {
  AED: {},
  USD: {},
}

/** What one cycle of an add-on costs, or null when there is no price to quote. */
export function getModuleAmount(
  module: ModuleAddonKey,
  interval: BillingInterval = 'monthly',
  currency: BillingCurrency | null = getBillingCurrency()
): number | null {
  if (!currency) return null
  if (MODULE_PRICING[module] !== 'listed') return null
  const monthly = MODULE_AMOUNTS[currency][module as 'run']
  if (typeof monthly !== 'number') return null
  if (interval === 'annual') return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT))
  return monthly
}

/**
 * The price a module is shown at, in words rather than a number where there is
 * no number to show. This is the only function a screen should call: it cannot
 * print a placeholder as though it were a price.
 */
export function modulePriceLabel(
  module: AnyModuleKey,
  currency: BillingCurrency | null = getBillingCurrency(),
  suffix: string = '/month'
): string {
  const kind = MODULE_PRICING[module]
  if (kind === 'included') return 'In every plan'
  if (kind === 'quoted') return 'Quoted'
  const amount = getModuleAmount(module as ModuleAddonKey, 'monthly', currency)
  if (amount === null) return NO_PRICE
  return `${formatPlanPrice(amount, currency)}${suffix}`
}

/** Back-compat name for the add-on price string. Same rules. */
export function formatModulePrice(
  module: ModuleAddonKey,
  currency: BillingCurrency | null = getBillingCurrency(),
  suffix: string = '/month'
): string {
  return modulePriceLabel(module, currency, suffix)
}

/** True once a Stripe price object exists for the add-on in the active currency. */
export function hasModuleCheckout(
  module: ModuleAddonKey,
  currency: BillingCurrency | null = getBillingCurrency()
): boolean {
  if (!currency) return false
  return Boolean(MODULE_STRIPE_PRICE_IDS[currency][module])
}

// ---------------------------------------------------------------------------
// The unlock meter
// ---------------------------------------------------------------------------

/**
 * Credits per profile unlock. app/core/plans.py CREDITS_PER_PROFILE_UNLOCK, and
 * the divisor app/models/teams.py ACTION_CREDIT_COSTS reads from it. The live
 * figure comes from GET /api/v1/credits/pricing; this is the fallback.
 */
export const CREDITS_PER_UNLOCK = 25

/** Action types that mean "unlock a profile", across the spellings in use. */
export const UNLOCK_ACTION_TYPES = ['profile_unlock', 'profile_analysis', 'unlock_profile']

// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------
// Mirrors PLANS in app/core/plans.py, which is what the server enforces. These
// exist for the signed-out pricing page, which has no billing status to read.
// Inside the product, limits come from the live billing status.
//
// The public page used to claim 500 and 2,000 monthly unlocks while the server
// enforced 350 and 1,000, and the signup wizard advertised 500 unlocks, 250
// email reveals (a limit that does not exist anywhere in the backend) and extra
// seats at AED 180 a month (there is no seat purchase anywhere).

export interface PlanLimits {
  /** app/core/plans.py Plan.max_team_members. A hard cap; seats cannot be bought. */
  seats: number
  /** What the plan FUNDS: monthlyCredits / CREDITS_PER_UNLOCK. */
  includedUnlocks: number
  /**
   * The ceiling on unlocks in a month, or NULL when there is none.
   *
   * Null is "no ceiling", not "unknown". Mirrors app/core/plans.py UNLIMITED,
   * which the API serialises to JSON null via limit_for_api(). Only Free is
   * capped; every paid tier is unlimited above its included allowance.
   */
  unlockCap: number | null
  /** app/core/plans.py Plan.monthly_posts_limit. 0 means NOT METERED. */
  monthlyPosts: number
  monthlyCredits: number
  /** Fraction off credit top-ups, e.g. 0.2. */
  topupDiscount: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // app/core/plans.py PLANS['free']: 125 credits, unlock_cap_multiple 1.0,
  // posts 0 (not metered), 1 seat. The ONLY capped tier: it is the trial
  // boundary, and there is no top-up path on Free.
  free: {
    seats: 1,
    includedUnlocks: 5,
    unlockCap: 5,
    monthlyPosts: 0,
    monthlyCredits: 125,
    topupDiscount: 0,
  },
  // app/core/plans.py PLANS['standard']: 8,750 credits, unlock_cap_multiple
  // UNLIMITED, posts 100, 2 seats.
  standard: {
    seats: 2,
    includedUnlocks: 350,
    unlockCap: null,
    monthlyPosts: 100,
    monthlyCredits: 8750,
    topupDiscount: 0,
  },
  // app/core/plans.py PLANS['premium']: 25,000 credits, unlock_cap_multiple
  // UNLIMITED, posts 250, 5 seats, 20% off top-ups.
  premium: {
    seats: 5,
    includedUnlocks: 1000,
    unlockCap: null,
    monthlyPosts: 250,
    monthlyCredits: 25000,
    topupDiscount: 0.2,
  },
}

export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[normalizePlanTier(tier)]
}

/**
 * What an account may unlock.
 *
 * There is no `headroom` any more. Headroom only meant something while a
 * ceiling existed above the funded allowance, and on every paid tier there is
 * no ceiling at all, so the concept was generating copy that is now false.
 */
export interface UnlockGates {
  /** Unlocks the plan funds. Null only when we have no answer at all. */
  included: number | null
  /** The ceiling. Null when there is none, OR when unknown: read `unlimited`. */
  cap: number | null
  /** True when nothing caps unlocks above the included allowance. */
  unlimited: boolean
}

/**
 * What this account may unlock, from the live billing status.
 *
 * READ THE FIELD NAMES CAREFULLY, because two of them changed meaning when the
 * paid tiers were uncapped, and the old reading is silently wrong rather than
 * loudly wrong:
 *
 *   plan.monthly_profile_limit      is NO LONGER the cap. app/core/plans.py
 *                                   Plan.monthly_profile_limit now returns
 *                                   included_profile_unlocks, because the
 *                                   column is integer NOT NULL and ~20 sites
 *                                   bind it into an INSERT, so the sentinel is
 *                                   deliberately kept out of it.
 *   plan.included_profile_unlocks   the funding, now sent explicitly, so
 *                                   nothing derives credits / 25 any more.
 *   usage.profiles_limit            THE CAP, and null means no ceiling.
 *   usage.profiles_unlimited        the flag that tells a real null apart from
 *                                   a value that failed to load. It is on the
 *                                   USAGE block, not the plan block.
 *
 * Reading plan.monthly_profile_limit as the cap would make every screen compute
 * a cap equal to the funding, conclude there is no headroom, and print "top-ups
 * cannot take you past this" to a customer who can now buy as many as they like.
 */
export function unlockGates(input: {
  /** plan.included_profile_unlocks. */
  includedUnlocks?: number | null
  /** usage.profiles_limit. Null means no ceiling when `unlimited` is true. */
  profilesLimit?: number | null
  /** usage.profiles_unlimited. */
  profilesUnlimited?: boolean | null
  /** plan.monthly_credits, only as a fallback where the included figure is absent. */
  monthlyCredits?: number | null
  creditsPerUnlock?: number | null
}): UnlockGates {
  const per =
    input.creditsPerUnlock && input.creditsPerUnlock > 0
      ? input.creditsPerUnlock
      : CREDITS_PER_UNLOCK

  // Prefer what the server states. The division is kept only for a response
  // that predates included_profile_unlocks being sent.
  const included =
    typeof input.includedUnlocks === 'number'
      ? input.includedUnlocks
      : typeof input.monthlyCredits === 'number'
        ? Math.floor(input.monthlyCredits / per)
        : null

  const unlimited = input.profilesUnlimited === true
  const cap = unlimited
    ? null
    : typeof input.profilesLimit === 'number'
      ? input.profilesLimit
      : null

  return { included, cap, unlimited }
}

/** The same, for a tier, from the static table. */
export function unlockGatesForTier(tier: string): UnlockGates {
  const limits = getPlanLimits(tier)
  return {
    included: limits.includedUnlocks,
    cap: limits.unlockCap,
    unlimited: limits.unlockCap === null,
  }
}

/**
 * The unlock sentence, in one place so no screen can print half of it.
 *
 * Uncapped: "350 profile unlocks included, and you can buy more at 25 credits
 *            each, with no monthly ceiling."
 * Capped:   "5 profile unlocks a month, which is the Free plan's limit."
 *
 * Nothing here says what a customer CANNOT do. On a paid tier that framing is
 * now false, and it was always the sentence that stopped someone buying.
 */
export function unlockSentence(
  gates: UnlockGates,
  creditsPerUnlock: number = CREDITS_PER_UNLOCK
): string {
  const { included, cap, unlimited } = gates
  if (included === null) return 'We could not load your unlock allowance.'
  if (unlimited) {
    return `${included.toLocaleString()} profile unlocks included, and you can buy more at ${creditsPerUnlock} credits each, with no monthly ceiling.`
  }
  if (cap === null) return `${included.toLocaleString()} profile unlocks included.`
  return `${included.toLocaleString()} profile unlocks a month, which is the Free plan's limit. A paid plan lifts it.`
}

/** The short form, for a stat caption rather than a paragraph. */
export function unlockAllowanceNote(
  gates: UnlockGates,
  creditsPerUnlock: number = CREDITS_PER_UNLOCK
): string {
  const { included, unlimited } = gates
  if (included === null) return ''
  if (unlimited) return `Buy more any time, at ${creditsPerUnlock} credits each`
  return "The Free plan's monthly limit"
}

/**
 * How to say a post-analysis allowance.
 *
 * 0 means NOT METERED, not "none allowed": app/core/plans.py posts_limit_for_row
 * returns 0 for any account whose row was never given a real number, and
 * app/api/post_analytics_routes.py does not meter those accounts at all.
 * Rendering that 0 as a limit would tell a customer they have none.
 */
export function postsAllowanceLabel(limit: number | null | undefined): string {
  if (limit === null || limit === undefined || Number.isNaN(limit)) return NO_PRICE
  if (limit <= 0) return 'Not metered'
  return limit.toLocaleString()
}
