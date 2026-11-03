'use client'

/**
 * A hub: one destination, several jobs.
 *
 * The console had forty-four navigation entries, which is not a menu, it is a filing
 * cabinet. Almost all of them were not places: they were jobs done on one of six things.
 * A hub is that thing; the jobs are the screens under it.
 *
 * THE JOBS LIVE IN THE SIDEBAR NOW (2026-11-03).
 *
 * Each hub used to draw a row of tabs across the top of every one of its screens. The owner
 * asked for those to be sidebar submenus instead, so a hub's screens are listed once, under
 * the hub's own entry in the sidebar, and the screens themselves lose the row. The tab
 * DEFINITIONS still live with each hub header (`clientsTabs`, `creatorsTabs`, `campaignsTabs`,
 * `moneyTabs`) and the sidebar reads them from there, so the menu and
 * the hub can never disagree about what belongs to it or who may open it.
 *
 * `tabs` is still accepted, for a row that switches between the sections of ONE record (a
 * campaign's Story, Delivery, Content...) or a queue's own lanes, which are not places in the
 * menu. Two rules hold for it:
 *
 *   1. A tab is a route, not a component swap. The URL still says exactly where you are.
 *   2. A tab the viewer's role cannot open is not rendered at all, never shown-and-refused.
 *      The gate is the same `can(module)` the sidebar and the route guard use.
 */
import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import { shortName } from '@/lib/destinations'
import { PageHead } from './primitives'

export interface HubTab {
  /**
   * Almost never set. A tab takes its name from `destinations.ts` like everything else, and
   * the only reason this is still here is the handful of tabs that are a FILTER of a screen
   * rather than the screen itself. Writing a name here for a plain destination is how
   * /work/coverage came to be "Coverage" in the menu and "Where we're thin" on the hub.
   */
  label?: string
  href: string
  /** Module required to see this tab at all. Omit for tabs everyone internal may use. */
  module?: AdminModule
  /** Extra condition beyond the module, e.g. only roles that may see cost. */
  when?: boolean
  /** A count worth showing before they click. */
  count?: number
}

/**
 * What a tab list needs to know about the viewer: exactly what `useAdminAccess()` returns.
 * Tab lists take it as an argument rather than calling the hook themselves, because every
 * instance of that hook makes its own /auth/me and /staff/me requests, and the sidebar reads
 * four hubs' lists on every page.
 */
export type TabAccess = Pick<
  ReturnType<typeof useAdminAccess>,
  'can' | 'loading' | 'canSeeCost' | 'canSeeMargin'
>

/**
 * The tabs one viewer may open, in order. Empty while permissions are still loading, so
 * nothing is offered and then withdrawn. The sidebar and every hub use this one test.
 */
export function visibleTabs(tabs: HubTab[], access: Pick<TabAccess, 'can' | 'loading'>): HubTab[] {
  if (access.loading) return []
  return tabs.filter(t => (t.module ? access.can(t.module) : true) && t.when !== false)
}

export function Hub({
  title, sub, tabs, action, children, bare,
}: {
  title: string
  sub?: string
  /** Sections of one record or lanes of one queue. A hub's own screens are in the sidebar. */
  tabs?: HubTab[]
  action?: React.ReactNode
  children: React.ReactNode
  /** Drop the hub's own title: for a screen that already has one of its own. */
  bare?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const access = useAdminAccess()
  const visible = visibleTabs(tabs ?? [], access)

  // Longest match wins, so a detail route under a tab keeps that tab lit.
  const active = visible
    .filter(t => pathname === t.href || pathname.startsWith(t.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]

  const strip = visible.length > 1

  // A bare hub with no row and nothing inside it draws nothing at all, rather than an empty
  // block that still takes a gap in the page's spacing.
  if (bare && !strip && React.Children.toArray(children).length === 0) return null

  return (
    <div className="space-y-6">
      {!bare && <PageHead title={title} sub={sub} action={action} />}

      {strip && (
        <div className="flex flex-wrap items-center gap-1 border-b">
          {visible.map(t => {
            const on = active?.href === t.href
            return (
              <button
                key={t.href}
                type="button"
                onClick={() => router.push(t.href)}
                className={cn(
                  'relative -mb-px flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                  on
                    ? 'border-b-2 border-primary font-medium text-foreground'
                    : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label ?? shortName(t.href)}
                {t.count != null && t.count > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
                    on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {children}
    </div>
  )
}
