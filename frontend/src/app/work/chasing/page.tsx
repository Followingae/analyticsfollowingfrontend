'use client'

/**
 * Creators to chase — the list behind the number on Today.
 *
 * The count spans campaigns, so sending someone to the campaigns list left them looking for
 * a number that appears nowhere on it. This is the same set of people, grouped by the
 * campaign they were booked for, each row opening the board where the next rung is moved.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cdnAvatar } from '@/lib/avatar'
import { PageHead, ScoreDot, RoundButton, GroupLabel } from '@/components/console/primitives'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
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
        <ScoreDot
          value={r.late ? '!' : String(Math.max(0, Math.abs(r.since_days)))}
          suffix={r.late ? undefined : 'd'}
          tone={r.late ? 'bad' : r.since_days >= 3 ? 'warn' : 'good'}
          title={dueLabel(r)}
        />
      </button>
    </div>
  )
}

export default function ChasingPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/chasing`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not load')
        setRows((await res.json()).data?.items || [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load the list')
      } finally { setLoading(false) }
    })()
  }, [])

  const late = rows.filter(r => r.late).length

  /** What the toggle is showing: everyone waiting, or only the ones past their date. */
  const [only, setOnly] = useState<'late' | 'all'>('all')
  const shown = useMemo(() => (only === 'late' ? rows.filter(r => r.late) : rows), [rows, only])

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
        <PageHead
          title="Creators to chase"
          sub={'Booked creators waiting on a rate, a guide or the content. ' + (late > 0
            ? `${late} past their date.`
            : 'Nobody is late.')}
          action={late > 0 ? (
            <ToggleGroup type="single" size="sm" variant="outline" value={only}
                         onValueChange={(v: string) => { if (v) setOnly(v as 'late' | 'all') }}>
              <ToggleGroupItem value="late" aria-label="Only the late ones">
                Late ({late})
              </ToggleGroupItem>
              <ToggleGroupItem value="all" aria-label="Everyone waiting">
                Everyone ({rows.length})
              </ToggleGroupItem>
            </ToggleGroup>
          ) : undefined}
        />

        {loading ? (
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
            {/* Worst first, whoever they were booked for. The campaign groups below are how
                you work a board; this is how you answer "who do I ring now". Only drawn when
                somebody is late, and not while the list is already filtered to the same
                people. */}
            {only === 'all' && lateRows.length > 0 && (
              <section>
                <header className="pb-ds-2">
                  <h2 className="text-ds-subheading">Late</h2>
                  <p className="text-ds-caption text-muted-foreground">
                    Past their content date, longest first
                  </p>
                </header>
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
                <header className="flex items-center justify-between gap-ds-3 pb-ds-2">
                  <div>
                    <h2 className="text-ds-subheading">{g.name}</h2>
                    <p className="text-ds-caption text-muted-foreground">
                      {g.rows.length} waiting
                      {g.rows.filter(r => r.late).length
                        ? ` · ${g.rows.filter(r => r.late).length} late`
                        : ''}
                    </p>
                  </div>
                  <RoundButton
                    icon={ArrowUpRight}
                    label={`Open the ${g.name} board`}
                    onClick={() => router.push(`/work/campaigns/${g.id}/ladder`)}
                  />
                </header>

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
