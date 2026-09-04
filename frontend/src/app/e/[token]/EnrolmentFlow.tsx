'use client'

/**
 * The creator's enrolment page, ported from the Claude Design canvas
 * "Digital Creator Enrolment".
 *
 * The design is a card deck: four steps, swipeable, each one a gradient card that ticks
 * over as it is finished, plus a run of edge states around it. That structure is kept
 * exactly, including the motion, the gradients and the copy. What changes is that every
 * step now talks to the API and can fail, which a mock cannot.
 *
 * Three things the design did not have to deal with and this does.
 *
 * ORDER IS NOT FIXED. The mock always ran email, sign, bank, address. A real link may have
 * bank or address switched off by whoever created it, and a returning creator may have
 * finished two of the four already. The deck is built from `steps` and `done` off the API,
 * so a three-step link renders three cards rather than four with one stuck.
 *
 * NOTHING IS TYPED TWICE. The mock showed finished values as static text. Here each step is
 * a real form that keeps what the creator entered, so coming back to a step shows what they
 * put in rather than a placeholder.
 *
 * THE SERVER DECIDES. Age, IBAN checksum and completion are all checked server side and the
 * screen renders what comes back. The under-18 screen appears because the API refused, not
 * because the browser did arithmetic on a date.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_CONFIG } from '@/config/api'
import { InlineMapPicker, mapsAvailable, type PickedPlace } from './LocationPicker'

const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/enrolment`

// ---------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------
type StepKey = 'email' | 'sign' | 'bank'

interface PaymentTerm { pct?: number; label?: string; amount_aed_cents?: number }

interface Submitted {
  full_name?: string | null
  email?: string | null
  mobile?: string | null
  instagram_handle?: string | null
  email_verified_at?: string | null
  date_of_birth?: string | null
  signed_at?: string | null
  bank_holder?: string | null
  bank_last4?: string | null
  bank_country?: string | null
  bank_status?: string | null
  address_line?: string | null
  address_city?: string | null
  address_country?: string | null
  address_phone?: string | null
  address_lat?: number | null
  address_lng?: number | null
  address_maps_url?: string | null
  address_at?: string | null
  completed_at?: string | null
  has_agreement?: boolean
}

interface Payload {
  view: 'flow' | 'receipt' | 'expired' | 'cancelled' | 'notme'
  brand?: string | null
  campaign?: string | null
  creator_handle?: string | null
  creator_name?: string | null
  deliverables_summary?: string | null
  fee_aed_cents?: number | null
  submit_by?: string | null
  usage_terms?: string | null
  payment_terms?: PaymentTerm[]
  product_sent?: boolean
  agreement_version?: number
  agreement_body?: string
  steps?: StepKey[]
  wants_address?: boolean
  ready_to_submit?: boolean
  completed_count?: number
  step_count?: number
  done?: Record<StepKey, boolean>
  retract_reason?: string | null
  talent_name?: string | null
  submitted?: Submitted
}

// ---------------------------------------------------------------------------------------
// The design's tokens, verbatim
// ---------------------------------------------------------------------------------------
const GRAD: Record<StepKey | 'addr', string> = {
  email: 'linear-gradient(160deg,#0A6BFF,#5FE0FF)',
  sign: 'linear-gradient(160deg,#FF3D00,#FF9500)',
  bank: 'linear-gradient(160deg,#0E7A3A,#1FD16B)',
  // Kept although there is no `addr` card any more: the celebration and receipt screens
  // still use this gradient as the delivery colour, and it is the design's own value.
  addr: 'linear-gradient(160deg,#A63DE8,#FF7AD9)',
}

const DEFS: Record<StepKey, { kick: string; title: string; meta: string; big: string; sub: string }> = {
  email: { kick: 'STEP 01', title: 'Your\ndetails', meta: 'Name, email, address', big: 'Your details', sub: 'So we can reach you' },
  sign: { kick: 'STEP 02', title: 'Sign the\nagreement', meta: '2 minutes', big: 'Sign the deal', sub: 'The terms in short' },
  bank: { kick: 'STEP 03', title: 'Where money\nlands', meta: 'IBAN and name', big: 'Where money lands', sub: 'Your bank account' },
}

const CONF_COLS = ['#0A6BFF', '#FF9500', '#1FD16B', '#FF7AD9']

const money = (cents?: number | null) =>
  cents == null ? null : `AED ${(cents / 100).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`

const niceDate = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** A sticker that fails to nothing rather than leaving a broken-image glyph mid-page. */
function Sticker({ src, style, className }: { src: string; style: React.CSSProperties; className?: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={style} className={className} onError={() => setOk(false)} />
}

/** The design's own wordmark, black, inverted to white exactly as the design does it. */
function Logo({ h = 15, className = '' }: { h?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/enrolment/following-logo.png" alt="Following"
              style={{ height: h, width: 'auto', filter: 'invert(1)', opacity: 0.95 }} className={className} />
}

/** The Inflink wordmark. The design uses it in three places on the phone and a text
 *  substitute is not the mark: it is a different typeface at a different weight. */
function InflinkLogo({ h = 16, opacity = 1 }: { h?: number; opacity?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/enrolment/inflink-logo-white.png" alt="Inflink"
              style={{ height: h, width: 'auto', display: 'block', opacity }} />
}

/**
 * The phone shell and the header that sits on top of EVERY screen.
 *
 * Both are declared at module scope, and that is load bearing rather than tidiness. They
 * used to be arrow functions inside the component, which makes React see a NEW component
 * type on every render: the whole subtree unmounts and remounts, so a step form lost the
 * values somebody had just typed the moment any parent state changed.
 *
 * In the design the header sits OUTSIDE every `sc-if`, so it renders on all ten screens.
 * It carries z-index 9 and the screens are absolutely positioned with no z-index of their
 * own, which is what lets a full bleed splash pass underneath it rather than over it.
 */
function Shell({ children, head = true, animKey }: {
  children: React.ReactNode; head?: boolean; animKey?: string
}) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#050506', color: '#fff',
      fontFamily: "'Urbanist', system-ui, -apple-system, 'Segoe UI', sans-serif",
      display: 'flex', justifyContent: 'center',
    }}>
      <style>{keyframes}</style>
      <div style={{ width: '100%', maxWidth: 430, position: 'relative', overflow: 'hidden', minHeight: '100dvh' }}>
        {head && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px 0', position: 'relative', zIndex: 9,
          }}>
            <Logo />
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.03em', color: '#9A9AA2' }}>
              Digital Creator Enrolment
            </div>
          </div>
        )}
        {/* `key` on the moving part, so React swaps the node and the entrance animation
            replays. Without it the element is reused and the keyframe never runs again,
            which is why the screens snapped rather than arrived.

            OPACITY ONLY, deliberately. Half these screens position themselves with
            `inset: 0` against the container above, and any non-none transform on this
            wrapper would make IT their containing block for the 0.42s the animation runs,
            so the splash would lay itself out against a shrink-wrapped box and jump into
            place when the animation ended. The per-element rise still happens: the design's
            own dFade keyframes do it on the content inside. */}
        <div key={animKey} style={{ animation: 'eScreen .34s ease both' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------
// Small pieces of the design's chrome
// ---------------------------------------------------------------------------------------
const BAD = '#FF7A5C'

/**
 * One row of a card. Turns red and explains itself when the value in it is wrong.
 *
 * The error lives ON the row rather than in a summary at the bottom, because a creator
 * looking at four fields needs to know WHICH one, and a list of messages under a form is a
 * second thing to map back onto the first.
 */
const Row = ({ icon, label, children, last, error }: {
  icon: React.ReactNode; label: string; children: React.ReactNode; last?: boolean; error?: string | null
}) => (
  <div style={{ borderBottom: last ? 'none' : '1px solid #1E1E22' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', minHeight: 44 }}>
      <span style={{ flex: 'none', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: error ? BAD : '#8A8A93', flex: 'none' }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>{children}</span>
    </div>
    {error && (
      <div style={{
        padding: '0 16px 11px', fontSize: 12.5, fontWeight: 600, color: BAD,
        textAlign: 'right', lineHeight: 1.4, animation: 'eFade .22s ease both',
      }}>{error}</div>
    )}
  </div>
)

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#fff',
  fontFamily: 'inherit', padding: 0, minWidth: 0,
  // A long value must shorten itself rather than grow the row and shove the label off the
  // left edge, which is what "Building, street, apartment" did on a 390px screen.
  textOverflow: 'ellipsis',
}

/**
 * The button at the bottom of a step.
 *
 * `disabled` is used ONLY while a request is in flight. A greyed out button that will not
 * say why is the thing this page was doing wrong: somebody fills in three of four fields,
 * presses nothing, and has to guess. So the button stays live, and pressing it with an
 * invalid form is what reveals the errors.
 */
const CTA = ({ onClick, disabled, busy, children, tone = 'light', muted }: {
  onClick?: () => void; disabled?: boolean; busy?: boolean; children: React.ReactNode
  tone?: 'light' | 'dark'; muted?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled || busy}
    style={{
      width: '100%', marginTop: 16, borderRadius: 20, padding: 18, textAlign: 'center',
      fontSize: 16.5, fontWeight: 700, minHeight: 44, border: 'none',
      cursor: (disabled || busy) ? 'default' : 'pointer', fontFamily: 'inherit',
      background: muted ? '#1C1C20' : tone === 'light' ? '#fff' : '#17171A',
      color: muted ? '#5E5E66' : tone === 'light' ? '#050506' : '#fff',
      opacity: busy ? 0.7 : 1,
      transition: 'background .2s ease, color .2s ease, opacity .2s ease',
    }}
  >
    {busy ? 'One moment…' : children}
  </button>
)

const ErrLine = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <div style={{
      marginTop: 12, fontSize: 12.5, fontWeight: 700, color: BAD, lineHeight: 1.4,
      animation: 'eFade .22s ease both',
    }}>{children}</div>
  ) : null

// ---------------------------------------------------------------------------------------
// Validation, in one place so the four steps cannot disagree about what "valid" means.
// Each returns the message to show, or null.
// ---------------------------------------------------------------------------------------
/**
 * The API's error codes, as sentences.
 *
 * The public routes answer with machine strings: `email_not_verified`, `code_wrong`,
 * `link_expired`. Those are for logs and for this map. Putting one on screen shouts
 * EMAIL_NOT_VERIFIED at somebody who was trying to sign a contract, which is what happened,
 * and it is worse than saying nothing because it reads like the page broke.
 *
 * Anything not listed falls through to its own text, so a message the server writes for a
 * human (the IBAN checksum line, for instance) still reaches them unchanged.
 */
const SAYS: Record<string, string> = {
  email_not_verified: 'Confirm your email first. It is how we know this agreement is yours.',
  invalid_email: 'That does not look like an email address.',
  no_email_yet: 'Enter your details first.',
  no_code: 'We have not sent you a code yet.',
  code_wrong: 'That code is not right. Check the email again.',
  code_expired: 'That code has expired. Ask for a new one.',
  code_used: 'That code has already been used. Ask for a new one.',
  too_many_attempts: 'Too many tries. Ask for a new code.',
  too_many_codes: 'Too many codes requested. Wait a few minutes and try again.',
  already_signed: 'You have already signed this one.',
  not_all_agreed: 'Tick all three to sign.',
  invalid_dob: 'Please check your date of birth.',
  under_18: 'You need to be 18 or older to sign a campaign agreement.',
  not_signed: 'Nothing has been signed yet.',
  link_expired: 'This link has expired. Ask whoever sent it for a new one.',
  link_not_live: 'This link is not active. Ask whoever sent it for a new one.',
  link_not_found: 'This link does not work. Check with whoever sent it.',
  link_reported: 'This link has been closed.',
}
const saysWhat = (detail: unknown) =>
  typeof detail === 'string'
    ? (SAYS[detail] ?? (/^[a-z0-9_]+$/.test(detail)
        // An unmapped machine code is a bug in this map, not copy. Never show it.
        ? 'That did not go through. Try again.'
        : detail))
    : 'That did not go through. Try again.'

const vName = (v: string) =>
  !v.trim() ? 'We need your name for the agreement.'
    : v.trim().length < 2 ? 'That looks too short.'
      : !v.trim().includes(' ') ? 'Please give your full name, first and last.' : null

const vEmail = (v: string) =>
  !v.trim() ? 'We need an email to send your agreement to.'
    : !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v.trim()) ? 'That does not look like an email address.' : null

const vMobile = (v: string) =>
  !v.trim() ? null
    : v.replace(/[^\d]/g, '').length < 7 ? 'That does not look like a phone number.' : null

const vDob = (v: string) => {
  if (!v) return 'We need your date of birth to sign an agreement with you.'
  const d = new Date(v)
  if (isNaN(d.getTime())) return 'That is not a real date.'
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  if (age < 0) return 'That date is in the future.'
  // Said here as well as on the server. The server is what actually refuses; this is so
  // nobody fills in a signature and a bank account before being told.
  if (age < 18) return 'You need to be 18 or older to sign a campaign agreement.'
  if (age > 100) return 'Please check that date.'
  return null
}

/** ISO 13616 mod-97, the same check the server runs, so the answer matches. */
const ibanValid = (raw: string) => {
  const c = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(c)) return false
  const r = c.slice(4) + c.slice(0, 4)
  let rem = 0
  for (const ch of r) rem = (rem * (ch >= '0' && ch <= '9' ? 10 : 100) + parseInt(ch, 36)) % 97
  return rem === 1
}

const vIban = (v: string) => {
  const c = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (!c) return 'We need an IBAN to pay you.'
  if (c.length < 15) return 'An IBAN is at least 15 characters.'
  if (c.length > 34) return 'That is longer than any IBAN.'
  if (c.startsWith('AE') && c.length !== 23) return `A UAE IBAN is 23 characters, this one is ${c.length}.`
  if (!ibanValid(c)) return 'That IBAN does not pass the checksum. Check it for a typo.'
  return null
}

// Icons, traced from the design's own inline SVG so nothing shifts by a pixel.
const I = {
  user: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0114 0" /></svg>,
  mail: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>,
  phone: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18h2" /></svg>,
  at: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" /></svg>,
  bank: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9l8-4.5L20 9M5 9v9h14V9M8 12v3M12 12v3M16 12v3M4 19.5h16" /></svg>,
  pin: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.4-7-11a7 7 0 0114 0c0 5.6-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  city: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V8l6-4v16M10 20V11h10v9M4 20h17M13.5 14h3M13.5 17h3" /></svg>,
  shield: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7E7E87" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>,
  box: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7E7E87" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6.5" width="12" height="11" rx="2.5" /><path d="M15 10.5l6-3v9l-6-3" /></svg>,
  doc: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l5 5v12a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 016 20V4.5A1.5 1.5 0 017.5 3z" /><path d="M14 3v5h5" /></svg>,
  chev: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5E5E66" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>,
  left: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>,
  right: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>,
  wallet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1FD16B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="6" width="17" height="13" rx="3" /><path d="M3.5 9h13a1.5 1.5 0 010 3h-13" /></svg>,
  tick: (stroke = '#0B0B0C', w = 3) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  star: (size: number, fill: string) => <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}><path d="M12 2l2.1 6.4L20.5 12l-6.4 2.1L12 22l-2.1-7.9L3.5 12l6.4-3.6L12 2z" /></svg>,
}

