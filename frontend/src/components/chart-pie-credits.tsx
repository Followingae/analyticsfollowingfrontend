"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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

export const description = "Credits remaining radial chart"

const chartConfig = {
  remaining: {
    label: "Remaining Credits",
  },
} satisfies ChartConfig

export function ChartPieCredits() {
  const router = useRouter()
  
  // Sample data for demonstration - replace with real backend data
  const totalPlanCredits = 1000
  const remainingCredits = 450
  
  // Calculate percentage for radial display
  const remainingPercentage = totalPlanCredits > 0 ? Math.round((remainingCredits / totalPlanCredits) * 100) : 0
  
  const chartData = [
    {
      remaining: remainingCredits,
      percentage: remainingPercentage,
      fill: "hsl(75, 100%, 51%)",
    },
  ]

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
        <CardDescription>Total Plan Credits: {totalPlanCredits || '--'}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (remainingPercentage * 3.6 || 0)}
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
              fill="hsl(75, 100%, 51%)"
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
                          {remainingCredits || '--'}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          {remainingCredits ? 'Credits Available' : 'Loading...'}
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