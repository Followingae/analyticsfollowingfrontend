'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthGuard } from '@/components/AuthGuard'
import { CampaignWizard } from '@/components/merchant/wizard/CampaignWizard'

/**
 * /merchant/campaign/new: the seven-step campaign wizard. Also where a draft
 * or a sent-back campaign is edited; it resumes at the first unanswered step.
 */
export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center bg-background">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CampaignWizard />
      </Suspense>
    </AuthGuard>
  )
}
