'use client'

/**
 * A phone number with its country chosen rather than guessed.
 *
 * WHAT THIS REPLACES. Every phone box in the product was free text with a `+971 50 000 0000`
 * placeholder, and the server filled in a country when it could not tell. It always guessed
 * the UAE, which rewrote a Saudi creator's number into a live UAE number belonging to
 * somebody else and sent them the WhatsApp with the signing link in it. See `dialCodes.ts`
 * for the full account; the fix is that nothing here infers a country.
 *
 * TWO RENDERERS, ONE SET OF RULES. The creator's enrolment deck is hand-styled dark rows
 * with right-aligned values and no shadcn in it at all; the brand's order form is shadcn on
 * the OKLCH theme. Forcing one widget into both would make one of them look borrowed, so the
 * parsing, validation and E.164 assembly live in `dialCodes.ts` and are shared, while the
 * two surfaces each render what belongs there. Neither is a wrapper around the other.
 *
 * THE COUNTRY PICKER IS A NATIVE `<select>` IN BOTH. On the creator's phone that opens the
 * OS picker, which beats any popover we could build: it scrolls correctly inside an animated
 * card deck, it takes keyboard input, and a screen reader already knows what it is. The
 * visible chrome is ours (a real SVG flag and the dial code); the select sits transparently
 * on top of it. Emoji flags were the alternative and render as bare letter pairs on Windows,
 * where the brand side actually sits.
 *
 * The value in and out is always E.164 (`+966551234567`) or an empty string.
 */

import { useMemo } from 'react'
import ReactCountryFlag from 'react-country-flag'
import {
  DEFAULT_ISO, PICKER_ORDER, countryByIso, fromE164, phoneProblem, toE164,
} from '@/lib/dialCodes'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export interface PhoneFieldProps {
  /** E.164, or '' when empty. */
  value: string
  onChange: (e164: string) => void
  /** Shown when the number is required and empty. */
  required?: boolean
  disabled?: boolean
  /** Overrides the country when `value` is empty. */
  defaultIso?: string
  'aria-label'?: string
}

/** Split once per render, so the picker opens on the country the stored number belongs to. */
function useParts(value: string, defaultIso?: string) {
  return useMemo(() => {
    const parsed = fromE164(value)
    // An empty field takes the caller's default; a populated one always takes the number's
    // own country, never the default, or editing somebody's Saudi number would silently
    // move it to the UAE on first keystroke.
    const iso = value ? parsed.iso : (defaultIso || DEFAULT_ISO)
    return { iso, national: parsed.national }
  }, [value, defaultIso])
}

/** The option list. Priority countries first, which `PICKER_ORDER` already does. */
function useOptions() {
  return useMemo(
    () => PICKER_ORDER.map((c) => ({ ...c, label: `${c.name} +${c.dial}` })),
    [],
  )
}

export function phoneFieldProblem(value: string, required = false): string | null {
  const { iso, national } = fromE164(value)
  return phoneProblem(iso, national, { required })
}

/* ─────────────────────────────────────────────────────────────────────────────────────
   The brand's side: shadcn, light, on the OKLCH theme.
   ───────────────────────────────────────────────────────────────────────────────────── */
export function PhoneField({
  value, onChange, disabled, defaultIso, required, ...rest
}: PhoneFieldProps) {
  const { iso, national } = useParts(value, defaultIso)
  const options = useOptions()
  const country = countryByIso(iso)

  return (
    <div className="flex items-stretch gap-2">
      <Select
        value={iso}
        disabled={disabled}
        onValueChange={(next: string) => onChange(toE164(next, national))}
      >
        <SelectTrigger className="w-[132px] shrink-0" aria-label="Country code">
          <SelectValue>
            <span className="flex items-center gap-2">
              <ReactCountryFlag countryCode={iso} svg style={{ width: 18, height: 13 }} />
              <span className="tabular-nums">+{country?.dial}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((c) => (
            <SelectItem key={`${c.iso}-${c.dial}`} value={c.iso} className="text-[13px]">
              <span className="flex items-center gap-2">
                <ReactCountryFlag countryCode={c.iso} svg style={{ width: 18, height: 13 }} />
                {c.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={national}
        disabled={disabled}
        inputMode="tel"
        autoComplete="tel-national"
        /* How many digits this country expects, rather than an example of somebody else's
           number. A UAE-shaped hint under a Saudi flag is what we are getting rid of. */
        placeholder={country?.nationalDigits?.length
          ? `${country.nationalDigits[0]} digits`
          : 'Number'}
        onChange={(e) => onChange(toE164(iso, e.target.value))}
        className="tabular-nums"
        aria-label={rest['aria-label'] || 'Phone number'}
        aria-required={required || undefined}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────────────
   The creator's side: the dark enrolment deck. Right-aligned to match every other row.
   ───────────────────────────────────────────────────────────────────────────────────── */
export function PhoneFieldDark({
  value, onChange, disabled, defaultIso, required, ...rest
}: PhoneFieldProps) {
  const { iso, national } = useParts(value, defaultIso)
  const options = useOptions()
  const country = countryByIso(iso)

  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
      {/* Our chrome, with the native select transparently over it. */}
      <span
        style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6,
          flex: 'none', padding: '4px 7px', borderRadius: 8,
          background: '#17171B', border: '1px solid #26262B',
        }}
      >
        <ReactCountryFlag countryCode={iso} svg style={{ width: 17, height: 12, borderRadius: 2 }} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          +{country?.dial}
        </span>
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden>
          <path d="M1 1l3.5 3.5L8 1" stroke="#8A8A93" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <select
          value={iso}
          disabled={disabled}
          onChange={(e) => onChange(toE164(e.target.value, national))}
          aria-label="Country code"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, appearance: 'none', border: 'none',
            /* 16px stops iOS Safari zooming the whole page when it gains focus. */
            fontSize: 16,
          }}
        >
          {options.map((c) => (
            <option key={`${c.iso}-${c.dial}`} value={c.iso}>{c.label}</option>
          ))}
        </select>
      </span>

      <input
        value={national}
        disabled={disabled}
        inputMode="tel"
        autoComplete="tel-national"
        onChange={(e) => onChange(toE164(iso, e.target.value))}
        aria-label={rest['aria-label'] || 'Phone number'}
        aria-required={required || undefined}
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#fff',
          fontFamily: 'inherit', padding: 0, minWidth: 0, textOverflow: 'ellipsis',
        }}
      />
    </span>
  )
}
