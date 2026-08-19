'use client'

/**
 * The waiting room — creators who cannot be quoted yet.
 *
 * It is two jobs, not one, and they belong to different people:
 *
 *   Needs a cost        the talent team rings the creator and records what they charge us
 *   Needs a sell price  leadership turns that into our price and releases them
 *
 * Showing both as one pile is why the room read as "nobody has priced anything" — most of it
 * was never leadership's to do. Rejecting keeps the row and every rate researched on it,
 * because a creator who is wrong for one brand is often right for the next.
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cdnAvatar } from '@/lib/avatar'
import {
  Check, X, UserPlus, Loader2, LayoutGrid, Layers, Tag, ArrowLeft, ArrowRight, Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { creatorIntakeApi, type PendingCreator } from '@/services/creatorIntakeApi'
import { AddCreatorsDialog } from '@/components/superadmin/influencer-database/AddCreatorsDialog'
import { CreatorsHubHeader } from '@/components/console/CreatorsHubHeader'
import { Aed } from '@/components/console/primitives'

const DELIVERABLES = ['reel', 'post', 'story', 'carousel'] as const
type Lane = 'needs_cost' | 'needs_sell'

const money = (c?: number | null) => (c == null ? null : (c / 100).toLocaleString('en-AE'))
const compact = (n: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`
const costOf = (c: PendingCreator, d: string) =>
  (c as unknown as Record<string, number | null>)[`cost_${d}_aed_cents`] ?? null

const since = (iso?: string | null) => {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days < 1 ? 'today' : days === 1 ? '1d' : `${days}d`
}

/** Money on screen, with the Dirham mark. */
function Money({ cents }: { cents?: number | null }) {
  const v = money(cents)
  if (v == null) return <span className="text-muted-foreground">—</span>
  return <span className="tabular-nums font-medium"><Aed>{v}</Aed></span>
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<PendingCreator[]>([])
  const [scope, setScope] = useState<string>('leadership')
  const [loading, setLoading] = useState(true)
  const [lane, setLane] = useState<Lane>('needs_cost')
  const [view, setView] = useState<'grid' | 'stack'>('grid')
  const [addOpen, setAddOpen] = useState(false)

  const [pricing, setPricing] = useState<PendingCreator | null>(null)   // sell
  const [costing, setCosting] = useState<PendingCreator | null>(null)   // cost
  const [rejecting, setRejecting] = useState<PendingCreator | null>(null)
  const [reason, setReason] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [costNote, setCostNote] = useState('')
  const [busy, setBusy] = useState(false)

  const canSell = scope === 'leadership'

  const load = async (keepLane = true) => {
    try {
      const res = await creatorIntakeApi.reviewQueue()
      const list = res.data?.items || []
      setItems(list)
      setScope(res.data?.scope || 'leadership')
      if (!keepLane) {
        // Open on the lane that is actually this person's work.
        setLane(res.data?.scope === 'leadership' && res.data?.needs_sell ? 'needs_sell' : 'needs_cost')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the waiting room')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(false) }, [])

  const lanes = useMemo(() => ({
    needs_cost: items.filter((i) => i.lane === 'needs_cost'),
    needs_sell: items.filter((i) => i.lane === 'needs_sell'),
  }), [items])
  const shown = lanes[lane]

  // ---- the card stack ------------------------------------------------------
  const [at, setAt] = useState(0)
  const [dir, setDir] = useState(1)
  const [passed, setPassed] = useState<string[]>([])
  useEffect(() => { setAt(0); setPassed([]) }, [lane, view])
  const deck = useMemo(() => shown.filter((c) => !passed.includes(c.id)), [shown, passed])
  const top = deck[at] || null

  const next = () => { setDir(1); setAt((i) => Math.min(i + 1, Math.max(deck.length - 1, 0))) }
  const back = () => { setDir(-1); setAt((i) => Math.max(i - 1, 0)) }
  const skip = () => { if (top) { setDir(1); setPassed((p) => [...p, top.id]); setAt((i) => Math.max(0, Math.min(i, deck.length - 2))) } }

  useEffect(() => {
    if (view !== 'stack') return
    const onKey = (e: KeyboardEvent) => {
      if (pricing || costing || rejecting || addOpen) return
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
      if (e.key === 'Enter' && top) { e.preventDefault(); act(top) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---- actions -------------------------------------------------------------
  const act = (c: PendingCreator) => {
    setAmounts({})
    if (c.lane === 'needs_cost') { setCostNote(''); setCosting(c) }
    else if (canSell) setPricing(c)
    else toast.info('A founder sets the sell price — your part is done')
  }

  const submitCost = async () => {
    if (!costing) return
    const payload: Record<string, number> = {}
    for (const [k, v] of Object.entries(amounts)) if (v.trim()) payload[k] = Number(v)
    if (!Object.keys(payload).length) return toast.error('Enter at least one rate')
    setBusy(true)
    try {
      await creatorIntakeApi.captureCost(costing.id, { cost_pricing: payload, note: costNote })
      toast.success(`@${costing.username} — cost saved, a founder can price them now`)
      setCosting(null); setAmounts({}); setCostNote(''); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the cost')
    } finally { setBusy(false) }
  }

  const approve = async () => {
    if (!pricing) return
    const payload: Record<string, number> = {}
    for (const [k, v] of Object.entries(amounts)) if (v.trim()) payload[k] = Number(v)
    if (!Object.keys(payload).length) return toast.error('Set at least one sell price')
    setBusy(true)
    try {
      await creatorIntakeApi.approve(pricing.id, { sell_pricing: payload })
      toast.success(`@${pricing.username} is live in the master database`)
      setPricing(null); setAmounts({}); load()
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

  // ---- pieces --------------------------------------------------------------
  const Origin = ({ c }: { c: PendingCreator }) =>
    c.origin === 'submitted' ? (
      <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
        added by {c.submitted_by_email?.split('@')[0]}
      </Badge>
    ) : (
      <Badge variant="outline" className="shrink-0 whitespace-nowrap text-muted-foreground">
        {c.origin === 'imported' ? 'from an import' : 'older record'}
      </Badge>
    )

  const Face = ({ c, size = 'h-11 w-11' }: { c: PendingCreator; size?: string }) => (
    <Avatar className={size}>
      {/* Instagram blocks hotlinks, so this always goes through our own CDN. */}
      <AvatarImage src={cdnAvatar(c.profile_image_url || undefined)} alt={c.username} />
      <AvatarFallback className="text-xs font-semibold">
        {c.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )

  const Rates = ({ c }: { c: PendingCreator }) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {DELIVERABLES.map((d) => (
        <div key={d} className="flex items-center justify-between gap-2">
          <span className="capitalize text-muted-foreground">{d}</span>
          <Money cents={costOf(c, d)} />
        </div>
      ))}
    </div>
  )

  const Actions = ({ c, big = false }: { c: PendingCreator; big?: boolean }) => (
    <div className="flex gap-2">
      <Button size={big ? 'default' : 'sm'} className="flex-1" onClick={() => act(c)}>
        {c.lane === 'needs_cost'
          ? <><Tag className="mr-1.5 h-4 w-4" />Add their cost</>
          : <><Check className="mr-1.5 h-4 w-4" />Set sell price &amp; approve</>}
      </Button>
      <Button size={big ? 'default' : 'sm'} variant="outline" onClick={() => setRejecting(c)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <SuperadminLayout>
      <CreatorsHubHeader />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Waiting room</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Creators we cannot quote yet. The talent team adds what a creator charges us;
              a founder then sets our price and releases them. Analytics only start on
              release, so nothing here has cost us anything.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div data-tour="waiting-view" className="flex rounded-lg border p-0.5">
              <Button size="sm" variant={view === 'grid' ? 'secondary' : 'ghost'}
                      className="h-8 gap-1.5 px-2.5" onClick={() => setView('grid')}>
                <LayoutGrid className="h-4 w-4" />Grid
              </Button>
              <Button size="sm" variant={view === 'stack' ? 'secondary' : 'ghost'}
                      className="h-8 gap-1.5 px-2.5" onClick={() => setView('stack')}>
                <Layers className="h-4 w-4" />One at a time
              </Button>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />Add creators
            </Button>
          </div>
        </div>

        <Tabs value={lane} onValueChange={(v: string) => setLane(v as Lane)}>
          <TabsList data-tour="waiting-lanes">
            <TabsTrigger value="needs_cost">
              Needs a cost ({lanes.needs_cost.length})
            </TabsTrigger>
            <TabsTrigger value="needs_sell">
              Needs a sell price ({lanes.needs_sell.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="-mt-2 text-sm text-muted-foreground">
          {lane === 'needs_cost'
            ? 'Nobody has recorded what these creators charge us. Ring them, then put the rate in here.'
            : 'The cost is in. Set what we charge the client and release them into the database.'}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : shown.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium">Nothing waiting here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lane === 'needs_cost'
                  ? 'Every creator in the room has a cost against them.'
                  : 'Every creator with a cost has been priced and released.'}
              </p>
            </CardContent>
          </Card>
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Face c={c} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">@{c.username}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {compact(c.followers_count)} followers
                        {c.engagement_rate != null && ` · ${Number(c.engagement_rate).toFixed(1)}%`}
                      </p>
                    </div>
                    <Origin c={c} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(c.categories || []).slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                    {c.country && <Badge variant="outline" className="text-xs">{c.country}</Badge>}
                  </div>

                  <div className="rounded-lg border bg-muted/40 px-3 py-2">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {c.lane === 'needs_cost' ? 'No cost recorded' : 'They charge us'}
                      </span>
                      {c.cost_captured_by_email && (
                        <span className="truncate pl-2 text-muted-foreground">
                          {c.cost_captured_by_email.split('@')[0]}
                          {since(c.cost_captured_at) ? ` · ${since(c.cost_captured_at)}` : ''}
                        </span>
                      )}
                    </div>
                    {c.lane === 'needs_cost'
                      ? <p className="text-xs text-muted-foreground">Add it and a founder can price them.</p>
                      : <Rates c={c} />}
                  </div>

                  {c.sourced_for && (
                    <p className="text-xs text-muted-foreground">
                      Found for <span className="text-foreground">{c.sourced_for_brand || c.sourced_for}</span>
                    </p>
                  )}
                  {(c.cost_note || c.submitted_note) && (
                    <p className="line-clamp-2 text-xs italic text-muted-foreground">
                      “{c.cost_note || c.submitted_note}”
                    </p>
                  )}

                  <Actions c={c} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* one at a time — for working a long backlog without reading a wall of cards */
          <div className="mx-auto w-full max-w-xl">
            {!top ? (
              <Card>
                <CardContent className="space-y-3 py-16 text-center">
                  <p className="text-sm font-medium">You have been through the stack</p>
                  {passed.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => { setPassed([]); setAt(0) }}>
                      <Undo2 className="mr-1.5 h-4 w-4" />Bring back the {passed.length} you skipped
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="relative h-[30rem]">
                  {/* the cards behind, so the stack looks like a stack */}
                  {deck.slice(at + 1, at + 3).map((c, i) => (
                    <div key={c.id}
                         className="absolute inset-x-0 top-0 rounded-xl border bg-card"
                         style={{ height: '100%', transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.03})`, opacity: 0.5 - i * 0.2 }} />
                  ))}
                  <AnimatePresence initial={false} custom={dir} mode="popLayout">
                    <motion.div
                      key={top.id}
                      custom={dir}
                      initial={{ x: dir * 240, opacity: 0, rotate: dir * 4 }}
                      animate={{ x: 0, opacity: 1, rotate: 0 }}
                      exit={{ x: -dir * 240, opacity: 0, rotate: -dir * 4 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      className="absolute inset-0"
                    >
                      <Card className="h-full overflow-hidden">
                        <CardContent className="flex h-full flex-col gap-4 p-6">
                          <div className="flex items-start gap-4">
                            <Face c={top} size="h-16 w-16" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-lg font-semibold">@{top.username}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {top.full_name || '—'}
                              </p>
                              <p className="mt-1 text-sm">
                                {compact(top.followers_count)} followers
                                {top.engagement_rate != null && ` · ${Number(top.engagement_rate).toFixed(1)}% engagement`}
                              </p>
                            </div>
                            <Origin c={top} />
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(top.categories || []).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                            ))}
                            {top.country && <Badge variant="outline" className="text-xs">{top.country}</Badge>}
                          </div>

                          <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="mb-2 text-sm font-medium">
                              {top.lane === 'needs_cost' ? 'No cost recorded yet' : 'They charge us'}
                            </p>
                            {top.lane === 'needs_cost'
                              ? <p className="text-sm text-muted-foreground">
                                  Add what they quoted you and a founder can set our price.
                                </p>
                              : <Rates c={top} />}
                          </div>

                          {top.sourced_for && (
                            <p className="text-sm text-muted-foreground">
                              Found for <span className="text-foreground">{top.sourced_for_brand || top.sourced_for}</span>
                            </p>
                          )}
                          {(top.cost_note || top.submitted_note) && (
                            <p className="text-sm italic text-muted-foreground">
                              “{top.cost_note || top.submitted_note}”
                            </p>
                          )}

                          <div className="mt-auto space-y-2">
                            <Actions c={top} big />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <button className="inline-flex items-center gap-1 hover:text-foreground"
                                      onClick={back} disabled={at === 0}>
                                <ArrowLeft className="h-3.5 w-3.5" />Back
                              </button>
                              <span>{at + 1} of {deck.length}</span>
                              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={skip}>
                                Skip for now<ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Arrow keys move through the stack, Enter opens the pricing box.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* the talent team's step: what the creator charges us */}
      <Dialog open={!!costing} onOpenChange={(o: boolean) => { if (!o) { setCosting(null); setAmounts({}) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What does @{costing?.username} charge us?</DialogTitle>
            <DialogDescription>
              The rate they quoted you, in AED. Fill in what you have — you can add the rest
              later. This does not release them; a founder sets our price after this.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {DELIVERABLES.map((d) => (
              <div key={d}>
                <Label className="text-xs capitalize">{d}</Label>
                <Input className="mt-1.5" type="number" inputMode="decimal" placeholder="—"
                       value={amounts[d] || ''}
                       onChange={(e) => setAmounts((p) => ({ ...p, [d]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs">Anything worth knowing (optional)</Label>
            <Textarea className="mt-1.5" rows={2} value={costNote}
                      onChange={(e) => setCostNote(e.target.value)}
                      placeholder="e.g. rate holds until end of month, wants product too" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCosting(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitCost} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* the founder's step: our price, and release */}
      <Dialog open={!!pricing} onOpenChange={(o: boolean) => { if (!o) { setPricing(null); setAmounts({}) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Price @{pricing?.username}</DialogTitle>
            <DialogDescription>
              What we charge a client. Approving releases this creator into the master
              database — from that moment they can go on a proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {DELIVERABLES.map((d) => {
              const cost = pricing ? costOf(pricing, d) : null
              const sell = Number(amounts[d] || 0) * 100
              const margin = cost && sell ? Math.round(((sell - cost) / sell) * 100) : null
              return (
                <div key={d} className="flex items-center gap-3">
                  <Label className="w-20 shrink-0 text-xs capitalize">{d}</Label>
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">
                    costs <Money cents={cost} />
                  </span>
                  <Input type="number" inputMode="decimal" placeholder="our price"
                         value={amounts[d] || ''}
                         onChange={(e) => setAmounts((p) => ({ ...p, [d]: e.target.value }))} />
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {margin != null ? `${margin}%` : ''}
                  </span>
                </div>
              )
            })}
          </div>
          {pricing?.cost_note && (
            <p className="text-xs italic text-muted-foreground">
              Talent noted: “{pricing.cost_note}”
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

      {/* turn down */}
      <Dialog open={!!rejecting} onOpenChange={(o: boolean) => { if (!o) { setRejecting(null); setReason('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn down @{rejecting?.username}?</DialogTitle>
            <DialogDescription>
              They stay in the database with every rate already researched — nothing is lost,
              and they can be approved later for a different brand.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">Reason (optional)</Label>
            <Input className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)}
                   placeholder="e.g. audience mostly outside the GCC" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Turn down
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCreatorsDialog open={addOpen} onOpenChange={setAddOpen} onAdded={() => load()} />
    </SuperadminLayout>
  )
}
