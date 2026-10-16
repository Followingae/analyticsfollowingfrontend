'use client'

/**
 * The pipeline — every creator we owe something, on one list.
 *
 * WHAT WAS WRONG. The delivery ladder was right and invisible. Eight rungs existed on every
 * booked creator — rate, agreement, brief, content, approval, post, payment — but you could
 * only see one campaign's worth at a time, and the sidebar offered the same creator under
 * six different nouns: Rosters, Creators, Pending rates, Chasing, Enrolments, Payables. A
 * talent manager's actual question is "who is waiting on me", and no screen answered it
 * across brands. So the answer stayed in a spreadsheet and in email.
 *
 * WHAT THIS IS. One row per creator per campaign, every brand at once. The left rail is the
 * ladder with live counts, so the size of each job is readable before anything is clicked.
 * Each row leads with the SENTENCE NAMING WHAT HAPPENS NEXT rather than the rung it is on:
 * a stage is a noun and tells you where something is, and people need a verb.
 *
 * WHAT IT IS NOT. Nothing is decided here. A row opens the campaign board that owns the
 * decision, with its evidence and its audit trail. No screen was replaced to build this and
 * nothing was taken away — every existing page is still at its own URL and still reachable.
 *
 * THE RULES IT KEEPS, which are the reason it reads calmly:
 *   - one accent, and only on something you can press. Colour otherwise means lateness and
 *     nothing else, so when a row is red it is worth looking at.
 *   - a count on everything that can be opened.
 *   - bold is "needs you". Finished work goes quiet rather than disappearing.
 *   - the bulk bar is visible but dead until something is ticked, so what is possible is
 *     learnable without doing it first.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { PageHead, CARD } from '@/components/console/primitives'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpRight, Search, UserPlus, X } from 'lucide-react'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Stage { key: string; label: string; count: number; action: string }
interface Row {
  id: string
  campaign_id: string
  campaign_name: string | null
  client_name: string | null
  username: string | null
  full_name: string | null
  avatar: string | null
  followers_count: number | null
  stage: string
  stage_label: string
  stage_note: string | null
  next_action: string
  owner_user_id: string | null
  owner_name: string | null
  last_event: { what: string | null; words: string; days: number | null }
  due: { at: string | null; days: number | null; late: boolean }
  total_cost: number | null
  total_sell: number | null
  paid_in_product: boolean
  barter_product: string | null
  deliverables: string[]
}
interface Owner { id: string; name: string; email: string; staff_role: string | null }
interface Lanes { live?: number; late?: number; unassigned?: number; mine?: number; done?: number }

const LANES = [
  { key: 'live', label: 'Live' },
  { key: 'late', label: 'Late' },
  { key: 'done', label: 'Finished' },
] as const

const OWNERS = [
  { key: 'all', label: 'Everyone' },
  { key: 'me', label: 'Mine' },
  { key: 'unassigned', label: 'Nobody yet' },
] as const

const fmt = (n: number | null | undefined) =>
  n == null ? '' : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'm'
    : n >= 1_000 ? Math.round(n / 1_000) + 'k' : String(n)

const aed = (n: number | null | undefined) =>
  n == null ? null : 'AED ' + Math.round(n).toLocaleString()

/** When the content is owed, said the way a person would say it. */
function dueWords(due: Row['due']): string | null {
  if (!due.at || due.days == null) return null
  if (due.days < 0) {
    const d = Math.abs(due.days)
    return d === 1 ? '1 day late' : d + ' days late'
  }
  if (due.days === 0) return 'due today'
  return due.days === 1 ? 'due tomorrow' : 'due in ' + due.days + ' days'
}

/** Two initials, for a creator with no picture and for an owner who is just a name. */
const initials = (s?: string | null) =>
  (s || '?').replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '?'

