/**
 * Client Management API Service
 * Team = Client: each team with brand users is a client entity.
 */
import { API_CONFIG } from '@/config/api';

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/clients`;

async function authFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export interface Client {
  id: string;
  name: string;
  company_name: string;
  owner_name: string | null;
  owner_email: string | null;
  logo_url: string | null;
  industry: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  subscription_tier: string;
  subscription_status: string;
  notes: string | null;
  created_at: string;
  total_campaigns: number;
  active_campaigns: number;
  total_budget: number;
  total_spent: number;
  unpaid_campaigns: number;
  pending_proposals: number;
}

export interface ScopeCampaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  budget: number | null;
  spent: number | null;
  payment_status: string;
  closure_date: string | null;
  client_feedback: string | null;
  boosting_rights_notes: string | null;
  report_status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  brand_name: string;
  total_creators: number;
  carried_forward_count: number;
  total_posts: number;
}

export interface FinanceSummary {
  total_campaigns: number;
  total_budget: number;
  total_spent: number;
  paid_campaigns: number;
  partial_campaigns: number;
  unpaid_campaigns: number;
  outstanding_amount: number;
  carry_forward_value_cents: number;
}

export const clientApi = {
  list: (params?: { search?: string; industry?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.industry) qs.set('industry', params.industry);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return authFetch(`${BASE}?${qs.toString()}`);
  },

  getDetail: (teamId: string) => authFetch(`${BASE}/${teamId}`),

  getScope: (teamId: string, year?: number) => {
    const qs = year ? `?year=${year}` : '';
    return authFetch(`${BASE}/${teamId}/scope${qs}`);
  },

  getCampaigns: (teamId: string, params?: { campaign_type?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.campaign_type) qs.set('campaign_type', params.campaign_type);
    if (params?.status) qs.set('status', params.status);
    return authFetch(`${BASE}/${teamId}/campaigns?${qs.toString()}`);
  },

  getEvents: (teamId: string) => authFetch(`${BASE}/${teamId}/events`),

  getUgc: (teamId: string) => authFetch(`${BASE}/${teamId}/ugc`),

  getFinance: (teamId: string) => authFetch(`${BASE}/${teamId}/finance`),

  getActivity: (teamId: string, limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return authFetch(`${BASE}/${teamId}/activity${qs}`);
  },

  update: (teamId: string, data: Partial<{
    logo_url: string;
    industry: string;
    primary_contact_name: string;
    primary_contact_email: string;
    notes: string;
  }>) => authFetch(`${BASE}/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateScope: (teamId: string, campaignId: string, data: {
    payment_status?: string;
    closure_date?: string;
    client_feedback?: string;
    boosting_rights_notes?: string;
    report_status?: string;
    status?: string;
  }) => authFetch(`${BASE}/${teamId}/scope/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getExportUrl: (teamId: string, year?: number) => {
    const base = `${BASE}/${teamId}/export`;
    return year ? `${base}?year=${year}` : base;
  },
};

// Unified campaigns API for brand users
const CAMPAIGNS_BASE = `${API_CONFIG.BASE_URL}/api/v1/campaigns`;

export const unifiedCampaignApi = {
  list: (params?: {
    campaign_type?: string;
    status?: string;
    search?: string;
    year?: number;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.campaign_type) qs.set('campaign_type', params.campaign_type);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.year) qs.set('year', String(params.year));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return authFetch(`${CAMPAIGNS_BASE}/unified?${qs.toString()}`);
  },

  getScope: (year?: number) => {
    const qs = year ? `?year=${year}` : '';
    return authFetch(`${CAMPAIGNS_BASE}/scope${qs}`);
  },

  getUgcBudgetSummary: (campaignId: string) =>
    authFetch(`${CAMPAIGNS_BASE}/${campaignId}/ugc/budget-summary`),
};

// Carry-forward API
export const carryForwardApi = {
  carryForward: (campaignId: string, creatorId: string, data: {
    target_campaign_id: string;
    reason?: string;
    value_aed_cents?: number;
  }) => authFetch(`${CAMPAIGNS_BASE}/${campaignId}/creators/${creatorId}/carry-forward`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getCarryForwards: (campaignId: string) =>
    authFetch(`${CAMPAIGNS_BASE}/${campaignId}/carry-forwards`),
};
