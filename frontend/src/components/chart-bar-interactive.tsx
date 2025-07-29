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

interface ChartBarInteractiveProps {
  campaignData?: Array<{
    id: number
    name: string
    data: Array<{
      date: string
      reach: number
      engagement: number
    }>
  }>
}

// Sample data for visual empty state
const sampleChartData = [
  { date: "2024-01-01", reach: 42000, engagement: 1950 },
  { date: "2024-01-02", reach: 45000, engagement: 2100 },
  { date: "2024-01-03", reach: 52000, engagement: 2500 },
  { date: "2024-01-04", reach: 48000, engagement: 2200 },
  { date: "2024-01-05", reach: 61000, engagement: 3100 },
  { date: "2024-01-06", reach: 55000, engagement: 2800 },
  { date: "2024-01-07", reach: 67000, engagement: 3400 },
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

export function ChartBarInteractive({ campaignData = [] }: ChartBarInteractiveProps = {}) {
  const [activeCampaign, setActiveCampaign] = React.useState(0)
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("reach")

  // If no campaigns exist, show blurred chart with create campaign prompt
  if (campaignData.length === 0) {
    const sampleTotal = {
      reach: sampleChartData.reduce((acc, curr) => acc + curr.reach, 0),
      engagement: sampleChartData.reduce((acc, curr) => acc + curr.engagement, 0),
    }

    return (
      <Card className="py-0 relative">
        {/* Blurred Chart Background */}
        <div className="opacity-50 blur-[2px] pointer-events-none grayscale">
          <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
              <CardTitle>Recent Campaign Stats</CardTitle>
              <div className="flex gap-2 mt-2">
                <Button variant="default" size="sm" className="text-xs">
                  Campaign 1
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Campaign 2
                </Button>
              </div>
            </div>
            <div className="flex">
              {["reach", "engagement"].map((key) => {
                const chart = key as keyof typeof chartConfig
                return (
                  <button
                    key={chart}
                    className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                  >
                    <span className="text-muted-foreground text-xs">
                      {chartConfig[chart].label}
                    </span>
                    <span className="text-lg leading-none font-bold sm:text-3xl">
                      {sampleTotal[key as keyof typeof sampleTotal].toLocaleString()}
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
                data={sampleChartData}
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
                <Bar dataKey="reach" fill="#374151" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </div>

        {/* Centered Create Campaign Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <div className="text-center">
            <div className="text-muted-foreground text-sm mb-4">
              No campaigns found
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create your first campaign
            </Button>
          </div>
        </div>
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