export default function PipelinePage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [lanes, setLanes] = useState<Lanes>({})
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)

  const [lane, setLane] = useState<string>('live')
  const [stage, setStage] = useState<string>('all')
  const [owner, setOwner] = useState<string>('all')
  const [query, setQuery] = useState('')
  /* The box the person types in, and the value the server has been asked about. Separated so
     a keystroke does not become a request: at 37 rows it would not matter, at 400 it would. */
  const [typed, setTyped] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setTimeout(() => setQuery(typed), 250)
    return () => clearTimeout(t)
  }, [typed])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ lane, owner })
      if (stage !== 'all') p.set('stage', stage)
      if (query.trim()) p.set('q', query.trim())
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/work/pipeline?${p}`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not load the pipeline')
      const d = (await res.json()).data
      setRows(d?.rows || [])
      setStages(d?.stages || [])
      setLanes(d?.lanes || {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the pipeline')
    } finally {
      setLoading(false)
    }
  }, [lane, stage, owner, query])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/work/pipeline/owners`)
        if (res.ok) setOwners((await res.json()).data?.owners || [])
      } catch { /* the list still works without the assign menu */ }
    })()
  }, [])

  /* A tick survives a filter change only while the row is still on screen. Assigning
     somebody you can no longer see is how a bulk action becomes frightening. */
  useEffect(() => {
    setPicked(prev => {
      if (prev.size === 0) return prev
      const here = new Set(rows.map(r => r.id))
      const kept = new Set([...prev].filter(id => here.has(id)))
      return kept.size === prev.size ? prev : kept
    })
  }, [rows])

  const toggle = (id: string) => setPicked(p => {
    const n = new Set(p)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const allPicked = rows.length > 0 && picked.size === rows.length

  const assign = async (ownerId: string | null) => {
    const ids = [...picked]
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/work/pipeline/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, owner_user_id: ownerId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.detail || 'Could not assign those')
      const who = ownerId ? (owners.find(o => o.id === ownerId)?.name ?? 'them') : 'nobody'
      toast.success(`${ids.length} ${ids.length === 1 ? 'creator' : 'creators'} now with ${who}`)
      setPicked(new Set())
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign those')
    }
  }

  const lateCount = lanes.late ?? 0

  const railStages = useMemo(
    () => stages.filter(s => s.key !== 'paid' || lane === 'done'),
    [stages, lane],
  )

  return (
    <SuperadminLayout>
      <PageHead
        title="Pipeline"
        sub="Every creator we owe something, what happens to them next, and who is doing it."
      />

      {/* Where you are. Three populations, each with its size on it, because "how much is
          late" is a question people ask before they ask anything else. */}
      <div className="flex flex-wrap items-center gap-2">
        {LANES.map(l => {
          const n = l.key === 'live' ? lanes.live : l.key === 'late' ? lanes.late : lanes.done
          const on = lane === l.key
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => { setLane(l.key); setStage('all') }}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                on ? 'bg-foreground text-background'
                   : 'bg-black/[0.04] text-muted-foreground hover:text-foreground dark:bg-white/[0.06]',
              )}
            >
              {l.label}
              <span className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                on ? 'bg-background/20'
                  : l.key === 'late' && (n ?? 0) > 0
                    ? 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]'
                    : 'bg-black/[0.06] dark:bg-white/[0.1]',
              )}>
                {n ?? 0}
              </span>
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-2">
          {OWNERS.map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOwner(o.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition',
                owner === o.key ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
              {o.key === 'me' && (lanes.mine ?? 0) > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">{lanes.mine}</span>
              )}
              {o.key === 'unassigned' && (lanes.unassigned ?? 0) > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">{lanes.unassigned}</span>
              )}
            </button>
          ))}
          <div className="relative w-[230px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Find a creator or brand"
              aria-label="Find a creator or brand"
              className="h-9 pl-9 pr-8"
            />
            {typed && (
              <button type="button" onClick={() => setTyped('')} aria-label="Clear the search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {lateCount > 0 && lane !== 'late' && (
        <button
          type="button"
          onClick={() => { setLane('late'); setStage('all') }}
          className="flex w-full items-center gap-3 rounded-ds-2xl bg-[var(--tone-bad-wash)] px-4 py-3 text-left"
        >
          <span className="h-2 w-2 flex-none rounded-full bg-[var(--tone-bad-dot)]" />
          <span className="text-sm font-medium text-[var(--tone-bad-ink)]">
            {lateCount} {lateCount === 1 ? 'creator is' : 'creators are'} past the date we gave the client.
          </span>
          <ArrowUpRight className="ml-auto size-4 text-[var(--tone-bad-ink)]" />
        </button>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[236px_minmax(0,1fr)]">
        {/* The ladder, with the size of each job on it. This is the part that makes the
            work teachable: a new starter can read the whole process down one column. */}
        <nav className={cn(CARD, 'bg-card p-2')} aria-label="Stages">
          <button
            type="button"
            onClick={() => setStage('all')}
            className={cn('flex w-full items-center justify-between rounded-ds-lg px-3 py-2 text-left text-sm font-medium transition',
              stage === 'all' ? 'bg-black/[0.05] dark:bg-white/[0.07]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]')}
          >
            Every stage
            <span className="tabular-nums text-xs text-muted-foreground">
              {railStages.reduce((a, s) => a + s.count, 0)}
            </span>
          </button>
          <div className="my-1.5 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
          {railStages.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(s.key)}
              title={s.action || undefined}
              className={cn('flex w-full items-start justify-between gap-2 rounded-ds-lg px-3 py-2 text-left transition',
                stage === s.key ? 'bg-black/[0.05] dark:bg-white/[0.07]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]')}
            >
              <span className="min-w-0">
                <span className={cn('block truncate text-sm',
                  s.count > 0 ? 'font-medium' : 'text-muted-foreground')}>
                  {s.label}
                </span>
                {s.action && (
                  <span className="block truncate text-xs text-muted-foreground">{s.action}</span>
                )}
              </span>
              <span className={cn('mt-0.5 shrink-0 tabular-nums text-xs',
                s.count > 0 ? 'text-foreground' : 'text-muted-foreground/60')}>
                {s.count}
              </span>
            </button>
          ))}
        </nav>

        <div className={cn(CARD, 'overflow-hidden bg-card')}>
          {/* The bulk bar. Present at rest and plainly dead, so that what you can do with a
              selection is readable before you have made one. */}
          <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08]">
            <Checkbox
              checked={allPicked}
              disabled={rows.length === 0}
              aria-label="Select every creator on this list"
              onCheckedChange={(on: boolean | 'indeterminate') =>
                setPicked(on === true ? new Set(rows.map(r => r.id)) : new Set())}
            />
            <span className={cn('text-sm', picked.size ? 'font-medium' : 'text-muted-foreground')}>
              {picked.size ? `${picked.size} selected` : `${rows.length} ${rows.length === 1 ? 'creator' : 'creators'}`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" disabled={picked.size === 0} className="ml-auto gap-1.5">
                  <UserPlus className="size-4" />
                  Give to
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Who is looking after these?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {owners.map(o => (
                  <DropdownMenuItem key={o.id} onClick={() => void assign(o.id)}>
                    <span className="truncate">{o.name}</span>
                    {o.staff_role && (
                      <span className="ml-auto pl-2 text-xs text-muted-foreground">
                        {o.staff_role.replace(/_/g, ' ')}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void assign(null)}>
                  Take the name off
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {loading ? (
            <div className="space-y-px p-2">
              {Array.from({ length: 6 }).map((_, n) => (
                <Skeleton key={n} className="h-[62px] rounded-ds-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-muted-foreground">
              {query.trim()
                ? `Nobody matches “${query.trim()}”.`
                : lane === 'late'
                  ? 'Nothing is late. That is the whole list.'
                  : stage !== 'all'
                    ? 'Nobody is on this stage right now.'
                    : 'No creators booked yet. They appear here the moment a proposal is approved.'}
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.07]">
              {rows.map(r => {
                const dw = dueWords(r.due)
                const money = r.paid_in_product
                  ? (r.barter_product || 'Product')
                  : (aed(r.total_cost) ?? aed(r.total_sell))
                const done = r.stage === 'paid' || r.stage === 'dropped'
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]">
                    <Checkbox
                      checked={picked.has(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      aria-label={`Select ${r.username || 'creator'}`}
                    />
                    <button
                      type="button"
                      onClick={() => router.push(`/work/campaigns/${r.campaign_id}`)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Avatar className="size-9">
                        <AvatarImage src={cdnAvatar(r.avatar || undefined)} alt="" />
                        <AvatarFallback className="text-[11px] font-semibold">
                          {initials(r.full_name || r.username)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="min-w-0 flex-[1.1]">
                        <span className={cn('block truncate text-sm leading-snug',
                          done ? 'text-muted-foreground' : 'font-medium')}>
                          {r.full_name || (r.username ? '@' + r.username : 'Unnamed creator')}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.username ? '@' + r.username : ''}
                          {r.followers_count ? ` · ${fmt(r.followers_count)} followers` : ''}
                        </span>
                      </span>

                      <span className="hidden min-w-0 flex-[1.25] md:block">
                        <span className="block truncate text-sm leading-snug">{r.campaign_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.client_name}
                          {r.deliverables.length ? ` · ${r.deliverables.join(', ')}` : ''}
                        </span>
                      </span>

                      {/* What happens next, in the place the eye lands. The rung it is on is
                          the small print underneath, because that is the supporting fact. */}
                      <span className="min-w-0 flex-[1.2]">
                        <span className={cn('block truncate text-sm leading-snug',
                          r.due.late ? 'font-semibold text-[var(--tone-bad-ink)]'
                            : done ? 'text-muted-foreground' : 'font-medium')}>
                          {r.next_action || r.stage_label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.stage_label}
                          {r.last_event.words ? ` · ${r.last_event.what} ${r.last_event.words}` : ''}
                        </span>
                      </span>

                      <span className="hidden w-[108px] shrink-0 text-right lg:block">
                        {dw && (
                          <span className={cn('block text-xs font-medium',
                            r.due.late ? 'text-[var(--tone-bad-ink)]' : 'text-muted-foreground')}>
                            {dw}
                          </span>
                        )}
                        {money && (
                          <span className="block truncate text-xs tabular-nums text-muted-foreground">
                            {money}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Whose row it is. A name here is the difference between a list of
                        things and somebody's list of things. */}
                    {r.owner_name ? (
                      <span
                        title={`${r.owner_name} is looking after this`}
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.06] text-[10px] font-semibold dark:bg-white/[0.1]"
                      >
                        {initials(r.owner_name)}
                      </span>
                    ) : (
                      // A dashed outline reads as a slot waiting to be filled, which is
                      // what it is. Ten solid chips down the page shout; ten dashed ones
                      // ask.
                      <Badge variant="outline"
                             className="shrink-0 border-dashed text-[10px] font-normal text-muted-foreground/70">
                        nobody
                      </Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </SuperadminLayout>
  )
}
