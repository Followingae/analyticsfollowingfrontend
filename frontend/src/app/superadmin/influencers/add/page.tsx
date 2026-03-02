"use client"

export const dynamic = 'force-dynamic'

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Upload } from "lucide-react"
import { AddInfluencerForm } from "@/components/superadmin/influencer-database/AddInfluencerForm"
import { BulkImportForm } from "@/components/superadmin/influencer-database/BulkImportForm"

export default function AddInfluencerPage() {
  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Influencers</h1>
          <p className="text-muted-foreground">
            Add individual influencers or bulk import from a list
          </p>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Single Add
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <AddInfluencerForm />
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <BulkImportForm />
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  )
}
