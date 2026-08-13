"use client"

export const dynamic = 'force-dynamic'

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { InfluencerDatabasePage } from "@/components/superadmin/influencer-database/InfluencerDatabasePage"
import { CreatorsHubHeader } from "@/components/console/CreatorsHubHeader"

export default function SuperadminInfluencersPage() {
  return (
    <SuperadminLayout>
      <CreatorsHubHeader />
      <InfluencerDatabasePage />
    </SuperadminLayout>
  )
}
