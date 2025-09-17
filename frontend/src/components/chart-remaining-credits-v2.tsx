"use client"

import { useState, useEffect, useMemo } from "react"
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
import { useIsAuthenticated } from "@/stores/userStore"
import { formatResetTime } from "@/utils/subscriptionUtils"

const chartConfig = {
  visitors: {
    label: "Credits",
  },
  safari: {
    label: "Remaining Credits",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartRemainingCreditsV2() {
  const isAuthenticated = useIsAuthenticated()
  const [creditsData, setCreditsData] = useState<{balance: number, maxCredits: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetTime, setResetTime] = useState<string>("")

  // Load credits data (this is separate from user context as it's more dynamic)
  useEffect(() => {
    const loadCreditsData = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        // Use request cache to prevent duplicate calls
        const { requestCache } = await import('@/utils/requestCache')
        
        const creditsResponse = await requestCache.get(
          'credits-balance-v2',
          async () => {
            const { fetchWithAuth } = await import('@/utils/apiInterceptor')
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/credits/balance`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            })
            
            if (!response.ok) {
              throw new Error(`Credits API failed: ${response.status}`)
            }
            
            return response.json()
          },
          1 * 60 * 1000 // Cache for 1 minute
        )
        
        // Handle both wrapped and direct response formats
        const creditsInfo = creditsResponse.success ? creditsResponse.data : creditsResponse
        const currentBalance = creditsInfo?.current_balance || creditsInfo?.balance || 0
        
        // Set a reasonable max for the chart visualization
        const maxCredits = Math.max(currentBalance * 1.5, 1000)
        
        setCreditsData({
          balance: currentBalance,
          maxCredits: maxCredits
        })

      } catch (error) {
        console.warn('Error loading credits:', error)
        setCreditsData({ balance: 0, maxCredits: 1000 })
      } finally {
        setLoading(false)
      }
    }

    loadCreditsData()
  }, [isAuthenticated])

  // Update reset timer every minute
  useEffect(() => {
    const updateResetTime = () => {
      setResetTime(formatResetTime())
    }
    
    // Update immediately
    updateResetTime()
    
    // Then update every minute
    const interval = setInterval(updateResetTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const chartData = useMemo(() => [
    { browser: "safari", visitors: creditsData?.balance || 0, fill: "oklch(0.4718 0.2853 280.0726)" }
  ], [creditsData?.balance])

  // Calculate percentage for the radial chart
  const getEndAngle = () => {
    if (!creditsData || creditsData.maxCredits === 0) return 0
    return (creditsData.balance / creditsData.maxCredits) * 360
  }

  // Calculate percentage for badge
  const getPercentage = () => {
    if (!creditsData || creditsData.maxCredits === 0) return 0
    return Math.round((creditsData.balance / creditsData.maxCredits) * 100)
  }

  return (
    <Card className="flex flex-col relative">
      {/* Credits Badge */}
      {!loading && creditsData && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 z-20 text-xs text-muted-foreground border-border bg-muted/30"
        >
          {creditsData.balance > 0 
            ? `${getPercentage()}% of max`
            : "0 credits"
          }
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
        <div className="text-xs text-muted-foreground">
          {loading ? "Loading..." : resetTime || "Real-time balance"}
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
            <RadialBar 
              dataKey="visitors" 
              background={{ fill: "hsl(var(--muted))" }} 
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
                          {loading ? "..." : (creditsData?.balance || 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {loading ? "Loading" : "credits"}
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