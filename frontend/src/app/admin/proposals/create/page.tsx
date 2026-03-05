"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy route — redirects to /superadmin/proposals/create.
 */
export default function AdminProposalsCreateRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/superadmin/proposals/create")
  }, [router])

  return null
}
