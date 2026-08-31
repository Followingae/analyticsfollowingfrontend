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
