/**
 * Merchant of Record, the operator's side. Mirrors the admin half of
 * app/api/mor_payment_routes.py.
 *
 * Everything here is leadership-scoped on the server: it moves money and it sets what a
 * client is charged. The UI hiding a button is a convenience, never the control.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/mor`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Something went wrong (${res.status})`)
  }
  return res.json()
}

export interface MorWaiver {
  id: string
  creators_allowed: number
  used: number
  remaining: number
  valid_until: string
  expired: boolean
  revoked: boolean
  revoked_reason: string | null
  note: string | null
  granted_at: string | null
  granted_by_email: string | null
}

export interface MorWaiverState {
  active: boolean
  allowed: number
  used: number
  remaining: number
  valid_until: string | null
  expired: boolean
}

export interface MorAdminPayment {
  id: string
  reference: string | null
  client_name: string | null
  team_id: string
  creator_name: string
  creator_handle: string | null
  status: string
  status_label: string
  agreement_status: 'pending' | 'sent' | 'signed'
  creator_fee_aed: number
  our_fee_aed: number
  vat_aed: number
  total_aed: number
  fee_waived: boolean
  payment_method: 'card' | 'transfer' | null
  funded_at: string | null
  creator_paid_at: string | null
  created_at: string | null
}

export const morAdminApi = {
  payments: (): Promise<{ data: MorAdminPayment[] }> => jfetch(`${BASE}/payments`),

  setAgreement: (id: string, state: 'pending' | 'sent' | 'signed', agreement_url?: string) =>
    jfetch(`${BASE}/payments/${id}/agreement`, {
      method: 'POST', body: JSON.stringify({ state, agreement_url }),
    }),

  markFunded: (id: string) =>
    jfetch(`${BASE}/payments/${id}/funded`, { method: 'POST', body: '{}' }),

  markPaid: (id: string, payment_reference?: string) =>
    jfetch(`${BASE}/payments/${id}/paid`, {
      method: 'POST', body: JSON.stringify({ payment_reference }),
    }),

  waivers: (teamId: string): Promise<{ data: { waivers: MorWaiver[]; state: MorWaiverState } }> =>
    jfetch(`${BASE}/teams/${teamId}/waivers`),

  grantWaiver: (teamId: string, creators_allowed: number, valid_until: string, note?: string) =>
    jfetch(`${BASE}/teams/${teamId}/waivers`, {
      method: 'POST', body: JSON.stringify({ creators_allowed, valid_until, note }),
    }),

  revokeWaiver: (waiverId: string, reason?: string) =>
    jfetch(`${BASE}/waivers/${waiverId}/revoke`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
}
