"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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

interface AudienceBarChartProps {
  title: string
  description?: string
  data: Array<{ label: string; value: number }>
}

const chartConfig = {
  value: {
    label: "Percentage",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function AudienceBarChart({
  title,
  description,
  data
}: AudienceBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 50,
              left: 0,
              top: 0,
              bottom: 0
            }}
            barGap={2}
            barCategoryGap={8}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="value"
              layout="vertical"
              fill="var(--color-value)"
              radius={4}
              barSize={20}
            >
              <LabelList
                dataKey="label"
                position="insideLeft"
                offset={8}
                className="fill-[var(--color-label)]"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}