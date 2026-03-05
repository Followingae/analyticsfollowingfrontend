"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy route — redirects to /proposals which now handles both admin and brand users.
 */
export default function BrandProposalsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/proposals")
  }, [router])

  return null
}
