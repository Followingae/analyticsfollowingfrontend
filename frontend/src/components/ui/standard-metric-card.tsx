import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StandardMetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  subtitle?: string
  className?: string
}

function StandardMetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  className,
}: StandardMetricCardProps) {
  return (
    <Card className={`border-0 shadow-sm ${className ?? ""}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-base text-muted-foreground">{label}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

export { StandardMetricCard }
export type { StandardMetricCardProps }
