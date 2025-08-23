"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { UnifiedApp } from "@/components/UnifiedApp"

export default function AdminDashboardPage() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <UnifiedApp />
    </AuthGuard>
  )
}