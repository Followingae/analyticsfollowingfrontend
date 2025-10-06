"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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

interface InterestsRadarChartProps {
  interests: { [key: string]: number }
}

const chartConfig = {
  interest: {
    label: "Interest Level",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function InterestsRadarChart({ interests }: InterestsRadarChartProps) {
  const chartData = Object.entries(interests)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([interest, percentage]) => ({
      interest: interest.charAt(0).toUpperCase() + interest.slice(1),
      value: percentage * 100,
      // Truncate long labels for display
      label: interest.length > 10 ?
        interest.substring(0, 8).charAt(0).toUpperCase() + interest.substring(1, 8) + '...' :
        interest.charAt(0).toUpperCase() + interest.slice(1)
    }))

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Audience Interests</CardTitle>
        <CardDescription>
          Top interests of campaign audience
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[280px]"
        >
          <RadarChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="text-xs"
            />
            <PolarGrid />
            <Radar
              dataKey="value"
              fill="var(--color-interest)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}