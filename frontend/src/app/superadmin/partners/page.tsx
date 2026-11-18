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
 * ONE PLACE (founder, 18 Nov 2026). Clicking a row opens LeadPanel: the lead, the merchant it
 * became, its stage and log, the campaign waiting for a yes (approve it from here), its quote
 * requests and the note. Every row wears the merchant's stage chip. Under the leads, a second
 * table lists merchants that were onboarded without a lead; their rows open the same panel.
 *
 * Density tier: OPERATING. This is a worklist. Rows are scanned and acted on, so the table is
 * the page and everything else gets out of its way.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable, DataTableColumnHeader } from '@/components/ui2/data-table'
import { Panel } from '@/components/console/primitives'
import { ClientsHubHeader } from '@/components/console/ClientsHubHeader'
import { toast } from 'sonner'
import {
  Download, Mail, Paperclip, Phone, RefreshCw, Check, FileText, Store,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  partnerLeadsApi, LEAD_STATUSES, STATUS_LABEL,
  type PartnerLead, type LeadStatus, type PartnerLeadsPayload,
} from '@/services/partnerLeadsApi'
import { merchantAdminApi, type MerchantApiError, type OnboardedMerchant } from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'
import { OnboardMerchantDialog } from '@/components/superadmin/merchants/OnboardMerchantDialog'
import { StageChip, neverSignedIn, stageAt } from '@/components/superadmin/merchants/StageChip'
import { ago } from '@/components/superadmin/merchants/MerchantTimeline'
import { RfmCell } from '@/components/superadmin/partners/rfm'
import { LeadPanel, type LeadPanelTarget } from '@/components/superadmin/partners/LeadPanel'

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
  /* What the panel is open on: a lead, or a merchant that has no lead. */
  const [target, setTarget] = useState<LeadPanelTarget>(null)
  /* Merchants onboarded without a lead: the second table. null until read, [] when none or
     when the server does not know the flag yet. */
  const [orphans, setOrphans] = useState<OnboardedMerchant[] | null>(null)

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

  const loadOrphans = useCallback(async () => {
    try {
      const rows = await merchantAdminApi.listOnboarded({ withoutLead: true })
      setOrphans(rows.filter(m => m.has_lead === false))
    } catch (e) {
      const err = e as MerchantApiError
      if (err.status !== 404) toast.error(err.message || 'The merchants without a lead did not load')
      setOrphans([])
    }
  }, [])
  useEffect(() => { loadOrphans() }, [loadOrphans])

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
      if (say) toast.success(say)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  /* Putting a lead on the platform. RFM has signed them; this creates their account and
     sends the welcome. The lead record has no field for it yet, so the rows that went
     through in this sitting are remembered here and read "On the platform". */
  const [onboardLead, setOnboardLead] = useState<PartnerLead | null>(null)
  const [onPlatform, setOnPlatform] = useState<Set<string>>(() => new Set())

  const [sendingId, setSendingId] = useState<string | null>(null)
  const sendToRfm = useCallback(async (l: PartnerLead) => {
    setSendingId(l.id)
    try {
      const r = await partnerLeadsApi.sendToRfm(l.id)
      setPayload(p => p && ({ ...p, leads: p.leads.map(x => (x.id === l.id ? r.data : x)) }))
      if (r.rfm.ok) toast.success(`${l.business_name || 'Lead'} is with RFM`, { description: r.rfm.status })
      else toast.error(`RFM did not take ${l.business_name || 'the lead'}`, { description: r.rfm.error || r.rfm.status })
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setSendingId(null) }
  }, [])

  /* The panel patched a row (status, note, RFM): mirror it in the table without a reload. */
  const rowPatched = useCallback((lead: PartnerLead) => {
    setPayload(p => p && ({
      ...p,
      leads: p.leads.map(l => (l.id === lead.id ? { ...l, ...lead } : l)),
      counts: recount(p, lead.id, lead.status),
    }))
  }, [])

  /* Something happened on the server that changes a row's chip (an onboarding, a campaign
     decision): re-read both lists quietly. */
  const changed = useCallback(() => { load(); loadOrphans() }, [load, loadOrphans])

  const columns = useMemo<ColumnDef<PartnerLead>[]>(() => [
    {
      accessorKey: 'business_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Business" />,
      cell: ({ row }) => {
        const l = row.original
        return (
          <div className="text-left">
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
          </div>
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
                <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-foreground" data-no-row-click>
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
          <Select value={l.status} onValueChange={(v: string) => patch(l.id, { status: v as LeadStatus },
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
      accessorKey: 'stage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="On the platform" />,
      cell: ({ row }) => {
        const l = row.original
        if (!l.merchant_id) {
          return <span className="text-[12px] text-muted-foreground">{onPlatform.has(l.id) ? 'Just onboarded' : 'Not yet'}</span>
        }
        return (
          <div className="inline-flex flex-col items-start gap-0.5">
            {l.stage ? <StageChip stage={l.stage} /> : <span className="text-[12px] text-muted-foreground">Merchant, no programme</span>}
            {l.stage && neverSignedIn(l.stage) && <span className="text-[11.5px] text-[var(--tone-warn-ink)]">Not signed in</span>}
          </div>
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
      cell: ({ row }) => {
        const l = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            {l.merchant_id || onPlatform.has(l.id) ? (
              <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-good-wash)] px-2 py-0.5 text-[12px] font-medium text-[var(--tone-good-ink)]">
                <Check className="size-3" aria-hidden />On the platform
              </span>
            ) : l.status !== 'lost' && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[12.5px]"
                      onClick={() => setOnboardLead(l)} title="Create their merchant account and send the welcome">
                Onboard to trial
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2"
                    onClick={() => setTarget({ lead_id: l.id })}>
              Open
            </Button>
          </div>
        )
      },
    },
  ], [patch, sendToRfm, sendingId, onPlatform])

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
        description="Change a status in the row. Click a lead for everything about it: the application, the merchant it became, its campaign and quotes."
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
              onRowClick={l => setTarget({ lead_id: l.id })}
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

      {/* Merchants that were onboarded without a lead: the ones the leads table cannot show.
          Same panel, opened on the merchant. Hidden when there are none. */}
      {orphans && orphans.length > 0 && (
        <Panel
          title={`${orphans.length} ${orphans.length === 1 ? 'merchant' : 'merchants'} without a lead`}
          description="Onboarded straight from the merchants screen, so no application sits behind them. Click one for everything about it."
          flush
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b text-[12px] font-medium text-muted-foreground">
                  <th className="px-6 py-2.5">Business</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Where they are</th>
                  <th className="px-3 py-2.5">Campaign</th>
                  <th className="px-6 py-2.5">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {orphans.map(m => {
                  const at = stageAt(m.stage, m.log, { last_login: m.last_login, campaign_submitted_at: m.campaign?.submitted_at })
                  return (
                    <tr
                      key={m.merchant_id}
                      tabIndex={0}
                      onClick={() => setTarget({ merchant_id: m.merchant_id })}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTarget({ merchant_id: m.merchant_id }) } }}
                      className="cursor-pointer border-b last:border-0 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {m.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.logo_url} alt="" className="size-8 shrink-0 rounded-ds-md border bg-background object-contain p-0.5" />
                          ) : (
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-ds-md border bg-muted text-muted-foreground">
                              <Store className="size-3.5" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium">{m.business_name}</div>
                            <div className="truncate text-[12px] text-muted-foreground">{m.category || 'No category'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[13.5px]">{m.contact_name || <span className="text-muted-foreground">No name</span>}</div>
                        <div className="mt-0.5 flex items-center gap-2.5 text-[12px] text-muted-foreground">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-foreground" data-no-row-click>
                              <Mail className="size-3" aria-hidden /><span className="max-w-[180px] truncate">{m.email}</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <StageChip stage={m.stage} />
                          <span className={cn('text-[11.5px]', neverSignedIn(m.stage) ? 'text-[var(--tone-warn-ink)]' : 'text-muted-foreground')}>
                            {at ? ago(at) : (neverSignedIn(m.stage) ? 'Never signed in' : '')}
                            {neverSignedIn(m.stage) && at ? ', not signed in' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-muted-foreground">
                        {m.campaign ? m.campaign.name : 'No campaign'}
                      </td>
                      <td className="px-6 py-3 text-[12.5px] text-muted-foreground">{shortDate(m.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <LeadPanel
        target={target}
        onClose={() => setTarget(null)}
        onLeadPatched={rowPatched}
        onChanged={changed}
      />

      <OnboardMerchantDialog
        open={!!onboardLead}
        onOpenChange={(o: boolean) => { if (!o) setOnboardLead(null) }}
        prefill={onboardLead ? {
          partner_lead_id: onboardLead.id,
          business_name: onboardLead.business_name,
          contact_name: onboardLead.contact_name,
          email: onboardLead.email,
          phone: onboardLead.phone,
          business_type: onboardLead.business_type,
        } : null}
        onCreated={() => {
          if (onboardLead) setOnPlatform(s => new Set(s).add(onboardLead.id))
          changed()
        }}
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
