"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"
import { creditsApiService } from "@/services/creditsApi"
import { CreditBalance } from "@/types"
import { formatCredits, getCreditBalanceStatus } from "@/utils/creditUtils"

export const description = "Credits remaining radial chart"

const chartConfig = {
  remaining: {
    label: "Remaining Credits",
  },
} satisfies ChartConfig

export function ChartPieCredits() {
  const router = useRouter()
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load credit balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setLoading(true)
        const result = await creditsApiService.getBalance()
        
        if (result.success && result.data) {
          setCreditBalance(result.data)
          setError(null)
        } else {
          setError(result.error || 'Failed to load credit balance')
        }
      } catch (err) {
        setError('Network error loading credits')
      } finally {
        setLoading(false)
      }
    }

    loadBalance()
  }, [])
  
  // Calculate chart data
  const chartData = React.useMemo(() => {
    if (!creditBalance) {
      return [{
        remaining: 0,
        percentage: 0,
        fill: "hsl(220, 14%, 96%)",
      }]
    }
    
    const totalCredits = creditBalance.monthly_allowance || creditBalance.current_balance
    const percentage = totalCredits > 0 
      ? Math.round((creditBalance.current_balance / totalCredits) * 100) 
      : 0
    
    const status = getCreditBalanceStatus(creditBalance)
    let fillColor = "hsl(75, 100%, 51%)" // Default green
    
    switch (status.status) {
      case 'critical':
      case 'empty':
        fillColor = "hsl(0, 84%, 60%)" // Red
        break
      case 'low':
        fillColor = "hsl(43, 89%, 38%)" // Orange
        break
      case 'healthy':
        fillColor = "hsl(75, 100%, 51%)" // Green
        break
    }
    
    return [{
      remaining: creditBalance.current_balance || 0,
      percentage,
      fill: fillColor,
    }]
  }, [creditBalance])

  const handleClick = () => {
    router.push("/billing")
  }

  return (
    <Card 
      className="flex flex-col cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle>Credits Consumption</CardTitle>
        <CardDescription>
          {loading ? 'Loading...' : 
           error ? 'Error loading data' :
           creditBalance ? `Total Plan Credits: ${formatCredits(creditBalance.monthly_allowance)}` : 
           '--'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (chartData[0]?.percentage * 3.6 || 0)}
            innerRadius={80}
            outerRadius={130}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[90, 80]}
            />
            <RadialBar 
              dataKey="percentage" 
              cornerRadius={8} 
              fill={chartData[0]?.fill}
              className="stroke-background stroke-2"
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
                          y={(viewBox.cy || 0) - 8}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {loading ? '--' : error ? 'Error' : formatCredits(chartData[0]?.remaining)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          {loading ? 'Loading...' : 
                           error ? 'Failed to load' :
                           creditBalance ? 'Credits Available' : 'No data'
                          }
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