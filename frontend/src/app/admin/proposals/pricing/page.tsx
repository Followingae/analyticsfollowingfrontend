"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy route — pricing is now managed in the Influencer Database.
 * Redirects to /superadmin/influencers.
 */
export default function AdminProposalsPricingRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/superadmin/influencers")
  }, [router])

  return null
}
