'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export function SystemMonitorDashboard() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Activity className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">
            System Monitoring
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            This dashboard is under development. Real-time monitoring, security alerts, and system health metrics will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
