"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { BarChart3, Target, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"


const chartConfig = {
  views: {
    label: "Campaign Performance",
  },
  desktop: {
    label: "Engagement Rate",
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Reach",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface ChartBarInteractiveProps {
  campaigns?: any[]
  campaignsLoading?: boolean
}

export function ChartBarInteractive({ campaigns, campaignsLoading }: ChartBarInteractiveProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop")

  const chartData = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return []

    return campaigns.map((campaign: any) => ({
      date: campaign.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      desktop: campaign.engagement_rate || 0,
      mobile: campaign.reach || 0,
    }))
  }, [campaigns])

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + (curr.desktop || 0), 0),
      mobile: chartData.reduce((acc, curr) => acc + (curr.mobile || 0), 0),
    }),
    [chartData]
  )

  if (campaignsLoading) {
    return (
      <Card className="py-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading campaign data...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        title="No Campaign Data Available"
        description="Start creating campaigns to see performance metrics here.

Track engagement rates, reach metrics, and campaign success over time."
        icons={[BarChart3, Target, TrendingUp]}
        className="p-12"
      />
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-6">
          <CardTitle>Recent Campaign Performance</CardTitle>
          <CardDescription>
            Campaign engagement and reach metrics over time
          </CardDescription>
        </div>
        <div className="flex">
          {["desktop", "mobile"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
