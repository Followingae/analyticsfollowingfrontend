'use client'

/**
 * Which country an address is in.
 *
 * Shares its list and its chrome with the phone picker next door, because a creator should
 * not meet two different country controls on one form, and because the one spelling of a
 * country in this product is now the ISO alpha-2 code both of these emit.
 *
 * It replaces nothing visible: there was no country control at all. The enrolment wrote the
 * literal string "United Arab Emirates" on submit whatever the creator did, which is why
 * every address on file says UAE.
 *
 * Native `<select>` under our own chrome, for the same reasons as the phone field: the OS
 * picker on a phone, real keyboard and screen reader behaviour, and nothing to go wrong
 * inside an animated card deck.
 */

import ReactCountryFlag from 'react-country-flag'
import { PICKER_ORDER, countryByIso } from '@/lib/dialCodes'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export interface CountrySelectProps {
  /** ISO 3166-1 alpha-2, or '' when nothing is chosen yet. */
  value: string
  onChange: (iso: string) => void
  disabled?: boolean
  'aria-label'?: string
}

/** The dark enrolment deck. Right aligned, to sit in a Row like every other value. */
export function CountrySelectDark({ value, onChange, disabled, ...rest }: CountrySelectProps) {
  const iso = (value || '').toUpperCase()
  const country = countryByIso(iso)

  return (
    <span
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '4px 8px', borderRadius: 8,
        background: '#17171B', border: '1px solid #26262B', maxWidth: '100%',
      }}
    >
      {iso
        ? <ReactCountryFlag countryCode={iso} svg style={{ width: 17, height: 12, borderRadius: 2, flex: 'none' }} />
        : <span style={{ width: 17, height: 12, borderRadius: 2, background: '#26262B', flex: 'none' }} />}
      <span style={{
        fontSize: 14, fontWeight: 700, color: country ? '#fff' : '#6E6E77',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {country?.name || 'Choose'}
      </span>
      <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden style={{ flex: 'none' }}>
        <path d="M1 1l3.5 3.5L8 1" stroke="#8A8A93" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <select
        value={iso}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={rest['aria-label'] || 'Country'}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, appearance: 'none', border: 'none',
          /* 16px, or iOS Safari zooms the page when it takes focus. */
          fontSize: 16,
        }}
      >
        <option value="">Choose a country</option>
        {PICKER_ORDER.map((c) => (
          <option key={c.iso} value={c.iso}>{c.name}</option>
        ))}
      </select>
    </span>
  )
}

/** The shadcn surfaces. */
export function CountrySelect({ value, onChange, disabled, ...rest }: CountrySelectProps) {
  const iso = (value || '').toUpperCase()
  return (
    <Select value={iso} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={rest['aria-label'] || 'Country'}>
        <SelectValue placeholder="Choose a country" />
      </SelectTrigger>
      <SelectContent>
        {PICKER_ORDER.map((c) => (
          <SelectItem key={c.iso} value={c.iso} className="text-[13px]">
            <span className="flex items-center gap-2">
              <ReactCountryFlag countryCode={c.iso} svg style={{ width: 18, height: 13 }} />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Whether this country needs a state and a postcode on an address.
 *
 * Not a complete model of the world's addressing, and not trying to be. It is the difference
 * between a form that is impossible to fill in correctly and one that is merely imperfect:
 * a US address without a state is invalid, a UK one without a postcode is not deliverable,
 * and the UAE has neither, which is why neither field existed until now.
 */
export const ADDRESS_SHAPE: Record<string, { state?: 'state' | 'province' | 'county'; postcode?: boolean }> = {
  AE: {},                                   // no states, no postcodes
  SA: { postcode: true },
  KW: { postcode: true },
  QA: {},
  BH: {},
  OM: { postcode: true },
  IQ: { postcode: true },
  US: { state: 'state', postcode: true },
  CA: { state: 'province', postcode: true },
  IN: { state: 'state', postcode: true },
  AU: { state: 'state', postcode: true },
  GB: { postcode: true },
  EG: { postcode: true },
}

export function addressShape(iso?: string | null) {
  const s = ADDRESS_SHAPE[(iso || '').toUpperCase()]
  if (s) return { state: s.state, postcode: !!s.postcode }
  // Anywhere we have not thought about: ask for a postcode, because most of the world has
  // one and an optional empty box is cheaper than an undeliverable address.
  return { state: undefined as 'state' | 'province' | 'county' | undefined, postcode: true }
}
