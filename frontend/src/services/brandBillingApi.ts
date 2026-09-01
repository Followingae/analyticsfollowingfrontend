/**
 * Billing, the BRAND's side.
 *
 * Everything /billing needs that is not already in `billingManager` (subscription
 * status, Stripe portal) or `useAccountInvoices` (the merged invoice list). Three
 * groups, and nothing else belongs in here:
 *
 *   1. What modules this account has, how each is billed, and whether we invoice
 *      them or take a card.
 *   2. The price list for every plan, live from the server.
 *   3. The four writes that change a plan, each of which costs money.
 *
 * The operator's equivalent is `accountModulesApi.ts`, which reads the same table
 * through /api/v1/admin/accounts/{team_id}/modules. That one takes a team_id in
 * the URL. This one never does: the account is resolved server-side from the
 * caller, so there is nothing here for a brand user to tamper with.
 *
 * <<< THE ONE LINE TO CHANGE >>>
 * `ACCOUNT_MODULES_PATH` below is the account-facing entitlements read. It is
 * being built as this page is written. When its final path is known, edit that
 * one constant and nothing else moves.
 */
import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** The account-facing entitlements read. See the note at the top of this file. */
export const ACCOUNT_MODULES_PATH = '/api/v1/billing/account-modules'

/** Change an existing subscription in place. Both take { tier }. */
const UPGRADE_PATH = '/api/v1/credits/subscription/upgrade'
const DOWNGRADE_PATH = '/api/v1/credits/subscription/downgrade'
const CANCEL_PATH = '/api/v1/credits/subscription/cancel'

/** Start a NEW subscription. Returns a hosted Stripe checkout URL. */
const CHECKOUT_PATH = '/api/v1/checkout/create-session'

/** The price list, every tier, monthly and annual, in the live billing currency. */
const PRICING_PATH = '/api/v1/checkout/pricing'

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

/** A response the caller can tell apart from a failure. 404 is not a failure
 *  here: it means the endpoint is not deployed yet, which is a different fact
 *  from "the server could not answer", and the page renders it differently. */
