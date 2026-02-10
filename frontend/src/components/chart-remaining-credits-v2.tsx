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

        const walletResponse = await requestCache.get(
          'wallet-summary-v2',
          async () => {
            const { fetchWithAuth } = await import('@/utils/apiInterceptor')
            const { API_CONFIG, ENDPOINTS } = await import('@/config/api')

            const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.walletSummary}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            })

            if (!response.ok) {
              throw new Error(`Wallet API failed: ${response.status}`)
            }

            return response.json()
          },
          1 * 60 * 1000 // Cache for 1 minute
        )

        // Handle both wrapped and direct response formats
        const walletInfo = walletResponse.success ? walletResponse.data : walletResponse

        // Debug logging to understand the data structure
        console.log('Wallet Response:', walletInfo)

        const currentBalance = walletInfo?.current_balance || 0
        const monthlyAllowance = walletInfo?.monthly_allowance || walletInfo?.total_plan_credits || 0

        // Use monthly_allowance as the max for accurate percentage calculation
        const maxCredits = monthlyAllowance > 0 ? monthlyAllowance : Math.max(currentBalance, 1000)

        console.log('Credits calculation:', {
          currentBalance,
          monthlyAllowance,
          maxCredits,
          percentage: Math.round((currentBalance / maxCredits) * 100)
        })

        setCreditsData({
          balance: currentBalance,
          maxCredits: maxCredits
        })

      } catch (error) {
        console.warn('Error loading wallet data:', error)
        setCreditsData({ balance: 0, maxCredits: 1000 })
      } finally {
        setLoading(false)
      }
    }

    loadCreditsData()
  }, [isAuthenticated])

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
    const percentage = Math.round((creditsData.balance / creditsData.maxCredits) * 100)
    // Cap percentage at 100% to avoid display issues
    return Math.min(percentage, 100)
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
          {loading ? "Loading..." : "Real-time balance"}
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