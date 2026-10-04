/**
 * Countries and their dial codes, for every place a phone number is typed.
 *
 * WHY THIS EXISTS. Every phone box in the product was free text with a `+971 50 000 0000`
 * placeholder, and the server guessed the country when it could not tell. The guess was
 * always the UAE, and the guess is silent, so:
 *
 *   - a Saudi creator typing `0551234567` became `+971551234567`. 050, 052, 054, 055, 056
 *     and 058 are live mobile prefixes in BOTH countries, so that is not an error, it is a
 *     real working UAE number belonging to a different person. The enrolment WhatsApp, which
 *     carries a personal link to sign an agreement and submit bank details, went to them.
 *   - a Qatari typing `33123456` became `+33123456`, which is French numbering space.
 *   - an Egyptian, Briton or Indian typing their local number became `+0...`, which cannot
 *     be dialled at all. One of the three mobile numbers already on file is this shape, and
 *     it belongs to a UAE creator who typed their own number with its leading zero.
 *
 * So the country is CHOSEN, never inferred, and what we store is E.164. A guess that is
 * usually right is worse than no guess, because nobody checks it.
 *
 * NO LIBRARY. `libphonenumber-js` is the correct general answer and is ~145KB, which is a
 * lot to put on a creator's phone on a page whose whole job is one short form. The seven
 * countries we actually contract in get real mobile-length rules below; everything else gets
 * a sane length range. If we ever need true per-country validation, swap this file, not the
 * call sites.
 */

export interface DialCountry {
  /** ISO 3166-1 alpha-2. Also what the flag component takes. */
  iso: string
  name: string
  /** Without the plus. */
  dial: string
  /**
   * How many digits the national part has, after any trunk zero is dropped. Empty means we
   * do not claim to know, and only a loose sanity check applies.
   */
  nationalDigits?: number[]
  /**
   * Leading digits a mobile number starts with nationally, after the trunk zero. Used only
   * to help, never to reject: landlines and new ranges exist and a creator who cannot submit
   * their own number is a creator we cannot pay.
   */
  mobileStarts?: string[]
}

/**
 * The countries Creator Payouts contracts in, pinned to the top of every picker.
 * Owner's list, 2026-10-04: UAE, Saudi, Kuwait, Qatar, Bahrain, Oman, Iraq.
 */
export const PRIORITY_ISO = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'IQ'] as const

/**
 * Deliberately not every country on earth, and deliberately more than seven. The seven are
 * who we pay; the rest are who a brand might need to reach, and a picker that cannot find
 * the number somebody is holding is the thing that sends them back to free text.
 */
export const DIAL_COUNTRIES: DialCountry[] = [
  // ── The seven we contract in ───────────────────────────────────────────────────────
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', nationalDigits: [9], mobileStarts: ['50', '52', '54', '55', '56', '58'] },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966', nationalDigits: [9], mobileStarts: ['50', '51', '53', '54', '55', '56', '57', '58', '59'] },
  { iso: 'KW', name: 'Kuwait', dial: '965', nationalDigits: [8], mobileStarts: ['5', '6', '9'] },
  { iso: 'QA', name: 'Qatar', dial: '974', nationalDigits: [8], mobileStarts: ['3', '5', '6', '7'] },
  { iso: 'BH', name: 'Bahrain', dial: '973', nationalDigits: [8], mobileStarts: ['3'] },
  { iso: 'OM', name: 'Oman', dial: '968', nationalDigits: [8], mobileStarts: ['7', '9'] },
  { iso: 'IQ', name: 'Iraq', dial: '964', nationalDigits: [10], mobileStarts: ['7'] },

  // ── Everywhere else, alphabetically ────────────────────────────────────────────────
  { iso: 'AU', name: 'Australia', dial: '61', nationalDigits: [9] },
  { iso: 'BD', name: 'Bangladesh', dial: '880', nationalDigits: [10] },
  { iso: 'BE', name: 'Belgium', dial: '32' },
  { iso: 'BR', name: 'Brazil', dial: '55', nationalDigits: [10, 11] },
  { iso: 'CA', name: 'Canada', dial: '1', nationalDigits: [10] },
  { iso: 'CH', name: 'Switzerland', dial: '41', nationalDigits: [9] },
  { iso: 'CN', name: 'China', dial: '86', nationalDigits: [11] },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'DK', name: 'Denmark', dial: '45', nationalDigits: [8] },
  { iso: 'EG', name: 'Egypt', dial: '20', nationalDigits: [10] },
  { iso: 'ES', name: 'Spain', dial: '34', nationalDigits: [9] },
  { iso: 'FR', name: 'France', dial: '33', nationalDigits: [9] },
  { iso: 'GB', name: 'United Kingdom', dial: '44', nationalDigits: [10] },
  { iso: 'GR', name: 'Greece', dial: '30', nationalDigits: [10] },
  { iso: 'ID', name: 'Indonesia', dial: '62' },
  { iso: 'IE', name: 'Ireland', dial: '353', nationalDigits: [9] },
  { iso: 'IN', name: 'India', dial: '91', nationalDigits: [10] },
  { iso: 'IT', name: 'Italy', dial: '39' },
  { iso: 'JO', name: 'Jordan', dial: '962', nationalDigits: [9] },
  { iso: 'JP', name: 'Japan', dial: '81', nationalDigits: [10] },
  { iso: 'KE', name: 'Kenya', dial: '254', nationalDigits: [9] },
  { iso: 'LB', name: 'Lebanon', dial: '961' },
  { iso: 'MA', name: 'Morocco', dial: '212', nationalDigits: [9] },
  { iso: 'MY', name: 'Malaysia', dial: '60' },
  { iso: 'NG', name: 'Nigeria', dial: '234', nationalDigits: [10] },
  { iso: 'NL', name: 'Netherlands', dial: '31', nationalDigits: [9] },
  { iso: 'NZ', name: 'New Zealand', dial: '64' },
  { iso: 'PH', name: 'Philippines', dial: '63', nationalDigits: [10] },
  { iso: 'PK', name: 'Pakistan', dial: '92', nationalDigits: [10] },
  { iso: 'PL', name: 'Poland', dial: '48', nationalDigits: [9] },
  { iso: 'PT', name: 'Portugal', dial: '351', nationalDigits: [9] },
  { iso: 'RU', name: 'Russia', dial: '7', nationalDigits: [10] },
  { iso: 'SE', name: 'Sweden', dial: '46' },
  { iso: 'SG', name: 'Singapore', dial: '65', nationalDigits: [8] },
  { iso: 'TH', name: 'Thailand', dial: '66', nationalDigits: [9] },
  { iso: 'TR', name: 'Turkey', dial: '90', nationalDigits: [10] },
  { iso: 'UA', name: 'Ukraine', dial: '380', nationalDigits: [9] },
  { iso: 'US', name: 'United States', dial: '1', nationalDigits: [10] },
  { iso: 'ZA', name: 'South Africa', dial: '27', nationalDigits: [9] },
]

