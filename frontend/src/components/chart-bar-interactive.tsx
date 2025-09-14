"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { API_CONFIG } from '@/config/api'
import { Plus, BarChart3, TrendingUp, Target, FileText } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { useDashboardData } from "@/hooks/useDashboardData"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

const chartConfig = {
  reach: {
    label: "Reach",
    color: "oklch(0.4718 0.2853 280.0726)",
  },
  views: {
    label: "Views", 
    color: "oklch(0.4718 0.2853 280.0726)",
  },
} satisfies ChartConfig

interface Campaign {
  id: string
  name: string
  status: string
}

export function ChartBarInteractive() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("reach")
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null)
  const [chartData, setChartData] = React.useState<any[]>([])
  
  // Use dashboard data hook instead of separate API calls
  const { campaigns, campaignsLoading } = useDashboardData()

  // Set default campaign when campaigns data is available
  React.useEffect(() => {
    if (!campaignsLoading && campaigns && campaigns.length > 0) {
      // Find active campaign or use first one
      const activeCampaign = campaigns.find((c: any) => c.status === 'active') || campaigns[0]
      
      if (activeCampaign) {
        setSelectedCampaign(activeCampaign)
        loadMockAnalytics(activeCampaign)
      }
    }
  }, [campaigns, campaignsLoading])

  // Generate mock analytics data for the selected campaign
  const loadMockAnalytics = (campaign: any) => {
    // Generate 30 days of mock data based on campaign performance
    const mockData = []
    const baseReach = campaign.impressions || 15000
    const baseViews = campaign.clicks || 800
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Add some realistic variation (+/- 30%)
      const reachVariation = 0.7 + Math.random() * 0.6
      const viewsVariation = 0.7 + Math.random() * 0.6
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        reach: Math.floor(baseReach * reachVariation / 30),
        views: Math.floor(baseViews * viewsVariation / 30),
        impressions: Math.floor(baseReach * reachVariation / 30 * 1.2),
        engagement: Math.floor(baseViews * viewsVariation / 30 * 0.8),
        clicks: Math.floor(baseViews * viewsVariation / 30 * 0.6)
      })
    }
    
    setChartData(mockData)
  }

  const total = React.useMemo(
    () => ({
      reach: chartData.reduce((acc, curr) => acc + (curr.reach || 0), 0),
      views: chartData.reduce((acc, curr) => acc + (curr.views || 0), 0),
    }),
    [chartData]
  )

  // Loading state
  if (campaignsLoading) {
    return (
      <Card className="py-0">
        <CardContent className="flex items-center justify-center h-[320px]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary))] border-t-transparent"></div>
            <div className="text-sm text-muted-foreground">Loading campaign data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state - no campaigns
  if (!selectedCampaign || !campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        title="No campaigns found"
        description="You haven't created any campaigns yet. Get started by creating your first campaign to track performance."
        icons={[Target, BarChart3, FileText]}
        action={{
          label: "Create campaign",
          onClick: () => window.open('/campaigns/new', '_blank')
        }}
      />
    )
  }

  // Empty state - campaign exists but no analytics data
  if (chartData.length === 0) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle>Recent Campaign Stats</CardTitle>
            <CardDescription>
              {selectedCampaign?.name || 'Campaign Analytics'}
            </CardDescription>
          </div>
          <div className="flex">
            {["reach", "views"].map((key) => {
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
                    0
                  </span>
                </button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <EmptyState
            title="No analytics data yet"
            description="Analytics data will appear here once your campaign\nstarts generating activity and engagement."
            icons={[TrendingUp]}
            className="max-w-md"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Recent Campaign Stats</CardTitle>
          <CardDescription>
            {selectedCampaign?.name || 'No campaign selected'}
          </CardDescription>
        </div>
        <div className="flex">
          {["reach", "views"].map((key) => {
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
          className="aspect-auto min-h-[200px] w-full"
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
            <Bar dataKey={activeChart} fill="oklch(0.4718 0.2853 280.0726)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}