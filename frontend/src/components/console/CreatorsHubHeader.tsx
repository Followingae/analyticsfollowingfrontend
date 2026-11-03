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
 * Those angles are the Creators submenu in the sidebar (a tab row here until 2026-11-03).
 * This header is the hub's title and button, and it is inserted at the top of the screens that already exist
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
import { Hub, visibleTabs, type HubTab, type TabAccess } from './Hub'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { cn } from '@/lib/utils'

/**
 * The screens of the Creators hub, filtered for one viewer. The sidebar lists these as the
 * Creators submenu; defined here so the hub and the menu cannot drift.
 *
 * `waiting` is how many creators are sitting unpriced for THIS viewer (the sidebar passes the
 * `needs-price` count it already has, which is the same lane the review queue counts: cost
 * for talent, sell for leadership). It rides on Pending rates.
 */
export function creatorsTabs(access: TabAccess, waiting?: number): HubTab[] {
  return visibleTabs([
    { href: '/work/influencers', module: 'influencers' },
    { href: '/work/influencers/review', module: 'influencers', count: waiting },
    { label: 'Analysed', href: '/work/influencers/analyzed', module: 'influencers' },
    // Standing lists sit BEFORE rosters: a roster is sourced for one client and a list is
    // the roster you source it from.
    { href: '/work/lists', module: 'influencers' },
    { href: '/work/areas', module: 'influencers' },
    { href: '/work/coverage', module: 'influencers' },
    { href: '/work/fa/members', module: 'fa' },
    { href: '/work/fa/reliability', module: 'fa' },
  ], access)
}

export function CreatorsHubHeader({ className, bare, hideAction }: {
  className?: string
  bare?: boolean
  /** The screen below carries its own Add button, next to the thing it adds to. Two
      primaries for one job is how "Add or import creators", "Import a spreadsheet" and
      "Add a creator" came to sit on the same screen, all of them black. */
  hideAction?: boolean
}) {
  const router = useRouter()
  const { can, loading } = useAdminAccess()

  // The `bare` screens print their own title and their own buttons, so there is no title bar
  // here to hang this on, and the button lives on every screen that uses the full header.
  const action = !loading && !bare && !hideAction && can('influencers') ? (
    <Button className="gap-2" onClick={() => router.push('/work/influencers/add')}>
      <Plus className="h-4 w-4" />
      Add or import creators
    </Button>
  ) : undefined

  // The hub's screens are the sidebar's Creators submenu now, so a bare header has nothing
  // left to draw and must not leave an empty block in the page's spacing.
  if (bare) return null

  return (
    <div className={cn('mb-8', className)}>
      <Hub
        title="Creators"
        sub="Everyone we can book: who we hold rates for, who still needs a price, where we are thin, and who actually delivers."
        action={action}
        bare={bare}
      >
        {null}
      </Hub>
    </div>
  )
}
