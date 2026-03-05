"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Plus,
  RefreshCw,
  Loader2,
  Upload,
} from "lucide-react"
import { ExcelImportDialog } from "./ExcelImportDialog"

interface DatabaseHeaderProps {
  totalCount: number
  loading: boolean
  onAddClick: () => void
  onRefresh: () => void
}

export function DatabaseHeader({
  totalCount,
  loading,
  onAddClick,
  onRefresh,
}: DatabaseHeaderProps) {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Influencer Database
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage {totalCount.toLocaleString()} influencer profiles and pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button onClick={() => setImportOpen(true)} variant="outline" size="sm">
            <Upload className="size-4" />
            Import Excel
          </Button>
          <Button onClick={onAddClick} size="sm">
            <Plus className="size-4" />
            Add Influencer
          </Button>
        </div>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={onRefresh}
      />
    </div>
  )
}