export class NotDeployedError extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 404) throw new NotDeployedError(path)
  if (!res.ok) throw new Error(`GET ${path} answered ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.detail || detail?.message || `That did not go through (${res.status})`)
  }
  return res.json()
}

/** The API answers `{ success, data }` on the newer routes and a bare object on
 *  the older ones. Unwrap once, here, rather than at every call site. */
function unwrap<T>(payload: unknown): T {
  const body = payload as { data?: unknown } | null
  return (body && typeof body === 'object' && 'data' in body ? body.data : payload) as T
}

// ---------------------------------------------------------------------------
// 1. Modules
// ---------------------------------------------------------------------------

/** stripe = a card, invoiced = we raise an invoice, granted = on at no charge. */
export type ModuleBillingMethod = 'stripe' | 'invoiced' | 'granted'

/** Where the account's payments stand. Null when the server does not say. */
export type AccountPaymentState = 'current' | 'past_due' | 'grace' | 'locked'

/**
 * One module this account has.
 *
 * `usable` and `read_only` come from the server and are never recomputed from
 * `status` here. Two reasons, and the second is the one that bites: the list of
 * statuses that count as working lives in app/services/entitlements.py and will
 * grow, AND `usable` folds in the account-level dunning lock, so a billed module
 * on a locked account comes back usable:false while its own row still reads
 * "active". Render off `usable`, never off `status`.
 *
 * `cancel_at_period_end` with `cancels_on` is the WHOLE cancellation state. A
 * cancelled module keeps working, in full, until that date. Nothing in this file
 * is named remove, delete or revoke, because the backend does not do that.
 */
export interface BrandModule {
  module: string
  label: string
  description: string | null
  status: string | null
  usable: boolean
  read_only: boolean
  billing_method: ModuleBillingMethod | null
  current_period_end: string | null
  /** The date access actually ends. Set only when an ending is scheduled. */
  cancels_on: string | null
  cancel_at_period_end: boolean
}

/** A module the account does not have, as the server offers it. */
export interface BrandModuleOffer {
  module: string
  label: string
  description: string | null
  /** A cycle at the list price, in AED. Decimal on the wire, so a string. */
  price_aed_per_month: string | null
  /**
   * True when this module can never go on a card for this account: either we
   * invoice the account, or the module is quoted per client whatever the
   * account is (Manage). Either way the action is a conversation, not checkout.
   */
  invoice_only: boolean
}

/**
 * How the account pays, read from the TEAM OWNER's row.
 *
 * This is the only correct answer to "card or invoice", and it is why this page
 * does not derive it. Per-module `billing_method` cannot answer it, because Find
 * is "granted" on every account, card paying or not. The signed-in user's own
 * `billing_type` cannot answer it either: on a multi seat account a member's row
 * is frequently unset, so deriving from it would put a card form in front of a
 * member of a client we invoice.
 */
export interface BrandPayment {
  state: AccountPaymentState | null
  grace_ends_at: string | null
  locked: boolean
  billing_type: string | null
  /** Following raises an invoice. No card UI, ever. */
  invoiced: boolean
  /** The exact inverse. Both are sent; use whichever reads better at the site. */
  can_pay_by_card: boolean
}

export interface BrandModulesSnapshot {
  teamId: string | null
  modules: BrandModule[]
  availableToAdd: BrandModuleOffer[]
  payment: BrandPayment
}

function toModule(raw: Record<string, unknown>): BrandModule {
  const key = String(raw.module ?? '')
  return {
    module: key,
    label: String(raw.label ?? key),
    description: (raw.description as string) ?? null,
    status: (raw.status as string) ?? null,
    usable: raw.usable === true,
    read_only: raw.read_only === true,
    billing_method: (raw.billing_method as ModuleBillingMethod) ?? null,
    current_period_end: (raw.current_period_end as string) ?? null,
    cancels_on: (raw.cancels_on as string) ?? null,
    cancel_at_period_end: raw.cancel_at_period_end === true,
  }
}

function toOffer(raw: Record<string, unknown>): BrandModuleOffer {
  const key = String(raw.module ?? '')
  return {
    module: key,
    label: String(raw.label ?? key),
    description: (raw.description as string) ?? null,
    price_aed_per_month: (raw.price_aed_per_month as string) ?? null,
    invoice_only: raw.invoice_only === true,
  }
}

/**
 * What this account has, what it could add, and how it pays.
 *
 * Throws `NotDeployedError` on a 404, so the caller can fall back to the
 * entitlement the product enforces today rather than telling a paying client
 * their modules are off because a route is not live yet.
 */
export async function fetchAccountModules(): Promise<BrandModulesSnapshot> {
  const data = unwrap<Record<string, unknown>>(await get(ACCOUNT_MODULES_PATH))
  const list = Array.isArray(data?.modules) ? (data.modules as Record<string, unknown>[]) : []
  const offers = Array.isArray(data?.available_to_add)
    ? (data.available_to_add as Record<string, unknown>[])
    : []
  // `payment` is NESTED here, unlike the admin endpoint where the same two
  // fields sit at the top level. Do not flatten one into the other.
  const payment = (data?.payment ?? {}) as Record<string, unknown>

  return {
    teamId: (data?.team_id as string) ?? null,
    modules: list.map(toModule),
    availableToAdd: offers.map(toOffer),
    payment: {
      state: (payment.state as AccountPaymentState) ?? null,
      grace_ends_at: (payment.grace_ends_at as string) ?? null,
      locked: payment.locked === true,
      billing_type: (payment.billing_type as string) ?? null,
      invoiced: payment.invoiced === true,
      can_pay_by_card: payment.can_pay_by_card === true,
    },
  }
}

// ---------------------------------------------------------------------------
// 1b. The subscription status, with the failure left in
// ---------------------------------------------------------------------------

/**
 * The same read as `billingManager.getBillingStatus()`, except that this one
 * does not swallow the failure.
 *
 * That method returns `null` for a 401, a 500, a dropped connection and an
 * account with no billing record alike, which is how /billing came to answer a
 * failed request with the words "No Active Subscription" over a button to buy
 * one. Here: `null` means the server said there is no billing record, and
 * anything that went wrong is thrown so the page can say that instead.
 */
export async function fetchBillingStatus<T>(): Promise<T | null> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/billing/subscription-status`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Billing status answered ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// 2. The price list
// ---------------------------------------------------------------------------

export interface PlanPricePoint {
  amount: number
  currency: string
  /** Empty when no Stripe price object exists yet. Checkout 503s without it, so
   *  the button is disabled rather than shipped dead. */
  priceId: string | null
  /** Annual only: what it works out to per month. */
  monthlyEquivalent: number | null
  savings: number | null
}

export interface PlanPrice {
  tier: string
  name: string
  currency: string
  credits: number | null
  monthly: PlanPricePoint | null
  annual: PlanPricePoint | null
}

function toPoint(raw: Record<string, unknown> | undefined): PlanPricePoint | null {
  if (!raw || typeof raw.amount !== 'number') return null
  return {
    amount: raw.amount,
    currency: String(raw.currency ?? 'AED').toUpperCase(),
    priceId: (raw.price_id as string) || null,
    monthlyEquivalent: typeof raw.monthly_equivalent === 'number' ? raw.monthly_equivalent : null,
    savings: typeof raw.savings === 'number' ? raw.savings : null,
  }
}

/** Every plan, at the price the server will actually charge. */
export async function fetchPlanPrices(): Promise<{ plans: PlanPrice[]; currency: string }> {
  const body = await get<Record<string, unknown>>(PRICING_PATH)
  const pricing = (body?.pricing ?? {}) as Record<string, Record<string, unknown>>
  const currency = String(body?.currency ?? 'AED').toUpperCase()

  const plans = Object.entries(pricing).map(([tier, block]) => {
    const points = (block?.pricing ?? {}) as Record<string, Record<string, unknown>>
    return {
      tier,
      name: String(block?.name ?? tier),
      currency: String(block?.currency ?? currency).toUpperCase(),
      credits: typeof block?.credits === 'number' ? (block.credits as number) : null,
      monthly: toPoint(points.monthly),
      annual: toPoint(points.annual),
    }
  })

  return { plans, currency }
}

// ---------------------------------------------------------------------------
// 3. The writes
// ---------------------------------------------------------------------------

export type BillingInterval = 'monthly' | 'annual'

/**
 * Move UP a tier on a subscription that already exists.
 *
 * Immediate, and prorated: Stripe raises the difference for the rest of the
 * current cycle against the card on file. The caller must have said both of
 * those things before this is called.
 */
export function upgradePlan(tier: string) {
  return post<{ message?: string; current_period_end?: number }>(UPGRADE_PATH, { tier })
}

/**
 * Move DOWN to a cheaper paid tier.
 *
 * The backend swaps the subscription item with `proration_behavior: "none"`, so
 * nothing is refunded for the part of the cycle already paid for, and the next
 * invoice is at the new price. Its response message says "at period end"; the
 * code it describes does not wait, which is why the confirmation on this page
 * does not promise a date it cannot keep.
 */
export function downgradePlan(tier: string) {
  return post<{ message?: string; current_period_end?: number }>(DOWNGRADE_PATH, { tier })
}

/**
 * Stop the subscription at the end of the period already paid for.
 *
 * This is how an account gets back to Free: nothing is taken away today, the
 * plan runs to its renewal date and does not renew. It is not a deletion, and
 * the client keeps every profile they have already unlocked.
 */
export function endPlanAtPeriodEnd() {
  return post<{ message?: string; cancel_at_period_end?: boolean }>(CANCEL_PATH, {
    at_period_end: true,
  })
}

/**
 * Start a subscription where there is none: hosted Stripe checkout.
 * The card is taken on Stripe's page, never on ours.
 */
export async function startPlanCheckout(
  tier: string,
  interval: BillingInterval = 'monthly'
): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const body = await post<{ checkout_url?: string }>(CHECKOUT_PATH, {
    tier,
    billing_interval: interval,
    success_url: `${origin}/billing?plan=changed`,
    cancel_url: `${origin}/billing?plan=cancelled`,
  })
  if (!body?.checkout_url) throw new Error('Stripe did not return a checkout page')
  return body.checkout_url
}
