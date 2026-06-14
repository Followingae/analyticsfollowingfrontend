/**
 * Client Commercial & Document Lifecycle API (agency workflow — Phase 4)
 * Mirrors app/api/admin/client_commercial_routes.py. All manual (no Stripe/QuickBooks).
 */
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/utils/apiInterceptor';

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/clients`;

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

async function upload(url: string, file: File, extra?: Record<string, string>) {
  const form = new FormData();
  form.append('file', file);
  if (extra) for (const [k, v] of Object.entries(extra)) if (v != null) form.append(k, v);
  const res = await fetchWithAuth(url, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export interface ClientDocument {
  id: string; doc_type: string; version: number; is_current: boolean;
  status: string | null; file_url: string | null; file_name: string | null;
  notes: string | null; accepted_at: string | null; uploaded_at: string;
}

export interface CampaignInvoice {
  id: string; campaign_id: string | null; invoice_type: string;
  amount_aed: number | null; advance_pct: number | null; payment_terms: string | null;
  due_date: string | null; payment_link_url: string | null; invoice_file_url: string | null;
  status: string; amount_paid: number | null; paid_at: string | null;
  payment_reference: string | null; receipt_count: number; created_at: string;
}

export const clientCommercialApi = {
  // Documents / agreements
  listDocuments: (teamId: string, docType?: string) =>
    jfetch(`${BASE}/${teamId}/documents${docType ? `?doc_type=${docType}` : ''}`),
  uploadAgreement: (teamId: string, file: File, notes?: string, campaignId?: string) =>
    upload(`${BASE}/${teamId}/agreements`, file, { notes: notes || '', ...(campaignId ? { campaign_id: campaignId } : {}) }),
  sendAgreement: (teamId: string, docId: string) =>
    jfetch(`${BASE}/${teamId}/agreements/${docId}/send`, { method: 'POST', body: '{}' }),
  signAgreement: (teamId: string, docId: string, file?: File) => {
    const url = `${BASE}/${teamId}/agreements/${docId}/sign`;
    if (file) return upload(url, file);
    return jfetch(url, { method: 'POST', body: '{}' });
  },
  voidAgreement: (teamId: string, docId: string) =>
    jfetch(`${BASE}/${teamId}/agreements/${docId}/void`, { method: 'POST', body: '{}' }),

  // Invoices
  listInvoices: (teamId: string) => jfetch(`${BASE}/${teamId}/invoices`),
  createInvoice: (teamId: string, payload: Partial<CampaignInvoice>) =>
    jfetch(`${BASE}/${teamId}/invoices`, { method: 'POST', body: JSON.stringify(payload) }),
  uploadInvoiceFile: (teamId: string, invoiceId: string, file: File) =>
    upload(`${BASE}/${teamId}/invoices/${invoiceId}/file`, file),
  markInvoice: (teamId: string, invoiceId: string, payload: { status: string; amount_paid?: number; payment_reference?: string }) =>
    jfetch(`${BASE}/${teamId}/invoices/${invoiceId}/mark`, { method: 'POST', body: JSON.stringify(payload) }),
  addReceipt: (teamId: string, invoiceId: string, file: File, amount?: number) =>
    upload(`${BASE}/${teamId}/invoices/${invoiceId}/receipts`, file, amount != null ? { amount: String(amount) } : undefined),
};
