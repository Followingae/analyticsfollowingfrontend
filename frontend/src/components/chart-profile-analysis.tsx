"use client"

import { useEffect, useState } from "react"
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useUserStore } from "@/stores/userStore"
import { calculateRemainingProfiles, getTierDisplayName } from "@/utils/subscriptionUtils"

const chartConfig = {
  visitors: {
    label: "Used",
  },
  safari: {
    label: "Profile Analysis",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ChartProfileAnalysis() {
  const { user } = useEnhancedAuth()
  const { user: userStoreData, subscription, isLoading: userStoreLoading } = useUserStore()
  const [chartData, setChartData] = useState([
    { browser: "safari", visitors: 0, fill: "hsl(var(--primary))" },
  ])
  const [usageData, setUsageData] = useState<{
    used: number,
    limit: number,
    remaining: number,
    tier: string,
    tierDisplay: string
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user || !userStoreData || !subscription || userStoreLoading) {
        return
      }

      try {
        // Use data from UserStore instead of making API call
        console.log('🔍 Using UserStore data for profiles chart:', {
          userStoreData,
          subscription
        })

        // Get subscription tier and usage from UserStore
        const subscriptionTier = user?.role || subscription.tier || 'free'
        const profilesUsed = subscription.profiles_unlocked_this_month || 0
        
        // FIXED: Use dynamic subscription rules instead of static dashboard limits
        const profileData = calculateRemainingProfiles(subscriptionTier, profilesUsed)
        
        setUsageData({
          used: profilesUsed,
          limit: profileData.limit,
          remaining: profileData.remaining,
          tier: profileData.tier,
          tierDisplay: profileData.tierDisplay
        })
        
        setChartData([{
          browser: "safari",
          visitors: profileData.remaining,
          fill: "hsl(var(--primary))"
        }])
        
        console.log('🔥 Profile unlocks calculated from UserStore:', {
          user_role: user?.role,
          subscription_tier: subscriptionTier,
          normalized_tier: profileData.tier,
          tier_display: profileData.tierDisplay,
          subscription_limit: profileData.limit,
          profiles_used: profilesUsed,
          profiles_remaining: profileData.remaining
        })
      } catch (error) {
        console.warn('Error loading profile data:', error)
        setUsageData({
          used: 0,
          limit: 0,
          remaining: 0,
          tier: 'free',
          tierDisplay: 'Free'
        })
      }
    }

    loadData()
  }, [user, userStoreData, subscription, userStoreLoading])

  return (
    <Card className="flex flex-col relative">
      {/* Usage Badge */}
      {!userStoreLoading && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 z-20 text-xs text-muted-foreground border-border bg-muted/50"
        >
          {usageData && usageData.limit > 0 
            ? `${Math.round((usageData.remaining / usageData.limit) * 100)}% available`
            : "0% available"
          }
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Profile Unlocks</CardTitle>
        <div className="text-xs text-muted-foreground">
          {userStoreLoading ? "Loading..." : `${usageData?.tierDisplay || 'Free'} tier • ${usageData?.limit || 0}/month`}
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
            endAngle={usageData && usageData.limit > 0 
              ? (usageData.remaining / usageData.limit) * 360 
              : 0
            }
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
                          {loading ? "..." : (usageData?.remaining || 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {loading ? "Loading" : "remaining"}
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