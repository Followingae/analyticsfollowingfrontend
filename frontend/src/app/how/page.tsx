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
import { moduleForPath } from '@/lib/routeModules'

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
      const m = moduleForPath(p)
      return !m || can(m)
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
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-3">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3" />Show me how
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            Learn by doing it
          </h1>
          <p className="text-muted-foreground">
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

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{doneCount}</span>
            <span className="text-sm text-muted-foreground">of {tours.length} done</span>
          </div>
          <Progress value={pct} className="h-2 sm:max-w-md sm:flex-1" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums">{minutes} min</span>
            <span>in total</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-10 space-y-10">
        {groups.map(({ track, tours: list }) => (
          <section key={track}>
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {track}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground/70">
                {list.filter(t => done.includes(t.id)).length}/{list.length}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    <CardContent className="flex gap-4 py-5">
                      <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                        finished ? 'bg-emerald-500/12 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        {finished ? <Check className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <h3 className="font-medium leading-snug">{t.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{t.blurb}</p>
                        <p className="text-xs tabular-nums text-muted-foreground/80">
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
