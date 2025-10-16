"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import RepairProfilesInterface from "@/components/superadmin/RepairProfilesInterface"

export const dynamic = 'force-dynamic'

export default function SuperadminAnalyticsRepairPage() {
  return (
    <SuperadminLayout>
      <RepairProfilesInterface />
    </SuperadminLayout>
  )
}