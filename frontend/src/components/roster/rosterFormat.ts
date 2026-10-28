/**
 * How a roster row's money reads. One place, so the cell, the review dialog and the creator
 * panel never disagree about what "2,000 QAR, agreed 1,000" means.
 */
import type { ImdListCreator } from '@/services/imdListsApi'

export const BUNDLE_LABEL: Record<string, string> = {
  reel: 'Reel',
  reel_tt: 'Reel, also on TikTok',
  reel_tt_yt: 'Reel, also on TikTok and YouTube',
  reel_story: 'Reel and stories',
  story: 'Story',
  post: 'Post',
  tiktok: 'TikTok video',
  youtube: 'YouTube video',
  full_scope: 'Full scope',
}

export const CURRENCIES = ['AED', 'USD', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'EGP', 'INR', 'GBP', 'EUR']

export function amount(n: number | null | undefined, cur?: string | null): string {
  if (n == null) return ''
  const v = Number(n)
  const s = v >= 1000 && v % 1000 === 0 ? `${v / 1000}K` : v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return `${s} ${cur || 'AED'}`
}

export function aed(cents: number | null | undefined): string {
  if (cents == null) return ''
  return `AED ${Math.round(cents / 100).toLocaleString('en-US')}`
}

/** The price this row is working at: agreed if there is one, else what they asked. */
export function workingAed(c: ImdListCreator): number | null {
  const v = c.quote_agreed_aed_cents ?? c.quote_asked_aed_cents
  return v == null ? null : v / 100
}

/** Above the band on the brief, or well above what they agreed with us last time. */
export function priceFlags(c: ImdListCreator, bandMax?: number | null): { overBand: boolean; aboveLast: number | null } {
  const w = workingAed(c)
  const overBand = !!(w != null && bandMax && w > bandMax)
  const last = c.last_agreed_aed_cents != null ? c.last_agreed_aed_cents / 100 : null
  const aboveLast = w != null && last && w > last * 1.15 ? Math.round(((w - last) / last) * 100) : null
  return { overBand, aboveLast }
}
