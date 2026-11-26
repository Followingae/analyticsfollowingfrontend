'use client'

/**
 * The visit agent on this App Campaign.
 *
 * An AI on WhatsApp messages every approved creator, answers what it can from the
 * campaign's own facts, confirms their visit time and flags the rest for the team.
 * This card is how staff watch it: a row of counts, a pause switch, one line per
 * creator, and the conversation behind each line.
 *
 * A 404 means the campaign has no agent, and the card does not draw at all.
 */
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Failed, Loading, TONE_DOT, type Tone } from '@/app/superadmin/fa/_ui'
import { faAgentApi, NoAgentError, type AgentState, type AgentSummary } from '@/services/faAgentApi'
import { AgentThreadSheet } from './AgentThreadSheet'
import { Avatar, StatusPill, ago, displayName, lastActivity, triedLine, visitLine } from './agentUi'

const CHIPS: { key: keyof AgentSummary; label: string; tone: Tone }[] = [
  { key: 'confirmed', label: 'Confirmed', tone: 'good' },
  { key: 'waiting', label: 'Waiting', tone: 'neutral' },
  { key: 'questions', label: 'Questions', tone: 'warn' },
  { key: 'cant_make_it', label: "Can't make it", tone: 'bad' },
  { key: 'no_reply', label: 'No reply', tone: 'bad' },
  { key: 'visited', label: 'Visited', tone: 'neutral' },
]

export function AgentPanel({ campaignId }: { campaignId: string }) {
  const qc = useQueryClient()
  const key = ['fa-agent', campaignId]
  const q = useQuery<AgentState>({
    queryKey: key,
    queryFn: () => faAgentApi.get(campaignId),
    refetchInterval: 30_000,
    retry: (n, e) => !(e instanceof NoAgentError) && n < 1,
  })
  const [openId, setOpenId] = useState<string | null>(null)
  const [pausing, setPausing] = useState(false)

  const threads = useMemo(() => {
    const list = q.data?.threads ?? []
    // Anything waiting on the team first; the rest keep the server's order.
    return [...list].sort((a, b) => Number(b.open_flags > 0) - Number(a.open_flags > 0))
  }, [q.data])
  const selected = threads.find((t) => t.id === openId) ?? null

  if (q.error instanceof NoAgentError) return null

  const refresh = () => qc.invalidateQueries({ queryKey: key })

  const togglePause = async (paused: boolean) => {
    setPausing(true)
    try {
      await faAgentApi.setPaused(campaignId, paused)
      qc.setQueryData<AgentState>(key, (cur) => (cur ? { ...cur, paused } : cur))
      toast.success(paused ? 'Agent paused' : 'Agent back on')
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not go through')
    } finally {
      setPausing(false)
    }
  }

  const data = q.data
  const flagged = threads.reduce((n, t) => n + (t.open_flags > 0 ? 1 : 0), 0)

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="size-4 text-muted-foreground" />
            Agent
            {flagged > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--tone-bad-dot)] px-1.5 text-[11px] font-semibold text-white">
                {flagged}
              </span>
            ) : null}
          </CardTitle>
          {data ? (
            <label className="flex items-center gap-2 text-sm">
              <span className={cn(data.paused ? 'text-muted-foreground' : 'text-foreground')}>{data.paused ? 'Paused' : 'On'}</span>
              <Switch checked={!data.paused} disabled={pausing} onCheckedChange={(on: boolean) => togglePause(!on)} aria-label={data.paused ? 'Resume agent' : 'Pause agent'} />
            </label>
          ) : null}
        </div>

        {data ? (
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => {
              const n = data.summary?.[c.key] ?? 0
              return (
                <span
                  key={c.key}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 text-xs dark:bg-white/[0.07]',
                    n === 0 && 'text-muted-foreground',
                  )}
                >
                  <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[c.tone], n === 0 && 'opacity-40')} />
                  <span className="font-semibold tabular-nums">{n}</span>
                  {c.label}
                </span>
              )
            })}
          </div>
        ) : null}

        {data && !data.template_ready ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            WhatsApp template waiting for Meta approval; messages send once approved.
          </p>
        ) : null}
      </CardHeader>

      <CardContent>
        {q.isPending ? (
          <Loading label="Loading the agent" />
        ) : q.isError || !data ? (
          <Failed what="the agent" onRetry={refresh} />
        ) : threads.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">The agent messages creators as soon as they&apos;re approved.</p>
        ) : (
          <div className="-mx-2 max-h-[420px] divide-y divide-black/[0.06] overflow-y-auto dark:divide-white/[0.07]">
            {threads.map((t) => {
              const visit = visitLine(t)
              const tried = triedLine(t.attempts)
              const last = ago(lastActivity(t))
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Avatar thread={t} />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">{displayName(t)}</span>
                      <StatusPill thread={t} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {[visit, tried, last ? `Last ${last}` : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {t.open_flags > 0 ? (
                    <span
                      aria-label={`${t.open_flags} for the team`}
                      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--tone-bad-dot)] px-1.5 text-[11px] font-semibold text-white"
                    >
                      {t.open_flags}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>

      <AgentThreadSheet
        campaignId={campaignId}
        thread={selected}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
        onChanged={refresh}
      />
    </Card>
  )
}
