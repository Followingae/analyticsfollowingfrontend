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

  // Per-influencer checker review.
  reviewInfluencer: (proposalId: string, influencerId: string, internalStatus: 'approved' | 'flagged' | 'pending', note?: string) =>
    jfetch(`${BASE}/${proposalId}/influencers/${influencerId}/review`, {
      method: 'POST',
      body: JSON.stringify({ internal_status: internalStatus, internal_flag_note: note }),
    }),

  // Budget-gated workspace read (TMs get per-influencer pricing, not campaign totals).
  getWorkspace: (proposalId: string) => jfetch(`${BASE}/${proposalId}/workspace`),

  // Generate (or reuse) the public client share link.
  createShare: (proposalId: string) => jfetch(`${BASE}/${proposalId}/share`, { method: 'POST', body: '{}' }),

  // Search the master database (active creators) for the picker.
  searchMasterDb: (query: string) =>
    jfetch(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/database?status=active&page_size=30${query ? `&search=${encodeURIComponent(query)}` : ''}`),

  // TM adds selected master-DB creators (with deliverable assignments) to the proposal.
  addFromDb: (
    proposalId: string,
    payload: { influencer_ids: string[]; deliverable_assignments?: { influencer_db_id: string; deliverables: { type: string; quantity: number }[] }[] },
  ) => jfetch(`${BASE}/${proposalId}/add-from-db`, { method: 'POST', body: JSON.stringify(payload) }),
};
