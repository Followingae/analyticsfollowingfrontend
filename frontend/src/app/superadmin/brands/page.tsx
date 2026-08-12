'use client'

/**
 * Brand heartbeat.
 *
 * Two facts decide everything on this screen: how long a client has been silent, and whose
 * turn it is. Deals rarely die from a decision — they die because it was nobody's turn and
 * nobody noticed.
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

const HEALTH = {
  healthy: { label: 'Healthy', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  quiet:   { label: 'Going quiet', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  at_risk: { label: 'At risk', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  unknown: { label: 'No activity', cls: 'bg-muted text-muted-foreground' },
}

const quiet = (d: number | null) =>
  d === null ? 'never' : d === 0 ? 'today' : d === 1 ? '1 day' : `${d} days`

export default function BrandsPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'attention'>('all')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/brands/heartbeat`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load brands')
      } finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }
  if (!data) return <SuperadminLayout><p className="text-sm">Nothing to show.</p></SuperadminLayout>

  const s = data.summary || {}
  const brands = (data.brands || []).filter((b: any) =>
    tab === 'all' ? true : b.health !== 'healthy')

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            How long since anything moved, and who owes the next step.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Active clients', s.total, 'text-foreground'],
            ['Healthy', s.healthy, 'text-emerald-600'],
            ['Going quiet', s.quiet, 'text-amber-600'],
            ['At risk', s.at_risk, 'text-destructive'],
          ].map(([label, n, cls]) => (
            <Card key={label as string}><CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{label as string}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${cls as string}`}>
                {(n as number) ?? 0}
              </p>
            </CardContent></Card>
          ))}
        </div>

        <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
          {(['all', 'attention'] as const).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === k ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {k === 'all' ? 'All brands' : 'Needs attention'}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heartbeat</CardTitle>
            <CardDescription>Longest silence first</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 pb-2 text-left font-medium">Brand</th>
                    <th className="px-3 pb-2 text-left font-medium">Owner</th>
                    <th className="px-3 pb-2 text-left font-medium">Silent</th>
                    <th className="px-3 pb-2 text-left font-medium">Whose move</th>
                    <th className="px-3 pb-2 text-left font-medium">Open</th>
                    <th className="px-6 pb-2 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b: any) => {
                    const h = HEALTH[b.health as keyof typeof HEALTH] || HEALTH.unknown
                    const open: string[] = []
                    if (b.live_campaigns) open.push(`${b.live_campaigns} live`)
                    if (b.open_rounds) open.push(`${b.open_rounds} round${b.open_rounds === 1 ? '' : 's'}`)
                    if (b.awaiting_client_verdict) open.push(`${b.awaiting_client_verdict} awaiting verdict`)
                    if (b.agreements_out) open.push('agreement out')
                    if (b.unpaid_invoices) open.push(`${b.unpaid_invoices} unpaid`)
                    return (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-6 py-3">
                          <p className="font-medium">{b.name}</p>
                          {b.last_feedback && (
                            <p className="mt-0.5 max-w-md truncate text-xs italic text-muted-foreground">
                              “{b.last_feedback}”
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {b.account_manager_email || <span className="italic">unassigned</span>}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={h.cls}>{quiet(b.days_quiet)}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          {b.whose_move === 'client'
                            ? <Badge variant="outline">Client</Badge>
                            : <Badge>Us</Badge>}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {open.length ? open.join(' · ') : '—'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button size="sm" variant="ghost"
                                  onClick={() => router.push(`/superadmin/clients/${b.id}`)}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {brands.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Nothing here.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  )
}
