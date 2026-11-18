'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { CampaignView } from '@/components/merchant/CampaignView'

/** /merchant/campaign: the merchant's one campaign, its creators and its content. */
export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <CampaignView />
    </AuthGuard>
  )
}
