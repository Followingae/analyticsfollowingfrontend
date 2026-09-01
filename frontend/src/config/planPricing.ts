/**
 * Plan pricing - the ONE place the frontend is allowed to know a plan price.
 *
 * This mirrors the backend single source of truth, `app/core/plan_pricing.py`.
 * Prices used to be hardcoded in eight different components; the billing page
 * said "AED 199" while Stripe charged USD 199 (~AED 731). Never write a plan
 * price literal in a component again - import from here.
 *
 * Two currencies, on purpose:
 *  - USD is what the LIVE Stripe prices actually charge today.
 *  - AED is the canonical business price, live once the AED Stripe price
 *    objects exist.
 *
 * Which one is quoted is decided by NEXT_PUBLIC_BILLING_CURRENCY, which MUST be
 * set to the same value as the backend's BILLING_CURRENCY. Anything rendered
 * from live API data (/billing status, /pricing) already carries its own
 * `currency` field - prefer that; these constants are for static marketing and
 * upsell copy that has no API call behind it.
 */

export type PlanTier = 'free' | 'standard' | 'premium'
export type BillingInterval = 'monthly' | 'annual'
export type BillingCurrency = 'USD' | 'AED'

export interface PlanAmounts {
  monthly: number
  annual: number
  /** Monthly-equivalent price when billed annually (20% off). */
  annualMonthlyEquivalent: number
}

export const PLAN_AMOUNTS: Record<BillingCurrency, Record<PlanTier, PlanAmounts>> = {
  USD: {
    free: { monthly: 0, annual: 0, annualMonthlyEquivalent: 0 },
    standard: { monthly: 199, annual: 1908, annualMonthlyEquivalent: 159 },
    premium: { monthly: 499, annual: 4788, annualMonthlyEquivalent: 399 },
  },
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

/** Default to USD because that is what the live Stripe prices charge today. */
const ENV_CURRENCY = (process.env.NEXT_PUBLIC_BILLING_CURRENCY || 'USD').toUpperCase()

let activeCurrency: BillingCurrency = ENV_CURRENCY === 'AED' ? 'AED' : 'USD'

/**
 * Adopt the currency the backend reports (from /pricing or /billing status), so
 * a missed env var can never make the UI quote the wrong currency.
 */
export function hydrateBillingCurrency(currency?: string | null): void {
  const normalized = (currency || '').toUpperCase()
  if (normalized === 'AED' || normalized === 'USD') {
    activeCurrency = normalized
  }
}

export function getBillingCurrency(): BillingCurrency {
  return activeCurrency
}

export function normalizePlanTier(tier?: string | null): PlanTier {
  const key = (tier || '').toLowerCase()
  if (key === 'standard') return 'standard'
  if (key === 'premium' || key === 'professional' || key === 'enterprise') return 'premium'
  return 'free'
}

/** Plan price as a number, in the active billing currency. */
export function getPlanAmount(
  tier: string,
  interval: BillingInterval = 'monthly',
  currency: BillingCurrency = getBillingCurrency()
): number {
  return PLAN_AMOUNTS[currency][normalizePlanTier(tier)][interval]
}

/** Render any price the same way everywhere: "$199" or "AED 730". */
export function formatPlanPrice(
  amount: number,
  currency: string = getBillingCurrency()
): string {
  const key = (currency || '').toUpperCase()
  const prefix = key === 'AED' || key === 'USD' ? CURRENCY_PREFIX[key as BillingCurrency] : `${key} `
  return `${prefix}${amount.toLocaleString('en-US')}`
}

/** e.g. "$199/month" - the standard monthly-price string. */
export function formatMonthlyPlanPrice(
  tier: string,
  currency: BillingCurrency = getBillingCurrency(),
  suffix: string = '/month'
): string {
  return `${formatPlanPrice(getPlanAmount(tier, 'monthly', currency), currency)}${suffix}`
}

/** e.g. "Standard ($199/month)" */
export function formatPlanLabel(
  tier: string,
  suffix: string = '/month'
): string {
  const key = normalizePlanTier(tier)
  const name = key.charAt(0).toUpperCase() + key.slice(1)
  return `${name} (${formatMonthlyPlanPrice(key, getBillingCurrency(), suffix)})`
}

// ---------------------------------------------------------------------------
// Modules, seats and the usage meter
// ---------------------------------------------------------------------------
// The commercial model has one plan and one add-on:
//
//   Find    - in every plan, never sold separately.
//   Run     - the one add-on, AED 1,200/month.
//   Manage  - the Managed plan. Quoted, never a self-serve price.
//
// Amounts below are the decided business prices. They are canonical in AED;
// the USD figure is the AED amount at the fixed 3.6725 peg rounded to a whole
// unit, so a USD-quoting account is never shown a number that is a different
// commercial decision from the AED one.
//
// <<< CONFIG POINT >>> There is no Stripe price object for the Run add-on in
// either currency yet, so MODULE_STRIPE_PRICE_IDS is empty and every "add Run"
// button routes through the account-manager request flow instead of checkout.
// The day those price objects exist, fill these in: hasModuleCheckout() flips
// the buttons over and nothing else needs editing.

export type ModuleKey = 'find' | 'run' | 'manage'
/** Modules sold as a recurring add-on line. */
export type ModuleAddonKey = 'run'

export const MODULE_AMOUNTS: Record<BillingCurrency, Record<ModuleAddonKey, number>> = {
  AED: { run: 1200 },
  USD: { run: 327 },
}

export const MODULE_STRIPE_PRICE_IDS: Record<BillingCurrency, Partial<Record<ModuleAddonKey, string>>> = {
  AED: {},
  USD: {},
}

/** An extra seat, beyond the seats the plan includes. */
export const SEAT_AMOUNTS: Record<BillingCurrency, number> = {
  AED: 180,
  USD: 49,
}

/** Annual billing takes this off the whole basket. Mirrors ANNUAL_DISCOUNT server-side. */
export const ANNUAL_DISCOUNT = 0.2

/**
 * Credits per profile unlock - the only conversion between the two, because
 * top-ups are sold as unlocks and nobody wants "1,000 credits". The live
 * figure comes from GET /api/v1/credits/pricing; this is the fallback when
 * that call does not answer.
 */
export const CREDITS_PER_UNLOCK = 25

/** Action types that mean "unlock a profile", across the spellings in use. */
export const UNLOCK_ACTION_TYPES = ['profile_unlock', 'profile_analysis', 'unlock_profile']

export function getModuleAmount(
  module: ModuleAddonKey,
  interval: BillingInterval = 'monthly',
  currency: BillingCurrency = getBillingCurrency()
): number {
  const monthly = MODULE_AMOUNTS[currency][module]
  if (interval === 'annual') return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT))
  return monthly
}

