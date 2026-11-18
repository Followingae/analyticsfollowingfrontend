'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComposerProps {
  /** The viewer's pick, or null when they have not picked yet. */
  author: string | null
  disabled?: boolean
  onPost: (title: string, body: string | null) => Promise<void>
}

const TITLE_MAX = 140
const BODY_MAX = 2000

export function Composer({ author, disabled, onPost }: ComposerProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const ready = title.trim().length >= 2 && !busy && !disabled

  const submit = async () => {
    if (!author) {
      setNudge('Pick your name first')
      return
    }
    if (!ready) return
    setBusy(true)
    setNudge(null)
    try {
      await onPost(title.trim(), body.trim() || null)
      setTitle('')
      setBody('')
      setOpen(false)
    } catch (e) {
      setNudge(e instanceof Error && e.message ? e.message : 'That did not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !title && !body) setOpen(false)
      }}
      className={cn(
        'rounded-2xl bg-card/70 p-2 ring-1 ring-foreground/[0.05] transition-shadow dark:bg-card/40 dark:ring-white/[0.06]',
        open && 'bg-card shadow-[0_6px_24px_-10px_oklch(0_0_0/0.12)] dark:bg-card'
      )}
    >
      <div className="flex items-center gap-2">
        <input
          ref={titleRef}
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value)
            if (nudge) setNudge(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          placeholder="Add a card"
          aria-label="Card title"
          disabled={disabled}
          className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/55"
        />
        <button
          type="submit"
          aria-label="Post"
          disabled={!ready && !!author}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full transition-all',
            ready
              ? 'bg-foreground text-background shadow-sm hover:scale-105'
              : 'bg-muted text-muted-foreground/50'
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" strokeWidth={2.25} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <textarea
              value={body}
              maxLength={BODY_MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details, if it helps"
              aria-label="Card details"
              rows={2}
              disabled={disabled}
              className="mt-1 w-full resize-none bg-transparent px-2 pb-1 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nudge && (
          <motion.p
            key="nudge"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-2 pb-1 pt-0.5 text-xs text-muted-foreground"
            role="status"
          >
            {nudge}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  )
}
