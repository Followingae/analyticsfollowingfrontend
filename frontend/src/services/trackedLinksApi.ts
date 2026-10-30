/**
 * Tracked links on a campaign: one short link per creator per retailer, clicks counted, sales
 * attributed.
 *
 * TWO COPIES OF ONE REPORT. The server builds ours and the brand's from the same function with
 * one flag changed. The brand's copy has no set-up in it at all: no retailer URLs, no sub-id
 * parameter, no postback, no raw orders. It is also `{ released: false }` and nothing else
 * until a superadmin releases it, so a page must never assume the totals are there.
 *
 * MONEY IS IN CENTS. `conversion_rate` is null when nobody has clicked yet, and null is not 0%.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export interface LinkTotals {
  clicks: number
  unique_clicks: number
  sales: number
  revenue_cents: number
  currency: string
  conversion_rate: number | null
  /** Ours only: sales we could not tie to any creator. */
  unattributed?: number
}

export interface DailyClicks { day: string; clicks: number; unique_clicks: number }
export interface CountryClicks { country: string; clicks: number }
export interface DeviceClicks { device: string; clicks: number }
export interface AppClicks { app: string; clicks: number }

export interface RetailerResult {
  id: string
  label: string
  clicks: number
  unique_clicks: number
  sales: number
  revenue_cents: number
}

interface ReportBase {
  released: boolean
  released_at: string | null
  totals: LinkTotals
  daily: DailyClicks[]
  by_country: CountryClicks[]
  by_device: DeviceClicks[]
  by_app: AppClicks[]
  by_retailer: RetailerResult[]
}

export interface Destination {
  id: string
  label: string
  url: string
  country: string | null
  click_param: string | null
  created_at: string
}

export interface TrackedLink {
  id: string
  code: string
  destination_id: string
  campaign_creator_id: string | null
  username: string | null
  full_name: string | null
  profile_pic_url: string | null
  followers_count: number | null
  target_url: string | null
  discount_code: string | null
  disabled: boolean
  created_at: string
  clicks: number
  unique_clicks: number
  last_click_at: string | null
  sales: number
  revenue_cents: number
  short_url: string
}

export interface RosterCreator {
  campaign_creator_id: string
  username: string | null
  full_name: string | null
  profile_pic_url: string | null
}

export interface Conversion {
  id: string
  link_id: string | null
  username: string | null
  retailer: string | null
  order_ref: string
  amount_cents: number | null
  currency: string | null
  occurred_at: string
  source: 'postback' | 'import' | 'manual' | string
}

export interface TeamLinksReport extends ReportBase {
  can_release: boolean
  destinations: Destination[]
  links: TrackedLink[]
  roster: RosterCreator[]
  conversions: Conversion[]
  postback_url: string
}

export interface BrandCreatorLink {
  username: string | null
  full_name: string | null
  profile_pic_url: string | null
  retailer: string | null
  short_url: string
  discount_code: string | null
  clicks: number
  unique_clicks: number
  sales: number
  revenue_cents: number
}

export type BrandLinksReport =
  | { released: false }
  | (ReportBase & { released: true; creators: BrandCreatorLink[] })

export interface DestinationInput {
  label: string
  url: string
  country?: string | null
  click_param?: string | null
}

export interface CodeRow {
  username: string
  retailer?: string
  discount_code?: string
  target_url?: string
}

export interface SaleRow {
  order_ref: string
  amount?: string | number | null
  currency?: string | null
  occurred_at?: string | null
  link_id?: string | null
  code?: string | null
  click_id?: string | null
  username?: string | null
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.detail || 'That did not work')
  return json.data as T
}

const send = (method: 'POST' | 'PATCH', v: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(v),
})

const A = '/api/v1/admin'

export const trackedLinksApi = {
  /** Ours: results plus everything needed to set the campaign up. */
  team: (campaignId: string) => call<TeamLinksReport>(`${A}/campaigns/${campaignId}/links`),

  /** Theirs: `{ released: false }` until a superadmin says otherwise. */
  brand: (campaignId: string) => call<BrandLinksReport>(`/api/v1/campaigns/${campaignId}/links`),

  addDestination: (campaignId: string, d: DestinationInput) =>
    call<{ id: string; links_made: number }>(`${A}/campaigns/${campaignId}/links/destinations`,
                                             send('POST', d)),

  editDestination: (destId: string, d: Partial<DestinationInput>) =>
    call<unknown>(`${A}/link-destinations/${destId}`, send('PATCH', d)),

  retireDestination: (destId: string) =>
    call<unknown>(`${A}/link-destinations/${destId}`, { method: 'DELETE' }),

  generate: (campaignId: string, destinationId?: string) =>
    call<{ links_made: number }>(`${A}/campaigns/${campaignId}/links/generate`,
                                 send('POST', destinationId ? { destination_id: destinationId } : {})),

  addLink: (campaignId: string, destinationId: string, label: string) =>
    call<{ id: string }>(`${A}/campaigns/${campaignId}/links`,
                         send('POST', { destination_id: destinationId, label })),

  editLink: (linkId: string, patch: { target_url?: string | null; discount_code?: string | null;
                                      disabled?: boolean }) =>
    call<unknown>(`${A}/tracked-links/${linkId}`, send('PATCH', patch)),

  importCodes: (campaignId: string, rows: CodeRow[]) =>
    call<{ updated: number; unmatched: string[] }>(`${A}/campaigns/${campaignId}/links/codes`,
                                                    send('POST', { rows })),

  addSale: (campaignId: string, sale: SaleRow) =>
    call<SalesResult>(`${A}/campaigns/${campaignId}/links/conversions`, send('POST', sale)),

  importSales: (campaignId: string, rows: SaleRow[]) =>
    call<SalesResult>(`${A}/campaigns/${campaignId}/links/conversions`, send('POST', { rows })),

  deleteSale: (convId: string) =>
    call<unknown>(`${A}/link-conversions/${convId}`, { method: 'DELETE' }),

  release: (campaignId: string, visible: boolean) =>
    call<{ visible: boolean }>(`${A}/campaigns/${campaignId}/links/release`,
                               send('POST', { visible })),
}

export interface SalesResult { stored: number; duplicates: number; unattributed: number }

/** 1234567 cents in AED -> "AED 12,345.67". Whole amounts drop the decimals. */
export function money(cents: number | null | undefined, currency = 'AED'): string {
  if (cents == null) return ''
  const v = cents / 100
  const whole = Number.isInteger(v)
  return `${currency} ${v.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
  })}`
}

export const count = (n: number | null | undefined): string =>
  n == null ? '' : n.toLocaleString('en-US')
