'use client'

/**
 * One partner lead, and the merchant it became, in one place.
 *
 * WHY (founder, 18 Nov 2026). "SO MANY DIFFERENT SCREENS. Why can I not just click on them on
 * Partner Leads and see everything pertaining to them." A lead that was onboarded was spread
 * over five screens: the lead row here, the merchants list for the stage and the log, the
 * approvals queue for the campaign, the quotes table, and the onboarding dialog. Clicking a
 * row now opens this panel, which reads all of it in one request
 * (GET /admin/partner-leads/{id}/full, or /admin/merchants/{id}/full for a merchant that no
 * lead points at) and lets the person act from here: onboard, resend the welcome, send the
 * reminder, approve or send back the campaign, move a quote along, leave a note.
 *
 * Sections, top to bottom, each a quiet card, each skipped when it has nothing to say:
 * header (who, where they are, how to reach them, RFM), Onboarding (the log and its buttons),
 * Trial (month x of 3, five pills), Campaign (the same card as the approvals queue, with
 * Approve and Needs a change working), Quotes, Lead details (what they told us, the note).
 *
 * The actions stay on their own endpoints. The panel updates what it shows the moment a call
 * succeeds, then re-reads the full view so the next thing it says is the server's.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell, ChevronDown, Copy, ExternalLink, FileText, Globe, Loader2, Mail, Paperclip, Phone, RefreshCw, Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { MerchantCampaignCard, campaignStatusChip } from '@/components/console/MerchantCampaignCard'
import { OnboardMerchantDialog } from '@/components/superadmin/merchants/OnboardMerchantDialog'
import { StageChip, neverSignedIn, stageAt } from '@/components/superadmin/merchants/StageChip'
import { MerchantTimeline, ago, fullDate, timelineItems } from '@/components/superadmin/merchants/MerchantTimeline'
import { TrialMeter } from '@/components/superadmin/merchants/TrialMeter'
import { RfmCell, canSendToRfm, rfmState, shortTime } from '@/components/superadmin/partners/rfm'
import {
  partnerLeadsApi, LEAD_STATUSES, STATUS_LABEL,
  type LeadFullView, type LeadStatus, type PartnerLead,
} from '@/services/partnerLeadsApi'
import {
  merchantAdminApi, normaliseCampaign, normaliseQuote, EMPTY_LOG, QUOTE_STATUSES,
  type MerchantApiError, type MerchantCampaign, type MerchantQuote, type MerchantTrial, type QuoteStatus,
} from '@/services/merchantAdminApi'
import { quoteQuestionLabel } from '@/content/merchantQuoteQuestions'
import { cn } from '@/lib/utils'

/** What the panel is opened on: a lead row, or a merchant row that has no lead. */
export type LeadPanelTarget = { lead_id: string; merchant_id?: null } | { merchant_id: string; lead_id?: null } | null

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

