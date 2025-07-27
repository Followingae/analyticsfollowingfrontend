"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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

export const description = "A line chart showing performance trends over time"

const chartData = [
  { month: "January", engagement: 186, followers: 480 },
  { month: "February", engagement: 305, followers: 520 },
  { month: "March", engagement: 237, followers: 580 },
  { month: "April", engagement: 273, followers: 650 },
  { month: "May", engagement: 309, followers: 720 },
  { month: "June", engagement: 314, followers: 800 },
  { month: "July", engagement: 345, followers: 880 },
  { month: "August", engagement: 378, followers: 960 },
  { month: "September", engagement: 398, followers: 1040 },
  { month: "October", engagement: 420, followers: 1120 },
  { month: "November", engagement: 445, followers: 1200 },
  { month: "December", engagement: 467, followers: 1280 },
]

const chartConfig = {
  engagement: {
    label: "Engagement Rate",
    color: "hsl(var(--chart-1))",
  },
  followers: {
    label: "Followers Growth",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface TrendLineChartProps {
  title?: string
  description?: string
  data?: typeof chartData
  config?: typeof chartConfig
  showGrid?: boolean
  curved?: boolean
}

export function TrendLineChart({ 
  title = "Growth Trends Analysis", 
  description = "Tracking engagement and follower growth over time",
  data = chartData,
  config = chartConfig,
  showGrid = true,
  curved = true
}: TrendLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            {showGrid && <CartesianGrid vertical={false} />}
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="engagement"
              type={curved ? "monotone" : "linear"}
              stroke="var(--color-engagement)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-engagement)",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="followers"
              type={curved ? "monotone" : "linear"}
              stroke="var(--color-followers)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-followers)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}