"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"

export const dynamic = 'force-dynamic'

export default function SuperadminLogsPage() {
  return (
    <SuperadminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">View system and user activity logs</p>
        </div>
      </div>

      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Activity Monitoring</h3>
        <p className="text-muted-foreground">
          Activity log viewer coming soon...
        </p>
      </div>
    </SuperadminLayout>
  )
}