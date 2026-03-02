"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users } from "lucide-react"
import type { MasterInfluencer } from "@/types/influencerDatabase"

interface InfluencerAccessTabProps {
  influencer: MasterInfluencer
}

export function InfluencerAccessTab({ influencer }: InfluencerAccessTabProps) {
  // Access shares are managed elsewhere; this is a read-only placeholder.
  // In a real implementation, this would receive shares as a prop or fetch them.
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Access Shares</h3>
      </div>

      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-medium text-sm">Not currently shared with any users</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          This influencer is not part of any active access shares. Manage sharing
          from the Access Sharing page.
        </p>
      </Card>
    </div>
  )
}
