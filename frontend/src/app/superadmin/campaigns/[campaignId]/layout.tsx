'use client'

/**
 * One campaign, one shell, its tabs.
 *
 * WHAT THIS REPLACED. A campaign was four sibling pages. Each loaded the campaign again for
 * itself, each carried its own "back to Campaign" button, and they sat in THREE different
 * layout wrappers between them: timeline in SuperadminLayout, the ladder in
 * AuthGuard + SuperAdminInterface, money in AuthGuard + SuperadminLayout. Moving from the
 * roster to the money was a full page load that threw away the campaign you were already
 * looking at, re-fetched it, and dropped you at the top of a screen with a different chrome.
 * `/work/campaigns/{id}` itself had no page at all: it was a redirect.
 *
 * Now the shell holds the campaign and the tabs, and only the panel underneath refetches.
 * The name stays on screen while you move, which is the entire point: a tab is a view of the
 * thing you are already holding, and a page load is a journey somewhere else.
 *
 * THE MONEY TAB IS NOT RENDERED FOR SOMEBODY WHO CANNOT OPEN IT. Shown-and-refused teaches
 * people that half the product is broken. `can_see_money` comes from the server's own scope,
 * not from a role string in the browser, because the co-founder's role is an ordinary 'user'
 * and her authority comes from staff_role. The money endpoints refuse everyone else anyway;
 * this only stops us drawing a door into a wall.
 *
 * A HEADER THAT FAILED TO LOAD IS NOT AN EMPTY HEADER. If the campaign cannot be read the
 * shell says so and still renders the tabs, because the tab you were trying to reach may
 * well work and a blank screen tells you nothing about which half is broken.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Hub, type HubTab } from '@/components/console/Hub'
import { Badge } from '@/components/ui/badge'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

type Header = {
  campaign: {
    id: string
    name: string | null
    brand_name: string | null
    status: string | null
    campaign_type: string | null
    start_date: string | null
    end_date: string | null
    client_display: string | null
  }
  can_see_money: boolean
  counts: { roster: number; posts_live: number; posts_waiting: number }
}

/** The campaign's state, in the words somebody would actually use for it. */
const STATUS: Record<string, string> = {
  draft: 'Not started',
  active: 'Running',
  paused: 'Paused',
  completed: 'Finished',
  cancelled: 'Cancelled',
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const campaignId = useParams().campaignId as string
  const [head, setHead] = useState<Header | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/campaigns/${campaignId}/header`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || 'Could not read the campaign')
      setHead(json.data)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { if (campaignId) void load() }, [campaignId, load])

  const base = `/work/campaigns/${campaignId}`
  const tabs: HubTab[] = [
    { label: 'Story', href: `${base}/timeline` },
    { label: 'Delivery', href: `${base}/ladder`, count: head?.counts?.roster || undefined },
    { label: 'Content', href: `${base}/content` },
    {
      label: 'Performance',
      href: `${base}/performance`,
      // The badge is what is WAITING on a decision, not what is live. A count that only ever
      // goes up is wallpaper; a count that means "somebody has to answer this" gets read.
      count: head?.counts?.posts_waiting || undefined,
    },
    { label: 'Links', href: `${base}/links` },
    // Not rendered at all unless the server says this person has the money scope.
    { label: 'Money', href: `${base}/money`, when: !!head?.can_see_money },
  ]

  const c = head?.campaign
  const client = c?.client_display || c?.brand_name || null
  const status = c?.status ? (STATUS[c.status] || c.status) : null

  return (
    <SuperadminLayout>
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-ds-caption text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening the campaign
        </div>
      ) : (
        <Hub
          title={c?.name || 'Campaign'}
          sub={[client, status].filter(Boolean).join(' · ') || undefined}
          tabs={tabs}
          action={c?.campaign_type ? (
            <Badge variant="outline" className="capitalize">
              {c.campaign_type.replace(/_/g, ' ')}
            </Badge>
          ) : undefined}
        >
          {failed && (
            <div className="mb-4 flex items-start gap-2 rounded-ds-xl border border-amber-200/70
                            bg-amber-50/40 px-4 py-3 text-ds-caption dark:border-amber-900/40
                            dark:bg-amber-950/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                We could not read this campaign&apos;s details. The tab below may still work.
              </span>
            </div>
          )}
          {children}
        </Hub>
      )}
    </SuperadminLayout>
  )
}
