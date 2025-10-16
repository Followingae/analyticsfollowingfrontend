"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import AnalyticsCompletenessDashboard from "@/components/superadmin/AnalyticsCompletenessDashboard"

export const dynamic = 'force-dynamic'

export default function SuperadminAnalyticsCompletenessPage() {
  return (
    <SuperadminLayout>
      <AnalyticsCompletenessDashboard />
    </SuperadminLayout>
  )
}