"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Download, Loader2 } from "lucide-react"
import type { ExportFormat, ExportParams } from "@/types/influencerDatabase"

interface ExportInfluencersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  totalCount: number
  onSubmit: (params: ExportParams) => void
}

const FORMAT_OPTIONS: { label: string; value: ExportFormat }[] = [
  { label: "CSV", value: "csv" },
  { label: "JSON", value: "json" },
]

const FIELD_OPTIONS: { label: string; key: keyof ExportParams["fields"] }[] = [
  { label: "Profile Info", key: "profile_info" },
  { label: "Analytics", key: "analytics" },
  { label: "Cost Pricing", key: "cost_pricing" },
  { label: "Sell Pricing", key: "sell_pricing" },
  { label: "Margins", key: "margins" },
  { label: "AI Analysis", key: "ai_analysis" },
  { label: "Internal Notes", key: "internal_notes" },
  { label: "Tags", key: "tags" },
]

export function ExportInfluencersDialog({
  open,
  onOpenChange,
  selectedIds,
  totalCount,
  onSubmit,
}: ExportInfluencersDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [scope, setScope] = useState<ExportParams["scope"]>(
    selectedIds.length > 0 ? "selected" : "all"
  )
  const [fields, setFields] = useState<ExportParams["fields"]>({
    profile_info: true,
    analytics: true,
    cost_pricing: false,
    sell_pricing: true,
    margins: false,
    ai_analysis: false,
    internal_notes: false,
    tags: true,
  })
  const [loading, setLoading] = useState(false)

  function toggleField(key: keyof ExportParams["fields"]) {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSubmit() {
    setLoading(true)
    const params: ExportParams = {
      format,
      fields,
      scope,
      selected_ids: scope === "selected" ? selectedIds : undefined,
    }
    onSubmit(params)
    setTimeout(() => {
      setLoading(false)
      onOpenChange(false)
    }, 500)
  }

  function reset() {
    setFormat("csv")
    setScope(selectedIds.length > 0 ? "selected" : "all")
    setFields({
      profile_info: true,
      analytics: true,
      cost_pricing: false,
      sell_pricing: true,
      margins: false,
      ai_analysis: false,
      internal_notes: false,
      tags: true,
    })
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Influencers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format */}
          <div className="space-y-2">
            <Label className="text-sm">Format</Label>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fields */}
          <div className="space-y-2">
            <Label className="text-sm">Fields to Include</Label>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={fields[opt.key]}
                    onCheckedChange={() => toggleField(opt.key)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Scope */}
          <div className="space-y-2">
            <Label className="text-sm">Scope</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="accent-primary"
                />
                <span className="text-sm">
                  All ({totalCount} influencer{totalCount !== 1 ? "s" : ""})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                  className="accent-primary"
                />
                <span className="text-sm">Current Filtered View</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === "selected"}
                  onChange={() => setScope("selected")}
                  className="accent-primary"
                  disabled={selectedIds.length === 0}
                />
                <span className={`text-sm ${selectedIds.length === 0 ? "text-muted-foreground" : ""}`}>
                  Selected ({selectedIds.length} influencer{selectedIds.length !== 1 ? "s" : ""})
                </span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
