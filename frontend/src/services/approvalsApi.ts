/**
 * Approvals, and asking again about a decision that is waiting on somebody.
 * Mirrors app/api/approvals_routes.py.
 *
 * Why this is not the usual `jfetch`: two of this endpoint's replies are ANSWERS rather
 * than failures. A 404 says nothing is formally waiting on anybody, and a 429 says somebody
 * already asked this morning. Both are sentences a person should read calmly, and the house
 * `jfetch` turns every non-2xx into a thrown Error, which on screen becomes a red toast
 * that says the nudge broke. So the status is kept and handed back, and only a real failure
 * throws.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/approvals`

export interface NudgeSent {
  ok: true
  /** Who was emailed. The only identity we hold for an approver. */
  approver_email: string
  /** Which ask this was, this one included. */
  reminder_count: number
  /** "Asked once before", "Asked 3 times before", or null on the first nudge. */
  note: string | null
}

/** A 404 or a 429: the endpoint answered, and the answer is the sentence it sent. */
export interface NudgeAnswer {
  ok: false
  answer: string
}

export type NudgeResult = NudgeSent | NudgeAnswer

export const approvalsApi = {
  /**
   * Ask the person who decides to decide. `action` is optional: leave it out to nudge
   * whatever pending decision exists for that thing.
   *
   * Deliberately open to anybody on staff, because it decides nothing. It is rate limited
   * to one a day instead, which is why 429 is a normal reply and not an outage.
   */
  remind: async (
    entityType: string,
    entityId: string,
    action?: string,
  ): Promise<NudgeResult> => {
    const res = await fetchWithAuth(`${BASE}/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        ...(action ? { action } : {}),
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (res.status === 404 || res.status === 429) {
      return { ok: false, answer: body?.detail || 'Nothing is waiting on anybody for this.' }
    }
    if (!res.ok) throw new Error(body?.detail || `Could not send the reminder (${res.status})`)
    const d = body?.data ?? {}
    return {
      ok: true,
      approver_email: d.approver_email || '',
      reminder_count: Number(d.reminder_count) || 1,
      note: d.note ?? null,
    }
  },
}
