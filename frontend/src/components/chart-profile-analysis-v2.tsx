"use client"

import { useState, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useSubscriptionData, useProfilesRemaining, useSubscriptionTier } from "@/stores/userStore"

const chartConfig = {
  visitors: {
    label: "Used",
  },
  safari: {
    label: "Profile Analysis",
    color: "hsl(var(--chart-1))",
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

  const chartData = useMemo(() => [
    { browser: "safari", visitors: uncapped ? used : profilesRemaining,
      fill: "oklch(0.4718 0.2853 280.0726)" }
  ], [profilesRemaining, uncapped, used])

  const usageData = useMemo(() => {
    if (!subscription) return null
    
    return {
      used: subscription.usage.profiles,
      limit: subscription.limits.profiles,
      remaining: profilesRemaining,
      tier: subscriptionTier,
      tierDisplay: subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Free'
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

  // Calculate days until first of next month (billing reset)
  const getDaysUntilReset = () => {
    const now = new Date()
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const days = Math.ceil((firstOfNextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(days, 0)
  }

  const isLoading = !subscription

  return (
    <Card className="flex flex-col relative">
      {/* An uncapped plan has no allowance to reset, so the countdown was answering a
          question nobody asked and implying a ceiling that does not exist. It is kept for
          capped plans only.
          ⚠️ Still wrong even there: it counts to the first of the calendar month, while
          billing runs from each customer's subscription anniversary. The real reset date is
          not sent to the client today, and inventing one is what this whole pass is about,
          so it stays as it is until the server returns it. */}
      {!isLoading && usageData && !uncapped && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 z-20 text-xs text-muted-foreground border-border bg-muted/30"
        >
          {getDaysUntilReset() === 0 ? 'resets today' : `resets in ${getDaysUntilReset()}d`}
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Profile Unlocks</CardTitle>
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Loading..."
            : uncapped ? `${usageData?.tierDisplay || 'Free'} plan • no monthly cap`
            : `${usageData?.tierDisplay || 'Free'} plan • ${usageData?.limit ?? 0}/month`}
        </div>
      </CardHeader>
      <CardContent className="p-1">
        <ChartContainer
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
                fill: "hsl(var(--muted))" 
              }} 
              cornerRadius={10} 
              fill="oklch(0.4718 0.2853 280.0726)"
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