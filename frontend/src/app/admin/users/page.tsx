"use client"

import SuperadminUserManagement from "@/components/admin/SuperadminUserManagement"
import { AuthGuard } from "@/components/AuthGuard"

export default function AdminUsersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <SuperadminUserManagement />
    </AuthGuard>
  )
}