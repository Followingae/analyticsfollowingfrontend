'use client'

/**
 * At-venue visit confirmation — /v/{token}. No login, no account, no app.
 *
 * A creator on a dine-in barter campaign shows the QR from their app. A member of
 * venue staff points their ordinary phone camera at it and lands here. They see
 * who is standing in front of them and what the collaboration covers, type the
 * venue's 6-digit code, and confirm.
 *
 * Everything about this page assumes a host stand mid-service: one thumb, poor
 * light, a queue behind the guest. So — huge photo (recognising a face is the
 * actual security check), the entitlement in plain words, one button, and an
 * already-confirmed state that reads as a calm fact rather than a red error,
 * because staff double-tap and a legitimate guest must never see a failure.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import { Loader2, Check, UtensilsCrossed, Users, AlertCircle } from 'lucide-react'

const VENUE = `${API_CONFIG.BASE_URL}/api/v1/public/venue`

interface VisitData {
  state: string
  locked?: boolean
  creator: { instagram_username: string | null; full_name: string | null; avatar_url: string | null }
  campaign: { name: string | null; brand_name: string | null; brand_logo_url: string | null }
  venue: { name: string | null; logo_url: string | null; address: string | null }
  entitlement: { label: string | null; cap_aed: number | null }
  code: string | null
  confirmed_at: string | null
  party_size: number | null
}

/** Copy for every state the venue can land in. Written for someone who has never
 *  seen this screen before and has ten seconds to understand it. */
const STATE_COPY: Record<string, { title: string; body: string }> = {
  already_confirmed: { title: 'Already confirmed', body: 'This visit has been confirmed. Nothing more to do.' },
  not_issued: { title: 'Not active yet', body: "This creator hasn't been approved for the campaign yet, so their code isn't live." },
  campaign_ended: { title: 'Campaign has ended', body: 'This collaboration is no longer running. Please contact Following.' },
  not_dine_in: { title: 'Not a dine-in code', body: 'This code is redeemed online through the brand, not at a venue.' },
  venue_not_ready: { title: 'Venue not set up', body: 'This venue has no confirmation code yet. Please contact Following.' },
  unknown: { title: "Code isn't recognised", body: 'Please check the QR and try again.' },
}

function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/followinglogo.svg" alt="Following" className={`${className} block dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Following Logo Dark Mode.svg" alt="Following" className={`${className} hidden dark:block`} />
    </>
  )
}

export default function VenueConfirmPage() {
  const params = useParams()
  const token = String(params?.token || '')

  const [data, setData] = useState<VisitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [venueCode, setVenueCode] = useState('')
  const [partySize, setPartySize] = useState('')
  const [bill, setBill] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${VENUE}/${token}`)
      if (!res.ok) { setNotFound(true); return }
      const body = await res.json()
      setData(body?.data ?? null)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const confirm = async () => {
    if (!token || venueCode.trim().length < 4) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${VENUE}/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_code: venueCode.trim(),
          party_size: partySize ? Number(partySize) : null,
          bill_amount_aed: bill ? Number(bill) : null,
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.detail || 'Could not confirm. Please try again.')
        return
      }
      setData(body?.data ?? null)
    } catch {
      setError('Network problem — check the connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (notFound || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Code isn&apos;t recognised</h1>
        <p className="text-sm text-muted-foreground">Please check the QR code and try again.</p>
      </main>
    )
  }

  const { creator, campaign, venue, entitlement } = data
  const handle = creator.instagram_username ? `@${creator.instagram_username}` : 'Creator'
  const done = data.state === 'confirmed' || data.state === 'already_confirmed'
  const blocked = !done && data.state !== 'ok'

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <Logo className="h-5 w-auto" />
          {venue.name && <span className="text-xs text-muted-foreground truncate max-w-[55%]">{venue.name}</span>}
        </header>

        {/* Who is standing here. Deliberately the largest thing on the page — a
            member of staff recognising the face is the real check, not the code. */}
        <section className="mt-8 flex flex-col items-center text-center">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={handle}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-border"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
              {handle.replace('@', '').slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="mt-4 text-xl font-semibold">{creator.full_name || handle}</h1>
          {creator.full_name && <p className="text-sm text-muted-foreground">{handle}</p>}
          {campaign.brand_name && (
            <p className="mt-1 text-xs text-muted-foreground">{campaign.brand_name}</p>
          )}
        </section>

        {/* What the host is actually authorising. Without this they're guessing. */}
        {(entitlement.label || entitlement.cap_aed) && (
          <section className="mt-6 rounded-2xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <UtensilsCrossed className="h-3.5 w-3.5" />This visit covers
            </div>
            <p className="mt-1.5 text-base font-medium">
              {entitlement.label || `Up to AED ${entitlement.cap_aed}`}
            </p>
          </section>
        )}

        {done ? (
          <section className="mt-8 flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="mt-3 font-semibold text-emerald-700 dark:text-emerald-400">Visit confirmed</p>
            {data.confirmed_at && (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(data.confirmed_at).toLocaleString()}
              </p>
            )}
            {data.party_size ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />{data.party_size} guests
              </p>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">You can close this page.</p>
          </section>
        ) : blocked ? (
          <section className="mt-8 rounded-2xl border p-6 text-center">
            <AlertCircle className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 font-semibold">{(STATE_COPY[data.state] || STATE_COPY.unknown).title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(STATE_COPY[data.state] || STATE_COPY.unknown).body}
            </p>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium">Venue code</label>
              <input
                value={venueCode}
                onChange={(e) => setVenueCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                // Numeric keypad + no autocorrect: this is typed on a phone, fast.
                inputMode="numeric"
                autoComplete="off"
                placeholder="6 digits"
                className="mt-1.5 w-full rounded-xl border bg-background px-4 py-3.5 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                The code on your Following card at the till.
              </p>
            </div>

            {/* Optional, and clearly so — a host under pressure skips straight to
                Confirm, and the visit still records correctly. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Guests (optional)</label>
                <input
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bill AED (optional)</label>
                <input
                  value={bill}
                  onChange={(e) => setBill(e.target.value.replace(/[^\d.]/g, '').slice(0, 8))}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <button
              onClick={confirm}
              disabled={submitting || venueCode.length < 4 || !!data.locked}
              className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-40"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Confirming…</span>
              ) : (
                'Confirm visit'
              )}
            </button>

            {data.locked && (
              <p className="text-center text-xs text-destructive">
                Too many incorrect codes. Try again in 15 minutes.
              </p>
            )}

            {data.code && (
              <p className="text-center text-xs text-muted-foreground">
                Creator code <span className="font-mono">{data.code}</span>
              </p>
            )}
          </section>
        )}

        <footer className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
          Confirming records this collaboration as delivered.
        </footer>
      </div>
    </main>
  )
}
