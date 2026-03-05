"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy route — campaigns are now created from approved proposals.
 * Redirects to /superadmin/proposals.
 */
export default function AdminProposalsCampaignsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/superadmin/proposals")
  }, [router])

  return null
}
