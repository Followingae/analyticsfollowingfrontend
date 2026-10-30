'use client'

/**
 * Affiliate links: every campaign's short links, clicks and sales on one screen.
 *
 * THE LINKS STILL LIVE ON THEIR CAMPAIGN. Set-up, codes, sales imports and releasing to the
 * brand all happen on a campaign's own Links tab, because every one of those is a decision
 * about one campaign. This screen is the view across them: which campaigns are sending
 * people, which creators are, and a way into any one of them. It reads one endpoint and
 * changes nothing.
 *
 * NOTHING SET UP, NOTHING DRAWN. Before the first retailer page is added anywhere, the screen
 * is the title, the one button that starts the job, and a sentence saying what it is for.
 * A row of zeros and an empty chart would describe a module that has been tried and failed.
 *
 * Reached at /work/affiliate-links, which the /work rewrite serves from this file.
 */

import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Eye, EyeOff, Link2, Loader2, Plus, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CARD, PageHead } from '@/components/console/primitives'
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { CreatorCell, DailyClicksChart, LinksTotals } from '@/components/campaigns/links/LinksResults'
import { cn } from '@/lib/utils'
import {
  affiliateLinksApi, count, money,
  type AffiliateCampaign, type AffiliateCreator, type AffiliateOverview, type DailyClicks,
  type SetUpCandidate,
} from '@/services/trackedLinksApi'

const linksHref = (campaignId: string) => `/work/campaigns/${campaignId}/links`

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

/** The server sends only the days somebody clicked. The chart spans all 30, so a quiet day
 *  reads as the measured nothing it is rather than vanishing from the axis. */
function lastThirtyDays(daily: DailyClicks[]): DailyClicks[] {
  const byDay = new Map(daily.map((d) => [d.day, d]))
  const dubaiToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
  const end = new Date(`${dubaiToday}T00:00:00Z`)
  const out: DailyClicks[] = []
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(end.getTime() - i * 86_400_000).toISOString().slice(0, 10)
    out.push(byDay.get(day) || { day, clicks: 0, unique_clicks: 0 })
  }
  return out
}

