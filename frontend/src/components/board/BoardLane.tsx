'use client'

import { AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Card, CardStatus, Lane } from '@/services/boardApi'
import type { BoardCardItem } from './FeedbackBoard'
import { BoardCard } from './BoardCard'
import { Composer } from './Composer'
import { LANE_LOOK } from './lanes'

interface BoardLaneProps {
  lane: Lane
  cards: BoardCardItem[]
  loading: boolean
  author: string | null
  mine: Set<string>
  onPost: (title: string, body: string | null) => Promise<void>
  onStatus: (card: Card, next: CardStatus) => void
  onDelete: (card: Card) => void
}

export function BoardLane({ lane, cards, loading, author, mine, onPost, onStatus, onDelete }: BoardLaneProps) {
  const look = LANE_LOOK[lane.key]
  const Icon = look.icon

  return (
    <section className={cn('flex flex-col rounded-[1.75rem] p-3 sm:p-4 lg:min-h-[20rem]', look.surface)} aria-label={lane.label}>
      <header className="mb-3 flex items-center gap-2.5 px-1.5 pt-1">
        <span className={cn('grid size-8 place-items-center rounded-full bg-card/80 dark:bg-white/[0.06]', look.ink)}>
          <Icon className="size-4" strokeWidth={1.9} />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{lane.label}</h2>
        {!loading && (
          <span className={cn('ml-auto text-xs font-medium tabular-nums', look.ink)}>{cards.length}</span>
        )}
      </header>

      <Composer author={author} disabled={loading} onPost={onPost} />

      <div className="mt-3 flex flex-1 flex-col gap-2.5">
        {loading ? (
          <>
            <Skeleton className="h-[5.5rem] rounded-2xl bg-card/70" />
            <Skeleton className="h-[4.25rem] rounded-2xl bg-card/60" />
            <Skeleton className="h-[5rem] rounded-2xl bg-card/50" />
          </>
        ) : cards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className={cn('grid size-10 place-items-center rounded-full bg-card/70 dark:bg-white/[0.05]', look.ink, 'opacity-70')}>
              <Icon className="size-[18px]" strokeWidth={1.6} />
            </span>
            <p className="text-xs text-muted-foreground/70">Nothing here yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {cards.map((card) => (
              <BoardCard
                key={card.clientKey ?? card.id}
                card={card}
                canDelete={!!author && card.author === author && mine.has(card.id)}
                onStatus={onStatus}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
