'use client'

/**
 * Client links that are checked and ready to go out.
 *
 * WHAT WAS BROKEN. The link worked. A superadmin minted a /p/{token}, a client opened it,
 * and it did its job. Everything AROUND the send happened outside the platform: the link
 * was minted, Aisha was emailed separately to say so, she sent it from her own inbox, and
 * nothing here knew. The only record that a client had been sent a quotation lived in two
 * people's sent folders.
 *
 * THE CLIENT STILL HEARS FROM A PERSON, out of a real inbox. That is the house rule and
 * this screen does not change it: there is no "send" button that emails a brand. What there
 * is, is the link, who it is for, and a button that says "I have sent this", so the fact
 * exists somewhere other than a sent folder.
 *
 * A LINK NOBODY HAS MARKED READY IS NOT HERE. It exists and it is not yet anybody's job.
 * Showing it would invite somebody to send a quotation while the pricing was still moving.
 */

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { person } from '@/services/crmApi'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/handovers`

type Link = {
  token: string
  url: string
  reveal_mode: string
  proposal: string
  proposal_id: string
  client: string | null
  handed_over_at: string
  handover_note: string | null
  handed_to_email: string | null
  sent_at: string | null
  sent_by_email: string | null
  sent_note: string | null
  expires_at: string | null
}

export default function HandoversPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Handovers /></SuperadminLayout>
    </AuthGuard>
  )
}

function Handovers() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(BASE)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || 'Could not read these')
      setLinks(json.data?.links || [])
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read these')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const copy = async (l: Link) => {
    try {
      await navigator.clipboard.writeText(l.url)
      toast.success('Link copied. Paste it into your email to the client.')
    } catch {
      toast.error('Could not copy it. Select the link and copy it by hand.')
    }
  }

  const markSent = async (l: Link) => {
    setBusy(l.token)
    try {
      const res = await fetchWithAuth(`${BASE}/${l.token}/sent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.detail || 'Could not record that')
      toast.success('Recorded. It is on the client’s file now.')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record that')
    } finally { setBusy(null) }
  }

  const toSend = links.filter((l) => !l.sent_at)
  const sent = links.filter((l) => l.sent_at)

  return (
    <div className="space-y-6">
      <PageHead
        title="Ready to send"
        sub="Links a founder has checked. You send them from your own inbox, as always."
      />

      <ReadState
        failed={failed} loading={loading} empty={links.length === 0}
        what="links ready to send" onRetry={load}
        nothing="Nothing is waiting to go out."
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking
        </div>}
      >
        <div className="space-y-7">
          {toSend.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title="Waiting to go out"
                count={toSend.length}
                note="Copy the link into your own email. Then say you have sent it."
              />
              <div className="flex flex-col gap-2">
                {toSend.map((l) => (
                  <article key={l.token} className={cn(CARD, 'bg-card p-4')}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-ds-label font-semibold">
                            {l.client || 'No client on record'}
                          </span>
                          {/* An open link is a full roster and price list authorised by
                              possession of the URL. Worth saying out loud before somebody
                              forwards it on. */}
                          {l.reveal_mode === 'open' && (
                            <Badge variant="outline"
                                   className="border-transparent bg-[var(--tone-warn-wash)]
                                              text-[var(--tone-warn-ink)] text-ds-overline">
                              Full roster and prices
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-ds-caption text-muted-foreground">
                          {l.proposal}
                        </p>
                        {l.handover_note && (
                          <p className="reading-width text-ds-caption leading-relaxed">
                            {l.handover_note}
                          </p>
                        )}
                        <p className="text-ds-caption text-muted-foreground">
                          Checked {new Date(l.handed_over_at).toLocaleDateString()}
                          {l.handed_to_email && ` · for ${person(l.handed_to_email)}`}
                          {l.expires_at &&
                            ` · expires ${new Date(l.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => copy(l)}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={l.url} target="_blank" rel="noreferrer"
                             aria-label="Open the link as the client sees it">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button size="sm" disabled={busy === l.token}
                                onClick={() => markSent(l)}>
                          {busy === l.token
                            ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            : <Send className="mr-1.5 h-3.5 w-3.5" />}
                          I have sent it
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {sent.length > 0 && (
            <section className="space-y-3">
              <SectionHead title="Gone to the client" count={sent.length}
                           note="On the client's record, with who sent it and when." />
              <div className="flex flex-col gap-1.5">
                {sent.map((l) => (
                  <div key={l.token}
                       className={cn(CARD, 'flex flex-wrap items-center gap-3 bg-card px-4 py-2.5')}>
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--tone-good-ink)]" />
                    <span className="min-w-0 flex-1 truncate text-ds-caption">
                      <span className="font-medium">{l.client || l.proposal}</span>
                      {' · '}{l.proposal}
                    </span>
                    <span className="shrink-0 text-ds-caption text-muted-foreground">
                      {person(l.sent_by_email)} ·{' '}
                      {new Date(l.sent_at!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </ReadState>
    </div>
  )
}
