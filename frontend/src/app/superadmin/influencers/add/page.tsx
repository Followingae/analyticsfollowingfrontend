"use client"

export const dynamic = "force-dynamic"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserPlus, Upload, FileSpreadsheet, ArrowLeft } from "lucide-react"
import { AddInfluencerForm } from "@/components/superadmin/influencer-database/AddInfluencerForm"
import { BulkImportForm } from "@/components/superadmin/influencer-database/BulkImportForm"
import { ExcelImportPanel } from "@/components/superadmin/influencer-database/ExcelImportPanel"
import Link from "next/link"

export default function AddInfluencerPage() {
  return (
    <SuperadminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-1 shrink-0" asChild>
            <Link href="/superadmin/influencers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Add to Master Database</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add individual creators, paste a list, or import from Excel
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="single" className="gap-2 text-sm">
              <UserPlus className="h-3.5 w-3.5" />
              Single Add
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2 text-sm">
              <Upload className="h-3.5 w-3.5" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger value="excel" className="gap-2 text-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <AddInfluencerForm />
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <BulkImportForm />
          </TabsContent>

          <TabsContent value="excel" className="mt-6">
            <ExcelImportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  )
}
