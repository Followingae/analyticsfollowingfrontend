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
    <Card className={`shadow-sm ${className ?? ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-semibold tabular-nums">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { StandardMetricCard }
export type { StandardMetricCardProps }
