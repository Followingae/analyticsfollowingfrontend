/**
 * A client's management deal, over HTTP.
 *
 * Mirrors the terms half of app/api/admin/run_money_routes.py. Leadership-only on the
 * server, by the resolved money scope rather than a role string, so the co-founder reaches
 * it exactly as the superadmin does.
 *
 * Every amount that crosses this boundary is an integer of AED fils. The screen converts
 * once, at the input and at the render, and never sums a converted number.
 */
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/utils/apiInterceptor';

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/run-money/management`;

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method);
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

/** One set of terms. Historical: a rate change writes a new one, it never edits this. */
export interface ManagementTerm {
  id: string;
  monthly_fee_cents: number;
  monthly_fee_aed: number;
  service_charge_pct: number;
  active_from: string;
  active_to: string | null;
  open_ended: boolean;
  notes: string | null;
  set_by: string | null;
  set_at: string;
  /** Months already frozen into a bill on these terms. Above zero, they cannot be removed. */
  billed_months: number;
  is_current: boolean;
}

export interface ManagementTerms {
  team_id: string;
  on_management: boolean;
  current: ManagementTerm | null;
  history: ManagementTerm[];
  /** Only on the response to a write that closed the previous term. */
  superseded?: { id: string; ended_on: string } | null;
}

export interface NewTermInput {
  monthly_fee_cents: number;
  service_charge_pct: number;
  active_from: string;
  active_to?: string | null;
  notes?: string | null;
  /** End the terms running now, the day before these begin. */
  supersede?: boolean;
}

export const managementTermsApi = {
  list: (teamId: string): Promise<{ data: ManagementTerms }> =>
    jfetch(`${BASE}/${teamId}/terms`),

  create: (teamId: string, body: NewTermInput): Promise<{ data: ManagementTerms }> =>
    jfetch(`${BASE}/${teamId}/terms`, { method: 'POST', body: JSON.stringify(body) }),

  /** End a term on a date, reopen it with null, or change only its note. */
  amend: (
    termId: string,
    body: { active_to?: string | null; notes?: string },
  ): Promise<{ data: ManagementTerms }> =>
    jfetch(`${BASE}/terms/${termId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  remove: (termId: string): Promise<{ data: ManagementTerms }> =>
    jfetch(`${BASE}/terms/${termId}`, { method: 'DELETE' }),
};
