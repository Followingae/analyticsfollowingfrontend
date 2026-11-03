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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cdnAvatar } from '@/lib/avatar'
import {
  Check, X, UserPlus, Loader2, LayoutGrid, Layers, Tag, ArrowLeft, ArrowRight, Undo2, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { creatorIntakeApi, type PendingCreator } from '@/services/creatorIntakeApi'
import { AddCreatorsDialog } from '@/components/superadmin/influencer-database/AddCreatorsDialog'
import { CreatorsHubHeader } from '@/components/console/CreatorsHubHeader'
import { Aed, CARD, PageHead } from '@/components/console/primitives'
import { Dash, ReadState } from '@/components/console/surfaces'
import { fullName } from '@/lib/destinations'
import { briefLine } from '@/lib/areaBrief'
import type { AreaBrief } from '@/services/imdListsApi'

const DELIVERABLES = ['reel', 'post', 'story', 'carousel'] as const
type Lane = 'needs_cost' | 'needs_sell' | 'barter'
type Sort = 'newest' | 'followers' | 'cost'
const ALL = '__all__'
const NONE = '__none__'
const SIZES: { key: string; label: string; min: number; max: number | null }[] = [
  { key: ALL, label: 'Any size', min: -1, max: null },
  { key: 'u10', label: 'Under 10K', min: 0, max: 10_000 },
  { key: '10-50', label: '10K to 50K', min: 10_000, max: 50_000 },
  { key: '50-250', label: '50K to 250K', min: 50_000, max: 250_000 },
  { key: '250', label: '250K+', min: 250_000, max: null },
]
const ORIGIN_LABEL: Record<string, string> = { submitted: 'Added by the team', imported: 'From an import', legacy: 'Older record' }

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
  /* Whether the queue came back. "Every creator here has a cost recorded" is a flat claim
     about the data, and it was being made on the strength of a request that did not answer. */
  const [failed, setFailed] = useState(false)
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
    setFailed(false)
    try {
      const res = await creatorIntakeApi.reviewQueue()
      const list = res.data?.items || []
      setItems(list)
      setScope(res.data?.scope || 'leadership')
      if (!keepLane) {
        // Open on the lane with work this person can do: founders price first, the talent team
        // records costs. An empty lane never opens when the other one has something in it.
        const sell = list.filter((i) => i.lane === 'needs_sell' && !i.barter).length
        const cost = list.filter((i) => i.lane === 'needs_cost' && !i.barter).length
        const leader = (res.data?.scope || 'leadership') === 'leadership'
        setLane(leader ? (sell ? 'needs_sell' : cost ? 'needs_cost' : 'needs_sell')
                       : (cost ? 'needs_cost' : sell ? 'needs_sell' : 'needs_cost'))
      }
    } catch (e) {
      setFailed(true)
      setItems([])
      toast.error(e instanceof Error ? e.message : 'Could not load these creators')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(false) }, [])

  // ---- find, filter, sort ----------------------------------------------------
  const [q, setQ] = useState('')
  const [roster, setRoster] = useState<string>(ALL)
  const [origin, setOrigin] = useState<string>(ALL)
  const [size, setSize] = useState<string>(ALL)
  const [costed, setCosted] = useState<string>(ALL)
  const [sort, setSort] = useState<Sort>('newest')

  const rosters = useMemo(() => {
    const m = new Map<string, string>()
    for (const i of items) {
      const k = i.sourced_for_list_id || (i.sourced_for ? `name:${i.sourced_for}` : NONE)
      if (!m.has(k)) m.set(k, k === NONE ? 'Not for a roster'
        : [i.sourced_for_brand, i.sourced_for].filter(Boolean).filter((v, n, a) => a.indexOf(v) === n).join(' · '))
    }
    return [...m.entries()].sort((a, b) => (a[0] === NONE ? 1 : b[0] === NONE ? -1 : a[1].localeCompare(b[1])))
  }, [items])
  const origins = useMemo(() => [...new Set(items.map((i) => i.origin || 'legacy'))], [items])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    const band = SIZES.find((s) => s.key === size)
    const out = items.filter((i) => {
      if (t && !`${i.username} ${i.full_name || ''}`.toLowerCase().includes(t)) return false
      if (roster !== ALL) {
        const k = i.sourced_for_list_id || (i.sourced_for ? `name:${i.sourced_for}` : NONE)
        if (k !== roster) return false
      }
      if (origin !== ALL && (i.origin || 'legacy') !== origin) return false
      if (band && band.key !== ALL) {
        const f = i.followers_count ?? -1
        if (f < band.min || (band.max != null && f >= band.max)) return false
      }
      const hasCost = (i.cost_total_cents ?? 0) > 0 || DELIVERABLES.some((d) => costOf(i, d) != null)
      if (costed === 'yes' && !hasCost) return false
      if (costed === 'no' && hasCost) return false
      return true
    })
    const when = (i: PendingCreator) => new Date(i.cost_captured_at || i.submitted_at || 0).getTime()
    return out.sort((a, b) => sort === 'followers' ? (b.followers_count ?? -1) - (a.followers_count ?? -1)
      : sort === 'cost' ? (b.cost_total_cents ?? 0) - (a.cost_total_cents ?? 0)
      : when(b) - when(a))
  }, [items, q, roster, origin, size, costed, sort])
  const filtering = !!q.trim() || roster !== ALL || origin !== ALL || size !== ALL || costed !== ALL
  const clearFilters = () => { setQ(''); setRoster(ALL); setOrigin(ALL); setSize(ALL); setCosted(ALL) }

  const lanes = useMemo(() => ({
    // Barter creators normally have no price and need none: their own tab, not a to-do.
    needs_cost: filtered.filter((i) => i.lane === 'needs_cost' && !i.barter),
    needs_sell: filtered.filter((i) => i.lane === 'needs_sell' && !i.barter),
    barter: filtered.filter((i) => !!i.barter),
  }), [filtered])
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
    else toast.info('A founder sets the sell price. Your part is done')
  }

  const submitCost = async () => {
    if (!costing) return
    const payload: Record<string, number> = {}
    for (const [k, v] of Object.entries(amounts)) if (v.trim()) payload[k] = Number(v)
    if (!Object.keys(payload).length) return toast.error('Enter at least one rate')
    setBusy(true)
    try {
      await creatorIntakeApi.captureCost(costing.id, { cost_pricing: payload, note: costNote })
      toast.success(`@${costing.username}: cost saved. Now waiting for a founder's sell price`)
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
      // Say where they went. Priced for a roster means they are back on it, Ready to add to a
      // proposal; the founder used to price someone and lose them.
      const roster = pricing.sourced_for_list_id
      toast.success(
        roster
          ? `@${pricing.username} priced. Back on ${pricing.sourced_for || 'the roster'} as Ready`
          : `@${pricing.username} priced and live in the database`,
        roster ? {
          duration: 8000,
          action: { label: 'Open roster', onClick: () => { window.location.href = `/work/areas/${roster}` } },
        } : undefined,
      )
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
      toast.success(`@${rejecting.username} turned down, their rates are kept`)
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

  /** Which brand they were found for, at a glance on every card. */
  const ForBrand = ({ c }: { c: PendingCreator }) => {
    const b = c.sourced_for_brand || c.sourced_for
    if (!b) return null
    return <span className="inline-flex max-w-full items-center truncate rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">For {b}</span>
  }

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
      <div className="space-y-ds-5">
        <PageHead
          title={fullName('/work/influencers/review')}
          sub="We cannot quote these creators yet: add what they charge us, then a founder sets our price."
          action={<>
            <div data-tour="waiting-view" className="flex rounded-ds-lg border border-black/[0.06] p-0.5 dark:border-white/[0.07]">
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
          </>}
        />

        <Tabs value={lane} onValueChange={(v: string) => setLane(v as Lane)}>
          <TabsList data-tour="waiting-lanes">
            {/* The size of each lane is a count of real work. Over a failed read it is a
                dash, because "(0)" here reads as "there is nothing to do". */}
            <TabsTrigger value="needs_cost">
              Needs a cost (
              {failed
                ? <Dash reason="unmeasured" what="how many creators need a cost" />
                : lanes.needs_cost.length})
            </TabsTrigger>
            <TabsTrigger value="needs_sell">
              Needs a sell price (
              {failed
                ? <Dash reason="unmeasured" what="how many creators need a sell price" />
                : lanes.needs_sell.length})
            </TabsTrigger>
            <TabsTrigger value="barter">
              Barter ({failed ? <Dash reason="unmeasured" what="how many barter creators there are" /> : lanes.barter.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Find one creator, or narrow to one roster, without scrolling the whole room. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Handle or name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {rosters.length > 1 && (
            <Select value={roster} onValueChange={setRoster}>
              <SelectTrigger className="h-9 w-full sm:w-56"><SelectValue placeholder="Any roster" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any roster</SelectItem>
                {rosters.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {origins.length > 1 && (
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder="Any source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any source</SelectItem>
                {origins.map((o) => <SelectItem key={o} value={o}>{ORIGIN_LABEL[o] || o}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{SIZES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={costed} onValueChange={setCosted}>
            <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Cost or not</SelectItem>
              <SelectItem value="yes">Has a cost</SelectItem>
              <SelectItem value="no">No cost yet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: string) => setSort(v as Sort)}>
            <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="followers">Most followers</SelectItem>
              <SelectItem value="cost">Highest cost</SelectItem>
            </SelectContent>
          </Select>
          {filtering && (
            <Button size="sm" variant="ghost" className="h-9 gap-1.5" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        <p className="-mt-2 text-sm text-muted-foreground">
          {lane === 'needs_cost'
            ? 'Nobody has recorded what these creators charge us. Ring them, then put the rate in here.'
            : 'The cost is in. Set what we charge the client and add them to the database.'}
        </p>

        <ReadState
          failed={failed}
          loading={loading}
          empty={shown.length === 0}
          what="the waiting room"
          onRetry={() => load()}
          nothing={filtering ? (
            <>
              <span className="block text-ds-label text-foreground">No creator here matches</span>
              <Button size="sm" variant="outline" className="mt-ds-2" onClick={clearFilters}>Clear the filters</Button>
            </>
          ) : (
            <>
              <span className="block text-ds-label text-foreground">Nothing waiting here</span>
              <span className="mt-ds-1 block">
                {lane === 'needs_cost'
                  ? 'Every creator here has a cost recorded.'
                  : 'Every creator with a cost has been priced and added to the database.'}
              </span>
            </>
          )}
          skeleton={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Loading…
            </div>
          }
        >
          {view === 'grid' ? (
          <div className="grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <div key={c.id}
                   className={`${CARD} space-y-ds-2 overflow-hidden bg-[var(--tone-neutral-wash)] p-ds-3`}>
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
                    <ForBrand c={c} />
                    {(c.categories || []).slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                    {c.country && <Badge variant="outline" className="text-xs">{c.country}</Badge>}
                  </div>

                  {/* The rates were fenced in a tinted bordered box inside a card that
                      already has an edge — and the rates are the reason this card exists,
                      so the box was fencing off the very thing you came to read. A single
                      rule marks where the creator ends and their money begins. */}
                  <div className="border-t border-black/[0.06] pt-ds-2 dark:border-white/[0.07]">
                    <div className="mb-ds-2 flex items-center justify-between text-ds-caption">
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

                  {c.sourced_for && c.sourced_for_brand && c.sourced_for !== c.sourced_for_brand && (
                    <p className="truncate text-xs text-muted-foreground">Roster: {c.sourced_for}</p>
                  )}
                  {/* The area's brief. It was already being fetched here and rendered
                      nowhere, so a founder pricing this creator could see which brand they
                      were found for but not what they were found FOR, which is the half of
                      the question that sets the price. */}
                  {briefLine(c.sourced_brief as AreaBrief) && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {briefLine(c.sourced_brief as AreaBrief)}
                    </p>
                  )}
                  {(c.cost_note || c.submitted_note) && (
                    <p className="line-clamp-2 text-xs italic text-muted-foreground">
                      “{c.cost_note || c.submitted_note}”
                    </p>
                  )}

                  <Actions c={c} />
              </div>
            ))}
          </div>
        ) : (
          /* one at a time — for working a long backlog without reading a wall of cards */
          <div className="mx-auto w-full max-w-xl">
            {!top ? (
              <div className="space-y-ds-2 py-ds-6 text-center">
                <p className="text-ds-label">You have been through the stack</p>
                {passed.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => { setPassed([]); setAt(0) }}>
                    <Undo2 className="mr-1.5 h-4 w-4" />Bring back the {passed.length} you skipped
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="relative h-[30rem]">
                  {/* the cards behind, so the stack looks like a stack */}
                  {deck.slice(at + 1, at + 3).map((c, i) => (
                    <div key={c.id}
                         className="absolute inset-x-0 top-0 rounded-ds-2xl border border-black/[0.06] bg-card dark:border-white/[0.07]"
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
                      <div className={`${CARD} flex h-full flex-col gap-ds-3 overflow-hidden bg-[var(--tone-neutral-wash)] p-ds-4`}>
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
                            <ForBrand c={top} />
                            {(top.categories || []).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                            ))}
                            {top.country && <Badge variant="outline" className="text-xs">{top.country}</Badge>}
                          </div>

                          <div className="border-t border-black/[0.06] pt-ds-3 dark:border-white/[0.07]">
                            <p className="mb-ds-2 text-ds-label">
                              {top.lane === 'needs_cost' ? 'No cost recorded yet' : 'They charge us'}
                            </p>
                            {top.lane === 'needs_cost'
                              ? <p className="text-sm text-muted-foreground">
                                  Add what they quoted you and a founder can set our price.
                                </p>
                              : <Rates c={top} />}
                          </div>

                          {top.sourced_for && top.sourced_for_brand && top.sourced_for !== top.sourced_for_brand && (
                            <p className="text-sm text-muted-foreground">Roster: {top.sourced_for}</p>
                          )}
                          {briefLine(top.sourced_brief as AreaBrief) && (
                            <p className="text-sm text-muted-foreground">
                              {briefLine(top.sourced_brief as AreaBrief)}
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
                      </div>
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
        </ReadState>
      </div>

      {/* the talent team's step: what the creator charges us */}
      <Dialog open={!!costing} onOpenChange={(o: boolean) => { if (!o) { setCosting(null); setAmounts({}) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What does @{costing?.username} charge us?</DialogTitle>
            <DialogDescription>
              The rate they quoted you, in AED. Fill in what you have. You can add the rest
              later. This does not add them to the database, a founder sets our price next.
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
              What we charge a client. Approving adds this creator to the master database, and
              from that moment they can go on a proposal.
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
              They stay in the database with every rate already researched. Nothing is lost,
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
