/**
 * The operator's side of Creator Contracting.
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
  /** What the amounts on this order mean. Three letters; AED when it was never chosen. */
  currency: string | null
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
  currency: string | null
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
  /**
   * The five headline figures.
   *
   * ⚠️ Only a real total while `money_mixed` is false. Orders in two currencies cannot be
   * added together, so when it is true the screen reads `money_split` instead.
   */
  money: MorOpsMoney
  /** The one currency everything is in, or null when there is more than one. */
  money_currency: string | null
  money_mixed: boolean
  money_split: Array<MorOpsMoney & { currency: string }>
}

/** One creator on an order, as an operator needs to see them. */
export interface MorOrderCreator {
  id: string
  creator_name: string | null
  creator_handle: string | null
  creator_email: string | null
  creator_fee_cents: number
  /** This creator's own currency. On a batch it matches the order's. */
  currency: string | null
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
  /* Their link, so a creator who is not answering email can be sent it another way. Staff
     only: the rule MoR is built on is that the BRAND never holds a token. */
  link_id: string | null
  token: string | null
  invite_email: string | null
  reported_at: string | null
  /* The second channel. Separate from the email's state because the two genuinely differ:
     an address can bounce while a number delivers. */
  invite_whatsapp: string | null
  /** The number on the order, which exists before any message has gone. */
  creator_whatsapp: string | null
  whatsapp_sent_at: string | null
  whatsapp_failed_reason: string | null
  /** Twilio's verdict once the receipt lands: queued, sent, delivered, read, failed. */
  whatsapp_status: string | null
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
  /* Everything the creator typed into their enrolment link. The full IBAN is never here:
     the payout file remains the only place it appears. */
  verified_mobile: string | null
  verified_handle: string | null
  date_of_birth: string | null
  email_verified_at: string | null
  details_at: string | null
  completed_at: string | null
  /** The full IBAN. Leadership only, and the screen it lands on is already gated. */
  bank_iban: string | null
  bank_swift: string | null
  bank_country: string | null
  bank_rejected_reason: string | null
  address_line: string | null
  address_city: string | null
  address_country: string | null
  address_phone: string | null
  address_maps_url: string | null
  agreed_terms: boolean | null
  agreed_electronic: boolean | null
  agreed_age: boolean | null
  signature_name: string | null
  sign_ip: string | null
  agreement_sha256: string | null
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

  /**
   * Re-price the order in another currency, before it has been invoiced.
   *
   * ⚠️ It relabels the amounts, it never converts them: 22,000 dirhams becomes 22,000
   * dollars. There is no exchange rate in this module and a made-up one would end up on an
   * invoice. The server refuses once an invoice is out, the money has arrived, or a creator
   * has signed.
   */
  setCurrency: (kind: OrderKind, id: string, currency: string) =>
    jfetch(`${BASE}/orders/${kind}/${id}/currency`, {
      method: 'POST', body: JSON.stringify({ currency }),
    }) as Promise<{ data: { currency: string; was?: string; changed: boolean } }>,

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
  /**
   * Send a creator their link again, optionally to a corrected address.
   *
   * The state this fixes is an invite that bounced, or one that went to an address the brand
   * typed wrong. Without it the only remedy was somebody with database access.
   */
  resendInvite: (paymentId: string, email?: string): Promise<{ data: { sent: boolean; whatsapp: boolean; to: string } }> =>
    jfetch(`${BASE}/payments/${paymentId}/resend-invite`, {
      method: 'POST', body: JSON.stringify({ email: email || null }),
    }),

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

/**
 * Minor units to a written amount. One formatter so the operator screen and the brand
 * screen cannot disagree.
 *
 * Takes the order's currency; defaults to AED only when none was given. Every supported
 * currency has two minor digits, which is what lets one divisor serve all of them.
 */
export function aedFromCents(cents: number | null | undefined, ccy?: string | null): string {
  if (cents == null) return '—'
  const code = (ccy || 'AED').toUpperCase()
  const n = cents / 100
  return `${code} ${n.toLocaleString('en-AE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
