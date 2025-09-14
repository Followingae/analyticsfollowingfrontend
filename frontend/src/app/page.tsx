"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { UnifiedApp } from "@/components/UnifiedApp"

export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedApp />
    </AuthGuard>
  )
}