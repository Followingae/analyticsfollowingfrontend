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
 * Density tier: OPERATING. A worklist, so the table is the page.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, Plus, RefreshCw, Store, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Panel, PageHead } from '@/components/console/primitives'
import { Failed } from '@/components/console/surfaces'
import { OnboardMerchantDialog } from '@/components/superadmin/merchants/OnboardMerchantDialog'
import {
  merchantAdminApi, type MerchantApiError, type MerchantCampaignStatus, type OnboardedMerchant,
} from '@/services/merchantAdminApi'
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

  useEffect(() => { load() }, [load])

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
  const neverIn = useMemo(() => (rows ?? []).filter(m => !m.last_login).length, [rows])

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
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
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
                    <th className="px-3 py-2.5">Last sign-in</th>
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
                        <td className="px-3 py-3 text-[12.5px] text-muted-foreground">
                          {ago(m.last_login) || <span className="text-[var(--tone-warn-ink)]">Never</span>}
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
