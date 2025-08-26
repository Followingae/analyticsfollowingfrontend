"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

const chartConfig = {
  engagement_rate: {
    label: "Engagement Rate",
    color: "hsl(var(--chart-1))",
  },
  likes: {
    label: "Likes",
    color: "hsl(var(--chart-2))",
  },
  comments: {
    label: "Comments",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface RealEngagementTimelineProps {
  data?: Array<{
    id: string
    shortcode: string
    timestamp: number
    likes: number
    comments: number
    is_video: boolean
    video_views?: number
    engagement_rate: number
  }>
  username?: string
  title?: string
  description?: string
}

export function RealEngagementTimeline({ 
  data, 
  username,
  title = "Real Engagement Timeline",
  description = "Actual post performance over time"
}: RealEngagementTimelineProps) {
  // Transform data for chart - sort by timestamp and format
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((post, index) => ({
        post_number: index + 1,
        date: new Date(post.timestamp * 1000).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        engagement_rate: parseFloat(post.engagement_rate.toFixed(2)),
        likes: post.likes,
        comments: post.comments,
        is_video: post.is_video,
        video_views: post.video_views || 0,
        full_date: new Date(post.timestamp * 1000).toLocaleDateString(),
        shortcode: post.shortcode
      }))
  }, [data])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📊</div>
            <p>No post data available for timeline analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} • {data.length} recent posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelFormatter={(value, payload) => {
                    const data = payload?.[0]?.payload
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{data?.full_date}</div>
                        <div className="text-sm text-muted-foreground">
                          {data?.is_video ? '🎥 Video Post' : '📷 Photo Post'}
                        </div>
                      </div>
                    )
                  }}
                  formatter={(value, name) => {
                    if (name === 'engagement_rate') {
                      return [`${value}%`, 'Engagement Rate']
                    }
                    return [formatNumber(Number(value)), name === 'likes' ? 'Likes' : 'Comments']
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="engagement_rate"
              stroke="var(--color-engagement_rate)"
              strokeWidth={3}
              dot={{ fill: "var(--color-engagement_rate)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-engagement_rate)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
        
        {/* Performance Summary */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-bold text-lg">
                {(chartData.reduce((sum, post) => sum + post.engagement_rate, 0) / chartData.length).toFixed(2)}%
              </div>
              <div className="text-muted-foreground">Avg Engagement</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-bold text-lg">
                {Math.max(...chartData.map(p => p.engagement_rate)).toFixed(2)}%
              </div>
              <div className="text-muted-foreground">Best Post</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-bold text-lg">
                {formatNumber(chartData.reduce((sum, post) => sum + post.likes, 0))}
              </div>
              <div className="text-muted-foreground">Total Likes</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-bold text-lg">
                {((chartData.filter(p => p.is_video).length / chartData.length) * 100).toFixed(0)}%
              </div>
              <div className="text-muted-foreground">Video Content</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}