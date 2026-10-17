'use client'

/**
 * The image pipeline: what is queued, what failed, and how much we are storing.
 *
 * Every creator avatar and post thumbnail in the product is served from our own CDN,
 * because Instagram's `scontent-*` URLs are hotlink-blocked and render as broken images
 * wherever they are used directly. A job that fails here is a creator who appears on a
 * proposal with no face, and the only way anybody ever found out was a client mentioning
 * it — the metrics, the failed-job list, the retry and the cleanup have all existed as
 * endpoints since the CDN shipped and nothing in the product has ever called them.
 *
 * Two things worth knowing about what is on this screen.
 *
 * NOTHING HERE IS A MEASUREMENT OF A CREATOR. These are our own numbers about our own
 * machinery. A failed job says our worker could not fetch an image; it says nothing about
 * the creator whose image it was, and the wording keeps that straight.
 *
 * RETRY IS NOT A FIX. It re-queues a job that already failed once. Where the cause is a
 * dead source URL — Instagram expires them — it will fail again, which the retry count on
 * each row is there to show before somebody presses it for the fourth time.
 */

import { useCallback, useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Brush, HardDrive, Image as ImageIcon, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { PageHead, Stat, StatGrid, type Tone } from '@/components/console/primitives'
import {
  BulkBar, Dash, ReadState, SectionHead, TableShell,
} from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess } from '@/hooks/useAdminAccess'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/cdn`

async function api(path: string, init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

const n = (v: number | null | undefined) =>
  v == null ? null : Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 })

const pct = (v: number | null | undefined) =>
  v == null ? null : `${Number(v).toFixed(v < 10 ? 1 : 0)}%`

const ms = (v: number | null | undefined) => {
  if (v == null) return null
  const x = Number(v)
  return x >= 1000 ? `${(x / 1000).toFixed(1)}s` : `${Math.round(x)}ms`
}

const when = (iso?: string | null) =>
  !iso ? null : new Date(iso).toLocaleString('en-GB',
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

interface FailedJob {
  job_id: string
  asset_id: string
  source_url: string | null
  error_message: string | null
  retry_count: number | null
  source_type: string | null
  source_id: string | null
  media_id: string | null
  created_at: string | null
  failed_at: string | null
}

export default function CdnOpsPage() {
  return (
    <AuthGuard requireAuth>
      <SuperadminLayout>
        <CdnOps />
      </SuperadminLayout>
    </AuthGuard>
  )
}

function CdnOps() {
  const confirm = useConfirm()
  const { isSuperAdmin, loading: accessLoading } = useAdminAccess()

  const [metrics, setMetrics] = useState<any>(null)
  const [jobs, setJobs] = useState<FailedJob[]>([])
  const [metricsFailed, setMetricsFailed] = useState(false)
  const [jobsFailed, setJobsFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setMetricsFailed(false)
    setJobsFailed(false)
    /* The two reads are independent and are allowed to fail independently. A broken
       metrics call must not make the failed-job list look empty, because an empty
       failed-job list is the one thing on this screen somebody would act on. */
    const [m, j] = await Promise.allSettled([
      api('/metrics?hours=24'),
      api('/failed-jobs?limit=100'),
    ])
    if (m.status === 'fulfilled') setMetrics(m.value)
    else { setMetricsFailed(true); setMetrics(null) }
    if (j.status === 'fulfilled') setJobs(j.value?.failed_jobs || [])
    else { setJobsFailed(true); setJobs([]) }
    setLoading(false)
  }, [])

  useEffect(() => { if (isSuperAdmin) load() }, [isSuperAdmin, load])

  /* A tick means nothing once the rows underneath it have been replaced. */
  useEffect(() => { setPicked(new Set()) }, [jobs])

  const retry = async (ids: string[]) => {
    if (!ids.length) return
    const many = ids.length !== 1
    const ok = await confirm({
      kind: 'routine',
      title: many ? `Retry ${ids.length} image jobs?` : 'Retry this image job?',
      body: (
        <>
          Each one is put back in the queue and tried again. Where the cause was an expired
          Instagram URL it will fail again, which is what the retry count on each row is for.
        </>
      ),
      confirmLabel: many ? `Retry ${ids.length}` : 'Retry it',
    })
    if (!ok) return
    setBusy(true)
    try {
      /* The endpoint takes a bare list as the body, and reports per job rather than
         all-or-nothing, so the toast says how many of them actually went back. */
      const res = await api('/retry-failed', { method: 'POST', body: JSON.stringify(ids) })
      const good = Number(res?.successful_retries ?? 0)
      const bad = Number(res?.failed_retries ?? 0)
      if (good) toast.success(`${good} job${good === 1 ? '' : 's'} re-queued`)
      if (bad) {
        toast.error(`${bad} could not be re-queued. They are no longer in a failed state, `
                  + 'or no longer exist.')
      }
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not retry')
    } finally { setBusy(false) }
  }

  const cleanup = async () => {
    const ok = await confirm({
      kind: 'destructive',
      title: 'Clear out the failed job records?',
      body: (
        <>
          Housekeeping on our own queue table. It does not touch a single image, an asset or
          a creator — only the records of jobs that have already failed.
        </>
      ),
      losses: [
        { label: 'Every image already on the CDN is untouched', kept: true },
        { label: 'The failed-job list below is cleared, so the reasons are gone', warn: true },
      ],
      confirmLabel: 'Clear them',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api('/cleanup-jobs', { method: 'POST' })
      toast.success('Cleanup started. The list will thin out as it runs.')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the cleanup')
    } finally { setBusy(false) }
  }

  if (accessLoading) return null

  /* Superadmin only, matching the endpoints, which compare the role directly. Hidden
     rather than refused: a screen of buttons that all answer 403 is worse than no screen. */
  if (!isSuperAdmin) {
    return (
      <div className="space-y-5">
        <PageHead title="Image pipeline" sub="Superadmin only." />
      </div>
    )
  }

  const p = metrics?.processing_metrics
  const st = metrics?.storage_metrics
  const perf = metrics?.performance_metrics

  const successRate = p?.success_rate_24h
  const rateTone: Tone =
    successRate == null ? 'neutral'
      : Number(successRate) >= 95 ? 'good'
      : Number(successRate) >= 80 ? 'warn' : 'bad'

  const chosen = jobs.filter(j => picked.has(j.job_id))

  return (
    <div className="space-y-6">
      <PageHead
        title="Image pipeline"
        sub={
          <>
            Every avatar and thumbnail in the product is served from our own CDN, because
            Instagram blocks hotlinking. A job that fails here is a creator with no face on
            a proposal.
          </>
        }
        action={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading || busy}>
              {loading
                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Re-read
            </Button>
            <Button variant="outline" size="sm" onClick={cleanup} disabled={busy}>
              <Brush className="mr-1.5 h-3.5 w-3.5" />
              Clear failed records
            </Button>
          </>
        }
      />

      <ReadState
        failed={metricsFailed}
        loading={loading}
        empty={!metrics}
        what="the pipeline’s own numbers"
        onRetry={load}
        skeleton={<div className="flex items-center gap-2 py-8 text-ds-caption">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the queue
        </div>}
      >
        <StatGrid>
          <Stat
            label="Waiting in the queue"
            value={n(p?.queue_depth) ?? <Dash reason="unmeasured" what="the queue depth" />}
            icon={ImageIcon}
            hint={`Getting through about ${n(p?.processing_rate_per_hour) ?? '—'} an hour.`}
          />
          <Stat
            label="Succeeded, last 24h"
            value={pct(successRate) ?? <Dash reason="unmeasured" what="the success rate" />}
            tone={rateTone}
            hint={`${n(p?.failed_jobs_24h) ?? '—'} failed in that time.`}
          />
          <Stat
            label="Images stored"
            value={n(st?.completed_assets) ?? <Dash reason="unmeasured" what="the asset count" />}
            icon={HardDrive}
            hint={`${n(st?.total_assets) ?? '—'} known, ${n(st?.storage_used_gb) ?? '—'} GB in ${st?.bucket_name || 'the bucket'}.`}
          />
          <Stat
            label="Time per image"
            value={ms(p?.average_processing_time_ms) ?? <Dash reason="unmeasured" what="the timing" />}
            hint={`Fetch ${ms(perf?.avg_download_time_ms) ?? '—'}, convert ${ms(perf?.avg_processing_time_ms) ?? '—'}, upload ${ms(perf?.avg_upload_time_ms) ?? '—'}.`}
          />
        </StatGrid>
      </ReadState>

      <section className="space-y-3">
        <SectionHead
          title="Jobs that failed"
          count={jobs.length}
          note="Our worker could not fetch or convert the image. It says nothing about the creator."
        />
        <TableShell
          bulk={
            jobs.length > 0 ? (
              <BulkBar
                count={chosen.length}
                summary="Retry puts them back in the queue. An expired source URL will fail again."
                idleHint="Tick rows to retry several at once"
              >
                <Button size="sm" variant="secondary"
                        onClick={() => retry(chosen.map(j => j.job_id))} disabled={busy}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Retry {chosen.length}
                </Button>
              </BulkBar>
            ) : undefined
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={jobs.length > 0 && picked.size === jobs.length}
                    onCheckedChange={(v: boolean | 'indeterminate') =>
                      setPicked(v === true ? new Set(jobs.map(j => j.job_id)) : new Set())}
                    aria-label="Select every failed job"
                  />
                </TableHead>
                <TableHead>What it was for</TableHead>
                <TableHead>Why it failed</TableHead>
                <TableHead className="text-right">Tries</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || jobsFailed || !jobs.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <div className="px-4">
                      <ReadState
                        failed={jobsFailed}
                        loading={loading}
                        empty={!jobs.length}
                        what="the failed jobs"
                        onRetry={load}
                        nothing="Nothing has failed. Every image the pipeline was asked for is on the CDN."
                        skeleton={<div className="py-8" />}
                      >
                        <span />
                      </ReadState>
                    </div>
                  </TableCell>
                </TableRow>
              ) : jobs.map(j => (
                <TableRow key={j.job_id}>
                  <TableCell>
                    <Checkbox
                      checked={picked.has(j.job_id)}
                      onCheckedChange={() => setPicked(prev => {
                        const next = new Set(prev)
                        if (next.has(j.job_id)) next.delete(j.job_id); else next.add(j.job_id)
                        return next
                      })}
                      aria-label={`Select job ${j.job_id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{j.source_type || 'image'}</span>
                    {j.media_id && (
                      <span className="ml-1.5 text-ds-caption text-muted-foreground">
                        {j.media_id}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[46ch]">
                    {j.error_message
                      ? <span className="line-clamp-2 text-ds-caption">{j.error_message}</span>
                      : <Dash reason="unset" what="reason" />}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {/* The number that should stop somebody pressing retry a fourth time. */}
                    {j.retry_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-ds-caption text-muted-foreground">
                    {when(j.failed_at) ?? <Dash reason="unset" what="time" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={busy}
                            onClick={() => retry([j.job_id])}>
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </section>
    </div>
  )
}
