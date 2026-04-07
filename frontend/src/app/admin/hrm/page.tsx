"use client"

import HRMSystemEnhanced from "@/components/admin/HRMSystemEnhanced"
import { AuthGuard } from "@/components/AuthGuard"

export default function AdminHRMPage() {
  return (
    <AuthGuard requiredRole="admin">
      <HRMSystemEnhanced />
    </AuthGuard>
  )
}