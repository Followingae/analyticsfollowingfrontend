"use client"

/**
 * The client's results.
 *
 * What a brand could see of their own campaign before this page existed: nothing. The
 * measurement has been good for months and reached them through no screen at all. The one
 * place posts were ever rolled up was a "report campaign", a separate object with a public
 * share link, which meant results arrived as a link to somewhere else rather than as part of
 * the campaign they bought.
 *
 * EVERY POST HERE WAS RELEASED BY A PERSON. The server only returns rows a superadmin has
 * approved, and it filters in SQL rather than trusting this page to ask nicely. A brand
 * never sees a post we are still checking, one we could not read, or one that turned out to
 * belong to somebody else's campaign.
 *
 * NO ZEROES WE DID NOT MEASURE. Instagram hides like counts when a creator asks it to. Those
 * posts show a dash and are left out of the totals, and the totals say so underneath. A zero
 * here would read as "your campaign got nothing", which is a sentence we would be inventing.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import {
  NoPostsYet, PerformanceTotals, PostGrid, PostTile,
} from "@/components/campaigns/performance/PerformanceGrid"
import { campaignPerformanceApi, type PerfPost, type PerfReport } from "@/services/campaignPerformanceApi"
import { PostDetail } from "@/components/campaigns/performance/PostDetail"

function Results({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [data, setData] = useState<PerfReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)
  const [detail, setDetail] = useState<PerfPost | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await campaignPerformanceApi.brand(campaignId))
      setFailure(null)
    } catch (e: unknown) {
      setData(null)
      setFailure(e instanceof Error ? e.message : "The request did not complete")
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { void load() }, [load])

  const posts = data?.posts || []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                onClick={() => router.push(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Campaign
        </Button>
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
          Results
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Every post your creators published, and what it did. We re-count these each week
          for a month after the first one goes live.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : failure ? (
        /* A failed read is not an empty campaign. Saying "no results yet" here would tell a
           client their creators have published nothing, off a request that did not return. */
        <div className="py-20 text-center">
          <p className="text-[16px]">Could not load your results</p>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            Nothing is missing. We just could not read it.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <NoPostsYet side="brand" />
      ) : (
        <div className="space-y-8">
          {data && <PerformanceTotals totals={data.totals} />}
          <PostGrid>
            {posts.map((p) => <PostTile key={p.link_id} post={p} side="brand" onOpen={() => setDetail(p)} />)}
          </PostGrid>
        </div>
      )}

      <PostDetail post={detail} open={!!detail}
                  onOpenChange={(o) => { if (!o) setDetail(null) }} />
    </div>
  )
}

export default function CampaignResultsPage() {
  const campaignId = useParams().id as string
  return (
    <AuthGuard>
      <BrandUserInterface>
        {campaignId ? <Results campaignId={campaignId} /> : null}
      </BrandUserInterface>
    </AuthGuard>
  )
}
