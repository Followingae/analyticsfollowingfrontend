'use client'

/**
 * Today — the landing screen.
 *
 * Not a dashboard of totals. A short list of things with your name on them, then what is in
 * flight. Same shape for everyone; the contents come from your role.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const dayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export default function TodayPage() {
  const router = useRouter()
  const { user } = useEnhancedAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
        setData((await res.json()).data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not load Today')
      } finally { setLoading(false) }
    })()
  }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]

  if (loading) {
    return <SuperadminLayout><div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />Loading…</div></SuperadminLayout>
  }

  const needs = data?.needs || []
  const moving = data?.moving || []

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}{first ? `, ${first}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{dayLabel()}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Needs you</CardTitle>
                <CardDescription>
                  {needs.length === 0 ? 'Nothing waiting' : 'Decisions and work with your name on them'}
                </CardDescription>
              </div>
              {needs.length > 0 && <Badge>{needs.length}</Badge>}
            </CardHeader>
            <CardContent className="space-y-0 px-0">
              {needs.map((n: any, i: number) => (
                <button key={i}
                  onClick={() => n.href && router.push(n.href)}
                  className="flex w-full items-center gap-3 border-t px-6 py-3.5 text-left first:border-t-0 hover:bg-muted/40">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                    n.urgency === 'high' ? 'bg-destructive' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.detail}</p>
                  </div>
                  {n.href && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
              ))}
              {needs.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                  <p className="text-sm font-medium">You are clear</p>
                  <p className="text-xs text-muted-foreground">
                    Nothing is waiting on a decision from you.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moving</CardTitle>
              <CardDescription>What is in flight right now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-0">
              {moving.map((m: any, i: number) => (
                <button key={i}
                  onClick={() => m.href && router.push(m.href)}
                  className="flex w-full items-center gap-3 border-t px-6 py-3.5 text-left first:border-t-0 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {moving.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Nothing in flight.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['Creators', '/superadmin/influencers'],
            ['Sourcing', '/superadmin/sourcing'],
            ['Brands', '/superadmin/brands'],
            ['Goals', '/superadmin/goals'],
          ].map(([label, href]) => (
            <Button key={href} variant="outline" size="sm" onClick={() => router.push(href)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </SuperadminLayout>
  )
}
