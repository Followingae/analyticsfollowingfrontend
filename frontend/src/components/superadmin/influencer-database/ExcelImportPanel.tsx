"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download, Upload, FileSpreadsheet, Loader2, CheckCircle,
  RefreshCw, AlertTriangle, Info, X, Eye, Coins,
} from "lucide-react"
import { ExcelImportReview } from "./ExcelImportReview"
import { useExcelImport } from "./useExcelImport"

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "review", label: "Review" },
  { key: "result", label: "Done" },
] as const

export function ExcelImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const {
    step, file, preview, result, previewing, committing,
    selectFile, downloadTemplate, runPreview, commit, reset, backToUpload,
  } = useExcelImport()

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    // Wide on the review step: the whole point is seeing the deck comfortably.
    <div className={`space-y-4 ${step === "review" ? "max-w-none" : "max-w-2xl"}`}>
      {/* Step indicator */}
      <div className="mb-4 flex items-center justify-center gap-2">
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

      {/* 1: Upload */}
      {step === "upload" && (
        <>
          <Card>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Excel Template</p>
                  <p className="text-xs text-muted-foreground">
                    Only username is required. Analytics populate automatically after import.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={downloadTemplate}>
                  <Download className="h-3.5 w-3.5" />
                  Download .xlsx
                </Button>
              </div>
              <div className="space-y-0.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <p><span className="font-medium">Required:</span> username</p>
                <p><span className="font-medium">Optional:</span> status, tier, categories, tags, internal_notes</p>
                <p>
                  <span className="font-medium">Pricing:</span> cost_reel_aed + sell_reel_aed
                  (and post / story / carousel / video / bundle / monthly if needed), in whole AED
                </p>
                <p className="pt-1 text-[11px]">
                  Columns are matched by header name, so order does not matter — keep row 1 as the header row.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : file
                      ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                      : "border-muted-foreground/20 hover:border-primary/50"
                }`}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const dropped = e.dataTransfer.files[0]
                  if (dropped) selectFile(dropped)
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
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
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {(file.size / 1024).toFixed(0)} KB
                    </Badge>
                    <button
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); reset() }}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Drop an .xlsx file here, or click to browse</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={runPreview} disabled={!file || previewing} className="w-full" size="lg">
            {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            {file ? "Review before importing" : "Select a file to import"}
          </Button>
          {file && (
            <p className="text-center text-xs text-muted-foreground">
              You will see every creator and every price before anything is saved.
            </p>
          )}
        </>
      )}

      {/* 2: Review */}
      {step === "review" && preview && (
        <ExcelImportReview
          rows={preview.rows}
          summary={preview.summary}
          unknownColumns={preview.unknown_columns}
          fileName={file?.name ?? ""}
          committing={committing}
          onCommit={commit}
          onBack={backToUpload}
        />
      )}

      {/* 3: Result */}
      {step === "result" && result && (
        <>
          <Card>
            <CardContent className="space-y-4 pt-5">
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
                {result.analytics_queued > 0 && (
                  <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-950/30">
                    <Loader2 className="mx-auto mb-1 h-4 w-4 text-purple-600" />
                    <div className="text-xl font-bold tabular-nums text-purple-600">{result.analytics_queued}</div>
                    <p className="text-[11px] text-muted-foreground">Analytics Queued</p>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-950/30">
                    <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-red-600" />
                    <div className="text-xl font-bold tabular-nums text-red-600">{result.errors.length}</div>
                    <p className="text-[11px] text-muted-foreground">Errors</p>
                  </div>
                )}
              </div>

              {result.held_inactive_unpriced && result.held_inactive_unpriced.length > 0 && (
                <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.held_inactive_unpriced.length} creator
                    {result.held_inactive_unpriced.length === 1 ? "" : "s"} imported as{" "}
                    <Badge variant="outline" className="mx-0.5 text-[10px]">inactive</Badge>
                    because {result.held_inactive_unpriced.length === 1 ? "it has" : "they have"} no sell price.
                    Set pricing in the database to make {result.held_inactive_unpriced.length === 1 ? "it" : "them"}{" "}
                    selectable in proposals.
                  </AlertDescription>
                </Alert>
              )}

              {result.analytics_queued > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.analytics_queued} creator{result.analytics_queued !== 1 ? "s are" : " is"} being
                    analyzed in the background. Check the database page for real-time progress.
                  </AlertDescription>
                </Alert>
              )}

              {result.analytics_failures?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.analytics_failures.length} creator{result.analytics_failures.length !== 1 ? "s" : ""} failed analytics queueing:
                    {result.analytics_failures.slice(0, 5).map((f) => (
                      <span key={f.username} className="ml-2 block">@{f.username}: {f.reason}</span>
                    ))}
                    {result.analytics_failures.length > 5 && (
                      <span className="ml-2 block">...and {result.analytics_failures.length - 5} more</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {result.queue_status && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      result.queue_status.utilization_percent < 70
                        ? "bg-green-500"
                        : result.queue_status.utilization_percent < 90
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  Queue: {result.queue_status.depth}/{result.queue_status.max_depth} ({result.queue_status.utilization_percent}% utilized)
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <div key={i} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground">Row {e.row}</span>
                      <span className="max-w-[300px] truncate text-xs text-destructive">{e.error}</span>
                    </div>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="py-1 text-center text-xs text-muted-foreground">
                      ...and {result.errors.length - 20} more errors
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={reset}>
            Import Another File
          </Button>
        </>
      )}
    </div>
  )
}
