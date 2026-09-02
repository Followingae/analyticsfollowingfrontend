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

  const byCampaign = useMemo(() => {
    const map = new Map<string, { name: string; id: string; rows: Row[] }>()
    for (const r of rows) {
      const g = map.get(r.campaign_id) || { name: r.campaign, id: r.campaign_id, rows: [] }
      g.rows.push(r)
      map.set(r.campaign_id, g)
    }
    return [...map.values()].sort((a, b) => b.rows.length - a.rows.length)
  }, [rows])

  const late = rows.filter(r => r.late).length

  return (
    <SuperadminLayout>
      <div className="space-y-ds-5">
        {/* The title was hand-set here at a size no other console screen uses. PageHead is
            the same decision made once, and it carries the tour's page anchor with it. */}
        <PageHead
          title="Creators to chase"
          sub={'Everyone we have booked who is waiting on something: a rate, a guide, or the ' +
               'content itself. ' + (late > 0
                 ? `${late} ${late === 1 ? 'is' : 'are'} past their content date.`
                 : 'Nobody is late.')}
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
                        <div className="flex items-center gap-ds-2 rounded-ds-lg pr-2.5
                                        transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
                          <button
                            type="button"
                            onClick={() => router.push(`/work/campaigns/${r.campaign_id}/ladder`)}
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
                                {r.waiting_for} · {dueLabel(r)}
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