const TONE: Record<LeadStatus, string> = {
  new: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  contacted: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  applied: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  approved: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  live: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  lost: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const QUOTE_CHIP: Record<QuoteStatus, string> = {
  new: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  quoted: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  won: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  lost: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

const DEFAULT_TRIAL: MerchantTrial = {
  status: 'pending', month: 0, months: 3, used_this_month: 0, creators_per_month: 5, used_total: 0, total_creators: 15,
}

/** Whatever the server sent, every list is a list and every log key exists. */
function normaliseView(raw: unknown): LeadFullView {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<LeadFullView> & Record<string, unknown>
  const trial = (v.trial && typeof v.trial === 'object' ? v.trial : {}) as Partial<LeadFullView['trial']>
  return {
    lead: v.lead ?? null,
    merchant: v.merchant ?? null,
    stage: v.stage ?? null,
    log: { ...EMPTY_LOG, ...(v.log || {}) },
    timeline: Array.isArray(v.timeline) ? v.timeline : [],
    trial: { ...DEFAULT_TRIAL, ...trial },
    campaigns: Array.isArray(v.campaigns) ? v.campaigns.map(normaliseCampaign) : [],
    quotes: Array.isArray(v.quotes) ? v.quotes.map(normaliseQuote) : [],
    actions: {
      can_onboard: !!v.actions?.can_onboard,
      can_resend_welcome: !!v.actions?.can_resend_welcome,
      can_send_reminder: !!v.actions?.can_send_reminder,
    },
  }
}

const str = (v: unknown): string | null => {
  if (v == null || v === '') return null
  if (Array.isArray(v)) return v.map(String).join(', ')
  return typeof v === 'object' ? null : String(v)
}

export function LeadPanel({ target, onClose, onLeadPatched, onChanged }: {
  target: LeadPanelTarget
  onClose: () => void
  /** The lead row was patched (status, note, lost reason, RFM). The table updates its row. */
  onLeadPatched?: (lead: PartnerLead) => void
  /** Something changed on the server that the lists should re-read: an onboarding, a campaign decision. */
  onChanged?: () => void
}) {
  const [view, setView] = useState<LeadFullView | null>(null)
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState(false)
  const [note, setNote] = useState('')
  const [lost, setLost] = useState('')

  const key = target ? ('lead_id' in target && target.lead_id ? `lead:${target.lead_id}` : `merchant:${target.merchant_id}`) : null

  const load = useCallback(async (quiet = false) => {
    if (!target) return
    if (!quiet) { setLoading(true); setFailure(null) }
    try {
      const raw = 'lead_id' in target && target.lead_id
        ? (await partnerLeadsApi.full(target.lead_id)).data
        : await merchantAdminApi.full(target.merchant_id as string)
      const v = normaliseView(raw)
      setView(v)
      setNote(v.lead?.status_note ?? '')
      setLost(v.lead?.lost_reason ?? '')
    } catch (e) {
      const err = e as MerchantApiError
      if (!quiet) {
        setView(null)
        setFailure(err.status === 404 ? 'The server has no one-place view yet for this row.' : (err.message || 'The read failed.'))
      }
    } finally {
      setLoading(false)
    }
  }, [target])

  useEffect(() => {
    setView(null)
    if (key) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  /* ---- Lead actions: the existing PATCH, the row updated in the table as well ---- */
  const patchLead = async (body: Parameters<typeof partnerLeadsApi.update>[1], say?: string) => {
    if (!view?.lead) return
    try {
      const r = await partnerLeadsApi.update(view.lead.id, body)
      setView(v => v ? { ...v, lead: { ...v.lead, ...r.data } } : v)
      onLeadPatched?.(r.data)
      if (say) toast.success(say)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const sendToRfm = async () => {
    if (!view?.lead) return
    setBusy('rfm')
    try {
      const r = await partnerLeadsApi.sendToRfm(view.lead.id)
      setView(v => v ? { ...v, lead: { ...v.lead, ...r.data } } : v)
      onLeadPatched?.(r.data)
      if (r.rfm.ok) toast.success(`${view.lead.business_name || 'Lead'} is with RFM`, { description: r.rfm.status })
      else toast.error(`RFM did not take ${view.lead.business_name || 'the lead'}`, { description: r.rfm.error || r.rfm.status })
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }

  const openLicence = async () => {
    if (!view?.lead) return
    try {
      const r = await partnerLeadsApi.licenceUrl(view.lead.id)
      window.open(r.data.url, '_blank', 'noopener')
    } catch (e) { toast.error((e as Error).message) }
  }

  /* ---- Merchant actions: the existing endpoints, then a quiet re-read ---- */
  const resendWelcome = async () => {
    if (!view?.merchant) return
    setBusy('welcome')
    try {
      await merchantAdminApi.resendWelcome(view.merchant.id)
      toast.success(`Welcome sent again to ${view.merchant.email}`)
      load(true)
    } catch (e) { toast.error((e as Error).message || 'The welcome did not go') } finally { setBusy(null) }
  }

  const sendReminder = async () => {
    if (!view?.merchant) return
    setBusy('reminder')
    try {
      await merchantAdminApi.sendReminder(view.merchant.id)
      toast.success(`Reminder sent to ${view.merchant.email}`, { description: 'With a fresh set-password link.' })
      load(true)
    } catch (e) { toast.error((e as Error).message || 'The reminder did not go') } finally { setBusy(null) }
  }

  const changeQuote = async (q: MerchantQuote, patch: { status?: QuoteStatus; quote_note?: string }) => {
    try {
      const fresh = await merchantAdminApi.updateQuote(q.id, patch)
      setView(v => v ? { ...v, quotes: v.quotes.map(x => (x.id === q.id ? fresh : x)) } : v)
      toast.success(patch.status ? `Marked ${patch.status}` : 'Note saved')
    } catch (e) { toast.error((e as Error).message || 'That did not save') }
  }

  /* A decision on the campaign shows at once (the card has already toasted), then the server
     is asked again so the stage and the log catch up. */
  const campaignChanged = (outcome: 'approved' | 'sent_back', c: MerchantCampaign, detail: { reason?: string }) => {
    setView(v => {
      if (!v) return v
      const campaigns = v.campaigns.map(x => x.id !== c.id ? x : ({
        ...x,
        status: outcome === 'approved' ? 'active' : 'draft',
        review_note: outcome === 'sent_back' ? (detail.reason || x.review_note) : x.review_note,
        reviewed_at: new Date().toISOString(),
      }))
      return { ...v, campaigns, stage: outcome === 'approved' ? 'live' : 'sent_back' }
    })
    onChanged?.()
    load(true)
  }

  const lead = view?.lead ?? null
  const merchant = view?.merchant ?? null
  const title = merchant?.name || lead?.business_name || 'Application'
  const phone = merchant?.contact_phone || lead?.phone || null
  const email = merchant?.email || lead?.email || null
  const contactName = merchant?.contact_name || lead?.contact_name || null
  const stage = view?.stage ?? null
  const items = useMemo(() => (view ? timelineItems(view.timeline, view.log) : []), [view])
  const current = view?.campaigns[0] ?? null
  const previous = view?.campaigns.slice(1) ?? []
  const raw = (lead?.raw ?? {}) as Record<string, unknown>
  const notIn = neverSignedIn(stage)

  return (
    <>
      <Sheet open={!!target} onOpenChange={(o: boolean) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
          {/* ---- Header: who, where they are, how to reach them ---- */}
          <SheetHeader className="border-b px-6 pb-4 pt-6">
            <div className="flex items-start gap-3 pr-6">
              {merchant ? <Logo url={merchant.logo_url} name={title} /> : null}
              <div className="min-w-0 flex-1">
                <SheetTitle className="flex flex-wrap items-center gap-2 leading-tight">
                  <span className="truncate">{title}</span>
                  {stage && (
                    <span className="inline-flex items-center gap-1.5">
                      <StageChip stage={stage} />
                      {stageAt(stage, view?.log ?? EMPTY_LOG, { last_login: merchant?.last_login }) && (
                        <span className={cn('text-[12px] font-normal', notIn ? 'text-[var(--tone-warn-ink)]' : 'text-muted-foreground')}
                              title={fullDate(stageAt(stage, view?.log ?? EMPTY_LOG, { last_login: merchant?.last_login })) || undefined}>
                          {ago(stageAt(stage, view?.log ?? EMPTY_LOG, { last_login: merchant?.last_login }))}
                          {notIn ? ', not signed in' : ''}
                        </span>
                      )}
                    </span>
                  )}
                  {!stage && lead && (
                    <Badge variant="outline" className={cn('border-transparent font-medium', TONE[lead.status])}>{STATUS_LABEL[lead.status]}</Badge>
                  )}
                </SheetTitle>
                <SheetDescription className="mt-0.5">
                  {[
                    merchant?.category || lead?.business_type || 'Type not given',
                    lead?.campaign,
                    lead?.created_at ? `applied ${shortDate(lead.created_at)}` : (merchant?.created_at ? `onboarded ${shortDate(merchant.created_at)}` : null),
                    !lead && merchant ? 'no partner lead' : null,
                  ].filter(Boolean).join(' · ')}
                </SheetDescription>

                {(contactName || phone || email) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                    {contactName && <span className="font-medium">{contactName}</span>}
                    {phone && (
                      <span className="inline-flex items-center gap-1">
                        <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Phone className="size-3.5" aria-hidden />{phone}
                        </a>
                        <CopyButton text={phone} what="phone" />
                      </span>
                    )}
                    {email && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Mail className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{email}</span>
                        </a>
                        <CopyButton text={email} what="email" />
                      </span>
                    )}
                  </div>
                )}

                {lead && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                    <span className="font-medium text-foreground">RFM</span>
                    <RfmCell l={lead} busy={busy === 'rfm'} onSend={canSendToRfm(lead) ? sendToRfm : undefined} />
                    {str(raw.rfm_ref) && <span title="RFM reference">Ref {str(raw.rfm_ref)}</span>}
                    {str(raw.rfm_owner) && <span title="Who has it at RFM">Owner {str(raw.rfm_owner)}</span>}
                    {str(raw.rfm_stage) && <span>{str(raw.rfm_stage)}</span>}
                    {lead.assigned_name && <span>Ours: {lead.assigned_name}</span>}
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading && !view && (
              <div className="space-y-3">
                {[0, 1, 2].map(n => <Skeleton key={n} className="h-24 w-full rounded-ds-lg" />)}
              </div>
            )}

            {failure && !view && (
              <div className="rounded-ds-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-semibold text-destructive">This did not load</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{failure}</p>
                <Button size="sm" variant="outline" className="mt-3 h-8" onClick={() => load()}>
                  <RefreshCw className="mr-2 size-3.5" aria-hidden />Try again
                </Button>
              </div>
            )}

            {view && (
              <div className="space-y-4">
                {/* ---- Onboarding ---- */}
                <Section
                  title="Onboarding"
                  note={merchant
                    ? (merchant.on_programme ? null : 'This merchant is not on a programme.')
                    : (lead?.status === 'lost' ? 'Lost. Not on the platform.' : 'Not on the platform yet.')}
                  action={
                    <div className="flex flex-wrap gap-1.5">
                      {view.actions.can_onboard && (
                        <Button size="sm" className="h-8" onClick={() => setOnboarding(true)}
                                title="Create their merchant account and send the welcome">
                          <Store className="mr-1.5 size-3.5" aria-hidden />Onboard to trial
                        </Button>
                      )}
                      {view.actions.can_resend_welcome && notIn && (
                        <Button size="sm" variant="outline" className="h-8" disabled={busy === 'welcome'} onClick={resendWelcome}
                                title="A fresh set-password link by email">
                          {busy === 'welcome' ? <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden /> : <Mail className="mr-1.5 size-3.5" aria-hidden />}
                          Resend welcome
                        </Button>
                      )}
                      {view.actions.can_send_reminder && (
                        <Button size="sm" variant="outline" className="h-8" disabled={busy === 'reminder'} onClick={sendReminder}
                                title="The 72-hour nudge, now, once">
                          {busy === 'reminder' ? <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden /> : <Bell className="mr-1.5 size-3.5" aria-hidden />}
                          Send reminder now
                        </Button>
                      )}
                    </div>
                  }
                >
                  {merchant && (
                    <MerchantTimeline items={items} relative className="-mx-1"
                                      emptyText="Nothing logged yet. The account exists; the welcome date was not recorded." />
                  )}
                </Section>

                {/* ---- Trial ---- */}
                {merchant && merchant.on_programme && view.trial.on_programme !== false && (
                  <Section title="Trial" note={view.trial.status === 'pending' ? 'Starts the day the first campaign goes live.' : null}>
                    <TrialMeter trial={view.trial} />
                  </Section>
                )}

                {/* ---- Campaign ---- */}
                {current && (
                  <Section
                    title={current.status === 'in_review' ? 'Campaign waiting on us' : 'Campaign'}
                    note={current.status === 'in_review' ? 'Approving pushes it to creators near the merchant.' : null}
                    flush
                  >
                    <MerchantCampaignCard c={current} showMerchantLink={false} onChanged={campaignChanged}
                                          className="rounded-ds-lg border-0 shadow-none p-0" />
                    {previous.length > 0 && (
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger asChild>
                          <button type="button" className="group inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
                            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                            {previous.length} earlier {previous.length === 1 ? 'campaign' : 'campaigns'}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {previous.map(c => {
                            const chip = campaignStatusChip(c.status)
                            return (
                              <div key={c.id} className="flex items-center justify-between gap-3 rounded-ds-lg border px-3 py-2 text-[13px]">
                                <div className="min-w-0">
                                  <div className="truncate font-medium">{c.name}</div>
                                  <div className="text-[12px] text-muted-foreground">
                                    {c.submitted_at ? `submitted ${shortDate(c.submitted_at)}` : 'never submitted'}
                                    {c.review_note ? ` · ${c.review_note}` : ''}
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn('shrink-0 border-transparent font-medium', chip.cls)}>{chip.label}</Badge>
                              </div>
                            )
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </Section>
                )}

                {/* ---- Quotes ---- */}
                {view.quotes.length > 0 && (
                  <Section title="Quote requests" note="They were promised a quote within two business days.">
                    <div className="space-y-3">
                      {view.quotes.map(q => <QuoteCard key={q.id} q={q} onChange={patch => changeQuote(q, patch)} />)}
                    </div>
                  </Section>
                )}

                {/* ---- Lead details ---- */}
                {lead && (
                  <Section title="Lead details">
                    <div className="space-y-2">
                      <Row label="Business type" value={lead.business_type} />
                      <Row label="Area" value={str(raw.area)} />
                      <Row label="Card sales" value={str(raw.card_sales) || lead.turnover_aed} />
                      <Row label="Branches" value={str(raw.branches)} />
                      <Row
                        label="Wants"
                        value={lead.needs.length > 0 || str(raw.wants) ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {lead.needs.map(n => <Badge key={n} variant="secondary" className="text-[11px]">{n}</Badge>)}
                            {str(raw.wants) && !lead.needs.length && <span>{str(raw.wants)}</span>}
                          </div>
                        ) : null}
                      />
                      <Row
                        label="Website"
                        value={lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all hover:underline">
                            <Globe className="size-3 shrink-0" aria-hidden />{lead.website}<ExternalLink className="size-3 shrink-0" aria-hidden />
                          </a>
                        ) : null}
                      />
                      <Row
                        label="Came in"
                        value={[
                          lead.source ? lead.source.replace(/_/g, ' ') : null,
                          lead.campaign,
                          lead.utm?.utm_campaign ? `ad ${lead.utm.utm_campaign}` : null,
                          str(raw.entered_by) ? `entered by ${str(raw.entered_by)}` : null,
                          lead.created_at ? shortTime(lead.created_at) : null,
                        ].filter(Boolean).join(' · ') || null}
                      />
                      <Row
                        label="Trade licence"
                        value={lead.has_licence ? (
                          <button type="button" onClick={openLicence} className="inline-flex items-center gap-1 hover:underline">
                            <FileText className="size-3" aria-hidden />Open{lead.licence_filename ? ` · ${lead.licence_filename}` : ''}
                          </button>
                        ) : lead.has_licence_in_email ? (
                          <span className="inline-flex items-center gap-1 text-[var(--tone-warn-ink)]" title="Attached to the application email; the file is in the partnerships inbox, not here.">
                            <Paperclip className="size-3" aria-hidden />In the inbox{lead.licence_filename ? ` · ${lead.licence_filename}` : ''}
                          </span>
                        ) : null}
                      />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-[12.5px] font-medium">Where it has got to</Label>
                        <Select value={lead.status} onValueChange={(v: string) => patchLead({ status: v as LeadStatus }, `Marked ${STATUS_LABEL[v as LeadStatus].toLowerCase()}`)}>
                          <SelectTrigger className={cn('h-8 border-transparent text-[12.5px] font-medium', TONE[lead.status])}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                          {lead.contacted_at && <span>Contacted {shortDate(lead.contacted_at)}</span>}
                          {lead.approved_at && <span>Approved {shortDate(lead.approved_at)}</span>}
                          {lead.lost_at && <span>Lost {shortDate(lead.lost_at)}</span>}
                        </div>
                      </div>
                      {lead.status === 'lost' && (
                        <div className="space-y-1.5">
                          <Label className="text-[12.5px] font-medium">Why it was lost</Label>
                          <Input
                            className="h-8 text-[13px]"
                            value={lost}
                            onChange={e => setLost(e.target.value)}
                            onBlur={() => lost !== (lead.lost_reason ?? '') && patchLead({ lost_reason: lost }, 'Saved')}
                            placeholder="Went with someone else, too small, no answer"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <Label className="text-[12.5px] font-medium">Notes</Label>
                      <Textarea
                        rows={3}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        onBlur={() => note !== (lead.status_note ?? '') && patchLead({ status_note: note }, 'Note saved')}
                        placeholder="What was said, what they asked for, when to chase."
                      />
                      <p className="text-[11.5px] text-muted-foreground">Saved when you click away.</p>
                    </div>

                    {rfmState(lead).detail && (
                      <p className="mt-3 text-[12px] text-muted-foreground">{rfmState(lead).detail}</p>
                    )}
                  </Section>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <OnboardMerchantDialog
        open={onboarding}
        onOpenChange={(o: boolean) => { if (!o) setOnboarding(false) }}
        prefill={lead ? {
          partner_lead_id: lead.id,
          business_name: lead.business_name,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          business_type: lead.business_type,
        } : null}
        onCreated={() => { onChanged?.(); load(true) }}
      />
    </>
  )
}

/** A quiet card with a title, an optional one-line note, and the section's buttons on the right. */
function Section({ title, note, action, flush, children }: {
  title: string
  note?: string | null
  action?: React.ReactNode
  flush?: boolean
  children?: React.ReactNode
}) {
  return (
    <section className="rounded-ds-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3.5 pb-2">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold">{title}</h3>
          {note && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{note}</p>}
        </div>
        {action}
      </div>
      {children ? <div className={cn(flush ? 'px-2 pb-3' : 'px-4 pb-4')}>{children}</div> : <div className="pb-2" />}
    </section>
  )
}

/** A label/value pair. Absent values are a dash, never a blank line. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right">{value || <span className="text-muted-foreground">Not given</span>}</span>
    </div>
  )
}

function Logo({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-11 shrink-0 rounded-ds-md border bg-background object-contain p-0.5" />
  }
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-ds-md border bg-muted text-[13px] font-semibold text-muted-foreground">
      {(name || '?').slice(0, 2).toUpperCase()}
    </span>
  )
}

function CopyButton({ text, what }: { text: string; what: string }) {
  return (
    <button
      type="button"
      className="rounded-ds-sm p-0.5 text-muted-foreground hover:text-foreground"
      aria-label={`Copy ${what}`}
      title={`Copy ${what}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); toast.success(`Copied the ${what}`) }
        catch { toast.error('Could not copy') }
      }}
    >
      <Copy className="size-3" aria-hidden />
    </button>
  )
}

/** One quote request: what they want, what they answered, where it stands. */
function QuoteCard({ q, onChange }: { q: MerchantQuote; onChange: (patch: { status?: QuoteStatus; quote_note?: string }) => void }) {
  const [note, setNote] = useState(q.quote_note ?? '')
  useEffect(() => { setNote(q.quote_note ?? '') }, [q.quote_note])
  const managed = q.answers?.managed === 'yes'
  const answerLines = Object.entries(q.answers || {})
    .filter(([k]) => k !== 'managed')
    .map(([k, v]) => ({ k, label: quoteQuestionLabel(k).replace(/\?$/, ''), value: Array.isArray(v) ? v.join(', ') : String(v) }))
  return (
    <div className="rounded-ds-lg border px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-medium">{q.offering_label}{managed ? <span className="font-normal text-muted-foreground"> · managed by Following</span> : null}</div>
          <div className="text-[11.5px] text-muted-foreground" title={fullDate(q.created_at) || undefined}>
            Sent {ago(q.created_at)}{q.quoted_at ? ` · quoted ${ago(q.quoted_at)}` : ''}
          </div>
        </div>
        <Select value={q.status} onValueChange={(v: string) => onChange({ status: v as QuoteStatus })}>
          <SelectTrigger className={cn('h-7 w-[110px] border-transparent text-[12px] font-medium', QUOTE_CHIP[q.status])} aria-label="Quote status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUOTE_STATUSES.map(st => <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {answerLines.length > 0 && (
        <dl className="m-0 mt-2 space-y-0.5 text-[12.5px]">
          {answerLines.map(a => (
            <div key={a.k} className="flex gap-1.5">
              <dt className="m-0 shrink-0 text-muted-foreground">{a.label}:</dt>
              <dd className="m-0 min-w-0 truncate" title={a.value}>{a.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {q.notes && <p className="mt-1.5 text-[12.5px] italic leading-snug text-muted-foreground">{q.notes}</p>}
      {q.status !== 'new' && (
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => { if (note.trim() !== (q.quote_note ?? '').trim()) onChange({ quote_note: note.trim() }) }}
          placeholder="What was quoted, in a line"
          rows={2}
          className="mt-2 min-h-[48px] resize-none text-[12.5px]"
        />
      )}
      {(q.contact.email || q.contact.phone) && (
        <div className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-muted-foreground">
          {q.contact.email && <a href={`mailto:${q.contact.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="size-3" aria-hidden />{q.contact.email}</a>}
          {q.contact.phone && <a href={`tel:${q.contact.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="size-3" aria-hidden />{q.contact.phone}</a>}
        </div>
      )}
    </div>
  )
}
