'use client'

/**
 * Today: the landing screen for everyone on the team.
 *
 * Drawn by TeamHome, in the client home's style (founder, 23 Nov 2026: "we have beautiful
 * client dashboards, i want similar for team"). The old layout lived here until everything it
 * did was in TeamHome (founder: "why its still reachable???? ... ensure new is complete
 * per-role"), and was then deleted: search, refresh, the role's one action, the queue with
 * show-all and the honest "showing N of M", each row's sequence and second actions, the
 * target ring, where the work stands, how work moves across the company, and the shortcuts.
 *
 * This page only loads. `/api/v1/admin/today` decides the content per role and
 * `/api/v1/admin/today/badges` the counts on the shortcuts. A failed load is said as a
 * failure, never drawn as an empty day.
 */
import { useEffect, useState } from 'react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { TeamHome } from '@/components/console/TeamHome'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { shortName } from '@/lib/destinations'

/**
 * The one action each role came here to do. The NOUN comes from `destinations.ts`, the single
 * register of what each screen is called, unless a label is given.
 */
const PRIMARY: Record<string, { verb?: string; label?: string; href: string }> = {
  leadership: { href: '/work/approvals' },
  // A talent manager's whole job here is finding people, and adding costs nothing.
  talent: { verb: 'Add', href: '/work/influencers?new=1' },
  // The clients list holds no owner filter, so this opens everybody's book.
  account: { href: '/work/clients' },
  // Her work is the Sales pipeline, so her one action is a new brand there (it opens with its
  // first deal). A brand becomes a client from inside the pipeline (founder, 23 Nov 2026).
  business_development: { label: 'New deal', href: '/work/sales?new=1' },
}

function primaryFor(role: string): { label: string; href: string } | null {
  const p = PRIMARY[role]
  if (!p) return null
  const label = p.label ?? (p.verb ? `${p.verb} ${shortName(p.href).toLowerCase()}` : shortName(p.href))
  return { label, href: p.href }
}

export default function Today() {
  const { user } = useEnhancedAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      setData((await res.json()).data)
      setFailed(false)
    } catch (e) {
      setFailed(true)
      toast.error(e instanceof Error ? e.message : 'Could not load your day')
    } finally { setLoading(false); setRefreshing(false) }
  }

  // The bubbles on the shortcuts. A missing badge means no bubble, never a wrong one.
  const loadBadges = async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/badges`)
      const json = await res.json()
      setBadges(json?.data && typeof json.data === 'object' ? json.data : {})
    } catch { /* no bubbles rather than wrong bubbles */ }
  }

  useEffect(() => { load(); loadBadges() }, [])

  const first = (user?.full_name || user?.email || '').split(/[\s@]/)[0]
  const role: string = data?.role || data?.scope || 'leadership'

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="flex flex-col gap-6 p-1 sm:p-2">
          <Skeleton className="h-12 w-80 rounded-2xl" />
          <Skeleton className="h-[38dvh] w-full rounded-[20px]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[150px] rounded-[20px]" />)}
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  return (
    <SuperadminLayout>
      <TeamHome data={data} failed={failed || !data} firstName={first} badges={badges}
                refreshing={refreshing} primary={primaryFor(role)}
                onRefresh={() => { load(true); loadBadges() }} />
    </SuperadminLayout>
  )
}