/** e.g. "AED 1,200/month" */
export function formatModulePrice(
  module: ModuleAddonKey,
  currency: BillingCurrency = getBillingCurrency(),
  suffix: string = '/month'
): string {
  return `${formatPlanPrice(getModuleAmount(module, 'monthly', currency), currency)}${suffix}`
}

export function getSeatAmount(currency: BillingCurrency = getBillingCurrency()): number {
  return SEAT_AMOUNTS[currency]
}

/** True once a Stripe price object exists for the add-on in the active currency. */
export function hasModuleCheckout(
  module: ModuleAddonKey,
  currency: BillingCurrency = getBillingCurrency()
): boolean {
  return Boolean(MODULE_STRIPE_PRICE_IDS[currency][module])
}

/** Monthly-equivalent price when a basket is billed annually. */
export function annualMonthlyEquivalent(monthlyAmount: number): number {
  return Math.round(monthlyAmount * (1 - ANNUAL_DISCOUNT))
}

// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------
// These MIRROR SUBSCRIPTION_TIER_LIMITS in app/models/teams.py, which is what
// the server actually enforces. They exist for the signed-out pricing page,
// which has no /billing status to read.
//
// Inside the product, limits are read from the live billing status and shown
// in exactly one place (the plan screen) - never from this table, so a brand
// is never quoted a limit the server disagrees with. The public page used to
// claim 500 and 2,000 monthly unlocks while the server enforced 350 and 1,000.

export interface PlanLimits {
  seats: number
  monthlyUnlocks: number
  monthlyPosts: number
  monthlyCredits: number
  /** Fraction off credit top-ups, e.g. 0.2. */
  topupDiscount: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { seats: 1, monthlyUnlocks: 5, monthlyPosts: 0, monthlyCredits: 125, topupDiscount: 0 },
  standard: { seats: 2, monthlyUnlocks: 350, monthlyPosts: 100, monthlyCredits: 8750, topupDiscount: 0 },
  premium: { seats: 5, monthlyUnlocks: 1000, monthlyPosts: 250, monthlyCredits: 25000, topupDiscount: 0.2 },
}

export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[normalizePlanTier(tier)]
}
