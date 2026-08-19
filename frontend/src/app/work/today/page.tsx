'use client'

/**
 * Today — the landing screen.
 *
 * Four numbers that say where the company stands, then a short list of things with your name
 * on them, then what is in flight. Same shape for everyone; the contents and the numbers come
 * from your role, and the money figures simply are not sent to a role that may not see them.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Aed, Empty, PageHead, Panel, Row, Stat, StatGrid, type Tone } from '@/components/console/primitives'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const dayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** Big money is read at a glance, so it is shortened; small money is read exactly. */
const aed = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 10_000 ? `${Math.round(n / 1000)}K`
  : Math.round(n).toLocaleString()

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
    return (
      <SuperadminLayout>
        <div className="space-y-8">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[116px]" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[280px]" /><Skeleton className="h-[280px]" />
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  const headline = data?.headline || []
  const needs = data?.needs || []
  const moving = data?.moving || []

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title={`${greeting()}${first ? `, ${first}` : ''}`}
          sub={`${dayLabel()} · ${needs.length ? `${needs.length} thing${needs.length === 1 ? '' : 's'} waiting on you` : 'nothing is waiting on you'}`}
          action={
            <Button
              onClick={() => router.push('/work/influencers/add')}
              className="rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Add creators
            </Button>
          }
        />

        {headline.length > 0 && (
          <StatGrid>
            {headline.map((s: any) => (
              <Stat
                key={s.label}
                label={s.label}
                value={s.format === 'aed' ? <Aed>{aed(Number(s.value) || 0)}</Aed> : (s.value ?? 0)}
                hint={s.hint}
                tone={(s.tone || 'neutral') as Tone}
                onClick={s.href ? () => router.push(s.href) : undefined}
              />
            ))}
          </StatGrid>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel
            title="Needs you"
            description={needs.length === 0 ? 'Nothing waiting' : 'Decisions and work with your name on them'}
            action={needs.length > 0 ? <Badge>{needs.length}</Badge> : undefined}
            flush
          >
            {needs.map((n: any, i: number) => (
              <Row
                key={i}
                tone={n.urgency === 'high' ? 'bad' : 'warn'}
                title={n.title}
                meta={n.detail}
                right={n.href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : undefined}
                onClick={n.href ? () => router.push(n.href) : undefined}
              />
            ))}
            {needs.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                <p className="text-sm font-medium">You are clear</p>
                <p className="text-xs text-muted-foreground">
                  Nothing is waiting on a decision from you.
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Moving" description="What is in flight right now" flush>
            {moving.map((m: any, i: number) => (
              <Row
                key={i}
                tone="info"
                title={m.title}
                meta={m.detail}
                right={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
                onClick={m.href ? () => router.push(m.href) : undefined}
              />
            ))}
            {moving.length === 0 && <Empty>Nothing in flight.</Empty>}
          </Panel>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['Creators', '/work/influencers'],
            ['Sourcing', '/work/sourcing'],
            ['Brands', '/work/brands'],
            ['Coverage', '/work/coverage'],
            ['Goals', '/work/goals'],
          ].map(([label, href]) => (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className="rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] font-medium
                         text-muted-foreground transition-colors hover:text-foreground
                         dark:border-white/[0.07] dark:bg-neutral-900/70"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </SuperadminLayout>
  )
}
