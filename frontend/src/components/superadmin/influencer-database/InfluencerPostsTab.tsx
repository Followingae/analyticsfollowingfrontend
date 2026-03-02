"use client"

import { Card } from "@/components/ui/card"
import { ImageIcon } from "lucide-react"
import type { MasterInfluencer } from "@/types/influencerDatabase"

interface InfluencerPostsTabProps {
  influencer: MasterInfluencer
}

export function InfluencerPostsTab({ influencer }: InfluencerPostsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Posts</h3>
        <p className="text-xs text-muted-foreground">
          {influencer.posts_count} total posts
        </p>
      </div>

      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-medium text-sm">Posts data will load from analytics</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Post content and engagement metrics will be available once the analytics
          data is fetched for @{influencer.username}.
        </p>
      </Card>
    </div>
  )
}
