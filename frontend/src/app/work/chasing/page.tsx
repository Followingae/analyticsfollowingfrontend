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
import { CARD, ScoreDot, RoundButton, GroupLabel } from '@/components/console/primitives'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Creators to chase</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Everyone we have booked who is waiting on something — a rate, a guide, or the
            content itself. {late > 0
              ? `${late} ${late === 1 ? 'is' : 'are'} past their content date.`
              : 'Nobody is late.'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-40 rounded-[22px]" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className={cn(CARD, 'bg-white py-16 text-center dark:bg-neutral-900/70')}>
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
            <p className="mt-3 text-sm font-medium">Nobody to chase</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every booked creator has a rate and has delivered on time.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {byCampaign.map(g => (
              <section key={g.id} className={cn(CARD, 'bg-white dark:bg-neutral-900/70')}>
                <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                  <div>
                    <h2 className="text-[15.5px] font-semibold tracking-[-0.01em]">{g.name}</h2>
                    <p className="text-[12.5px] text-muted-foreground">
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

                <div className="space-y-1.5 px-3 pb-4">
                  {g.rows.map((r, i) => {
                    const band = r.late ? 'Late' : r.waiting_for
                    const prev = i > 0 ? (g.rows[i - 1].late ? 'Late' : g.rows[i - 1].waiting_for) : null
                    return (
                      <div key={r.id}>
                        {band !== prev && <GroupLabel>{band}</GroupLabel>}
                        <div className="flex items-center gap-2 rounded-2xl border border-transparent pr-2.5
                                        transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
                          <button
                            type="button"
                            onClick={() => router.push(`/work/campaigns/${r.campaign_id}/ladder`)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
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
