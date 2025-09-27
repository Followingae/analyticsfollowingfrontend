'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the proper superadmin dashboard
    router.replace('/superadmin')
  }, [router])

  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecting to superadmin dashboard...</p>
      </div>
    </AuthGuard>
  )
}