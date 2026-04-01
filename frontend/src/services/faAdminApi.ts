/**
 * Following App (FA) Admin API Service
 * Endpoints for superadmin management + brand pool operations
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = API_CONFIG.BASE_URL

// ─── Helper ──────────────────────────────────────────────────────────
async function get(path: string) {
  const res = await fetchWithAuth(`${BASE}${path}`, { method: 'GET' })
  return res.json()
}

async function post(path: string, body?: any) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function put(path: string, body?: any) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function del(path: string) {
  const res = await fetchWithAuth(`${BASE}${path}`, { method: 'DELETE' })
  return res.json()
}

// ─── SUPERADMIN: Merchants ───────────────────────────────────────────
export const faMerchantApi = {
  list: () => get('/api/v1/admin/fa/merchants'),
  get: (id: string) => get(`/api/v1/admin/fa/merchants/${id}`),
  create: (data: any) => post('/api/v1/admin/fa/merchants', data),
  update: (id: string, data: any) => put(`/api/v1/admin/fa/merchants/${id}`, data),
  delete: (id: string) => del(`/api/v1/admin/fa/merchants/${id}`),
}

// ─── SUPERADMIN: Clients (for campaign creation dropdowns) ──────────
export const faClientApi = {
  list: (params?: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return get(`/api/v1/admin/clients${q ? `?${q}` : ''}`)
  },
}

// ─── SUPERADMIN: FA Campaigns ────────────────────────────────────────
export const faCampaignApi = {
  list: (type?: string, status?: string) => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    const qs = params.toString()
    return get(`/api/v1/admin/fa/campaigns${qs ? `?${qs}` : ''}`)
  },
  createCashback: (data: any) => post('/api/v1/admin/fa/campaigns/cashback', data),
  createPaidDeal: (data: any) => post('/api/v1/admin/fa/campaigns/paid-deal', data),
  createBarter: (data: any) => post('/api/v1/admin/fa/campaigns/barter', data),
  update: (id: string, data: any) => put(`/api/v1/admin/fa/campaigns/${id}`, data),
  updateStatus: (id: string, status: string) => put(`/api/v1/admin/fa/campaigns/${id}/status`, { status }),
}

// ─── SUPERADMIN: FA Members ──────────────────────────────────────────
export const faMemberApi = {
  list: (params?: { tier?: string; status?: string; is_approved?: number; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.tier) qs.set('tier', params.tier)
    if (params?.status) qs.set('status', params.status)
    if (params?.is_approved !== undefined) qs.set('is_approved', String(params.is_approved))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/members${q ? `?${q}` : ''}`)
  },
  get: (id: string) => get(`/api/v1/admin/fa/members/${id}`),
  approve: (id: string) => put(`/api/v1/admin/fa/members/${id}`, { is_approved: 1 }),
  reject: (id: string, reason?: string) => put(`/api/v1/admin/fa/members/${id}`, { is_approved: 2, rejection_reason: reason }),
  triggerAnalytics: (memberId: string) => post(`/api/v1/admin/fa/members/${memberId}/analyze`),
}

// ─── SUPERADMIN: FA Deliverables ─────────────────────────────────────
export const faDeliverableApi = {
  listPending: () => get('/api/v1/admin/fa/deliverables/pending'),
  verify: (id: string) => post(`/api/v1/admin/fa/deliverables/${id}/verify`),
  reject: (id: string, reason?: string) => post(`/api/v1/admin/fa/deliverables/${id}/reject`, { reason }),
}

// ─── SUPERADMIN: FA Withdrawals ──────────────────────────────────────
export const faWithdrawalApi = {
  listPending: () => get('/api/v1/admin/fa/withdrawals/pending'),
  approve: (id: string) => post(`/api/v1/admin/fa/withdrawals/${id}/approve`),
  reject: (id: string, reason?: string) => post(`/api/v1/admin/fa/withdrawals/${id}/reject`, { reason }),
}

// ─── SUPERADMIN: FA Receipt Claims ──────────────────────────────────
export const faReceiptClaimApi = {
  list: (status = 'pending_review') => get(`/api/v1/admin/fa/receipt-claims?status=${status}`),
  approve: (id: string) => post(`/api/v1/admin/fa/receipt-claims/${id}/approve`),
  reject: (id: string, reason?: string) => post(`/api/v1/admin/fa/receipt-claims/${id}/reject?reason=${encodeURIComponent(reason || '')}`),
}

// ─── SUPERADMIN: FA Pools ────────────────────────────────────────────
export const faPoolApi = {
  listAll: () => get('/api/v1/admin/fa/pools'),
  adjust: (id: string, data: { amount_cents: number; description: string; type: 'adjustment' | 'refund' }) =>
    post(`/api/v1/admin/fa/pools/${id}/adjust`, data),
}

// ─── SUPERADMIN: FA Stats ────────────────────────────────────────────
export const faStatsApi = {
  dashboard: () => get('/api/v1/admin/fa/stats'),
}

// ─── BRAND: Pool Management ──────────────────────────────────────────
export const brandPoolApi = {
  balance: () => get('/api/v1/pool/balance'),
  transactions: (limit = 20, offset = 0) =>
    get(`/api/v1/pool/transactions?limit=${limit}&offset=${offset}`),
  topupPackages: () => get('/api/v1/pool/topup/packages'),
  createTopupSession: (data: { package_id: string; success_url?: string; cancel_url?: string }) =>
    post('/api/v1/pool/topup/create-session', data),
  createCustomTopupSession: (data: { amount_aed: number; success_url?: string; cancel_url?: string }) =>
    post('/api/v1/pool/topup/custom-session', data),
  campaigns: () => get('/api/v1/pool/campaigns'),
}

// ─── BRAND: Campaign Extensions ──────────────────────────────────────
export const brandCampaignApi = {
  listByType: (type: 'cashback' | 'paid_deal' | 'barter') =>
    get(`/api/v1/campaigns?type=${type}`),
  getParticipants: (id: string) =>
    get(`/api/v1/campaigns/${id}/participants`),
  getApplications: (id: string) =>
    get(`/api/v1/campaigns/${id}/applications`),
  acceptApplication: (campaignId: string, appId: string) =>
    post(`/api/v1/campaigns/${campaignId}/applications/${appId}/accept`),
  rejectApplication: (campaignId: string, appId: string) =>
    post(`/api/v1/campaigns/${campaignId}/applications/${appId}/reject`),
  approveDeliverable: (campaignId: string, delId: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${delId}/approve`),
  rejectDeliverable: (campaignId: string, delId: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${delId}/reject`),
}
