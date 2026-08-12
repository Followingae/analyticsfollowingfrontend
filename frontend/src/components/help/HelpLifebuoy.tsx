'use client'

/**
 * The lifebuoy: top-right, on every operator screen.
 *
 * Opens a short list of walkthroughs for whoever is signed in. Every one can be re-run as
 * often as someone likes — finishing one only ticks it, it never hides it.
 */
import { useState } from 'react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { LifeBuoy, Play, Check, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { tracksFor, tourFor, completed, WALKTHROUGHS, type Walkthrough } from './walkthroughs'
import { WalkthroughRunner, useTourResume } from './WalkthroughRunner'
import './intro-theme.css'

export function HelpLifebuoy() {
  const { role, staffRole } = useAdminAccess()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState<Walkthrough | null>(null)
  const [leg, setLeg] = useState(0)
  const [done, setDone] = useState<string[]>([])

  // A tour that crossed a page boundary picks itself back up on arrival.
  useTourResume(WALKTHROUGHS, (t, l) => { setRunning(t); setLeg(l) })

  const tours = tourFor(role, staffRole)
  const groups = tracksFor(role, staffRole)
  const doneCount = tours.filter(t => done.includes(t.id)).length

  const start = (t: Walkthrough) => {
    setOpen(false)
    setLeg(0)
    // Let the popover close before intro.js measures anything.
    setTimeout(() => setRunning(t), 120)
  }

  return (
    <>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setDone(completed()) }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-tour="help"
            aria-label="Show me how"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LifeBuoy className="h-4 w-4" />
            <span className="hidden lg:inline">Show me how</span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold">Show me how</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Work through your track and you will know the platform end to end.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
                {doneCount}/{tours.length}
              </span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all"
                   style={{ width: `${tours.length ? (doneCount / tours.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-1.5">
            {groups.map(({ track, tours: list }) => (
              <div key={track} className="mb-1">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {track}
                </p>
                {list.map((t) => {
                  const finished = done.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => start(t)}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition hover:bg-muted"
                    >
                      <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${
                        finished ? 'bg-emerald-500/12 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        {finished ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium leading-snug">{t.title}</span>
                        <span className="block text-xs leading-snug text-muted-foreground">{t.blurb}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">
                          {t.minutes} min · {t.steps.length} steps{finished ? ' · done' : ''}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="border-t p-1.5">
            <Button variant="ghost" size="sm" className="w-full justify-start"
                    onClick={() => { setOpen(false); router.push('/superadmin/guide') }}>
              <BookOpen className="mr-2 h-4 w-4" />Read the full guide
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {running && (
        <WalkthroughRunner tour={running} startLeg={leg} onClose={() => { setRunning(null); setLeg(0) }} />
      )}
    </>
  )
}
