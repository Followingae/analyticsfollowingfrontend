/**
 * Module entitlements, the operator's side.
 * Mirrors app/api/admin/entitlement_routes.py, base path /api/v1/admin/accounts.
 *
 * Four product modules exist: Find, Run, Merchant of Record, Manage. What an account has,
 * how each part of it is billed, and where its payments stand all come from one read.
 *
 * Three things the types here deliberately preserve rather than re-derive:
 *
 *   `usable` and `read_only` are sent by the server. The list of statuses that count as
 *   working lives in app/services/entitlements.py and will grow; a copy of it in the
 *   frontend would drift, and the failure mode is an operator being told a module is off
 *   while the client is using it.
 *
 *   Cancelling is a schedule, never a deletion. `cancel_at_period_end` with a
 *   `current_period_end` is the whole state, and the module keeps working in full until
 *   that date. Nothing in this file is called remove, delete or revoke, because the
 *   backend does not do that.
 *
 *   `billing_method` sits on the module, not on the account. One module can be on a card
 *   while everything else is invoiced. That is the point of the table.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/accounts`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

/** stripe = a card, invoiced = we raise an invoice, granted = on at no charge. */
export type BillingMethod = 'stripe' | 'invoiced' | 'granted'

/** Kept wide on purpose: the server owns this list and may add to it. */
export type EntitlementStatus = string

export type PaymentState = 'current' | 'past_due' | 'grace' | 'locked'

export interface AccountModule {
  id: string
  team_id: string
  module: string
  label: string
  billing_method: BillingMethod
  status: EntitlementStatus
  /** From the server. Never recomputed from `status` here. */
  usable: boolean
  read_only: boolean
  price_aed: number | string | null
  billing_interval: string | null
  activated_at: string | null
  activation_source: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  cancelled_at: string | null
  locked_at: string | null
  trial_ends_at: string | null
  stripe_subscription_id: string | null
  notes: string | null
}

export interface AvailableModule {
  module: string
  label: string
  description: string
  /** A cycle at the list price, in AED. Decimal on the wire, so a string. */
  price_aed_per_month: string
}

export interface AccountModulesResponse {
  modules: AccountModule[]
  available_to_add: AvailableModule[]
  payment_state: PaymentState | null
  grace_ends_at: string | null
}

/** What Merchant of Record costs this account, in the words it is sold in. */
export interface MorFeeStructure {
  monthly_fee_aed: string
  settlement_fee_pct: string
  /** True for a Manage client: Manage already charges for the same work. */
  included_in_manage: boolean
  management_service_charge_pct: string | null
  summary: string
  prices_are_provisional: boolean
}

export interface AddModulePayload {
  billing_method?: BillingMethod
  billing_interval?: 'month' | 'year'
  /** The quoted amount for a cycle. Required for Manage, which has no list price. */
  price_aed?: string
  /** A card-billed module needs the Stripe subscription it is billed on. */
  stripe_subscription_id?: string
  /**
   * The cycle to put it on. Sent so the new module renews on the same day as the rest of
   * the account and the client gets one invoice a month rather than two on different dates.
   * Left out, the server starts a fresh cycle today.
   */
  current_period_start?: string
  current_period_end?: string
  reason?: string
  notes?: string
}

export interface AddModuleResult {
  entitlement: AccountModule
  active_from: string
  /** Charged now, for the rest of this cycle. */
  prorated_amount_aed: string
  full_cycle_amount_aed: string
  invoice_id: string | null
  fees: MorFeeStructure | null
  message: string
}

export interface DunningState {
  state: PaymentState
  failure_count: number
  grace_ends_at: string | null
  locked_at: string | null
  first_failure_at: string | null
  last_failure_at: string | null
  last_failure_reason: string | null
  amount_due_aed: number | string | null
}

export const accountModulesApi = {
  /** What the account has, what it could add, and where its payments are. */
  async list(teamId: string): Promise<AccountModulesResponse> {
    const r = await jfetch(`${BASE}/${teamId}/modules`)
    return r.data
  },

  /**
   * Switch one module on. Effective immediately and charged prorated for the rest of the
   * cycle, so the operator confirming this has to have been told both facts.
   */
  async add(teamId: string, module: string, payload: AddModulePayload = {}): Promise<AddModuleResult> {
    const r = await jfetch(`${BASE}/${teamId}/modules/${module}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return r.data
  },

  /** Move ONE module between card, invoice and no charge. */
  async setBillingMethod(
    teamId: string,
    module: string,
    payload: { billing_method: BillingMethod; stripe_subscription_id?: string; reason?: string },
  ): Promise<AccountModule> {
    const r = await jfetch(`${BASE}/${teamId}/modules/${module}/billing-method`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return r.data
  },

  /**
   * Schedule the end of a module at the close of the period the client has paid for.
   * Not immediate, and nothing is taken away: the module runs in full until then.
   */
  async scheduleEnding(teamId: string, module: string, reason?: string):
    Promise<{ data: AccountModule; message: string }> {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const r = await jfetch(`${BASE}/${teamId}/modules/${module}${q}`, { method: 'DELETE' })
    return { data: r.data, message: r.message }
  },

  /** Undo a scheduled ending, while the period is still running. */
  async restore(teamId: string, module: string): Promise<AccountModule> {
    const r = await jfetch(`${BASE}/${teamId}/modules/${module}/restore`, { method: 'POST' })
    return r.data
  },

  /**
   * Record that an outstanding balance was settled, and unlock now.
   * For the invoiced path, where a transfer lands and no webhook exists.
   */
  async recordPaymentReceived(teamId: string): Promise<{ data: DunningState; message: string }> {
    const r = await jfetch(`${BASE}/${teamId}/payments/clear`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    return { data: r.data, message: r.message }
  },

  async paymentState(teamId: string): Promise<DunningState> {
    const r = await jfetch(`${BASE}/${teamId}/payments/state`)
    return r.data
  },
}
