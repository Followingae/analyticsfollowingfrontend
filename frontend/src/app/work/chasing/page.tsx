'use client'

/**
 * Creators to chase — the list behind the number on Today.
 *
 * The count spans campaigns, so sending someone to the campaigns list left them looking for
 * a number that appears nowhere on it. This is the same set of people, grouped by the
 * campaign they were booked for, each row opening the board where the next rung is moved.
 *
 * It speaks the console's vocabulary now rather than its own dialect of it:
 *
 *   - the wait is `Age`, so amber at four days and red once a date has passed are decided
 *     in one place. The row carries two clocks and they are different facts: how long
 *     somebody has sat on this step, and how far past their content date they are.
 *   - the rung is `StageChip`, keyed on the stage the database stores and labelled from
 *     `STAGES`, so a rung can never pick up a second name on this screen.
 *   - the rate is `NotAgreed` where nobody has proposed one, and a `Dash` where there is a
 *     figure the server deliberately does not send us. Those were the same blank before.
 *   - the filters are `FilterBar` chips named after WHO is blocking, which is the question
 *     the screen exists to answer. A count renders at zero because a nought is a fact.
 *   - a refused read says so and offers a retry. It used to toast and leave the list empty,
 *     which drew "Nobody to chase": an all clear, on a failure, on the chasing screen.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cdnAvatar } from '@/lib/avatar'
import { RoundButton, GroupLabel } from '@/components/console/primitives'
import {
  Age, Dash, FilterBar, NoMatches, NotAgreed, SectionHead, type FilterChip,
} from '@/components/console/surfaces'
import { StageChip } from '@/components/console/Glyph'
import { STAGE_ORDER, type StageRung } from '@/lib/consoleIcons'
import { CampaignsHubHeader } from '@/components/console/CampaignsHubHeader'
import { AlarmClock, ArrowUpRight, CheckCircle2, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Row {
  id: string
  campaign_id: string
  campaign: string
  username: string
  avatar?: string | null
  stage: string
  waiting_for: string
  since_days: number
  late: boolean
  content_due?: string | null
}

const dueLabel = (r: Row) => {
  if (r.waiting_for === 'Content late') return `was due ${r.since_days} day${r.since_days === 1 ? '' : 's'} ago`
  if (r.waiting_for === 'Content due') {
    const inDays = Math.abs(r.since_days)
    return inDays === 0 ? 'due today' : `due in ${inDays} day${inDays === 1 ? '' : 's'}`
  }
  return r.since_days > 0
    ? `${r.since_days} day${r.since_days === 1 ? '' : 's'} on this step`
    : 'moved today'
}

/** The rung, or nothing when the stage is not one. A dropped creator exists in production
 *  and has its own chip, so it must not fall through a lookup and come out blank. */
const RUNGS = new Set<string>(STAGE_ORDER)
const rungOf = (stage: string): StageRung | 'dropped' | null =>
  stage === 'dropped' ? 'dropped' : RUNGS.has(stage) ? (stage as StageRung) : null

/**
 * Who this row is waiting on.
 *
 * The feed names the thing that is missing ("No rate agreed yet", "Guide not sent"); the
 * ladder already pairs each rung with the role that owns it, and that is the fact worth
 * filtering on. Nobody comes to this screen asking which status a row is in, they come
 * asking who to ring.
 */
type Blocker = 'founder' | 'us' | 'creator'
const blockerOf = (r: Row): Blocker =>
  r.waiting_for === 'No rate agreed yet' ? 'founder'
    : r.waiting_for === 'Guide not sent' ? 'us'
      : 'creator'

/**
 * One creator waiting on something.
 *
 * Shared by the two places the same person can appear: the "Late" band at the top of the
 * page, and the campaign they were booked for further down. Written once so the two can
 * never drift into looking like two different kinds of thing.
 */
