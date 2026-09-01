'use client'

/**
 * Show me how — the full page.
 *
 * This was a dropdown, which was the wrong shape for it: a dropdown is for picking a thing,
 * and this is a curriculum you work through over your first week. A page can breathe, show
 * where you are, and be a link someone sends you.
 *
 * Starting a tour arms it and navigates; the runner lives in the header and picks it up on
 * arrival, so a walkthrough can cross as many screens as it needs to.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Check, Clock, Play, Sparkles } from 'lucide-react'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { tracksFor, tourFor, completed, type Walkthrough } from '@/components/help/walkthroughs'
import { armTour } from '@/components/help/WalkthroughRunner'
import { modulesForPath } from '@/lib/routeModules'

/**
 * Rendering this bare — which is what it did — dropped whoever opened it out of the product
 * entirely: no sidebar, no way back except the browser button.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return <SuperadminLayout>{children}</SuperadminLayout>
}

export default function ShowMeHowPage() {
  const { role, staffRole, loading, isStaff, isSuperAdmin, can } = useAdminAccess()
  const router = useRouter()
  const [done, setDone] = useState<string[]>([])

  useEffect(() => { setDone(completed()) }, [])

  /**
   * A tour is only offered when every screen it visits is one this person can open.
   *
   * Audience tags were the only filter, and they are a hand-maintained guess — so people
   * were being offered walkthroughs of work their role cannot do, and starting one bounced
   * off the route guard. Asking the same question the guard asks means the list cannot drift
   * from what the platform will actually let them see.
   */
  const permitted = useCallback((t: Walkthrough) => {
    const paths = t.steps.map(s => s.goto).filter(Boolean) as string[]
    return paths.every(p => {
      const mods = modulesForPath(p)
      return mods.length === 0 || mods.some(m => can(m))
    })
  }, [can])

  const tours = useMemo(
    () => tourFor(role, staffRole).filter(permitted), [role, staffRole, permitted])
  const groups = useMemo(
    () => tracksFor(role, staffRole)
      .map(g => ({ ...g, tours: g.tours.filter(permitted) }))
      .filter(g => g.tours.length > 0),
    [role, staffRole, permitted])
  const doneCount = tours.filter(t => done.includes(t.id)).length
  const minutes = tours.reduce((n, t) => n + t.minutes, 0)
  const pct = tours.length ? Math.round((doneCount / tours.length) * 100) : 0

  const start = (t: Walkthrough) => {
    const armed = armTour(t)
    // A tour whose first step has no `goto` was silently starting on this page — the card
    // looked like it did nothing at all. Fall back to the first screen it mentions.
    const firstGoto = t.steps.find(s => s.goto)?.goto
    router.push(armed ?? firstGoto ?? '/work/today')
  }

  // The first unfinished one, in learning order — what "continue" should open.
  const next = groups.flatMap(g => g.tours).find(t => !done.includes(t.id))

  if (loading) return null

  // These walkthroughs teach our own operation. A client who follows a link here gets sent
  // back to their dashboard rather than a page explaining how we price them.
  const internal = isSuperAdmin || isStaff || role === 'admin'
  if (!internal) {
    if (typeof window !== 'undefined') router.replace('/dashboard')
    return null
  }

  return (
    <Shell>
    {/* READING tier. This is a curriculum you work through, not a dashboard you scan, so
        the page runs on 64px bands, prose is capped near 65 characters, and the only boxes
        left are the two kinds of thing you can actually open: the manual, and a lesson. */}
    <div data-density="reading"
         className="mx-auto flex w-full max-w-5xl flex-col gap-ds-6 px-6 py-10 lg:py-14">
      <header className="flex flex-col gap-ds-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-[65ch] flex-col items-start gap-ds-3">
          <Badge variant="secondary" className="gap-ds-1">
            <Sparkles className="h-3 w-3" />Show me how
          </Badge>
          <h1 className="text-ds-title text-foreground">
            Learn by doing it
          </h1>
          <p className="text-ds-body text-muted-foreground">
            Each one opens the real screen and shows you what to do, step by step. Start at the
            top. You can stop any time, and watch any of them again.
          </p>
        </div>

        {next && (
          <Button size="lg" onClick={() => start(next)} className="shrink-0">
            <Play className="mr-2 h-4 w-4" />
            {doneCount ? 'Continue' : 'Start the first one'}
          </Button>
        )}
      </header>

      {/* The whole picture, before the individual lessons. This one we present. */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0F1A12] to-[#16241A] text-white">
        <CardContent className="flex flex-col gap-ds-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-[65ch] flex-col gap-ds-2">
            <p className="text-ds-overline uppercase text-[#D3FF02]">
              The team manual
            </p>
            <p className="text-ds-heading">How work moves at Following</p>
            <p className="text-ds-body text-white/70">
              One brand end to end, stop by stop: who does what, and what happens next. Built
              to be walked through together.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => router.push('/work/manual')}
            className="shrink-0 bg-white text-neutral-900 hover:bg-white/90"
          >
            <Play className="mr-2 h-4 w-4" />Open the manual
          </Button>
        </CardContent>
      </Card>

      {/* Progress is a reading, not an object. The card came off it: a figure, a bar and a
          total do not become one thing by being fenced in together. */}
      <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-baseline gap-ds-2">
          <span className="text-ds-title tabular-nums">{doneCount}</span>
          <span className="text-ds-body text-muted-foreground">of {tours.length} done</span>
        </p>
        <Progress value={pct} className="h-1.5 sm:max-w-md sm:flex-1" />
        <p className="flex items-center gap-ds-1 text-ds-caption text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{minutes} min</span>
          <span>in total</span>
        </p>
      </div>

      <div className="flex flex-col gap-ds-6">
        {groups.map(({ track, tours: list }) => (
          <section key={track} className="flex flex-col gap-ds-3">
            <div className="flex items-baseline gap-ds-2">
              <h2 className="text-ds-overline uppercase text-muted-foreground">
                {track}
              </h2>
              <span className="text-ds-overline tabular-nums text-muted-foreground/70">
                {list.filter(t => done.includes(t.id)).length}/{list.length}
              </span>
            </div>

            <div className="grid gap-ds-3 sm:grid-cols-2">
              {list.map(t => {
                const finished = done.includes(t.id)
                return (
                  <Card
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => start(t)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(t) } }}
                    className="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <CardContent className="flex gap-ds-3 p-6">
                      <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                        finished ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'}`}>
                        {finished ? <Check className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex min-w-0 flex-col gap-ds-2">
                        <h3 className="text-ds-label leading-snug">{t.title}</h3>
                        <p className="max-w-[65ch] text-ds-body text-muted-foreground">{t.blurb}</p>
                        <p className="text-ds-caption tabular-nums text-muted-foreground/80">
                          {t.minutes} min · {t.steps.length} steps{finished ? ' · done' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
    </Shell>
  )
}
