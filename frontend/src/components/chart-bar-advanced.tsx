"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An advanced bar chart with multiple data series"

const chartData = [
  { month: "January", engagement: 186, reach: 80, conversions: 45 },
  { month: "February", engagement: 305, reach: 200, conversions: 78 },
  { month: "March", engagement: 237, reach: 120, conversions: 52 },
  { month: "April", engagement: 73, reach: 190, conversions: 31 },
  { month: "May", engagement: 209, reach: 130, conversions: 67 },
  { month: "June", engagement: 214, reach: 140, conversions: 89 },
]

const chartConfig = {
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-1))",
  },
  reach: {
    label: "Reach",
    color: "hsl(var(--chart-2))",
  },
  conversions: {
    label: "Conversions",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface AdvancedBarChartProps {
  title?: string
  description?: string
  data?: typeof chartData
  config?: typeof chartConfig
}

export function AdvancedBarChart({ 
  title = "Campaign Performance Metrics", 
  description = "Monthly comparison of key performance indicators",
  data = chartData,
  config = chartConfig 
}: AdvancedBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="engagement" fill="var(--color-engagement)" radius={4} />
            <Bar dataKey="reach" fill="var(--color-reach)" radius={4} />
            <Bar dataKey="conversions" fill="var(--color-conversions)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}