"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AnalyticsRedirect() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  useEffect(() => {
    if (username) {
      // Redirect to the new analytics dashboard
      router.replace(`/creator-analytics/${username}`)
    }
  }, [username, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Redirecting to enhanced analytics dashboard...</p>
      </div>
    </div>
  )
}