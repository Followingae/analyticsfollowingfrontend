"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy route — redirects to /superadmin/proposals which is the new proposals dashboard.
 */
export default function AdminProposalsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/superadmin/proposals")
  }, [router])

  return null
}
