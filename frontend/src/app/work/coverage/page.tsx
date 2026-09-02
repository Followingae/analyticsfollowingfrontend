'use client'

/**
 * Coverage — category against market, and what to go and research next.
 *
 * A cell counts a creator as covered only when we hold a usable cost for them, because a
 * category full of names with no rate is not coverage, it just looks like it. On a day with
 * no open round, the palest cell is the answer to "what should I be doing".
 *
 * The bar chart and the grid answer different questions and both are needed: the chart ranks
 * categories against each other, the grid says which market inside a category is thin. One
 * without the other sends someone researching the wrong gap.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, Cell as RCell, XAxis, YAxis } from 'recharts'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Coins, Database, MapPin, TimerReset } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, PageHead, Panel, Row, Stat, StatGrid } from '@/components/console/primitives'
import { CreatorsHubHeader } from '@/components/console/CreatorsHubHeader'

interface Cell { category: string; market: string; held: number; costed: number
                 sellable: number; stale: number }

const CHART: ChartConfig = {
  costed: { label: 'Quotable', color: 'var(--primary)' },
  // The weakest categories are the point of the screen, so they are greyed rather than
  // left to blend in with the strong ones.
  thin: { label: 'Thin', color: 'color-mix(in oklab, var(--muted-foreground) 35%, transparent)' },
}

export default function CoveragePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<Cell | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/influencers/coverage`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load this page')
      } finally { setLoading(false) }
    })()
  }, [])

  const cells: Cell[] = useMemo(() => data?.cells || [], [data])
  const categories: string[] = useMemo(
    () => (data?.categories || []).filter((c: string) => c !== 'uncategorised'), [data])
  const markets: string[] = useMemo(
    () => (data?.markets || []).filter((m: string) => m !== 'unknown'), [data])

  // Ranked, so the chart reads as a league table rather than an alphabet.
  const byCategory = useMemo(() => categories.map(cat => {
    const mine = cells.filter(c => c.category === cat)
    return {
      category: cat,
      costed: mine.reduce((a, c) => a + c.costed, 0),
      held: mine.reduce((a, c) => a + c.held, 0),
    }
  }).sort((a, b) => b.costed - a.costed), [categories, cells])

  if (loading) {
    return (
      <SuperadminLayout>
        {/* The band this stands in for no longer draws a box per figure, so neither does the
            skeleton: label, number and hint at the gap the real StatGrid uses, rather than
            four filled tiles promising an edge the loaded screen never draws. */}
        <div className="space-y-ds-5">
          <Skeleton className="h-9 w-48 rounded-ds-lg" />
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-ds-2 px-ds-2 py-ds-2">
                <Skeleton className="h-3 w-24 rounded-ds-sm" />
                <Skeleton className="h-9 w-20 rounded-ds-sm" />
                <Skeleton className="h-3 w-32 rounded-ds-sm" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[320px] rounded-ds-2xl" />
        </div>
      </SuperadminLayout>
    )
  }
  if (!data) {
    return <SuperadminLayout><p className="text-sm text-muted-foreground">Nothing to show.</p></SuperadminLayout>
  }

  const at = (c: string, m: string) => cells.find(x => x.category === c && x.market === m)
  // Shade on costed, not held — coverage means "could actually be quoted".
  const max = Math.max(1, ...cells.filter(c => c.market !== 'unknown').map(c => c.costed))
  const shade = (n: number) => n === 0 ? 0 : Math.min(0.14 + (n / max) * 0.86, 1)

  const uncategorised = cells.filter(c => c.category === 'uncategorised').reduce((a, c) => a + c.held, 0)
  const noMarket = cells.filter(c => c.market === 'unknown').reduce((a, c) => a + c.held, 0)

  /**
   * "uncategorised" and "unknown" are words this screen PRINTS, not values anybody holds.
   * The server COALESCEs a missing category or country into them so the grid has a row and
   * a column heading; passing them back as filter values asked the database for a creator
   * literally tagged "unknown" and returned nothing, over 319 real people with no market
   * and 233 with no category. `no_value` is the server's own token for the absence, sent
   * with the payload so the two halves cannot drift apart again.
   */
  const NO_VALUE = data.no_value || '__none__'
  const asFilterValue = (label: string) =>
    label === 'uncategorised' || label === 'unknown' ? NO_VALUE : label
  const cellHref = (category: string, market: string) =>
    `/work/influencers?categories=${encodeURIComponent(asFilterValue(category))}` +
    `&countries=${encodeURIComponent(asFilterValue(market))}`
  /**
   * A total that never arrived is a dash, not a zero.
   *
   * These read `data.totals?.x ?? 0`, so a response missing its totals block printed "0 in
   * the database, 0 quotable today" — a page-wide claim that we hold nothing, made on the
   * strength of a request that did not answer. The grid below is computed from `cells` and
   * is unaffected; only the four headline figures were guessing.
   */
  const held = data.totals?.held ?? null
  const costed = data.totals?.costed ?? null
  const stale = data.totals?.stale ?? null
  const quotablePct = held == null || costed == null ? null
    : held ? Math.round((costed / held) * 100) : 0

  return (
    <SuperadminLayout>
      <CreatorsHubHeader />
      <div className="space-y-ds-5">
        <PageHead
          title="Where we're thin"
          sub="Where we are strong, and where to research next. A creator counts only once we hold a cost for them. A name with no rate cannot be quoted."
          /* The hub header directly above now carries "Add or import creators" as its primary
             button, so the same button here would be the second one on the screen. */
        />

        <StatGrid>
          <Stat label="In the database" value={held ?? '—'} icon={Database}
                hint={`${categories.length} categories · ${markets.length} markets`}
                onClick={() => router.push('/work/influencers')} />
          <Stat label="Quotable today" value={costed ?? '—'}
                tone={costed == null ? 'neutral' : 'good'} icon={Coins}
                hint={quotablePct == null
                  ? 'The share with a usable cost did not come back'
                  : `${quotablePct}% of the database has a usable cost`}
                onClick={() => router.push('/work/influencers?has_pricing=true')} />
          <Stat label="Rates over six months old" value={stale ?? '—'}
                tone={stale == null ? 'neutral' : stale ? 'warn' : 'neutral'}
                icon={TimerReset} hint="Worth re-checking before they go in a proposal"
                onClick={() => router.push('/work/influencers?has_pricing=true')} />
          <Stat label="Missing a market" value={noMarket} tone={noMarket ? 'warn' : 'neutral'}
                icon={MapPin} hint="Market is the first thing a client asks about"
                onClick={() => router.push(`/work/influencers?countries=${encodeURIComponent(NO_VALUE)}`)} />
        </StatGrid>

        <Panel
          title="Strength by category"
          description="Creators we could quote today, strongest first"
        >
          <ChartContainer config={CHART} className="h-[260px] w-full">
            <BarChart data={byCategory} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={10}
                     className="text-xs capitalize" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}
                     className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent labelClassName="capitalize" />} />
              <Bar dataKey="costed" radius={[4, 4, 0, 0]} maxBarSize={54}>
                {byCategory.map(c => (
                  // The weakest categories are the point of the screen, so they are the ones
                  // that get flagged rather than blending into the rest of the bars.
                  <RCell key={c.category}
                         fill={c.costed <= Math.max(1, max * 0.25)
                           ? 'var(--color-thin)'
                           : 'var(--color-costed)'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel
          title="Category against market"
          description="Darker is stronger. Hover a cell for the detail; the pale ones are the backlog."
        >
          <div className="overflow-x-auto pb-1">
            <table className="border-separate" style={{ borderSpacing: '6px' }}>
              <thead>
                <tr>
                  <th className="w-36" />
                  {markets.map(m => (
                    <th key={m} className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat}>
                    <td className="pr-4 text-sm font-medium capitalize">{cat}</td>
                    {markets.map(m => {
                      const c = at(cat, m)
                      const n = c?.costed ?? 0
                      const a = shade(n)
                      const on = hover?.category === cat && hover?.market === m
                      return (
                        <td key={m}>
                          <div
                            onMouseEnter={() => c && setHover(c)}
                            onMouseLeave={() => setHover(null)}
                            className={`flex h-14 w-28 cursor-pointer flex-col items-center justify-center rounded-ds-lg text-sm font-semibold tabular-nums transition-all ${
                              on ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}
                            style={{
                              backgroundColor: n === 0
                                ? 'var(--muted)'
                                : `color-mix(in srgb, var(--primary) ${a * 100}%, transparent)`,
                              color: a > 0.55 ? 'var(--primary-foreground)' : undefined,
                            }}
                            onClick={() => router.push(cellHref(cat, m))}
                            role="button"
                            tabIndex={0}
                            title={`${cat} · ${m}: open these creators`}
                          >
                            {n || '—'}
                            {!!c?.stale && (
                              <span className={`text-[10px] font-medium ${
                                a > 0.55 ? 'opacity-80' : 'text-[var(--tone-warn-ink)]'}`}>
                                {c.stale} stale
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-ds-3 flex min-h-[1.25rem] items-center gap-ds-3 border-t pt-ds-3 text-xs text-muted-foreground">
            {hover ? (
              <span>
                <span className="font-medium capitalize text-foreground">{hover.category} · {hover.market}</span>
                {': '}{hover.costed} quotable of {hover.held} held
                {hover.stale > 0 && `, ${hover.stale} rates going stale`}
              </span>
            ) : (
              <span>Shaded by creators we could actually quote, not by how many names we hold.</span>
            )}
          </div>
        </Panel>

        <div className="grid items-start gap-ds-4 lg:grid-cols-2">
          <Panel title="Research next" description="The thinnest cells, weakest first" flush>
            {(data.gaps || []).map((g: any, i: number) => (
              <Row
                key={i}
                tone={g.costed === 0 ? 'bad' : 'warn'}
                title={<span className="capitalize">{g.category} · {g.market}</span>}
                meta={`${g.costed} quotable of ${g.held} held`}
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={() => router.push(cellHref(g.category, g.market))}
              />
            ))}
            {(data.gaps || []).length === 0 && <Empty>No thin cells, coverage is even.</Empty>}
          </Panel>

          <Panel title="Data to tidy" description="Cheap wins that make everything else sharper" flush>
            <Row
              tone={uncategorised ? 'warn' : 'good'}
              title={`${uncategorised} creators have no category`}
              meta="They cannot appear in any coverage cell, or in a category filter"
              right={<Badge variant="outline">{uncategorised ? 'Fix' : 'Clear'}</Badge>}
              onClick={() => router.push(
                `/work/influencers?categories=${encodeURIComponent(NO_VALUE)}`)}
            />
            <Row
              tone={noMarket ? 'warn' : 'good'}
              title={`${noMarket} creators have no market`}
              meta="Market is the first thing a client asks about"
              right={<Badge variant="outline">{noMarket ? 'Fix' : 'Clear'}</Badge>}
              onClick={() => router.push(
                `/work/influencers?countries=${encodeURIComponent(NO_VALUE)}`)}
            />
            {/* "Clear" is a claim, and an absent figure cannot make it — so when the count
                did not come back the row says that instead of reporting all-clear. */}
            <Row
              tone={stale == null ? 'neutral' : stale ? 'warn' : 'good'}
              title={stale == null
                ? 'How many rates are going stale did not come back'
                : `${stale} rates are over six months old`}
              meta="Worth re-checking before quoting"
              right={<Badge variant="outline">
                {stale == null ? 'Unknown' : stale ? 'Refresh' : 'Clear'}
              </Badge>}
              onClick={() => router.push('/work/influencers?has_pricing=true')}
            />
          </Panel>
        </div>
      </div>
    </SuperadminLayout>
  )
}
