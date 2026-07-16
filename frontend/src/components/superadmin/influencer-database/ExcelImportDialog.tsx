"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Download, Upload, FileSpreadsheet, Loader2, CheckCircle,
  AlertTriangle, RefreshCw, Info, Coins, Eye,
} from "lucide-react"
import { ExcelImportReview } from "./ExcelImportReview"
import { useExcelImport } from "./useExcelImport"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "review", label: "Review" },
  { key: "result", label: "Done" },
] as const

export function ExcelImportDialog({ open, onOpenChange, onImportComplete }: ExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    step, file, preview, result, previewing, committing,
    selectFile, downloadTemplate, runPreview, commit, reset, backToUpload,
  } = useExcelImport(onImportComplete)

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => (next ? onOpenChange(true) : handleClose())}>
      {/* The review step needs room — that is the whole point of it. */}
      <DialogContent className={step === "review" ? "max-w-[92vw] xl:max-w-[1200px]" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>Import Influencers from Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file, review every creator and price, then import.
          </DialogDescription>

          <div className="flex items-center justify-center gap-2 pt-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-8 bg-border" />}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      stepIndex === i
                        ? "bg-primary text-primary-foreground"
                        : stepIndex > i
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepIndex > i ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs ${stepIndex === i ? "font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 1: Upload */}
          {step === "upload" && (
            <>
              <Button variant="link" className="h-auto p-0" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download template (.xlsx)
              </Button>

              <div
                className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) selectFile(f)
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {(file.size / 1024).toFixed(0)} KB
                    </Badge>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select an .xlsx file</p>
                  </>
                )}
              </div>

              <div className="space-y-0.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <p><span className="font-medium">Required:</span> username</p>
                <p><span className="font-medium">Optional:</span> status, tier, categories, tags, internal_notes</p>
                <p>
                  <span className="font-medium">Pricing:</span> cost_reel_aed + sell_reel_aed
                  (plus post / story / carousel / video / bundle / monthly), in whole AED
                </p>
                <p className="pt-1 text-[11px]">Columns are matched by header name — order does not matter.</p>
              </div>
            </>
          )}

          {/* 2: Review */}
          {step === "review" && preview && (
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <ExcelImportReview
                rows={preview.rows}
                summary={preview.summary}
                unknownColumns={preview.unknown_columns}
                fileName={file?.name ?? ""}
                committing={committing}
                onCommit={commit}
                onBack={backToUpload}
              />
            </div>
          )}

          {/* 3: Result */}
          {step === "result" && result && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950/30">
                  <CheckCircle className="mx-auto mb-1 h-4 w-4 text-green-600" />
                  <div className="text-xl font-bold tabular-nums text-green-600">{result.imported}</div>
                  <p className="text-[11px] text-muted-foreground">Imported</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/30">
                  <RefreshCw className="mx-auto mb-1 h-4 w-4 text-blue-600" />
                  <div className="text-xl font-bold tabular-nums text-blue-600">{result.updated}</div>
                  <p className="text-[11px] text-muted-foreground">Updated</p>
                </div>
              </div>

              {result.held_inactive_unpriced && result.held_inactive_unpriced.length > 0 && (
                <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.held_inactive_unpriced.length} creator
                    {result.held_inactive_unpriced.length === 1 ? "" : "s"} imported as{" "}
                    <Badge variant="outline" className="mx-0.5 text-[10px]">inactive</Badge>
                    for having no sell price, and will not appear in the proposal creator picker until priced.
                  </AlertDescription>
                </Alert>
              )}

              {result.analytics_queued > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.analytics_queued} creator{result.analytics_queued !== 1 ? "s are" : " is"} being
                    analyzed in the background.
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.errors.length} row{result.errors.length === 1 ? "" : "s"} failed:
                    {result.errors.slice(0, 5).map((e, i) => (
                      <span key={i} className="ml-2 block">Row {e.row}: {e.error}</span>
                    ))}
                    {result.errors.length > 5 && (
                      <span className="ml-2 block">...and {result.errors.length - 5} more</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={runPreview} disabled={!file || previewing}>
                {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                Review before importing
              </Button>
            </>
          )}
          {step === "review" && (
            <p className="mr-auto text-xs text-muted-foreground">
              Nothing has been saved yet — edit any price above, then import.
            </p>
          )}
          {step === "result" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
