"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"

export const dynamic = 'force-dynamic'

export default function SuperadminAccessPage() {
  return (
    <SuperadminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Control</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
      </div>

      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Permission Management</h3>
        <p className="text-muted-foreground">
          Access control management coming soon...
        </p>
      </div>
    </SuperadminLayout>
  )
}