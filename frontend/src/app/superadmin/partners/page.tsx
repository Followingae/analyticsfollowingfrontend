'use client'

/**
 * Partner leads: everyone who applied through a marketing landing page.
 *
 * WHAT THIS REPLACES. The RFM terminal offer ran from August and stored nothing. Every
 * application rendered a notification email and ended, so the pipeline lived in an inbox:
 * seventy-five businesses that could not be sorted, counted, assigned, or answered "where are
 * we with this one" about. Seventy-three were recovered from Resend's sent mail. This is the
 * screen that makes them workable, and the capture endpoint means new ones arrive here.
 *
 * WHY THE STATUS CHIPS COUNT EVERYTHING. The counts come from all leads, never the filtered
 * set: a chip reading "Contacted 12" has to say twelve whether or not you are currently
 * looking at those twelve. A chip whose number changes when you click it is a chip you cannot
 * use to decide what to click.
 *
 * Density tier: OPERATING. This is a worklist. Rows are scanned and acted on, so the table is
 * the page and everything else gets out of its way.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { DataTable, DataTableColumnHeader } from '@/components/ui2/data-table'
import { Panel } from '@/components/console/primitives'
import { ClientsHubHeader } from '@/components/console/ClientsHubHeader'
import { toast } from 'sonner'
import {
  Download, Mail, Paperclip, Phone, RefreshCw, Globe, ExternalLink, Send, Check, AlertCircle, Loader2, FileText,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  partnerLeadsApi, LEAD_STATUSES, STATUS_LABEL,
  type PartnerLead, type LeadStatus, type PartnerLeadsPayload,
} from '@/services/partnerLeadsApi'
import { cn } from '@/lib/utils'

/* The hand-off to RFM, read from the row. Since 9 Nov 2026 a lead goes to the RFM platform
   the moment it arrives instead of to an inbox; this is the log of whether it did. Leads
   from before that date were worked by hand and say so rather than reading as failures. */
const RFM_FROM = '2026-11-09'
const RFM_OK = new Set(['queued', 'duplicate', 'opted_out', 'ok'])

function rfmState(l: PartnerLead): { kind: 'sent' | 'failed' | 'waiting' | 'before' | 'no_consent'; text: string; detail?: string } {
  if (l.rfm_sent_at) {
    return {
      kind: 'sent',
      text: `Sent ${shortTime(l.rfm_sent_at)}`,
      detail: l.rfm_status === 'duplicate' ? 'RFM already had this number'
        : l.rfm_status === 'opted_out' ? 'This person asked RFM not to call'
        : l.rfm_contact_id ? `RFM contact ${l.rfm_contact_id.slice(0, 8)}` : undefined,
    }
  }
  if ((l.created_at || '') < RFM_FROM) return { kind: 'before', text: 'Worked by hand' }
  if (!l.consent_at) return { kind: 'no_consent', text: 'No consent given', detail: 'The applicant did not tick the consent line, so RFM is not sent this lead.' }
  if (l.rfm_status && !RFM_OK.has(l.rfm_status)) {
    return { kind: 'failed', text: l.rfm_status === 'rejected' ? 'RFM refused it' : l.rfm_status === 'not_configured' ? 'Key not set' : 'Not through yet',
             detail: l.rfm_error || undefined }
  }
  return { kind: 'waiting', text: 'Sending' }
}

const shortTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

function RfmCell({ l, onSend, busy }: { l: PartnerLead; onSend?: () => void; busy?: boolean }) {
  const st = rfmState(l)
  const Icon = st.kind === 'sent' ? Check : st.kind === 'failed' ? AlertCircle : st.kind === 'waiting' ? Loader2 : null
  return (
    <div className="flex items-center gap-2">
      <span
        title={st.detail}
        className={cn('inline-flex items-center gap-1 text-[12.5px]',
          st.kind === 'sent' ? 'text-[var(--tone-good-ink)]'
          : st.kind === 'failed' ? 'text-[var(--tone-warn-ink)]'
          : 'text-muted-foreground')}
      >
        {Icon && <Icon className={cn('size-3.5', st.kind === 'waiting' && 'animate-spin')} aria-hidden />}
        {st.text}
      </span>
      {onSend && (st.kind === 'failed' || st.kind === 'waiting') && (
        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[12px]" disabled={busy} onClick={onSend} title="Send to RFM now">
          <Send className="size-3" aria-hidden />
        </Button>
      )}
    </div>
  )
}

