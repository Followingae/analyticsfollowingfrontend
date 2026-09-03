'use client'

/**
 * Coverage — category against market, and what to go and research next.
 *
 * A cell counts a creator as covered only when we hold a usable cost for them, because a
 * category full of names with no rate is not coverage, it just looks like it. On a day with
 * no open round, the palest cell is the answer to "what should I be doing".
 *
 * The chart and the grid used to be two panels, and they were one dataset: `byCategory` is
 * the row sums of the grid sitting directly beneath it. Ranking the grid's rows by strength
 * and putting a bar on each one carries the league table INSIDE the thing it was ranking, so
 * the screen still answers both questions - which category is strongest, and which market
 * inside it is thin - without asking anyone to hold two pictures at once.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Coins, Database, TimerReset } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Empty, MiniBar, PageHead, Panel, Row, Stat, StatGrid } from '@/components/console/primitives'
import { CreatorsHubHeader } from '@/components/console/CreatorsHubHeader'

interface Cell { category: string; market: string; held: number; costed: number
                 quotable: number; sellable: number; stale: number; stale_unknown: number }

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
          <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(i => (
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

  /**
   * These two are reduced out of `cells`, so a payload that arrived without its grid made
   * them 0, and 0 here is not a quiet fact: it renders an explicit all clear, a green dot
   * and a badge reading "Clear" against "0 creators have no category". The four headline
   * totals were taught to say "—" and these two, which make the louder claim, were not.
   */
  const hasCells = Array.isArray(data.cells)
  const uncategorised = hasCells
    ? cells.filter(c => c.category === 'uncategorised').reduce((a, c) => a + c.held, 0)
    : null
  const noMarket = hasCells
    ? cells.filter(c => c.market === 'unknown').reduce((a, c) => a + c.held, 0)
    : null
  /* An absent `gaps` key is not an even spread. */
  const gaps: any[] | null = Array.isArray(data.gaps) ? data.gaps : null

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
  /* Quotable is a SELL price, because that is the only thing the proposal picker enforces.
     This tile was showing the COST count, so it printed one number and opened a list of a
     different one. Costed keeps its own row further down, where it belongs: knowing what a
     creator charges us and being able to quote them are two separate pieces of work. */
  const quotable = data.totals?.quotable ?? null
  const stale = data.totals?.stale ?? null
  /* Rates whose age we do not know. Kept apart from `stale` so a zero can be read as "none
     are old" rather than as "we have never recorded when any of them were captured". */
  const staleUnknown = data.totals?.stale_unknown ?? null
  const releasedUnpriced = data.totals?.released_unpriced ?? null
  const quotablePct = held == null || quotable == null ? null
    : held ? Math.round((quotable / held) * 100) : 0

  return (
    <SuperadminLayout>
      <CreatorsHubHeader />
      <div className="space-y-ds-5">
        <PageHead
          title="Where we're thin"
          sub="A creator counts only once we hold a rate. A name without one cannot be quoted."
          /* The hub header directly above now carries "Add or import creators" as its primary
             button, so the same button here would be the second one on the screen. */
        />

        {/* Three figures, not four. "Missing a market" was the fourth, and it was also the
            second row of "Data to tidy" further down: the same count, the same link and the
            same sentence printed twice on one screen. It is a tidy job, not a headline, so
            it lives in exactly one place now. */}
        <StatGrid cols={3}>
          <Stat label="In the database" value={held ?? '—'} icon={Database}
                hint={`${categories.length} categories · ${markets.length} markets`}
                onClick={() => router.push('/work/influencers')} />
          <Stat label="Quotable today" value={quotable ?? '—'}
                tone={quotable == null ? 'neutral' : 'good'} icon={Coins}
                hint={quotablePct == null
                  ? 'The share we can put in a proposal did not come back'
                  : `${quotablePct}% have a sell price`
                    + (costed != null ? ` · ${costed} have a cost researched` : '')}
                onClick={() => router.push('/work/influencers?pricing=quotable')} />
          {/* An age nobody has recorded is not an age of zero. Until rates start carrying a
              capture date this reads "not recorded yet" rather than reporting all-clear on
              a column that has never been written. */}
          <Stat label="Rates going stale"
                value={staleUnknown ? 'Not recorded' : stale ?? '—'}
                tone={stale == null ? 'neutral' : (stale || staleUnknown) ? 'warn' : 'neutral'}
                icon={TimerReset}
                hint={staleUnknown
                  ? `${staleUnknown} rates carry no capture date, so their age is unknown`
                  : 'Over six months old. Re-check before quoting'}
                onClick={() => router.push('/work/influencers?stale_costs=true')} />
        </StatGrid>

        {/* The answer first. This list is what the screen is FOR, and it used to sit at the
            very bottom, underneath two large pictures of the same dataset. */}
        <Panel title="Research next" description="Thinnest first" flush>
          {(gaps ?? []).map((g: any, i: number) => (
            <Row
              key={i}
              tone={g.costed === 0 ? 'bad' : 'warn'}
              title={<span className="capitalize">{g.category} · {g.market}</span>}
              meta={`${g.costed} quotable of ${g.held} held`}
              right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
              onClick={() => router.push(cellHref(g.category, g.market))}
            />
          ))}
          {gaps == null && <Empty>The gap list did not come back.</Empty>}
          {gaps?.length === 0 && <Empty>Every cell has quotable creators.</Empty>}
        </Panel>

        {/* The bar chart that used to sit above this grid was the grid's own row sums: one
            dataset, drawn twice, under two headings. Ranking the rows by strength and giving
            each one a bar puts the league table INSIDE the thing it was ranking, so the
            screen answers "which category is strongest" and "which market inside it is thin"
            in one object instead of asking the reader to hold two. */}
        <Panel
          title="Category against market"
          description="Ranked strongest first. Darker is stronger, and the pale cells are the backlog."
        >
          <div className="overflow-x-auto pb-1">
            <table className="border-separate" style={{ borderSpacing: '6px' }}>
              <thead>
                <tr>
                  <th className="w-36" />
                  <th className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Strength
                  </th>
                  {markets.map(m => (
                    <th key={m} className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCategory.map(({ category: cat, costed: catCosted, held: catHeld }) => (
                  <tr key={cat}>
                    <td className="pr-4 text-sm font-medium capitalize">{cat}</td>
                    {/* The bar the chart used to draw, on the row it belongs to. The fraction
                        is what matters here, not the absolute: "9 of 12 we hold". */}
                    <td className="pr-4">
                      <MiniBar value={catCosted} max={Math.max(1, catHeld)}
                               tone={catCosted === 0 ? 'bad'
                                 : catCosted <= Math.max(1, max * 0.25) ? 'warn' : 'good'} />
                    </td>
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
              <span>Shaded by who we could quote, not by how many names we hold.</span>
            )}
          </div>
        </Panel>

        <div className="grid items-start gap-ds-4">
          <Panel title="Data to tidy" description="Each one blocks a filter" flush>
            {/* "Clear" is a claim, and a count reduced out of a grid that never arrived
                cannot make it. Absent says so; a real zero still reads as clear. */}
            <Row
              tone={uncategorised == null ? 'neutral' : uncategorised ? 'warn' : 'good'}
              title={uncategorised == null
                ? 'How many creators have no category did not come back'
                : `${uncategorised} creators have no category`}
              meta="They appear in no cell above"
              right={<Badge variant="outline">
                {uncategorised == null ? 'Unknown' : uncategorised ? 'Fix' : 'Clear'}
              </Badge>}
              onClick={() => router.push(
                `/work/influencers?categories=${encodeURIComponent(NO_VALUE)}`)}
            />
            <Row
              tone={noMarket == null ? 'neutral' : noMarket ? 'warn' : 'good'}
              title={noMarket == null
                ? 'How many creators have no market did not come back'
                : `${noMarket} creators have no market`}
              meta="Market is the first thing a client asks about"
              right={<Badge variant="outline">
                {noMarket == null ? 'Unknown' : noMarket ? 'Fix' : 'Clear'}
              </Badge>}
              onClick={() => router.push(
                `/work/influencers?countries=${encodeURIComponent(NO_VALUE)}`)}
            />
            <Row
              tone={stale == null ? 'neutral' : (stale || staleUnknown) ? 'warn' : 'good'}
              title={stale == null
                ? 'How many rates are going stale did not come back'
                : staleUnknown
                  ? `${staleUnknown} rates carry no capture date, so we cannot say how old they are`
                  : `${stale} rates are over six months old`}
              meta="Worth re-checking before quoting"
              right={<Badge variant="outline">
                {stale == null ? 'Unknown' : staleUnknown ? 'Not recorded' : stale ? 'Refresh' : 'Clear'}
              </Badge>}
              onClick={() => router.push(
                staleUnknown ? '/work/influencers?pricing=costed' : '/work/influencers?stale_costs=true')}
            />
            {/* Released but unpriceable. These read as active everywhere on the platform and
                are refused by the proposal picker the moment somebody tries to use them. */}
            {!!releasedUnpriced && (
              <Row
                tone="warn"
                title={`${releasedUnpriced} creators are live but have no sell price`}
                meta="The proposal picker refuses them"
                right={<Badge variant="outline">Price</Badge>}
                onClick={() => router.push('/work/influencers?status=active&pricing=unquotable')}
              />
            )}
          </Panel>
        </div>
      </div>
    </SuperadminLayout>
  )
}
