'use client'

/**
 * /work/creators is the nav's name for the hub, not a screen of its own.
 *
 * The hub's tabs are the real screens, so landing here goes straight to the first one the
 * viewer is allowed to open: the master database for anyone who works with our rates, the
 * app members list for someone scoped to the Following App only. Sending everyone to the
 * database regardless would bounce half the team off the route guard on arrival.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminAccess } from '@/hooks/useAdminAccess'

export default function CreatorsHubPage() {
  const router = useRouter()
  const { can, loading } = useAdminAccess()

  // `can` is a new closure each render, so the effect watches the answer, not the function.
  const target = loading ? null : can('influencers') ? '/work/influencers' : '/work/fa/members'

  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-[320px]" />
      </div>
    </SuperadminLayout>
  )
}
