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

  const chartData = useMemo(() => [
    { browser: "safari", visitors: profilesRemaining, fill: "hsl(var(--chart-1))" }
  ], [profilesRemaining])

  const usageData = useMemo(() => {
    if (!subscription) return null
    
    return {
      used: subscription.usage.profiles,
      limit: subscription.limits.profiles,
      remaining: profilesRemaining,
      tier: subscriptionTier,
      tierDisplay: subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
    }
  }, [subscription, profilesRemaining, subscriptionTier])

  // Calculate percentage for the radial chart
  const getEndAngle = () => {
    if (!usageData || usageData.limit === 0) return 0
    return (usageData.remaining / usageData.limit) * 360
  }

  // Calculate percentage for badge
  const getPercentage = () => {
    if (!usageData || usageData.limit === 0) return 0
    return Math.round((usageData.remaining / usageData.limit) * 100)
  }

  const isLoading = !subscription

  return (
    <Card className="flex flex-col relative">
      {/* Usage Badge */}
      {!isLoading && usageData && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 z-20 text-xs text-muted-foreground border-border bg-muted/30"
        >
          {usageData.remaining > 0 
            ? `${getPercentage()}% available`
            : "0% available"
          }
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Profile Unlocks</CardTitle>
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Loading..." : `${usageData?.tierDisplay || 'Free'} tier • ${usageData?.limit || 0}/month`}
        </div>
      </CardHeader>
      <CardContent className="p-1">
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-square max-h-[180px]"
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
            <RadialBar dataKey="visitors" background cornerRadius={10} />
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
                          {isLoading ? "..." : (usageData?.remaining || 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {isLoading ? "Loading" : "remaining"}
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