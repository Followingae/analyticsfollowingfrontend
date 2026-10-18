'use client'

/**
 * Standing lists: "who are our fashion creators in the UAE", answered once and always true.
 *
 * WHAT THIS REPLACED. Seventeen lists called "NewC", "C2", "New", "New Derm" and "Sports",
 * every one a shortlist for a single campaign. They answered "who did we pick for this job",
 * which is already recorded on the job. The question nobody could ask was the standing one,
 * so it got re-answered from memory every time somebody needed it.
 *
 * A LIST HERE IS A QUESTION, NOT A SET OF PEOPLE. Nothing is stored as a member, so nothing
 * goes stale, there is no refresh to fail, and a creator analysed this afternoon is in the
 * list this afternoon. It also means deleting a list never touches a creator.
 *
 * THE COUNT IS SHOWN BEFORE IT IS SAVED. Somebody building "fashion, UAE, over 100k, takes
 * barter" deserves to know it matches four people while they can still widen it, rather than
 * saving a list and wondering whether it is broken.
 *
 * WHERE EACH FACT CAME FROM IS ON THE SCREEN. A creator's country is either what talent
 * recorded or what we derived from where their posts are, and those are different claims.
 * The row says which, because somebody deciding who to pitch should know whether they are
 * reading a colleague's note or a machine's guess.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check, Filter, Loader2, Pin, Plus, Search, Trash2, Users2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/auto-lists`

type ListFilter = {
  categories?: string[]
  countries?: string[]
  followers_min?: number
  followers_max?: number
  accepts_barter?: boolean
  has_sell_price?: boolean
}
type StandingList = {
  id: string; name: string; description?: string | null
  filter: ListFilter; pinned: boolean; count: number | null
}
type Member = {
  id: string; username: string; full_name: string | null
  profile_image_url: string | null; followers_count: number | null
  engagement_rate: number | null; tier: string | null; accepts_barter: boolean | null
  country: string | null; country_is_ours: boolean
  cats: string[]; cats_are_ours: boolean
  sell_reel_aed_cents: number | null
}
type Facets = {
  categories: { value: string; count: number }[]
  countries: { value: string; name: string; count: number }[]
  roster: number
  without_country: number
  suggested: { name: string; filter: ListFilter }[]
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${BASE}${path}`, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.detail || 'That did not work')
  return json.data as T
}
const post = (v: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v),
})

const num = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString())
const compact = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n)

/** The question, said as a sentence somebody can read at a glance. */
function describe(f: ListFilter, facets: Facets | null): string {
  const bits: string[] = []
  if (f.categories?.length) bits.push(f.categories.join(' or '))
  if (f.countries?.length) {
    const names = f.countries.map(
      (c) => facets?.countries.find((x) => x.value === c)?.name || c)
    bits.push(`in ${names.join(' or ')}`)
  }
  if (f.followers_min != null || f.followers_max != null) {
    const lo = f.followers_min != null ? compact(f.followers_min) : null
    const hi = f.followers_max != null ? compact(f.followers_max) : null
    bits.push(lo && hi ? `${lo} to ${hi}` : lo ? `over ${lo}` : `under ${hi}`)
  }
  if (f.accepts_barter) bits.push('takes barter')
  if (f.has_sell_price) bits.push('priced to sell')
  return bits.length ? bits.join(' · ') : 'everyone on the roster'
}

export default function ListsPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Lists /></SuperadminLayout>
    </AuthGuard>
  )
}

