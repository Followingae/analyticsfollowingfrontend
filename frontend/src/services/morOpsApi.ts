/**
 * The operator's side of Merchant of Record.
 * Mirrors the admin half of app/api/mor_payment_routes.py.
 *
 * AN ORDER IS A BATCH OR A SINGLE PAYMENT. The brand pays once per order, so the invoice, the
 * receipt and the transfer all hang off whichever of those it is, and every call here takes a
 * `kind` alongside the id. Creators hang off the order.
 *
 * This is the only client in the product allowed to see a creator's bank holder name and the
 * last four of their account, because settling a name mismatch means looking at what you are
 * settling. The brand's own client never receives either.
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

/**
 * A multipart POST. `fetchWithAuth` must not set a Content-Type here: the browser writes it
 * itself, including the boundary, and a hand-set header makes the body unparseable on the
 * other end.
 */
async function upload(url: string, file: File) {
  const body = new FormData()
  body.append('file', file)
  const res = await fetchWithAuth(url, { method: 'POST', body })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `That file did not upload (${res.status})`)
  }
  return res.json()
}

export type OrderKind = 'batch' | 'payment'

export interface MorOrder {
  kind: OrderKind
  id: string
  reference: string | null
  /** A batch's own label, or the creator's name on a single payment. */
  label: string | null
  status: string
  total_cents: number
  our_fee_cents: number
  created_at: string | null
  invoice_number: string | null
  invoice_attached_at: string | null
  receipt_attached_at: string | null
  /** Set when the creators were started on the brand's word, before the money landed. */
  advance_released_at: string | null
  client: string | null
  creators: number
  paid: number
}

export interface MorMismatch {
  id: string
  reference: string | null
  client: string | null
  /** What the brand said they were paying. */
  expected: string | null
  /** What the creator actually signed with. */
  signed: string | null
  name_checked_at: string | null
}

export interface MorReadyToPay {
  id: string
  reference: string | null
  client: string | null
  creator_name: string | null
  creator_fee_cents: number
  bank_holder: string | null
  bank_last4: string | null
}

export interface MorOpsMoney {
  owed_to_us: number
  received: number
  owed_to_creators: number
  paid_out: number
  our_margin: number
}

export interface MorOpsOverview {
  orders: MorOrder[]
  mismatches: MorMismatch[]
  ready_to_pay: MorReadyToPay[]
  money: MorOpsMoney
}

/** One creator on an order, as an operator needs to see them. */
export interface MorOrderCreator {
  id: string
  creator_name: string | null
  creator_handle: string | null
  creator_email: string | null
  creator_fee_cents: number
  status: string
  name_check: 'pending' | 'matched' | 'mismatch' | 'accepted' | 'rejected'
  name_check_note: string | null
  creator_paid_at: string | null
  payment_reference: string | null
  invite_sent_at: string | null
  invite_failed_reason: string | null
  first_opened_at: string | null
  expires_at: string | null
  signed_name: string | null
  signed_at: string | null
  bank_at: string | null
  bank_status: string | null
  bank_holder: string | null
  bank_last4: string | null
  verified_email: string | null
  /* The money, per creator. An order for six creators is six fees, six commissions and six
     lines of VAT, and the invoice is typed out of them one by one. */
  our_fee_cents: number
  our_fee_pct: string | number | null
  fee_waived: boolean
  vat_rate: string | number | null
  vat_cents: number
  total_cents: number
  /* What they actually bought. */
  deliverables: { what?: string; quantity?: number }[] | null
  usage_terms: string | null
  posting_dates: string | null
  brand_notes: string | null
}

/** Who to invoice, from the client's own billing record. */
export interface MorBilling {
  trn?: string | null
  legal_name?: string | null
  invoice_address?: string | null
  trade_licence_url?: string | null
  trade_licence_name?: string | null
  /** Fields the client never filled in. Chase them rather than invent a legal name. */
  missing: string[]
}

export interface MorOrderDetail {
  order: MorOrder & {
    submitted_at: string | null
    invoice_file_url: string | null
    receipt_file_url: string | null
    advance_proof_url: string | null
    advance_note: string | null
    payment_method: string | null
    vat_rate: string | null
  }
  money: {
    creator_fees_cents: number
    our_fee_cents: number
    vat_cents: number
    total_cents: number
  }
  billing: MorBilling
  creators: MorOrderCreator[]
}

