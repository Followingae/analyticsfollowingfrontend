"use client"

export const dynamic = "force-dynamic"

/**
 * Add to the master database — one creator, a pasted list, or a spreadsheet.
 *
 * Presentation only: the three tabs, their forms and every import path are unchanged. The
 * hand-rolled title (a fourth guess at what a page title weighs) becomes the console's own,
 * and the back arrow sits above it as a link rather than beside it as an icon button, so the
 * title starts at the page's left edge like every other title in here.
 */

import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { PageHead } from "@/components/console/primitives"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Upload, FileSpreadsheet, ArrowLeft } from "lucide-react"
import { AddInfluencerForm } from "@/components/superadmin/influencer-database/AddInfluencerForm"
import { BulkImportForm } from "@/components/superadmin/influencer-database/BulkImportForm"
import { ExcelImportPanel } from "@/components/superadmin/influencer-database/ExcelImportPanel"

export default function AddInfluencerPage() {
  return (
    <SuperadminLayout>
      <div className="mx-auto max-w-4xl space-y-ds-5">
        <div>
          <Link
            href="/superadmin/influencers"
            className="mb-ds-3 inline-flex items-center gap-ds-2 text-ds-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Master database
          </Link>
          <PageHead
            title="Add to the master database"
            sub="Add one creator at a time, paste a list of handles, or import a spreadsheet."
          />
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3 h-11">
            <TabsTrigger value="single" className="gap-2 text-sm">
              <UserPlus className="h-3.5 w-3.5" />
              One creator
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2 text-sm">
              <Upload className="h-3.5 w-3.5" />
              Paste a list
            </TabsTrigger>
            <TabsTrigger value="excel" className="gap-2 text-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Import a spreadsheet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-ds-4">
            <AddInfluencerForm />
          </TabsContent>

          <TabsContent value="bulk" className="mt-ds-4">
            <BulkImportForm />
          </TabsContent>

          <TabsContent value="excel" className="mt-ds-4">
            <ExcelImportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  )
}