// ---------------------------------------------------------------------------------------
export default function EnrolmentFlow({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<'splash' | 'deck' | 'step' | 'done' | 'app' | 'under' | 'agreement'>('splash')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<StepKey | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  // Live finger offset while dragging the deck, in px. Null when not dragging, which is
  // also what re-enables the CSS transition so the release snaps instead of jumping.
  const [drag, setDrag] = useState<number | null>(null)
  const dragFrom = useRef<{ x: number; y: number } | null>(null)
  // Why a locked card sent you somewhere else. Shown at the top of the step it sent you to.
  const [gate, setGate] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${PUBLIC}/${token}`)
      const j = await r.json()
      setData(j?.data ?? { view: 'expired' })
    } catch {
      setData({ view: 'expired' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const steps = useMemo<StepKey[]>(() => (data?.steps?.length ? data.steps : ['email', 'sign', 'bank']), [data])
  const done = data?.done ?? ({} as Record<StepKey, boolean>)
  const count = steps.filter((s) => done[s]).length
  // Every step saved but nothing submitted yet. The server is the authority; the
  // local fallback keeps the button honest between a save and the next payload.
  const ready = data?.ready_to_submit ?? (count === steps.length && !data?.submitted?.completed_at)

  // The first unfinished card, so a creator coming back lands where they stopped rather
  // than on a card they already ticked.
  useEffect(() => {
    if (!data || screen !== 'splash') return
    const i = steps.findIndex((s) => !done[s])
    setActive(i < 0 ? 0 : i)
  }, [data, steps, done, screen])

  const post = useCallback(async (path: string, body?: unknown) => {
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`${PUBLIC}/${token}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (r.status === 451) { setScreen('under'); return { ok: false as const } }
        // FastAPI puts a machine code in `detail`. `saysWhat` turns it into a sentence; a
        // code that reaches the screen is a bug in that map, not a message.
        setErr(saysWhat(j?.detail))
        // A link that died under them, or an identity gate, is not a field level problem.
        // Re-reading the link puts the page on the right screen instead of leaving them on
        // a form that can no longer be submitted.
        if (r.status === 410 || j?.detail === 'email_not_verified') await load()
        return { ok: false as const }
      }
      if (j?.data) setData(j.data)
      return { ok: true as const, data: j?.data as Payload | undefined }
    } catch {
      setErr('No connection. Check your signal and try again.')
      return { ok: false as const }
    } finally {
      setBusy(false)
    }
  }, [token])

  /**
   * Open a card.
   *
   * The deck lets you tap any step in any order, and that is right: it is a deck, not a
   * wizard. But three of the four steps cannot be WRITTEN until the email behind them is
   * confirmed, because an agreement signed by an unverified address is signed by nobody,
   * and bank details from an unverified address are the exact fraud a forwarded link
   * invites. The server refuses those writes and always will.
   *
   * So the gate is honest here instead of being discovered at the bottom of a filled in
   * form. Tapping a locked card says why in a sentence and takes you to the step that
   * unlocks it, rather than opening a form that cannot be submitted.
   */
  const openStep = useCallback((k: StepKey) => {
    setErr(null)
    const verified = !!data?.submitted?.email
      && !!(data as Payload & { submitted?: { email_verified_at?: string | null } })
        .submitted?.email_verified_at
    if (k !== 'email' && !verified && !done.email) {
      setGate('Confirm your email first. It is how we know the agreement is yours.')
      setOpen('email')
      setActive(steps.indexOf('email') < 0 ? 0 : steps.indexOf('email'))
      setScreen('step')
      return
    }
    setGate(null)
    setOpen(k)
    setActive(steps.indexOf(k) < 0 ? active : steps.indexOf(k))
    setScreen('step')
  }, [data, done, steps, active])

  const advance = useCallback((justDone: StepKey, fresh?: Payload) => {
    const d2 = fresh?.done ?? {}
    const nowDone = { ...done, ...d2, [justDone]: true } as Record<StepKey, boolean>
    const next = steps.find((k) => !nowDone[k])
    if (!next) {
      // Everything is saved. Back to the deck, where the button is now green and says
      // Submit. Deliberately NOT straight to the celebration: nothing is submitted until
      // they say so, and jumping past that would be the old silent behaviour again.
      setOpen(null); setGate(null); setScreen('deck')
      setActive(steps.length - 1)
      return
    }
    // Straight into the next card's form. Bouncing back to the deck between every step
    // makes somebody tap twice to carry on with a thing they are already doing.
    setGate(null); setErr(null)
    setOpen(next)
    setActive(steps.indexOf(next))
    setScreen('step')
  }, [done, steps])

  if (loading) {
    return <Shell><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#5E5E66', fontSize: 14 }}>Loading…</div></Shell>
  }

  const d = data as Payload
  const sub = d.submitted ?? {}

  // ---- edge states -------------------------------------------------------------------
  if (d.view === 'expired') {
    return (
      <Shell animKey="expired">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 44px', textAlign: 'center' }}>
          <div style={{ width: 66, height: 66, borderRadius: 22, background: '#17171A', display: 'grid', placeItems: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.025em', marginTop: 22 }}>This link does not work</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#8A8A93', marginTop: 10, lineHeight: 1.55 }}>Check with whoever sent it to you.</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 32, display: 'flex', justifyContent: 'center' }}>
          <InflinkLogo h={17} opacity={0.4} />
        </div>
      </Shell>
    )
  }

  if (d.view === 'cancelled' || d.view === 'notme') {
    const isNotMe = d.view === 'notme'
    return (
      <Shell animKey="dead">
        <div style={{ padding: '60px 30px 0', textAlign: 'center' }}>
          <div style={{ width: 66, height: 66, borderRadius: 22, background: '#17171A', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.025em', marginTop: 22, lineHeight: 1.16 }}>
            {isNotMe ? <>This link has<br />been closed</> : <>This campaign was<br />cancelled</>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#8A8A93', marginTop: 12, lineHeight: 1.55 }}>
            {isNotMe
              ? 'Thanks for telling us. Nobody can use it now.'
              : `${d.brand || 'The brand'} cancelled this campaign.`}
          </div>
        </div>
        {d.retract_reason && (
          <div style={{ margin: '24px 24px 0', background: '#131316', borderRadius: 18, padding: '15px 17px', fontSize: 13, fontWeight: 500, color: '#B4B4BC', lineHeight: 1.55 }}>
            {d.retract_reason}
          </div>
        )}
        <div style={{ margin: '12px 24px 0', background: '#131316', borderRadius: 18, padding: '15px 17px', fontSize: 13, fontWeight: 500, color: '#B4B4BC', lineHeight: 1.55 }}>
          If you already signed, your agreement is kept and marked terminated. Anything owed to you will be settled.
        </div>
        {d.talent_name && (
          <div style={{ margin: '12px 24px 0', background: '#131316', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
              background: 'linear-gradient(150deg,#2A2A32,#17171A)', fontSize: 14, fontWeight: 800, color: '#C8C8D0',
            }}>{d.talent_name.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{d.talent_name}, talent manager</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#8A8A93' }}>Following</div>
            </div>
          </div>
        )}
      </Shell>
    )
  }

  if (screen === 'under') {
    return (
      <Shell animKey="under">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 34px' }}>
          <div style={{ width: 66, height: 66, borderRadius: 22, background: '#17171A', display: 'grid', placeItems: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8A8A93" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" /></svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.12, marginTop: 24 }}>We cannot sign this<br />with you yet</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#8A8A93', marginTop: 14, lineHeight: 1.55 }}>
            You need to be 18 or older to sign a campaign agreement. Nothing has been saved.
          </div>
          <div style={{ background: '#131316', borderRadius: 18, padding: '15px 17px', fontSize: 12.5, fontWeight: 500, color: '#B4B4BC', lineHeight: 1.55, marginTop: 22 }}>
            If that was a mistake, contact the person who sent you this link and they can reissue it.
          </div>
        </div>
        <button onClick={() => { setScreen('step'); setOpen('sign') }} style={{
          position: 'absolute', left: 24, right: 24, bottom: 32, background: '#17171A', border: 'none',
          borderRadius: 20, padding: 19, textAlign: 'center', fontSize: 16, fontWeight: 700, minHeight: 44,
          color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
        }}>Go back</button>
      </Shell>
    )
  }

  // ---- receipt -----------------------------------------------------------------------
  if (d.view === 'receipt' && screen !== 'done' && screen !== 'app') {
    const pending = sub.bank_status === 'pending'
    const rows = [
      { t: 'Campaign', v: `${d.deliverables_summary || ''}${d.fee_aed_cents != null ? `, ${money(d.fee_aed_cents)}` : ''}`, grad: GRAD.sign },
      { t: 'Email', v: sub.email || '—', grad: GRAD.email },
      { t: 'Agreement', v: sub.signed_at ? `Signed ${niceDate(sub.signed_at)}, version ${d.agreement_version ?? 1}` : '—', grad: GRAD.sign },
      ...(sub.bank_last4 ? [{ t: 'Bank details', v: `${sub.bank_country || ''} ending ${sub.bank_last4}, ${pending ? 'being checked' : 'confirmed'}`, grad: GRAD.bank }] : []),
      ...(sub.address_city ? [{ t: 'Delivery address', v: sub.address_city, grad: GRAD.addr }] : []),
    ]
    return (
      <Shell animKey="receipt">
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Sticker src="/enrolment/sticker-signed.png" style={{ width: 52 }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>{pending ? 'Almost there' : 'All done'}</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8A8A93', marginTop: 2 }}>
                {pending ? `Signed ${niceDate(sub.signed_at)}, one check left` : `Completed ${niceDate(sub.completed_at)}`}
              </div>
            </div>
          </div>
        </div>
        {pending && (
          <div style={{ margin: '18px 22px 0', background: GRAD.sign, borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></svg>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff' }}>We are checking your bank details</div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,.88)', marginTop: 7, lineHeight: 1.5 }}>
              Someone from the talent team will message you to confirm the holder name and the last four digits. This is normal, and it is how we make sure the money reaches you.
            </div>
          </div>
        )}
        <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.t} style={{ background: '#131316', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: r.grad, display: 'grid', placeItems: 'center', flex: 'none' }}>
                {I.tick('#fff')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.t}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#8A8A93', marginTop: 1 }}>{r.v}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 22px 120px', fontSize: 12, fontWeight: 600, color: '#7E7E87', lineHeight: 1.5 }}>
          Values are masked. We cannot tell who is opening this link.
        </div>
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', padding: '0 0 30px' }}>
          <div style={{ width: '100%', maxWidth: 430, padding: '0 22px', display: 'flex', gap: 9 }}>
            <a href={`${PUBLIC}/${token}/agreement.pdf`} style={{
              flex: 1, background: '#131316', borderRadius: 18, padding: 16, textAlign: 'center',
              fontSize: 14.5, fontWeight: 700, minHeight: 44, color: '#fff', textDecoration: 'none',
            }}>Agreement PDF</a>
            <a href="https://inflink.ae" style={{
              flex: 1, background: '#fff', color: '#050506', borderRadius: 18, padding: 16, textAlign: 'center',
              fontSize: 14.5, fontWeight: 700, minHeight: 44, textDecoration: 'none',
            }}>Open Inflink</a>
          </div>
        </div>
      </Shell>
    )
  }

  // ---- splash ------------------------------------------------------------------------
  if (screen === 'splash') {
    return (
      <Shell animKey="splash">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="eGlow" style={{ position: 'absolute', top: -90, left: -70, width: 330, height: 330, borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,61,232,.55),transparent 68%)', filter: 'blur(42px)' }} />
          <div className="eGlow" style={{ position: 'absolute', top: 150, right: -90, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,77,10,.45),transparent 68%)', filter: 'blur(44px)' }} />
          <div className="eGlow" style={{ position: 'absolute', bottom: -60, left: 40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,107,255,.42),transparent 70%)', filter: 'blur(46px)' }} />

          <Sticker src="/enrolment/sticker-coin.png" className="eBob" style={{ position: 'absolute', left: -30, top: 150, width: 132 }} />
          <Sticker src="/enrolment/sticker-signed.png" style={{ position: 'absolute', right: -24, top: 132, width: 112, transform: 'rotate(9deg)', animation: 'ePop .8s cubic-bezier(.16,1.02,.3,1) .5s both' }} />
          <Sticker src="/enrolment/sticker-bolt.png" style={{ position: 'absolute', left: 24, bottom: 238, width: 74, animation: 'ePop .7s cubic-bezier(.16,1.02,.3,1) .8s both' }} />
          <Sticker src="/enrolment/sticker-youin.png" className="eBob" style={{ position: 'absolute', right: 16, bottom: 226, width: 134 }} />

          <div style={{ position: 'absolute', left: 0, right: 0, top: '34%', padding: '0 30px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-.05em', lineHeight: .96, animation: 'eFade .8s ease .1s both' }}>
              You just<br />got a brand<br />deal.
            </div>
          </div>

          <div style={{ position: 'absolute', left: 26, right: 26, bottom: 34, animation: 'eFade .8s ease .95s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 18 }}>
              <Logo h={13} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8A8A93' }}>partners with Inflink</span>
            </div>
            <button onClick={() => setScreen('deck')} style={{
              width: '100%', background: '#fff', color: '#050506', borderRadius: 20, padding: 19,
              textAlign: 'center', fontSize: 16.5, fontWeight: 700, minHeight: 44, border: 'none',
              fontFamily: 'inherit', cursor: 'pointer',
            }}>Open my deal</button>
          </div>
        </div>
      </Shell>
    )
  }

  // ---- celebration -------------------------------------------------------------------
  if (screen === 'done') {
    const first = (sub.full_name || d.creator_name || '').split(' ')[0]
    return (
      <Shell animKey="done">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="eGlow" style={{ position: 'absolute', top: -70, left: '50%', marginLeft: -160, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(31,209,107,.5),transparent 68%)', filter: 'blur(44px)' }} />
          <div className="eGlow" style={{ position: 'absolute', bottom: 60, right: -70, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,122,217,.42),transparent 70%)', filter: 'blur(44px)' }} />
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute', top: -30, left: 6 + i * 19.5, width: 7, height: 11, borderRadius: 2,
              background: CONF_COLS[i % 4],
              animation: `eConf ${(5.4 + (i % 5) * 0.7).toFixed(1)}s linear ${((i % 8) * 0.45).toFixed(2)}s infinite`,
            }} />
          ))}
          <Sticker src="/enrolment/sticker-youin.png" style={{ position: 'absolute', left: '50%', marginLeft: -78, top: 120, width: 156, animation: 'ePop .9s cubic-bezier(.16,1.02,.3,1) .1s both' }} />
          <Sticker src="/enrolment/sticker-coin.png" className="eBob" style={{ position: 'absolute', left: 12, top: 320, width: 96 }} />
          <Sticker src="/enrolment/sticker-bolt.png" style={{ position: 'absolute', right: 22, top: 318, width: 62, animation: 'ePop .7s cubic-bezier(.16,1.02,.3,1) .6s both' }} />

          <div style={{ position: 'absolute', left: 0, right: 0, top: '46%', padding: '0 34px', textAlign: 'center', animation: 'eFade .8s ease .5s both' }}>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1 }}>
              All done{first ? <>,<br />{first}.</> : '.'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#9A9AA2', marginTop: 14, lineHeight: 1.55 }}>
              Signed and your payment details are in.
            </div>
          </div>

          {(d.payment_terms?.length ?? 0) > 0 && (
            <div style={{ position: 'absolute', left: 24, right: 24, top: '64%', background: '#131316', borderRadius: 18, padding: '4px 16px', animation: 'eFade .8s ease .75s both' }}>
              {d.payment_terms!.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderBottom: i < d.payment_terms!.length - 1 ? '1px solid #1E1E22' : 'none',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: i === 0 ? GRAD.email : GRAD.bank, borderRadius: 7, padding: '4px 7px', flex: 'none' }}>{t.pct}%</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 'none' }}>{money(t.amount_aed_cents)}</span>
                  <span style={{ flex: 1, textAlign: 'right', fontSize: 11.5, fontWeight: 500, color: '#8A8A93' }}>{t.label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 26, background: '#17171B', border: '1px solid #26262C', borderRadius: 22, padding: 18, boxShadow: '0 18px 44px -20px rgba(0,0,0,.8)', animation: 'eFade .8s ease .95s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <InflinkLogo h={16} />
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', color: '#7E7E87' }}>NEXT</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.3, marginTop: 11 }}>
              Get invited to campaigns automatically
            </div>
            <button onClick={() => setScreen('app')} style={{
              width: '100%', marginTop: 14, background: '#fff', color: '#050506', borderRadius: 16, padding: 16,
              textAlign: 'center', fontSize: 15.5, fontWeight: 700, minHeight: 44, border: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}>Set up my Inflink</button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 11 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#7E7E87' }}>Free to join</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#7E7E87' }}>Paid on approval</span>
            </div>
          </div>
          <button onClick={() => { setScreen('deck'); load() }} style={{
            position: 'absolute', right: 26, top: 26, fontSize: 13, fontWeight: 700, color: '#8A8A93',
            background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer',
          }}>Later</button>
        </div>
      </Shell>
    )
  }

  // ---- the Inflink sell --------------------------------------------------------------
  if (screen === 'app') {
    const sells = [
      { t: 'A wallet with a real balance', dd: 'See what you earned and every line of it.', grad: GRAD.bank },
      { t: 'Withdraw to your bank', dd: 'You start it, we process it.', grad: GRAD.email },
      { t: 'Track your deals', dd: 'Briefs, approvals and deadlines in one place.', grad: GRAD.sign },
      { t: 'Get booked by other brands', dd: 'Brands on Inflink can book you directly.', grad: GRAD.addr },
    ]
    return (
      <Shell animKey="app">
        <div style={{ padding: '26px 24px 0' }}>
          <InflinkLogo h={22} />
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.035em', lineHeight: 1.06, marginTop: 26 }}>Your account is<br />already made</div>
          <div style={{ fontSize: 14.5, fontWeight: 500, color: '#9A9AA2', marginTop: 12, lineHeight: 1.55 }}>
            Sign in with <span style={{ color: '#fff', fontWeight: 700 }}>{sub.email}</span> and everything here is waiting.
          </div>
        </div>
        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sells.map((s) => (
            <div key={s.t} style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: s.grad, flex: 'none' }} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{s.t}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8A8A93', marginTop: 1, lineHeight: 1.45 }}>{s.dd}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '36px 24px 32px' }}>
          <a href={`https://inflink.ae/join?email=${encodeURIComponent(sub.email || '')}`} style={{
            display: 'block', background: '#fff', color: '#050506', borderRadius: 20, padding: 19,
            textAlign: 'center', fontSize: 16.5, fontWeight: 700, minHeight: 44, textDecoration: 'none',
          }}>Complete my signup</a>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#7E7E87', marginTop: 12, lineHeight: 1.45 }}>
            You can do this later. Your campaign runs either way.
          </div>
        </div>
      </Shell>
    )
  }

  // ---- the agreement, in full --------------------------------------------------------
  if (screen === 'agreement') {
    return (
      <Shell animKey="agreement">
        <div style={{ padding: '22px 22px 40px' }}>
          <button onClick={() => setScreen('step')} style={{
            width: 44, height: 44, borderRadius: '50%', background: '#17171A', display: 'grid', placeItems: 'center',
            border: 'none', cursor: 'pointer', marginBottom: 18,
          }}>{I.back}</button>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>The agreement</div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8A8A93', marginTop: 6 }}>Version {d.agreement_version ?? 1}</div>
          <div style={{ marginTop: 22, fontSize: 14.5, fontWeight: 400, color: '#C8C8D0', lineHeight: 1.72, whiteSpace: 'pre-wrap' }}>
            {d.agreement_body}
          </div>
        </div>
      </Shell>
    )
  }

  // ---- the deck ----------------------------------------------------------------------
  if (screen === 'deck') {
    // NOTE: the design computes a `deckHead` line ("Four steps to get you paid") in its
    // state and never renders it anywhere in the markup. It is dead code in the mock, not
    // part of the screen, and putting it on the page was my invention.
    return (
      <Shell animKey="deck">
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(150deg,#1FD16B,#0E7A3A)', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>{(d.brand || '?').trim()[0]?.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.12em', color: '#8A8A93', textTransform: 'uppercase' }}>{d.brand}</div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.035em', lineHeight: 1.05, marginTop: 12 }}>{d.campaign}</div>
          {d.fee_aed_cents != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: '#131316', display: 'grid', placeItems: 'center', flex: 'none' }}>{I.wallet}</div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.02em' }}>{money(d.fee_aed_cents)}</div>
            </div>
          )}
        </div>

        <div
          style={{ overflow: 'hidden', marginTop: 22, touchAction: 'pan-y' }}
          onPointerDown={(e) => { dragFrom.current = { x: e.clientX, y: e.clientY } }}
          onPointerMove={(e) => {
            if (!dragFrom.current) return
            const dx = e.clientX - dragFrom.current.x
            const dy = e.clientY - dragFrom.current.y
            // Let a vertical scroll win. Without this the deck grabs every attempt to
            // scroll the page and the screen feels stuck.
            if (Math.abs(dy) > Math.abs(dx)) { dragFrom.current = null; setDrag(null); return }
            // Resist past the ends so the deck feels bounded rather than broken.
            const atEnd = (dx > 0 && active === 0) || (dx < 0 && active === steps.length - 1)
            setDrag(atEnd ? dx * 0.28 : dx)
          }}
          onPointerUp={() => {
            if (drag !== null && Math.abs(drag) > 56) {
              setActive((p) => Math.min(steps.length - 1, Math.max(0, p + (drag < 0 ? 1 : -1))))
            }
            dragFrom.current = null; setDrag(null)
          }}
          onPointerCancel={() => { dragFrom.current = null; setDrag(null) }}
          onPointerLeave={() => { dragFrom.current = null; setDrag(null) }}
        >
          <div style={{
            display: 'flex', gap: 16, paddingLeft: 22,
            transform: `translateX(${-active * 278 + (drag ?? 0)}px)`,
            // No transition while a finger is down, or the cards lag behind it.
            transition: drag === null ? 'transform .52s cubic-bezier(.22,1,.36,1)' : 'none',
          }}>
            {steps.map((k, i) => {
              const isDone = done[k]
              const act = i === active
              return (
                <div
                  key={k}
                  onClick={() => {
                    // A drag that moved is a swipe, not a tap. Without this, letting go
                    // after sliding the deck opens whatever card is under your finger.
                    if (drag !== null && Math.abs(drag) > 6) return
                    if (act) openStep(k)      // the front card opens
                    else setActive(i)          // any other card comes to the front first
                  }}
                  style={{
                    width: 262, height: 352, flex: 'none', borderRadius: 30, background: GRAD[k],
                    position: 'relative', overflow: 'hidden', opacity: act ? 1 : .5,
                    transform: `scale(${act ? 1 : .93})`, cursor: 'pointer',
                    transition: 'transform .52s cubic-bezier(.22,1,.36,1), opacity .4s ease',
                  }}>
                  <svg width="262" height="352" viewBox="0 0 262 352" fill="none" style={{ position: 'absolute', inset: 0 }}>
                    <path d="M-20 268C40 250 96 214 118 158C140 102 196 66 282 74" stroke="rgba(255,255,255,.55)" strokeWidth="15" strokeLinecap="round" />
                    <ellipse cx="214" cy="286" rx="96" ry="76" fill="rgba(255,255,255,.14)" />
                  </svg>
                  <span className="eTw" style={{ position: 'absolute', left: 26, top: 120 }}>{I.star(26, 'rgba(255,255,255,.92)')}</span>
                  <span className="eTw" style={{ position: 'absolute', right: 38, top: 52 }}>{I.star(17, 'rgba(255,255,255,.8)')}</span>
                  <span className="eTw" style={{ position: 'absolute', left: 120, bottom: 126 }}>{I.star(13, 'rgba(255,255,255,.7)')}</span>

                  <div style={{ position: 'absolute', left: 22, top: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,.22)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#fff' }}>
                      {`STEP 0${i + 1}`}
                    </div>
                    {isDone && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center' }}>{I.tick()}</div>
                    )}
                  </div>
                  <div style={{ position: 'absolute', left: 22, right: 22, bottom: 24 }}>
                    <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.06, color: '#fff', whiteSpace: 'pre-line' }}>{DEFS[k].title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.82)', marginTop: 7 }}>{isDone ? 'Done' : DEFS[k].meta}</div>
                  </div>
                </div>
              )
            })}
            <div style={{ width: 22, flex: 'none' }} />
          </div>
        </div>

        {/* Absolutely positioned at bottom 30, as the design has it, rather than pushed
            there by padding. On a short phone the padded version put the button below the
            fold and the deck looked like it had no controls. */}
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 30 }}>
          {/* A count, not dots. Dots say "there are some steps"; a number says how many
              are left, which is the only thing somebody halfway through wants to know. */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: ready ? '#1FD16B' : '#fff' }}>
              Completed {count} / {steps.length}
            </span>
            {!ready && (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#7E7E87' }}>
                {steps.length - count === 1 ? 'one left' : `${steps.length - count} left`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <button onClick={() => setActive((p) => (p + steps.length - 1) % steps.length)} style={{ width: 52, height: 52, borderRadius: '50%', background: '#17171A', display: 'grid', placeItems: 'center', flex: 'none', border: 'none', cursor: 'pointer' }}>{I.left}</button>
            {/* One button. Grey while anything is outstanding, and pressing it then takes
                you to the first thing that is; green and submitting once nothing is. */}
            <button
              onClick={async () => {
                if (!ready) {
                  const firstOpen = steps.find((k) => !done[k])
                  if (firstOpen) openStep(firstOpen)
                  return
                }
                const r = await post('submit')
                if (r.ok) setScreen('done')
              }}
              disabled={busy}
              style={{
                flex: 1, borderRadius: 20, padding: 17, textAlign: 'center',
                fontSize: 16, fontWeight: 700, minHeight: 44, border: 'none',
                fontFamily: 'inherit', cursor: busy ? 'default' : 'pointer',
                background: ready ? '#1FD16B' : '#1C1C20',
                color: ready ? '#04170C' : '#5E5E66',
                transition: 'background .3s ease, color .3s ease',
              }}
            >{busy ? 'One moment…' : ready ? 'Submit' : 'Submit'}</button>
            <button onClick={() => setActive((p) => (p + 1) % steps.length)} style={{ width: 52, height: 52, borderRadius: '50%', background: '#17171A', display: 'grid', placeItems: 'center', flex: 'none', border: 'none', cursor: 'pointer' }}>{I.right}</button>
          </div>
          <button
            onClick={async () => {
              if (reporting) return
              if (!confirm('Tell us this deal is not yours? The link is killed straight away and the person who sent it is alerted.')) return
              setReporting(true)
              await post('report', { reason: 'Reported from the enrolment page' })
              await load()
            }}
            style={{ width: '100%', marginTop: 18, background: 'none', border: 'none', fontSize: 12.5, fontWeight: 600, color: '#5E5E66', fontFamily: 'inherit', cursor: 'pointer' }}
          >Not your deal?</button>
        </div>
      </Shell>
    )
  }

  // ---- a step ------------------------------------------------------------------------
  const key = (open ?? steps[active]) as StepKey
  const def = DEFS[key]

  return (
    <Shell animKey={`step-${key}`}>
      <div style={{ height: 158, background: GRAD[key], position: 'relative', overflow: 'hidden' }}>
        <svg width="430" height="158" viewBox="0 0 390 158" fill="none" style={{ position: 'absolute', inset: 0, width: '100%' }} preserveAspectRatio="none">
          <path d="M-20 140C64 124 136 90 178 40C220 -10 306 -8 410 26" stroke="rgba(255,255,255,.42)" strokeWidth="16" strokeLinecap="round" />
          <ellipse cx="322" cy="150" rx="104" ry="66" fill="rgba(255,255,255,.13)" />
        </svg>
        <button onClick={() => { setScreen('deck'); setOpen(null); setErr(null); setGate(null) }} style={{
          position: 'absolute', left: 18, top: 14, width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,.26)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center',
          border: 'none', cursor: 'pointer',
        }}>{I.back}</button>
        <div style={{ position: 'absolute', right: 18, top: 25, background: 'rgba(0,0,0,.24)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '8px 13px', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#fff' }}>
          {`STEP 0${steps.indexOf(key) + 1}`}
        </div>
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 20 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.04, color: '#fff' }}>{def.big}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.82)', marginTop: 5 }}>{def.sub}</div>
        </div>
      </div>

      <div style={{ padding: '17px 22px 22px' }}>
        {gate && (
          <div style={{
            marginBottom: 14, background: '#131316', borderRadius: 16, padding: '13px 16px',
            fontSize: 13, fontWeight: 600, color: '#C8C8D0', lineHeight: 1.5,
            animation: 'eFade .3s ease both',
          }}>{gate}</div>
        )}
        {key === 'email' && <StepEmail d={d} sub={sub} post={post} busy={busy} err={err} onDone={(f) => advance('email', f)} />}
        {key === 'sign' && <StepSign d={d} sub={sub} post={post} busy={busy} err={err} openAgreement={() => setScreen('agreement')} onDone={(f) => advance('sign', f)} />}
        {key === 'bank' && <StepBank sub={sub} post={post} busy={busy} err={err} onDone={(f) => advance('bank', f)} />}
      </div>

      {/* Inline at the end of the step, NOT a fixed strip.
          A fixed bar permanently occupies the bottom of the viewport, and on this form it
          sat on top of the line telling somebody where their pin had landed. The design's
          version lived at the bottom of a fixed height phone where nothing scrolled under
          it; a scrolling web page is not that. */}
      <div style={{ padding: '0 22px 30px', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: count === steps.length ? '#1FD16B' : '#8A8A93' }}>
          Completed {count} / {steps.length}
        </span>
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------------------
// Step 1 — details, then the code
// ---------------------------------------------------------------------------------------
function StepEmail({ d, sub, post, busy, err, onDone }: {
  d: Payload; sub: Submitted; post: (p: string, b?: unknown) => Promise<{ ok: boolean; data?: Payload }>
  busy: boolean; err: string | null; onDone: (f?: Payload) => void
}) {
  const [name, setName] = useState(sub.full_name || d.creator_name || '')
  const [email, setEmail] = useState(sub.email || '')
  const [mobile, setMobile] = useState(sub.mobile || '')
  const [handle, setHandle] = useState(sub.instagram_handle || (d.creator_handle || '').replace(/^@/, ''))
  // The delivery half of this step. Only collected when the link ships something.
  const wantsAddress = d.wants_address !== false
  const [addr, setAddr] = useState({
    line: sub.address_line || '', city: sub.address_city || '',
    phone: sub.address_phone || sub.mobile || '',
    lat: sub.address_lat ?? null, lng: sub.address_lng ?? null,
    maps: sub.address_maps_url || '', source: null as string | null,
  })
  const [stage, setStage] = useState<'form' | 'code'>('form')
  const [code, setCode] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  // `show` flips on the first failed press. Before that a half typed email is not an
  // error, it is somebody still typing, and shouting at them mid word is worse than
  // silence. After it, errors update live so a correction clears immediately.
  const [show, setShow] = useState(false)

  const addrErrs = {
    line: !wantsAddress ? null
      : !addr.line.trim() ? 'We need somewhere to send the product.'
        : addr.line.trim().length < 6 ? 'Add the building and street, not just a number.' : null,
    city: !wantsAddress ? null
      : !addr.city.trim() ? 'Which city?' : addr.city.trim().length < 2 ? 'That looks too short.' : null,
    // Required here even though the mobile above is not: a courier cannot deliver without
    // a number to call on the day.
    phone: !wantsAddress ? null
      : !addr.phone.trim() ? 'The courier needs a number to call on the day.' : vMobile(addr.phone),
  }
  const errs = {
    name: vName(name),
    email: vEmail(email),
    mobile: vMobile(mobile),
  }
  const bad = [...Object.values(errs), ...Object.values(addrErrs)].some(Boolean)

  return (
    <>
      {stage === 'form' ? (
        <>
          <div style={{ background: '#121215', borderRadius: 20, overflow: 'hidden' }}>
            <Row icon={I.user} label="Name" error={show ? errs.name : null}>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </Row>
            <Row icon={I.mail} label="Email" error={show ? errs.email : null}>
              <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoCapitalize="off" autoCorrect="off" />
            </Row>
            <Row icon={I.phone} label="Mobile" error={show ? errs.mobile : null}>
              <input style={inputStyle} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+971 50 000 0000" inputMode="tel" />
            </Row>
            <Row icon={I.at} label="Instagram" last>
              <input style={inputStyle} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" autoCapitalize="off" autoCorrect="off" />
            </Row>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, fontSize: 12.5, fontWeight: 600, color: '#7E7E87', lineHeight: 1.4 }}>
            <span style={{ flex: 'none' }}>{I.shield}</span>Your email becomes your Inflink login.
          </div>

          {wantsAddress && (
            <DeliveryBlock
              brand={d.brand}
              value={addr}
              onChange={(patch) => setAddr((p) => ({ ...p, ...patch }))}
              show={show}
              errs={addrErrs}
            />
          )}

          <ErrLine>{err}</ErrLine>
          <CTA busy={busy} onClick={async () => {
            setShow(true)
            if (bad) return
            const r = await post('details', {
              full_name: name.trim(), email: email.trim().toLowerCase(),
              mobile: mobile.trim() || null, instagram_handle: handle.trim() || null,
              ...(wantsAddress ? {
                address_line: addr.line.trim() || null,
                address_city: addr.city.trim() || null,
                address_phone: addr.phone.trim() || null,
                address_country: 'United Arab Emirates',
                address_lat: addr.lat, address_lng: addr.lng,
                address_maps_url: addr.maps.trim() || null,
                address_pin_source: addr.lat != null ? 'browser' : (addr.maps.trim() ? 'link' : null),
              } : {}),
            })
            if (r.ok) { setSentTo(email.trim().toLowerCase()); setStage('code'); setShow(false) }
          }}>Save my details</CTA>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#C8C8D0', lineHeight: 1.6 }}>
            We sent a 6 digit code to <span style={{ color: '#fff', fontWeight: 700 }}>{sentTo}</span>. Enter it to confirm this is you.
          </div>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setShow(false) }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            style={{
              width: '100%', marginTop: 20, background: '#121215',
              border: `1.5px solid ${show && code.length !== 6 ? BAD : 'transparent'}`,
              borderRadius: 20,
              padding: '22px 16px', textAlign: 'center', fontSize: 34, fontWeight: 700, letterSpacing: '.22em',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <ErrLine>{err || (show && code.length !== 6 ? 'The code is 6 digits.' : null)}</ErrLine>
          <CTA busy={busy} onClick={async () => {
            setShow(true)
            if (code.length !== 6) return
            const r = await post('verify', { code })
            if (r.ok) onDone(r.data)
          }}>Confirm my email</CTA>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => setStage('form')} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#8A8A93', fontFamily: 'inherit', cursor: 'pointer' }}>Change email</button>
            <button onClick={() => post('resend-code')} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#8A8A93', fontFamily: 'inherit', cursor: 'pointer' }}>Send it again</button>
          </div>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------------------
// Step 2 — sign
// ---------------------------------------------------------------------------------------
function StepSign({ d, sub, post, busy, err, openAgreement, onDone }: {
  d: Payload; sub: Submitted; post: (p: string, b?: unknown) => Promise<{ ok: boolean; data?: Payload }>
  busy: boolean; err: string | null; openAgreement: () => void; onDone: (f?: Payload) => void
}) {
  const [ticks, setTicks] = useState({ a: false, b: false, c: false })
  const [dob, setDob] = useState(sub.date_of_birth || '')
  const [sigName, setSigName] = useState(sub.full_name || '')
  const [drawn, setDrawn] = useState<string | null>(null)
  const signed = !!sub.signed_at

  const facts = [
    { icon: I.box, label: 'Deliver', v: d.deliverables_summary || '—' },
    { icon: I.wallet, label: 'Fee', v: money(d.fee_aed_cents) || '—' },
    { icon: I.chev, label: 'Submit by', v: niceDate(d.submit_by) || '—' },
    { icon: I.shield, label: 'Usage', v: d.usage_terms || '—' },
  ]
  const [show, setShow] = useState(false)
  const errs = {
    dob: vDob(dob),
    sigName: vName(sigName),
    // The drawn mark is what makes this a signature rather than a tick. The server accepts
    // a typed name alone, but a creator who has not drawn anything has almost always just
    // not noticed the pad, so this asks rather than silently accepting a weaker signature.
    sig: drawn ? null : 'Draw your signature above.',
    ticks: (ticks.a && ticks.b && ticks.c) ? null : 'Tick all three to sign.',
  }
  const bad = Object.values(errs).some(Boolean)

  if (signed) {
    return (
      <>
        <div style={{ background: '#121215', borderRadius: 20, overflow: 'hidden' }}>
          <Row icon={I.doc} label="Signed">{<span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{niceDate(sub.signed_at)}</span>}</Row>
          <Row icon={I.user} label="By" last>{<span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{sub.full_name}</span>}</Row>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: '#1FD16B' }}>This is signed. Nothing more to do here.</div>
        <a href="#" onClick={(e) => { e.preventDefault(); openAgreement() }} style={{
          display: 'flex', marginTop: 16, background: '#121215', borderRadius: 16, padding: '14px 16px',
          alignItems: 'center', gap: 13, minHeight: 44, textDecoration: 'none',
        }}>
          <span style={{ flex: 'none' }}>{I.doc}</span>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: '#fff' }}>Read the agreement</span>
          {I.chev}
        </a>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {facts.map((f) => (
          <div key={f.label} style={{ background: '#121215', borderRadius: 16, padding: '14px 15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', transform: 'scale(.84)', transformOrigin: 'left center' }}>{f.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8A8A93' }}>{f.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 6, lineHeight: 1.2 }}>{f.v}</div>
          </div>
        ))}
      </div>

      <button onClick={openAgreement} style={{
        width: '100%', marginTop: 8, background: '#121215', borderRadius: 16, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 13, minHeight: 44, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span style={{ flex: 'none' }}>{I.doc}</span>
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: '#fff', textAlign: 'left' }}>Read the full agreement</span>
        {I.chev}
      </button>

      <div style={{ marginTop: 10, background: '#121215', borderRadius: 20, overflow: 'hidden' }}>
        {([
          ['a', 'I have read it and I agree'],
          ['b', 'I am happy to sign electronically'],
          ['c', 'I am 18 or older'],
        ] as const).map(([k, label]) => (
          <div key={k} onClick={() => setTicks((p) => ({ ...p, [k]: !p[k] }))} style={{
            display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', minHeight: 44,
            borderBottom: '1px solid #1E1E22', cursor: 'pointer',
          }}>
            <span style={{
              flex: 1, fontSize: 14.5, fontWeight: 600,
              color: show && !ticks[k] ? BAD : '#E4E4EA',
            }}>{label}</span>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flex: 'none',
              background: ticks[k] ? '#FFFFFF' : 'transparent',
              border: `1.8px solid ${ticks[k] ? '#FFFFFF' : show ? BAD : '#3A3A42'}`,
              display: 'grid', placeItems: 'center', transition: 'background .18s ease, border-color .18s ease',
            }}>
              <span style={{ opacity: ticks[k] ? 1 : 0 }}>{I.tick()}</span>
            </div>
          </div>
        ))}
        <Row icon={I.user} label="Date of birth" last error={show ? errs.dob : null}>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                 max={new Date().toISOString().slice(0, 10)}
                 style={{ ...inputStyle, colorScheme: 'dark' }} />
        </Row>
      </div>

      <div style={{ marginTop: 10 }}>
        <SignaturePad onChange={setDrawn} invalid={show && !!errs.sig} />
        {show && errs.sig && (
          <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: BAD, animation: 'eFade .22s ease both' }}>
            {errs.sig}
          </div>
        )}
        <div style={{
          marginTop: 8, background: '#121215', borderRadius: 16, padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 13,
          border: `1.5px solid ${show && errs.sigName ? BAD : 'transparent'}`,
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: show && errs.sigName ? BAD : '#8A8A93', flex: 'none' }}>Type your name</span>
          <input style={inputStyle} value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Your full name" />
        </div>
        {show && errs.sigName && (
          <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: BAD, animation: 'eFade .22s ease both' }}>
            {errs.sigName}
          </div>
        )}
      </div>

      {/* The three tick rows turn red on their own, but red with no words is a colour, not
          a reason, so the sentence is said once here. */}
      <ErrLine>{err || (show ? errs.ticks : null)}</ErrLine>
      <CTA busy={busy} onClick={async () => {
        setShow(true)
        if (bad) return
        const r = await post('sign', {
          signature_name: sigName.trim(), signature_image: drawn, date_of_birth: dob,
          agreed_terms: true, agreed_electronic: true, agreed_age: true,
        })
        if (r.ok) onDone(r.data)
      }}>Sign agreement</CTA>
    </>
  )
}

