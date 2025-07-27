"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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

export const description = "An interactive bar chart"

// Sample campaign data - replace with real data
const campaignData = [
  { 
    id: 1,
    name: "Summer Fashion 2024",
    data: [
      { date: "2024-06-01", reach: 45000, engagement: 2100 },
      { date: "2024-06-02", reach: 52000, engagement: 2500 },
      { date: "2024-06-03", reach: 48000, engagement: 2200 },
      { date: "2024-06-04", reach: 61000, engagement: 3100 },
      { date: "2024-06-05", reach: 55000, engagement: 2800 },
      { date: "2024-06-06", reach: 67000, engagement: 3400 },
      { date: "2024-06-07", reach: 58000, engagement: 2900 },
    ]
  },
  { 
    id: 2,
    name: "Fitness Challenge",
    data: [
      { date: "2024-06-08", reach: 38000, engagement: 2800 },
      { date: "2024-06-09", reach: 42000, engagement: 3200 },
      { date: "2024-06-10", reach: 39000, engagement: 2900 },
      { date: "2024-06-11", reach: 51000, engagement: 3800 },
      { date: "2024-06-12", reach: 46000, engagement: 3400 },
      { date: "2024-06-13", reach: 54000, engagement: 4100 },
      { date: "2024-06-14", reach: 49000, engagement: 3600 },
    ]
  },
  { 
    id: 3,
    name: "Tech Product Launch",
    data: [
      { date: "2024-06-15", reach: 72000, engagement: 4200 },
      { date: "2024-06-16", reach: 68000, engagement: 3900 },
      { date: "2024-06-17", reach: 85000, engagement: 5100 },
      { date: "2024-06-18", reach: 79000, engagement: 4700 },
      { date: "2024-06-19", reach: 91000, engagement: 5400 },
      { date: "2024-06-20", reach: 87000, engagement: 5200 },
      { date: "2024-06-21", reach: 95000, engagement: 5800 },
    ]
  }
]

const chartConfig = {
  reach: {
    label: "Reach",
    color: "var(--chart-1)",
  },
  engagement: {
    label: "Engagement",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartBarInteractive() {
  const [activeCampaign, setActiveCampaign] = React.useState(0)
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("reach")

  // If no campaigns exist, show create campaign prompt
  if (campaignData.length === 0) {
    return (
      <Card className="py-0">
        <CardHeader className="text-center p-8">
          <CardTitle>Recent Campaign Stats</CardTitle>
          <CardDescription className="mb-4">
            Track your campaign performance over time
          </CardDescription>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-muted-foreground text-sm">
              No campaigns found
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create your first campaign
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const currentCampaign = campaignData[activeCampaign]
  const chartData = currentCampaign.data

  const total = React.useMemo(
    () => ({
      reach: chartData.reduce((acc, curr) => acc + curr.reach, 0),
      engagement: chartData.reduce((acc, curr) => acc + curr.engagement, 0),
    }),
    [chartData]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Recent Campaign Stats</CardTitle>
          <div className="flex gap-2 mt-2">
            {campaignData.map((campaign, index) => (
              <Button
                key={campaign.id}
                variant={activeCampaign === index ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCampaign(index)}
                className="text-xs"
              >
                Campaign {index + 1}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex">
          {["reach", "engagement"].map((key) => {
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