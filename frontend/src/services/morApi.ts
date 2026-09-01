/**
 * Merchant of Record — the brand's side.
 * Mirrors app/api/mor_routes.py.
 *
 * Three things live behind this: what the module costs (shown before anyone commits),
 * the payee book the client uploads bank details into, and the read-only status of every
 * payout we make on their behalf. Nothing here returns cost or margin — the backend
 * scrubs the payload with the caller's field_policy scope on the way out.
 */
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/utils/apiInterceptor';

const BASE = `${API_CONFIG.BASE_URL}/api/v1/mor`;

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method);
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export interface MorFees {
  module: string;
  monthly_fee_aed: string;
  settlement_fee_pct: string;
  included_in_manage: boolean;
  management_service_charge_pct: string | null;
  billed_twice: boolean;
  summary: string;
  prices_are_provisional: boolean;
}

export interface MorOffer {
  module: string;
  label: string;
  description: string;
  fees: MorFees;
  entitlement: Record<string, any> | null;
  active: boolean;
  can_buy: boolean;
  how_it_works: string[];
}

export interface MorPayee {
  id: string;
  creator_username: string | null;
  account_holder: string;
  bank_name: string | null;
  swift: string | null;
  country: string | null;
  currency: string | null;
  /** Never the full IBAN. The screen confirms the right account is on file, nothing more. */
  iban_masked: string | null;
  source: string | null;
  updated_at: string;
}

export type PayoutState =
  | 'awaiting_approval'
  | 'awaiting_funds'
  | 'approved'
  | 'in_transfer_file'
  | 'paid'
  | 'cancelled';

export interface MorPayout {
  payout_id: string;
  creator_username: string | null;
  what_for: string | null;
  amount_aed: number | null;
  amount_cents: number;
  state: PayoutState;
  state_label: string;
  due_date: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  transfer_run: string | null;
  expected_value_date: string | null;
}

export interface MorCampaignPayouts {
  campaign_id: string;
  campaign_name: string;
  settlement_enabled: boolean;
  settlement_fee_pct: number | null;
  payouts: MorPayout[];
  totals: {
    payouts_total_aed: number | null;
    outstanding_aed: number | null;
    paid_aed: number | null;
    funded_aed: number | null;
    shortfall_aed: number | null;
  };
  by_state: Record<string, { count: number; amount_cents: number; amount_aed: number }>;
}

export const morApi = {
  offer: (): Promise<{ success: boolean; data: MorOffer }> => jfetch(`${BASE}/offer`),

  /** Opens Stripe Checkout. The entitlement is written by the subscription webhook. */
  subscribe: (successUrl: string, cancelUrl: string) =>
    jfetch(`${BASE}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ success_url: successUrl, cancel_url: cancelUrl }),
    }) as Promise<{ success: boolean; data: { checkout_url: string; session_id: string } }>,

  payees: (): Promise<{ success: boolean; data: MorPayee[] }> => jfetch(`${BASE}/payees`),

  addPayee: (payee: {
    creator_username: string;
    account_holder: string;
    iban: string;
    bank_name?: string;
    swift?: string;
    country?: string;
    notes?: string;
    /** Only ever sent from an explicit "replace it" confirmation. */
    replace_existing?: boolean;
  }) => jfetch(`${BASE}/payees`, { method: 'POST', body: JSON.stringify(payee) }),

  /** Existing payees are skipped by default; a stale spreadsheet must not redirect money. */
  importPayees: async (file: File, onExisting: 'skip' | 'update' = 'skip') => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetchWithAuth(`${BASE}/payees/import?on_existing=${onExisting}`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API error: ${res.status}`);
    }
    return res.json() as Promise<{
      success: boolean;
      data: {
        added: string[];
        updated: string[];
        skipped: { row: number; creator_username: string; why: string }[];
        failed: { row: number; creator_username: string; why: string }[];
        counts: { added: number; updated: number; skipped: number; failed: number };
      };
    }>;
  },

  campaignPayouts: (campaignId: string): Promise<{ success: boolean; data: MorCampaignPayouts }> =>
    jfetch(`${BASE}/campaigns/${campaignId}/payouts`),
};

/** The five words a payout can be at, in the order money moves through them. */
export const PAYOUT_STATE_ORDER: PayoutState[] = [
  'awaiting_approval',
  'awaiting_funds',
  'approved',
  'in_transfer_file',
  'paid',
];

export const PAYOUT_STATE_TITLES: Record<PayoutState, string> = {
  awaiting_approval: 'Awaiting approval',
  awaiting_funds: 'Awaiting funds',
  approved: 'Approved',
  in_transfer_file: 'In a transfer file',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const formatAed = (value: number | null | undefined) =>
  value == null ? '—' : `AED ${Number(value).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
