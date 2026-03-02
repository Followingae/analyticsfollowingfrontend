"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService } from "@/services/superadminApi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileDown, Inbox } from "lucide-react"
import { ExportInfluencersDialog } from "@/components/superadmin/influencer-database/ExportInfluencersDialog"
import type { ExportParams } from "@/types/influencerDatabase"

export default function ExportCenterPage() {
  const [exportOpen, setExportOpen] = useState(false)

  const handleExport = async (params: ExportParams) => {
    try {
      await superadminApiService.exportInfluencers(params)
      toast.success("Export started")
    } catch {
      toast.error("Export failed")
    }
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileDown className="h-8 w-8" />
              Export Center
            </h1>
            <p className="text-muted-foreground">
              Export influencer data in various formats
            </p>
          </div>
          <Button onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            New Export
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Previous exports and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No previous exports</p>
              <p className="text-sm mt-1">
                Create a new export to download influencer data
              </p>
            </div>
          </CardContent>
        </Card>

        <ExportInfluencersDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          selectedIds={[]}
          totalCount={0}
          onSubmit={handleExport}
        />
      </div>
    </SuperadminLayout>
  )
}
