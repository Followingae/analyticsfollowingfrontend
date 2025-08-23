import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalyticsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
  }
}

export function AnalyticsCard({
  title,
  value,
  icon,
  trend,
}: AnalyticsCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.value >= 0 ? "text-green-600" : "text-red-600"}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            {" from last month"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}