/** A signature pad. Pointer events so a finger, a stylus and a mouse are the same code. */
function SignaturePad({ onChange, invalid }: {
  onChange: (dataUrl: string | null) => void; invalid?: boolean
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [has, setHas] = useState(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    // Backing store at device resolution, or the mark is a blurry smear on a phone.
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const rect = c.getBoundingClientRect()
    c.width = rect.width * dpr
    c.height = rect.height * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#FFFFFF'
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = (ref.current as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <div>
      <div style={{
        position: 'relative', background: '#121215', borderRadius: 16, overflow: 'hidden',
        border: `1.5px solid ${invalid ? BAD : 'transparent'}`, transition: 'border-color .2s ease',
      }}>
        <canvas
          ref={ref}
          style={{ display: 'block', width: '100%', height: 132, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            const ctx = ref.current!.getContext('2d')!
            const p = pos(e)
            ctx.beginPath(); ctx.moveTo(p.x, p.y)
            drawing.current = true
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = ref.current!.getContext('2d')!
            const p = pos(e)
            ctx.lineTo(p.x, p.y); ctx.stroke()
            if (!has) setHas(true)
          }}
          onPointerUp={() => {
            drawing.current = false
            if (has) onChange(ref.current!.toDataURL('image/png'))
          }}
        />
        {!has && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', fontSize: 13.5, fontWeight: 600, color: '#5E5E66' }}>
            <span style={{ color: invalid ? BAD : '#5E5E66' }}>Sign here with your finger</span>
          </div>
        )}
      </div>
      {has && (
        <button onClick={() => {
          const c = ref.current!
          c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
          setHas(false); onChange(null)
        }} style={{ marginTop: 8, background: 'none', border: 'none', fontSize: 12.5, fontWeight: 600, color: '#8A8A93', fontFamily: 'inherit', cursor: 'pointer' }}>
          Clear and sign again
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------
// Step 3 — bank
// ---------------------------------------------------------------------------------------
function StepBank({ sub, post, busy, err, onDone }: {
  sub: Submitted; post: (p: string, b?: unknown) => Promise<{ ok: boolean; data?: Payload }>
  busy: boolean; err: string | null; onDone: (f?: Payload) => void
}) {
  const [holder, setHolder] = useState(sub.bank_holder || '')
  const [iban, setIban] = useState('')
  const [swift, setSwift] = useState('')

  const [show, setShow] = useState(false)
  const clean = iban.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const outsideUAE = clean.length >= 2 && !clean.startsWith('AE')
  const errs = {
    // NOT vName: that insists on a first and last name, which is right for the person
    // signing and wrong for an account holder, who may bank as a single trading name.
    holder: !holder.trim() ? 'We need the name on the account.'
      : holder.trim().length < 2 ? 'That looks too short.' : null,
    iban: vIban(iban),
    swift: outsideUAE && swift.trim().length < 8
      ? 'Outside the UAE we need a SWIFT or BIC code, 8 or 11 characters.' : null,
  }
  const bad = Object.values(errs).some(Boolean)
  // The green line is only ever shown when the IBAN genuinely passes the checksum. It used
  // to appear on any 15 characters, which told somebody their typo was fine.
  const ibanGood = !errs.iban

  return (
    <>
      <div style={{ background: '#121215', borderRadius: 20, overflow: 'hidden' }}>
        <Row icon={I.user} label="Holder" error={show ? errs.holder : null}>
          <input style={inputStyle} value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name on the account" />
        </Row>
        <Row icon={I.bank} label="IBAN" last error={show ? errs.iban : null}>
          <input style={inputStyle} value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="AE00 0000 0000 0000 0000 000" autoCapitalize="characters" autoCorrect="off" />
        </Row>
      </div>

      {outsideUAE && (
        <>
          <div style={{
            marginTop: 10, background: '#121215', borderRadius: 16, padding: '13px 16px',
            display: 'flex', alignItems: 'center', gap: 13, minHeight: 44,
            border: `1.5px solid ${show && errs.swift ? BAD : 'transparent'}`,
          }}>
            <span style={{ flex: 'none' }}>{I.bank}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: show && errs.swift ? BAD : '#8A8A93', flex: 'none' }}>SWIFT</span>
            <input style={inputStyle} value={swift} onChange={(e) => setSwift(e.target.value.toUpperCase())} placeholder="Needed outside the UAE" autoCapitalize="characters" autoCorrect="off" />
          </div>
          {show && errs.swift && (
            <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: BAD, animation: 'eFade .22s ease both' }}>{errs.swift}</div>
          )}
        </>
      )}

      {ibanGood && !err && (
        <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: '#1FD16B', lineHeight: 1.4 }}>
          {clean.startsWith('AE') ? 'IBAN checks out, UAE, 23 characters.' : `IBAN checks out, ${clean.slice(0, 2)}.`}
        </div>
      )}
      <ErrLine>{err}</ErrLine>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, fontSize: 12.5, fontWeight: 600, color: '#7E7E87', lineHeight: 1.4 }}>
        <span style={{ flex: 'none' }}>{I.shield}</span>Finance and the bank only. Never the brand.
      </div>
      <CTA busy={busy} onClick={async () => {
        setShow(true)
        if (bad) return
        const r = await post('bank', { bank_holder: holder.trim(), bank_iban: clean, bank_swift: swift.trim() || null, bank_country: clean.slice(0, 2) })
        if (r.ok) onDone(r.data)
      }}>Save bank details</CTA>
    </>
  )
}


