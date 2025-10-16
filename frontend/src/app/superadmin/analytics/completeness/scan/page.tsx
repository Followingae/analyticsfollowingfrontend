"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import ProfileScanInterface from "@/components/superadmin/ProfileScanInterface"

export const dynamic = 'force-dynamic'

export default function SuperadminAnalyticsScanPage() {
  return (
    <SuperadminLayout>
      <ProfileScanInterface />
    </SuperadminLayout>
  )
}