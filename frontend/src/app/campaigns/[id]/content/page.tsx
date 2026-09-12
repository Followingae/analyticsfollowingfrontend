"use client"

/**
 * The client's content wall.
 *
 * This page used to redirect to /posts, with a comment saying the approval workflow would be
 * built "when the backend workflow is complete". It is, so this is the screen: every creator
 * on the campaign, what they have delivered, and the two decisions a client actually makes.
 *
 * THE CLIENT NEVER LEAVES. The video plays here, streamed through our own API from URLs
 * minted server-side. No Frame.io token, folder or project id ever reaches this browser, and
 * the only Frame.io link a client can be given is one a superadmin deliberately set.
 *
 * Approve and Changes needed are the only two things to press. Everything else on the page is
 * there to answer "what is still coming", which is the question a client asks in between.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { ContentWall } from "@/components/content/ContentWall"
import { contentBrandApi, type ContentWall as Wall } from "@/services/contentDeliveryApi"

function Content({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [wall, setWall] = useState<Wall | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setWall(await contentBrandApi.wall(campaignId))
      setFailure(null)
    } catch (e: unknown) {
      setWall(null)
      setFailure(e instanceof Error ? e.message : "The request did not complete")
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { void load() }, [load])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                onClick={() => router.push(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Campaign
        </Button>
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
          Content
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Everything your creators have delivered. Watch it here, then approve it or tell us
          what to change.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : failure ? (
        <div className="py-20 text-center">
          <p className="text-[16px]">Could not load your content</p>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            Nothing is missing. We just could not read it.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      ) : wall ? (
        <ContentWall wall={wall} campaignId={campaignId} side="brand" canDecide onRefresh={load} />
      ) : null}
    </div>
  )
}

export default function CampaignContentPage() {
  const campaignId = useParams().id as string
  return (
    <AuthGuard>
      <BrandUserInterface>
        {campaignId ? <Content campaignId={campaignId} /> : null}
      </BrandUserInterface>
    </AuthGuard>
  )
}
