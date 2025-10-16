"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import WorkerMonitoringDashboard from "@/components/superadmin/WorkerMonitoringDashboard"

export const dynamic = 'force-dynamic'

export default function SuperadminWorkersPage() {
  return (
    <SuperadminLayout>
      <WorkerMonitoringDashboard />
    </SuperadminLayout>
  )
}