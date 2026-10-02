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
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useIsAuthenticated } from "@/stores/userStore"
import { UNKNOWN } from "@/components/brand/primitives"

const chartConfig = {
  visitors: {
    label: "Credits",
  },
  safari: {
    label: "Remaining Credits",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartRemainingCreditsV2() {
  const isAuthenticated = useIsAuthenticated()
  const [creditsData, setCreditsData] = useState<{balance: number, maxCredits: number | null} | null>(null)
  const [loading, setLoading] = useState(true)
  // A failed read is its own state. It is NOT a zero balance.
  const [failed, setFailed] = useState(false)

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

        const currentBalance = walletInfo?.current_balance || 0
        const monthlyAllowance = walletInfo?.monthly_allowance || walletInfo?.total_plan_credits || 0

        // The denominator is the server's allowance or it is nothing.
        //
        // This used to fall back to `Math.max(currentBalance, 1000)`, so when the allowance
        // was missing the ring was drawn against an invented 1000 and the arc length — the
        // thing a user reads at a glance — was a guess. The comment below already condemns
        // inventing `maxCredits: 1000` on failure; half of that invention was living on the
        // success path. `null` means we know the balance but not the ceiling, and the dial
        // renders the figure inside a plain complete ring rather than a false fraction.
        setCreditsData({
          balance: currentBalance,
          maxCredits: monthlyAllowance > 0 ? monthlyAllowance : null
        })

      } catch {
        // This used to invent { balance: 0, maxCredits: 1000 } and render it as fact, so a
        // brand holding 8,750 credits was shown a confident 0 whenever the wallet call
        // failed - while the top bar, reading a different source, still said 8,750. A
        // fabricated zero on a balance is the worst possible failure mode: it is indis-
        // tinguishable from the real thing and it is the number somebody acts on.
        setCreditsData(null)
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }

    loadCreditsData()
  }, [isAuthenticated])

  const chartData = useMemo(() => [
    { browser: "safari", visitors: creditsData?.balance || 0, fill: "var(--chart-1)" }
  ], [creditsData?.balance])

  // How much of the ring to draw.
  //
  // A known allowance gives a real fraction. No allowance gives a COMPLETE ring: we know the
  // balance but not the ceiling, and a partial arc would be a fraction of a number nobody
  // sent us. A genuine zero balance on a capped plan still draws an empty ring, because that
  // one is true.
  const getEndAngle = () => {
    if (!creditsData) return 0
    if (creditsData.maxCredits == null || creditsData.maxCredits <= 0) return 360
    return Math.min(creditsData.balance / creditsData.maxCredits, 1) * 360
  }

  /** What a screen reader is told, since the figure itself lives in an SVG <tspan>. */
  const spokenValue = loading
    ? 'Loading your credit balance'
    : failed
      ? 'Your credit balance did not load. This is a display problem, not a balance of zero.'
      : creditsData?.maxCredits
        ? `${creditsData.balance.toLocaleString()} credits remaining of ${creditsData.maxCredits.toLocaleString()}`
        : `${(creditsData?.balance ?? 0).toLocaleString()} credits remaining`


  return (
    <Card className="flex flex-col relative">
      {/* The "resets in Nd" badge is gone; see the note in chart-profile-analysis-v2.
          It counted to the first of the calendar month while billing runs from each
          customer's subscription anniversary, so it printed a limit the server never
          named. It returns when the API sends a real `next_reset_at`, as an absolute date. */}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
        <div className="text-xs text-muted-foreground">
          {loading ? "Loading..." : failed ? "Could not load your balance" : "Real-time balance"}
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
              background={{ fill: "var(--muted)" }} 
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
                          {loading ? "..." : failed ? UNKNOWN : (creditsData?.balance ?? 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {loading ? "Loading" : failed ? "not loaded" : "credits"}
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