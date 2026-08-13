'use client'

/**
 * A hub: one destination, several jobs.
 *
 * The console had forty-four navigation entries, which is not a menu, it is a filing
 * cabinet. Almost all of them were not places — they were jobs done on one of six things:
 * your day, decisions waiting on you, clients, campaigns, creators, money. A hub is that
 * thing; the jobs are its tabs.
 *
 * Two rules make this safe to adopt gradually:
 *
 *   1. A tab is a route, not a component swap. The URL still says exactly where you are, a
 *      tab can be linked to and bookmarked, and a screen that already exists can become a
 *      tab without being rewritten.
 *   2. A tab the viewer's role cannot open is not rendered at all — never shown-and-refused.
 *      The gate is the same `can(module)` the sidebar and the route guard use, so the three
 *      can never disagree about what a person is allowed to do.
 */
import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import { PageHead } from './primitives'

export interface HubTab {
  /** What the person is doing here, in their words. */
  label: string
  href: string
  /** Module required to see this tab at all. Omit for tabs everyone internal may use. */
  module?: AdminModule
  /** Extra condition beyond the module — e.g. only roles that may see cost. */
  when?: boolean
  /** A count worth showing before they click. */
  count?: number
}

export function Hub({
  title, sub, tabs, action, children,
}: {
  title: string
  sub?: string
  tabs: HubTab[]
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const { can, loading } = useAdminAccess()

  const visible = tabs.filter(t => (t.module ? can(t.module) : true) && t.when !== false)

  // Longest match wins, so a detail route under a tab keeps that tab lit.
  const active = visible
    .filter(t => pathname === t.href || pathname.startsWith(t.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <div className="space-y-6">
      <PageHead title={title} sub={sub} action={action} />

      {!loading && visible.length > 1 && (
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
                {t.label}
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
