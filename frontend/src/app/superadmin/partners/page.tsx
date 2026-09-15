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
import { PageHead, Panel } from '@/components/console/primitives'
import { toast } from 'sonner'
import {
  Download, Mail, Paperclip, Phone, RefreshCw, Globe, ExternalLink,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  partnerLeadsApi, LEAD_STATUSES, STATUS_LABEL,
  type PartnerLead, type LeadStatus, type PartnerLeadsPayload,
} from '@/services/partnerLeadsApi'
import { cn } from '@/lib/utils'

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
              {l.has_licence_in_email && (
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
  ], [patch])

  const leads = payload?.leads ?? []

  return (
    <div className="mx-auto w-full max-w-7xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <PageHead
        title="Partner leads"
        sub="Merchants who applied through a landing page. Everything that came in, who has it, and where it got to."
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
function LeadSheet({ lead, onClose, onPatch }: {
  lead: PartnerLead | null
  onClose: () => void
  onPatch: (id: string, body: Parameters<typeof partnerLeadsApi.update>[1], say?: string) => Promise<void>
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

          {/* The one thing the recovery could not bring back, said plainly rather than left
              as a silent blank that reads as "they never sent one". */}
          {lead.has_licence_in_email && (
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
