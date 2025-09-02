"use client"

import { useEffect, useState } from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { teamApiService } from "@/services/teamApi"

const chartConfig = {
  visitors: {
    label: "Used",
  },
  safari: {
    label: "Post Analytics",
    color: "#5100f3",
  },
} satisfies ChartConfig

export function ChartPostAnalytics() {
  const [chartData, setChartData] = useState([
    { browser: "safari", visitors: 0, fill: "#5100f3" },
  ])
  const [usageData, setUsageData] = useState<{used: number, limit: number, remaining: number} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {

        const result = await teamApiService.getTeamContext()

        
        if (result.success && result.data) {
          const teamData = result.data

          
          // Extract post data from team context
          const postsUsed = teamData.current_usage?.posts || 0
          const postsLimit = teamData.monthly_limits?.posts || 0
          const postsRemaining = teamData.remaining_capacity?.posts || (postsLimit - postsUsed)
          
          setUsageData({
            used: postsUsed,
            limit: postsLimit,
            remaining: postsRemaining
          })
          
          setChartData([{
            browser: "safari",
            visitors: postsRemaining,
            fill: "#5100f3"
          }])
          

        } else {

        }
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <Card className="flex flex-col relative">
      {/* Usage Badge */}
      {!loading && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 z-20 text-xs text-gray-600 border-gray-200 bg-gray-50"
        >
          {usageData && usageData.limit > 0 
            ? `${Math.round((usageData.remaining / usageData.limit) * 100)}% available`
            : "0% available"
          }
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Post Analytics</CardTitle>
        <div className="text-xs text-muted-foreground">5 credits per analysis</div>
      </CardHeader>
      <CardContent className="p-1">
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-square max-h-[180px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={usageData && usageData.limit > 0 
              ? (usageData.remaining / usageData.limit) * 360 
              : 0
            }
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="visitors" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {loading ? "..." : (usageData?.remaining || 0).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {loading ? "Loading" : "remaining"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}