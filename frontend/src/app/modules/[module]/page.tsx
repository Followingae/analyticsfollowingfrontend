'use client'

/**
 * The canonical address for a locked module: /modules/run.
 *
 * The in-context wall (at /campaigns, where the brand actually clicked) is the
 * one that sells. This address exists so the same card is linkable - from
 * billing, from an email, from a teammate pasting a URL - without inventing a
 * second, different-looking upsell page.
 *
 * If the account already has the module, there is nothing to sell: it goes
 * straight to the module.
 */

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui2/empty'
import { LockedModuleCard } from '@/components/commercial/LockedModuleCard'
import { getModule } from '@/config/modules'
import { useCommercialAccount } from '@/hooks/useCommercialAccount'

export default function ModulePage() {
  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <ModuleContent />
      </BrandUserInterface>
    </AuthGuard>
  )
}

function ModuleContent() {
  const params = useParams<{ module: string }>()
  const router = useRouter()
  const account = useCommercialAccount()

  const key = String(params?.module || '')
  const def = getModule(key)
  const owned = def ? account.owns[def.key] : false

  useEffect(() => {
    if (def && account.state === 'loaded' && owned) {
      router.replace(def.href)
    }
  }, [def, account.state, owned, router])

  if (!def) {
    return (
      <div className="flex-1 p-6 max-w-3xl mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No such module</EmptyTitle>
            <EmptyDescription>
              There is no module called &ldquo;{key}&rdquo;. The modules are Find, Run and Manage.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  if (account.state === 'loading' || owned) {
    return (
      <div className="flex-1 p-6 max-w-3xl mx-auto">
        <Skeleton className="h-[420px]" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 mx-auto w-full max-w-4xl">
      <LockedModuleCard module={def.key} />
    </div>
  )
}
