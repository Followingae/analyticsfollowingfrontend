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
 * There used to be an "Also here:" line of small grey links underneath, which is where the
 * three leftover screens went to be forgotten — a screen reachable only by a sentence is not
 * really reachable. So: analyzed creators is a tab like everything else; adding creators is
 * the hub's primary button, because it is the one thing you come here to *do* rather than
 * look at; and sourcing rounds is retired, since brand rosters replaced it and the table
 * behind it is empty. The sourcing screen still answers on its own URL — nothing links to it.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Hub, type HubTab } from './Hub'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { creatorIntakeApi } from '@/services/creatorIntakeApi'
import { cn } from '@/lib/utils'

export function CreatorsHubHeader({ className, bare }: { className?: string; bare?: boolean }) {
  const router = useRouter()
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
    { label: 'Creators needing a price', href: '/work/influencers/review', module: 'influencers', count: waiting },
    { label: 'Analyzed creators', href: '/work/influencers/analyzed', module: 'influencers' },
    { label: 'Brand rosters', href: '/work/areas', module: 'influencers' },
    { label: "Where we're thin", href: '/work/coverage', module: 'influencers' },
    { label: 'On the app', href: '/work/fa/members', module: 'fa' },
    { label: 'Who actually delivers', href: '/work/fa/reliability', module: 'fa' },
  ]

  // The `bare` screens print their own title and their own buttons, so there is no title bar
  // here to hang this on; they keep the tab row only, and the button lives on every screen
  // that uses the full header.
  const action = !loading && !bare && can('influencers') ? (
    <Button className="gap-2" onClick={() => router.push('/work/influencers/add')}>
      <Plus className="h-4 w-4" />
      Add or import creators
    </Button>
  ) : undefined

  return (
    <div className={cn('mb-8', className)}>
      <Hub
        title="Creators"
        sub="Everyone we can book — who we hold rates for, who still needs a price, where we are thin, and who actually delivers."
        tabs={tabs}
        action={action}
        bare={bare}
      >
        {null}
      </Hub>
    </div>
  )
}