export default function AffiliateLinksPage() {
  const [data, setData] = useState<AffiliateOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [picking, setPicking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await affiliateLinksApi.overview())
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not read the affiliate links')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const campaigns = data?.campaigns || []
  const hasAny = campaigns.length > 0

  return (
    <SuperadminLayout>
      <div className="space-y-9 p-ds-4">
        <PageHead
          title="Affiliate links"
          sub="Every campaign's short links in one place: who is sending people to the retailer, and what they bought."
          action={
            <Button onClick={() => setPicking(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Set up links on a campaign
            </Button>
          }
        />

        <ReadState
          failed={failed}
          loading={loading}
          empty={!hasAny}
          what="the affiliate links"
          onRetry={() => load()}
          skeleton={<div className="flex items-center gap-2 py-10 text-ds-caption">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the links
          </div>}
          nothing={
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              No campaign has links yet. Pick a campaign, add the retailer pages the brand sells
              through, and every creator on it gets a short link to each one. Clicks are counted
              as they happen and sales come back from the retailer, then every campaign shows up
              here side by side.
            </p>
          }
        >
          {data && (
            <>
              <section className="space-y-3">
                <LinksTotals totals={data.totals} />
                <p className="text-ds-caption text-muted-foreground">
                  {count(data.totals.links)} live link{data.totals.links === 1 ? '' : 's'} across{' '}
                  {count(data.totals.campaigns)} campaign{data.totals.campaigns === 1 ? '' : 's'}
                  {data.totals.other_currencies.length > 0 && (
                    <> | also {data.totals.other_currencies
                      .map((o) => money(o.revenue_cents, o.currency)).join(', ')}, not added to the revenue above</>
                  )}
                </p>
                {data.totals.clicks > 0 && <DailyClicksChart daily={lastThirtyDays(data.daily)} />}
              </section>

              <CampaignTable campaigns={campaigns} />

              {data.top_creators.length > 0 && (
                <TopCreators creators={data.top_creators} currency={data.totals.currency || 'AED'} />
              )}
            </>
          )}
        </ReadState>
      </div>

      <CampaignPicker open={picking} onOpenChange={setPicking} />
    </SuperadminLayout>
  )
}

function CampaignTable({ campaigns }: { campaigns: AffiliateCampaign[] }) {
  const router = useRouter()
  return (
    <section>
      <SectionHead
        icon={Link2} title="Campaigns with links" count={campaigns.length}
        note="Open one to add retailers, hand out links, enter sales or show the brand."
      />
      <div className={cn(CARD, 'overflow-x-auto bg-card')}>
        <table className="w-full min-w-[980px] text-[13px]">
          <thead>
            <tr className="border-b text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Campaign</th>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 text-right font-medium">Retailers</th>
              <th className="px-3 py-2.5 text-right font-medium">Links</th>
              <th className="px-3 py-2.5 text-right font-medium">Clicks</th>
              <th className="px-3 py-2.5 text-right font-medium">Unique</th>
              <th className="px-3 py-2.5 text-right font-medium">Sales</th>
              <th className="px-3 py-2.5 text-right font-medium">Revenue</th>
              <th className="px-3 py-2.5 font-medium">Brand sees it</th>
              <th className="px-4 py-2.5 font-medium">Last click</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                onClick={() => router.push(linksHref(c.id))}
              >
                <td className="max-w-[280px] px-4 py-2.5">
                  <Link href={linksHref(c.id)} className="block truncate font-medium hover:underline"
                        onClick={(e: MouseEvent) => e.stopPropagation()}>
                    {c.name}
                  </Link>
                  {c.status && (
                    <p className="text-[12px] capitalize text-muted-foreground">{c.status}</p>
                  )}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2.5">{c.client}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(c.retailers)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(c.links)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(c.clicks)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(c.unique_clicks)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(c.sales)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(c.revenue_cents, c.currency)}</td>
                <td className="px-3 py-2.5">
                  {c.links_client_visible ? (
                    <span className="inline-flex items-center gap-1 text-[var(--tone-good-ink)]">
                      <Eye className="h-3.5 w-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" /> Not yet
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {c.last_click_at ? fmtDate(c.last_click_at) : 'No clicks yet'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TopCreators({ creators, currency }: { creators: AffiliateCreator[]; currency: string }) {
  return (
    <section>
      <SectionHead icon={Trophy} title="Top creators" note="By clicks, across every campaign." />
      <div className={cn(CARD, 'divide-y bg-card')}>
        {creators.map((c, i) => (
          <Link
            key={`${c.campaign_id}-${c.username || i}`}
            href={linksHref(c.campaign_id)}
            className="flex items-center gap-4 px-4 py-2.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
          >
            <span className="w-5 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <CreatorCell username={c.username} fullName={c.full_name} pic={c.profile_pic_url} />
            </div>
            <span className="hidden max-w-[220px] truncate text-[12.5px] text-muted-foreground sm:block">
              {c.campaign_name}
            </span>
            <dl className="flex shrink-0 gap-5 text-right text-[13px] tabular-nums">
              <div>
                <dt className="text-[11px] text-muted-foreground">Clicks</dt>
                <dd className="font-medium">{count(c.clicks)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Sales</dt>
                <dd className="font-medium">{count(c.sales)}</dd>
              </div>
              <div className="min-w-[88px]">
                <dt className="text-[11px] text-muted-foreground">Revenue</dt>
                <dd className="font-medium">{money(c.revenue_cents, currency)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** A searchable list of recent campaigns. Choosing one opens its Links tab, where set-up is. */
function CampaignPicker({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<SetUpCandidate[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let live = true
    const t = setTimeout(async () => {
      try {
        const r = await affiliateLinksApi.campaigns(q.trim() || undefined)
        if (live) { setRows(r); setFailed(false) }
      } catch {
        if (live) setFailed(true)
      }
    }, q ? 220 : 0)
    return () => { live = false; clearTimeout(t) }
  }, [open, q])

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) { setQ(''); setRows(null); setFailed(false) }
  }

  const loadingNow = open && rows === null && !failed

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Set up links on a campaign</DialogTitle>
          <DialogDescription>
            Pick the campaign. Its Links tab opens, where you add the retailer pages.
          </DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="border-t">
          <CommandInput value={q} onValueChange={setQ} placeholder="Search campaigns or clients" />
          <CommandList className="max-h-[360px]">
            {loadingNow && (
              <div className="flex items-center gap-2 px-4 py-6 text-ds-caption">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading campaigns
              </div>
            )}
            {failed && (
              <div className="px-4 py-6 text-ds-caption">
                Could not read the campaigns. Close this and try again.
              </div>
            )}
            {rows && !failed && <CommandEmpty>No campaign matches that.</CommandEmpty>}
            {rows && !failed && rows.length > 0 && (
              <CommandGroup heading={q.trim() ? 'Matches' : 'Recent campaigns'}>
                {rows.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.id}
                    onSelect={() => { close(false); router.push(linksHref(r.id)) }}
                    className="flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{r.name}</p>
                      {r.client && <p className="truncate text-[12px] text-muted-foreground">{r.client}</p>}
                    </div>
                    {r.has_links && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
                        <Check className="h-3.5 w-3.5" /> Has links
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
