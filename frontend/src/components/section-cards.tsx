"use client"

import { IconTrendingDown, IconTrendingUp, IconUsers, IconHeart, IconMessage, IconEye } from "@tabler/icons-react"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CompleteProfileResponse } from "@/types"

interface SectionCardsProps {
  profileData?: CompleteProfileResponse
  mode?: 'profile' | 'brand' | 'creators' | 'campaigns' | 'discover'
  brandData?: {
    currentPlan?: string
    unlockedProfiles?: number
    totalReach?: string
    activeCampaigns?: number
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function SectionCards({ profileData, mode = 'profile', brandData }: SectionCardsProps) {
  const [data, setData] = useState<CompleteProfileResponse | null>(null)

  useEffect(() => {
    if (profileData) {
      setData(profileData)
    }
  }, [profileData])

  // Brand analytics mode (dashboard)
  if (mode === 'brand') {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {brandData?.currentPlan || '--'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                {brandData?.currentPlan ? 'Active' : 'Loading...'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Your Unlocked Profiles</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {brandData?.unlockedProfiles ? formatNumber(brandData.unlockedProfiles) : '--'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                {brandData?.unlockedProfiles ? 'Available' : 'Loading...'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Reach</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {brandData?.totalReach || '--'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                {brandData?.totalReach ? 'Cumulative' : 'Loading...'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Campaigns</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {brandData?.activeCampaigns !== undefined ? brandData.activeCampaigns : '--'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                {brandData?.activeCampaigns !== undefined ? 'Running' : 'Loading...'}
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Creators page mode
  if (mode === 'creators') {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Unlocked Creators</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              5
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                +8 added
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Portfolio Reach</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              1.3M
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconEye className="size-3" />
                Combined
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Avg Engagement</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              4.8%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconHeart className="size-3" />
                Portfolio
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>In Campaigns</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              3
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Campaigns page mode
  if (mode === 'campaigns') {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Campaigns</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              5
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                2 active
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Budget</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <span className="aed-currency">AED</span> 368K
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                41% spent
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Reach</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              3.4M
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconEye className="size-3" />
                Combined
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Avg Performance</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              +15.3%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                ROI
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Discover page mode
  if (mode === 'discover') {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Creators</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              12.5M+
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconUsers className="size-3" />
                Verified
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Verified & analyzed profiles <IconUsers className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Ready for discovery
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Brand-Ready</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              2.8M
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                High-quality
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              High-quality creator profiles <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Brand-safe content
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Avg Campaign ROI</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              325%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconTrendingUp className="size-3" />
                Platform avg
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Platform average return <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Expected ROI
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              94%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <IconHeart className="size-3" />
                Success
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Campaign success rate <IconHeart className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Platform performance
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Followers</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              -
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                Loading...
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Analyzing profile data
            </div>
            <div className="text-muted-foreground">
              Please wait while we fetch analytics
            </div>
          </CardFooter>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                -
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  const growthRate = data.profile.follower_growth_rate || 0
  const isPositiveGrowth = growthRate > 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Followers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.profile.followers)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <IconUsers className="size-3" />
              {data.profile.is_verified && "✓ Verified"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {formatNumber(data.profile.following)} Following <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {formatNumber(data.profile.posts_count)} posts total
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Engagement Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.profile.engagement_rate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {data.profile.engagement_rate > 3 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  Excellent
                </>
              ) : data.profile.engagement_rate > 1 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  Good
                </>
              ) : (
                <>
                  <IconTrendingDown className="size-3" />
                  Low
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Avg {formatNumber(data.profile.avg_likes)} likes <IconHeart className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {formatNumber(data.profile.avg_comments)} comments per post
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Content Quality</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.profile.content_quality_score.toFixed(1)}/10
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {data.profile.content_quality_score > 7 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  High
                </>
              ) : data.profile.content_quality_score > 5 ? (
                <>
                  <IconEye className="size-3" />
                  Good
                </>
              ) : (
                <>
                  <IconTrendingDown className="size-3" />
                  Needs Work
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Influence Score: {data.profile.influence_score.toFixed(1)}/10
          </div>
          <div className="text-muted-foreground">
            Based on reach and engagement quality
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {growthRate ? `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%` : 'N/A'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {isPositiveGrowth ? (
                <>
                  <IconTrendingUp className="size-3" />
                  Growing
                </>
              ) : growthRate < 0 ? (
                <>
                  <IconTrendingDown className="size-3" />
                  Declining
                </>
              ) : (
                <>
                  <IconMessage className="size-3" />
                  Stable
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositiveGrowth ? 'Positive momentum' : 'Focus on engagement'} 
            {isPositiveGrowth ? <IconTrendingUp className="size-4" /> : <IconMessage className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Monthly follower change
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
