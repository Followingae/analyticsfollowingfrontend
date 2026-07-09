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
  /** Upload a logo image (multipart) → { data: { url } }. */
  uploadLogo: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetchWithAuth(`${BASE}/api/v1/admin/fa/merchants/logo`, { method: 'POST', body: form })
    return res.json()
  },
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
  /** Close a live FA campaign (transitions status → completed). */
  close: (id: string) => put(`/api/v1/admin/fa/campaigns/${id}/status`, { status: 'completed' }),
  /** Add "Following Team Suggested" creators to an open FA campaign. */
  addCurated: (id: string, creators: Array<{ fa_member_id?: string; instagram_username?: string }>) =>
    post(`/api/v1/admin/fa/campaigns/${id}/add-curated-creators`, { creators }),
  // ─── Master (package) / sub linkage ──────────────────────────────────
  listMasters: (params?: { merchant_id?: string; campaign_type?: string }) => {
    const qs = new URLSearchParams()
    if (params?.merchant_id) qs.set('merchant_id', params.merchant_id)
    if (params?.campaign_type) qs.set('campaign_type', params.campaign_type)
    const s = qs.toString()
    return get(`/api/v1/admin/fa/masters${s ? `?${s}` : ''}`)
  },
  createMaster: (data: { name: string; campaign_type: string; merchant_id?: string; brand_user_id?: string; target_influencer_count?: number; description?: string }) =>
    post('/api/v1/admin/fa/masters', data),
  promoteToMaster: (id: string, data?: { target_influencer_count?: number; description?: string }) =>
    post(`/api/v1/admin/fa/campaigns/${id}/promote-to-master`, data || {}),
  linkMaster: (id: string, masterCampaignId: string) =>
    post(`/api/v1/admin/fa/campaigns/${id}/link-master`, { master_campaign_id: masterCampaignId }),
  unlinkMaster: (id: string) => post(`/api/v1/admin/fa/campaigns/${id}/unlink-master`, {}),
  setBrandExcluded: (id: string, brandExcluded: boolean) =>
    post(`/api/v1/admin/fa/campaigns/${id}/brand-excluded`, { brand_excluded: brandExcluded }),
  // ─── Coupon codes (brand-supplied, unique per creator) ───────────────
  /** Bulk-upload coupon codes for a campaign (idempotent on re-upload). */
  uploadCoupons: (id: string, codes: string[]) =>
    post(`/api/v1/admin/fa/campaigns/${id}/coupons`, { codes }),
  /** List a campaign's coupon codes + assignment stats. */
  listCoupons: (id: string) => get(`/api/v1/admin/fa/campaigns/${id}/coupons`),
  /** Remove an unassigned coupon code. */
  deleteCoupon: (id: string, couponId: string) =>
    del(`/api/v1/admin/fa/campaigns/${id}/coupons/${couponId}`),
  /** Share asset: canonical creatorapp.following.ae link + QR PNG (base64). */
  share: (id: string): Promise<{ url: string; qr_png_base64: string | null }> =>
    get(`/api/v1/admin/fa/campaigns/${id}/share`),
  /** Re-enqueue the analytics scrape for every team-suggested (offline) creator
   *  with no profile yet — fixes creators stuck on "Analyzing…". Idempotent. */
  backfillCuratedAnalytics: () =>
    post(`/api/v1/admin/fa/curated/backfill-analytics`),
  /** Upload an image (cover/brand logo) → { data: { url } }. Reuses the FA image bucket. */
  uploadImage: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetchWithAuth(`${BASE}/api/v1/admin/fa/merchants/logo`, { method: 'POST', body: form })
    return res.json()
  },
}

// ─── SUPERADMIN: Ad Banners (creator app home carousel) ──────────────
export interface AdBanner {
  id: string
  title?: string | null
  image_url: string
  link_url?: string | null
  link_type: 'internal' | 'external'
  is_active: boolean
  sort_order: number
  created_at?: string | null
  updated_at?: string | null
}

export const faAdBannerApi = {
  list: () => get('/api/v1/admin/ad-banners'),
  create: (data: Partial<AdBanner>) => post('/api/v1/admin/ad-banners', data),
  update: (id: string, data: Partial<AdBanner>) => put(`/api/v1/admin/ad-banners/${id}`, data),
  delete: (id: string) => del(`/api/v1/admin/ad-banners/${id}`),
  /** Reuse the FA image bucket upload (cover/logo) → { data: { url } }. */
  uploadImage: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetchWithAuth(`${BASE}/api/v1/admin/fa/merchants/logo`, { method: 'POST', body: form })
    return res.json()
  },
}

