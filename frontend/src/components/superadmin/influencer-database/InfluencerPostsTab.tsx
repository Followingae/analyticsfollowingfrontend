"use client"

/**
 * Their posts, or rather the fact that this panel does not load any.
 *
 * It was an illustration in a circle over a card promising that posts "will be available".
 * They will not: nothing here fetches them, and the post-level analysis lives on the creator
 * analytics page. A sentence saying where to go beats a card promising a feature.
 */
import type { MasterInfluencer } from "@/types/influencerDatabase"
import { count } from "./Money"

interface InfluencerPostsTabProps {
  influencer: MasterInfluencer
}

export function InfluencerPostsTab({ influencer }: InfluencerPostsTabProps) {
  return (
    <div className="flex max-w-[65ch] flex-col gap-ds-2">
      <p className="text-ds-body">
        {count(influencer.posts_count)} posts on the account.
      </p>
      <p className="text-ds-body text-muted-foreground">
        The posts themselves are not loaded here. Open @{influencer.username} in creator
        analytics to read them.
      </p>
    </div>
  )
}
