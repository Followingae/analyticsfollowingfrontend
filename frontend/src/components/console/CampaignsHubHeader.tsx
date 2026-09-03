'use client'

/**
 * Campaigns hub — everything we are delivering.
 *
 * Four screens already existed for work in flight: the campaign list, the app's own
 * campaigns, the production board and the client reports. They were four sidebar entries,
 * so nobody could see that they are four views of one thing. This header makes them tabs of
 * one destination and leaves each page's body exactly as it was.
 *
 * On the first tab it also draws the pipeline, because the honest complaint was "I cannot
 * tell how many stages a piece of work has". The stages are the ones the code actually
 * runs — an opportunity is logged, creators are sourced, a proposal goes out, paperwork is
 * signed and the advance lands, the work goes live, the report is shared, the invoice is
 * paid. Each cell is a door to the screen where that stage is worked.
 *
 * Every number here comes from an endpoint that already exists. Where a stage has no
 * endpoint to count it, the stage is still drawn — with no number rather than a made-up one.
 */
import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import { Hub, type HubTab } from '@/components/console/Hub'
import { Panel } from '@/components/console/primitives'

const TABS: HubTab[] = [
  { label: 'All campaigns', href: '/work/campaigns', module: 'campaigns' },
  { label: 'App campaigns', href: '/work/fa/campaigns', module: 'fa' },
  { label: 'Production', href: '/ops/campaigns', module: 'operations' },
  { label: 'Reports', href: '/work/report-campaigns', module: 'campaigns' },
]

type Counts = {
  opportunity: number | null
  sourcing: number | null
  proposal: number | null
  paperwork: number | null
  live: number | null
  report: number | null
  paid: number | null
}

const EMPTY: Counts = {
  opportunity: null, sourcing: null, proposal: null, paperwork: null,
  live: null, report: null, paid: null,
}

type Stage = {
  key: keyof Counts
  label: string
  /** What sitting at this stage means, in the words used in the room. */
  hint: string
  href: string
  module: AdminModule
}

const STAGES: Stage[] = [
  { key: 'opportunity', label: 'Opportunity', hint: 'Talking, nothing started', href: '/work/brands', module: 'clients' },
  { key: 'sourcing',    label: 'Sourcing',    hint: 'Finding the creators',    href: '/work/areas', module: 'influencers' },
  { key: 'proposal',    label: 'Proposal',    hint: 'With the client',         href: '/work/proposals', module: 'proposals' },
  { key: 'paperwork',   label: 'Paperwork',   hint: 'Agreement and advance',   href: '/work/brands', module: 'clients' },
  { key: 'live',        label: 'Live',        hint: 'Being delivered now',     href: '/ops/campaigns', module: 'operations' },
  { key: 'report',      label: 'Report',      hint: 'Measured and shared',     href: '/work/report-campaigns', module: 'campaigns' },
  /* The cell counts UNPAID invoices, and it was captioned "Paid", which reads backwards:
     the bigger the number the worse the news. */
  { key: 'paid',        label: 'Unpaid',      hint: 'Invoiced, not settled',   href: '/work/brands', module: 'clients' },
]

const jsonOf = async (res: Response) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status))))
const value = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null)
const sum = (rows: any[], field: string) => rows.reduce((n, b) => n + (Number(b?.[field]) || 0), 0)

