"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { roleHome } from "@/lib/roleHome"

// "/" is no longer a second dashboard — it forwards to the single canonical
// home for the user's role (/dashboard for brands, /superadmin for operators).
function RootRedirect() {
  const router = useRouter()
  const { user, isLoading } = useEnhancedAuth()

  useEffect(() => {
    if (!isLoading) {
      router.replace(roleHome(user?.role, user?.email, user?.staff_role))
    }
  }, [isLoading, user, router])

  return null
}

export default function Page() {
  return (
    <AuthGuard requireAuth={true}>
      <RootRedirect />
    </AuthGuard>
  )
}
