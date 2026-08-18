'use client'

/**
 * Creators — everyone we can book.
 *
 * The old sidebar carried nine separate entries for creator work: the master database, the
 * waiting room, sourcing, coverage, lists, analyzed creators, add/import, app members and
 * reliability. They are not nine places. They are one thing — the people we can put in front
 * of a client — looked at from a few angles: who we hold, who is waiting on a price, how we
 * are covered, who is on the app, and who actually delivers.
 *
 * So this header is the hub, and it is inserted at the top of the screens that already exist
 * rather than replacing them. Each screen keeps its own URL, its own body and its own
 * behaviour; what changes is that you can now get from any one of them to the others without
 * going back to a menu.
 *
 * Nothing was dropped. The three screens that are not frequent enough to earn a tab —
 * sourcing rounds, analyzed creators, and add/import — sit on the line underneath, named in
 * full.
 */
import * as React from 'react'
import Link from 'next/link'
import { Hub, type HubTab } from './Hub'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { creatorIntakeApi } from '@/services/creatorIntakeApi'
import { cn } from '@/lib/utils'

const MORE: { label: string; href: string; module: 'influencers' }[] = [
  { label: 'Sourcing rounds', href: '/work/sourcing', module: 'influencers' },
  { label: 'Analyzed creators', href: '/work/influencers/analyzed', module: 'influencers' },
  { label: 'Add or import creators', href: '/work/influencers/add', module: 'influencers' },
]

export function CreatorsHubHeader({ className }: { className?: string }) {
  const { can, loading } = useAdminAccess()
  // How many creators are sitting unpriced. Superadmin-only endpoint: for everyone else it
  // refuses, and a tab simply carries no number rather than the page failing.
  const [waiting, setWaiting] = React.useState<number | undefined>(undefined)

  // `can` is a fresh closure on every render, so the effect depends on the answer rather than
  // the function — otherwise the count would be re-fetched on each re-render.
  const mayHoldRates = !loading && can('influencers')

  React.useEffect(() => {
    if (!mayHoldRates) return
    let active = true
    Promise.allSettled([creatorIntakeApi.reviewQueue()]).then(([r]) => {
      if (!active || r.status !== 'fulfilled') return
      const d = r.value?.data
      const n = typeof d?.count === 'number' ? d.count : d?.items?.length
      if (typeof n === 'number') setWaiting(n)
    })
    return () => { active = false }
  }, [mayHoldRates])

  const tabs: HubTab[] = [
    { label: 'Database', href: '/work/influencers', module: 'influencers' },
    { label: 'Waiting room', href: '/work/influencers/review', module: 'influencers', count: waiting },
    { label: 'Areas', href: '/work/influencers/lists', module: 'influencers' },
    { label: 'Coverage', href: '/work/coverage', module: 'influencers' },
    { label: 'On the app', href: '/work/fa/members', module: 'fa' },
    { label: 'Reliability', href: '/work/fa/reliability', module: 'fa' },
  ]

  const more = MORE.filter(m => can(m.module))

  return (
    <div className={cn('mb-8', className)}>
      <Hub
        title="Creators"
        sub="Everyone we can book — who we hold rates for, who is still waiting on a price, where we are thin, and who has been reliable on the app."
        tabs={tabs}
      >
        {!loading && more.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <span>Also here:</span>
            {more.map(m => (
              <Link
                key={m.href}
                href={m.href}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {m.label}
              </Link>
            ))}
          </div>
        )}
      </Hub>
    </div>
  )
}