/* Status colour carries the same meaning it does everywhere else in the console: warm for
   "needs somebody", good for won, muted for closed. Lost is deliberately quiet rather than
   red — a lost lead is a finished job, not an alarm. */
const TONE: Record<LeadStatus, string> = {
  new: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  contacted: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  applied: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  approved: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  live: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  lost: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'

export default function PartnerLeadsPage() {
  return (
    <SuperadminLayout>
      <Leads />
    </SuperadminLayout>
  )
}

function Leads() {
  const [payload, setPayload] = useState<PartnerLeadsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  /* A failed read used to be indistinguishable from a genuinely empty pipeline, which tells
     somebody with seventy-three leads that nobody has ever applied. */
  const [failure, setFailure] = useState<string | null>(null)

  const [status, setStatus] = useState<string>('all')
  const [campaign, setCampaign] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<PartnerLead | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await partnerLeadsApi.list({ status, campaign, search })
      setPayload(r.data)
      setFailure(null)
    } catch (e) {
      setPayload(null)
      setFailure((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [status, campaign, search])

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  /* A lead arrives while somebody is looking at this screen, and until now the screen had
     no way of knowing. It reloads itself every half minute, and again the moment the tab is
     brought back to the front, so an application that came in two minutes ago is on the
     list without anybody thinking to press Refresh.

     Silently: no spinner and no skeleton, because the table is already full and a reload
     that blanks it is worse than a reload nobody noticed. Paused while the tab is hidden,
     so a window left open overnight is not polling until morning. */
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load() }
    const id = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [load])

  /* Patch the row in place rather than refetching the list. Marking eight leads contacted
     should not mean eight full-table reloads, and a table that jumps back to the top after
     every change loses your place in the list you were working down. */
  const patch = useCallback(async (
    id: string,
    body: Parameters<typeof partnerLeadsApi.update>[1],
    say?: string,
  ) => {
    try {
      const r = await partnerLeadsApi.update(id, body)
      setPayload(p => p && ({
        ...p,
        leads: p.leads.map(l => (l.id === id ? r.data : l)),
        // The chips are counts of everything, so they have to move with the change even
        // though the row did not leave the list.
        counts: recount(p, id, r.data.status),
      }))
      setOpen(o => (o && o.id === id ? r.data : o))
      if (say) toast.success(say)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  const [sendingId, setSendingId] = useState<string | null>(null)
  const sendToRfm = useCallback(async (l: PartnerLead) => {
    setSendingId(l.id)
    try {
      const r = await partnerLeadsApi.sendToRfm(l.id)
      setPayload(p => p && ({ ...p, leads: p.leads.map(x => (x.id === l.id ? r.data : x)) }))
      setOpen(o => (o && o.id === l.id ? r.data : o))
      if (r.rfm.ok) toast.success(`${l.business_name || 'Lead'} is with RFM`, { description: r.rfm.status })
      else toast.error(`RFM did not take ${l.business_name || 'the lead'}`, { description: r.rfm.error || r.rfm.status })
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setSendingId(null) }
  }, [])

  const openLicence = useCallback(async (l: PartnerLead) => {
    try {
      const r = await partnerLeadsApi.licenceUrl(l.id)
      window.open(r.data.url, '_blank', 'noopener')
    } catch (e) { toast.error((e as Error).message) }
  }, [])

  const columns = useMemo<ColumnDef<PartnerLead>[]>(() => [
    {
      accessorKey: 'business_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Business" />,
      cell: ({ row }) => {
        const l = row.original
        return (
          <button
            type="button"
            onClick={() => setOpen(l)}
            className="text-left focus-visible:outline-none focus-visible:underline"
          >
            <div className="font-medium tracking-[-0.01em]">{l.business_name || '—'}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              {l.business_type || 'Type not given'}
              {l.has_licence ? (
                <span title="Trade licence on file" className="inline-flex items-center gap-0.5">
                  <FileText className="size-3" aria-hidden />licence
                </span>
              ) : l.has_licence_in_email && (
                <span title="A trade licence was attached to the application email"
                      className="inline-flex items-center gap-0.5">
                  <Paperclip className="size-3" aria-hidden />licence
                </span>
              )}
            </div>
          </button>
        )
      },
    },
    {
      accessorKey: 'contact_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
      cell: ({ row }) => {
        const l = row.original
        return (
          <div>
            <div className="text-[13.5px]">{l.contact_name || '—'}</div>
            {/* Tappable, because the next action on most of these rows is to ring them. */}
            <div className="mt-0.5 flex items-center gap-2.5 text-[12px] text-muted-foreground">
              {l.phone && (
                <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Phone className="size-3" aria-hidden />{l.phone}
                </a>
              )}
              {l.email && (
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Mail className="size-3" aria-hidden />
                  <span className="max-w-[150px] truncate">{l.email}</span>
                </a>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'turnover_aed',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Monthly turnover" />,
      cell: ({ row }) => (
        <span className="text-[13px] tabular-nums">{row.original.turnover_aed || '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const l = row.original
        /* Editable in the row. The whole reason this screen exists is so somebody can work
           down a list marking people contacted; making them open each one to do it would
           rebuild the inbox this replaces. */
        return (
          <Select value={l.status} onValueChange={v => patch(l.id, { status: v as LeadStatus },
            `${l.business_name || 'Lead'} marked ${STATUS_LABEL[v as LeadStatus].toLowerCase()}`)}>
            <SelectTrigger className={cn('h-7 w-[120px] border-0 text-[12px] font-medium', TONE[l.status])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      accessorKey: 'rfm_sent_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="To RFM" />,
      cell: ({ row }) => (
        <RfmCell l={row.original} busy={sendingId === row.original.id} onSend={() => sendToRfm(row.original)} />
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applied" />,
      cell: ({ row }) => (
        <span className="text-[12.5px] text-muted-foreground">{shortDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'open',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-7 px-2"
                onClick={() => setOpen(row.original)}>
          Open
        </Button>
      ),
    },
  ], [patch, sendToRfm, sendingId])

  const leads = payload?.leads ?? []

  return (
    <div className="mx-auto w-full max-w-7xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <ClientsHubHeader
        note="Merchants who applied through a landing page. Everything that came in, who has it, and where it got to."
        action={
          <div className="flex items-center gap-ds-2">
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await partnerLeadsApi.exportCsv({ status, campaign, search })
                  toast.success('Exported')
                } catch (e) { toast.error((e as Error).message) }
              }}
            >
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
          </div>
        }
      />

      {failure && (
        <div className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-semibold text-destructive">The leads did not load</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            This is not an empty pipeline, it is a failed request. {failure}
          </p>
        </div>
      )}

      {/* The ladder, as filter chips. Counts are of everything, always. */}
      {payload && (
        <div className="flex flex-wrap items-center gap-ds-2">
          <Chip label="All" n={payload.total} on={status === 'all'} onClick={() => setStatus('all')} />
          {LEAD_STATUSES.map(s => (
            <Chip
              key={s}
              label={STATUS_LABEL[s]}
              n={payload.counts[s] ?? 0}
              on={status === s}
              onClick={() => setStatus(status === s ? 'all' : s)}
              tone={TONE[s]}
            />
          ))}
        </div>
      )}

      <Panel
        title={payload ? `${leads.length.toLocaleString()} shown` : 'Leads'}
        description="Change a status in the row. Open a lead for the full application and to leave a note."
        flush
        action={
          payload && payload.campaigns.length > 1 ? (
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger className="h-8 w-[200px] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every campaign</SelectItem>
                {payload.campaigns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : undefined
        }
      >
        <div className="px-6 pb-4">
          {loading && !payload ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2, 3, 4].map(n => <Skeleton key={n} className="h-12 w-full rounded-ds-lg" />)}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={leads}
              filterColumn="business_name"
              filterPlaceholder="Search business, contact, email or phone"
              emptyState={
                failure
                  ? 'The list did not load.'
                  : search || status !== 'all' || campaign !== 'all'
                    ? 'No lead matches these filters.'
                    : 'Nothing has come in through a landing page yet.'
              }
            />
          )}
        </div>
      </Panel>

      <LeadSheet
        lead={open}
        onClose={() => setOpen(null)}
        onPatch={patch}
        onSendToRfm={sendToRfm}
        onOpenLicence={openLicence}
        sending={!!open && sendingId === open.id}
      />
    </div>
  )
}

/** Recompute the chip counts after one row moved, without refetching. */
function recount(p: PartnerLeadsPayload, id: string, to: LeadStatus) {
  const from = p.leads.find(l => l.id === id)?.status
  if (!from || from === to) return p.counts
  return { ...p.counts, [from]: Math.max((p.counts[from] ?? 0) - 1, 0), [to]: (p.counts[to] ?? 0) + 1 }
}

function Chip({ label, n, on, onClick, tone }: {
  label: string; n: number; on: boolean; onClick: () => void; tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'inline-flex items-center gap-2 rounded-ds-full px-3 py-1.5 text-[13px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        on ? 'bg-foreground text-background'
           : tone || 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
      )}
    >
      {label}
      <span className="tabular-nums opacity-70">{n.toLocaleString()}</span>
    </button>
  )
}

/**
 * One application in full, and the two things somebody does about it: move it along, and
 * write down what happened. The note is the part the inbox could never hold.
 */
function LeadSheet({ lead, onClose, onPatch, onSendToRfm, onOpenLicence, sending }: {
  lead: PartnerLead | null
  onClose: () => void
  onPatch: (id: string, body: Parameters<typeof partnerLeadsApi.update>[1], say?: string) => Promise<void>
  onSendToRfm: (l: PartnerLead) => Promise<void>
  onOpenLicence: (l: PartnerLead) => Promise<void>
  sending: boolean
}) {
  const [note, setNote] = useState('')
  const [lost, setLost] = useState('')

  useEffect(() => {
    setNote(lead?.status_note ?? '')
    setLost(lead?.lost_reason ?? '')
  }, [lead?.id, lead?.status_note, lead?.lost_reason])

  if (!lead) return null

  return (
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="pr-6">{lead.business_name || 'Application'}</SheetTitle>
          <SheetDescription>
            {lead.business_type || 'Type not given'}
            {lead.campaign ? ` · ${lead.campaign}` : ''}
            {lead.created_at ? ` · applied ${shortDate(lead.created_at)}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-ds-4 px-4 pb-8">
          <section className="space-y-2">
            <Row label="Contact" value={lead.contact_name} />
            <Row
              label="Phone"
              value={lead.phone
                ? <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                : null}
            />
            <Row
              label="Email"
              value={lead.email
                ? <a href={`mailto:${lead.email}`} className="break-all hover:underline">{lead.email}</a>
                : null}
            />
            <Row label="Monthly turnover" value={lead.turnover_aed} />
            <Row
              label="Website"
              value={lead.website
                ? <a href={lead.website} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 break-all hover:underline">
                    <Globe className="size-3 shrink-0" aria-hidden />{lead.website}
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                : null}
            />
            {lead.needs.length > 0 && (
              <Row
                label="What they want"
                value={
                  <div className="flex flex-wrap gap-1">
                    {lead.needs.map(n => (
                      <Badge key={n} variant="secondary" className="text-[11px]">{n}</Badge>
                    ))}
                  </div>
                }
              />
            )}
          </section>

          {/* The hand-off to RFM: when it went, what RFM said, and the one button for when it
              did not. Older leads were worked by hand and say so. */}
          <section className="rounded-ds-lg border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium">RFM platform</p>
              <RfmCell l={lead} />
            </div>
            {(() => {
              const st = rfmState(lead)
              return (
                <>
                  {st.detail && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{st.detail}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                    {lead.consent_at && <span>Consented {shortTime(lead.consent_at)}</span>}
                    {lead.rfm_attempts > 0 && !lead.rfm_sent_at && <span>{lead.rfm_attempts} {lead.rfm_attempts === 1 ? 'attempt' : 'attempts'}</span>}
                  </div>
                  {(st.kind === 'failed' || st.kind === 'waiting' || (st.kind === 'sent' && lead.rfm_status === 'duplicate')) && lead.consent_at && (
                    <Button size="sm" variant="outline" className="mt-3 h-8" disabled={sending} onClick={() => onSendToRfm(lead)}>
                      {sending ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden /> : <Send className="mr-2 size-3.5" aria-hidden />}
                      Send to RFM now
                    </Button>
                  )}
                </>
              )
            })()}
          </section>

          {lead.has_licence && (
            <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenLicence(lead)}>
              <FileText className="mr-2 size-3.5" aria-hidden />
              Open trade licence{lead.licence_filename ? ` · ${lead.licence_filename}` : ''}
            </Button>
          )}

          {/* The one thing the recovery could not bring back, said plainly rather than left
              as a silent blank that reads as "they never sent one". */}
          {!lead.has_licence && lead.has_licence_in_email && (
            <div className="rounded-ds-lg bg-[var(--tone-warn-wash)] px-4 py-3">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--tone-warn-ink)]">
                <Paperclip className="size-3.5" aria-hidden />Trade licence attached to the email
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                {lead.licence_filename ? `"${lead.licence_filename}". ` : ''}
                Attachments were not recoverable when these applications were rebuilt, so the
                file is in the partnerships inbox rather than here.
              </p>
            </div>
          )}

          <section className="space-y-2">
            <Label className="text-[13px] font-medium">Where it has got to</Label>
            <Select
              value={lead.status}
              onValueChange={v => onPatch(lead.id, { status: v as LeadStatus },
                `Marked ${STATUS_LABEL[v as LeadStatus].toLowerCase()}`)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              {lead.contacted_at && <span>Contacted {shortDate(lead.contacted_at)}</span>}
              {lead.approved_at && <span>Approved {shortDate(lead.approved_at)}</span>}
              {lead.lost_at && <span>Lost {shortDate(lead.lost_at)}</span>}
            </div>
          </section>

          {lead.status === 'lost' && (
            <section className="space-y-2">
              <Label className="text-[13px] font-medium">Why it was lost</Label>
              <Input
                value={lost}
                onChange={e => setLost(e.target.value)}
                onBlur={() => lost !== (lead.lost_reason ?? '')
                  && onPatch(lead.id, { lost_reason: lost })}
                placeholder="Went with someone else, too small, no answer"
              />
            </section>
          )}

          <section className="space-y-2">
            <Label className="text-[13px] font-medium">Notes</Label>
            <Textarea
              rows={4}
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => note !== (lead.status_note ?? '')
                && onPatch(lead.id, { status_note: note }, 'Note saved')}
              placeholder="What was said, what they asked for, when to chase."
            />
            <p className="text-[11.5px] text-muted-foreground">Saved when you click away.</p>
          </section>

          {Object.keys(lead.utm).length > 0 && (
            <section className="space-y-2 border-t pt-4">
              <Label className="text-[12px] font-medium text-muted-foreground">
                Which ad brought them
              </Label>
              <div className="space-y-1 text-[12px] text-muted-foreground">
                {Object.entries(lead.utm).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="font-mono">{k}</span>
                    <span className="truncate text-right text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** A label/value pair. Absent values are a dash, never a blank line. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13.5px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  )
}
