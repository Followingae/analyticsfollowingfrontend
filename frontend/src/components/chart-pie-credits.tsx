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
        
        // Use new total plan credits endpoint for complete information
        const planCreditsResult = await creditsApiService.getTotalPlanCredits()
        
        if (planCreditsResult.success && planCreditsResult.data) {

          
          // Map the new response to our credit balance format
          const planData = planCreditsResult.data
          const mappedCreditBalance = {
            current_balance: planData.current_balance,
            monthly_allowance: planData.monthly_allowance,
            package_name: planData.package_name,
            total_plan_credits: planData.total_plan_credits,
            package_credits: planData.package_credits,
            purchased_credits: planData.purchased_credits,
            bonus_credits: planData.bonus_credits,
            billing_cycle_start: new Date().toISOString(),
            wallet_status: 'active' as const
          }
          

          setCreditBalance(mappedCreditBalance)
          setError(null)
        } else {

          // Fallback to balance endpoint
          const balanceResult = await creditsApiService.getBalance()
          if (balanceResult.success && balanceResult.data) {

            setCreditBalance(balanceResult.data)
            setError(null)
          } else {
            setError(balanceResult.error || 'Failed to load credit balance')
          }
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
    
    // For balance-based system (premium users), show percentage of current balance
    // For allowance-based system, show percentage of monthly allowance used
    const currentBalance = creditBalance.current_balance || 0
    const monthlyAllowance = creditBalance.monthly_allowance || 0
    
    let totalCredits = currentBalance
    let remainingCredits = currentBalance
    let percentage = 100 // Default to full if just showing balance
    
    if (monthlyAllowance > 0) {
      // Allowance-based system
      totalCredits = monthlyAllowance
      remainingCredits = currentBalance
      percentage = Math.round((remainingCredits / totalCredits) * 100)
    } else {
      // Balance-based system - show as percentage of total (assume some usage pattern)
      // For display purposes, show current balance as 100% available
      percentage = 100
    }
    
    const status = getCreditBalanceStatus(creditBalance)
    let fillColor = "hsl(var(--primary))" // Brand color default
    
    switch (status.status) {
      case 'critical':
      case 'empty':
        fillColor = "hsl(var(--primary))" // Brand color
        break
      case 'low':
        fillColor = "hsl(var(--primary))" // Brand color
        break
      case 'healthy':
        fillColor = "hsl(var(--primary))" // Brand color
        break
    }
    
    return [{
      remaining: remainingCredits,
      percentage,
      fill: fillColor,
    }]
  }, [creditBalance])

  const handleClick = () => {
    router.push("/billing")
  }

  return (
    <Card 
      className="flex flex-col h-full cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle>Credits Consumption</CardTitle>
        <CardDescription>
          {loading ? 'Loading...' : 
           error ? 'Error loading data' :
           creditBalance ? `Total Plan Credits: ${formatCredits((creditBalance as any).total_plan_credits || creditBalance.current_balance)}` : 
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