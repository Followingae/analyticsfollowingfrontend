'use client'

/**
 * My team.
 *
 * A queue you own instead of an inbox you drown in: what is waiting on you, who is moving,
 * and the few things that are genuinely off. Alerts fire on patterns, never on single events.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Inbox, Layers as LayersIcon, UserRound } from 'lucide-react'
import {
  Empty, MiniBar, PageHead, Panel, Row, ScoreDot, Stat, StatGrid,
} from '@/components/console/primitives'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Alert { level: 'critical' | 'warning' | 'info'; kind: string
                  title: string; detail: string; href: string | null }

const initials = (email: string) => email.slice(0, 2).toUpperCase()
const ago = (iso: string | null) => {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return d < 1 ? 'today' : d === 1 ? '1 day' : `${d} days`
}

export default function TeamConsolePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  /**
   * A read that failed and a team with nothing on it are different facts.
   *
   * The catch used to toast and leave `data` at null, and null fell through to "Nothing to
   * show." So a 500 told a founder that nobody is waiting, nothing is overdue and no alert
   * has fired, on the one screen whose whole job is to be glanced at and believed. Every
   * neighbouring screen already holds this separately.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const load = async () => {
    setFailure(null)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/team-console`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load the console'
      setFailure(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <SuperadminLayout>
        {/* The loaded band draws no box per figure, so the skeleton does not promise one. */}
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-48 rounded-ds-lg" />
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-9 w-20 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <div className="grid gap-ds-4 lg:grid-cols-2">
            <Skeleton className="h-[280px] rounded-ds-2xl" />
            <Skeleton className="h-[280px] rounded-ds-2xl" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }
  if (failure) {
    return (
      <SuperadminLayout>
        <div className="space-y-ds-2">
          <p className="text-sm font-medium">Could not load the console.</p>
          <p className="text-sm text-muted-foreground">
            {failure}. This is not an all clear. No queue, area or alert below is known.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
            Try again
          </Button>
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">Nothing to show.</p></SuperadminLayout>
  }

  const areas = data.areas || []
  const overdueAreas = areas.filter((r: any) =>
    r.due_at && new Date(r.due_at).getTime() < Date.now())
  const overdue = overdueAreas.length
  const alerts: Alert[] = data.alerts || []
  const access: any[] = data.access || []
  /* Days late, for the mark that carries it. Positive means past the date. */
  const daysLate = (iso: string | null) =>
    iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0
  /* Overdue first. The panel used to sort by soonest due, which puts a roster that is three
     days late underneath one that is due next Tuesday. */
  const ranked = [...areas].sort((a: any, b: any) => daysLate(b.due_at) - daysLate(a.due_at))

  const alertRows = (
    <>
      {alerts.map((a: Alert, i: number) => (
        <Row
          key={i}
          tone={a.level === 'critical' ? 'bad' : a.level === 'warning' ? 'warn' : 'info'}
          title={a.title}
          meta={a.detail}
          right={a.href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : undefined}
          onClick={a.href ? () => router.push(a.href!) : undefined}
        />
      ))}
    </>
  )

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        <PageHead
          title="My team"
          sub="Nobody else sees this page. An alert here needs a pattern, not one slow afternoon."
        />

        {/* When something is critical it stops being one of four panels and becomes the
            screen. Below the title, above the figures, full width. */}
        {alerts.some(a => a.level === 'critical') && (
          <Panel title="Needs you now" className="bg-[var(--tone-bad-wash)]" flush>
            {alertRows}
          </Panel>
        )}

        {/* Three figures. "Alerts" was a count of the list directly underneath it, and
            "Areas open" was the panel at the bottom said twice. What replaces them is the
            one number this screen exists for. */}
        <StatGrid cols={3}>
          <Stat label="Waiting on you" value={data.waiting.count} icon={Inbox}
                tone={data.waiting.count ? 'warn' : 'good'}
                hint={data.waiting.oldest ? `Oldest ${ago(data.waiting.oldest)}` : 'Nothing waiting'}
                onClick={() => router.push('/work/influencers/review')} />
          {/* When exactly one roster is late, the tile is about that roster, so it opens it
              rather than the grid it is one card of. */}
          <Stat label="Overdue" value={overdue} icon={LayersIcon}
                tone={overdue ? 'bad' : 'good'}
                hint={overdue === 1
                  ? `${overdueAreas[0].client_name || overdueAreas[0].title}, ${overdueAreas[0].owner_email || 'unassigned'}`
                  : overdue ? `Of ${areas.length} open` : `All ${areas.length} on time`}
                onClick={() => router.push(
                  overdueAreas.length === 1 ? `/work/areas/${overdueAreas[0].id}` : '/work/areas')} />
          <Stat label="Added this week" value={data.people.reduce((a: number, p: any) => a + (p.added_week || 0), 0)}
                icon={UserRound} hint="Across the whole team" />
        </StatGrid>

        <div className="grid items-start gap-ds-4 lg:grid-cols-2">
          {/* The critical ones are already above; this panel is where the rest live, and it
              is not drawn at all when there is nothing in it. */}
          {alerts.length > 0 && (
            <Panel title="Alerts" flush>{alertRows}</Panel>
          )}

          <Panel title="Your people" flush>
            {data.people.map((p: any) => (
              <Row
                key={p.id}
                tone={p.overdue_rounds > 0 ? 'bad'
                      : p.added_week === 0 && p.staff_role === 'talent_manager' ? 'warn' : 'good'}
                title={
                  <span className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[11px] font-semibold">
                        {initials(p.email)}
                      </AvatarFallback>
                    </Avatar>
                    {p.email}
                  </span>
                }
                meta={
                  /* The badge on the right already says overdue, quiet or moving, so the
                     line underneath says only what the badge cannot: their role and their
                     month. The roster count moves to the bar beside the badge. */
                  <span className="pl-[38px] capitalize">
                    {String(p.staff_role || '').replace(/_/g, ' ')} · {p.added_month} this month
                  </span>
                }
                right={
                  /* "Quiet week" and "Moving" were a hand-picked amber and emerald, a fourth
                     set beside the three the console already decides once. They name the
                     tone tokens now, and carry a wash rather than only coloured text so the
                     state survives a print-out. */
                  <>
                    {p.open_rounds > 0 && (
                      <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                        {p.open_rounds} roster{p.open_rounds === 1 ? '' : 's'}
                      </span>
                    )}
                    {p.overdue_rounds > 0
                      ? <Badge variant="destructive">{p.overdue_rounds} overdue</Badge>
                      : p.added_week === 0 && p.staff_role === 'talent_manager'
                        ? <Badge variant="outline" className="border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]">Quiet week</Badge>
                        : <Badge variant="outline" className="border-transparent bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]">Moving</Badge>}
                  </>
                }
              />
            ))}
            {data.people.length === 0 && <Empty>Nobody has a staff role yet.</Empty>}
          </Panel>
        </div>

        <Panel title="Rosters open now" description="Overdue first" flush>
          {ranked.map((r: any) => {
            const over = daysLate(r.due_at)
            const late = !!r.due_at && over > 0
            return (
              <Row
                key={r.id}
                tone={late ? 'bad' : r.awaiting_review > 0 ? 'warn' : 'info'}
                title={r.title}
                meta={
                  <>
                    {r.client_name || 'No client linked'} · {r.owner_email || 'unassigned'}
                    {(r.round_no || 1) > 1 && ` · round ${r.round_no}`}
                    {r.awaiting_review > 0 && ` · ${r.awaiting_review} awaiting your review`}
                    {r.dropped > 0 && ` · ${r.dropped} turned down`}
                  </>
                }
                right={
                  <>
                    <span className="hidden sm:block">
                      <MiniBar value={r.proposed} max={r.target_count || r.proposed || 1}
                               tone={late ? 'bad' : 'info'} />
                    </span>
                    {/* Days late is the mark the eye catches; a date is a thing it has to
                        work out. A roster that is on time keeps the date, because then the
                        question is when, not how late. */}
                    {late
                      ? <ScoreDot value={over} suffix="d" tone="bad"
                                  title={`${over} day${over === 1 ? '' : 's'} past the date`} />
                      : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {r.due_at ? new Date(r.due_at).toLocaleDateString('en-GB',
                            { day: 'numeric', month: 'short' }) : 'no date'}
                        </Badge>
                      )}
                  </>
                }
                onClick={() => router.push(`/work/areas/${r.id}`)}
              />
            )
          })}
          {areas.length === 0 && <Empty>No brand is being sourced for right now.</Empty>}
        </Panel>

        {/* Who has been reading the database, and who tried to take it out of the building.
            The endpoint has always returned this and no screen has ever drawn it, so the two
            alerts raised from it pointed at a page that did not show the thing they were
            about. Leadership only, which is what the endpoint already enforces. */}
        {access.length > 0 && (
          <Panel title="Who has been reading the database" description="Last seven days" flush>
            {access.map((a: any, i: number) => (
              <Row
                key={`${a.user_email}-${i}`}
                tone={a.exports > 0 ? 'bad' : (a.records || 0) > 2000 ? 'warn' : 'neutral'}
                title={a.user_email}
                meta={
                  <>
                    {`${Number(a.records || 0).toLocaleString()} records over ${a.requests} view${a.requests === 1 ? '' : 's'}`}
                    {a.exports > 0 && ` · ${a.exports} export${a.exports === 1 ? '' : 's'} attempted`}
                    {a.last_seen && ` · last ${ago(a.last_seen)}`}
                  </>
                }
                right={
                  <ScoreDot
                    value={a.records >= 1000 ? `${Math.round(a.records / 1000)}k` : (a.records ?? 0)}
                    tone={a.exports > 0 ? 'bad' : (a.records || 0) > 2000 ? 'warn' : 'neutral'}
                    title="Creator records read"
                  />
                }
              />
            ))}
          </Panel>
        )}
      </div>
    </SuperadminLayout>
  )
}