export const morOpsApi = {
  overview: (): Promise<{ data: MorOpsOverview }> => jfetch(`${BASE}/overview`),

  creators: (kind: OrderKind, id: string): Promise<{ data: { creators: MorOrderCreator[] } }> =>
    jfetch(`${BASE}/orders/${kind}/${id}/creators`),

  /** One order with everything the invoice has to be typed out of. */
  detail: (kind: OrderKind, id: string): Promise<{ data: MorOrderDetail }> =>
    jfetch(`${BASE}/orders/${kind}/${id}`),

  /**
   * Store the invoice PDF and hand back its url, which `attachInvoice` then records.
   *
   * Two steps on purpose: uploading a file is not the same as declaring the invoice ready,
   * and it is the attach that tells the brand.
   */
  uploadInvoiceFile: (kind: OrderKind, id: string, file: File): Promise<{ data: { url: string; name: string } }> =>
    upload(`${BASE}/orders/${kind}/${id}/invoice-file`, file),

  /** The bank receipt, as a file. */
  uploadReceiptFile: (kind: OrderKind, id: string, file: File): Promise<{ data: { url: string; name: string } }> =>
    upload(`${BASE}/orders/${kind}/${id}/receipt-file`, file),

  /** Whatever the brand sent to show their payment is on its way. */
  uploadAdvanceProof: (kind: OrderKind, id: string, file: File): Promise<{ data: { url: string; name: string } }> =>
    upload(`${BASE}/orders/${kind}/${id}/advance-file`, file),

  /**
   * Start the creator side before the brand's money lands.
   *
   * NOT funding. The order stays owed to us and still wants the bank receipt; this only
   * contracts the creators early, and the payout run still refuses to pay them.
   */
  releaseEarly: (kind: OrderKind, id: string, proof_url: string, note: string) =>
    jfetch(`${BASE}/orders/${kind}/${id}/release-early`, {
      method: 'POST', body: JSON.stringify({ proof_url, note }),
    }) as Promise<{ data: { released: boolean; creators: number; invited: number } }>,

  /** Record the QuickBooks invoice. This is what moves the brand off "being prepared". */
  attachInvoice: (kind: OrderKind, id: string, invoice_number: string, invoice_file_url: string) =>
    jfetch(`${BASE}/orders/${kind}/${id}/invoice`, {
      method: 'POST',
      body: JSON.stringify({ invoice_number, invoice_file_url }),
    }),

  /**
   * The transfer landed. Attaching the receipt IS marking it received, and it is what sends
   * every creator on the order their enrolment link. The server refuses without a receipt.
   */
  markReceived: (kind: OrderKind, id: string, receipt_file_url: string) =>
    jfetch(`${BASE}/orders/${kind}/${id}/received`, {
      method: 'POST',
      body: JSON.stringify({ receipt_file_url }),
    }),

  /** Settle a name mismatch. Ours to decide, never the brand's. */
  settleName: (paymentId: string, accept: boolean, note?: string) =>
    jfetch(`${BASE}/payments/${paymentId}/name-check`, {
      method: 'POST',
      body: JSON.stringify({ accept, note }),
    }),

  /** Release one creator's money. Refused server-side if their details are unchecked. */
  markPaid: (paymentId: string, reference?: string) =>
    jfetch(`${BASE}/payments/${paymentId}/paid`, {
      method: 'POST',
      // ⚠️ `payment_reference`, not `reference`. The server reads that key and silently stored
      // no reference at all while this sent the other one.
      body: JSON.stringify({ payment_reference: reference }),
    }),

  /**
   * Who can be paid on this order right now, without their account numbers.
   * So the screen can offer "pay these nine" and show the same nine the file will contain.
   */
  payable: (kind: OrderKind, id: string): Promise<{ data: MorPayable }> =>
    jfetch(`${BASE}/orders/${kind}/${id}/payable`),

  /**
   * The payout file. A download, not a screen: it is the only place a full IBAN appears, so it
   * is fetched deliberately and never rendered.
   */
  payoutFile: async (kind: OrderKind, id: string, filename: string) => {
    const res = await fetchWithAuth(`${BASE}/orders/${kind}/${id}/payouts.xlsx`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Could not build the payout file.')
    }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  /**
   * Mark a whole payout run paid, with the one bank receipt covering it.
   * Anybody who fails the gate is skipped and named back, never silently dropped.
   */
  markPaidTogether: (
    kind: OrderKind, id: string,
    body: { payment_ids?: string[]; payment_reference: string; receipt_file_url?: string },
  ): Promise<{ data: MorPaidTogether }> =>
    jfetch(`${BASE}/orders/${kind}/${id}/paid`, { method: 'POST', body: JSON.stringify(body) }),
}

/** The payout run, as the screen is allowed to see it. */
export interface MorPayable {
  creators: Array<{
    id: string
    creator_name: string | null
    creator_handle: string | null
    creator_fee_cents: number
    bank_holder: string | null
  }>
  total_cents: number
}

export interface MorPaidTogether {
  paid: number
  skipped: Array<{ id: string; why: string }>
  paid_ids: string[]
  /** True when that was the last creator on the order, and the brand has been told. */
  order_complete: boolean
}

/** AED from fils. One formatter so the operator screen and the brand screen cannot disagree. */
export function aedFromCents(cents: number | null | undefined): string {
  if (cents == null) return '—'
  const n = cents / 100
  return `AED ${n.toLocaleString('en-AE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
