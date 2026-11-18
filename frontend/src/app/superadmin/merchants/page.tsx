'use client'

/**
 * Merchants on the self-serve programme, and where each one has got to.
 *
 * Served at /work/merchants: the console rewrite sends anything under /work without a page
 * of its own to its /superadmin counterpart, so this file is the screen.
 *
 * WHAT THE ROW HAS TO ANSWER. A merchant was onboarded; did they ever log in; have they built
 * a campaign; is it waiting on us; how far through the three months are they. The trial meter
 * is five pills because the programme is five creators a month, and "3 of 5" read as pills
 * is a glance where "60%" is a sum.
 *
 * "Where they are" is one chip per merchant (Invited, Reminded, Signed up, Campaign in review,
 * Sent back, Live) with the moment it happened underneath; the chip opens the merchant's log,
 * every recorded moment with its date, read off merchant_events on the server (founder, 18 Nov
 * 2026: an accurate log, not a last-sign-in guess).
 *
 * Density tier: OPERATING. A worklist, so the table is the page.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, Plus, RefreshCw, Store, ArrowUpRight, FileText, Phone, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Panel, PageHead } from '@/components/console/primitives'
import { Failed } from '@/components/console/surfaces'
import { OnboardMerchantDialog } from '@/components/superadmin/merchants/OnboardMerchantDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  merchantAdminApi, QUOTE_STATUSES, type MerchantApiError, type MerchantCampaignStatus, type MerchantEvent,
  type MerchantQuote, type MerchantStage, type OnboardedMerchant, type QuoteStatus,
} from '@/services/merchantAdminApi'
import { quoteQuestionLabel } from '@/content/merchantQuoteQuestions'
import { cn } from '@/lib/utils'

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

const ago = (iso: string | null | undefined) => {
  if (!iso) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(mins)) return null
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  const d = Math.floor(mins / 1440)
  return d < 30 ? `${d}d ago` : shortDate(iso)
}

const fullDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null

/**
 * Where they are: the stage chip's words, its colour, and which timestamp sits under it.
 * "Invited 2d ago" is the invite date; "Signed up" is when the password was set; the campaign
 * stages carry the moment the campaign changed hands.
 */
const STAGE: Record<MerchantStage, { label: string; cls: string; at: (m: OnboardedMerchant) => string | null }> = {
  invited: {
    label: 'Invited',
    cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
    at: m => m.log.invited_at,
  },
  reminded: {
    label: 'Reminded',
    cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
    at: m => m.log.reminder_sent_at,
  },
  signed_up: {
    label: 'Signed up',
    cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
    at: m => m.log.password_set_at || m.log.first_login_at || m.last_login,
  },
  campaign_in_review: {
    label: 'Campaign in review',
    cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
    at: m => m.log.campaign_submitted_at || m.campaign?.submitted_at || null,
  },
  sent_back: {
    label: 'Sent back',
    cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
    at: m => m.log.campaign_sent_back_at,
  },
  live: {
    label: 'Live',
    cls: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
    at: m => m.log.campaign_approved_at,
  },
}

/** What each logged moment is called on the timeline. */
const EVENT_LABEL: Record<string, string> = {
  invited: 'Invited',
  welcome_resent: 'Welcome sent again',
  reminder_sent: 'Reminder sent',
  password_set: 'Password set',
  first_login: 'First sign-in',
  campaign_submitted: 'Campaign submitted',
  campaign_approved: 'Campaign approved',
  campaign_sent_back: 'Campaign sent back',
  quote_requested: 'Quote requested',
}

/**
 * The timeline a chip opens. Logged events first; when the server has no rows for an older
 * merchant, the eight log timestamps stand in so the list is never empty for someone who is
 * plainly past "invited".
 */
function timelineFor(m: OnboardedMerchant): { kind: string; at: string | null; note: string | null }[] {
  if (m.timeline.length) {
    return m.timeline.map((e: MerchantEvent) => {
      const p = e.payload || {}
      let note: string | null = null
      if (e.kind === 'invited' || e.kind === 'welcome_resent' || e.kind === 'reminder_sent') {
        if (p.email_sent === false) note = p.held_back ? 'No email sent, link held back' : 'Email did not go'
        else if (typeof p.to === 'string') note = `to ${p.to}`
      } else if (e.kind === 'campaign_sent_back' && typeof p.reason === 'string') {
        note = p.reason
      } else if ((e.kind === 'campaign_submitted' || e.kind === 'campaign_approved') && typeof p.name === 'string') {
        note = p.name
      } else if (e.kind === 'quote_requested' && typeof p.offering === 'string') {
        note = String(p.offering).replace(/-/g, ' ')
      }
      return { kind: e.kind, at: e.at, note }
    })
  }
  const l = m.log
  return ([
    ['invited', l.invited_at], ['welcome_resent', l.welcome_resent_at], ['reminder_sent', l.reminder_sent_at],
    ['password_set', l.password_set_at], ['first_login', l.first_login_at],
    ['campaign_submitted', l.campaign_submitted_at], ['campaign_sent_back', l.campaign_sent_back_at],
    ['campaign_approved', l.campaign_approved_at],
  ] as [string, string | null][])
    .filter(([, at]) => !!at)
    .sort((a, b) => new Date(a[1] as string).getTime() - new Date(b[1] as string).getTime())
    .map(([kind, at]) => ({ kind, at, note: null }))
}

