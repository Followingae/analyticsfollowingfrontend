'use client'

/**
 * The client's view of a shortlist.
 *
 * Same shape as the proposal share pages: a link, no login, and only what the brand should
 * see. They tick the creators they want, optionally say why not for the rest, and submit.
 *
 * A "no" here is worth as much as a yes — it becomes an exclusion, so the same creator is
 * never put in front of this brand again.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Check, X, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/s`

const compact = (n: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`
const aed = (c: number | null) =>
  c == null ? null : `AED ${(c / 100).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`

export default function ClientShortlistPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [note, setNote] = useState('')
  const [why, setWhy] = useState<Record<string, string>>({})

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/${token}`)
      if (!res.ok) {
        setError(res.status === 410 ? 'This link has expired.' : 'This link is not valid.')
        return
      }
      setData((await res.json()).data)
    } catch {
      setError('We could not load this page.')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [token])

  const verdict = async (id: string, v: 'selected' | 'rejected' | 'pending') => {
    setBusy(true)
    try {
      await fetch(`${BASE}/${token}/verdict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, verdict: v, reason: why[id] }),
      })
      setData((d: any) => ({
        ...d,
        creators: d.creators.map((c: any) => c.id === id ? { ...c, client_verdict: v } : c),
      }))
    } catch {
      toast.error('That did not save — try again.')
    } finally { setBusy(false) }
  }

  const submit = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${BASE}/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      toast.error('We could not send that — try again.')
    } finally { setBusy(false) }
  }

  if (loading) {
    return <Shell><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></Shell>
  }
  if (error) {
    return <Shell><Card><CardContent className="py-16 text-center">
      <p className="font-medium">{error}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask your contact at Following for a fresh link.
      </p>
    </CardContent></Card></Shell>
  }
  if (done) {
    return <Shell><Card><CardContent className="flex flex-col items-center gap-3 py-20 text-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      <p className="text-lg font-semibold">Thank you</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your choices are with the team. If you would like to see more options, just say — we
        will send a fresh set that leaves out anyone you have turned down.
      </p>
    </CardContent></Card></Shell>
  }

  const creators = data.creators || []
  const picked = creators.filter((c: any) => c.client_verdict === 'selected').length
  const answered = creators.filter((c: any) => c.client_verdict !== 'pending').length
  const crit = data.criteria || {}

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {data.client_name || 'Shortlist'}{data.round_no > 1 ? ` · round ${data.round_no}` : ''}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {creators.length} creator{creators.length === 1 ? '' : 's'} selected for you. Tick the
          ones you would like to work with — and if any are not right, a quick word on why helps
          us get the next set closer.
        </p>
        {Object.keys(crit).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(crit).map(([k, v]) => (
              <Badge key={k} variant="outline" className="capitalize">
                {k.replace(/_/g, ' ')}: {String(v)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c: any) => {
          const picked = c.client_verdict === 'selected'
          const no = c.client_verdict === 'rejected'
          return (
            <Card key={c.id}
                  className={`transition ${picked ? 'ring-2 ring-primary' : no ? 'opacity-60' : ''}`}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-xs font-semibold">
                      {c.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">@{c.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {compact(c.followers_count)} followers
                      {c.engagement_rate != null && ` · ${Number(c.engagement_rate).toFixed(1)}%`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(c.categories || []).slice(0, 3).map((x: string) => (
                    <Badge key={x} variant="secondary" className="text-xs capitalize">{x}</Badge>
                  ))}
                  {c.country && <Badge variant="outline" className="text-xs">{c.country}</Badge>}
                </div>

                {aed(c.sell_reel_aed_cents) && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Reel · </span>
                    <span className="font-medium tabular-nums">{aed(c.sell_reel_aed_cents)}</span>
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" variant={picked ? 'default' : 'outline'}
                          disabled={busy}
                          onClick={() => verdict(c.id, picked ? 'pending' : 'selected')}>
                    <Check className="mr-1.5 h-4 w-4" />{picked ? 'Chosen' : 'Choose'}
                  </Button>
                  <Button size="sm" variant={no ? 'secondary' : 'outline'} disabled={busy}
                          onClick={() => verdict(c.id, no ? 'pending' : 'rejected')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {no && (
                  <Input
                    className="text-sm" placeholder="Not right because… (optional)"
                    value={why[c.id] || ''}
                    onChange={e => setWhy(p => ({ ...p, [c.id]: e.target.value }))}
                    onBlur={() => verdict(c.id, 'rejected')}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8">
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="font-medium">Anything else we should know?</p>
            <p className="text-sm text-muted-foreground">
              Budget, timing, or the kind of creator you had in mind.
            </p>
          </div>
          <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Optional" />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={busy || answered === 0}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Send {picked > 0 ? `${picked} choice${picked === 1 ? '' : 's'}` : 'my feedback'}
            </Button>
            <p className="text-sm text-muted-foreground">
              {answered} of {creators.length} reviewed
            </p>
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {children}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Shared by Following · this link is private, please do not forward it
        </p>
      </div>
    </div>
  )
}
