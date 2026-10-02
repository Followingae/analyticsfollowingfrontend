"use client"

import { useMemo } from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useSubscriptionData, useProfilesRemaining, useSubscriptionTier } from "@/stores/userStore"
import { planTierLabel } from "@/lib/plan-tier"

const chartConfig = {
  visitors: {
    label: "Used",
  },
  safari: {
    label: "Profile Analysis",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartProfileAnalysisV2() {
  // SINGLE SOURCE OF TRUTH: Use Zustand store (no API calls needed)
  const subscription = useSubscriptionData()
  const profilesRemaining = useProfilesRemaining()
  const subscriptionTier = useSubscriptionTier()

  // `null` remaining means the plan has no ceiling. Feeding null to the chart draws an empty
  // dial, which is the visual half of telling a paying customer they have nothing left.
  const uncapped = profilesRemaining === null
  const used = subscription?.usage.profiles ?? 0

  // On an uncapped plan the ring is a COMPLETE ring, drawn from a constant rather than from
  // a count. It used to be drawn from `used`, so a customer who had unlocked nobody yet got
  // `visitors: 0` and an empty grey circle sitting next to a full credits dial — which reads
  // as "you have nothing left", the exact opposite of "you have no ceiling", and precisely
  // what the endAngle note below says it was fixing. The figure in the middle is still the
  // real `used` count; this value only decides how much of the arc is painted.
  const chartData = useMemo(() => [
    { browser: "safari", visitors: uncapped ? 1 : profilesRemaining,
      fill: "var(--chart-1)" }
  ], [profilesRemaining, uncapped])

  const usageData = useMemo(() => {
    if (!subscription) return null
    
    return {
      used: subscription.usage.profiles,
      limit: subscription.limits.profiles,
      remaining: profilesRemaining,
      tier: subscriptionTier,
      // The plan name comes from one place now, and it is never guessed. See
      // src/lib/plan-tier.ts: printing "Free" over a missing tier told paying customers
      // they were on the free plan.
      tierDisplay: planTierLabel(subscriptionTier)
    }
  }, [subscription, profilesRemaining, subscriptionTier])

  // Calculate percentage for the radial chart
  const getEndAngle = () => {
    // No ceiling, so there is no fraction to draw. A full ring reads as "you are fine",
    // which is the truth, where the old empty ring said the exact opposite.
    if (uncapped) return 360
    if (!usageData || !usageData.limit || usageData.remaining === null) return 0
    return (usageData.remaining / usageData.limit) * 360
  }

  const isLoading = !subscription

  /** What a screen reader is told, since the figure itself lives in an SVG <tspan>. */
  const spokenValue = isLoading
    ? 'Loading your profile unlocks'
    : uncapped
      ? `${used.toLocaleString()} creators unlocked this cycle. Your plan has no monthly cap.`
      : `${(usageData?.remaining ?? 0).toLocaleString()} profile unlocks remaining${
          usageData?.limit != null ? ` of ${usageData.limit} this month` : ''}`

  return (
    <Card className="flex flex-col relative">
      {/* The "resets in Nd" badge is gone.
          It counted to the first of the calendar month, while billing runs from each
          customer's subscription anniversary, so a client on a 14th-of-month subscription
          read "resets in 3d" on the 28th and planned an unlock run against an allowance that
          was not coming. The previous note here admitted the number was wrong and left it on
          screen "until the server returns it", which quietly became the shipped state.
          A knowingly-wrong date is worse than no date: this page asks clients to trust an en
          dash when a figure did not load, and it cannot ask for that trust while inventing a
          number elsewhere. When the API sends a real `next_reset_at`, render it as an
          absolute date ("resets 14 Oct") so a stale cache cannot drift it. */}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Profile Unlocks</CardTitle>
        {/* The plan name is omitted when we do not have one, rather than replaced with
            "Free". The cap sentence itself is the server's: Standard and Premium carry
            `limits_unlimited.profiles`, so "no monthly cap" is what the API says, not a
            guess made here. */}
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Loading..."
            : uncapped
              ? [usageData?.tierDisplay && `${usageData.tierDisplay} plan`, 'no monthly cap']
                  .filter(Boolean).join(' • ')
              : [usageData?.tierDisplay && `${usageData.tierDisplay} plan`,
                 usageData?.limit != null ? `${usageData.limit}/month` : null]
                  .filter(Boolean).join(' • ')}
        </div>
      </CardHeader>
      <CardContent className="p-1">
        {/* The figure lives in an SVG <tspan>, which assistive tech does not announce, and
            the aria-label that used to cover this sat on a plain <div> with no role, where
            it is dropped. So the number is said here, in text, and the drawing is hidden. */}
        <p className="sr-only">{spokenValue}</p>
        <ChartContainer
          aria-hidden
          config={chartConfig}
          className="mx-auto h-[180px] w-[180px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={getEndAngle()}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar 
              dataKey="visitors" 
              background={{ 
                fill: "var(--muted)" 
              }} 
              cornerRadius={10} 
              fill="var(--chart-1)"
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {isLoading ? "..."
                            : uncapped ? used.toLocaleString()
                            : (usageData?.remaining ?? 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {isLoading ? "Loading" : uncapped ? "unlocked" : "remaining"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}