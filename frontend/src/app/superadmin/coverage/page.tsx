'use client'

/**
 * Coverage — category against market, and what to go and research next.
 *
 * A cell counts a creator as covered only when we hold a usable cost for them, because a
 * category full of names with no rate is not coverage, it just looks like it. On a day with
 * no open round, the palest cell is the answer to "what should I be doing".
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

interface Cell { category: string; market: string; held: number; costed: number
                 sellable: number; stale: number }

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
        toast.error(e instanceof Error ? e.message : 'Could not load coverage')
      } finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }
  if (!data) return <SuperadminLayout><p className="text-sm">Nothing to show.</p></SuperadminLayout>

  const cells: Cell[] = data.cells || []
  const categories: string[] = (data.categories || []).filter((c: string) => c !== 'uncategorised')
  const markets: string[] = (data.markets || []).filter((m: string) => m !== 'unknown')
  const at = (c: string, m: string) => cells.find(x => x.category === c && x.market === m)

  // Shade on costed, not held — coverage means "could actually be quoted".
  const max = Math.max(1, ...cells.filter(c => c.market !== 'unknown').map(c => c.costed))
  const shade = (n: number) => n === 0 ? 0 : Math.min(0.12 + (n / max) * 0.88, 1)

  const uncategorised = cells.filter(c => c.category === 'uncategorised')
    .reduce((a, c) => a + c.held, 0)
  const noMarket = cells.filter(c => c.market === 'unknown').reduce((a, c) => a + c.held, 0)

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coverage</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Where we are strong, and where to research next. A creator counts only once we hold
            a cost for them.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['In the database', data.totals?.held, ''],
            ['With a usable cost', data.totals?.costed, 'text-emerald-600'],
            ['Rates over 6 months old', data.totals?.stale, 'text-amber-600'],
            ['No category set', uncategorised, 'text-amber-600'],
          ].map(([l, v, c]) => (
            <Card key={l as string}><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{l as string}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${c as string}`}>{(v as number) ?? 0}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category against market</CardTitle>
            <CardDescription>
              Darker is stronger. Hover a cell for the detail; pale cells are the backlog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="border-separate" style={{ borderSpacing: '4px' }}>
                <thead>
                  <tr>
                    <th className="w-32" />
                    {markets.map(m => (
                      <th key={m} className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat}>
                      <td className="pr-3 text-sm capitalize">{cat}</td>
                      {markets.map(m => {
                        const c = at(cat, m)
                        const n = c?.costed ?? 0
                        const a = shade(n)
                        return (
                          <td key={m}>
                            <div
                              onMouseEnter={() => c && setHover(c)}
                              onMouseLeave={() => setHover(null)}
                              className="flex h-12 w-24 items-center justify-center rounded-lg text-sm font-semibold transition"
                              style={{
                                backgroundColor: n === 0
                                  ? 'hsl(var(--muted))'
                                  : `color-mix(in srgb, hsl(var(--primary)) ${a * 100}%, transparent)`,
                                color: a > 0.55 ? 'hsl(var(--primary-foreground))' : undefined,
                              }}
                              title={`${cat} · ${m}`}
                            >
                              {n || '—'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex min-h-[1.25rem] items-center gap-3 text-xs text-muted-foreground">
              {hover ? (
                <span>
                  <span className="capitalize text-foreground">{hover.category} · {hover.market}</span>
                  {' — '}{hover.costed} with a cost, {hover.held} held
                  {hover.stale > 0 && `, ${hover.stale} rates going stale`}
                </span>
              ) : (
                <span>Shaded by creators we could actually quote.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Research next</CardTitle>
              <CardDescription>The thinnest cells, weakest first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-0">
              {(data.gaps || []).map((g: any, i: number) => (
                <div key={i} className="flex items-center gap-3 border-t px-6 py-3 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{g.category} · {g.market}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.costed} with a cost, {g.held} held
                    </p>
                  </div>
                  <Button size="sm" variant="ghost"
                          onClick={() => router.push('/superadmin/influencers')}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(data.gaps || []).length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No thin cells — coverage is even.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data to tidy</CardTitle>
              <CardDescription>Cheap wins that make everything else sharper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{uncategorised} creators have no category</p>
                  <p className="text-xs text-muted-foreground">
                    They cannot appear in any coverage cell, or in a category filter.
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600">Fix</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-3">
                <div>
                  <p className="text-sm font-medium">{noMarket} creators have no market</p>
                  <p className="text-xs text-muted-foreground">
                    Market is the first thing a client asks about.
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600">Fix</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-3">
                <div>
                  <p className="text-sm font-medium">
                    {data.totals?.stale ?? 0} rates are over six months old
                  </p>
                  <p className="text-xs text-muted-foreground">Worth re-checking before quoting.</p>
                </div>
                <Badge variant="outline">Refresh</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperadminLayout>
  )
}
