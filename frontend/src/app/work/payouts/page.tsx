'use client'

/**
 * Payout runs live on Creator payments now (25 Nov 2026), under the payments they pay out.
 * This address forwards there so every old link, email and bookmark still lands.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PayoutRunsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/work/payables#runs') }, [router])
  return null
}
