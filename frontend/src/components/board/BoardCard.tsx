'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Card, CardStatus } from '@/services/boardApi'
import { STATUS_LABEL, STATUS_NEXT, STATUS_PILL, initials, relativeTime } from './lanes'

interface BoardCardProps {
  card: Card
  /** This browser wrote the card and the viewer is its author. */
  canDelete: boolean
  onStatus: (card: Card, next: CardStatus) => void
  onDelete: (card: Card) => void
}

export function BoardCard({ card, canDelete, onStatus, onDelete }: BoardCardProps) {
  const done = card.status === 'done'
  const [tick, setTick] = useState(0)
  // Relative time drifts, so the footer re-reads it every minute.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])
  void tick

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: done ? 0.62 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={cn(
        'group relative rounded-2xl bg-card p-4 shadow-[0_1px_2px_oklch(0_0_0/0.04),0_6px_18px_-8px_oklch(0_0_0/0.10)] ring-1 ring-foreground/[0.04]',
        'dark:ring-white/[0.06]'
      )}
    >
      {canDelete && (
        <button
          type="button"
          aria-label="Delete this card"
          onClick={() => onDelete(card)}
          className={cn(
            'absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full text-muted-foreground/60 transition',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-muted hover:text-foreground'
          )}
        >
          <X className="size-3.5" />
        </button>
      )}

      <h3 className={cn('pr-6 text-[15px] font-medium leading-snug text-foreground', done && 'line-through decoration-foreground/30')}>
        {card.title}
      </h3>
      {card.body && (
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground/80">{card.body}</p>
      )}

      <footer className="mt-3.5 flex items-center gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold tracking-wide text-foreground/70">
            {initials(card.author)}
          </span>
          <span className="truncate text-xs font-medium text-foreground/80">{card.author}</span>
        </span>
        <span className="truncate text-xs text-muted-foreground/60">{relativeTime(card.created_at)}</span>
        <button
          type="button"
          onClick={() => onStatus(card, STATUS_NEXT[card.status])}
          title="Click to move it on"
          className={cn(
            'ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors',
            STATUS_PILL[card.status]
          )}
        >
          {STATUS_LABEL[card.status]}
        </button>
      </footer>
    </motion.article>
  )
}
