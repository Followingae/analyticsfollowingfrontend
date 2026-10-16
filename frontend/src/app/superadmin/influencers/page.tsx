"use client"

export const dynamic = 'force-dynamic'

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { InfluencerDatabasePage } from "@/components/superadmin/influencer-database/InfluencerDatabasePage"
import { CreatorsHubHeader } from "@/components/console/CreatorsHubHeader"

export default function SuperadminInfluencersPage() {
  return (
    <SuperadminLayout>
      {/* The database header below carries Add a creator and Import a spreadsheet, in
          reach of the table they act on. The hub's own button would be a third way to do
          the same job, and the only black one of the three. */}
      <CreatorsHubHeader hideAction />
      <InfluencerDatabasePage />
    </SuperadminLayout>
  )
}
