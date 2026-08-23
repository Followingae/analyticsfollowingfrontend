/**
 * The client's plan builder — what the brand-facing proposal page calls.
 *
 * Sits alongside brandProposalViewApi rather than inside it: these are the calls that
 * record the client's own reading of a proposal (what they opened, who they turned down
 * and why), which is a different thing from fetching or confirming one.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals`

async function post(url: string, body?: unknown) {
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const planBuilderApi = {
  /** They opened this creator's numbers. Fire-and-forget: a failure here must never
   *  interrupt someone reading a profile. */
  opened: (proposalId: string, rowId: string) =>
    post(`${BASE}/${proposalId}/influencers/${rowId}/opened`).catch(() => null),

  /** Turning one creator down, with the reason attached to that creator. */
  decline: (proposalId: string, rowId: string, reason: string) =>
    post(`${BASE}/${proposalId}/influencers/${rowId}/decline`, { reason }),

  /** Taking a no back — nothing is final until they confirm. */
  undecline: (proposalId: string, rowId: string) =>
    post(`${BASE}/${proposalId}/influencers/${rowId}/undecline`),
}
