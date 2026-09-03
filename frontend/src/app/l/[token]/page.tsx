'use client'

/**
 * Public creator list — /l/{token}.
 *
 * No login, no account, no credits. A superadmin mints the link with an expiry; anyone
 * holding the URL sees the roster. Cost and margin are never sent by the endpoint, so there
 * is nothing here to hide client-side.
 *
 * Where a creator already has their own share link, their row opens it — the recipient can
 * go from the roster into the real analytics page for the ones we have measured.
 *
 * The recipient can answer here, per creator. Until now they replied in WhatsApp and someone
 * re-typed it, which is where picks got lost between "they liked six" and building the
 * proposal; an answer given here lands straight on the row we researched.
 *
 * No AuthGuard and no app chrome: the viewer has no session, and a sidebar full of links
 * they cannot open is worse than none.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import { cdnAvatar } from '@/lib/avatar'

interface Creator {
  username: string
  full_name: string | null
  profile_image_url: string | null
  followers_count: number | null
  engagement_rate: number | null
  categories: string[] | null
  country: string | null
  tier: string | null
  analytics_path: string | null
  prices_aed?: { post: number | null; reel: number | null; story: number | null }
  verdict?: 'selected' | 'rejected' | null
  verdict_reason?: string | null
}

interface ListPayload {
  name: string
  description: string | null
  expires_at: string | null
  shows_prices: boolean
  creators: Creator[]
  count: number
}

const compact = (n: number | null) =>
  n == null ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)

const aed = (v: number | null | undefined) =>
  v == null ? null : `AED ${v.toLocaleString('en-AE')}`

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

export default function PublicListPage() {
  const token = useParams().token as string
  const [data, setData] = useState<ListPayload | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'gone'>('loading')
  const [saving, setSaving] = useState<string | null>(null)

  /** Their answer on one creator. Changing it later is normal, so this overwrites. */
  const answer = async (username: string, verdict: 'selected' | 'rejected') => {
    setSaving(username)
    const previous = data
    // Answer on the card immediately — the recipient is deciding, not waiting on us.
    setData(d => d && {
      ...d,
      creators: d.creators.map(c => c.username === username
        ? { ...c, verdict: c.verdict === verdict ? null : verdict } : c),
    })
    try {
      const target = previous?.creators.find(c => c.username === username)
      if (target?.verdict === verdict) { setSaving(null); return }
      const r = await fetch(`${API_CONFIG.BASE_URL}/api/v1/public/lists/${token}/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, verdict }),
      })
      if (!r.ok) throw new Error('failed')
    } catch {
      setData(previous)
    } finally {
      setSaving(null)
    }
  }

  useEffect(() => {
    if (!token) return
    fetch(`${API_CONFIG.BASE_URL}/api/v1/public/lists/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('gone')
        return r.json()
      })
      .then((j) => { setData(j.data); setState('ok') })
      .catch(() => setState('gone'))
  }, [token])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  // An expired or revoked link says only that. The holder of a dead URL is not owed the
  // information that it was once live, or what was on it.
  if (state === 'gone' || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <Logo />
        <h1 className="mt-4 text-xl font-semibold">This link is no longer available</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may have expired or been turned off. Ask whoever sent it for a new one.
        </p>
      </div>
    )
  }

  const picked = data.creators.filter(c => c.verdict === 'selected').length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Logo />
          <span className="text-xs text-muted-foreground">Creator list</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
        {data.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{data.description}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {data.count} creator{data.count === 1 ? '' : 's'}
          {picked > 0 && ` · ${picked} picked`}
          {data.expires_at && ` · link open until ${new Date(data.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.creators.map((c) => {
            const avatar = cdnAvatar(c.profile_image_url || undefined)
            const prices = c.prices_aed
              ? ([['Reel', c.prices_aed.reel], ['Post', c.prices_aed.post], ['Story', c.prices_aed.story]] as const)
                  .filter(([, v]) => v != null)
              : []
            const row = (
              <div className="h-full rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                    {avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.full_name || c.username}</div>
                    <div className="truncate text-sm text-muted-foreground">@{c.username}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <div className="font-semibold tabular-nums">{compact(c.followers_count)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  {c.engagement_rate != null && (
                    <div>
                      <div className="font-semibold tabular-nums">{c.engagement_rate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                  )}
                  {c.country && (
                    <div>
                      <div className="font-semibold">{c.country}</div>
                      <div className="text-xs text-muted-foreground">Market</div>
                    </div>
                  )}
                </div>

                {prices.length > 0 && (
                  <div className="mt-4 space-y-1 border-t pt-3">
                    {prices.map(([label, v]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">{aed(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {c.analytics_path && (
                  <a href={c.analytics_path} target="_blank" rel="noopener noreferrer"
                     className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                    See full numbers →
                  </a>
                )}

                {/* Their answer. Tapping the same button again clears it — people change
                    their minds, and a locked-in first tap is worse than no answer. */}
                <div className="mt-4 flex gap-2 border-t pt-3">
                  <button
                    type="button"
                    disabled={saving === c.username}
                    onClick={() => answer(c.username, 'selected')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      c.verdict === 'selected'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {c.verdict === 'selected' ? 'Picked' : 'Pick'}
                  </button>
                  <button
                    type="button"
                    disabled={saving === c.username}
                    onClick={() => answer(c.username, 'rejected')}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      c.verdict === 'rejected'
                        ? 'border-foreground/30 bg-muted text-muted-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {c.verdict === 'rejected' ? 'Passed' : 'Pass'}
                  </button>
                </div>
              </div>
            )

            // The card is no longer a link: it now carries buttons, and a card-wide link
            // would swallow every tap meant for them.
            return <div key={c.username}>{row}</div>
          })}
        </div>
      </main>
    </div>
  )
}
