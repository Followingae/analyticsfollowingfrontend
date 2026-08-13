'use client'

/**
 * /work/money — the hub's front door.
 *
 * A hub is not a fourth screen with its own summary; it is the name of a place. So this route
 * hands you straight to the first job you are actually allowed to do here: revenue if you
 * handle billing, otherwise what we owe creators. If your role may see neither — an account
 * manager or business developer, who must never learn creator cost — you get a plain sentence
 * saying so rather than an empty dashboard or a redirect loop into a 403.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { PageHead } from '@/components/console/primitives'
import { useMoneyTabs } from '@/components/console/MoneyHubHeader'
import { useAdminAccess } from '@/hooks/useAdminAccess'

export default function MoneyHubPage() {
  const router = useRouter()
  const { loading } = useAdminAccess()
  const tabs = useMoneyTabs()
  const first = tabs[0]?.href

  useEffect(() => {
    if (first) router.replace(first)
  }, [first, router])

  if (loading || first) {
    // Either we do not yet know who this is, or we are already on our way out of here.
    return <SuperadminLayout><div /></SuperadminLayout>
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <PageHead title="Money" sub="What comes in, and what goes out." />
        <p className="text-sm text-muted-foreground">
          Nothing here for your role. Revenue is for the people who handle billing, and what we
          pay creators is kept to leadership and talent.
        </p>
      </div>
    </SuperadminLayout>
  )
}
