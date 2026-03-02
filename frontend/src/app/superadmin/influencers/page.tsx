"use client"

export const dynamic = 'force-dynamic'

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { InfluencerDatabasePage } from "@/components/superadmin/influencer-database/InfluencerDatabasePage"

export default function SuperadminInfluencersPage() {
  return (
    <SuperadminLayout>
      <InfluencerDatabasePage />
    </SuperadminLayout>
  )
}