/** The stage chip with its date underneath; click it and the merchant's timeline opens. */
function WhereTheyAre({ m }: { m: OnboardedMerchant }) {
  const s = STAGE[m.stage] ?? STAGE.invited
  const at = s.at(m)
  const items = timelineFor(m)
  const neverIn = m.stage === 'invited' || m.stage === 'reminded'
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group inline-flex flex-col items-start gap-0.5 rounded-ds-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Open the log"
          aria-label={`${s.label}. Open the log for ${m.business_name}`}
        >
          <Badge variant="outline" className={cn('border-transparent font-medium', s.cls)}>
            {s.label}
            <ChevronDown className="ml-1 size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
          </Badge>
          <span className={cn('text-[12px]', neverIn ? 'text-[var(--tone-warn-ink)]' : 'text-muted-foreground')} title={at || undefined}>
            {at ? ago(at) : (neverIn ? 'Never signed in' : 'No date')}
            {neverIn && at ? ', not signed in' : ''}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="border-b px-3 py-2">
          <div className="text-[12.5px] font-medium">{m.business_name}</div>
          <div className="text-[11.5px] text-muted-foreground">
            {items.length} {items.length === 1 ? 'moment' : 'moments'} on record
          </div>
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-3 text-[12.5px] text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ol className="m-0 max-h-[300px] list-none overflow-y-auto p-0">
            {items.map((e, i) => (
              <li key={`${e.kind}-${e.at}-${i}`} className="flex gap-2.5 border-b px-3 py-2 last:border-0">
                <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[var(--tone-info-ink)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12.5px] font-medium">{EVENT_LABEL[e.kind] || e.kind.replace(/_/g, ' ')}</span>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground" title={e.at || undefined}>
                      {fullDate(e.at) || 'No date'}
                    </span>
                  </div>
                  {e.note && <div className="truncate text-[11.5px] text-muted-foreground" title={e.note}>{e.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** The campaign chip. Four words a person uses, whatever the server's own status names. */
function campaignChip(status: MerchantCampaignStatus | null | undefined): { label: string; cls: string } {
  if (!status) return { label: 'No campaign', cls: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' }
  switch (status) {
    case 'draft': return { label: 'Draft', cls: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' }
    case 'in_review': return { label: 'In review', cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' }
    case 'live': case 'active': case 'approved':
      return { label: 'Live', cls: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' }
    case 'rejected': return { label: 'Sent back', cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' }
    case 'completed': case 'closed': return { label: 'Finished', cls: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' }
    default: return { label: String(status).replace(/_/g, ' '), cls: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]' }
  }
}

export default function MerchantsPage() {
  return (
    <SuperadminLayout>
      <Merchants />
    </SuperadminLayout>
  )
}

function Merchants() {
  const [rows, setRows] = useState<OnboardedMerchant[] | null>(null)
  const [loading, setLoading] = useState(true)
  /* A refused read is not "no merchants yet". The failure is kept so the page can say so. */
  const [failure, setFailure] = useState<string | null>(null)
  const [notBuilt, setNotBuilt] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  /* Quote requests off the trial-complete home. null until read; [] when the route is not built. */
  const [quotes, setQuotes] = useState<MerchantQuote[] | null>(null)
  const [quoteCounts, setQuoteCounts] = useState<Record<QuoteStatus | 'all', number> | null>(null)
  const [quotesOn, setQuotesOn] = useState(true)
  const [quoteFilter, setQuoteFilter] = useState<QuoteStatus | 'all'>('new')

  const load = useCallback(async () => {
    try {
      const r = await merchantAdminApi.listOnboarded()
      setRows(r)
      setFailure(null)
      setNotBuilt(false)
    } catch (e) {
      const err = e as MerchantApiError
      if (err.status === 404) { setNotBuilt(true); setRows([]); setFailure(null) }
      else { setFailure(err.message); setRows(null) }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuotes = useCallback(async (filter: QuoteStatus | 'all') => {
    try {
      const r = await merchantAdminApi.listQuotes(filter)
      setQuotes(r.items)
      setQuoteCounts(r.counts)
      setQuotesOn(true)
    } catch (e) {
      const err = e as MerchantApiError
      if (err.status === 404) { setQuotesOn(false); setQuotes([]) }
      else toast.error(err.message || 'The quote requests did not load')
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadQuotes(quoteFilter) }, [loadQuotes, quoteFilter])

  const changeQuote = async (q: MerchantQuote, patch: { status?: QuoteStatus; quote_note?: string }) => {
    try {
      const fresh = await merchantAdminApi.updateQuote(q.id, patch)
      setQuotes(prev => (prev ?? []).map(x => (x.id === q.id ? fresh : x)))
      if (patch.status && patch.status !== q.status) {
        const to = patch.status
        setQuoteCounts(prev => prev ? {
          ...prev,
          [q.status]: Math.max(0, (prev[q.status] ?? 0) - 1),
          [to]: (prev[to] ?? 0) + 1,
        } : prev)
      }
      toast.success(patch.status ? `Marked ${patch.status}` : 'Note saved')
    } catch (e) {
      toast.error((e as Error).message || 'That did not save')
    }
  }

  const resend = async (m: OnboardedMerchant) => {
    setResending(m.merchant_id)
    try {
      await merchantAdminApi.resendWelcome(m.merchant_id)
      toast.success(`Welcome sent again to ${m.email}`)
    } catch (e) {
      toast.error((e as Error).message || 'The welcome did not go')
    } finally {
      setResending(null)
    }
  }

  const waiting = useMemo(() => (rows ?? []).filter(m => m.campaign?.status === 'in_review').length, [rows])
  const neverIn = useMemo(
    () => (rows ?? []).filter(m => m.stage === 'invited' || m.stage === 'reminded').length,
    [rows],
  )

  const sub = rows && rows.length
    ? <>
        {rows.length} on the programme.
        {waiting > 0 && <> <span className="text-[var(--tone-warn-ink)]">{waiting} waiting on a review.</span></>}
        {neverIn > 0 && <> {neverIn} {neverIn === 1 ? 'has' : 'have'} not signed in yet.</>}
      </>
    : 'Merchants RFM has signed up, put on the platform by us. Five creators a month for three months, AED 350 minimum per creator.'

  return (
    <div className="mx-auto w-full max-w-7xl space-y-ds-5 p-ds-3 md:p-ds-4">
      <PageHead
        title="Merchants"
        sub={sub}
        action={
          <>
            {quotesOn && quoteCounts && (
              <a
                href="#quote-requests"
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium',
                  quoteCounts.new > 0
                    ? 'border-transparent bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]'
                    : 'text-muted-foreground',
                )}
                title="Quote requests waiting on us"
              >
                <FileText className="size-3.5" aria-hidden />
                Quotes
                <span className="tabular-nums">{quoteCounts.new}</span>
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); load(); loadQuotes(quoteFilter) }}>
              <RefreshCw className="mr-2 size-4" aria-hidden />Refresh
            </Button>
            <Button size="sm" onClick={() => setOnboarding(true)}>
              <Plus className="mr-2 size-4" aria-hidden />Onboard a merchant
            </Button>
          </>
        }
      />

      {failure && <Failed what="the merchants" onRetry={() => { setLoading(true); load() }} />}

      {notBuilt && (
        <div className="rounded-ds-lg border px-4 py-3">
          <p className="text-sm font-medium">The merchants list is not switched on yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            The server has no answer for this screen yet. Nothing is wrong with the merchants, there is just nothing to read.
          </p>
        </div>
      )}

      {!failure && !notBuilt && (
        <Panel
          title={rows ? `${rows.length} ${rows.length === 1 ? 'merchant' : 'merchants'}` : 'Merchants'}
          description="Trial progress is this month's creators out of five, and which of the three months they are in."
          flush
        >
          {loading && !rows ? (
            <div className="space-y-2 px-6 py-2">
              {[0, 1, 2, 3].map(n => <Skeleton key={n} className="h-14 w-full rounded-ds-lg" />)}
            </div>
          ) : rows && rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Store className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Nobody has been onboarded yet.</p>
              <Button size="sm" variant="outline" onClick={() => setOnboarding(true)}>
                <Plus className="mr-2 size-4" aria-hidden />Onboard the first merchant
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b text-[12px] font-medium text-muted-foreground">
                    <th className="px-6 py-2.5">Business</th>
                    <th className="px-3 py-2.5">Contact</th>
                    <th className="px-3 py-2.5">Trial</th>
                    <th className="px-3 py-2.5">Campaign</th>
                    <th className="px-3 py-2.5">Where they are</th>
                    <th className="px-6 py-2.5 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {(rows ?? []).map(m => {
                    const chip = campaignChip(m.campaign?.status)
                    const t = m.trial
                    return (
                      <tr key={m.merchant_id} className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Logo url={m.logo_url} name={m.business_name} />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{m.business_name}</div>
                              <div className="truncate text-[12px] text-muted-foreground">
                                {m.category || 'No category'}
                                {m.created_at ? ` · onboarded ${shortDate(m.created_at)}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div>{m.contact_name || <span className="text-muted-foreground">No name</span>}</div>
                          <a href={`mailto:${m.email}`} className="inline-flex max-w-[200px] items-center gap-1 truncate text-[12px] text-muted-foreground hover:text-foreground">
                            <Mail className="size-3 shrink-0" aria-hidden /><span className="truncate">{m.email}</span>
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <TrialMeter trial={t} />
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={cn('border-transparent font-medium', chip.cls)}>{chip.label}</Badge>
                          {m.campaign?.name && (
                            <div className="mt-0.5 max-w-[180px] truncate text-[12px] text-muted-foreground">{m.campaign.name}</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <WhereTheyAre m={m} />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {m.campaign?.status === 'in_review' && (
                              <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                                <Link href={`/work/approvals#merchant-campaign-${m.campaign.id}`}>
                                  Review<ArrowUpRight className="ml-1 size-3.5" aria-hidden />
                                </Link>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={resending === m.merchant_id}
                                    onClick={() => resend(m)} title="Send the welcome email again">
                              {resending === m.merchant_id
                                ? <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                                : <Mail className="mr-1 size-3.5" aria-hidden />}
                              Resend welcome
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {quotesOn && (
        <div id="quote-requests">
          <Panel
            title="Quote requests"
            description="A merchant finished the trial and told us what they want next. They were promised a quote within two business days."
            action={
              <Select value={quoteFilter} onValueChange={(v: string) => setQuoteFilter(v as QuoteStatus | 'all')}>
                <SelectTrigger className="h-8 w-[150px] text-[12.5px]" aria-label="Which quote requests">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New{quoteCounts ? ` (${quoteCounts.new})` : ''}</SelectItem>
                  <SelectItem value="quoted">Quoted{quoteCounts ? ` (${quoteCounts.quoted})` : ''}</SelectItem>
                  <SelectItem value="won">Won{quoteCounts ? ` (${quoteCounts.won})` : ''}</SelectItem>
                  <SelectItem value="lost">Lost{quoteCounts ? ` (${quoteCounts.lost})` : ''}</SelectItem>
                  <SelectItem value="all">All{quoteCounts ? ` (${quoteCounts.all})` : ''}</SelectItem>
                </SelectContent>
              </Select>
            }
            flush
          >
            {quotes === null ? (
              <div className="space-y-2 px-6 py-2">
                {[0, 1].map(n => <Skeleton key={n} className="h-14 w-full rounded-ds-lg" />)}
              </div>
            ) : quotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <FileText className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  {quoteFilter === 'new' ? 'Nothing waiting. Every request has been quoted.' : 'No requests here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b text-[12px] font-medium text-muted-foreground">
                      <th className="px-6 py-2.5">Business</th>
                      <th className="px-3 py-2.5">Wants</th>
                      <th className="px-3 py-2.5">Answers</th>
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5">Sent</th>
                      <th className="px-6 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(q => <QuoteRow key={q.id} q={q} onChange={(patch) => changeQuote(q, patch)} />)}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      <OnboardMerchantDialog
        open={onboarding}
        onOpenChange={setOnboarding}
        onCreated={() => load()}
      />
    </div>
  )
}

function Logo({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-9 shrink-0 rounded-ds-md border bg-background object-contain p-0.5" />
  }
  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-ds-md border bg-muted text-[12px] font-semibold text-muted-foreground">
      {(name || '?').slice(0, 2).toUpperCase()}
    </span>
  )
}

/** Month x of 3 in words, this month's creators as five pills. */
function TrialMeter({ trial: t }: { trial: OnboardedMerchant['trial'] }) {
  const per = Math.max(1, t.creators_per_month || 5)
  const used = Math.min(per, Math.max(0, t.used_this_month || 0))
  const months = t.months || 3
  const line = t.status === 'pending'
    ? 'Not started'
    : t.status === 'complete'
      ? `Done, ${t.used_total} of ${t.total_creators} creators`
      : `Month ${Math.max(1, t.month)} of ${months}`
  return (
    <div className="space-y-1">
      <div className="text-[12.5px]">{line}</div>
      <div className="flex items-center gap-1" aria-label={`${used} of ${per} creators used this month`}>
        {Array.from({ length: per }).map((_, i) => (
          <span key={i} className={cn(
            'h-1.5 w-4 rounded-full',
            i < used ? 'bg-[var(--tone-good-dot)]' : 'bg-black/[0.08] dark:bg-white/[0.12]',
          )} />
        ))}
        <span className="ml-1.5 text-[11.5px] tabular-nums text-muted-foreground">{used}/{per}</span>
      </div>
    </div>
  )
}

const QUOTE_CHIP: Record<QuoteStatus, string> = {
  new: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]',
  quoted: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]',
  won: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
  lost: 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
}

/** One request. The status select writes at once; the note on a quoted one saves on blur. */
function QuoteRow({ q, onChange }: { q: MerchantQuote; onChange: (patch: { status?: QuoteStatus; quote_note?: string }) => void }) {
  const [note, setNote] = useState(q.quote_note ?? '')
  useEffect(() => { setNote(q.quote_note ?? '') }, [q.quote_note])
  const managed = q.answers?.managed === 'yes'
  const answerLines = Object.entries(q.answers || {})
    .filter(([k]) => k !== 'managed')
    .map(([k, v]) => ({ k, label: quoteQuestionLabel(k).replace(/\?$/, ''), value: Array.isArray(v) ? v.join(', ') : String(v) }))
  return (
    <tr className="border-b align-top last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <Logo url={q.merchant.logo_url} name={q.merchant.name || '?'} />
          <div className="min-w-0">
            <div className="truncate font-medium">{q.merchant.name || <span className="text-muted-foreground">Unnamed merchant</span>}</div>
            <div className="truncate text-[12px] text-muted-foreground">{q.merchant.category || 'No category'}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="font-medium">{q.offering_label}</div>
        {managed && <div className="text-[12px] text-muted-foreground">Managed by Following</div>}
      </td>
      <td className="px-3 py-3">
        {answerLines.length === 0 ? (
          <span className="text-muted-foreground">No answers</span>
        ) : (
          <dl className="m-0 space-y-0.5 text-[12.5px]">
            {answerLines.map(a => (
              <div key={a.k} className="flex gap-1.5">
                <dt className="m-0 shrink-0 text-muted-foreground">{a.label}:</dt>
                <dd className="m-0 max-w-[260px] truncate">{a.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {q.notes && (
          <p className="mt-1.5 max-w-[320px] text-[12.5px] italic leading-snug text-muted-foreground">{q.notes}</p>
        )}
      </td>
      <td className="px-3 py-3">
        <div>{q.contact.name || <span className="text-muted-foreground">No name</span>}</div>
        {q.contact.email && (
          <a href={`mailto:${q.contact.email}`} className="inline-flex max-w-[200px] items-center gap-1 truncate text-[12px] text-muted-foreground hover:text-foreground">
            <Mail className="size-3 shrink-0" aria-hidden /><span className="truncate">{q.contact.email}</span>
          </a>
        )}
        {q.contact.phone && (
          <a href={`tel:${q.contact.phone}`} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <Phone className="size-3 shrink-0" aria-hidden />{q.contact.phone}
          </a>
        )}
      </td>
      <td className="px-3 py-3 text-[12.5px] text-muted-foreground" title={q.created_at}>
        {ago(q.created_at)}
      </td>
      <td className="px-6 py-3">
        <div className="flex w-[200px] flex-col gap-1.5">
          <Select value={q.status} onValueChange={(v: string) => onChange({ status: v as QuoteStatus })}>
            <SelectTrigger className={cn('h-8 border-transparent text-[12.5px] font-medium', QUOTE_CHIP[q.status])} aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_STATUSES.map(st => (
                <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {q.status !== 'new' && (
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => { if (note.trim() !== (q.quote_note ?? '').trim()) onChange({ quote_note: note.trim() }) }}
              placeholder="What was quoted, in a line"
              rows={2}
              className="min-h-[52px] resize-none text-[12.5px]"
            />
          )}
          {q.quoted_at && <span className="text-[11.5px] text-muted-foreground">Quoted {ago(q.quoted_at)}</span>}
        </div>
      </td>
    </tr>
  )
}
