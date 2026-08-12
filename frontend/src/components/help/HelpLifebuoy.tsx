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
import { tourFor, completed, type Walkthrough } from './walkthroughs'
import { WalkthroughRunner } from './WalkthroughRunner'

export function HelpLifebuoy() {
  const { role, staffRole } = useAdminAccess()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState<Walkthrough | null>(null)
  const [done, setDone] = useState<string[]>([])

  const tours = tourFor(role, staffRole)

  const start = (t: Walkthrough) => {
    setOpen(false)
    // Let the popover close before the spotlight measures anything.
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
            <h4 className="text-sm font-semibold">Show me how</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Short guided walkthroughs. Re-run any of them, any time.
            </p>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-1.5">
            {tours.map((t) => {
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

          <div className="border-t p-1.5">
            <Button variant="ghost" size="sm" className="w-full justify-start"
                    onClick={() => { setOpen(false); router.push('/superadmin/guide') }}>
              <BookOpen className="mr-2 h-4 w-4" />Read the full guide
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {running && <WalkthroughRunner tour={running} onClose={() => setRunning(null)} />}
    </>
  )
}
