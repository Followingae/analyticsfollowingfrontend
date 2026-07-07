import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export interface WhatsAppOverview {
  total_contacts: number
  sendable: number
  opted_out: number
  broadcasts: number
  templates: number
}

export interface WhatsAppContact {
  id: string
  phone: string
  full_name?: string | null
  instagram_handle?: string | null
  tags: string[]
  source: string
  marketing_consent: boolean
  opted_out_at?: string | null
  fa_member_id?: string | null
  last_sent_at?: string | null
  created_at: string
}

export interface TemplateVariable {
  index: string
  name?: string
  sample?: string
}

export interface WhatsAppTemplate {
  id: string
  name: string
  twilio_content_sid: string
  category: 'marketing' | 'utility' | 'authentication'
  language: string
  body_preview?: string | null
  variables: TemplateVariable[]
  status: 'active' | 'archived'
  approval_status?: string
  synced_at?: string | null
  created_at: string
}

export interface AudienceSpec {
  type: 'all_consented' | 'tags' | 'test'
  tags?: string[]
  test_phones?: string[]
}

export interface WhatsAppBroadcast {
  id: string
  name: string
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled'
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  scheduled_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  template_name?: string | null
  template_category?: string | null
}

export interface BroadcastAnalytics {
  total: number
  queued: number
  sent: number
  delivered: number
  read: number
  failed: number
  by_status: Record<string, number>
  delivery_rate: number
  read_rate: number
  fail_rate: number
  failures: { reason: string; error_code?: string | null; n: number }[]
}

export interface BroadcastRecipient {
  id: string
  phone: string
  status: string
  error_message?: string | null
  twilio_sid?: string | null
  sent_at?: string | null
  delivered_at?: string | null
  read_at?: string | null
  full_name?: string | null
  instagram_handle?: string | null
}

class WhatsAppApiService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/v1/admin/whatsapp`

  private async json<T>(res: Response, action: string): Promise<T> {
    if (!res.ok) throw new Error(`${action} failed: ${await res.text()}`)
    return res.json()
  }

  // ---- overview ----
  async overview(): Promise<WhatsAppOverview> {
    const res = await fetchWithAuth(`${this.baseUrl}/overview`, { headers: getAuthHeaders() })
    return this.json(res, 'Load overview')
  }

  // ---- contacts ----
  async listContacts(opts: { search?: string; only_sendable?: boolean; limit?: number; offset?: number } = {}) {
    const p = new URLSearchParams()
    if (opts.search) p.set('search', opts.search)
    if (opts.only_sendable) p.set('only_sendable', 'true')
    p.set('limit', String(opts.limit ?? 100))
    p.set('offset', String(opts.offset ?? 0))
    const res = await fetchWithAuth(`${this.baseUrl}/contacts?${p.toString()}`, { headers: getAuthHeaders() })
    return this.json<{ total: number; contacts: WhatsAppContact[] }>(res, 'Load contacts')
  }

  async importContacts(file: File) {
    const form = new FormData()
    form.append('file', file)
    // Don't set Content-Type — the browser sets the multipart boundary.
    const headers = { ...getAuthHeaders() } as Record<string, string>
    delete headers['Content-Type']
    const res = await fetchWithAuth(`${this.baseUrl}/contacts/import`, {
      method: 'POST', headers, body: form,
    })
    return this.json<{ success: boolean; imported: number; updated: number; skipped: number; rows_seen: number }>(res, 'Import contacts')
  }

  async addContact(body: { phone: string; full_name?: string; instagram_handle?: string; tags?: string[] }) {
    const res = await fetchWithAuth(`${this.baseUrl}/contacts`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
    })
    return this.json(res, 'Add contact')
  }

  async optOut(body: { contact_id?: string; phone?: string; opted_out: boolean }) {
    const res = await fetchWithAuth(`${this.baseUrl}/contacts/opt-out`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
    })
    return this.json(res, 'Update opt-out')
  }

  // ---- templates ----
  async listTemplates() {
    const res = await fetchWithAuth(`${this.baseUrl}/templates`, { headers: getAuthHeaders() })
    return this.json<{ templates: WhatsAppTemplate[] }>(res, 'Load templates')
  }

  async saveTemplate(body: {
    template_id?: string; name: string; twilio_content_sid: string
    category: string; language?: string; body_preview?: string; variables?: TemplateVariable[]
  }) {
    const res = await fetchWithAuth(`${this.baseUrl}/templates`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
    })
    return this.json(res, 'Save template')
  }

  async syncTemplates() {
    const res = await fetchWithAuth(`${this.baseUrl}/templates/sync`, {
      method: 'POST', headers: getAuthHeaders(),
    })
    return this.json<{ synced: number }>(res, 'Sync templates')
  }

  async archiveTemplate(templateId: string) {
    const res = await fetchWithAuth(`${this.baseUrl}/templates/${templateId}/archive`, {
      method: 'POST', headers: getAuthHeaders(),
    })
    return this.json(res, 'Archive template')
  }

  // ---- broadcasts ----
  async estimate(audience: AudienceSpec) {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts/estimate`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ audience }),
    })
    return this.json<{ recipients: number }>(res, 'Estimate audience')
  }

  async createBroadcast(body: {
    name: string; template_id: string; audience: AudienceSpec
    variable_values?: Record<string, string>; scheduled_at?: string
  }) {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
    })
    return this.json<{ id: string }>(res, 'Create broadcast')
  }

  async listBroadcasts() {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts`, { headers: getAuthHeaders() })
    return this.json<{ broadcasts: WhatsAppBroadcast[] }>(res, 'Load broadcasts')
  }

  async getBroadcast(id: string) {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts/${id}`, { headers: getAuthHeaders() })
    return this.json<WhatsAppBroadcast & Record<string, unknown>>(res, 'Load broadcast')
  }

  async sendBroadcast(id: string) {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts/${id}/send`, {
      method: 'POST', headers: getAuthHeaders(),
    })
    return this.json<{ status: string; total?: number }>(res, 'Send broadcast')
  }

  async broadcastAnalytics(id: string) {
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts/${id}/analytics`, { headers: getAuthHeaders() })
    return this.json<BroadcastAnalytics>(res, 'Load analytics')
  }

  async broadcastRecipients(id: string, status?: string) {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    const res = await fetchWithAuth(`${this.baseUrl}/broadcasts/${id}/recipients?${p.toString()}`, { headers: getAuthHeaders() })
    return this.json<{ recipients: BroadcastRecipient[] }>(res, 'Load recipients')
  }
}

export const whatsappApi = new WhatsAppApiService()