/** Priority countries first, in the owner's order, then the rest as listed. */
export const PICKER_ORDER: DialCountry[] = [
  ...PRIORITY_ISO.map((iso) => DIAL_COUNTRIES.find((c) => c.iso === iso)!).filter(Boolean),
  ...DIAL_COUNTRIES.filter((c) => !PRIORITY_ISO.includes(c.iso as (typeof PRIORITY_ISO)[number])),
]

export const DEFAULT_ISO = 'AE'

export function countryByIso(iso?: string | null): DialCountry | undefined {
  if (!iso) return undefined
  const up = iso.toUpperCase()
  return DIAL_COUNTRIES.find((c) => c.iso === up)
}

/** Digits only. */
const digits = (v: string) => (v || '').replace(/\D/g, '')

/**
 * Drop a national trunk zero.
 *
 * Every country in the list above that uses a trunk prefix uses a single leading zero, and
 * people write their own number with it. `0551234567` in Saudi Arabia means `+966551234567`,
 * never `+9660551234567`.
 */
export function stripTrunk(national: string): string {
  const d = digits(national)
  return d.startsWith('0') ? d.replace(/^0+/, '') : d
}

/** `+966551234567` from a country and whatever the person typed. */
export function toE164(iso: string, national: string): string {
  const c = countryByIso(iso)
  const n = stripTrunk(national)
  if (!c || !n) return ''
  return `+${c.dial}${n}`
}

/**
 * Split a stored E.164 number back into a country and a national part, so an existing
 * number opens the picker on the right flag instead of being re-typed.
 *
 * Longest dial code first, because `+1` and `+971` and `+974` all begin with digits that
 * prefix one another. `US` and `CA` share `+1`; the first match wins and the person can
 * change it, which is the right trade for a field nobody edits twice.
 */
export function fromE164(value?: string | null): { iso: string; national: string } {
  const raw = (value || '').trim()
  if (!raw.startsWith('+')) {
    // Not E.164. Hand it back as a national number so it is visible and fixable rather than
    // silently dropped: a creator whose number we mangled should see what we hold.
    return { iso: DEFAULT_ISO, national: digits(raw) }
  }
  const d = digits(raw)
  const byLength = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of byLength) {
    if (d.startsWith(c.dial)) return { iso: c.iso, national: d.slice(c.dial.length) }
  }
  return { iso: DEFAULT_ISO, national: d }
}

/**
 * Why this number is not acceptable, or null when it is.
 *
 * `required: false` lets an empty value pass, because the creator's own mobile is optional
 * while the courier's number is not, and both use this.
 */
export function phoneProblem(
  iso: string,
  national: string,
  { required = false }: { required?: boolean } = {},
): string | null {
  const n = stripTrunk(national)
  if (!n) return required ? 'We need a phone number.' : null
  const c = countryByIso(iso)
  if (!c) return 'Pick a country.'

  // A known length is checked exactly, because a missing or extra digit is the error that
  // actually happens and it is invisible once the number is stored.
  if (c.nationalDigits?.length) {
    if (!c.nationalDigits.includes(n.length)) {
      const want = c.nationalDigits.join(' or ')
      return `A ${c.name} number has ${want} digits after +${c.dial}. This one has ${n.length}.`
    }
    return null
  }
  // Otherwise only the shape of a real number anywhere.
  if (n.length < 6) return 'That is too short to be a phone number.'
  if (n.length > 14) return 'That is too long to be a phone number.'
  return null
}
