"use client"

import SuperadminBilling from "@/components/admin/SuperadminBilling"
import { AuthGuard } from "@/components/AuthGuard"

export default function AdminBillingPage() {
  return (
    <AuthGuard requiredRole="admin">
      <SuperadminBilling />
    </AuthGuard>
  )
}