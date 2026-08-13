'use client'

/**
 * The lifebuoy: top-right, on every operator screen.
 *
 * It used to open a dropdown of walkthroughs. A dropdown is for choosing a thing, and this is
 * a curriculum someone works through over their first week — so the list lives at /how, a real
 * page that can breathe and be linked to, and this is just the way in.
 *
 * The runner stays mounted here rather than on that page, because a tour navigates: it has to
 * outlive every route change it makes.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LifeBuoy } from 'lucide-react'
import { WALKTHROUGHS, type Walkthrough } from './walkthroughs'
import { WalkthroughRunner, useTourResume } from './WalkthroughRunner'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import './intro-theme.css'

export function HelpLifebuoy() {
  const router = useRouter()
  // The walkthroughs teach our own operation — pricing, sourcing, what a strike reason is
  // for. None of that is a client's business, and offering it to them invites questions we
  // do not want to answer. Internal roles only.
  const { isSuperAdmin, isStaff, role, loading } = useAdminAccess()
  const [running, setRunning] = useState<Walkthrough | null>(null)
  const [leg, setLeg] = useState(0)

  // A tour that crossed a page boundary — or was armed from /how — picks itself up on arrival.
  useTourResume(WALKTHROUGHS, (t, l) => { setRunning(t); setLeg(l) })

  const internal = isSuperAdmin || isStaff || role === 'admin'
  if (loading || !internal) return null

  return (
    <>
      <button
        type="button"
        data-tour="help"
        aria-label="Show me how"
        onClick={() => router.push('/how')}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden lg:inline">Show me how</span>
      </button>

      {running && (
        <WalkthroughRunner tour={running} startLeg={leg} onClose={() => { setRunning(null); setLeg(0) }} />
      )}
    </>
  )
}
