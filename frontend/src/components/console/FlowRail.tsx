'use client'

/**
 * The process — who holds the work, in the order it changes hands.
 *
 * The founder's own words, and they are the specification: "BUSINESS DEVELOPMENT -> TALENT
 * -> WITH APPROVALS -> WITH CLIENT (and then back to wherever in case of more rounds
 * requested)". That is a relay. Five hands, one direction, one loop back.
 *
 * The first version of this drew twelve stops grouped into four acts, which is the process
 * as the DATABASE experiences it, not as the company does. Twelve is the right number for a
 * report and the wrong number for a wall chart: nobody learns their place in a company from
 * twelve boxes. Nothing is lost by grouping them, because each stage still lists the stops
 * inside it with their own numbers.
 *
 * What it is for: a new joiner should be able to point at one box and say "that is me", see
 * who hands to them and who they hand to, and know at a glance whether the pile in front of
 * them is theirs or somebody else's. Every role in the company independently reported the
 * same missing fact - whether the person upstream has acted yet - and this is the answer.
 *
 * It belongs on the dashboard. It was moved to the guide once, on the reasoning that a thing
 * you read in your first week does not deserve the home screen; that was wrong, and the
 * reason it was wrong is worth keeping. This is not documentation. It carries live counts, so
 * it is the only place in the product that says where the work is piling up right now, and a
 * thing nobody navigates to is a thing nobody reads.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Stop = {
  id: string
  title: string
  owner: string
  hint: string
  href: string
  count: number | null
  mine: boolean
  can_open: boolean
}

/**
 * The five hands, and which of the twelve stops sit in each.
 *
 * `scope` is who this stage belongs to, in the same words the rest of the console uses, so a
 * person can find themselves on it. The client is not a scope: nobody internal holds that
 * stage, which is exactly the point of showing it.
 */
const STAGES: {
  key: string
  title: string
  who: string
  scope: string | null
  stops: string[]
}[] = [
  { key: 'bd', title: 'Business development', who: 'Brands in the door',
    scope: 'business_development', stops: ['logged'] },
  { key: 'talent', title: 'Talent', who: 'Finding and pricing creators',
    scope: 'talent', stops: ['area', 'stock'] },
  { key: 'approvals', title: 'Approvals', who: 'Only a founder can clear these',
    scope: 'leadership', stops: ['price', 'clear', 'proposal'] },
  { key: 'client', title: 'With the client', who: 'Waiting on them, not on us',
    scope: null, stops: ['share', 'confirm', 'partial'] },
  { key: 'deliver', title: 'Delivering', who: 'Live work, and paying people',
    scope: null, stops: ['paper', 'ladder', 'pay'] },
]

export function FlowRail({ scope }: { scope?: string | null }) {
  const [stops, setStops] = useState<Stop[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/flow`)
        const json = await res.json()
        if (!live) return
        const list = json?.data?.stops
        if (Array.isArray(list) && list.length) setStops(list)
        else setFailed(true)
      } catch {
        if (live) setFailed(true)
      }
    })()
    return () => { live = false }
  }, [])

  const by = (id: string) => stops?.find(s => s.id === id)

  return (
    <section data-tour="flow-rail" className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">How work moves</h2>
        <p className="text-xs text-muted-foreground">
          Left to right. Yours is marked.
        </p>
      </div>

      {failed ? (
        // Say so. This used to disappear, so the one thing answering "I cannot see our
        // process" vanished without a word and nobody could report it.
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              The stages are below. The counts could not be loaded.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {STAGES.map((stage, i) => {
          const rows = stage.stops.map(by).filter(Boolean) as Stop[]
          const total = rows.reduce((n, r) => n + (r.count ?? 0), 0)
          const mine = stage.scope != null && scope === stage.scope

          return (
            <div key={stage.key} className="flex flex-1 items-stretch gap-2">
              <Card className={cn('flex-1', mine && 'ring-2 ring-ring')}>
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{stage.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {stage.who}
                      </p>
                    </div>
                    {mine && <Badge variant="secondary" className="shrink-0">You</Badge>}
                  </div>

                  {stops === null ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold leading-none tabular-nums">
                        {total.toLocaleString('en-US')}
                      </p>
                      <ul className="mt-auto space-y-1">
                        {rows.map(r => (
                          <li key={r.id} className="flex items-baseline justify-between gap-2">
                            {r.can_open ? (
                              <Link
                                href={r.href}
                                className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                              >
                                {r.title}
                              </Link>
                            ) : (
                              <span className="truncate text-xs text-muted-foreground">
                                {r.title}
                              </span>
                            )}
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {r.count == null ? '—' : r.count.toLocaleString('en-US')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>

              {i < STAGES.length - 1 && (
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 self-center text-muted-foreground/50 lg:block"
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      {/* The loop. A client asking for more creators does not start a new process, it sends
          the same one back a stage, and leaving that out is what makes a straight line a lie. */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        If the client asks for more, it goes back to Talent and round again.
      </p>
    </section>
  )
}
