"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

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

export const description = "A radial chart with stacked sections"

const chartData = [{ month: "january", used: 950, remaining: 250 }]

const chartConfig = {
  used: {
    label: "Used Credits",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Remaining Credits",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartRadialStacked() {
  const totalCredits = chartData[0].used + chartData[0].remaining
  const usagePercentage = ((chartData[0].used / totalCredits) * 100).toFixed(1)

  return (
    <Card className="flex flex-col h-auto">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-lg">Credits</CardTitle>
        <CardDescription className="text-sm">Current billing period</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[180px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={60}
            outerRadius={90}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent 
                  hideLabel 
                  formatter={(value, name) => [
                    `${value} credits`,
                    name === "used" ? `Used (${usagePercentage}%)` : `Remaining (${(100 - parseFloat(usagePercentage)).toFixed(1)}%)`
                  ]}
                />
              }
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 8}
                          className="fill-foreground text-xl font-bold"
                        >
                          {totalCredits.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 12}
                          className="fill-muted-foreground text-sm"
                        >
                          Credits
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="used"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-used)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="remaining"
              fill="var(--color-remaining)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}