"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { TrendingUp, TrendingDown, Eye, Users, Heart, Target, MoreHorizontal } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Sample data for demonstration - replace with props from parent component
const trendData = [
  { month: "Jan", value: 2400 },
  { month: "Feb", value: 1398 },
  { month: "Mar", value: 9800 },
  { month: "Apr", value: 3908 },
  { month: "May", value: 4800 },
  { month: "Jun", value: 3800 },
]

const comparisonData = [
  { metric: "Reach", current: 4000, previous: 2400 },
  { metric: "Engagement", current: 3000, previous: 1398 },
  { metric: "Conversions", current: 2000, previous: 9800 },
  { metric: "ROI", current: 2780, previous: 3908 },
]

const distributionData = [
  { name: "Photos", value: 45, color: "#0088FE" },
  { name: "Videos", value: 30, color: "#00C49F" },
  { name: "Stories", value: 15, color: "#FFBB28" },
  { name: "Reels", value: 10, color: "#FF8042" },
]

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
  current: {
    label: "Current",
    color: "hsl(var(--chart-1))",
  },
  previous: {
    label: "Previous",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface AnalyticsDashboardWidgetProps {
  title?: string
  description?: string
  showControls?: boolean
  variant?: "compact" | "detailed"
  data?: {
    reach?: number
    engagement?: number
    followers?: number
    roi?: number
  }
}

export function AnalyticsDashboardWidget({
  title = "Analytics Overview",
  description = "Comprehensive performance insights and trends",
  showControls = true,
  variant = "detailed",
  data
}: AnalyticsDashboardWidgetProps) {
  const [activeTab, setActiveTab] = React.useState("overview")

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Key metrics with real data or fallback
  const keyMetrics = [
    {
      label: "Total Reach",
      value: data?.reach ? formatNumber(data.reach) : "2.4M",
      change: data?.reach ? 12.5 : 12.5,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: "Engagement Rate", 
      value: data?.engagement ? `${data.engagement.toFixed(1)}%` : "4.2%",
      change: data?.engagement ? (data.engagement > 3 ? 8.3 : -2.1) : 8.3,
      icon: <Heart className="h-4 w-4" />,
    },
    {
      label: "Active Followers",
      value: data?.followers ? formatNumber(data.followers) : "1.2M",
      change: data?.followers ? 15.7 : 15.7,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Performance ROI",
      value: data?.roi ? `${data.roi.toFixed(0)}%` : "325%",
      change: data?.roi ? data.roi / 10 : 22.1,
      icon: <Target className="h-4 w-4" />,
    },
  ]

  if (variant === "compact") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {showControls && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                  <DropdownMenuItem>Configure</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{metric.value}</span>
                  <Badge 
                    variant={metric.change > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Customize View</DropdownMenuItem>
                  <DropdownMenuItem>Download Report</DropdownMenuItem>
                  <DropdownMenuItem>Share Dashboard</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {metric.icon}
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className={`flex items-center gap-1 text-sm ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Comparison */}
            <div>
              <h4 className="text-sm font-medium mb-4">Performance vs Previous Period</h4>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={comparisonData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="var(--color-current)" radius={4} />
                  <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">6-Month Trend Analysis</h4>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <LineChart data={trendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="value"
                    type="monotone"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-value)" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            
            {/* Trend Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Positive Trend
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Engagement rate increased by 24% over the last quarter
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Goal Progress
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  82% progress toward quarterly engagement target
                </p>
                <Progress value={82} className="mt-2 h-2" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-4">Content Type Distribution</h4>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-4">Distribution Breakdown</h4>
                <div className="space-y-3">
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}