function ChaseRow({ r, onOpen, showCampaign }: {
  r: Row
  onOpen: () => void
  /** In the cross-campaign band a handle alone does not say which board to open. */
  showCampaign?: boolean
}) {
  const rung = rungOf(r.stage)
  return (
    <div className="flex items-center gap-ds-2 rounded-ds-lg pr-2.5
                    transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-ds-3 rounded-ds-lg px-ds-2 py-ds-2 text-left"
      >
        <Avatar className="h-9 w-9">
          {/* Instagram blocks hotlinks, so this always goes via our CDN. */}
          <AvatarImage src={cdnAvatar(r.avatar || undefined)} alt={r.username} />
          <AvatarFallback className="text-[11px] font-semibold">
            {r.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium leading-snug">
            @{r.username}
          </span>
          <span className="block truncate text-[12.5px] text-muted-foreground">
            {showCampaign ? `${r.campaign} · ` : ''}{r.waiting_for} · {dueLabel(r)}
          </span>
        </span>
      </button>
      {/* Outside the button on purpose. `Age` is a Badge, which is a div, and flow content
          inside a button is invalid markup, which is the same reason the console's own Row keeps its
          trim as a sibling of the clickable area rather than a child of it. */}
      <div className="flex shrink-0 items-center gap-ds-2">
        {/* The rate. Two different nothings that used to be the same nothing: nobody has
            proposed a figure, or there is one and this screen is never sent it, because the
            money on a booked creator is cost and the endpoint strips it. */}
        <span className="hidden md:inline-flex">
          {blockerOf(r) === 'founder'
            ? <NotAgreed />
            : <Dash reason="unseen" what="the agreed rate" />}
        </span>
        {rung && (
          <span className="hidden sm:inline-flex">
            <StageChip rung={rung} state={r.late ? 'late' : 'current'} />
          </span>
        )}
        {/* Two clocks, kept apart: days on this step, and days past a promised date. */}
        <Age
          days={Math.max(0, r.since_days)}
          lateDays={r.late ? r.since_days : undefined}
        />
      </div>
    </div>
  )
}

export default function ChasingPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  /** A refused read is not "nobody to chase". Held so the page can say the list did not
   *  come back, rather than drawing the all clear over a failure. */
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailure(null)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/chasing`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not load')
      setRows((await res.json()).data?.items || [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load the list'
      setFailure(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const late = rows.filter(r => r.late).length

  /** What the bar is showing: everyone waiting, the ones past their date, or the set one
   *  particular person is holding up. */
  const [only, setOnly] = useState<'all' | 'late' | Blocker>('all')
  const shown = useMemo(() => {
    if (only === 'all') return rows
    if (only === 'late') return rows.filter(r => r.late)
    return rows.filter(r => blockerOf(r) === only)
  }, [rows, only])

  /* Counts are facts and render at zero. No chip is hidden: unlike "Needs me" on Today,
     none of these is a tautology for any one role, so pruning one would only take a way
     back out of a filtered view. */
  const chips: FilterChip[] = [
    { key: 'all', label: 'Everyone waiting', n: rows.length },
    { key: 'late', label: 'Past their date', n: late },
    { key: 'founder', label: 'Waiting on a founder', n: rows.filter(r => blockerOf(r) === 'founder').length },
    { key: 'us', label: 'Waiting on us', n: rows.filter(r => blockerOf(r) === 'us').length },
    { key: 'creator', label: 'Waiting on the creator', n: rows.filter(r => blockerOf(r) === 'creator').length },
  ]

  /**
   * Campaigns, worst first.
   *
   * This sorted by how many people were waiting, so a creator four days past their content
   * date in a two-person campaign sat at the bottom of the page while the biggest campaign,
   * entirely on schedule, opened it. The page's own subtitle is about who is late; the order
   * is now about the same thing.
   */
  const byCampaign = useMemo(() => {
    const map = new Map<string, { name: string; id: string; rows: Row[] }>()
    for (const r of shown) {
      const g = map.get(r.campaign_id) || { name: r.campaign, id: r.campaign_id, rows: [] }
      g.rows.push(r)
      map.set(r.campaign_id, g)
    }
    const worst = (g: { rows: Row[] }) =>
      Math.max(...g.rows.map(r => (r.late ? r.since_days : -1)), -1)
    return [...map.values()].sort((a, b) => worst(b) - worst(a) || b.rows.length - a.rows.length)
  }, [shown])

  /** The late ones on their own, worst first, whichever campaign they were booked for. */
  const lateRows = useMemo(
    () => rows.filter(r => r.late).sort((a, b) => b.since_days - a.since_days), [rows])

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        {/* The title was hand-set here at a size no other console screen uses. PageHead is
            the same decision made once, and it carries the tour's page anchor with it. */}
        <CampaignsHubHeader
          note={'Booked creators waiting on a rate, a guide or the content. ' + (late > 0
            ? `${late} past their date.`
            : 'Nobody is late.')}
        />

        {failure ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Could not load the list.</p>
            <p className="text-sm text-muted-foreground">
              {failure}. This is not an all clear: somebody may still be waiting on us.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load() }}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-ds-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-ds-3">
                <Skeleton className="h-4 w-40 rounded-ds-sm" />
                <Skeleton className="h-24 rounded-ds-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--tone-good-dot)]" />
            <p className="mt-ds-3 text-sm font-medium">Nobody to chase</p>
            <p className="mt-ds-1 text-sm text-muted-foreground">
              Every booked creator has a rate and has delivered on time.
            </p>
          </div>
        ) : (
          /* Each campaign used to be a full card: a hairline, a wash and a shadow drawn
             around a list of people, with a second rounded row drawn around each person
             inside it. Two edges to cross to read a handle. The cards come off — a campaign
             is still a genuinely different subject, so it keeps one hairline above its name
             and nothing else, and the gap between campaigns goes up to ds-5 to carry the
             separation the border was drawing. */
          <div className="space-y-ds-5">
            <FilterBar chips={chips} value={only} onChange={(k: string) => setOnly(k as typeof only)} />

            {/* They filtered it down to nothing themselves, so the list says so instead of
                vanishing and looking like the data went. */}
            {shown.length === 0 && <NoMatches onClear={() => setOnly('all')} />}

            {/* Worst first, whoever they were booked for. The campaign groups below are how
                you work a board; this is how you answer "who do I ring now". Only drawn when
                somebody is late, and not while the list is already filtered to the same
                people. */}
            {only === 'all' && lateRows.length > 0 && (
              <section>
                <SectionHead
                  icon={AlarmClock}
                  title="Late"
                  count={lateRows.length}
                  note="Past their content date, longest first"
                />
                <div className="-mx-ds-2 space-y-ds-1">
                  {lateRows.map(r => (
                    <div key={`late-${r.id}`}>
                      <ChaseRow r={r} showCampaign onOpen={() =>
                        router.push(`/work/campaigns/${r.campaign_id}/ladder`)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {byCampaign.map(g => (
              <section key={g.id} className="border-t pt-ds-4 first:border-t-0 first:pt-0">
                <SectionHead
                  icon={Megaphone}
                  title={g.name}
                  count={g.rows.length}
                  note={g.rows.filter(r => r.late).length
                    ? `${g.rows.length} waiting · ${g.rows.filter(r => r.late).length} late`
                    : `${g.rows.length} waiting`}
                  action={
                    <RoundButton
                      icon={ArrowUpRight}
                      label={`Open the ${g.name} board`}
                      onClick={() => router.push(`/work/campaigns/${g.id}/ladder`)}
                    />
                  }
                />

                <div className="-mx-ds-2 space-y-ds-1">
                  {g.rows.map((r, i) => {
                    const band = r.late ? 'Late' : r.waiting_for
                    const prev = i > 0 ? (g.rows[i - 1].late ? 'Late' : g.rows[i - 1].waiting_for) : null
                    return (
                      <div key={r.id}>
                        {band !== prev && <GroupLabel>{band}</GroupLabel>}
                        <ChaseRow r={r} onOpen={() =>
                          router.push(`/work/campaigns/${r.campaign_id}/ladder`)} />
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </SuperadminLayout>
  )
}
