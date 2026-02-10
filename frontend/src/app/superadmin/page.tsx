"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"

export default function SuperadminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface />
    </AuthGuard>
  )
}