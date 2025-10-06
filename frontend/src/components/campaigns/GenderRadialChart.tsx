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

interface GenderRadialChartProps {
  malePercentage: number
  femalePercentage: number
}

const chartConfig = {
  male: {
    label: "Male",
    color: "#3b82f6", // Blue
  },
  female: {
    label: "Female",
    color: "#ec4899", // Pink
  },
} satisfies ChartConfig

export function GenderRadialChart({ malePercentage, femalePercentage }: GenderRadialChartProps) {
  const chartData = [{
    segment: "gender",
    male: malePercentage,
    female: femalePercentage
  }]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Audience demographics</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={360}
            innerRadius={60}
            outerRadius={100}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value) => `${value.toFixed(1)}%`} />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 10}
                          className="fill-foreground text-xl font-bold"
                        >
                          {malePercentage > femalePercentage ? 'Male' : 'Female'}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 10}
                          className="fill-muted-foreground text-sm"
                        >
                          {Math.max(malePercentage, femalePercentage).toFixed(1)}%
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="male"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-male)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="female"
              fill="var(--color-female)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-muted-foreground">Male {malePercentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ec4899" }} />
            <span className="text-muted-foreground">Female {femalePercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}