function Lists() {
  const confirm = useConfirm()
  const [lists, setLists] = useState<StandingList[]>([])
  const [facets, setFacets] = useState<Facets | null>(null)
  const [open, setOpen] = useState<StandingList | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [builder, setBuilder] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [l, f] = await Promise.all([
        call<{ lists: StandingList[] }>(''),
        call<Facets>('/facets'),
      ])
      setLists(l.lists || [])
      setFacets(f)
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read the lists')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const openList = async (l: StandingList) => {
    setOpen(l); setMembers([]); setBusy(true)
    try {
      const d = await call<StandingList & { members: Member[] }>(`/${l.id}`)
      setMembers(d.members || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open that list')
    } finally { setBusy(false) }
  }

  const remove = async (l: StandingList) => {
    const ok = await confirm({
      kind: 'routine',
      title: `Delete "${l.name}"?`,
      body: <>It is only a saved question. No creator is removed from anything and nothing
             about them changes.</>,
      confirmLabel: 'Delete the list',
    })
    if (!ok) return
    try {
      await call(`/${l.id}`, { method: 'DELETE' })
      toast.success('Gone')
      if (open?.id === l.id) setOpen(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete it')
    }
  }

  const pin = async (l: StandingList) => {
    try {
      await call(`/${l.id}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !l.pinned }) })
      load()
    } catch { /* a pin that did not take is not worth a toast */ }
  }

  const addSuggested = async (s: { name: string; filter: ListFilter }) => {
    try {
      await call('', post({ name: s.name, filter: s.filter }))
      toast.success(`"${s.name}" saved`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save it')
    }
  }

  /* Only offer a suggestion that is not already saved and that actually has people in it.
     Offering "Fashion · UAE" when it matches nobody teaches people the lists are broken. */
  const suggestions = useMemo(() => {
    const have = new Set(lists.map((l) => l.name.toLowerCase()))
    return (facets?.suggested || []).filter((s) => !have.has(s.name.toLowerCase()))
  }, [facets, lists])

  return (
    <div className="space-y-6">
      <PageHead
        title="Standing lists"
        sub="A list is a question, not a set of names. It answers itself every time you open it."
        action={<Button onClick={() => setBuilder(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New list
        </Button>}
      />

      {/* The honest caveat, once, where somebody will read it before they trust a count. */}
      {facets && facets.without_country > 0 && (
        <p className="reading-width text-ds-caption text-muted-foreground">
          {facets.roster} creators on the roster.{' '}
          <span className="font-medium text-foreground">{facets.without_country}</span>{' '}
          have no country we can place them in, so they appear in category lists but never in
          a country one.
        </p>
      )}

      <ReadState
        failed={failed} loading={loading} empty={lists.length === 0}
        what="your standing lists" onRetry={load}
        nothing=""
        skeleton={<div className="flex items-center gap-2 py-8 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Working them out
        </div>}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <article key={l.id}
                     className={cn(CARD, 'group flex flex-col gap-2 bg-card p-4')}>
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => openList(l)}
                        className="min-w-0 flex-1 text-left">
                  <p className="truncate text-ds-label font-semibold">{l.name}</p>
                  <p className="mt-0.5 truncate text-ds-caption text-muted-foreground">
                    {describe(l.filter, facets)}
                  </p>
                </button>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100
                                focus-within:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                          aria-label={l.pinned ? 'Unpin' : 'Pin'} onClick={() => pin(l)}>
                    <Pin className={cn('h-3.5 w-3.5', l.pinned && 'fill-current')} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                          aria-label="Delete" onClick={() => remove(l)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <button type="button" onClick={() => openList(l)}
                      className="mt-auto flex items-baseline gap-1.5 text-left">
                <span className="text-[26px] font-semibold leading-none tabular-nums">
                  {l.count == null ? '—' : l.count}
                </span>
                <span className="text-ds-caption text-muted-foreground">
                  {l.count === 1 ? 'creator' : 'creators'}
                </span>
              </button>
            </article>
          ))}
        </div>
      </ReadState>

      {/* Ready-made questions, offered rather than installed, so nobody inherits twelve
          lists they never asked for. */}
      {!loading && suggestions.length > 0 && (
        <section className="space-y-3">
          <SectionHead title="Ready to add" note="One click each. Change or delete them later." />
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s.name} type="button" onClick={() => addSuggested(s)}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background
                                 px-3 py-1.5 text-ds-caption transition-colors hover:bg-muted
                                 focus-visible:outline focus-visible:outline-2
                                 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <Plus className="h-3 w-3" /> {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <Builder open={builder} onOpenChange={setBuilder} facets={facets} onSaved={load} />
      <MembersDialog list={open} members={members} busy={busy}
                     onClose={() => setOpen(null)} facets={facets} />
    </div>
  )
}

/* ── Building a question ─────────────────────────────────────────────────────────────── */

function Builder({ open, onOpenChange, facets, onSaved }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  facets: Facets | null
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [f, setF] = useState<ListFilter>({})
  const [count, setCount] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) { setName(''); setF({}); setCount(null) } }, [open])

  /* Count as they build, debounced. The number is the feedback: it is the difference
     between "this list is empty because I asked for something we do not have" and "this
     list is empty because the product is broken". */
  useEffect(() => {
    if (!open) return
    const has = Object.keys(f).length > 0
    if (!has) { setCount(null); return }
    setChecking(true)
    const t = setTimeout(async () => {
      try {
        const d = await call<{ count: number }>('/preview', post({ filter: f }))
        setCount(d.count)
      } catch { setCount(null) } finally { setChecking(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [f, open])

  const toggle = (key: 'categories' | 'countries', v: string) =>
    setF((prev) => {
      const have = prev[key] || []
      const next = have.includes(v) ? have.filter((x) => x !== v) : [...have, v]
      return { ...prev, [key]: next.length ? next : undefined }
    })

  const save = async () => {
    if (!name.trim()) { toast.error('Give the list a name'); return }
    setSaving(true)
    try {
      await call('', post({ name: name.trim(), filter: f }))
      toast.success('Saved')
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save it')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>A new standing list</DialogTitle>
          <DialogDescription>
            Ask for what you want. Anyone matching is in it from now on, and anyone who stops
            matching drops out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="ln">What is it called</Label>
            <Input id="ln" value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Fashion · UAE" />
          </div>

          <Chips label="Category" options={(facets?.categories || []).map(
                   (c) => ({ value: c.value, label: c.value, count: c.count }))}
                 selected={f.categories || []} onToggle={(v) => toggle('categories', v)} />

          <Chips label="Country" options={(facets?.countries || []).map(
                   (c) => ({ value: c.value, label: c.name, count: c.count }))}
                 selected={f.countries || []} onToggle={(v) => toggle('countries', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fmin">Followers from</Label>
              <Input id="fmin" inputMode="numeric" placeholder="any"
                     value={f.followers_min ?? ''}
                     onChange={(e) => setF((p) => ({ ...p,
                       followers_min: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fmax">up to</Label>
              <Input id="fmax" inputMode="numeric" placeholder="any"
                     value={f.followers_max ?? ''}
                     onChange={(e) => setF((p) => ({ ...p,
                       followers_max: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Toggle on={!!f.accepts_barter} label="Takes barter"
                    onClick={() => setF((p) => ({ ...p, accepts_barter: p.accepts_barter ? undefined : true }))} />
            <Toggle on={!!f.has_sell_price} label="Has a sell price"
                    onClick={() => setF((p) => ({ ...p, has_sell_price: p.has_sell_price ? undefined : true }))} />
          </div>

          {/* The answer, before it is saved. */}
          <div className={cn(CARD, 'flex items-center gap-2 bg-muted/40 px-4 py-3')}>
            {checking
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <Users2 className="h-4 w-4 text-muted-foreground" />}
            <span className="text-ds-caption">
              {count == null
                ? 'Pick something above and I will count them'
                : <><span className="font-semibold tabular-nums">{count}</span>{' '}
                    {count === 1 ? 'creator matches' : 'creators match'} right now</>}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim() || !Object.keys(f).length}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    : <Check className="mr-1.5 h-3.5 w-3.5" />}
            Save the list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Chips({ label, options, selected, onToggle }: {
  label: string
  options: { value: string; label: string; count: number }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  if (!options.length) return null
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <button key={o.value} type="button" onClick={() => onToggle(o.value)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                      'text-ds-caption capitalize transition-colors',
                      'focus-visible:outline focus-visible:outline-2',
                      'focus-visible:outline-offset-2 focus-visible:outline-primary',
                      on ? 'border-transparent bg-foreground text-background'
                         : 'bg-background hover:bg-muted')}>
              {o.label}
              {/* The count is why this is chips and not a dropdown: you choose differently
                  when you can see that fashion is 44 people and automotive is 2. */}
              <span className="tabular-nums opacity-60">{o.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
            className={cn('rounded-full border px-3 py-1.5 text-ds-caption transition-colors',
                          'focus-visible:outline focus-visible:outline-2',
                          'focus-visible:outline-offset-2 focus-visible:outline-primary',
                          on ? 'border-transparent bg-foreground text-background'
                             : 'bg-background hover:bg-muted')}>
      {label}
    </button>
  )
}

/* ── Who is in it ────────────────────────────────────────────────────────────────────── */

function MembersDialog({ list, members, busy, onClose, facets }: {
  list: StandingList | null
  members: Member[]
  busy: boolean
  onClose: () => void
  facets: Facets | null
}) {
  const [q, setQ] = useState('')
  useEffect(() => { setQ('') }, [list?.id])

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return members
    return members.filter((m) =>
      m.username.toLowerCase().includes(n) ||
      (m.full_name || '').toLowerCase().includes(n))
  }, [members, q])

  return (
    <Dialog open={!!list} onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{list?.name}</DialogTitle>
          <DialogDescription>
            {list ? describe(list.filter, facets) : ''}
            {' · '}worked out just now
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4
                             -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Find someone in this list" className="pl-8" />
        </div>

        <div className="-mx-1 max-h-[52vh] overflow-y-auto px-1">
          {busy ? (
            <div className="flex items-center gap-2 py-8 text-ds-caption">
              <Loader2 className="h-4 w-4 animate-spin" /> Working out who is in it
            </div>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-ds-caption text-muted-foreground">
              {members.length === 0
                ? 'Nobody on the roster matches this yet.'
                : 'Nobody here by that name.'}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {shown.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-ds-lg px-2 py-1.5
                                           hover:bg-muted/60">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={cdnAvatar(m.profile_image_url) ?? undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(m.full_name || m.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ds-caption font-medium">@{m.username}</p>
                    <p className="truncate text-ds-caption text-muted-foreground">
                      {m.cats.join(', ') || 'no category'}
                      {!m.cats_are_ours && m.cats.length > 0 && ' (read from their posts)'}
                    </p>
                  </div>
                  {m.country && (
                    <Badge variant="outline" className="shrink-0 text-ds-overline">
                      {facets?.countries.find((c) => c.value === m.country)?.name || m.country}
                      {/* A derived country is marked. It is a guess and somebody choosing
                          who to pitch should know that before they rely on it. */}
                      {!m.country_is_ours && <span className="ml-1 opacity-60">?</span>}
                    </Badge>
                  )}
                  <span className="w-16 shrink-0 text-right text-ds-caption tabular-nums">
                    {compact(m.followers_count)}
                  </span>
                  <span className="w-12 shrink-0 text-right text-ds-caption tabular-nums
                                   text-muted-foreground">
                    {m.engagement_rate != null ? `${m.engagement_rate.toFixed(1)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="text-ds-caption text-muted-foreground">
            {num(members.length)} in this list
          </span>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
