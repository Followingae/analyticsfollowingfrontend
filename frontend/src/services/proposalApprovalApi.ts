/**
 * Proposal Internal Approval Chain API (agency workflow — Phase 3)
 * Mirrors app/api/admin/proposal_approval_routes.py.
 */
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/utils/apiInterceptor';

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/proposals`;

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

export interface ApprovalStep {
  step_order: number;
  approver_role: string | null;
  approver_user_id: string | null;
  name: string | null;
}

export const proposalApprovalApi = {
  // Superadmin: hand the draft to a talent manager to populate.
  sendForAdding: (proposalId: string, talentManagerId: string) =>
    jfetch(`${BASE}/${proposalId}/send-for-adding`, {
      method: 'POST',
      body: JSON.stringify({ talent_manager_id: talentManagerId }),
    }),

  // Configurable approval chain (drag-and-drop builder persists here).
  getChain: (proposalId: string) => jfetch(`${BASE}/${proposalId}/chain`),
  setChain: (proposalId: string, steps: Partial<ApprovalStep>[]) =>
    jfetch(`${BASE}/${proposalId}/chain`, { method: 'POST', body: JSON.stringify({ steps }) }),

  // Talent manager: add a creator (feeds the master DB) + submit for approval.
  addCreator: (
    proposalId: string,
    payload: {
      username: string;
      cost_pricing?: Record<string, number>;
      sell_pricing?: Record<string, number>;
      categories?: string[];
      tags?: string[];
      tier?: string;
    },
  ) => jfetch(`${BASE}/${proposalId}/add-creator`, { method: 'POST', body: JSON.stringify(payload) }),

  submit: (proposalId: string) => jfetch(`${BASE}/${proposalId}/submit`, { method: 'POST', body: '{}' }),

  // Operator override: approve the whole chain in one click (superadmin running it solo).
  internalApprove: (proposalId: string, notes?: string) =>
    jfetch(`${BASE}/${proposalId}/internal-approve`, { method: 'POST', body: JSON.stringify({ notes }) }),

  // Approvers (cofounder -> ceo -> ...): approve their step, or send back.
  approveStep: (proposalId: string, notes?: string) =>
    jfetch(`${BASE}/${proposalId}/approve-step`, { method: 'POST', body: JSON.stringify({ notes }) }),
  sendBack: (
    proposalId: string,
    notes: string,
    opts?: { target?: string; requires_full_reapproval?: boolean },
  ) =>
    jfetch(`${BASE}/${proposalId}/send-back`, {
      method: 'POST',
      body: JSON.stringify({ notes, target: opts?.target ?? 'talent_manager', requires_full_reapproval: opts?.requires_full_reapproval ?? true }),
    }),

  // Operator: remove a creator from the proposal (allowed through internally_approved/shared).
  removeInfluencer: (proposalId: string, influencerId: string) =>
    jfetch(`${BASE}/${proposalId}/influencers/${influencerId}`, { method: 'DELETE' }),

  // Founders: take a percentage off every sell price on the proposal. 0 restores standard
  // rates. Never touches the master database — the frozen snapshot is what it restores to.
  applyDiscount: (proposalId: string, percent: number) =>
    jfetch(`${BASE}/${proposalId}/discount`, {
      method: 'POST',
      body: JSON.stringify({ percent }),
    }),

  // Per-influencer checker review.
  reviewInfluencer: (proposalId: string, influencerId: string, internalStatus: 'approved' | 'flagged' | 'pending', note?: string) =>
    jfetch(`${BASE}/${proposalId}/influencers/${influencerId}/review`, {
      method: 'POST',
      body: JSON.stringify({ internal_status: internalStatus, internal_flag_note: note }),
    }),

  // Budget-gated workspace read (TMs get per-influencer pricing, not campaign totals).
  getWorkspace: (proposalId: string) => jfetch(`${BASE}/${proposalId}/workspace`),

  // Generate (or reuse) a public client link.
  //   'gated' = the sales pitch: needs commercials attached, shows 5 samples until the
  //             agreement is signed and the advance paid.
  //   'open'  = a quotation: full roster and pricing immediately, no paperwork needed,
  //             expires (default 30 days) and can be revoked.
  createShare: (
    proposalId: string,
    opts?: { reveal_mode?: 'gated' | 'open'; expires_in_days?: number },
  ) =>
    jfetch(`${BASE}/${proposalId}/share`, {
      method: 'POST',
      body: JSON.stringify({
        reveal_mode: opts?.reveal_mode ?? 'gated',
        expires_in_days: opts?.expires_in_days ?? null,
      }),
    }),

  // Kill every live link for this proposal. The only way to take a forwarded quote back.
  revokeShare: (proposalId: string) =>
    jfetch(`${BASE}/${proposalId}/share/revoke`, { method: 'POST', body: '{}' }),

  // The optional priced add-on offered per deliverable on a quote, e.g. "With MEFCC visit".
  getPriceModifier: (proposalId: string) => jfetch(`${BASE}/${proposalId}/price-modifier`),

  savePriceModifier: (
    proposalId: string,
    body: {
      label: string
      kind?: 'percent' | 'fixed'
      percent_value?: number | null
      amount_aed?: number | null
      description?: string | null
      is_enabled?: boolean
    },
  ) =>
    jfetch(`${BASE}/${proposalId}/price-modifier`, {
      method: 'PUT',
      body: JSON.stringify({ kind: 'percent', is_enabled: true, ...body }),
    }),

  // Which of a creator's assigned deliverables may offer the add-on. Defining the add-on
  // alone prices nothing — a line has to be marked eligible before the client is offered it.
  setModifierEligibility: (proposalId: string, influencerId: string, eligibleTypes: string[]) =>
    jfetch(`${BASE}/${proposalId}/influencers/${influencerId}/modifier-eligibility`, {
      method: 'PUT',
      body: JSON.stringify({ eligible_types: eligibleTypes }),
    }),

  // Draw/lift the "we're still working on this" curtain. While it is down the client keeps
  // the proposal in their list but the API serves them no roster, and select/approve/reject
  // are rejected with a 409.
  setWorkInProgress: (proposalId: string, enabled: boolean, note?: string) =>
    jfetch(`${BASE}/${proposalId}/work-in-progress`, {
      method: 'POST',
      body: JSON.stringify({ enabled, note: note || null }),
    }),

  // Search the master database (active creators) for the picker.
  //
  // excludeProposalId hides creators already on the proposal, at the SOURCE. Filtering the
  // returned page instead would silently shrink it: ask for 40, render 31, with no way to
  // tell that 9 were dropped or that more exist behind them.
  searchMasterDb: (opts: {
    query?: string
    page?: number
    pageSize?: number
    countries?: string[]
    excludeProposalId?: string
    excludeListId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) => {
    const p = new URLSearchParams({
      status: 'active',
      page: String(opts.page ?? 1),
      page_size: String(opts.pageSize ?? 40),
      // Server whitelists these; it already defaulted to created_at desc, but the picker
      // never sent them so there was no way to change the order from the dialog.
      sort_by: opts.sortBy ?? 'created_at',
      sort_order: opts.sortOrder ?? 'desc',
    })
    if (opts.query) p.set('search', opts.query)
    if (opts.countries?.length) p.set('countries', opts.countries.join(','))
    if (opts.excludeProposalId) p.set('exclude_proposal_id', opts.excludeProposalId)
    if (opts.excludeListId) p.set('exclude_list_id', opts.excludeListId)
    return jfetch(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/database?${p.toString()}`)
  },

  // Countries actually present in the master DB, for the filter dropdown.
  getCountries: () => jfetch(`${API_CONFIG.BASE_URL}/api/v1/admin/imd-countries`),

  // TM adds selected master-DB creators (with deliverable assignments) to the proposal.
  addFromDb: (
    proposalId: string,
    payload: { influencer_ids: string[]; deliverable_assignments?: { influencer_db_id: string; deliverables: { type: string; quantity: number }[] }[] },
  ) => jfetch(`${BASE}/${proposalId}/add-from-db`, { method: 'POST', body: JSON.stringify(payload) }),
};