// ─── SUPERADMIN: FA Members ──────────────────────────────────────────
export const faMemberApi = {
  list: (params?: { tier?: string; status?: string; is_approved?: number; signup_completed?: boolean; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.tier) qs.set('tier', params.tier)
    if (params?.status) qs.set('status', params.status)
    if (params?.is_approved !== undefined) qs.set('is_approved', String(params.is_approved))
    if (params?.signup_completed !== undefined) qs.set('signup_completed', String(params.signup_completed))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/members${q ? `?${q}` : ''}`)
  },
  get: (id: string) => get(`/api/v1/admin/fa/members/${id}`),
  approve: (id: string) => put(`/api/v1/admin/fa/members/${id}`, { is_approved: 1 }),
  // Superadmin bulk approve. Idempotent; notifies each newly-approved member (push + WhatsApp).
  bulkApprove: (ids: string[]) => post(`/api/v1/admin/fa/members/bulk-approve`, { member_ids: ids }),
  reject: (id: string, reason?: string) => put(`/api/v1/admin/fa/members/${id}`, { is_approved: 2, rejection_reason: reason }),
  triggerAnalytics: (memberId: string) => post(`/api/v1/admin/fa/members/${memberId}/analyze`),
  deletePermanently: (memberId: string) => del(`/api/v1/admin/fa/members/${memberId}`),
}

// ─── SUPERADMIN: FA Deliverables ─────────────────────────────────────
export const faDeliverableApi = {
  /** @deprecated submitted-only view — use listAll for full pipeline visibility. */
  listPending: () => get('/api/v1/admin/fa/deliverables/pending'),
  /** Oversight: ALL deliverables, computed `stage`. stage='archive' → completed (verified|rejected). */
  listAll: (params?: { stage?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.stage) qs.set('stage', params.stage)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/deliverables${q ? `?${q}` : ''}`)
  },
  // Proof-track (admin) — releases payout. Used when there's no campaign context.
  verify: (id: string) => post(`/api/v1/admin/fa/deliverables/${id}/verify`),
  reject: (id: string, reason?: string) => post(`/api/v1/admin/fa/deliverables/${id}/reject`, { reason }),
  // Two-stage lifecycle (campaign-scoped; superadmin bypasses owner check).
  approveContent: (campaignId: string, id: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${id}/approve-content`),
  requestEdit: (campaignId: string, id: string, note?: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${id}/request-edit`, { note }),
  confirm: (campaignId: string, id: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${id}/confirm`),
}

// ─── SUPERADMIN: FA Withdrawals ──────────────────────────────────────
export const faWithdrawalApi = {
  listPending: () => get('/api/v1/admin/fa/withdrawals/pending'),
  /** Full withdrawal history with optional status filter (processing|completed|failed). */
  list: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/withdrawals${q ? `?${q}` : ''}`)
  },
  approve: (id: string) => post(`/api/v1/admin/fa/withdrawals/${id}/approve`),
  reject: (id: string, reason?: string) => post(`/api/v1/admin/fa/withdrawals/${id}/reject`, { reason }),
}

// ─── SUPERADMIN: FA Creator Wallets ──────────────────────────────────
export const faWalletApi = {
  /** Searchable list of creator wallet balances (amounts in AED). */
  list: (params?: { search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/wallets${q ? `?${q}` : ''}`)
  },
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

// ─── SUPERADMIN: FA Notifications ────────────────────────────────────
export const faNotificationApi = {
  list: (params?: { type?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.type) qs.set('type', params.type)
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/notifications${q ? `?${q}` : ''}`)
  },
  analytics: () => get('/api/v1/admin/fa/notifications/analytics'),
  send: (body: {
    audience: 'all' | 'tier' | 'status' | 'member'
    tier?: string
    status?: string
    member_id?: string
    type: string
    title: string
    message: string
    actionable: boolean
    action_url?: string
  }) => post('/api/v1/admin/fa/notifications', body),
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
    // /unified accepts campaign_type, enforces brand ownership, returns data:[...].
    // (Plain /api/v1/campaigns ignores ?type and returns {data:{campaigns}}.)
    get(`/api/v1/campaigns/unified?campaign_type=${type}`),
  getParticipants: (id: string) =>
    get(`/api/v1/campaigns/${id}/participants`),
  getApplications: (id: string) =>
    get(`/api/v1/campaigns/${id}/applications`),
  acceptApplication: (campaignId: string, appId: string) =>
    post(`/api/v1/campaigns/${campaignId}/applications/${appId}/accept`),
  rejectApplication: (campaignId: string, appId: string) =>
    post(`/api/v1/campaigns/${campaignId}/applications/${appId}/reject`),
  // Two-stage proof-of-post flow:
  //  Stage 1 (content review): approveContent / requestEdit (limited by campaign type)
  //  Stage 2 (proof of posting): confirmDeliverable → verified + payout release
  approveContent: (campaignId: string, delId: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${delId}/approve-content`),
  requestEdit: (campaignId: string, delId: string, note?: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${delId}/request-edit`, { note }),
  confirmDeliverable: (campaignId: string, delId: string) =>
    post(`/api/v1/campaigns/${campaignId}/deliverables/${delId}/confirm`),
}

// ─── SUPERADMIN: FA Platform Activity (360° awareness) ───────────────
// Appended object — see CLAUDE task note: do not modify existing exports.
export const faActivityApi = {
  /** Unified, time-sorted feed of recent FA platform events. */
  feed: (params?: { type?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.type) qs.set('type', params.type)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    const q = qs.toString()
    return get(`/api/v1/admin/fa/activity${q ? `?${q}` : ''}`)
  },
  /** Today's headline counts for stat cards. */
  summary: () => get('/api/v1/admin/fa/activity/summary'),
}

// ─── SUPERADMIN: FA Member Campaigns (appended — see task note) ───────
// Per-member campaign participation: count + distinct types + latest status.
// Standalone export so existing faMemberApi shape is untouched.
export const faMemberCampaignsApi = {
  /** Campaigns a member participated in → { total, types[], campaigns[] }. */
  list: (memberId: string) => get(`/api/v1/admin/fa/members/${memberId}/campaigns`),
}
