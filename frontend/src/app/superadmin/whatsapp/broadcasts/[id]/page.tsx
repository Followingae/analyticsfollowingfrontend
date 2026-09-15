'use client'

/**
 * One broadcast, in full.
 *
 * WHAT THIS REPLACES. This was a max-w-2xl dialog with the recipient list inside a 256px
 * scroll box. On a 1,308 person broadcast that showed roughly fifteen rows through a letterbox
 * and cut everything else off, which is not a reporting screen, it is a preview of one.
 *
 * A broadcast is the single most expensive thing this console does. It spends real money, it
 * touches thousands of creators at once, and its sender reputation is shared with the number
 * creators receive login codes on. It earns a page.
 *
 * FAILURES ARE THE POINT OF THIS SCREEN. "Unknown error (63049) x45" told an operator that
 * something went wrong and nothing else. The four codes we actually see mean four different
 * things and only one is worth retrying, so each one is named, explained, and labelled with
 * whether sending again would achieve anything.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHead, Panel } from '@/components/console/primitives'
import { toast } from 'sonner'
import { ArrowLeft, Download, RefreshCw, Search } from 'lucide-react'
import {
  whatsappApi,
  type BroadcastAnalytics, type BroadcastRecipient, type WhatsAppBroadcast,
} from '@/services/whatsappApi'
import { describeFailure, RETRY_LABEL, type RetryAdvice } from '@/services/whatsappErrors'
import { cn } from '@/lib/utils'

const RETRY_TONE: Record<RetryAdvice, string> = {
  'worth-it': 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  pointless: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
  never: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
}

const STATUS_TONE: Record<string, string> = {
  delivered: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  read: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  sent: 'bg-[var(--tone-neutral-wash)] text-foreground',
  queued: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  failed: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
  undelivered: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]',
}

export default function BroadcastPage() {
  return (
    <SuperadminLayout>
      <Detail />
    </SuperadminLayout>
  )
}

function Detail() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const [bc, setBc] = useState<WhatsAppBroadcast | null>(null)
  const [a, setA] = useState<BroadcastAnalytics | null>(null)
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [b, an, rc] = await Promise.all([
        whatsappApi.getBroadcast(id),
        whatsappApi.broadcastAnalytics(id),
        whatsappApi.broadcastRecipients(id, statusFilter || undefined, 1000),
      ])
      setBc(b as WhatsAppBroadcast)
      setA(an)
      setRecipients(rc.recipients)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id, statusFilter])

  useEffect(() => { if (id) void load() }, [id, load])

  /* While it is still going out the numbers move, so the page moves with them. Stops on its
     own the moment the broadcast finishes rather than polling a finished thing forever. */
  useEffect(() => {
    if (bc?.status !== 'sending') return
    const t = setInterval(load, 6000)
    return () => clearInterval(t)
  }, [bc?.status, load])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return recipients
    return recipients.filter(r =>
      (r.full_name || '').toLowerCase().includes(needle)
      || (r.instagram_handle || '').toLowerCase().includes(needle)
      || (r.phone || '').includes(needle))
  }, [recipients, q])

  const exportCsv = () => {
    const rows = [
      ['Name', 'Handle', 'Phone', 'Status', 'Problem', 'Retry', 'Code', 'Sent', 'Delivered', 'Read'],
      ...shown.map(r => {
        const f = describeFailure(errCode(r), r.error_message)
        const bad = r.status === 'failed' || r.status === 'undelivered'
        return [
          r.full_name || '', r.instagram_handle || '', `="${r.phone}"`, r.status,
          bad ? f.title : '', bad ? RETRY_LABEL[f.retry] : '', bad ? (errCode(r) || '') : '',
          (r.sent_at || '').slice(0, 19), (r.delivered_at || '').slice(0, 19),
          (r.read_at || '').slice(0, 19),
        ]
      }),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const el = document.createElement('a')
    el.href = url
    el.download = `broadcast-${bc?.name || id}.csv`
    document.body.appendChild(el); el.click(); el.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground"
              onClick={() => router.push('/work/whatsapp')}>
        <ArrowLeft className="size-4" />WhatsApp
      </Button>

      <PageHead
        title={bc?.name || 'Broadcast'}
        sub={
          bc
            ? `${bc.status === 'sending' ? 'Still going out' : 'Finished'} · ${(bc.total_recipients ?? 0).toLocaleString()} recipients`
            : undefined
        }
        action={
          <div className="flex items-center gap-ds-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className={cn('mr-2 h-4 w-4', bc?.status === 'sending' && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={!shown.length}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
          </div>
        }
      />

      {loading && !a ? (
        <div className="space-y-ds-4">
          <Skeleton className="h-28 w-full rounded-ds-lg" />
          <Skeleton className="h-64 w-full rounded-ds-lg" />
        </div>
      ) : a ? (
        <>
          {/* The funnel, with room. Six figures across, wrapping rather than shrinking. */}
          <div className="grid grid-cols-2 gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 lg:grid-cols-6">
            <Fig label="Recipients" value={a.total} />
            <Fig label="Sent" value={a.sent} sub={a.queued > 0 ? `${a.queued.toLocaleString()} still queued` : undefined} />
            <Fig label="Delivered" value={a.delivered} sub={`${a.delivery_rate}% of sent`} tone="good" />
            <Fig label="Read" value={a.read} sub={`${a.read_rate}% of delivered`} tone="info" />
            <Fig label="Failed" value={a.failed} sub={`${a.fail_rate}% of all`} tone="bad" />
            <Fig label="Queued" value={a.queued} />
          </div>

          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-ds-full bg-black/[0.07] dark:bg-white/10">
              <Seg n={a.read} total={a.total} color="var(--tone-info-dot)" />
              <Seg n={a.delivered - a.read} total={a.total} color="var(--tone-good-dot)" />
              <Seg n={a.sent - a.delivered} total={a.total} color="var(--console-lime)" />
              <Seg n={a.failed} total={a.total} color="var(--tone-bad-dot)" />
              <Seg n={a.queued} total={a.total} color="var(--tone-neutral-dot)" />
            </div>
            <div className="mt-ds-2 flex flex-wrap gap-ds-3 text-ds-overline text-muted-foreground">
              <Key color="var(--tone-info-dot)" label="Read" />
              <Key color="var(--tone-good-dot)" label="Delivered" />
              <Key color="var(--console-lime)" label="Sent" />
              <Key color="var(--tone-bad-dot)" label="Failed" />
              <Key color="var(--tone-neutral-dot)" label="Queued" />
            </div>
          </div>

          {a.failures.length > 0 && (
            <Panel
              title="Why messages failed"
              description="Four codes mean four different things. Only one of them is worth sending again."
            >
              <div className="space-y-ds-3">
                {a.failures.map((f, i) => {
                  const d = describeFailure(f.error_code, f.reason)
                  return (
                    <div key={i} className="flex flex-wrap items-start justify-between gap-4 border-b border-black/[0.06] pb-ds-3 last:border-0 last:pb-0 dark:border-white/[0.07]">
                      <div className="min-w-0 max-w-[62ch]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-ds-label font-semibold">{d.title}</span>
                          <Badge variant="secondary" className={cn('border-0 text-[10.5px]', RETRY_TONE[d.retry])}>
                            {RETRY_LABEL[d.retry]}
                          </Badge>
                          {f.error_code && (
                            <span className="font-mono text-[11px] text-muted-foreground">{f.error_code}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-ds-body-sm leading-relaxed text-muted-foreground">
                          {d.detail}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.025em]">
                          {f.n.toLocaleString()}
                        </div>
                        <div className="mt-1 text-ds-overline text-muted-foreground">messages</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}

          <Panel
            title={`Recipients (${shown.length.toLocaleString()})`}
            description="Everyone this went to, and what happened to each of them."
            flush
            action={
              <div className="flex items-center gap-ds-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="h-8 w-[220px] pl-8 text-[13px]" placeholder="Name, handle or number"
                         value={q} onChange={e => setQ(e.target.value)} />
                </div>
                <Select value={statusFilter || 'all'}
                        onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            <div className="max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="pl-6">Creator</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6">What happened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-ds-body-sm text-muted-foreground">
                      {q || statusFilter ? 'Nobody matches these filters.' : 'No recipients.'}
                    </TableCell></TableRow>
                  )}
                  {shown.map(r => {
                    const bad = r.status === 'failed' || r.status === 'undelivered'
                    const d = describeFailure(errCode(r), r.error_message)
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="pl-6">
                          <div className="text-[13.5px] font-medium">{r.full_name || '—'}</div>
                          {r.instagram_handle && (
                            <div className="text-[11.5px] text-muted-foreground">@{r.instagram_handle}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[12px]">{r.phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary"
                                 className={cn('border-0 text-[11px]', STATUS_TONE[r.status] || '')}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6">
                          {bad ? (
                            <div className="max-w-[46ch]">
                              <span className="text-[12.5px] font-medium">{d.title}</span>
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                {RETRY_LABEL[d.retry]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-muted-foreground">
                              {r.read_at ? 'Read' : r.delivered_at ? 'Delivered' : r.sent_at ? 'Sent' : 'Waiting'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </>
      ) : (
        <p className="text-ds-body text-muted-foreground">
          This broadcast did not load. That is a failed request, not an empty broadcast.
        </p>
      )}
    </div>
  )
}

/** The recipients endpoint returns a message, not a code, so pull the code out of it. */
function errCode(r: BroadcastRecipient): string | null {
  const anyR = r as unknown as { error_code?: string | null }
  if (anyR.error_code) return String(anyR.error_code)
  const m = (r.error_message || '').match(/\b(6\d{4}|2\d{4})\b/)
  return m ? m[1] : null
}

function Fig({ label, value, sub, tone }: {
  label: string; value: number; sub?: string; tone?: 'good' | 'info' | 'bad'
}) {
  const ink = tone === 'good' ? 'text-[var(--tone-good-ink)]'
    : tone === 'info' ? 'text-[var(--tone-info-ink)]'
    : tone === 'bad' ? 'text-[var(--tone-bad-ink)]' : ''
  return (
    <div>
      <p className={cn('text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums', ink)}>
        {value.toLocaleString()}
      </p>
      <p className="mt-ds-2 text-ds-caption font-medium">{label}</p>
      {sub && <p className="text-ds-overline text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Seg({ n, total, color }: { n: number; total: number; color: string }) {
  if (total <= 0 || n <= 0) return null
  return <div style={{ width: `${(n / total) * 100}%`, backgroundColor: color }} className="h-full" />
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-ds-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}
    </span>
  )
}