function StageStrip() {
  const router = useRouter()
  const { can, loading: gateLoading } = useAdminAccess()
  const [counts, setCounts] = React.useState<Counts>(EMPTY)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    const get = (path: string) => fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`).then(jsonOf)

    // One panel must never take the page down with it, so each source is allowed to fail
    // on its own and simply leaves its stage without a number.
    Promise.allSettled([
      get('/api/v1/admin/brands/heartbeat'),
      // Areas, not the retired sourcing rounds. `open_rounds` on the heartbeat already
      // counts a brand's live areas, so this second call only sharpens it with areas that
      // belong to no brand yet.
      get('/api/v1/admin/imd-lists?kind=client'),
      get('/api/v1/admin/proposals/stats'),
      get('/api/v1/admin/report-campaigns'),
    ]).then(([hb, areas, proposals, reports]) => {
      if (!active) return

      const brands: any[] = value(hb)?.data?.brands ?? []
      const haveBrands = value(hb) !== null

      // A brand nobody has started work on yet: logged, but no area, no proposal, no
      // paperwork and nothing live. That is exactly what "opportunity" means here.
      const opportunity = haveBrands
        ? brands.filter(b => !b.live_campaigns && !b.open_rounds && !b.proposals_out && !b.agreements_out).length
        : null

      const areaItems = value(areas)?.data?.lists
      const stats = value(proposals)?.data
      const reportRows = value(reports)?.data?.campaigns

      // Unpaid invoice counts are stripped from the heartbeat for anyone who may not see
      // client money. Absent field means "not for you", not zero — so leave it blank.
      const paidVisible = haveBrands && brands.some(b => 'unpaid_invoices' in b)

      setCounts({
        opportunity,
        sourcing: Array.isArray(areaItems)
                  ? areaItems.filter((a: any) => !a.locked_at && !a.archived_at).length
                  : haveBrands ? sum(brands, 'open_rounds') : null,
        proposal: typeof stats?.active_proposals === 'number' ? stats.active_proposals
                  : haveBrands ? sum(brands, 'proposals_out') : null,
        paperwork: haveBrands ? sum(brands, 'agreements_out') : null,
        live: haveBrands ? sum(brands, 'live_campaigns') : null,
        report: Array.isArray(reportRows) ? reportRows.length : null,
        paid: paidVisible ? sum(brands, 'unpaid_invoices') : null,
      })
    }).finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  return (
    <Panel
      title="Where the work is"
      description="Start to paid. Open a stage to work on it."
      flush
    >
      {/* Seven bordered tiles, inside a Panel that already has an edge, on a console whose
          rule is that a band of figures is grouped by the space around it and not by a
          border each. The borders come off and the chevrons carry the sequence, which is the
          only thing the boxes were saying that the row itself did not. */}
      <div className="flex gap-ds-3 overflow-x-auto px-6 pb-6 pt-1">
        {STAGES.map((s, i) => {
          const n = counts[s.key]
          const open = !gateLoading && can(s.module)
          return (
            <React.Fragment key={s.key}>
              {i > 0 && (
                <ChevronRight className="mt-6 h-4 w-4 flex-none text-muted-foreground/40" aria-hidden />
              )}
              <button
                type="button"
                disabled={!open}
                onClick={() => open && router.push(s.href)}
                className={cn(
                  'min-w-[112px] flex-1 rounded-ds-lg px-3 py-3 text-left transition-colors',
                  open ? 'hover:bg-black/[0.035] dark:hover:bg-white/[0.05]' : 'cursor-default',
                )}
              >
                <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums">
                  {loading ? <span className="text-muted-foreground/40">·</span>
                   : n === null ? <span className="text-muted-foreground/40">—</span>
                   : n}
                </p>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{s.hint}</p>
              </button>
            </React.Fragment>
          )
        })}
      </div>
    </Panel>
  )
}

/**
 * Drop this at the top of a campaigns screen. `action` is that screen's own main button,
 * which moves up beside the title so the page keeps one heading instead of two.
 */
export function CampaignsHubHeader({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() || ''
  // The list of everything is the only place the pipeline belongs; the other tabs are
  // already inside one stage.
  const onAllCampaigns = pathname === '/work/campaigns' || pathname === '/superadmin/campaigns'

  return (
    <Hub
      title="Campaigns"
      /* The old sub listed the four tabs that are drawn immediately beneath it. */
      sub="Everything we are delivering."
      tabs={TABS}
      action={action}
    >
      {onAllCampaigns ? <StageStrip /> : null}
    </Hub>
  )
}
