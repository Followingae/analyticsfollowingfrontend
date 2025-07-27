"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

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

export const description = "An interactive pie chart with center label"

const chartData = [
  { category: "Fashion", visitors: 275, fill: "var(--color-fashion)" },
  { category: "Technology", visitors: 200, fill: "var(--color-technology)" },
  { category: "Fitness", visitors: 187, fill: "var(--color-fitness)" },
  { category: "Food", visitors: 173, fill: "var(--color-food)" },
  { category: "Travel", visitors: 90, fill: "var(--color-travel)" },
]

const chartConfig = {
  visitors: {
    label: "Creators",
  },
  fashion: {
    label: "Fashion",
    color: "hsl(var(--chart-1))",
  },
  technology: {
    label: "Technology",
    color: "hsl(var(--chart-2))",
  },
  fitness: {
    label: "Fitness",
    color: "hsl(var(--chart-3))",
  },
  food: {
    label: "Food",
    color: "hsl(var(--chart-4))",
  },
  travel: {
    label: "Travel",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

interface InteractivePieChartProps {
  title?: string
  description?: string
  data?: typeof chartData
  config?: typeof chartConfig
  centerLabel?: string
  centerValue?: string
}

export function InteractivePieChart({ 
  title = "Creator Distribution by Category", 
  description = "Distribution of creators across different content categories",
  data = chartData,
  config = chartConfig,
  centerLabel = "Total Creators",
  centerValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.visitors, 0).toString()
  }, [data])
}: InteractivePieChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="visitors"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {centerValue}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {centerLabel}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}