"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/**
 * A campaign has two operator screens — the timeline and the delivery board — and no page
 * of its own, so a bare /work/campaigns/{id} was a 404. Links to it exist regardless: they
 * get typed, pasted into WhatsApp, and prefetched by the router, and a dead end there reads
 * as "the campaign is gone" rather than "that address has no page".
 *
 * The timeline is the campaign's front door, so that is where this lands.
 */
export default function CampaignRootPage() {
  const campaignId = useParams().campaignId as string
  const router = useRouter()

  useEffect(() => {
    if (campaignId) router.replace(`/work/campaigns/${campaignId}/timeline`)
  }, [campaignId, router])

  return null
}
