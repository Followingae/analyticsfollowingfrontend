'use client'

/**
 * The team feedback board: three lanes, a name picker, cards anyone can move along.
 *
 * Nobody logs in. The slug in the path is the authorisation; a wrong one gets a plain line
 * and nothing else. The page polls every 15 s while visible and refetches after every write,
 * so two people at two desks see the same board within a quarter of a minute.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { boardApi, BoardError, type Board, type Card, type CardStatus, type LaneKey } from '@/services/boardApi'
import { BoardLane } from './BoardLane'
import { LANE_ORDER, STATUS_RANK, remember } from './lanes'

const POLL_MS = 15_000

/** A card as the page holds it: the server's card plus the key React first saw it under, so
 *  an optimistic card and its saved twin are one element and never swap out. */
export type BoardCardItem = Card & { clientKey?: string }

type Phase = 'loading' | 'ready' | 'missing' | 'unreachable'

function sortCards(cards: BoardCardItem[]): BoardCardItem[] {
  return [...cards].sort((a, b) => {
    const r = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    if (r !== 0) return r
    return (b.created_at || '').localeCompare(a.created_at || '')
  })
}

export function FeedbackBoard({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [board, setBoard] = useState<(Omit<Board, 'cards'> & { cards: BoardCardItem[] }) | null>(null)
  const [author, setAuthor] = useState<string | null>(null)
  const [mine, setMine] = useState<Set<string>>(() => new Set())
  const inflight = useRef(false)

  useEffect(() => {
    setAuthor(remember.author())
    setMine(new Set(remember.mine()))
  }, [])

  const load = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    try {
      const data = await boardApi.read(slug)
      setBoard((prev) => {
        const keys = new Map((prev?.cards || []).map((c) => [c.id, c.clientKey]))
        return { ...data, cards: data.cards.map((c) => ({ ...c, clientKey: keys.get(c.id) })) }
      })
      setPhase('ready')
    } catch (e) {
      if (e instanceof BoardError && e.status === 404) setPhase('missing')
      else setPhase((p) => (p === 'ready' ? p : 'unreachable'))
    } finally {
      inflight.current = false
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (phase === 'missing') return
    let timer: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (timer) return
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void load()
      }, POLL_MS)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = null
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void load()
        start()
      } else stop()
    }
    start()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load, phase])

  // The viewer's name only ever comes from the configured list, so a stale pick is dropped.
  useEffect(() => {
    if (board && author && !board.authors.includes(author)) setAuthor(null)
  }, [board, author])

  const pick = (name: string) => {
    setAuthor(name)
    remember.setAuthor(name)
  }

  const post = useCallback(
    async (lane: LaneKey, title: string, body: string | null) => {
      if (!author) return
      const tempId = `tmp-${Date.now()}`
      const now = new Date().toISOString()
      const ghost: BoardCardItem = { id: tempId, clientKey: tempId, lane, author, title, body, status: 'open', created_at: now, updated_at: now }
      setBoard((b) => (b ? { ...b, cards: [ghost, ...b.cards] } : b))
      try {
        const saved = await boardApi.create(slug, { lane, author, title, body })
        remember.addMine(saved.id)
        setMine((m) => new Set(m).add(saved.id))
        setBoard((b) => (b ? { ...b, cards: b.cards.map((c) => (c.id === tempId ? { ...saved, clientKey: tempId } : c)) } : b))
      } catch (e) {
        setBoard((b) => (b ? { ...b, cards: b.cards.filter((c) => c.id !== tempId) } : b))
        throw e
      } finally {
        void load()
      }
    },
    [author, slug, load]
  )

  const moveStatus = useCallback(
    async (card: Card, next: CardStatus) => {
      setBoard((b) => (b ? { ...b, cards: b.cards.map((c) => (c.id === card.id ? { ...c, status: next } : c)) } : b))
      try {
        await boardApi.patch(slug, card.id, { status: next })
      } catch {
        /* the refetch below puts it back */
      } finally {
        void load()
      }
    },
    [slug, load]
  )

  const remove = useCallback(
    async (card: Card) => {
      setBoard((b) => (b ? { ...b, cards: b.cards.filter((c) => c.id !== card.id) } : b))
      try {
        await boardApi.remove(slug, card.id)
        remember.dropMine(card.id)
        setMine((m) => {
          const n = new Set(m)
          n.delete(card.id)
          return n
        })
      } catch {
        /* the refetch below puts it back */
      } finally {
        void load()
      }
    },
    [slug, load]
  )

  const byLane = useMemo(() => {
    const map: Record<LaneKey, BoardCardItem[]> = { talent: [], account_manager: [], business_dev: [] }
    for (const c of board?.cards || []) map[c.lane]?.push(c)
    for (const k of LANE_ORDER) map[k] = sortCards(map[k])
    return map
  }, [board])

  if (phase === 'missing') {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <p className="text-sm text-muted-foreground">This page does not exist</p>
      </main>
    )
  }

  const lanes = board?.lanes?.length
    ? board.lanes
    : [
        { key: 'talent' as LaneKey, label: 'Talent' },
        { key: 'account_manager' as LaneKey, label: 'Account Manager' },
        { key: 'business_dev' as LaneKey, label: 'Business Dev' },
      ]
  const loading = phase === 'loading'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <header className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <picture className="block h-6">
              <img src="/followinglogo.svg" alt="Following" className="block h-6 w-auto dark:hidden" />
              <img src="/Following Logo Dark Mode.svg" alt="Following" className="hidden h-6 w-auto dark:block" />
            </picture>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                What should we <span className="font-serif font-normal italic">change</span>?
              </h1>
              <p className="text-[15px] text-muted-foreground">Tell us what gets in your way. Short is fine.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">You are</span>
            <Select value={author ?? ''} onValueChange={pick} disabled={loading && !board}>
              <SelectTrigger
                className="h-10 min-w-[11rem] rounded-full border-foreground/10 bg-card px-4 shadow-sm data-[placeholder]:text-muted-foreground/70"
                aria-label="Who you are"
              >
                <UserRound className="size-4" />
                <SelectValue placeholder="Pick your name" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {(board?.authors || []).map((name) => (
                  <SelectItem key={name} value={name} className="rounded-xl">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {phase === 'unreachable' && (
          <p className="mb-6 text-sm text-muted-foreground" role="status">
            The board is not reachable right now. It will retry on its own.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {lanes.map((lane) => (
            <BoardLane
              key={lane.key}
              lane={lane}
              cards={byLane[lane.key] || []}
              loading={loading}
              author={author}
              mine={mine}
              onPost={(title, body) => post(lane.key, title, body)}
              onStatus={moveStatus}
              onDelete={remove}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
