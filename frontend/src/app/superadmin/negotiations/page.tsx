'use client'

/**
 * What is waiting on a rate, across every proposal at once. Hajar's screen.
 *
 * THE STEP WAS RIGHT AND HAD NO HOME. A client confirms a proposal; the campaign does not
 * open until somebody records what we have actually agreed to pay each creator. That order
 * is deliberate - opening first and chasing rates afterwards means asking a creator to
 * agree a fee they have already started working for.
 *
 * What the step never had was a screen. The settle panel is one of four components inside a
 * single proposal's page, so the only way to find this work was to remember which proposal
 * had it. "What is waiting on me to negotiate" had no answer anywhere in the product, and
 * the first time anybody asked it properly there were five proposals and twenty-six
 * creators sitting unpriced, holding up every one of those campaigns.
 *
 * WORST WAIT FIRST. A proposal confirmed three weeks ago is the one that has fallen off the
 * bottom of everybody's memory, and it is holding up the most.
 *
 * THE SETTLING STILL HAPPENS ON THE PROPOSAL. This screen finds the work and hands you
 * straight to it. Two places writing the same number is how the two come to disagree.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, Loader2, PlayCircle, Users2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { person } from '@/services/crmApi'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/negotiations`

type Waiting = {
  proposal_id: string
  name: string
  client: string | null
  team_id: string | null
  confirmed: number
  unpriced: number
  agreed_aed: number
  updated_at: string
}
type Person = {
  id: string; email: string; full_name: string | null; staff_role: string
  open_requests: number; late_requests: number; rosters: number
  sourced_this_month: number; priced_this_month: number
}

async function get<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${BASE}${path}`)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.detail || 'That did not work')
  return json.data as T
}

/** How long it has been sitting, in the words somebody would use. */
function waited(iso: string): { text: string; tone: string } {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return { text: 'today', tone: 'text-muted-foreground' }
  if (days === 1) return { text: 'since yesterday', tone: 'text-muted-foreground' }
  if (days < 7) return { text: `${days} days`, tone: 'text-muted-foreground' }
  if (days < 21) return { text: `${days} days`, tone: 'font-medium text-[var(--tone-warn-ink)]' }
  return { text: `${days} days`, tone: 'font-medium text-[var(--tone-bad-ink)]' }
}

export default function NegotiationsPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout><Negotiations /></SuperadminLayout>
    </AuthGuard>
  )
}

function Negotiations() {
  const router = useRouter()
  const [rows, setRows] = useState<Waiting[]>([])
  const [totals, setTotals] = useState<{ proposals_waiting: number; creators_waiting: number; ready_to_open: number } | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [unclaimed, setUnclaimed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [w, b] = await Promise.all([
        get<{ proposals: Waiting[]; totals: typeof totals }>(''),
        get<{ people: Person[]; unclaimed: number }>('/talent'),
      ])
      setRows(w.proposals || [])
      setTotals(w.totals ?? null)
      setPeople(b.people || [])
      setUnclaimed(b.unclaimed || 0)
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read this')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const waitingRows = rows.filter((r) => r.unpriced > 0)
  const ready = rows.filter((r) => r.unpriced === 0)

  return (
    <div className="space-y-7">
      <PageHead
        title="Rates to agree"
        sub="Clients have said yes to these. Nothing opens until we know what we are paying."
      />

      {totals && (totals.creators_waiting > 0 || totals.ready_to_open > 0) && (
        <div className={cn(CARD, 'flex flex-wrap items-center gap-x-10 gap-y-3 bg-card px-5 py-4')}>
          <div>
            <p className="text-ds-overline uppercase text-muted-foreground">Creators to price</p>
            <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums">
              {totals.creators_waiting}
            </p>
          </div>
          <div>
            <p className="text-ds-overline uppercase text-muted-foreground">Campaigns held up</p>
            <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums">
              {totals.proposals_waiting}
            </p>
          </div>
          {totals.ready_to_open > 0 && (
            <div>
              <p className="text-ds-overline uppercase text-muted-foreground">Priced, ready to open</p>
              <p className="mt-0.5 text-[24px] font-semibold leading-none tabular-nums
                            text-[var(--tone-good-ink)]">
                {totals.ready_to_open}
              </p>
            </div>
          )}
        </div>
      )}

      <ReadState
        failed={failed} loading={loading} empty={rows.length === 0}
        what="what is waiting on a rate" onRetry={load}
        nothing="Nothing is waiting on a rate."
        skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking across every proposal
        </div>}
      >
        <div className="space-y-7">
          {waitingRows.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title="Waiting on a rate"
                count={waitingRows.length}
                note="Longest wait first. Each of these is a campaign that cannot open."
              />
              <div className="flex flex-col gap-2">
                {waitingRows.map((r) => {
                  const w = waited(r.updated_at)
                  return (
                    <article key={r.proposal_id} className={cn(CARD, 'bg-card p-4')}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-ds-label font-semibold">
                            {r.client || 'No client on record'}
                          </p>
                          <p className="truncate text-ds-caption text-muted-foreground">
                            {r.name}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1
                                        text-ds-caption text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users2 className="h-3 w-3" />
                              {r.confirmed} confirmed
                            </span>
                            <span className="font-medium text-[var(--tone-warn-ink)]">
                              {r.unpriced} with no rate
                            </span>
                            <span className={w.tone}>confirmed {w.text} ago</span>
                          </p>
                        </div>
                        <Button size="sm"
                                onClick={() => router.push(`/work/proposals/${r.proposal_id}`)}>
                          Agree the rates
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {ready.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title="Priced and ready to open"
                count={ready.length}
                note="Every rate agreed. Nothing is chasing these, so they sit until somebody opens them."
              />
              <div className="flex flex-col gap-2">
                {ready.map((r) => (
                  <article key={r.proposal_id} className={cn(CARD, 'bg-card p-4')}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-ds-label font-semibold">
                          {r.client || 'No client on record'}
                        </p>
                        <p className="truncate text-ds-caption text-muted-foreground">
                          {r.name} · {r.confirmed} creators · AED{' '}
                          {Math.round(r.agreed_aed).toLocaleString()} agreed
                        </p>
                      </div>
                      <Button size="sm" variant="outline"
                              onClick={() => router.push(`/work/proposals/${r.proposal_id}`)}>
                        <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Open the campaign
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </ReadState>

      {/* ── Who holds what ───────────────────────────────────────────────────────────
          Counts, never a score. "41 sourced this month" is a fact; a number that rates a
          person is a judgement this screen is not entitled to make. */}
      {people.length > 0 && (
        <section className="space-y-3">
          <SectionHead
            title="The talent team"
            note="What each person is holding this month. Counts, not scores."
          />
          {unclaimed > 0 && (
            <p className="flex items-center gap-1.5 text-ds-caption text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{unclaimed}</span> requests nobody
              has taken.
            </p>
          )}
          <div className={cn(CARD, 'overflow-hidden bg-card')}>
            <table className="w-full text-ds-caption">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-2.5 font-semibold">Who</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Open</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Late</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Rosters</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Sourced</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Priced</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{p.full_name || person(p.email)}</span>
                      <Badge variant="outline" className="ml-2 text-ds-overline capitalize">
                        {p.staff_role.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.open_requests}</td>
                    <td className={cn('px-3 py-2.5 text-right tabular-nums',
                                      p.late_requests > 0 && 'font-semibold text-[var(--tone-bad-ink)]')}>
                      {p.late_requests}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.rosters}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.sourced_this_month}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{p.priced_this_month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
