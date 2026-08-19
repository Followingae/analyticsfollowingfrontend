'use client'

/**
 * The waiting room — creators the team has found, waiting on a price and a decision.
 *
 * This is the gate: nothing here is visible to a client or selectable in a proposal until
 * a superadmin sets a sell price and approves. Rejecting keeps the row and every rate that
 * was researched on it, because a creator who is wrong for one brand is often right for the
 * next one.
 */
import { useEffect, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cdnAvatar } from '@/lib/avatar'
import { Clock, Check, X, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { creatorIntakeApi, type PendingCreator } from '@/services/creatorIntakeApi'
import { AddCreatorsDialog } from '@/components/superadmin/influencer-database/AddCreatorsDialog'
import { CreatorsHubHeader } from '@/components/console/CreatorsHubHeader'

const aed = (c: number | null) => (c == null ? null : `⃃ ${(c / 100).toLocaleString('en-AE')}`)
const compact = (n: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

const waitingFor = (iso: string | null) => {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  return days === 1 ? '1 day' : `${days} days`
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<PendingCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [pricing, setPricing] = useState<PendingCreator | null>(null)
  const [rejecting, setRejecting] = useState<PendingCreator | null>(null)
  const [reason, setReason] = useState('')
  const [sell, setSell] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const res = await creatorIntakeApi.reviewQueue()
      setItems(res.data?.items || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the waiting room')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const approve = async () => {
    if (!pricing) return
    const payload: Record<string, number> = {}
    for (const [k, v] of Object.entries(sell)) if (v.trim()) payload[k] = Number(v)
    if (!Object.keys(payload).length) {
      toast.error('Set at least one sell price — an unpriced creator cannot be quoted')
      return
    }
    setBusy(true)
    try {
      await creatorIntakeApi.approve(pricing.id, { sell_pricing: payload })
      toast.success(`@${pricing.username} is live in the master database`)
      setPricing(null); setSell({}); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not approve')
    } finally { setBusy(false) }
  }

  const reject = async () => {
    if (!rejecting) return
    setBusy(true)
    try {
      await creatorIntakeApi.reject(rejecting.id, reason)
      toast.success(`@${rejecting.username} turned down — their rates are kept`)
      setRejecting(null); setReason(''); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reject')
    } finally { setBusy(false) }
  }

  return (
    <SuperadminLayout>
      <CreatorsHubHeader />
      {/* Pricing on screen: stamped so a leaked screenshot is attributable. */}
      <div className="space-y-8">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Waiting room</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Everyone who cannot be quoted yet — new arrivals, and creators whose cost we
              researched but never priced. Analytics only start once you approve, so nothing
              here has cost us anything.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!loading && (
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />{items.length} waiting
              </Badge>
            )}
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />Add creators
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium">Nothing waiting</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every creator has a sell price and has been released.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      {/* Instagram blocks hotlinks, so this always goes through our own CDN;
                          a creator we have not photographed yet falls back to initials. */}
                      <AvatarImage src={cdnAvatar(c.profile_image_url || undefined)} alt={c.username} />
                      <AvatarFallback className="text-xs font-semibold">
                        {c.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">@{c.username}</CardTitle>
                      <CardDescription className="truncate">
                        {compact(c.followers_count)} followers
                        {c.engagement_rate != null && ` · ${Number(c.engagement_rate).toFixed(1)}%`}
                      </CardDescription>
                    </div>
                    {waitingFor(c.submitted_at) && (
                      <Badge variant="secondary" className="shrink-0">{waitingFor(c.submitted_at)}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(c.categories || []).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                    {c.country && <Badge variant="outline" className="text-xs">{c.country}</Badge>}
                    {c.analytics_waiting_on_approval ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        analytics start on approval
                      </Badge>
                    ) : c.analytics_status && c.analytics_status !== 'completed' ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        analytics {c.analytics_status}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                    {c.waiting_for && (
                      <div className="mb-1 font-medium">{c.waiting_for}</div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost (reel)</span>
                      <span className="font-medium tabular-nums">
                        {aed(c.cost_reel_aed_cents) ?? 'not captured yet'}
                      </span>
                    </div>
                    {c.submitted_by_email && (
                      <div className="mt-1 flex justify-between">
                        <span className="text-muted-foreground">Found by</span>
                        <span className="truncate pl-2">{c.submitted_by_email}</span>
                      </div>
                    )}
                    {/* Who they were found for. Pricing a creator is a different decision
                        when a brand is waiting on them than when nobody is. */}
                    {c.sourced_for && (
                      <div className="mt-1 flex justify-between">
                        <span className="text-muted-foreground">Sourced for</span>
                        <span className="truncate pl-2">
                          {c.sourced_for_brand || c.sourced_for}
                        </span>
                      </div>
                    )}
                  </div>

                  {c.submitted_note && (
                    <p className="text-xs italic text-muted-foreground">“{c.submitted_note}”</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={() => { setPricing(c); setSell({}) }}>
                      <Check className="mr-1.5 h-4 w-4" />Price &amp; approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejecting(c)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* price & approve */}
      <Dialog open={!!pricing} onOpenChange={(o: boolean) => { if (!o) { setPricing(null); setSell({}) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Price @{pricing?.username}</DialogTitle>
            <DialogDescription>
              What we charge a client. Approving releases this creator into the master database —
              from that moment they can be put in a proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {['reel', 'post', 'story', 'carousel'].map((d) => (
              <div key={d}>
                <Label className="text-xs capitalize">{d} (AED)</Label>
                <Input
                  className="mt-1.5" type="number" inputMode="decimal" placeholder="—"
                  value={sell[d] || ''}
                  onChange={(e) => setSell((p) => ({ ...p, [d]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          {pricing?.cost_reel_aed_cents != null && (
            <p className="text-xs text-muted-foreground">
              Reel costs us {aed(pricing.cost_reel_aed_cents)}.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={approve} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reject */}
      <Dialog open={!!rejecting} onOpenChange={(o: boolean) => { if (!o) { setRejecting(null); setReason('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn down @{rejecting?.username}?</DialogTitle>
            <DialogDescription>
              They stay in the database with every rate already researched — nothing is lost, and
              they can be approved later for a different brand.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Reason (optional)</Label>
            <Input
              className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. audience mostly outside the GCC"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Turn down
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCreatorsDialog open={addOpen} onOpenChange={setAddOpen} onAdded={load} />
    </SuperadminLayout>
  )
}
