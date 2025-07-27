"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, ArrowRight, Target, Users, Eye, Heart } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface MetricData {
  label: string
  value: string | number
  previousValue?: string | number
  change?: number
  unit?: string
  icon?: React.ReactNode
  color?: string
  target?: number
  description?: string
}

interface MetricsComparisonProps {
  title?: string
  description?: string
  metrics: MetricData[]
  layout?: "grid" | "list"
  showComparison?: boolean
  showTargets?: boolean
}

export function MetricsComparison({
  title = "Performance Metrics Comparison",
  description = "Compare key performance indicators with previous period",
  metrics,
  layout = "grid",
  showComparison = true,
  showTargets = false
}: MetricsComparisonProps) {
  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M${unit || ''}`
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K${unit || ''}`
      return `${value}${unit || ''}`
    }
    return value
  }

  const getTrendIcon = (change?: number) => {
    if (!change) return null
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTrendColor = (change?: number) => {
    if (!change) return "text-muted-foreground"
    return change > 0 ? "text-green-600" : "text-red-600"
  }

  if (layout === "list") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {metric.icon && (
                    <div className={`p-2 rounded-lg ${metric.color ? `bg-${metric.color}-100 text-${metric.color}-600` : 'bg-muted'}`}>
                      {metric.icon}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{metric.label}</h4>
                    {metric.description && (
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatValue(metric.value, metric.unit)}
                  </div>
                  {showComparison && metric.change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${getTrendColor(metric.change)}`}>
                      {getTrendIcon(metric.change)}
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                {showComparison && metric.change !== undefined && (
                  <Badge 
                    variant={metric.change > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {formatValue(metric.value, metric.unit)}
                </div>
                {metric.previousValue && showComparison && (
                  <div className="text-sm text-muted-foreground">
                    Previous: {formatValue(metric.previousValue, metric.unit)}
                  </div>
                )}
                {metric.description && (
                  <div className="text-xs text-muted-foreground">
                    {metric.description}
                  </div>
                )}
              </div>

              {showTargets && metric.target && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress to target</span>
                    <span>{Math.round((Number(metric.value) / metric.target) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(Number(metric.value) / metric.target) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Example usage with sample data
export function SampleMetricsComparison() {
  const sampleMetrics: MetricData[] = [
    {
      label: "Total Reach",
      value: 2400000,
      previousValue: 2100000,
      change: 14.3,
      icon: <Eye className="h-4 w-4" />,
      target: 3000000,
      description: "Unique accounts reached"
    },
    {
      label: "Engagement Rate",
      value: 4.8,
      previousValue: 4.2,
      change: 14.3,
      unit: "%",
      icon: <Heart className="h-4 w-4" />,
      target: 5.5,
      description: "Average engagement across posts"
    },
    {
      label: "Active Creators",
      value: 156,
      previousValue: 134,
      change: 16.4,
      icon: <Users className="h-4 w-4" />,
      target: 200,
      description: "Creators in active campaigns"
    },
    {
      label: "Campaign ROI",
      value: 325,
      previousValue: 280,
      change: 16.1,
      unit: "%",
      icon: <Target className="h-4 w-4" />,
      target: 400,
      description: "Return on investment"
    }
  ]

  return (
    <MetricsComparison
      metrics={sampleMetrics}
      showComparison={true}
      showTargets={true}
    />
  )
}