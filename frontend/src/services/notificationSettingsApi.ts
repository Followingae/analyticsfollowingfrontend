import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// =============================================================================
// Types
// =============================================================================
export interface NotificationEvent {
  event_key: string
  label: string
  description: string
  domain: string
  audience: string
  email_enabled: boolean
  send_to_primary: boolean
  notify_all_superadmins: boolean
  recipient_user_ids: string[]
  recipient_emails: string[]
  subject_override: string | null
  configured: boolean
  updated_at: string | null
}

export interface EventsResponse {
  domains: string[]
  events: NotificationEvent[]
}

export interface RecipientCandidate {
  id: string
  email: string
  name: string
  role: string | null
  staff_role: string | null
}

export interface RuleUpdatePayload {
  email_enabled?: boolean
  send_to_primary?: boolean
  notify_all_superadmins?: boolean
  recipient_user_ids?: string[]
  recipient_emails?: string[]
  subject_override?: string | null
}

export interface EmailLogEntry {
  id: string
  event_key: string
  recipient_email: string
  reference_type: string | null
  reference_id: string | null
  subject: string | null
  status: string
  error: string | null
  created_at: string | null
}

// =============================================================================
// Service
// =============================================================================
class NotificationSettingsApiService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/v1/admin/notification-settings`

  async listEvents(): Promise<EventsResponse> {
    const res = await fetchWithAuth(`${this.baseUrl}/events`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to load notification events: ${await res.text()}`)
    return res.json()
  }

  async updateRule(eventKey: string, payload: RuleUpdatePayload): Promise<NotificationEvent> {
    const res = await fetchWithAuth(`${this.baseUrl}/events/${encodeURIComponent(eventKey)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Failed to save rule: ${await res.text()}`)
    return res.json()
  }

  async listRecipients(): Promise<RecipientCandidate[]> {
    const res = await fetchWithAuth(`${this.baseUrl}/recipients`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to load recipients: ${await res.text()}`)
    const data = await res.json()
    return data.recipients ?? []
  }

  async listLog(filters?: { event_key?: string; status?: string; limit?: number }): Promise<EmailLogEntry[]> {
    const params = new URLSearchParams()
    if (filters?.event_key) params.append('event_key', filters.event_key)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', String(filters.limit))
    const qs = params.toString()
    const res = await fetchWithAuth(`${this.baseUrl}/log${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to load log: ${await res.text()}`)
    const data = await res.json()
    return data.log ?? []
  }

  async sendTest(eventKey: string, body: { to: string; title?: string; message?: string }): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${this.baseUrl}/events/${encodeURIComponent(eventKey)}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Test email failed: ${await res.text()}`)
    return res.json()
  }
}

export const notificationSettingsApi = new NotificationSettingsApiService()
