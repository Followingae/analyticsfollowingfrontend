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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Use request cache to prevent duplicate dashboard calls
        const { requestCache, CACHE_KEYS } = await import('@/utils/requestCache')
        
        const data = await requestCache.get(
          CACHE_KEYS.DASHBOARD_STATS,
          async () => {
            const { fetchWithAuth } = await import('@/utils/apiInterceptor')
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/dashboard`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            })
            
            if (!response.ok) {
              throw new Error(`Dashboard API failed: ${response.status}`)
            }
            
            return response.json()
          },
          2 * 60 * 1000 // Cache for 2 minutes
        )

        console.log('Dashboard API response for profiles:', data)
        
        // Handle both wrapped and direct response formats
        const dashboardData = data.success ? data.data : data
        
        // Get subscription tier from user data or dashboard data
        const subscriptionTier = user?.role || dashboardData?.team?.subscription_tier || dashboardData?.subscription_tier
        
        // Get actual usage from dashboard
        const monthlyUsage = dashboardData?.team?.monthly_usage || dashboardData?.monthly_usage
        const profilesUsed = monthlyUsage?.profiles_used || monthlyUsage?.profiles || 0
        
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
        
        console.log('🔥 Profile unlocks calculated with dynamic subscription:', {
          user_role: user?.role,
          dashboard_subscription_tier: dashboardData?.team?.subscription_tier || dashboardData?.subscription_tier,
          resolved_subscription_tier: subscriptionTier,
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
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  return (
    <Card className="flex flex-col relative">
      {/* Usage Badge */}
      {!loading && (
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
          {loading ? "Loading..." : `${usageData?.tierDisplay || 'Free'} tier • ${usageData?.limit || 0}/month`}
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