/**
 * Where the product goes.
 *
 * A typed address is not a delivery instruction in the UAE. Buildings repeat, streets are
 * often unnamed, and every courier here navigates to a pin. Both are collected: the pin
 * gets somebody to the door, the text goes on the label.
 *
 * The map is INLINE and finds them on load. It used to sit behind an "Open the map" button,
 * which made the accurate route the effortful one and left typing as the path of least
 * resistance. Where the map cannot load at all, the typed fields stand on their own.
 */
function DeliveryBlock({ brand, value, onChange, show, errs }: {
  brand?: string | null
  value: { line: string; city: string; phone: string; lat: number | null; lng: number | null; maps: string; source: string | null }
  onChange: (patch: Partial<typeof value>) => void
  show: boolean
  errs: { line: string | null; city: string | null; phone: string | null }
}) {
  const [noMap, setNoMap] = useState(!mapsAvailable())
  // The typed fields are prefilled from the pin only until the creator edits them. After
  // that the map stops overwriting: somebody who has written "Apt 1204, tower B" knows
  // their building better than a reverse geocode of the pavement outside does.
  const touched = useRef(false)

  const took = (p: PickedPlace) => {
    onChange({
      lat: p.lat, lng: p.lng, source: 'map',
      ...(touched.current ? {} : { line: p.line, city: p.city }),
    })
  }

  const edit = (patch: Partial<typeof value>) => {
    touched.current = true
    onChange(patch)
  }

  return (
    <>
      <div style={{ marginTop: 22, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: '#5E5E66' }}>
        WHERE PRODUCT GOES
      </div>

      {!noMap && (
        <div style={{ marginTop: 10, background: '#121215', borderRadius: 20, padding: 14 }}>
          <InlineMapPicker
            initial={{ lat: value.lat, lng: value.lng }}
            onPick={took}
            onUnavailable={() => setNoMap(true)}
          />
        </div>
      )}

      <div style={{ marginTop: 10, background: '#121215', borderRadius: 20, overflow: 'hidden' }}>
        <Row icon={I.pin} label="Address" error={show ? errs.line : null}>
          <input style={inputStyle} value={value.line} onChange={(e) => edit({ line: e.target.value })} placeholder="Building, apartment" />
        </Row>
        <Row icon={I.city} label="City" error={show ? errs.city : null}>
          <input style={inputStyle} value={value.city} onChange={(e) => edit({ city: e.target.value })} placeholder="Dubai" />
        </Row>
        <Row icon={I.phone} label="Phone" last error={show ? errs.phone : null}>
          <input style={inputStyle} value={value.phone} onChange={(e) => edit({ phone: e.target.value })} placeholder="+971 50 000 0000" inputMode="tel" />
        </Row>
      </div>

      {noMap && (
        <input
          value={value.maps}
          onChange={(e) => onChange({ maps: e.target.value, source: 'link' })}
          placeholder="Paste a Google Maps link (optional)"
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          style={{
            width: '100%', marginTop: 10, background: '#0E0E11', borderRadius: 14,
            border: '1px solid #1E1E22', padding: '13px 14px', fontSize: 13.5,
            fontWeight: 600, color: '#fff', outline: 'none', fontFamily: 'inherit',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, fontSize: 12.5, fontWeight: 600, color: '#7E7E87', lineHeight: 1.4 }}>
        <span style={{ flex: 'none' }}>{I.box}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          {brand ? `${brand} is sending product for this campaign.` : 'Where we send product for this campaign.'}
        </span>
      </div>
    </>
  )
}

// The design's own keyframes, kept verbatim including the reduced-motion opt out.
const keyframes = `
/* The page is dark edge to edge, but html and body still carry the app's own light
   background. On iOS that is exactly what the rubber band shows when you scroll past the
   end: a white flash under a black page. Set here rather than in the root layout so it
   applies to this route only and nothing else in the product changes colour. */
html,body{background:#050506;}
@keyframes eFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes ePop{0%{opacity:0;transform:scale(.72)}62%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes eBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-13px) rotate(3deg)}}
@keyframes eTwinkle{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
@keyframes eConf{0%{opacity:0;transform:translateY(-40px) rotate(0)}10%{opacity:1}100%{opacity:.85;transform:translateY(700px) rotate(460deg)}}
@keyframes eGlow{0%,100%{opacity:.5}50%{opacity:.85}}
@keyframes eScreen{from{opacity:0}to{opacity:1}}
.eBob{animation:eBob 5s ease-in-out infinite}
.eTw{animation:eTwinkle 3.2s ease-in-out infinite;display:block}
.eGlow{animation:eGlow 6s ease-in-out infinite}
input::placeholder{color:#4A4A52}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`
